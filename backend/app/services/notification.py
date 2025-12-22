"""
알림 서비스 - 이메일, 푸시 알림
"""
import os
import json
import httpx
from typing import Optional, List, Dict, Any
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import smtplib
import ssl

# Firebase Admin SDK (푸시 알림)
try:
    import firebase_admin
    from firebase_admin import credentials, messaging
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False


# ============ 설정 ============

# 이메일 설정 (SMTP)
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", "noreply@medimatch.kr")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "MediMatch")

# Firebase 설정 (푸시 알림)
FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH", "firebase-credentials.json")

# Slack 웹훅 (내부 알림용)
SLACK_WEBHOOK_URL = os.getenv("SLACK_WEBHOOK_URL", "")


# ============ 이메일 템플릿 ============

EMAIL_TEMPLATES = {
    "welcome": {
        "subject": "MediMatch에 오신 것을 환영합니다!",
        "body": """
        <html>
        <body style="font-family: 'Pretendard', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #7c3aed;">MediMatch</h1>
            </div>
            <h2>안녕하세요, {name}님!</h2>
            <p>MediMatch 회원가입을 환영합니다.</p>
            <p>이제 데이터 기반 개원 분석 서비스를 이용하실 수 있습니다.</p>
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); padding: 20px; border-radius: 12px; text-align: center; margin: 30px 0;">
                <a href="{dashboard_url}" style="color: white; text-decoration: none; font-weight: bold; font-size: 16px;">
                    대시보드 바로가기 →
                </a>
            </div>
            <p style="color: #666;">감사합니다.<br>MediMatch 팀 드림</p>
        </body>
        </html>
        """
    },
    "prospect_alert": {
        "subject": "[MediMatch] 새로운 개원 후보지가 발견되었습니다!",
        "body": """
        <html>
        <body style="font-family: 'Pretendard', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #7c3aed;">MediMatch</h1>
            </div>
            <h2>새로운 개원 후보지 알림</h2>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 12px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0;">{location_name}</h3>
                <p style="margin: 5px 0;"><strong>주소:</strong> {address}</p>
                <p style="margin: 5px 0;"><strong>점수:</strong> {score}점</p>
                <p style="margin: 5px 0;"><strong>타입:</strong> {prospect_type}</p>
            </div>
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); padding: 20px; border-radius: 12px; text-align: center; margin: 30px 0;">
                <a href="{detail_url}" style="color: white; text-decoration: none; font-weight: bold; font-size: 16px;">
                    상세 정보 보기 →
                </a>
            </div>
        </body>
        </html>
        """
    },
    "closed_hospital_alert": {
        "subject": "[MediMatch] 폐업 병원이 감지되었습니다!",
        "body": """
        <html>
        <body style="font-family: 'Pretendard', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #7c3aed;">MediMatch</h1>
            </div>
            <h2 style="color: #ef4444;">폐업 병원 알림</h2>
            <p>관심 지역에서 병원 폐업이 감지되었습니다. 새로운 개원 기회가 될 수 있습니다!</p>
            <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #ef4444;">{hospital_name}</h3>
                <p style="margin: 5px 0;"><strong>주소:</strong> {address}</p>
                <p style="margin: 5px 0;"><strong>진료과:</strong> {specialty}</p>
                <p style="margin: 5px 0;"><strong>폐업일:</strong> {closed_date}</p>
            </div>
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); padding: 20px; border-radius: 12px; text-align: center; margin: 30px 0;">
                <a href="{analysis_url}" style="color: white; text-decoration: none; font-weight: bold; font-size: 16px;">
                    입지 분석하기 →
                </a>
            </div>
        </body>
        </html>
        """
    },
    "partner_inquiry_response": {
        "subject": "[MediMatch] 파트너 업체에서 답변이 왔습니다",
        "body": """
        <html>
        <body style="font-family: 'Pretendard', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #7c3aed;">MediMatch</h1>
            </div>
            <h2>파트너 답변 알림</h2>
            <p><strong>{partner_name}</strong>에서 문의에 대한 답변을 보내왔습니다.</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 12px; margin: 20px 0;">
                <p style="white-space: pre-wrap;">{response_content}</p>
            </div>
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); padding: 20px; border-radius: 12px; text-align: center; margin: 30px 0;">
                <a href="{inquiry_url}" style="color: white; text-decoration: none; font-weight: bold; font-size: 16px;">
                    상세 내용 보기 →
                </a>
            </div>
        </body>
        </html>
        """
    },
    "payment_success": {
        "subject": "[MediMatch] 결제가 완료되었습니다",
        "body": """
        <html>
        <body style="font-family: 'Pretendard', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #7c3aed;">MediMatch</h1>
            </div>
            <h2>결제 완료</h2>
            <div style="background: #f0fdf4; border: 1px solid #22c55e; padding: 20px; border-radius: 12px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>상품:</strong> {product_name}</p>
                <p style="margin: 5px 0;"><strong>금액:</strong> {amount}원</p>
                <p style="margin: 5px 0;"><strong>결제일시:</strong> {paid_at}</p>
                <p style="margin: 5px 0;"><strong>주문번호:</strong> {order_id}</p>
            </div>
            <p>영수증: <a href="{receipt_url}">{receipt_url}</a></p>
        </body>
        </html>
        """
    },
}


