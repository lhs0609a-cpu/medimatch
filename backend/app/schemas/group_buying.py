from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID
from enum import Enum


class CohortStatus(str, Enum):
    RECRUITING = "recruiting"
    CLOSED = "closed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ParticipantStatus(str, Enum):
    ACTIVE = "active"
    CANCELLED = "cancelled"
    CONTRACTED = "contracted"


# ============ Category Schemas ============

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    base_discount_rate: float = 0
    market_avg_price_per_pyeong: Optional[int] = None


class CategoryResponse(CategoryBase):
    id: UUID
    display_order: int
    is_active: bool

    class Config:
        from_attributes = True


class CategoryWithDiscount(CategoryResponse):
    """코호트별 실제 할인율 포함"""
    current_discount_rate: Optional[float] = None


# ============ Vendor Schemas ============

class VendorBase(BaseModel):
    name: str
    description: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None


class VendorResponse(VendorBase):
    id: UUID
    category_id: UUID
    rating: float
    review_count: int
    is_verified: bool
    logo_url: Optional[str] = None
    website_url: Optional[str] = None
    features: Optional[List[str]] = None

    class Config:
        from_attributes = True


class CohortVendorResponse(BaseModel):
    """코호트에 참여한 업체 정보"""
    id: UUID
    vendor: VendorResponse
    category_id: UUID
    discount_rate: Optional[float] = None
    is_selected: bool
    selection_rank: Optional[int] = None

    class Config:
        from_attributes = True


# ============ Cohort Schemas ============

class CohortBase(BaseModel):
    name: str
    target_month: date
    min_participants: int = 30
    max_participants: int = 50
    deadline: datetime
    description: Optional[str] = None


class CohortCreate(CohortBase):
    pass


class CohortSummary(BaseModel):
    """코호트 요약 정보 (목록용)"""
    id: UUID
    name: str
    target_month: date
    status: CohortStatus
    participant_count: int
    max_participants: int
    deadline: datetime
    categories: List[CategoryWithDiscount]
    estimated_avg_savings: int
    days_remaining: int

    class Config:
        from_attributes = True


class CohortDetail(CohortSummary):
    """코호트 상세 정보"""
    min_participants: int
    description: Optional[str] = None
    vendors_by_category: dict  # category_id -> List[CohortVendorResponse]
    created_at: datetime

    class Config:
        from_attributes = True


class CohortStats(BaseModel):
    """코호트 통계"""
    participant_count: int
    progress_percent: float
    total_estimated_savings: int
    avg_savings_per_participant: int
    categories_breakdown: List[dict]


# ============ Participant Schemas ============

class ParticipantJoinRequest(BaseModel):
    """참여 신청 요청"""
    opening_date: date = Field(..., description="개원 예정일")
    region: str = Field(..., max_length=50, description="시/도")
    district: str = Field(..., max_length=50, description="구/군")
    specialty: str = Field(..., max_length=50, description="진료과목")
    size_pyeong: int = Field(..., gt=0, description="평수")
    category_ids: List[UUID] = Field(..., min_length=1, description="관심 카테고리 ID 목록")


class ParticipantUpdateRequest(BaseModel):
    """참여 정보 수정 요청"""
    opening_date: Optional[date] = None
    region: Optional[str] = None
    district: Optional[str] = None
    specialty: Optional[str] = None
    size_pyeong: Optional[int] = None
    category_ids: Optional[List[UUID]] = None


class ParticipantResponse(BaseModel):
    """참여자 정보"""
    id: UUID
    cohort_id: UUID
    user_id: UUID
    opening_date: date
    region: str
    district: str
    specialty: str
    size_pyeong: int
    status: ParticipantStatus
    estimated_savings: Optional[int] = None
    categories: List[CategoryResponse]
    created_at: datetime

    class Config:
        from_attributes = True


class MyParticipationResponse(ParticipantResponse):
    """내 참여 정보 (코호트 정보 포함)"""
    cohort: CohortSummary


class JoinCohortResponse(BaseModel):
    """참여 신청 응답"""
    participation_id: UUID
    cohort_id: UUID
    status: ParticipantStatus
    estimated_savings: int
    message: str


# ============ Calculator Schemas ============

class SavingsCalculatorRequest(BaseModel):
    """절감액 계산 요청"""
    cohort_id: Optional[UUID] = None
    specialty: str
    size_pyeong: int
    category_ids: List[UUID]


class CategorySavingsBreakdown(BaseModel):
    """카테고리별 절감액 상세"""
    category_id: UUID
    category_name: str
    original: int
    discounted: int
    savings: int
    discount_rate: float


class SavingsCalculatorResponse(BaseModel):
    """절감액 계산 응답"""
    original_estimate: int
    discounted_estimate: int
    total_savings: int
    breakdown: List[CategorySavingsBreakdown]


# ============ Stats Schemas ============

class TotalStatsResponse(BaseModel):
    """전체 통계"""
    total_participants: int
    total_savings: int
    total_cohorts_completed: int
    avg_savings_per_participant: int


class CohortListResponse(BaseModel):
    """코호트 목록 응답"""
    cohorts: List[CohortSummary]
    total: int
    page: int
    limit: int


class MyParticipationsResponse(BaseModel):
    """내 참여 목록 응답"""
    participations: List[MyParticipationResponse]
    total: int
