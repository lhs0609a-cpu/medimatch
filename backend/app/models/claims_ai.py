"""
AI 분석 결과 모델

- ClaimAnalysisResult: 버전관리되는 AI 분석 결과
- RejectionPattern: 삭감 패턴 학습 데이터
- PeerBenchmark: 동료 벤치마킹
"""
import uuid
import enum
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Text, DateTime, ForeignKey, Index
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.core.database import Base


# ===== Enums =====

class AnalysisStatus(str, enum.Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


# ===== Models =====

class ClaimAnalysisResult(Base):
    """버전관리되는 AI 분석 결과"""
    __tablename__ = "claim_analysis_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    claim_id = Column(UUID(as_uuid=True), ForeignKey("insurance_claims.id", ondelete="CASCADE"), nullable=False)

    # 버전 관리
    version = Column(Integer, default=1, nullable=False)
    model_version = Column(String(50), nullable=True)

    # 분석 상태
    status = Column(SQLEnum(AnalysisStatus), default=AnalysisStatus.PENDING, nullable=False)

    # 종합 결과
    overall_risk_score = Column(Integer, nullable=True)  # 0-100
    pass_probability = Column(Float, nullable=True)  # 0.0-1.0
    risk_level = Column(String(10), nullable=True)  # LOW/MEDIUM/HIGH

    # 항목별 결과
    item_results = Column(JSONB, default=[], nullable=False)
    """
    [
        {
            "item_id": 1,
            "code": "HA010",
            "pass_rate": 0.725,
            "issues": [...],
            "suggestions": [...],
            "alternative_codes": [...]
        }
    ]
    """

    # 동료 비교
    peer_comparison = Column(JSONB, default={}, nullable=False)
    """
    {
        "specialty_avg_score": 82,
        "percentile": 65,
        "rejection_rate_avg": 4.5,
        "user_rejection_rate": 2.3
    }
    """

    # 최적화 제안
    optimization_suggestions = Column(JSONB, default=[], nullable=False)
    """
    [
        {
            "type": "ALTERNATIVE_CODE",
            "current_code": "HA010",
            "suggested_code": "HA011",
            "reason": "...",
            "revenue_impact": 5000
        }
    ]
    """

    # 파이프라인 단계별 결과
    pipeline_results = Column(JSONB, default={}, nullable=False)
    """
    {
        "code_validation": {...},
        "rule_engine": {...},
        "statistical_model": {...},
        "documentation_check": {...},
        "optimization": {...}
    }
    """

    # 메타
    analysis_duration_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_analysis_claim", "claim_id"),
        Index("ix_analysis_claim_version", "claim_id", "version"),
        Index("ix_analysis_status", "status"),
    )


class RejectionPattern(Base):
    """삭감 패턴 학습 데이터"""
    __tablename__ = "rejection_patterns"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # 조합 키
    specialty_code = Column(String(10), nullable=False)
    diagnosis_code = Column(String(20), nullable=False)
    treatment_code = Column(String(20), nullable=False)

    # 통계
    total_claims = Column(Integer, default=0, nullable=False)
    rejected_claims = Column(Integer, default=0, nullable=False)
    rejection_rate = Column(Float, default=0.0, nullable=False)

    # 삭감 사유
    common_reasons = Column(JSONB, default=[], nullable=False)
    """
    [
        {"reason": "주상병과 처치 관련성 낮음", "frequency": 45},
        {"reason": "빈도 초과", "frequency": 23}
    ]
    """

    # 기간
    period_start = Column(DateTime, nullable=True)
    period_end = Column(DateTime, nullable=True)

    # 메타
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_pattern_combo", "specialty_code", "diagnosis_code", "treatment_code", unique=True),
        Index("ix_pattern_rejection_rate", "rejection_rate"),
    )


class PeerBenchmark(Base):
    """동료 벤치마킹"""
    __tablename__ = "peer_benchmarks"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # 기간/분류
    period = Column(String(10), nullable=False)  # "2025-01", "2025-Q1"
    specialty_code = Column(String(10), nullable=False)
    region = Column(String(50), nullable=True)

    # 통계
    sample_size = Column(Integer, default=0, nullable=False)
    avg_rejection_rate = Column(Float, default=0.0, nullable=False)
    median_rejection_rate = Column(Float, default=0.0, nullable=False)

    # 백분위
    percentiles = Column(JSONB, default={}, nullable=False)
    """
    {"p10": 0.5, "p25": 1.2, "p50": 3.1, "p75": 5.8, "p90": 9.2}
    """

    # 자주 삭감되는 코드
    top_rejected_codes = Column(JSONB, default=[], nullable=False)
    """
    [
        {"code": "HA010", "rejection_rate": 8.5, "avg_amount": 15000},
        ...
    ]
    """

    # 메타
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_benchmark_period_spec", "period", "specialty_code", unique=True),
    )
