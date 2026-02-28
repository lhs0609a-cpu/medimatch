"""
세법 레퍼런스 & 동종 업계 벤치마크 모델

- TaxRegulationReference: 세법 규정 DB
- TaxPeerBenchmark: 동종 업계 벤치마크
"""
import enum
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, BigInteger, Float, Text, DateTime, Date,
    Boolean, Index
)
from sqlalchemy.dialects.postgresql import JSONB, ARRAY

from app.core.database import Base


# ===== Models =====

class TaxRegulationReference(Base):
    """세법 규정 DB"""
    __tablename__ = "tax_regulation_references"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # 법령 정보
    law_name = Column(String(200), nullable=False)  # 소득세법, 조세특례제한법 등
    article = Column(String(50), nullable=False)     # 제33조
    paragraph = Column(String(50), nullable=True)    # 제1항
    sub_paragraph = Column(String(50), nullable=True)

    # 공제 정보
    deduction_category = Column(String(50), nullable=False)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)

    # 한도/요건
    deduction_limit = Column(BigInteger, nullable=True)
    deduction_rate = Column(Float, nullable=True)
    eligibility_criteria = Column(JSONB, default=[], nullable=False)
    """
    [
        {"condition": "종합소득 4600만원 이하", "type": "income_limit"},
        {"condition": "5년 이상 성실신고", "type": "filing_history"}
    ]
    """

    # 적격 요건
    required_documents = Column(ARRAY(String), default=[], nullable=False)
    applicable_specialties = Column(ARRAY(String), default=[], nullable=False)
    applicable_business_types = Column(ARRAY(String), default=[], nullable=False)

    # 유효 기간
    effective_from = Column(Date, nullable=True)
    effective_to = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # 메타
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    source_url = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_regulation_category", "deduction_category"),
        Index("ix_regulation_law", "law_name"),
        Index("ix_regulation_active", "is_active"),
    )


class TaxPeerBenchmark(Base):
    """동종 업계 벤치마크"""
    __tablename__ = "tax_peer_benchmarks"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # 분류
    period = Column(String(10), nullable=False)  # "2024", "2024-H1"
    specialty = Column(String(50), nullable=False)
    region = Column(String(50), nullable=True)

    # 표본
    sample_size = Column(Integer, default=0, nullable=False)

    # 소득/경비 통계
    avg_gross_income = Column(BigInteger, default=0, nullable=False)
    avg_necessary_expenses = Column(BigInteger, default=0, nullable=False)
    avg_expense_rate = Column(Float, default=0.0, nullable=False)

    # 공제 통계
    avg_deduction_total = Column(BigInteger, default=0, nullable=False)
    avg_deduction_by_category = Column(JSONB, default={}, nullable=False)
    """
    {
        "EQUIPMENT_DEPRECIATION": 12000000,
        "EMPLOYMENT_TAX_CREDIT": 4500000,
        "MEDICAL_EXPENSE": 2000000,
        ...
    }
    """

    # 백분위
    percentiles = Column(JSONB, default={}, nullable=False)
    """
    {
        "deduction_rate": {"p10": 35, "p25": 40, "p50": 48, "p75": 55, "p90": 62},
        "expense_rate": {"p10": 55, "p25": 60, "p50": 65, "p75": 72, "p90": 78}
    }
    """

    # 경정청구 통계
    avg_correction_rate = Column(Float, default=0.0, nullable=False)  # 경정청구 비율
    avg_refund_amount = Column(BigInteger, default=0, nullable=False)

    # 메타
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_tax_bench_period_spec", "period", "specialty", unique=True),
    )
