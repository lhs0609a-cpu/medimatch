from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from ...schemas.pharmacy import BidResponse
from ...services.matching import matching_service
from ..deps import get_db, require_admin
from ...core.security import TokenData

router = APIRouter()


@router.patch("/{bid_id}/accept", response_model=BidResponse)
async def accept_bid(
    bid_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(require_admin)
):
    """
    입찰 수락 (관리자 전용)

    선택된 입찰을 수락하고, 같은 자리의 다른 입찰은 자동으로 거절됩니다.
    """
    bid = await matching_service.accept_bid(db, bid_id)
    if not bid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bid not found"
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


@router.patch("/{bid_id}/reject", response_model=BidResponse)
async def reject_bid(
    bid_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(require_admin)
):
    """입찰 거절 (관리자 전용)"""
    bid = await matching_service.reject_bid(db, bid_id)
    if not bid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bid not found"
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
