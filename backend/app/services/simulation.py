from typing import Optional, Dict, Any, List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
import json
import random
from datetime import datetime

from ..models.simulation import Simulation, SimulationReport, RecommendationType
from ..schemas.simulation import (
    SimulationRequest, SimulationResponse, CompetitorInfo,
    EstimatedRevenue, EstimatedCost, Profitability, Competition, Demographics,
    RevenueDetail, CostDetail, ProfitabilityDetail, CompetitionDetail,
    DemographicsDetail, LocationAnalysis, GrowthProjection, RiskAnalysis,
    AIInsights, RegionStats, RegionStatsDetail, RiskLevel,
    CapitalPlan, CapitalLineItem, FinancingScenario,
    StaffingPlan as StaffingPlanSchema,
    PermitChecklist, PermitChecklistItem,
    EquipmentChecklist, EquipmentListItem,
    OpeningTimelinePlan, OpeningTimelineStep,
    FiveYearProjection, FiveYearPnLSummary,
    TaxScenario, TaxComparison,
    MarketingChannel, MarketingLawRule, MarketingPlan,
)
from .external_api import external_api_service
from .prediction import PredictionService
from ..core.config import settings
from ..data import clinic_profiles
from ..data import marketing_plans
from ..data import regional_rent

import logging
logger = logging.getLogger(__name__)


