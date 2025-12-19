from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from uuid import UUID

from ...schemas.pharmacy import (
    PharmacySlotCreate, PharmacySlotUpdate, PharmacySlotResponse,
    PharmacySlotListResponse, BidCreate, BidResponse, BidListResponse
)
from ...models.pharmacy import SlotStatus
from ...services.matching import matching_service
from ...models.user import User
from ..deps import get_db, get_current_active_user, require_admin, require_pharmacist
from ...core.security import TokenData

router = APIRouter()


@router.post("", response_model=PharmacySlotResponse, status_code=status.HTTP_201_CREATED)
async def create_slot(
    slot_data: PharmacySlotCreate,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(require_admin)
):
    """
    새 약국 자리 등록 (관리자 전용)

    부공연이 의사 유치 완료한 자리를 플랫폼에 등록합니다.
    """
    slot = await matching_service.create_slot(
        db=db,
        slot_data=slot_data,
        created_by=UUID(current_user.user_id)
    )
    return slot


@router.get("", response_model=PharmacySlotListResponse)
async def get_slots(
    status: Optional[SlotStatus] = None,
    clinic_type: Optional[str] = None,
    min_revenue: Optional[int] = Query(None, description="최소 예상 월매출"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    열린 약국 자리 목록 조회

    - **status**: 상태 필터 (OPEN, BIDDING, MATCHED, CLOSED)
    - **clinic_type**: 진료과목 필터
    - **min_revenue**: 최소 예상 월매출
    """
    result = await matching_service.get_slots(
        db=db,
        status=status,
        clinic_type=clinic_type,
        min_revenue=min_revenue,
        page=page,
        page_size=page_size
    )
    return result


@router.get("/{slot_id}", response_model=PharmacySlotResponse)
async def get_slot(
    slot_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """약국 자리 상세 조회 (예측 데이터 포함)"""
    slot = await matching_service.get_slot(db, slot_id)
    if not slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Slot not found"
        )

    # Get bid stats
    from ...services.matching import matching_service
    bid_stats = await matching_service._get_slot_bid_stats(db, slot_id)

    return PharmacySlotResponse(
        id=slot.id,
        address=slot.address,
        latitude=slot.latitude,
        longitude=slot.longitude,
        clinic_type=slot.clinic_type,
        clinic_name=slot.clinic_name,
        est_daily_rx=slot.est_daily_rx,
        est_monthly_revenue=slot.est_monthly_revenue,
        min_bid_amount=slot.min_bid_amount,
        floor_info=slot.floor_info,
        area_pyeong=slot.area_pyeong,
        description=slot.description,
        bid_deadline=slot.bid_deadline,
        status=slot.status,
        created_at=slot.created_at,
        updated_at=slot.updated_at,
        bid_count=bid_stats["count"],
        highest_bid=bid_stats["highest"]
    )


@router.patch("/{slot_id}", response_model=PharmacySlotResponse)
async def update_slot(
    slot_id: UUID,
    update_data: PharmacySlotUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(require_admin)
):
    """약국 자리 정보 수정 (관리자 전용)"""
    slot = await matching_service.update_slot(db, slot_id, update_data)
    if not slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Slot not found"
        )
    return slot


@router.post("/{slot_id}/bids", response_model=BidResponse, status_code=status.HTTP_201_CREATED)
async def create_bid(
    slot_id: UUID,
    bid_data: BidCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    입찰 참여 (약사 전용)

    열린 약국 자리에 입찰합니다.

    - **bid_amount**: 입찰 금액 (권리금)
    - **message**: 입찰 메시지 (선택)
    - **experience_years**: 경력 연차 (선택)
    - **pharmacy_name**: 개국 예정 약국명 (선택)
    """
    from ...models.user import UserRole

    if current_user.role not in [UserRole.PHARMACIST, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only pharmacists can place bids"
        )

    try:
        bid = await matching_service.create_bid(
            db=db,
            slot_id=slot_id,
            bid_data=bid_data,
            pharmacist_id=current_user.id
        )
        if not bid:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Slot not found"
            )

        return BidResponse(
            id=bid.id,
            slot_id=bid.slot_id,
            pharmacist_id=bid.pharmacist_id,
            bid_amount=bid.bid_amount,
            message=bid.message,
            experience_years=bid.experience_years,
            pharmacy_name=bid.pharmacy_name,
            status=bid.status,
            created_at=bid.created_at
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{slot_id}/bids", response_model=BidListResponse)
async def get_slot_bids(
    slot_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(require_admin)
):
    """해당 자리 입찰 목록 (관리자 전용)"""
    bids = await matching_service.get_slot_bids(db, slot_id)
    return BidListResponse(
        items=[BidResponse(**b) for b in bids],
        total=len(bids)
    )
