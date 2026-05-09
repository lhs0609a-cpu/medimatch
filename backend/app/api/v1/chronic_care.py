"""만성질환관리(만관제) API.

  POST   /chronic-care/programs                 — 환자 등록 (조건별)
  GET    /chronic-care/programs                  — 프로그램 목록 (필터)
  GET    /chronic-care/programs/{id}            — 프로그램 + 회차 이력
  PATCH  /chronic-care/programs/{id}            — 목표/메모/간격 수정
  POST   /chronic-care/programs/{id}/visits     — 회차 추가 → 자동으로 next_visit/total 갱신
  POST   /chronic-care/programs/{id}/graduate   — 졸업
  POST   /chronic-care/programs/{id}/drop       — 중도 탈락
  GET    /chronic-care/leaks                    — 누수 환자 (next_visit 지난) → 콜큐 enqueue용
  GET    /chronic-care/stats                    — 조건별 환자 수, 평균 회차, 목표 달성률
"""
from datetime import datetime, timedelta, date
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, and_, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..deps import get_db, get_current_active_user
from ...models.user import User
from ...models.patient import Patient
from ...models.chronic_care import (
    ChronicCareProgram, ChronicCareVisit,
    ChronicCondition, ChronicStatus, ChronicVisitKind,
)


router = APIRouter()


# 조건별 기본 회차 간격 (일)
DEFAULT_INTERVAL = {
    ChronicCondition.HYPERTENSION: 30,
    ChronicCondition.DIABETES: 90,
    ChronicCondition.DYSLIPIDEMIA: 90,
    ChronicCondition.OBESITY: 30,
    ChronicCondition.OTHER: 60,
}

CONDITION_LABELS = {
    "HYPERTENSION": "고혈압",
    "DIABETES": "당뇨",
    "DYSLIPIDEMIA": "이상지질혈증",
    "OBESITY": "비만",
    "OTHER": "기타",
}


# ─── Schemas ──────────────────────────────────────────────────
class ProgramCreate(BaseModel):
    patient_id: UUID
    condition: str
    target_systolic: Optional[int] = None
    target_diastolic: Optional[int] = None
    target_hba1c: Optional[float] = None
    target_fbs: Optional[int] = None
    target_ldl: Optional[int] = None
    target_weight: Optional[float] = None
    interval_days: Optional[int] = None
    memo: Optional[str] = None


class ProgramUpdate(BaseModel):
    target_systolic: Optional[int] = None
    target_diastolic: Optional[int] = None
    target_hba1c: Optional[float] = None
    target_fbs: Optional[int] = None
    target_ldl: Optional[int] = None
    target_weight: Optional[float] = None
    interval_days: Optional[int] = None
    memo: Optional[str] = None
    status: Optional[str] = None


class VisitCreateChronic(BaseModel):
    kind: str = "VISIT"
    visit_date: Optional[datetime] = None
    systolic: Optional[int] = None
    diastolic: Optional[int] = None
    fbs: Optional[int] = None
    hba1c: Optional[float] = None
    ldl: Optional[int] = None
    hdl: Optional[int] = None
    tg: Optional[int] = None
    weight: Optional[float] = None
    education_topic: Optional[str] = None
    data: dict = Field(default_factory=dict)
    notes: Optional[str] = None
    linked_visit_id: Optional[UUID] = None


class VisitOut(BaseModel):
    id: UUID
    visit_date: datetime
    kind: str
    systolic: Optional[int]
    diastolic: Optional[int]
    fbs: Optional[int]
    hba1c: Optional[float]
    ldl: Optional[int]
    hdl: Optional[int]
    tg: Optional[int]
    weight: Optional[float]
    education_topic: Optional[str]
    notes: Optional[str]
    linked_visit_id: Optional[UUID]
    created_at: datetime

    class Config:
        from_attributes = True


class ProgramOut(BaseModel):
    id: UUID
    patient_id: UUID
    patient_name: Optional[str] = None
    patient_phone: Optional[str] = None
    condition: str
    condition_label: str
    status: str
    enrolled_at: Optional[datetime]
    graduated_at: Optional[datetime]
    target_systolic: Optional[int]
    target_diastolic: Optional[int]
    target_hba1c: Optional[float]
    target_fbs: Optional[int]
    target_ldl: Optional[int]
    target_weight: Optional[float]
    total_visits: int
    total_education_count: int
    last_visit_at: Optional[datetime]
    next_visit_at: Optional[datetime]
    interval_days: int
    memo: Optional[str]
    is_overdue: bool = False
    days_overdue: int = 0


