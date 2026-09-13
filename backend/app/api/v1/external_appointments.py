"""외부 채널(똑닥/굿닥/네이버) 예약 통합 인박스.

Webhook (Public, 시크릿 헤더):
  POST /webhooks/appointments/{channel}
       — 표준 페이로드로 들어오는 예약 1건을 수신.
       — 채널별 어댑터/프록시가 표준 포맷으로 변환해 우리에게 전달한다는 가정.

의사용 (인증):
  GET    /external-appointments              — 인박스 목록
  GET    /external-appointments/stats        — 채널별 PENDING 카운트
  POST   /external-appointments/{id}/confirm — 우리 appointments에 row 생성
  POST   /external-appointments/{id}/reject  — 거절
"""
from datetime import datetime, timedelta, date
from typing import List, Optional
from uuid import UUID
import os

from fastapi import APIRouter, Depends, Header, HTTPException, Path, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..deps import get_db, get_current_active_user
from ...models.user import User
from ...models.appointment import Appointment, AppointmentStatus
from ...models.external_appointment import (
    ExternalAppointment, ExtApptChannel, ExtApptStatus,
)


# ════════════════════════════════════════════════════════════
#  Webhook (Public)
# ════════════════════════════════════════════════════════════
webhook_router = APIRouter()


class ChannelWebhookPayload(BaseModel):
    """모든 채널 어댑터가 우리 형식으로 변환해서 보낸다."""
    user_id: str               # 의원 사용자 ID (어댑터에서 매핑)
    external_id: Optional[str] = None
    patient_name: str
    patient_phone: Optional[str] = None
    patient_birth: Optional[date] = None
    doctor_name: Optional[str] = None
    start_time: datetime
    duration_min: int = 15
    chief_complaint: Optional[str] = None
    memo: Optional[str] = None
    raw: dict = Field(default_factory=dict)


def _check_channel_secret(channel: str, supplied: Optional[str]) -> None:
    """환경변수 BOOK_WEBHOOK_SECRET_<CHANNEL> (대문자) 또는 BOOK_WEBHOOK_SECRET 공통 키.
    개발 모드(둘 다 미설정) 시에는 통과(편의용)."""
    expected_specific = os.getenv(f"BOOK_WEBHOOK_SECRET_{channel.upper()}", "")
    expected_common = os.getenv("BOOK_WEBHOOK_SECRET", "")
    if not expected_specific and not expected_common:
        return                  # 미설정 시 통과 (개발 편의)
    if supplied and (supplied == expected_specific or supplied == expected_common):
        return
    raise HTTPException(status_code=401, detail="Invalid channel secret")


async def _detect_conflict(
    db: AsyncSession, user_id: UUID, start: datetime, end: datetime
) -> Optional[Appointment]:
    q = select(Appointment).where(and_(
        Appointment.user_id == user_id,
        Appointment.status.notin_([AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW]),
        Appointment.start_time < end,
        Appointment.end_time > start,
    )).limit(1)
    return (await db.execute(q)).scalar_one_or_none()


@webhook_router.post("/appointments/{channel}")
async def receive_external_appointment(
    channel: str = Path(..., description="DDOCDOC|GOODOC|NAVER|KAKAO|OTHER"),
    payload: ChannelWebhookPayload = ...,
    x_channel_secret: Optional[str] = Header(None, alias="X-Channel-Secret"),
    db: AsyncSession = Depends(get_db),
):
    _check_channel_secret(channel, x_channel_secret)
    try:
        ch = ExtApptChannel(channel.upper())
    except ValueError:
        ch = ExtApptChannel.OTHER

    # user 검증
    try:
        uid = UUID(payload.user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="invalid user_id")
    u = (await db.execute(select(User).where(User.id == uid))).scalar_one_or_none()
    if not u:
        raise HTTPException(status_code=404, detail="user not found")

    # 중복(같은 채널 external_id) 검사 — 멱등성
    if payload.external_id:
        q = select(ExternalAppointment).where(and_(
            ExternalAppointment.user_id == uid,
            ExternalAppointment.channel == ch,
            ExternalAppointment.external_id == payload.external_id,
        ))
        existing = (await db.execute(q)).scalar_one_or_none()
        if existing:
            return {"ok": True, "id": str(existing.id), "status": existing.status.value, "duplicate": True}

    end = payload.start_time + timedelta(minutes=payload.duration_min)
    conflict = await _detect_conflict(db, uid, payload.start_time, end)
    initial_status = ExtApptStatus.CONFLICT if conflict else ExtApptStatus.PENDING

    rec = ExternalAppointment(
        user_id=uid,
        channel=ch,
        external_id=payload.external_id,
        patient_name=payload.patient_name,
        patient_phone=payload.patient_phone,
        patient_birth=payload.patient_birth,
        doctor_name=payload.doctor_name,
        requested_start=payload.start_time,
        duration_min=payload.duration_min,
        chief_complaint=payload.chief_complaint,
        memo=payload.memo,
        raw_payload=payload.raw or {},
        status=initial_status,
        conflict_with=conflict.id if conflict else None,
    )
    db.add(rec)
    await db.commit()
    await db.refresh(rec)
    return {"ok": True, "id": str(rec.id), "status": rec.status.value, "conflict": bool(conflict)}


