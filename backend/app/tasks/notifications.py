"""
알림 관련 Celery 태스크
"""
from celery import shared_task
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging
import json
import httpx
import asyncio
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.core.config import settings

logger = logging.getLogger(__name__)


# 이메일 템플릿
EMAIL_TEMPLATES = {
    "daily_digest": """
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Apple SD Gothic Neo', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">메디플라톤</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">오늘의 새로운 기회</p>
    </div>
    <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="color: #374151; font-size: 16px;">안녕하세요, <strong>{user_name}</strong>님!</p>
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">{date} 리포트</h2>
            <p style="color: #6b7280; margin: 0;">오늘 새로 발견된 프로스펙트: <strong style="color: #059669; font-size: 24px;">{new_prospects}건</strong></p>
        </div>
        <a href="https://mediplaton.kr/prospects" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">자세히 보기</a>
    </div>
</body>
</html>
""",
    "new_prospect": """
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Apple SD Gothic Neo', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #059669; padding: 20px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">새로운 입지 발견!</h1>
    </div>
    <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="color: #374151;">안녕하세요, <strong>{user_name}</strong>님!</p>
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h3 style="color: #1f2937; margin: 0 0 10px 0;">{address}</h3>
            <p style="color: #6b7280; margin: 5px 0;">적합도 점수: <strong style="color: #3b82f6;">{score}점</strong></p>
        </div>
        <a href="https://mediplaton.kr/prospects/{prospect_id}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">상세 정보 보기</a>
    </div>
</body>
</html>
""",
    "bid_accepted": """
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Apple SD Gothic Neo', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 20px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">축하합니다! 낙찰되었습니다</h1>
    </div>
    <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="color: #374151;">안녕하세요, <strong>{user_name}</strong>님!</p>
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h3 style="color: #1f2937; margin: 0 0 10px 0;">{address}</h3>
            <p style="color: #6b7280; margin: 5px 0;">프리미엄: <strong style="color: #059669;">{premium:,}원</strong></p>
        </div>
        <p style="color: #6b7280;">빠른 시일 내에 담당자가 연락드릴 예정입니다.</p>
    </div>
</body>
</html>
"""
}


@shared_task(bind=True, max_retries=3)
def send_push_notification(self, user_id: int, title: str, body: str, data: Dict = None):
    """
    FCM 푸시 알림 발송
    """
    try:
        logger.info(f"Sending push notification to user {user_id}: {title}")

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(
                _send_fcm_notification(user_id, title, body, data)
            )
            return result
        finally:
            loop.close()

    except Exception as e:
        logger.error(f"Push notification failed: {e}")
        self.retry(exc=e, countdown=60)


async def _send_fcm_notification(user_id: int, title: str, body: str, data: Dict = None) -> Dict:
    """
    FCM HTTP v1 API를 통한 푸시 알림 발송
    """
    from app.core.database import AsyncSessionLocal
    from sqlalchemy import select
    from app.models.user import User, UserDevice

    if not settings.FCM_SERVER_KEY:
        logger.warning("FCM server key not configured, skipping push notification")
        return {"status": "skipped", "reason": "FCM not configured"}

    async with AsyncSessionLocal() as db:
        # 사용자의 FCM 토큰 조회
        result = await db.execute(
            select(UserDevice).where(
                UserDevice.user_id == user_id,
                UserDevice.is_active == True
            )
        )
        devices = result.scalars().all()

        if not devices:
            logger.info(f"No active devices found for user {user_id}")
            return {"status": "no_devices", "user_id": user_id}

        sent_count = 0
        for device in devices:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.post(
                        "https://fcm.googleapis.com/fcm/send",
                        headers={
                            "Authorization": f"key={settings.FCM_SERVER_KEY}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "to": device.fcm_token,
                            "notification": {
                                "title": title,
                                "body": body,
                                "icon": "/icons/notification.png",
                                "click_action": "https://mediplaton.kr/notifications",
                            },
                            "data": data or {},
                            "android": {
                                "priority": "high",
                            },
                            "apns": {
                                "payload": {
                                    "aps": {"sound": "default"}
                                }
                            }
                        }
                    )

                    if response.status_code == 200:
                        sent_count += 1
                        logger.info(f"FCM sent to device {device.id}")
                    else:
                        logger.error(f"FCM error: {response.status_code} - {response.text}")

            except Exception as e:
                logger.error(f"FCM send failed for device {device.id}: {e}")

        return {"status": "sent", "user_id": user_id, "devices": sent_count}


