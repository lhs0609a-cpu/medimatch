"""
의사용 미션맵 (Public, 매직링크 토큰 기반)

흐름:
1. 진단 완료 → 알림톡 + 결과화면에 토큰 URL 노출
2. 의사가 /my-roadmap?token=... 진입
3. GET /roadmap/me?token=... → 본인 진행도/체크리스트/매칭/타임라인 (정제된 뷰)
4. PATCH /roadmap/me/checklist → 의사가 직접 체크 가능
5. POST /roadmap/me/extend → 토큰 90일 연장
6. POST /roadmap/recover → 휴대폰으로 토큰 재발급 + 카톡 발송 (분실 대응)

노출하지 않는 것:
- 우리팀 내부 메모(notes), 통화 transcript, 상담사 user_id, lead_score
- visible_to_doctor=False 인 마일스톤
- 우리팀 commission_rate / commission_amount

Rate limit은 추후 (게이트웨이/리버스프록시 단).
"""
import secrets
from datetime import datetime, timedelta
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_db
from app.core.config import settings
from app.core.lead_checklist import (
    CATEGORY_LABELS, STAGE_LABELS, STAGE_ORDER,
    calc_readiness_score, missing_categories,
)
from app.models.doctor_lead import (
    DoctorLead, LeadPartnerMatch, LeadMilestone,
)
from app.services.kakao_alimtalk import send_diagnosis_alimtalk


router = APIRouter()


# ============================================================
# Helpers
# ============================================================

async def _resolve_lead_by_token(db: AsyncSession, token: str) -> DoctorLead:
    """토큰 검증 + lead 로딩 (relations eager)"""
    if not token or len(token) < 16:
        raise HTTPException(status_code=400, detail="잘못된 링크")

    q = (
        select(DoctorLead)
        .where(DoctorLead.roadmap_token == token)
        .options(
            selectinload(DoctorLead.partner_matches).selectinload(LeadPartnerMatch.partner),
            selectinload(DoctorLead.milestones),
        )
    )
    lead = (await db.execute(q)).scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="만료되었거나 존재하지 않는 링크")

    if not lead.roadmap_token_expires_at or lead.roadmap_token_expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="링크가 만료되었습니다. 상담사에게 재발송을 요청하세요.")

    return lead


