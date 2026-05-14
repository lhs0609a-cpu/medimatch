"""외부 채널(똑닥/굿닥/네이버) 예약 모델."""
import enum
from sqlalchemy import (
    Column, Integer, String, DateTime, Date, Text, Enum, ForeignKey, UniqueConstraint, text,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime

from app.core.database import Base


class ExtApptChannel(str, enum.Enum):
    DDOCDOC = "DDOCDOC"
    GOODOC = "GOODOC"
    NAVER = "NAVER"
    KAKAO = "KAKAO"
    MANUAL = "MANUAL"
    OTHER = "OTHER"


class ExtApptStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    REJECTED = "REJECTED"
    CONFLICT = "CONFLICT"
    EXPIRED = "EXPIRED"
    CANCELLED_BY_CHANNEL = "CANCELLED_BY_CHANNEL"


class ExternalAppointment(Base):
    __tablename__ = "external_appointments"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    channel = Column(Enum(ExtApptChannel, name="extapptchannel", create_type=False), nullable=False)
    external_id = Column(String(100))
    patient_name = Column(String(100), nullable=False)
    patient_phone = Column(String(20))
    patient_birth = Column(Date)
    doctor_name = Column(String(100))
    requested_start = Column(DateTime, nullable=False)
    duration_min = Column(Integer, default=15, nullable=False)
    chief_complaint = Column(Text)
    memo = Column(Text)
    raw_payload = Column(JSONB, default=dict)
    status = Column(
        Enum(ExtApptStatus, name="extapptstatus", create_type=False),
        default=ExtApptStatus.PENDING, nullable=False,
    )
    conflict_with = Column(UUID(as_uuid=True), ForeignKey("appointments.id", ondelete="SET NULL"))
    linked_appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id", ondelete="SET NULL"))
    received_at = Column(DateTime, default=datetime.utcnow)
    decided_at = Column(DateTime)
    decided_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    rejection_reason = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "channel", "external_id"),
    )
