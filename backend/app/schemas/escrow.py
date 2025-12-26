"""
에스크로 시스템 Pydantic 스키마
"""
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, Field

from ..models.escrow import (
    EscrowStatus, MilestoneStatus, ContractStatus,
    MessageType, DetectionAction, DisputeStatus
)


# ============================================================
# 계약서 스키마
# ============================================================

class ContractCreate(BaseModel):
    """계약서 생성"""
    partner_id: int
    inquiry_id: Optional[int] = None
    title: str = Field(..., min_length=1, max_length=300)
    description: Optional[str] = None
    contract_content: str = Field(..., min_length=10)
    terms_and_conditions: Optional[str] = None
    total_amount: Decimal = Field(..., gt=0)
    deposit_amount: Optional[Decimal] = None
    service_start_date: Optional[datetime] = None
    service_end_date: Optional[datetime] = None


class ContractUpdate(BaseModel):
    """계약서 수정 (DRAFT 상태만)"""
    title: Optional[str] = None
    description: Optional[str] = None
    contract_content: Optional[str] = None
    terms_and_conditions: Optional[str] = None
    total_amount: Optional[Decimal] = None
    service_start_date: Optional[datetime] = None
    service_end_date: Optional[datetime] = None


class ContractSignRequest(BaseModel):
    """계약서 서명 요청"""
    signature: str = Field(..., description="Base64 인코딩된 서명 이미지")


class ContractResponse(BaseModel):
    """계약서 응답"""
    id: int
    contract_number: str
    customer_id: UUID
    partner_id: int
    inquiry_id: Optional[int]
    title: str
    description: Optional[str]
    contract_content: str
    terms_and_conditions: Optional[str]
    total_amount: Decimal
    deposit_amount: Optional[Decimal]
    commission_rate: Decimal
    commission_amount: Optional[Decimal]
    service_start_date: Optional[datetime]
    service_end_date: Optional[datetime]
    customer_signed: bool
    customer_signed_at: Optional[datetime]
    partner_signed: bool
    partner_signed_at: Optional[datetime]
    status: ContractStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# 에스크로 거래 스키마
# ============================================================

class EscrowCreate(BaseModel):
    """에스크로 거래 생성 (계약서 서명 완료 후)"""
    contract_id: int


class EscrowFundRequest(BaseModel):
    """에스크로 예치금 결제 요청"""
    success_url: str
    fail_url: str


class EscrowConfirmRequest(BaseModel):
    """에스크로 결제 승인"""
    payment_key: str
    order_id: str
    amount: int


class EscrowPayoutRequest(BaseModel):
    """파트너 정산 계좌 등록"""
    bank: str = Field(..., max_length=50)
    account_number: str = Field(..., max_length=50)
    account_holder: str = Field(..., max_length=100)


class MilestoneResponse(BaseModel):
    """마일스톤 응답"""
    id: UUID
    escrow_id: UUID
    name: str
    description: Optional[str]
    sequence: int
    amount: Decimal
    percentage: Decimal
    status: MilestoneStatus
    due_date: Optional[datetime]
    submitted_at: Optional[datetime]
    approved_at: Optional[datetime]
    released_at: Optional[datetime]
    rejected_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    proof_description: Optional[str]
    proof_files: List[str] = []
    created_at: datetime

    class Config:
        from_attributes = True


class EscrowResponse(BaseModel):
    """에스크로 거래 응답"""
    id: UUID
    escrow_number: str
    customer_id: UUID
    partner_id: int
    contract_id: int
    total_amount: Decimal
    platform_fee: Decimal
    partner_payout: Decimal
    status: EscrowStatus
    payment_key: Optional[str]
    order_id: Optional[str]
    created_at: datetime
    funded_at: Optional[datetime]
    completed_at: Optional[datetime]
    released_at: Optional[datetime]
    milestones: List[MilestoneResponse] = []

    class Config:
        from_attributes = True


class EscrowListResponse(BaseModel):
    """에스크로 거래 목록"""
    items: List[EscrowResponse]
    total: int


# ============================================================
# 마일스톤 스키마
# ============================================================

class MilestoneSubmitRequest(BaseModel):
    """마일스톤 완료 제출 (파트너)"""
    proof_description: Optional[str] = None
    proof_files: List[str] = Field(default_factory=list)  # 파일 URL 목록


class MilestoneRejectRequest(BaseModel):
    """마일스톤 거절 (고객)"""
    reason: str = Field(..., min_length=10, max_length=500)


# ============================================================
# 채팅 메시지 스키마
# ============================================================

class MessageCreate(BaseModel):
    """메시지 전송"""
    content: str = Field(..., min_length=1, max_length=2000)
    message_type: MessageType = MessageType.TEXT
    attachments: List[str] = Field(default_factory=list)


class MessageResponse(BaseModel):
    """메시지 응답"""
    id: UUID
    escrow_id: UUID
    sender_id: UUID
    sender_name: Optional[str] = None  # 익명 또는 파트너명
    message_type: MessageType
    content: str
    filtered_content: Optional[str]
    attachments: List[str]
    contains_contact_info: bool
    is_read: bool
    read_at: Optional[datetime]
    created_at: datetime
    # 우회 탐지 경고
    warning_message: Optional[str] = None

    class Config:
        from_attributes = True


class MessageListResponse(BaseModel):
    """메시지 목록"""
    items: List[MessageResponse]
    total: int
    unread_count: int


class ContactWarningResponse(BaseModel):
    """연락처 탐지 경고 응답"""
    detected: bool
    action: Optional[DetectionAction]
    message: Optional[str]
    violation_count: int


# ============================================================
# 분쟁 스키마
# ============================================================

class DisputeCreate(BaseModel):
    """분쟁 제기"""
    reason: str = Field(..., max_length=100)
    description: str = Field(..., min_length=20, max_length=2000)
    evidence_files: List[str] = Field(default_factory=list)


class DisputeResolveRequest(BaseModel):
    """분쟁 해결 (관리자)"""
    status: DisputeStatus
    resolution_notes: str = Field(..., min_length=10)
    refund_amount: Optional[Decimal] = None


class DisputeResponse(BaseModel):
    """분쟁 응답"""
    id: int
    escrow_id: UUID
    raised_by: UUID
    reason: str
    description: str
    evidence_files: List[str]
    status: DisputeStatus
    resolution_notes: Optional[str]
    refund_amount: Optional[Decimal]
    assigned_admin_id: Optional[UUID]
    created_at: datetime
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True


# ============================================================
# 계약서 템플릿 스키마
# ============================================================

class ContractTemplateResponse(BaseModel):
    """계약서 템플릿"""
    id: str
    category: str
    name: str
    description: str
    content: str


# ============================================================
# 정산 스키마
# ============================================================

class PayoutSummary(BaseModel):
    """정산 요약"""
    escrow_id: UUID
    escrow_number: str
    total_amount: Decimal
    platform_fee: Decimal
    partner_payout: Decimal
    status: EscrowStatus
    milestones_completed: int
    milestones_total: int
