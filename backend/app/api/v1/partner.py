"""
파트너 연결 API
- 인테리어, 의료 장비, 컨설팅 등 파트너 업체 연결
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.models.partner import Partner, PartnerInquiry, PartnerContract, PartnerReview, PartnerCategory

router = APIRouter(prefix="/partners", tags=["partners"])


# ============ Schemas ============

class PartnerBase(BaseModel):
    name: str
    category: str
    subcategory: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    region: Optional[str] = None
    description: Optional[str] = None


class PartnerResponse(PartnerBase):
    id: int
    rating: float
    review_count: int
    is_premium: bool
    is_verified: bool
    logo_url: Optional[str] = None
    specialties: Optional[str] = None

    class Config:
        from_attributes = True


class PartnerDetailResponse(PartnerResponse):
    portfolio_url: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None


class PartnerListResponse(BaseModel):
    partners: List[PartnerResponse]
    total: int
    page: int
    page_size: int


class InquiryCreate(BaseModel):
    partner_id: int
    inquiry_type: str  # quote, info, consult
    title: str
    content: str
    project_location: Optional[str] = None
    project_size: Optional[str] = None
    budget_range: Optional[str] = None
    expected_start_date: Optional[datetime] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None


class InquiryResponse(BaseModel):
    id: int
    partner_id: int
    inquiry_type: str
    title: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ReviewCreate(BaseModel):
    partner_id: int
    rating: float
    quality_rating: Optional[float] = None
    price_rating: Optional[float] = None
    communication_rating: Optional[float] = None
    timeliness_rating: Optional[float] = None
    title: Optional[str] = None
    content: Optional[str] = None


class ReviewResponse(BaseModel):
    id: int
    user_id: int
    rating: float
    title: Optional[str] = None
    content: Optional[str] = None
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class CategoryInfo(BaseModel):
    code: str
    name: str
    description: str
    icon: str


# ============ Endpoints ============

@router.get("/categories", response_model=List[CategoryInfo])
async def get_categories():
    """파트너 카테고리 목록"""
    categories = [
        CategoryInfo(
            code=PartnerCategory.INTERIOR,
            name="인테리어",
            description="병원/약국 전문 인테리어 업체",
            icon="Paintbrush"
        ),
        CategoryInfo(
            code=PartnerCategory.MEDICAL_EQUIPMENT,
            name="의료 장비",
            description="의료 기기 판매 및 렌탈",
            icon="Stethoscope"
        ),
        CategoryInfo(
            code=PartnerCategory.CONSULTING,
            name="개원 컨설팅",
            description="개원 전문 컨설팅 서비스",
            icon="Briefcase"
        ),
        CategoryInfo(
            code=PartnerCategory.FINANCE,
            name="금융 서비스",
            description="개원 대출, 리스, 보험",
            icon="Landmark"
        ),
        CategoryInfo(
            code=PartnerCategory.PHARMA_WHOLESALE,
            name="약품 도매",
            description="약국용 약품 도매상",
            icon="Pill"
        ),
        CategoryInfo(
            code=PartnerCategory.SIGNAGE,
            name="간판/사인물",
            description="외부 간판 및 내부 사인물",
            icon="PenTool"
        ),
        CategoryInfo(
            code=PartnerCategory.IT_SOLUTION,
            name="의료 IT",
            description="EMR, 예약 시스템, 홈페이지",
            icon="Monitor"
        ),
        CategoryInfo(
            code=PartnerCategory.MARKETING,
            name="마케팅/홍보",
            description="온라인 마케팅, 홍보 대행",
            icon="Megaphone"
        ),
        CategoryInfo(
            code=PartnerCategory.LEGAL,
            name="법률/세무",
            description="의료법 전문 변호사, 세무사",
            icon="Scale"
        ),
        CategoryInfo(
            code=PartnerCategory.REAL_ESTATE,
            name="부동산",
            description="상가 전문 부동산 중개",
            icon="Building"
        ),
    ]
    return categories


@router.get("", response_model=PartnerListResponse)
async def get_partners(
    category: Optional[str] = None,
    region: Optional[str] = None,
    search: Optional[str] = None,
    is_premium: Optional[bool] = None,
    is_verified: Optional[bool] = None,
    sort_by: str = Query("rating", enum=["rating", "review_count", "created_at"]),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """파트너 목록 조회"""
    query = select(Partner).where(Partner.is_active == True)

    # 필터
    if category:
        query = query.where(Partner.category == category)
    if region:
        query = query.where(Partner.region == region)
    if is_premium is not None:
        query = query.where(Partner.is_premium == is_premium)
    if is_verified is not None:
        query = query.where(Partner.is_verified == is_verified)
    if search:
        query = query.where(
            or_(
                Partner.name.ilike(f"%{search}%"),
                Partner.description.ilike(f"%{search}%")
            )
        )

    # 정렬 (프리미엄 우선)
    if sort_by == "rating":
        query = query.order_by(Partner.is_premium.desc(), Partner.rating.desc())
    elif sort_by == "review_count":
        query = query.order_by(Partner.is_premium.desc(), Partner.review_count.desc())
    else:
        query = query.order_by(Partner.is_premium.desc(), Partner.created_at.desc())

    # 총 개수
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # 페이지네이션
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    partners = result.scalars().all()

    return PartnerListResponse(
        partners=[PartnerResponse.model_validate(p) for p in partners],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{partner_id}", response_model=PartnerDetailResponse)
async def get_partner_detail(
    partner_id: int,
    db: AsyncSession = Depends(get_db)
):
    """파트너 상세 조회"""
    result = await db.execute(
        select(Partner).where(Partner.id == partner_id, Partner.is_active == True)
    )
    partner = result.scalar_one_or_none()

    if not partner:
        raise HTTPException(status_code=404, detail="파트너를 찾을 수 없습니다")

    return PartnerDetailResponse.model_validate(partner)


@router.get("/{partner_id}/reviews", response_model=List[ReviewResponse])
async def get_partner_reviews(
    partner_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    """파트너 리뷰 목록"""
    result = await db.execute(
        select(PartnerReview)
        .where(PartnerReview.partner_id == partner_id, PartnerReview.is_visible == True)
        .order_by(PartnerReview.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    reviews = result.scalars().all()

    return [ReviewResponse.model_validate(r) for r in reviews]


@router.post("/inquiries", response_model=InquiryResponse)
async def create_inquiry(
    inquiry: InquiryCreate,
    db: AsyncSession = Depends(get_db)
    # current_user = Depends(get_current_user)  # 인증 필요
):
    """파트너에게 문의하기"""
    # 파트너 존재 확인
    result = await db.execute(
        select(Partner).where(Partner.id == inquiry.partner_id, Partner.is_active == True)
    )
    partner = result.scalar_one_or_none()

    if not partner:
        raise HTTPException(status_code=404, detail="파트너를 찾을 수 없습니다")

    # 문의 생성
    new_inquiry = PartnerInquiry(
        user_id=1,  # TODO: current_user.id
        partner_id=inquiry.partner_id,
        inquiry_type=inquiry.inquiry_type,
        title=inquiry.title,
        content=inquiry.content,
        project_location=inquiry.project_location,
        project_size=inquiry.project_size,
        budget_range=inquiry.budget_range,
        expected_start_date=inquiry.expected_start_date,
        contact_name=inquiry.contact_name,
        contact_phone=inquiry.contact_phone,
        contact_email=inquiry.contact_email,
    )

    db.add(new_inquiry)
    await db.commit()
    await db.refresh(new_inquiry)

    # TODO: 파트너에게 알림 이메일 발송

    return InquiryResponse.model_validate(new_inquiry)


@router.get("/inquiries/my", response_model=List[InquiryResponse])
async def get_my_inquiries(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
    # current_user = Depends(get_current_user)
):
    """내 문의 목록"""
    user_id = 1  # TODO: current_user.id

    query = select(PartnerInquiry).where(PartnerInquiry.user_id == user_id)
    if status:
        query = query.where(PartnerInquiry.status == status)

    query = query.order_by(PartnerInquiry.created_at.desc())

    result = await db.execute(query)
    inquiries = result.scalars().all()

    return [InquiryResponse.model_validate(i) for i in inquiries]


@router.post("/reviews", response_model=ReviewResponse)
async def create_review(
    review: ReviewCreate,
    db: AsyncSession = Depends(get_db)
    # current_user = Depends(get_current_user)
):
    """리뷰 작성"""
    user_id = 1  # TODO: current_user.id

    # 파트너 존재 확인
    result = await db.execute(
        select(Partner).where(Partner.id == review.partner_id)
    )
    partner = result.scalar_one_or_none()

    if not partner:
        raise HTTPException(status_code=404, detail="파트너를 찾을 수 없습니다")

    # 리뷰 생성
    new_review = PartnerReview(
        user_id=user_id,
        partner_id=review.partner_id,
        rating=review.rating,
        quality_rating=review.quality_rating,
        price_rating=review.price_rating,
        communication_rating=review.communication_rating,
        timeliness_rating=review.timeliness_rating,
        title=review.title,
        content=review.content,
    )

    db.add(new_review)

    # 파트너 평점 업데이트
    partner.review_count += 1
    partner.rating = (partner.rating * (partner.review_count - 1) + review.rating) / partner.review_count

    await db.commit()
    await db.refresh(new_review)

    return ReviewResponse.model_validate(new_review)


# ============ 추천 파트너 ============

@router.get("/recommended/{user_role}", response_model=List[PartnerResponse])
async def get_recommended_partners(
    user_role: str,  # DOCTOR, PHARMACIST, SALES_REP
    db: AsyncSession = Depends(get_db)
):
    """사용자 역할별 추천 파트너"""
    # 역할별 추천 카테고리
    role_categories = {
        "DOCTOR": [
            PartnerCategory.INTERIOR,
            PartnerCategory.MEDICAL_EQUIPMENT,
            PartnerCategory.CONSULTING,
            PartnerCategory.IT_SOLUTION,
        ],
        "PHARMACIST": [
            PartnerCategory.INTERIOR,
            PartnerCategory.PHARMA_WHOLESALE,
            PartnerCategory.IT_SOLUTION,
            PartnerCategory.SIGNAGE,
        ],
        "SALES_REP": [
            PartnerCategory.CONSULTING,
            PartnerCategory.MARKETING,
            PartnerCategory.REAL_ESTATE,
        ],
    }

    categories = role_categories.get(user_role, [])

    result = await db.execute(
        select(Partner)
        .where(
            Partner.is_active == True,
            Partner.category.in_(categories)
        )
        .order_by(Partner.is_premium.desc(), Partner.rating.desc())
        .limit(10)
    )
    partners = result.scalars().all()

    return [PartnerResponse.model_validate(p) for p in partners]
