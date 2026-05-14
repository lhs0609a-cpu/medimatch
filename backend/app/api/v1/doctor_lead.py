"""
개원의 Lead CRM API

- 광고/추출로 획득한 의사 lead 관리
- 단계별 체크리스트, 통화 로그, 파트너 매칭
- 우리 팀(ADMIN/SALES_REP) 전용
"""
import secrets
import uuid
from datetime import datetime, timedelta
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, func, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_db, get_current_active_user
from app.core.config import settings
from app.core.lead_checklist import (
    CHECKLIST_TEMPLATES, STAGE_ORDER, STAGE_LABELS, CATEGORY_LABELS,
    build_default_checklist, calc_readiness_score, calc_lead_score,
    missing_categories,
)
from app.models.user import User, UserRole
from app.models.partner import Partner, PartnerStatus
from app.models.doctor_lead import (
    DoctorLead, LeadConsultation, LeadPartnerMatch, LeadMilestone,
    LeadFunnelStage, LeadOpeningStage, LeadPriority,
    ConsultationOutcome, ContactMethod, LeadPartnerMatchStatus,
    MilestoneStatus, MilestoneSource,
)

router = APIRouter()


# ============================================================
# Auth helper
# ============================================================

def require_crm_user(user: User = Depends(get_current_active_user)) -> User:
    if user.role not in (UserRole.ADMIN, UserRole.SALES_REP):
        raise HTTPException(status_code=403, detail="CRM 접근 권한이 없습니다")
    return user


# ============================================================
# Schemas
# ============================================================

class LeadCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    license_number: Optional[str] = None
    specialty: Optional[str] = None
    sub_specialty: Optional[str] = None
    current_workplace: Optional[str] = None
    years_of_practice: Optional[int] = None
    target_region_sido: Optional[str] = None
    target_region_sigungu: Optional[str] = None
    target_region_dong: Optional[str] = None
    target_open_date: Optional[datetime] = None
    budget_total: Optional[int] = None
    has_partner: bool = False
    needs_loan: bool = False
    expected_clinic_size_pyeong: Optional[int] = None
    funnel_stage: Optional[str] = None
    opening_stage: Optional[str] = None
    priority: Optional[str] = None
    notes: Optional[str] = None
    source: Optional[str] = None
    source_campaign_id: Optional[str] = None
    source_meta: Optional[dict] = None
    owner_user_id: Optional[uuid.UUID] = None


class LeadUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    license_number: Optional[str] = None
    specialty: Optional[str] = None
    sub_specialty: Optional[str] = None
    current_workplace: Optional[str] = None
    years_of_practice: Optional[int] = None
    target_region_sido: Optional[str] = None
    target_region_sigungu: Optional[str] = None
    target_region_dong: Optional[str] = None
    target_open_date: Optional[datetime] = None
    budget_total: Optional[int] = None
    has_partner: Optional[bool] = None
    needs_loan: Optional[bool] = None
    expected_clinic_size_pyeong: Optional[int] = None
    funnel_stage: Optional[str] = None
    opening_stage: Optional[str] = None
    priority: Optional[str] = None
    notes: Optional[str] = None
    next_action: Optional[str] = None
    next_followup_at: Optional[datetime] = None
    owner_user_id: Optional[uuid.UUID] = None


class ChecklistItemUpdate(BaseModel):
    stage: str
    item_key: str
    done: bool
    note: Optional[str] = None


class ConsultationCreate(BaseModel):
    contact_method: Optional[str] = "PHONE"
    direction: Optional[str] = "OUTBOUND"
    duration_seconds: int = 0
    summary: Optional[str] = None
    transcript: Optional[str] = None
    talked_about: Optional[List[str]] = None
    pain_points: Optional[List[str]] = None
    outcome: Optional[str] = "FOLLOW_UP"
    next_action: Optional[str] = None
    next_followup_at: Optional[datetime] = None


class PartnerMatchCreate(BaseModel):
    category: str
    partner_id: Optional[int] = None
    match_reason: Optional[str] = None
    note: Optional[str] = None


class MilestoneCreate(BaseModel):
    title: str
    description: Optional[str] = None
    stage: Optional[str] = None
    due_at: Optional[datetime] = None
    status: Optional[str] = "PLANNED"
    partner_match_id: Optional[int] = None
    visible_to_doctor: bool = True
    visible_to_partner: bool = True


class MilestoneUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    stage: Optional[str] = None
    due_at: Optional[datetime] = None
    status: Optional[str] = None
    visible_to_doctor: Optional[bool] = None
    visible_to_partner: Optional[bool] = None
    order_index: Optional[int] = None


class PartnerMatchUpdate(BaseModel):
    status: Optional[str] = None
    quoted_amount: Optional[int] = None
    quote_details: Optional[dict] = None
    contracted_amount: Optional[int] = None
    commission_rate: Optional[float] = None
    note: Optional[str] = None


# ============================================================
# Serializers
# ============================================================

def serialize_lead(lead: DoctorLead, *, full: bool = False) -> dict:
    out = {
        "id": str(lead.id),
        "name": lead.name,
        "phone": lead.phone,
        "email": lead.email,
        "specialty": lead.specialty,
        "current_workplace": lead.current_workplace,
        "target_region_sido": lead.target_region_sido,
        "target_region_sigungu": lead.target_region_sigungu,
        "target_open_date": lead.target_open_date.isoformat() if lead.target_open_date else None,
        "budget_total": int(lead.budget_total) if lead.budget_total else None,
        "needs_loan": lead.needs_loan,
        "has_partner": lead.has_partner,
        "funnel_stage": lead.funnel_stage.value if lead.funnel_stage else None,
        "opening_stage": lead.opening_stage.value if lead.opening_stage else None,
        "priority": lead.priority.value if lead.priority else None,
        "lead_score": lead.lead_score or 0,
        "readiness_score": lead.readiness_score or 0,
        "owner_user_id": str(lead.owner_user_id) if lead.owner_user_id else None,
        "next_action": lead.next_action,
        "next_followup_at": lead.next_followup_at.isoformat() if lead.next_followup_at else None,
        "last_contacted_at": lead.last_contacted_at.isoformat() if lead.last_contacted_at else None,
        "source": lead.source,
        "created_at": lead.created_at.isoformat() if lead.created_at else None,
        "updated_at": lead.updated_at.isoformat() if lead.updated_at else None,
    }
    if full:
        out.update({
            "license_number": lead.license_number,
            "sub_specialty": lead.sub_specialty,
            "years_of_practice": lead.years_of_practice,
            "target_region_dong": lead.target_region_dong,
            "expected_clinic_size_pyeong": lead.expected_clinic_size_pyeong,
            "checklist": lead.checklist or {},
            "notes": lead.notes,
            "source_campaign_id": lead.source_campaign_id,
            "source_meta": lead.source_meta or {},
            "converted_user_id": str(lead.converted_user_id) if lead.converted_user_id else None,
            "converted_project_id": str(lead.converted_project_id) if lead.converted_project_id else None,
            "converted_at": lead.converted_at.isoformat() if lead.converted_at else None,
        })
    return out


def serialize_consultation(c: LeadConsultation) -> dict:
    return {
        "id": str(c.id),
        "lead_id": str(c.lead_id),
        "user_id": str(c.user_id) if c.user_id else None,
        "contact_method": c.contact_method.value if c.contact_method else None,
        "direction": c.direction,
        "duration_seconds": c.duration_seconds or 0,
        "summary": c.summary,
        "transcript": c.transcript,
        "talked_about": c.talked_about or [],
        "pain_points": c.pain_points or [],
        "outcome": c.outcome.value if c.outcome else None,
        "next_action": c.next_action,
        "next_followup_at": c.next_followup_at.isoformat() if c.next_followup_at else None,
        "created_at": c.created_at.isoformat() if c.created_at else None,
    }


def serialize_milestone(m: LeadMilestone) -> dict:
    return {
        "id": m.id,
        "lead_id": str(m.lead_id),
        "stage": m.stage.value if m.stage else None,
        "stage_label": STAGE_LABELS.get(m.stage.value, "") if m.stage else None,
        "title": m.title,
        "description": m.description,
        "due_at": m.due_at.isoformat() if m.due_at else None,
        "started_at": m.started_at.isoformat() if m.started_at else None,
        "completed_at": m.completed_at.isoformat() if m.completed_at else None,
        "status": m.status.value if m.status else None,
        "source": m.source.value if m.source else None,
        "partner_match_id": m.partner_match_id,
        "visible_to_doctor": m.visible_to_doctor,
        "visible_to_partner": m.visible_to_partner,
        "owner_user_id": str(m.owner_user_id) if m.owner_user_id else None,
        "order_index": m.order_index or 0,
        "created_at": m.created_at.isoformat() if m.created_at else None,
    }


