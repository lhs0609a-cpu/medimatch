"""
시술 패키지(회차권) — 미용/피부/성형 의원 매출의 핵심.

- TreatmentPackage: 의원이 판매하는 패키지 정의 (예: 슈링크 10회권, 포텐자 펌핑팁 20회권)
- PatientTicket: 환자가 구매한 회차권 인스턴스 (잔여 회차, 만료일)
- TicketUsage: 회차 1회 사용 기록 (어느 visit에서 차감됐는지)
"""
import enum
import uuid
from datetime import datetime
from sqlalchemy import (
    Column, Integer, BigInteger, String, Boolean, DateTime, Date, Text,
    ForeignKey, Index, text,
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base


class PackageCategory(str, enum.Enum):
    LIFTING = "LIFTING"          # 리프팅 (슈링크, 울쎄라)
    SKIN = "SKIN"                # 피부관리 (스킨부스터, 토닝)
    LASER = "LASER"              # 레이저 (포텐자, 프락셀)
    BOTOX = "BOTOX"
    FILLER = "FILLER"
    HAIR_REMOVAL = "HAIR_REMOVAL" # 제모
    SCAR = "SCAR"                # 흉터/모공
    SURGERY = "SURGERY"          # 성형 외과
    PHYSIO = "PHYSIO"            # 도수치료 등
    OTHER = "OTHER"


class TicketStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    USED_UP = "USED_UP"
    EXPIRED = "EXPIRED"
    CANCELED = "CANCELED"
    REFUNDED = "REFUNDED"


class TreatmentPackage(Base):
    """의원이 판매하는 회차권 정의."""
    __tablename__ = "treatment_packages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    name = Column(String(200), nullable=False)               # 예: "10회권 포텐자 펌핑팁"
    short_code = Column(String(50))                          # 예: "TK1581"
    category = Column(
        SQLEnum(PackageCategory, name="packagecategory", create_type=True),
        default=PackageCategory.OTHER, nullable=False,
    )
    total_sessions = Column(Integer, nullable=False)         # 총 회차 (10, 20, 15)
    price = Column(BigInteger, nullable=False, default=0)    # 판매가 (원, 부가세 포함)
    taxable = Column(Boolean, default=True, nullable=False)  # 과세/면세
    default_validity_days = Column(Integer, default=365)     # 기본 유효기간 (일)
    description = Column(Text)
    is_active = Column(Boolean, default=True, nullable=False)

    # 메타 — 매핑된 시술 코드 (visit_procedures.code 와 연동 가능)
    procedure_codes = Column(JSONB, default=list, nullable=False)
    """예: ["RF-POT-PUMP", "RF-POT-DEEP"]"""

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime)  # soft delete

    __table_args__ = (
        Index("ix_pkg_user", "user_id"),
        Index("ix_pkg_category", "category"),
        Index("ix_pkg_active", "is_active"),
    )


class PatientTicket(Base):
    """환자가 구매한 회차권 인스턴스."""
    __tablename__ = "patient_tickets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    package_id = Column(UUID(as_uuid=True), ForeignKey("treatment_packages.id", ondelete="RESTRICT"), nullable=False)

    ticket_no = Column(String(40), unique=True, nullable=False)   # 예: "TK1581-A0001"
    purchased_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    purchased_price = Column(BigInteger, default=0, nullable=False)
    expires_at = Column(Date)                                       # 만료일
    total_sessions = Column(Integer, nullable=False)                # 구매 시점 총 회차 (스냅샷)
    used_sessions = Column(Integer, default=0, nullable=False)

    status = Column(
        SQLEnum(TicketStatus, name="ticketstatus", create_type=True),
        default=TicketStatus.ACTIVE, nullable=False,
    )

    # 부가 정보
    note = Column(Text)
    extension_history = Column(JSONB, default=list, nullable=False)
    """[{"date": "2026-05-01", "days_added": 30, "reason": "..."}, ...]"""

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    package = relationship("TreatmentPackage")

    __table_args__ = (
        Index("ix_tk_user", "user_id"),
        Index("ix_tk_patient", "patient_id"),
        Index("ix_tk_status", "status"),
        Index("ix_tk_expires", "expires_at"),
    )

    @property
    def remaining_sessions(self) -> int:
        return max(0, (self.total_sessions or 0) - (self.used_sessions or 0))


class TicketUsage(Base):
    """회차 사용 기록."""
    __tablename__ = "ticket_usages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ticket_id = Column(UUID(as_uuid=True), ForeignKey("patient_tickets.id", ondelete="CASCADE"), nullable=False)
    visit_id = Column(UUID(as_uuid=True), ForeignKey("visits.id", ondelete="SET NULL"))
    used_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    sessions_used = Column(Integer, default=1, nullable=False)
    note = Column(Text)
    voided = Column(Boolean, default=False, nullable=False)   # 사용 취소 시 True (잔여 복원)

    __table_args__ = (
        Index("ix_tk_usage_ticket", "ticket_id"),
        Index("ix_tk_usage_visit", "visit_id"),
        Index("ix_tk_usage_used_at", "used_at"),
    )
