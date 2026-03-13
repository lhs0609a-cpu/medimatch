"""
아웃바운드 캠페인 API 엔드포인트
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
import uuid

from ...core.database import get_db
from ...core.security import get_current_user
from ...models.user import User
from ...models.campaign import Campaign, CampaignStatus, CampaignType

router = APIRouter()


# ===== Schemas =====

class CampaignCreate(BaseModel):
    name: str
    campaign_type: str = Field(..., pattern="^(SMS|EMAIL)$")
    target_grade: str = Field(..., pattern="^(HOT|WARM|COLD)$")
    message_template: Optional[str] = None
    email_subject: Optional[str] = None
    email_body: Optional[str] = None
    scheduled_time: Optional[str] = None  # ISO format
    limit: int = Field(100, ge=1, le=1000)


class CampaignResponse(BaseModel):
    id: str
    name: str
    campaign_type: str
    target_grade: str
    status: str
    scheduled_time: Optional[str] = None
    total_targets: int = 0
    sent_count: int = 0
    failed_count: int = 0
    created_at: str


class CampaignStatsResponse(BaseModel):
    total_campaigns: int
    total_sent: int
    total_delivered: int
    total_failed: int
    sms_balance: int
    by_grade: dict
    by_status: dict


class SMSTemplateResponse(BaseModel):
    template: str


class EmailTemplateResponse(BaseModel):
    subject: str
    body: str


class SendSMSRequest(BaseModel):
    phone: str
    message: str


# ===== Endpoints =====

@router.post("/", response_model=CampaignResponse)
async def create_campaign(
    campaign_data: CampaignCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """캠페인 생성 및 실행"""
    from ...tasks.campaign_tasks import run_sms_campaign, run_email_campaign, schedule_campaign

    campaign_id = str(uuid.uuid4())

    if campaign_data.scheduled_time:
        # 예약 발송
        result = schedule_campaign.delay(
            campaign_type=campaign_data.campaign_type,
            target_grade=campaign_data.target_grade,
            scheduled_time=campaign_data.scheduled_time,
            limit=campaign_data.limit
        )
        status = CampaignStatus.SCHEDULED
    else:
        # 즉시 발송
        if campaign_data.campaign_type == "SMS":
            task = run_sms_campaign.delay(
                campaign_id=campaign_id,
                target_grade=campaign_data.target_grade,
                limit=campaign_data.limit
            )
        else:
            task = run_email_campaign.delay(
                campaign_id=campaign_id,
                target_grade=campaign_data.target_grade,
                limit=campaign_data.limit
            )
        status = CampaignStatus.RUNNING

    now = datetime.utcnow()

    # DB에 캠페인 저장
    campaign = Campaign(
        id=campaign_id,
        user_id=current_user.id,
        name=campaign_data.name,
        campaign_type=CampaignType(campaign_data.campaign_type),
        target_grade=campaign_data.target_grade,
        status=status,
        scheduled_time=campaign_data.scheduled_time,
        total_targets=campaign_data.limit,
        message_template=campaign_data.message_template,
        created_at=now,
    )
    db.add(campaign)
    await db.flush()

    return CampaignResponse(
        id=campaign_id,
        name=campaign_data.name,
        campaign_type=campaign_data.campaign_type,
        target_grade=campaign_data.target_grade,
        status=status.value,
        scheduled_time=campaign_data.scheduled_time,
        total_targets=campaign_data.limit,
        created_at=now.isoformat()
    )


@router.get("/stats", response_model=CampaignStatsResponse)
async def get_campaign_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """캠페인 통계 조회"""
    user_filter = Campaign.user_id == current_user.id

    # 전체 통계
    total_q = await db.execute(
        select(func.count()).select_from(Campaign).where(user_filter)
    )
    total_campaigns = total_q.scalar() or 0

    sent_q = await db.execute(
        select(func.coalesce(func.sum(Campaign.sent_count), 0))
        .select_from(Campaign).where(user_filter)
    )
    total_sent = sent_q.scalar() or 0

    delivered_q = await db.execute(
        select(func.coalesce(func.sum(Campaign.delivered_count), 0))
        .select_from(Campaign).where(user_filter)
    )
    total_delivered = delivered_q.scalar() or 0

    failed_q = await db.execute(
        select(func.coalesce(func.sum(Campaign.failed_count), 0))
        .select_from(Campaign).where(user_filter)
    )
    total_failed = failed_q.scalar() or 0

    # 등급별 캠페인 수
    by_grade = {"HOT": 0, "WARM": 0, "COLD": 0}
    grade_q = await db.execute(
        select(Campaign.target_grade, func.count())
        .where(user_filter)
        .group_by(Campaign.target_grade)
    )
    for grade, cnt in grade_q.all():
        if grade in by_grade:
            by_grade[grade] = cnt

    # 상태별 캠페인 수
    by_status = {"COMPLETED": 0, "RUNNING": 0, "SCHEDULED": 0}
    status_q = await db.execute(
        select(Campaign.status, func.count())
        .where(user_filter)
        .group_by(Campaign.status)
    )
    for st, cnt in status_q.all():
        st_val = st.value if hasattr(st, "value") else str(st)
        if st_val in by_status:
            by_status[st_val] = cnt

    # SMS 잔액 조회
    sms_balance = 0
    try:
        from ...services.outbound_campaign import solapi_service
        balance_result = await solapi_service.get_balance()
        sms_balance = balance_result.get("balance", 0) if balance_result.get("success") else 0
    except Exception:
        pass

    return CampaignStatsResponse(
        total_campaigns=total_campaigns,
        total_sent=total_sent,
        total_delivered=total_delivered,
        total_failed=total_failed,
        sms_balance=sms_balance,
        by_grade=by_grade,
        by_status=by_status,
    )


@router.get("/templates/sms", response_model=SMSTemplateResponse)
async def get_sms_template(
    current_user: User = Depends(get_current_user),
):
    """SMS 템플릿 조회"""
    from ...services.outbound_campaign import outbound_campaign_service

    template = outbound_campaign_service.create_pharmacy_sms_template()
    return SMSTemplateResponse(template=template)


@router.get("/templates/email", response_model=EmailTemplateResponse)
async def get_email_template(
    current_user: User = Depends(get_current_user),
):
    """이메일 템플릿 조회"""
    from ...services.outbound_campaign import outbound_campaign_service

    template = outbound_campaign_service.create_pharmacy_email_template()
    return EmailTemplateResponse(
        subject=template["subject"],
        body=template["body"]
    )


@router.post("/send-sms")
async def send_single_sms(
    request: SendSMSRequest,
    current_user: User = Depends(get_current_user),
):
    """단일 SMS 발송"""
    from ...services.outbound_campaign import solapi_service

    result = await solapi_service.send_sms(request.phone, request.message)

    if result.get("success"):
        return {
            "status": "sent",
            "message_id": result.get("message_id"),
            "phone": request.phone
        }
    else:
        raise HTTPException(
            status_code=500,
            detail=result.get("error", "SMS send failed")
        )


@router.get("/balance")
async def get_sms_balance(
    current_user: User = Depends(get_current_user),
):
    """SMS 잔액 조회"""
    from ...services.outbound_campaign import solapi_service

    result = await solapi_service.get_balance()

    if result.get("success"):
        return {
            "balance": result.get("balance", 0),
            "point": result.get("point", 0)
        }
    else:
        return {
            "balance": 0,
            "point": 0,
            "error": result.get("error")
        }


@router.post("/preview")
async def preview_message(
    template: str,
    target_ykiho: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """메시지 미리보기"""
    from sqlalchemy import text

    # 샘플 데이터
    sample_data = {
        "name": "OO약국",
        "region": "강남구",
        "years_operated": "25",
        "phone": "010-1234-5678",
    }

    if target_ykiho:
        try:
            result = await db.execute(
                text("""
                    SELECT name, address, years_operated, phone
                    FROM pharmacy_prospect_targets
                    WHERE ykiho = :ykiho
                """),
                {"ykiho": target_ykiho}
            )
            row = result.fetchone()
            if row:
                address_parts = row[1].split() if row[1] else []
                sample_data = {
                    "name": row[0] or "OO약국",
                    "region": address_parts[1] if len(address_parts) > 1 else "",
                    "years_operated": str(row[2] or 0),
                    "phone": row[3] or "",
                }
        except:
            pass

    # 템플릿 렌더링
    rendered = template
    for key, value in sample_data.items():
        rendered = rendered.replace(f"{{{{{key}}}}}", str(value))

    return {
        "original": template,
        "rendered": rendered,
        "sample_data": sample_data,
        "character_count": len(rendered),
        "sms_type": "LMS" if len(rendered) > 90 else "SMS"
    }


@router.get("/history")
async def get_campaign_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """캠페인 발송 이력 조회"""
    user_filter = Campaign.user_id == current_user.id

    # 총 건수
    total_q = await db.execute(
        select(func.count()).select_from(Campaign).where(user_filter)
    )
    total = total_q.scalar() or 0

    # 페이지네이션 조회
    offset = (page - 1) * page_size
    rows_q = await db.execute(
        select(Campaign)
        .where(user_filter)
        .order_by(Campaign.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    rows = rows_q.scalars().all()

    items = [
        {
            "id": c.id,
            "name": c.name,
            "campaign_type": c.campaign_type.value if hasattr(c.campaign_type, "value") else str(c.campaign_type),
            "target_grade": c.target_grade,
            "status": c.status.value if hasattr(c.status, "value") else str(c.status),
            "scheduled_time": c.scheduled_time,
            "total_targets": c.total_targets or 0,
            "sent_count": c.sent_count or 0,
            "failed_count": c.failed_count or 0,
            "created_at": c.created_at.isoformat() if c.created_at else "",
        }
        for c in rows
    ]

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }
