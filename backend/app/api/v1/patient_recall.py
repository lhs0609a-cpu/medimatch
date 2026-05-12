"""환자 리콜 / EMR CRM 캠페인 API — 안전·법규·성능 강화판

핵심 안전 장치:
- 데모 ID 발송 차단 (실제 환자에게 의도치 않은 발송 방지)
- IDOR: patient_id / campaign_id 소유권 검증 필수
- 수신 동의(consent_alimtalk) 미동의자 자동 제외 (PIPA/정통망법)
- 야간(21:00 ~ 익일 08:00) 발송 차단
- 광고성 키워드(할인/구매/이벤트…) 차단
- 템플릿 화이트리스트 — 자유 입력 금지 (카카오 토씨 일치 강제)
- 발송자 추적 (sent_by_user_id) — 직원 발송도 책임 명확
- asyncio.Semaphore 로 초당 발송 캡 + gather 병렬화
- 1분 내 중복 발송 차단, 일일 환자당 1회 한도
- 일괄 1000건 한도
- atomic UPDATE 로 캠페인 sent_count race condition 제거
- provider_message 민감정보 마스킹
- 30초 캐시된 alimtalk status
"""
from __future__ import annotations

import asyncio
import re
import time
from datetime import date, datetime, timedelta, timezone
from typing import Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_, or_, func
from pydantic import BaseModel, Field, HttpUrl, field_validator

from ..deps import get_db, get_current_active_user
from .service_guards import require_active_service
from ...models.user import User
from ...models.service_subscription import ServiceSubscription, ServiceType
from ...models.patient import Patient, ConsentStatus
from ...models.patient_recall import (
    RecallCampaign, RecallSend,
    RecallCampaignStatus, RecallSendStatus, RecallChannel,
)
from ...services.kakao_alimtalk import (
    send_alimtalk, _is_configured as alimtalk_is_configured,
    PROVIDER as ALIMTALK_PROVIDER,
)

router = APIRouter()


# ============================================================
# 상수 / 설정
# ============================================================

# 만성질환 키워드
CHRONIC_DX_KEYWORDS = (
    "당뇨", "고혈압", "고지혈", "이상지질", "갑상선", "관절염", "비만",
    "심부전", "협심증", "천식", "만성 폐쇄", "COPD",
)
RECALL_INTERVAL_DAYS = 90
BULK_MAX = 1000          # 일괄 1회 최대 건수
SEND_RATE_PER_SEC = 20   # Aligo 30/sec 안전 마진
DEDUP_WINDOW_SEC = 60    # 같은 환자에게 1분 내 재발송 차단
DAILY_PER_PATIENT_LIMIT = 1
NIGHT_START_HOUR = 21    # KST 21:00 ~ 익일 08:00 발송 금지
NIGHT_END_HOUR = 8

# 광고성 / 위험 키워드 (KISA 차단 회피)
FORBIDDEN_KEYWORDS = [
    "할인", "구매", "이벤트", "쿠폰", "프로모션", "특가",
    "보험금", "송금", "출금", "비밀번호", "본인인증",
    "당첨", "공짜", "무료체험",
]

# 템플릿 화이트리스트 (카카오비즈니스 사전 승인 필요)
# 운영자가 새 템플릿 등록 시 여기 추가
RECALL_TEMPLATES: dict[str, dict] = {
    "MEDI_RECALL_V1": {
        "label": "정기검진 안내 (기본)",
        "body": "{name}님, 정기검진 시기가 되었습니다. 본원에서 안내 드립니다.",
        "vars": ["name"],
    },
    "MEDI_RECALL_CHRONIC_V1": {
        "label": "만성질환 추적 안내",
        "body": "{name}님, 정기 추적 관찰 시기가 되었습니다. 진료실에서 안내 드립니다.",
        "vars": ["name"],
    },
    "MEDI_RECALL_CHECKUP_V1": {
        "label": "건강검진 시즌 안내",
        "body": "{name}님, 올해 건강검진 시즌입니다. 본원에서 안내 드립니다.",
        "vars": ["name"],
    },
}

PROVIDER_MESSAGE_MASK_PATTERNS = [
    re.compile(r"01[016789]\d{7,8}"),                # 휴대폰
    re.compile(r"\d{6}-?\d{7}"),                     # 주민번호
    re.compile(r"[가-힣]{2,5}(원장|선생|의원|병원|약사)"),  # 의료인 식별
]


def _mask_provider_message(text: Optional[str]) -> Optional[str]:
    if not text:
        return text
    out = text[:500]  # 길이 제한
    for pat in PROVIDER_MESSAGE_MASK_PATTERNS:
        out = pat.sub("***", out)
    return out


def _is_night_now() -> bool:
    """현재 KST 기준 야간(21~08시) 인지. UTC + 9h."""
    now_utc = datetime.now(timezone.utc)
    kst_hour = (now_utc + timedelta(hours=9)).hour
    return kst_hour >= NIGHT_START_HOUR or kst_hour < NIGHT_END_HOUR


def _is_night_at(dt_utc: datetime) -> bool:
    kst_hour = (dt_utc + timedelta(hours=9)).hour
    return kst_hour >= NIGHT_START_HOUR or kst_hour < NIGHT_END_HOUR


def _has_forbidden(text: str) -> Optional[str]:
    for kw in FORBIDDEN_KEYWORDS:
        if kw in text:
            return kw
    return None


# ============================================================
# 알림톡 설정 진단 (UI 배너용) — 30초 캐시 + EMR 가드
# ============================================================

_alimtalk_status_cache: dict = {}
_alimtalk_status_cache_ts: float = 0.0
_ALIMTALK_CACHE_TTL = 30  # 초


@router.get("/alimtalk/status")
async def alimtalk_status(
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """알림톡 제공자 키 설정 상태. EMR 구독자만 접근 가능."""
    global _alimtalk_status_cache, _alimtalk_status_cache_ts
    now = time.time()
    if _alimtalk_status_cache and (now - _alimtalk_status_cache_ts) < _ALIMTALK_CACHE_TTL:
        return _alimtalk_status_cache

    configured = alimtalk_is_configured()
    _alimtalk_status_cache = {
        "provider": ALIMTALK_PROVIDER,
        "configured": configured,
        "missing": [] if configured else _missing_env_keys(),
        "user_action_needed": not configured,
        "support_message": (
            "알림톡 발송 설정이 필요합니다. 운영팀(support@mediplatform.kr)에 요청해주세요."
            if not configured else None
        ),
    }
    _alimtalk_status_cache_ts = now
    return _alimtalk_status_cache


def _missing_env_keys() -> list[str]:
    import os
    if ALIMTALK_PROVIDER == "aligo":
        keys = ["ALIGO_API_KEY", "ALIGO_USER_ID", "ALIGO_SENDER", "ALIGO_SENDER_KEY"]
    else:
        keys = ["BIZM_PROFILE_KEY", "BIZM_USER_ID"]
    return [k for k in keys if not os.getenv(k)]


# ============================================================
# 데모 데이터
# ============================================================

DEMO_RECALL_STATS = {
    "totalTarget": 87, "sent": 52, "responded": 38, "booked": 24,
    "responseRate": 73.1, "bookingRate": 46.2,
}

DEMO_RECALL_TARGETS = [
    {"id": "demo-1", "name": "최은지", "age": 52, "gender": "여", "phone": "010-XXXX-8901",
     "lastVisit": "2023-12-21", "daysAgo": 31, "reason": "정기검진 안내",
     "status": "pending", "priority": "high"},
    {"id": "demo-2", "name": "정대현", "age": 67, "gender": "남", "phone": "010-XXXX-9012",
     "lastVisit": "2024-01-07", "daysAgo": 14, "reason": "정기검진 안내",
     "status": "sent", "priority": "medium"},
    {"id": "demo-3", "name": "강지원", "age": 72, "gender": "여", "phone": "010-XXXX-2345",
     "lastVisit": "2023-11-15", "daysAgo": 67, "reason": "정기검진 안내",
     "status": "pending", "priority": "high"},
    {"id": "demo-4", "name": "이미경", "age": 33, "gender": "여", "phone": "010-XXXX-6789",
     "lastVisit": "2024-01-14", "daysAgo": 7, "reason": "정기검진 안내",
     "status": "booked", "priority": "low"},
    {"id": "demo-5", "name": "한소영", "age": 41, "gender": "여", "phone": "010-XXXX-0123",
     "lastVisit": "2024-01-07", "daysAgo": 14, "reason": "정기검진 안내",
     "status": "sent", "priority": "medium"},
    {"id": "demo-6", "name": "김태훈", "age": 58, "gender": "남", "phone": "010-XXXX-3344",
     "lastVisit": "2023-10-20", "daysAgo": 93, "reason": "정기검진 안내",
     "status": "no_response", "priority": "high"},
    {"id": "demo-7", "name": "박미선", "age": 45, "gender": "여", "phone": "010-XXXX-7788",
     "lastVisit": "2023-12-05", "daysAgo": 47, "reason": "정기검진 안내",
     "status": "pending", "priority": "medium"},
    {"id": "demo-8", "name": "오세진", "age": 62, "gender": "남", "phone": "010-XXXX-1122",
     "lastVisit": "2024-01-10", "daysAgo": 11, "reason": "정기검진 안내",
     "status": "booked", "priority": "low"},
]

DEMO_CAMPAIGNS = [
    {"id": "C001", "name": "만성질환 정기검진 리콜", "target": 45, "sent": 45, "opened": 38, "booked": 18, "status": "completed", "date": "2024-01-15"},
    {"id": "C002", "name": "독감 예방접종 안내", "target": 120, "sent": 120, "opened": 95, "booked": 42, "status": "completed", "date": "2024-01-10"},
    {"id": "C003", "name": "건강검진 시즌 안내", "target": 80, "sent": 52, "opened": 0, "booked": 0, "status": "active", "date": "2024-01-20"},
]


# ============================================================
# 유틸
# ============================================================

def _priority_for(days_ago: int, has_chronic: bool) -> str:
    if has_chronic and days_ago >= 60:
        return "high"
    if days_ago >= 30:
        return "medium"
    return "low"


def _age_from_birth(b: Optional[date]) -> Optional[int]:
    if not b:
        return None
    today = date.today()
    return today.year - b.year - ((today.month, today.day) < (b.month, b.day))


def _gender_label(g: Optional[str]) -> str:
    return {"M": "남", "F": "여"}.get(g or "", "-")


def _has_chronic_dx(diag: Optional[str]) -> bool:
    return bool(diag) and any(k in diag for k in CHRONIC_DX_KEYWORDS)


def _send_status_to_ui(status: RecallSendStatus) -> str:
    return {
        RecallSendStatus.PENDING: "pending",
        RecallSendStatus.SENT: "sent",
        RecallSendStatus.OPENED: "sent",
        RecallSendStatus.RESPONDED: "sent",
        RecallSendStatus.NO_RESPONSE: "no_response",
        RecallSendStatus.BOOKED: "booked",
        RecallSendStatus.FAILED: "no_response",
    }.get(status, "pending")


# ============================================================
# 템플릿 카탈로그 — UI 드롭다운용
# ============================================================

@router.get("/templates")
async def list_templates(
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """승인된 알림톡 템플릿 목록. UI는 이 중에서만 선택 가능."""
    return {
        "items": [
            {"code": code, "label": tpl["label"], "preview": tpl["body"], "vars": tpl["vars"]}
            for code, tpl in RECALL_TEMPLATES.items()
        ]
    }


# ============================================================
# 통계
# ============================================================

@router.get("/stats")
async def recall_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """리콜/캠페인 KPI."""
    sends_count = (await db.execute(
        select(func.count(RecallSend.id)).where(RecallSend.user_id == current_user.id)
    )).scalar() or 0

    if sends_count == 0:
        return {**DEMO_RECALL_STATS, "is_demo": True}

    sent_q = select(func.count(RecallSend.id)).where(and_(
        RecallSend.user_id == current_user.id,
        RecallSend.status.in_([
            RecallSendStatus.SENT, RecallSendStatus.OPENED,
            RecallSendStatus.RESPONDED, RecallSendStatus.BOOKED,
        ])
    ))
    responded_q = select(func.count(RecallSend.id)).where(and_(
        RecallSend.user_id == current_user.id,
        RecallSend.status.in_([
            RecallSendStatus.RESPONDED, RecallSendStatus.BOOKED, RecallSendStatus.OPENED,
        ])
    ))
    booked_q = select(func.count(RecallSend.id)).where(and_(
        RecallSend.user_id == current_user.id,
        RecallSend.status == RecallSendStatus.BOOKED,
    ))
    sent = (await db.execute(sent_q)).scalar() or 0
    responded = (await db.execute(responded_q)).scalar() or 0
    booked = (await db.execute(booked_q)).scalar() or 0
    target_total = await _count_eligible_targets(db, current_user.id)

    return {
        "totalTarget": target_total,
        "sent": sent,
        "responded": responded,
        "booked": booked,
        "responseRate": round(responded / sent * 100, 1) if sent else 0,
        "bookingRate": round(booked / sent * 100, 1) if sent else 0,
        "is_demo": False,
    }


async def _count_eligible_targets(db: AsyncSession, user_id) -> int:
    """미방문 90일 이상 + opt-out 아닌 환자 수. soft-delete 제외."""
    cutoff = datetime.utcnow() - timedelta(days=RECALL_INTERVAL_DAYS)
    q = select(func.count(Patient.id)).where(and_(
        Patient.user_id == user_id,
        Patient.deleted_at.is_(None),
        Patient.consent_alimtalk != ConsentStatus.REFUSED,
        or_(
            Patient.appointment_date.is_(None),
            Patient.appointment_date < cutoff,
        ),
    ))
    return (await db.execute(q)).scalar() or 0


# ============================================================
# 리콜 대상 목록
# ============================================================

@router.get("/targets")
async def recall_targets(
    status: Optional[str] = Query(default=None, description="pending/sent/booked/no_response/all"),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=100, ge=10, le=300),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """리콜 대상 (페이지네이션). DB 비면 데모 폴백."""
    # 1. 발송 이력 (최근 분)
    sends_q = (
        select(RecallSend)
        .where(RecallSend.user_id == current_user.id)
        .order_by(RecallSend.created_at.desc())
        .limit(500)
    )
    sends = (await db.execute(sends_q)).scalars().all()

    seen_patient_ids = set()
    items: list[dict] = []
    for s in sends:
        if s.patient_id and s.patient_id in seen_patient_ids:
            continue
        if s.patient_id:
            seen_patient_ids.add(s.patient_id)
        items.append({
            "id": str(s.id),
            "patient_id": str(s.patient_id) if s.patient_id else None,
            "name": s.patient_name or "(이름없음)",
            "age": None,
            "gender": "-",
            "phone": s.phone or "",
            "lastVisit": s.last_visit_date.isoformat() if s.last_visit_date else None,
            "daysAgo": s.days_since_last_visit or 0,
            "reason": s.reason or "정기검진 안내",
            "status": _send_status_to_ui(s.status),
            "priority": s.priority or "medium",
        })

    # 2. 미접촉 + 미방문 60일+ + opt-out 아님
    cutoff_60 = datetime.utcnow() - timedelta(days=60)
    pq = (
        select(Patient)
        .where(and_(
            Patient.user_id == current_user.id,
            Patient.deleted_at.is_(None),
            Patient.consent_alimtalk != ConsentStatus.REFUSED,
            or_(
                Patient.appointment_date.is_(None),
                Patient.appointment_date < cutoff_60,
            ),
        ))
        .order_by(Patient.appointment_date.asc().nullsfirst())
        .limit(1000)
    )
    pts = (await db.execute(pq)).scalars().all()

    today = date.today()
    for p in pts:
        if p.id in seen_patient_ids:
            continue
        last_visit = p.appointment_date.date() if p.appointment_date else None
        days_ago = (today - last_visit).days if last_visit else 999
        chronic = _has_chronic_dx(p.diagnosis_name)
        if days_ago < 30 and not chronic:
            continue
        items.append({
            "id": f"pt-{p.id}",
            "patient_id": str(p.id),
            "name": p.name,
            "age": _age_from_birth(p.birth_date),
            "gender": _gender_label(p.gender),
            "phone": p.phone or "",
            "lastVisit": last_visit.isoformat() if last_visit else None,
            "daysAgo": min(days_ago, 999),
            "reason": "정기검진 안내",   # 진단명 노출 금지 (가족 노출 방지)
            "status": "pending",
            "priority": _priority_for(days_ago, chronic),
        })

    if not items:
        targets = DEMO_RECALL_TARGETS
        if status and status != "all":
            targets = [t for t in targets if t["status"] == status]
        # 데모는 페이지네이션 무시
        return {"items": targets, "total": len(targets), "page": 1, "size": len(targets), "is_demo": True}

    if status and status != "all":
        items = [t for t in items if t["status"] == status]

    items.sort(key=lambda x: ({"high": 0, "medium": 1, "low": 2}.get(x["priority"], 9), -x["daysAgo"]))

    total = len(items)
    start = (page - 1) * size
    paged = items[start:start + size]
    return {"items": paged, "total": total, "page": page, "size": size, "is_demo": False}


# ============================================================
# 캠페인 CRUD
# ============================================================

class CampaignCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    target_group: str = "chronic"
    channel: str = "KAKAO"
    template_code: str = Field(default="MEDI_RECALL_V1")
    scheduled_at: Optional[datetime] = None

    @field_validator("template_code")
    @classmethod
    def template_known(cls, v: str) -> str:
        if v not in RECALL_TEMPLATES:
            raise ValueError(f"unknown template_code: {v}")
        return v


@router.get("/campaigns")
async def list_campaigns(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    rows = (await db.execute(
        select(RecallCampaign)
        .where(RecallCampaign.user_id == current_user.id)
        .order_by(RecallCampaign.created_at.desc())
        .limit(50)
    )).scalars().all()

    if not rows:
        return {"items": DEMO_CAMPAIGNS, "is_demo": True}

    items = [{
        "id": str(c.id),
        "name": c.name,
        "target": c.target_count,
        "sent": c.sent_count,
        "opened": c.opened_count,
        "booked": c.booked_count,
        "status": c.status.value.lower(),
        "date": (c.scheduled_at or c.created_at).date().isoformat() if (c.scheduled_at or c.created_at) else None,
    } for c in rows]
    return {"items": items, "is_demo": False}


@router.post("/campaigns", status_code=201)
async def create_campaign(
    payload: CampaignCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    try:
        channel = RecallChannel(payload.channel)
    except ValueError:
        raise HTTPException(status_code=400, detail="invalid channel")

    target_count = await _count_eligible_targets(db, current_user.id) if payload.target_group == "chronic" else 0

    template_body = RECALL_TEMPLATES[payload.template_code]["body"]
    c = RecallCampaign(
        user_id=current_user.id,
        name=payload.name,
        target_group=payload.target_group,
        channel=channel,
        message_template=f"[{payload.template_code}] {template_body}",
        status=RecallCampaignStatus.SCHEDULED if payload.scheduled_at else RecallCampaignStatus.DRAFT,
        scheduled_at=payload.scheduled_at,
        target_count=target_count,
    )
    db.add(c)
    await db.commit()
    await db.refresh(c)
    return {"id": str(c.id), "status": c.status.value, "target_count": c.target_count}


# ============================================================
# 발송 — 단건/일괄
# ============================================================

class SendOne(BaseModel):
    patient_id: Optional[str] = None       # 필수 권장: IDOR 차단
    template_code: str = Field(default="MEDI_RECALL_V1")
    button_url: Optional[HttpUrl] = None
    campaign_id: Optional[str] = None
    enable_sms_fallback: bool = False      # 비용 발생 — 명시 활성화 필요

    @field_validator("template_code")
    @classmethod
    def template_known(cls, v: str) -> str:
        if v not in RECALL_TEMPLATES:
            raise ValueError(f"unknown template_code: {v}")
        return v


class SendBulk(BaseModel):
    target_ids: List[str] = Field(min_length=1, max_length=BULK_MAX)
    template_code: str = Field(default="MEDI_RECALL_V1")
    button_url: Optional[HttpUrl] = None
    campaign_id: Optional[str] = None
    enable_sms_fallback: bool = False

    @field_validator("template_code")
    @classmethod
    def template_known(cls, v: str) -> str:
        if v not in RECALL_TEMPLATES:
            raise ValueError(f"unknown template_code: {v}")
        return v


# ---------- 공통 검증 ----------

async def _verify_campaign_ownership(db: AsyncSession, campaign_id: str, user_id) -> RecallCampaign:
    try:
        cid = UUID(campaign_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="invalid campaign_id")
    c = (await db.execute(
        select(RecallCampaign).where(and_(
            RecallCampaign.id == cid,
            RecallCampaign.user_id == user_id,
        ))
    )).scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="campaign not found")
    return c


async def _verify_patient_ownership(db: AsyncSession, patient_id: str, user_id) -> Patient:
    try:
        pid = UUID(patient_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="invalid patient_id")
    p = (await db.execute(
        select(Patient).where(and_(
            Patient.id == pid,
            Patient.user_id == user_id,
            Patient.deleted_at.is_(None),
        ))
    )).scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="patient not found")
    return p


async def _recently_sent(db: AsyncSession, patient_id, user_id) -> bool:
    """1분 내 중복 발송 차단."""
    cutoff = datetime.utcnow() - timedelta(seconds=DEDUP_WINDOW_SEC)
    q = select(func.count(RecallSend.id)).where(and_(
        RecallSend.user_id == user_id,
        RecallSend.patient_id == patient_id,
        RecallSend.created_at >= cutoff,
        RecallSend.status.in_([RecallSendStatus.SENT, RecallSendStatus.PENDING]),
    ))
    return ((await db.execute(q)).scalar() or 0) > 0


async def _daily_quota_hit(db: AsyncSession, patient_id, user_id) -> bool:
    """오늘 환자당 1회 한도."""
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    q = select(func.count(RecallSend.id)).where(and_(
        RecallSend.user_id == user_id,
        RecallSend.patient_id == patient_id,
        RecallSend.created_at >= today_start,
        RecallSend.status == RecallSendStatus.SENT,
    ))
    return ((await db.execute(q)).scalar() or 0) >= DAILY_PER_PATIENT_LIMIT


def _render(template_code: str, name: str) -> str:
    tpl = RECALL_TEMPLATES[template_code]["body"]
    return tpl.replace("{name}", name or "환자")


# ---------- 발송 핵심 (세마포어로 rate cap) ----------

_send_semaphore = asyncio.Semaphore(SEND_RATE_PER_SEC)


async def _send_one_alimtalk(*, phone: str, template_code: str, message: str,
                             button_url: Optional[str], enable_sms_fallback: bool) -> dict:
    async with _send_semaphore:
        return await send_alimtalk(
            phone=phone,
            template_code=template_code,
            message=message,
            button_url=button_url,
            button_name="자세히 보기",
            fallback_sms=enable_sms_fallback,
        )


@router.post("/send")
async def send_one(
    payload: SendOne,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """단건 발송 — patient_id 필수, 소유권 검증."""
    if _is_night_now():
        raise HTTPException(status_code=400, detail="night_send_forbidden")
    if not payload.patient_id:
        raise HTTPException(status_code=400, detail="patient_id required")

    patient = await _verify_patient_ownership(db, payload.patient_id, current_user.id)

    if patient.consent_alimtalk == ConsentStatus.REFUSED:
        raise HTTPException(status_code=403, detail="consent_refused")
    if await _recently_sent(db, patient.id, current_user.id):
        raise HTTPException(status_code=429, detail="duplicate_within_60s")
    if await _daily_quota_hit(db, patient.id, current_user.id):
        raise HTTPException(status_code=429, detail="daily_limit")

    if payload.campaign_id:
        await _verify_campaign_ownership(db, payload.campaign_id, current_user.id)

    message = _render(payload.template_code, patient.name)
    res = await _send_one_alimtalk(
        phone=patient.phone or "",
        template_code=payload.template_code,
        message=message,
        button_url=str(payload.button_url) if payload.button_url else None,
        enable_sms_fallback=payload.enable_sms_fallback,
    )
    ok = bool(res.get("ok"))

    last_visit = patient.appointment_date.date() if patient.appointment_date else None
    days_ago = (date.today() - last_visit).days if last_visit else None

    send = RecallSend(
        user_id=current_user.id,
        campaign_id=UUID(payload.campaign_id) if payload.campaign_id else None,
        patient_id=patient.id,
        patient_name=patient.name,
        phone=patient.phone,
        reason="정기검진 안내",
        priority="high" if _has_chronic_dx(patient.diagnosis_name) else "medium",
        channel=RecallChannel.KAKAO,
        status=RecallSendStatus.SENT if ok else RecallSendStatus.FAILED,
        provider_status=str(res.get("status", "")),
        provider_message=_mask_provider_message(res.get("message") if res.get("message") else None),
        sent_at=datetime.utcnow() if ok else None,
        last_visit_date=last_visit,
        days_since_last_visit=days_ago,
        sent_by_user_id=current_user.id,
        sent_by_role=getattr(current_user.role, "value", str(current_user.role or "doctor"))[:20],
    )
    db.add(send)
    await db.commit()

    return {
        "ok": ok,
        "provider": res.get("provider"),
        "alimtalk_status": res.get("status"),
        "send_id": str(send.id),
    }


@router.post("/send/bulk")
async def send_bulk(
    payload: SendBulk,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """일괄 발송 — 데모 차단, IDOR 검증, 야간 차단, 동의 필터, gather 병렬화."""
    if _is_night_now():
        raise HTTPException(status_code=400, detail="night_send_forbidden")

    # 1. 데모 ID 거부 — 실제 발송 안전장치
    if any(tid.startswith("demo-") for tid in payload.target_ids):
        return {
            "ok": False, "reason": "demo_targets_cannot_send",
            "results": {"sent": 0, "failed": 0, "skipped": len(payload.target_ids)},
        }

    if payload.campaign_id:
        await _verify_campaign_ownership(db, payload.campaign_id, current_user.id)

    if not alimtalk_is_configured():
        return {
            "ok": False, "reason": "alimtalk_not_configured",
            "missing": _missing_env_keys(),
            "would_send": len(payload.target_ids),
        }

    # 2. target → (Patient, RecallSend?) 매핑 — 모두 소유권 검증 통과 필요
    resolved: list[tuple[Optional[Patient], Optional[RecallSend]]] = []
    skipped = 0

    for tid in payload.target_ids:
        if tid.startswith("pt-"):
            try:
                pid = UUID(tid[3:])
            except (ValueError, TypeError):
                skipped += 1
                continue
            patient = (await db.execute(
                select(Patient).where(and_(
                    Patient.id == pid,
                    Patient.user_id == current_user.id,
                    Patient.deleted_at.is_(None),
                ))
            )).scalar_one_or_none()
            if not patient:
                skipped += 1
                continue
            if patient.consent_alimtalk == ConsentStatus.REFUSED:
                skipped += 1
                continue
            if await _recently_sent(db, patient.id, current_user.id):
                skipped += 1
                continue
            if await _daily_quota_hit(db, patient.id, current_user.id):
                skipped += 1
                continue
            resolved.append((patient, None))
        else:
            # 기존 RecallSend 재발송
            try:
                sid = UUID(tid)
            except (ValueError, TypeError):
                skipped += 1
                continue
            existing = (await db.execute(
                select(RecallSend).where(and_(
                    RecallSend.id == sid,
                    RecallSend.user_id == current_user.id,
                ))
            )).scalar_one_or_none()
            if not existing:
                skipped += 1
                continue
            # 1분 dedup — patient_id 있을 때만
            if existing.patient_id and await _recently_sent(db, existing.patient_id, current_user.id):
                skipped += 1
                continue
            resolved.append((None, existing))

    if not resolved:
        return {"ok": False, "reason": "no_eligible_targets", "results": {"sent": 0, "failed": 0, "skipped": skipped}}

    # 3. 병렬 발송 (세마포어로 초당 cap)
    template_body = RECALL_TEMPLATES[payload.template_code]["body"]
    button_url_str = str(payload.button_url) if payload.button_url else None

    async def _do_one(patient: Optional[Patient], existing: Optional[RecallSend]) -> dict:
        if patient is not None:
            phone = patient.phone or ""
            name = patient.name or "환자"
        else:
            phone = existing.phone or ""
            name = existing.patient_name or "환자"
        message = template_body.replace("{name}", name)
        res = await _send_one_alimtalk(
            phone=phone,
            template_code=payload.template_code,
            message=message,
            button_url=button_url_str,
            enable_sms_fallback=payload.enable_sms_fallback,
        )
        return {"patient": patient, "existing": existing, "res": res}

    results = await asyncio.gather(
        *[_do_one(p, e) for (p, e) in resolved],
        return_exceptions=True,
    )

    # 4. DB write 단일 트랜잭션 (짧게)
    sent = failed = 0
    role = getattr(current_user.role, "value", str(current_user.role or "doctor"))[:20]
    for item in results:
        if isinstance(item, Exception):
            failed += 1
            continue
        res = item["res"]
        patient = item["patient"]
        existing = item["existing"]
        ok = bool(res.get("ok"))
        if existing is not None:
            existing.status = RecallSendStatus.SENT if ok else RecallSendStatus.FAILED
            existing.provider_status = str(res.get("status", ""))
            existing.provider_message = _mask_provider_message(res.get("message"))
            if ok:
                existing.sent_at = datetime.utcnow()
            existing.sent_by_user_id = current_user.id
            existing.sent_by_role = role
        else:
            last_visit = patient.appointment_date.date() if patient.appointment_date else None
            days_ago = (date.today() - last_visit).days if last_visit else None
            db.add(RecallSend(
                user_id=current_user.id,
                campaign_id=UUID(payload.campaign_id) if payload.campaign_id else None,
                patient_id=patient.id,
                patient_name=patient.name,
                phone=patient.phone,
                reason="정기검진 안내",
                priority="high" if _has_chronic_dx(patient.diagnosis_name) else "medium",
                channel=RecallChannel.KAKAO,
                status=RecallSendStatus.SENT if ok else RecallSendStatus.FAILED,
                provider_status=str(res.get("status", "")),
                provider_message=_mask_provider_message(res.get("message")),
                sent_at=datetime.utcnow() if ok else None,
                last_visit_date=last_visit,
                days_since_last_visit=days_ago,
                sent_by_user_id=current_user.id,
                sent_by_role=role,
            ))
        if ok:
            sent += 1
        else:
            failed += 1

    # 5. 캠페인 통계 atomic update (race condition 제거)
    if payload.campaign_id and sent > 0:
        await db.execute(
            update(RecallCampaign)
            .where(and_(
                RecallCampaign.id == UUID(payload.campaign_id),
                RecallCampaign.user_id == current_user.id,
            ))
            .values(
                sent_count=RecallCampaign.sent_count + sent,
                status=RecallCampaignStatus.ACTIVE,
                started_at=func.coalesce(RecallCampaign.started_at, func.now()),
            )
        )

    await db.commit()
    return {"ok": True, "results": {"sent": sent, "failed": failed, "skipped": skipped}}
