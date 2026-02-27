"""
서비스 정기구독 API (홈페이지 제작 / 프로그램 개발)

- 빌링키 발급 + 첫 결제 + 구독 생성
- 구독 상태 조회 / 취소 / 재활성화
- 결제 이력 조회
- 비로그인 상담 신청 (리드 캡처)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timedelta
import uuid
import logging

from ..deps import get_db, get_current_active_user
from ...models.user import User
from ...models.payment import Payment, PaymentStatus, PaymentMethod
from ...models.service_subscription import (
    ServiceSubscription, ServiceType, ServiceTier, ServiceSubStatus,
    SERVICE_PRICING, get_service_price
)
from ...services.toss_payments import toss_payments_service
from ...core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

PERIOD_DAYS = 30

# 서비스 타입별 한국어 이름
SERVICE_NAMES = {
    ServiceType.HOMEPAGE: "홈페이지 제작",
    ServiceType.PROGRAM: "프로그램 개발",
    ServiceType.EMR: "클라우드 EMR",
}

TIER_NAMES = {
    ServiceTier.STARTER: "STARTER",
    ServiceTier.GROWTH: "GROWTH",
    ServiceTier.PREMIUM: "PREMIUM",
    ServiceTier.STANDARD: "STANDARD",
}


# ============================================================
# Schemas
# ============================================================

class ActivateRequest(BaseModel):
    auth_key: Optional[str] = None      # 무료 티어는 불필요
    customer_key: Optional[str] = None   # 무료 티어는 불필요
    service_type: ServiceType
    tier: ServiceTier
    company_name: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None


class CancelRequest(BaseModel):
    service_type: ServiceType
    reason: Optional[str] = None


class InquiryRequest(BaseModel):
    """비로그인 상담 신청"""
    service_type: ServiceType
    company_name: str = Field(..., min_length=1, max_length=200)
    contact_person: str = Field(..., min_length=1, max_length=100)
    contact_phone: str = Field(..., min_length=1, max_length=20)
    message: Optional[str] = Field(None, max_length=2000)
    preferred_tier: Optional[ServiceTier] = None


# ============================================================
# Endpoints
# ============================================================

@router.get("/config")
async def get_billing_config(
    service_type: ServiceType,
    tier: ServiceTier,
    current_user: User = Depends(get_current_active_user),
):
    """빌링 인증에 필요한 프론트 설정 반환 (무료 티어는 free=true 반환)"""
    amount = get_service_price(service_type, tier)

    # 무료 티어: 결제 불필요
    if amount == 0:
        return {
            "free": True,
            "amount": 0,
            "clientKey": None,
            "customerKey": None,
            "successUrl": None,
            "failUrl": None,
            "orderName": f"{SERVICE_NAMES.get(service_type, service_type.value)} {TIER_NAMES.get(tier, tier.value)} 무료 구독",
        }

    billing_client_key = getattr(settings, 'TOSS_BILLING_CLIENT_KEY', '') or settings.TOSS_CLIENT_KEY
    customer_key = f"svc_{service_type.value.lower()}_{current_user.id}"
    base_url = str(settings.FRONTEND_URL).rstrip("/") if hasattr(settings, 'FRONTEND_URL') and settings.FRONTEND_URL else ""

    service_name = SERVICE_NAMES.get(service_type, service_type.value)
    tier_name = TIER_NAMES.get(tier, tier.value)

    return {
        "clientKey": billing_client_key,
        "customerKey": customer_key,
        "amount": amount,
        "successUrl": f"{base_url}/subscription/{service_type.value.lower()}/success?tier={tier.value}",
        "failUrl": f"{base_url}/subscription/{service_type.value.lower()}/fail",
        "orderName": f"{service_name} {tier_name} 구독 (월)",
    }


@router.post("/activate")
async def activate_subscription(
    data: ActivateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    빌링키 발급 + 첫 결제 + 구독 생성
    무료 티어(amount=0)는 결제 없이 바로 활성화

    1. 기존 ACTIVE 구독 확인
    2. 무료 → 바로 구독 생성 / 유료 → 빌링키 + 결제 + 구독 생성
    """
    amount = get_service_price(data.service_type, data.tier)

    # 기존 활성 구독 확인
    existing = await db.execute(
        select(ServiceSubscription).where(
            and_(
                ServiceSubscription.user_id == current_user.id,
                ServiceSubscription.service_type == data.service_type,
                ServiceSubscription.status.in_([ServiceSubStatus.ACTIVE, ServiceSubStatus.PAST_DUE])
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="이미 활성 구독이 있습니다.")

    now = datetime.utcnow()
    service_name = SERVICE_NAMES.get(data.service_type, data.service_type.value)
    tier_name = TIER_NAMES.get(data.tier, data.tier.value)

    # 기존 EXPIRED/SUSPENDED 구독 삭제
    old_sub = await db.execute(
        select(ServiceSubscription).where(
            and_(
                ServiceSubscription.user_id == current_user.id,
                ServiceSubscription.service_type == data.service_type,
            )
        )
    )
    old = old_sub.scalar_one_or_none()
    if old:
        await db.delete(old)
        await db.flush()

    period_start = now
    period_end = now + timedelta(days=PERIOD_DAYS)

    # ── 무료 티어: 결제 없이 바로 활성화 ──
    if amount == 0:
        customer_key = f"svc_{data.service_type.value.lower()}_{current_user.id}"
        subscription = ServiceSubscription(
            user_id=current_user.id,
            service_type=data.service_type,
            tier=data.tier,
            billing_key="FREE_TIER",
            customer_key=customer_key,
            card_company=None,
            card_number=None,
            status=ServiceSubStatus.ACTIVE,
            current_period_start=period_start,
            current_period_end=period_end,
            next_billing_date=period_end,
            monthly_amount=0,
            company_name=data.company_name,
            contact_person=data.contact_person,
            contact_phone=data.contact_phone,
        )
        db.add(subscription)
        await db.flush()

        return {
            "subscription_id": subscription.id,
            "service_type": subscription.service_type.value,
            "tier": subscription.tier.value,
            "status": subscription.status.value,
            "monthly_amount": 0,
            "current_period_start": period_start.isoformat(),
            "current_period_end": period_end.isoformat(),
            "next_billing_date": period_end.isoformat(),
            "message": f"{service_name} {tier_name} 무료 구독이 활성화되었습니다.",
        }

    # ── 유료 티어: 빌링키 + 결제 ──
    if not data.auth_key or not data.customer_key:
        raise HTTPException(status_code=400, detail="유료 구독은 결제 정보가 필요합니다.")

    # 1) 빌링키 발급
    billing_result = await toss_payments_service.issue_billing_key(
        auth_key=data.auth_key,
        customer_key=data.customer_key,
    )
    if not billing_result.get("success"):
        raise HTTPException(
            status_code=400,
            detail=billing_result.get("error_message", "빌링키 발급에 실패했습니다.")
        )

    billing_key = billing_result["billingKey"]

    # 2) 첫 결제
    svc_prefix_map = {ServiceType.HOMEPAGE: "HPSUB", ServiceType.PROGRAM: "PGSUB", ServiceType.EMR: "EMSUB"}
    svc_prefix = svc_prefix_map.get(data.service_type, "SVSUB")
    order_id = f"{svc_prefix}_{current_user.id}_{now.strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:6]}"

    order_name = f"{service_name} {tier_name} 구독 (월)"
    product_id = f"service_{data.service_type.value.lower()}_{data.tier.value.lower()}_monthly"

    charge_result = await toss_payments_service.charge_billing_key(
        billing_key=billing_key,
        customer_key=data.customer_key,
        amount=amount,
        order_id=order_id,
        order_name=order_name,
    )
    if not charge_result.get("success"):
        raise HTTPException(
            status_code=400,
            detail=charge_result.get("error_message", "첫 결제에 실패했습니다.")
        )

    # 3) Payment 레코드
    payment = Payment(
        user_id=current_user.id,
        order_id=order_id,
        payment_key=charge_result.get("paymentKey"),
        product_id=product_id,
        product_name=order_name,
        amount=amount,
        status=PaymentStatus.COMPLETED,
        method=PaymentMethod.CARD,
        card_company=charge_result.get("cardCompany"),
        card_number=charge_result.get("cardNumber"),
        receipt_url=charge_result.get("receipt_url"),
        paid_at=now,
    )
    db.add(payment)
    await db.flush()

    # 4) 구독 생성
    subscription = ServiceSubscription(
        user_id=current_user.id,
        service_type=data.service_type,
        tier=data.tier,
        billing_key=billing_key,
        customer_key=data.customer_key,
        card_company=charge_result.get("cardCompany") or billing_result.get("cardCompany"),
        card_number=charge_result.get("cardNumber") or billing_result.get("cardNumber"),
        status=ServiceSubStatus.ACTIVE,
        current_period_start=period_start,
        current_period_end=period_end,
        next_billing_date=period_end,
        monthly_amount=amount,
        last_payment_id=payment.id,
        company_name=data.company_name,
        contact_person=data.contact_person,
        contact_phone=data.contact_phone,
    )
    db.add(subscription)
    await db.flush()

    return {
        "subscription_id": subscription.id,
        "service_type": subscription.service_type.value,
        "tier": subscription.tier.value,
        "status": subscription.status.value,
        "monthly_amount": amount,
        "current_period_start": period_start.isoformat(),
        "current_period_end": period_end.isoformat(),
        "next_billing_date": period_end.isoformat(),
        "message": f"{service_name} {tier_name} 구독이 활성화되었습니다.",
    }


@router.get("/status")
async def get_subscription_status(
    service_type: ServiceType,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """현재 구독 상태, 카드 정보, 다음 결제일"""
    result = await db.execute(
        select(ServiceSubscription).where(
            and_(
                ServiceSubscription.user_id == current_user.id,
                ServiceSubscription.service_type == service_type,
            )
        )
    )
    sub = result.scalar_one_or_none()

    if not sub:
        return {
            "has_subscription": False,
            "service_type": service_type.value,
            "status": None,
            "message": "구독 정보가 없습니다.",
        }

    return {
        "has_subscription": True,
        "subscription_id": sub.id,
        "service_type": sub.service_type.value,
        "tier": sub.tier.value,
        "status": sub.status.value,
        "card_company": sub.card_company,
        "card_number": sub.card_number,
        "monthly_amount": sub.monthly_amount,
        "company_name": sub.company_name,
        "current_period_start": sub.current_period_start.isoformat() if sub.current_period_start else None,
        "current_period_end": sub.current_period_end.isoformat() if sub.current_period_end else None,
        "next_billing_date": sub.next_billing_date.isoformat() if sub.next_billing_date else None,
        "canceled_at": sub.canceled_at.isoformat() if sub.canceled_at else None,
        "created_at": sub.created_at.isoformat() if sub.created_at else None,
    }


@router.post("/cancel")
async def cancel_subscription(
    data: CancelRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """자동갱신 취소 — 현재 기간 종료까지 구독 유지, 이후 만료"""
    result = await db.execute(
        select(ServiceSubscription).where(
            and_(
                ServiceSubscription.user_id == current_user.id,
                ServiceSubscription.service_type == data.service_type,
                ServiceSubscription.status == ServiceSubStatus.ACTIVE,
            )
        )
    )
    sub = result.scalar_one_or_none()

    if not sub:
        raise HTTPException(status_code=404, detail="활성 구독이 없습니다.")

    sub.status = ServiceSubStatus.CANCELED
    sub.canceled_at = datetime.utcnow()
    sub.cancel_reason = data.reason
    sub.updated_at = datetime.utcnow()

    service_name = SERVICE_NAMES.get(sub.service_type, sub.service_type.value)
    return {
        "status": sub.status.value,
        "current_period_end": sub.current_period_end.isoformat(),
        "message": f"{service_name} 구독이 취소되었습니다. {sub.current_period_end.strftime('%Y년 %m월 %d일')}까지 이용 가능합니다.",
    }


@router.post("/reactivate")
async def reactivate_subscription(
    service_type: ServiceType,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """취소한 구독 재활성화 — 아직 만료되지 않은 CANCELED만"""
    result = await db.execute(
        select(ServiceSubscription).where(
            and_(
                ServiceSubscription.user_id == current_user.id,
                ServiceSubscription.service_type == service_type,
                ServiceSubscription.status == ServiceSubStatus.CANCELED,
            )
        )
    )
    sub = result.scalar_one_or_none()

    if not sub:
        raise HTTPException(status_code=404, detail="취소된 구독이 없습니다.")

    if sub.current_period_end < datetime.utcnow():
        raise HTTPException(status_code=400, detail="이미 만료된 구독입니다. 새로 구독해주세요.")

    sub.status = ServiceSubStatus.ACTIVE
    sub.canceled_at = None
    sub.cancel_reason = None
    sub.updated_at = datetime.utcnow()

    return {
        "status": sub.status.value,
        "next_billing_date": sub.next_billing_date.isoformat(),
        "message": "구독이 재활성화되었습니다.",
    }


@router.get("/billing-history")
async def get_billing_history(
    service_type: ServiceType,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """이 구독의 결제 이력"""
    # product_id 패턴으로 필터
    product_prefix = f"service_{service_type.value.lower()}_"

    result = await db.execute(
        select(Payment).where(
            and_(
                Payment.user_id == current_user.id,
                Payment.product_id.like(f"{product_prefix}%"),
            )
        ).order_by(Payment.created_at.desc())
    )
    payments = result.scalars().all()

    return {
        "items": [
            {
                "id": p.id,
                "order_id": p.order_id,
                "amount": p.amount,
                "status": p.status.value,
                "card_company": p.card_company,
                "card_number": p.card_number,
                "paid_at": p.paid_at.isoformat() if p.paid_at else None,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in payments
        ],
        "total": len(payments),
    }


@router.post("/inquiry")
async def submit_inquiry(data: InquiryRequest):
    """비로그인 상담 신청 (리드 캡처)"""
    inquiry_id = f"SVC-{data.service_type.value[:2]}-{datetime.now().strftime('%Y%m%d%H%M%S')}"

    logger.info(
        f"서비스 상담 신청: {inquiry_id} | type={data.service_type.value} | "
        f"company={data.company_name} | contact={data.contact_person} | "
        f"phone={data.contact_phone} | tier={data.preferred_tier}"
    )

    service_name = SERVICE_NAMES.get(data.service_type, data.service_type.value)
    return {
        "status": "success",
        "inquiry_id": inquiry_id,
        "message": f"{service_name} 상담 신청이 접수되었습니다. 24시간 내에 연락드리겠습니다.",
    }
