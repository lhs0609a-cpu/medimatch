"""
세무 감사 로그 & 홈택스 인증 모델

- TaxAuditLog: 세무 작업 감사 추적
- HometaxCredential: 홈택스 인증 정보
"""
import uuid
import enum
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Text, DateTime,
    ForeignKey, Boolean, Index
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.core.database import Base


# ===== Enums =====

class TaxAuditAction(str, enum.Enum):
    CREATED = "CREATED"
    UPDATED = "UPDATED"
    STATUS_CHANGED = "STATUS_CHANGED"
    AI_SCANNED = "AI_SCANNED"
    DOCUMENT_UPLOADED = "DOCUMENT_UPLOADED"
    DOCUMENT_VERIFIED = "DOCUMENT_VERIFIED"
    HOMETAX_SYNCED = "HOMETAX_SYNCED"
    SUBMITTED = "SUBMITTED"
    FEE_CALCULATED = "FEE_CALCULATED"
    FEE_PAID = "FEE_PAID"
    DEDUCTION_ADDED = "DEDUCTION_ADDED"
    DEDUCTION_REMOVED = "DEDUCTION_REMOVED"
    ACCOUNTANT_REVIEWED = "ACCOUNTANT_REVIEWED"
    EXPORTED = "EXPORTED"
    VIEWED = "VIEWED"


class HometaxAuthType(str, enum.Enum):
    CERTIFICATE = "CERTIFICATE"     # 공동인증서
    SIMPLE_AUTH = "SIMPLE_AUTH"      # 간편인증 (카카오/네이버/PASS)
    DELEGATION = "DELEGATION"        # 세무사 위임


# ===== Models =====

class TaxAuditLog(Base):
    """세무 작업 감사 추적"""
    __tablename__ = "tax_audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    correction_id = Column(UUID(as_uuid=True), ForeignKey("tax_corrections.id", ondelete="SET NULL"), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # 작업 정보
    action = Column(SQLEnum(TaxAuditAction), nullable=False)
    entity_type = Column(String(50), nullable=False)
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
        Index("ix_tax_audit_correction", "correction_id"),
        Index("ix_tax_audit_user", "user_id"),
        Index("ix_tax_audit_action", "action"),
        Index("ix_tax_audit_created", "created_at"),
    )


class HometaxCredential(Base):
    """홈택스 인증 정보 (AES-256 암호화)"""
    __tablename__ = "hometax_credentials"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)

    # 인증 방식
    auth_type = Column(SQLEnum(HometaxAuthType), nullable=False)

    # 암호화된 인증 정보
    encrypted_credential = Column(Text, nullable=True)  # AES-256-GCM 암호화
    encryption_key_id = Column(String(100), nullable=True)  # KMS 키 ID
    credential_iv = Column(String(50), nullable=True)  # 초기화 벡터

    # 세무사 위임 정보
    tax_accountant_name = Column(String(100), nullable=True)
    tax_accountant_license = Column(String(30), nullable=True)
    delegation_start = Column(DateTime, nullable=True)
    delegation_end = Column(DateTime, nullable=True)
    delegation_scope = Column(JSONB, default=[], nullable=False)
    """["소득세_조회", "소득세_신고", "경정청구", "증빙_조회"]"""

    # 상태
    is_active = Column(Boolean, default=True, nullable=False)
    last_used_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_hometax_cred_user", "user_id"),
        Index("ix_hometax_cred_active", "is_active"),
    )
