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
    AIInsights, RegionStats, RegionStatsDetail, RiskLevel
)
from .external_api import external_api_service
from .prediction import PredictionService
from ..core.config import settings

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

        # 1. 주소를 좌표로 변환
        geo_data = await external_api_service.geocode_address(request.address)
        latitude = geo_data.get("latitude", 37.5665) if geo_data else 37.5665
        longitude = geo_data.get("longitude", 126.9780) if geo_data else 126.9780
        region_code = geo_data.get("region_code", "") if geo_data else ""

        # 2. 주변 병원 데이터 수집 (매출 데이터 포함)
        nearby_hospitals = await external_api_service.get_nearby_hospitals_with_revenue(
            latitude, longitude, 1000, request.clinic_type
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
        simulation = Simulation(
            user_id=user_id,
            address=geo_data.get("formatted_address", request.address) if geo_data else request.address,
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
            competition_radius_m=1000,
            same_dept_count=len(competitors),
            total_clinic_count=len(nearby_hospitals),
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
            nearby_hospitals=nearby_hospitals
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
        """비용 추정"""
        size = size_pyeong or 30

        # Base rent estimation (서울 기준, 지역에 따라 조정)
        base_rent_per_pyeong = 150000  # 15만원/평
        if 37.49 <= latitude <= 37.53 and 127.0 <= longitude <= 127.1:  # 강남권
            base_rent_per_pyeong = 300000

        rent = int(base_rent_per_pyeong * size)

        # Labor costs based on clinic type
        labor_multiplier = {
            "내과": 1.0,
            "정형외과": 1.3,
            "피부과": 1.2,
            "성형외과": 1.5,
            "이비인후과": 0.9,
            "소아청소년과": 1.0,
            "안과": 1.1,
            "치과": 1.2,
        }
        base_labor = 12000000  # 기본 인건비 1,200만원
        labor = int(base_labor * labor_multiplier.get(clinic_type, 1.0))

        utilities = int(size * 50000)  # 평당 5만원
        supplies = int(size * 100000)  # 평당 10만원
        other = 2000000  # 기타 200만원

        return {
            "rent": rent,
            "labor": labor,
            "utilities": utilities,
            "supplies": supplies,
            "other": other,
            "total": rent + labor + utilities + supplies + other
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
            region_stats=RegionStats(
                region_rank=random.randint(1, 10),
                total_regions=17,
                rank_percentile=round(random.uniform(10, 50), 1),
                vs_national_percent=round(random.uniform(-5, 25), 1),
                national_avg_revenue=int(revenue_avg * 0.9)
            ),

            # 상세 분석 (새로 추가)
            revenue_detail=self._generate_revenue_detail(clinic_type, revenue_avg, demographics_data),
            cost_detail=self._generate_cost_detail(clinic_type, simulation.size_pyeong or 30, cost),
            profitability_detail=self._generate_profitability_detail(revenue, cost, profitability, simulation.budget_million),
            competition_detail=self._generate_competition_detail(competitors, nearby_hospitals or [], clinic_type, demographics_data),
            demographics_detail=self._generate_demographics_detail(demographics_data),
            location_analysis=self._generate_location_analysis(lat, lng, commercial_data),
            growth_projection=self._generate_growth_projection(revenue_avg, profitability, clinic_type),
            risk_analysis=self._generate_risk_analysis(competitors, profitability, clinic_type),
            ai_insights=self._generate_ai_insights(
                clinic_type,
                simulation.recommendation or RecommendationType.NEUTRAL,
                competitors,
                profitability
            ),
            region_stats_detail=self._generate_region_stats_detail(clinic_type, revenue_avg),

            confidence_score=simulation.confidence_score or 0,
            recommendation=simulation.recommendation or RecommendationType.NEUTRAL,
            recommendation_reason=simulation.recommendation_reason or "",
            ai_analysis=simulation.ai_analysis,
            created_at=simulation.created_at
        )


simulation_service = SimulationService()
