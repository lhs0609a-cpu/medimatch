from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from enum import Enum


class RecommendationType(str, Enum):
    VERY_POSITIVE = "VERY_POSITIVE"
    POSITIVE = "POSITIVE"
    NEUTRAL = "NEUTRAL"
    NEGATIVE = "NEGATIVE"
    VERY_NEGATIVE = "VERY_NEGATIVE"


class SimulationRequest(BaseModel):
    """시뮬레이션 요청 스키마"""
    address: str = Field(..., max_length=500, description="상세 주소")
    clinic_type: str = Field(..., max_length=50, description="진료과목")
    size_pyeong: Optional[float] = Field(None, gt=0, description="면적(평)")
    budget_million: Optional[int] = Field(None, gt=0, description="예산(백만원)")


class CompetitorInfo(BaseModel):
    """경쟁 병원 정보"""
    name: str
    distance_m: int
    est_monthly_revenue: Optional[int] = None
    years_open: Optional[int] = None
    clinic_type: str
    address: Optional[str] = None


class EstimatedRevenue(BaseModel):
    """예상 매출"""
    min: int
    avg: int
    max: int


class EstimatedCost(BaseModel):
    """예상 비용"""
    rent: int
    labor: int
    utilities: int
    supplies: int
    other: int
    total: int


class Profitability(BaseModel):
    """수익성 분석"""
    monthly_profit_avg: int
    breakeven_months: int
    annual_roi_percent: float


class Competition(BaseModel):
    """경쟁 현황"""
    radius_m: int = 1000
    same_dept_count: int
    total_clinic_count: int


class Demographics(BaseModel):
    """인구통계"""
    population_1km: int
    age_40_plus_ratio: float
    floating_population_daily: int


class SimulationResponse(BaseModel):
    """시뮬레이션 결과 응답"""
    simulation_id: UUID
    address: str
    clinic_type: str
    size_pyeong: Optional[float] = None
    budget_million: Optional[int] = None

    estimated_monthly_revenue: EstimatedRevenue
    estimated_monthly_cost: EstimatedCost
    profitability: Profitability
    competition: Competition
    competitors: List[CompetitorInfo]
    demographics: Demographics

    confidence_score: int = Field(..., ge=0, le=100)
    recommendation: RecommendationType
    recommendation_reason: str
    ai_analysis: Optional[str] = None

    created_at: datetime

    class Config:
        from_attributes = True


class SimulationListResponse(BaseModel):
    """시뮬레이션 목록 응답"""
    items: List[SimulationResponse]
    total: int
    page: int
    page_size: int


class ReportPurchaseRequest(BaseModel):
    """리포트 구매 요청"""
    simulation_id: UUID
    payment_method: str = "card"  # card, kakao, naver, etc.


class ReportResponse(BaseModel):
    """리포트 응답"""
    id: UUID
    simulation_id: UUID
    payment_amount: int
    payment_status: str
    paid_at: Optional[datetime] = None
    pdf_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
