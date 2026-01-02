"""
파트너 연결 API
- 인테리어, 의료 장비, 컨설팅 등 파트너 업체 연결
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal

from app.core.database import get_db
from app.models.partner import Partner, PartnerInquiry, PartnerContract, PartnerReview, PartnerCategory, PartnerStatus, PartnerTier
from app.models.partner_category import PartnerCategoryModel, DEFAULT_CATEGORIES
from app.models.partner_portfolio import PartnerPortfolio, PartnerServiceArea
from app.models.partner_subscription import PartnerSubscription, SubscriptionPlan, SUBSCRIPTION_PLANS
from app.models.user import User
from app.api.deps import get_current_active_user

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


class CategoryDetailResponse(BaseModel):
    """카테고리 상세 (DB 기반)"""
    id: int
    code: str
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    lead_fee: int
    commission_rate: float
    is_active: bool

    class Config:
        from_attributes = True


class PortfolioResponse(BaseModel):
    """포트폴리오 응답"""
    id: int
    title: str
    project_type: Optional[str] = None
    project_size: Optional[int] = None
    project_cost: Optional[int] = None
    project_duration: Optional[int] = None
    description: Optional[str] = None
    images: List[str] = []
    is_featured: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PortfolioCreate(BaseModel):
    """포트폴리오 생성"""
    title: str
    project_type: Optional[str] = None
    project_size: Optional[int] = None
    project_cost: Optional[int] = None
    project_duration: Optional[int] = None
    location: Optional[str] = None
    client_type: Optional[str] = None
    description: Optional[str] = None
    images: List[str] = []
    is_featured: bool = False


class ServiceAreaResponse(BaseModel):
    """서비스 지역 응답"""
    id: int
    sido: str
    sigungu: Optional[str] = None
    is_primary: bool

    class Config:
        from_attributes = True


class PartnerFullDetailResponse(BaseModel):
    """파트너 전체 상세 (포트폴리오 포함)"""
    id: int
    name: str
    category: str
    short_description: Optional[str] = None
    description: Optional[str] = None

    # 연락처 (플랫폼 내 채팅만 가능하므로 실제 연락처는 숨김)
    has_contact: bool = True

    # 위치
    sido: Optional[str] = None
    sigungu: Optional[str] = None
    address: Optional[str] = None

    # 사업 정보
    established_year: Optional[int] = None
    employee_count: Optional[int] = None
    annual_projects: Optional[int] = None

    # 가격 정보
    price_range_min: Optional[int] = None
    price_range_max: Optional[int] = None
    price_unit: str = "total"

    # 전문 분야
    specialties: List[str] = []

    # 이미지
    logo_url: Optional[str] = None
    cover_image_url: Optional[str] = None

    # 평점
    rating: float
    review_count: int

    # 통계
    inquiry_count: int = 0
    contract_count: int = 0
    response_rate: float = 0
    avg_response_time: int = 0

    # 등급
    tier: str
    status: str
    is_premium: bool
    is_verified: bool
    premium_badge_text: Optional[str] = None

    # 포트폴리오
    portfolios: List[PortfolioResponse] = []

    # 서비스 지역
    service_areas: List[ServiceAreaResponse] = []

    created_at: datetime

    class Config:
        from_attributes = True


class SubscriptionPlanInfo(BaseModel):
    """구독 플랜 정보"""
    plan: str
    name: str
    monthly_price: int
    yearly_price: int
    lead_fee_discount: int
    commission_discount: float
    max_portfolios: int
    features: List[str]


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
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
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
        user_id=current_user.id,
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

    # 파트너에게 알림 이메일 발송
    from app.tasks.notifications import send_email_notification
    if partner.email:
        send_email_notification.delay(
            email=partner.email,
            subject=f"[MediMatch] 새 문의가 도착했습니다 - {inquiry.title}",
            template="daily_digest",
            context={
                "user_name": partner.name,
                "date": datetime.now().strftime("%Y-%m-%d"),
                "new_prospects": f"문의 유형: {inquiry.inquiry_type}"
            }
        )

    return InquiryResponse.model_validate(new_inquiry)


@router.get("/inquiries/my", response_model=List[InquiryResponse])
async def get_my_inquiries(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """내 문의 목록"""
    query = select(PartnerInquiry).where(PartnerInquiry.user_id == current_user.id)
    if status:
        query = query.where(PartnerInquiry.status == status)

    query = query.order_by(PartnerInquiry.created_at.desc())

    result = await db.execute(query)
    inquiries = result.scalars().all()

    return [InquiryResponse.model_validate(i) for i in inquiries]


@router.post("/reviews", response_model=ReviewResponse)
async def create_review(
    review: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """리뷰 작성"""
    # 파트너 존재 확인
    result = await db.execute(
        select(Partner).where(Partner.id == review.partner_id)
    )
    partner = result.scalar_one_or_none()

    if not partner:
        raise HTTPException(status_code=404, detail="파트너를 찾을 수 없습니다")

    # 리뷰 생성
    new_review = PartnerReview(
        user_id=current_user.id,
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


# ============ 상세 조회 (포트폴리오 포함) ============

@router.get("/{partner_id}/full", response_model=PartnerFullDetailResponse)
async def get_partner_full_detail(
    partner_id: int,
    db: AsyncSession = Depends(get_db)
):
    """파트너 전체 상세 조회 (포트폴리오, 서비스 지역 포함)"""
    result = await db.execute(
        select(Partner)
        .where(Partner.id == partner_id, Partner.is_active == True)
        .options(
            selectinload(Partner.portfolios),
            selectinload(Partner.service_areas)
        )
    )
    partner = result.scalar_one_or_none()

    if not partner:
        raise HTTPException(status_code=404, detail="파트너를 찾을 수 없습니다")

    # 포트폴리오 변환
    portfolios = []
    for p in partner.portfolios:
        if p.is_visible:
            portfolios.append(PortfolioResponse(
                id=p.id,
                title=p.title,
                project_type=p.project_type,
                project_size=p.project_size,
                project_cost=p.project_cost,
                project_duration=p.project_duration,
                description=p.description,
                images=p.images or [],
                is_featured=p.is_featured,
                created_at=p.created_at
            ))

    # 서비스 지역 변환
    service_areas = []
    for sa in partner.service_areas:
        service_areas.append(ServiceAreaResponse(
            id=sa.id,
            sido=sa.sido,
            sigungu=sa.sigungu,
            is_primary=sa.is_primary
        ))

    return PartnerFullDetailResponse(
        id=partner.id,
        name=partner.name,
        category=partner.category,
        short_description=partner.short_description,
        description=partner.description,
        has_contact=bool(partner.phone or partner.email),
        sido=partner.sido,
        sigungu=partner.sigungu,
        address=partner.address,
        established_year=partner.established_year,
        employee_count=partner.employee_count,
        annual_projects=partner.annual_projects,
        price_range_min=partner.price_range_min,
        price_range_max=partner.price_range_max,
        price_unit=partner.price_unit or "total",
        specialties=partner.specialties or [],
        logo_url=partner.logo_url,
        cover_image_url=partner.cover_image_url,
        rating=float(partner.rating or 0),
        review_count=partner.review_count or 0,
        inquiry_count=partner.inquiry_count or 0,
        contract_count=partner.contract_count or 0,
        response_rate=float(partner.response_rate or 0),
        avg_response_time=partner.avg_response_time or 0,
        tier=partner.tier.value if partner.tier else PartnerTier.BASIC.value,
        status=partner.status.value if partner.status else PartnerStatus.ACTIVE.value,
        is_premium=partner.is_premium or False,
        is_verified=partner.is_verified or False,
        premium_badge_text=partner.premium_badge_text,
        portfolios=portfolios,
        service_areas=service_areas,
        created_at=partner.created_at
    )


# ============ 포트폴리오 관리 ============

@router.get("/{partner_id}/portfolios", response_model=List[PortfolioResponse])
async def get_partner_portfolios(
    partner_id: int,
    db: AsyncSession = Depends(get_db)
):
    """파트너 포트폴리오 목록"""
    result = await db.execute(
        select(PartnerPortfolio)
        .where(
            PartnerPortfolio.partner_id == partner_id,
            PartnerPortfolio.is_visible == True
        )
        .order_by(PartnerPortfolio.is_featured.desc(), PartnerPortfolio.display_order)
    )
    portfolios = result.scalars().all()

    return [
        PortfolioResponse(
            id=p.id,
            title=p.title,
            project_type=p.project_type,
            project_size=p.project_size,
            project_cost=p.project_cost,
            project_duration=p.project_duration,
            description=p.description,
            images=p.images or [],
            is_featured=p.is_featured,
            created_at=p.created_at
        )
        for p in portfolios
    ]


@router.post("/{partner_id}/portfolios", response_model=PortfolioResponse)
async def create_portfolio(
    partner_id: int,
    portfolio: PortfolioCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """포트폴리오 추가 (파트너 본인만)"""
    # 파트너 확인 및 권한 체크
    result = await db.execute(
        select(Partner).where(Partner.id == partner_id)
    )
    partner = result.scalar_one_or_none()

    if not partner:
        raise HTTPException(status_code=404, detail="파트너를 찾을 수 없습니다")

    if str(partner.user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="본인 업체의 포트폴리오만 관리할 수 있습니다")

    # 포트폴리오 개수 제한 확인
    count_result = await db.execute(
        select(func.count()).select_from(PartnerPortfolio).where(
            PartnerPortfolio.partner_id == partner_id
        )
    )
    current_count = count_result.scalar() or 0

    # 구독 플랜에 따른 제한
    max_portfolios = 3  # 기본 FREE 플랜
    if partner.subscription:
        plan_info = SUBSCRIPTION_PLANS.get(partner.subscription.plan.value, {})
        max_portfolios = plan_info.get("max_portfolios", 3)

    if current_count >= max_portfolios:
        raise HTTPException(
            status_code=400,
            detail=f"포트폴리오 최대 개수({max_portfolios}개)를 초과했습니다. 구독 플랜을 업그레이드하세요."
        )

    # 다음 display_order
    order_result = await db.execute(
        select(func.max(PartnerPortfolio.display_order)).where(
            PartnerPortfolio.partner_id == partner_id
        )
    )
    next_order = (order_result.scalar() or 0) + 1

    new_portfolio = PartnerPortfolio(
        partner_id=partner_id,
        title=portfolio.title,
        project_type=portfolio.project_type,
        project_size=portfolio.project_size,
        project_cost=portfolio.project_cost,
        project_duration=portfolio.project_duration,
        location=portfolio.location,
        client_type=portfolio.client_type,
        description=portfolio.description,
        images=portfolio.images,
        is_featured=portfolio.is_featured,
        display_order=next_order
    )

    db.add(new_portfolio)
    await db.commit()
    await db.refresh(new_portfolio)

    return PortfolioResponse(
        id=new_portfolio.id,
        title=new_portfolio.title,
        project_type=new_portfolio.project_type,
        project_size=new_portfolio.project_size,
        project_cost=new_portfolio.project_cost,
        project_duration=new_portfolio.project_duration,
        description=new_portfolio.description,
        images=new_portfolio.images or [],
        is_featured=new_portfolio.is_featured,
        created_at=new_portfolio.created_at
    )


@router.delete("/{partner_id}/portfolios/{portfolio_id}")
async def delete_portfolio(
    partner_id: int,
    portfolio_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """포트폴리오 삭제"""
    # 파트너 권한 확인
    result = await db.execute(
        select(Partner).where(Partner.id == partner_id)
    )
    partner = result.scalar_one_or_none()

    if not partner:
        raise HTTPException(status_code=404, detail="파트너를 찾을 수 없습니다")

    if str(partner.user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="본인 업체의 포트폴리오만 관리할 수 있습니다")

    # 포트폴리오 삭제
    portfolio_result = await db.execute(
        select(PartnerPortfolio).where(
            PartnerPortfolio.id == portfolio_id,
            PartnerPortfolio.partner_id == partner_id
        )
    )
    portfolio = portfolio_result.scalar_one_or_none()

    if not portfolio:
        raise HTTPException(status_code=404, detail="포트폴리오를 찾을 수 없습니다")

    await db.delete(portfolio)
    await db.commit()

    return {"success": True, "message": "포트폴리오가 삭제되었습니다"}


# ============ 구독 플랜 ============

@router.get("/subscription-plans", response_model=List[SubscriptionPlanInfo])
async def get_subscription_plans():
    """구독 플랜 목록"""
    plans = []
    for plan_code, info in SUBSCRIPTION_PLANS.items():
        plans.append(SubscriptionPlanInfo(
            plan=plan_code,
            name=info["name"],
            monthly_price=info["monthly_price"],
            yearly_price=info["yearly_price"],
            lead_fee_discount=info["lead_fee_discount"],
            commission_discount=float(info["commission_discount"]),
            max_portfolios=info["max_portfolios"],
            features=info["features"]
        ))
    return plans


# ============ 카테고리 상세 (DB 기반) ============

@router.get("/categories/db", response_model=List[CategoryDetailResponse])
async def get_categories_from_db(
    db: AsyncSession = Depends(get_db)
):
    """DB 기반 카테고리 목록 (수수료 정보 포함)"""
    result = await db.execute(
        select(PartnerCategoryModel)
        .where(PartnerCategoryModel.is_active == True)
        .order_by(PartnerCategoryModel.display_order)
    )
    categories = result.scalars().all()

    return [CategoryDetailResponse.model_validate(c) for c in categories]