# ============ 이메일 서비스 ============

class EmailService:
    """이메일 발송 서비스"""

    @staticmethod
    async def send_email(
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None
    ) -> bool:
        """이메일 발송"""
        if not SMTP_USER or not SMTP_PASSWORD:
            print(f"[EMAIL] SMTP not configured. Would send to: {to_email}")
            print(f"[EMAIL] Subject: {subject}")
            return False

        try:
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM}>"
            message["To"] = to_email

            if text_body:
                message.attach(MIMEText(text_body, "plain"))
            message.attach(MIMEText(html_body, "html"))

            context = ssl.create_default_context()

            with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                server.starttls(context=context)
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.sendmail(SMTP_FROM, to_email, message.as_string())

            print(f"[EMAIL] Sent to: {to_email}")
            return True

        except Exception as e:
            print(f"[EMAIL] Error sending to {to_email}: {e}")
            return False

    @staticmethod
    async def send_template_email(
        to_email: str,
        template_name: str,
        variables: Dict[str, Any]
    ) -> bool:
        """템플릿 이메일 발송"""
        template = EMAIL_TEMPLATES.get(template_name)
        if not template:
            print(f"[EMAIL] Template not found: {template_name}")
            return False

        subject = template["subject"].format(**variables)
        body = template["body"].format(**variables)

        return await EmailService.send_email(to_email, subject, body)


# ============ 푸시 알림 서비스 ============

class PushNotificationService:
    """Firebase Cloud Messaging 푸시 알림"""

    _initialized = False

    @classmethod
    def _initialize_firebase(cls):
        """Firebase 초기화"""
        if cls._initialized or not FIREBASE_AVAILABLE:
            return

        try:
            if os.path.exists(FIREBASE_CREDENTIALS_PATH):
                cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
                firebase_admin.initialize_app(cred)
                cls._initialized = True
                print("[PUSH] Firebase initialized")
            else:
                print(f"[PUSH] Firebase credentials not found: {FIREBASE_CREDENTIALS_PATH}")
        except Exception as e:
            print(f"[PUSH] Firebase initialization error: {e}")

    @classmethod
    async def send_push(
        cls,
        token: str,
        title: str,
        body: str,
        data: Optional[Dict[str, str]] = None,
        image_url: Optional[str] = None
    ) -> bool:
        """푸시 알림 발송"""
        if not FIREBASE_AVAILABLE:
            print(f"[PUSH] Firebase not available. Would send: {title}")
            return False

        cls._initialize_firebase()

        if not cls._initialized:
            return False

        try:
            notification = messaging.Notification(
                title=title,
                body=body,
                image=image_url
            )

            message = messaging.Message(
                notification=notification,
                data=data or {},
                token=token,
            )

            response = messaging.send(message)
            print(f"[PUSH] Sent: {response}")
            return True

        except Exception as e:
            print(f"[PUSH] Error: {e}")
            return False

    @classmethod
    async def send_push_to_multiple(
        cls,
        tokens: List[str],
        title: str,
        body: str,
        data: Optional[Dict[str, str]] = None
    ) -> int:
        """여러 기기에 푸시 알림 발송"""
        if not FIREBASE_AVAILABLE or not tokens:
            return 0

        cls._initialize_firebase()

        if not cls._initialized:
            return 0

        try:
            message = messaging.MulticastMessage(
                notification=messaging.Notification(title=title, body=body),
                data=data or {},
                tokens=tokens,
            )

            response = messaging.send_multicast(message)
            print(f"[PUSH] Sent to {response.success_count}/{len(tokens)} devices")
            return response.success_count

        except Exception as e:
            print(f"[PUSH] Multicast error: {e}")
            return 0


