"""
개원 진단 1분 테스트 (Public API — Lead magnet)

흐름:
1. 광고 → /diagnose → 7-step funnel
2. 사용자가 진단 제출 → POST /diagnosis
3. 백엔드:
   - DoctorLead 자동 생성 (source='diagnosis', funnel_stage=NEW)
   - 입력한 단계로 opening_stage 설정 + 체크리스트 일부 자동 체크
   - 막막한 카테고리에 LeadPartnerMatch(SUGGESTED) 자동 생성
   - readiness_score / 추천 카테고리 계산
4. 결과 반환 → 의사에게 보여주고 상담 예약 유도
5. 우리 CRM에는 새 lead 떠 있음 → 콜드콜 즉시 시작 가능

인증 없음 (public). Rate limit는 추후.
"""
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.lead_checklist import (
    CATEGORY_LABELS, STAGE_LABELS, build_default_checklist,
    calc_readiness_score, calc_lead_score, missing_categories,
)
from app.models.doctor_lead import (
    DoctorLead, LeadPartnerMatch,
    LeadFunnelStage, LeadOpeningStage, LeadPriority, LeadPartnerMatchStatus,
)

router = APIRouter()


# ============================================================
# Schemas
# ============================================================

class DiagnosisRequest(BaseModel):
    # Step 1
    specialty: str = Field(..., min_length=1, max_length=100)
    # Step 2 — '지금'/'1~3개월'/'3~6개월'/'6~12개월'/'1년 이후'/'결정 안됨'
    timeline: str
    # Step 3
    region_sido: Optional[str] = None
    region_sigungu: Optional[str] = None
    # Step 4 — 예산 (만원 단위 입력)
    budget_min_만: Optional[int] = None
    budget_max_만: Optional[int] = None
    # Step 5 — 개원 단계 (LeadOpeningStage)
    opening_stage: str
    # Step 6 — 막막한 영역 (CATEGORY_LABELS의 key 다중 선택)
    pain_categories: List[str] = []
    has_partner: bool = False
    needs_loan: bool = False
    # Step 7 — 연락처
    name: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., min_length=1, max_length=30)
    email: Optional[str] = None
    consent_marketing: bool = False
    # 메타 (utm 등)
    utm_source: Optional[str] = None
    utm_campaign: Optional[str] = None


class DiagnosisResult(BaseModel):
    lead_id: str
    name: str
    readiness_score: int
    opening_stage: str
    opening_stage_label: str
    timeline_label: str
    recommended_categories: List[dict]
    pain_categories: List[dict]
    missing_count: int
    next_action_message: str


# ============================================================
# Helpers
# ============================================================

# timeline → priority + target_open_date 매핑
def _parse_timeline(timeline: str) -> tuple[LeadPriority, Optional[datetime]]:
    from datetime import timedelta
    now = datetime.utcnow()
    table = {
        "지금":      (LeadPriority.HOT, now),
        "1~3개월":   (LeadPriority.HOT, now + timedelta(days=60)),
        "3~6개월":   (LeadPriority.WARM, now + timedelta(days=135)),
        "6~12개월":  (LeadPriority.WARM, now + timedelta(days=270)),
        "1년 이후":  (LeadPriority.COLD, now + timedelta(days=400)),
        "결정 안됨": (LeadPriority.COLD, None),
    }
    return table.get(timeline, (LeadPriority.WARM, None))


# 단계별 자동 체크 (입력한 stage 이전 단계는 모두 완료된 것으로 가정)
STAGE_ORDER = [
    "PLANNING", "LOCATION_REVIEW", "CONTRACT", "LICENSING",
    "CONSTRUCTION", "EQUIPMENT", "HIRING", "OPENING", "OPERATING",
]