class SimulationService:
    """개원 시뮬레이션 서비스 (OpenSim) - Enhanced Version"""

    def __init__(self):
        self.prediction_service = PredictionService()

    async def create_simulation(
        self,
        db: AsyncSession,
        request: SimulationRequest,
        user_id: Optional[UUID] = None
    ) -> SimulationResponse:
        """새 시뮬레이션 생성 및 분석 수행"""

        # 1. 좌표 확보: 지도 클릭 좌표 우선, 없으면 주소 지오코딩
        radius_m = request.radius_m or 1000
        if request.latitude is not None and request.longitude is not None:
            geo_data = await external_api_service.reverse_geocode(
                request.latitude, request.longitude
            )
            latitude = request.latitude
            longitude = request.longitude
            region_code = geo_data.get("region_code", "") if geo_data else ""
        elif request.address:
            geo_data = await external_api_service.geocode_address(request.address)
            latitude = geo_data.get("latitude", 37.5665) if geo_data else 37.5665
            longitude = geo_data.get("longitude", 126.9780) if geo_data else 126.9780
            region_code = geo_data.get("region_code", "") if geo_data else ""
        else:
            raise ValueError("주소 또는 좌표(latitude/longitude) 중 하나는 필수입니다.")

        # 2. 주변 병원 데이터 수집 (동일 진료과 — 매출 데이터 포함)
        nearby_hospitals = await external_api_service.get_nearby_hospitals_with_revenue(
            latitude, longitude, radius_m, request.clinic_type,
            region_code=region_code,
        )

        # 2-1. 전체 의료기관 수 조회 (진료과 무관)
        all_nearby = await external_api_service.get_nearby_hospitals(
            latitude, longitude, radius_m, clinic_type=None,
            region_code=region_code,
        )

        # 3. 지역/진료과별 평균 통계 조회
        region_stats = await external_api_service.get_clinic_type_stats(
            region_code, request.clinic_type
        )

        # 4. 상권 데이터 수집
        commercial_data = await external_api_service.get_commercial_data(
            latitude, longitude
        )

        # 5. 인구통계 데이터 수집 (행안부 API → 추정 모델 폴백)
        demographics_data = await external_api_service.get_demographics(
            latitude, longitude, stdg_cd=region_code
        )

        # 5-1. 카카오 Local API로 주변 시설 실데이터 수집
        try:
            nearby_facilities_real = await external_api_service.get_nearby_facility_counts(
                latitude, longitude, radius_m=500
            )
            demographics_data["nearby_facilities_real"] = nearby_facilities_real
        except Exception as e:
            logger.warning(f"카카오 nearby 호출 실패: {e}")

        # 5. 예측 모델 실행
        prediction = await self.prediction_service.predict_revenue(
            clinic_type=request.clinic_type,
            latitude=latitude,
            longitude=longitude,
            size_pyeong=request.size_pyeong,
            nearby_hospitals=nearby_hospitals,
            commercial_data=commercial_data,
            demographics_data=demographics_data
        )

        # 6. 경쟁 분석
        competitors = self._analyze_competitors(nearby_hospitals, request.clinic_type)

        # 7. 비용 추정
        estimated_cost = self._estimate_costs(
            request.size_pyeong,
            latitude,
            longitude,
            request.clinic_type
        )

        # 8. 수익성 분석
        profitability = self._calculate_profitability(
            prediction,
            estimated_cost,
            request.budget_million
        )

        # 9. 추천 결정
        recommendation = self._determine_recommendation(
            prediction, competitors, profitability
        )

        # 10. DB에 저장
        resolved_address = (
            (geo_data.get("formatted_address") if geo_data else None)
            or request.address
            or f"{latitude:.5f}, {longitude:.5f}"
        )
        simulation = Simulation(
            user_id=user_id,
            address=resolved_address,
            latitude=latitude,
            longitude=longitude,
            clinic_type=request.clinic_type,
            size_pyeong=request.size_pyeong,
            budget_million=request.budget_million,
            est_revenue_min=prediction["min"],
            est_revenue_avg=prediction["avg"],
            est_revenue_max=prediction["max"],
            est_cost_rent=estimated_cost["rent"],
            est_cost_labor=estimated_cost["labor"],
            est_cost_utilities=estimated_cost["utilities"],
            est_cost_supplies=estimated_cost["supplies"],
            est_cost_other=estimated_cost["other"],
            est_cost_total=estimated_cost["total"],
            monthly_profit_avg=profitability["monthly_profit_avg"],
            breakeven_months=profitability["breakeven_months"],
            annual_roi_percent=profitability["annual_roi_percent"],
            competition_radius_m=radius_m,
            same_dept_count=len(competitors),
            total_clinic_count=len(all_nearby),
            competitors_data=competitors,
            population_1km=demographics_data.get("population_1km") or 45000,
            age_40_plus_ratio=demographics_data.get("age_40_plus_ratio") or 0.4,
            floating_population_daily=(
                demographics_data.get("floating_population_daily")
                or commercial_data.get("floating_population")
                or 50000
            ),
            demographics_data=demographics_data,
            confidence_score=prediction.get("confidence_score", 75),
            recommendation=recommendation["type"],
            recommendation_reason=recommendation["reason"],
            is_complete=True
        )

        db.add(simulation)
        await db.commit()
        await db.refresh(simulation)

        return self._build_response(
            simulation, competitors,
            request.clinic_type, latitude, longitude,
            demographics_data, commercial_data, prediction, estimated_cost, profitability,
            nearby_hospitals=all_nearby
        )

    async def get_simulation(
        self,
        db: AsyncSession,
        simulation_id: UUID
    ) -> Optional[SimulationResponse]:
        """시뮬레이션 결과 조회"""
        result = await db.execute(
            select(Simulation).where(Simulation.id == simulation_id)
        )
        simulation = result.scalar_one_or_none()

        if not simulation:
            return None

        competitors = simulation.competitors_data or []
        return self._build_response(simulation, competitors, simulation.clinic_type)

    async def get_user_simulations(
        self,
        db: AsyncSession,
        user_id: UUID,
        page: int = 1,
        page_size: int = 10
    ) -> Dict[str, Any]:
        """사용자 시뮬레이션 목록 조회"""
        offset = (page - 1) * page_size

        # Get total count
        count_result = await db.execute(
            select(Simulation).where(Simulation.user_id == user_id)
        )
        total = len(count_result.scalars().all())

        # Get paginated items
        result = await db.execute(
            select(Simulation)
            .where(Simulation.user_id == user_id)
            .order_by(desc(Simulation.created_at))
            .offset(offset)
            .limit(page_size)
        )
        simulations = result.scalars().all()

        return {
            "items": [
                self._build_response(sim, sim.competitors_data or [], sim.clinic_type)
                for sim in simulations
            ],
            "total": total,
            "page": page,
            "page_size": page_size
        }

    async def get_competitors_detail(
        self,
        db: AsyncSession,
        simulation_id: UUID
    ) -> List[CompetitorInfo]:
        """경쟁 병원 상세 정보"""
        result = await db.execute(
            select(Simulation).where(Simulation.id == simulation_id)
        )
        simulation = result.scalar_one_or_none()

        if not simulation:
            return []

        competitors = simulation.competitors_data or []
        return [CompetitorInfo(**c) for c in competitors]

    def _analyze_competitors(
        self,
        nearby_hospitals: List[Dict],
        clinic_type: str
    ) -> List[Dict]:
        """경쟁 병원 분석"""
        competitors = []

        # 진료과 매칭: "정형외과" → "정형외" 키워드로 유연 매칭
        keyword = clinic_type.replace("의원", "").replace("과", "").strip()
        same_dept_hospitals = [
            h for h in nearby_hospitals
            if h.get("clinic_type", "").strip()  # 빈 문자열 제외
            and (
                keyword in h.get("clinic_type", "")
                or clinic_type.lower() in h.get("clinic_type", "").lower()
            )
        ]

        for hospital in same_dept_hospitals[:10]:  # Top 10
            # Estimate monthly revenue based on hospital size and location
            est_revenue = self._estimate_competitor_revenue(hospital)

            competitors.append({
                "name": hospital.get("name", ""),
                "distance_m": int(hospital.get("distance", 0)),
                "est_monthly_revenue": est_revenue,
                "years_open": self._calculate_years_open(hospital.get("established", "")),
                "clinic_type": hospital.get("clinic_type", ""),
                "address": hospital.get("address", ""),
                "specialty_detail": hospital.get("specialty_detail", ""),
                "rating": hospital.get("rating", round(random.uniform(3.5, 4.8), 1)),
                "review_count": hospital.get("review_count", random.randint(10, 500))
            })

        return competitors

    def _estimate_costs(
        self,
        size_pyeong: Optional[float],
        latitude: float,
        longitude: float,
        clinic_type: str
    ) -> Dict[str, int]:
        """비용 추정 — regional_rent (한국부동산원 통계 기반) + clinic_profiles 표준."""
        size = size_pyeong or 30

        # 지역 임대료 시세 (한국부동산원 2024 Q3 + 부동산플래닛/직방 평균)
        rent_info = regional_rent.get_regional_rent(latitude, longitude)
        rent = int(rent_info["monthly_rent_per_pyeong"] * size)

        # 인건비: clinic_profiles 표준 인력 × 평균 월급 (원장 제외)
        st = clinic_profiles.get_staffing_profile(clinic_type)
        labor = (
            st["nurses"] * st["avg_nurse_salary_monthly"]
            + st["admins"] * st["avg_admin_salary_monthly"]
            + st["technicians"] * st["avg_nurse_salary_monthly"]
        )

        utilities = int(size * 50_000)        # 평당 전기·수도·관리비 5만원
        supplies = int(size * 100_000)        # 평당 진료재료비 10만원
        other = 2_000_000                     # 통신·세금·기타 200만원

        return {
            "rent": rent,
            "labor": labor,
            "utilities": utilities,
            "supplies": supplies,
            "other": other,
            "total": rent + labor + utilities + supplies + other,
        }

    def _calculate_profitability(
        self,
        revenue: Dict[str, int],
        cost: Dict[str, int],
        budget_million: Optional[int]
    ) -> Dict[str, Any]:
        """수익성 계산"""
        monthly_profit = revenue["avg"] - cost["total"]
        budget = (budget_million or 500) * 1000000

        # Breakeven calculation
        if monthly_profit > 0:
            breakeven_months = max(1, int(budget / monthly_profit))
        else:
            breakeven_months = 999

        # ROI calculation
        annual_profit = monthly_profit * 12
        annual_roi = (annual_profit / budget * 100) if budget > 0 else 0

        return {
            "monthly_profit_avg": monthly_profit,
            "breakeven_months": min(breakeven_months, 120),  # Cap at 10 years
            "annual_roi_percent": round(annual_roi, 1)
        }

    def _determine_recommendation(
        self,
        revenue: Dict,
        competitors: List[Dict],
        profitability: Dict
    ) -> Dict[str, Any]:
        """추천 결정"""
        score = 0
        reasons = []

        # Revenue score
        if revenue["avg"] > 80000000:
            score += 30
            reasons.append("예상 매출이 높음")
        elif revenue["avg"] > 50000000:
            score += 20
            reasons.append("예상 매출이 적정 수준")
        else:
            score += 5
            reasons.append("예상 매출이 낮음")

        # Competition score
        competitor_count = len(competitors)
        if competitor_count <= 2:
            score += 30
            reasons.append("경쟁이 적음")
        elif competitor_count <= 5:
            score += 20
            reasons.append("경쟁이 보통")
        else:
            score += 5
            reasons.append("경쟁이 치열함")

        # ROI score
        roi = profitability.get("annual_roi_percent", 0)
        if roi > 100:
            score += 30
            reasons.append("높은 ROI 기대")
        elif roi > 50:
            score += 20
            reasons.append("적정 ROI")
        else:
            score += 5
            reasons.append("낮은 ROI")

        # Breakeven score
        breakeven = profitability.get("breakeven_months", 999)
        if breakeven <= 12:
            score += 10
            reasons.append("빠른 손익분기점")
        elif breakeven <= 24:
            score += 5
            reasons.append("적정 손익분기점")

        # Determine recommendation type
        if score >= 80:
            rec_type = RecommendationType.VERY_POSITIVE
        elif score >= 60:
            rec_type = RecommendationType.POSITIVE
        elif score >= 40:
            rec_type = RecommendationType.NEUTRAL
        elif score >= 20:
            rec_type = RecommendationType.NEGATIVE
        else:
            rec_type = RecommendationType.VERY_NEGATIVE

        return {
            "type": rec_type,
            "reason": ", ".join(reasons[:3]),
            "score": score
        }

    def _estimate_competitor_revenue(self, hospital: Dict) -> int:
        """경쟁 병원 매출 추정"""
        doctors = hospital.get("doctors", 1)
        beds = hospital.get("beds", 0)

        # Basic estimation
        base_revenue = 50000000  # 5천만원 기본
        doctor_revenue = doctors * 20000000  # 의사 1인당 2천만원
        bed_revenue = beds * 5000000  # 병상 1개당 500만원

        return base_revenue + doctor_revenue + bed_revenue

    def _calculate_years_open(self, established: str) -> int:
        """개원 연차 계산"""
        if not established:
            return 0
        try:
            year = int(established[:4])
            return datetime.now().year - year
        except:
            return 0

    def _generate_revenue_detail(
        self,
        clinic_type: str,
        revenue_avg: int,
        demographics_data: Dict = None
    ) -> RevenueDetail:
        """상세 매출 분석 생성"""
        # 진료과별 평균 진료비 및 환자 수
        clinic_profiles = {
            "내과": {"avg_fee": 35000, "daily_patients": 40, "insurance": 0.85, "new_ratio": 0.25},
            "정형외과": {"avg_fee": 45000, "daily_patients": 35, "insurance": 0.75, "new_ratio": 0.30},
            "피부과": {"avg_fee": 55000, "daily_patients": 30, "insurance": 0.40, "new_ratio": 0.35},
            "성형외과": {"avg_fee": 150000, "daily_patients": 15, "insurance": 0.10, "new_ratio": 0.40},
            "이비인후과": {"avg_fee": 32000, "daily_patients": 45, "insurance": 0.85, "new_ratio": 0.30},
            "소아청소년과": {"avg_fee": 28000, "daily_patients": 50, "insurance": 0.90, "new_ratio": 0.35},
            "안과": {"avg_fee": 40000, "daily_patients": 35, "insurance": 0.70, "new_ratio": 0.25},
            "치과": {"avg_fee": 80000, "daily_patients": 20, "insurance": 0.30, "new_ratio": 0.20},
            "신경외과": {"avg_fee": 55000, "daily_patients": 25, "insurance": 0.80, "new_ratio": 0.25},
            "산부인과": {"avg_fee": 50000, "daily_patients": 30, "insurance": 0.65, "new_ratio": 0.30},
            "비뇨의학과": {"avg_fee": 45000, "daily_patients": 25, "insurance": 0.75, "new_ratio": 0.30},
            "정신건강의학과": {"avg_fee": 60000, "daily_patients": 20, "insurance": 0.60, "new_ratio": 0.20},
            "재활의학과": {"avg_fee": 35000, "daily_patients": 40, "insurance": 0.85, "new_ratio": 0.20},
            "가정의학과": {"avg_fee": 30000, "daily_patients": 45, "insurance": 0.85, "new_ratio": 0.30},
        }

        profile = clinic_profiles.get(clinic_type, {
            "avg_fee": 40000, "daily_patients": 30, "insurance": 0.70, "new_ratio": 0.30
        })

        # 매출 기반 환자 수 역산
        daily_patients = max(10, int(revenue_avg / profile["avg_fee"] / 26))

        return RevenueDetail(
            daily_patients_min=int(daily_patients * 0.7),
            daily_patients_avg=daily_patients,
            daily_patients_max=int(daily_patients * 1.4),
            avg_treatment_fee=profile["avg_fee"],
            insurance_ratio=profile["insurance"],
            non_insurance_ratio=round(1 - profile["insurance"], 2),
            new_patient_ratio=profile["new_ratio"],
            return_patient_ratio=round(1 - profile["new_ratio"], 2),
            avg_visits_per_patient=round(random.uniform(2.0, 3.5), 1),
            seasonal_factor={
                "spring": round(random.uniform(0.95, 1.05), 2),
                "summer": round(random.uniform(0.85, 0.95), 2),
                "fall": round(random.uniform(1.0, 1.1), 2),
                "winter": round(random.uniform(1.1, 1.25), 2) if clinic_type in ["내과", "이비인후과", "소아청소년과"] else round(random.uniform(0.95, 1.05), 2)
            }
        )

    def _generate_cost_detail(
        self,
        clinic_type: str,
        size_pyeong: float,
        cost: Dict
    ) -> CostDetail:
        """상세 비용 분석 생성"""
        size = size_pyeong or 30

        # 진료과별 직원 수 기준
        staff_profiles = {
            "내과": {"nurse": 2, "admin": 1},
            "정형외과": {"nurse": 3, "admin": 1},
            "피부과": {"nurse": 3, "admin": 2},
            "성형외과": {"nurse": 4, "admin": 2},
            "이비인후과": {"nurse": 2, "admin": 1},
            "소아청소년과": {"nurse": 2, "admin": 1},
            "안과": {"nurse": 3, "admin": 1},
            "치과": {"nurse": 2, "admin": 1},
        }

        staff = staff_profiles.get(clinic_type, {"nurse": 2, "admin": 1})

        # 초기 투자비용 (진료과별)
        equipment_costs = {
            "내과": 50000000,
            "정형외과": 120000000,
            "피부과": 150000000,
            "성형외과": 300000000,
            "이비인후과": 80000000,
            "소아청소년과": 40000000,
            "안과": 200000000,
            "치과": 180000000,
        }

        return CostDetail(
            rent_deposit=cost["rent"] * 10,  # 보증금 (월세 10개월)
            rent_monthly=cost["rent"],
            maintenance_fee=int(size * 30000),  # 관리비 평당 3만원
            doctor_count=1,
            nurse_count=staff["nurse"],
            admin_count=staff["admin"],
            avg_nurse_salary=3500000,
            avg_admin_salary=2800000,
            equipment_monthly=int(equipment_costs.get(clinic_type, 100000000) / 60),  # 5년 감가상각
            marketing_monthly=int(cost["total"] * 0.05),  # 매출의 5%
            insurance_monthly=500000,
            supplies_monthly=cost["supplies"],
            utilities_monthly=cost["utilities"],
            initial_equipment=equipment_costs.get(clinic_type, 100000000),
            initial_interior=int(size * 3000000),  # 평당 300만원
            initial_other=30000000  # 기타 3천만원
        )

    def _generate_profitability_detail(
        self,
        revenue: Dict,
        cost: Dict,
        profitability: Dict,
        budget_million: Optional[int]
    ) -> ProfitabilityDetail:
        """상세 수익성 분석 생성"""
        budget = (budget_million or 500) * 1000000
        monthly_profit_avg = profitability["monthly_profit_avg"]

        return ProfitabilityDetail(
            monthly_profit_min=int(revenue["min"] - cost["total"]),
            monthly_profit_avg=monthly_profit_avg,
            monthly_profit_max=int(revenue["max"] - cost["total"]),
            annual_profit_estimate=monthly_profit_avg * 12,
            profit_margin_percent=round((monthly_profit_avg / revenue["avg"]) * 100, 1) if revenue["avg"] > 0 else 0,
            operating_margin_percent=round(((revenue["avg"] - cost["total"] + cost["other"]) / revenue["avg"]) * 100, 1) if revenue["avg"] > 0 else 0,
            total_investment=budget,
            payback_months=profitability["breakeven_months"],
            irr_percent=round(profitability["annual_roi_percent"] * 0.8, 1),  # IRR은 ROI보다 약간 낮게
            npv_3years=int(monthly_profit_avg * 36 * 0.85)  # 3년 NPV (할인율 적용)
        )

    def _generate_competition_detail(
        self,
        competitors: List[Dict],
        nearby_hospitals: List[Dict],
        clinic_type: str,
        demographics_data: Dict = None
    ) -> CompetitionDetail:
        """상세 경쟁 분석 생성"""
        keyword = clinic_type.replace("의원", "").replace("과", "").strip()
        same_dept = [
            c for c in competitors
            if c.get("clinic_type", "").strip()
            and (keyword in c.get("clinic_type", "") or clinic_type.lower() in c.get("clinic_type", "").lower())
        ]

        # 경쟁 강도 지수 계산
        competition_index = min(100, len(same_dept) * 15 + len(competitors) * 3)

        if competition_index < 30:
            level = "LOW"
        elif competition_index < 50:
            level = "MEDIUM"
        elif competition_index < 70:
            level = "HIGH"
        else:
            level = "VERY_HIGH"

        # 가장 가까운 동일 진료과 거리
        same_dept_distances = [c.get("distance_m", 9999) for c in same_dept]
        nearest = min(same_dept_distances) if same_dept_distances else 9999
        avg_distance = int(sum(same_dept_distances) / len(same_dept_distances)) if same_dept_distances else 9999

        # 잠재 환자 수 계산
        population = demographics_data.get("population_1km", 45000) if demographics_data else 45000
        potential_patients = int(population * 0.03)  # 인구의 3%

        return CompetitionDetail(
            radius_m=1000,
            same_dept_count=len(same_dept),
            similar_dept_count=len([c for c in competitors if c.get("clinic_type") != clinic_type]),
            total_clinic_count=len(nearby_hospitals),
            hospital_count=len([h for h in nearby_hospitals if "병원" in h.get("name", "")]),
            competition_index=competition_index,
            competition_level=level,
            market_saturation=min(100, competition_index * 1.2),
            estimated_market_share=round(100 / (len(same_dept) + 1), 1),
            potential_patients_monthly=potential_patients,
            nearest_same_dept_distance=nearest,
            avg_distance_same_dept=avg_distance
        )

    def _generate_demographics_detail(
        self,
        demographics_data: Dict = None
    ) -> DemographicsDetail:
        """상세 인구통계 생성 (demographics_data의 추정값 우선 사용)"""
        d = demographics_data or {}
        base_pop = d.get("population_1km") or 45000
        age_dist = d.get("age_distribution") or {}
        male_ratio = d.get("male_ratio") or round(random.uniform(0.48, 0.52), 2)
        single_ratio = d.get("single_household_ratio") or round(random.uniform(0.25, 0.40), 2)

        return DemographicsDetail(
            population_500m=d.get("population_500m") or int(base_pop * 0.28),
            population_1km=base_pop,
            population_3km=d.get("population_3km") or int(base_pop * 6.5),
            age_0_9=age_dist.get("age_0_9") or round(random.uniform(0.05, 0.10), 3),
            age_10_19=age_dist.get("age_10_19") or round(random.uniform(0.08, 0.12), 3),
            age_20_29=age_dist.get("age_20_29") or round(random.uniform(0.12, 0.18), 3),
            age_30_39=age_dist.get("age_30_39") or round(random.uniform(0.14, 0.18), 3),
            age_40_49=age_dist.get("age_40_49") or round(random.uniform(0.14, 0.18), 3),
            age_50_59=age_dist.get("age_50_59") or round(random.uniform(0.12, 0.16), 3),
            age_60_plus=age_dist.get("age_60_plus") or round(random.uniform(0.15, 0.25), 3),
            male_ratio=male_ratio,
            female_ratio=round(1.0 - male_ratio, 2),
            single_household_ratio=single_ratio,
            family_household_ratio=round(1.0 - single_ratio, 2),
            avg_household_income=d.get("avg_household_income") or random.randint(400, 700),
            floating_population_daily=d.get("floating_population_daily") or 50000,
            floating_peak_hour=d.get("floating_peak_hour") or "12:00-14:00",
            floating_weekday_avg=d.get("floating_weekday_avg") or int(base_pop * 1.2),
            floating_weekend_avg=d.get("floating_weekend_avg") or int(base_pop * 0.8),
            medical_utilization_rate=d.get("medical_utilization_rate") or round(random.uniform(0.72, 0.85), 2),
            avg_annual_visits=d.get("avg_annual_visits") or round(random.uniform(15, 22), 1)
        )

    def _generate_location_analysis(
        self,
        latitude: float,
        longitude: float,
        commercial_data: Dict = None
    ) -> LocationAnalysis:
        """입지 분석 생성"""
        # 서울 주요 역세권 체크
        is_gangnam = 37.49 <= latitude <= 37.53 and 127.0 <= longitude <= 127.1
        is_seoul = 37.4 <= latitude <= 37.7 and 126.8 <= longitude <= 127.2

        transit_score = 85 if is_gangnam else (70 if is_seoul else 50)
        commercial_score = 90 if is_gangnam else (75 if is_seoul else 55)

        return LocationAnalysis(
            subway_stations=[
                {"name": "인근역", "distance_m": random.randint(100, 500), "lines": ["2호선"]}
            ] if is_seoul else [],
            bus_stops_count=random.randint(3, 8),
            bus_routes_count=random.randint(5, 20),
            transit_score=transit_score,
            parking_available=True,
            parking_spaces=random.randint(5, 30),
            nearby_parking_lots=random.randint(2, 8),
            parking_score=random.randint(50, 85),
            building_type="근린생활시설",
            building_age=random.randint(3, 20),
            floor_info=f"지상 {random.randint(2, 10)}층 중 {random.randint(1, 5)}층",
            elevator_available=True,
            nearby_facilities={
                "pharmacy": random.randint(2, 8),
                "hospital": random.randint(1, 5),
                "bank": random.randint(2, 6),
                "cafe": random.randint(5, 15),
                "restaurant": random.randint(10, 30)
            },
            commercial_district_type="역세권 상업지구" if is_gangnam else ("주거밀집 상권" if is_seoul else "일반 상권"),
            commercial_score=commercial_score,
            foot_traffic_rank="A" if commercial_score > 80 else ("B" if commercial_score > 60 else "C"),
            visibility_score=random.randint(60, 90),
            main_road_facing=random.choice([True, False])
        )

    def _generate_growth_projection(
        self,
        revenue_avg: int,
        profitability: Dict,
        clinic_type: str
    ) -> GrowthProjection:
        """성장 전망 생성"""
        # 연도별 성장률
        growth_rates = {
            "year1": round(random.uniform(0.05, 0.15), 2),
            "year2": round(random.uniform(0.08, 0.20), 2),
            "year3": round(random.uniform(0.05, 0.12), 2),
        }

        y1 = int(revenue_avg * (1 + growth_rates["year1"]))
        y2 = int(y1 * (1 + growth_rates["year2"]))
        y3 = int(y2 * (1 + growth_rates["year3"]))
        y4 = int(y3 * (1 + 0.05))
        y5 = int(y4 * (1 + 0.05))

        avg_growth = round((growth_rates["year1"] + growth_rates["year2"] + growth_rates["year3"]) / 3, 3)

        return GrowthProjection(
            revenue_projection={
                "year1": y1,
                "year2": y2,
                "year3": y3,
                "year4": y4,
                "year5": y5
            },
            growth_rate_year1=growth_rates["year1"] * 100,
            growth_rate_year2=growth_rates["year2"] * 100,
            growth_rate_year3=growth_rates["year3"] * 100,
            avg_growth_rate=avg_growth * 100,
            development_plans=[
                "인근 대규모 아파트 단지 입주 예정",
                "지하철 신규 노선 개통 계획"
            ],
            population_growth_rate=round(random.uniform(-0.5, 2.5), 1),
            commercial_growth_rate=round(random.uniform(1.0, 5.0), 1),
            year5_revenue_estimate=y5,
            year5_profit_estimate=int(y5 * 0.3),
            cumulative_profit_5years=int((y1 + y2 + y3 + y4 + y5) * 0.25)
        )

    def _generate_risk_analysis(
        self,
        competitors: List[Dict],
        profitability: Dict,
        clinic_type: str
    ) -> RiskAnalysis:
        """리스크 분석 생성"""
        risk_factors = []
        overall_score = 50

        # 경쟁 리스크
        comp_count = len(competitors)
        if comp_count > 5:
            risk_factors.append({
                "factor": "경쟁 과다",
                "level": "HIGH",
                "description": f"반경 1km 내 동일 진료과 {comp_count}개 운영 중",
                "mitigation": "차별화된 진료 서비스 및 마케팅 전략 필요"
            })
            comp_risk = RiskLevel.HIGH
            overall_score += 15
        elif comp_count > 2:
            comp_risk = RiskLevel.MEDIUM
            overall_score += 5
        else:
            comp_risk = RiskLevel.LOW
            overall_score -= 10

        # 재무 리스크
        roi = profitability.get("annual_roi_percent", 0)
        if roi < 30:
            risk_factors.append({
                "factor": "낮은 수익성",
                "level": "HIGH",
                "description": "예상 ROI가 업계 평균 이하",
                "mitigation": "비용 절감 및 매출 증대 전략 수립 필요"
            })
            fin_risk = RiskLevel.HIGH
            overall_score += 15
        elif roi < 60:
            fin_risk = RiskLevel.MEDIUM
            overall_score += 5
        else:
            fin_risk = RiskLevel.LOW
            overall_score -= 10

        # 시장 리스크
        market_risk = RiskLevel.MEDIUM
        risk_factors.append({
            "factor": "의료 정책 변동",
            "level": "MEDIUM",
            "description": "건강보험 수가 변동 가능성",
            "mitigation": "비급여 진료 비중 확대 검토"
        })

        # 입지 리스크
        location_risk = RiskLevel.LOW

        # 전체 리스크 레벨 결정
        if overall_score < 40:
            overall_level = RiskLevel.LOW
        elif overall_score < 60:
            overall_level = RiskLevel.MEDIUM
        else:
            overall_level = RiskLevel.HIGH

        # 기회 요소
        opportunities = [
            "고령화에 따른 의료 수요 증가",
            "건강 관심 증가로 검진 수요 확대",
            "비대면 진료 확대로 접근성 개선"
        ]

        return RiskAnalysis(
            overall_risk_level=overall_level,
            overall_risk_score=overall_score,
            risk_factors=risk_factors,
            competition_risk=comp_risk,
            location_risk=location_risk,
            market_risk=market_risk,
            financial_risk=fin_risk,
            opportunities=opportunities
        )

    def _generate_ai_insights(
        self,
        clinic_type: str,
        recommendation_type: RecommendationType,
        competitors: List[Dict],
        profitability: Dict
    ) -> AIInsights:
        """AI 분석 인사이트 생성"""
        # SWOT 분석
        strengths = [
            "신규 개원으로 최신 시설 및 장비 도입 가능",
            "젊은 의사의 열정과 최신 의료 지식",
            "환자 중심 서비스로 차별화 가능"
        ]

        weaknesses = [
            "브랜드 인지도 부족",
            "기존 환자 기반 없음",
            "초기 자금 부담"
        ]

        opportunities = [
            "고령화 사회 진입으로 의료 수요 증가",
            "건강 관심 증가 트렌드",
            "디지털 의료 서비스 확대"
        ]

        threats = [
            "기존 의원과의 경쟁",
            "의료비 수가 인하 압력",
            "인력 채용 어려움"
        ]

        # 추천 전략
        strategies = [
            f"초기 6개월간 집중 마케팅으로 인지도 확보",
            "차별화된 진료 서비스 개발 (야간/주말 진료 등)",
            "온라인 평판 관리 및 SNS 마케팅 강화",
            "환자 재방문율 높이기 위한 CRM 시스템 도입"
        ]

        # 차별화 포인트
        diff_points = [
            "최신 의료 장비 보유",
            "편리한 예약 시스템",
            "친절한 상담 서비스",
            "깔끔한 인테리어"
        ]

        # 타겟 환자군
        target_profiles = {
            "내과": ["40-60대 만성질환자", "건강검진 수요층", "직장인"],
            "피부과": ["20-40대 여성", "미용 관심층", "피부 질환자"],
            "정형외과": ["30-60대 직장인", "운동인", "교통사고 환자"],
            "성형외과": ["20-40대 미용 관심층"],
            "이비인후과": ["전 연령대", "알레르기 환자", "수면장애"],
            "소아청소년과": ["영유아~청소년 자녀 부모"],
        }

        targets = target_profiles.get(clinic_type, ["30-50대 지역 주민"])

        # 개원 시기
        seasons = {
            "spring": ("봄 (3-5월)", "활동량 증가로 환자 접근성 향상"),
            "fall": ("가을 (9-11월)", "환절기 환자 증가 시기")
        }
        season_key = random.choice(["spring", "fall"])
        season = seasons[season_key]

        return AIInsights(
            executive_summary=f"{clinic_type} 개원 입지로 {'적합' if recommendation_type in [RecommendationType.POSITIVE, RecommendationType.VERY_POSITIVE] else '보통' if recommendation_type == RecommendationType.NEUTRAL else '부적합'}합니다. 경쟁 상황과 인구 특성을 고려한 차별화 전략이 필요합니다.",
            strengths=strengths,
            weaknesses=weaknesses,
            opportunities=opportunities,
            threats=threats,
            recommended_strategies=strategies,
            differentiation_points=diff_points,
            target_patient_groups=targets,
            recommended_opening_season=season[0],
            opening_timing_reason=season[1],
            marketing_suggestions=[
                "개원 전 SNS 채널 개설 및 사전 홍보",
                "개원 기념 건강검진 이벤트",
                "지역 커뮤니티 협찬 및 참여",
                "네이버/카카오 지도 등록 및 리뷰 관리"
            ],
            estimated_marketing_budget=5000000
        )

    def _generate_region_stats_detail(
        self,
        clinic_type: str,
        revenue_avg: int,
        address: str = ""
    ) -> RegionStatsDetail:
        """상세 지역 통계 생성"""
        # 주소에서 시/도 추출
        region_name = "서울특별시"
        if address:
            parts = address.split()
            if parts:
                region_name = parts[0]
        return RegionStatsDetail(
            region_name=region_name,
            region_rank=random.randint(1, 5),
            total_regions=17,
            rank_percentile=round(random.uniform(10, 40), 1),
            vs_national_percent=round(random.uniform(-10, 30), 1),
            vs_region_avg_percent=round(random.uniform(-5, 20), 1),
            national_avg_revenue=int(revenue_avg * random.uniform(0.8, 1.0)),
            region_avg_revenue=int(revenue_avg * random.uniform(0.9, 1.1)),
            district_rank=random.randint(1, 10),
            district_total=25,
            region_growth_trend="성장" if random.random() > 0.3 else "정체",
            clinic_growth_rate=round(random.uniform(-2, 5), 1)
        )

    def _build_region_stats(self, clinic_type: str, revenue_avg: int) -> RegionStats:
        """HIRA 통계 기반 진료과 평균 매출 비교 (지역 순위는 미제공)."""
        national_avg = external_api_service._get_default_clinic_stats(clinic_type).get(
            "avg_monthly_revenue", 55_000_000
        )
        if national_avg > 0:
            vs_national = ((revenue_avg - national_avg) / national_avg) * 100
        else:
            vs_national = 0.0
        return RegionStats(
            region_rank=None,           # 실 ranking DB 부재
            total_regions=17,
            rank_percentile=None,       # 동일
            vs_national_percent=round(vs_national, 1),
            national_avg_revenue=national_avg,
        )

    def _generate_capital_plan(
        self,
        clinic_type: str,
        size_pyeong: Optional[float],
        revenue_avg: int,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
    ) -> CapitalPlan:
        """진료과 표준 + 지역 시세 기반 초기 투자비 + 대출 시뮬"""
        cap = clinic_profiles.get_capital_profile(clinic_type)
        target = int(size_pyeong) if size_pyeong else cap["standard_size_pyeong"]

        # 지역 시세 (한국부동산원 기반)
        deposit_per_pyeong = cap["deposit_per_pyeong"]
        monthly_rent_per_pyeong = cap["monthly_rent_per_pyeong"]
        region_label = "수도권 평균"
        data_source = "한국의료기기협회·대한개원의협의회 표준 + HIRA 진료비 통계"
        if latitude is not None and longitude is not None:
            rent_info = regional_rent.get_regional_rent(latitude, longitude)
            deposit_per_pyeong = rent_info["deposit_per_pyeong"]
            monthly_rent_per_pyeong = rent_info["monthly_rent_per_pyeong"]
            region_label = rent_info["region_name"]
            data_source = f"한국의료기기협회·대한개원의협의회 표준 + 한국부동산원 {rent_info['sample_period']} ({region_label})"

        interior = cap["interior_per_pyeong"] * target
        equipment = cap["equipment_typical"]
        deposit = deposit_per_pyeong * target
        monthly_rent = monthly_rent_per_pyeong * target
        misc = int(interior * 0.05) + 5_000_000

        breakdown = [
            CapitalLineItem(label="인테리어·시설공사", amount=interior, note=f"평당 {cap['interior_per_pyeong']:,}원 × {target}평"),
            CapitalLineItem(label="의료장비 (표준)", amount=equipment, note=f"진료과 표준 구성, 최저가 ~ {cap['equipment_min']:,}원까지 압축 가능"),
            CapitalLineItem(label="임대 보증금", amount=deposit, note=f"평당 {deposit_per_pyeong:,}원 × {target}평 ({region_label})"),
            CapitalLineItem(label="등록·인허가·예비비", amount=misc, note="개설신고·세무·법무·간판 등"),
        ]
        initial_total = sum(item.amount for item in breakdown)
        working_capital = monthly_rent * cap["working_capital_months"] + 30_000_000  # 월세 + 인건비 약간
        grand_total = initial_total + working_capital

        # 대출 시뮬 — 원금균등 가정 단순화 (이자율 5.5%, 5년)
        scenarios: List[FinancingScenario] = []
        for own_ratio, label in [(1.0, "자기자본 100%"), (0.5, "자기자본 50% / 대출 50%"), (0.3, "자기자본 30% / 대출 70%")]:
            own = int(grand_total * own_ratio)
            loan = grand_total - own
            rate = 0.055
            term = 5
            if loan > 0:
                # 원리금균등 월상환액
                r = rate / 12
                n = term * 12
                monthly = int(loan * r * (1 + r) ** n / ((1 + r) ** n - 1))
                total_interest = monthly * n - loan
            else:
                monthly = 0
                total_interest = 0
            burden = (monthly / revenue_avg) if revenue_avg > 0 else 0
            scenarios.append(FinancingScenario(
                scenario=label,
                own_capital=own,
                loan_amount=loan,
                interest_rate_annual=rate,
                loan_term_years=term,
                monthly_payment=monthly,
                total_interest=total_interest,
                monthly_burden_ratio=round(burden, 3),
            ))

        return CapitalPlan(
            standard_size_pyeong=cap["standard_size_pyeong"],
            min_size_pyeong=cap["min_size_pyeong"],
            target_size_pyeong=target,
            breakdown=breakdown,
            initial_investment_total=initial_total,
            working_capital_recommended=working_capital,
            grand_total=grand_total,
            financing_scenarios=scenarios,
            data_source=data_source,
        )

    def _generate_staffing_plan(self, clinic_type: str) -> StaffingPlanSchema:
        s = clinic_profiles.get_staffing_profile(clinic_type)
        # 본인(원장) 제외 인건비
        payroll = (
            s["nurses"] * s["avg_nurse_salary_monthly"]
            + s["admins"] * s["avg_admin_salary_monthly"]
            + s["technicians"] * s["avg_nurse_salary_monthly"]  # 보조 인력
        )
        return StaffingPlanSchema(
            doctors=s["doctors"],
            nurses=s["nurses"],
            admins=s["admins"],
            technicians=s["technicians"],
            total_headcount=s["doctors"] + s["nurses"] + s["admins"] + s["technicians"],
            monthly_payroll=payroll,
        )

    def _generate_permit_checklist(self, clinic_type: str) -> PermitChecklist:
        common = [
            PermitChecklistItem(**p) for p in clinic_profiles.get_permits(clinic_type)
        ]
        specifics = clinic_profiles.get_specific_permits(clinic_type)
        return PermitChecklist(
            common_permits=common,
            specific_permits=specifics,
            total_estimated_days=max((p.duration_days for p in common), default=0),  # 병렬 진행 가정
            total_estimated_cost=sum(p.cost for p in common),
        )

    def _generate_equipment_checklist(self, clinic_type: str) -> EquipmentChecklist:
        items_raw = clinic_profiles.get_equipment_list(clinic_type)
        items = [EquipmentListItem(**e) for e in items_raw]
        essential_min = sum(e.price_min for e in items if e.is_essential)
        essential_typ = sum(e.price_typical for e in items if e.is_essential)
        optional_typ = sum(e.price_typical for e in items if not e.is_essential)
        return EquipmentChecklist(
            items=items,
            essential_total_min=essential_min,
            essential_total_typical=essential_typ,
            optional_total_typical=optional_typ,
        )

    def _generate_five_year_pnl(
        self,
        clinic_type: str,
        revenue_avg: int,
        cost_total: int,
        capital_grand_total: int,
    ) -> FiveYearPnLSummary:
        """
        신규개원 표준 환자증가 곡선 기반 5년 손익.

        곡선 (의원급 신규개원 표준):
        - 1년차: 정상화의 60% (인지도·환자기반 부족)
        - 2년차: 80%
        - 3년차: 95%
        - 4년차: 100%
        - 5년차: 100% (안정기)

        대출 가정: 자기자본 50% / 대출 50%, 연 5.5%, 5년 원리금균등.
        """
        ramp = [0.60, 0.80, 0.95, 1.00, 1.00]
        loan = capital_grand_total // 2
        rate = 0.055
        n = 60
        if loan > 0:
            r = rate / 12
            monthly_payment = int(loan * r * (1 + r) ** n / ((1 + r) ** n - 1))
        else:
            monthly_payment = 0

        # 변동비 비율: 매출의 30% (진료재료·마케팅·일부 인건비)
        variable_cost_ratio = 0.30
        # 고정비: cost_total에서 변동비 제외
        fixed_cost = max(int(cost_total * 0.70), 0)

        projections: List[FiveYearProjection] = []
        cumulative_profit = 0
        breakeven_month: Optional[int] = None

        for year in range(1, 6):
            ratio = ramp[year - 1]
            monthly_rev = int(revenue_avg * ratio)
            variable_cost = int(monthly_rev * variable_cost_ratio)
            monthly_cost_y = fixed_cost + variable_cost
            monthly_loan = monthly_payment if year <= 5 else 0
            monthly_profit = monthly_rev - monthly_cost_y - monthly_loan
            annual_profit = monthly_profit * 12

            # breakeven 계산 (월 단위)
            if breakeven_month is None and monthly_profit > 0:
                for m in range(1, 13):
                    cumulative_profit += monthly_profit
                    if cumulative_profit >= capital_grand_total // 2:  # 자기자본 회수 시점
                        breakeven_month = (year - 1) * 12 + m
                        break
                if breakeven_month is None:
                    cumulative_profit = annual_profit + (cumulative_profit - monthly_profit * 12)
            else:
                cumulative_profit += annual_profit

            projections.append(FiveYearProjection(
                year=year,
                patient_ratio_of_capacity=ratio,
                monthly_revenue=monthly_rev,
                monthly_cost=monthly_cost_y,
                monthly_loan_payment=monthly_loan,
                monthly_profit_before_tax=monthly_profit,
                annual_profit_before_tax=annual_profit,
            ))

        total_5yr = sum(p.annual_profit_before_tax for p in projections)
        avg_annual = total_5yr // 5

        return FiveYearPnLSummary(
            projections=projections,
            breakeven_month=breakeven_month,
            total_5yr_profit_before_tax=total_5yr,
            avg_annual_profit=avg_annual,
            assumptions=[
                "신규개원 표준 환자증가: 1년 60% → 2년 80% → 3년 95% → 4-5년 100%",
                "자기자본 50% / 대출 50% (연 5.5%, 60개월 원리금균등) 가정",
                "변동비(진료재료·마케팅): 매출의 30%",
                "세전 기준. 세금은 별도 시뮬 참고",
            ],
        )

    def _generate_tax_comparison(
        self,
        annual_revenue: int,
        annual_profit_before_tax: int,
    ) -> TaxComparison:
        """
        개인의원 (종합소득세) vs 의료법인 (법인세 + 배당세) 세후 수익 비교.

        2024년 기준 세율:
        - 종합소득세 (누진세): 1.4천 6%, 5천 15%, 8.8천 24%, 1.5억 35%, 3억 38%, 5억 40%, 10억 42%, 10억+ 45%
        - 법인세: 2억 9%, 200억 19%, 3000억 21%, 3000억+ 24%
        - 지방소득세: 본세의 10%
        - 배당소득세 (법인 본인 인출 시): 15.4% (지방세 포함)
        """
        # 개인의원 — 종합소득세 누진 계산
        def personal_income_tax(taxable: int) -> int:
            brackets = [
                (14_000_000, 0.06, 0),
                (50_000_000, 0.15, 1_260_000),
                (88_000_000, 0.24, 5_760_000),
                (150_000_000, 0.35, 15_440_000),
                (300_000_000, 0.38, 19_940_000),
                (500_000_000, 0.40, 25_940_000),
                (1_000_000_000, 0.42, 35_940_000),
                (float('inf'), 0.45, 65_940_000),
            ]
            for limit, rate, deduct in brackets:
                if taxable <= limit:
                    return max(int(taxable * rate - deduct), 0)
            return 0

        # 법인세
        def corporate_tax(taxable: int) -> int:
            if taxable <= 200_000_000:
                return int(taxable * 0.09)
            if taxable <= 20_000_000_000:
                return int(200_000_000 * 0.09 + (taxable - 200_000_000) * 0.19)
            return int(200_000_000 * 0.09 + (20_000_000_000 - 200_000_000) * 0.19 + (taxable - 20_000_000_000) * 0.21)

        # 개인의원
        ind_income_tax = personal_income_tax(annual_profit_before_tax)
        ind_local_tax = int(ind_income_tax * 0.10)
        ind_total = ind_income_tax + ind_local_tax
        ind_after = annual_profit_before_tax - ind_total

        individual = TaxScenario(
            type="개인의원",
            annual_revenue=annual_revenue,
            annual_profit_before_tax=annual_profit_before_tax,
            income_tax=ind_income_tax,
            local_tax=ind_local_tax,
            dividend_tax=0,
            total_tax=ind_total,
            after_tax_profit=ind_after,
            effective_tax_rate=round(ind_total / annual_profit_before_tax, 4) if annual_profit_before_tax > 0 else 0,
        )

        # 의료법인: 법인세 + 본인 인출분 배당세
        # 가정: 법인이익의 70%를 본인 급여/배당으로 인출, 30%는 법인 유보
        corp_income_tax = corporate_tax(annual_profit_before_tax)
        corp_local_tax = int(corp_income_tax * 0.10)
        corp_after_corp_tax = annual_profit_before_tax - corp_income_tax - corp_local_tax
        withdrawal = int(corp_after_corp_tax * 0.70)
        dividend_tax = int(withdrawal * 0.154)
        corp_total_tax = corp_income_tax + corp_local_tax + dividend_tax
        corp_after = annual_profit_before_tax - corp_total_tax

        corporation = TaxScenario(
            type="의료법인",
            annual_revenue=annual_revenue,
            annual_profit_before_tax=annual_profit_before_tax,
            income_tax=corp_income_tax,
            local_tax=corp_local_tax,
            dividend_tax=dividend_tax,
            total_tax=corp_total_tax,
            after_tax_profit=corp_after,
            effective_tax_rate=round(corp_total_tax / annual_profit_before_tax, 4) if annual_profit_before_tax > 0 else 0,
        )

        if ind_after >= corp_after:
            advantage = "개인의원 유리"
            advantage_amount = ind_after - corp_after
        else:
            advantage = "의료법인 유리"
            advantage_amount = corp_after - ind_after

        # 손익분기 매출 (대략): 세전이익이 약 1.5억 이상일 때 법인이 유리해지는 경향
        breakeven_revenue = 600_000_000  # 표준값

        notes = [
            "본인 급여/배당으로 70% 인출 가정 (30% 법인 유보)",
            "지방소득세 본세의 10%, 배당소득세 15.4% 적용",
            "법인 설립비·운영비(법인세 신고 등) 별도 발생 (연 200~500만)",
            "의료법인은 의료법 제48조에 따라 비영리법인. 잉여금 처분 제한 있음.",
            "실제 세무는 세무사 상담 권장",
        ]

        return TaxComparison(
            annual_revenue=annual_revenue,
            individual=individual,
            corporation=corporation,
            advantage=advantage,
            advantage_amount=advantage_amount,
            breakeven_revenue=breakeven_revenue,
            notes=notes,
        )

    def _generate_marketing_plan(self, clinic_type: str) -> MarketingPlan:
        channels = [
            MarketingChannel(**c) for c in marketing_plans.get_channels()
        ]
        # 필수 채널 비용만 합산 (최소/표준)
        essential = [c for c in channels if c.priority == "필수"]
        recommended = [c for c in channels if c.priority == "권장"]
        budget_min = sum(c.monthly_cost_min for c in essential)
        budget_typical = sum(c.monthly_cost_typical for c in essential + recommended)

        rules = [
            MarketingLawRule(**r) for r in marketing_plans.get_law_rules()
        ]
        tips = marketing_plans.get_clinic_tips(clinic_type)

        return MarketingPlan(
            recommended_channels=channels,
            monthly_budget_min=budget_min,
            monthly_budget_typical=budget_typical,
            law_compliance=rules,
            clinic_type_tips=tips,
        )

    def _generate_opening_timeline(self, clinic_type: str) -> OpeningTimelinePlan:
        total_months = clinic_profiles.get_timeline_months(clinic_type)
        # 표준 5단계 일정 (개원 절차 표준)
        steps = [
            OpeningTimelineStep(
                step_no=1, title="입지 확정 + 임대 계약", months_from_start=0, duration_weeks=2,
                deliverables=["부동산 시세 조사", "임대차 계약서 체결", "보증금 납부"],
            ),
            OpeningTimelineStep(
                step_no=2, title="설계·인허가·인테리어", months_from_start=1, duration_weeks=8,
                deliverables=["의료시설 설계도", "건축물 사용승인", "인테리어 완공", "소방·전기 검사"],
            ),
            OpeningTimelineStep(
                step_no=3, title="의료장비 도입 + 시운전", months_from_start=int(total_months * 0.5), duration_weeks=4,
                deliverables=["장비 발주·설치", "방사선 안전 신고", "EMR 시스템 구축"],
            ),
            OpeningTimelineStep(
                step_no=4, title="인허가 신청 + 인력 채용", months_from_start=max(total_months - 2, 1), duration_weeks=4,
                deliverables=["사업자등록", "의료기관 개설신고", "심평원 등록", "직원 채용 + 4대보험"],
            ),
            OpeningTimelineStep(
                step_no=5, title="개원 + 마케팅 시작", months_from_start=total_months, duration_weeks=2,
                deliverables=["네이버 플레이스 등록", "초진 환자 유치 캠페인", "보험청구 시작"],
            ),
        ]
        return OpeningTimelinePlan(total_months=total_months, steps=steps)

    def _build_response(
        self,
        simulation: Simulation,
        competitors: List[Dict],
        clinic_type: str,
        latitude: float = None,
        longitude: float = None,
        demographics_data: Dict = None,
        commercial_data: Dict = None,
        prediction: Dict = None,
        estimated_cost: Dict = None,
        profitability_data: Dict = None,
        nearby_hospitals: List[Dict] = None
    ) -> SimulationResponse:
        """응답 객체 생성 - Enhanced Version"""

        # 기본 데이터 설정
        lat = latitude or simulation.latitude or 37.5665
        lng = longitude or simulation.longitude or 126.978

        revenue_avg = simulation.est_revenue_avg or 80000000

        cost = estimated_cost or {
            "rent": simulation.est_cost_rent or 0,
            "labor": simulation.est_cost_labor or 0,
            "utilities": simulation.est_cost_utilities or 0,
            "supplies": simulation.est_cost_supplies or 0,
            "other": simulation.est_cost_other or 0,
            "total": simulation.est_cost_total or 0
        }

        profitability = profitability_data or {
            "monthly_profit_avg": simulation.monthly_profit_avg or 0,
            "breakeven_months": simulation.breakeven_months or 0,
            "annual_roi_percent": simulation.annual_roi_percent or 0
        }

        revenue = prediction or {
            "min": simulation.est_revenue_min or 0,
            "avg": simulation.est_revenue_avg or 0,
            "max": simulation.est_revenue_max or 0
        }

        return SimulationResponse(
            simulation_id=simulation.id,
            address=simulation.address,
            clinic_type=simulation.clinic_type,
            size_pyeong=simulation.size_pyeong,
            budget_million=simulation.budget_million,

            # 기본 정보
            estimated_monthly_revenue=EstimatedRevenue(
                min=simulation.est_revenue_min or 0,
                avg=simulation.est_revenue_avg or 0,
                max=simulation.est_revenue_max or 0
            ),
            estimated_monthly_cost=EstimatedCost(
                rent=simulation.est_cost_rent or 0,
                labor=simulation.est_cost_labor or 0,
                utilities=simulation.est_cost_utilities or 0,
                supplies=simulation.est_cost_supplies or 0,
                other=simulation.est_cost_other or 0,
                total=simulation.est_cost_total or 0
            ),
            profitability=Profitability(
                monthly_profit_avg=simulation.monthly_profit_avg or 0,
                breakeven_months=simulation.breakeven_months or 0,
                annual_roi_percent=simulation.annual_roi_percent or 0
            ),
            competition=Competition(
                radius_m=simulation.competition_radius_m or 1000,
                same_dept_count=simulation.same_dept_count or len(competitors),
                total_clinic_count=simulation.total_clinic_count or 0
            ),
            competitors=[CompetitorInfo(**c) for c in competitors],
            demographics=Demographics(
                population_1km=simulation.population_1km or 35000,
                age_40_plus_ratio=simulation.age_40_plus_ratio or 0.4,
                floating_population_daily=simulation.floating_population_daily or 50000
            ),
            region_stats=self._build_region_stats(clinic_type, revenue_avg),

            # 가짜/템플릿 필드 제거 (UI/PDF 미사용 + 검증 불가능한 값)
            revenue_detail=None,
            cost_detail=None,
            profitability_detail=None,
            competition_detail=None,
            demographics_detail=None,
            location_analysis=None,
            growth_projection=None,
            risk_analysis=None,
            ai_insights=None,
            region_stats_detail=None,

            # 신규: 개원 실행 모듈 (clinic_profiles 표준 + 지역 시세 기반)
            capital_plan=self._generate_capital_plan(clinic_type, simulation.size_pyeong, revenue_avg, lat, lng),
            staffing_plan=self._generate_staffing_plan(clinic_type),
            permit_checklist=self._generate_permit_checklist(clinic_type),
            equipment_checklist=self._generate_equipment_checklist(clinic_type),
            opening_timeline=self._generate_opening_timeline(clinic_type),

            # 신규: 운영 시뮬 (5년 손익/세금/마케팅)
            five_year_pnl=self._generate_five_year_pnl(
                clinic_type,
                revenue_avg,
                simulation.est_cost_total or 0,
                self._generate_capital_plan(clinic_type, simulation.size_pyeong, revenue_avg, lat, lng).grand_total,
            ),
            tax_comparison=self._generate_tax_comparison(
                annual_revenue=revenue_avg * 12,
                annual_profit_before_tax=(simulation.monthly_profit_avg or 0) * 12,
            ),
            marketing_plan=self._generate_marketing_plan(clinic_type),
            nearby_facility_counts=(
                (simulation.demographics_data or {}).get("nearby_facilities_real")
                if isinstance(simulation.demographics_data, dict) else None
            ),

            confidence_score=simulation.confidence_score or 0,
            recommendation=simulation.recommendation or RecommendationType.NEUTRAL,
            recommendation_reason=simulation.recommendation_reason or "",
            ai_analysis=simulation.ai_analysis,
            created_at=simulation.created_at
        )


simulation_service = SimulationService()
