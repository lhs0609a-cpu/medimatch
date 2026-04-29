"""전자차트(visit) 모델 — SOAP 노트 + 활력징후 + 진단/시술"""
import enum
from sqlalchemy import (
    Column, Integer, BigInteger, String, Boolean, DateTime, Date, Text, Enum,
    ForeignKey, Index, Float, text,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class VisitStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class Visit(Base):
    __tablename__ = "visits"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="SET NULL"))

    chart_no = Column(String(50))
    visit_no = Column(String(40), unique=True, nullable=False)
    visit_date = Column(Date, nullable=False)
    visit_type = Column(String(20), default="INITIAL")

    chief_complaint = Column(Text)
    subjective = Column(Text)
    objective = Column(Text)
    assessment = Column(Text)
    plan = Column(Text)

    vital_systolic = Column(Integer)
    vital_diastolic = Column(Integer)
    vital_hr = Column(Integer)
    vital_temp = Column(Float)
    vital_spo2 = Column(Integer)
    vital_weight = Column(Float)
    vital_height = Column(Float)
    vital_bmi = Column(Float)

    doctor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    doctor_name = Column(String(100))

    status = Column(
        Enum(VisitStatus, name="visitstatus", create_type=False),
        default=VisitStatus.IN_PROGRESS,
        nullable=False,
    )
    duration_min = Column(Integer)
    next_visit_date = Column(Date)
    visit_notes = Column(Text)
    voice_transcript = Column(Text)
    ai_suggestions = Column(JSONB, default=list)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    diagnoses = relationship("VisitDiagnosis", back_populates="visit", cascade="all, delete-orphan")
    procedures = relationship("VisitProcedure", back_populates="visit", cascade="all, delete-orphan")


class VisitDiagnosis(Base):
    __tablename__ = "visit_diagnoses"
    id = Column(Integer, primary_key=True, autoincrement=True)
    visit_id = Column(UUID(as_uuid=True), ForeignKey("visits.id", ondelete="CASCADE"), nullable=False)
    code = Column(String(20), nullable=False)
    name = Column(String(300), nullable=False)
    is_primary = Column(Boolean, default=False)
    note = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    visit = relationship("Visit", back_populates="diagnoses")


class VisitProcedure(Base):
    __tablename__ = "visit_procedures"
    id = Column(Integer, primary_key=True, autoincrement=True)
    visit_id = Column(UUID(as_uuid=True), ForeignKey("visits.id", ondelete="CASCADE"), nullable=False)
    code = Column(String(20), nullable=False)
    name = Column(String(300), nullable=False)
    category = Column(String(50))
    quantity = Column(Integer, default=1)
    unit_price = Column(BigInteger, default=0)
    total_price = Column(BigInteger, default=0)
    insurance_covered = Column(Boolean, default=True)
    note = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    visit = relationship("Visit", back_populates="procedures")
