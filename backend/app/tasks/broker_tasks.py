"""
부동산 중개 Celery 태스크

- 우회거래 자동 탐지 (매일 01:00)
- 장기 미활동 딜 알림 (매일 09:00)
- 브로커 성과 캐시 갱신 (매일 05:00)
"""
from datetime import datetime, timedelta
from celery import shared_task
import asyncio
from sqlalchemy import select, func, and_


async def _detect_circumvention():
    """우회거래 패턴 자동 탐지"""
    from app.core.database import async_session_factory
    from app.models.broker import (
        BrokerageDeal, DealStatus, SuspiciousActivity, SuspiciousActivityType,
    )
    from app.models.user import User

    async with async_session_factory() as db:
        now = datetime.utcnow()
        thirty_days_ago = now - timedelta(days=30)

        # Pattern 1: CLOSED_LOST 후 30일 내 동일 매물 CONTRACTED
        closed_lost = await db.execute(
            select(BrokerageDeal).where(
                and_(
                    BrokerageDeal.status == DealStatus.CLOSED_LOST,
                    BrokerageDeal.updated_at >= thirty_days_ago,
                    BrokerageDeal.listing_id.isnot(None),
                )
            )
        )
        for deal in closed_lost.scalars().all():
            contracted = await db.execute(
                select(BrokerageDeal).where(
                    and_(
                        BrokerageDeal.listing_id == deal.listing_id,
                        BrokerageDeal.id != deal.id,
                        BrokerageDeal.status.in_([
                            DealStatus.CONTRACTED, DealStatus.CLOSED_WON
                        ]),
                        BrokerageDeal.updated_at >= deal.updated_at,
                    )
                )
            )
            if contracted.scalar_one_or_none():
                existing = await db.execute(
                    select(SuspiciousActivity).where(
                        and_(
                            SuspiciousActivity.deal_id == deal.id,
                            SuspiciousActivity.activity_type == SuspiciousActivityType.DEAL_CLOSED_THEN_CONTRACTED,
                            SuspiciousActivity.is_resolved == False,
                        )
                    )
                )
                if not existing.scalar_one_or_none():
                    sa = SuspiciousActivity(
                        deal_id=deal.id,
                        doctor_id=deal.doctor_id,
                        broker_id=deal.broker_id,
                        listing_id=deal.listing_id,
                        activity_type=SuspiciousActivityType.DEAL_CLOSED_THEN_CONTRACTED,
                        severity="HIGH",
                        description=f"딜 {deal.deal_number} CLOSED_LOST 후 동일 매물에서 계약 감지",
                    )
                    db.add(sa)

        # Pattern 2: LEAD -> CONTRACTED in < 3 days
        three_days_ago = now - timedelta(days=3)
        rapid = await db.execute(
            select(BrokerageDeal).where(
                and_(
                    BrokerageDeal.status.in_([
                        DealStatus.CONTRACTED, DealStatus.CLOSED_WON
                    ]),
                    BrokerageDeal.updated_at >= three_days_ago,
                )
            )
        )
        for deal in rapid.scalars().all():
            if deal.created_at and deal.updated_at:
                diff = (deal.updated_at - deal.created_at).days
                if diff < 3:
                    existing = await db.execute(
                        select(SuspiciousActivity).where(
                            and_(
                                SuspiciousActivity.deal_id == deal.id,
                                SuspiciousActivity.activity_type == SuspiciousActivityType.RAPID_STATUS_CHANGE,
                                SuspiciousActivity.is_resolved == False,
                            )
                        )
                    )
                    if not existing.scalar_one_or_none():
                        sa = SuspiciousActivity(
                            deal_id=deal.id,
                            broker_id=deal.broker_id,
                            activity_type=SuspiciousActivityType.RAPID_STATUS_CHANGE,
                            severity="MEDIUM",
                            description=f"딜 {deal.deal_number}: LEAD에서 CONTRACTED까지 {diff}일 소요",
                        )
                        db.add(sa)

        # Pattern 3: 의사의 모든 딜 CLOSED_LOST + opening_status=NEGOTIATING
        doctors = await db.execute(
            select(User).where(
                and_(
                    User.is_opening_preparation == True,
                    User.opening_status == "NEGOTIATING",
                )
            )
        )
        for doc in doctors.scalars().all():
            total = await db.execute(
                select(func.count(BrokerageDeal.id)).where(BrokerageDeal.doctor_id == doc.id)
            )
            lost = await db.execute(
                select(func.count(BrokerageDeal.id)).where(
                    and_(
                        BrokerageDeal.doctor_id == doc.id,
                        BrokerageDeal.status == DealStatus.CLOSED_LOST,
                    )
                )
            )
            total_count = total.scalar() or 0
            lost_count = lost.scalar() or 0
            if total_count > 0 and lost_count == total_count:
                existing = await db.execute(
                    select(SuspiciousActivity).where(
                        and_(
                            SuspiciousActivity.doctor_id == doc.id,
                            SuspiciousActivity.activity_type == SuspiciousActivityType.EXTERNAL_CONTRACT_SUSPECTED,
                            SuspiciousActivity.is_resolved == False,
                        )
                    )
                )
                if not existing.scalar_one_or_none():
                    sa = SuspiciousActivity(
                        doctor_id=doc.id,
                        activity_type=SuspiciousActivityType.EXTERNAL_CONTRACT_SUSPECTED,
                        severity="HIGH",
                        description=f"의사 {doc.full_name}: 모든 딜({total_count}건) CLOSED_LOST, 개원상태 NEGOTIATING",
                    )
                    db.add(sa)

        await db.commit()
        print("OK: circumvention detection completed")


