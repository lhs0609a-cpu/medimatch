"""
서비스 구독 정기결제 / 만료 태스크

- process_service_renewals: 매일 06:30 - 빌링키 자동결제
- expire_canceled_service_subscriptions: 매일 00:30 - 취소 후 만료 처리
"""
import logging
import uuid
from datetime import datetime, timedelta

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from .celery_app import celery_app
from app.core.database import async_session
from app.models.service_subscription import ServiceSubscription, ServiceSubStatus, ServiceType
from app.models.payment import Payment, PaymentStatus, PaymentMethod
from app.services.toss_payments import toss_payments_service

logger = logging.getLogger(__name__)

PERIOD_DAYS = 30
MAX_RETRY = 3

SERVICE_NAMES = {
    ServiceType.HOMEPAGE: "홈페이지 제작",
    ServiceType.PROGRAM: "프로그램 개발",
    ServiceType.EMR: "클라우드 EMR",
}


async def _process_renewals():
    """ACTIVE 구독 중 next_billing_date가 지난 건 자동결제"""
    now = datetime.utcnow()
    async with async_session() as db:
        try:
            result = await db.execute(
                select(ServiceSubscription).where(
                    and_(
                        ServiceSubscription.status == ServiceSubStatus.ACTIVE,
                        ServiceSubscription.next_billing_date <= now,
                    )
                )
            )
            subs = result.scalars().all()

            for sub in subs:
                # 무료 구독: 결제 없이 기간만 연장
                if sub.monthly_amount == 0:
                    sub.current_period_start = now
                    sub.current_period_end = now + timedelta(days=PERIOD_DAYS)
                    sub.next_billing_date = now + timedelta(days=PERIOD_DAYS)
                    sub.updated_at = now
                    logger.info(
                        f"Free service subscription renewed: user={sub.user_id}, "
                        f"type={sub.service_type.value}, tier={sub.tier.value}"
                    )
                    continue

                svc_prefix = {"HOMEPAGE": "HPSUB", "PROGRAM": "PGSUB", "EMR": "EMSUB"}.get(sub.service_type.value, "SVSUB")
                order_id = f"{svc_prefix}_{sub.user_id}_{now.strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:6]}"

                service_name = SERVICE_NAMES.get(sub.service_type, sub.service_type.value)
                product_id = f"service_{sub.service_type.value.lower()}_{sub.tier.value.lower()}_monthly"

                charge_result = await toss_payments_service.charge_billing_key(
                    billing_key=sub.billing_key,
                    customer_key=sub.customer_key,
                    amount=sub.monthly_amount,
                    order_id=order_id,
                    order_name=f"{service_name} {sub.tier.value} 구독 (월) 자동갱신",
                )

                if charge_result.get("success"):
                    payment = Payment(
                        user_id=sub.user_id,
                        order_id=order_id,
                        payment_key=charge_result.get("paymentKey"),
                        product_id=product_id,
                        product_name=f"{service_name} {sub.tier.value} 구독 (월) 자동갱신",
                        amount=sub.monthly_amount,
                        status=PaymentStatus.COMPLETED,
                        method=PaymentMethod.CARD,
                        card_company=charge_result.get("cardCompany"),
                        card_number=charge_result.get("cardNumber"),
                        receipt_url=charge_result.get("receipt_url"),
                        paid_at=now,
                    )
                    db.add(payment)
                    await db.flush()

                    sub.current_period_start = now
                    sub.current_period_end = now + timedelta(days=PERIOD_DAYS)
                    sub.next_billing_date = now + timedelta(days=PERIOD_DAYS)
                    sub.retry_count = 0
                    sub.last_payment_id = payment.id
                    sub.updated_at = now

                    logger.info(
                        f"Service subscription renewed: user={sub.user_id}, "
                        f"type={sub.service_type.value}, tier={sub.tier.value}"
                    )
                else:
                    sub.retry_count += 1
                    sub.last_retry_at = now
                    sub.updated_at = now

                    if sub.retry_count >= MAX_RETRY:
                        sub.status = ServiceSubStatus.SUSPENDED
                        logger.warning(
                            f"Service subscription SUSPENDED: user={sub.user_id}, "
                            f"type={sub.service_type.value}, retries={sub.retry_count}"
                        )
                    else:
                        sub.status = ServiceSubStatus.PAST_DUE
                        sub.next_billing_date = now + timedelta(days=1)
                        logger.warning(
                            f"Service subscription payment failed: user={sub.user_id}, "
                            f"type={sub.service_type.value}, retry={sub.retry_count}"
                        )

            await db.commit()
            logger.info(f"Service renewals processed: {len(subs)} subscriptions checked")

        except Exception as e:
            await db.rollback()
            logger.exception(f"Error processing service renewals: {e}")
            raise


