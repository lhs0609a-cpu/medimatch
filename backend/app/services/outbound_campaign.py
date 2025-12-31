"""
아웃바운드 캠페인 서비스

약국 타겟에게 문자/이메일을 발송하고 캠페인을 관리합니다.
"""

import httpx
import hashlib
import hmac
import time
import uuid
import json
from typing import Optional, Dict, List, Any
from datetime import datetime, timedelta
from enum import Enum
import logging
import asyncio
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import aiosmtplib

from ..core.config import settings

logger = logging.getLogger(__name__)


class CampaignStatus(str, Enum):
    """캠페인 상태"""
    DRAFT = "DRAFT"          # 작성 중
    SCHEDULED = "SCHEDULED"  # 예약됨
    RUNNING = "RUNNING"      # 발송 중
    PAUSED = "PAUSED"        # 일시 중지
    COMPLETED = "COMPLETED"  # 완료
    CANCELLED = "CANCELLED"  # 취소


class MessageStatus(str, Enum):
    """메시지 발송 상태"""
    PENDING = "PENDING"      # 대기
    SENT = "SENT"            # 발송 완료
    DELIVERED = "DELIVERED"  # 수신 확인
    FAILED = "FAILED"        # 실패
    REJECTED = "REJECTED"    # 거부 (수신거부자)


