"""
세무 경정청구 모델

- TaxCorrection: 경정청구 건 (세금환급)
- TaxDeduction: 공제 항목 상세
"""
import uuid
import enum
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, BigInteger, Float, Text, DateTime,
    ForeignKey, Boolean, Index
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB

from sqlalchemy.orm import relationship

from app.core.database import Base


# ===== Enums =====

class TaxCorrectionStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SCANNING = "SCANNING"
    SCAN_COMPLETE = "SCAN_COMPLETE"
    PENDING_REVIEW = "PENDING_REVIEW"
    PENDING_DOCS = "PENDING_DOCS"
    READY_TO_SUBMIT = "READY_TO_SUBMIT"
    SUBMITTED = "SUBMITTED"
    NTS_RECEIVED = "NTS_RECEIVED"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    PARTIALLY_APPROVED = "PARTIALLY_APPROVED"
    REJECTED = "REJECTED"
    REFUND_PENDING = "REFUND_PENDING"
    COMPLETED = "COMPLETED"
    APPEAL = "APPEAL"
    CANCELED = "CANCELED"


class DeductionCategory(str, enum.Enum):
    # 기존
    MEDICAL_EXPENSE = "MEDICAL_EXPENSE"
    EDUCATION = "EDUCATION"
    DONATION = "DONATION"
    RETIREMENT = "RETIREMENT"
    CREDIT_CARD = "CREDIT_CARD"
    OTHER = "OTHER"
    # 의료업 특화 (신규)
    EQUIPMENT_DEPRECIATION = "EQUIPMENT_DEPRECIATION"       # 의료기기 감가상각
    EMPLOYMENT_TAX_CREDIT = "EMPLOYMENT_TAX_CREDIT"         # 고용증대 세액공제
    YOUTH_EMPLOYMENT = "YOUTH_EMPLOYMENT"                    # 청년고용 세액공제
    CAREER_BREAK_WOMEN = "CAREER_BREAK_WOMEN"               # 경력단절여성 세액공제
    RND_TAX_CREDIT = "RND_TAX_CREDIT"                       # 연구개발비 세액공제
    FACILITY_INVESTMENT = "FACILITY_INVESTMENT"              # 시설투자 세액공제
    FAITHFUL_FILING = "FAITHFUL_FILING"                      # 성실신고 확인비용
    VAT_OPTIMIZATION = "VAT_OPTIMIZATION"                    # 부가세 최적화
    VEHICLE_EXPENSE = "VEHICLE_EXPENSE"                      # 차량 관련 경비
    ENTERTAINMENT_WELFARE = "ENTERTAINMENT_WELFARE"          # 접대비/복리후생
    RETIREMENT_PROVISION = "RETIREMENT_PROVISION"            # 퇴직급여충당금
    STAFF_EDUCATION = "STAFF_EDUCATION"                      # 직원교육훈련비
    # 일반 (신규)
    PENSION_SAVINGS = "PENSION_SAVINGS"                      # 연금저축
    HOUSING_FUND = "HOUSING_FUND"                            # 주택자금
    INSURANCE_PREMIUM = "INSURANCE_PREMIUM"                  # 보험료


# ===== Models =====

