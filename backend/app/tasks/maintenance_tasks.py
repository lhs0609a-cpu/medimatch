"""
관리유지비 정기결제 태스크

- process_maintenance_renewals: 매일 07:00 - ACTIVE 자동갱신 + PAST_DUE 재시도
- expire_canceled_maintenance: 매일 01:00 - CANCELED 기간만료 → EXPIRED
- send_maintenance_setup_reminders: 매일 09:00 - PENDING_SETUP 리마인더
"""
import logging
import uuid
import asyncio
from datetime import datetime, timedelta

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from .celery_app import celery_app
from app.core.database import async_session
from app.models.maintenance import (
    MaintenanceContract, MaintenanceStatus, MaintenanceServiceType,
)
from app.models.payment import Payment, PaymentStatus, PaymentMethod
from app.services.toss_payments import toss_payments_service
from app.services.email import (
    send_payment_success, send_payment_failed, send_service_suspended,
    send_payment_reminder,
)
from app.core.config import settings

logger = logging.getLogger(__name__)

PERIOD_DAYS = 30
MAX_RETRY = 3

SERVICE_NAMES = {
    MaintenanceServiceType.HOMEPAGE: "홈페이지",
    MaintenanceServiceType.PROGRAM: "프로그램",
}


async def _process_maintenance_renewals():
    """ACTIVE 계약 중 next_billing_date ≤ now 자동결제"""
    now = datetime.utcnow()
    async with async_session() as db:
        try:
            result = await db.execute(
                select(MaintenanceContract).where(
                    and_(
                        MaintenanceContract.status == MaintenanceStatus.ACTIVE,
                        MaintenanceContract.next_billing_date <= now,
                        MaintenanceContract.billing_key.isnot(None),
                    )
                )
            )
            contracts = result.scalars().all()

            for c in contracts:
                order_id = f"MAINT_{c.id}_{now.strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:6]}"
                svc_name = SERVICE_NAMES.get(c.service_type, "관리유지비")
                order_name = f"{c.project_name} {svc_name} 관리유지비 (월) 자동갱신"
                product_id = f"maintenance_{c.service_type.value.lower()}_{c.id}"

                charge_result = await toss_payments_service.charge_billing_key(
                    billing_key=c.billing_key,
                    customer_key=c.customer_key,
                    amount=c.monthly_amount,
                    order_id=order_id,
                    order_name=order_name,
                )

                if charge_result.get("success"):
                    payment = Payment(
                        user_id=c.user_id,
                        order_id=order_id,
                        payment_key=charge_result.get("paymentKey"),
                        product_id=product_id,
                        product_name=order_name,
                        amount=c.monthly_amount,
                        status=PaymentStatus.COMPLETED,
                        method=PaymentMethod.CARD,
                        card_company=charge_result.get("cardCompany"),
                        card_number=charge_result.get("cardNumber"),
                        receipt_url=charge_result.get("receipt_url"),
                        paid_at=now,
                    )
                    db.add(payment)
                    await db.flush()

                    c.current_period_start = now
                    c.current_period_end = now + timedelta(days=PERIOD_DAYS)
                    c.next_billing_date = now + timedelta(days=PERIOD_DAYS)
                    c.retry_count = 0
                    c.total_paid += c.monthly_amount
                    c.total_months += 1
                    c.last_payment_id = payment.id
                    c.updated_at = now

                    logger.info(f"Maintenance renewal success: contract={c.id}")

                    # 성공 이메일
                    if c.contact_email:
                        try:
                            await send_payment_success(
                                to_email=c.contact_email,
                                contact_person=c.contact_person or "고객",
                                project_name=c.project_name,
                                amount=c.monthly_amount,
                                card_number=c.card_number or "",
                                next_billing_date=c.next_billing_date.strftime("%Y년 %m월 %d일"),
                            )
                        except Exception:
                            pass
                else:
                    c.retry_count += 1
                    c.last_retry_at = now
                    c.updated_at = now

                    if c.retry_count >= MAX_RETRY:
                        c.status = MaintenanceStatus.SUSPENDED
                        logger.warning(f"Maintenance SUSPENDED: contract={c.id}")
                        if c.contact_email:
                            try:
                                await send_service_suspended(
                                    to_email=c.contact_email,
                                    contact_person=c.contact_person or "고객",
                                    project_name=c.project_name,
                                )
                            except Exception:
                                pass
                    else:
                        c.status = MaintenanceStatus.PAST_DUE
                        c.next_billing_date = now + timedelta(days=1)
                        logger.warning(f"Maintenance payment failed: contract={c.id}, retry={c.retry_count}")
                        if c.contact_email:
                            try:
                                await send_payment_failed(
                                    to_email=c.contact_email,
                                    contact_person=c.contact_person or "고객",
                                    project_name=c.project_name,
                                    amount=c.monthly_amount,
                                    retry_count=c.retry_count,
                                    max_retry=MAX_RETRY,
                                )
                            except Exception:
                                pass

            await db.commit()
            logger.info(f"Maintenance renewals processed: {len(contracts)} contracts")

        except Exception as e:
            await db.rollback()
            logger.exception(f"Error processing maintenance renewals: {e}")
            raise