def serialize_match(m: LeadPartnerMatch) -> dict:
    return {
        "id": m.id,
        "lead_id": str(m.lead_id),
        "partner_id": m.partner_id,
        "partner_name": m.partner.name if m.partner else None,
        "partner_phone": m.partner.phone if m.partner else None,
        "partner_rating": float(m.partner.rating) if m.partner and m.partner.rating else None,
        "partner_review_count": m.partner.review_count if m.partner else None,
        "category": m.category,
        "category_label": CATEGORY_LABELS.get(m.category, m.category),
        "match_reason": m.match_reason,
        "status": m.status.value if m.status else None,
        "matched_at": m.matched_at.isoformat() if m.matched_at else None,
        "introduced_at": m.introduced_at.isoformat() if m.introduced_at else None,
        "quoted_amount": int(m.quoted_amount) if m.quoted_amount else None,
        "quoted_at": m.quoted_at.isoformat() if m.quoted_at else None,
        "quote_details": m.quote_details or {},
        "contracted_amount": int(m.contracted_amount) if m.contracted_amount else None,
        "contracted_at": m.contracted_at.isoformat() if m.contracted_at else None,
        "commission_rate": float(m.commission_rate) if m.commission_rate else None,
        "commission_amount": int(m.commission_amount) if m.commission_amount else None,
        "note": m.note,
    }


# ============================================================
# Meta — checklist 템플릿 / 단계 / 카테고리
# ============================================================

@router.get("/meta")
async def get_meta(_: User = Depends(require_crm_user)):
    """프론트가 단계 라벨·체크리스트 구조·카테고리 목록을 받기 위해 호출"""
    return {
        "stages": [{"key": k, "label": STAGE_LABELS[k]} for k in STAGE_ORDER],
        "funnel_stages": [s.value for s in LeadFunnelStage],
        "priorities": [s.value for s in LeadPriority],
        "categories": [{"key": k, "label": v} for k, v in CATEGORY_LABELS.items()],
        "checklist_template": CHECKLIST_TEMPLATES,
        "category_labels": CATEGORY_LABELS,
        "stage_labels": STAGE_LABELS,
        "consultation_outcomes": [o.value for o in ConsultationOutcome],
        "contact_methods": [m.value for m in ContactMethod],
        "match_statuses": [s.value for s in LeadPartnerMatchStatus],
    }


# ============================================================
# Leads CRUD
# ============================================================

@router.get("/leads")
async def list_leads(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    funnel_stage: Optional[str] = None,
    opening_stage: Optional[str] = None,
    priority: Optional[str] = None,
    owner_user_id: Optional[str] = None,
    search: Optional[str] = None,
    needs_followup: bool = False,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_crm_user),
):
    """Lead 목록 + 필터·검색·페이지네이션"""
    filters = []
    if funnel_stage:
        filters.append(DoctorLead.funnel_stage == funnel_stage)
    if opening_stage:
        filters.append(DoctorLead.opening_stage == opening_stage)
    if priority:
        filters.append(DoctorLead.priority == priority)
    if owner_user_id:
        if owner_user_id == "unassigned":
            filters.append(DoctorLead.owner_user_id.is_(None))
        else:
            filters.append(DoctorLead.owner_user_id == owner_user_id)
    if search:
        s = f"%{search}%"
        filters.append(or_(
            DoctorLead.name.ilike(s),
            DoctorLead.phone.ilike(s),
            DoctorLead.email.ilike(s),
            DoctorLead.specialty.ilike(s),
            DoctorLead.target_region_sido.ilike(s),
            DoctorLead.target_region_sigungu.ilike(s),
        ))
    if needs_followup:
        filters.append(and_(
            DoctorLead.next_followup_at.isnot(None),
            DoctorLead.next_followup_at <= datetime.utcnow(),
        ))

    # Count
    count_q = select(func.count(DoctorLead.id)).where(*filters)
    total = (await db.execute(count_q)).scalar() or 0

    # Funnel breakdown (for KPI strip)
    funnel_q = (
        select(DoctorLead.funnel_stage, func.count(DoctorLead.id))
        .group_by(DoctorLead.funnel_stage)
    )
    funnel_rows = (await db.execute(funnel_q)).all()
    funnel_counts = {
        (s.value if s else "UNKNOWN"): c for s, c in funnel_rows
    }

    # Page
    q = (
        select(DoctorLead)
        .where(*filters)
        .order_by(DoctorLead.priority.asc(), DoctorLead.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    rows = (await db.execute(q)).scalars().all()

    return {
        "items": [serialize_lead(l) for l in rows],
        "total": total,
        "page": page,
        "page_size": page_size,
        "funnel_counts": funnel_counts,
    }


@router.post("/leads", status_code=201)
async def create_lead(
    payload: LeadCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_crm_user),
):
    data = payload.model_dump(exclude_unset=True)

    # 중복 체크 (전화 or 이메일)
    if data.get("phone") or data.get("email"):
        dup_filters = []
        if data.get("phone"):
            dup_filters.append(DoctorLead.phone == data["phone"])
        if data.get("email"):
            dup_filters.append(DoctorLead.email == data["email"])
        existing = await db.execute(
            select(DoctorLead).where(or_(*dup_filters)).limit(1)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="동일 연락처/이메일의 lead가 이미 존재합니다")

    lead = DoctorLead(
        **{k: v for k, v in data.items() if k not in ("funnel_stage", "opening_stage", "priority")},
        funnel_stage=LeadFunnelStage(data.get("funnel_stage", "NEW")),
        opening_stage=LeadOpeningStage(data.get("opening_stage", "PLANNING")),
        priority=LeadPriority(data.get("priority", "WARM")),
        checklist=build_default_checklist(),
    )
    if not lead.owner_user_id:
        lead.owner_user_id = user.id
    lead.lead_score = calc_lead_score(lead)
    lead.readiness_score = calc_readiness_score(lead.checklist)

    db.add(lead)
    await db.flush()
    # 자동 마일스톤 시드 — 현재 단계
    await _seed_milestones_for_stage(db, lead, lead.opening_stage.value)
    await db.flush()
    await db.refresh(lead)
    return serialize_lead(lead, full=True)


@router.get("/leads/{lead_id}")
async def get_lead(
    lead_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_crm_user),
):
    q = select(DoctorLead).where(DoctorLead.id == lead_id).options(
        selectinload(DoctorLead.consultations),
        selectinload(DoctorLead.partner_matches).selectinload(LeadPartnerMatch.partner),
        selectinload(DoctorLead.milestones),
    )
    lead = (await db.execute(q)).scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead 없음")

    out = serialize_lead(lead, full=True)
    out["consultations"] = [serialize_consultation(c) for c in lead.consultations]
    out["partner_matches"] = [serialize_match(m) for m in lead.partner_matches]
    out["milestones"] = [serialize_milestone(m) for m in lead.milestones]
    out["recommended_categories"] = missing_categories(
        lead.checklist,
        lead.opening_stage.value if lead.opening_stage else None,
    )
    return out


@router.patch("/leads/{lead_id}")
async def update_lead(
    lead_id: uuid.UUID,
    payload: LeadUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_crm_user),
):
    lead = (await db.execute(
        select(DoctorLead).where(DoctorLead.id == lead_id)
    )).scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead 없음")

    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        if field == "funnel_stage" and value:
            lead.funnel_stage = LeadFunnelStage(value)
        elif field == "opening_stage" and value:
            lead.opening_stage = LeadOpeningStage(value)
        elif field == "priority" and value:
            lead.priority = LeadPriority(value)
        else:
            setattr(lead, field, value)

    lead.lead_score = calc_lead_score(lead)
    await db.flush()
    return serialize_lead(lead, full=True)


@router.delete("/leads/{lead_id}", status_code=204)
async def delete_lead(
    lead_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_crm_user),
):
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="삭제는 관리자만 가능")
    lead = (await db.execute(
        select(DoctorLead).where(DoctorLead.id == lead_id)
    )).scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead 없음")
    await db.delete(lead)


# ============================================================
# Checklist
# ============================================================

@router.patch("/leads/{lead_id}/checklist")
async def toggle_checklist_item(
    lead_id: uuid.UUID,
    payload: ChecklistItemUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_crm_user),
):
    lead = (await db.execute(
        select(DoctorLead).where(DoctorLead.id == lead_id)
    )).scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead 없음")

    checklist = dict(lead.checklist or build_default_checklist())
    if payload.stage not in checklist:
        raise HTTPException(status_code=400, detail=f"잘못된 단계: {payload.stage}")

    items = list(checklist[payload.stage])
    found = False
    for it in items:
        if it.get("key") == payload.item_key:
            it["done"] = bool(payload.done)
            it["completed_at"] = datetime.utcnow().isoformat() if payload.done else None
            if payload.note is not None:
                it["note"] = payload.note
            found = True
            break
    if not found:
        raise HTTPException(status_code=404, detail="체크리스트 항목 없음")

    checklist[payload.stage] = items
    lead.checklist = checklist
    lead.readiness_score = calc_readiness_score(checklist)

    # SQLAlchemy가 JSONB mutation 감지하도록 명시 마크
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(lead, "checklist")

    await db.flush()
    return {
        "checklist": lead.checklist,
        "readiness_score": lead.readiness_score,
        "recommended_categories": missing_categories(
            lead.checklist,
            lead.opening_stage.value if lead.opening_stage else None,
        ),
    }


