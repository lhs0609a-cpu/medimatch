"""
부동산 매물 API 엔드포인트
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from typing import List, Optional
from datetime import datetime
import uuid

from ...core.database import get_db
from ...core.security import get_current_user, require_roles
from ...models.user import User
from ...models.listing import RealEstateListing, ListingStatus, ListingType
from pydantic import BaseModel, Field

router = APIRouter()


# ===== Schemas =====

class ListingBase(BaseModel):
    title: str
    address: str
    latitude: float = 0
    longitude: float = 0
    building_name: Optional[str] = None
    floor: Optional[str] = None
    area_pyeong: Optional[float] = None
    area_m2: Optional[float] = None
    listing_type: ListingType = ListingType.RENT
    rent_deposit: Optional[int] = None
    rent_monthly: Optional[int] = None
    premium: Optional[int] = None
    sale_price: Optional[int] = None
    maintenance_fee: Optional[int] = None
    suitable_for: Optional[List[str]] = None
    previous_use: Optional[str] = None
    has_parking: bool = False
    has_elevator: bool = False
    description: Optional[str] = None
    features: Optional[List[str]] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_company: Optional[str] = None


class ListingCreate(ListingBase):
    pass


class ListingUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[ListingStatus] = None
    rent_deposit: Optional[int] = None
    rent_monthly: Optional[int] = None
    premium: Optional[int] = None
    sale_price: Optional[int] = None
    description: Optional[str] = None
    features: Optional[List[str]] = None
    is_featured: Optional[bool] = None


class ListingResponse(ListingBase):
    id: str
    status: ListingStatus
    is_featured: bool
    view_count: int
    source: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ListingListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[ListingResponse]


class ListingStatsResponse(BaseModel):
    total_listings: int
    available: int
    reserved: int
    contracted: int
    by_type: dict
    avg_rent_deposit: Optional[int]
    avg_rent_monthly: Optional[int]
    avg_area_pyeong: Optional[float]


# ===== Endpoints =====

@router.get("/", response_model=ListingListResponse)
async def get_listings(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[ListingStatus] = None,
    listing_type: Optional[ListingType] = None,
    min_area: Optional[float] = None,
    max_area: Optional[float] = None,
    min_deposit: Optional[int] = None,
    max_deposit: Optional[int] = None,
    region: Optional[str] = None,
    suitable_for: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = Query("created_at", regex="^(created_at|view_count|area_pyeong|rent_monthly)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db),
):
    """부동산 매물 목록 조회"""
    query = select(RealEstateListing)

    # 필터링
    filters = []

    if status:
        filters.append(RealEstateListing.status == status)

    if listing_type:
        filters.append(RealEstateListing.listing_type == listing_type)

    if min_area:
        filters.append(RealEstateListing.area_pyeong >= min_area)

    if max_area:
        filters.append(RealEstateListing.area_pyeong <= max_area)

    if min_deposit:
        filters.append(RealEstateListing.rent_deposit >= min_deposit)

    if max_deposit:
        filters.append(RealEstateListing.rent_deposit <= max_deposit)

    if region:
        filters.append(RealEstateListing.address.ilike(f"%{region}%"))

    if suitable_for:
        filters.append(RealEstateListing.suitable_for.contains([suitable_for]))

    if search:
        filters.append(
            or_(
                RealEstateListing.title.ilike(f"%{search}%"),
                RealEstateListing.address.ilike(f"%{search}%"),
                RealEstateListing.building_name.ilike(f"%{search}%"),
            )
        )

    if filters:
        query = query.where(and_(*filters))

    # 정렬
    order_column = getattr(RealEstateListing, sort_by)
    if sort_order == "desc":
        query = query.order_by(order_column.desc())
    else:
        query = query.order_by(order_column.asc())

    # 전체 개수
    count_query = select(func.count(RealEstateListing.id))
    if filters:
        count_query = count_query.where(and_(*filters))
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # 페이지네이션
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    listings = result.scalars().all()

    return ListingListResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=[
            ListingResponse(
                id=str(l.id),
                **{k: v for k, v in l.__dict__.items() if k != 'id' and not k.startswith('_')}
            )
            for l in listings
        ]
    )


@router.get("/stats", response_model=ListingStatsResponse)
async def get_listing_stats(
    db: AsyncSession = Depends(get_db),
):
    """부동산 매물 통계"""
    # 전체 개수
    total_result = await db.execute(select(func.count(RealEstateListing.id)))
    total = total_result.scalar()

    # 상태별 개수
    status_counts = {}
    for status in ListingStatus:
        count_result = await db.execute(
            select(func.count(RealEstateListing.id)).where(
                RealEstateListing.status == status
            )
        )
        status_counts[status.value] = count_result.scalar()

    # 유형별 개수
    type_counts = {}
    for ltype in ListingType:
        count_result = await db.execute(
            select(func.count(RealEstateListing.id)).where(
                RealEstateListing.listing_type == ltype
            )
        )
        type_counts[ltype.value] = count_result.scalar()

    # 평균값
    avg_result = await db.execute(
        select(
            func.avg(RealEstateListing.rent_deposit),
            func.avg(RealEstateListing.rent_monthly),
            func.avg(RealEstateListing.area_pyeong),
        ).where(RealEstateListing.status == ListingStatus.AVAILABLE)
    )
    avg_row = avg_result.first()

    return ListingStatsResponse(
        total_listings=total,
        available=status_counts.get("AVAILABLE", 0),
        reserved=status_counts.get("RESERVED", 0),
        contracted=status_counts.get("CONTRACTED", 0),
        by_type=type_counts,
        avg_rent_deposit=int(avg_row[0]) if avg_row[0] else None,
        avg_rent_monthly=int(avg_row[1]) if avg_row[1] else None,
        avg_area_pyeong=float(avg_row[2]) if avg_row[2] else None,
    )


@router.get("/{listing_id}", response_model=ListingResponse)
async def get_listing(
    listing_id: str,
    db: AsyncSession = Depends(get_db),
):
    """부동산 매물 상세 조회"""
    result = await db.execute(
        select(RealEstateListing).where(
            RealEstateListing.id == uuid.UUID(listing_id)
        )
    )
    listing = result.scalar_one_or_none()

    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # 조회수 증가
    listing.view_count += 1
    await db.commit()

    return ListingResponse(
        id=str(listing.id),
        **{k: v for k, v in listing.__dict__.items() if k != 'id' and not k.startswith('_')}
    )


@router.post("/", response_model=ListingResponse)
async def create_listing(
    listing_data: ListingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """부동산 매물 등록 (관리자용)"""
    # 면적 변환
    area_m2 = listing_data.area_m2
    area_pyeong = listing_data.area_pyeong

    if area_m2 and not area_pyeong:
        area_pyeong = area_m2 * 0.3025
    elif area_pyeong and not area_m2:
        area_m2 = area_pyeong / 0.3025

    listing = RealEstateListing(
        id=uuid.uuid4(),
        **listing_data.model_dump(exclude={'area_m2', 'area_pyeong'}),
        area_m2=area_m2,
        area_pyeong=area_pyeong,
        source="MANUAL",
        status=ListingStatus.AVAILABLE,
    )

    db.add(listing)
    await db.commit()
    await db.refresh(listing)

    return ListingResponse(
        id=str(listing.id),
        **{k: v for k, v in listing.__dict__.items() if k != 'id' and not k.startswith('_')}
    )


@router.patch("/{listing_id}", response_model=ListingResponse)
async def update_listing(
    listing_id: str,
    listing_data: ListingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """부동산 매물 수정"""
    result = await db.execute(
        select(RealEstateListing).where(
            RealEstateListing.id == uuid.UUID(listing_id)
        )
    )
    listing = result.scalar_one_or_none()

    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    update_data = listing_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(listing, key, value)

    listing.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(listing)

    return ListingResponse(
        id=str(listing.id),
        **{k: v for k, v in listing.__dict__.items() if k != 'id' and not k.startswith('_')}
    )


@router.delete("/{listing_id}")
async def delete_listing(
    listing_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """부동산 매물 삭제"""
    result = await db.execute(
        select(RealEstateListing).where(
            RealEstateListing.id == uuid.UUID(listing_id)
        )
    )
    listing = result.scalar_one_or_none()

    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    await db.delete(listing)
    await db.commit()

    return {"status": "deleted", "id": listing_id}


@router.post("/crawl")
async def trigger_crawl(
    region: Optional[str] = None,
    current_user: User = Depends(get_current_user),
):
    """부동산 매물 크롤링 트리거 (관리자용)"""
    from ...tasks.realestate_tasks import run_realestate_crawl, crawl_realestate_by_region

    if region:
        task = crawl_realestate_by_region.delay(region, [])
    else:
        task = run_realestate_crawl.delay()

    return {
        "status": "triggered",
        "task_id": task.id,
        "region": region or "all"
    }