async def _retry_past_due_maintenance():
    """PAST_DUE 재시도"""
    now = datetime.utcnow()
    async with async_session() as db:
        try:
            result = await db.execute(
                select(MaintenanceContract).where(
                    and_(
                        MaintenanceContract.status == MaintenanceStatus.PAST_DUE,
                        MaintenanceContract.next_billing_date <= now,
                        MaintenanceContract.billing_key.isnot(None),
                    )
                )
            )
            contracts = result.scalars().all()

            for c in contracts:
                order_id = f"MAINT_RETRY_{c.id}_{now.strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:6]}"
                svc_name = SERVICE_NAMES.get(c.service_type, "관리유지비")
                order_name = f"{c.project_name} {svc_name} 관리유지비 (월) 재시도"
                product_id = f"maintenance_{c.service_type.value.lower()}_{c.id}"

                charge_result = await toss_payments_service.charge_billing_key(
                    billing_key=c.billing_key,
                    customer_key=c.customer_key,
                    amount=c.monthly_amount,
                    order_id=order_id,
                    order_name=order_name,
                )

                if charge_result.get("success"):
                    payment = Payment(
                        user_id=c.user_id,
                        order_id=order_id,
                        payment_key=charge_result.get("paymentKey"),
                        product_id=product_id,
                        product_name=order_name,
                        amount=c.monthly_amount,
                        status=PaymentStatus.COMPLETED,
                        method=PaymentMethod.CARD,
                        card_company=charge_result.get("cardCompany"),
                        card_number=charge_result.get("cardNumber"),
                        receipt_url=charge_result.get("receipt_url"),
                        paid_at=now,
                    )
                    db.add(payment)
                    await db.flush()

                    c.status = MaintenanceStatus.ACTIVE
                    c.current_period_start = now
                    c.current_period_end = now + timedelta(days=PERIOD_DAYS)
                    c.next_billing_date = now + timedelta(days=PERIOD_DAYS)
                    c.retry_count = 0
                    c.total_paid += c.monthly_amount
                    c.total_months += 1
                    c.last_payment_id = payment.id
                    c.updated_at = now

                    logger.info(f"PAST_DUE maintenance recovered: contract={c.id}")
                else:
                    c.retry_count += 1
                    c.last_retry_at = now
                    c.updated_at = now

                    if c.retry_count >= MAX_RETRY:
                        c.status = MaintenanceStatus.SUSPENDED
                        logger.warning(f"PAST_DUE maintenance SUSPENDED: contract={c.id}")
                        if c.contact_email:
                            try:
                                await send_service_suspended(
                                    to_email=c.contact_email,
                                    contact_person=c.contact_person or "고객",
                                    project_name=c.project_name,
                                )
                            except Exception:
                                pass
                    else:
                        c.next_billing_date = now + timedelta(days=1)

            await db.commit()
            logger.info(f"PAST_DUE maintenance retries: {len(contracts)}")

        except Exception as e:
            await db.rollback()
            logger.exception(f"Error retrying PAST_DUE maintenance: {e}")
            raise


async def _expire_canceled_maintenance():
    """CANCELED + current_period_end < now → EXPIRED"""
    now = datetime.utcnow()
    async with async_session() as db:
        try:
            result = await db.execute(
                select(MaintenanceContract).where(
                    and_(
                        MaintenanceContract.status == MaintenanceStatus.CANCELED,
                        MaintenanceContract.current_period_end < now,
                    )
                )
            )
            contracts = result.scalars().all()

            for c in contracts:
                c.status = MaintenanceStatus.EXPIRED
                c.updated_at = now
                logger.info(f"Maintenance expired: contract={c.id}")

            await db.commit()
            logger.info(f"Expired canceled maintenance: {len(contracts)}")

        except Exception as e:
            await db.rollback()
            logger.exception(f"Error expiring canceled maintenance: {e}")
            raise


async def _send_setup_reminders():
    """PENDING_SETUP 3일/7일 경과 시 리마인더"""
    now = datetime.utcnow()
    async with async_session() as db:
        try:
            result = await db.execute(
                select(MaintenanceContract).where(
                    and_(
                        MaintenanceContract.status == MaintenanceStatus.PENDING_SETUP,
                        MaintenanceContract.contact_email.isnot(None),
                    )
                )
            )
            contracts = result.scalars().all()

            base_url = str(settings.FRONTEND_URL).rstrip("/")

            for c in contracts:
                if not c.created_at:
                    continue
                days_since = (now - c.created_at).days
                if days_since in (3, 7):
                    setup_url = f"{base_url}/my/maintenance?setup={c.id}"
                    try:
                        await send_payment_reminder(
                            to_email=c.contact_email,
                            contact_person=c.contact_person or "고객",
                            project_name=c.project_name,
                            setup_url=setup_url,
                            days_since=days_since,
                        )
                        logger.info(f"Setup reminder sent: contract={c.id}, days={days_since}")
                    except Exception:
                        pass

            await db.commit()

        except Exception as e:
            await db.rollback()
            logger.exception(f"Error sending setup reminders: {e}")
            raise


# ============================================================
# Celery Tasks (sync wrappers)
# ============================================================

@celery_app.task(name="app.tasks.maintenance_tasks.process_maintenance_renewals")
def process_maintenance_renewals():
    """매일 07:00: 관리유지비 자동갱신 + PAST_DUE 재시도"""
    loop = asyncio.new_event_loop()
    try:
        loop.run_until_complete(_process_maintenance_renewals())
        loop.run_until_complete(_retry_past_due_maintenance())
    finally:
        loop.close()


@celery_app.task(name="app.tasks.maintenance_tasks.expire_canceled_maintenance")
def expire_canceled_maintenance():
    """매일 01:00: CANCELED → EXPIRED"""
    loop = asyncio.new_event_loop()
    try:
        loop.run_until_complete(_expire_canceled_maintenance())
    finally:
        loop.close()


@celery_app.task(name="app.tasks.maintenance_tasks.send_maintenance_setup_reminders")
def send_maintenance_setup_reminders():
    """매일 09:00: PENDING_SETUP 리마인더"""
    loop = asyncio.new_event_loop()
    try:
        loop.run_until_complete(_send_setup_reminders())
    finally:
        loop.close()