def _to_program_out(prog: ChronicCareProgram, patient: Optional[Patient]) -> ProgramOut:
    is_overdue = False
    days_overdue = 0
    if prog.next_visit_at and prog.status == ChronicStatus.ACTIVE:
        delta = (datetime.utcnow() - prog.next_visit_at).days
        if delta > 0:
            is_overdue = True
            days_overdue = delta
    return ProgramOut(
        id=prog.id,
        patient_id=prog.patient_id,
        patient_name=patient.name if patient else None,
        patient_phone=patient.phone if patient else None,
        condition=prog.condition.value if hasattr(prog.condition, "value") else str(prog.condition),
        condition_label=CONDITION_LABELS.get(
            prog.condition.value if hasattr(prog.condition, "value") else str(prog.condition),
            "기타",
        ),
        status=prog.status.value if hasattr(prog.status, "value") else str(prog.status),
        enrolled_at=prog.enrolled_at,
        graduated_at=prog.graduated_at,
        target_systolic=prog.target_systolic,
        target_diastolic=prog.target_diastolic,
        target_hba1c=prog.target_hba1c,
        target_fbs=prog.target_fbs,
        target_ldl=prog.target_ldl,
        target_weight=prog.target_weight,
        total_visits=prog.total_visits,
        total_education_count=prog.total_education_count,
        last_visit_at=prog.last_visit_at,
        next_visit_at=prog.next_visit_at,
        interval_days=prog.interval_days,
        memo=prog.memo,
        is_overdue=is_overdue,
        days_overdue=days_overdue,
    )


async def _get_program(db: AsyncSession, user_id, prog_id: UUID) -> ChronicCareProgram:
    q = select(ChronicCareProgram).where(and_(
        ChronicCareProgram.id == prog_id,
        ChronicCareProgram.user_id == user_id,
    ))
    p = (await db.execute(q)).scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="만관제 프로그램을 찾을 수 없습니다.")
    return p


async def _get_patient(db: AsyncSession, user_id, patient_id) -> Optional[Patient]:
    q = select(Patient).where(and_(
        Patient.id == patient_id,
        Patient.user_id == user_id,
    ))
    return (await db.execute(q)).scalar_one_or_none()


# ─── Endpoints ────────────────────────────────────────────────
@router.post("/programs", response_model=ProgramOut, status_code=201)
async def create_program(
    payload: ProgramCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        cond = ChronicCondition(payload.condition.upper())
    except ValueError:
        raise HTTPException(status_code=400, detail="알 수 없는 만성질환 코드")

    patient = await _get_patient(db, current_user.id, payload.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="환자를 찾을 수 없습니다.")

    # 중복 체크
    existing = (await db.execute(
        select(ChronicCareProgram).where(and_(
            ChronicCareProgram.user_id == current_user.id,
            ChronicCareProgram.patient_id == payload.patient_id,
            ChronicCareProgram.condition == cond,
        ))
    )).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="이미 등록된 만관제 환자입니다.")

    interval = payload.interval_days or DEFAULT_INTERVAL.get(cond, 30)
    prog = ChronicCareProgram(
        user_id=current_user.id,
        patient_id=payload.patient_id,
        condition=cond,
        status=ChronicStatus.ACTIVE,
        target_systolic=payload.target_systolic,
        target_diastolic=payload.target_diastolic,
        target_hba1c=payload.target_hba1c,
        target_fbs=payload.target_fbs,
        target_ldl=payload.target_ldl,
        target_weight=payload.target_weight,
        interval_days=interval,
        memo=payload.memo,
        next_visit_at=datetime.utcnow() + timedelta(days=interval),
    )
    db.add(prog)
    await db.commit()
    await db.refresh(prog)
    return _to_program_out(prog, patient)


