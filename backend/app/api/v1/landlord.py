"""
건물주 셀프 등록 API

- 의사/약국 입점 희망 건물 등록
- 증빙서류 업로드 및 검증
- 관리자 승인 후 공개
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, case, or_
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr

from ..deps import get_db, get_current_active_user
from ...core.security import get_current_user, TokenData
from ...models.user import User, UserRole
from ...models.landlord import (
    LandlordListing, LandlordInquiry,
    LandlordListingStatus, VerificationStatus, PreferredTenant,
    LANDLORD_ACCESS_FIELDS
)
from ...models.listing_subscription import ListingSubscription, ListingSubStatus

router = APIRouter()


# ============================================================
# Pydantic Schemas
# ============================================================

class LandlordListingCreate(BaseModel):
    title: str
    building_name: Optional[str] = None
    address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    region_code: Optional[str] = None
    region_name: Optional[str] = None
    floor: Optional[str] = None
    area_pyeong: Optional[float] = None
    area_m2: Optional[float] = None
    rent_deposit: Optional[int] = None
    rent_monthly: Optional[int] = None
    maintenance_fee: Optional[int] = None
    premium: Optional[int] = None
    preferred_tenants: Optional[List[str]] = []
    nearby_hospital_types: Optional[List[str]] = None
    nearby_facilities: Optional[dict] = None
    has_parking: Optional[bool] = False
    parking_count: Optional[int] = None
    has_elevator: Optional[bool] = False
    building_age: Optional[int] = None
    previous_use: Optional[str] = None
    description: Optional[str] = None
    features: Optional[List[str]] = None
    images: Optional[List[str]] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    show_exact_address: Optional[bool] = False
    show_contact: Optional[bool] = False


class LandlordListingUpdate(BaseModel):
    title: Optional[str] = None
    building_name: Optional[str] = None
    address: Optional[str] = None
    floor: Optional[str] = None
    area_pyeong: Optional[float] = None
    rent_deposit: Optional[int] = None
    rent_monthly: Optional[int] = None
    maintenance_fee: Optional[int] = None
    premium: Optional[int] = None
    preferred_tenants: Optional[List[str]] = None
    has_parking: Optional[bool] = None
    parking_count: Optional[int] = None
    has_elevator: Optional[bool] = None
    building_age: Optional[int] = None
    previous_use: Optional[str] = None
    description: Optional[str] = None
    features: Optional[List[str]] = None
    images: Optional[List[str]] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    show_exact_address: Optional[bool] = None
    show_contact: Optional[bool] = None


class AdminStatusChange(BaseModel):
    new_status: str
    reason: Optional[str] = None


class BuildingInquiryCreate(BaseModel):
    message: str
    inquiry_type: Optional[str] = "general"
    inquirer_name: Optional[str] = None
    inquirer_phone: Optional[str] = None
    inquirer_email: Optional[str] = None
    inquirer_clinic_type: Optional[str] = None


# ============================================================
# 건물주용 API
# ============================================================

@router.get("/stats")
async def get_landlord_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """건물주 매물 통계"""
    result = await db.execute(
        select(
            func.count(LandlordListing.id).label("total_listings"),
            func.count(case(
                (LandlordListing.status == LandlordListingStatus.ACTIVE, LandlordListing.id),
            )).label("active_listings"),
            func.coalesce(func.sum(LandlordListing.view_count), 0).label("total_views"),
            func.coalesce(func.sum(LandlordListing.inquiry_count), 0).label("total_inquiries"),
        ).where(LandlordListing.owner_id == current_user.id)
    )
    row = result.one()
    return {
        "total_listings": row.total_listings,
        "active_listings": row.active_listings,
        "total_views": row.total_views,
        "total_inquiries": row.total_inquiries,
    }


@router.post("/listings", status_code=status.HTTP_201_CREATED)
async def create_landlord_listing(
    data: LandlordListingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    건물주 매물 등록

    등록 후 증빙서류(등기부등본/임대차계약서)를 업로드해야 합니다.
    관리자 승인 후 공개됩니다.
    구독 크레딧이 필요합니다.
    """
    # 구독 크레딧 확인
    sub_result = await db.execute(
        select(ListingSubscription).where(
            ListingSubscription.user_id == current_user.id
        ).with_for_update()
    )
    sub = sub_result.scalar_one_or_none()

    if not sub:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="매물 등록 구독이 필요합니다."
        )

    if sub.status in (ListingSubStatus.EXPIRED, ListingSubStatus.SUSPENDED):
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="구독이 만료되었습니다. 구독을 갱신해주세요."
        )

    if sub.status not in (ListingSubStatus.ACTIVE, ListingSubStatus.CANCELED):
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="구독 상태를 확인해주세요."
        )

    remaining = sub.total_credits - sub.used_credits
    if remaining <= 0:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="사용 가능한 크레딧이 없습니다. 다음 결제일까지 기다리거나 추가 구독이 필요합니다."
        )

    # 지역명 추출 (간단한 파싱)
    region_name = data.region_name or (" ".join(data.address.split()[:2]) if data.address else None)

    listing = LandlordListing(
        owner_id=current_user.id,
        title=data.title,
        building_name=data.building_name,
        address=data.address,
        latitude=data.latitude,
        longitude=data.longitude,
        region_code=data.region_code,
        region_name=region_name,
        preferred_tenants=data.preferred_tenants or [],
        floor=data.floor,
        area_pyeong=data.area_pyeong,
        area_m2=data.area_m2,
        rent_deposit=data.rent_deposit,
        rent_monthly=data.rent_monthly,
        maintenance_fee=data.maintenance_fee,
        premium=data.premium,
        nearby_hospital_types=data.nearby_hospital_types,
        nearby_facilities=data.nearby_facilities,
        has_parking=data.has_parking or False,
        parking_count=data.parking_count,
        has_elevator=data.has_elevator or False,
        building_age=data.building_age,
        previous_use=data.previous_use,
        description=data.description,
        features=data.features,
        images=data.images,
        status=LandlordListingStatus.DRAFT,
        verification_status=VerificationStatus.PENDING,
        contact_name=data.contact_name or (current_user.full_name if hasattr(current_user, 'full_name') else None),
        contact_phone=data.contact_phone or (current_user.phone if hasattr(current_user, 'phone') else None),
        contact_email=data.contact_email or current_user.email,
        show_exact_address=data.show_exact_address or False,
        show_contact=data.show_contact or False,
    )

    db.add(listing)

    # 크레딧 차감
    sub.used_credits += 1
    sub.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(listing)

    return {
        "id": str(listing.id),
        "status": listing.status.value,
        "verification_status": listing.verification_status.value,
        "remaining_credits": sub.total_credits - sub.used_credits,
        "message": "매물이 등록되었습니다. 증빙서류를 업로드해주세요."
    }


