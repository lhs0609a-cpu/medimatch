"""
건물주 셀프 등록 API

- 의사/약국 입점 희망 건물 등록
- 증빙서류 업로드 및 검증
- 관리자 승인 후 공개
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import Optional, List
from uuid import UUID
from datetime import datetime

from ..deps import get_db, get_current_active_user
from ...core.security import get_current_user, TokenData
from ...models.user import User, UserRole
from ...models.landlord import (
    LandlordListing, LandlordInquiry,
    LandlordListingStatus, VerificationStatus, PreferredTenant,
    LANDLORD_ACCESS_FIELDS
)

router = APIRouter()


# ============================================================
# 건물주용 API
# ============================================================

@router.post("/listings", status_code=status.HTTP_201_CREATED)
async def create_landlord_listing(
    title: str,
    address: str,
    preferred_tenants: List[str] = Query(default=[]),
    floor: Optional[str] = None,
    area_pyeong: Optional[float] = None,
    rent_deposit: Optional[int] = None,
    rent_monthly: Optional[int] = None,
    maintenance_fee: Optional[int] = None,
    premium: Optional[int] = None,
    has_parking: bool = False,
    has_elevator: bool = False,
    description: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    건물주 매물 등록

    등록 후 증빙서류(등기부등본/임대차계약서)를 업로드해야 합니다.
    관리자 승인 후 공개됩니다.
    """
    # 지역명 추출 (간단한 파싱)
    region_name = " ".join(address.split()[:2]) if address else None

    listing = LandlordListing(
        owner_id=current_user.id,
        title=title,
        address=address,
        region_name=region_name,
        preferred_tenants=preferred_tenants,
        floor=floor,
        area_pyeong=area_pyeong,
        rent_deposit=rent_deposit,
        rent_monthly=rent_monthly,
        maintenance_fee=maintenance_fee,
        premium=premium,
        has_parking=has_parking,
        has_elevator=has_elevator,
        description=description,
        status=LandlordListingStatus.DRAFT,
        verification_status=VerificationStatus.PENDING,
        contact_name=current_user.full_name if hasattr(current_user, 'name') else None,
        contact_phone=current_user.phone if hasattr(current_user, 'phone') else None,
        contact_email=current_user.email,
    )

    db.add(listing)
    await db.commit()
    await db.refresh(listing)

    return {
        "id": str(listing.id),
        "status": listing.status.value,
        "verification_status": listing.verification_status.value,
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
    title: Optional[str] = None,
    address: Optional[str] = None,
    floor: Optional[str] = None,
    area_pyeong: Optional[float] = None,
    rent_deposit: Optional[int] = None,
    rent_monthly: Optional[int] = None,
    maintenance_fee: Optional[int] = None,
    premium: Optional[int] = None,
    has_parking: Optional[bool] = None,
    has_elevator: Optional[bool] = None,
    description: Optional[str] = None,
    preferred_tenants: Optional[List[str]] = Query(None),
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
        if rent_deposit is not None:
            listing.rent_deposit = rent_deposit
        if rent_monthly is not None:
            listing.rent_monthly = rent_monthly
        if maintenance_fee is not None:
            listing.maintenance_fee = maintenance_fee
        if premium is not None:
            listing.premium = premium
        if description is not None:
            listing.description = description
    else:
        # DRAFT 상태에서는 모든 필드 수정 가능
        if title is not None:
            listing.title = title
        if address is not None:
            listing.address = address
            listing.region_name = " ".join(address.split()[:2])
        if floor is not None:
            listing.floor = floor
        if area_pyeong is not None:
            listing.area_pyeong = area_pyeong
        if rent_deposit is not None:
            listing.rent_deposit = rent_deposit
        if rent_monthly is not None:
            listing.rent_monthly = rent_monthly
        if maintenance_fee is not None:
            listing.maintenance_fee = maintenance_fee
        if premium is not None:
            listing.premium = premium
        if has_parking is not None:
            listing.has_parking = has_parking
        if has_elevator is not None:
            listing.has_elevator = has_elevator
        if description is not None:
            listing.description = description
        if preferred_tenants is not None:
            listing.preferred_tenants = preferred_tenants

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
    message: str,
    inquiry_type: str = "general",
    clinic_type: Optional[str] = None,
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
        message=message,
        inquiry_type=inquiry_type,
        inquirer_name=current_user.full_name if hasattr(current_user, 'name') else None,
        inquirer_phone=current_user.phone if hasattr(current_user, 'phone') else None,
        inquirer_email=current_user.email,
        inquirer_clinic_type=clinic_type,
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