# ════════════════════════════════════════════════════════════
#  의사용 (인증)
# ════════════════════════════════════════════════════════════
doctor_router = APIRouter()


class ExtApptOut(BaseModel):
    id: UUID
    channel: str
    external_id: Optional[str]
    patient_name: str
    patient_phone: Optional[str]
    patient_birth: Optional[date]
    doctor_name: Optional[str]
    requested_start: datetime
    duration_min: int
    chief_complaint: Optional[str]
    memo: Optional[str]
    status: str
    conflict_with: Optional[UUID]
    linked_appointment_id: Optional[UUID]
    received_at: Optional[datetime]
    decided_at: Optional[datetime]
    rejection_reason: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


@doctor_router.get("", response_model=List[ExtApptOut])
async def list_external_appointments(
    status: Optional[str] = None,
    channel: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    q = (
        select(ExternalAppointment)
        .where(ExternalAppointment.user_id == current_user.id)
        .order_by(ExternalAppointment.requested_start.asc())
    )
    if status:
        q = q.where(ExternalAppointment.status == status)
    if channel:
        q = q.where(ExternalAppointment.channel == channel)
    if date_from:
        q = q.where(ExternalAppointment.requested_start >= datetime.combine(date_from, datetime.min.time()))
    if date_to:
        q = q.where(ExternalAppointment.requested_start <= datetime.combine(date_to, datetime.max.time()))
    q = q.offset((page - 1) * page_size).limit(page_size)
    return list((await db.execute(q)).scalars().all())


@doctor_router.get("/stats")
async def stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """채널별 PENDING/CONFLICT 카운트."""
    q = (
        select(
            ExternalAppointment.channel,
            ExternalAppointment.status,
            func.count(ExternalAppointment.id),
        )
        .where(ExternalAppointment.user_id == current_user.id)
        .where(ExternalAppointment.status.in_([
            ExtApptStatus.PENDING, ExtApptStatus.CONFLICT,
        ]))
        .group_by(ExternalAppointment.channel, ExternalAppointment.status)
    )
    rows = (await db.execute(q)).all()
    by_channel: dict[str, dict[str, int]] = {}
    total_pending = 0
    for ch, st, cnt in rows:
        ch_key = ch.value if hasattr(ch, "value") else str(ch)
        st_key = st.value if hasattr(st, "value") else str(st)
        by_channel.setdefault(ch_key, {})[st_key] = cnt
        total_pending += cnt
    return {"total_pending": total_pending, "by_channel": by_channel}


@doctor_router.post("/{ext_id}/confirm", response_model=ExtApptOut)
async def confirm_external(
    ext_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """확정 — appointments 테이블에 row 생성하고 link."""
    q = select(ExternalAppointment).where(and_(
        ExternalAppointment.id == ext_id,
        ExternalAppointment.user_id == current_user.id,
    ))
    rec = (await db.execute(q)).scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="외부 예약을 찾을 수 없습니다.")
    if rec.status not in (ExtApptStatus.PENDING, ExtApptStatus.CONFLICT):
        raise HTTPException(status_code=400, detail="이미 처리된 예약입니다.")

    end = rec.requested_start + timedelta(minutes=rec.duration_min)
    appt = Appointment(
        user_id=current_user.id,
        patient_name=rec.patient_name,
        patient_phone=rec.patient_phone,
        patient_birth=rec.patient_birth,
        doctor_id=current_user.id,
        doctor_name=rec.doctor_name or current_user.full_name,
        start_time=rec.requested_start,
        end_time=end,
        duration_min=rec.duration_min,
        appointment_type="INITIAL",
        chief_complaint=rec.chief_complaint,
        memo=rec.memo,
        channel=rec.channel.value if hasattr(rec.channel, "value") else str(rec.channel),
    )
    db.add(appt)
    await db.flush()

    rec.status = ExtApptStatus.CONFIRMED
    rec.linked_appointment_id = appt.id
    rec.decided_at = datetime.utcnow()
    rec.decided_by = current_user.id
    await db.commit()
    await db.refresh(rec)
    return rec


@doctor_router.post("/{ext_id}/reject", response_model=ExtApptOut)
async def reject_external(
    ext_id: UUID,
    reason: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    q = select(ExternalAppointment).where(and_(
        ExternalAppointment.id == ext_id,
        ExternalAppointment.user_id == current_user.id,
    ))
    rec = (await db.execute(q)).scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="외부 예약을 찾을 수 없습니다.")
    if rec.status not in (ExtApptStatus.PENDING, ExtApptStatus.CONFLICT):
        raise HTTPException(status_code=400, detail="이미 처리된 예약입니다.")
    rec.status = ExtApptStatus.REJECTED
    rec.rejection_reason = reason
    rec.decided_at = datetime.utcnow()
    rec.decided_by = current_user.id
    await db.commit()
    await db.refresh(rec)
    return rec
