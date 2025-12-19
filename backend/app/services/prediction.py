from typing import Optional, Dict, Any, List
import logging

logger = logging.getLogger(__name__)


class PredictionService:
    """매출 및 처방전 예측 서비스"""

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
        매출 예측

        [입력 변수]
        - 반경 1km 내 동일 진료과목 병원 수
        - 해당 동네 진료과목별 평균 처방전 발행 건수
        - 유동인구 × 연령대 가중치
        - 기존 약국 포화도
        - 대중교통 접근성 점수

        [산출 공식]
        일일_환자수 = (지역_평균_환자수 / 경쟁_병원수) × 유동인구_가중치 × 접근성_계수
        """

        # 기본 데이터 가져오기
        base_data = self.CLINIC_BASE_DATA.get(clinic_type, {
            "avg_daily_patients": 30,
            "avg_revenue_per_patient": 60000,
            "prescription_rate": 0.5,
        })

        # 경쟁 병원 수 계산
        same_dept_count = len([
            h for h in nearby_hospitals
            if clinic_type.lower() in h.get("clinic_type", "").lower()
        ])
        competition_factor = max(0.3, 1 / (same_dept_count + 1))

        # 유동인구 가중치 (정규화된 값 사용)
        floating_pop = commercial_data.get("floating_population", 50000)
        population_factor = min(1.5, max(0.7, floating_pop / 50000))

        # 인구 구조 가중치 (40대 이상 비율이 높으면 유리)
        age_40_plus = demographics_data.get("age_40_plus_ratio", 0.4)
        age_factor = 1 + (age_40_plus - 0.35) * 0.5

        # 지역 보정 계수
        region_factor = self._get_region_factor(latitude, longitude)

        # 면적 보정 (큰 병원일수록 환자 수용 가능)
        size = size_pyeong or 30
        size_factor = min(1.3, max(0.8, size / 30))

        # 일일 예상 환자 수 계산
        base_patients = base_data["avg_daily_patients"]
        estimated_daily_patients = int(
            base_patients
            * competition_factor
            * population_factor
            * age_factor
            * region_factor
            * size_factor
        )

        # 월 매출 계산 (영업일 25일 기준)
        working_days = 25
        revenue_per_patient = base_data["avg_revenue_per_patient"] * region_factor

        avg_monthly_revenue = int(
            estimated_daily_patients * revenue_per_patient * working_days
        )

        # 신뢰 구간 계산 (±20%)
        min_revenue = int(avg_monthly_revenue * 0.75)
        max_revenue = int(avg_monthly_revenue * 1.30)

        # 신뢰도 점수 계산
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
            "daily_patients": estimated_daily_patients,
            "confidence_score": confidence_score,
            "factors": {
                "competition": round(competition_factor, 2),
                "population": round(population_factor, 2),
                "age": round(age_factor, 2),
                "region": round(region_factor, 2),
                "size": round(size_factor, 2),
            }
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
