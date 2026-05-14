"""
CDSS (Clinical Decision Support System) — 사전심사 9종 점검 API

POST /cdss/pre-screen
    처방·진단·시술을 한 번에 받아 9종 점검 결과 + 삭감예방 점수 + 예상청구액 반환.

GET /cdss/categories
    9종 카테고리 메타정보 (UI 사이드패널 헤더용).
"""
from datetime import date
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..deps import get_db, get_current_active_user
from ...models.user import User
from ...models.patient import Patient
from ...models.prescription import Prescription, PrescriptionStatus
from ...services.cdss import (
    CdssDiagnosis, CdssDrug, CdssProcedure, CdssPatient,
    pre_screen,
    CATEGORIES, CATEGORY_LABELS_KO,
)

router = APIRouter()


# ────────────────────────────────────────────────────────────
#  Schemas
# ────────────────────────────────────────────────────────────
class _DiagnosisIn(BaseModel):
    code: str
    name: str = ""
    is_primary: bool = False


class _DrugIn(BaseModel):
    drug_name: str = ""
    ingredient: Optional[str] = ""
    dose_per_time: float = 1.0
    dose_unit: str = "정"
    frequency_per_day: int = 1
    duration_days: int = 1
    total_quantity: Optional[float] = 0.0


class _ProcedureIn(BaseModel):
    code: str = ""
    name: str = ""
    category: Optional[str] = ""
    quantity: int = 1
    unit_price: int = 0
    insurance_covered: bool = True


class _PatientIn(BaseModel):
    id: Optional[UUID] = None
    age: Optional[int] = None
    sex: Optional[str] = None       # M/F
    weight_kg: Optional[float] = None


class PreScreenRequest(BaseModel):
    patient: Optional[_PatientIn] = None
    diagnoses: List[_DiagnosisIn] = Field(default_factory=list)
    procedures: List[_ProcedureIn] = Field(default_factory=list)
    drugs: List[_DrugIn] = Field(default_factory=list)
    visit_type: str = "INITIAL"
    copay_rate: float = 0.30
    cross_check_active_meds: bool = True   # 환자의 최근 90일 처방 약물도 병용금기 검사에 포함


class IssueOut(BaseModel):
    code: str
    category: str
    category_label: str
    severity: str
    title: str
    message: str
    fix_hint: str = ""
    blocking: bool = False
    item_index: Optional[int] = None
    procedure_index: Optional[int] = None


class EstimateOut(BaseModel):
    consultation_fee: int
    prescription_fee: int
    procedure_total: int
    drug_total: int
    subtotal: int
    insurance_amount: int
    patient_amount: int
    copay_rate: float


class PreScreenResponse(BaseModel):
    score: int
    estimate: EstimateOut
    issues: List[IssueOut]
    passed: List[str]
    summary: dict
    blocking_count: int
    cross_checked_meds: int = 0
    grade: str            # A+/A/B/C/D — UI 배지용


# ────────────────────────────────────────────────────────────
#  Helpers
# ────────────────────────────────────────────────────────────
def _grade(score: int) -> str:
    if score >= 95:
        return "A+"
    if score >= 85:
        return "A"
    if score >= 70:
        return "B"
    if score >= 50:
        return "C"
    return "D"


async def _enrich_patient(
    db: AsyncSession, user_id: UUID, patient_in: Optional[_PatientIn]
) -> CdssPatient:
    """patient.id가 주어지면 DB에서 생일·성별 가져와 보강."""
    if not patient_in:
        return CdssPatient()
    age = patient_in.age
    sex = patient_in.sex
    weight = patient_in.weight_kg

    if patient_in.id:
        q = select(Patient).where(and_(
            Patient.id == patient_in.id,
            Patient.user_id == user_id,
        ))
        p = (await db.execute(q)).scalar_one_or_none()
        if p:
            if age is None and p.birth_date:
                today = date.today()
                age = today.year - p.birth_date.year - (
                    (today.month, today.day) < (p.birth_date.month, p.birth_date.day)
                )
            if not sex and p.gender:
                sex = p.gender
    return CdssPatient(age=age, sex=sex, weight_kg=weight)


