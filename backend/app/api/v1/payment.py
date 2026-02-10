"""
토스 페이먼츠 결제 API
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
import httpx
import base64
import uuid
import os
import hmac
import hashlib
import logging

logger = logging.getLogger(__name__)

from app.core.database import get_db
from app.models.payment import Payment, Subscription, UsageCredit, PaymentStatus, PaymentMethod
from app.models.user import User
from app.api.deps import get_current_active_user

router = APIRouter(prefix="/payments", tags=["payments"])

# 토스 페이먼츠 설정
TOSS_CLIENT_KEY = os.getenv("TOSS_CLIENT_KEY", "")
TOSS_SECRET_KEY = os.getenv("TOSS_SECRET_KEY", "")
TOSS_WEBHOOK_SECRET = os.getenv("TOSS_WEBHOOK_SECRET", "")  # 프로덕션에서 반드시 설정 필요
TOSS_API_URL = "https://api.tosspayments.com/v1"


def verify_webhook_signature(secret: str, payload: bytes, signature: str) -> bool:
    """
    토스페이먼츠 웹훅 서명 검증
    - secret: TOSS_WEBHOOK_SECRET
    - payload: request body (raw bytes)
    - signature: Toss-Signature 헤더 값
    """
    if not secret:
        logger.error("TOSS_WEBHOOK_SECRET이 설정되지 않음 - 웹훅 검증 불가")
        return False

    if not signature:
        logger.error("웹훅 서명 헤더 없음")
        return False

    try:
        expected_signature = hmac.new(
            secret.encode('utf-8'),
            payload,
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(expected_signature, signature)
    except Exception as e:
        logger.error(f"웹훅 서명 검증 실패: {e}")
        return False


# ============ Schemas ============

class PaymentPrepare(BaseModel):
    product_id: str  # basic_monthly, pro_monthly, basic_yearly, pro_yearly, report_single
    product_name: str
    amount: int


class PaymentPrepareResponse(BaseModel):
    order_id: str
    amount: int
    product_id: str
    product_name: str


class PaymentConfirm(BaseModel):
    payment_key: str
    order_id: str
    amount: int


class PaymentResponse(BaseModel):
    id: int
    order_id: str
    payment_key: Optional[str] = None
    amount: int
    status: str
    product_id: str
    product_name: str
    method: Optional[str] = None
    receipt_url: Optional[str] = None
    paid_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SubscriptionResponse(BaseModel):
    id: int
    plan: str
    status: str
    started_at: datetime
    expires_at: datetime
    is_auto_renew: bool

    class Config:
        from_attributes = True


class CreditResponse(BaseModel):
    credit_type: str
    total_credits: int
    used_credits: int
    remaining_credits: int


# ============ 상품 정보 ============

PRODUCTS = {
    "basic_monthly": {
        "name": "Basic 월간 구독",
        "amount": 29000,
        "plan": "basic",
        "months": 1,
        "credits": 5,  # 리포트 5회
    },
    "basic_yearly": {
        "name": "Basic 연간 구독",
        "amount": 290000,
        "plan": "basic",
        "months": 12,
        "credits": 60,
    },
    "pro_monthly": {
        "name": "Professional 월간 구독",
        "amount": 79000,
        "plan": "pro",
        "months": 1,
        "credits": 20,
    },
    "pro_yearly": {
        "name": "Professional 연간 구독",
        "amount": 790000,
        "plan": "pro",
        "months": 12,
        "credits": 240,
    },
    "enterprise_monthly": {
        "name": "Enterprise 월간 구독",
        "amount": 199000,
        "plan": "enterprise",
        "months": 1,
        "credits": -1,  # 무제한
    },
    "report_single": {
        "name": "리포트 단건 구매",
        "amount": 9900,
        "credits": 1,
    },
    "report_5pack": {
        "name": "리포트 5회권",
        "amount": 39000,
        "credits": 5,
    },
    "report_10pack": {
        "name": "리포트 10회권",
        "amount": 69000,
        "credits": 10,
    },
}


# ============ Endpoints ============

@router.get("/products")
async def get_products():
    """상품 목록 조회"""
    return PRODUCTS


@router.post("/prepare", response_model=PaymentPrepareResponse)
async def prepare_payment(
    data: PaymentPrepare,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """결제 준비 (주문 ID 생성)"""
    # 상품 확인
    if data.product_id not in PRODUCTS:
        raise HTTPException(status_code=400, detail="유효하지 않은 상품입니다")

    product = PRODUCTS[data.product_id]
    if data.amount != product["amount"]:
        raise HTTPException(status_code=400, detail="금액이 일치하지 않습니다")

    # 주문 ID 생성
    order_id = f"ORDER_{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:8].upper()}"

    # 결제 레코드 생성
    payment = Payment(
        user_id=current_user.id,
        order_id=order_id,
        product_id=data.product_id,
        product_name=data.product_name,
        amount=data.amount,
        status=PaymentStatus.PENDING,
    )
    db.add(payment)
    await db.commit()

    return PaymentPrepareResponse(
        order_id=order_id,
        amount=data.amount,
        product_id=data.product_id,
        product_name=data.product_name,
    )


@router.post("/confirm", response_model=PaymentResponse)
async def confirm_payment(
    data: PaymentConfirm,
    db: AsyncSession = Depends(get_db)
):
    """결제 승인 (토스 페이먼츠 API 호출)"""
    # 결제 레코드 조회
    result = await db.execute(
        select(Payment).where(Payment.order_id == data.order_id)
    )
    payment = result.scalar_one_or_none()

    if not payment:
        raise HTTPException(status_code=404, detail="결제 정보를 찾을 수 없습니다")

    if payment.amount != data.amount:
        raise HTTPException(status_code=400, detail="결제 금액이 일치하지 않습니다")

    # 토스 페이먼츠 API 호출
    try:
        auth_header = base64.b64encode(f"{TOSS_SECRET_KEY}:".encode()).decode()

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{TOSS_API_URL}/payments/confirm",
                headers={
                    "Authorization": f"Basic {auth_header}",
                    "Content-Type": "application/json",
                },
                json={
                    "paymentKey": data.payment_key,
                    "orderId": data.order_id,
                    "amount": data.amount,
                },
                timeout=30.0,
            )

        if response.status_code == 200:
            toss_data = response.json()

            # 결제 성공 처리
            payment.payment_key = data.payment_key
            payment.status = PaymentStatus.COMPLETED
            payment.paid_at = datetime.utcnow()
            payment.method = PaymentMethod(toss_data.get("method", "CARD"))
            payment.receipt_url = toss_data.get("receipt", {}).get("url")

            if toss_data.get("card"):
                payment.card_company = toss_data["card"].get("company")
                payment.card_number = toss_data["card"].get("number")

            # 구독 또는 크레딧 처리
            await process_payment_success(db, payment)

            await db.commit()
            await db.refresh(payment)

            return PaymentResponse.model_validate(payment)
        else:
            error_data = response.json()
            payment.status = PaymentStatus.FAILED
            payment.cancel_reason = error_data.get("message", "결제 실패")
            await db.commit()

            raise HTTPException(
                status_code=400,
                detail=error_data.get("message", "결제 처리 중 오류가 발생했습니다")
            )

    except httpx.RequestError as e:
        payment.status = PaymentStatus.FAILED
        payment.cancel_reason = str(e)
        await db.commit()
        raise HTTPException(status_code=500, detail="결제 서버 연결 오류")


async def process_payment_success(db: AsyncSession, payment: Payment):
    """결제 성공 후 처리"""
    product = PRODUCTS.get(payment.product_id)
    if not product:
        return

    # 구독 상품인 경우
    if "plan" in product:
        months = product.get("months", 1)
        expires_at = datetime.utcnow() + timedelta(days=30 * months)

        # 기존 구독 확인
        result = await db.execute(
            select(Subscription).where(Subscription.user_id == payment.user_id)
        )
        subscription = result.scalar_one_or_none()

        if subscription:
            # 기존 구독 연장
            if subscription.expires_at > datetime.utcnow():
                subscription.expires_at = subscription.expires_at + timedelta(days=30 * months)
            else:
                subscription.expires_at = expires_at
            subscription.plan = product["plan"]
            subscription.status = "ACTIVE"
            subscription.last_payment_id = payment.id
        else:
            # 새 구독 생성
            subscription = Subscription(
                user_id=payment.user_id,
                plan=product["plan"],
                product_id=payment.product_id,
                status="ACTIVE",
                started_at=datetime.utcnow(),
                expires_at=expires_at,
                last_payment_id=payment.id,
            )
            db.add(subscription)

    # 크레딧 추가
    if "credits" in product and product["credits"] != 0:
        result = await db.execute(
            select(UsageCredit).where(
                UsageCredit.user_id == payment.user_id,
                UsageCredit.credit_type == "simulation_report"
            )
        )
        credit = result.scalar_one_or_none()

        if credit:
            if product["credits"] == -1:
                credit.total_credits = -1  # 무제한
            else:
                credit.total_credits += product["credits"]
        else:
            credit = UsageCredit(
                user_id=payment.user_id,
                credit_type="simulation_report",
                total_credits=product["credits"],
                used_credits=0,
            )
            db.add(credit)


@router.post("/cancel/{order_id}")
async def cancel_payment(
    order_id: str,
    cancel_reason: str = "사용자 요청",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """결제 취소"""
    result = await db.execute(
        select(Payment).where(
            Payment.order_id == order_id,
            Payment.user_id == current_user.id
        )
    )
    payment = result.scalar_one_or_none()

    if not payment:
        raise HTTPException(status_code=404, detail="결제 정보를 찾을 수 없습니다")

    if payment.status != PaymentStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="취소할 수 없는 결제 상태입니다")

    # 토스 페이먼츠 취소 API 호출
    try:
        auth_header = base64.b64encode(f"{TOSS_SECRET_KEY}:".encode()).decode()

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{TOSS_API_URL}/payments/{payment.payment_key}/cancel",
                headers={
                    "Authorization": f"Basic {auth_header}",
                    "Content-Type": "application/json",
                },
                json={"cancelReason": cancel_reason},
                timeout=30.0,
            )

        if response.status_code == 200:
            payment.status = PaymentStatus.CANCELED
            payment.cancel_reason = cancel_reason
            payment.canceled_at = datetime.utcnow()
            payment.cancel_amount = payment.amount
            await db.commit()

            return {"message": "결제가 취소되었습니다"}
        else:
            error_data = response.json()
            raise HTTPException(
                status_code=400,
                detail=error_data.get("message", "취소 처리 중 오류가 발생했습니다")
            )

    except httpx.RequestError:
        raise HTTPException(status_code=500, detail="결제 서버 연결 오류")


@router.get("/history", response_model=list[PaymentResponse])
async def get_payment_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """결제 내역 조회"""
    result = await db.execute(
        select(Payment)
        .where(Payment.user_id == current_user.id)
        .order_by(Payment.created_at.desc())
    )
    payments = result.scalars().all()

    return [PaymentResponse.model_validate(p) for p in payments]


@router.get("/subscription", response_model=Optional[SubscriptionResponse])
async def get_subscription(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """현재 구독 상태 조회"""
    result = await db.execute(
        select(Subscription).where(Subscription.user_id == current_user.id)
    )
    subscription = result.scalar_one_or_none()

    if not subscription:
        return None

    # 만료 확인
    if subscription.expires_at < datetime.utcnow():
        subscription.status = "EXPIRED"
        await db.commit()

    return SubscriptionResponse.model_validate(subscription)


@router.get("/credits", response_model=CreditResponse)
async def get_credits(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """크레딧 잔액 조회"""
    result = await db.execute(
        select(UsageCredit).where(
            UsageCredit.user_id == current_user.id,
            UsageCredit.credit_type == "simulation_report"
        )
    )
    credit = result.scalar_one_or_none()

    if not credit:
        return CreditResponse(
            credit_type="simulation_report",
            total_credits=0,
            used_credits=0,
            remaining_credits=0,
        )

    remaining = -1 if credit.total_credits == -1 else credit.total_credits - credit.used_credits

    return CreditResponse(
        credit_type=credit.credit_type,
        total_credits=credit.total_credits,
        used_credits=credit.used_credits,
        remaining_credits=remaining,
    )


# ============ 토스 페이먼츠 웹훅 ============

@router.post("/webhook")
async def toss_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """토스 페이먼츠 웹훅 처리 (서명 검증 포함)"""
    try:
        # 1. Raw body 읽기 (서명 검증용)
        body = await request.body()

        # 2. 서명 검증
        signature = request.headers.get("Toss-Signature", "")
        if not verify_webhook_signature(TOSS_WEBHOOK_SECRET, body, signature):
            logger.warning(f"웹훅 서명 검증 실패 - IP: {request.client.host}")
            raise HTTPException(status_code=401, detail="Invalid webhook signature")

        # 3. JSON 파싱
        import json
        data = json.loads(body)
        event_type = data.get("eventType")
        payment_key = data.get("data", {}).get("paymentKey")

        logger.info(f"웹훅 수신: event={event_type}, payment_key={payment_key}")

        if event_type == "PAYMENT_STATUS_CHANGED":
            status = data.get("data", {}).get("status")

            result = await db.execute(
                select(Payment).where(Payment.payment_key == payment_key)
            )
            payment = result.scalar_one_or_none()

            if payment:
                if status == "DONE":
                    payment.status = PaymentStatus.COMPLETED
                elif status == "CANCELED":
                    payment.status = PaymentStatus.CANCELED
                elif status == "PARTIAL_CANCELED":
                    payment.status = PaymentStatus.REFUNDED

                await db.commit()
                logger.info(f"결제 상태 업데이트: {payment_key} -> {status}")
            else:
                logger.warning(f"결제 정보 없음: {payment_key}")

        return {"status": "ok"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"웹훅 처리 오류: {e}")
        return {"status": "error", "message": str(e)}
