from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from uuid import UUID
from enum import Enum


class RecommendationType(str, Enum):
    VERY_POSITIVE = "VERY_POSITIVE"
    POSITIVE = "POSITIVE"
    NEUTRAL = "NEUTRAL"
    NEGATIVE = "NEGATIVE"
    VERY_NEGATIVE = "VERY_NEGATIVE"


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class SimulationRequest(BaseModel):
    """시뮬레이션 요청 스키마"""
    address: Optional[str] = Field(None, max_length=500, description="상세 주소 (좌표 없을 때 사용)")
    latitude: Optional[float] = Field(None, ge=33.0, le=39.0, description="위도 (지도 클릭)")
    longitude: Optional[float] = Field(None, ge=124.0, le=132.0, description="경도 (지도 클릭)")
    radius_m: Optional[int] = Field(1000, ge=300, le=5000, description="상권 분석 반경(m)")
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
    specialty_detail: Optional[str] = None  # 세부 전문 분야
    rating: Optional[float] = None  # 평점
    review_count: Optional[int] = None  # 리뷰 수


class EstimatedRevenue(BaseModel):
    """예상 매출"""
    min: int
    avg: int
    max: int


class RevenueDetail(BaseModel):
    """상세 매출 분석"""
    daily_patients_min: int = 0  # 일일 최소 환자 수
    daily_patients_avg: int = 0  # 일일 평균 환자 수
    daily_patients_max: int = 0  # 일일 최대 환자 수
    avg_treatment_fee: int = 0  # 평균 진료비
    insurance_ratio: float = 0.7  # 보험 비율
    non_insurance_ratio: float = 0.3  # 비보험 비율
    new_patient_ratio: float = 0.3  # 초진 비율
    return_patient_ratio: float = 0.7  # 재진 비율
    avg_visits_per_patient: float = 2.5  # 환자당 평균 방문 횟수
    seasonal_factor: Dict[str, float] = {}  # 계절별 변동 {"spring": 1.0, "summer": 0.9, "fall": 1.1, "winter": 1.2}


class EstimatedCost(BaseModel):
    """예상 비용"""
    rent: int
    labor: int
    utilities: int
    supplies: int
    other: int
    total: int


class CostDetail(BaseModel):
    """상세 비용 분석"""
    # 임대료 상세
    rent_deposit: int = 0  # 보증금
    rent_monthly: int = 0  # 월세
    maintenance_fee: int = 0  # 관리비

    # 인건비 상세
    doctor_count: int = 1  # 의사 수
    nurse_count: int = 2  # 간호사 수
    admin_count: int = 1  # 행정직원 수
    avg_nurse_salary: int = 3500000  # 간호사 평균 급여
    avg_admin_salary: int = 2800000  # 행정직원 평균 급여

    # 기타 비용
    equipment_monthly: int = 0  # 장비 리스/감가상각
    marketing_monthly: int = 0  # 마케팅 비용
    insurance_monthly: int = 0  # 보험료
    supplies_monthly: int = 0  # 소모품/재료비
    utilities_monthly: int = 0  # 공과금

    # 초기 투자
    initial_equipment: int = 0  # 초기 장비 비용
    initial_interior: int = 0  # 인테리어 비용
    initial_other: int = 0  # 기타 초기 비용


class Profitability(BaseModel):
    """수익성 분석"""
    monthly_profit_avg: int
    breakeven_months: int
    annual_roi_percent: float


class ProfitabilityDetail(BaseModel):
    """상세 수익성 분석"""
    monthly_profit_min: int = 0
    monthly_profit_avg: int = 0
    monthly_profit_max: int = 0
    annual_profit_estimate: int = 0  # 연간 예상 수익
    profit_margin_percent: float = 0  # 순이익률
    operating_margin_percent: float = 0  # 영업이익률

    # 투자 대비 분석
    total_investment: int = 0  # 총 투자금
    payback_months: int = 0  # 투자금 회수 기간
    irr_percent: float = 0  # 내부수익률
    npv_3years: int = 0  # 3년 순현재가치


class Competition(BaseModel):
    """경쟁 현황"""
    radius_m: int = 1000
    same_dept_count: int
    total_clinic_count: int