# ============================================================
# Consultations
# ============================================================

@router.post("/leads/{lead_id}/consultations", status_code=201)
async def add_consultation(
    lead_id: uuid.UUID,
    payload: ConsultationCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_crm_user),
):
    lead = (await db.execute(
        select(DoctorLead).where(DoctorLead.id == lead_id)
    )).scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead 없음")

    data = payload.model_dump(exclude_unset=True)
    consultation = LeadConsultation(
        lead_id=lead.id,
        user_id=user.id,
        contact_method=ContactMethod(data.get("contact_method", "PHONE")),
        direction=data.get("direction", "OUTBOUND"),
        duration_seconds=data.get("duration_seconds", 0),
        summary=data.get("summary"),
        transcript=data.get("transcript"),
        talked_about=data.get("talked_about", []),
        pain_points=data.get("pain_points", []),
        outcome=ConsultationOutcome(data.get("outcome", "FOLLOW_UP")),
        next_action=data.get("next_action"),
        next_followup_at=data.get("next_followup_at"),
    )
    db.add(consultation)

    # Lead 사이드이펙트
    lead.last_contacted_at = datetime.utcnow()
    if data.get("next_action"):
        lead.next_action = data["next_action"]
    if data.get("next_followup_at"):
        lead.next_followup_at = data["next_followup_at"]

    # outcome → funnel_stage 자동 추정
    outcome = data.get("outcome", "FOLLOW_UP")
    if outcome in ("INTERESTED", "BOOKED_MEETING") and lead.funnel_stage in (
        LeadFunnelStage.NEW, LeadFunnelStage.CONTACTED,
    ):
        lead.funnel_stage = LeadFunnelStage.ENGAGED
    elif outcome == "PROPOSAL_SENT":
        lead.funnel_stage = LeadFunnelStage.PROPOSING
    elif outcome == "CONVERTED":
        lead.funnel_stage = LeadFunnelStage.CONVERTED
        lead.converted_at = datetime.utcnow()
    elif outcome == "LOST":
        lead.funnel_stage = LeadFunnelStage.LOST
    elif outcome == "REFUSED" and lead.funnel_stage == LeadFunnelStage.NEW:
        lead.funnel_stage = LeadFunnelStage.CONTACTED

    lead.lead_score = calc_lead_score(lead)

    await db.flush()
    await db.refresh(consultation)
    return serialize_consultation(consultation)


@router.get("/leads/{lead_id}/consultations")
async def list_consultations(
    lead_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_crm_user),
):
    rows = (await db.execute(
        select(LeadConsultation)
        .where(LeadConsultation.lead_id == lead_id)
        .order_by(LeadConsultation.created_at.desc())
    )).scalars().all()
    return [serialize_consultation(c) for c in rows]


# ============================================================
# Partner Matching
# ============================================================

@router.get("/leads/{lead_id}/partner-suggestions")
async def get_partner_suggestions(
    lead_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_crm_user),
):
    """현재 단계의 미완료 항목 기준으로 카테고리별 추천 파트너 묶음 반환"""
    lead = (await db.execute(
        select(DoctorLead).where(DoctorLead.id == lead_id)
    )).scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead 없음")

    cats = missing_categories(
        lead.checklist,
        lead.opening_stage.value if lead.opening_stage else None,
    )

    suggestions: list[dict] = []
    for cat in cats:
        # 같은 시도 우선
        q = select(Partner).where(
            Partner.category == cat,
            Partner.status == PartnerStatus.ACTIVE,
        )
        if lead.target_region_sido:
            q = q.order_by(
                (Partner.sido == lead.target_region_sido).desc(),
                Partner.is_premium.desc(),
                Partner.rating.desc(),
            )
        else:
            q = q.order_by(Partner.is_premium.desc(), Partner.rating.desc())
        partners = (await db.execute(q.limit(5))).scalars().all()

        suggestions.append({
            "category": cat,
            "category_label": CATEGORY_LABELS.get(cat, cat),
            "partners": [
                {
                    "id": p.id,
                    "name": p.name,
                    "phone": p.phone,
                    "sido": p.sido,
                    "sigungu": p.sigungu,
                    "rating": float(p.rating or 0),
                    "review_count": p.review_count or 0,
                    "is_premium": bool(p.is_premium),
                    "tier": p.tier.value if p.tier else None,
                }
                for p in partners
            ],
        })

    return {"recommended_categories": cats, "suggestions": suggestions}


@router.post("/leads/{lead_id}/partner-matches", status_code=201)
async def create_partner_match(
    lead_id: uuid.UUID,
    payload: PartnerMatchCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_crm_user),
):
    lead = (await db.execute(
        select(DoctorLead).where(DoctorLead.id == lead_id)
    )).scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead 없음")

    if payload.category not in CATEGORY_LABELS:
        raise HTTPException(status_code=400, detail=f"잘못된 카테고리: {payload.category}")

    match = LeadPartnerMatch(
        lead_id=lead.id,
        partner_id=payload.partner_id,
        category=payload.category,
        match_reason=payload.match_reason,
        note=payload.note,
        status=LeadPartnerMatchStatus.SUGGESTED,
        matched_by_user_id=user.id,
    )
    db.add(match)
    await db.flush()
    # eager-load partner
    if payload.partner_id:
        await db.refresh(match, ["partner"])

    # 매칭 이벤트 → PARTNER_EVENT 마일스톤 자동 생성
    cat_label = CATEGORY_LABELS.get(payload.category, payload.category)
    db.add(LeadMilestone(
        lead_id=lead.id,
        stage=lead.opening_stage,
        title=f"{cat_label} 협력사 매칭 — {match.partner.name if match.partner else '카테고리 추천'}",
        status=MilestoneStatus.IN_PROGRESS,
        source=MilestoneSource.PARTNER_EVENT,
        partner_match_id=match.id,
        visible_to_doctor=True,
        visible_to_partner=True,
    ))
    await db.flush()
    return serialize_match(match)


@router.patch("/lead-partner-matches/{match_id}")
async def update_partner_match(
    match_id: int,
    payload: PartnerMatchUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_crm_user),
):
    q = select(LeadPartnerMatch).where(LeadPartnerMatch.id == match_id).options(
        selectinload(LeadPartnerMatch.partner),
    )
    match = (await db.execute(q)).scalar_one_or_none()
    if not match:
        raise HTTPException(status_code=404, detail="매칭 없음")

    data = payload.model_dump(exclude_unset=True)
    if "status" in data:
        new_status = LeadPartnerMatchStatus(data["status"])
        match.status = new_status
        if new_status == LeadPartnerMatchStatus.INTRODUCED and not match.introduced_at:
            match.introduced_at = datetime.utcnow()
        elif new_status == LeadPartnerMatchStatus.CONTRACTED and not match.contracted_at:
            match.contracted_at = datetime.utcnow()
    for f in ("quoted_amount", "contracted_amount", "commission_rate", "note"):
        if f in data:
            setattr(match, f, data[f])

    # 견적 입력 — 자동으로 quoted_at + status QUOTED 전이
    if "quoted_amount" in data and data["quoted_amount"]:
        if not match.quoted_at:
            match.quoted_at = datetime.utcnow()
        if match.status in (LeadPartnerMatchStatus.SUGGESTED,
                            LeadPartnerMatchStatus.INTRODUCED,
                            LeadPartnerMatchStatus.IN_PROGRESS):
            match.status = LeadPartnerMatchStatus.QUOTED

    if "quote_details" in data and data["quote_details"] is not None:
        match.quote_details = data["quote_details"]
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(match, "quote_details")
        if not match.quoted_at:
            match.quoted_at = datetime.utcnow()

    if match.contracted_amount and match.commission_rate:
        match.commission_amount = int(
            float(match.contracted_amount) * float(match.commission_rate) / 100
        )

    # 계약 체결 → PARTNER_EVENT 마일스톤
    if match.status == LeadPartnerMatchStatus.CONTRACTED:
        existing_close = (await db.execute(
            select(LeadMilestone.id).where(
                LeadMilestone.partner_match_id == match.id,
                LeadMilestone.title.like("%계약 체결%"),
            ).limit(1)
        )).scalar_one_or_none()
        if not existing_close:
            partner_name = match.partner.name if match.partner else CATEGORY_LABELS.get(match.category, "협력사")
            db.add(LeadMilestone(
                lead_id=match.lead_id,
                title=f"{partner_name} 계약 체결",
                status=MilestoneStatus.DONE,
                completed_at=datetime.utcnow(),
                source=MilestoneSource.PARTNER_EVENT,
                partner_match_id=match.id,
                visible_to_doctor=True,
                visible_to_partner=True,
            ))

    await db.flush()
    return serialize_match(match)


