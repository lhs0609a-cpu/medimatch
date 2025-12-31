"""
부동산 매물 수집 관련 Celery 태스크
"""
from celery import shared_task
from typing import Dict, Any, List
from datetime import datetime, timedelta
import logging
import asyncio

logger = logging.getLogger(__name__)


@shared_task
def run_realestate_crawl():
    """
    부동산 매물 수집 실행
    """
    logger.info("=== Real Estate Crawl Started ===")
    start_time = datetime.now()

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        result = loop.run_until_complete(_run_realestate_crawl_async())
        duration = (datetime.now() - start_time).total_seconds()
        logger.info(f"=== Real Estate Crawl Completed in {duration}s ===")
        return {**result, "duration": duration}
    except Exception as e:
        logger.error(f"Real estate crawl failed: {e}")
        return {"status": "failed", "error": str(e)}
    finally:
        loop.close()


async def _run_realestate_crawl_async():
    """부동산 매물 수집 비동기 처리"""
    from app.core.database import AsyncSessionLocal
    from app.services.realestate_crawler import realestate_crawler_service

    # 수도권 주요 지역
    target_regions = [
        ("서울특별시", ["110", "140", "215", "230", "260", "350", "380", "410", "440", "470"]),
        ("경기도", ["111", "113", "117", "131", "136", "171", "173", "175", "177"]),
    ]

    total_collected = 0

    async with AsyncSessionLocal() as db:
        for sido_name, sigungu_codes in target_regions:
            try:
                count = await realestate_crawler_service.collect_listings_for_region(
                    db=db,
                    sido_name=sido_name,
                    sigungu_codes=sigungu_codes,
                    months_back=3
                )
                total_collected += count
                logger.info(f"Collected {count} listings from {sido_name}")

            except Exception as e:
                logger.error(f"Error collecting from {sido_name}: {e}")
                continue

    return {
        "status": "completed",
        "total_collected": total_collected,
    }


@shared_task
def crawl_realestate_by_region(sido_name: str, sigungu_codes: List[str]):
    """
    특정 지역 부동산 매물 수집
    """
    logger.info(f"Crawling real estate for {sido_name}...")

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        result = loop.run_until_complete(
            _crawl_region_async(sido_name, sigungu_codes)
        )
        return result
    except Exception as e:
        logger.error(f"Region crawl failed: {e}")
        return {"status": "failed", "error": str(e)}
    finally:
        loop.close()


async def _crawl_region_async(sido_name: str, sigungu_codes: List[str]):
    """지역별 크롤링 비동기 처리"""
    from app.core.database import AsyncSessionLocal
    from app.services.realestate_crawler import realestate_crawler_service

    async with AsyncSessionLocal() as db:
        count = await realestate_crawler_service.collect_listings_for_region(
            db=db,
            sido_name=sido_name,
            sigungu_codes=sigungu_codes,
            months_back=3
        )

    return {
        "status": "completed",
        "region": sido_name,
        "collected": count
    }


@shared_task
def analyze_listing_suitability(listing_id: str):
    """
    개별 매물 의료 적합성 분석
    """
    logger.info(f"Analyzing listing {listing_id}...")

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        result = loop.run_until_complete(_analyze_listing_async(listing_id))
        return result
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        return {"status": "failed", "error": str(e)}
    finally:
        loop.close()


async def _analyze_listing_async(listing_id: str):
    """매물 분석 비동기 처리"""
    from app.core.database import AsyncSessionLocal
    from app.models.listing import RealEstateListing
    from app.services.realestate_crawler import realestate_crawler_service
    from sqlalchemy import select
    import uuid

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(RealEstateListing).where(
                RealEstateListing.id == uuid.UUID(listing_id)
            )
        )
        listing = result.scalar_one_or_none()

        if not listing:
            return {"status": "error", "message": "Listing not found"}

        listing_data = {
            "address": listing.address,
            "latitude": listing.latitude,
            "longitude": listing.longitude,
            "area_pyeong": listing.area_pyeong,
            "floor": listing.floor,
        }

        suitability = await realestate_crawler_service.analyze_medical_suitability(
            listing_data
        )

        # 분석 결과 업데이트
        listing.suitable_for = suitability.get("suitable_for", [])
        listing.features = suitability.get("features", [])

        await db.commit()

        return {
            "status": "completed",
            "listing_id": listing_id,
            "suitability": suitability
        }


@shared_task
def update_expired_listings():
    """
    만료된 매물 상태 업데이트
    """
    logger.info("Updating expired listings...")

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        result = loop.run_until_complete(_update_expired_async())
        return result
    except Exception as e:
        logger.error(f"Update failed: {e}")
        return {"status": "failed", "error": str(e)}
    finally:
        loop.close()


async def _update_expired_async():
    """만료 매물 업데이트 비동기 처리"""
    from app.core.database import AsyncSessionLocal
    from app.models.listing import RealEstateListing, ListingStatus
    from sqlalchemy import select, update

    async with AsyncSessionLocal() as db:
        # 만료일이 지난 매물 조회
        now = datetime.utcnow()
        result = await db.execute(
            update(RealEstateListing)
            .where(
                RealEstateListing.expires_at < now,
                RealEstateListing.status == ListingStatus.AVAILABLE
            )
            .values(status=ListingStatus.CLOSED)
            .returning(RealEstateListing.id)
        )

        expired_ids = result.scalars().all()
        await db.commit()

        logger.info(f"Marked {len(expired_ids)} listings as expired")

        return {
            "status": "completed",
            "expired_count": len(expired_ids)
        }
