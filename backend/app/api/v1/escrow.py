"""
에스크로 결제 API

- 계약서 생성/서명
- 에스크로 거래 관리
- 마일스톤 관리
- 플랫폼 내 채팅 (연락처 우회 탐지)
- 분쟁 관리
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from uuid import UUID

from ..deps import get_db, get_current_active_user
from ...models.user import User
from ...schemas.escrow import (
    # Contract
    ContractCreate, ContractUpdate, ContractSignRequest, ContractResponse,
    # Escrow
    EscrowCreate, EscrowFundRequest, EscrowConfirmRequest,
    EscrowResponse, EscrowListResponse, EscrowPayoutRequest,
    # Milestone
    MilestoneResponse, MilestoneSubmitRequest, MilestoneRejectRequest,
    # Message
    MessageCreate, MessageResponse, MessageListResponse, ContactWarningResponse,
    # Dispute
    DisputeCreate, DisputeResolveRequest, DisputeResponse,
    # Payout
    PayoutSummary
)
from ...services.escrow import escrow_service
from ...services.toss_payments import toss_payments_service

router = APIRouter()


# ============================================================
# 계약서 API
# ============================================================

@router.post("/contracts", response_model=ContractResponse, status_code=status.HTTP_201_CREATED)
async def create_contract(
    data: ContractCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    계약서 생성

    파트너와의 계약서를 작성합니다. 생성 후 양측이 서명해야 합니다.
    """
    try:
        contract = await escrow_service.create_contract(db, data, current_user.id)
        return contract
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/contracts/{contract_id}", response_model=ContractResponse)
async def get_contract(
    contract_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """계약서 조회"""
    contract = await escrow_service.get_contract(db, contract_id, current_user.id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return contract


@router.post("/contracts/{contract_id}/sign", response_model=ContractResponse)
async def sign_contract(
    contract_id: int,
    data: ContractSignRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    계약서 서명

    Base64 인코딩된 서명 이미지를 전송합니다.
    양측이 모두 서명하면 계약이 체결됩니다.
    """
    try:
        ip_address = request.client.host if request.client else "unknown"
        contract = await escrow_service.sign_contract(
            db, contract_id, current_user.id, data.signature, ip_address
        )
        return contract
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============================================================
# 에스크로 거래 API
# ============================================================

@router.post("/transactions", response_model=EscrowResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    data: EscrowCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    에스크로 거래 생성

    계약서 서명 완료 후 에스크로 거래를 생성합니다.
    자동으로 30-40-30 마일스톤이 생성됩니다.
    """
    try:
        escrow = await escrow_service.create_transaction(db, data.contract_id, current_user.id)
        return escrow
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/transactions", response_model=EscrowListResponse)
async def get_transactions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """내 에스크로 거래 목록"""
    transactions = await escrow_service.get_user_transactions(db, current_user.id)
    return EscrowListResponse(items=transactions, total=len(transactions))


@router.get("/transactions/{escrow_id}", response_model=EscrowResponse)
async def get_transaction(
    escrow_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """에스크로 거래 상세"""
    escrow = await escrow_service.get_transaction(db, escrow_id, current_user.id)
    if not escrow:
        raise HTTPException(status_code=404, detail="Escrow transaction not found")
    return escrow


@router.post("/transactions/{escrow_id}/fund")
async def fund_transaction(
    escrow_id: UUID,
    data: EscrowFundRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    예치금 결제 시작

    토스페이먼츠 결제창을 호출하기 위한 정보를 반환합니다.
    """
    escrow = await escrow_service.get_transaction(db, escrow_id, current_user.id)
    if not escrow:
        raise HTTPException(status_code=404, detail="Escrow transaction not found")

    # 토스페이먼츠 결제 정보 생성
    order_id = f"ESC-{escrow.escrow_number}"
    payment_info = toss_payments_service.create_payment_info(
        order_id=order_id,
        amount=int(escrow.total_amount),
        order_name=f"에스크로 결제 - {escrow.escrow_number}",
        success_url=data.success_url,
        fail_url=data.fail_url,
        customer_email=current_user.email,
        customer_name=current_user.full_name,
        customer_phone=current_user.phone
    )

    return {
        "escrow_id": str(escrow_id),
        **payment_info
    }


@router.post("/transactions/{escrow_id}/confirm", response_model=EscrowResponse)
async def confirm_transaction(
    escrow_id: UUID,
    data: EscrowConfirmRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    결제 승인

    토스페이먼츠 결제 완료 후 호출됩니다.
    """
    try:
        # 에스크로 거래 조회
        escrow = await escrow_service.get_transaction(db, escrow_id, current_user.id)
        if not escrow:
            raise HTTPException(status_code=404, detail="Escrow transaction not found")

        # 토스페이먼츠 결제 승인 API 호출
        payment_result = await toss_payments_service.confirm_payment(
            payment_key=data.payment_key,
            order_id=data.order_id,
            amount=int(escrow.total_amount)
        )

        if not payment_result.success:
            raise HTTPException(
                status_code=400,
                detail=f"결제 승인 실패: {payment_result.error_message}"
            )

        # 에스크로 결제 완료 처리
        escrow = await escrow_service.fund_transaction(
            db, escrow_id, data.payment_key, data.order_id
        )
        return escrow
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/transactions/{escrow_id}/release", response_model=EscrowResponse)
async def release_transaction(
    escrow_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    정산 요청

    모든 마일스톤이 승인된 후 파트너에게 정산합니다.
    """
    try:
        escrow = await escrow_service.release_funds(db, escrow_id, current_user.id)
        return escrow
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============================================================
# 마일스톤 API
# ============================================================

@router.get("/transactions/{escrow_id}/milestones", response_model=List[MilestoneResponse])
async def get_milestones(
    escrow_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """마일스톤 목록"""
    escrow = await escrow_service.get_transaction(db, escrow_id, current_user.id)
    if not escrow:
        raise HTTPException(status_code=404, detail="Escrow transaction not found")
    return escrow.milestones


@router.post("/milestones/{milestone_id}/submit", response_model=MilestoneResponse)
async def submit_milestone(
    milestone_id: UUID,
    data: MilestoneSubmitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    마일스톤 완료 제출 (파트너)

    증빙 자료와 함께 마일스톤 완료를 제출합니다.
    고객이 승인하면 다음 마일스톤이 활성화됩니다.
    """
    try:
        milestone = await escrow_service.submit_milestone(
            db, milestone_id, current_user.id, data
        )
        return milestone
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/milestones/{milestone_id}/approve", response_model=MilestoneResponse)
async def approve_milestone(
    milestone_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    마일스톤 승인 (고객)

    파트너가 제출한 마일스톤을 승인합니다.
    """
    try:
        milestone = await escrow_service.approve_milestone(db, milestone_id, current_user.id)
        return milestone
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/milestones/{milestone_id}/reject", response_model=MilestoneResponse)
async def reject_milestone(
    milestone_id: UUID,
    data: MilestoneRejectRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    마일스톤 거절 (고객)

    파트너가 제출한 마일스톤을 거절합니다.
    파트너는 거절 사유를 확인하고 재제출할 수 있습니다.
    """
    try:
        milestone = await escrow_service.reject_milestone(
            db, milestone_id, current_user.id, data.reason
        )
        return milestone
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============================================================
# 채팅 API
# ============================================================

@router.get("/transactions/{escrow_id}/messages", response_model=MessageListResponse)
async def get_messages(
    escrow_id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    메시지 목록 조회

    에스크로 거래의 채팅 메시지를 조회합니다.
    자동으로 읽음 처리됩니다.
    """
    result = await escrow_service.get_messages(
        db, escrow_id, current_user.id, page, page_size
    )

    # 응답 변환 (sender 관계 포함)
    items = []
    for msg in result["items"]:
        # 송신자 이름 조회 - sender relationship 사용
        sender_name = msg.sender.full_name if msg.sender else None

        items.append(MessageResponse(
            id=msg.id,
            escrow_id=msg.escrow_id,
            sender_id=msg.sender_id,
            sender_name=sender_name,
            message_type=msg.message_type,
            content=msg.filtered_content or msg.content,  # 마스킹된 내용 우선
            filtered_content=msg.filtered_content,
            attachments=msg.attachments or [],
            contains_contact_info=msg.contains_contact_info,
            is_read=msg.is_read,
            read_at=msg.read_at,
            created_at=msg.created_at
        ))

    return MessageListResponse(
        items=items,
        total=result["total"],
        unread_count=result["unread_count"]
    )


@router.post("/transactions/{escrow_id}/messages", response_model=MessageResponse)
async def send_message(
    escrow_id: UUID,
    data: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    메시지 전송

    연락처 정보가 감지되면 자동으로 마스킹됩니다.
    반복 위반 시 메시지 전송이 차단될 수 있습니다.
    """
    try:
        message, warning = await escrow_service.send_message(
            db, escrow_id, current_user.id, data
        )

        return MessageResponse(
            id=message.id,
            escrow_id=message.escrow_id,
            sender_id=message.sender_id,
            sender_name=None,
            message_type=message.message_type,
            content=message.filtered_content or message.content,
            filtered_content=message.filtered_content,
            attachments=message.attachments or [],
            contains_contact_info=message.contains_contact_info,
            is_read=message.is_read,
            read_at=message.read_at,
            created_at=message.created_at,
            warning_message=warning
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============================================================
# 분쟁 API
# ============================================================

@router.post("/transactions/{escrow_id}/dispute", response_model=DisputeResponse)
async def create_dispute(
    escrow_id: UUID,
    data: DisputeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    분쟁 제기

    서비스에 문제가 있을 경우 분쟁을 제기합니다.
    관리자가 검토 후 조치합니다.
    """
    try:
        dispute = await escrow_service.create_dispute(db, escrow_id, current_user.id, data)
        return dispute
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
