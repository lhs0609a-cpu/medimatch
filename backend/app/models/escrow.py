"""
에스크로 결제 시스템 모델
- 플랫폼 내 채팅 (연락처 비공개)
- 전자계약
- 에스크로 결제 (마일스톤 30-40-30)
- 연락처 우회 탐지
"""
import uuid
import enum
from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import (
    Column, String, Integer, Text, Boolean, DateTime, Float,
    ForeignKey, Enum as SQLEnum, Numeric, Index
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship

from ..core.database import Base


# ============================================================
# Enums
# ============================================================

class EscrowStatus(str, enum.Enum):
    """에스크로 거래 상태"""
    INITIATED = "INITIATED"          # 거래 생성됨
    FUNDED = "FUNDED"                # 입금 완료 (예치금 확보)
    IN_PROGRESS = "IN_PROGRESS"      # 서비스 진행중
    COMPLETED = "COMPLETED"          # 서비스 완료 (정산 대기)
    RELEASED = "RELEASED"            # 파트너에게 지급 완료
    DISPUTED = "DISPUTED"            # 분쟁 중
    REFUNDED = "REFUNDED"            # 환불됨
    CANCELLED = "CANCELLED"          # 취소됨


class MilestoneStatus(str, enum.Enum):
    """마일스톤 상태"""
    PENDING = "PENDING"              # 대기 (미결제)
    FUNDED = "FUNDED"                # 예치금 입금됨
    IN_PROGRESS = "IN_PROGRESS"      # 진행중
    REVIEW = "REVIEW"                # 검토 중 (고객 확인 대기)
    APPROVED = "APPROVED"            # 승인됨
    RELEASED = "RELEASED"            # 지급 완료
    DISPUTED = "DISPUTED"            # 분쟁 중


class ContractStatus(str, enum.Enum):
    """계약 상태"""
    DRAFT = "DRAFT"                          # 초안
    PENDING_CUSTOMER = "PENDING_CUSTOMER"    # 고객 서명 대기
    PENDING_PARTNER = "PENDING_PARTNER"      # 파트너 서명 대기
    SIGNED = "SIGNED"                        # 서명 완료
    ACTIVE = "ACTIVE"                        # 진행중
    COMPLETED = "COMPLETED"                  # 완료
    CANCELLED = "CANCELLED"                  # 취소


class MessageType(str, enum.Enum):
    """메시지 유형"""
    TEXT = "TEXT"
    IMAGE = "IMAGE"
    FILE = "FILE"
    SYSTEM = "SYSTEM"                # 시스템 메시지 (상태 변경 알림 등)
    CONTRACT = "CONTRACT"            # 계약서 공유
    MILESTONE = "MILESTONE"          # 마일스톤 관련


class DetectionAction(str, enum.Enum):
    """우회 탐지 조치"""
    WARNING = "WARNING"              # 경고
    BLOCKED = "BLOCKED"              # 차단
    FLAGGED = "FLAGGED"              # 관리자 검토 요청


class DisputeStatus(str, enum.Enum):
    """분쟁 상태"""
    OPEN = "OPEN"
    UNDER_REVIEW = "UNDER_REVIEW"
    RESOLVED_CUSTOMER = "RESOLVED_CUSTOMER"      # 고객 유리 판정
    RESOLVED_PARTNER = "RESOLVED_PARTNER"        # 파트너 유리 판정
    RESOLVED_PARTIAL = "RESOLVED_PARTIAL"        # 부분 환불
    CLOSED = "CLOSED"


# ============================================================
# Helper Functions
# ============================================================

def generate_escrow_number() -> str:
    """에스크로 번호 생성 (ESC-YYYYMMDD-XXXX)"""
    date_str = datetime.now().strftime("%Y%m%d")
    random_str = uuid.uuid4().hex[:6].upper()
    return f"ESC-{date_str}-{random_str}"


def generate_contract_number() -> str:
    """계약 번호 생성 (CON-YYYYMMDD-XXXX)"""
    date_str = datetime.now().strftime("%Y%m%d")
    random_str = uuid.uuid4().hex[:6].upper()
    return f"CON-{date_str}-{random_str}"


# ============================================================
# Models
# ============================================================

class EscrowContract(Base):
    """전자계약"""
    __tablename__ = "escrow_contracts"

    id = Column(Integer, primary_key=True, index=True)
    contract_number = Column(String(50), unique=True, nullable=False, default=generate_contract_number)

    # 참여자
    customer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    partner_id = Column(Integer, ForeignKey("partners.id"), nullable=False)
    inquiry_id = Column(Integer, ForeignKey("partner_inquiries.id"), nullable=True)

    # 계약 내용
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    contract_content = Column(Text, nullable=False)                 # 계약서 본문 (HTML/Markdown)
    terms_and_conditions = Column(Text, nullable=True)

    # 금액
    total_amount = Column(Numeric(15, 2), nullable=False)
    deposit_amount = Column(Numeric(15, 2), nullable=True)          # 착수금

    # 수수료 정보
    commission_rate = Column(Numeric(5, 2), default=3.0)            # 플랫폼 수수료율 (%)
    commission_amount = Column(Numeric(15, 2), nullable=True)       # 수수료 금액

    # 일정
    service_start_date = Column(DateTime, nullable=True)
    service_end_date = Column(DateTime, nullable=True)

    # 고객 서명
    customer_signed = Column(Boolean, default=False)
    customer_signature = Column(Text, nullable=True)                # Base64 서명 이미지
    customer_signed_at = Column(DateTime, nullable=True)
    customer_signed_ip = Column(String(50), nullable=True)

    # 파트너 서명
    partner_signed = Column(Boolean, default=False)
    partner_signature = Column(Text, nullable=True)
    partner_signed_at = Column(DateTime, nullable=True)
    partner_signed_ip = Column(String(50), nullable=True)

    # 상태
    status = Column(SQLEnum(ContractStatus), default=ContractStatus.DRAFT)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    customer = relationship("User", foreign_keys=[customer_id])
    partner = relationship("Partner", back_populates="escrow_contracts")
    inquiry = relationship("PartnerInquiry")
    escrow_transaction = relationship("EscrowTransaction", back_populates="contract", uselist=False)

    __table_args__ = (
        Index('ix_escrow_contracts_customer', 'customer_id'),
        Index('ix_escrow_contracts_partner', 'partner_id'),
        Index('ix_escrow_contracts_status', 'status'),
    )


class EscrowTransaction(Base):
    """에스크로 거래"""
    __tablename__ = "escrow_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    escrow_number = Column(String(50), unique=True, nullable=False, default=generate_escrow_number, index=True)

    # 참여자
    customer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    partner_id = Column(Integer, ForeignKey("partners.id"), nullable=False)

    # 연결된 계약
    contract_id = Column(Integer, ForeignKey("escrow_contracts.id"), nullable=False)

    # 금액 정보
    total_amount = Column(Numeric(15, 2), nullable=False)           # 총 거래 금액
    platform_fee = Column(Numeric(15, 2), nullable=False)           # 플랫폼 수수료
    partner_payout = Column(Numeric(15, 2), nullable=False)         # 파트너 지급액

    # 상태
    status = Column(SQLEnum(EscrowStatus), default=EscrowStatus.INITIATED)

    # 토스페이먼츠 결제 정보
    payment_key = Column(String(200), nullable=True)
    order_id = Column(String(100), nullable=True)

    # 정산 정보
    payout_account_bank = Column(String(50), nullable=True)
    payout_account_number = Column(String(50), nullable=True)
    payout_account_holder = Column(String(100), nullable=True)
    paid_at = Column(DateTime, nullable=True)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    funded_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    released_at = Column(DateTime, nullable=True)

    # Relationships
    customer = relationship("User", foreign_keys=[customer_id])
    partner = relationship("Partner", back_populates="escrow_transactions")
    contract = relationship("EscrowContract", back_populates="escrow_transaction")
    milestones = relationship("EscrowMilestone", back_populates="escrow_transaction", order_by="EscrowMilestone.sequence")
    messages = relationship("EscrowMessage", back_populates="escrow_transaction", order_by="EscrowMessage.created_at")
    disputes = relationship("EscrowDispute", back_populates="escrow_transaction")

    __table_args__ = (
        Index('ix_escrow_transactions_customer', 'customer_id'),
        Index('ix_escrow_transactions_partner', 'partner_id'),
        Index('ix_escrow_transactions_status', 'status'),
    )


class EscrowMilestone(Base):
    """마일스톤 (30-40-30 고정)"""
    __tablename__ = "escrow_milestones"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    escrow_id = Column(UUID(as_uuid=True), ForeignKey("escrow_transactions.id"), nullable=False)

    # 마일스톤 정보
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    sequence = Column(Integer, nullable=False)                      # 순서 (1, 2, 3)

    # 금액
    amount = Column(Numeric(15, 2), nullable=False)
    percentage = Column(Numeric(5, 2), nullable=False)              # 전체 금액 대비 비율 (30, 40, 30)

    # 상태
    status = Column(SQLEnum(MilestoneStatus), default=MilestoneStatus.PENDING)

    # 완료 조건
    due_date = Column(DateTime, nullable=True)
    submitted_at = Column(DateTime, nullable=True)                  # 파트너가 완료 제출한 시간
    approved_at = Column(DateTime, nullable=True)                   # 고객이 승인한 시간
    released_at = Column(DateTime, nullable=True)                   # 지급 완료 시간

    # 거절 정보
    rejected_at = Column(DateTime, nullable=True)                   # 고객이 거절한 시간
    rejection_reason = Column(Text, nullable=True)                  # 거절 사유

    # 증빙
    proof_description = Column(Text, nullable=True)
    proof_files = Column(JSONB, default=[])                         # 파일 URL 목록

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    escrow_transaction = relationship("EscrowTransaction", back_populates="milestones")

    __table_args__ = (
        Index('ix_escrow_milestones_escrow_seq', 'escrow_id', 'sequence'),
    )


class EscrowMessage(Base):
    """에스크로 채팅 메시지"""
    __tablename__ = "escrow_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    escrow_id = Column(UUID(as_uuid=True), ForeignKey("escrow_transactions.id"), nullable=False)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # 메시지 내용
    message_type = Column(SQLEnum(MessageType), default=MessageType.TEXT)
    content = Column(Text, nullable=False)
    filtered_content = Column(Text, nullable=True)                  # 연락처 필터링된 내용

    # 첨부 파일
    attachments = Column(JSONB, default=[])

    # 연락처 탐지
    contains_contact_info = Column(Boolean, default=False)
    contact_detection_log_id = Column(Integer, ForeignKey("contact_detection_logs.id"), nullable=True)

    # 읽음 상태
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    escrow_transaction = relationship("EscrowTransaction", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id])
    detection_log = relationship("ContactDetectionLog", back_populates="message")

    __table_args__ = (
        Index('ix_escrow_messages_escrow_created', 'escrow_id', 'created_at'),
    )