class SolapiService:
    """Solapi 문자 발송 서비스"""

    def __init__(self):
        self.base_url = "https://api.solapi.com"
        self.api_key = settings.SOLAPI_API_KEY
        self.api_secret = settings.SOLAPI_API_SECRET
        self.sender_phone = settings.SOLAPI_SENDER_PHONE

    def _generate_signature(self, timestamp: str, salt: str) -> str:
        """API 서명 생성"""
        message = f"{timestamp}{salt}"
        signature = hmac.new(
            self.api_secret.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        return signature

    def _get_headers(self) -> Dict[str, str]:
        """API 헤더 생성"""
        timestamp = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.000Z")
        salt = str(uuid.uuid4())
        signature = self._generate_signature(timestamp, salt)

        return {
            "Authorization": f"HMAC-SHA256 apiKey={self.api_key}, date={timestamp}, salt={salt}, signature={signature}",
            "Content-Type": "application/json"
        }

    async def send_sms(
        self,
        to: str,
        text: str,
        from_number: str = None
    ) -> Dict[str, Any]:
        """
        단일 SMS 발송

        Args:
            to: 수신번호
            text: 메시지 내용
            from_number: 발신번호 (None이면 기본값)

        Returns:
            발송 결과
        """
        if not self.api_key or not self.api_secret:
            logger.warning("Solapi API keys not configured")
            return {"success": False, "error": "API keys not configured"}

        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "message": {
                        "to": to.replace("-", ""),
                        "from": (from_number or self.sender_phone).replace("-", ""),
                        "text": text,
                        "type": "LMS" if len(text) > 90 else "SMS"
                    }
                }

                response = await client.post(
                    f"{self.base_url}/messages/v4/send",
                    headers=self._get_headers(),
                    json=payload,
                    timeout=30.0
                )

                result = response.json()

                if response.status_code == 200:
                    return {
                        "success": True,
                        "message_id": result.get("groupId"),
                        "status": "SENT"
                    }
                else:
                    return {
                        "success": False,
                        "error": result.get("errorMessage", "Unknown error"),
                        "status": "FAILED"
                    }

        except Exception as e:
            logger.error(f"Failed to send SMS: {e}")
            return {"success": False, "error": str(e), "status": "FAILED"}

    async def send_bulk_sms(
        self,
        messages: List[Dict[str, str]],
        scheduled_date: datetime = None
    ) -> Dict[str, Any]:
        """
        대량 SMS 발송

        Args:
            messages: [{"to": "010xxx", "text": "내용"}, ...]
            scheduled_date: 예약 발송 시간 (None이면 즉시 발송)

        Returns:
            발송 결과
        """
        if not self.api_key or not self.api_secret:
            logger.warning("Solapi API keys not configured")
            return {"success": False, "error": "API keys not configured"}

        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "messages": [
                        {
                            "to": msg["to"].replace("-", ""),
                            "from": self.sender_phone.replace("-", ""),
                            "text": msg["text"],
                            "type": "LMS" if len(msg["text"]) > 90 else "SMS"
                        }
                        for msg in messages
                    ]
                }

                if scheduled_date:
                    payload["scheduledDate"] = scheduled_date.strftime("%Y-%m-%dT%H:%M:%S")

                response = await client.post(
                    f"{self.base_url}/messages/v4/send-many",
                    headers=self._get_headers(),
                    json=payload,
                    timeout=60.0
                )

                result = response.json()

                if response.status_code == 200:
                    return {
                        "success": True,
                        "group_id": result.get("groupId"),
                        "success_count": result.get("successCount", 0),
                        "fail_count": result.get("failCount", 0),
                        "status": "SENT"
                    }
                else:
                    return {
                        "success": False,
                        "error": result.get("errorMessage", "Unknown error"),
                        "status": "FAILED"
                    }

        except Exception as e:
            logger.error(f"Failed to send bulk SMS: {e}")
            return {"success": False, "error": str(e), "status": "FAILED"}

    async def get_balance(self) -> Dict[str, Any]:
        """잔액 조회"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/cash/v1/balance",
                    headers=self._get_headers(),
                    timeout=10.0
                )

                if response.status_code == 200:
                    result = response.json()
                    return {
                        "success": True,
                        "balance": result.get("balance", 0),
                        "point": result.get("point", 0)
                    }
                else:
                    return {"success": False, "error": "Failed to get balance"}

        except Exception as e:
            logger.error(f"Failed to get balance: {e}")
            return {"success": False, "error": str(e)}


class EmailService:
    """이메일 발송 서비스"""

    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.SMTP_FROM_EMAIL
        self.from_name = settings.SMTP_FROM_NAME

    async def send_email(
        self,
        to: str,
        subject: str,
        body_html: str,
        body_text: str = None
    ) -> Dict[str, Any]:
        """
        단일 이메일 발송

        Args:
            to: 수신 이메일
            subject: 제목
            body_html: HTML 본문
            body_text: 텍스트 본문 (None이면 HTML에서 추출)
        """
        if not self.smtp_host or not self.smtp_user:
            logger.warning("SMTP not configured")
            return {"success": False, "error": "SMTP not configured"}

        try:
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{self.from_name} <{self.from_email}>"
            message["To"] = to

            # 텍스트 버전
            if body_text:
                part1 = MIMEText(body_text, "plain", "utf-8")
                message.attach(part1)

            # HTML 버전
            part2 = MIMEText(body_html, "html", "utf-8")
            message.attach(part2)

            await aiosmtplib.send(
                message,
                hostname=self.smtp_host,
                port=self.smtp_port,
                username=self.smtp_user,
                password=self.smtp_password,
                start_tls=True
            )

            return {"success": True, "status": "SENT"}

        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return {"success": False, "error": str(e), "status": "FAILED"}


class Campaign:
    """캠페인 데이터"""
    def __init__(
        self,
        id: str = None,
        name: str = "",
        campaign_type: str = "SMS",  # SMS, EMAIL, BOTH
        target_grade: str = "HOT",   # HOT, WARM, COLD
        message_template: str = "",
        email_subject: str = "",
        email_body: str = "",
        scheduled_date: datetime = None,
        status: CampaignStatus = CampaignStatus.DRAFT,
    ):
        self.id = id or str(uuid.uuid4())
        self.name = name
        self.campaign_type = campaign_type
        self.target_grade = target_grade
        self.message_template = message_template
        self.email_subject = email_subject
        self.email_body = email_body
        self.scheduled_date = scheduled_date
        self.status = status
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

        # 통계
        self.total_targets = 0
        self.sent_count = 0
        self.delivered_count = 0
        self.failed_count = 0
        self.response_count = 0  # 링크 클릭 or 회신


class OutboundCampaignService:
    """아웃바운드 캠페인 관리 서비스"""

    def __init__(self):
        self.solapi = SolapiService()
        self.email = EmailService()

    async def send_sms_to_prospect(
        self,
        phone: str,
        message: str
    ) -> Dict[str, Any]:
        """타겟에게 SMS 발송"""
        return await self.solapi.send_sms(phone, message)

    async def send_email_to_prospect(
        self,
        email: str,
        subject: str,
        body_html: str
    ) -> Dict[str, Any]:
        """타겟에게 이메일 발송"""
        return await self.email.send_email(email, subject, body_html)

    async def run_sms_campaign(
        self,
        campaign: Campaign,
        targets: List[Dict[str, Any]],
        batch_size: int = 100,
        delay_between_batches: float = 1.0
    ) -> Dict[str, Any]:
        """
        SMS 캠페인 실행

        Args:
            campaign: 캠페인 정보
            targets: 타겟 목록 [{"phone": "010xxx", "name": "xxx", ...}]
            batch_size: 배치 크기
            delay_between_batches: 배치 간 딜레이 (초)

        Returns:
            실행 결과
        """
        campaign.status = CampaignStatus.RUNNING
        campaign.total_targets = len(targets)

        results = {
            "campaign_id": campaign.id,
            "total": len(targets),
            "success": 0,
            "failed": 0,
            "details": []
        }

        # 배치 처리
        for i in range(0, len(targets), batch_size):
            batch = targets[i:i + batch_size]

            messages = []
            for target in batch:
                # 템플릿에 변수 치환
                message = self._render_template(
                    campaign.message_template,
                    target
                )
                messages.append({
                    "to": target["phone"],
                    "text": message
                })

            # 대량 발송
            batch_result = await self.solapi.send_bulk_sms(
                messages,
                campaign.scheduled_date
            )

            if batch_result["success"]:
                results["success"] += batch_result.get("success_count", len(batch))
                results["failed"] += batch_result.get("fail_count", 0)
            else:
                results["failed"] += len(batch)

            results["details"].append(batch_result)

            # Rate limiting
            if i + batch_size < len(targets):
                await asyncio.sleep(delay_between_batches)

        campaign.sent_count = results["success"]
        campaign.failed_count = results["failed"]
        campaign.status = CampaignStatus.COMPLETED
        campaign.updated_at = datetime.utcnow()

        return results

    async def run_email_campaign(
        self,
        campaign: Campaign,
        targets: List[Dict[str, Any]],
        delay_between_emails: float = 0.5
    ) -> Dict[str, Any]:
        """
        이메일 캠페인 실행

        Args:
            campaign: 캠페인 정보
            targets: 타겟 목록 [{"email": "xxx@xxx", "name": "xxx", ...}]
            delay_between_emails: 이메일 간 딜레이 (초)
        """
        campaign.status = CampaignStatus.RUNNING
        campaign.total_targets = len(targets)

        results = {
            "campaign_id": campaign.id,
            "total": len(targets),
            "success": 0,
            "failed": 0,
            "details": []
        }

        for target in targets:
            # 템플릿에 변수 치환
            subject = self._render_template(campaign.email_subject, target)
            body = self._render_template(campaign.email_body, target)

            result = await self.email.send_email(
                target.get("email"),
                subject,
                body
            )

            if result["success"]:
                results["success"] += 1
            else:
                results["failed"] += 1

            results["details"].append({
                "email": target.get("email"),
                **result
            })

            await asyncio.sleep(delay_between_emails)

        campaign.sent_count = results["success"]
        campaign.failed_count = results["failed"]
        campaign.status = CampaignStatus.COMPLETED
        campaign.updated_at = datetime.utcnow()

        return results

    def _render_template(self, template: str, data: Dict[str, Any]) -> str:
        """템플릿에 변수 치환"""
        result = template
        for key, value in data.items():
            result = result.replace(f"{{{{{key}}}}}", str(value))
        return result

    def create_pharmacy_sms_template(self) -> str:
        """약국 대상 SMS 템플릿"""
        return """안녕하세요, {{region}} {{name}} 원장님