@router.get("/leads/{lead_id}/quotes/{category}")
async def get_quote_matrix(
    lead_id: uuid.UUID,
    category: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_crm_user),
):
    """카테고리별 견적 비교 매트릭스 데이터.

    같은 카테고리 매칭 ≥1 의 모든 row 반환. 프론트가 표 렌더링.
    """
    if category not in CATEGORY_LABELS:
        raise HTTPException(status_code=400, detail=f"잘못된 카테고리: {category}")

    q = (
        select(LeadPartnerMatch)
        .where(
            LeadPartnerMatch.lead_id == lead_id,
            LeadPartnerMatch.category == category,
        )
        .options(selectinload(LeadPartnerMatch.partner))
        .order_by(LeadPartnerMatch.quoted_amount.asc().nullslast())
    )
    rows = (await db.execute(q)).scalars().all()

    matches = [serialize_match(m) for m in rows]

    # 통계
    quoted_amounts = [m["quoted_amount"] for m in matches if m["quoted_amount"]]
    stats = {
        "count": len(matches),
        "quoted_count": len(quoted_amounts),
        "min_amount": min(quoted_amounts) if quoted_amounts else None,
        "max_amount": max(quoted_amounts) if quoted_amounts else None,
        "avg_amount": int(sum(quoted_amounts) / len(quoted_amounts)) if quoted_amounts else None,
        "spread_pct": (
            round((max(quoted_amounts) - min(quoted_amounts)) * 100 / min(quoted_amounts), 1)
            if quoted_amounts and len(quoted_amounts) > 1 and min(quoted_amounts) > 0 else 0
        ),
    }

    # 카테고리별 권장 비교 항목 라벨 (프론트 헤더 자동 생성용)
    fields = QUOTE_FIELD_TEMPLATES.get(category, QUOTE_FIELD_TEMPLATES["_default"])

    return {
        "category": category,
        "category_label": CATEGORY_LABELS.get(category, category),
        "matches": matches,
        "stats": stats,
        "fields": fields,
    }


# 카테고리별 권장 견적 비교 필드 (프론트 표 헤더 + 입력 모달에서 사용)
QUOTE_FIELD_TEMPLATES: dict[str, list[dict]] = {
    "interior": [
        {"key": "amount",          "label": "총 견적가",       "type": "currency", "required": True},
        {"key": "price_per_pyeong","label": "평당가",          "type": "currency"},
        {"key": "duration_days",   "label": "공기(일)",        "type": "number"},
        {"key": "warranty_months", "label": "하자보증(개월)",  "type": "number"},
        {"key": "includes",        "label": "포함 사항",       "type": "tags",
         "options": ["설계도", "3D 시뮬레이션", "전기", "소방", "가구 일부", "사이니지", "철거"]},
        {"key": "excludes",        "label": "별도 비용",       "type": "tags",
         "options": ["인허가비", "사이니지", "가구", "전기증설", "철거"]},
        {"key": "payment_terms",   "label": "납기 조건",       "type": "text", "placeholder": "예: 계약금 30 / 중도금 40 / 잔금 30"},
        {"key": "start_available", "label": "착공 가능일",     "type": "date"},
    ],
    "equipment": [
        {"key": "amount",          "label": "총 견적가",       "type": "currency", "required": True},
        {"key": "purchase_type",   "label": "구매 형태",       "type": "select",
         "options": ["신품 구매", "리스", "중고", "렌탈"]},
        {"key": "lease_months",    "label": "리스 기간(월)",    "type": "number"},
        {"key": "monthly_payment", "label": "월 납부금",       "type": "currency"},
        {"key": "warranty_months", "label": "보증(개월)",      "type": "number"},
        {"key": "delivery_days",   "label": "납기(일)",        "type": "number"},
        {"key": "includes",        "label": "포함 사항",       "type": "tags",
         "options": ["설치", "교육", "초기 소모품", "유지보수 1년"]},
    ],
    "realestate": [
        {"key": "amount",          "label": "보증금",          "type": "currency", "required": True},
        {"key": "monthly_rent",    "label": "월세",            "type": "currency"},
        {"key": "key_money",       "label": "권리금",          "type": "currency"},
        {"key": "area_pyeong",     "label": "전용 평수",       "type": "number"},
        {"key": "address",         "label": "주소",            "type": "text"},
        {"key": "floor",           "label": "층",              "type": "text"},
        {"key": "lease_term_yr",   "label": "임대 기간(년)",    "type": "number"},
        {"key": "includes",        "label": "포함 사항",       "type": "tags",
         "options": ["관리비 별도", "주차", "엘리베이터", "냉난방"]},
    ],
    "tax": [
        {"key": "amount",            "label": "월 기장료",      "type": "currency", "required": True},
        {"key": "filing_fee_yearly", "label": "결산·신고 수수료", "type": "currency"},
        {"key": "consultation_freq", "label": "정기 상담",      "type": "select",
         "options": ["월 1회", "분기 1회", "수시"]},
        {"key": "includes",          "label": "포함 사항",      "type": "tags",
         "options": ["사업자 등록", "원천세", "부가세", "종합소득세", "경정청구", "자료 정리"]},
    ],
    "accounting": [
        {"key": "amount",            "label": "월 자문료",      "type": "currency", "required": True},
        {"key": "audit_fee_yearly",  "label": "결산·감사 수수료", "type": "currency"},
        {"key": "includes",          "label": "포함 사항",      "type": "tags",
         "options": ["기장", "결산", "재무자문", "자금조달 자문", "정기 회계리뷰"]},
    ],
    "labor": [
        {"key": "amount",            "label": "월 자문료",      "type": "currency", "required": True},
        {"key": "includes",          "label": "포함 사항",      "type": "tags",
         "options": ["근로계약", "취업규칙", "4대보험", "급여대장", "노무 분쟁 대응"]},
    ],
    "legal": [
        {"key": "amount",            "label": "사건/자문료",    "type": "currency", "required": True},
        {"key": "fee_type",          "label": "수임 형태",      "type": "select",
         "options": ["1회 자문", "월 자문", "사건 단위"]},
        {"key": "includes",          "label": "포함 사항",      "type": "tags",
         "options": ["계약서 검토", "임대차", "동업계약", "의료법인 설립", "분쟁 대응"]},
    ],
    "marketing": [
        {"key": "amount",            "label": "월 운영비",      "type": "currency", "required": True},
        {"key": "ad_budget",         "label": "광고비 예산",    "type": "currency"},
        {"key": "channels",          "label": "운영 채널",      "type": "tags",
         "options": ["네이버", "구글", "인스타", "유튜브", "블로그", "카카오"]},
        {"key": "min_contract_months","label": "최소 계약(개월)", "type": "number"},
    ],
    "emr": [
        {"key": "amount",            "label": "월 사용료",      "type": "currency", "required": True},
        {"key": "init_fee",          "label": "초기 셋업비",    "type": "currency"},
        {"key": "free_months",       "label": "무료 사용(개월)", "type": "number"},
        {"key": "includes",          "label": "포함 사항",      "type": "tags",
         "options": ["청구", "예약", "환자관리", "DUR", "처방전", "수납", "통계"]},
    ],
    "finance": [
        {"key": "amount",            "label": "한도",           "type": "currency", "required": True},
        {"key": "interest_rate",     "label": "금리(%)",        "type": "number"},
        {"key": "term_months",       "label": "기간(월)",       "type": "number"},
        {"key": "loan_type",         "label": "대출 형태",      "type": "select",
         "options": ["시중은행", "정책자금", "리스", "할부"]},
    ],
    "_default": [
        {"key": "amount",          "label": "견적가",          "type": "currency", "required": True},
        {"key": "duration_days",   "label": "기간(일)",        "type": "number"},
        {"key": "includes",        "label": "포함 사항",       "type": "tags", "options": []},
        {"key": "payment_terms",   "label": "납기 조건",       "type": "text"},
    ],
}


# ============================================================
# Milestones / 공유 타임라인
# ============================================================

