"""사전문진 발송/수신 서비스.

흐름:
1. 의사가 예약에 대해 발송 트리거 → 토큰 생성 + DB 저장
2. 알림톡으로 환자 폰에 magic-link 발송
3. 환자가 모바일 폼 작성 → 답변 저장 + status=SUBMITTED
4. 의사가 차트 신규 작성 시 가장 최근 SUBMITTED 응답을 fetch → SOAP 필드 prefill
"""
from __future__ import annotations
import os
import secrets
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from uuid import UUID

from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.questionnaire import QuestionnaireResponse, QuestionnaireStatus
from app.services.kakao_alimtalk import send_alimtalk


# ────────────────────────────────────────────────────────────
#  질문 템플릿 (MVP: 일반 진료과 1종)
# ────────────────────────────────────────────────────────────
QUESTIONNAIRE_TEMPLATES: Dict[str, Dict[str, Any]] = {
    "GENERAL_V1": {
        "title": "오늘 진료 사전 문진",
        "subtitle": "내원 전 1~2분이면 끝납니다. 진료 시간을 더 알차게 쓰실 수 있어요.",
        "questions": [
            {"key": "chief_complaint", "label": "가장 불편한 증상이 무엇인가요?",
             "type": "text", "placeholder": "예: 두통, 가슴 답답함", "required": True},
            {"key": "onset", "label": "언제부터 시작됐나요?",
             "type": "text", "placeholder": "예: 3일 전, 어제 저녁"},
            {"key": "severity", "label": "통증/불편 정도 (0~10)",
             "type": "scale", "min": 0, "max": 10},
            {"key": "accompanying", "label": "함께 있는 증상이 있나요?",
             "type": "text", "placeholder": "발열, 구토, 어지럼 등"},
            {"key": "past_history", "label": "현재 진단받고 치료 중인 질환이 있나요?",
             "type": "text", "placeholder": "고혈압, 당뇨 등"},
            {"key": "allergies", "label": "약물/음식 알레르기가 있나요?",
             "type": "text", "placeholder": "없으면 \"없음\""},
            {"key": "current_meds", "label": "현재 복용 중인 약이 있나요?",
             "type": "text", "placeholder": "약 이름 또는 \"없음\""},
            {"key": "smoking", "label": "흡연",
             "type": "choice", "options": ["비흡연", "금연", "흡연"]},
            {"key": "alcohol", "label": "음주",
             "type": "choice", "options": ["비음주", "가끔", "자주"]},
            {"key": "family_history", "label": "가족 중 같은 증상/질환을 앓는 분이 있나요?",
             "type": "text", "placeholder": "없으면 \"없음\""},
            {"key": "note", "label": "선생님께 추가로 전하고 싶은 말이 있나요?",
             "type": "textarea", "placeholder": "선택"},
        ],
    }
}


def get_template(template_code: str) -> Dict[str, Any]:
    return QUESTIONNAIRE_TEMPLATES.get(template_code, QUESTIONNAIRE_TEMPLATES["GENERAL_V1"])


# ────────────────────────────────────────────────────────────
#  토큰
# ────────────────────────────────────────────────────────────
def _generate_token() -> str:
    return secrets.token_urlsafe(48)   # ~64자


def _build_link(token: str) -> str:
    """환자가 진입할 사전문진 URL."""
    base = (getattr(settings, "FRONTEND_URL", "") or "").rstrip("/")
    if not base:
        base = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
    return f"{base}/q/{token}"


# ────────────────────────────────────────────────────────────
#  발송
# ────────────────────────────────────────────────────────────
async def create_and_send(
    db: AsyncSession,
    *,
    user_id: UUID,
    user_name: Optional[str] = None,
    appointment_id: Optional[UUID] = None,
    patient_id: Optional[UUID] = None,
    patient_name: Optional[str] = None,
    patient_phone: Optional[str] = None,
    template_code: str = "GENERAL_V1",
    expires_in_days: int = 14,
) -> QuestionnaireResponse:
    """문진 응답 row 생성 + 알림톡 발송."""
    if not patient_phone:
        raise ValueError("환자 휴대폰이 없어 발송할 수 없습니다.")

    token = _generate_token()
    qr = QuestionnaireResponse(
        user_id=user_id,
        appointment_id=appointment_id,
        patient_id=patient_id,
        patient_name=patient_name,
        patient_phone=patient_phone,
        token=token,
        expires_at=datetime.utcnow() + timedelta(days=expires_in_days),
        template_code=template_code,
        status=QuestionnaireStatus.SENT,
    )
    db.add(qr)
    await db.flush()

    link = _build_link(token)
    clinic = user_name or "병원"
    name = patient_name or "고객"
    msg = (
        f"[{clinic}] {name}님, 진료 전 사전 문진을 부탁드립니다.\n"
        f"1~2분이면 끝납니다.\n\n"
        f"문진 시작:\n{link}\n\n"
        f"※ 답변 내용은 진료에만 사용되며, 의료법에 따라 안전하게 보관됩니다."
    )
    template_alimtalk_code = os.getenv("ALIMTALK_QUESTIONNAIRE_TEMPLATE", "QSTNR_V1")
    result = await send_alimtalk(
        phone=patient_phone,
        template_code=template_alimtalk_code,
        message=msg,
        button_url=link,
        button_name="문진 시작",
    )
    qr.delivery_provider = result.get("provider", "")
    qr.delivery_status = result.get("status", "")
    await db.commit()
    await db.refresh(qr)
    return qr


