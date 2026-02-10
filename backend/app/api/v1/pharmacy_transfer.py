"""
약국 양도 매물 API

- 약사: CRUD (무료, 구독 불필요)
- 공개: 승인된 매물 조회
- 관리자: 심사 및 상태 관리
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, or_
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel

from ..deps import get_db, get_current_active_user, get_current_user_optional
from ...core.security import TokenData
from ...models.user import User, UserRole
from ...models.pharmacy_transfer import PharmacyTransferListing, PharmTransferStatus

router = APIRouter()


# ============================================================
# Pydantic Schemas
# ============================================================

class PharmTransferCreate(BaseModel):
    pharmacy_name: str
    address: str
    region_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    area_pyeong: Optional[float] = None
    monthly_revenue: Optional[int] = None
    monthly_rx_count: Optional[int] = None
    premium: Optional[int] = None
    rent_monthly: Optional[int] = None
    rent_deposit: Optional[int] = None
    transfer_reason: Optional[str] = None
    description: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    images: Optional[List[str]] = []


class PharmTransferUpdate(BaseModel):
    pharmacy_name: Optional[str] = None
    address: Optional[str] = None
    region_name: Optional[str] = None
    area_pyeong: Optional[float] = None
    monthly_revenue: Optional[int] = None
    monthly_rx_count: Optional[int] = None
    premium: Optional[int] = None
    rent_monthly: Optional[int] = None
    rent_deposit: Optional[int] = None
    transfer_reason: Optional[str] = None
    description: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    images: Optional[List[str]] = None


class AdminStatusChange(BaseModel):
    new_status: str
    reason: Optional[str] = None


# ============================================================
# 약사용 API
# ============================================================

@router.post("/listings", status_code=status.HTTP_201_CREATED)
async def create_pharmacy_transfer(
    data: PharmTransferCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """약국 양도 매물 등록 (무료)"""
    if current_user.role not in (UserRole.PHARMACIST, UserRole.ADMIN):
        raise HTTPException(status_code=403, detail="약사 또는 관리자만 등록할 수 있습니다.")

    region_name = data.region_name or (" ".join(data.address.split()[:2]) if data.address else None)

    listing = PharmacyTransferListing(
        user_id=current_user.id,
        pharmacy_name=data.pharmacy_name,
        address=data.address,
        region_name=region_name,
        latitude=data.latitude,
        longitude=data.longitude,
        area_pyeong=data.area_pyeong,
        monthly_revenue=data.monthly_revenue,
        monthly_rx_count=data.monthly_rx_count,
        premium=data.premium,
        rent_monthly=data.rent_monthly,
        rent_deposit=data.rent_deposit,
        transfer_reason=data.transfer_reason,
        description=data.description,
        contact_name=data.contact_name or (current_user.full_name if hasattr(current_user, "full_name") else None),
        contact_phone=data.contact_phone or (current_user.phone if hasattr(current_user, "phone") else None),
        images=data.images or [],
        status=PharmTransferStatus.PENDING_REVIEW,
    )
    db.add(listing)
    await db.commit()
    await db.refresh(listing)

    return {
        "id": str(listing.id),
        "status": listing.status.value,
        "message": "매물이 접수되었습니다. 관리자 검토 후 공개됩니다.",
    }


@router.get("/listings/my")
async def get_my_pharmacy_transfers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """내 약국 양도 매물 목록"""
    base = select(PharmacyTransferListing).where(
        PharmacyTransferListing.user_id == current_user.id
    )
    count_result = await db.execute(
        select(func.count(PharmacyTransferListing.id)).where(
            PharmacyTransferListing.user_id == current_user.id
        )
    )
    total = count_result.scalar()

    result = await db.execute(
        base.order_by(PharmacyTransferListing.updated_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    listings = result.scalars().all()

    return {
        "items": [_to_owner_dict(l) for l in listings],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/listings/{listing_id}")
async def get_pharmacy_transfer(
    listing_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """내 약국 양도 매물 상세"""
    result = await db.execute(
        select(PharmacyTransferListing).where(PharmacyTransferListing.id == listing_id)
    )
    listing = result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="매물을 찾을 수 없습니다.")
    if listing.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="권한이 없습니다.")
    return _to_owner_dict(listing)


@router.patch("/listings/{listing_id}")
async def update_pharmacy_transfer(
    listing_id: UUID,
    data: PharmTransferUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """약국 양도 매물 수정 (PENDING_REVIEW 상태만)"""
    result = await db.execute(
        select(PharmacyTransferListing).where(PharmacyTransferListing.id == listing_id)
    )
    listing = result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="매물을 찾을 수 없습니다.")
    if listing.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="권한이 없습니다.")
    if listing.status != PharmTransferStatus.PENDING_REVIEW:
        raise HTTPException(status_code=400, detail="심사 대기 상태에서만 수정할 수 있습니다.")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(listing, field, value)

    if data.address and not data.region_name:
        listing.region_name = " ".join(data.address.split()[:2])

    listing.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(listing)

    return {"id": str(listing.id), "status": listing.status.value, "message": "매물이 수정되었습니다."}


@router.delete("/listings/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pharmacy_transfer(
    listing_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """약국 양도 매물 삭제"""
    result = await db.execute(
        select(PharmacyTransferListing).where(PharmacyTransferListing.id == listing_id)
    )
    listing = result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="매물을 찾을 수 없습니다.")
    if listing.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="권한이 없습니다.")
    await db.delete(listing)
    await db.commit()


# ============================================================
# 공개 API (인증 불필요)
# ============================================================

@router.get("/public")
async def get_public_pharmacy_transfers(
    region: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[TokenData] = Depends(get_current_user_optional),
):
    """공개 약국 양도 매물 목록"""
    base_filter = and_(
        PharmacyTransferListing.status == PharmTransferStatus.ACTIVE,
        PharmacyTransferListing.is_public == True,
    )
    query = select(PharmacyTransferListing).where(base_filter)
    count_query = select(func.count(PharmacyTransferListing.id)).where(base_filter)

    if region:
        region_filter = PharmacyTransferListing.region_name.ilike(f"%{region}%")
        query = query.where(region_filter)
        count_query = count_query.where(region_filter)

    count_result = await db.execute(count_query)
    total = count_result.scalar()

    result = await db.execute(
        query.order_by(PharmacyTransferListing.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    listings = result.scalars().all()

    return {
        "items": [_to_public_dict(l) for l in listings],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/public/{listing_id}")
async def get_public_pharmacy_transfer_detail(
    listing_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[TokenData] = Depends(get_current_user_optional),
):
    """공개 약국 양도 매물 상세 (연락처 숨김)"""
    result = await db.execute(
        select(PharmacyTransferListing).where(PharmacyTransferListing.id == listing_id)
    )
    listing = result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="매물을 찾을 수 없습니다.")
    if listing.status != PharmTransferStatus.ACTIVE or not listing.is_public:
        raise HTTPException(status_code=404, detail="공개되지 않은 매물입니다.")

    listing.view_count = (listing.view_count or 0) + 1
    await db.commit()

    data = _to_public_dict(listing)
    data["description"] = listing.description
    data["transfer_reason"] = listing.transfer_reason
    data["images"] = listing.images or []
    data["contact_hidden"] = True
    data["message"] = "연락처는 카카오톡 문의를 통해 확인하실 수 있습니다."
    return data


# ============================================================
# 관리자 API
# ============================================================

@router.get("/admin/listings")
async def admin_list_pharmacy_transfers(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """전체 약국 양도 매물 + 통계 (관리자)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다.")

    query = select(
        PharmacyTransferListing,
        User.email.label("owner_email"),
        User.full_name.label("owner_name"),
    ).join(User, PharmacyTransferListing.user_id == User.id)

    count_query = select(func.count(PharmacyTransferListing.id))

    if status_filter:
        try:
            status_enum = PharmTransferStatus(status_filter)
            query = query.where(PharmacyTransferListing.status == status_enum)
            count_query = count_query.where(PharmacyTransferListing.status == status_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status_filter}")

    if search:
        search_filter = or_(
            PharmacyTransferListing.pharmacy_name.ilike(f"%{search}%"),
            PharmacyTransferListing.address.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    count_result = await db.execute(count_query)
    total = count_result.scalar()

    result = await db.execute(
        query.order_by(PharmacyTransferListing.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    rows = result.all()

    items = []
    for row in rows:
        listing = row[0]
        items.append({
            "id": str(listing.id),
            "pharmacy_name": listing.pharmacy_name,
            "address": listing.address,
            "region_name": listing.region_name,
            "owner_email": row[1],
            "owner_name": row[2],
            "status": listing.status.value,
            "monthly_revenue": listing.monthly_revenue,
            "premium": listing.premium,
            "area_pyeong": listing.area_pyeong,
            "view_count": listing.view_count,
            "inquiry_count": listing.inquiry_count,
            "created_at": listing.created_at.isoformat() if listing.created_at else None,
            "updated_at": listing.updated_at.isoformat() if listing.updated_at else None,
        })

    # 상태별 통계
    stats_result = await db.execute(
        select(
            PharmacyTransferListing.status,
            func.count(PharmacyTransferListing.id),
        ).group_by(PharmacyTransferListing.status)
    )
    stats_rows = stats_result.all()
    stats = {s.value: 0 for s in PharmTransferStatus}
    for status_val, cnt in stats_rows:
        stats[status_val.value] = cnt

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "stats": stats,
    }


@router.get("/admin/listings/{listing_id}")
async def admin_get_pharmacy_transfer_detail(
    listing_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """약국 양도 매물 상세 (관리자)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다.")

    result = await db.execute(
        select(PharmacyTransferListing).where(PharmacyTransferListing.id == listing_id)
    )
    listing = result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="매물을 찾을 수 없습니다.")

    owner_result = await db.execute(select(User).where(User.id == listing.user_id))
    owner = owner_result.scalar_one_or_none()

    data = _to_owner_dict(listing)
    data["owner_email"] = owner.email if owner else None
    data["owner_name"] = owner.full_name if owner else None
    data["owner_phone"] = owner.phone if owner and hasattr(owner, "phone") else None
    data["verified_at"] = listing.verified_at.isoformat() if listing.verified_at else None
    data["verified_by"] = str(listing.verified_by) if listing.verified_by else None
    data["is_public"] = listing.is_public
    return data


# 상태 전이 규칙
PHARM_STATUS_TRANSITIONS = {
    PharmTransferStatus.PENDING_REVIEW: [PharmTransferStatus.ACTIVE, PharmTransferStatus.REJECTED],
    PharmTransferStatus.ACTIVE: [PharmTransferStatus.CLOSED],
    PharmTransferStatus.REJECTED: [PharmTransferStatus.PENDING_REVIEW, PharmTransferStatus.CLOSED],
    PharmTransferStatus.CLOSED: [PharmTransferStatus.ACTIVE],
}


@router.post("/admin/listings/{listing_id}/status")
async def admin_change_pharmacy_transfer_status(
    listing_id: UUID,
    data: AdminStatusChange,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """약국 양도 매물 상태 변경 (관리자)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다.")

    result = await db.execute(
        select(PharmacyTransferListing).where(PharmacyTransferListing.id == listing_id)
    )
    listing = result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="매물을 찾을 수 없습니다.")

    try:
        new_status = PharmTransferStatus(data.new_status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"잘못된 상태: {data.new_status}")

    allowed = PHARM_STATUS_TRANSITIONS.get(listing.status, [])
    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"'{listing.status.value}' → '{new_status.value}' 상태 변경이 불가능합니다.",
        )

    # 부수 효과
    if new_status == PharmTransferStatus.ACTIVE:
        listing.is_public = True
        listing.verified_at = datetime.utcnow()
        listing.verified_by = current_user.id
        listing.rejection_reason = None
    elif new_status == PharmTransferStatus.REJECTED:
        listing.is_public = False
        if data.reason:
            listing.rejection_reason = data.reason
    elif new_status == PharmTransferStatus.CLOSED:
        listing.is_public = False

    listing.status = new_status
    listing.updated_at = datetime.utcnow()
    await db.commit()

    return {
        "id": str(listing.id),
        "status": listing.status.value,
        "message": f"상태가 '{new_status.value}'(으)로 변경되었습니다.",
    }


# ============================================================
# Helper Functions
# ============================================================

def _to_owner_dict(listing: PharmacyTransferListing) -> dict:
    """매물 전체 정보 (소유자/관리자용)"""
    return {
        "id": str(listing.id),
        "user_id": str(listing.user_id),
        "pharmacy_name": listing.pharmacy_name,
        "address": listing.address,
        "region_name": listing.region_name,
        "latitude": listing.latitude,
        "longitude": listing.longitude,
        "area_pyeong": listing.area_pyeong,
        "monthly_revenue": listing.monthly_revenue,
        "monthly_rx_count": listing.monthly_rx_count,
        "premium": listing.premium,
        "rent_monthly": listing.rent_monthly,
        "rent_deposit": listing.rent_deposit,
        "transfer_reason": listing.transfer_reason,
        "description": listing.description,
        "contact_name": listing.contact_name,
        "contact_phone": listing.contact_phone,
        "images": listing.images or [],
        "status": listing.status.value,
        "is_public": listing.is_public,
        "rejection_reason": listing.rejection_reason,
        "view_count": listing.view_count,
        "inquiry_count": listing.inquiry_count,
        "created_at": listing.created_at.isoformat() if listing.created_at else None,
        "updated_at": listing.updated_at.isoformat() if listing.updated_at else None,
    }


def _to_public_dict(listing: PharmacyTransferListing) -> dict:
    """공개 부분 정보 (연락처 숨김)"""
    return {
        "id": str(listing.id),
        "pharmacy_name": listing.pharmacy_name,
        "region_name": listing.region_name,
        "area_pyeong": listing.area_pyeong,
        "monthly_revenue": listing.monthly_revenue,
        "monthly_rx_count": listing.monthly_rx_count,
        "premium": listing.premium,
        "rent_monthly": listing.rent_monthly,
        "rent_deposit": listing.rent_deposit,
        "view_count": listing.view_count,
        "created_at": listing.created_at.isoformat() if listing.created_at else None,
    }
