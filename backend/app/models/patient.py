"""
환자 관리 모델 (스프레드시트 23개 컬럼 전체 매핑)

- 유입/상담/예약/동의 전체 파이프라인 추적
- ENUM: inboundstatus, consentstatus, dbquality
"""
import enum
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Date, Text, Enum,
    ForeignKey, Index,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class InboundStatus(str, enum.Enum):
    PENDING = "PENDING"
    BOOKED = "BOOKED"
    HELD = "HELD"
    CANCELLED = "CANCELLED"
    VISITED = "VISITED"


class ConsentStatus(str, enum.Enum):
    NOT_ASKED = "NOT_ASKED"
    CONSENTED = "CONSENTED"
    PARTIAL = "PARTIAL"
    REFUSED = "REFUSED"


class DBQuality(str, enum.Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class Patient(Base):
    """환자 유입/상담/예약/동의 추적"""
    __tablename__ = "patients"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default="gen_random_uuid()")
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    seq_no = Column(Integer)
    chart_no = Column(String(50))
    name = Column(String(100), nullable=False)
    phone = Column(String(20))
    gender = Column(String(1))  # M/F
    birth_date = Column(Date)
    region = Column(String(100))

    # 유입 정보
    inflow_date = Column(Date)
    inflow_path = Column(String(100))
    search_keywords = Column(Text)
    symptoms = Column(Text)
    diagnosis_name = Column(String(200))
    consultation_summary = Column(Text)

    # DB 퀄리티 / 실무자 판단
    db_quality = Column(
        Enum(DBQuality, name="dbquality", create_type=False),
        default=DBQuality.MEDIUM,
    )
    staff_assessment = Column(Text)

    # 예약 정보
    appointment_date = Column(DateTime)
    appointment_path = Column(String(100))
    inbound_status = Column(
        Enum(InboundStatus, name="inboundstatus", create_type=False),
        default=InboundStatus.PENDING,
    )
    cancellation_reason = Column(Text)
    consultation_gap_analysis = Column(Text)

    # 담당 실장
    manager_name = Column(String(100))

    # 동의 현황
    consent_examination = Column(
        Enum(ConsentStatus, name="consentstatus", create_type=False),
        default=ConsentStatus.NOT_ASKED,
    )
    consent_treatment = Column(
        Enum(ConsentStatus, name="consentstatus", create_type=False),
        default=ConsentStatus.NOT_ASKED,
    )
    partial_consent_reason = Column(Text)
    non_consent_reason = Column(Text)
    non_consent_root_cause = Column(Text)

    is_demo = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", backref="patients")

    __table_args__ = (
        Index("ix_patient_user", "user_id"),
        Index("ix_patient_user_inflow", "user_id", "inflow_date"),
        Index("ix_patient_status", "inbound_status"),
        Index("ix_patient_manager", "manager_name"),
    )
