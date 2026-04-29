"""전자차트 (Visit) API — SOAP + 진단 + 시술"""
import logging
from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, and_, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..deps import get_db, get_current_active_user
from ...models.user import User
from ...models.visit import Visit, VisitDiagnosis, VisitProcedure, VisitStatus
from ...schemas.emr_core import (
    VisitCreate, VisitUpdate, VisitOut, VisitListItem,
)

logger = logging.getLogger(__name__)
router = APIRouter()


def _generate_visit_no(user_id: UUID) -> str:
    """V-YYYYMMDD-XXXXXX 형식의 방문번호 생성."""
    today = datetime.utcnow().strftime("%Y%m%d")
    suffix = str(user_id)[:6].upper()
    micro = datetime.utcnow().strftime("%H%M%S%f")[:9]
    return f"V-{today}-{suffix}-{micro}"


def _calc_bmi(weight: Optional[float], height: Optional[float]) -> Optional[float]:
    if not weight or not height or height <= 0:
        return None
    h_m = height / 100.0
    return round(weight / (h_m * h_m), 1)


@router.post("", response_model=VisitOut, status_code=status.HTTP_201_CREATED)
async def create_visit(
    payload: VisitCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """진료 차트 생성 (SOAP + 활력징후 + 진단/시술 일괄 저장)."""
    visit = Visit(
        user_id=current_user.id,
        patient_id=payload.patient_id,
        chart_no=payload.chart_no,
        visit_no=_generate_visit_no(current_user.id),
        visit_date=payload.visit_date,
        visit_type=payload.visit_type,
        chief_complaint=payload.chief_complaint,
        subjective=payload.subjective,
        objective=payload.objective,
        assessment=payload.assessment,
        plan=payload.plan,
        vital_systolic=payload.vital_systolic,
        vital_diastolic=payload.vital_diastolic,
        vital_hr=payload.vital_hr,
        vital_temp=payload.vital_temp,
        vital_spo2=payload.vital_spo2,
        vital_weight=payload.vital_weight,
        vital_height=payload.vital_height,
        vital_bmi=_calc_bmi(payload.vital_weight, payload.vital_height),
        doctor_id=current_user.id,
        doctor_name=payload.doctor_name or current_user.name,
        next_visit_date=payload.next_visit_date,
        visit_notes=payload.visit_notes,
        voice_transcript=payload.voice_transcript,
    )
    db.add(visit)
    await db.flush()

    for d in payload.diagnoses:
        db.add(VisitDiagnosis(
            visit_id=visit.id, code=d.code, name=d.name,
            is_primary=d.is_primary, note=d.note,
        ))
    for p in payload.procedures:
        total = (p.total_price if p.total_price else (p.unit_price * p.quantity))
        db.add(VisitProcedure(
            visit_id=visit.id, code=p.code, name=p.name, category=p.category,
            quantity=p.quantity, unit_price=p.unit_price, total_price=total,
            insurance_covered=p.insurance_covered, note=p.note,
        ))

    await db.commit()
    await db.refresh(visit, ["diagnoses", "procedures"])
    return visit


@router.get("", response_model=List[VisitListItem])
async def list_visits(
    patient_id: Optional[UUID] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """진료 기록 목록 (필터: 환자, 기간, 상태)."""
    q = (
        select(Visit)
        .where(Visit.user_id == current_user.id)
        .options(selectinload(Visit.diagnoses), selectinload(Visit.procedures))
        .order_by(desc(Visit.visit_date), desc(Visit.created_at))
    )
    if patient_id:
        q = q.where(Visit.patient_id == patient_id)
    if date_from:
        q = q.where(Visit.visit_date >= date_from)
    if date_to:
        q = q.where(Visit.visit_date <= date_to)
    if status_filter:
        q = q.where(Visit.status == status_filter)

    q = q.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(q)
    visits = result.scalars().all()

    items = []
    for v in visits:
        primary = next((d.name for d in v.diagnoses if d.is_primary), None) or (
            v.diagnoses[0].name if v.diagnoses else None
        )
        total = sum(p.total_price for p in v.procedures)
        items.append(VisitListItem(
            id=v.id,
            patient_id=v.patient_id,
            chart_no=v.chart_no,
            visit_no=v.visit_no,
            visit_date=v.visit_date,
            visit_type=v.visit_type,
            chief_complaint=v.chief_complaint,
            primary_diagnosis=primary,
            doctor_name=v.doctor_name,
            status=v.status.value if hasattr(v.status, "value") else str(v.status),
            procedure_count=len(v.procedures),
            total_amount=total,
        ))
    return items


@router.get("/{visit_id}", response_model=VisitOut)
async def get_visit(
    visit_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """진료 기록 상세."""
    q = (
        select(Visit)
        .where(and_(Visit.id == visit_id, Visit.user_id == current_user.id))
        .options(selectinload(Visit.diagnoses), selectinload(Visit.procedures))
    )
    visit = (await db.execute(q)).scalar_one_or_none()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    return visit


@router.patch("/{visit_id}", response_model=VisitOut)
async def update_visit(
    visit_id: UUID,
    payload: VisitUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """진료 기록 수정. diagnoses/procedures는 전체 교체."""
    q = (
        select(Visit)
        .where(and_(Visit.id == visit_id, Visit.user_id == current_user.id))
        .options(selectinload(Visit.diagnoses), selectinload(Visit.procedures))
    )
    visit = (await db.execute(q)).scalar_one_or_none()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    data = payload.model_dump(exclude_unset=True, exclude={"diagnoses", "procedures"})
    for k, v in data.items():
        setattr(visit, k, v)
    if "vital_weight" in data or "vital_height" in data:
        visit.vital_bmi = _calc_bmi(visit.vital_weight, visit.vital_height)

    if payload.diagnoses is not None:
        for d in list(visit.diagnoses):
            await db.delete(d)
        await db.flush()
        for d in payload.diagnoses:
            db.add(VisitDiagnosis(
                visit_id=visit.id, code=d.code, name=d.name,
                is_primary=d.is_primary, note=d.note,
            ))
    if payload.procedures is not None:
        for p in list(visit.procedures):
            await db.delete(p)
        await db.flush()
        for p in payload.procedures:
            total = (p.total_price if p.total_price else (p.unit_price * p.quantity))
            db.add(VisitProcedure(
                visit_id=visit.id, code=p.code, name=p.name, category=p.category,
                quantity=p.quantity, unit_price=p.unit_price, total_price=total,
                insurance_covered=p.insurance_covered, note=p.note,
            ))

    await db.commit()
    await db.refresh(visit, ["diagnoses", "procedures"])
    return visit


@router.post("/{visit_id}/complete", response_model=VisitOut)
async def complete_visit(
    visit_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """진료 종료 처리."""
    q = (
        select(Visit)
        .where(and_(Visit.id == visit_id, Visit.user_id == current_user.id))
        .options(selectinload(Visit.diagnoses), selectinload(Visit.procedures))
    )
    visit = (await db.execute(q)).scalar_one_or_none()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    visit.status = VisitStatus.COMPLETED
    await db.commit()
    await db.refresh(visit, ["diagnoses", "procedures"])
    return visit


@router.delete("/{visit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_visit(
    visit_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    visit = (await db.execute(
        select(Visit).where(and_(Visit.id == visit_id, Visit.user_id == current_user.id))
    )).scalar_one_or_none()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    await db.delete(visit)
    await db.commit()


@router.get("/stats/summary")
async def visit_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """대시보드용 통계: 오늘/이번달 진료 건수."""
    today = date.today()
    month_start = today.replace(day=1)

    today_count = (await db.execute(
        select(func.count(Visit.id)).where(and_(
            Visit.user_id == current_user.id,
            Visit.visit_date == today,
        ))
    )).scalar() or 0

    month_count = (await db.execute(
        select(func.count(Visit.id)).where(and_(
            Visit.user_id == current_user.id,
            Visit.visit_date >= month_start,
        ))
    )).scalar() or 0

    return {
        "today_visits": today_count,
        "month_visits": month_count,
        "as_of": datetime.utcnow().isoformat(),
    }
