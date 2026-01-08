"""
약국 매물 정보 접근 레벨 관리 모델

3단계 정보 공개:
- MINIMAL: 지역, 약국 유형만 (무료)
- PARTIAL: + 권리금/매출/면적 범위 (5만원)
- FULL: + 정확한 주소, 연락처, 상세 매출 (10만원)
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Boolean, Index
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from ..core.database import Base


class AccessLevel(str, enum.Enum):
    """정보 접근 레벨"""
    MINIMAL = "MINIMAL"   # 기본 정보만 (무료)
    PARTIAL = "PARTIAL"   # 부분 정보 (5만원)
    FULL = "FULL"         # 전체 정보 (10만원)


class ListingAccessLevel(Base):
    """사용자별 매물 정보 접근 레벨"""
    __tablename__ = "listing_access_levels"

    id = Column(Integer, primary_key=True)
    listing_id = Column(UUID(as_uuid=True), ForeignKey("anonymous_listings.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    access_level = Column(SQLEnum(AccessLevel), default=AccessLevel.MINIMAL)
    granted_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)  # NULL이면 무제한

    # 결제 정보
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True)
    upgrade_amount = Column(Integer, nullable=True)  # 결제 금액

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    listing = relationship("AnonymousListing", backref="access_levels")
    user = relationship("User", backref="listing_access_levels")

    __table_args__ = (
        Index('ix_listing_access_listing_user', 'listing_id', 'user_id', unique=True),
    )

    def __repr__(self):
        return f"<ListingAccessLevel {self.listing_id} - {self.user_id} - {self.access_level}>"


class AccessPricing(Base):
    """정보 접근 레벨 업그레이드 가격 설정"""
    __tablename__ = "access_pricing"

    id = Column(Integer, primary_key=True)
    from_level = Column(SQLEnum(AccessLevel), nullable=False)
    to_level = Column(SQLEnum(AccessLevel), nullable=False)
    price = Column(Integer, nullable=False)  # 원 단위
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index('ix_access_pricing_levels', 'from_level', 'to_level', unique=True),
    )

    def __repr__(self):
        return f"<AccessPricing {self.from_level} -> {self.to_level}: {self.price}원>"


# 기본 가격 설정 (초기 데이터)
DEFAULT_PRICING = [
    {"from_level": AccessLevel.MINIMAL, "to_level": AccessLevel.PARTIAL, "price": 50000},
    {"from_level": AccessLevel.PARTIAL, "to_level": AccessLevel.FULL, "price": 100000},
    {"from_level": AccessLevel.MINIMAL, "to_level": AccessLevel.FULL, "price": 130000},
]


# 레벨별 공개 필드 정의
ACCESS_LEVEL_FIELDS = {
    AccessLevel.MINIMAL: [
        # 항상 공개되는 기본 정보
        "anonymous_id",
        "region_name",
        "pharmacy_type",
        "nearby_hospital_types",
        "has_auto_dispenser",
        "has_parking",
        "floor_info",
        "operation_years",
        "employee_count",
        "transfer_reason",
        "status",
        "created_at",
    ],
    AccessLevel.PARTIAL: [
        # MINIMAL + 재무 범위 정보
        "monthly_revenue_min",
        "monthly_revenue_max",
        "monthly_rx_count",
        "area_pyeong_min",
        "area_pyeong_max",
        "premium_min",
        "premium_max",
        "monthly_rent",
        "deposit",
        "description",
    ],
    AccessLevel.FULL: [
        # PARTIAL + 상세 정보 및 연락처
        "exact_address",
        "pharmacy_name",
        "owner_phone",
        "latitude",
        "longitude",
    ],
}
