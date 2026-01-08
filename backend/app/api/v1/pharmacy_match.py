"""
익명 약국 매칭 API (PharmMatch v2)

정보 공개 레벨:
- MINIMAL: 기본 정보만 (무료)
- PARTIAL: + 재무 범위 정보 (5만원)
- FULL: + 상세 정보 및 연락처 (10만원)
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from uuid import UUID

from ..deps import get_db, get_current_active_user
from ...core.security import get_current_user, TokenData
from ...models.user import User
from ...models.listing_access import AccessLevel, ListingAccessLevel, AccessPricing
from ...services.listing_access import listing_access_service
from ...schemas.pharmacy_match import (
    # Listing
    ListingCreate, ListingUpdate, ListingPublicResponse, ListingPrivateResponse,
    ListingListResponse, ListingFilter, AnonymousListingStatus,
    # Profile
    ProfileCreate, ProfileUpdate, ProfilePublicResponse, ProfilePrivateResponse,
    ProfileListResponse, ProfileFilter,
    # Interest
    InterestCreate, InterestResponse, InterestListResponse,
    # Match
    MatchResponse, MatchStatusUpdate, MatchListResponse, MatchScoreBreakdown,
    # Message
    MessageCreate, MessageResponse, MessageListResponse,
    # Recommendation
    RecommendationItem, RecommendationResponse,
    # Enums
    PharmacyType
)
from ...services.pharmacy_match import pharmacy_match_service

router = APIRouter()


# ============================================================
# 익명 매물 API
# ============================================================

@router.post("/listings", response_model=ListingPrivateResponse, status_code=status.HTTP_201_CREATED)
async def create_listing(
    listing_data: ListingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """익명 매물 등록"""
    listing = await pharmacy_match_service.create_listing(db, listing_data, current_user.id)
    return listing


@router.get("/listings", response_model=ListingListResponse)
async def get_listings(
    region_codes: Optional[List[str]] = Query(None),
    pharmacy_types: Optional[List[PharmacyType]] = Query(None),
    premium_min: Optional[int] = Query(None, ge=0),
    premium_max: Optional[int] = Query(None, ge=0),
    monthly_revenue_min: Optional[int] = Query(None, ge=0),
    area_min: Optional[float] = Query(None, ge=0),
    area_max: Optional[float] = Query(None, ge=0),
    has_auto_dispenser: Optional[bool] = Query(None),
    has_parking: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """매물 목록 조회 (익명)"""
    filters = ListingFilter(
        region_codes=region_codes,
        pharmacy_types=pharmacy_types,
        premium_min=premium_min,
        premium_max=premium_max,
        monthly_revenue_min=monthly_revenue_min,
        area_min=area_min,
        area_max=area_max,
        has_auto_dispenser=has_auto_dispenser,
        has_parking=has_parking,
        status=AnonymousListingStatus.ACTIVE
    )
    result = await pharmacy_match_service.get_listings(db, filters, page, page_size)

    # 공개 정보만 반환
    items = [ListingPublicResponse.model_validate(item) for item in result["items"]]

    return ListingListResponse(
        items=items,
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"]
    )


@router.get("/listings/my", response_model=List[ListingPrivateResponse])
async def get_my_listings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """내 매물 목록"""
    listings = await pharmacy_match_service.get_my_listings(db, current_user.id)
    return listings


@router.get("/listings/{listing_id}", response_model=ListingPublicResponse)
async def get_listing(
    listing_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """매물 상세 조회 (익명)"""
    listing = await pharmacy_match_service.get_listing(db, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # 공개 정보만 반환
    return ListingPublicResponse.model_validate(listing)


@router.patch("/listings/{listing_id}", response_model=ListingPrivateResponse)
async def update_listing(
    listing_id: UUID,
    update_data: ListingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """매물 수정"""
    listing = await pharmacy_match_service.update_listing(
        db, listing_id, current_user.id, update_data
    )
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found or not authorized")
    return listing


@router.delete("/listings/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_listing(
    listing_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """매물 삭제 (철회)"""
    success = await pharmacy_match_service.delete_listing(db, listing_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Listing not found or not authorized")


# ============================================================
# 약사 프로필 API
# ============================================================

@router.post("/profiles", response_model=ProfilePrivateResponse, status_code=status.HTTP_201_CREATED)
async def create_profile(
    profile_data: ProfileCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """약사 프로필 생성"""
    try:
        profile = await pharmacy_match_service.create_profile(db, profile_data, current_user.id)
        return profile
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/profiles", response_model=ProfileListResponse)
async def get_profiles(
    region_codes: Optional[List[str]] = Query(None),
    budget_min: Optional[int] = Query(None, ge=0),
    budget_max: Optional[int] = Query(None, ge=0),
    experience_years_min: Optional[int] = Query(None, ge=0),
    has_management_experience: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """프로필 목록 조회 (매물주용)"""
    filters = ProfileFilter(
        region_codes=region_codes,
        budget_min=budget_min,
        budget_max=budget_max,
        experience_years_min=experience_years_min,
        has_management_experience=has_management_experience
    )
    result = await pharmacy_match_service.get_profiles(db, filters, page, page_size)

    items = [ProfilePublicResponse.model_validate(item) for item in result["items"]]

    return ProfileListResponse(
        items=items,
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"]
    )


@router.get("/profiles/my", response_model=ProfilePrivateResponse)
async def get_my_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """내 프로필 조회"""
    profile = await pharmacy_match_service.get_my_profile(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.get("/profiles/{profile_id}", response_model=ProfilePublicResponse)
async def get_profile(
    profile_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """프로필 조회 (익명)"""
    profile = await pharmacy_match_service.get_profile(db, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    return ProfilePublicResponse.model_validate(profile)


@router.patch("/profiles/my", response_model=ProfilePrivateResponse)
async def update_profile(
    update_data: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """프로필 수정"""
    profile = await pharmacy_match_service.update_profile(db, current_user.id, update_data)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


# ============================================================
# 관심 표시 API
# ============================================================

@router.post("/interests", response_model=InterestResponse, status_code=status.HTTP_201_CREATED)
async def express_interest(
    interest_data: InterestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """관심 표시"""
    try:
        interest, match = await pharmacy_match_service.express_interest(
            db, current_user.id, interest_data
        )

        # 상대방 요약 정보 생성
        if interest.interest_type.value == "P2L":
            listing = await pharmacy_match_service.get_listing(db, interest.listing_id, False)
            target_anonymous_id = listing.anonymous_id if listing else "Unknown"
            target_summary = f"{listing.region_name} / {listing.pharmacy_type.value}" if listing else ""
        else:
            profile = await pharmacy_match_service.get_profile(db, interest.pharmacist_profile_id)
            target_anonymous_id = profile.anonymous_id if profile else "Unknown"
            target_summary = f"경력 {profile.experience_years}년" if profile else ""

        response = InterestResponse(
            id=interest.id,
            listing_id=interest.listing_id,
            pharmacist_profile_id=interest.pharmacist_profile_id,
            interest_type=interest.interest_type,
            message=interest.message,
            created_at=interest.created_at,
            target_anonymous_id=target_anonymous_id,
            target_summary=target_summary
        )

        # 매칭이 성사되었으면 헤더에 표시
        if match:
            response.model_extra = {"match_created": True, "match_id": str(match.id)}

        return response

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/interests", response_model=InterestListResponse)
async def get_interests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """내 관심 목록 (보낸 것 + 받은 것)"""
    result = await pharmacy_match_service.get_interests(db, current_user.id)

    # 응답 변환
    async def convert_interest(interest, is_sent: bool):
        if interest.interest_type.value == "P2L":
            listing = await pharmacy_match_service.get_listing(db, interest.listing_id, False)
            target_anonymous_id = listing.anonymous_id if listing else "Unknown"
            target_summary = f"{listing.region_name}" if listing else ""
        else:
            profile = await pharmacy_match_service.get_profile(db, interest.pharmacist_profile_id)
            target_anonymous_id = profile.anonymous_id if profile else "Unknown"
            target_summary = f"경력 {profile.experience_years}년" if profile else ""

        return InterestResponse(
            id=interest.id,
            listing_id=interest.listing_id,
            pharmacist_profile_id=interest.pharmacist_profile_id,
            interest_type=interest.interest_type,
            message=interest.message,
            created_at=interest.created_at,
            target_anonymous_id=target_anonymous_id,
            target_summary=target_summary
        )

    sent = [await convert_interest(i, True) for i in result["sent"]]
    received = [await convert_interest(i, False) for i in result["received"]]

    return InterestListResponse(
        sent=sent,
        received=received,
        total_sent=result["total_sent"],
        total_received=result["total_received"]
    )


@router.delete("/interests/{interest_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_interest(
    interest_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """관심 표시 취소"""
    success = await pharmacy_match_service.cancel_interest(db, interest_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Interest not found or not authorized")


# ============================================================
# 매칭 API
# ============================================================

@router.get("/matches", response_model=MatchListResponse)
async def get_matches(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """내 매칭 목록"""
    matches = await pharmacy_match_service.get_matches(db, current_user.id)

    items = []
    for match in matches:
        # 매칭 상태에 따라 비공개 정보 포함 여부 결정
        listing_private = None
        profile_private = None

        if match.status.value in ["MUTUAL", "CHATTING", "MEETING", "CONTRACTED"]:
            listing_private = ListingPrivateResponse.model_validate(match.listing)
            profile_private = ProfilePrivateResponse.model_validate(match.pharmacist_profile)

        items.append(MatchResponse(
            id=match.id,
            listing_id=match.listing_id,
            pharmacist_profile_id=match.pharmacist_profile_id,
            status=match.status,
            match_score=match.match_score,
            match_score_breakdown=MatchScoreBreakdown(**match.match_score_breakdown) if match.match_score_breakdown else None,
            listing_info=ListingPublicResponse.model_validate(match.listing),
            profile_info=ProfilePublicResponse.model_validate(match.pharmacist_profile),
            listing_private=listing_private,
            profile_private=profile_private,
            contact_revealed_at=match.contact_revealed_at,
            first_message_at=match.first_message_at,
            meeting_scheduled_at=match.meeting_scheduled_at,
            contracted_at=match.contracted_at,
            commission_rate=match.commission_rate,
            commission_amount=match.commission_amount,
            created_at=match.created_at,
            updated_at=match.updated_at
        ))

    return MatchListResponse(items=items, total=len(items))


@router.get("/matches/{match_id}", response_model=MatchResponse)
async def get_match(
    match_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """매칭 상세 조회"""
    match = await pharmacy_match_service.get_match(db, match_id, current_user.id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found or not authorized")

    listing_private = None
    profile_private = None

    if match.status.value in ["MUTUAL", "CHATTING", "MEETING", "CONTRACTED"]:
        listing_private = ListingPrivateResponse.model_validate(match.listing)
        profile_private = ProfilePrivateResponse.model_validate(match.pharmacist_profile)

    return MatchResponse(
        id=match.id,
        listing_id=match.listing_id,
        pharmacist_profile_id=match.pharmacist_profile_id,
        status=match.status,
        match_score=match.match_score,
        match_score_breakdown=MatchScoreBreakdown(**match.match_score_breakdown) if match.match_score_breakdown else None,
        listing_info=ListingPublicResponse.model_validate(match.listing),
        profile_info=ProfilePublicResponse.model_validate(match.pharmacist_profile),
        listing_private=listing_private,
        profile_private=profile_private,
        contact_revealed_at=match.contact_revealed_at,
        first_message_at=match.first_message_at,
        meeting_scheduled_at=match.meeting_scheduled_at,
        contracted_at=match.contracted_at,
        commission_rate=match.commission_rate,
        commission_amount=match.commission_amount,
        created_at=match.created_at,
        updated_at=match.updated_at
    )


@router.patch("/matches/{match_id}/status", response_model=MatchResponse)
async def update_match_status(
    match_id: UUID,
    status_update: MatchStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """매칭 상태 업데이트"""
    match = await pharmacy_match_service.update_match_status(
        db, match_id, current_user.id, status_update
    )
    if not match:
        raise HTTPException(status_code=404, detail="Match not found or not authorized")

    listing_private = None
    profile_private = None

    if match.status.value in ["MUTUAL", "CHATTING", "MEETING", "CONTRACTED"]:
        listing = await pharmacy_match_service.get_listing(db, match.listing_id, False)
        profile = await pharmacy_match_service.get_profile(db, match.pharmacist_profile_id)
        listing_private = ListingPrivateResponse.model_validate(listing)
        profile_private = ProfilePrivateResponse.model_validate(profile)

    return MatchResponse(
        id=match.id,
        listing_id=match.listing_id,
        pharmacist_profile_id=match.pharmacist_profile_id,
        status=match.status,
        match_score=match.match_score,
        match_score_breakdown=MatchScoreBreakdown(**match.match_score_breakdown) if match.match_score_breakdown else None,
        listing_info=ListingPublicResponse.model_validate(listing),
        profile_info=ProfilePublicResponse.model_validate(profile),
        listing_private=listing_private,
        profile_private=profile_private,
        contact_revealed_at=match.contact_revealed_at,
        first_message_at=match.first_message_at,
        meeting_scheduled_at=match.meeting_scheduled_at,
        contracted_at=match.contracted_at,
        commission_rate=match.commission_rate,
        commission_amount=match.commission_amount,
        created_at=match.created_at,
        updated_at=match.updated_at
    )


# ============================================================
# 메시지 API
# ============================================================

@router.post("/matches/{match_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    match_id: UUID,
    message_data: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """메시지 전송"""
    try:
        message = await pharmacy_match_service.send_message(
            db, match_id, current_user.id, message_data
        )
        if not message:
            raise HTTPException(status_code=404, detail="Match not found or not authorized")

        # sender 익명 ID 조회
        my_profile = await pharmacy_match_service.get_my_profile(db, current_user.id)
        my_listings = await pharmacy_match_service.get_my_listings(db, current_user.id)

        sender_anonymous_id = ""
        if my_profile:
            sender_anonymous_id = my_profile.anonymous_id
        elif my_listings:
            sender_anonymous_id = my_listings[0].anonymous_id

        return MessageResponse(
            id=message.id,
            match_id=message.match_id,
            sender_id=message.sender_id,
            sender_anonymous_id=sender_anonymous_id,
            content=message.content,
            is_read=message.is_read,
            read_at=message.read_at,
            created_at=message.created_at
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/matches/{match_id}/messages", response_model=MessageListResponse)
async def get_messages(
    match_id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """메시지 목록 조회"""
    result = await pharmacy_match_service.get_messages(
        db, match_id, current_user.id, page, page_size
    )

    # 각 메시지의 sender 익명 ID 조회 (캐싱)
    sender_cache = {}
    items = []

    for msg in result["items"]:
        if msg.sender_id not in sender_cache:
            profile = await pharmacy_match_service.get_my_profile(db, msg.sender_id)
            if profile:
                sender_cache[msg.sender_id] = profile.anonymous_id
            else:
                listings = await pharmacy_match_service.get_my_listings(db, msg.sender_id)
                sender_cache[msg.sender_id] = listings[0].anonymous_id if listings else "Unknown"

        items.append(MessageResponse(
            id=msg.id,
            match_id=msg.match_id,
            sender_id=msg.sender_id,
            sender_anonymous_id=sender_cache.get(msg.sender_id, "Unknown"),
            content=msg.content,
            is_read=msg.is_read,
            read_at=msg.read_at,
            created_at=msg.created_at
        ))

    return MessageListResponse(
        items=items,
        total=result["total"],
        unread_count=result["unread_count"]
    )


# ============================================================
# AI 추천 API
# ============================================================

@router.get("/recommendations", response_model=RecommendationResponse)
async def get_recommendations(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """AI 추천 목록"""
    recommendations = await pharmacy_match_service.get_recommendations(
        db, current_user.id, limit
    )

    items = []
    for rec in recommendations:
        items.append(RecommendationItem(
            listing=ListingPublicResponse.model_validate(rec["listing"]) if rec["listing"] else None,
            profile=ProfilePublicResponse.model_validate(rec["profile"]) if rec["profile"] else None,
            match_score=rec["match_score"],
            match_score_breakdown=MatchScoreBreakdown(**rec["match_score_breakdown"]),
            recommendation_reason=rec["recommendation_reason"]
        ))

    return RecommendationResponse(recommendations=items, total=len(items))


# ============================================================
# 정보 접근 레벨 API (3단계 정보 공개)
# ============================================================

@router.get("/listings/{listing_id}/access")
async def get_listing_access_level(
    listing_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_active_user)
):
    """
    매물에 대한 내 접근 레벨 확인

    - MINIMAL: 기본 정보만 (무료)
    - PARTIAL: + 재무 범위 정보 (5만원)
    - FULL: + 상세 정보 및 연락처 (10만원)
    """
    # 매물 존재 확인
    listing = await pharmacy_match_service.get_listing(db, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # 소유자 확인
    is_owner = await listing_access_service.check_owner_access(db, listing_id, current_user.id)
    if is_owner:
        return {
            "listing_id": str(listing_id),
            "access_level": "FULL",
            "is_owner": True,
            "can_upgrade": False,
            "upgrade_options": []
        }

    # 현재 접근 레벨
    current_level = await listing_access_service.get_user_access_level(db, listing_id, current_user.id)

    # 업그레이드 옵션
    upgrade_options = []
    if current_level == AccessLevel.MINIMAL:
        partial_price = await listing_access_service.get_upgrade_price(db, AccessLevel.MINIMAL, AccessLevel.PARTIAL)
        full_price = await listing_access_service.get_upgrade_price(db, AccessLevel.MINIMAL, AccessLevel.FULL)
        upgrade_options = [
            {"target_level": "PARTIAL", "price": partial_price, "description": "권리금/매출/면적 범위 정보"},
            {"target_level": "FULL", "price": full_price, "description": "전체 정보 (주소, 연락처 포함)"}
        ]
    elif current_level == AccessLevel.PARTIAL:
        full_price = await listing_access_service.get_upgrade_price(db, AccessLevel.PARTIAL, AccessLevel.FULL)
        upgrade_options = [
            {"target_level": "FULL", "price": full_price, "description": "상세 주소 및 연락처 정보"}
        ]

    return {
        "listing_id": str(listing_id),
        "access_level": current_level.value,
        "is_owner": False,
        "can_upgrade": len(upgrade_options) > 0,
        "upgrade_options": upgrade_options
    }


@router.get("/listings/{listing_id}/detail")
async def get_listing_with_access_level(
    listing_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[TokenData] = Depends(get_current_user)
):
    """
    접근 레벨에 따른 매물 상세 조회

    로그인하지 않은 사용자는 MINIMAL 레벨만 볼 수 있습니다.
    """
    # 매물 조회
    listing = await pharmacy_match_service.get_listing(db, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # 조회수 증가
    listing.view_count = (listing.view_count or 0) + 1
    await db.commit()

    # 비로그인 사용자
    if not current_user:
        filtered_data = listing_access_service.filter_listing_by_access(
            listing, AccessLevel.MINIMAL, is_owner=False
        )
        filtered_data["access_level"] = "MINIMAL"
        filtered_data["is_logged_in"] = False
        return filtered_data

    user_id = UUID(current_user.user_id)

    # 소유자 확인
    is_owner = await listing_access_service.check_owner_access(db, listing_id, user_id)
    if is_owner:
        filtered_data = listing_access_service.filter_listing_by_access(
            listing, AccessLevel.FULL, is_owner=True
        )
        filtered_data["access_level"] = "FULL"
        filtered_data["is_owner"] = True
        return filtered_data

    # 접근 레벨 확인
    access_level = await listing_access_service.get_user_access_level(db, listing_id, user_id)

    filtered_data = listing_access_service.filter_listing_by_access(
        listing, access_level, is_owner=False
    )
    filtered_data["access_level"] = access_level.value
    filtered_data["is_owner"] = False

    return filtered_data


@router.post("/listings/{listing_id}/upgrade")
async def upgrade_listing_access(
    listing_id: UUID,
    target_level: str = Query(..., description="목표 접근 레벨 (PARTIAL 또는 FULL)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    매물 정보 접근 레벨 업그레이드

    결제 후 호출됩니다. 실제 결제는 /payment API를 통해 처리합니다.

    가격:
    - MINIMAL → PARTIAL: 50,000원
    - PARTIAL → FULL: 100,000원
    - MINIMAL → FULL: 130,000원
    """
    # 매물 존재 확인
    listing = await pharmacy_match_service.get_listing(db, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # 소유자는 이미 전체 접근 가능
    is_owner = await listing_access_service.check_owner_access(db, listing_id, current_user.id)
    if is_owner:
        raise HTTPException(status_code=400, detail="Owner already has full access")

    # 목표 레벨 검증
    try:
        target = AccessLevel(target_level)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid access level. Use PARTIAL or FULL")

    # 현재 레벨 확인
    current_level = await listing_access_service.get_user_access_level(db, listing_id, current_user.id)

    # 레벨 순서 확인
    level_order = {AccessLevel.MINIMAL: 0, AccessLevel.PARTIAL: 1, AccessLevel.FULL: 2}
    if level_order[target] <= level_order[current_level]:
        raise HTTPException(status_code=400, detail="Already at or above target level")

    # 가격 조회
    price = await listing_access_service.get_upgrade_price(db, current_level, target)

    # 업그레이드 적용 (실제로는 결제 확인 후 적용)
    # 여기서는 테스트를 위해 바로 적용
    access = await listing_access_service.upgrade_access(
        db, listing_id, current_user.id, target
    )

    return {
        "status": "success",
        "listing_id": str(listing_id),
        "previous_level": current_level.value,
        "new_level": access.access_level.value,
        "price": price,
        "message": f"정보 접근 레벨이 {access.access_level.value}로 업그레이드되었습니다."
    }


@router.get("/access/pricing")
async def get_access_pricing(
    db: AsyncSession = Depends(get_db)
):
    """정보 접근 레벨 가격표 조회"""
    pricing_list = await listing_access_service.get_all_pricing(db)

    # DB에 가격이 없으면 기본값 사용
    if not pricing_list:
        from ...models.listing_access import DEFAULT_PRICING
        return {
            "pricing": [
                {
                    "from_level": p["from_level"].value,
                    "to_level": p["to_level"].value,
                    "price": p["price"],
                    "description": f"{p['from_level'].value} → {p['to_level'].value}"
                }
                for p in DEFAULT_PRICING
            ]
        }

    return {
        "pricing": [
            {
                "from_level": p.from_level.value,
                "to_level": p.to_level.value,
                "price": p.price,
                "description": f"{p.from_level.value} → {p.to_level.value}"
            }
            for p in pricing_list
        ]
    }


@router.get("/my/access-history")
async def get_my_access_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """내 정보 열람 기록 조회"""
    from sqlalchemy import func

    # 전체 개수
    count_result = await db.execute(
        select(func.count(ListingAccessLevel.id)).where(
            ListingAccessLevel.user_id == current_user.id
        )
    )
    total = count_result.scalar()

    # 목록 조회
    result = await db.execute(
        select(ListingAccessLevel).where(
            ListingAccessLevel.user_id == current_user.id
        ).order_by(
            ListingAccessLevel.updated_at.desc()
        ).offset((page - 1) * page_size).limit(page_size)
    )
    access_list = result.scalars().all()

    items = []
    for access in access_list:
        listing = await pharmacy_match_service.get_listing(db, access.listing_id)
        items.append({
            "listing_id": str(access.listing_id),
            "listing_anonymous_id": listing.anonymous_id if listing else None,
            "listing_region": listing.region_name if listing else None,
            "access_level": access.access_level.value,
            "upgrade_amount": access.upgrade_amount,
            "granted_at": access.granted_at.isoformat() if access.granted_at else None,
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size
    }
