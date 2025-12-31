"""
아웃바운드 캠페인 관련 Celery 태스크
"""
from celery import shared_task
from typing import Dict, Any, List
from datetime import datetime, timedelta
import logging
import asyncio

logger = logging.getLogger(__name__)


@shared_task
def run_sms_campaign(campaign_id: str, target_grade: str = "HOT", limit: int = 100):
    """
    SMS 캠페인 실행

    Args:
        campaign_id: 캠페인 ID
        target_grade: 타겟 등급 (HOT, WARM, COLD)
        limit: 발송 대상 수
    """
    logger.info(f"=== SMS Campaign {campaign_id} Started ===")
    start_time = datetime.now()

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        result = loop.run_until_complete(
            _run_sms_campaign_async(campaign_id, target_grade, limit)
        )
        duration = (datetime.now() - start_time).total_seconds()
        logger.info(f"=== SMS Campaign Completed in {duration}s ===")
        return {**result, "duration": duration}
    except Exception as e:
        logger.error(f"SMS campaign failed: {e}")
        return {"status": "failed", "error": str(e)}
    finally:
        loop.close()


async def _run_sms_campaign_async(campaign_id: str, target_grade: str, limit: int):
    """SMS 캠페인 비동기 처리"""
    from app.services.outbound_campaign import outbound_campaign_service, Campaign
    from app.services.pharmacy_prospect import pharmacy_prospect_service

    # 1. 타겟 조회
    targets = await _get_campaign_targets(target_grade, limit)

    if not targets:
        return {
            "status": "completed",
            "campaign_id": campaign_id,
            "message": "No targets found",
            "sent": 0
        }

    # 2. 캠페인 생성
    campaign = Campaign(
        id=campaign_id,
        name=f"약국 양도 안내 - {target_grade}",
        campaign_type="SMS",
        target_grade=target_grade,
        message_template=outbound_campaign_service.create_pharmacy_sms_template()
    )

    # 3. 타겟 데이터 준비
    campaign_targets = []
    for t in targets:
        # 지역 추출
        address_parts = t.get("address", "").split()
        region = address_parts[1] if len(address_parts) > 1 else ""

        campaign_targets.append({
            "phone": t.get("phone", ""),
            "name": t.get("name", ""),
            "region": region,
            "ykiho": t.get("ykiho", ""),
        })

    # 4. 캠페인 실행
    result = await outbound_campaign_service.run_sms_campaign(
        campaign=campaign,
        targets=campaign_targets,
        batch_size=50,
        delay_between_batches=2.0
    )

    # 5. 연락 상태 업데이트
    for t in campaign_targets:
        await _update_contact_status(t["ykiho"], "contacted")

    return {
        "status": "completed",
        "campaign_id": campaign_id,
        "total_targets": len(campaign_targets),
        "success": result.get("success", 0),
        "failed": result.get("failed", 0),
    }


@shared_task
def run_email_campaign(campaign_id: str, target_grade: str = "HOT", limit: int = 100):
    """
    이메일 캠페인 실행
    """
    logger.info(f"=== Email Campaign {campaign_id} Started ===")
    start_time = datetime.now()

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        result = loop.run_until_complete(
            _run_email_campaign_async(campaign_id, target_grade, limit)
        )
        duration = (datetime.now() - start_time).total_seconds()
        logger.info(f"=== Email Campaign Completed in {duration}s ===")
        return {**result, "duration": duration}
    except Exception as e:
        logger.error(f"Email campaign failed: {e}")
        return {"status": "failed", "error": str(e)}
    finally:
        loop.close()


