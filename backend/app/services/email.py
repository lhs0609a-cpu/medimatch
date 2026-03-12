"""
이메일 발송 서비스 (async SMTP)

- aiosmtplib 기반 비동기 이메일 전송
- 관리유지비 관련 이메일 템플릿 함수들
"""
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_email(
    to_email: str,
    subject: str,
    html_body: str,
    from_name: Optional[str] = None,
    from_email: Optional[str] = None,
) -> bool:
    """SMTP를 통한 이메일 발송"""
    try:
        import aiosmtplib
    except ImportError:
        logger.warning("aiosmtplib not installed, skipping email send")
        return False

    smtp_host = settings.SMTP_HOST
    smtp_port = settings.SMTP_PORT
    smtp_user = settings.SMTP_USER
    smtp_password = settings.SMTP_PASSWORD

    if not smtp_host or not smtp_user:
        logger.warning("SMTP not configured, skipping email send")
        return False

    sender_name = from_name or settings.SMTP_FROM_NAME
    sender_email = from_email or settings.SMTP_FROM_EMAIL

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{sender_name} <{sender_email}>"
    msg["To"] = to_email

    msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=smtp_host,
            port=smtp_port,
            username=smtp_user,
            password=smtp_password,
            start_tls=True,
        )
        logger.info(f"Email sent to {to_email}: {subject}")
        return True
    except Exception as e:
        logger.exception(f"Failed to send email to {to_email}: {e}")
        return False


# ============================================================
# HTML 템플릿 공통
# ============================================================

def _base_template(title: str, body_html: str) -> str:
    """공통 이메일 HTML 래퍼"""
    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>{title}</title></head>
<body style="margin:0;padding:0;font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;background:#f5f5f5;">
<div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
<div style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:32px 24px;text-align:center;">
<h1 style="color:#fff;margin:0;font-size:22px;">메디플라톤</h1>
<p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">{title}</p>
</div>
<div style="padding:32px 24px;">
{body_html}
</div>
<div style="background:#f9fafb;padding:16px 24px;text-align:center;font-size:12px;color:#9ca3af;">
&copy; 메디플라톤 | 본 메일은 발신 전용입니다.
</div>
</div>
</body>
</html>"""


# ============================================================
# 관리유지비 이메일 템플릿
# ============================================================

async def send_maintenance_invite(
    to_email: str,
    contact_person: str,
    project_name: str,
    monthly_amount: int,
    setup_url: str,
) -> bool:
    """카드 등록 초대 이메일"""
    amount_str = f"{monthly_amount:,}원"
    body = f"""
<p style="font-size:16px;color:#111;line-height:1.6;">
안녕하세요, <strong>{contact_person}</strong>님.
</p>
<p style="font-size:15px;color:#374151;line-height:1.6;">
<strong>{project_name}</strong> 관리유지비 정기결제 안내드립니다.
</p>
<div style="background:#f0f4ff;border-radius:8px;padding:20px;margin:24px 0;">
<p style="margin:0 0 8px;font-size:14px;color:#6b7280;">월 관리비</p>
<p style="margin:0;font-size:28px;font-weight:700;color:#2563eb;">{amount_str}</p>
</div>
<p style="font-size:15px;color:#374151;line-height:1.6;">
아래 버튼을 눌러 결제 카드를 등록해주시면, 매월 자동으로 결제됩니다.
</p>
<div style="text-align:center;margin:32px 0;">
<a href="{setup_url}" style="display:inline-block;background:#2563eb;color:#fff;padding:14px 40px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:600;">
카드 등록하기
</a>
</div>
<p style="font-size:13px;color:#9ca3af;">등록 후 첫 결제가 즉시 진행됩니다.</p>
"""
    return await send_email(
        to_email=to_email,
        subject=f"[메디플라톤] {project_name} 관리유지비 결제 안내",
        html_body=_base_template("관리유지비 결제 안내", body),
    )


async def send_payment_success(
    to_email: str,
    contact_person: str,
    project_name: str,
    amount: int,
    card_number: str,
    next_billing_date: str,
) -> bool:
    """결제 성공 안내 이메일"""
    amount_str = f"{amount:,}원"
    body = f"""
<p style="font-size:16px;color:#111;line-height:1.6;">
안녕하세요, <strong>{contact_person}</strong>님.
</p>
<p style="font-size:15px;color:#374151;line-height:1.6;">
<strong>{project_name}</strong> 관리유지비가 정상 결제되었습니다.
</p>
<div style="background:#f0fdf4;border-radius:8px;padding:20px;margin:24px 0;">
<table style="width:100%;font-size:14px;color:#374151;">
<tr><td style="padding:6px 0;color:#6b7280;">결제 금액</td><td style="padding:6px 0;text-align:right;font-weight:600;">{amount_str}</td></tr>
<tr><td style="padding:6px 0;color:#6b7280;">결제 카드</td><td style="padding:6px 0;text-align:right;">{card_number}</td></tr>
<tr><td style="padding:6px 0;color:#6b7280;">다음 결제일</td><td style="padding:6px 0;text-align:right;">{next_billing_date}</td></tr>
</table>
</div>
<p style="font-size:13px;color:#9ca3af;">결제 내역은 마이페이지에서 확인하실 수 있습니다.</p>
"""
    return await send_email(
        to_email=to_email,
        subject=f"[메디플라톤] {project_name} 관리비 결제 완료",
        html_body=_base_template("결제 완료 안내", body),
    )


async def send_payment_failed(
    to_email: str,
    contact_person: str,
    project_name: str,
    amount: int,
    retry_count: int,
    max_retry: int,
) -> bool:
    """결제 실패 안내 이메일"""
    amount_str = f"{amount:,}원"
    remaining = max_retry - retry_count
    body = f"""
