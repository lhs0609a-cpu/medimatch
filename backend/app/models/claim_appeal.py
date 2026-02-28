"""
이의신청 모델

- ClaimAppeal: 보험청구 이의신청 관리
"""
import uuid
import enum
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, BigInteger, Float, Text, DateTime, Date,
    ForeignKey, Boolean, Index
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.core.database import Base


# ===== Enums =====

class AppealType(str, enum.Enum):
    FULL_REJECTION = "FULL_REJECTION"        # 전체 삭감 이의
    PARTIAL_REJECTION = "PARTIAL_REJECTION"  # 일부 삭감 이의
    UNIT_PRICE = "UNIT_PRICE"                # 단가 이의
    ADJUSTMENT = "ADJUSTMENT"                 # 조정 이의


class AppealStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    LETTER_GENERATED = "LETTER_GENERATED"
    REVIEW_PENDING = "REVIEW_PENDING"
    SUBMITTED = "SUBMITTED"
    ACCEPTED = "ACCEPTED"
    PARTIALLY_ACCEPTED = "PARTIALLY_ACCEPTED"
    REJECTED = "REJECTED"
    WITHDRAWN = "WITHDRAWN"


# ===== Models =====

class ClaimAppeal(Base):
    """보험청구 이의신청"""
    __tablename__ = "claim_appeals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    claim_id = Column(UUID(as_uuid=True), ForeignKey("insurance_claims.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # 이의신청 기본 정보
    appeal_number = Column(String(30), unique=True, nullable=False)
    appeal_type = Column(SQLEnum(AppealType), nullable=False)
    status = Column(SQLEnum(AppealStatus), default=AppealStatus.DRAFT, nullable=False)

    # 삭감 정보
    rejected_items = Column(JSONB, default=[], nullable=False)
    """
    [
        {"item_id": 1, "code": "HA010", "rejected_amount": 15000, "reason": "..."}
    ]
    """
    total_rejected_amount = Column(BigInteger, default=0, nullable=False)
    appealed_amount = Column(BigInteger, default=0, nullable=False)

    # AI 이의신청서
    ai_generated_letter = Column(Text, nullable=True)
    ai_success_probability = Column(Float, nullable=True)  # 0.0-1.0
    ai_reasoning = Column(JSONB, default={}, nullable=False)
    """
    {
        "similar_cases": [...],
        "legal_basis": [...],
        "key_arguments": [...]
    }
    """

    # 사용자 편집 이의신청서
    final_letter = Column(Text, nullable=True)
    supporting_evidence = Column(JSONB, default=[], nullable=False)

    # 제출/결과
    submitted_at = Column(DateTime, nullable=True)
    deadline = Column(Date, nullable=True)  # 이의신청 기한 (90일)
    result_received_at = Column(DateTime, nullable=True)
    result_detail = Column(JSONB, default={}, nullable=False)
    recovered_amount = Column(BigInteger, default=0, nullable=False)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_appeal_claim", "claim_id"),
        Index("ix_appeal_user", "user_id"),
        Index("ix_appeal_status", "status"),
        Index("ix_appeal_number", "appeal_number"),
    )