def _serialize_for_doctor(lead: DoctorLead) -> dict:
    """의사 시점 정제 — 내부 메모/수수료/transcript 제거"""
    # 진행률 (단계 기준)
    stage = lead.opening_stage.value if lead.opening_stage else "PLANNING"
    stage_idx = STAGE_ORDER.index(stage) if stage in STAGE_ORDER else 0
    stage_progress = round((stage_idx + 1) * 100 / len(STAGE_ORDER))

    # 추천 카테고리 (현재·이전 단계 미완료 기준)
    recs = missing_categories(lead.checklist, stage)

    # 매칭 — 의사에게 노출되는 필드만
    matches = []
    for m in lead.partner_matches:
        if m.status and m.status.value == "REJECTED":
            continue
        matches.append({
            "id": m.id,
            "category": m.category,
            "category_label": CATEGORY_LABELS.get(m.category, m.category),
            "partner_name": m.partner.name if m.partner else None,
            "partner_phone": m.partner.phone if m.partner else None,
            "partner_rating": float(m.partner.rating) if m.partner and m.partner.rating else None,
            "partner_review_count": m.partner.review_count if m.partner else 0,
            "partner_sido": m.partner.sido if m.partner else None,
            "partner_sigungu": m.partner.sigungu if m.partner else None,
            "status": m.status.value if m.status else None,
            "quoted_amount": int(m.quoted_amount) if m.quoted_amount else None,
            "contracted_amount": int(m.contracted_amount) if m.contracted_amount else None,
            "matched_at": m.matched_at.isoformat() if m.matched_at else None,
        })

    # 카테고리별 견적 비교 요약 (의사용)
    by_cat: dict[str, list[dict]] = {}
    for m in matches:
        if not m["quoted_amount"]:
            continue
        by_cat.setdefault(m["category"], []).append(m)
    quote_summary = []
    for cat, rows in by_cat.items():
        amounts = [r["quoted_amount"] for r in rows]
        quote_summary.append({
            "category": cat,
            "category_label": CATEGORY_LABELS.get(cat, cat),
            "count": len(rows),
            "min_amount": min(amounts),
            "max_amount": max(amounts),
            "avg_amount": int(sum(amounts) / len(amounts)),
            "spread_pct": (
                round((max(amounts) - min(amounts)) * 100 / min(amounts), 1)
                if len(amounts) > 1 and min(amounts) > 0 else 0
            ),
        })

    # 마일스톤 — 의사 가시화된 것만
    milestones = []
    for m in lead.milestones:
        if not m.visible_to_doctor:
            continue
        milestones.append({
            "id": m.id,
            "stage": m.stage.value if m.stage else None,
            "stage_label": STAGE_LABELS.get(m.stage.value, "") if m.stage else None,
            "title": m.title,
            "description": m.description,
            "due_at": m.due_at.isoformat() if m.due_at else None,
            "completed_at": m.completed_at.isoformat() if m.completed_at else None,
            "status": m.status.value if m.status else None,
        })

    return {
        "name": lead.name,
        "specialty": lead.specialty,
        "target_region_sido": lead.target_region_sido,
        "target_region_sigungu": lead.target_region_sigungu,
        "target_open_date": lead.target_open_date.isoformat() if lead.target_open_date else None,
        "opening_stage": stage,
        "opening_stage_label": STAGE_LABELS.get(stage, stage),
        "stage_progress_pct": stage_progress,
        "stages": [
            {"key": k, "label": STAGE_LABELS[k], "passed": i <= stage_idx, "current": k == stage}
            for i, k in enumerate(STAGE_ORDER)
        ],
        "readiness_score": lead.readiness_score or 0,
        "checklist": lead.checklist or {},
        "recommended_categories": [
            {"key": c, "label": CATEGORY_LABELS.get(c, c)} for c in recs
        ],
        "matches": matches,
        "quote_summary": quote_summary,
        "milestones": milestones,
        "consultant_name": "메디플라톤 전담팀",
        "consultant_phone": "1577-0000",
    }


# ============================================================
# Schemas
# ============================================================

class ChecklistToggleByDoctor(BaseModel):
    token: str
    stage: str
    item_key: str
    done: bool


# ============================================================
# Endpoints
# ============================================================

@router.get("/me")
async def get_my_roadmap(
    token: str = Query(..., min_length=16),
    db: AsyncSession = Depends(get_db),
):
    """의사 본인의 미션맵 — 토큰 기반"""
    lead = await _resolve_lead_by_token(db, token)

    # 조회 카운터
    lead.roadmap_last_viewed_at = datetime.utcnow()
    lead.roadmap_view_count = (lead.roadmap_view_count or 0) + 1
    await db.flush()

    return _serialize_for_doctor(lead)


@router.patch("/me/checklist")
async def doctor_toggle_checklist(
    payload: ChecklistToggleByDoctor,
    db: AsyncSession = Depends(get_db),
):
    """의사가 본인 체크리스트 직접 체크/해제"""
    lead = await _resolve_lead_by_token(db, payload.token)

    checklist = dict(lead.checklist or {})
    if payload.stage not in checklist:
        raise HTTPException(status_code=400, detail=f"잘못된 단계: {payload.stage}")

    items = list(checklist[payload.stage])
    found = False
    for it in items:
        if it.get("key") == payload.item_key:
            it["done"] = bool(payload.done)
            it["completed_at"] = datetime.utcnow().isoformat() if payload.done else None
            it["note"] = "의사 본인이 미션맵에서 표시"
            found = True
            break
    if not found:
        raise HTTPException(status_code=404, detail="체크리스트 항목 없음")

    checklist[payload.stage] = items
    lead.checklist = checklist
    lead.readiness_score = calc_readiness_score(checklist)

    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(lead, "checklist")
    await db.flush()

    return {
        "readiness_score": lead.readiness_score,
        "stage": payload.stage,
        "item_key": payload.item_key,
        "done": payload.done,
    }


