"""
알림 관련 Celery 태스크
"""
from celery import shared_task
from typing import List, Dict, Any
from datetime import datetime, timedelta
import logging
import json
import httpx
import asyncio

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def send_push_notification(self, user_id: int, title: str, body: str, data: Dict = None):
    """
    푸시 알림 발송
    """
    try:
        logger.info(f"Sending push notification to user {user_id}: {title}")

        # FCM 또는 다른 푸시 서비스 연동
        # 실제 구현 시 FCM SDK 사용
        notification_payload = {
            "user_id": user_id,
            "title": title,
            "body": body,
            "data": data or {},
            "sent_at": datetime.now().isoformat(),
        }

        # 임시: 로그로 출력
        logger.info(f"Push notification sent: {json.dumps(notification_payload, ensure_ascii=False)}")

        return {"status": "sent", "user_id": user_id}

    except Exception as e:
        logger.error(f"Push notification failed: {e}")
        self.retry(exc=e, countdown=60)


@shared_task(bind=True, max_retries=3)
def send_email_notification(self, email: str, subject: str, template: str, context: Dict = None):
    """
    이메일 알림 발송
    """
    try:
        logger.info(f"Sending email to {email}: {subject}")

        # 이메일 발송 로직
        # 실제 구현 시 SendGrid, AWS SES 등 사용
        email_payload = {
            "to": email,
            "subject": subject,
            "template": template,
            "context": context or {},
            "sent_at": datetime.now().isoformat(),
        }

        logger.info(f"Email sent: {json.dumps(email_payload, ensure_ascii=False)}")

        return {"status": "sent", "email": email}

    except Exception as e:
        logger.error(f"Email notification failed: {e}")
        self.retry(exc=e, countdown=60)


@shared_task(bind=True, max_retries=3)
def send_sms_notification(self, phone: str, message: str):
    """
    SMS 알림 발송
    """
    try:
        logger.info(f"Sending SMS to {phone}")

        # SMS 발송 로직
        # 실제 구현 시 Twilio, 알리고 등 사용
        sms_payload = {
            "to": phone,
            "message": message,
            "sent_at": datetime.now().isoformat(),
        }

        logger.info(f"SMS sent: {json.dumps(sms_payload, ensure_ascii=False)}")

        return {"status": "sent", "phone": phone}

    except Exception as e:
        logger.error(f"SMS notification failed: {e}")
        self.retry(exc=e, countdown=60)


@shared_task(bind=True, max_retries=3)
def send_kakao_notification(self, phone: str, template_code: str, variables: Dict = None):
    """
    카카오 알림톡 발송
    """
    try:
        logger.info(f"Sending Kakao notification to {phone}")

        # 카카오 알림톡 발송 로직
        kakao_payload = {
            "to": phone,
            "template_code": template_code,
            "variables": variables or {},
            "sent_at": datetime.now().isoformat(),
        }

        logger.info(f"Kakao notification sent: {json.dumps(kakao_payload, ensure_ascii=False)}")

        return {"status": "sent", "phone": phone}

    except Exception as e:
        logger.error(f"Kakao notification failed: {e}")
        self.retry(exc=e, countdown=60)


@shared_task
def process_pending_alerts():
    """
    대기 중인 알림 처리
    """
    logger.info("Processing pending alerts...")

    # 비동기 함수를 동기적으로 실행
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        result = loop.run_until_complete(_process_alerts_async())
        return result
    finally:
        loop.close()


async def _process_alerts_async():
    """
    대기 중인 알림 비동기 처리
    """
    from app.core.database import AsyncSessionLocal
    from sqlalchemy import select, update
    from app.models.prospect import UserAlert, ProspectLocation
    from app.models.user import User

    async with AsyncSessionLocal() as db:
        try:
            # 활성화된 알림 설정 조회
            result = await db.execute(
                select(UserAlert).where(UserAlert.is_active == True)
            )
            alerts = result.scalars().all()

            processed_count = 0

            for alert in alerts:
                # 사용자 조회
                user_result = await db.execute(
                    select(User).where(User.id == alert.user_id)
                )
                user = user_result.scalar_one_or_none()

                if not user:
                    continue

                # 알림 조건에 맞는 새로운 프로스펙트 조회
                query = select(ProspectLocation).where(
                    ProspectLocation.created_at > (datetime.utcnow() - timedelta(hours=1))
                )

                # 필터 적용
                if alert.region_filter:
                    regions = alert.region_filter.split(",")
                    # 지역 필터 적용
                    pass

                if alert.type_filter:
                    types = alert.type_filter.split(",")
                    query = query.where(ProspectLocation.type.in_(types))

                if alert.min_score:
                    query = query.where(ProspectLocation.clinic_fit_score >= alert.min_score)

                prospect_result = await db.execute(query)
                new_prospects = prospect_result.scalars().all()

                # 새로운 프로스펙트가 있으면 알림 발송
                for prospect in new_prospects:
                    # 알림 타입에 따라 발송
                    if alert.notification_type == "PUSH":
                        send_push_notification.delay(
                            user.id,
                            "새로운 입지 발견!",
                            f"{prospect.address}에 새로운 기회가 있습니다.",
                            {"prospect_id": prospect.id}
                        )
                    elif alert.notification_type == "EMAIL":
                        send_email_notification.delay(
                            user.email,
                            "[MediMatch] 새로운 입지 알림",
                            "new_prospect",
                            {
                                "user_name": user.name,
                                "address": prospect.address,
                                "score": prospect.clinic_fit_score,
                            }
                        )
                    elif alert.notification_type == "KAKAO":
                        send_kakao_notification.delay(
                            user.phone,
                            "MEDIMATCH_NEW_PROSPECT",
                            {
                                "user_name": user.name,
                                "address": prospect.address,
                            }
                        )

                    processed_count += 1

            logger.info(f"Processed {processed_count} alerts")
            return {"processed": processed_count}

        except Exception as e:
            logger.error(f"Failed to process alerts: {e}")
            return {"error": str(e)}