class CompetitionDetail(BaseModel):
    """상세 경쟁 분석"""
    radius_m: int = 1000
    same_dept_count: int = 0
    similar_dept_count: int = 0  # 유사 진료과
    total_clinic_count: int = 0
    hospital_count: int = 0  # 종합병원/병원

    # 경쟁 강도
    competition_index: float = 0  # 경쟁 강도 지수 (0-100)
    competition_level: str = "MEDIUM"  # LOW, MEDIUM, HIGH, VERY_HIGH
    market_saturation: float = 0  # 시장 포화도 (%)

    # 점유율 예측
    estimated_market_share: float = 0  # 예상 시장 점유율
    potential_patients_monthly: int = 0  # 잠재 환자 수

    # 근접 경쟁
    nearest_same_dept_distance: int = 0  # 가장 가까운 동일 진료과 거리
    avg_distance_same_dept: int = 0  # 동일 진료과 평균 거리


class Demographics(BaseModel):
    """인구통계"""
    population_1km: int
    age_40_plus_ratio: float
    floating_population_daily: int


class DemographicsDetail(BaseModel):
    """상세 인구통계"""
    # 거리별 인구
    population_500m: int = 0
    population_1km: int = 0
    population_3km: int = 0

    # 연령대별 분포
    age_0_9: float = 0
    age_10_19: float = 0
    age_20_29: float = 0
    age_30_39: float = 0
    age_40_49: float = 0
    age_50_59: float = 0
    age_60_plus: float = 0

    # 성별
    male_ratio: float = 0.5
    female_ratio: float = 0.5

    # 가구 특성
    single_household_ratio: float = 0  # 1인 가구 비율
    family_household_ratio: float = 0  # 가족 가구 비율
    avg_household_income: int = 0  # 평균 가구 소득 (만원)

    # 유동인구
    floating_population_daily: int = 0
    floating_peak_hour: str = ""  # 피크 시간대
    floating_weekday_avg: int = 0  # 평일 평균
    floating_weekend_avg: int = 0  # 주말 평균

    # 의료 이용 패턴
    medical_utilization_rate: float = 0  # 의료 이용률
    avg_annual_visits: float = 0  # 연간 평균 의료기관 방문 횟수


class LocationAnalysis(BaseModel):
    """입지 분석"""
    # 대중교통
    subway_stations: List[Dict] = []  # [{"name": "강남역", "distance_m": 200, "lines": ["2호선"]}]
    bus_stops_count: int = 0  # 반경 300m 버스정류장 수
    bus_routes_count: int = 0  # 이용 가능 버스 노선 수
    transit_score: int = 0  # 대중교통 점수 (0-100)

    # 주차
    parking_available: bool = False
    parking_spaces: int = 0
    nearby_parking_lots: int = 0  # 주변 주차장 수
    parking_score: int = 0  # 주차 점수 (0-100)

    # 건물 정보
    building_type: str = ""  # 건물 유형
    building_age: int = 0  # 건물 연식
    floor_info: str = ""  # 층수 정보
    elevator_available: bool = False

    # 주변 시설
    nearby_facilities: Dict[str, int] = {}  # {"pharmacy": 3, "hospital": 2, "bank": 5}

    # 상권 정보
    commercial_district_type: str = ""  # 상권 유형 (주거밀집, 오피스, 역세권 등)
    commercial_score: int = 0  # 상권 점수 (0-100)
    foot_traffic_rank: str = ""  # 유동인구 등급

    # 가시성
    visibility_score: int = 0  # 가시성 점수 (0-100)
    main_road_facing: bool = False  # 대로변 여부


class GrowthProjection(BaseModel):
    """성장 전망"""
    # 매출 전망 (연도별)
    revenue_projection: Dict[str, int] = {}  # {"year1": 100000000, "year2": 120000000, ...}
    growth_rate_year1: float = 0
    growth_rate_year2: float = 0
    growth_rate_year3: float = 0
    avg_growth_rate: float = 0

    # 지역 발전 요소
    development_plans: List[str] = []  # 지역 개발 계획
    population_growth_rate: float = 0  # 인구 증감률
    commercial_growth_rate: float = 0  # 상권 성장률

    # 5년 전망
    year5_revenue_estimate: int = 0
    year5_profit_estimate: int = 0
    cumulative_profit_5years: int = 0