<p style="font-size:16px;color:#111;line-height:1.6;">
안녕하세요, <strong>{contact_person}</strong>님.
</p>
<p style="font-size:15px;color:#dc2626;line-height:1.6;">
<strong>{project_name}</strong> 관리유지비 {amount_str} 결제에 실패했습니다.
</p>
<div style="background:#fef2f2;border-radius:8px;padding:20px;margin:24px 0;">
<p style="margin:0;font-size:14px;color:#991b1b;">
재시도 {retry_count}/{max_retry}회 — 남은 시도 {remaining}회
</p>
<p style="margin:8px 0 0;font-size:13px;color:#b91c1c;">
{remaining}회 실패 시 서비스가 자동 정지됩니다.
</p>
</div>
<p style="font-size:15px;color:#374151;line-height:1.6;">
카드 한도나 유효기간을 확인하시고, 필요 시 카드를 변경해주세요.
</p>
"""
    return await send_email(
        to_email=to_email,
        subject=f"[메디플라톤] {project_name} 관리비 결제 실패 안내",
        html_body=_base_template("결제 실패 안내", body),
    )


async def send_service_suspended(
    to_email: str,
    contact_person: str,
    project_name: str,
) -> bool:
    """서비스 정지 안내 이메일"""
    body = f"""
<p style="font-size:16px;color:#111;line-height:1.6;">
안녕하세요, <strong>{contact_person}</strong>님.
</p>
<p style="font-size:15px;color:#dc2626;line-height:1.6;">
<strong>{project_name}</strong> 관리비가 3회 연속 결제 실패하여 서비스가 <strong>정지</strong>되었습니다.
</p>
<div style="background:#fef2f2;border-radius:8px;padding:20px;margin:24px 0;">
<p style="margin:0;font-size:14px;color:#991b1b;">서비스 정지 상태에서는 웹사이트 관리 및 업데이트가 중단됩니다.</p>
</div>
<p style="font-size:15px;color:#374151;line-height:1.6;">
카드를 변경하거나 미납 결제를 완료하시면 서비스가 재개됩니다.
</p>
"""
    return await send_email(
        to_email=to_email,
        subject=f"[메디플라톤] {project_name} 서비스 정지 안내",
        html_body=_base_template("서비스 정지 안내", body),
    )


async def send_payment_reminder(
    to_email: str,
    contact_person: str,
    project_name: str,
    setup_url: str,
    days_since: int,
) -> bool:
    """카드 등록 리마인더 이메일"""
    body = f"""
<p style="font-size:16px;color:#111;line-height:1.6;">
안녕하세요, <strong>{contact_person}</strong>님.
</p>
<p style="font-size:15px;color:#374151;line-height:1.6;">
<strong>{project_name}</strong> 관리유지비 결제 카드가 아직 등록되지 않았습니다.
(계약 생성 후 {days_since}일 경과)
</p>
<div style="text-align:center;margin:32px 0;">
<a href="{setup_url}" style="display:inline-block;background:#2563eb;color:#fff;padding:14px 40px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:600;">
카드 등록하기
</a>
</div>
"""
    return await send_email(
        to_email=to_email,
        subject=f"[메디플라톤] {project_name} 카드 등록 안내 (리마인더)",
        html_body=_base_template("카드 등록 안내", body),
    )


async def send_request_reply(
    to_email: str,
    contact_person: str,
    project_name: str,
    request_title: str,
    reply_preview: str,
) -> bool:
    """요청 게시판 답변 알림 이메일"""
    body = f"""
<p style="font-size:16px;color:#111;line-height:1.6;">
안녕하세요, <strong>{contact_person}</strong>님.
</p>
<p style="font-size:15px;color:#374151;line-height:1.6;">
<strong>{project_name}</strong> 요청사항에 답변이 등록되었습니다.
</p>
<div style="background:#f0f4ff;border-radius:8px;padding:20px;margin:24px 0;">
<p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#1e40af;">{request_title}</p>
<p style="margin:0;font-size:14px;color:#374151;line-height:1.5;">{reply_preview[:200]}</p>
</div>
<p style="font-size:13px;color:#9ca3af;">전체 내용은 마이페이지 > 요청 게시판에서 확인하세요.</p>
"""
    return await send_email(
        to_email=to_email,
        subject=f"[메디플라톤] {request_title} — 답변 알림",
        html_body=_base_template("요청 답변 알림", body),
    )