@router.post("/me/extend")
async def extend_roadmap_token(
    token: str = Query(..., min_length=16),
    db: AsyncSession = Depends(get_db),
):
    """토큰 90일 연장 (만료 임박 안내 클릭 시)"""
    lead = await _resolve_lead_by_token(db, token)
    lead.roadmap_token_expires_at = datetime.utcnow() + timedelta(days=90)
    await db.flush()
    return {
        "expires_at": lead.roadmap_token_expires_at.isoformat(),
        "extended_days": 90,
    }


# ============================================================
# Recover — 휴대폰으로 토큰 재발급 + 카톡 발송
# ============================================================

class RoadmapRecoverRequest(BaseModel):
    phone: str = Field(..., min_length=8, max_length=30)


def _normalize_phone(p: str) -> str:
    return "".join(c for c in (p or "") if c.isdigit())


@router.post("/recover")
async def recover_roadmap_link(
    payload: RoadmapRecoverRequest,
    db: AsyncSession = Depends(get_db),
):
    """분실 시 휴대폰으로 미션맵 링크 재발송.

    보안:
    - 가입/존재 여부 누설 방지 — phone 매칭 안 돼도 동일 응답.
    - 알림톡 발사 결과는 ok 필드로만 노출 (전화번호·이름 echo 안 함).
    - 매칭 시 새 토큰 발급(기존 무효화) → 90일 유효.
    """
    phone_norm = _normalize_phone(payload.phone)
    # 동일 응답 (존재 여부 누설 방지)
    generic_response = {
        "ok": True,
        "message": "등록된 정보가 있다면 카카오톡으로 미션맵 링크를 보내드렸어요.",
    }

    if len(phone_norm) < 8:
        # 명백한 잘못된 입력은 400으로 즉시 반환
        raise HTTPException(status_code=400, detail="유효한 전화번호를 입력해주세요")

    # 다양한 형식으로 매칭 시도 (010-1234-5678, 01012345678 등)
    candidates = {phone_norm, payload.phone}
    if len(phone_norm) == 11:  # 010xxxxxxxx
        formatted = f"{phone_norm[:3]}-{phone_norm[3:7]}-{phone_norm[7:]}"
        candidates.add(formatted)

    lead = (await db.execute(
        select(DoctorLead).where(DoctorLead.phone.in_(list(candidates))).limit(1)
    )).scalar_one_or_none()

    if not lead:
        return generic_response

    # 새 토큰 발급 (기존 무효화)
    lead.roadmap_token = secrets.token_urlsafe(32)
    lead.roadmap_token_expires_at = datetime.utcnow() + timedelta(days=90)
    await db.flush()

    # 알림톡 발송
    base = (settings.FRONTEND_URL or "").rstrip("/") or "https://medi.brandplaton.com"
    roadmap_url = f"{base}/my-roadmap?token={lead.roadmap_token}"

    stage = lead.opening_stage.value if lead.opening_stage else "PLANNING"
    recs = missing_categories(lead.checklist, stage)
    rec_label = CATEGORY_LABELS.get(recs[0], recs[0]) if recs else "맞춤 협력사 안내"

    try:
        await send_diagnosis_alimtalk(
            phone=lead.phone or phone_norm,
            name=lead.name,
            readiness_score=lead.readiness_score or 0,
            stage_label=STAGE_LABELS.get(stage, stage),
            rec_label=rec_label,
            next_action="아래 버튼으로 본인 미션맵을 다시 확인하실 수 있어요.",
            roadmap_url=roadmap_url,
        )
    except Exception as e:
        print(f"[recover] alimtalk error: {e}")
        # 알림톡 실패해도 응답은 동일

    return generic_response