@shared_task(bind=True, max_retries=3)
def send_email_notification(self, email: str, subject: str, template: str, context: Dict = None):
    """
    SMTP를 통한 이메일 알림 발송
    """
    try:
        logger.info(f"Sending email to {email}: {subject}")

        if not settings.SMTP_HOST or not settings.SMTP_USER:
            logger.warning("SMTP not configured, skipping email notification")
            return {"status": "skipped", "reason": "SMTP not configured"}

        # 템플릿 렌더링
        html_content = _render_email_template(template, context or {})

        # 이메일 메시지 구성
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = email

        # HTML 본문
        html_part = MIMEText(html_content, "html", "utf-8")
        msg.attach(html_part)

        # SMTP 발송
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, email, msg.as_string())

        logger.info(f"Email sent successfully to {email}")
        return {"status": "sent", "email": email}

    except smtplib.SMTPException as e:
        logger.error(f"SMTP error: {e}")
        self.retry(exc=e, countdown=60)
    except Exception as e:
        logger.error(f"Email notification failed: {e}")
        self.retry(exc=e, countdown=60)


def _render_email_template(template: str, context: Dict) -> str:
    """
    이메일 템플릿 렌더링
    """
    html_template = EMAIL_TEMPLATES.get(template, EMAIL_TEMPLATES.get("daily_digest", ""))

    # 간단한 템플릿 렌더링 (f-string 스타일)
    try:
        return html_template.format(**context)
    except KeyError as e:
        logger.warning(f"Missing template variable: {e}")
        return html_template


@shared_task(bind=True, max_retries=3)
def send_sms_notification(self, phone: str, message: str):
    """
    Twilio를 통한 SMS 알림 발송
    """
    try:
        logger.info(f"Sending SMS to {phone}")

        if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
            logger.warning("Twilio not configured, skipping SMS notification")
            return {"status": "skipped", "reason": "Twilio not configured"}

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(_send_twilio_sms(phone, message))
            return result
        finally:
            loop.close()

    except Exception as e:
        logger.error(f"SMS notification failed: {e}")
        self.retry(exc=e, countdown=60)


async def _send_twilio_sms(phone: str, message: str) -> Dict:
    """
    Twilio API를 통한 SMS 발송
    """
    # 한국 전화번호 형식 변환 (010-xxxx-xxxx -> +8210xxxxxxxx)
    formatted_phone = _format_korean_phone(phone)

    auth_string = f"{settings.TWILIO_ACCOUNT_SID}:{settings.TWILIO_AUTH_TOKEN}"
    import base64
    auth_header = base64.b64encode(auth_string.encode()).decode()

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json",
                headers={
                    "Authorization": f"Basic {auth_header}",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                data={
                    "To": formatted_phone,
                    "From": settings.TWILIO_PHONE_NUMBER,
                    "Body": message,
                }
            )

            if response.status_code in [200, 201]:
                logger.info(f"SMS sent successfully to {phone}")
                return {"status": "sent", "phone": phone}
            else:
                logger.error(f"Twilio error: {response.status_code} - {response.text}")
                return {"status": "failed", "phone": phone, "error": response.text}

    except Exception as e:
        logger.error(f"Twilio SMS failed: {e}")
        raise


def _format_korean_phone(phone: str) -> str:
    """
    한국 전화번호를 국제 형식으로 변환
    """
    # 하이픈 제거
    phone = phone.replace("-", "").replace(" ", "")

    # 010으로 시작하면 +82로 변환
    if phone.startswith("010"):
        return "+82" + phone[1:]
    elif phone.startswith("+82"):
        return phone
    else:
        return "+82" + phone