class RiskAnalysis(BaseModel):
    """리스크 분석"""
    overall_risk_level: RiskLevel = RiskLevel.MEDIUM
    overall_risk_score: int = 50  # 0-100

    risk_factors: List[Dict] = []  # [{"factor": "경쟁 과다", "level": "HIGH", "description": "...", "mitigation": "..."}]

    # 주요 리스크 카테고리
    competition_risk: RiskLevel = RiskLevel.MEDIUM
    location_risk: RiskLevel = RiskLevel.MEDIUM
    market_risk: RiskLevel = RiskLevel.MEDIUM
    financial_risk: RiskLevel = RiskLevel.MEDIUM

    # 기회 요소
    opportunities: List[str] = []


class AIInsights(BaseModel):
    """AI 분석 인사이트"""
    executive_summary: str = ""  # 핵심 요약

    # SWOT 분석
    strengths: List[str] = []
    weaknesses: List[str] = []
    opportunities: List[str] = []
    threats: List[str] = []

    # 추천 전략
    recommended_strategies: List[str] = []
    differentiation_points: List[str] = []  # 차별화 포인트
    target_patient_groups: List[str] = []  # 타겟 환자군

    # 최적 개원 시기
    recommended_opening_season: str = ""
    opening_timing_reason: str = ""

    # 마케팅 제안
    marketing_suggestions: List[str] = []
    estimated_marketing_budget: int = 0


class RegionStats(BaseModel):
    """지역 통계"""
    region_rank: Optional[int] = None
    total_regions: int = 17
    rank_percentile: Optional[float] = None
    vs_national_percent: float = 0
    national_avg_revenue: int = 0


class RegionStatsDetail(BaseModel):
    """상세 지역 통계"""
    # 기본 순위
    region_name: str = ""  # 지역명
    region_rank: Optional[int] = None
    total_regions: int = 17
    rank_percentile: Optional[float] = None

    # 지역 비교
    vs_national_percent: float = 0
    vs_region_avg_percent: float = 0  # 해당 지역 평균 대비
    national_avg_revenue: int = 0
    region_avg_revenue: int = 0

    # 지역 내 순위
    district_rank: Optional[int] = None  # 구/군 내 순위
    district_total: int = 0

    # 트렌드
    region_growth_trend: str = ""  # 성장, 정체, 하락
    clinic_growth_rate: float = 0  # 의원 수 증감률


class CapitalLineItem(BaseModel):
    """초기 투자비 라인 항목"""
    label: str
    amount: int                  # 원 단위
    note: Optional[str] = None


class FinancingScenario(BaseModel):
    """대출 시나리오"""
    scenario: str                  # "자기자본 100%", "자기자본 50% / 대출 50%", "자기자본 30% / 대출 70%"
    own_capital: int
    loan_amount: int
    interest_rate_annual: float    # 연이자율
    loan_term_years: int
    monthly_payment: int           # 원금균등 기준 월 상환액
    total_interest: int            # 총 이자 부담
    monthly_burden_ratio: float    # 월 매출 대비 부담률 (0.0-1.0)


class CapitalPlan(BaseModel):
    """진료과별 표준 자본 요건 + 대출 시뮬레이션"""
    standard_size_pyeong: int                  # 표준 면적
    min_size_pyeong: int                       # 의료법상 최소
    target_size_pyeong: int                    # 사용자 입력 또는 표준
    breakdown: List[CapitalLineItem]           # 항목별 투자비
    initial_investment_total: int              # 합계 (원)
    working_capital_recommended: int           # 권장 운영자금 (원)
    grand_total: int                           # 초기 투자비 + 운영자금
    financing_scenarios: List[FinancingScenario]
    data_source: str = "한국의료기기협회·대한개원의협의회 표준 + HIRA 진료비 통계"


class StaffingPlan(BaseModel):
    """진료과별 표준 인력 + 인건비"""
    doctors: int
    nurses: int
    admins: int
    technicians: int
    total_headcount: int
    monthly_payroll: int           # 본인 제외 월 인건비 합계 (원)


class PermitChecklistItem(BaseModel):
    """인허가 체크리스트 항목"""
    name: str
    authority: str
    duration_days: int
    cost: int
    description: str


class PermitChecklist(BaseModel):
    """진료과별 인허가 체크리스트"""
    common_permits: List[PermitChecklistItem]    # 공통 인허가
    specific_permits: List[str]                  # 진료과별 추가 인허가 (이름만)
    total_estimated_days: int                    # 총 처리 기간 (병렬 가정)
    total_estimated_cost: int                    # 총 수수료