@router.get("/programs", response_model=List[ProgramOut])
async def list_programs(
    status: Optional[str] = None,
    condition: Optional[str] = None,
    overdue_only: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    q = (
        select(ChronicCareProgram, Patient)
        .join(Patient, Patient.id == ChronicCareProgram.patient_id, isouter=True)
        .where(ChronicCareProgram.user_id == current_user.id)
        .order_by(ChronicCareProgram.next_visit_at.asc().nulls_last())
    )
    if status:
        q = q.where(ChronicCareProgram.status == status)
    if condition:
        q = q.where(ChronicCareProgram.condition == condition)
    rows = (await db.execute(q)).all()
    out: List[ProgramOut] = []
    for prog, patient in rows:
        po = _to_program_out(prog, patient)
        if overdue_only and not po.is_overdue:
            continue
        out.append(po)
    return out


class ProgramDetail(ProgramOut):
    visits: List[VisitOut] = Field(default_factory=list)


@router.get("/programs/{prog_id}", response_model=ProgramDetail)
async def get_program(
    prog_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    q = select(ChronicCareProgram).where(and_(
        ChronicCareProgram.id == prog_id,
        ChronicCareProgram.user_id == current_user.id,
    )).options(selectinload(ChronicCareProgram.visits))
    prog = (await db.execute(q)).scalar_one_or_none()
    if not prog:
        raise HTTPException(status_code=404, detail="프로그램 없음")
    patient = await _get_patient(db, current_user.id, prog.patient_id)
    base = _to_program_out(prog, patient)

    visits = sorted(prog.visits, key=lambda v: v.visit_date, reverse=True)
    return ProgramDetail(
        **base.model_dump(),
        visits=[VisitOut.model_validate(v, from_attributes=True) if hasattr(VisitOut, 'model_validate') else VisitOut.from_orm(v) for v in visits],  # type: ignore[arg-type]
    )


@router.patch("/programs/{prog_id}", response_model=ProgramOut)
async def update_program(
    prog_id: UUID,
    payload: ProgramUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    prog = await _get_program(db, current_user.id, prog_id)
    data = payload.model_dump(exclude_unset=True)
    if "status" in data and data["status"]:
        try:
            prog.status = ChronicStatus(data.pop("status").upper())
        except ValueError:
            raise HTTPException(status_code=400, detail="잘못된 상태값")
    for k, v in data.items():
        setattr(prog, k, v)
    await db.commit()
    await db.refresh(prog)
    patient = await _get_patient(db, current_user.id, prog.patient_id)
    return _to_program_out(prog, patient)


@router.post("/programs/{prog_id}/visits", response_model=VisitOut, status_code=201)
async def add_visit(
    prog_id: UUID,
    payload: VisitCreateChronic,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    prog = await _get_program(db, current_user.id, prog_id)
    try:
        kind = ChronicVisitKind(payload.kind.upper())
    except ValueError:
        kind = ChronicVisitKind.VISIT
    when = payload.visit_date or datetime.utcnow()

    v = ChronicCareVisit(
        program_id=prog.id,
        user_id=current_user.id,
        visit_date=when,
        kind=kind,
        systolic=payload.systolic,
        diastolic=payload.diastolic,
        fbs=payload.fbs,
        hba1c=payload.hba1c,
        ldl=payload.ldl,
        hdl=payload.hdl,
        tg=payload.tg,
        weight=payload.weight,
        education_topic=payload.education_topic,
        data=payload.data or {},
        notes=payload.notes,
        linked_visit_id=payload.linked_visit_id,
    )
    db.add(v)

    # 프로그램 캐싱 갱신
    prog.total_visits += 1
    if kind == ChronicVisitKind.EDUCATION:
        prog.total_education_count += 1
    prog.last_visit_at = when
    prog.next_visit_at = when + timedelta(days=prog.interval_days)
    await db.commit()
    await db.refresh(v)
    return v


@router.post("/programs/{prog_id}/graduate", response_model=ProgramOut)
async def graduate(
    prog_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    prog = await _get_program(db, current_user.id, prog_id)
    prog.status = ChronicStatus.GRADUATED
    prog.graduated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(prog)
    patient = await _get_patient(db, current_user.id, prog.patient_id)
    return _to_program_out(prog, patient)


@router.post("/programs/{prog_id}/drop", response_model=ProgramOut)
async def drop(
    prog_id: UUID,
    reason: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    prog = await _get_program(db, current_user.id, prog_id)
    prog.status = ChronicStatus.DROPPED
    if reason:
        prog.memo = ((prog.memo or "") + f"\n[중도탈락] {reason}").strip()
    await db.commit()
    await db.refresh(prog)
    patient = await _get_patient(db, current_user.id, prog.patient_id)
    return _to_program_out(prog, patient)


@router.get("/leaks", response_model=List[ProgramOut])
async def list_leaks(
    days_min: int = Query(0, ge=0),
    days_max: int = Query(180, ge=1),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """누수 환자 — next_visit 지나서 days_min~days_max 사이인 ACTIVE 프로그램."""
    cutoff_min = datetime.utcnow() - timedelta(days=days_max)
    cutoff_max = datetime.utcnow() - timedelta(days=days_min)
    q = (
        select(ChronicCareProgram, Patient)
        .join(Patient, Patient.id == ChronicCareProgram.patient_id, isouter=True)
        .where(and_(
            ChronicCareProgram.user_id == current_user.id,
            ChronicCareProgram.status == ChronicStatus.ACTIVE,
            ChronicCareProgram.next_visit_at >= cutoff_min,
            ChronicCareProgram.next_visit_at <= cutoff_max,
        ))
        .order_by(ChronicCareProgram.next_visit_at.asc())
    )
    rows = (await db.execute(q)).all()
    return [_to_program_out(prog, patient) for prog, patient in rows]


@router.get("/stats")
async def stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """조건별 환자 수 + ACTIVE/누수 카운트."""
    q = (
        select(
            ChronicCareProgram.condition,
            ChronicCareProgram.status,
            func.count(ChronicCareProgram.id),
        )
        .where(ChronicCareProgram.user_id == current_user.id)
        .group_by(ChronicCareProgram.condition, ChronicCareProgram.status)
    )
    rows = (await db.execute(q)).all()
    by_condition: dict = {}
    for cond, st, cnt in rows:
        ck = cond.value if hasattr(cond, "value") else str(cond)
        sk = st.value if hasattr(st, "value") else str(st)
        by_condition.setdefault(ck, {})[sk] = cnt

    # 누수 카운트
    overdue_q = select(func.count(ChronicCareProgram.id)).where(and_(
        ChronicCareProgram.user_id == current_user.id,
        ChronicCareProgram.status == ChronicStatus.ACTIVE,
        ChronicCareProgram.next_visit_at < datetime.utcnow(),
    ))
    overdue = (await db.execute(overdue_q)).scalar_one()

    return {
        "by_condition": by_condition,
        "labels": CONDITION_LABELS,
        "overdue_count": overdue,
    }