def _apply_stage_checklist(checklist: dict, current_stage: str) -> dict:
    """현재 단계 이전 단계의 항목들은 모두 done 처리"""
    if current_stage not in STAGE_ORDER:
        return checklist
    idx = STAGE_ORDER.index(current_stage)
    now_iso = datetime.utcnow().isoformat()
    for prev_stage in STAGE_ORDER[:idx]:
        items = checklist.get(prev_stage, [])
        for it in items:
            it["done"] = True
            it["completed_at"] = now_iso
            it["note"] = "자가 진단 시 완료 표시"
        checklist[prev_stage] = items
    return checklist


# ============================================================
# Endpoints
# ============================================================

@router.post("/diagnosis", response_model=DiagnosisResult)
async def submit_diagnosis(
    payload: DiagnosisRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    # opening_stage validation
    try:
        opening_stage = LeadOpeningStage(payload.opening_stage)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"잘못된 단계: {payload.opening_stage}")

    # 중복 체크 (전화/이메일) — 있으면 기존 lead 갱신, 없으면 신규
    dup_filters = [DoctorLead.phone == payload.phone]
    if payload.email:
        dup_filters.append(DoctorLead.email == payload.email)
    existing = (await db.execute(
        select(DoctorLead).where(or_(*dup_filters)).limit(1)
    )).scalar_one_or_none()

    priority, target_date = _parse_timeline(payload.timeline)

    # 체크리스트 — 진단으로 알게 된 정보 반영
    checklist = build_default_checklist()
    checklist = _apply_stage_checklist(checklist, opening_stage.value)

    budget_total = None
    if payload.budget_max_만:
        budget_total = int(payload.budget_max_만) * 10_000

    if existing:
        # 기존 lead 갱신
        lead = existing
        lead.name = payload.name
        lead.phone = payload.phone
        if payload.email:
            lead.email = payload.email
        lead.specialty = payload.specialty
        lead.target_region_sido = payload.region_sido
        lead.target_region_sigungu = payload.region_sigungu
        if target_date:
            lead.target_open_date = target_date
        if budget_total:
            lead.budget_total = budget_total
        lead.has_partner = payload.has_partner
        lead.needs_loan = payload.needs_loan
        lead.opening_stage = opening_stage
        lead.priority = priority
        lead.checklist = checklist
        # 갱신: 출처는 가장 최근 것을 source_meta에 누적
        meta = dict(lead.source_meta or {})
        meta.setdefault("history", []).append({
            "at": datetime.utcnow().isoformat(),
            "type": "diagnosis_resubmit",
            "utm_source": payload.utm_source,
            "utm_campaign": payload.utm_campaign,
        })
        lead.source_meta = meta
    else:
        lead = DoctorLead(
            name=payload.name,
            phone=payload.phone,
            email=payload.email,
            specialty=payload.specialty,
            target_region_sido=payload.region_sido,
            target_region_sigungu=payload.region_sigungu,
            target_open_date=target_date,
            budget_total=budget_total,
            has_partner=payload.has_partner,
            needs_loan=payload.needs_loan,
            funnel_stage=LeadFunnelStage.NEW,
            opening_stage=opening_stage,
            priority=priority,
            checklist=checklist,
            source="diagnosis",
            source_meta={
                "utm_source": payload.utm_source,
                "utm_campaign": payload.utm_campaign,
                "ip": request.client.host if request.client else None,
                "user_agent": request.headers.get("user-agent"),
                "consent_marketing": payload.consent_marketing,
                "pain_categories": payload.pain_categories,
            },
            notes=f"[자가 진단 결과]\n시기: {payload.timeline}\n막막한 영역: " +
                  (", ".join(CATEGORY_LABELS.get(c, c) for c in payload.pain_categories) or "(없음)"),
        )
        db.add(lead)
        await db.flush()

    # 점수 계산
    lead.readiness_score = calc_readiness_score(lead.checklist)
    lead.lead_score = calc_lead_score(lead)

    # 막막한 영역 → partner_match SUGGESTED 자동 생성 (중복 방지)
    if payload.pain_categories:
        existing_matches = (await db.execute(
            select(LeadPartnerMatch.category).where(LeadPartnerMatch.lead_id == lead.id)
        )).scalars().all()
        existing_set = set(existing_matches)

        for cat in payload.pain_categories:
            if cat not in CATEGORY_LABELS or cat in existing_set:
                continue
            db.add(LeadPartnerMatch(
                lead_id=lead.id,
                partner_id=None,
                category=cat,
                match_reason="자가 진단에서 막막하다고 표시",
                status=LeadPartnerMatchStatus.SUGGESTED,
            ))

    # SQLAlchemy JSONB mutation 인지
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(lead, "checklist")
    flag_modified(lead, "source_meta")

    await db.flush()

    # 추천 카테고리 (단계 미완료 + 막막함 합집합)
    auto_recs = missing_categories(lead.checklist, opening_stage.value)
    combined = list(dict.fromkeys(payload.pain_categories + auto_recs))[:6]

    rec_cards = [
        {"key": c, "label": CATEGORY_LABELS.get(c, c)}
        for c in combined if c in CATEGORY_LABELS
    ]
    pain_cards = [
        {"key": c, "label": CATEGORY_LABELS.get(c, c)}
        for c in payload.pain_categories if c in CATEGORY_LABELS
    ]

    # 미완료 항목 카운트
    missing_count = 0
    for items in (lead.checklist or {}).values():
        for it in items:
            if not it.get("done"):
                missing_count += 1

    # 다음 액션 메시지
    if priority == LeadPriority.HOT:
        msg = f"개원이 임박하셨네요. 1영업일 안에 전담 상담사가 연락드려 {rec_cards[0]['label'] if rec_cards else '필요 협력사'}부터 매칭해드리겠습니다."
    elif priority == LeadPriority.WARM:
        msg = f"준비 단계가 가장 좋은 타이밍이에요. 24시간 안에 상담사가 연락드려 단계별 체크리스트와 견적을 정리해드립니다."
    else:
        msg = "여유롭게 준비하시는 중이군요. 전담 상담사가 연락드려 장기 로드맵을 함께 짜드릴게요."

    return DiagnosisResult(
        lead_id=str(lead.id),
        name=lead.name,
        readiness_score=lead.readiness_score or 0,
        opening_stage=opening_stage.value,
        opening_stage_label=STAGE_LABELS.get(opening_stage.value, opening_stage.value),
        timeline_label=payload.timeline,
        recommended_categories=rec_cards,
        pain_categories=pain_cards,
        missing_count=missing_count,
        next_action_message=msg,
    )


@router.get("/diagnosis/meta")
async def diagnosis_meta():
    """프론트가 진단 페이지를 렌더링하는 데 필요한 옵션들"""
    return {
        "stages": [
            {"key": k, "label": v} for k, v in STAGE_LABELS.items()
        ],
        "categories": [
            {"key": k, "label": v} for k, v in CATEGORY_LABELS.items()
        ],
        "timelines": [
            "지금", "1~3개월", "3~6개월", "6~12개월", "1년 이후", "결정 안됨",
        ],
        "specialties": [
            "내과", "외과", "정형외과", "신경외과", "이비인후과", "안과",
            "피부과", "성형외과", "산부인과", "소아과", "정신건강의학과",
            "재활의학과", "마취통증의학과", "치과", "한의원", "가정의학과",
            "비뇨기과", "영상의학과", "기타",
        ],
        "budget_options_만": [
            {"label": "5천만 이하", "max": 5000},
            {"label": "5천만~1억", "max": 10000},
            {"label": "1억~3억", "max": 30000},
            {"label": "3억~5억", "max": 50000},
            {"label": "5억~10억", "max": 100000},
            {"label": "10억 이상", "max": 200000},
            {"label": "정해지지 않음", "max": None},
        ],
    }
