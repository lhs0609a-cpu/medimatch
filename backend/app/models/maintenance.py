"""
관리유지비 정기결제 모델

- MaintenanceContract: 고객별 관리유지비 계약 (관리자가 금액 자유 설정)
- MaintenanceRequest: 고객↔관리자 요청 게시판
- MaintenanceComment: 요청에 대한 댓글/답변
- MaintenancePlanPreset: 관리비 금액 프리셋
"""
from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, Enum, Text, Boolean, Index,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base


# ============================================================
# Enums
# ============================================================

class MaintenanceStatus(str, enum.Enum):
    PENDING_SETUP = "PENDING_SETUP"   # 카드 미등록 (초대 전송됨)
    ACTIVE = "ACTIVE"                 # 정상 결제 중
    PAST_DUE = "PAST_DUE"           # 결제 실패 재시도 중
    SUSPENDED = "SUSPENDED"           # 재시도 3회 초과 → 서비스 정지
    CANCELED = "CANCELED"             # 해지 요청 (기간 종료까지 유지)
    EXPIRED = "EXPIRED"               # 기간 만료


class MaintenanceServiceType(str, enum.Enum):
    HOMEPAGE = "HOMEPAGE"
    PROGRAM = "PROGRAM"


class RequestCategory(str, enum.Enum):
    MODIFICATION = "MODIFICATION"     # 수정 요청
    FEATURE = "FEATURE"               # 기능 추가
    BUG = "BUG"                       # 버그 신고
    CONTENT = "CONTENT"               # 콘텐츠 변경
    OTHER = "OTHER"                   # 기타


class RequestStatus(str, enum.Enum):
    RECEIVED = "RECEIVED"             # 접수
    IN_PROGRESS = "IN_PROGRESS"       # 처리 중
    COMPLETED = "COMPLETED"           # 완료
    CLOSED = "CLOSED"                 # 종결


class RequestPriority(str, enum.Enum):
    LOW = "LOW"
    NORMAL = "NORMAL"
    HIGH = "HIGH"
    URGENT = "URGENT"


# ============================================================
# Models
# ============================================================

class MaintenanceContract(Base):
    """관리유지비 계약"""
    __tablename__ = "maintenance_contracts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # 프로젝트 정보
    project_name = Column(String(200), nullable=False)
    service_type = Column(Enum(MaintenanceServiceType), nullable=False)
    description = Column(Text, nullable=True)

    # 금액 & 결제일
    monthly_amount = Column(Integer, nullable=False)
    billing_day = Column(Integer, default=1, nullable=False)  # 매월 결제일 (1~28)

    # 고객사 정보
    company_name = Column(String(200), nullable=True)
    contact_person = Column(String(100), nullable=True)
    contact_email = Column(String(200), nullable=True)
    contact_phone = Column(String(20), nullable=True)

    # 빌링키 (Toss)
    billing_key = Column(String(200), nullable=True)
    customer_key = Column(String(100), nullable=True)
    card_company = Column(String(50), nullable=True)
    card_number = Column(String(50), nullable=True)  # 마스킹: "****1234"

    # 상태
    status = Column(Enum(MaintenanceStatus), default=MaintenanceStatus.PENDING_SETUP, nullable=False)

    # 기간
    contract_start_date = Column(DateTime, nullable=True)
    current_period_start = Column(DateTime, nullable=True)
    current_period_end = Column(DateTime, nullable=True)
    next_billing_date = Column(DateTime, nullable=True)

    # 결제 실패 재시도
    retry_count = Column(Integer, default=0, nullable=False)
    last_retry_at = Column(DateTime, nullable=True)

    # 누적 통계
    total_paid = Column(Integer, default=0, nullable=False)
    total_months = Column(Integer, default=0, nullable=False)

    # 결제 연결
    last_payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True)

    # 관리자 메모
    admin_memo = Column(Text, nullable=True)

    # 해지
    canceled_at = Column(DateTime, nullable=True)
    cancel_reason = Column(Text, nullable=True)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계
    user = relationship("User", foreign_keys=[user_id], backref="maintenance_contracts")
    creator = relationship("User", foreign_keys=[created_by])
    last_payment = relationship("Payment", foreign_keys=[last_payment_id])
    requests = relationship("MaintenanceRequest", back_populates="contract", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_maint_contract_status", "status"),
        Index("ix_maint_contract_next_billing", "next_billing_date"),
        Index("ix_maint_contract_user", "user_id"),
    )


class MaintenanceRequest(Base):
    """요청 게시판"""
    __tablename__ = "maintenance_requests"

    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, ForeignKey("maintenance_contracts.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    category = Column(Enum(RequestCategory), nullable=False)
    priority = Column(Enum(RequestPriority), default=RequestPriority.NORMAL, nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    attachments = Column(JSONB, default=list)

    status = Column(Enum(RequestStatus), default=RequestStatus.RECEIVED, nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계
    contract = relationship("MaintenanceContract", back_populates="requests")
    author = relationship("User", foreign_keys=[author_id])
    comments = relationship("MaintenanceComment", back_populates="request", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_maint_request_contract", "contract_id"),
        Index("ix_maint_request_status", "status"),
    )


class MaintenanceComment(Base):
    """요청 댓글"""
    __tablename__ = "maintenance_comments"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("maintenance_requests.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    content = Column(Text, nullable=False)
    attachments = Column(JSONB, default=list)
    is_internal = Column(Boolean, default=False, nullable=False)  # True=관리자 내부 메모

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계
    request = relationship("MaintenanceRequest", back_populates="comments")
    author = relationship("User", foreign_keys=[author_id])


class MaintenancePlanPreset(Base):
    """관리비 금액 프리셋"""
    __tablename__ = "maintenance_plan_presets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    amount = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