async def _fetch_active_meds_as_drugs(
    db: AsyncSession, user_id: UUID, patient_id: UUID, days: int = 90
) -> List[CdssDrug]:
    from datetime import timedelta
    cutoff = date.today() - timedelta(days=days)
    q = (
        select(Prescription)
        .where(and_(
            Prescription.user_id == user_id,
            Prescription.patient_id == patient_id,
            Prescription.prescribed_date >= cutoff,
            Prescription.status != PrescriptionStatus.CANCELLED,
        ))
        .options(selectinload(Prescription.items))
        .order_by(desc(Prescription.prescribed_date))
        .limit(20)
    )
    rxs = (await db.execute(q)).scalars().all()
    out: List[CdssDrug] = []
    for rx in rxs:
        for item in rx.items:
            out.append(CdssDrug(
                drug_name=item.drug_name or "",
                ingredient=item.ingredient or "",
                dose_per_time=item.dose_per_time or 1.0,
                frequency_per_day=item.frequency_per_day or 1,
                duration_days=item.duration_days or 1,
            ))
    return out


# ────────────────────────────────────────────────────────────
#  Endpoints
# ────────────────────────────────────────────────────────────
@router.post("/pre-screen", response_model=PreScreenResponse)
async def cdss_pre_screen(
    payload: PreScreenRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """처방 저장 직전 9종 점검 + 점수 + 예상청구액."""
    patient = await _enrich_patient(db, current_user.id, payload.patient)

    drugs = [
        CdssDrug(
            drug_name=d.drug_name,
            ingredient=d.ingredient or "",
            dose_per_time=d.dose_per_time,
            dose_unit=d.dose_unit,
            frequency_per_day=d.frequency_per_day,
            duration_days=d.duration_days,
            total_quantity=d.total_quantity or 0.0,
        )
        for d in payload.drugs
    ]

    # 환자의 기존 복용약과 cross-check (병용금기/중복 보강)
    cross_count = 0
    if payload.cross_check_active_meds and payload.patient and payload.patient.id:
        active = await _fetch_active_meds_as_drugs(db, current_user.id, payload.patient.id)
        cross_count = len(active)
        # cross-check용으로만 합쳐서 검사 — 점검 후 신규 처방 인덱스만 사용
        all_drugs = drugs + active
    else:
        all_drugs = drugs

    diags = [CdssDiagnosis(code=d.code, name=d.name, is_primary=d.is_primary)
             for d in payload.diagnoses]
    procs = [CdssProcedure(
        code=p.code, name=p.name, category=p.category or "",
        quantity=p.quantity, unit_price=p.unit_price,
        insurance_covered=p.insurance_covered,
    ) for p in payload.procedures]

    result = pre_screen(
        patient=patient,
        diagnoses=diags,
        procedures=procs,
        drugs=all_drugs,
        visit_type=payload.visit_type,
        copay_rate=payload.copay_rate,
    )

    # 신규 처방(index < len(drugs))의 이슈만 item_index 유효, 그 외엔 cross-check만 메시지에 포함
    new_count = len(drugs)
    issues_out: List[IssueOut] = []
    for it in result.issues:
        # cross-check로 잡힌 이슈에서 item_index가 신규 범위를 벗어나면 None으로
        idx = it.item_index
        if idx is not None and idx >= new_count:
            idx = None
        issues_out.append(IssueOut(
            code=it.code,
            category=it.category,
            category_label=CATEGORY_LABELS_KO.get(it.category, it.category),
            severity=it.severity,
            title=it.title,
            message=it.message,
            fix_hint=it.fix_hint,
            blocking=it.blocking,
            item_index=idx,
            procedure_index=it.procedure_index,
        ))

    return PreScreenResponse(
        score=result.score,
        estimate=EstimateOut(**result.estimate.__dict__),
        issues=issues_out,
        passed=result.passed,
        summary=result.summary,
        blocking_count=result.blocking_count,
        cross_checked_meds=cross_count,
        grade=_grade(result.score),
    )


@router.get("/categories")
async def cdss_categories():
    """9종 카테고리 메타정보 (UI 헤더용)."""
    return {
        "categories": [
            {"code": c, "label": CATEGORY_LABELS_KO.get(c, c)}
            for c in CATEGORIES
        ]
    }
