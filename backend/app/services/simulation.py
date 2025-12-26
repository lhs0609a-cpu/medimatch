from typing import Optional, Dict, Any, List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
import json
from datetime import datetime

from ..models.simulation import Simulation, SimulationReport, RecommendationType
from ..schemas.simulation import (
    SimulationRequest, SimulationResponse, CompetitorInfo,
    EstimatedRevenue, EstimatedCost, Profitability, Competition, Demographics
)
from .external_api import external_api_service
from .prediction import PredictionService
from ..core.config import settings

import logging
logger = logging.getLogger(__name__)


class SimulationService:
    """개원 시뮬레이션 서비스 (OpenSim)"""

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

        # 5. 인구통계 데이터 수집
        demographics_data = await external_api_service.get_demographics(
            latitude, longitude
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
            same_dept_count=len([h for h in nearby_hospitals if h.get("clinic_type") == request.clinic_type]),
            total_clinic_count=len(nearby_hospitals),
            competitors_data=competitors,
            population_1km=demographics_data.get("population_1km", 45000),
            age_40_plus_ratio=demographics_data.get("age_40_plus_ratio", 0.4),
            floating_population_daily=commercial_data.get("floating_population", 50000),
            demographics_data=demographics_data,
            confidence_score=prediction.get("confidence_score", 75),
            recommendation=recommendation["type"],
            recommendation_reason=recommendation["reason"],
            is_complete=True
        )

        db.add(simulation)
        await db.commit()
        await db.refresh(simulation)

        return self._build_response(simulation, competitors)

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
        return self._build_response(simulation, competitors)

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
                self._build_response(sim, sim.competitors_data or [])
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

        same_dept_hospitals = [
            h for h in nearby_hospitals
            if clinic_type.lower() in h.get("clinic_type", "").lower()
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
                "address": hospital.get("address", "")
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

    def _build_response(
        self,
        simulation: Simulation,
        competitors: List[Dict]
    ) -> SimulationResponse:
        """응답 객체 생성"""
        return SimulationResponse(
            simulation_id=simulation.id,
            address=simulation.address,
            clinic_type=simulation.clinic_type,
            size_pyeong=simulation.size_pyeong,
            budget_million=simulation.budget_million,
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
                same_dept_count=simulation.same_dept_count or 0,
                total_clinic_count=simulation.total_clinic_count or 0
            ),
            competitors=[CompetitorInfo(**c) for c in competitors],
            demographics=Demographics(
                population_1km=simulation.population_1km or 0,
                age_40_plus_ratio=simulation.age_40_plus_ratio or 0,
                floating_population_daily=simulation.floating_population_daily or 0
            ),
            confidence_score=simulation.confidence_score or 0,
            recommendation=simulation.recommendation or RecommendationType.NEUTRAL,
            recommendation_reason=simulation.recommendation_reason or "",
            ai_analysis=simulation.ai_analysis,
            created_at=simulation.created_at
        )


simulation_service = SimulationService()
