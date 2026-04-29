"""처방전(prescription) 모델"""
import enum
from sqlalchemy import (
    Column, Integer, BigInteger, String, Boolean, DateTime, Date, Text, Enum,
    ForeignKey, Float, text,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class PrescriptionStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    ISSUED = "ISSUED"
    DISPENSED = "DISPENSED"
    CANCELLED = "CANCELLED"


class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    visit_id = Column(UUID(as_uuid=True), ForeignKey("visits.id", ondelete="SET NULL"))
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="SET NULL"))

    prescription_no = Column(String(40), unique=True, nullable=False)
    prescribed_date = Column(Date, nullable=False)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    doctor_name = Column(String(100))
    pharmacy_id = Column(UUID(as_uuid=True))
    pharmacy_name = Column(String(200))

    status = Column(
        Enum(PrescriptionStatus, name="prescriptionstatus", create_type=False),
        default=PrescriptionStatus.ISSUED,
        nullable=False,
    )
    duration_days = Column(Integer)
    total_amount = Column(BigInteger, default=0)
    dur_warnings = Column(JSONB, default=list)
    patient_note = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    items = relationship("PrescriptionItem", back_populates="prescription", cascade="all, delete-orphan")


class PrescriptionItem(Base):
    __tablename__ = "prescription_items"
    id = Column(Integer, primary_key=True, autoincrement=True)
    prescription_id = Column(UUID(as_uuid=True), ForeignKey("prescriptions.id", ondelete="CASCADE"), nullable=False)
    drug_code = Column(String(20))
    drug_name = Column(String(300), nullable=False)
    ingredient = Column(String(300))
    dose_per_time = Column(Float, default=1.0)
    dose_unit = Column(String(20), default="정")
    frequency_per_day = Column(Integer, default=1)
    duration_days = Column(Integer, default=1)
    total_quantity = Column(Float, default=1)
    unit_price = Column(BigInteger, default=0)
    total_price = Column(BigInteger, default=0)
    usage_note = Column(Text)
    warning = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    prescription = relationship("Prescription", back_populates="items")
