"""
세금 신고 이력 모델

- TaxFilingHistory: 5년치 세금 신고 데이터 (홈택스 동기화)
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

from app.core.database import Base


# ===== Enums =====

class FilingType(str, enum.Enum):
    INCOME_TAX = "INCOME_TAX"           # 종합소득세
    VAT = "VAT"                          # 부가가치세
    WITHHOLDING = "WITHHOLDING"          # 원천세
    LOCAL_INCOME = "LOCAL_INCOME"        # 지방소득세


class FilingSyncStatus(str, enum.Enum):
    PENDING = "PENDING"
    SYNCING = "SYNCING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    PARTIAL = "PARTIAL"


# ===== Models =====

class TaxFilingHistory(Base):
    """5년치 세금 신고 데이터"""
    __tablename__ = "tax_filing_histories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # 신고 기본 정보
    tax_year = Column(Integer, nullable=False)
    filing_type = Column(SQLEnum(FilingType), default=FilingType.INCOME_TAX, nullable=False)
    filing_period = Column(String(20), nullable=True)  # "2025-H1", "2025-Q2"

    # 소득
    gross_income = Column(BigInteger, default=0, nullable=False)
    business_income = Column(BigInteger, default=0, nullable=False)
    salary_income = Column(BigInteger, default=0, nullable=False)
    other_income = Column(BigInteger, default=0, nullable=False)

    # 필요경비
    necessary_expenses = Column(BigInteger, default=0, nullable=False)
    expense_breakdown = Column(JSONB, default={}, nullable=False)
    """
    {
        "인건비": 120000000,
        "임차료": 36000000,
        "재료비": 45000000,
        "감가상각비": 12000000,
        "기타": 8000000
    }
    """

    # 소득공제
    deductions_total = Column(BigInteger, default=0, nullable=False)
    deductions_breakdown = Column(JSONB, default={}, nullable=False)
    """
    {
        "기본공제": 1500000,
        "국민연금": 4500000,
        "건강보험": 3200000,
        "신용카드": 2000000,
        ...
    }
    """

    # 세액공제/감면
    credits_total = Column(BigInteger, default=0, nullable=False)
    credits_breakdown = Column(JSONB, default={}, nullable=False)

    # 세금
    taxable_income = Column(BigInteger, default=0, nullable=False)
    calculated_tax = Column(BigInteger, default=0, nullable=False)
    final_tax = Column(BigInteger, default=0, nullable=False)
    tax_paid = Column(BigInteger, default=0, nullable=False)

    # 동기화
    sync_status = Column(SQLEnum(FilingSyncStatus), default=FilingSyncStatus.PENDING, nullable=False)
    synced_from = Column(String(20), nullable=True)  # HOMETAX/MANUAL/ACCOUNTANT
    synced_at = Column(DateTime, nullable=True)
    raw_data = Column(JSONB, default={}, nullable=False)  # 원본 데이터

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_filing_user_year", "user_id", "tax_year"),
        Index("ix_filing_type", "filing_type"),
        Index("ix_filing_sync", "sync_status"),
    )
