"""
AI 세금 스캔 결과 모델

- TaxScanResult: AI 스캔 실행 기록
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

class TaxScanStatus(str, enum.Enum):
    PENDING = "PENDING"
    SCANNING = "SCANNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class FindingSeverity(str, enum.Enum):
    HIGH = "HIGH"          # 명확한 누락 (90%+ 환급 가능성)
    MEDIUM = "MEDIUM"      # 최적화 여지 (60-90%)
    LOW = "LOW"            # 추정/확인 필요 (40-60%)
    INFO = "INFO"          # 참고 정보


# ===== Models =====

class TaxScanResult(Base):
    """AI 세금 스캔 실행 기록"""
    __tablename__ = "tax_scan_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # 스캔 정보
    scan_type = Column(String(30), default="FULL", nullable=False)  # FULL/PARTIAL/CATEGORY
    tax_years = Column(JSONB, default=[], nullable=False)  # [2021, 2022, 2023, 2024, 2025]
    status = Column(SQLEnum(TaxScanStatus), default=TaxScanStatus.PENDING, nullable=False)

    # 발견 항목
    findings = Column(JSONB, default=[], nullable=False)
    """
    [
        {
            "category": "EQUIPMENT_DEPRECIATION",
            "title": "의료기기 감가상각 방법 변경",
            "description": "정액법 → 정률법 변경시 추가 공제 가능",
            "severity": "HIGH",
            "estimated_amount": 3200000,
            "tax_savings": 1120000,
            "confidence": 0.92,
            "tax_year": 2024,
            "tax_code_reference": "소득세법 제33조",
            "required_documents": ["의료기기 구매 영수증", "감가상각명세서"],
            "risk_note": null
        }
    ]
    """
    total_findings = Column(Integer, default=0, nullable=False)

    # 동종 업계 벤치마크
    peer_benchmark = Column(JSONB, default={}, nullable=False)
    """
    {
        "specialty": "내과",
        "user_deduction_rate": 42.5,
        "peer_avg_deduction_rate": 48.2,
        "peer_percentile": 35,
        "gap_analysis": {
            "EQUIPMENT_DEPRECIATION": {"user": 0, "peer_avg": 12000000},
            "EMPLOYMENT_TAX_CREDIT": {"user": 0, "peer_avg": 4500000}
        }
    }
    """

    # 총 환급 잠재액
    total_potential_refund = Column(BigInteger, default=0, nullable=False)
    total_tax_savings = Column(BigInteger, default=0, nullable=False)
    confidence = Column(Float, default=0.0, nullable=False)  # 종합 신뢰도

    # 실행 시간
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    duration_ms = Column(Integer, nullable=True)

    # 메타
    model_version = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_scan_user", "user_id"),
        Index("ix_scan_status", "status"),
        Index("ix_scan_created", "created_at"),
    )
