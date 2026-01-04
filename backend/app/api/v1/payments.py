"""
결제 API 라우트
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.payment import Payment, PaymentStatus, PaymentMethod, Subscription, UsageCredit
from app.services.payment import payment_service, get_product_info, generate_order_id, PRODUCTS

router = APIRouter()


class PaymentCreateRequest(BaseModel):
    product_id: str
    success_url: str
    fail_url: str


class PaymentConfirmRequest(BaseModel):
    payment_key: str
    order_id: str
    amount: int


class PaymentCancelRequest(BaseModel):
    payment_key: str
    cancel_reason: str
    cancel_amount: Optional[int] = None


@router.get("/products")
async def get_products():
    """결제 상품 목록 조회"""
    return {"products": PRODUCTS}


@router.post("/create")
async def create_payment(
    request: PaymentCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """결제 요청 생성"""
    # 상품 정보 확인
    product = get_product_info(request.product_id)
    if not product:
        raise HTTPException(status_code=400, detail="유효하지 않은 상품입니다.")

    # 주문 ID 생성
    order_id = generate_order_id(current_user.id, request.product_id)

    # 결제 기록 생성
    payment = Payment(
        user_id=current_user.id,
        order_id=order_id,
        product_id=request.product_id,
        product_name=product["name"],
        amount=product["price"],
        status=PaymentStatus.PENDING,
    )
    db.add(payment)
    await db.commit()

    # 결제 요청 정보 반환
    payment_data = await payment_service.create_payment(
        order_id=order_id,
        amount=product["price"],
        order_name=product["name"],
        customer_name=current_user.name,
        customer_email=current_user.email,
        success_url=request.success_url,
        fail_url=request.fail_url,
    )

    return {
        "payment_id": payment.id,
        "order_id": order_id,
        "amount": product["price"],
        "payment_data": payment_data,
    }


@router.post("/confirm")
async def confirm_payment(
    request: PaymentConfirmRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """결제 승인"""
    # 결제 기록 조회
    result = await db.execute(
        select(Payment).where(
            Payment.order_id == request.order_id,
            Payment.user_id == current_user.id
        )
    )
    payment = result.scalar_one_or_none()

    if not payment:
        raise HTTPException(status_code=404, detail="결제 정보를 찾을 수 없습니다.")

    if payment.status != PaymentStatus.PENDING:
        raise HTTPException(status_code=400, detail="이미 처리된 결제입니다.")

    # 금액 검증
    if payment.amount != request.amount:
        raise HTTPException(status_code=400, detail="결제 금액이 일치하지 않습니다.")

    # 토스페이먼츠 결제 승인
    confirm_result = await payment_service.confirm_payment(
        payment_key=request.payment_key,
        order_id=request.order_id,
        amount=request.amount,
    )

    if confirm_result.get("success") == False:
        # 결제 실패
        await db.execute(
            update(Payment)
            .where(Payment.id == payment.id)
            .values(status=PaymentStatus.FAILED)
        )
        await db.commit()
        raise HTTPException(status_code=400, detail=confirm_result.get("error", "결제 승인 실패"))

    # 결제 성공 - 기록 업데이트
    method = confirm_result.get("method", "CARD")
    card_info = confirm_result.get("card", {})

    await db.execute(
        update(Payment)
        .where(Payment.id == payment.id)
        .values(
            status=PaymentStatus.COMPLETED,
            payment_key=request.payment_key,
            method=PaymentMethod[method] if method in PaymentMethod.__members__ else PaymentMethod.CARD,
            card_company=card_info.get("company"),
            card_number=card_info.get("number"),
            receipt_url=confirm_result.get("receipt", {}).get("url"),
            paid_at=datetime.utcnow(),
        )
    )

    # 상품 종류에 따른 후처리
    await process_payment_completion(db, payment, current_user.id)

    await db.commit()

    return {
        "success": True,
        "payment_id": payment.id,
        "message": "결제가 완료되었습니다.",
    }


async def process_payment_completion(db: AsyncSession, payment: Payment, user_id: int):
    """결제 완료 후처리"""
    product_id = payment.product_id

    if product_id == "simulation_report":
        # 시뮬레이션 리포트 크레딧 추가
        result = await db.execute(
            select(UsageCredit).where(
                UsageCredit.user_id == user_id,
                UsageCredit.credit_type == "simulation_report"
            )
        )
        credit = result.scalar_one_or_none()

        if credit:
            credit.total_credits += 1
        else:
            credit = UsageCredit(
                user_id=user_id,
                credit_type="simulation_report",
                total_credits=1,
                used_credits=0,
            )
            db.add(credit)

    elif product_id in ["sales_scanner_monthly", "sales_scanner_yearly"]:
        # 구독 생성/갱신
        is_yearly = product_id == "sales_scanner_yearly"
        duration = timedelta(days=365 if is_yearly else 30)

        result = await db.execute(
            select(Subscription).where(
                Subscription.user_id == user_id,
                Subscription.product_id.in_(["sales_scanner_monthly", "sales_scanner_yearly"])
            )
        )
        subscription = result.scalar_one_or_none()

        now = datetime.utcnow()

        if subscription:
            # 기존 구독 연장
            new_expires = max(subscription.expires_at, now) + duration
            subscription.expires_at = new_expires
            subscription.status = "ACTIVE"
            subscription.last_payment_id = payment.id
        else:
            # 새 구독 생성
            subscription = Subscription(
                user_id=user_id,
                plan="yearly" if is_yearly else "monthly",
                product_id=product_id,
                status="ACTIVE",
                started_at=now,
                expires_at=now + duration,
                last_payment_id=payment.id,
            )
            db.add(subscription)


@router.post("/cancel")
async def cancel_payment(
    request: PaymentCancelRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """결제 취소"""
    # 결제 기록 조회
    result = await db.execute(
        select(Payment).where(
            Payment.payment_key == request.payment_key,
            Payment.user_id == current_user.id
        )
    )
    payment = result.scalar_one_or_none()

    if not payment:
        raise HTTPException(status_code=404, detail="결제 정보를 찾을 수 없습니다.")

    if payment.status != PaymentStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="취소할 수 없는 결제 상태입니다.")

    # 토스페이먼츠 결제 취소
    cancel_result = await payment_service.cancel_payment(
        payment_key=request.payment_key,
        cancel_reason=request.cancel_reason,
        cancel_amount=request.cancel_amount,
    )

    if cancel_result.get("success") == False:
        raise HTTPException(status_code=400, detail=cancel_result.get("error", "결제 취소 실패"))

    # 결제 기록 업데이트
    is_full_cancel = request.cancel_amount is None or request.cancel_amount == payment.amount

    await db.execute(
        update(Payment)
        .where(Payment.id == payment.id)
        .values(
            status=PaymentStatus.CANCELED if is_full_cancel else PaymentStatus.REFUNDED,
            cancel_reason=request.cancel_reason,
            cancel_amount=request.cancel_amount or payment.amount,
            canceled_at=datetime.utcnow(),
        )
    )
    await db.commit()

    return {
        "success": True,
        "message": "결제가 취소되었습니다.",
    }


@router.get("/history")
async def get_payment_history(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """결제 내역 조회"""
    result = await db.execute(
        select(Payment)
        .where(Payment.user_id == current_user.id)
        .order_by(Payment.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    payments = result.scalars().all()

    return {
        "payments": [
            {
                "id": p.id,
                "order_id": p.order_id,
                "product_name": p.product_name,
                "amount": p.amount,
                "status": p.status,
                "method": p.method,
                "paid_at": p.paid_at,
                "created_at": p.created_at,
            }
            for p in payments
        ]
    }


@router.get("/subscription")
async def get_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """구독 정보 조회"""
    result = await db.execute(
        select(Subscription)
        .where(
            Subscription.user_id == current_user.id,
            Subscription.status == "ACTIVE"
        )
    )
    subscription = result.scalar_one_or_none()

    if not subscription:
        return {"subscription": None, "is_active": False}

    # 만료 여부 확인
    is_expired = subscription.expires_at < datetime.utcnow()

    return {
        "subscription": {
            "id": subscription.id,
            "plan": subscription.plan,
            "status": "EXPIRED" if is_expired else subscription.status,
            "started_at": subscription.started_at,
            "expires_at": subscription.expires_at,
            "is_auto_renew": subscription.is_auto_renew,
        },
        "is_active": not is_expired,
    }


@router.get("/credits")
async def get_credits(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """크레딧 잔액 조회"""
    result = await db.execute(
        select(UsageCredit).where(UsageCredit.user_id == current_user.id)
    )
    credits = result.scalars().all()

    return {
        "credits": {
            c.credit_type: {
                "total": c.total_credits,
                "used": c.used_credits,
                "remaining": c.total_credits - c.used_credits,
            }
            for c in credits
        }
    }


def verify_webhook_signature(payload: bytes, signature: str, secret_key: str) -> bool:
    import hmac, hashlib, base64
    expected = base64.b64encode(hmac.new(secret_key.encode(), payload, hashlib.sha256).digest()).decode()
    return hmac.compare_digest(signature, expected)


@router.post("/webhook")
async def payment_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """토스페이먼츠 웹훅 처리"""
    import os, json, logging
    logger = logging.getLogger(__name__)
    
    signature = request.headers.get("Toss-Signature", "")
    secret_key = os.getenv("TOSS_SECRET_KEY", "")
    payload = await request.body()
    
    if signature and secret_key and not verify_webhook_signature(payload, signature, secret_key):
        logger.warning("Invalid webhook signature")
        return {"status": "error", "message": "Invalid signature"}

    try:
        body = json.loads(payload)
        event_type = body.get("eventType")
        data = body.get("data", {})

        if event_type == "PAYMENT_STATUS_CHANGED":
            payment_key = data.get("paymentKey")
            payment_status = data.get("status")
            result = await db.execute(select(Payment).where(Payment.payment_key == payment_key))
            payment = result.scalar_one_or_none()
            if payment:
                new_status = {"DONE": PaymentStatus.COMPLETED, "CANCELED": PaymentStatus.CANCELED, "PARTIAL_CANCELED": PaymentStatus.REFUNDED}.get(payment_status)
                if new_status:
                    payment.status = new_status
                    await db.commit()
                    logger.info(f"Payment {payment_key} updated to {new_status}")

        return {"status": "ok"}
    except json.JSONDecodeError:
        return {"status": "error", "message": "Invalid JSON"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error", "message": "Internal error"}
