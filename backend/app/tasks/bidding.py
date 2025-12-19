"""
입찰 관련 Celery 태스크
"""
from celery import shared_task
from typing import Dict, Any
from datetime import datetime, timedelta
import logging
import asyncio

logger = logging.getLogger(__name__)


@shared_task
def expire_old_bids():
    """
    만료된 입찰 처리
    """
    logger.info("Processing expired bids...")

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        result = loop.run_until_complete(_expire_bids_async())
        return result
    finally:
        loop.close()


async def _expire_bids_async():
    """
    만료된 입찰 비동기 처리
    """
    from app.core.database import AsyncSessionLocal
    from sqlalchemy import select, update
    from app.models.pharmacy import PharmacySlot, Bid
    from app.tasks.notifications import send_bid_notification

    async with AsyncSessionLocal() as db:
        try:
            # 마감 기한이 지난 슬롯 조회
            now = datetime.utcnow()
            result = await db.execute(
                select(PharmacySlot).where(
                    PharmacySlot.status == "BIDDING",
                    PharmacySlot.bid_deadline < now
                )
            )
            expired_slots = result.scalars().all()

            processed_count = 0

            for slot in expired_slots:
                # 최고 입찰 조회
                bid_result = await db.execute(
                    select(Bid).where(
                        Bid.slot_id == slot.id,
                        Bid.status == "PENDING"
                    ).order_by(Bid.premium_amount.desc())
                )
                bids = bid_result.scalars().all()

                if bids:
                    # 최고 입찰자 낙찰
                    winner = bids[0]
                    await db.execute(
                        update(Bid)
                        .where(Bid.id == winner.id)
                        .values(status="ACCEPTED")
                    )

                    # 슬롯 상태 업데이트
                    await db.execute(
                        update(PharmacySlot)
                        .where(PharmacySlot.id == slot.id)
                        .values(
                            status="MATCHED",
                            matched_pharmacist_id=winner.user_id,
                            matched_at=now
                        )
                    )

                    # 낙찰 알림
                    send_bid_notification.delay(winner.id, "BID_ACCEPTED")

                    # 나머지 입찰자 유찰 처리
                    for bid in bids[1:]:
                        await db.execute(
                            update(Bid)
                            .where(Bid.id == bid.id)
                            .values(status="REJECTED")
                        )
                        send_bid_notification.delay(bid.id, "BID_REJECTED")

                    logger.info(f"Slot {slot.id} matched to user {winner.user_id}")
                else:
                    # 입찰자 없음 - 슬롯 종료
                    await db.execute(
                        update(PharmacySlot)
                        .where(PharmacySlot.id == slot.id)
                        .values(status="CLOSED")
                    )
                    logger.info(f"Slot {slot.id} closed with no bids")

                processed_count += 1

            await db.commit()

            logger.info(f"Processed {processed_count} expired slots")
            return {"status": "completed", "processed": processed_count}

        except Exception as e:
            logger.error(f"Failed to process expired bids: {e}")
            await db.rollback()
            return {"error": str(e)}


@shared_task
def auto_match_slots():
    """
    자동 매칭 처리 (즉시 매칭 슬롯)
    """
    logger.info("Processing auto-match slots...")

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        result = loop.run_until_complete(_auto_match_async())
        return result
    finally:
        loop.close()


async def _auto_match_async():
    """
    자동 매칭 비동기 처리
    """
    from app.core.database import AsyncSessionLocal
    from sqlalchemy import select, update
    from app.models.pharmacy import PharmacySlot, Bid
    from app.tasks.notifications import send_bid_notification

    async with AsyncSessionLocal() as db:
        try:
            # 희망가 이상 입찰이 들어온 즉시 매칭 슬롯 조회
            result = await db.execute(
                select(PharmacySlot).where(
                    PharmacySlot.status == "BIDDING",
                    PharmacySlot.auto_match == True
                )
            )
            auto_slots = result.scalars().all()

            matched_count = 0

            for slot in auto_slots:
                # 희망가 이상 입찰 조회
                bid_result = await db.execute(
                    select(Bid).where(
                        Bid.slot_id == slot.id,
                        Bid.status == "PENDING",
                        Bid.premium_amount >= slot.asking_premium
                    ).order_by(Bid.created_at.asc())
                )
                qualifying_bids = bid_result.scalars().all()

                if qualifying_bids:
                    # 첫 번째 적합 입찰자 자동 매칭
                    winner = qualifying_bids[0]

                    await db.execute(
                        update(Bid)
                        .where(Bid.id == winner.id)
                        .values(status="ACCEPTED")
                    )

                    await db.execute(
                        update(PharmacySlot)
                        .where(PharmacySlot.id == slot.id)
                        .values(
                            status="MATCHED",
                            matched_pharmacist_id=winner.user_id,
                            matched_at=datetime.utcnow()
                        )
                    )

                    # 낙찰 알림
                    send_bid_notification.delay(winner.id, "BID_ACCEPTED")

                    # 나머지 입찰 거절
                    for bid in qualifying_bids[1:]:
                        await db.execute(
                            update(Bid)
                            .where(Bid.id == bid.id)
                            .values(status="REJECTED")
                        )
                        send_bid_notification.delay(bid.id, "BID_REJECTED")

                    matched_count += 1
                    logger.info(f"Auto-matched slot {slot.id} to user {winner.user_id}")

            await db.commit()

            return {"status": "completed", "matched": matched_count}

        except Exception as e:
            logger.error(f"Failed to process auto-match: {e}")
            await db.rollback()
            return {"error": str(e)}


