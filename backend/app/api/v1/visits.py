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
from ...models.bill import Bill, BillItem, BillStatus
from ...schemas.emr_core import (
    VisitCreate, VisitUpdate, VisitOut, VisitListItem, BillOut,
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
    visit_type: Optional[str] = None,
    diagnosis: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """진료 기록 목록 (필터: 환자/기간/상태/구분/진단/주소)."""
    from sqlalchemy import or_
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
    if visit_type:
        q = q.where(Visit.visit_type == visit_type)
    if search:
        like = f"%{search}%"
        q = q.where(or_(
            Visit.chief_complaint.ilike(like),
            Visit.chart_no.ilike(like),
            Visit.visit_no.ilike(like),
        ))
    if diagnosis:
        like = f"%{diagnosis}%"
        # 진단명·코드 매치는 join으로
        q = q.join(VisitDiagnosis).where(or_(
            VisitDiagnosis.name.ilike(like),
            VisitDiagnosis.code.ilike(like),
        )).distinct()

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


@router.post("/{visit_id}/create-bill", response_model=BillOut)
async def create_bill_from_visit(
    visit_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """진료 기록의 시술 항목을 바탕으로 청구서 자동 생성.

    진찰료(BASIC_001) 기본 추가 + 시술/검사/주사/처치는 그대로 항목화.
    급여 항목은 본인부담률 30% 기본, 비급여는 100%.
    """
    q = (
        select(Visit)
        .where(and_(Visit.id == visit_id, Visit.user_id == current_user.id))
        .options(selectinload(Visit.procedures))
    )
    visit = (await db.execute(q)).scalar_one_or_none()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    # 이미 이 진료에 발행된 청구서가 있으면 거부
    existing = (await db.execute(
        select(Bill).where(and_(Bill.visit_id == visit_id, Bill.status != BillStatus.CANCELLED))
    )).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"이미 청구서가 발행되었습니다 ({existing.bill_no})",
        )

    # 청구 항목 = 진찰료 + 시술 항목들
    items_to_create = []
    # 진찰료 — 초진/재진/검진별 표준 단가 (HIRA 2024 의원급)
    consultation_fee = (
        17_700 if visit.visit_type == "INITIAL" else 11_540  # REVISIT/CHECKUP
    )
    items_to_create.append({
        "item_type": "CONSULTATION",
        "code": "AA100" if visit.visit_type == "INITIAL" else "AA200",
        "name": "초진 진찰료" if visit.visit_type == "INITIAL" else "재진 진찰료",
        "quantity": 1,
        "unit_price": consultation_fee,
        "total_price": consultation_fee,
        "insurance_covered": True,
        "copay_rate": 0.30,
    })
    # 시술 항목
    for p in visit.procedures:
        item_type = {
            "진찰": "CONSULTATION", "검사": "EXAM", "시술": "PROCEDURE",
            "주사": "PROCEDURE", "처치": "PROCEDURE",
        }.get(p.category or "시술", "PROCEDURE")
        items_to_create.append({
            "item_type": item_type,
            "code": p.code,
            "name": p.name,
            "quantity": p.quantity,
            "unit_price": p.unit_price,
            "total_price": p.total_price,
            "insurance_covered": p.insurance_covered,
            "copay_rate": 0.30 if p.insurance_covered else 1.0,
        })

    # 금액 계산 (보험·본인·비급여 분리)
    subtotal = 0
    insurance = 0
    patient_amount = 0
    non_covered = 0
    for it in items_to_create:
        total = it["total_price"]
        subtotal += total
        if it["insurance_covered"]:
            copay = int(total * it["copay_rate"])
            patient_amount += copay
            insurance += total - copay
        else:
            non_covered += total
            patient_amount += total

    final = patient_amount + non_covered

    # bill 번호 (V- 대신 B-)
    today = datetime.utcnow().strftime("%Y%m%d")
    suffix = str(current_user.id)[:6].upper()
    micro = datetime.utcnow().strftime("%H%M%S%f")[:9]
    bill_no = f"B-{today}-{suffix}-{micro}"

    bill = Bill(
        user_id=current_user.id,
        visit_id=visit.id,
        patient_id=visit.patient_id,
        bill_no=bill_no,
        bill_date=visit.visit_date,
        subtotal=subtotal,
        insurance_amount=insurance,
        patient_amount=patient_amount,
        non_covered_amount=non_covered,
        discount_amount=0,
        final_amount=final,
        balance=final,
        status=BillStatus.ISSUED,
        issued_at=datetime.utcnow(),
        memo=f"진료기록 {visit.visit_no} 자동 생성",
    )
    db.add(bill)
    await db.flush()
    for it in items_to_create:
        db.add(BillItem(bill_id=bill.id, **it))
    await db.commit()
    await db.refresh(bill, ["items", "payments"])
    return bill


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


@router.get("/stats/dashboard")
async def dashboard_stats(
    months: int = Query(6, ge=1, le=24),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """월별 진료수·매출·환자수 + 진료과 분포 + 진단 TOP 10."""
    from datetime import timedelta
    from dateutil.relativedelta import relativedelta as _rd
    today = date.today()
    start = (today - _rd(months=months - 1)).replace(day=1)

    # 월별 진료 수
    rows = (await db.execute(
        select(
            func.to_char(Visit.visit_date, 'YYYY-MM').label('month'),
            func.count(Visit.id).label('count'),
            func.count(func.distinct(Visit.patient_id)).label('unique_patients'),
        )
        .where(and_(
            Visit.user_id == current_user.id,
            Visit.visit_date >= start,
        ))
        .group_by('month')
        .order_by('month')
    )).all()
    monthly = [
        {"month": r[0], "visits": r[1], "patients": r[2]}
        for r in rows
    ]

    # 월별 매출 (Bill 기반)
    rev_rows = (await db.execute(
        select(
            func.to_char(Bill.bill_date, 'YYYY-MM').label('month'),
            func.coalesce(func.sum(Bill.paid_amount), 0).label('revenue'),
        )
        .where(and_(
            Bill.user_id == current_user.id,
            Bill.bill_date >= start,
        ))
        .group_by('month')
        .order_by('month')
    )).all()
    rev_map = {r[0]: int(r[1]) for r in rev_rows}
    for m in monthly:
        m["revenue"] = rev_map.get(m["month"], 0)

    # 진료 구분 분포
    type_rows = (await db.execute(
        select(Visit.visit_type, func.count(Visit.id))
        .where(and_(
            Visit.user_id == current_user.id,
            Visit.visit_date >= start,
        ))
        .group_by(Visit.visit_type)
    )).all()
    by_type = {r[0]: r[1] for r in type_rows}

    # 진단 TOP 10
    dx_rows = (await db.execute(
        select(VisitDiagnosis.code, VisitDiagnosis.name, func.count(VisitDiagnosis.id).label('n'))
        .join(Visit, Visit.id == VisitDiagnosis.visit_id)
        .where(and_(
            Visit.user_id == current_user.id,
            Visit.visit_date >= start,
        ))
        .group_by(VisitDiagnosis.code, VisitDiagnosis.name)
        .order_by(desc('n'))
        .limit(10)
    )).all()
    top_dx = [{"code": r[0], "name": r[1], "count": r[2]} for r in dx_rows]

    return {
        "months": months,
        "start": start.isoformat(),
        "monthly": monthly,
        "by_visit_type": by_type,
        "top_diagnoses": top_dx,
    }
