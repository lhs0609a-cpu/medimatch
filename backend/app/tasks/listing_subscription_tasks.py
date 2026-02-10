"""
매물 등록 구독 정기결제 / 만료 태스크

- process_listing_renewals: 매일 06:00 - 빌링키 자동결제
- expire_canceled_subscriptions: 매일 00:00 - 취소 후 만료 처리
"""
import logging
import uuid
from datetime import datetime, timedelta

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from .celery_app import celery_app
from app.core.database import async_session
from app.models.listing_subscription import ListingSubscription, ListingSubStatus
from app.models.landlord import LandlordListing, LandlordListingStatus
from app.models.payment import Payment, PaymentStatus, PaymentMethod
from app.services.toss_payments import toss_payments_service

logger = logging.getLogger(__name__)

MONTHLY_AMOUNT = 150_000
PERIOD_DAYS = 30
MAX_RETRY = 3


async def _close_user_listings(db: AsyncSession, user_id) -> int:
    """유저의 ACTIVE 매물 전부 CLOSED 처리, 변경 건수 반환"""
    result = await db.execute(
        select(LandlordListing).where(
            and_(
                LandlordListing.owner_id == user_id,
                LandlordListing.status == LandlordListingStatus.ACTIVE,
            )
        )
    )
    listings = result.scalars().all()
    count = 0
    for listing in listings:
        listing.status = LandlordListingStatus.CLOSED
        listing.updated_at = datetime.utcnow()
        count += 1
    return count