class ContactDetectionLog(Base):
    """연락처 우회 탐지 로그"""
    __tablename__ = "contact_detection_logs"

    id = Column(Integer, primary_key=True, index=True)
    escrow_id = Column(UUID(as_uuid=True), ForeignKey("escrow_transactions.id"), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # 탐지 정보
    detected_pattern = Column(String(100), nullable=False)          # phone, email, sns, url
    detected_value = Column(String(500), nullable=False)            # 탐지된 값 (마스킹됨)
    original_content = Column(Text, nullable=False)                 # 원본 메시지

    # 조치
    action_taken = Column(SQLEnum(DetectionAction), nullable=False)

    # 반복 횟수
    user_violation_count = Column(Integer, default=1)               # 사용자의 누적 위반 횟수

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    message = relationship("EscrowMessage", back_populates="detection_log", uselist=False)

    __table_args__ = (
        Index('ix_contact_detection_user', 'user_id'),
        Index('ix_contact_detection_escrow', 'escrow_id'),
    )


class EscrowDispute(Base):
    """분쟁 관리"""
    __tablename__ = "escrow_disputes"

    id = Column(Integer, primary_key=True, index=True)
    escrow_id = Column(UUID(as_uuid=True), ForeignKey("escrow_transactions.id"), nullable=False)
    raised_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # 분쟁 내용
    reason = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    evidence_files = Column(JSONB, default=[])

    # 해결
    status = Column(SQLEnum(DisputeStatus), default=DisputeStatus.OPEN)
    resolution_notes = Column(Text, nullable=True)
    refund_amount = Column(Numeric(15, 2), nullable=True)

    # 담당자
    assigned_admin_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    escrow_transaction = relationship("EscrowTransaction", back_populates="disputes")
    raised_by_user = relationship("User", foreign_keys=[raised_by])
    assigned_admin = relationship("User", foreign_keys=[assigned_admin_id])

    __table_args__ = (
        Index('ix_escrow_disputes_status', 'status'),
    )


# ============================================================
# 기본 마일스톤 설정 (30-40-30 고정)
# ============================================================

DEFAULT_MILESTONES = [
    {"sequence": 1, "name": "착수금", "percentage": 30, "description": "계약 체결 시 지급"},
    {"sequence": 2, "name": "중도금", "percentage": 40, "description": "중간 작업 완료 후 지급"},
    {"sequence": 3, "name": "잔금", "percentage": 30, "description": "최종 완료 후 지급"},
]


def create_default_milestones(escrow_id: uuid.UUID, total_amount: Decimal) -> List[EscrowMilestone]:
    """기본 마일스톤 생성 (30-40-30)"""
    milestones = []
    for config in DEFAULT_MILESTONES:
        amount = total_amount * Decimal(config["percentage"]) / 100
        milestone = EscrowMilestone(
            escrow_id=escrow_id,
            name=config["name"],
            description=config["description"],
            sequence=config["sequence"],
            percentage=config["percentage"],
            amount=amount,
            status=MilestoneStatus.PENDING
        )
        milestones.append(milestone)
    return milestones
