"""
약국 타겟팅 관련 Celery 태스크
"""
from celery import shared_task
from typing import Dict, Any, List
from datetime import datetime, timedelta
import logging
import asyncio

logger = logging.getLogger(__name__)


@shared_task
def run_pharmacy_prospect_scan():
    """
    전국 약국 타겟팅 스캔 실행
    """
    logger.info("=== Pharmacy Prospect Scan Started ===")
    start_time = datetime.now()

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        result = loop.run_until_complete(_run_prospect_scan_async())
        duration = (datetime.now() - start_time).total_seconds()
        logger.info(f"=== Pharmacy Prospect Scan Completed in {duration}s ===")
        return {**result, "duration": duration}
    except Exception as e:
        logger.error(f"Prospect scan failed: {e}")
        return {"status": "failed", "error": str(e)}
    finally:
        loop.close()


async def _run_prospect_scan_async():
    """약국 타겟팅 스캔 비동기 처리"""
    from app.core.database import AsyncSessionLocal
    from app.services.pharmacy_prospect import pharmacy_prospect_service

    # 주요 타겟 지역 (수도권 우선)
    target_regions = ["서울", "경기", "인천"]

    all_prospects = []

    for region in target_regions:
        try:
            prospects = await pharmacy_prospect_service.collect_prospects_for_region(
                sido_name=region,
                min_score=50  # 50점 이상만
            )
            all_prospects.extend(prospects)
            logger.info(f"Found {len(prospects)} prospects in {region}")

        except Exception as e:
            logger.error(f"Error scanning {region}: {e}")
            continue

    # DB에 저장
    saved_count = await _save_prospects_to_db(all_prospects)

    return {
        "status": "completed",
        "total_scanned": len(all_prospects),
        "saved": saved_count,
        "hot_count": len([p for p in all_prospects if p.prospect_score >= 80]),
        "warm_count": len([p for p in all_prospects if 60 <= p.prospect_score < 80]),
    }


async def _save_prospects_to_db(prospects: List):
    """타겟 약국을 DB에 저장"""
    from app.core.database import AsyncSessionLocal
    from sqlalchemy import select, text
    from datetime import datetime
    import json

    # PharmacyProspectTarget 테이블이 있다고 가정
    # 없으면 JSON 파일로 임시 저장

    saved_count = 0

    try:
        async with AsyncSessionLocal() as db:
            # 기존 prospect_targets 테이블에 upsert
            for prospect in prospects:
                await db.execute(
                    text("""
                        INSERT INTO pharmacy_prospect_targets
                        (ykiho, name, address, phone, latitude, longitude,
                         years_operated, est_pharmacist_age, monthly_revenue,
                         nearby_hospital_count, nearby_pharmacy_count,
                         prospect_score, prospect_grade, score_factors,
                         contact_status, updated_at)
                        VALUES (:ykiho, :name, :address, :phone, :latitude, :longitude,
                                :years_operated, :est_pharmacist_age, :monthly_revenue,
                                :nearby_hospital_count, :nearby_pharmacy_count,
                                :prospect_score, :prospect_grade, :score_factors,
                                :contact_status, :updated_at)
                        ON CONFLICT (ykiho) DO UPDATE SET
                            monthly_revenue = EXCLUDED.monthly_revenue,
                            prospect_score = EXCLUDED.prospect_score,
                            prospect_grade = EXCLUDED.prospect_grade,
                            score_factors = EXCLUDED.score_factors,
                            updated_at = EXCLUDED.updated_at
                    """),
                    {
                        "ykiho": prospect.ykiho,
                        "name": prospect.name,
                        "address": prospect.address,
                        "phone": prospect.phone,
                        "latitude": prospect.latitude,
                        "longitude": prospect.longitude,
                        "years_operated": prospect.years_operated,
                        "est_pharmacist_age": prospect.est_pharmacist_age,
                        "monthly_revenue": prospect.monthly_revenue,
                        "nearby_hospital_count": prospect.nearby_hospital_count,
                        "nearby_pharmacy_count": prospect.nearby_pharmacy_count,
                        "prospect_score": prospect.prospect_score,
                        "prospect_grade": prospect.prospect_grade.value,
                        "score_factors": json.dumps(prospect.score_factors, ensure_ascii=False),
                        "contact_status": prospect.contact_status,
                        "updated_at": datetime.utcnow(),
                    }
                )
                saved_count += 1

            await db.commit()

    except Exception as e:
        logger.warning(f"DB save failed, using file storage: {e}")
        # 파일로 임시 저장
        import json
        from pathlib import Path
        from app.services.pharmacy_prospect import pharmacy_prospect_service

        output_dir = Path("data/prospects")
        output_dir.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = output_dir / f"pharmacy_prospects_{timestamp}.json"

        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(
                [pharmacy_prospect_service.to_dict(p) for p in prospects],
                f,
                ensure_ascii=False,
                indent=2
            )

        saved_count = len(prospects)
        logger.info(f"Saved {saved_count} prospects to {output_file}")

    return saved_count


