"""예약(Appointment) API — 캘린더, 시간대 충돌 검증"""
import logging
from datetime import date, datetime, timedelta
from typing import List, Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..deps import get_db, get_current_active_user
from ...models.user import User
from ...models.appointment import Appointment, AppointmentStatus
from ...models.patient import Patient
from ...appointment_workflow import validate_transition, clinic_datetime, clinic_today
from ...schemas.emr_core import (
    AppointmentCreate, AppointmentUpdate, AppointmentOut,
)

logger = logging.getLogger(__name__)
router = APIRouter()


def _set_status(appt, target):
    current = appt.status.value if hasattr(appt.status, "value") else appt.status
    try:
        validate_transition(current, target)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    appt.status = AppointmentStatus(target)
    if target == "ARRIVED" and not appt.arrived_at:
        appt.arrived_at = datetime.utcnow()
    if target == "COMPLETED" and not appt.completed_at:
        appt.completed_at = datetime.utcnow()


async def _check_conflict(
    db: AsyncSession,
    user_id: UUID,
    start: datetime,
    end: datetime,
    exclude_id: Optional[UUID] = None,
    doctor_id: Optional[UUID] = None,
) -> bool:
    """동일 의사·동일 시간대 예약 충돌 검증."""
    q = select(Appointment).where(and_(
        Appointment.user_id == user_id,
        Appointment.status.notin_([AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW]),
        # 시간 겹침: existing.start < new.end AND existing.end > new.start
        Appointment.start_time < end,
        Appointment.end_time > start,
    ))
    if exclude_id:
        q = q.where(Appointment.id != exclude_id)
    if doctor_id:
        q = q.where(Appointment.doctor_id == doctor_id)
    res = await db.execute(q.limit(1))
    return res.scalar_one_or_none() is not None