class EquipmentListItem(BaseModel):
    name: str
    price_min: int
    price_typical: int
    is_essential: bool


class EquipmentChecklist(BaseModel):
    """진료과별 의료장비 목록"""
    items: List[EquipmentListItem]
    essential_total_min: int        # 필수 장비 최저가 합계
    essential_total_typical: int    # 필수 장비 표준가 합계
    optional_total_typical: int     # 선택 장비 표준가 합계


class OpeningTimelineStep(BaseModel):
    """개원 일정 단계"""
    step_no: int
    title: str
    months_from_start: int
    duration_weeks: int
    deliverables: List[str]


class OpeningTimelinePlan(BaseModel):
    """진료과별 개원 일정"""
    total_months: int
    steps: List[OpeningTimelineStep]


class FiveYearProjection(BaseModel):
    """5년 손익 시뮬 — 신규개원 환자 증가 곡선 기반"""
    year: int                       # 1~5
    patient_ratio_of_capacity: float  # 정상화 비율 (1년차 ~ 5년차)
    monthly_revenue: int
    monthly_cost: int
    monthly_loan_payment: int       # 대출 월 상환액 (자기자본 50% 기준)
    monthly_profit_before_tax: int
    annual_profit_before_tax: int


class FiveYearPnLSummary(BaseModel):
    """5년 손익 종합"""
    projections: List[FiveYearProjection]
    breakeven_month: Optional[int] = None       # 누적 순이익이 초기투자비 회수되는 시점 (개월)
    total_5yr_profit_before_tax: int
    avg_annual_profit: int
    assumptions: List[str]                       # 가정 명시


class TaxScenario(BaseModel):
    """세금 시나리오"""
    type: str                              # "개인의원" or "의료법인"
    annual_revenue: int                    # 연 매출
    annual_profit_before_tax: int          # 세전 이익
    income_tax: int                        # 종합소득세 또는 법인세
    local_tax: int                         # 지방소득세 (10%)
    dividend_tax: int                      # 배당소득세 (의료법인 본인 인출 시)
    total_tax: int
    after_tax_profit: int                  # 세후 본인 수령액
    effective_tax_rate: float              # 실효세율


class TaxComparison(BaseModel):
    """개인의원 vs 의료법인 세후 수익 비교"""
    annual_revenue: int
    individual: TaxScenario
    corporation: TaxScenario
    advantage: str                         # "개인의원 유리" or "의료법인 유리"
    advantage_amount: int                  # 유리한 금액 차이
    breakeven_revenue: int                 # 법인 전환 손익분기 매출
    notes: List[str]


class MarketingChannel(BaseModel):
    """마케팅 채널"""
    name: str                              # 네이버 플레이스, 블로그 등
    priority: str                          # "필수", "권장", "선택"
    monthly_cost_min: int                  # 최소 비용 (원)
    monthly_cost_typical: int              # 표준 비용 (원)
    expected_effect: str                   # 기대 효과
    setup_steps: List[str]                 # 설정 단계


class MarketingLawRule(BaseModel):
    """의료광고법 준수 규칙"""
    rule: str
    description: str
    penalty: str                           # 위반 시 처벌


class MarketingPlan(BaseModel):
    """진료과별 마케팅 플랜"""
    recommended_channels: List[MarketingChannel]
    monthly_budget_min: int
    monthly_budget_typical: int
    law_compliance: List[MarketingLawRule]
    clinic_type_tips: List[str]            # 진료과별 마케팅 팁


