"""사전문진 API.

의사용 (인증):
  POST /questionnaires/send             — 환자에게 알림톡으로 발송
  GET  /questionnaires                  — 응답 목록
  GET  /questionnaires/prefill          — 환자에 대한 가장 최근 SUBMITTED → Visit prefill payload
  POST /questionnaires/{id}/consume     — prefill 후 consume 마킹
  GET  /questionnaires/templates/{code} — 질문 마스터 (의사가 미리보기)

환자용 (Public, 토큰):
  GET  /q/{token}                       — 폼 데이터 (질문 + 환자명)
  POST /q/{token}/submit                — 응답 제출
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status as http_status
from pydantic import BaseModel, Field
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from ..deps import get_db, get_current_active_user
from ...models.user import User
from ...models.appointment import Appointment
from ...models.patient import Patient
from ...models.questionnaire import QuestionnaireResponse, QuestionnaireStatus
from ...services import questionnaire as qsvc


# ════════════════════════════════════════════════════════════
#  의사용 (인증)
# ════════════════════════════════════════════════════════════
doctor_router = APIRouter()


class SendQuestionnaireRequest(BaseModel):
    appointment_id: Optional[UUID] = None
    patient_id: Optional[UUID] = None
    patient_phone: Optional[str] = None
    patient_name: Optional[str] = None
    template_code: str = "GENERAL_V1"
    expires_in_days: int = 14


class QuestionnaireOut(BaseModel):
    id: UUID
    appointment_id: Optional[UUID]
    patient_id: Optional[UUID]
    patient_name: Optional[str]
    patient_phone: Optional[str]
    template_code: str
    status: str
    sent_at: Optional[datetime]
    opened_at: Optional[datetime]
    submitted_at: Optional[datetime]
    consumed_at: Optional[datetime]
    delivery_provider: Optional[str]
    delivery_status: Optional[str]
    chief_complaint: Optional[str]
    onset: Optional[str]
    severity: Optional[int]
    accompanying: Optional[str]
    past_history: Optional[str]
    allergies: Optional[str]
    current_meds: Optional[str]
    smoking: Optional[str]
    alcohol: Optional[str]
    family_history: Optional[str]
    note: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


@doctor_router.post("/send", response_model=QuestionnaireOut, status_code=http_status.HTTP_201_CREATED)
async def send_questionnaire(
    payload: SendQuestionnaireRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """예약 또는 환자 정보를 받아 사전문진을 알림톡으로 발송."""
    appointment_id = payload.appointment_id
    patient_id = payload.patient_id
    patient_phone = payload.patient_phone
    patient_name = payload.patient_name

    # appointment_id 주어지면 그쪽 정보로 보강
    if appointment_id:
        q = select(Appointment).where(and_(
            Appointment.id == appointment_id,
            Appointment.user_id == current_user.id,
        ))
        appt = (await db.execute(q)).scalar_one_or_none()
        if not appt:
            raise HTTPException(status_code=404, detail="예약을 찾을 수 없습니다.")
        patient_id = patient_id or appt.patient_id
        patient_phone = patient_phone or appt.patient_phone
        patient_name = patient_name or appt.patient_name

    # patient_id로 보강 (전화번호 없을 때)
    if patient_id and not patient_phone:
        q = select(Patient).where(and_(
            Patient.id == patient_id,
            Patient.user_id == current_user.id,
        ))
        p = (await db.execute(q)).scalar_one_or_none()
        if p:
            patient_phone = patient_phone or p.phone
            patient_name = patient_name or p.name

    if not patient_phone:
        raise HTTPException(status_code=400, detail="환자 휴대폰이 없어 발송할 수 없습니다.")

    qr = await qsvc.create_and_send(
        db,
        user_id=current_user.id,
        user_name=current_user.name or current_user.email,
        appointment_id=appointment_id,
        patient_id=patient_id,
        patient_name=patient_name,
        patient_phone=patient_phone,
        template_code=payload.template_code,
        expires_in_days=payload.expires_in_days,
    )
    return qr


@doctor_router.get("", response_model=List[QuestionnaireOut])
async def list_questionnaires(
    patient_id: Optional[UUID] = None,
    appointment_id: Optional[UUID] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    q = (
        select(QuestionnaireResponse)
        .where(QuestionnaireResponse.user_id == current_user.id)
        .order_by(desc(QuestionnaireResponse.created_at))
    )
    if patient_id:
        q = q.where(QuestionnaireResponse.patient_id == patient_id)
    if appointment_id:
        q = q.where(QuestionnaireResponse.appointment_id == appointment_id)
    if status:
        q = q.where(QuestionnaireResponse.status == status)
    q = q.offset((page - 1) * page_size).limit(page_size)
    res = await db.execute(q)
    return res.scalars().all()


class PrefillResponse(BaseModel):
    questionnaire_id: Optional[str] = None
    submitted_at: Optional[str] = None
    chief_complaint: str = ""
    subjective: str = ""
    patient_patch: Dict[str, Any] = Field(default_factory=dict)
    found: bool = False


@doctor_router.get("/prefill", response_model=PrefillResponse)
async def prefill_for_chart(
    patient_id: Optional[UUID] = None,
    patient_phone: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """환자에 대한 가장 최근 SUBMITTED 응답 → SOAP/Patient prefill payload."""
    if not patient_id and not patient_phone:
        return PrefillResponse(found=False)
    qr = await qsvc.latest_unconsumed_for_patient(
        db, current_user.id,
        patient_id=patient_id,
        patient_phone=patient_phone,
    )
    if not qr:
        return PrefillResponse(found=False)
    payload = qsvc.to_visit_prefill(qr)
    return PrefillResponse(found=True, **payload)


@doctor_router.post("/{qr_id}/consume", response_model=QuestionnaireOut)
async def consume_questionnaire(
    qr_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """차트에 prefill 했으니 consumed 처리 — 다음 차트에서는 안 보이게."""
    q = select(QuestionnaireResponse).where(and_(
        QuestionnaireResponse.id == qr_id,
        QuestionnaireResponse.user_id == current_user.id,
    ))
    qr = (await db.execute(q)).scalar_one_or_none()
    if not qr:
        raise HTTPException(status_code=404, detail="문진 응답을 찾을 수 없습니다.")
    await qsvc.mark_consumed(db, qr)
    await db.refresh(qr)
    return qr


@doctor_router.get("/templates/{template_code}")
async def get_template(template_code: str):
    """질문 마스터 (의사가 미리보기)"""
    return qsvc.get_template(template_code)


# ════════════════════════════════════════════════════════════
#  환자용 (Public, 토큰)
# ════════════════════════════════════════════════════════════
public_router = APIRouter()


class PublicTemplateOut(BaseModel):
    template_code: str
    title: str
    subtitle: str
    questions: List[Dict[str, Any]]
    patient_name: Optional[str] = None
    clinic_name: Optional[str] = None
    status: str
    submitted_at: Optional[datetime] = None


class PublicSubmitRequest(BaseModel):
    answers: Dict[str, Any]


@public_router.get("/{token}", response_model=PublicTemplateOut)
async def get_public_form(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    qr = await qsvc.fetch_by_token(db, token)
    if not qr:
        raise HTTPException(status_code=404, detail="잘못된 링크입니다.")
    if qr.expires_at and qr.expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="만료된 링크입니다. 병원에 재발송을 요청해 주세요.")
    if qr.status not in (QuestionnaireStatus.SENT, QuestionnaireStatus.OPENED, QuestionnaireStatus.SUBMITTED):
        raise HTTPException(status_code=410, detail="이미 처리된 문진입니다.")

    await qsvc.mark_opened(db, qr)

    tpl = qsvc.get_template(qr.template_code)
    # 의원 이름 — User 테이블에서 조회
    clinic_name = None
    try:
        user = (await db.execute(select(User).where(User.id == qr.user_id))).scalar_one_or_none()
        if user:
            clinic_name = user.name or user.email
    except Exception:
        pass

    return PublicTemplateOut(
        template_code=qr.template_code,
        title=tpl["title"],
        subtitle=tpl["subtitle"],
        questions=tpl["questions"],
        patient_name=qr.patient_name,
        clinic_name=clinic_name,
        status=qr.status.value if hasattr(qr.status, "value") else str(qr.status),
        submitted_at=qr.submitted_at,
    )


@public_router.post("/{token}/submit", response_model=PublicTemplateOut)
async def submit_public_form(
    token: str,
    payload: PublicSubmitRequest,
    db: AsyncSession = Depends(get_db),
):
    qr = await qsvc.fetch_by_token(db, token)
    if not qr:
        raise HTTPException(status_code=404, detail="잘못된 링크입니다.")
    if qr.expires_at and qr.expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="만료된 링크입니다.")
    if qr.status == QuestionnaireStatus.CONSUMED:
        raise HTTPException(status_code=409, detail="이미 진료에 반영된 문진입니다.")

    qr = await qsvc.submit_answers(db, qr, payload.answers or {})

    tpl = qsvc.get_template(qr.template_code)
    return PublicTemplateOut(
        template_code=qr.template_code,
        title=tpl["title"],
        subtitle=tpl["subtitle"],
        questions=tpl["questions"],
        patient_name=qr.patient_name,
        status=qr.status.value if hasattr(qr.status, "value") else str(qr.status),
        submitted_at=qr.submitted_at,
    )
