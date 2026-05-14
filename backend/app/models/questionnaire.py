"""사전문진(Questionnaire) 모델

카톡 magic-link로 발송된 문진 → 환자가 모바일에서 답변 → SOAP/Patient에 자동 매핑.
"""
import enum
from sqlalchemy import (
    Column, Integer, String, DateTime, Text, Enum, ForeignKey, Index, text,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class QuestionnaireStatus(str, enum.Enum):
    SENT = "SENT"
    OPENED = "OPENED"
    SUBMITTED = "SUBMITTED"
    CONSUMED = "CONSUMED"
    EXPIRED = "EXPIRED"


class QuestionnaireResponse(Base):
    __tablename__ = "questionnaire_responses"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id", ondelete="SET NULL"))
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="SET NULL"))
    patient_name = Column(String(100))
    patient_phone = Column(String(20))

    token = Column(String(80), unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    template_code = Column(String(40), default="GENERAL_V1")
    status = Column(
        Enum(QuestionnaireStatus, name="questionnairestatus", create_type=False),
        default=QuestionnaireStatus.SENT,
        nullable=False,
    )
    sent_at = Column(DateTime, default=datetime.utcnow)
    opened_at = Column(DateTime)
    submitted_at = Column(DateTime)
    consumed_at = Column(DateTime)

    chief_complaint = Column(Text)
    onset = Column(Text)
    severity = Column(Integer)
    accompanying = Column(Text)
    past_history = Column(Text)
    allergies = Column(Text)
    current_meds = Column(Text)
    smoking = Column(String(20))
    alcohol = Column(String(20))
    family_history = Column(Text)
    note = Column(Text)

    raw_answers = Column(JSONB, default=dict)

    delivery_provider = Column(String(20))
    delivery_status = Column(String(40))

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_qr_user", "user_id"),
        Index("ix_qr_patient", "patient_id"),
        Index("ix_qr_appointment", "appointment_id"),
        Index("ix_qr_status", "status"),
        Index("ix_qr_phone", "patient_phone"),
        Index("ix_qr_sent", "sent_at"),
    )