@shared_task(bind=True, max_retries=3)
def process_bid_placed(self, bid_id: int):
    """
    입찰 등록 후처리
    """
    logger.info(f"Processing bid placed: {bid_id}")

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        result = loop.run_until_complete(_process_bid_placed_async(bid_id))
        return result
    except Exception as e:
        logger.error(f"Failed to process bid: {e}")
        self.retry(exc=e, countdown=60)
    finally:
        loop.close()


async def _process_bid_placed_async(bid_id: int):
    """
    입찰 등록 후처리 비동기
    """
    from app.core.database import AsyncSessionLocal
    from sqlalchemy import select
    from app.models.pharmacy import Bid, PharmacySlot
    from app.tasks.notifications import send_bid_notification, send_push_notification

    async with AsyncSessionLocal() as db:
        try:
            # 입찰 조회
            result = await db.execute(
                select(Bid).where(Bid.id == bid_id)
            )
            bid = result.scalar_one_or_none()

            if not bid:
                return {"error": "Bid not found"}

            # 슬롯 조회
            slot_result = await db.execute(
                select(PharmacySlot).where(PharmacySlot.id == bid.slot_id)
            )
            slot = slot_result.scalar_one_or_none()

            if not slot:
                return {"error": "Slot not found"}

            # 입찰 확인 알림
            send_bid_notification.delay(bid_id, "BID_PLACED")

            # 기존 입찰자들에게 상위 입찰 알림
            other_bids_result = await db.execute(
                select(Bid).where(
                    Bid.slot_id == slot.id,
                    Bid.id != bid_id,
                    Bid.status == "PENDING",
                    Bid.premium_amount < bid.premium_amount
                )
            )
            other_bids = other_bids_result.scalars().all()

            for other_bid in other_bids:
                send_bid_notification.delay(other_bid.id, "OUTBID")

            # 슬롯 소유자(의사)에게 새 입찰 알림
            if slot.doctor_id:
                send_push_notification.delay(
                    slot.doctor_id,
                    "새로운 입찰이 등록되었습니다",
                    f"{slot.address} 슬롯에 {bid.premium_amount:,}원 입찰이 등록되었습니다.",
                    {"slot_id": slot.id, "bid_id": bid_id}
                )

            return {"status": "completed", "bid_id": bid_id}

        except Exception as e:
            logger.error(f"Failed to process bid placed: {e}")
            return {"error": str(e)}


@shared_task
def calculate_slot_statistics():
    """
    슬롯 통계 계산
    """
    logger.info("Calculating slot statistics...")

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        result = loop.run_until_complete(_calculate_stats_async())
        return result
    finally:
        loop.close()


async def _calculate_stats_async():
    """
    슬롯 통계 비동기 계산
    """
    from app.core.database import AsyncSessionLocal
    from sqlalchemy import select, func
    from app.models.pharmacy import PharmacySlot, Bid

    async with AsyncSessionLocal() as db:
        try:
            # 전체 슬롯 수
            total_result = await db.execute(
                select(func.count(PharmacySlot.id))
            )
            total_slots = total_result.scalar() or 0

            # 상태별 슬롯 수
            status_result = await db.execute(
                select(
                    PharmacySlot.status,
                    func.count(PharmacySlot.id)
                ).group_by(PharmacySlot.status)
            )
            status_counts = {row[0]: row[1] for row in status_result}

            # 평균 입찰가
            avg_bid_result = await db.execute(
                select(func.avg(Bid.premium_amount)).where(Bid.status == "ACCEPTED")
            )
            avg_premium = avg_bid_result.scalar() or 0

            # 평균 입찰 수
            avg_bids_result = await db.execute(
                select(func.avg(PharmacySlot.bid_count))
            )
            avg_bid_count = avg_bids_result.scalar() or 0

            stats = {
                "total_slots": total_slots,
                "status_breakdown": status_counts,
                "average_premium": float(avg_premium),
                "average_bid_count": float(avg_bid_count),
                "calculated_at": datetime.utcnow().isoformat(),
            }

            logger.info(f"Slot statistics calculated: {stats}")
            return stats

        except Exception as e:
            logger.error(f"Failed to calculate statistics: {e}")
            return {"error": str(e)}


@shared_task
def cleanup_old_bids():
    """
    오래된 입찰 데이터 정리
    """
    logger.info("Cleaning up old bids...")

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        result = loop.run_until_complete(_cleanup_bids_async())
        return result
    finally:
        loop.close()


async def _cleanup_bids_async():
    """
    오래된 입찰 데이터 정리 비동기
    """
    from app.core.database import AsyncSessionLocal
    from sqlalchemy import delete
    from app.models.pharmacy import Bid

    async with AsyncSessionLocal() as db:
        try:
            # 6개월 이상 된 거절된 입찰 삭제
            cutoff = datetime.utcnow() - timedelta(days=180)

            result = await db.execute(
                delete(Bid).where(
                    Bid.status == "REJECTED",
                    Bid.created_at < cutoff
                )
            )

            deleted_count = result.rowcount
            await db.commit()

            logger.info(f"Cleaned up {deleted_count} old bids")
            return {"status": "completed", "deleted": deleted_count}

        except Exception as e:
            logger.error(f"Failed to cleanup bids: {e}")
            await db.rollback()
            return {"error": str(e)}