@router.post("", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    payload: AppointmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """예약 생성 (시간 충돌 자동 검증)."""
    # Serialize booking writes per owner so two concurrent requests cannot both
    # pass the same time-conflict check.
    await db.execute(select(User.id).where(User.id == current_user.id).with_for_update())
    patient = None
    if payload.patient_id:
        patient = (await db.execute(select(Patient).where(
            Patient.id == payload.patient_id, Patient.user_id == current_user.id,
        ))).scalar_one_or_none()
        if not patient:
            raise HTTPException(status_code=404, detail="환자를 찾을 수 없습니다.")
    end = payload.start_time + timedelta(minutes=payload.duration_min)

    if await _check_conflict(db, current_user.id, payload.start_time, end):
        raise HTTPException(
            status_code=409,
            detail="해당 시간대에 이미 예약이 있습니다.",
        )

    # Direct-entry booking creates its patient in the same transaction.
    # Subsequent chart and prescription screens receive a real patient UUID.
    if patient is None:
        patient = Patient(
            user_id=current_user.id,
            name=payload.patient_name,
            phone=payload.patient_phone,
            birth_date=payload.patient_birth,
            chart_no=f"P-{uuid4().hex[:12].upper()}",
        )
        db.add(patient)
        await db.flush()

    appt = Appointment(
        user_id=current_user.id,
        patient_id=patient.id,
        patient_name=patient.name,
        patient_phone=payload.patient_phone or patient.phone,
        patient_birth=payload.patient_birth or patient.birth_date,
        doctor_id=current_user.id,
        doctor_name=payload.doctor_name or current_user.name,
        start_time=payload.start_time,
        end_time=end,
        duration_min=payload.duration_min,
        appointment_type=payload.appointment_type,
        chief_complaint=payload.chief_complaint,
        memo=payload.memo,
        channel=payload.channel,
    )
    db.add(appt)
    await db.commit()
    await db.refresh(appt)
    return appt


@router.get("", response_model=List[AppointmentOut])
async def list_appointments(
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    patient_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """예약 목록. 기본: 오늘 ~ 7일 후."""
    if date_from is None:
        date_from = datetime.combine(clinic_today(), datetime.min.time())
    if date_to is None:
        date_to = date_from + timedelta(days=7)
    date_from, date_to = clinic_datetime(date_from), clinic_datetime(date_to)

    q = (
        select(Appointment)
        .where(and_(
            Appointment.user_id == current_user.id,
            Appointment.start_time >= date_from,
            Appointment.start_time < date_to,
        ))
        .order_by(Appointment.start_time)
    )
    if status_filter:
        q = q.where(Appointment.status == status_filter)
    if patient_id:
        q = q.where(Appointment.patient_id == patient_id)

    res = await db.execute(q)
    return res.scalars().all()


@router.get("/{appointment_id}", response_model=AppointmentOut)
async def get_appointment(
    appointment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    appt = (await db.execute(
        select(Appointment).where(and_(
            Appointment.id == appointment_id,
            Appointment.user_id == current_user.id,
        ))
    )).scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appt


@router.patch("/{appointment_id}", response_model=AppointmentOut)
async def update_appointment(
    appointment_id: UUID,
    payload: AppointmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await db.execute(select(User.id).where(User.id == current_user.id).with_for_update())
    appt = (await db.execute(
        select(Appointment).where(and_(
            Appointment.id == appointment_id,
            Appointment.user_id == current_user.id,
        ))
    )).scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    data = payload.model_dump(exclude_unset=True)

    # 시간 변경 시 충돌 재검증
    new_start = data.get("start_time", appt.start_time)
    new_dur = data.get("duration_min", appt.duration_min)
    new_end = new_start + timedelta(minutes=new_dur)

    if "start_time" in data or "duration_min" in data:
        if await _check_conflict(
            db, current_user.id, new_start, new_end, exclude_id=appt.id
        ):
            raise HTTPException(status_code=409, detail="시간대 충돌")
        appt.start_time = new_start
        appt.end_time = new_end
        appt.duration_min = new_dur

    if "status" in data:
        _set_status(appt, data["status"])
    for k in ("chief_complaint", "memo", "cancelled_reason"):
        if k in data:
            setattr(appt, k, data[k])

    await db.commit()
    await db.refresh(appt)
    return appt


@router.post("/{appointment_id}/check-in", response_model=AppointmentOut)
async def check_in(
    appointment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """환자 도착 처리."""
    appt = (await db.execute(
        select(Appointment).where(and_(
            Appointment.id == appointment_id,
            Appointment.user_id == current_user.id,
        ))
    )).scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    _set_status(appt, "ARRIVED")
    await db.commit()
    await db.refresh(appt)
    return appt


@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_appointment(
    appointment_id: UUID,
    reason: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """예약 취소 (soft cancel)."""
    appt = (await db.execute(
        select(Appointment).where(and_(
            Appointment.id == appointment_id,
            Appointment.user_id == current_user.id,
        ))
    )).scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    _set_status(appt, "CANCELLED")
    appt.cancelled_reason = reason
    await db.commit()


@router.get("/stats/today")
async def today_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """대시보드용 오늘 예약 통계."""
    today_start = datetime.combine(clinic_today(), datetime.min.time())
    today_end = today_start + timedelta(days=1)

    rows = (await db.execute(
        select(Appointment.status, func.count(Appointment.id))
        .where(and_(
            Appointment.user_id == current_user.id,
            Appointment.start_time >= today_start,
            Appointment.start_time < today_end,
        ))
        .group_by(Appointment.status)
    )).all()

    counts = {s.value if hasattr(s, "value") else str(s): n for s, n in rows}
    return {
        "total": sum(counts.values()),
        "by_status": counts,
        "scheduled": counts.get("SCHEDULED", 0),
        "arrived": counts.get("ARRIVED", 0),
        "completed": counts.get("COMPLETED", 0),
        "no_show": counts.get("NO_SHOW", 0),
    }