# 단계별 기본 마일스톤 시드 — lead 생성 또는 단계 진입 시 자동 추가
DEFAULT_MILESTONES_BY_STAGE: dict[str, list[dict]] = {
    "PLANNING": [
        {"title": "사업계획·진료과·예산 정리", "offset_days": 0},
        {"title": "동업/단독 결정", "offset_days": 7},
        {"title": "자금조달 가능 한도 확인", "offset_days": 14},
    ],
    "LOCATION_REVIEW": [
        {"title": "후보지 3곳 답사", "offset_days": 0},
        {"title": "상권·인구통계 리포트 수령", "offset_days": 7},
        {"title": "임대료 1차 협상", "offset_days": 14},
    ],
    "CONTRACT": [
        {"title": "임대차계약서 초안 검토", "offset_days": 0},
        {"title": "보증금·권리금 자금 확보", "offset_days": 7},
        {"title": "계약 체결", "offset_days": 14},
    ],
    "LICENSING": [
        {"title": "사업자등록", "offset_days": 0},
        {"title": "의료기관 개설신고 접수", "offset_days": 7},
        {"title": "심평원 요양기관 등록", "offset_days": 21},
    ],
    "CONSTRUCTION": [
        {"title": "인테리어 견적 비교 (3곳)", "offset_days": 0},
        {"title": "설계도 확정", "offset_days": 14},
        {"title": "착공", "offset_days": 21},
        {"title": "준공·인수", "offset_days": 70},
    ],
    "EQUIPMENT": [
        {"title": "필요 장비 리스트 확정", "offset_days": 0},
        {"title": "장비 견적 비교 + 발주", "offset_days": 14},
        {"title": "설치·세팅", "offset_days": 35},
    ],
    "HIRING": [
        {"title": "필요 인력 산정", "offset_days": 0},
        {"title": "채용 공고", "offset_days": 7},
        {"title": "근로계약·4대보험 세팅", "offset_days": 28},
    ],
    "OPENING": [
        {"title": "EMR·청구 시스템 셋업", "offset_days": 0},
        {"title": "마케팅 캠페인 셋업", "offset_days": 7},
        {"title": "프리오픈", "offset_days": 14},
        {"title": "개원", "offset_days": 21},
    ],
    "OPERATING": [
        {"title": "1개월차 매출·청구 점검", "offset_days": 30},
        {"title": "분기 세무·결산 체크", "offset_days": 90},
        {"title": "마케팅 ROI 리뷰", "offset_days": 60},
    ],
}


async def _seed_milestones_for_stage(db: AsyncSession, lead: DoctorLead, stage_value: str):
    """주어진 단계에 해당하는 기본 마일스톤이 없으면 추가"""
    items = DEFAULT_MILESTONES_BY_STAGE.get(stage_value, [])
    if not items:
        return
    # 이미 그 단계에 시드된 마일스톤이 있으면 skip
    existing = (await db.execute(
        select(LeadMilestone.id).where(
            LeadMilestone.lead_id == lead.id,
            LeadMilestone.stage == stage_value,
            LeadMilestone.source == MilestoneSource.AUTO,
        ).limit(1)
    )).scalar_one_or_none()
    if existing:
        return

    base = lead.target_open_date or datetime.utcnow()
    from datetime import timedelta
    # target_open_date가 있으면 거기서부터 역산, 없으면 지금부터
    for idx, item in enumerate(items):
        due = base + timedelta(days=item["offset_days"]) if not lead.target_open_date \
            else base - timedelta(days=120 - item["offset_days"])
        db.add(LeadMilestone(
            lead_id=lead.id,
            stage=LeadOpeningStage(stage_value),
            title=item["title"],
            due_at=due,
            status=MilestoneStatus.PLANNED,
            source=MilestoneSource.AUTO,
            order_index=idx,
            visible_to_doctor=True,
            visible_to_partner=False,
        ))


@router.get("/leads/{lead_id}/milestones")
async def list_milestones(
    lead_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_crm_user),
):
    rows = (await db.execute(
        select(LeadMilestone)
        .where(LeadMilestone.lead_id == lead_id)
        .order_by(LeadMilestone.due_at.asc().nullslast(), LeadMilestone.order_index.asc())
    )).scalars().all()
    return [serialize_milestone(m) for m in rows]


@router.post("/leads/{lead_id}/milestones", status_code=201)
async def create_milestone(
    lead_id: uuid.UUID,
    payload: MilestoneCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_crm_user),
):
    lead = (await db.execute(
        select(DoctorLead).where(DoctorLead.id == lead_id)
    )).scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead 없음")

    data = payload.model_dump(exclude_unset=True)
    m = LeadMilestone(
        lead_id=lead.id,
        title=data["title"],
        description=data.get("description"),
        stage=LeadOpeningStage(data["stage"]) if data.get("stage") else None,
        due_at=data.get("due_at"),
        status=MilestoneStatus(data.get("status", "PLANNED")),
        source=MilestoneSource.MANUAL,
        partner_match_id=data.get("partner_match_id"),
        visible_to_doctor=data.get("visible_to_doctor", True),
        visible_to_partner=data.get("visible_to_partner", True),
        owner_user_id=user.id,
    )
    db.add(m)
    await db.flush()
    return serialize_milestone(m)


@router.patch("/milestones/{milestone_id}")
async def update_milestone(
    milestone_id: int,
    payload: MilestoneUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_crm_user),
):
    m = (await db.execute(
        select(LeadMilestone).where(LeadMilestone.id == milestone_id)
    )).scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="마일스톤 없음")

    data = payload.model_dump(exclude_unset=True)
    if "status" in data and data["status"]:
        new_status = MilestoneStatus(data["status"])
        m.status = new_status
        if new_status == MilestoneStatus.IN_PROGRESS and not m.started_at:
            m.started_at = datetime.utcnow()
        elif new_status == MilestoneStatus.DONE and not m.completed_at:
            m.completed_at = datetime.utcnow()
    if "stage" in data and data["stage"]:
        m.stage = LeadOpeningStage(data["stage"])
    for f in ("title", "description", "due_at", "visible_to_doctor",
              "visible_to_partner", "order_index"):
        if f in data:
            setattr(m, f, data[f])
    await db.flush()
    return serialize_milestone(m)


@router.delete("/milestones/{milestone_id}", status_code=204)
async def delete_milestone(
    milestone_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_crm_user),
):
    m = (await db.execute(
        select(LeadMilestone).where(LeadMilestone.id == milestone_id)
    )).scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="마일스톤 없음")
    await db.delete(m)


@router.post("/leads/{lead_id}/milestones/seed")
async def seed_milestones(
    lead_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_crm_user),
):
    """현재 단계 + 다음 1개 단계의 기본 마일스톤 자동 추가"""
    lead = (await db.execute(
        select(DoctorLead).where(DoctorLead.id == lead_id)
    )).scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead 없음")

    current = lead.opening_stage.value if lead.opening_stage else "PLANNING"
    stage_order = [
        "PLANNING", "LOCATION_REVIEW", "CONTRACT", "LICENSING",
        "CONSTRUCTION", "EQUIPMENT", "HIRING", "OPENING", "OPERATING",
    ]
    targets = [current]
    if current in stage_order:
        idx = stage_order.index(current)
        if idx + 1 < len(stage_order):
            targets.append(stage_order[idx + 1])

    for s in targets:
        await _seed_milestones_for_stage(db, lead, s)
    await db.flush()

    rows = (await db.execute(
        select(LeadMilestone).where(LeadMilestone.lead_id == lead_id)
        .order_by(LeadMilestone.due_at.asc().nullslast())
    )).scalars().all()
    return {"seeded_stages": targets, "milestones": [serialize_milestone(m) for m in rows]}


# ============================================================
# Today's Queue — 오늘 콜할 TOP N (priority_score = lead_score × 시기긴급도 × 미응답일수)
# ============================================================

def _urgency_multiplier(target_open_date: Optional[datetime]) -> float:
    """개원 시기 긴급도 — 임박할수록 ↑"""
    if not target_open_date:
        return 1.0
    days = (target_open_date - datetime.utcnow()).days
    if days < 0:    return 1.4   # 이미 지남 — 운영 안정화 영업
    if days < 30:   return 2.5
    if days < 90:   return 2.0
    if days < 180:  return 1.5
    if days < 365:  return 1.2
    return 1.0


def _silence_multiplier(last_contacted_at: Optional[datetime], created_at: Optional[datetime]) -> float:
    """무응답 일수 — 너무 오래 안 누적되도록 sqrt 곡선"""
    base = last_contacted_at or created_at
    if not base:
        return 1.5
    days = max(0, (datetime.utcnow() - base).days)
    if days == 0:
        return 0.6   # 오늘 이미 컨택 — 큐 후순위
    if days >= 30:
        return 2.0
    # 1~29일: 1.0 ~ 2.0 사이 부드럽게
    return 1.0 + (days / 30) ** 0.5


def _overdue_multiplier(next_followup_at: Optional[datetime]) -> float:
    """예정 후속이 지났으면 큐 최상단으로"""
    if not next_followup_at:
        return 1.0
    if next_followup_at <= datetime.utcnow():
        return 2.5
    return 1.0