async def _run_email_campaign_async(campaign_id: str, target_grade: str, limit: int):
    """이메일 캠페인 비동기 처리"""
    from app.services.outbound_campaign import outbound_campaign_service, Campaign

    # 1. 타겟 조회 (이메일이 있는 경우만)
    targets = await _get_campaign_targets_with_email(target_grade, limit)

    if not targets:
        return {
            "status": "completed",
            "campaign_id": campaign_id,
            "message": "No targets with email found",
            "sent": 0
        }

    # 2. 캠페인 생성
    email_template = outbound_campaign_service.create_pharmacy_email_template()
    campaign = Campaign(
        id=campaign_id,
        name=f"약국 양도 안내 이메일 - {target_grade}",
        campaign_type="EMAIL",
        target_grade=target_grade,
        email_subject=email_template["subject"],
        email_body=email_template["body"]
    )

    # 3. 타겟 데이터 준비
    campaign_targets = []
    for t in targets:
        address_parts = t.get("address", "").split()
        region = address_parts[1] if len(address_parts) > 1 else ""

        campaign_targets.append({
            "email": t.get("email", ""),
            "name": t.get("name", ""),
            "region": region,
            "years_operated": t.get("years_operated", 0),
            "ykiho": t.get("ykiho", ""),
        })

    # 4. 캠페인 실행
    result = await outbound_campaign_service.run_email_campaign(
        campaign=campaign,
        targets=campaign_targets,
        delay_between_emails=1.0
    )

    return {
        "status": "completed",
        "campaign_id": campaign_id,
        "total_targets": len(campaign_targets),
        "success": result.get("success", 0),
        "failed": result.get("failed", 0),
    }


@shared_task
def schedule_campaign(
    campaign_type: str,
    target_grade: str,
    scheduled_time: str,
    limit: int = 100
):
    """
    캠페인 예약

    Args:
        campaign_type: SMS or EMAIL
        target_grade: HOT, WARM, COLD
        scheduled_time: 예약 시간 (ISO format)
        limit: 발송 대상 수
    """
    import uuid

    campaign_id = str(uuid.uuid4())
    scheduled_dt = datetime.fromisoformat(scheduled_time)
    delay = (scheduled_dt - datetime.now()).total_seconds()

    if delay < 0:
        return {
            "status": "failed",
            "error": "Scheduled time is in the past"
        }

    if campaign_type == "SMS":
        run_sms_campaign.apply_async(
            args=[campaign_id, target_grade, limit],
            countdown=delay
        )
    else:
        run_email_campaign.apply_async(
            args=[campaign_id, target_grade, limit],
            countdown=delay
        )

    logger.info(f"Campaign {campaign_id} scheduled for {scheduled_time}")

    return {
        "status": "scheduled",
        "campaign_id": campaign_id,
        "scheduled_time": scheduled_time,
        "campaign_type": campaign_type,
        "target_grade": target_grade,
        "limit": limit
    }


@shared_task
def send_single_sms(phone: str, message: str):
    """
    단일 SMS 발송
    """
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        result = loop.run_until_complete(_send_single_sms_async(phone, message))
        return result
    except Exception as e:
        logger.error(f"Single SMS failed: {e}")
        return {"status": "failed", "error": str(e)}
    finally:
        loop.close()


async def _send_single_sms_async(phone: str, message: str):
    """단일 SMS 비동기 발송"""
    from app.services.outbound_campaign import solapi_service

    result = await solapi_service.send_sms(phone, message)
    return result


@shared_task
def get_campaign_stats():
    """
    캠페인 통계 조회
    """
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        result = loop.run_until_complete(_get_campaign_stats_async())
        return result
    except Exception as e:
        logger.error(f"Get stats failed: {e}")
        return {"status": "failed", "error": str(e)}
    finally:
        loop.close()