class TaxCorrection(Base):
    """세무 경정청구"""
    __tablename__ = "tax_corrections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # 경정 정보
    tax_year = Column(Integer, nullable=False)
    correction_number = Column(String(30), unique=True, nullable=False)

    # 금액
    original_filed_amount = Column(BigInteger, default=0, nullable=False)
    correct_amount = Column(BigInteger, default=0, nullable=False)
    refund_amount = Column(BigInteger, default=0, nullable=False)
    platform_fee = Column(BigInteger, default=0, nullable=False)

    # 상태
    status = Column(SQLEnum(TaxCorrectionStatus), default=TaxCorrectionStatus.DRAFT, nullable=False)

    # 타임스탬프
    submitted_at = Column(DateTime, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    refund_received_at = Column(DateTime, nullable=True)

    # 증빙
    evidence_docs = Column(JSONB, default=[], nullable=False)

    # AI
    ai_detected = Column(Boolean, default=False, nullable=False)
    ai_confidence = Column(Float, default=0.0, nullable=False)

    # === 신규 컬럼: 홈택스 연동 ===
    nts_submission_id = Column(String(50), nullable=True)
    nts_submission_date = Column(DateTime, nullable=True)
    nts_result_date = Column(DateTime, nullable=True)
    nts_result_detail = Column(JSONB, default={}, nullable=False)

    # === 신규 컬럼: 금액 상세 ===
    actual_refund_amount = Column(BigInteger, default=0, nullable=False)  # 실수령액
    net_refund = Column(BigInteger, default=0, nullable=False)  # 수수료 차감 후
    original_deductions_total = Column(BigInteger, default=0, nullable=False)
    new_deductions_total = Column(BigInteger, default=0, nullable=False)

    # === 신규 컬럼: 세무사 검토 ===
    tax_accountant_id = Column(String(50), nullable=True)
    tax_accountant_name = Column(String(100), nullable=True)
    tax_accountant_review = Column(Text, nullable=True)
    tax_accountant_approved = Column(Boolean, nullable=True)

    # === 신규 컬럼: AI 스캔 연결 ===
    ai_scan_id = Column(Integer, ForeignKey("tax_scan_results.id", ondelete="SET NULL"), nullable=True)

    # === 신규 컬럼: 동종 비교 ===
    peer_comparison = Column(JSONB, default={}, nullable=False)
    """
    {
        "specialty": "내과",
        "peer_avg_deduction": 48000000,
        "user_deduction": 35000000,
        "percentile": 35,
        "potential_gap": 13000000
    }
    """

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계
    user = relationship("User", backref="tax_corrections")
    deductions = relationship("TaxDeduction", back_populates="correction", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_tax_correction_user", "user_id"),
        Index("ix_tax_correction_year", "tax_year"),
        Index("ix_tax_correction_status", "status"),
        Index("ix_tax_correction_number", "correction_number"),
        Index("ix_tax_correction_scan", "ai_scan_id"),
    )


class TaxDeduction(Base):
    """경정청구 공제 항목"""
    __tablename__ = "tax_deductions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    correction_id = Column(UUID(as_uuid=True), ForeignKey("tax_corrections.id", ondelete="CASCADE"), nullable=False)

    # 공제 정보
    category = Column(SQLEnum(DeductionCategory), nullable=False)
    description = Column(Text, nullable=False)
    amount = Column(BigInteger, default=0, nullable=False)

    # 증빙
    evidence_required = Column(Boolean, default=True, nullable=False)
    evidence_uploaded = Column(Boolean, default=False, nullable=False)

    # AI
    ai_suggested = Column(Boolean, default=False, nullable=False)
    ai_explanation = Column(Text, nullable=True)

    # === 신규 컬럼: 비교 분석 ===
    original_amount = Column(BigInteger, default=0, nullable=False)  # 기신고 금액
    additional_amount = Column(BigInteger, default=0, nullable=False)  # 추가 공제 금액
    tax_savings = Column(BigInteger, default=0, nullable=False)  # 세금 절감액

    # === 신규 컬럼: 세법 근거 ===
    tax_code_reference = Column(String(100), nullable=True)  # 소득세법 제33조
    tax_code_article = Column(String(50), nullable=True)

    # === 신규 컬럼: 한도/요건 ===
    deduction_limit = Column(BigInteger, nullable=True)
    deduction_rate = Column(Float, nullable=True)
    eligibility_criteria = Column(JSONB, default=[], nullable=False)

    # === 신규 컬럼: AI 개별 분석 ===
    ai_confidence = Column(Float, default=0.0, nullable=False)
    ai_risk_note = Column(Text, nullable=True)

    # === 신규 컬럼: 검토 ===
    review_status = Column(String(20), default="PENDING", nullable=False)  # PENDING/APPROVED/REJECTED
    reviewer_note = Column(Text, nullable=True)

    # 관계
    correction = relationship("TaxCorrection", back_populates="deductions")

    __table_args__ = (
        Index("ix_deduction_correction", "correction_id"),
        Index("ix_deduction_category", "category"),
        Index("ix_deduction_review", "review_status"),
    )