@router.get("/queue/today")
async def todays_call_queue(
    limit: int = Query(10, ge=1, le=50),
    owner_user_id: Optional[str] = Query(None, description="None=전체, 'me'=본인, UUID=특정 담당자"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_crm_user),
):
    """우선순위 정렬된 콜 큐.

    priority_score = lead_score × 시기긴급도 × 무응답일수 × 후속지연
    """
    # 종료된 lead 제외
    filters = [
        DoctorLead.funnel_stage.notin_([
            LeadFunnelStage.CONVERTED, LeadFunnelStage.LOST, LeadFunnelStage.DORMANT,
        ]),
        DoctorLead.priority != LeadPriority.DEAD,
    ]
    if owner_user_id == "me":
        filters.append(DoctorLead.owner_user_id == user.id)
    elif owner_user_id and owner_user_id != "all":
        try:
            filters.append(DoctorLead.owner_user_id == uuid.UUID(owner_user_id))
        except ValueError:
            pass

    rows = (await db.execute(
        select(DoctorLead).where(*filters).limit(500)
    )).scalars().all()

    scored = []
    for l in rows:
        urgency = _urgency_multiplier(l.target_open_date)
        silence = _silence_multiplier(l.last_contacted_at, l.created_at)
        overdue = _overdue_multiplier(l.next_followup_at)
        priority_score = round((l.lead_score or 50) * urgency * silence * overdue, 1)

        scored.append({
            "id": str(l.id),
            "name": l.name,
            "phone": l.phone,
            "specialty": l.specialty,
            "target_region_sido": l.target_region_sido,
            "target_region_sigungu": l.target_region_sigungu,
            "opening_stage": l.opening_stage.value if l.opening_stage else None,
            "opening_stage_label": STAGE_LABELS.get(l.opening_stage.value, "") if l.opening_stage else "",
            "funnel_stage": l.funnel_stage.value if l.funnel_stage else None,
            "priority": l.priority.value if l.priority else None,
            "lead_score": l.lead_score or 0,
            "readiness_score": l.readiness_score or 0,
            "priority_score": priority_score,
            "urgency_x": round(urgency, 2),
            "silence_x": round(silence, 2),
            "overdue_x": round(overdue, 2),
            "last_contacted_at": l.last_contacted_at.isoformat() if l.last_contacted_at else None,
            "next_action": l.next_action,
            "next_followup_at": l.next_followup_at.isoformat() if l.next_followup_at else None,
            "target_open_date": l.target_open_date.isoformat() if l.target_open_date else None,
            "is_overdue_followup": bool(l.next_followup_at and l.next_followup_at <= datetime.utcnow()),
        })

    scored.sort(key=lambda x: x["priority_score"], reverse=True)

    return {
        "items": scored[:limit],
        "total_pool": len(scored),
        "limit": limit,
        "scope": owner_user_id or "all",
    }


# ============================================================
# Quick-Diagnose — 콜 콘솔에서 1-클릭 자가진단 (상담사용)
# ============================================================

class QuickDiagnoseUpdate(BaseModel):
    """콜 콘솔에서 의사 답변을 칩 클릭만으로 누적 반영.

    각 필드 None 이면 변경 안 함. 부분 업데이트 안전.
    """
    specialty: Optional[str] = None
    timeline: Optional[str] = None  # '지금'/'1~3개월'/...
    opening_stage: Optional[str] = None
    budget_max_만: Optional[int] = None  # None=정해지지 않음
    has_partner: Optional[bool] = None
    needs_loan: Optional[bool] = None
    pain_categories: Optional[List[str]] = None  # 누적 추가, 기존 매칭은 유지


_TIMELINE_TABLE = {
    "지금":      ("HOT",  0),
    "1~3개월":   ("HOT",  60),
    "3~6개월":   ("WARM", 135),
    "6~12개월":  ("WARM", 270),
    "1년 이후":  ("COLD", 400),
    "결정 안됨": (None,   None),
}


@router.patch("/leads/{lead_id}/quick-diagnose")
async def quick_diagnose(
    lead_id: uuid.UUID,
    payload: QuickDiagnoseUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_crm_user),
):
    """상담사가 통화 중 칩 클릭으로 채우는 batch 진단.

    - 입력된 필드만 업데이트
    - opening_stage 변경 시 이전 단계 항목 자동 완료 처리
    - pain_categories 추가 시 SUGGESTED 매칭 자동 생성 (중복 방지)
    - lead_score / readiness_score 재계산
    """
    lead = (await db.execute(
        select(DoctorLead).where(DoctorLead.id == lead_id)
    )).scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead 없음")

    data = payload.model_dump(exclude_unset=True)

    if "specialty" in data and data["specialty"]:
        lead.specialty = data["specialty"]

    if "timeline" in data and data["timeline"]:
        prio, days = _TIMELINE_TABLE.get(data["timeline"], (None, None))
        if prio:
            lead.priority = LeadPriority(prio)
        if days is not None:
            lead.target_open_date = datetime.utcnow() + timedelta(days=days)

    if "budget_max_만" in data:
        v = data["budget_max_만"]
        lead.budget_total = (int(v) * 10_000) if v else None

    if "has_partner" in data and data["has_partner"] is not None:
        lead.has_partner = bool(data["has_partner"])

    if "needs_loan" in data and data["needs_loan"] is not None:
        lead.needs_loan = bool(data["needs_loan"])

    # 단계 변경 — 이전 단계 자동 완료
    if "opening_stage" in data and data["opening_stage"]:
        try:
            new_stage = LeadOpeningStage(data["opening_stage"])
        except ValueError:
            raise HTTPException(status_code=400, detail=f"잘못된 단계: {data['opening_stage']}")
        lead.opening_stage = new_stage

        checklist = dict(lead.checklist or build_default_checklist())
        if new_stage.value in STAGE_ORDER:
            idx = STAGE_ORDER.index(new_stage.value)
            now_iso = datetime.utcnow().isoformat()
            for prev in STAGE_ORDER[:idx]:
                items = list(checklist.get(prev, []))
                for it in items:
                    if not it.get("done"):
                        it["done"] = True
                        it["completed_at"] = now_iso
                        it["note"] = it.get("note") or "통화 중 자가진단"
                checklist[prev] = items
        lead.checklist = checklist
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(lead, "checklist")

        # 새 단계 자동 마일스톤 시드 (멱등)
        await _seed_milestones_for_stage(db, lead, new_stage.value)

    # pain_categories — SUGGESTED 매칭 자동 생성
    added_pain = []
    if "pain_categories" in data and data["pain_categories"]:
        existing = (await db.execute(
            select(LeadPartnerMatch.category).where(LeadPartnerMatch.lead_id == lead.id)
        )).scalars().all()
        existing_set = set(existing)
        for cat in data["pain_categories"]:
            if cat not in CATEGORY_LABELS or cat in existing_set:
                continue
            db.add(LeadPartnerMatch(
                lead_id=lead.id,
                partner_id=None,
                category=cat,
                match_reason="통화 자가진단에서 막막하다고 응답",
                status=LeadPartnerMatchStatus.SUGGESTED,
                matched_by_user_id=user.id,
            ))
            existing_set.add(cat)
            added_pain.append(cat)

        # source_meta에도 누적
        meta = dict(lead.source_meta or {})
        prev_pain = list(meta.get("pain_categories", []) or [])
        for c in data["pain_categories"]:
            if c not in prev_pain:
                prev_pain.append(c)
        meta["pain_categories"] = prev_pain
        lead.source_meta = meta
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(lead, "source_meta")

    # 점수 재계산
    lead.readiness_score = calc_readiness_score(lead.checklist)
    lead.lead_score = calc_lead_score(lead)

    await db.flush()

    # 추천 카테고리 즉시 반환 (프런트가 우측 패널 갱신용)
    recs = missing_categories(
        lead.checklist,
        lead.opening_stage.value if lead.opening_stage else None,
    )

    return {
        "lead": serialize_lead(lead, full=True),
        "added_pain_categories": added_pain,
        "recommended_categories": [
            {"key": c, "label": CATEGORY_LABELS.get(c, c)} for c in recs
        ],
    }


# ============================================================
# Bundle Action — TOP-N 자동매칭 + 알림톡 + 통화 + 후속 일정 한 번에
# ============================================================

class BundleActionRequest(BaseModel):
    top_n: int = Field(3, ge=1, le=6)
    follow_up_days: int = Field(3, ge=0, le=30)
    summary: Optional[str] = None
    send_alimtalk: bool = True
    issue_new_token: bool = True  # 미션맵 링크 새로 발급해서 카톡 발송