async def _get_campaign_stats_async():
    """캠페인 통계 비동기 조회"""
    from app.core.database import AsyncSessionLocal
    from sqlalchemy import text

    stats = {
        "total_prospects": 0,
        "hot_count": 0,
        "warm_count": 0,
        "cold_count": 0,
        "contacted": 0,
        "interested": 0,
        "not_interested": 0,
        "sms_balance": 0,
    }

    try:
        async with AsyncSessionLocal() as db:
            # 타겟 통계
            result = await db.execute(
                text("""
                    SELECT
                        COUNT(*) as total,
                        SUM(CASE WHEN prospect_grade = 'HOT' THEN 1 ELSE 0 END) as hot,
                        SUM(CASE WHEN prospect_grade = 'WARM' THEN 1 ELSE 0 END) as warm,
                        SUM(CASE WHEN prospect_grade = 'COLD' THEN 1 ELSE 0 END) as cold,
                        SUM(CASE WHEN contact_status = 'contacted' THEN 1 ELSE 0 END) as contacted,
                        SUM(CASE WHEN contact_status = 'interested' THEN 1 ELSE 0 END) as interested,
                        SUM(CASE WHEN contact_status = 'not_interested' THEN 1 ELSE 0 END) as not_interested
                    FROM pharmacy_prospect_targets
                """)
            )
            row = result.fetchone()

            if row:
                stats["total_prospects"] = row[0] or 0
                stats["hot_count"] = row[1] or 0
                stats["warm_count"] = row[2] or 0
                stats["cold_count"] = row[3] or 0
                stats["contacted"] = row[4] or 0
                stats["interested"] = row[5] or 0
                stats["not_interested"] = row[6] or 0

    except Exception as e:
        logger.warning(f"DB stats query failed: {e}")

    # SMS 잔액 조회
    try:
        from app.services.outbound_campaign import solapi_service
        balance_result = await solapi_service.get_balance()
        if balance_result.get("success"):
            stats["sms_balance"] = balance_result.get("balance", 0)
    except Exception as e:
        logger.warning(f"SMS balance query failed: {e}")

    return {
        "status": "completed",
        "stats": stats,
        "timestamp": datetime.now().isoformat()
    }


# ===== 헬퍼 함수 =====

async def _get_campaign_targets(target_grade: str, limit: int) -> List[Dict]:
    """캠페인 타겟 조회"""
    from app.core.database import AsyncSessionLocal
    from sqlalchemy import text
    import json

    targets = []

    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                text("""
                    SELECT ykiho, name, address, phone, prospect_score, years_operated
                    FROM pharmacy_prospect_targets
                    WHERE prospect_grade = :grade
                      AND contact_status = 'not_contacted'
                      AND phone IS NOT NULL
                      AND phone != ''
                    ORDER BY prospect_score DESC
                    LIMIT :limit
                """),
                {"grade": target_grade, "limit": limit}
            )

            for row in result.fetchall():
                targets.append({
                    "ykiho": row[0],
                    "name": row[1],
                    "address": row[2],
                    "phone": row[3],
                    "prospect_score": row[4],
                    "years_operated": row[5],
                })

    except Exception as e:
        logger.warning(f"DB query failed, trying file: {e}")
        # 파일에서 로드
        from pathlib import Path
        prospects_dir = Path("data/prospects")
        if prospects_dir.exists():
            files = sorted(prospects_dir.glob("pharmacy_prospects_*.json"), reverse=True)
            if files:
                with open(files[0], "r", encoding="utf-8") as f:
                    all_prospects = json.load(f)
                    targets = [
                        p for p in all_prospects
                        if p.get("prospect_grade") == target_grade
                           and p.get("contact_status") == "not_contacted"
                           and p.get("phone")
                    ][:limit]

    return targets


async def _get_campaign_targets_with_email(target_grade: str, limit: int) -> List[Dict]:
    """이메일이 있는 타겟 조회"""
    from app.core.database import AsyncSessionLocal
    from sqlalchemy import text

    targets = []

    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                text("""
                    SELECT ykiho, name, address, email, prospect_score, years_operated
                    FROM pharmacy_prospect_targets
                    WHERE prospect_grade = :grade
                      AND contact_status = 'not_contacted'
                      AND email IS NOT NULL
                      AND email != ''
                    ORDER BY prospect_score DESC
                    LIMIT :limit
                """),
                {"grade": target_grade, "limit": limit}
            )

            for row in result.fetchall():
                targets.append({
                    "ykiho": row[0],
                    "name": row[1],
                    "address": row[2],
                    "email": row[3],
                    "prospect_score": row[4],
                    "years_operated": row[5],
                })

    except Exception as e:
        logger.warning(f"DB query for email targets failed: {e}")

    return targets


async def _update_contact_status(ykiho: str, status: str):
    """연락 상태 업데이트"""
    from app.core.database import AsyncSessionLocal
    from sqlalchemy import text

    try:
        async with AsyncSessionLocal() as db:
            await db.execute(
                text("""
                    UPDATE pharmacy_prospect_targets
                    SET contact_status = :status,
                        last_contact_date = NOW()
                    WHERE ykiho = :ykiho
                """),
                {"ykiho": ykiho, "status": status}
            )
            await db.commit()
    except Exception as e:
        logger.warning(f"Update contact status failed: {e}")
