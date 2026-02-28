"""
보험청구 관리 모델

- InsuranceClaim: 심평원 보험청구 건
- ClaimItem: 청구 항목 (진단/처치/약제)
- ClaimBatch: 일괄 전송 배치
"""
import uuid
import enum
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, BigInteger, Float, Text, DateTime, Date,
    ForeignKey, Boolean, Index
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY

from sqlalchemy.orm import relationship

from app.core.database import Base


# ===== Enums =====

class ClaimStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    READY = "READY"
    AI_REVIEWING = "AI_REVIEWING"
    SUBMITTED = "SUBMITTED"
    EDI_RECEIVED = "EDI_RECEIVED"
    UNDER_REVIEW = "UNDER_REVIEW"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    PARTIAL = "PARTIAL"
    APPEALING = "APPEALING"
    APPEAL_ACCEPTED = "APPEAL_ACCEPTED"
    APPEAL_REJECTED = "APPEAL_REJECTED"


class RiskLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class ClaimItemType(str, enum.Enum):
    DIAGNOSIS = "DIAGNOSIS"
    TREATMENT = "TREATMENT"
    MEDICATION = "MEDICATION"
    INJECTION = "INJECTION"
    TEST = "TEST"
    MATERIAL = "MATERIAL"
    IMAGING = "IMAGING"


# ===== Models =====

class InsuranceClaim(Base):
    """심평원 보험청구"""
    __tablename__ = "insurance_claims"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # 청구 기본 정보
    claim_number = Column(String(30), unique=True, nullable=False)
    claim_date = Column(Date, nullable=False)
    service_date = Column(Date, nullable=False)

    # 환자 정보 (마스킹)
    patient_chart_no = Column(String(50), nullable=True)
    patient_name_masked = Column(String(100), nullable=True)
    patient_age = Column(Integer, nullable=True)
    patient_gender = Column(String(1), nullable=True)

    # 금액
    total_amount = Column(BigInteger, default=0, nullable=False)
    insurance_amount = Column(BigInteger, default=0, nullable=False)
    copay_amount = Column(BigInteger, default=0, nullable=False)
    approved_amount = Column(BigInteger, nullable=True)
    rejected_amount = Column(BigInteger, default=0, nullable=False)

    # 상태
    status = Column(SQLEnum(ClaimStatus), default=ClaimStatus.DRAFT, nullable=False)

    # AI 분석
    risk_level = Column(SQLEnum(RiskLevel), default=RiskLevel.LOW, nullable=False)
    risk_score = Column(Integer, default=100, nullable=False)  # 0-100, 높을수록 안전
    risk_reason = Column(Text, nullable=True)
    ai_analyzed = Column(Boolean, default=False, nullable=False)
    ai_analysis_result = Column(JSONB, default={}, nullable=False)

    # 전송/결과
    submitted_at = Column(DateTime, nullable=True)
    result_received_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)

    # 배치
    batch_id = Column(Integer, ForeignKey("claim_batches.id"), nullable=True)

    # === 신규 컬럼: EDI 연동 ===
    edi_message_id = Column(String(50), nullable=True)
    edi_receipt_number = Column(String(50), nullable=True)
    edi_submitted_at = Column(DateTime, nullable=True)
    edi_result_code = Column(String(20), nullable=True)
    edi_result_detail = Column(JSONB, default={}, nullable=False)

    # === 신규 컬럼: 진료 정보 ===
    ykiho = Column(String(20), nullable=True)  # 요양기관번호
    specialty_code = Column(String(10), nullable=True)
    primary_dx_code = Column(String(20), nullable=True)  # 주상병 코드
    secondary_dx_codes = Column(ARRAY(String), default=[], nullable=False)

    # === 신규 컬럼: AI 버전 관리 ===
    ai_analysis_version = Column(Integer, nullable=True)
    ai_model_version = Column(String(50), nullable=True)
    ai_peer_percentile = Column(Float, nullable=True)

    # === 신규 컬럼: 이의신청 ===
    has_appeal = Column(Boolean, default=False, nullable=False)
    appeal_count = Column(Integer, default=0, nullable=False)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계
    user = relationship("User", backref="insurance_claims")
    items = relationship("ClaimItem", back_populates="claim", cascade="all, delete-orphan")
    batch = relationship("ClaimBatch", back_populates="claims")

    __table_args__ = (
        Index("ix_claim_user", "user_id"),
        Index("ix_claim_status", "status"),
        Index("ix_claim_risk", "risk_level"),
        Index("ix_claim_date", "claim_date"),
        Index("ix_claim_number", "claim_number"),
        Index("ix_claim_ykiho", "ykiho"),
        Index("ix_claim_primary_dx", "primary_dx_code"),
    )