@router.post("/leads/{lead_id}/bundle-action")
async def bundle_action(
    lead_id: uuid.UUID,
    payload: BundleActionRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_crm_user),
):
    """원클릭 묶음:
    1. 추천 카테고리 TOP-N 자동 매칭 (이미 매칭된 카테고리는 skip)
    2. PROPOSAL_SENT outcome 통화 기록 자동 추가
    3. 미션맵 토큰 (재)발급
    4. 알림톡 발송 (실패 시 결과만 반환, 트랜잭션은 유지)
    5. 후속 일정 등록
    """
    q = (
        select(DoctorLead).where(DoctorLead.id == lead_id)
        .options(selectinload(DoctorLead.partner_matches))
    )
    lead = (await db.execute(q)).scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead 없음")

    stage = lead.opening_stage.value if lead.opening_stage else "PLANNING"
    recs = missing_categories(lead.checklist, stage)

    existing_cats = {m.category for m in lead.partner_matches}
    new_recs = [c for c in recs if c not in existing_cats][:payload.top_n]

    # 1. TOP-N 매칭 생성 + 카테고리별 best partner 자동 선택
    created_matches = []
    for cat in new_recs:
        # 같은 시도 + premium + rating 기준 best partner
        pq = select(Partner).where(
            Partner.category == cat,
            Partner.status == PartnerStatus.ACTIVE,
        )
        if lead.target_region_sido:
            pq = pq.order_by(
                (Partner.sido == lead.target_region_sido).desc(),
                Partner.is_premium.desc(),
                Partner.rating.desc().nullslast(),
            )
        else:
            pq = pq.order_by(Partner.is_premium.desc(), Partner.rating.desc().nullslast())
        best = (await db.execute(pq.limit(1))).scalar_one_or_none()

        match = LeadPartnerMatch(
            lead_id=lead.id,
            partner_id=best.id if best else None,
            category=cat,
            match_reason="원클릭 묶음 — 단계 추천 TOP-N",
            status=LeadPartnerMatchStatus.SUGGESTED,
            matched_by_user_id=user.id,
        )
        db.add(match)
        created_matches.append({"category": cat, "partner_name": best.name if best else None})

    # 2. PROPOSAL_SENT 통화 기록
    next_followup_at = (
        datetime.utcnow() + timedelta(days=payload.follow_up_days)
        if payload.follow_up_days > 0 else None
    )
    summary = payload.summary or (
        f"[원클릭 묶음] 추천 {len(created_matches)}개 매칭 + 미션맵 카톡 발송"
    )
    consultation = LeadConsultation(
        lead_id=lead.id,
        user_id=user.id,
        contact_method=ContactMethod.PHONE,
        direction="OUTBOUND",
        summary=summary,
        outcome=ConsultationOutcome.PROPOSAL_SENT,
        next_action=f"제안한 {len(created_matches)}곳 응답 확인",
        next_followup_at=next_followup_at,
    )
    db.add(consultation)

    lead.last_contacted_at = datetime.utcnow()
    lead.next_action = consultation.next_action
    lead.next_followup_at = next_followup_at
    if lead.funnel_stage in (LeadFunnelStage.NEW, LeadFunnelStage.CONTACTED, LeadFunnelStage.ENGAGED):
        lead.funnel_stage = LeadFunnelStage.PROPOSING

    # 3. 미션맵 토큰 발급
    roadmap_url = None
    if payload.issue_new_token or not lead.roadmap_token:
        lead.roadmap_token = secrets.token_urlsafe(32)
        lead.roadmap_token_expires_at = datetime.utcnow() + timedelta(days=90)

    if lead.roadmap_token:
        base = (settings.FRONTEND_URL or "").rstrip("/") or "https://medi.brandplaton.com"
        roadmap_url = f"{base}/my-roadmap?token={lead.roadmap_token}"

    await db.flush()

    # 4. 알림톡 발송 (트랜잭션 외)
    alimtalk_result = {"ok": False, "status": "skipped"}
    if payload.send_alimtalk and lead.phone and roadmap_url:
        from app.services.kakao_alimtalk import send_diagnosis_alimtalk
        first_label = CATEGORY_LABELS.get(new_recs[0], new_recs[0]) if new_recs else "맞춤 협력사"
        try:
            alimtalk_result = await send_diagnosis_alimtalk(
                phone=lead.phone,
                name=lead.name,
                readiness_score=lead.readiness_score or 0,
                stage_label=STAGE_LABELS.get(stage, stage),
                rec_label=f"{first_label} 외 {len(new_recs)-1}개" if len(new_recs) > 1 else first_label,
                next_action=f"제안 검토하시고 답주세요. {payload.follow_up_days}일 뒤 다시 연락드리겠습니다.",
                roadmap_url=roadmap_url,
            )
        except Exception as e:
            print(f"[bundle] alimtalk error: {e}")
            alimtalk_result = {"ok": False, "status": "exception", "message": str(e)}

    return {
        "matched_count": len(created_matches),
        "created_matches": created_matches,
        "consultation_id": str(consultation.id),
        "next_followup_at": next_followup_at.isoformat() if next_followup_at else None,
        "roadmap_url": roadmap_url,
        "alimtalk": alimtalk_result,
        "funnel_stage": lead.funnel_stage.value if lead.funnel_stage else None,
    }


# ============================================================
# 의사 매직링크 — 재발급
# ============================================================

@router.post("/leads/{lead_id}/roadmap-token")
async def issue_roadmap_token(
    lead_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_crm_user),
):
    """의사 본인 미션맵 매직링크 토큰 (재)발급.

    카톡/문자 재발송 시 호출. 기존 토큰은 무효화됨.
    """
    lead = (await db.execute(
        select(DoctorLead).where(DoctorLead.id == lead_id)
    )).scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead 없음")

    lead.roadmap_token = secrets.token_urlsafe(32)
    lead.roadmap_token_expires_at = datetime.utcnow() + timedelta(days=90)
    await db.flush()

    base = (settings.FRONTEND_URL or "").rstrip("/") or "https://medi.brandplaton.com"
    return {
        "token": lead.roadmap_token,
        "expires_at": lead.roadmap_token_expires_at.isoformat(),
        "url": f"{base}/my-roadmap?token={lead.roadmap_token}",
    }


# ============================================================
# Stats / KPI
# ============================================================

@router.get("/stats")
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_crm_user),
):
    total = (await db.execute(select(func.count(DoctorLead.id)))).scalar() or 0

    by_funnel = (await db.execute(
        select(DoctorLead.funnel_stage, func.count(DoctorLead.id))
        .group_by(DoctorLead.funnel_stage)
    )).all()
    by_opening = (await db.execute(
        select(DoctorLead.opening_stage, func.count(DoctorLead.id))
        .group_by(DoctorLead.opening_stage)
    )).all()
    by_priority = (await db.execute(
        select(DoctorLead.priority, func.count(DoctorLead.id))
        .group_by(DoctorLead.priority)
    )).all()

    overdue = (await db.execute(
        select(func.count(DoctorLead.id)).where(
            DoctorLead.next_followup_at.isnot(None),
            DoctorLead.next_followup_at <= datetime.utcnow(),
            DoctorLead.funnel_stage.notin_([LeadFunnelStage.CONVERTED, LeadFunnelStage.LOST]),
        )
    )).scalar() or 0

    converted_count = (await db.execute(
        select(func.count(DoctorLead.id)).where(
            DoctorLead.funnel_stage == LeadFunnelStage.CONVERTED
        )
    )).scalar() or 0

    contracted_revenue = (await db.execute(
        select(func.coalesce(func.sum(LeadPartnerMatch.contracted_amount), 0))
        .where(LeadPartnerMatch.status == LeadPartnerMatchStatus.CONTRACTED)
    )).scalar() or 0

    commission_revenue = (await db.execute(
        select(func.coalesce(func.sum(LeadPartnerMatch.commission_amount), 0))
        .where(LeadPartnerMatch.status == LeadPartnerMatchStatus.CONTRACTED)
    )).scalar() or 0

    def _bucket(rows):
        return {(s.value if s else "UNKNOWN"): c for s, c in rows}

    return {
        "total_leads": total,
        "overdue_followups": overdue,
        "converted_count": converted_count,
        "conversion_rate": round(converted_count * 100 / total, 1) if total else 0,
        "by_funnel": _bucket(by_funnel),
        "by_opening_stage": _bucket(by_opening),
        "by_priority": _bucket(by_priority),
        "contracted_revenue": int(contracted_revenue),
        "commission_revenue": int(commission_revenue),
    }


# ============================================================
# Talking-points (스크립트 생성기 — 룰 기반 MVP)
# ============================================================

