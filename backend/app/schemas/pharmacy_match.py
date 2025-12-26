"""
익명 약국 매칭 시스템 Pydantic 스키마
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from enum import Enum


# ============================================================
# Enums (API용)
# ============================================================

class ListingStatus(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    MATCHED = "MATCHED"
    EXPIRED = "EXPIRED"
    WITHDRAWN = "WITHDRAWN"


class PharmacyType(str, Enum):
    GENERAL = "GENERAL"
    DISPENSING = "DISPENSING"
    ORIENTAL = "ORIENTAL"
    HOSPITAL = "HOSPITAL"


class TransferReason(str, Enum):
    RETIREMENT = "RETIREMENT"
    RELOCATION = "RELOCATION"
    HEALTH = "HEALTH"
    CAREER_CHANGE = "CAREER_CHANGE"
    FAMILY = "FAMILY"
    OTHER = "OTHER"


class InterestType(str, Enum):
    LISTING_TO_PHARMACIST = "L2P"
    PHARMACIST_TO_LISTING = "P2L"


class MatchStatus(str, Enum):
    PENDING = "PENDING"
    MUTUAL = "MUTUAL"
    CHATTING = "CHATTING"
    MEETING = "MEETING"
    CONTRACTED = "CONTRACTED"
    CANCELLED = "CANCELLED"


# ============================================================
# AnonymousListing Schemas
# ============================================================

class ListingBase(BaseModel):
    """매물 기본 정보"""
    region_code: str = Field(..., max_length=10, description="행정구역 코드")
    region_name: str = Field(..., max_length=100, description="지역명 (예: 서울시 강남구)")

    pharmacy_type: PharmacyType = PharmacyType.GENERAL
    nearby_hospital_types: List[str] = Field(default=[], description="인근 병원 진료과")

    # 매출 정보
    monthly_revenue_min: Optional[int] = Field(None, ge=0, description="월매출 최소 (원)")
    monthly_revenue_max: Optional[int] = Field(None, ge=0, description="월매출 최대 (원)")
    monthly_rx_count: Optional[int] = Field(None, ge=0, description="월 처방전 수")

    # 면적
    area_pyeong_min: Optional[float] = Field(None, ge=0)
    area_pyeong_max: Optional[float] = Field(None, ge=0)

    # 가격 (만원 단위)
    premium_min: Optional[int] = Field(None, ge=0, description="권리금 최소 (만원)")
    premium_max: Optional[int] = Field(None, ge=0, description="권리금 최대 (만원)")
    monthly_rent: Optional[int] = Field(None, ge=0, description="월 임대료 (만원)")
    deposit: Optional[int] = Field(None, ge=0, description="보증금 (만원)")

    # 약국 정보
    transfer_reason: Optional[TransferReason] = None
    operation_years: Optional[int] = Field(None, ge=0)
    employee_count: int = 0

    # 시설 정보
    has_auto_dispenser: bool = False
    has_parking: bool = False
    floor_info: Optional[str] = Field(None, max_length=50)

    description: Optional[str] = None


class ListingCreate(ListingBase):
    """매물 생성 요청"""
    # 비공개 정보 (필수)
    exact_address: str = Field(..., max_length=500, description="정확한 주소")
    pharmacy_name: Optional[str] = Field(None, max_length=200)
    owner_phone: Optional[str] = Field(None, max_length=20)
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class ListingUpdate(BaseModel):
    """매물 수정 요청"""
    pharmacy_type: Optional[PharmacyType] = None
    nearby_hospital_types: Optional[List[str]] = None

    monthly_revenue_min: Optional[int] = None
    monthly_revenue_max: Optional[int] = None
    monthly_rx_count: Optional[int] = None

    area_pyeong_min: Optional[float] = None
    area_pyeong_max: Optional[float] = None

    premium_min: Optional[int] = None
    premium_max: Optional[int] = None
    monthly_rent: Optional[int] = None
    deposit: Optional[int] = None

    transfer_reason: Optional[TransferReason] = None
    operation_years: Optional[int] = None
    employee_count: Optional[int] = None

    has_auto_dispenser: Optional[bool] = None
    has_parking: Optional[bool] = None
    floor_info: Optional[str] = None

    description: Optional[str] = None
    status: Optional[ListingStatus] = None


class ListingPublicResponse(BaseModel):
    """매물 공개 정보 응답 (익명)"""
    id: UUID
    anonymous_id: str

    region_code: str
    region_name: str

    pharmacy_type: PharmacyType
    nearby_hospital_types: List[str]

    monthly_revenue_min: Optional[int]
    monthly_revenue_max: Optional[int]
    monthly_rx_count: Optional[int]

    area_pyeong_min: Optional[float]
    area_pyeong_max: Optional[float]

    premium_min: Optional[int]
    premium_max: Optional[int]
    monthly_rent: Optional[int]
    deposit: Optional[int]

    transfer_reason: Optional[TransferReason]
    operation_years: Optional[int]
    employee_count: int

    has_auto_dispenser: bool
    has_parking: bool
    floor_info: Optional[str]

    description: Optional[str]

    status: ListingStatus
    view_count: int
    interest_count: int

    created_at: datetime

    class Config:
        from_attributes = True


class ListingPrivateResponse(ListingPublicResponse):
    """매물 비공개 정보 포함 응답 (매칭 후 또는 본인)"""
    exact_address: str
    pharmacy_name: Optional[str]
    owner_phone: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    expires_at: Optional[datetime]
    updated_at: datetime


class ListingListResponse(BaseModel):
    """매물 목록 응답"""
    items: List[ListingPublicResponse]
    total: int
    page: int
    page_size: int


# ============================================================
# PharmacistProfile Schemas
# ============================================================

class ProfileBase(BaseModel):
    """약사 프로필 기본 정보"""
    preferred_regions: List[str] = Field(default=[], description="희망 지역 코드")
    preferred_region_names: List[str] = Field(default=[], description="희망 지역명")

    # 예산 (만원)
    budget_min: Optional[int] = Field(None, ge=0)
    budget_max: Optional[int] = Field(None, ge=0)

    # 희망 면적 (평)
    preferred_area_min: Optional[float] = Field(None, ge=0)
    preferred_area_max: Optional[float] = Field(None, ge=0)

    # 희망 매출 (원)
    preferred_revenue_min: Optional[int] = Field(None, ge=0)
    preferred_revenue_max: Optional[int] = Field(None, ge=0)

    # 경력 정보
    experience_years: int = 0
    license_year: Optional[int] = None
    has_management_experience: bool = False

    # 선호 사항
    specialty_areas: List[str] = []
    preferred_pharmacy_types: List[str] = []
    preferred_hospital_types: List[str] = []

    introduction: Optional[str] = None


class ProfileCreate(ProfileBase):
    """프로필 생성 요청"""
    # 비공개 정보
    full_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=255)
    license_number: Optional[str] = Field(None, max_length=50)


class ProfileUpdate(BaseModel):
    """프로필 수정 요청"""
    preferred_regions: Optional[List[str]] = None
    preferred_region_names: Optional[List[str]] = None

    budget_min: Optional[int] = None
    budget_max: Optional[int] = None

    preferred_area_min: Optional[float] = None
    preferred_area_max: Optional[float] = None

    preferred_revenue_min: Optional[int] = None
    preferred_revenue_max: Optional[int] = None

    experience_years: Optional[int] = None
    license_year: Optional[int] = None
    has_management_experience: Optional[bool] = None

    specialty_areas: Optional[List[str]] = None
    preferred_pharmacy_types: Optional[List[str]] = None
    preferred_hospital_types: Optional[List[str]] = None

    introduction: Optional[str] = None
    is_active: Optional[bool] = None


class ProfilePublicResponse(BaseModel):
    """프로필 공개 정보 응답 (익명)"""
    id: UUID
    anonymous_id: str

    preferred_regions: List[str]
    preferred_region_names: List[str]

    budget_min: Optional[int]
    budget_max: Optional[int]

    preferred_area_min: Optional[float]
    preferred_area_max: Optional[float]

    preferred_revenue_min: Optional[int]
    preferred_revenue_max: Optional[int]

    experience_years: int
    license_year: Optional[int]
    has_management_experience: bool

    specialty_areas: List[str]
    preferred_pharmacy_types: List[str]
    preferred_hospital_types: List[str]

    introduction: Optional[str]

    is_active: bool
    last_active_at: datetime

    class Config:
        from_attributes = True


class ProfilePrivateResponse(ProfilePublicResponse):
    """프로필 비공개 정보 포함 응답 (매칭 후 또는 본인)"""
    full_name: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    license_number: Optional[str]
    created_at: datetime
    updated_at: datetime


class ProfileListResponse(BaseModel):
    """프로필 목록 응답"""
    items: List[ProfilePublicResponse]
    total: int
    page: int
    page_size: int


# ============================================================
# Interest Schemas
# ============================================================

class InterestCreate(BaseModel):
    """관심 표시 요청"""
    listing_id: Optional[UUID] = Field(None, description="매물 ID (약사가 관심 표시 시)")
    pharmacist_profile_id: Optional[UUID] = Field(None, description="프로필 ID (매물주가 관심 표시 시)")
    message: Optional[str] = Field(None, max_length=500)

    @field_validator('listing_id', 'pharmacist_profile_id')
    @classmethod
    def check_at_least_one(cls, v, info):
        return v


class InterestResponse(BaseModel):
    """관심 표시 응답"""
    id: UUID
    listing_id: UUID
    pharmacist_profile_id: UUID
    interest_type: InterestType
    message: Optional[str]
    created_at: datetime

    # 상대방 요약 정보
    target_anonymous_id: str
    target_summary: str

    class Config:
        from_attributes = True


class InterestListResponse(BaseModel):
    """관심 목록 응답"""
    sent: List[InterestResponse]
    received: List[InterestResponse]
    total_sent: int
    total_received: int


# ============================================================
# Match Schemas
# ============================================================

class MatchScoreBreakdown(BaseModel):
    """매칭 점수 상세"""
    region: float = Field(description="지역 매칭 (25점)")
    budget: float = Field(description="예산 매칭 (25점)")
    size: float = Field(description="규모 매칭 (15점)")
    revenue: float = Field(description="매출 기대치 (15점)")
    type: float = Field(description="약국 유형 (10점)")
    experience: float = Field(description="경력 적합도 (10점)")


class MatchResponse(BaseModel):
    """매칭 응답"""
    id: UUID
    listing_id: UUID
    pharmacist_profile_id: UUID

    status: MatchStatus
    match_score: Optional[float]
    match_score_breakdown: Optional[MatchScoreBreakdown]

    # 상대방 정보 (상태에 따라 다름)
    listing_info: ListingPublicResponse
    profile_info: ProfilePublicResponse

    # 매칭 성사 시 비공개 정보
    listing_private: Optional[ListingPrivateResponse] = None
    profile_private: Optional[ProfilePrivateResponse] = None

    # 타임라인
    contact_revealed_at: Optional[datetime]
    first_message_at: Optional[datetime]
    meeting_scheduled_at: Optional[datetime]
    contracted_at: Optional[datetime]

    # 수수료
    commission_rate: float
    commission_amount: Optional[int]

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MatchStatusUpdate(BaseModel):
    """매칭 상태 업데이트"""
    status: MatchStatus
    cancel_reason: Optional[str] = None
    meeting_scheduled_at: Optional[datetime] = None


class MatchListResponse(BaseModel):
    """매칭 목록 응답"""
    items: List[MatchResponse]
    total: int


# ============================================================
# Message Schemas
# ============================================================

class MessageCreate(BaseModel):
    """메시지 생성"""
    content: str = Field(..., min_length=1, max_length=2000)


class MessageResponse(BaseModel):
    """메시지 응답"""
    id: UUID
    match_id: UUID
    sender_id: UUID
    sender_anonymous_id: str
    content: str
    is_read: bool
    read_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class MessageListResponse(BaseModel):
    """메시지 목록 응답"""
    items: List[MessageResponse]
    total: int
    unread_count: int


# ============================================================
# Recommendation Schemas
# ============================================================

class RecommendationItem(BaseModel):
    """추천 항목"""
    listing: Optional[ListingPublicResponse] = None
    profile: Optional[ProfilePublicResponse] = None
    match_score: float
    match_score_breakdown: MatchScoreBreakdown
    recommendation_reason: str


class RecommendationResponse(BaseModel):
    """AI 추천 응답"""
    recommendations: List[RecommendationItem]
    total: int


# ============================================================
# Filter Schemas
# ============================================================

class ListingFilter(BaseModel):
    """매물 필터"""
    region_codes: Optional[List[str]] = None
    pharmacy_types: Optional[List[PharmacyType]] = None
    premium_min: Optional[int] = None
    premium_max: Optional[int] = None
    monthly_revenue_min: Optional[int] = None
    area_min: Optional[float] = None
    area_max: Optional[float] = None
    has_auto_dispenser: Optional[bool] = None
    has_parking: Optional[bool] = None
    status: Optional[ListingStatus] = ListingStatus.ACTIVE


class ProfileFilter(BaseModel):
    """프로필 필터"""
    region_codes: Optional[List[str]] = None
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    experience_years_min: Optional[int] = None
    has_management_experience: Optional[bool] = None
    is_active: bool = True
