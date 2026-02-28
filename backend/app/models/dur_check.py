"""
DUR (Drug Utilization Review) 약물 안전성 모델

- DURCheckLog: DUR 체크 실행 로그
- DrugInteraction: 약물 상호작용 캐시
"""
import uuid
import enum
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Text, DateTime, ForeignKey, Index
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY

from app.core.database import Base


# ===== Enums =====

class DURSeverity(str, enum.Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"
    CONTRAINDICATED = "CONTRAINDICATED"


class DURCheckType(str, enum.Enum):
    DRUG_DRUG = "DRUG_DRUG"           # 약물-약물 상호작용
    DRUG_AGE = "DRUG_AGE"             # 연령 금기
    DRUG_GENDER = "DRUG_GENDER"       # 성별 금기
    DRUG_PREGNANCY = "DRUG_PREGNANCY"  # 임부 금기
    DRUG_DISEASE = "DRUG_DISEASE"     # 질환 금기
    DUPLICATE = "DUPLICATE"            # 중복 처방
    OVERDOSE = "OVERDOSE"             # 과량 투여
    DURATION = "DURATION"              # 투여기간 초과


class InteractionType(str, enum.Enum):
    CONTRAINDICATED = "CONTRAINDICATED"  # 병용 금기
    MAJOR = "MAJOR"                       # 주의
    MODERATE = "MODERATE"                 # 관찰
    MINOR = "MINOR"                       # 경미


# ===== Models =====

class DURCheckLog(Base):
    """DUR 체크 실행 로그"""
    __tablename__ = "dur_check_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    claim_id = Column(UUID(as_uuid=True), ForeignKey("insurance_claims.id", ondelete="SET NULL"), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # 체크 대상
    check_type = Column(SQLEnum(DURCheckType), nullable=False)
    drug_codes = Column(ARRAY(String), default=[], nullable=False)
    disease_codes = Column(ARRAY(String), default=[], nullable=False)

    # 결과
    severity = Column(SQLEnum(DURSeverity), nullable=False)
    message = Column(Text, nullable=False)
    detail = Column(JSONB, default={}, nullable=False)

    # 환자 정보
    patient_age = Column(Integer, nullable=True)
    patient_gender = Column(String(1), nullable=True)

    # 처리
    acknowledged = Column(String(20), default="PENDING", nullable=False)  # PENDING/ACKNOWLEDGED/OVERRIDDEN
    acknowledged_by = Column(String(100), nullable=True)
    acknowledged_reason = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_dur_log_claim", "claim_id"),
        Index("ix_dur_log_user", "user_id"),
        Index("ix_dur_log_severity", "severity"),
        Index("ix_dur_log_created", "created_at"),
    )


class DrugInteraction(Base):
    """약물 상호작용 캐시"""
    __tablename__ = "drug_interactions"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # 약물 쌍
    drug_code_a = Column(String(30), nullable=False, index=True)
    drug_code_b = Column(String(30), nullable=False, index=True)

    # 상호작용 정보
    interaction_type = Column(SQLEnum(InteractionType), nullable=False)
    severity = Column(SQLEnum(DURSeverity), nullable=False)
    description = Column(Text, nullable=False)
    mechanism = Column(Text, nullable=True)
    clinical_effect = Column(Text, nullable=True)
    management = Column(Text, nullable=True)

    # 참조
    reference_source = Column(String(100), nullable=True)
    reference_url = Column(String(500), nullable=True)

    # 메타
    last_synced_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_drug_interaction_pair", "drug_code_a", "drug_code_b", unique=True),
        Index("ix_drug_interaction_severity", "severity"),
    )
