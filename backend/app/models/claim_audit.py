"""
청구 감사 로그 모델

- ClaimAuditLog: 청구 작업 감사 추적
"""
import uuid
import enum
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Text, DateTime, ForeignKey, Index
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.core.database import Base


# ===== Enums =====

class ClaimAuditAction(str, enum.Enum):
    CREATED = "CREATED"
    UPDATED = "UPDATED"
    STATUS_CHANGED = "STATUS_CHANGED"
    AI_ANALYZED = "AI_ANALYZED"
    DUR_CHECKED = "DUR_CHECKED"
    EDI_SUBMITTED = "EDI_SUBMITTED"
    EDI_RECEIVED = "EDI_RECEIVED"
    APPEAL_CREATED = "APPEAL_CREATED"
    APPEAL_SUBMITTED = "APPEAL_SUBMITTED"
    ITEM_ADDED = "ITEM_ADDED"
    ITEM_REMOVED = "ITEM_REMOVED"
    ITEM_MODIFIED = "ITEM_MODIFIED"
    BATCH_CREATED = "BATCH_CREATED"
    EXPORTED = "EXPORTED"
    VIEWED = "VIEWED"


# ===== Models =====

class ClaimAuditLog(Base):
    """청구 작업 감사 추적"""
    __tablename__ = "claim_audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    claim_id = Column(UUID(as_uuid=True), ForeignKey("insurance_claims.id", ondelete="SET NULL"), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # 작업 정보
    action = Column(SQLEnum(ClaimAuditAction), nullable=False)
    entity_type = Column(String(50), nullable=False)  # InsuranceClaim, ClaimItem, ClaimBatch, etc.
    entity_id = Column(String(50), nullable=True)

    # 변경 내역
    old_value = Column(JSONB, nullable=True)
    new_value = Column(JSONB, nullable=True)
    description = Column(Text, nullable=True)

    # 접속 정보
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_claim_audit_claim", "claim_id"),
        Index("ix_claim_audit_user", "user_id"),
        Index("ix_claim_audit_action", "action"),
        Index("ix_claim_audit_created", "created_at"),
        Index("ix_claim_audit_entity", "entity_type", "entity_id"),
    )
