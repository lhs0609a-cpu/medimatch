"""
약국 매물 정보 접근 레벨 서비스

3단계 정보 공개 관리:
- MINIMAL → PARTIAL → FULL
"""
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from ..models.listing_access import (
    ListingAccessLevel, AccessPricing, AccessLevel,
    ACCESS_LEVEL_FIELDS, DEFAULT_PRICING
)
from ..models.pharmacy_match import AnonymousListing


class ListingAccessService:
    """약국 매물 정보 접근 레벨 관리 서비스"""

    async def get_user_access_level(
        self,
        db: AsyncSession,
        listing_id: UUID,
        user_id: UUID
    ) -> AccessLevel:
        """사용자의 매물에 대한 접근 레벨 조회"""
        result = await db.execute(
            select(ListingAccessLevel).where(
                and_(
                    ListingAccessLevel.listing_id == listing_id,
                    ListingAccessLevel.user_id == user_id
                )
            )
        )
        access = result.scalar_one_or_none()

        if not access:
            return AccessLevel.MINIMAL

        # 만료 확인
        if access.expires_at and access.expires_at < datetime.utcnow():
            return AccessLevel.MINIMAL

        return access.access_level

    async def get_or_create_access(
        self,
        db: AsyncSession,
        listing_id: UUID,
        user_id: UUID
    ) -> ListingAccessLevel:
        """접근 레벨 조회 또는 생성"""
        result = await db.execute(
            select(ListingAccessLevel).where(
                and_(
                    ListingAccessLevel.listing_id == listing_id,
                    ListingAccessLevel.user_id == user_id
                )
            )
        )
        access = result.scalar_one_or_none()

        if not access:
            access = ListingAccessLevel(
                listing_id=listing_id,
                user_id=user_id,
                access_level=AccessLevel.MINIMAL
            )
            db.add(access)
            await db.commit()
            await db.refresh(access)

        return access

    async def upgrade_access(
        self,
        db: AsyncSession,
        listing_id: UUID,
        user_id: UUID,
        target_level: AccessLevel,
        payment_id: Optional[int] = None
    ) -> ListingAccessLevel:
        """접근 레벨 업그레이드"""
        access = await self.get_or_create_access(db, listing_id, user_id)

        # 현재 레벨 확인
        current_level = access.access_level

        # 다운그레이드 방지
        level_order = {AccessLevel.MINIMAL: 0, AccessLevel.PARTIAL: 1, AccessLevel.FULL: 2}
        if level_order[target_level] <= level_order[current_level]:
            return access

        # 업그레이드 가격 조회
        price = await self.get_upgrade_price(db, current_level, target_level)

        # 업그레이드 적용
        access.access_level = target_level
        access.granted_at = datetime.utcnow()
        access.payment_id = payment_id
        access.upgrade_amount = price
        access.updated_at = datetime.utcnow()

        await db.commit()
        await db.refresh(access)

        return access

    async def get_upgrade_price(
        self,
        db: AsyncSession,
        from_level: AccessLevel,
        to_level: AccessLevel
    ) -> int:
        """업그레이드 가격 조회"""
        result = await db.execute(
            select(AccessPricing).where(
                and_(
                    AccessPricing.from_level == from_level,
                    AccessPricing.to_level == to_level,
                    AccessPricing.is_active == True
                )
            )
        )
        pricing = result.scalar_one_or_none()

        if pricing:
            return pricing.price

        # 기본 가격 사용
        for default in DEFAULT_PRICING:
            if default["from_level"] == from_level and default["to_level"] == to_level:
                return default["price"]

        return 0

    async def get_all_pricing(self, db: AsyncSession) -> list:
        """모든 가격 정보 조회"""
        result = await db.execute(
            select(AccessPricing).where(AccessPricing.is_active == True)
        )
        return result.scalars().all()

    def filter_listing_by_access(
        self,
        listing: AnonymousListing,
        access_level: AccessLevel,
        is_owner: bool = False
    ) -> Dict[str, Any]:
        """접근 레벨에 따라 매물 정보 필터링"""
        if is_owner:
            # 소유자는 모든 정보 조회 가능
            return self._listing_to_dict(listing, include_all=True)

        # 레벨별 허용 필드 수집
        allowed_fields = set(ACCESS_LEVEL_FIELDS[AccessLevel.MINIMAL])

        if access_level in [AccessLevel.PARTIAL, AccessLevel.FULL]:
            allowed_fields.update(ACCESS_LEVEL_FIELDS[AccessLevel.PARTIAL])

        if access_level == AccessLevel.FULL:
            allowed_fields.update(ACCESS_LEVEL_FIELDS[AccessLevel.FULL])

        return self._listing_to_dict(listing, allowed_fields)

    def _listing_to_dict(
        self,
        listing: AnonymousListing,
        allowed_fields: set = None,
        include_all: bool = False
    ) -> Dict[str, Any]:
        """매물 객체를 딕셔너리로 변환"""
        all_fields = {
            "id": str(listing.id),
            "anonymous_id": listing.anonymous_id,
            "region_code": listing.region_code,
            "region_name": listing.region_name,
            "pharmacy_type": listing.pharmacy_type.value if listing.pharmacy_type else None,
            "nearby_hospital_types": listing.nearby_hospital_types,
            "monthly_revenue_min": listing.monthly_revenue_min,
            "monthly_revenue_max": listing.monthly_revenue_max,
            "monthly_rx_count": listing.monthly_rx_count,
            "area_pyeong_min": listing.area_pyeong_min,
            "area_pyeong_max": listing.area_pyeong_max,
            "premium_min": listing.premium_min,
            "premium_max": listing.premium_max,
            "monthly_rent": listing.monthly_rent,
            "deposit": listing.deposit,
            "transfer_reason": listing.transfer_reason.value if listing.transfer_reason else None,
            "operation_years": listing.operation_years,
            "employee_count": listing.employee_count,
            "has_auto_dispenser": listing.has_auto_dispenser,
            "has_parking": listing.has_parking,
            "floor_info": listing.floor_info,
            "description": listing.description,
            "exact_address": listing.exact_address,
            "pharmacy_name": listing.pharmacy_name,
            "owner_phone": listing.owner_phone,
            "latitude": listing.latitude,
            "longitude": listing.longitude,
            "status": listing.status.value if listing.status else None,
            "view_count": listing.view_count,
            "interest_count": listing.interest_count,
            "created_at": listing.created_at.isoformat() if listing.created_at else None,
            "updated_at": listing.updated_at.isoformat() if listing.updated_at else None,
        }

        if include_all:
            return all_fields

        # 허용된 필드만 반환
        result = {"id": str(listing.id)}  # ID는 항상 포함

        for field in allowed_fields:
            if field in all_fields:
                result[field] = all_fields[field]

        # 접근 불가 필드는 locked로 표시
        locked_fields = []
        all_possible_fields = set()
        for level_fields in ACCESS_LEVEL_FIELDS.values():
            all_possible_fields.update(level_fields)

        for field in all_possible_fields:
            if field not in allowed_fields and field in all_fields:
                locked_fields.append(field)

        if locked_fields:
            result["locked_fields"] = locked_fields

        return result

    async def check_owner_access(
        self,
        db: AsyncSession,
        listing_id: UUID,
        user_id: UUID
    ) -> bool:
        """매물 소유자인지 확인"""
        result = await db.execute(
            select(AnonymousListing).where(AnonymousListing.id == listing_id)
        )
        listing = result.scalar_one_or_none()

        if not listing:
            return False

        return listing.owner_id == user_id

    async def grant_full_access_on_match(
        self,
        db: AsyncSession,
        listing_id: UUID,
        user_id: UUID
    ) -> ListingAccessLevel:
        """매칭 성사 시 전체 접근 권한 부여 (무료)"""
        access = await self.get_or_create_access(db, listing_id, user_id)
        access.access_level = AccessLevel.FULL
        access.granted_at = datetime.utcnow()
        access.upgrade_amount = 0  # 매칭으로 인한 무료 업그레이드
        access.updated_at = datetime.utcnow()

        await db.commit()
        await db.refresh(access)

        return access


# 서비스 인스턴스
listing_access_service = ListingAccessService()