약국 양도/승계에 관심 있으시면 무료로 매물 등록해드립니다.

✓ 익명 매물 등록 (정보 보호)
✓ 검증된 매수자 매칭
✓ 에스크로 안전거래
✓ 첫 3개월 수수료 0%

▶ 무료등록: medimatch.kr/p

수신거부 080-xxxx-xxxx"""

    def create_pharmacy_email_template(self) -> Dict[str, str]:
        """약국 대상 이메일 템플릿"""
        subject = "[메디매치] {{name}} 원장님, 약국 양도 생각 있으시면 무료로 등록해드립니다"

        body = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Noto Sans KR', sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; background: #f9fafb; }
        .benefits { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .benefit-item { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .cta-button { display: inline-block; background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>메디매치</h1>
            <p>약사님을 위한 안전한 약국 거래 플랫폼</p>
        </div>
        <div class="content">
            <h2>{{name}} 원장님, 안녕하세요</h2>
            <p>{{years_operated}}년간 {{region}}에서 약국을 운영하셨군요.</p>
            <p>혹시 약국 양도나 승계에 대해 생각해보신 적 있으신가요?</p>

            <div class="benefits">
                <h3>메디매치가 도와드리는 것들</h3>
                <div class="benefit-item">✓ <strong>익명 매물 등록</strong> - 민감한 정보는 매칭 전까지 비공개</div>
                <div class="benefit-item">✓ <strong>검증된 매수 희망자</strong> - 자격 검증된 약사님들만 매칭</div>
                <div class="benefit-item">✓ <strong>에스크로 안전거래</strong> - 권리금, 인수금 안전 보관</div>
                <div class="benefit-item">✓ <strong>전문가 지원</strong> - 약국 M&A 전문 컨설팅</div>
            </div>

            <p><strong>지금 등록하시면 첫 3개월 수수료 무료!</strong></p>

            <a href="https://medimatch.kr/pharmacy-match/listings/new" class="cta-button">
                무료로 매물 등록하기
            </a>

            <p>궁금하신 점이 있으시면 언제든 연락 주세요.</p>
            <p>전화: 02-xxxx-xxxx<br>이메일: support@medimatch.kr</p>
        </div>
        <div class="footer">
            <p>본 메일은 정보 제공 목적으로 발송되었습니다.</p>
            <p>수신을 원하지 않으시면 <a href="#">수신거부</a>를 클릭해주세요.</p>
            <p>© 2024 메디매치. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
"""
        return {"subject": subject, "body": body}


# 싱글톤 인스턴스
outbound_campaign_service = OutboundCampaignService()
solapi_service = SolapiService()
email_service = EmailService()