class SimulationResponse(BaseModel):
    """시뮬레이션 결과 응답 - 확장된 버전"""
    simulation_id: UUID
    address: str
    clinic_type: str
    size_pyeong: Optional[float] = None
    budget_million: Optional[int] = None

    # 기본 정보
    estimated_monthly_revenue: EstimatedRevenue
    estimated_monthly_cost: EstimatedCost
    profitability: Profitability
    competition: Competition
    competitors: List[CompetitorInfo]
    demographics: Demographics
    region_stats: Optional[RegionStats] = None

    # 상세 분석 (새로 추가)
    revenue_detail: Optional[RevenueDetail] = None
    cost_detail: Optional[CostDetail] = None
    profitability_detail: Optional[ProfitabilityDetail] = None
    competition_detail: Optional[CompetitionDetail] = None
    demographics_detail: Optional[DemographicsDetail] = None
    location_analysis: Optional[LocationAnalysis] = None
    growth_projection: Optional[GrowthProjection] = None
    risk_analysis: Optional[RiskAnalysis] = None
    ai_insights: Optional[AIInsights] = None
    region_stats_detail: Optional[RegionStatsDetail] = None

    # 신규: 개원 실행 모듈 (자금/인력/인허가/장비/일정)
    capital_plan: Optional[CapitalPlan] = None
    staffing_plan: Optional[StaffingPlan] = None
    permit_checklist: Optional[PermitChecklist] = None
    equipment_checklist: Optional[EquipmentChecklist] = None
    opening_timeline: Optional[OpeningTimelinePlan] = None
    # 신규: 운영 시뮬 (5년 손익/세금/마케팅)
    five_year_pnl: Optional[FiveYearPnLSummary] = None
    tax_comparison: Optional[TaxComparison] = None
    marketing_plan: Optional[MarketingPlan] = None
    # 카카오 Local API 실데이터: 반경 500m 시설 카운트
    nearby_facility_counts: Optional[Dict[str, int]] = None
    # 카카오 키워드 검색 종합 (의료협력·영업타겟·교통·주거)
    clinic_environment: Optional[Dict[str, Any]] = None

    confidence_score: int = Field(..., ge=0, le=100)
    recommendation: RecommendationType
    recommendation_reason: str
    ai_analysis: Optional[str] = None

    # 결제/잠금 상태
    is_unlocked: bool = False
    unlock_price: int = 9900  # 잠금해제 가격 (원)

    created_at: datetime

    class Config:
        from_attributes = True


def mask_sensitive_data(response: "SimulationResponse") -> "SimulationResponse":
    """
    미결제 사용자를 위한 민감 데이터 마스킹
    - 정확한 금액 대신 범위만 표시
    - 경쟁 병원 이름/주소 마스킹
    - 상세 인구통계 마스킹
    """
    if response.is_unlocked:
        return response

    # 깊은 복사로 원본 보호
    masked = response.model_copy(deep=True)

    # 예상 매출: 범위만 표시 (10% 오차 범위로 마스킹)
    avg = masked.estimated_monthly_revenue.avg
    masked.estimated_monthly_revenue.avg = round(avg / 10000000) * 10000000  # 천만 단위로 반올림
    masked.estimated_monthly_revenue.min = round(masked.estimated_monthly_revenue.min / 10000000) * 10000000
    masked.estimated_monthly_revenue.max = round(masked.estimated_monthly_revenue.max / 10000000) * 10000000

    # 예상 비용: 총합만 대략 표시
    total = masked.estimated_monthly_cost.total
    masked.estimated_monthly_cost.rent = 0  # 상세 숨김
    masked.estimated_monthly_cost.labor = 0
    masked.estimated_monthly_cost.utilities = 0
    masked.estimated_monthly_cost.supplies = 0
    masked.estimated_monthly_cost.other = 0
    masked.estimated_monthly_cost.total = round(total / 10000000) * 10000000

    # 수익성: ROI와 손익분기점 마스킹
    masked.profitability.monthly_profit_avg = round(masked.profitability.monthly_profit_avg / 10000000) * 10000000
    masked.profitability.breakeven_months = 0  # 숨김
    masked.profitability.annual_roi_percent = 0  # 숨김

    # 경쟁 병원: 이름과 거리 마스킹
    for i, comp in enumerate(masked.competitors):
        comp.name = f"병원 {chr(65 + i)}"  # A, B, C...
        comp.address = "***"
        comp.distance_m = round(comp.distance_m / 100) * 100  # 100m 단위로 반올림
        comp.est_monthly_revenue = None

    # 인구통계: 대략적 수치만
    masked.demographics.population_1km = round(masked.demographics.population_1km / 1000) * 1000
    masked.demographics.floating_population_daily = round(masked.demographics.floating_population_daily / 1000) * 1000

    # 지역 통계: 순위만 숨김
    if masked.region_stats:
        masked.region_stats.region_rank = None
        masked.region_stats.rank_percentile = None

    return masked


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
