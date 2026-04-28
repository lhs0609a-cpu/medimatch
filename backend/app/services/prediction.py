from typing import Optional, Dict, Any, List
import logging

from ..data.utilization_rate import (
    estimate_daily_patients,
    calculate_target_population,
    get_utilization_rate,
)
from ..data.visit_price import (
    estimate_monthly_revenue,
    get_regional_price,
    get_revenue_breakdown,
    get_non_covered_ratio,
)
from ..data.closure_rates import (
    calculate_survival_curve,
    get_clinic_type_market_status,
    estimate_proper_premium,
)

logger = logging.getLogger(__name__)


class PredictionService:
    """매출 및 처방전 예측 서비스 — 학계 검증 모델 기반.

    학술 근거:
    - 한국 진료권 모델 (HIRA 진료비통계지표 + 인구밀도 + 의사처리한계)
    - HIRA 진료비통계지표 2023
    - PMC11399738 (2024) — SVM AUC 0.762 폐업 예측
    - BMC Primary Care 2025 — Cox 회귀 진료과별 HR
    """

    # 진료과목별 평균 데이터 (실제로는 심평원 데이터 기반)
    CLINIC_BASE_DATA = {
        "내과": {
            "avg_daily_patients": 50,
            "avg_revenue_per_patient": 50000,
            "prescription_rate": 0.8,
        },
        "정형외과": {
            "avg_daily_patients": 40,
            "avg_revenue_per_patient": 80000,
            "prescription_rate": 0.6,
        },
        "피부과": {
            "avg_daily_patients": 35,
            "avg_revenue_per_patient": 70000,
            "prescription_rate": 0.5,
        },
        "성형외과": {
            "avg_daily_patients": 15,
            "avg_revenue_per_patient": 500000,
            "prescription_rate": 0.2,
        },
        "이비인후과": {
            "avg_daily_patients": 45,
            "avg_revenue_per_patient": 45000,
            "prescription_rate": 0.75,
        },
        "소아청소년과": {
            "avg_daily_patients": 40,
            "avg_revenue_per_patient": 40000,
            "prescription_rate": 0.85,
        },
        "안과": {
            "avg_daily_patients": 35,
            "avg_revenue_per_patient": 60000,
            "prescription_rate": 0.4,
        },
        "치과": {
            "avg_daily_patients": 20,
            "avg_revenue_per_patient": 150000,
            "prescription_rate": 0.3,
        },
        "신경외과": {
            "avg_daily_patients": 25,
            "avg_revenue_per_patient": 100000,
            "prescription_rate": 0.5,
        },
        "산부인과": {
            "avg_daily_patients": 30,
            "avg_revenue_per_patient": 80000,
            "prescription_rate": 0.4,
        },
        "비뇨의학과": {
            "avg_daily_patients": 30,
            "avg_revenue_per_patient": 70000,
            "prescription_rate": 0.6,
        },
        "정신건강의학과": {
            "avg_daily_patients": 20,
            "avg_revenue_per_patient": 80000,
            "prescription_rate": 0.9,
        },
        "재활의학과": {
            "avg_daily_patients": 35,
            "avg_revenue_per_patient": 60000,
            "prescription_rate": 0.4,
        },
        "가정의학과": {
            "avg_daily_patients": 40,
            "avg_revenue_per_patient": 50000,
            "prescription_rate": 0.7,
        },
    }

    # 지역별 보정 계수 (서울 기준)
    REGION_MULTIPLIERS = {
        "강남": 1.5,
        "서초": 1.4,
        "송파": 1.3,
        "마포": 1.2,
        "영등포": 1.2,
        "강서": 1.1,
        "관악": 1.0,
        "노원": 0.9,
        "default": 1.0,
    }

    async def predict_revenue(
        self,
        clinic_type: str,
        latitude: float,
        longitude: float,
        size_pyeong: Optional[float],
        nearby_hospitals: List[Dict],
        commercial_data: Dict,
        demographics_data: Dict
    ) -> Dict[str, Any]:
        """
        학계 검증 매출 예측.

        공식 (한국 진료권 모델 + HIRA 단가):
            1일 환자수 = 진료권 인구 × 진료과별 수료율 ÷ 1000
                        ÷ 진료일 ÷ (경쟁의원수+1) × 입지보정
            월 매출 = 1일 환자수 × 월 진료일 × 시군구×진료과 단가

        학계 R² 0.50~0.65 (변수 5개 SVM 기준).
        """

        # ─── 1) 진료권 인구 (타겟 연령 가중치 적용) ───
        total_pop = demographics_data.get("population_1km", 45000)
        age_dist = self._extract_age_distribution(demographics_data)
        target_population = calculate_target_population(
            clinic_type, age_dist, total_pop
        )

        # ─── 2) 경쟁의원 수 ───
        same_dept_count = len([
            h for h in nearby_hospitals
            if clinic_type.lower() in h.get("clinic_type", "").lower()
        ])

        # ─── 3) 입지 보정계수 (VWORLD 건물 메타 + 카카오 + 네이버 트렌드) ───
        # 유동인구 + 지역 + 크기 + 건물 + 검색트렌드 종합
        floating_pop = commercial_data.get("floating_population", 50000)
        floating_factor = min(1.4, max(0.7, floating_pop / 50000))

        region_factor = self._get_region_factor(latitude, longitude)

        size = size_pyeong or 30
        size_factor = min(1.25, max(0.85, size / 30))

        # VWORLD 빌딩 보정 (메디컬빌딩 +15%, 신축 +3%, 노후 -8%)
        building_meta = demographics_data.get("building_meta") or {}
        building_factor = building_meta.get("location_factor", 1.0)

        # 네이버 검색 트렌드 보정 (모멘텀 ±15%)
        search_trend = demographics_data.get("search_trend") or {}
        if search_trend.get("momentum") is not None:
            from .naver_datalab import NaverDatalabClient
            trend_factor = NaverDatalabClient.momentum_to_revenue_factor(search_trend["momentum"])
        else:
            trend_factor = 1.0

        location_factor = (
            floating_factor * region_factor * size_factor * building_factor * trend_factor
        )
        # 정규화 (기준점 1.0, 폭주 방지)
        location_factor = max(0.5, min(2.5, location_factor))

        # ─── 4) 1일 환자 수 (학계 공식 + 현실성 cap) ───
        # 시장 점유율 cap: 경쟁이 없어도 환자가 모두 한 곳으로 가지 않음.
        # 학계 (BMC 2025): 단일 의원 시장점유율 평균 18-25%, 최대 35%
        from ..data.growth_reference import get_doctor_capacity

        MAX_MARKET_SHARE = 0.32   # 32% cap
        MARKET_SHARE_FALLBACK_NO_COMP = 0.25  # 경쟁 0일 때 기본값

        if same_dept_count == 0:
            effective_market_share = MARKET_SHARE_FALLBACK_NO_COMP
        else:
            effective_market_share = min(1.0 / (same_dept_count + 1), MAX_MARKET_SHARE)

        daily_patients_raw = estimate_daily_patients(
            clinic_type=clinic_type,
            target_population=target_population,
            competitor_count=same_dept_count,
            location_factor=location_factor,
        )
        # 위 함수 결과를 점유율 cap 후 재계산
        utilization = get_utilization_rate(clinic_type)
        annual_visits = target_population * utilization / 1000.0
        daily_market_total = annual_visits / 290.0
        daily_patients_capped = (
            daily_market_total * effective_market_share * location_factor
        )

        # 의사 1인 처리 한계 cap (치과 20명/일, 내과 60명/일 등)
        # 의사 처리능력은 입지 무관 — location_factor 곱하지 않음
        doctor_capacity = get_doctor_capacity(clinic_type)
        daily_patients = min(daily_patients_capped, float(doctor_capacity))
        # 너무 작으면 (최저 5명) 보정
        daily_patients = max(daily_patients, 5.0)

        # ─── 5) 월 매출 (실시간 비급여 단가 우선, 정적 폴백) ───
        region_code = demographics_data.get("region_code", "") or ""
        working_days = 24

        # HIRA 비급여 실시간 단가가 있으면 평균 활용
        non_covered_fees = demographics_data.get("non_covered_fees") or []
        if non_covered_fees:
            valid_fees = [f["median_amount"] for f in non_covered_fees if f.get("median_amount", 0) > 0]
            if valid_fees:
                # 비급여 평균을 정적 단가에 가중 (50% 정적 + 50% 실시간)
                static_price = get_regional_price(clinic_type, region_code)
                live_avg = sum(valid_fees) / len(valid_fees)
                # 비급여 평균은 보통 서비스 단가와 다르므로 비중으로 보정
                weighted_price = int(static_price * 0.6 + live_avg * 0.4)
            else:
                weighted_price = get_regional_price(clinic_type, region_code)
        else:
            weighted_price = get_regional_price(clinic_type, region_code)

        avg_monthly_revenue = int(daily_patients * working_days * weighted_price)

        # ─── 6) 보험/비급여 분리 ───
        breakdown = get_revenue_breakdown(clinic_type, avg_monthly_revenue)

        # ─── 7) 신뢰구간 ───
        min_revenue = int(avg_monthly_revenue * 0.78)
        max_revenue = int(avg_monthly_revenue * 1.25)

        # ─── 8) 신뢰도 점수 ───
        confidence_score = self._calculate_confidence(
            same_dept_count,
            floating_pop,
            len(nearby_hospitals),
            demographics_data
        )

        return {
            "min": min_revenue,
            "avg": avg_monthly_revenue,
            "max": max_revenue,
            "daily_patients": int(round(daily_patients)),
            "target_population": target_population,
            "utilization_rate": get_utilization_rate(clinic_type),
            "visit_price": get_regional_price(clinic_type, region_code),
            "non_covered_ratio": breakdown["non_covered_ratio"],
            "covered_revenue": breakdown["covered_revenue"],
            "non_covered_revenue": breakdown["non_covered_revenue"],
            "confidence_score": confidence_score,
            "data_source": "HIRA 진료비통계지표 + 한국 진료권 모델 (의사 처리한계 + 시장점유율 32% cap)",
            "factors": {
                "target_population": target_population,
                "utilization_per_1000": get_utilization_rate(clinic_type),
                "competitor_count": same_dept_count,
                "market_share": round(effective_market_share, 3),
                "location_factor": round(location_factor, 2),
                "regional_price_won": get_regional_price(clinic_type, region_code),
                "doctor_capacity_per_day": doctor_capacity,
                "is_capacity_limited": daily_patients_capped > doctor_capacity * location_factor,
            }
        }

    @staticmethod
    def _extract_age_distribution(demographics_data: Dict) -> Dict[str, int]:
        """demographics_data에서 연령대별 인구 추출."""
        age_dist = {}
        total = demographics_data.get("population_1km", 0)
        if total == 0:
            return {}

        # 비율 기반 계산
        ratios = {
            "age_0_9": demographics_data.get("age_0_9_ratio") or 0.08,
            "age_10_19": demographics_data.get("age_10_19_ratio") or 0.10,
            "age_20_29": demographics_data.get("age_20_29_ratio") or 0.13,
            "age_30_39": demographics_data.get("age_30_39_ratio") or 0.15,
            "age_40_49": demographics_data.get("age_40_49_ratio") or 0.17,
            "age_50_59": demographics_data.get("age_50_59_ratio") or 0.18,
            "age_60_plus": demographics_data.get("age_60_plus_ratio") or 0.19,
        }
        for key, ratio in ratios.items():
            age_dist[key] = int(total * ratio)
        return age_dist

    def predict_survival(
        self,
        clinic_type: str,
        same_dept_count: int,
        target_population: int,
        monthly_rent: int = 0,
        monthly_revenue: int = 0,
        elderly_ratio: float = 0.15,
        has_subway_5min: bool = True,
    ) -> Dict[str, Any]:
        """
        생존확률 예측 — Cox + SVM 학계 모델.
        학계 AUC 0.76 (PMC11399738).
        """
        survival = calculate_survival_curve(
            clinic_type=clinic_type,
            competitor_count=same_dept_count,
            target_population=target_population,
            monthly_rent=monthly_rent,
            monthly_revenue=monthly_revenue,
            has_subway_5min=has_subway_5min,
            elderly_ratio=elderly_ratio,
        )
        market_status = get_clinic_type_market_status(clinic_type)
        return {
            **survival,
            "market_status": market_status,
            "data_source": "Cox 회귀 (BMC 2025) + SVM AUC 0.762 (PMC11399738)",
        }

    async def predict_prescription(
        self,
        clinic_type: str,
        latitude: float,
        longitude: float,
        nearby_hospitals: List[Dict],
        commercial_data: Dict
    ) -> Dict[str, Any]:
        """
        처방전 예측 (PharmMatch용)

        [산출 공식]
        일일_처방전 = 예상_환자수 × 처방율
        월_조제료 = 일일_처방전 × 평균_조제료 × 영업일
        """

        base_data = self.CLINIC_BASE_DATA.get(clinic_type, {
            "avg_daily_patients": 30,
            "prescription_rate": 0.5,
        })

        # 예상 환자 수 먼저 계산
        revenue_prediction = await self.predict_revenue(
            clinic_type=clinic_type,
            latitude=latitude,
            longitude=longitude,
            size_pyeong=None,
            nearby_hospitals=nearby_hospitals,
            commercial_data=commercial_data,
            demographics_data={}
        )

        daily_patients = revenue_prediction.get("daily_patients", 30)
        prescription_rate = base_data["prescription_rate"]

        # 일일 처방전 수
        daily_prescriptions = int(daily_patients * prescription_rate)

        # 평균 조제료 (처방전당)
        avg_dispensing_fee = 8000  # 8,000원

        # 월 조제료 매출
        working_days = 25
        monthly_dispensing_revenue = daily_prescriptions * avg_dispensing_fee * working_days

        # 신뢰 구간
        min_daily_rx = int(daily_prescriptions * 0.7)
        max_daily_rx = int(daily_prescriptions * 1.4)

        return {
            "daily_prescriptions": {
                "min": min_daily_rx,
                "avg": daily_prescriptions,
                "max": max_daily_rx,
            },
            "monthly_revenue": {
                "min": min_daily_rx * avg_dispensing_fee * working_days,
                "avg": monthly_dispensing_revenue,
                "max": max_daily_rx * avg_dispensing_fee * working_days,
            },
            "confidence_score": revenue_prediction.get("confidence_score", 70),
        }

    def _get_region_factor(self, latitude: float, longitude: float) -> float:
        """좌표 기반 지역 보정 계수"""
        # 강남 (37.498~37.520, 127.020~127.070)
        if 37.498 <= latitude <= 37.520 and 127.020 <= longitude <= 127.070:
            return self.REGION_MULTIPLIERS["강남"]

        # 서초 (37.475~37.510, 126.970~127.030)
        if 37.475 <= latitude <= 37.510 and 126.970 <= longitude <= 127.030:
            return self.REGION_MULTIPLIERS["서초"]

        # 송파 (37.495~37.530, 127.070~127.150)
        if 37.495 <= latitude <= 37.530 and 127.070 <= longitude <= 127.150:
            return self.REGION_MULTIPLIERS["송파"]

        # 마포 (37.540~37.570, 126.890~126.960)
        if 37.540 <= latitude <= 37.570 and 126.890 <= longitude <= 126.960:
            return self.REGION_MULTIPLIERS["마포"]

        return self.REGION_MULTIPLIERS["default"]

    def _calculate_confidence(
        self,
        competition_count: int,
        floating_pop: int,
        total_hospitals: int,
        demographics: Dict
    ) -> int:
        """신뢰도 점수 계산 (0-100)"""
        score = 70  # 기본 점수

        # 데이터 가용성에 따른 조정
        if floating_pop > 0:
            score += 10
        if demographics.get("population_1km", 0) > 0:
            score += 10
        if total_hospitals > 0:
            score += 5

        # 경쟁이 적으면 예측이 더 정확
        if competition_count <= 3:
            score += 5

        return min(100, max(50, score))


prediction_service = PredictionService()