@shared_task
def scan_region_prospects(sido_name: str, min_score: int = 50):
    """
    특정 지역 약국 타겟팅 스캔
    """
    logger.info(f"Scanning prospects in {sido_name}...")

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        result = loop.run_until_complete(
            _scan_region_async(sido_name, min_score)
        )
        return result
    except Exception as e:
        logger.error(f"Region scan failed: {e}")
        return {"status": "failed", "error": str(e)}
    finally:
        loop.close()


async def _scan_region_async(sido_name: str, min_score: int):
    """지역별 스캔 비동기 처리"""
    from app.services.pharmacy_prospect import pharmacy_prospect_service

    prospects = await pharmacy_prospect_service.collect_prospects_for_region(
        sido_name=sido_name,
        min_score=min_score
    )

    saved_count = await _save_prospects_to_db(prospects)

    return {
        "status": "completed",
        "region": sido_name,
        "total": len(prospects),
        "saved": saved_count
    }


@shared_task
def get_hot_prospects_for_campaign(limit: int = 100):
    """
    HOT 등급 타겟 조회 (캠페인용)
    """
    logger.info("Getting HOT prospects for campaign...")

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        result = loop.run_until_complete(_get_hot_prospects_async(limit))
        return result
    except Exception as e:
        logger.error(f"Get HOT prospects failed: {e}")
        return {"status": "failed", "error": str(e)}
    finally:
        loop.close()


async def _get_hot_prospects_async(limit: int):
    """HOT 타겟 조회 비동기 처리"""
    from app.core.database import AsyncSessionLocal
    from sqlalchemy import select, text

    prospects = []

    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                text("""
                    SELECT ykiho, name, address, phone,
                           prospect_score, prospect_grade, score_factors
                    FROM pharmacy_prospect_targets
                    WHERE prospect_grade = 'HOT'
                      AND contact_status = 'not_contacted'
                    ORDER BY prospect_score DESC
                    LIMIT :limit
                """),
                {"limit": limit}
            )

            for row in result.fetchall():
                prospects.append({
                    "ykiho": row[0],
                    "name": row[1],
                    "address": row[2],
                    "phone": row[3],
                    "prospect_score": row[4],
                    "prospect_grade": row[5],
                    "score_factors": row[6],
                })

    except Exception as e:
        logger.warning(f"DB query failed, trying file: {e}")
        # 파일에서 로드
        import json
        from pathlib import Path

        prospects_dir = Path("data/prospects")
        if prospects_dir.exists():
            files = sorted(prospects_dir.glob("pharmacy_prospects_*.json"), reverse=True)
            if files:
                with open(files[0], "r", encoding="utf-8") as f:
                    all_prospects = json.load(f)
                    prospects = [
                        p for p in all_prospects
                        if p.get("prospect_grade") == "HOT"
                           and p.get("contact_status") == "not_contacted"
                    ][:limit]

    return {
        "status": "completed",
        "count": len(prospects),
        "prospects": prospects
    }


@shared_task
def update_prospect_contact_status(ykiho: str, status: str, notes: str = ""):
    """
    타겟 연락 상태 업데이트
    """
    logger.info(f"Updating contact status for {ykiho}...")

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        result = loop.run_until_complete(
            _update_contact_status_async(ykiho, status, notes)
        )
        return result
    except Exception as e:
        logger.error(f"Update contact status failed: {e}")
        return {"status": "failed", "error": str(e)}
    finally:
        loop.close()


async def _update_contact_status_async(ykiho: str, status: str, notes: str):
    """연락 상태 업데이트 비동기 처리"""
    from app.core.database import AsyncSessionLocal
    from sqlalchemy import text
    from datetime import datetime

    try:
        async with AsyncSessionLocal() as db:
            await db.execute(
                text("""
                    UPDATE pharmacy_prospect_targets
                    SET contact_status = :status,
                        last_contact_date = :contact_date,
                        notes = COALESCE(notes, '') || :notes
                    WHERE ykiho = :ykiho
                """),
                {
                    "ykiho": ykiho,
                    "status": status,
                    "contact_date": datetime.utcnow(),
                    "notes": f"\n[{datetime.now().strftime('%Y-%m-%d')}] {notes}" if notes else ""
                }
            )
            await db.commit()

        return {
            "status": "completed",
            "ykiho": ykiho,
            "new_status": status
        }

    except Exception as e:
        logger.error(f"Update failed: {e}")
        return {"status": "failed", "error": str(e)}