async def _refresh_broker_stats():
    """브로커 성과 캐시 갱신"""
    from app.core.database import async_session_factory
    from app.models.broker import (
        Broker, BrokerageDeal, DealStatus, DealCommission,
        BrokerStatus, CommissionType,
    )

    async with async_session_factory() as db:
        brokers = await db.execute(
            select(Broker).where(Broker.status == BrokerStatus.ACTIVE)
        )
        for broker in brokers.scalars().all():
            total = (await db.execute(
                select(func.count(BrokerageDeal.id)).where(BrokerageDeal.broker_id == broker.id)
            )).scalar() or 0

            won = (await db.execute(
                select(func.count(BrokerageDeal.id)).where(
                    and_(
                        BrokerageDeal.broker_id == broker.id,
                        BrokerageDeal.status == DealStatus.CLOSED_WON,
                    )
                )
            )).scalar() or 0

            active_statuses = [
                DealStatus.LEAD, DealStatus.CONTACTED, DealStatus.VIEWING_SCHEDULED,
                DealStatus.VIEWED, DealStatus.NEGOTIATING, DealStatus.CONTRACT_PENDING,
                DealStatus.CONTRACTED,
            ]
            active = (await db.execute(
                select(func.count(BrokerageDeal.id)).where(
                    and_(
                        BrokerageDeal.broker_id == broker.id,
                        BrokerageDeal.status.in_(active_statuses),
                    )
                )
            )).scalar() or 0

            commission = (await db.execute(
                select(func.sum(DealCommission.net_amount))
                .join(BrokerageDeal, DealCommission.deal_id == BrokerageDeal.id)
                .where(
                    and_(
                        BrokerageDeal.broker_id == broker.id,
                        DealCommission.commission_type == CommissionType.BROKER,
                    )
                )
            )).scalar() or 0

            broker.total_deals = total
            broker.closed_won_deals = won
            broker.current_active_deals = active
            broker.total_commission_earned = commission

        await db.commit()
        print("OK: broker stats refresh completed")


@shared_task(name="app.tasks.broker_tasks.detect_circumvention")
def detect_circumvention():
    """우회거래 자동 탐지"""
    asyncio.run(_detect_circumvention())


@shared_task(name="app.tasks.broker_tasks.refresh_broker_stats")
def refresh_broker_stats():
    """브로커 성과 캐시 갱신"""
    asyncio.run(_refresh_broker_stats())
