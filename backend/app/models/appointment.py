"""예약(appointment) 모델"""
import enum
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Date, Text, Enum,
    ForeignKey, text,
)
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime

from app.core.database import Base


class AppointmentStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    CONFIRMED = "CONFIRMED"
    ARRIVED = "ARRIVED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    NO_SHOW = "NO_SHOW"
    CANCELLED = "CANCELLED"


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="SET NULL"))

    patient_name = Column(String(100), nullable=False)
    patient_phone = Column(String(20))
    patient_birth = Column(Date)

    doctor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    doctor_name = Column(String(100))

    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    duration_min = Column(Integer, default=15)

    status = Column(
        Enum(AppointmentStatus, name="appointmentstatus", create_type=False),
        default=AppointmentStatus.SCHEDULED,
        nullable=False,
    )
    appointment_type = Column(String(30), default="INITIAL")
    chief_complaint = Column(Text)
    memo = Column(Text)
    channel = Column(String(30))

    arrived_at = Column(DateTime)
    completed_at = Column(DateTime)
    cancelled_reason = Column(Text)
    reminder_sent = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