@router.get("/leads/{lead_id}/script")
async def generate_script(
    lead_id: uuid.UUID,
    use_ai: bool = Query(True, description="AI(GPT) 우선 시도. 실패시 룰 fallback"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_crm_user),
):
    """전공·지역·단계·미완료·통화이력 기반 talking points 카드 생성.

    `use_ai=true`(기본): GPT-4o-mini로 1:1 맞춤 생성. 실패 시 룰 폴백.
    `use_ai=false`: 룰만 사용.
    """
    q = (
        select(DoctorLead).where(DoctorLead.id == lead_id)
        .options(
            selectinload(DoctorLead.consultations),
            selectinload(DoctorLead.partner_matches).selectinload(LeadPartnerMatch.partner),
        )
    )
    lead = (await db.execute(q)).scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead 없음")

    stage = lead.opening_stage.value if lead.opening_stage else "PLANNING"
    stage_label = STAGE_LABELS.get(stage, stage)
    cats = missing_categories(lead.checklist, stage)

    # AI 우선 시도
    if use_ai:
        ai_ctx = _build_ai_context(lead, stage, stage_label, cats)
        from app.services.lead_script_ai import generate_script_ai
        ai_result = await generate_script_ai(ai_ctx)
        if ai_result:
            ai_result["lead_id"] = str(lead.id)
            ai_result["stage"] = stage
            ai_result["stage_label"] = stage_label
            ai_result["generated_by"] = "ai"
            return ai_result

    # 룰 fallback
    opening = (
        f"{lead.name} 원장님 안녕하세요, 메디플라톤 OO입니다. "
    )
    if lead.specialty:
        opening += f"{lead.specialty} 전문의 분들 개원 도와드리고 있어서 연락드렸습니다."
    else:
        opening += "개원 준비하시는 분들 도와드리고 있어서 연락드렸습니다."

    # 후크 (단계별)
    stage_hooks = {
        "PLANNING":         "지금 사업계획 단계라고 들었는데, 가장 막막한 부분이 보통 예산이랑 입지 결정이세요. 저희가 비슷한 케이스들 데이터 가지고 있어서 30분만 통화해도 방향이 잡히세요.",
        "LOCATION_REVIEW":  "입지 검토 단계 가장 중요한데, 저희 자체 데이터로 후보지 상권·인구통계·경쟁의원까지 한 번에 비교해드려요. 비용 들어가기 전에 보시면 됩니다.",
        "CONTRACT":         "임대차 계약은 한 번 잘못 사인하면 5~10년이 묶이세요. 저희 제휴 부동산 법무팀이 계약 검토 무료로 해드립니다.",
        "LICENSING":        "개설신고·심평원 등록은 서류 몇 개만 빠져도 한 달이 지연돼요. 저희 제휴 회계법인이 패스트트랙으로 처리해드려요.",
        "CONSTRUCTION":     "인테리어가 개원 비용의 30~40% 차지해서, 업체 1곳만 보고 결정하면 보통 20% 더 쓰세요. 저희가 검증된 3곳에서 동시 견적 받아드려요.",
        "EQUIPMENT":        "의료기기는 리스 vs 구매 vs 중고 조합에 따라 5년 총비용 차이가 1억 가까이 나기도 해요. 견적 비교 매트릭스 보내드려도 될까요?",
        "HIRING":           "인력은 채용도 중요하지만 근로계약·급여 세팅이 더 중요해요. 노무·세무 자동 셋업 패키지 있어서 도와드릴게요.",
        "OPENING":          "개원 직후 3개월이 환자 정착이 결정돼요. 저희 마케팅 파트너가 동선 분석해서 맞춤 캠페인 짜드립니다.",
        "OPERATING":        "운영 중이시면 청구·세무 경정청구로 회수 가능한 돈이 평균 3,000만 원 나와요. 무료 진단 받아보세요.",
    }
    hook = stage_hooks.get(stage, "")

    # 우리가 줄 수 있는 가치 (미완료 카테고리 → 카드)
    value_cards = [
        {
            "category": c,
            "label": CATEGORY_LABELS.get(c, c),
            "pitch": _category_pitch(c),
        }
        for c in cats
    ]

    # 자주 나오는 반론
    objections = [
        {"q": "이미 알고 지내는 업체가 있어요",
         "a": "네 좋습니다. 비교만 해보시는 의미로 견적 한 장만 더 받아보세요. 저희 협력사 평균이 시장가 대비 12% 싸서 협상 카드로도 쓰실 수 있어요."},
        {"q": "수수료 받으시는 거 아니에요?",
         "a": "협력사한테만 받습니다. 원장님은 무료고요, 오히려 저희 통하면 패키지 할인 들어가서 직접 가시는 것보다 싸요."},
        {"q": "지금은 시간 없어요",
         "a": "네 알겠습니다. 카톡으로 단계별 체크리스트 1장만 보내드릴게요. 보시고 필요한 거 표시해주시면 그것만 매칭해드릴게요."},
    ]

    # 클로징 (다음 액션)
    closing = (
        f"오늘 통화 정리해서, {stage_label} 단계 체크리스트하고 "
        + (f"{', '.join(CATEGORY_LABELS.get(c, c) for c in cats[:3])} 후보 업체 리스트 카톡으로 보내드릴게요. "
           if cats else "맞춤 자료 보내드릴게요. ")
        + "검토하시고 답주시면 다음 미팅 잡겠습니다."
    )

    return {
        "lead_id": str(lead.id),
        "stage": stage,
        "stage_label": stage_label,
        "opening": opening,
        "hook": hook,
        "value_cards": value_cards,
        "objections": objections,
        "closing": closing,
        "generated_by": "rule",
    }


def _build_ai_context(lead: DoctorLead, stage: str, stage_label: str, cats: list) -> dict:
    """LLM 프롬프트에 넣을 lead 컨텍스트 딕셔너리"""
    region = ""
    if lead.target_region_sido:
        region = lead.target_region_sido
        if lead.target_region_sigungu:
            region += f" {lead.target_region_sigungu}"

    timeline = ""
    if lead.target_open_date:
        from datetime import datetime as dt
        delta = (lead.target_open_date - dt.utcnow()).days
        if delta < 0:
            timeline = "이미 지남"
        elif delta < 60:
            timeline = f"{delta}일 후 (임박)"
        elif delta < 365:
            timeline = f"{delta // 30}개월 후"
        else:
            timeline = f"{delta // 30}개월 후"

    budget = ""
    if lead.budget_total:
        b = int(lead.budget_total)
        if b >= 100_000_000:
            budget = f"{b / 100_000_000:.1f}억"
        elif b >= 10_000:
            budget = f"{b // 10_000:,}만"

    # 미완료 체크리스트 요약
    missing_lines = []
    for s, items in (lead.checklist or {}).items():
        for it in items or []:
            if not it.get("done"):
                missing_lines.append(f"- [{STAGE_LABELS.get(s, s)}] {it.get('label')}")
    missing_text = "\n".join(missing_lines[:8]) or "(전부 완료)"

    # pain_categories from source_meta
    pain_cats = []
    if lead.source_meta and isinstance(lead.source_meta.get("pain_categories"), list):
        pain_cats = lead.source_meta["pain_categories"]
    pain_text = ", ".join(CATEGORY_LABELS.get(c, c) for c in pain_cats) or "(미입력)"

    # 매칭 현황
    match_lines = []
    for m in lead.partner_matches:
        partner_name = m.partner.name if m.partner else "(파트너 미배정)"
        match_lines.append(
            f"- {CATEGORY_LABELS.get(m.category, m.category)}: {partner_name} / {m.status.value if m.status else 'N/A'}"
        )
    matches_text = "\n".join(match_lines) or "(없음)"

    # 통화 이력
    consult_lines = []
    for c in (lead.consultations or [])[:3]:
        outcome = c.outcome.value if c.outcome else "?"
        summary = (c.summary or "").strip()[:120]
        consult_lines.append(f"- [{outcome}] {summary or '(요약 없음)'}")
    consult_text = "\n".join(consult_lines) or "(없음)"

    rec_text = ", ".join(CATEGORY_LABELS.get(c, c) for c in cats) or "(없음)"

    return {
        "name": lead.name,
        "specialty": lead.specialty,
        "region": region or "미정",
        "opening_stage_label": stage_label,
        "timeline": timeline or "미정",
        "budget": budget or "미정",
        "has_partner": lead.has_partner,
        "needs_loan": lead.needs_loan,
        "readiness_score": lead.readiness_score or 0,
        "pain_text": pain_text,
        "missing_text": missing_text,
        "matches_text": matches_text,
        "consult_text": consult_text,
        "rec_text": rec_text,
    }


def _category_pitch(cat: str) -> str:
    pitches = {
        "realestate":  "의료시설 전문 부동산 중개법인. 입점 가능 여부·임대료 협상·권리금 검토까지 풀패키지.",
        "legal":       "의료법 전문 변호사. 임대차·동업·인수 계약, 의료법인 설립까지.",
        "accounting":  "의료기관 전담 회계법인. 재무자문·기장·자금조달 자문.",
        "tax":         "세무법인. 개원신고부터 종합소득세·경정청구까지 평균 환급 3,000만원.",
        "labor":       "노무법인. 근로계약·4대보험·인사노무 자문, 분쟁 예방.",
        "consulting":  "개원 종합 컨설팅. 입지·자금·인허가·운영까지 원스톱.",
        "finance":     "의료인 전용 시중·정책 대출 비교. 평균 0.3~0.7%p 금리 절감.",
        "interior":    "병원 인테리어 전문 시공사 풀. 평당가·동선 설계까지 무료 컨설팅.",
        "equipment":   "신품·리스·중고 동시 비교. 같은 사양 평균 12% 절감.",
        "pharma":      "도매 직거래로 약가·소모품 단가 인하.",
        "signage":     "간판·인쇄·UI 통합 발주.",
        "emr":         "청구·환자관리·예약·DUR 통합 EMR. 첫 3개월 무료.",
        "marketing":   "개원 직후 환자 유입 부스팅 패키지. 네이버·인스타·블로그 통합 운영.",
    }
    return pitches.get(cat, "검증된 협력사 매칭")