@shared_task(bind=True, max_retries=3)
def send_kakao_notification(self, phone: str, template_code: str, variables: Dict = None):
    """
    카카오 알림톡 발송
    """
    try:
        logger.info(f"Sending Kakao notification to {phone}")

        if not settings.KAKAO_ALIMTALK_API_KEY or not settings.KAKAO_SENDER_KEY:
            logger.warning("Kakao Alimtalk not configured, skipping notification")
            return {"status": "skipped", "reason": "Kakao not configured"}

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(
                _send_kakao_alimtalk(phone, template_code, variables or {})
            )
            return result
        finally:
            loop.close()

    except Exception as e:
        logger.error(f"Kakao notification failed: {e}")
        self.retry(exc=e, countdown=60)


async def _send_kakao_alimtalk(phone: str, template_code: str, variables: Dict) -> Dict:
    """
    카카오 알림톡 API 호출 (비즈엠 기준)
    """
    # 전화번호 형식 변환 (하이픈 제거)
    formatted_phone = phone.replace("-", "").replace(" ", "")

    # 템플릿 변수 치환
    template_content = _get_kakao_template_content(template_code, variables)

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://alimtalk-api.bizmsg.kr/v2/sender/send",
                headers={
                    "Content-Type": "application/json",
                    "userId": settings.KAKAO_SENDER_KEY,
                },
                json={
                    "message_type": "AT",
                    "phn": formatted_phone,
                    "profile": settings.KAKAO_SENDER_KEY,
                    "tmplId": template_code,
                    "msg": template_content,
                    "reserveDt": "00000000000000",  # 즉시 발송
                }
            )

            if response.status_code == 200:
                result = response.json()
                if result.get("code") == "success":
                    logger.info(f"Kakao Alimtalk sent to {phone}")
                    return {"status": "sent", "phone": phone}
                else:
                    logger.error(f"Kakao error: {result}")
                    return {"status": "failed", "phone": phone, "error": result}
            else:
                logger.error(f"Kakao API error: {response.status_code}")
                return {"status": "failed", "phone": phone}

    except Exception as e:
        logger.error(f"Kakao Alimtalk failed: {e}")
        raise


def _get_kakao_template_content(template_code: str, variables: Dict) -> str:
    """
    카카오 알림톡 템플릿 내용 생성
    """
    templates = {
        "MEDIMATCH_NEW_PROSPECT": """[메디플라톤] 새로운 입지 발견!

안녕하세요, {user_name}님!

{address}에 새로운 병원 개원 가능 입지가 발견되었습니다.

▶ 자세히 보기: https://mediplaton.kr/prospects""",

        "MEDIMATCH_BID_RESULT": """[메디플라톤] 입찰 결과 안내

안녕하세요, {user_name}님!

{address} 슬롯 입찰 결과를 안내드립니다.

결과: {result}

▶ 상세 확인: https://mediplaton.kr/bids""",

        "MEDIMATCH_PAYMENT": """[메디플라톤] 결제 완료 안내

안녕하세요, {user_name}님!

결제가 완료되었습니다.

상품: {product_name}
금액: {amount}원

▶ 결제 내역: https://mediplaton.kr/payments""",
    }

    template = templates.get(template_code, "")
    try:
        return template.format(**variables)
    except KeyError:
        return template


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
                if alert.region_names:
                    # 지역 필터: 주소에 지역명이 포함된 프로스펙트만 조회
                    from sqlalchemy import or_
                    region_conditions = [
                        ProspectLocation.address.ilike(f"%{region}%")
                        for region in alert.region_names
                    ]
                    if region_conditions:
                        query = query.where(or_(*region_conditions))

                if alert.prospect_types:
                    query = query.where(ProspectLocation.type.in_(alert.prospect_types))

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
                            "[메디플라톤] 새로운 입지 알림",
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
                    "[메디플라톤] 낙찰 안내",
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