async def _process_renewals():
    """ACTIVE 구독 중 next_billing_date가 지난 건 자동결제"""
    now = datetime.utcnow()
    async with async_session() as db:
        try:
            result = await db.execute(
                select(ListingSubscription).where(
                    and_(
                        ListingSubscription.status == ListingSubStatus.ACTIVE,
                        ListingSubscription.next_billing_date <= now,
                    )
                )
            )
            subs = result.scalars().all()

            for sub in subs:
                order_id = f"LSUB_{sub.user_id}_{now.strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:6]}"

                charge_result = await toss_payments_service.charge_billing_key(
                    billing_key=sub.billing_key,
                    customer_key=sub.customer_key,
                    amount=sub.monthly_amount,
                    order_id=order_id,
                    order_name="매물 등록 구독 (월) 자동갱신",
                )

                if charge_result.get("success"):
                    # 결제 성공
                    payment = Payment(
                        user_id=sub.user_id,
                        order_id=order_id,
                        payment_key=charge_result.get("paymentKey"),
                        product_id="listing_subscription_monthly",
                        product_name="매물 등록 구독 (월) 자동갱신",
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
                    sub.total_credits += 1
                    sub.retry_count = 0
                    sub.last_payment_id = payment.id
                    sub.updated_at = now

                    logger.info(f"Listing subscription renewed: user={sub.user_id}, credits={sub.total_credits}")
                else:
                    # 결제 실패
                    sub.retry_count += 1
                    sub.last_retry_at = now
                    sub.updated_at = now

                    if sub.retry_count >= MAX_RETRY:
                        sub.status = ListingSubStatus.SUSPENDED
                        closed = await _close_user_listings(db, sub.user_id)
                        logger.warning(
                            f"Listing subscription SUSPENDED: user={sub.user_id}, "
                            f"retries={sub.retry_count}, closed_listings={closed}"
                        )
                    else:
                        sub.status = ListingSubStatus.PAST_DUE
                        sub.next_billing_date = now + timedelta(days=1)
                        logger.warning(
                            f"Listing subscription payment failed, retry scheduled: "
                            f"user={sub.user_id}, retry={sub.retry_count}"
                        )

            await db.commit()
            logger.info(f"Listing renewals processed: {len(subs)} subscriptions checked")

        except Exception as e:
            await db.rollback()
            logger.exception(f"Error processing listing renewals: {e}")
            raise


async def _expire_canceled():
    """CANCELED 상태에서 기간 만료된 구독 → EXPIRED + 매물 CLOSED"""
    now = datetime.utcnow()
    async with async_session() as db:
        try:
            result = await db.execute(
                select(ListingSubscription).where(
                    and_(
                        ListingSubscription.status == ListingSubStatus.CANCELED,
                        ListingSubscription.current_period_end < now,
                    )
                )
            )
            subs = result.scalars().all()

            for sub in subs:
                sub.status = ListingSubStatus.EXPIRED
                sub.updated_at = now
                closed = await _close_user_listings(db, sub.user_id)
                logger.info(
                    f"Listing subscription expired: user={sub.user_id}, closed_listings={closed}"
                )

            await db.commit()
            logger.info(f"Expired canceled subscriptions: {len(subs)} processed")

        except Exception as e:
            await db.rollback()
            logger.exception(f"Error expiring canceled subscriptions: {e}")
            raise


# PAST_DUE 구독도 동일 로직으로 재시도
async def _retry_past_due():
    """PAST_DUE 상태 구독의 next_billing_date가 지난 건 재시도"""
    now = datetime.utcnow()
    async with async_session() as db:
        try:
            result = await db.execute(
                select(ListingSubscription).where(
                    and_(
                        ListingSubscription.status == ListingSubStatus.PAST_DUE,
                        ListingSubscription.next_billing_date <= now,
                    )
                )
            )
            subs = result.scalars().all()

            for sub in subs:
                order_id = f"LSUB_RETRY_{sub.user_id}_{now.strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:6]}"

                charge_result = await toss_payments_service.charge_billing_key(
                    billing_key=sub.billing_key,
                    customer_key=sub.customer_key,
                    amount=sub.monthly_amount,
                    order_id=order_id,
                    order_name="매물 등록 구독 (월) 재시도",
                )

                if charge_result.get("success"):
                    payment = Payment(
                        user_id=sub.user_id,
                        order_id=order_id,
                        payment_key=charge_result.get("paymentKey"),
                        product_id="listing_subscription_monthly",
                        product_name="매물 등록 구독 (월) 재시도",
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

                    sub.status = ListingSubStatus.ACTIVE
                    sub.current_period_start = now
                    sub.current_period_end = now + timedelta(days=PERIOD_DAYS)
                    sub.next_billing_date = now + timedelta(days=PERIOD_DAYS)
                    sub.total_credits += 1
                    sub.retry_count = 0
                    sub.last_payment_id = payment.id
                    sub.updated_at = now

                    logger.info(f"PAST_DUE subscription recovered: user={sub.user_id}")
                else:
                    sub.retry_count += 1
                    sub.last_retry_at = now
                    sub.updated_at = now

                    if sub.retry_count >= MAX_RETRY:
                        sub.status = ListingSubStatus.SUSPENDED
                        closed = await _close_user_listings(db, sub.user_id)
                        logger.warning(
                            f"PAST_DUE subscription SUSPENDED: user={sub.user_id}, closed={closed}"
                        )
                    else:
                        sub.next_billing_date = now + timedelta(days=1)

            await db.commit()
            logger.info(f"PAST_DUE retries processed: {len(subs)}")

        except Exception as e:
            await db.rollback()
            logger.exception(f"Error processing PAST_DUE retries: {e}")
            raise


# ============================================================
# Celery Tasks (sync wrappers for async functions)
# ============================================================

import asyncio


@celery_app.task(name="app.tasks.listing_subscription_tasks.process_listing_renewals")
def process_listing_renewals():
    """매일 오전 6시: ACTIVE 구독 자동갱신 + PAST_DUE 재시도"""
    loop = asyncio.new_event_loop()
    try:
        loop.run_until_complete(_process_renewals())
        loop.run_until_complete(_retry_past_due())
    finally:
        loop.close()


@celery_app.task(name="app.tasks.listing_subscription_tasks.expire_canceled_subscriptions")
def expire_canceled_subscriptions():
    """매일 자정: CANCELED 구독 만료 처리"""
    loop = asyncio.new_event_loop()
    try:
        loop.run_until_complete(_expire_canceled())
    finally:
        loop.close()