@router.get("/listings/my")
async def get_my_landlord_listings(
    status_filter: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """내 건물 매물 목록"""
    query = select(LandlordListing).where(
        LandlordListing.owner_id == current_user.id
    )

    if status_filter:
        try:
            status_enum = LandlordListingStatus(status_filter)
            query = query.where(LandlordListing.status == status_enum)
        except ValueError:
            pass

    # 전체 개수
    count_result = await db.execute(
        select(func.count(LandlordListing.id)).where(
            LandlordListing.owner_id == current_user.id
        )
    )
    total = count_result.scalar()

    # 목록 조회
    result = await db.execute(
        query.order_by(LandlordListing.updated_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    listings = result.scalars().all()

    return {
        "items": [
            {
                "id": str(l.id),
                "title": l.title,
                "address": l.address,
                "region_name": l.region_name,
                "status": l.status.value,
                "verification_status": l.verification_status.value,
                "view_count": l.view_count,
                "inquiry_count": l.inquiry_count,
                "created_at": l.created_at.isoformat() if l.created_at else None,
            }
            for l in listings
        ],
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.get("/listings/{listing_id}")
async def get_landlord_listing(
    listing_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """건물주 매물 상세 (소유자용)"""
    result = await db.execute(
        select(LandlordListing).where(LandlordListing.id == listing_id)
    )
    listing = result.scalar_one_or_none()

    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # 소유자만 전체 정보 조회 가능
    if listing.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")

    return _listing_to_dict(listing, include_all=True)


@router.patch("/listings/{listing_id}")
async def update_landlord_listing(
    listing_id: UUID,
    data: LandlordListingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """건물주 매물 수정"""
    result = await db.execute(
        select(LandlordListing).where(LandlordListing.id == listing_id)
    )
    listing = result.scalar_one_or_none()

    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    if listing.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # 승인된 매물은 일부 필드만 수정 가능
    if listing.status == LandlordListingStatus.ACTIVE:
        # 가격과 설명만 수정 가능
        if data.rent_deposit is not None:
            listing.rent_deposit = data.rent_deposit
        if data.rent_monthly is not None:
            listing.rent_monthly = data.rent_monthly
        if data.maintenance_fee is not None:
            listing.maintenance_fee = data.maintenance_fee
        if data.premium is not None:
            listing.premium = data.premium
        if data.description is not None:
            listing.description = data.description
    else:
        # DRAFT 상태에서는 모든 필드 수정 가능
        if data.title is not None:
            listing.title = data.title
        if data.building_name is not None:
            listing.building_name = data.building_name
        if data.address is not None:
            listing.address = data.address
            listing.region_name = " ".join(data.address.split()[:2])
        if data.floor is not None:
            listing.floor = data.floor
        if data.area_pyeong is not None:
            listing.area_pyeong = data.area_pyeong
        if data.rent_deposit is not None:
            listing.rent_deposit = data.rent_deposit
        if data.rent_monthly is not None:
            listing.rent_monthly = data.rent_monthly
        if data.maintenance_fee is not None:
            listing.maintenance_fee = data.maintenance_fee
        if data.premium is not None:
            listing.premium = data.premium
        if data.has_parking is not None:
            listing.has_parking = data.has_parking
        if data.parking_count is not None:
            listing.parking_count = data.parking_count
        if data.has_elevator is not None:
            listing.has_elevator = data.has_elevator
        if data.building_age is not None:
            listing.building_age = data.building_age
        if data.previous_use is not None:
            listing.previous_use = data.previous_use
        if data.description is not None:
            listing.description = data.description
        if data.features is not None:
            listing.features = data.features
        if data.images is not None:
            listing.images = data.images
        if data.preferred_tenants is not None:
            listing.preferred_tenants = data.preferred_tenants
        if data.contact_name is not None:
            listing.contact_name = data.contact_name
        if data.contact_phone is not None:
            listing.contact_phone = data.contact_phone
        if data.contact_email is not None:
            listing.contact_email = data.contact_email
        if data.show_exact_address is not None:
            listing.show_exact_address = data.show_exact_address
        if data.show_contact is not None:
            listing.show_contact = data.show_contact

    listing.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(listing)

    return {
        "id": str(listing.id),
        "status": listing.status.value,
        "message": "매물이 수정되었습니다."
    }


@router.delete("/listings/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_landlord_listing(
    listing_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """건물주 매물 삭제"""
    result = await db.execute(
        select(LandlordListing).where(LandlordListing.id == listing_id)
    )
    listing = result.scalar_one_or_none()

    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    if listing.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # 크레딧 반환
    sub_result = await db.execute(
        select(ListingSubscription).where(
            ListingSubscription.user_id == current_user.id
        )
    )
    sub = sub_result.scalar_one_or_none()
    if sub and sub.used_credits > 0:
        sub.used_credits -= 1
        sub.updated_at = datetime.utcnow()

    await db.delete(listing)
    await db.commit()


@router.post("/listings/{listing_id}/docs")
async def upload_verification_docs(
    listing_id: UUID,
    doc_type: str = Query(..., description="문서 유형: 등기부등본, 임대차계약서"),
    doc_url: str = Query(..., description="업로드된 문서 URL"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    증빙서류 업로드

    doc_type: 등기부등본, 임대차계약서
    """
    result = await db.execute(
        select(LandlordListing).where(LandlordListing.id == listing_id)
    )
    listing = result.scalar_one_or_none()

    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    if listing.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # 기존 문서에 추가
    docs = listing.verification_docs or []
    docs.append({
        "type": doc_type,
        "url": doc_url,
        "uploaded_at": datetime.utcnow().isoformat()
    })
    listing.verification_docs = docs

    # 상태 변경
    if listing.status == LandlordListingStatus.DRAFT:
        listing.status = LandlordListingStatus.PENDING_REVIEW

    listing.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(listing)

    return {
        "id": str(listing.id),
        "status": listing.status.value,
        "docs_count": len(docs),
        "message": "증빙서류가 업로드되었습니다. 관리자 검토 후 공개됩니다."
    }


@router.post("/listings/{listing_id}/submit")
async def submit_for_review(
    listing_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """검토 요청 제출"""
    result = await db.execute(
        select(LandlordListing).where(LandlordListing.id == listing_id)
    )
    listing = result.scalar_one_or_none()

    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    if listing.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # 필수 정보 확인
    if not listing.address:
        raise HTTPException(status_code=400, detail="주소가 필요합니다.")

    if not listing.verification_docs:
        raise HTTPException(status_code=400, detail="증빙서류가 필요합니다.")

    listing.status = LandlordListingStatus.PENDING_REVIEW
    listing.verification_status = VerificationStatus.PENDING
    listing.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(listing)

    return {
        "id": str(listing.id),
        "status": listing.status.value,
        "message": "검토 요청이 제출되었습니다."
    }


@router.get("/inquiries")
async def get_my_inquiries(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """내 매물에 대한 문의 목록"""
    # 내 매물 ID 목록
    my_listings = await db.execute(
        select(LandlordListing.id).where(
            LandlordListing.owner_id == current_user.id
        )
    )
    my_listing_ids = [l[0] for l in my_listings.all()]

    if not my_listing_ids:
        return {"items": [], "total": 0, "page": page, "page_size": page_size}

    # 문의 조회
    count_result = await db.execute(
        select(func.count(LandlordInquiry.id)).where(
            LandlordInquiry.listing_id.in_(my_listing_ids)
        )
    )
    total = count_result.scalar()

    result = await db.execute(
        select(LandlordInquiry).where(
            LandlordInquiry.listing_id.in_(my_listing_ids)
        ).order_by(
            LandlordInquiry.created_at.desc()
        ).offset((page - 1) * page_size).limit(page_size)
    )
    inquiries = result.scalars().all()

    items = []
    for inq in inquiries:
        # 매물 정보 조회
        listing_result = await db.execute(
            select(LandlordListing).where(LandlordListing.id == inq.listing_id)
        )
        listing = listing_result.scalar_one_or_none()

        items.append({
            "id": inq.id,
            "listing_id": str(inq.listing_id),
            "listing_title": listing.title if listing else None,
            "message": inq.message,
            "inquiry_type": inq.inquiry_type,
            "inquirer_name": inq.inquirer_name,
            "inquirer_clinic_type": inq.inquirer_clinic_type,
            "status": inq.status,
            "response": inq.response,
            "created_at": inq.created_at.isoformat() if inq.created_at else None,
            "responded_at": inq.responded_at.isoformat() if inq.responded_at else None,
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.post("/inquiries/{inquiry_id}/respond")
async def respond_to_inquiry(
    inquiry_id: int,
    response: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """문의에 답변"""
    result = await db.execute(
        select(LandlordInquiry).where(LandlordInquiry.id == inquiry_id)
    )
    inquiry = result.scalar_one_or_none()

    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")

    # 매물 소유자 확인
    listing_result = await db.execute(
        select(LandlordListing).where(LandlordListing.id == inquiry.listing_id)
    )
    listing = listing_result.scalar_one_or_none()

    if not listing or listing.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    inquiry.response = response
    inquiry.status = "RESPONDED"
    inquiry.responded_at = datetime.utcnow()
    inquiry.updated_at = datetime.utcnow()

    await db.commit()

    return {"status": "success", "message": "답변이 등록되었습니다."}


# ============================================================
# 일반 사용자용 API (건물 검색)
# ============================================================

@router.get("/buildings")
async def search_buildings(
    region: Optional[str] = None,
    preferred_tenant: Optional[str] = None,
    rent_max: Optional[int] = None,
    area_min: Optional[float] = None,
    has_parking: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[TokenData] = Depends(get_current_user)
):
    """
    건물 매물 검색 (의사/약사용)

    공개 승인된 매물만 조회됩니다.
    기본 정보만 공개되며, 상세 정보는 문의 후 확인 가능합니다.
    """
    query = select(LandlordListing).where(
        and_(
            LandlordListing.status == LandlordListingStatus.ACTIVE,
            LandlordListing.is_public == True
        )
    )

    if region:
        query = query.where(LandlordListing.region_name.ilike(f"%{region}%"))

    if preferred_tenant:
        query = query.where(
            LandlordListing.preferred_tenants.any(preferred_tenant)
        )

    if rent_max:
        query = query.where(LandlordListing.rent_monthly <= rent_max)

    if area_min:
        query = query.where(LandlordListing.area_pyeong >= area_min)

    if has_parking:
        query = query.where(LandlordListing.has_parking == True)

    # 전체 개수
    count_query = select(func.count(LandlordListing.id)).where(
        and_(
            LandlordListing.status == LandlordListingStatus.ACTIVE,
            LandlordListing.is_public == True
        )
    )
    count_result = await db.execute(count_query)
    total = count_result.scalar()

    # 목록 조회
    result = await db.execute(
        query.order_by(LandlordListing.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    listings = result.scalars().all()

    # 부분 정보만 반환 (MINIMAL 레벨)
    items = []
    for l in listings:
        items.append({
            "id": str(l.id),
            "title": l.title,
            "region_name": l.region_name,
            "floor": l.floor,
            "area_pyeong": l.area_pyeong,
            "rent_monthly_range": _format_price_range(l.rent_monthly),
            "preferred_tenants": l.preferred_tenants,
            "has_parking": l.has_parking,
            "has_elevator": l.has_elevator,
            "view_count": l.view_count,
            "created_at": l.created_at.isoformat() if l.created_at else None,
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.get("/buildings/{listing_id}")
async def get_building_detail(
    listing_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[TokenData] = Depends(get_current_user)
):
    """
    건물 매물 상세 조회

    공개 정보만 표시됩니다.
    정확한 주소와 연락처는 문의 후 확인 가능합니다.
    """
    result = await db.execute(
        select(LandlordListing).where(LandlordListing.id == listing_id)
    )
    listing = result.scalar_one_or_none()

    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    if listing.status != LandlordListingStatus.ACTIVE or not listing.is_public:
        raise HTTPException(status_code=404, detail="Listing not available")

    # 조회수 증가
    listing.view_count = (listing.view_count or 0) + 1
    await db.commit()

    # 공개 정보만 반환 (PARTIAL 레벨)
    return {
        "id": str(listing.id),
        "title": listing.title,
        "region_name": listing.region_name,
        "floor": listing.floor,
        "area_pyeong": listing.area_pyeong,
        "area_m2": listing.area_m2,
        "rent_deposit": listing.rent_deposit,
        "rent_monthly": listing.rent_monthly,
        "maintenance_fee": listing.maintenance_fee,
        "premium": listing.premium,
        "preferred_tenants": listing.preferred_tenants,
        "nearby_hospital_types": listing.nearby_hospital_types,
        "has_parking": listing.has_parking,
        "parking_count": listing.parking_count,
        "has_elevator": listing.has_elevator,
        "building_age": listing.building_age,
        "previous_use": listing.previous_use,
        "description": listing.description,
        "features": listing.features,
        "images": listing.images,
        "view_count": listing.view_count,
        "inquiry_count": listing.inquiry_count,
        "created_at": listing.created_at.isoformat() if listing.created_at else None,
        # 비공개 필드
        "address_hidden": True,
        "contact_hidden": True,
        "message": "정확한 주소와 연락처는 문의를 통해 확인하실 수 있습니다."
    }


@router.post("/buildings/{listing_id}/inquire")
async def inquire_building(
    listing_id: UUID,
    data: BuildingInquiryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    건물 매물 문의하기

    문의 시 건물주에게 알림이 전송됩니다.
    """
    result = await db.execute(
        select(LandlordListing).where(LandlordListing.id == listing_id)
    )
    listing = result.scalar_one_or_none()

    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    if listing.status != LandlordListingStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="This listing is not available")

    # 문의 생성
    inquiry = LandlordInquiry(
        listing_id=listing_id,
        user_id=current_user.id,
        message=data.message,
        inquiry_type=data.inquiry_type or "general",
        inquirer_name=data.inquirer_name or (current_user.full_name if hasattr(current_user, 'full_name') else None),
        inquirer_phone=data.inquirer_phone or (current_user.phone if hasattr(current_user, 'phone') else None),
        inquirer_email=data.inquirer_email or current_user.email,
        inquirer_clinic_type=data.inquirer_clinic_type,
    )

    db.add(inquiry)

    # 문의 카운트 증가
    listing.inquiry_count = (listing.inquiry_count or 0) + 1

    await db.commit()
    await db.refresh(inquiry)

    return {
        "inquiry_id": inquiry.id,
        "status": "PENDING",
        "message": "문의가 접수되었습니다. 건물주가 확인 후 연락드릴 예정입니다."
    }


# ============================================================
# 관리자용 API
# ============================================================

@router.get("/admin/pending")
async def get_pending_listings(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """승인 대기 매물 목록 (관리자용)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")

    count_result = await db.execute(
        select(func.count(LandlordListing.id)).where(
            LandlordListing.status == LandlordListingStatus.PENDING_REVIEW
        )
    )
    total = count_result.scalar()

    result = await db.execute(
        select(LandlordListing).where(
            LandlordListing.status == LandlordListingStatus.PENDING_REVIEW
        ).order_by(
            LandlordListing.created_at.asc()
        ).offset((page - 1) * page_size).limit(page_size)
    )
    listings = result.scalars().all()

    return {
        "items": [_listing_to_dict(l, include_all=True) for l in listings],
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.post("/admin/{listing_id}/verify")
async def verify_listing(
    listing_id: UUID,
    approved: bool,
    rejection_reason: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """매물 승인/거부 (관리자용)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")

    result = await db.execute(
        select(LandlordListing).where(LandlordListing.id == listing_id)
    )
    listing = result.scalar_one_or_none()

    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    if approved:
        listing.status = LandlordListingStatus.ACTIVE
        listing.verification_status = VerificationStatus.VERIFIED
        listing.is_public = True
        listing.verified_at = datetime.utcnow()
        listing.verified_by = current_user.id
        message = "매물이 승인되어 공개되었습니다."
    else:
        listing.status = LandlordListingStatus.REJECTED
        listing.verification_status = VerificationStatus.REJECTED
        listing.rejection_reason = rejection_reason
        message = "매물이 거부되었습니다."

    listing.updated_at = datetime.utcnow()
    await db.commit()

    return {
        "id": str(listing.id),
        "status": listing.status.value,
        "verification_status": listing.verification_status.value,
        "message": message
    }


@router.get("/admin/listings")
async def admin_list_all_listings(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """전체 매물 목록 + 상태별 통계 (관리자용)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")

    # 기본 쿼리 (User JOIN)
    query = select(
        LandlordListing,
        User.email.label("owner_email"),
        User.full_name.label("owner_name"),
    ).join(User, LandlordListing.owner_id == User.id)

    count_query = select(func.count(LandlordListing.id))

    # 필터: 상태
    if status_filter:
        try:
            status_enum = LandlordListingStatus(status_filter)
            query = query.where(LandlordListing.status == status_enum)
            count_query = count_query.where(LandlordListing.status == status_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status_filter}")

    # 필터: 검색 (제목/주소)
    if search:
        search_filter = or_(
            LandlordListing.title.ilike(f"%{search}%"),
            LandlordListing.address.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    # 전체 개수
    count_result = await db.execute(count_query)
    total = count_result.scalar()

    # 목록 조회
    result = await db.execute(
        query.order_by(LandlordListing.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    rows = result.all()

    items = []
    for row in rows:
        listing = row[0]
        owner_email = row[1]
        owner_name = row[2]
        items.append({
            "id": str(listing.id),
            "title": listing.title,
            "address": listing.address,
            "region_name": listing.region_name,
            "owner_email": owner_email,
            "owner_name": owner_name,
            "status": listing.status.value,
            "verification_status": listing.verification_status.value,
            "rent_deposit": listing.rent_deposit,
            "rent_monthly": listing.rent_monthly,
            "area_pyeong": listing.area_pyeong,
            "view_count": listing.view_count,
            "inquiry_count": listing.inquiry_count,
            "created_at": listing.created_at.isoformat() if listing.created_at else None,
            "updated_at": listing.updated_at.isoformat() if listing.updated_at else None,
        })

    # 상태별 통계
    stats_result = await db.execute(
        select(
            LandlordListing.status,
            func.count(LandlordListing.id),
        ).group_by(LandlordListing.status)
    )
    stats_rows = stats_result.all()
    stats = {s.value: 0 for s in LandlordListingStatus}
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
async def admin_get_listing_detail(
    listing_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """매물 상세 (관리자용) — 소유자 정보 포함"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")

    result = await db.execute(
        select(LandlordListing).where(LandlordListing.id == listing_id)
    )
    listing = result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # 소유자 정보 조회
    owner_result = await db.execute(
        select(User).where(User.id == listing.owner_id)
    )
    owner = owner_result.scalar_one_or_none()

    data = _listing_to_dict(listing, include_all=True)
    data["owner_email"] = owner.email if owner else None
    data["owner_name"] = owner.full_name if owner else None
    data["owner_phone"] = owner.phone if owner and hasattr(owner, 'phone') else None
    data["verified_at"] = listing.verified_at.isoformat() if listing.verified_at else None
    data["verified_by"] = str(listing.verified_by) if listing.verified_by else None
    data["is_public"] = listing.is_public

    return data


# 상태 전이 규칙
ADMIN_STATUS_TRANSITIONS = {
    LandlordListingStatus.DRAFT: [LandlordListingStatus.CLOSED],
    LandlordListingStatus.PENDING_REVIEW: [
        LandlordListingStatus.ACTIVE,
        LandlordListingStatus.REJECTED,
        LandlordListingStatus.CLOSED,
    ],
    LandlordListingStatus.ACTIVE: [
        LandlordListingStatus.RESERVED,
        LandlordListingStatus.CONTRACTED,
        LandlordListingStatus.CLOSED,
    ],
    LandlordListingStatus.RESERVED: [
        LandlordListingStatus.ACTIVE,
        LandlordListingStatus.CONTRACTED,
        LandlordListingStatus.CLOSED,
    ],
    LandlordListingStatus.CONTRACTED: [LandlordListingStatus.CLOSED],
    LandlordListingStatus.REJECTED: [
        LandlordListingStatus.PENDING_REVIEW,
        LandlordListingStatus.CLOSED,
    ],
    LandlordListingStatus.CLOSED: [LandlordListingStatus.ACTIVE],
}


@router.post("/admin/listings/{listing_id}/status")
async def admin_change_listing_status(
    listing_id: UUID,
    data: AdminStatusChange,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """매물 상태 강제 변경 (관리자용)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")

    result = await db.execute(
        select(LandlordListing).where(LandlordListing.id == listing_id)
    )
    listing = result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # 새 상태 파싱
    try:
        new_status = LandlordListingStatus(data.new_status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {data.new_status}")

    # 전이 규칙 검사
    allowed = ADMIN_STATUS_TRANSITIONS.get(listing.status, [])
    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"'{listing.status.value}' → '{new_status.value}' 상태 변경이 불가능합니다."
        )

    # 부수 효과
    if new_status == LandlordListingStatus.ACTIVE:
        listing.is_public = True
        listing.verified_at = datetime.utcnow()
        listing.verified_by = current_user.id
        listing.verification_status = VerificationStatus.VERIFIED
        listing.rejection_reason = None
    elif new_status == LandlordListingStatus.CLOSED:
        listing.is_public = False
    elif new_status == LandlordListingStatus.REJECTED:
        listing.is_public = False
        listing.verification_status = VerificationStatus.REJECTED
        if data.reason:
            listing.rejection_reason = data.reason
    elif new_status == LandlordListingStatus.PENDING_REVIEW:
        listing.rejection_reason = None
        listing.verification_status = VerificationStatus.PENDING

    listing.status = new_status
    listing.updated_at = datetime.utcnow()
    await db.commit()

    return {
        "id": str(listing.id),
        "status": listing.status.value,
        "verification_status": listing.verification_status.value,
        "message": f"상태가 '{new_status.value}'(으)로 변경되었습니다.",
    }


# ============================================================
# Helper Functions
# ============================================================

def _listing_to_dict(listing: LandlordListing, include_all: bool = False) -> dict:
    """매물을 딕셔너리로 변환"""
    data = {
        "id": str(listing.id),
        "owner_id": str(listing.owner_id),
        "title": listing.title,
        "building_name": listing.building_name,
        "address": listing.address if include_all else None,
        "region_name": listing.region_name,
        "floor": listing.floor,
        "area_pyeong": listing.area_pyeong,
        "area_m2": listing.area_m2,
        "rent_deposit": listing.rent_deposit,
        "rent_monthly": listing.rent_monthly,
        "maintenance_fee": listing.maintenance_fee,
        "premium": listing.premium,
        "preferred_tenants": listing.preferred_tenants,
        "nearby_hospital_types": listing.nearby_hospital_types,
        "has_parking": listing.has_parking,
        "parking_count": listing.parking_count,
        "has_elevator": listing.has_elevator,
        "building_age": listing.building_age,
        "previous_use": listing.previous_use,
        "description": listing.description,
        "features": listing.features,
        "images": listing.images,
        "status": listing.status.value,
        "verification_status": listing.verification_status.value,
        "verification_docs": listing.verification_docs if include_all else None,
        "rejection_reason": listing.rejection_reason,
        "view_count": listing.view_count,
        "inquiry_count": listing.inquiry_count,
        "created_at": listing.created_at.isoformat() if listing.created_at else None,
        "updated_at": listing.updated_at.isoformat() if listing.updated_at else None,
    }

    if include_all:
        data["contact_name"] = listing.contact_name
        data["contact_phone"] = listing.contact_phone
        data["contact_email"] = listing.contact_email
        data["latitude"] = listing.latitude
        data["longitude"] = listing.longitude

    return data


def _format_price_range(price: Optional[int]) -> str:
    """가격을 범위로 표시"""
    if not price:
        return "문의"

    if price < 1000000:
        return f"{price // 10000}만원대"
    else:
        return f"{price // 10000}만원대"