# ────────────────────────────────────────────────────────────
#  Public 조회/제출 (토큰 인증)
# ────────────────────────────────────────────────────────────
async def fetch_by_token(
    db: AsyncSession, token: str
) -> Optional[QuestionnaireResponse]:
    if not token or len(token) < 16:
        return None
    q = select(QuestionnaireResponse).where(QuestionnaireResponse.token == token)
    return (await db.execute(q)).scalar_one_or_none()


async def mark_opened(db: AsyncSession, qr: QuestionnaireResponse) -> None:
    if qr.status == QuestionnaireStatus.SENT:
        qr.status = QuestionnaireStatus.OPENED
        qr.opened_at = datetime.utcnow()
        await db.commit()


async def submit_answers(
    db: AsyncSession,
    qr: QuestionnaireResponse,
    answers: Dict[str, Any],
) -> QuestionnaireResponse:
    """환자 응답 저장 — 알려진 키만 컬럼에 매핑, 전체는 raw_answers에 백업."""
    qr.raw_answers = answers or {}
    qr.chief_complaint = answers.get("chief_complaint")
    qr.onset = answers.get("onset")
    sev = answers.get("severity")
    if sev is not None:
        try:
            qr.severity = int(sev)
        except (TypeError, ValueError):
            qr.severity = None
    qr.accompanying = answers.get("accompanying")
    qr.past_history = answers.get("past_history")
    qr.allergies = answers.get("allergies")
    qr.current_meds = answers.get("current_meds")
    qr.smoking = answers.get("smoking")
    qr.alcohol = answers.get("alcohol")
    qr.family_history = answers.get("family_history")
    qr.note = answers.get("note")
    qr.submitted_at = datetime.utcnow()
    qr.status = QuestionnaireStatus.SUBMITTED
    await db.commit()
    await db.refresh(qr)
    return qr


# ────────────────────────────────────────────────────────────
#  Prefill — 차트 신규 작성에서 사용
# ────────────────────────────────────────────────────────────
async def latest_unconsumed_for_patient(
    db: AsyncSession,
    user_id: UUID,
    *,
    patient_id: Optional[UUID] = None,
    patient_phone: Optional[str] = None,
) -> Optional[QuestionnaireResponse]:
    """환자에 대한 가장 최근 SUBMITTED 응답 (consume되지 않은 것)."""
    if not patient_id and not patient_phone:
        return None
    q = (
        select(QuestionnaireResponse)
        .where(and_(
            QuestionnaireResponse.user_id == user_id,
            QuestionnaireResponse.status == QuestionnaireStatus.SUBMITTED,
        ))
        .order_by(desc(QuestionnaireResponse.submitted_at))
        .limit(1)
    )
    if patient_id:
        q = q.where(QuestionnaireResponse.patient_id == patient_id)
    elif patient_phone:
        q = q.where(QuestionnaireResponse.patient_phone == patient_phone)
    return (await db.execute(q)).scalar_one_or_none()


def to_visit_prefill(qr: QuestionnaireResponse) -> Dict[str, Any]:
    """문진 응답을 Visit/Patient prefill payload로 변환."""
    s_lines: List[str] = []
    if qr.onset:
        s_lines.append(f"- 발생: {qr.onset}")
    if qr.severity is not None:
        s_lines.append(f"- 통증/불편 강도: {qr.severity}/10")
    if qr.accompanying:
        s_lines.append(f"- 동반증상: {qr.accompanying}")
    if qr.past_history:
        s_lines.append(f"- 과거력: {qr.past_history}")
    if qr.allergies:
        s_lines.append(f"- 알레르기: {qr.allergies}")
    if qr.current_meds:
        s_lines.append(f"- 복용약: {qr.current_meds}")
    if qr.smoking or qr.alcohol:
        s_lines.append(f"- 음주/흡연: {qr.alcohol or '?'} / {qr.smoking or '?'}")
    if qr.family_history:
        s_lines.append(f"- 가족력: {qr.family_history}")
    if qr.note:
        s_lines.append(f"- 환자 메모: {qr.note}")
    subjective = "\n".join(s_lines)

    return {
        "questionnaire_id": str(qr.id),
        "submitted_at": qr.submitted_at.isoformat() if qr.submitted_at else None,
        "chief_complaint": qr.chief_complaint or "",
        "subjective": subjective,
        # patient profile 보강용
        "patient_patch": {
            "symptoms": qr.chief_complaint or None,
            "consultation_summary": qr.note or None,
        },
    }


async def mark_consumed(db: AsyncSession, qr: QuestionnaireResponse) -> None:
    qr.status = QuestionnaireStatus.CONSUMED
    qr.consumed_at = datetime.utcnow()
    await db.commit()
