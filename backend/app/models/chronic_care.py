"""만성질환관리(만관제) 모델."""
import enum
from sqlalchemy import (
    Column, Integer, String, DateTime, Text, Float, Enum, ForeignKey, UniqueConstraint, text,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class ChronicCondition(str, enum.Enum):
    HYPERTENSION = "HYPERTENSION"
    DIABETES = "DIABETES"
    DYSLIPIDEMIA = "DYSLIPIDEMIA"
    OBESITY = "OBESITY"
    OTHER = "OTHER"


class ChronicStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    GRADUATED = "GRADUATED"
    DROPPED = "DROPPED"


class ChronicVisitKind(str, enum.Enum):
    VISIT = "VISIT"
    EXAM = "EXAM"
    EDUCATION = "EDUCATION"
    PHONE = "PHONE"
    LAB = "LAB"


class ChronicCareProgram(Base):
    __tablename__ = "chronic_care_programs"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    condition = Column(Enum(ChronicCondition, name="chroniccondition", create_type=False), nullable=False)
    status = Column(
        Enum(ChronicStatus, name="chronicstatus", create_type=False),
        default=ChronicStatus.ACTIVE, nullable=False,
    )
    enrolled_at = Column(DateTime, default=datetime.utcnow)
    graduated_at = Column(DateTime)

    target_systolic = Column(Integer)
    target_diastolic = Column(Integer)
    target_hba1c = Column(Float)
    target_fbs = Column(Integer)
    target_ldl = Column(Integer)
    target_weight = Column(Float)

    total_visits = Column(Integer, default=0, nullable=False)
    total_education_count = Column(Integer, default=0, nullable=False)
    last_visit_at = Column(DateTime)
    next_visit_at = Column(DateTime)
    interval_days = Column(Integer, default=30, nullable=False)
    memo = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "patient_id", "condition"),
    )

    visits = relationship("ChronicCareVisit", back_populates="program", cascade="all, delete-orphan")


class ChronicCareVisit(Base):
    __tablename__ = "chronic_care_visits"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    program_id = Column(UUID(as_uuid=True), ForeignKey("chronic_care_programs.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    visit_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    kind = Column(
        Enum(ChronicVisitKind, name="chronicvisitkind", create_type=False),
        default=ChronicVisitKind.VISIT, nullable=False,
    )
    systolic = Column(Integer)
    diastolic = Column(Integer)
    fbs = Column(Integer)
    hba1c = Column(Float)
    ldl = Column(Integer)
    hdl = Column(Integer)
    tg = Column(Integer)
    weight = Column(Float)
    education_topic = Column(String(200))
    data = Column(JSONB, default=dict)
    notes = Column(Text)
    linked_visit_id = Column(UUID(as_uuid=True), ForeignKey("visits.id", ondelete="SET NULL"))
    created_at = Column(DateTime, default=datetime.utcnow)

    program = relationship("ChronicCareProgram", back_populates="visits")
