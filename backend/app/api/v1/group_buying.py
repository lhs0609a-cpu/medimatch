"""
개원 공동구매 API

코호트 기반 집단 구매 시스템
- 모집 중인 코호트 조회
- 참여 신청/취소
- 절감액 계산
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from typing import Optional, List
from uuid import UUID
from datetime import datetime, timedelta

from ..deps import get_db, get_current_active_user
from ...models.user import User
from ...models.group_buying import (
    Cohort, CohortParticipant, GroupBuyingCategory, ParticipantCategory,
    GroupBuyingVendor, CohortVendor, GroupBuyingStats,
    CohortStatus, ParticipantStatus
)
from ...schemas.group_buying import (
    CohortListResponse, CohortSummary, CohortDetail, CohortStats,
    CategoryResponse, CategoryWithDiscount,
    ParticipantJoinRequest, ParticipantUpdateRequest, ParticipantResponse,
    JoinCohortResponse, MyParticipationResponse, MyParticipationsResponse,
    SavingsCalculatorRequest, SavingsCalculatorResponse, CategorySavingsBreakdown,
    TotalStatsResponse, VendorResponse, CohortVendorResponse
)

router = APIRouter()


# ============================================================
# 카테고리 API
# ============================================================

@router.get("/categories", response_model=List[CategoryResponse])
async def get_categories(
    db: AsyncSession = Depends(get_db)
):
    """공동구매 카테고리 목록 조회"""
    result = await db.execute(
        select(GroupBuyingCategory)
        .where(GroupBuyingCategory.is_active == True)
        .order_by(GroupBuyingCategory.display_order)
    )
    categories = result.scalars().all()
    return categories


# ============================================================
# 코호트 API
# ============================================================

@router.get("/cohorts", response_model=CohortListResponse)
async def get_cohorts(
    status: Optional[CohortStatus] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    """코호트 목록 조회"""
    query = select(Cohort).options(
        selectinload(Cohort.cohort_vendors).selectinload(CohortVendor.category)
    )

    if status:
        query = query.where(Cohort.status == status)
    else:
        # 기본: 모집중 또는 진행중
        query = query.where(
            Cohort.status.in_([CohortStatus.RECRUITING, CohortStatus.IN_PROGRESS])
        )

    # 총 개수
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # 페이지네이션
    query = query.order_by(Cohort.deadline.asc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    cohorts = result.scalars().all()

    # 응답 변환
    cohort_summaries = []
    for cohort in cohorts:
        days_remaining = (cohort.deadline - datetime.utcnow()).days
        if days_remaining < 0:
            days_remaining = 0

        # 카테고리별 할인율 계산
        categories_with_discount = await _get_cohort_categories_with_discount(db, cohort.id)

        # 평균 절감액 계산 (임시: 참여자당 4800만원 기준)
        estimated_avg_savings = 48000000

        cohort_summaries.append(CohortSummary(
            id=cohort.id,
            name=cohort.name,
            target_month=cohort.target_month,
            status=cohort.status,
            participant_count=cohort.participant_count,
            max_participants=cohort.max_participants,
            deadline=cohort.deadline,
            categories=categories_with_discount,
            estimated_avg_savings=estimated_avg_savings,
            days_remaining=days_remaining
        ))

    return CohortListResponse(
        cohorts=cohort_summaries,
        total=total,
        page=page,
        limit=limit
    )


@router.get("/cohorts/{cohort_id}", response_model=CohortDetail)
async def get_cohort_detail(
    cohort_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """코호트 상세 조회"""
    result = await db.execute(
        select(Cohort)
        .options(
            selectinload(Cohort.cohort_vendors).selectinload(CohortVendor.vendor),
            selectinload(Cohort.cohort_vendors).selectinload(CohortVendor.category)
        )
        .where(Cohort.id == cohort_id)
    )
    cohort = result.scalar_one_or_none()

    if not cohort:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="코호트를 찾을 수 없습니다."
        )

    days_remaining = (cohort.deadline - datetime.utcnow()).days
    if days_remaining < 0:
        days_remaining = 0

    # 카테고리별 할인율
    categories_with_discount = await _get_cohort_categories_with_discount(db, cohort.id)

    # 카테고리별 업체 목록
    vendors_by_category = {}
    for cv in cohort.cohort_vendors:
        cat_id = str(cv.category_id)
        if cat_id not in vendors_by_category:
            vendors_by_category[cat_id] = []
        vendors_by_category[cat_id].append({
            "id": cv.id,
            "vendor": {
                "id": cv.vendor.id,
                "name": cv.vendor.name,
                "description": cv.vendor.description,
                "rating": cv.vendor.rating,
                "review_count": cv.vendor.review_count,
                "is_verified": cv.vendor.is_verified,
                "logo_url": cv.vendor.logo_url,
                "features": cv.vendor.features
            },
            "category_id": cv.category_id,
            "discount_rate": cv.discount_rate,
            "is_selected": cv.is_selected,
            "selection_rank": cv.selection_rank
        })

    return CohortDetail(
        id=cohort.id,
        name=cohort.name,
        target_month=cohort.target_month,
        status=cohort.status,
        participant_count=cohort.participant_count,
        min_participants=cohort.min_participants,
        max_participants=cohort.max_participants,
        deadline=cohort.deadline,
        description=cohort.description,
        categories=categories_with_discount,
        estimated_avg_savings=48000000,
        days_remaining=days_remaining,
        vendors_by_category=vendors_by_category,
        created_at=cohort.created_at
    )


@router.get("/cohorts/{cohort_id}/stats", response_model=CohortStats)
async def get_cohort_stats(
    cohort_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """코호트 통계 조회"""
    # 코호트 조회
    result = await db.execute(
        select(Cohort).where(Cohort.id == cohort_id)
    )
    cohort = result.scalar_one_or_none()

    if not cohort:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="코호트를 찾을 수 없습니다."
        )

    # 진행률
    progress_percent = (cohort.participant_count / cohort.max_participants) * 100

    # 카테고리별 통계
    categories_breakdown = await _get_categories_breakdown(db, cohort_id)

    return CohortStats(
        participant_count=cohort.participant_count,
        progress_percent=round(progress_percent, 1),
        total_estimated_savings=cohort.total_estimated_savings,
        avg_savings_per_participant=48000000,
        categories_breakdown=categories_breakdown
    )


# ============================================================
# 참여 API
# ============================================================

@router.post("/cohorts/{cohort_id}/join", response_model=JoinCohortResponse)
async def join_cohort(
    cohort_id: UUID,
    join_data: ParticipantJoinRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """코호트 참여 신청"""
    # 코호트 확인
    result = await db.execute(
        select(Cohort).where(Cohort.id == cohort_id)
    )
    cohort = result.scalar_one_or_none()

    if not cohort:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="코호트를 찾을 수 없습니다."
        )

    if cohort.status != CohortStatus.RECRUITING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="모집이 마감된 코호트입니다."
        )

    if cohort.participant_count >= cohort.max_participants:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="모집 인원이 마감되었습니다."
        )

    # 중복 참여 확인
    existing = await db.execute(
        select(CohortParticipant).where(
            and_(
                CohortParticipant.cohort_id == cohort_id,
                CohortParticipant.user_id == current_user.id,
                CohortParticipant.status == ParticipantStatus.ACTIVE
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 참여 중인 코호트입니다."
        )

    # 카테고리 유효성 확인
    cat_result = await db.execute(
        select(GroupBuyingCategory).where(
            GroupBuyingCategory.id.in_(join_data.category_ids)
        )
    )
    valid_categories = cat_result.scalars().all()
    if len(valid_categories) != len(join_data.category_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="유효하지 않은 카테고리가 포함되어 있습니다."
        )

    # 예상 절감액 계산
    estimated_savings = await _calculate_savings(
        db, cohort_id, join_data.specialty, join_data.size_pyeong, join_data.category_ids
    )

    # 참여자 생성
    participant = CohortParticipant(
        cohort_id=cohort_id,
        user_id=current_user.id,
        opening_date=join_data.opening_date,
        region=join_data.region,
        district=join_data.district,
        specialty=join_data.specialty,
        size_pyeong=join_data.size_pyeong,
        estimated_savings=estimated_savings
    )
    db.add(participant)
    await db.flush()

    # 카테고리 연결
    for cat_id in join_data.category_ids:
        pc = ParticipantCategory(
            participant_id=participant.id,
            category_id=cat_id
        )
        db.add(pc)

    # 코호트 참여자 수 증가
    cohort.participant_count += 1
    cohort.total_estimated_savings += estimated_savings

    await db.commit()

    return JoinCohortResponse(
        participation_id=participant.id,
        cohort_id=cohort_id,
        status=participant.status,
        estimated_savings=estimated_savings,
        message="참여 신청이 완료되었습니다."
    )


@router.delete("/cohorts/{cohort_id}/leave")
async def leave_cohort(
    cohort_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """코호트 참여 취소"""
    # 참여 확인
    result = await db.execute(
        select(CohortParticipant).where(
            and_(
                CohortParticipant.cohort_id == cohort_id,
                CohortParticipant.user_id == current_user.id,
                CohortParticipant.status == ParticipantStatus.ACTIVE
            )
        )
    )
    participant = result.scalar_one_or_none()

    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="참여 정보를 찾을 수 없습니다."
        )

    # 코호트 확인
    cohort_result = await db.execute(
        select(Cohort).where(Cohort.id == cohort_id)
    )
    cohort = cohort_result.scalar_one_or_none()

    if cohort and cohort.status not in [CohortStatus.RECRUITING, CohortStatus.CLOSED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="진행 중인 코호트에서는 참여를 취소할 수 없습니다."
        )

    # 참여 취소 처리
    participant.status = ParticipantStatus.CANCELLED

    # 코호트 참여자 수 감소
    if cohort:
        cohort.participant_count -= 1
        cohort.total_estimated_savings -= (participant.estimated_savings or 0)

    await db.commit()

    return {"message": "참여가 취소되었습니다."}


@router.get("/my-participations", response_model=MyParticipationsResponse)
async def get_my_participations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """내 참여 목록 조회"""
    result = await db.execute(
        select(CohortParticipant)
        .options(
            selectinload(CohortParticipant.cohort),
            selectinload(CohortParticipant.categories).selectinload(ParticipantCategory.category)
        )
        .where(CohortParticipant.user_id == current_user.id)
        .order_by(CohortParticipant.created_at.desc())
    )
    participations = result.scalars().all()

    items = []
    for p in participations:
        days_remaining = (p.cohort.deadline - datetime.utcnow()).days
        if days_remaining < 0:
            days_remaining = 0

        categories_with_discount = await _get_cohort_categories_with_discount(db, p.cohort_id)

        cohort_summary = CohortSummary(
            id=p.cohort.id,
            name=p.cohort.name,
            target_month=p.cohort.target_month,
            status=p.cohort.status,
            participant_count=p.cohort.participant_count,
            max_participants=p.cohort.max_participants,
            deadline=p.cohort.deadline,
            categories=categories_with_discount,
            estimated_avg_savings=48000000,
            days_remaining=days_remaining
        )

        categories = [pc.category for pc in p.categories]

        items.append(MyParticipationResponse(
            id=p.id,
            cohort_id=p.cohort_id,
            user_id=p.user_id,
            opening_date=p.opening_date,
            region=p.region,
            district=p.district,
            specialty=p.specialty,
            size_pyeong=p.size_pyeong,
            status=p.status,
            estimated_savings=p.estimated_savings,
            categories=categories,
            created_at=p.created_at,
            cohort=cohort_summary
        ))

    return MyParticipationsResponse(
        participations=items,
        total=len(items)
    )


@router.patch("/participations/{participation_id}", response_model=ParticipantResponse)
async def update_participation(
    participation_id: UUID,
    update_data: ParticipantUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """참여 정보 수정"""
    result = await db.execute(
        select(CohortParticipant)
        .options(
            selectinload(CohortParticipant.categories).selectinload(ParticipantCategory.category)
        )
        .where(
            and_(
                CohortParticipant.id == participation_id,
                CohortParticipant.user_id == current_user.id
            )
        )
    )
    participant = result.scalar_one_or_none()

    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="참여 정보를 찾을 수 없습니다."
        )

    if participant.status != ParticipantStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="활성 상태의 참여만 수정할 수 있습니다."
        )

    # 필드 업데이트
    if update_data.opening_date:
        participant.opening_date = update_data.opening_date
    if update_data.region:
        participant.region = update_data.region
    if update_data.district:
        participant.district = update_data.district
    if update_data.specialty:
        participant.specialty = update_data.specialty
    if update_data.size_pyeong:
        participant.size_pyeong = update_data.size_pyeong

    # 카테고리 업데이트
    if update_data.category_ids:
        # 기존 카테고리 삭제
        await db.execute(
            ParticipantCategory.__table__.delete().where(
                ParticipantCategory.participant_id == participation_id
            )
        )
        # 새 카테고리 추가
        for cat_id in update_data.category_ids:
            pc = ParticipantCategory(
                participant_id=participation_id,
                category_id=cat_id
            )
            db.add(pc)

    # 절감액 재계산
    category_ids = update_data.category_ids or [pc.category_id for pc in participant.categories]
    participant.estimated_savings = await _calculate_savings(
        db, participant.cohort_id, participant.specialty,
        participant.size_pyeong, category_ids
    )

    await db.commit()
    await db.refresh(participant)

    categories = [pc.category for pc in participant.categories]

    return ParticipantResponse(
        id=participant.id,
        cohort_id=participant.cohort_id,
        user_id=participant.user_id,
        opening_date=participant.opening_date,
        region=participant.region,
        district=participant.district,
        specialty=participant.specialty,
        size_pyeong=participant.size_pyeong,
        status=participant.status,
        estimated_savings=participant.estimated_savings,
        categories=categories,
        created_at=participant.created_at
    )


# ============================================================
# 통계/계산기 API
# ============================================================

@router.get("/stats/total", response_model=TotalStatsResponse)
async def get_total_stats(
    db: AsyncSession = Depends(get_db)
):
    """전체 통계 조회"""
    # 통계 테이블에서 조회 (없으면 계산)
    result = await db.execute(select(GroupBuyingStats).limit(1))
    stats = result.scalar_one_or_none()

    if stats:
        return TotalStatsResponse(
            total_participants=stats.total_participants,
            total_savings=stats.total_savings,
            total_cohorts_completed=stats.total_cohorts_completed,
            avg_savings_per_participant=stats.avg_savings_per_participant
        )

    # 통계 계산
    participant_count = await db.execute(
        select(func.count()).select_from(CohortParticipant)
        .where(CohortParticipant.status != ParticipantStatus.CANCELLED)
    )
    total_participants = participant_count.scalar() or 0

    completed_count = await db.execute(
        select(func.count()).select_from(Cohort)
        .where(Cohort.status == CohortStatus.COMPLETED)
    )
    total_cohorts_completed = completed_count.scalar() or 0

    # 예상치 반환 (실제 데이터 없을 때)
    total_savings = total_participants * 48000000
    avg_savings = 48000000 if total_participants > 0 else 0

    return TotalStatsResponse(
        total_participants=total_participants,
        total_savings=total_savings,
        total_cohorts_completed=total_cohorts_completed,
        avg_savings_per_participant=avg_savings
    )


@router.get("/stats/calculator", response_model=SavingsCalculatorResponse)
async def calculate_savings(
    specialty: str = Query(...),
    size_pyeong: int = Query(..., gt=0),
    category_ids: List[UUID] = Query(...),
    cohort_id: Optional[UUID] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """절감액 계산기"""
    # 카테고리 조회
    result = await db.execute(
        select(GroupBuyingCategory).where(
            GroupBuyingCategory.id.in_(category_ids)
        )
    )
    categories = result.scalars().all()

    if not categories:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="유효한 카테고리를 선택해주세요."
        )

    # 코호트별 할인율 조회
    discount_rates = {}
    if cohort_id:
        cv_result = await db.execute(
            select(CohortVendor).where(
                and_(
                    CohortVendor.cohort_id == cohort_id,
                    CohortVendor.is_selected == True
                )
            )
        )
        for cv in cv_result.scalars().all():
            discount_rates[str(cv.category_id)] = cv.discount_rate or 0

    breakdown = []
    total_original = 0
    total_discounted = 0

    for cat in categories:
        # 시장 평균가 기반 원가 계산
        if cat.market_avg_price_per_pyeong:
            original = cat.market_avg_price_per_pyeong * size_pyeong
        else:
            # 기본값 (카테고리별)
            default_prices = {
                "의료장비": 7000000,  # 평당 700만원
                "인테리어": 1800000,  # 평당 180만원
                "EMR/전산": 500000,   # 평당 50만원
                "개원컨설팅": 300000,  # 평당 30만원
                "촬영/홍보": 200000,   # 평당 20만원
            }
            price_per_pyeong = default_prices.get(cat.name, 1000000)
            original = price_per_pyeong * size_pyeong

        # 할인율 적용
        discount_rate = discount_rates.get(str(cat.id), cat.base_discount_rate or 25)
        discounted = int(original * (1 - discount_rate / 100))
        savings = original - discounted

        breakdown.append(CategorySavingsBreakdown(
            category_id=cat.id,
            category_name=cat.name,
            original=original,
            discounted=discounted,
            savings=savings,
            discount_rate=discount_rate
        ))

        total_original += original
        total_discounted += discounted

    return SavingsCalculatorResponse(
        original_estimate=total_original,
        discounted_estimate=total_discounted,
        total_savings=total_original - total_discounted,
        breakdown=breakdown
    )


# ============================================================
# 헬퍼 함수
# ============================================================

async def _get_cohort_categories_with_discount(
    db: AsyncSession,
    cohort_id: UUID
) -> List[CategoryWithDiscount]:
    """코호트의 카테고리와 할인율 조회"""
    # 모든 카테고리 조회
    cat_result = await db.execute(
        select(GroupBuyingCategory)
        .where(GroupBuyingCategory.is_active == True)
        .order_by(GroupBuyingCategory.display_order)
    )
    categories = cat_result.scalars().all()

    # 코호트별 할인율 조회
    cv_result = await db.execute(
        select(CohortVendor).where(
            and_(
                CohortVendor.cohort_id == cohort_id,
                CohortVendor.is_selected == True
            )
        )
    )
    discount_map = {}
    for cv in cv_result.scalars().all():
        if cv.discount_rate and (str(cv.category_id) not in discount_map or
                                  cv.discount_rate > discount_map[str(cv.category_id)]):
            discount_map[str(cv.category_id)] = cv.discount_rate

    result = []
    for cat in categories:
        result.append(CategoryWithDiscount(
            id=cat.id,
            name=cat.name,
            description=cat.description,
            icon=cat.icon,
            base_discount_rate=cat.base_discount_rate or 0,
            market_avg_price_per_pyeong=cat.market_avg_price_per_pyeong,
            display_order=cat.display_order,
            is_active=cat.is_active,
            current_discount_rate=discount_map.get(str(cat.id), cat.base_discount_rate)
        ))

    return result


async def _get_categories_breakdown(db: AsyncSession, cohort_id: UUID) -> List[dict]:
    """카테고리별 참여 통계"""
    result = await db.execute(
        select(
            GroupBuyingCategory.id,
            GroupBuyingCategory.name,
            func.count(ParticipantCategory.id).label('participant_count')
        )
        .join(ParticipantCategory, ParticipantCategory.category_id == GroupBuyingCategory.id)
        .join(CohortParticipant, CohortParticipant.id == ParticipantCategory.participant_id)
        .where(
            and_(
                CohortParticipant.cohort_id == cohort_id,
                CohortParticipant.status == ParticipantStatus.ACTIVE
            )
        )
        .group_by(GroupBuyingCategory.id, GroupBuyingCategory.name)
    )

    return [
        {"category_id": str(row.id), "category_name": row.name, "participant_count": row.participant_count}
        for row in result.all()
    ]


async def _calculate_savings(
    db: AsyncSession,
    cohort_id: UUID,
    specialty: str,
    size_pyeong: int,
    category_ids: List[UUID]
) -> int:
    """예상 절감액 계산"""
    # 카테고리 조회
    result = await db.execute(
        select(GroupBuyingCategory).where(
            GroupBuyingCategory.id.in_(category_ids)
        )
    )
    categories = result.scalars().all()

    # 코호트별 할인율 조회
    discount_rates = {}
    cv_result = await db.execute(
        select(CohortVendor).where(
            and_(
                CohortVendor.cohort_id == cohort_id,
                CohortVendor.is_selected == True
            )
        )
    )
    for cv in cv_result.scalars().all():
        discount_rates[str(cv.category_id)] = cv.discount_rate or 0

    total_savings = 0
    for cat in categories:
        # 시장 평균가 기반 원가
        if cat.market_avg_price_per_pyeong:
            original = cat.market_avg_price_per_pyeong * size_pyeong
        else:
            default_prices = {
                "의료장비": 7000000,
                "인테리어": 1800000,
                "EMR/전산": 500000,
                "개원컨설팅": 300000,
                "촬영/홍보": 200000,
            }
            price_per_pyeong = default_prices.get(cat.name, 1000000)
            original = price_per_pyeong * size_pyeong

        # 할인율 적용
        discount_rate = discount_rates.get(str(cat.id), cat.base_discount_rate or 25)
        savings = int(original * discount_rate / 100)
        total_savings += savings

    return total_savings
