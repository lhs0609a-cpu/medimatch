"""
매물 등록 정기구독 API

- 빌링키 발급 + 첫 결제 + 구독 생성
- 구독 상태 조회 / 취소 / 재활성화
- 결제 이력 조회
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import uuid
import logging

from ..deps import get_db, get_current_active_user
from ...models.user import User
from ...models.payment import Payment, PaymentStatus, PaymentMethod
from ...models.listing_subscription import ListingSubscription, ListingSubStatus
from ...services.toss_payments import toss_payments_service
from ...core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

MONTHLY_AMOUNT = 150_000
PERIOD_DAYS = 30


# ============================================================
# Schemas
# ============================================================

class ActivateRequest(BaseModel):
    auth_key: str
    customer_key: str


class CancelRequest(BaseModel):
    reason: Optional[str] = None


# ============================================================
# Endpoints
# ============================================================

@router.get("/config")
async def get_billing_config(
    current_user: User = Depends(get_current_active_user),
):
    """빌링 인증에 필요한 프론트 설정 반환"""
    billing_client_key = getattr(settings, 'TOSS_BILLING_CLIENT_KEY', '') or settings.TOSS_CLIENT_KEY
    customer_key = f"listing_sub_{current_user.id}"
    base_url = str(settings.FRONTEND_URL).rstrip("/") if hasattr(settings, 'FRONTEND_URL') and settings.FRONTEND_URL else ""

    return {
        "clientKey": billing_client_key,
        "customerKey": customer_key,
        "amount": MONTHLY_AMOUNT,
        "successUrl": f"{base_url}/subscription/listing/success",
        "failUrl": f"{base_url}/subscription/listing/fail",
        "orderName": "매물 등록 구독 (월)",
    }


@router.post("/activate")
async def activate_subscription(
    data: ActivateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    빌링키 발급 + 첫 결제 + 구독 생성

    1. 기존 ACTIVE 구독 확인
    2. authKey → billingKey 발급
    3. 첫 150,000원 결제
    4. 구독 + Payment 레코드 생성
    5. 크레딧 1 부여
    """
    # 기존 활성 구독 확인
    existing = await db.execute(
        select(ListingSubscription).where(
            and_(
                ListingSubscription.user_id == current_user.id,
                ListingSubscription.status.in_([ListingSubStatus.ACTIVE, ListingSubStatus.PAST_DUE])
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="이미 활성 구독이 있습니다.")

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
    now = datetime.utcnow()
    order_id = f"LSUB_{current_user.id}_{now.strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:6]}"

    charge_result = await toss_payments_service.charge_billing_key(
        billing_key=billing_key,
        customer_key=data.customer_key,
        amount=MONTHLY_AMOUNT,
        order_id=order_id,
        order_name="매물 등록 구독 (월)",
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
        product_id="listing_subscription_monthly",
        product_name="매물 등록 구독 (월)",
        amount=MONTHLY_AMOUNT,
        status=PaymentStatus.COMPLETED,
        method=PaymentMethod.CARD,
        card_company=charge_result.get("cardCompany"),
        card_number=charge_result.get("cardNumber"),
        receipt_url=charge_result.get("receipt_url"),
        paid_at=now,
    )
    db.add(payment)
    await db.flush()

    # 4) 기존 EXPIRED/SUSPENDED 구독이 있으면 삭제 후 새로 생성
    old_sub = await db.execute(
        select(ListingSubscription).where(
            ListingSubscription.user_id == current_user.id
        )
    )
    old = old_sub.scalar_one_or_none()
    if old:
        await db.delete(old)
        await db.flush()

    period_start = now
    period_end = now + timedelta(days=PERIOD_DAYS)

    subscription = ListingSubscription(
        user_id=current_user.id,
        billing_key=billing_key,
        customer_key=data.customer_key,
        card_company=charge_result.get("cardCompany") or billing_result.get("cardCompany"),
        card_number=charge_result.get("cardNumber") or billing_result.get("cardNumber"),
        status=ListingSubStatus.ACTIVE,
        current_period_start=period_start,
        current_period_end=period_end,
        next_billing_date=period_end,
        total_credits=1,
        used_credits=0,
        last_payment_id=payment.id,
        monthly_amount=MONTHLY_AMOUNT,
    )
    db.add(subscription)
    await db.flush()

    return {
        "subscription_id": subscription.id,
        "status": subscription.status.value,
        "total_credits": subscription.total_credits,
        "used_credits": subscription.used_credits,
        "remaining_credits": subscription.total_credits - subscription.used_credits,
        "current_period_start": period_start.isoformat(),
        "current_period_end": period_end.isoformat(),
        "next_billing_date": period_end.isoformat(),
        "message": "구독이 활성화되었습니다. 매물 등록 크레딧 1개가 부여되었습니다.",
    }


@router.get("/status")
async def get_subscription_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """현재 구독 상태, 크레딧 잔여, 카드 정보, 다음 결제일"""
    result = await db.execute(
        select(ListingSubscription).where(
            ListingSubscription.user_id == current_user.id
        )
    )
    sub = result.scalar_one_or_none()

    if not sub:
        return {
            "has_subscription": False,
            "status": None,
            "message": "구독 정보가 없습니다.",
        }

    return {
        "has_subscription": True,
        "subscription_id": sub.id,
        "status": sub.status.value,
        "card_company": sub.card_company,
        "card_number": sub.card_number,
        "monthly_amount": sub.monthly_amount,
        "total_credits": sub.total_credits,
        "used_credits": sub.used_credits,
        "remaining_credits": sub.total_credits - sub.used_credits,
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
    """
    자동갱신 취소

    현재 기간 종료까지 구독 유지, 이후 만료 처리
    """
    result = await db.execute(
        select(ListingSubscription).where(
            and_(
                ListingSubscription.user_id == current_user.id,
                ListingSubscription.status == ListingSubStatus.ACTIVE
            )
        )
    )
    sub = result.scalar_one_or_none()

    if not sub:
        raise HTTPException(status_code=404, detail="활성 구독이 없습니다.")

    sub.status = ListingSubStatus.CANCELED
    sub.canceled_at = datetime.utcnow()
    sub.cancel_reason = data.reason
    sub.updated_at = datetime.utcnow()

    return {
        "status": sub.status.value,
        "current_period_end": sub.current_period_end.isoformat(),
        "message": f"구독이 취소되었습니다. {sub.current_period_end.strftime('%Y년 %m월 %d일')}까지 이용 가능합니다.",
    }


@router.post("/reactivate")
async def reactivate_subscription(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    취소한 구독 재활성화

    아직 만료되지 않은 CANCELED 구독만 재활성화 가능
    """
    result = await db.execute(
        select(ListingSubscription).where(
            and_(
                ListingSubscription.user_id == current_user.id,
                ListingSubscription.status == ListingSubStatus.CANCELED
            )
        )
    )
    sub = result.scalar_one_or_none()

    if not sub:
        raise HTTPException(status_code=404, detail="취소된 구독이 없습니다.")

    if sub.current_period_end < datetime.utcnow():
        raise HTTPException(status_code=400, detail="이미 만료된 구독입니다. 새로 구독해주세요.")

    sub.status = ListingSubStatus.ACTIVE
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
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """이 구독의 결제 이력"""
    result = await db.execute(
        select(Payment).where(
            and_(
                Payment.user_id == current_user.id,
                Payment.product_id == "listing_subscription_monthly"
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