class ClaimItem(Base):
    """청구 항목 (진단/처치/약제)"""
    __tablename__ = "claim_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    claim_id = Column(UUID(as_uuid=True), ForeignKey("insurance_claims.id", ondelete="CASCADE"), nullable=False)

    # 항목 정보
    item_type = Column(SQLEnum(ClaimItemType), nullable=False)
    code = Column(String(20), nullable=False)
    name = Column(String(200), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    unit_price = Column(BigInteger, default=0, nullable=False)
    total_price = Column(BigInteger, default=0, nullable=False)

    # AI 분석
    risk_level = Column(SQLEnum(RiskLevel), default=RiskLevel.LOW, nullable=False)
    pass_rate = Column(Float, default=100.0, nullable=False)
    ai_comment = Column(Text, nullable=True)
    issues = Column(JSONB, default=[], nullable=False)

    # === 신규 컬럼: HIRA 코드 FK ===
    fee_code_id = Column(Integer, ForeignKey("hira_fee_codes.id", ondelete="SET NULL"), nullable=True)
    disease_code_id = Column(Integer, ForeignKey("hira_disease_codes.id", ondelete="SET NULL"), nullable=True)
    drug_code_id = Column(Integer, ForeignKey("hira_drug_codes.id", ondelete="SET NULL"), nullable=True)

    # === 신규 컬럼: DUR 체크 ===
    dur_checked = Column(Boolean, default=False, nullable=False)
    dur_result = Column(String(20), nullable=True)  # PASS/WARNING/CRITICAL
    dur_warnings = Column(JSONB, default=[], nullable=False)

    # === 신규 컬럼: AI 통계 ===
    ai_pass_rate_historical = Column(Float, nullable=True)
    ai_pass_rate_model = Column(Float, nullable=True)
    ai_alternative_codes = Column(JSONB, default=[], nullable=False)
    """[{"code": "HA011", "name": "...", "pass_rate": 0.95, "revenue_impact": 3000}]"""

    # === 신규 컬럼: 빈도 관리 ===
    frequency_count = Column(Integer, nullable=True)
    frequency_limit = Column(Integer, nullable=True)
    frequency_period = Column(String(20), nullable=True)  # "30D", "90D", "1Y"

    # 관계
    claim = relationship("InsuranceClaim", back_populates="items")

    __table_args__ = (
        Index("ix_claim_item_claim", "claim_id"),
        Index("ix_claim_item_code", "code"),
        Index("ix_claim_item_type", "item_type"),
    )


class ClaimBatch(Base):
    """청구 일괄 전송 배치"""
    __tablename__ = "claim_batches"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    batch_number = Column(String(30), unique=True, nullable=False)
    submission_date = Column(DateTime, nullable=False)
    total_claims = Column(Integer, default=0, nullable=False)
    total_amount = Column(BigInteger, default=0, nullable=False)
    status = Column(String(20), default="PENDING", nullable=False)  # PENDING/TRANSMITTED/COMPLETED

    created_at = Column(DateTime, default=datetime.utcnow)

    # 관계
    user = relationship("User", backref="claim_batches")
    claims = relationship("InsuranceClaim", back_populates="batch")

    __table_args__ = (
        Index("ix_batch_user", "user_id"),
        Index("ix_batch_status", "status"),
    )
