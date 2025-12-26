"""
익명 약국 매칭 서비스 (PharmMatch v2)
- 익명 매물 관리
- 약사 프로필 관리
- 관심 표시 및 매칭
- AI 기반 추천
"""
from typing import Optional, Dict, Any, List, Tuple
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, asc, func, and_, or_
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta
import logging

from ..models.pharmacy_match import (
    AnonymousListing, PharmacistProfile, Interest, Match, MatchMessage,
    ListingStatus, InterestType, MatchStatus,
    generate_anonymous_id, mask_personal_info
)
from ..models.user import User
from ..schemas.pharmacy_match import (
    ListingCreate, ListingUpdate, ListingFilter,
    ProfileCreate, ProfileUpdate, ProfileFilter,
    InterestCreate,
    MatchStatusUpdate, MatchScoreBreakdown,
    MessageCreate
)

logger = logging.getLogger(__name__)


class PharmacyMatchService:
    """익명 약국 매칭 서비스"""

    # ============================================================
    # 익명 매물 관리
    # ============================================================

    async def create_listing(
        self,
        db: AsyncSession,
        listing_data: ListingCreate,
        owner_id: UUID
    ) -> AnonymousListing:
        """익명 매물 등록"""

        # 익명 ID 생성
        anonymous_id = generate_anonymous_id("listing", listing_data.region_name)

        # 설명 마스킹
        description = mask_personal_info(listing_data.description) if listing_data.description else None

        listing = AnonymousListing(
            anonymous_id=anonymous_id,
            owner_id=owner_id,
            # 공개 정보
            region_code=listing_data.region_code,
            region_name=listing_data.region_name,
            pharmacy_type=listing_data.pharmacy_type,
            nearby_hospital_types=listing_data.nearby_hospital_types,
            monthly_revenue_min=listing_data.monthly_revenue_min,
            monthly_revenue_max=listing_data.monthly_revenue_max,
            monthly_rx_count=listing_data.monthly_rx_count,
            area_pyeong_min=listing_data.area_pyeong_min,
            area_pyeong_max=listing_data.area_pyeong_max,
            premium_min=listing_data.premium_min,
            premium_max=listing_data.premium_max,
            monthly_rent=listing_data.monthly_rent,
            deposit=listing_data.deposit,
            transfer_reason=listing_data.transfer_reason,
            operation_years=listing_data.operation_years,
            employee_count=listing_data.employee_count,
            has_auto_dispenser=listing_data.has_auto_dispenser,
            has_parking=listing_data.has_parking,
            floor_info=listing_data.floor_info,
            description=description,
            # 비공개 정보
            exact_address=listing_data.exact_address,
            pharmacy_name=listing_data.pharmacy_name,
            owner_phone=listing_data.owner_phone,
            latitude=listing_data.latitude,
            longitude=listing_data.longitude,
            # 상태
            status=ListingStatus.ACTIVE,
        )

        # 만료일 설정 (90일)
        listing.set_expiry(90)

        db.add(listing)
        await db.commit()
        await db.refresh(listing)

        logger.info(f"Created anonymous listing: {listing.anonymous_id}")
        return listing

    async def get_listings(
        self,
        db: AsyncSession,
        filters: Optional[ListingFilter] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        """매물 목록 조회"""
        query = select(AnonymousListing)

        if filters:
            if filters.status:
                query = query.where(AnonymousListing.status == filters.status)
            if filters.region_codes:
                query = query.where(AnonymousListing.region_code.in_(filters.region_codes))
            if filters.pharmacy_types:
                query = query.where(AnonymousListing.pharmacy_type.in_(filters.pharmacy_types))
            if filters.premium_min is not None:
                query = query.where(AnonymousListing.premium_max >= filters.premium_min)
            if filters.premium_max is not None:
                query = query.where(AnonymousListing.premium_min <= filters.premium_max)
            if filters.monthly_revenue_min is not None:
                query = query.where(AnonymousListing.monthly_revenue_max >= filters.monthly_revenue_min)
            if filters.area_min is not None:
                query = query.where(AnonymousListing.area_pyeong_max >= filters.area_min)
            if filters.area_max is not None:
                query = query.where(AnonymousListing.area_pyeong_min <= filters.area_max)
            if filters.has_auto_dispenser is not None:
                query = query.where(AnonymousListing.has_auto_dispenser == filters.has_auto_dispenser)
            if filters.has_parking is not None:
                query = query.where(AnonymousListing.has_parking == filters.has_parking)

        # Count
        count_query = select(func.count()).select_from(query.subquery())
        total = (await db.execute(count_query)).scalar() or 0

        # Paginate
        offset = (page - 1) * page_size
        query = query.order_by(desc(AnonymousListing.created_at)).offset(offset).limit(page_size)

        result = await db.execute(query)
        listings = result.scalars().all()

        return {
            "items": listings,
            "total": total,
            "page": page,
            "page_size": page_size
        }

    async def get_listing(
        self,
        db: AsyncSession,
        listing_id: UUID,
        increment_view: bool = True
    ) -> Optional[AnonymousListing]:
        """매물 상세 조회"""
        result = await db.execute(
            select(AnonymousListing).where(AnonymousListing.id == listing_id)
        )
        listing = result.scalar_one_or_none()

        if listing and increment_view:
            listing.view_count += 1
            await db.commit()

        return listing

    async def get_my_listings(
        self,
        db: AsyncSession,
        owner_id: UUID
    ) -> List[AnonymousListing]:
        """내 매물 목록"""
        result = await db.execute(
            select(AnonymousListing)
            .where(AnonymousListing.owner_id == owner_id)
            .order_by(desc(AnonymousListing.created_at))
        )
        return list(result.scalars().all())

    async def update_listing(
        self,
        db: AsyncSession,
        listing_id: UUID,
        owner_id: UUID,
        update_data: ListingUpdate
    ) -> Optional[AnonymousListing]:
        """매물 수정"""
        listing = await self.get_listing(db, listing_id, increment_view=False)
        if not listing or listing.owner_id != owner_id:
            return None

        update_dict = update_data.model_dump(exclude_unset=True)

        # 설명 마스킹
        if "description" in update_dict and update_dict["description"]:
            update_dict["description"] = mask_personal_info(update_dict["description"])

        for key, value in update_dict.items():
            setattr(listing, key, value)

        await db.commit()
        await db.refresh(listing)
        return listing

    async def delete_listing(
        self,
        db: AsyncSession,
        listing_id: UUID,
        owner_id: UUID
    ) -> bool:
        """매물 삭제 (철회)"""
        listing = await self.get_listing(db, listing_id, increment_view=False)
        if not listing or listing.owner_id != owner_id:
            return False

        listing.status = ListingStatus.WITHDRAWN
        await db.commit()
        return True

    # ============================================================
    # 약사 프로필 관리
    # ============================================================

    async def create_profile(
        self,
        db: AsyncSession,
        profile_data: ProfileCreate,
        user_id: UUID
    ) -> PharmacistProfile:
        """약사 프로필 생성"""

        # 기존 프로필 확인
        existing = await self.get_my_profile(db, user_id)
        if existing:
            raise ValueError("Profile already exists")

        anonymous_id = generate_anonymous_id("profile")
        introduction = mask_personal_info(profile_data.introduction) if profile_data.introduction else None

        profile = PharmacistProfile(
            user_id=user_id,
            anonymous_id=anonymous_id,
            # 공개 정보
            preferred_regions=profile_data.preferred_regions,
            preferred_region_names=profile_data.preferred_region_names,
            budget_min=profile_data.budget_min,
            budget_max=profile_data.budget_max,
            preferred_area_min=profile_data.preferred_area_min,
            preferred_area_max=profile_data.preferred_area_max,
            preferred_revenue_min=profile_data.preferred_revenue_min,
            preferred_revenue_max=profile_data.preferred_revenue_max,
            experience_years=profile_data.experience_years,
            license_year=profile_data.license_year,
            has_management_experience=profile_data.has_management_experience,
            specialty_areas=profile_data.specialty_areas,
            preferred_pharmacy_types=profile_data.preferred_pharmacy_types,
            preferred_hospital_types=profile_data.preferred_hospital_types,
            introduction=introduction,
            # 비공개 정보
            full_name=profile_data.full_name,
            phone=profile_data.phone,
            email=profile_data.email,
            license_number=profile_data.license_number,
        )

        db.add(profile)
        await db.commit()
        await db.refresh(profile)

        logger.info(f"Created pharmacist profile: {profile.anonymous_id}")
        return profile

    async def get_profiles(
        self,
        db: AsyncSession,
        filters: Optional[ProfileFilter] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        """프로필 목록 조회"""
        query = select(PharmacistProfile).where(PharmacistProfile.is_active == True)

        if filters:
            if filters.region_codes:
                query = query.where(
                    PharmacistProfile.preferred_regions.overlap(filters.region_codes)
                )
            if filters.budget_min is not None:
                query = query.where(PharmacistProfile.budget_max >= filters.budget_min)
            if filters.budget_max is not None:
                query = query.where(PharmacistProfile.budget_min <= filters.budget_max)
            if filters.experience_years_min is not None:
                query = query.where(PharmacistProfile.experience_years >= filters.experience_years_min)
            if filters.has_management_experience is not None:
                query = query.where(
                    PharmacistProfile.has_management_experience == filters.has_management_experience
                )

        count_query = select(func.count()).select_from(query.subquery())
        total = (await db.execute(count_query)).scalar() or 0

        offset = (page - 1) * page_size
        query = query.order_by(desc(PharmacistProfile.last_active_at)).offset(offset).limit(page_size)

        result = await db.execute(query)
        profiles = result.scalars().all()

        return {
            "items": profiles,
            "total": total,
            "page": page,
            "page_size": page_size
        }

    async def get_profile(
        self,
        db: AsyncSession,
        profile_id: UUID
    ) -> Optional[PharmacistProfile]:
        """프로필 조회"""
        result = await db.execute(
            select(PharmacistProfile).where(PharmacistProfile.id == profile_id)
        )
        return result.scalar_one_or_none()

    async def get_my_profile(
        self,
        db: AsyncSession,
        user_id: UUID
    ) -> Optional[PharmacistProfile]:
        """내 프로필 조회"""
        result = await db.execute(
            select(PharmacistProfile).where(PharmacistProfile.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def update_profile(
        self,
        db: AsyncSession,
        user_id: UUID,
        update_data: ProfileUpdate
    ) -> Optional[PharmacistProfile]:
        """프로필 수정"""
        profile = await self.get_my_profile(db, user_id)
        if not profile:
            return None

        update_dict = update_data.model_dump(exclude_unset=True)

        if "introduction" in update_dict and update_dict["introduction"]:
            update_dict["introduction"] = mask_personal_info(update_dict["introduction"])

        for key, value in update_dict.items():
            setattr(profile, key, value)

        profile.last_active_at = datetime.utcnow()
        await db.commit()
        await db.refresh(profile)
        return profile

    # ============================================================
    # 관심 표시 및 매칭
    # ============================================================

    async def express_interest(
        self,
        db: AsyncSession,
        user_id: UUID,
        interest_data: InterestCreate
    ) -> Tuple[Interest, Optional[Match]]:
        """관심 표시 (상호 매칭 시 Match 생성)"""

        # 약사 → 매물
        if interest_data.listing_id:
            listing = await self.get_listing(db, interest_data.listing_id, increment_view=False)
            if not listing or listing.status != ListingStatus.ACTIVE:
                raise ValueError("Invalid or inactive listing")

            profile = await self.get_my_profile(db, user_id)
            if not profile:
                raise ValueError("Profile required to express interest")

            # 자기 매물에 관심 표시 방지
            if listing.owner_id == user_id:
                raise ValueError("Cannot express interest in your own listing")

            interest_type = InterestType.PHARMACIST_TO_LISTING
            listing_id = listing.id
            profile_id = profile.id

        # 매물주 → 약사
        elif interest_data.pharmacist_profile_id:
            profile = await self.get_profile(db, interest_data.pharmacist_profile_id)
            if not profile or not profile.is_active:
                raise ValueError("Invalid or inactive profile")

            # 본인 소유 매물 확인
            my_listings = await self.get_my_listings(db, user_id)
            if not my_listings:
                raise ValueError("You need to have a listing to express interest")

            # 활성 매물이 있는지 확인
            active_listings = [l for l in my_listings if l.status == ListingStatus.ACTIVE]
            if not active_listings:
                raise ValueError("You need an active listing")

            # 자기 프로필에 관심 표시 방지
            if profile.user_id == user_id:
                raise ValueError("Cannot express interest in yourself")

            interest_type = InterestType.LISTING_TO_PHARMACIST
            listing_id = active_listings[0].id  # 첫 번째 활성 매물
            profile_id = profile.id

        else:
            raise ValueError("Either listing_id or pharmacist_profile_id required")

        # 중복 관심 표시 확인
        existing = await db.execute(
            select(Interest).where(
                Interest.listing_id == listing_id,
                Interest.pharmacist_profile_id == profile_id,
                Interest.interest_type == interest_type
            )
        )
        if existing.scalar_one_or_none():
            raise ValueError("Already expressed interest")

        # 관심 표시 생성
        interest = Interest(
            listing_id=listing_id,
            pharmacist_profile_id=profile_id,
            interest_type=interest_type,
            expressed_by=user_id,
            message=interest_data.message
        )

        db.add(interest)

        # 매물의 관심 카운트 증가
        listing_obj = await self.get_listing(db, listing_id, increment_view=False)
        if listing_obj:
            listing_obj.interest_count += 1

        # 상호 관심 확인 → 매칭 생성
        match = await self._check_and_create_match(db, listing_id, profile_id, interest)

        await db.commit()
        await db.refresh(interest)

        if match:
            await db.refresh(match)
            logger.info(f"Mutual match created: {match.id}")

        return interest, match

    async def _check_and_create_match(
        self,
        db: AsyncSession,
        listing_id: UUID,
        profile_id: UUID,
        new_interest: Interest
    ) -> Optional[Match]:
        """상호 관심 확인 및 매칭 생성"""

        # 반대 방향 관심 표시 확인
        opposite_type = (
            InterestType.LISTING_TO_PHARMACIST
            if new_interest.interest_type == InterestType.PHARMACIST_TO_LISTING
            else InterestType.PHARMACIST_TO_LISTING
        )

        result = await db.execute(
            select(Interest).where(
                Interest.listing_id == listing_id,
                Interest.pharmacist_profile_id == profile_id,
                Interest.interest_type == opposite_type
            )
        )
        opposite_interest = result.scalar_one_or_none()

        if not opposite_interest:
            return None

        # 이미 매칭이 있는지 확인
        existing_match = await db.execute(
            select(Match).where(
                Match.listing_id == listing_id,
                Match.pharmacist_profile_id == profile_id
            )
        )
        if existing_match.scalar_one_or_none():
            return None

        # 매칭 점수 계산
        listing = await self.get_listing(db, listing_id, increment_view=False)
        profile = await self.get_profile(db, profile_id)
        score, breakdown = await self.calculate_match_score(listing, profile)

        # 매칭 생성
        if new_interest.interest_type == InterestType.PHARMACIST_TO_LISTING:
            pharmacist_interest_id = new_interest.id
            listing_interest_id = opposite_interest.id
        else:
            listing_interest_id = new_interest.id
            pharmacist_interest_id = opposite_interest.id

        match = Match(
            listing_id=listing_id,
            pharmacist_profile_id=profile_id,
            listing_interest_id=listing_interest_id,
            pharmacist_interest_id=pharmacist_interest_id,
            status=MatchStatus.MUTUAL,
            match_score=score,
            match_score_breakdown=breakdown,
            contact_revealed_at=datetime.utcnow()
        )

        # 수수료 계산
        if listing and listing.premium_max:
            match.calculate_commission(listing.premium_max)

        db.add(match)
        return match

    async def get_interests(
        self,
        db: AsyncSession,
        user_id: UUID
    ) -> Dict[str, Any]:
        """내 관심 표시 목록 (보낸 것 + 받은 것)"""

        # 내 프로필
        my_profile = await self.get_my_profile(db, user_id)

        # 내 매물들
        my_listings = await self.get_my_listings(db, user_id)
        my_listing_ids = [l.id for l in my_listings]

        # 보낸 관심
        sent_query = select(Interest).where(Interest.expressed_by == user_id)
        sent_result = await db.execute(sent_query)
        sent = list(sent_result.scalars().all())

        # 받은 관심
        received = []

        # 내 매물에 온 관심 (약사 → 내 매물)
        if my_listing_ids:
            listing_interests = await db.execute(
                select(Interest).where(
                    Interest.listing_id.in_(my_listing_ids),
                    Interest.expressed_by != user_id
                )
            )
            received.extend(listing_interests.scalars().all())

        # 내 프로필에 온 관심 (매물주 → 나)
        if my_profile:
            profile_interests = await db.execute(
                select(Interest).where(
                    Interest.pharmacist_profile_id == my_profile.id,
                    Interest.expressed_by != user_id
                )
            )
            received.extend(profile_interests.scalars().all())

        return {
            "sent": sent,
            "received": received,
            "total_sent": len(sent),
            "total_received": len(received)
        }

    async def cancel_interest(
        self,
        db: AsyncSession,
        interest_id: UUID,
        user_id: UUID
    ) -> bool:
        """관심 표시 취소"""
        result = await db.execute(
            select(Interest).where(
                Interest.id == interest_id,
                Interest.expressed_by == user_id
            )
        )
        interest = result.scalar_one_or_none()
        if not interest:
            return False

        await db.delete(interest)
        await db.commit()
        return True

    # ============================================================
    # 매칭 관리
    # ============================================================

    async def get_matches(
        self,
        db: AsyncSession,
        user_id: UUID
    ) -> List[Match]:
        """내 매칭 목록"""
        my_profile = await self.get_my_profile(db, user_id)
        my_listings = await self.get_my_listings(db, user_id)
        my_listing_ids = [l.id for l in my_listings]

        conditions = []
        if my_profile:
            conditions.append(Match.pharmacist_profile_id == my_profile.id)
        if my_listing_ids:
            conditions.append(Match.listing_id.in_(my_listing_ids))

        if not conditions:
            return []

        result = await db.execute(
            select(Match)
            .options(
                selectinload(Match.listing),
                selectinload(Match.pharmacist_profile)
            )
            .where(or_(*conditions))
            .order_by(desc(Match.created_at))
        )
        return list(result.scalars().all())

    async def get_match(
        self,
        db: AsyncSession,
        match_id: UUID,
        user_id: UUID
    ) -> Optional[Match]:
        """매칭 상세 조회"""
        my_profile = await self.get_my_profile(db, user_id)
        my_listings = await self.get_my_listings(db, user_id)
        my_listing_ids = [l.id for l in my_listings]

        result = await db.execute(
            select(Match)
            .options(
                selectinload(Match.listing),
                selectinload(Match.pharmacist_profile),
                selectinload(Match.messages)
            )
            .where(Match.id == match_id)
        )
        match = result.scalar_one_or_none()

        if not match:
            return None

        # 권한 확인
        is_owner = (
            (my_profile and match.pharmacist_profile_id == my_profile.id) or
            (match.listing_id in my_listing_ids)
        )
        if not is_owner:
            return None

        return match

    async def update_match_status(
        self,
        db: AsyncSession,
        match_id: UUID,
        user_id: UUID,
        status_update: MatchStatusUpdate
    ) -> Optional[Match]:
        """매칭 상태 업데이트"""
        match = await self.get_match(db, match_id, user_id)
        if not match:
            return None

        match.status = status_update.status

        if status_update.status == MatchStatus.CANCELLED:
            match.cancelled_at = datetime.utcnow()
            match.cancel_reason = status_update.cancel_reason

        if status_update.status == MatchStatus.MEETING:
            match.meeting_scheduled_at = status_update.meeting_scheduled_at or datetime.utcnow()

        if status_update.status == MatchStatus.CONTRACTED:
            match.contracted_at = datetime.utcnow()
            # 매물 상태 변경
            listing = await self.get_listing(db, match.listing_id, increment_view=False)
            if listing:
                listing.status = ListingStatus.MATCHED

        await db.commit()
        await db.refresh(match)
        return match

    # ============================================================
    # 메시지
    # ============================================================

    async def send_message(
        self,
        db: AsyncSession,
        match_id: UUID,
        user_id: UUID,
        message_data: MessageCreate
    ) -> Optional[MatchMessage]:
        """메시지 전송"""
        match = await self.get_match(db, match_id, user_id)
        if not match:
            return None

        # 매칭 상태 확인 (MUTUAL 이상만 메시지 가능)
        if match.status not in [MatchStatus.MUTUAL, MatchStatus.CHATTING, MatchStatus.MEETING]:
            raise ValueError("Cannot send message in current match status")

        message = MatchMessage(
            match_id=match_id,
            sender_id=user_id,
            content=message_data.content
        )

        db.add(message)

        # 첫 메시지면 상태 업데이트
        if not match.first_message_at:
            match.first_message_at = datetime.utcnow()
            match.status = MatchStatus.CHATTING

        await db.commit()
        await db.refresh(message)
        return message

    async def get_messages(
        self,
        db: AsyncSession,
        match_id: UUID,
        user_id: UUID,
        page: int = 1,
        page_size: int = 50
    ) -> Dict[str, Any]:
        """메시지 목록 조회"""
        match = await self.get_match(db, match_id, user_id)
        if not match:
            return {"items": [], "total": 0, "unread_count": 0}

        # 메시지 조회
        query = (
            select(MatchMessage)
            .where(MatchMessage.match_id == match_id)
            .order_by(desc(MatchMessage.created_at))
        )

        count_query = select(func.count()).select_from(query.subquery())
        total = (await db.execute(count_query)).scalar() or 0

        offset = (page - 1) * page_size
        result = await db.execute(query.offset(offset).limit(page_size))
        messages = list(result.scalars().all())

        # 읽지 않은 메시지 수
        unread_query = select(func.count()).where(
            MatchMessage.match_id == match_id,
            MatchMessage.sender_id != user_id,
            MatchMessage.is_read == False
        )
        unread_count = (await db.execute(unread_query)).scalar() or 0

        # 읽음 처리
        await db.execute(
            select(MatchMessage).where(
                MatchMessage.match_id == match_id,
                MatchMessage.sender_id != user_id,
                MatchMessage.is_read == False
            )
        )
        unread_result = await db.execute(
            select(MatchMessage).where(
                MatchMessage.match_id == match_id,
                MatchMessage.sender_id != user_id,
                MatchMessage.is_read == False
            )
        )
        for msg in unread_result.scalars().all():
            msg.is_read = True
            msg.read_at = datetime.utcnow()

        await db.commit()

        return {
            "items": messages,
            "total": total,
            "unread_count": unread_count
        }

    # ============================================================
    # AI 추천 및 매칭 점수
    # ============================================================

    async def calculate_match_score(
        self,
        listing: AnonymousListing,
        profile: PharmacistProfile
    ) -> Tuple[float, Dict[str, float]]:
        """매칭 점수 계산"""

        breakdown = {
            "region": 0.0,
            "budget": 0.0,
            "size": 0.0,
            "revenue": 0.0,
            "type": 0.0,
            "experience": 0.0
        }

        # 1. 지역 매칭 (25점)
        if listing.region_code in profile.preferred_regions:
            breakdown["region"] = 25.0
        elif profile.preferred_regions:
            # 인접 지역 부분 점수
            for region in profile.preferred_regions:
                if listing.region_code[:2] == region[:2]:  # 같은 시/도
                    breakdown["region"] = 15.0
                    break

        # 2. 예산 매칭 (25점)
        if listing.premium_max and listing.deposit:
            total_cost = listing.premium_max + listing.deposit
            if profile.budget_min and profile.budget_max:
                if profile.budget_min <= total_cost <= profile.budget_max:
                    breakdown["budget"] = 25.0
                elif total_cost < profile.budget_min:
                    breakdown["budget"] = 20.0  # 예산 이하
                else:
                    over_ratio = (total_cost - profile.budget_max) / profile.budget_max
                    breakdown["budget"] = max(0, 25 - (over_ratio * 50))

        # 3. 규모 매칭 (15점)
        if listing.area_pyeong_min and listing.area_pyeong_max:
            listing_avg = (listing.area_pyeong_min + listing.area_pyeong_max) / 2
            if profile.preferred_area_min and profile.preferred_area_max:
                if profile.preferred_area_min <= listing_avg <= profile.preferred_area_max:
                    breakdown["size"] = 15.0
                else:
                    diff = min(
                        abs(listing_avg - profile.preferred_area_min),
                        abs(listing_avg - profile.preferred_area_max)
                    )
                    breakdown["size"] = max(0, 15 - diff)

        # 4. 매출 기대치 (15점)
        if listing.monthly_revenue_min and listing.monthly_revenue_max:
            listing_revenue = (listing.monthly_revenue_min + listing.monthly_revenue_max) / 2
            if profile.preferred_revenue_min and profile.preferred_revenue_max:
                if profile.preferred_revenue_min <= listing_revenue <= profile.preferred_revenue_max:
                    breakdown["revenue"] = 15.0
                elif listing_revenue > profile.preferred_revenue_max:
                    breakdown["revenue"] = 12.0  # 예상보다 높은 매출

        # 5. 약국 유형 매칭 (10점)
        if listing.pharmacy_type and profile.preferred_pharmacy_types:
            if listing.pharmacy_type.value in profile.preferred_pharmacy_types:
                breakdown["type"] = 10.0

        # 6. 경력 적합도 (10점)
        # 운영 경험이 있거나 경력이 3년 이상이면
        if profile.has_management_experience:
            breakdown["experience"] = 10.0
        elif profile.experience_years >= 5:
            breakdown["experience"] = 8.0
        elif profile.experience_years >= 3:
            breakdown["experience"] = 6.0
        elif profile.experience_years >= 1:
            breakdown["experience"] = 4.0

        total = sum(breakdown.values())
        return total, breakdown

    async def get_recommendations(
        self,
        db: AsyncSession,
        user_id: UUID,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """AI 추천 목록"""

        recommendations = []
        my_profile = await self.get_my_profile(db, user_id)
        my_listings = await self.get_my_listings(db, user_id)

        # 약사인 경우: 매물 추천
        if my_profile:
            listings_result = await db.execute(
                select(AnonymousListing)
                .where(
                    AnonymousListing.status == ListingStatus.ACTIVE,
                    AnonymousListing.owner_id != user_id
                )
                .limit(50)
            )
            listings = listings_result.scalars().all()

            for listing in listings:
                score, breakdown = await self.calculate_match_score(listing, my_profile)
                if score >= 30:  # 최소 30점 이상만
                    recommendations.append({
                        "listing": listing,
                        "profile": None,
                        "match_score": score,
                        "match_score_breakdown": breakdown,
                        "recommendation_reason": self._get_recommendation_reason(breakdown)
                    })

        # 매물주인 경우: 약사 추천
        if my_listings:
            active_listing = next((l for l in my_listings if l.status == ListingStatus.ACTIVE), None)
            if active_listing:
                profiles_result = await db.execute(
                    select(PharmacistProfile)
                    .where(
                        PharmacistProfile.is_active == True,
                        PharmacistProfile.user_id != user_id
                    )
                    .limit(50)
                )
                profiles = profiles_result.scalars().all()

                for profile in profiles:
                    score, breakdown = await self.calculate_match_score(active_listing, profile)
                    if score >= 30:
                        recommendations.append({
                            "listing": None,
                            "profile": profile,
                            "match_score": score,
                            "match_score_breakdown": breakdown,
                            "recommendation_reason": self._get_recommendation_reason(breakdown)
                        })

        # 점수순 정렬
        recommendations.sort(key=lambda x: x["match_score"], reverse=True)
        return recommendations[:limit]

    def _get_recommendation_reason(self, breakdown: Dict[str, float]) -> str:
        """추천 이유 생성"""
        reasons = []
        if breakdown["region"] >= 20:
            reasons.append("희망 지역 일치")
        if breakdown["budget"] >= 20:
            reasons.append("예산 적합")
        if breakdown["revenue"] >= 12:
            reasons.append("매출 기대치 충족")
        if breakdown["experience"] >= 8:
            reasons.append("충분한 경력")

        if not reasons:
            reasons.append("조건 부분 일치")

        return ", ".join(reasons)


# 싱글톤 인스턴스
pharmacy_match_service = PharmacyMatchService()