@shared_task
def send_new_prospect_alerts(prospect_id: int):
    """
    새 프로스펙트 발견 시 관련 사용자에게 알림
    """
    logger.info(f"Sending alerts for new prospect {prospect_id}")

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        result = loop.run_until_complete(_send_prospect_alerts_async(prospect_id))
        return result
    finally:
        loop.close()


async def _send_prospect_alerts_async(prospect_id: int):
    """
    새 프로스펙트 알림 비동기 발송
    """
    from app.core.database import AsyncSessionLocal
    from sqlalchemy import select
    from app.models.prospect import UserAlert, ProspectLocation
    from app.models.user import User

    async with AsyncSessionLocal() as db:
        try:
            # 프로스펙트 조회
            result = await db.execute(
                select(ProspectLocation).where(ProspectLocation.id == prospect_id)
            )
            prospect = result.scalar_one_or_none()

            if not prospect:
                return {"error": "Prospect not found"}

            # 관련 알림 설정 조회
            alerts_result = await db.execute(
                select(UserAlert).where(
                    UserAlert.is_active == True,
                    UserAlert.min_score <= prospect.clinic_fit_score
                )
            )
            alerts = alerts_result.scalars().all()

            sent_count = 0

            for alert in alerts:
                user_result = await db.execute(
                    select(User).where(User.id == alert.user_id)
                )
                user = user_result.scalar_one_or_none()

                if not user:
                    continue

                # 알림 발송
                send_push_notification.delay(
                    user.id,
                    "새로운 영업 기회!",
                    f"{prospect.address} - 적합도 {prospect.clinic_fit_score}점",
                    {"prospect_id": prospect_id, "type": prospect.type}
                )
                sent_count += 1

            return {"sent": sent_count}

        except Exception as e:
            logger.error(f"Failed to send prospect alerts: {e}")
            return {"error": str(e)}


@shared_task
def send_bid_notification(bid_id: int, notification_type: str):
    """
    입찰 관련 알림 발송
    """
    logger.info(f"Sending bid notification: {bid_id}, type: {notification_type}")

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        result = loop.run_until_complete(_send_bid_notification_async(bid_id, notification_type))
        return result
    finally:
        loop.close()


async def _send_bid_notification_async(bid_id: int, notification_type: str):
    """
    입찰 알림 비동기 발송
    """
    from app.core.database import AsyncSessionLocal
    from sqlalchemy import select
    from app.models.pharmacy import Bid, PharmacySlot
    from app.models.user import User

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

            # 입찰자 조회
            user_result = await db.execute(
                select(User).where(User.id == bid.user_id)
            )
            user = user_result.scalar_one_or_none()

            if not user or not slot:
                return {"error": "User or slot not found"}

            # 알림 타입별 처리
            if notification_type == "BID_PLACED":
                # 입찰 등록 확인
                send_push_notification.delay(
                    user.id,
                    "입찰 등록 완료",
                    f"{slot.address} 슬롯에 입찰이 등록되었습니다.",
                    {"bid_id": bid_id, "slot_id": slot.id}
                )
            elif notification_type == "BID_ACCEPTED":
                # 낙찰 알림
                send_push_notification.delay(
                    user.id,
                    "🎉 축하합니다! 낙찰되었습니다",
                    f"{slot.address} 슬롯 입찰에 낙찰되었습니다.",
                    {"bid_id": bid_id, "slot_id": slot.id}
                )
                send_email_notification.delay(
                    user.email,
                    "[MediMatch] 낙찰 안내",
                    "bid_accepted",
                    {
                        "user_name": user.name,
                        "address": slot.address,
                        "premium": bid.premium_amount,
                    }
                )
            elif notification_type == "BID_REJECTED":
                # 유찰 알림
                send_push_notification.delay(
                    user.id,
                    "입찰 결과 안내",
                    f"{slot.address} 슬롯 입찰이 선정되지 않았습니다.",
                    {"bid_id": bid_id, "slot_id": slot.id}
                )
            elif notification_type == "OUTBID":
                # 더 높은 입찰 알림
                send_push_notification.delay(
                    user.id,
                    "상위 입찰 발생",
                    f"{slot.address} 슬롯에 더 높은 입찰이 등록되었습니다.",
                    {"bid_id": bid_id, "slot_id": slot.id}
                )

            return {"status": "sent", "type": notification_type}

        except Exception as e:
            logger.error(f"Failed to send bid notification: {e}")
            return {"error": str(e)}