# ============ Slack 알림 (내부용) ============

class SlackNotificationService:
    """Slack 웹훅 알림 (내부 알림용)"""

    @staticmethod
    async def send_slack(
        message: str,
        channel: Optional[str] = None,
        attachments: Optional[List[Dict]] = None
    ) -> bool:
        """Slack 메시지 발송"""
        if not SLACK_WEBHOOK_URL:
            print(f"[SLACK] Webhook not configured. Message: {message}")
            return False

        try:
            payload = {"text": message}
            if channel:
                payload["channel"] = channel
            if attachments:
                payload["attachments"] = attachments

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    SLACK_WEBHOOK_URL,
                    json=payload,
                    timeout=10.0
                )

            return response.status_code == 200

        except Exception as e:
            print(f"[SLACK] Error: {e}")
            return False

    @staticmethod
    async def notify_new_inquiry(partner_name: str, inquiry_title: str, user_email: str):
        """새 파트너 문의 알림"""
        message = f"🔔 새로운 파트너 문의\n• 파트너: {partner_name}\n• 제목: {inquiry_title}\n• 사용자: {user_email}"
        await SlackNotificationService.send_slack(message)

    @staticmethod
    async def notify_payment(product_name: str, amount: int, user_email: str):
        """결제 완료 알림"""
        message = f"💰 결제 완료\n• 상품: {product_name}\n• 금액: {amount:,}원\n• 사용자: {user_email}"
        await SlackNotificationService.send_slack(message)


# ============ 통합 알림 서비스 ============

class NotificationService:
    """통합 알림 서비스"""

    @staticmethod
    async def send_welcome_notification(user_email: str, user_name: str, push_token: Optional[str] = None):
        """회원가입 환영 알림"""
        # 이메일 발송
        await EmailService.send_template_email(
            to_email=user_email,
            template_name="welcome",
            variables={
                "name": user_name,
                "dashboard_url": "https://medimatch.kr/dashboard"
            }
        )

        # 푸시 알림 (토큰이 있는 경우)
        if push_token:
            await PushNotificationService.send_push(
                token=push_token,
                title="MediMatch에 오신 것을 환영합니다!",
                body="지금 바로 개원 분석을 시작해보세요.",
                data={"action": "open_dashboard"}
            )

    @staticmethod
    async def send_prospect_alert(
        user_email: str,
        location_name: str,
        address: str,
        score: int,
        prospect_type: str,
        prospect_id: int,
        push_token: Optional[str] = None
    ):
        """개원 후보지 알림"""
        await EmailService.send_template_email(
            to_email=user_email,
            template_name="prospect_alert",
            variables={
                "location_name": location_name,
                "address": address,
                "score": score,
                "prospect_type": prospect_type,
                "detail_url": f"https://medimatch.kr/prospects/{prospect_id}"
            }
        )

        if push_token:
            await PushNotificationService.send_push(
                token=push_token,
                title="새로운 개원 후보지!",
                body=f"{location_name} - {score}점",
                data={"action": "open_prospect", "prospect_id": str(prospect_id)}
            )

    @staticmethod
    async def send_closed_hospital_alert(
        user_email: str,
        hospital_name: str,
        address: str,
        specialty: str,
        closed_date: str,
        lat: float,
        lng: float,
        push_token: Optional[str] = None
    ):
        """폐업 병원 알림"""
        await EmailService.send_template_email(
            to_email=user_email,
            template_name="closed_hospital_alert",
            variables={
                "hospital_name": hospital_name,
                "address": address,
                "specialty": specialty,
                "closed_date": closed_date,
                "analysis_url": f"https://medimatch.kr/simulate?lat={lat}&lng={lng}"
            }
        )

        if push_token:
            await PushNotificationService.send_push(
                token=push_token,
                title="폐업 병원 감지!",
                body=f"{hospital_name} - {specialty}",
                data={"action": "open_map", "lat": str(lat), "lng": str(lng)}
            )

    @staticmethod
    async def send_payment_notification(
        user_email: str,
        product_name: str,
        amount: int,
        order_id: str,
        receipt_url: str
    ):
        """결제 완료 알림"""
        await EmailService.send_template_email(
            to_email=user_email,
            template_name="payment_success",
            variables={
                "product_name": product_name,
                "amount": f"{amount:,}",
                "paid_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
                "order_id": order_id,
                "receipt_url": receipt_url or "#"
            }
        )

        # 내부 Slack 알림
        await SlackNotificationService.notify_payment(product_name, amount, user_email)