async def _expire_canceled():
    """CANCELED 상태에서 기간 만료된 구독 → EXPIRED"""
    now = datetime.utcnow()
    async with async_session() as db:
        try:
            result = await db.execute(
                select(ServiceSubscription).where(
                    and_(
                        ServiceSubscription.status == ServiceSubStatus.CANCELED,
                        ServiceSubscription.current_period_end < now,
                    )
                )
            )
            subs = result.scalars().all()

            for sub in subs:
                sub.status = ServiceSubStatus.EXPIRED
                sub.updated_at = now
                logger.info(
                    f"Service subscription expired: user={sub.user_id}, "
                    f"type={sub.service_type.value}"
                )

            await db.commit()
            logger.info(f"Expired canceled service subscriptions: {len(subs)} processed")

        except Exception as e:
            await db.rollback()
            logger.exception(f"Error expiring canceled service subscriptions: {e}")
            raise


async def _retry_past_due():
    """PAST_DUE 상태 구독의 next_billing_date가 지난 건 재시도"""
    now = datetime.utcnow()
    async with async_session() as db:
        try:
            result = await db.execute(
                select(ServiceSubscription).where(
                    and_(
                        ServiceSubscription.status == ServiceSubStatus.PAST_DUE,
                        ServiceSubscription.next_billing_date <= now,
                    )
                )
            )
            subs = result.scalars().all()

            for sub in subs:
                svc_prefix = {"HOMEPAGE": "HPSUB", "PROGRAM": "PGSUB", "EMR": "EMSUB"}.get(sub.service_type.value, "SVSUB")
                order_id = f"{svc_prefix}_RETRY_{sub.user_id}_{now.strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:6]}"

                service_name = SERVICE_NAMES.get(sub.service_type, sub.service_type.value)
                product_id = f"service_{sub.service_type.value.lower()}_{sub.tier.value.lower()}_monthly"

                charge_result = await toss_payments_service.charge_billing_key(
                    billing_key=sub.billing_key,
                    customer_key=sub.customer_key,
                    amount=sub.monthly_amount,
                    order_id=order_id,
                    order_name=f"{service_name} {sub.tier.value} 구독 (월) 재시도",
                )

                if charge_result.get("success"):
                    payment = Payment(
                        user_id=sub.user_id,
                        order_id=order_id,
                        payment_key=charge_result.get("paymentKey"),
                        product_id=product_id,
                        product_name=f"{service_name} {sub.tier.value} 구독 (월) 재시도",
                        amount=sub.monthly_amount,
                        status=PaymentStatus.COMPLETED,
                        method=PaymentMethod.CARD,
                        card_company=charge_result.get("cardCompany"),
                        card_number=charge_result.get("cardNumber"),
                        receipt_url=charge_result.get("receipt_url"),
                        paid_at=now,
                    )
                    db.add(payment)
                    await db.flush()

                    sub.status = ServiceSubStatus.ACTIVE
                    sub.current_period_start = now
                    sub.current_period_end = now + timedelta(days=PERIOD_DAYS)
                    sub.next_billing_date = now + timedelta(days=PERIOD_DAYS)
                    sub.retry_count = 0
                    sub.last_payment_id = payment.id
                    sub.updated_at = now

                    logger.info(f"PAST_DUE service subscription recovered: user={sub.user_id}")
                else:
                    sub.retry_count += 1
                    sub.last_retry_at = now
                    sub.updated_at = now

                    if sub.retry_count >= MAX_RETRY:
                        sub.status = ServiceSubStatus.SUSPENDED
                        logger.warning(
                            f"PAST_DUE service subscription SUSPENDED: user={sub.user_id}"
                        )
                    else:
                        sub.next_billing_date = now + timedelta(days=1)

            await db.commit()
            logger.info(f"PAST_DUE service retries processed: {len(subs)}")

        except Exception as e:
            await db.rollback()
            logger.exception(f"Error processing PAST_DUE service retries: {e}")
            raise


# ============================================================
# Celery Tasks (sync wrappers for async functions)
# ============================================================

import asyncio


@celery_app.task(name="app.tasks.service_subscription_tasks.process_service_renewals")
def process_service_renewals():
    """매일 오전 6:30: 서비스 구독 자동갱신 + PAST_DUE 재시도"""
    loop = asyncio.new_event_loop()
    try:
        loop.run_until_complete(_process_renewals())
        loop.run_until_complete(_retry_past_due())
    finally:
        loop.close()


@celery_app.task(name="app.tasks.service_subscription_tasks.expire_canceled_service_subscriptions")
def expire_canceled_service_subscriptions():
    """매일 00:30: CANCELED 서비스 구독 만료 처리"""
    loop = asyncio.new_event_loop()
    try:
        loop.run_until_complete(_expire_canceled())
    finally:
        loop.close()
