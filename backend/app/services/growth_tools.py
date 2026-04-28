"""
성장/생존 7개 도구 — 통합 서비스.
1. 마케팅 ROAS 계산기
2. 폐업 사례 분석기 (LOCALDATA + 좌표)
3. 비급여 시술 매출 시뮬레이터
4. 가격 최적화 (탄력성 모델)
5. 직원 채용 ROI
6. 진료시간 최적화
7. 브랜딩 전략 빌더
"""
from typing import Dict, List, Any, Optional
from datetime import datetime
import math
import logging

from ..data.growth_reference import (
    CAC_BY_CLINIC, MARKETING_CHANNELS, PRICE_ELASTICITY,
    DOCTOR_DAILY_CAPACITY, RECOMMENDED_STAFF,
    LABOR_OVERHEAD_RATIO, TIME_BONUS_RATES, WORKING_HOUR_GAIN,
    NON_COVERED_PROCEDURES, DIFFERENTIATION_AXES,
    get_cac, get_elasticity, get_doctor_capacity,
    get_recommended_staff, get_labor_cost, total_labor_cost_with_overhead,
)
from ..data.utilization_rate import get_utilization_rate
from ..data.visit_price import get_regional_price, get_non_covered_ratio
from .localdata_client import localdata_client

logger = logging.getLogger(__name__)


class GrowthToolsService:
    """7개 성장 도구 통합 서비스."""

    # ─────────────────────────────────────────────────────────────
    # 1. 마케팅 ROAS 계산기
    # ─────────────────────────────────────────────────────────────
    def calculate_marketing_roas(
        self,
        clinic_type: str,
        monthly_budget: int,
        channels: Optional[List[str]] = None,
        avg_revenue_per_patient: Optional[int] = None,
        retention_months: float = 6.0,
        region_code: str = "",
    ) -> Dict[str, Any]:
        """
        월 마케팅비 × 채널 → 신환 수 + 매출 + ROAS.
        """
        cac = get_cac(clinic_type)
        if not avg_revenue_per_patient:
            avg_revenue_per_patient = get_regional_price(clinic_type, region_code)

        # 채널 필터링 (기본: 진료과 추천 채널)
        all_channels = MARKETING_CHANNELS
        if channels:
            relevant = [c for c in all_channels if c["id"] in channels]
        else:
            relevant = [
                c for c in all_channels
                if "전체" in c["best_for"] or clinic_type in c["best_for"]
            ]

        # 예산을 채널별로 균등 분배
        if not relevant:
            relevant = all_channels[:3]
        per_channel = monthly_budget // max(len(relevant), 1)

        results = []
        total_new_patients = 0
        for ch in relevant:
            allocated = max(per_channel, ch["monthly_min"])
            allocated = min(allocated, ch["monthly_max"])
            patients = int(allocated / 1_000_000 * ch["patient_per_million"])
            roas = ch["expected_roas"]
            revenue_from_channel = patients * avg_revenue_per_patient * retention_months
            results.append({
                "channel_id": ch["id"],
                "channel_name": ch["name"],
                "allocated_budget": allocated,
                "expected_new_patients_monthly": patients,
                "expected_roas": roas,
                "lifetime_revenue": int(revenue_from_channel),
                "best_for": ch["best_for"],
                "note": ch["note"],
            })
            total_new_patients += patients

        total_lifetime_revenue = total_new_patients * avg_revenue_per_patient * retention_months
        overall_roas = total_lifetime_revenue / monthly_budget if monthly_budget > 0 else 0

        return {
            "monthly_budget": monthly_budget,
            "clinic_type": clinic_type,
            "cac_estimate": cac,
            "avg_revenue_per_patient": avg_revenue_per_patient,
            "retention_months": retention_months,
            "channels": results,
            "total_new_patients_monthly": total_new_patients,
            "total_lifetime_revenue": int(total_lifetime_revenue),
            "overall_roas": round(overall_roas, 2),
            "data_source": "강남언니/굿닥 공시 + HIRA 단가 + 산업 평균",
        }

    # ─────────────────────────────────────────────────────────────
    # 2. 폐업 사례 분석기 (LOCALDATA 좌표 기반)
    # ─────────────────────────────────────────────────────────────
    async def analyze_closure_cases(
        self,
        latitude: float,
        longitude: float,
        sido_cd: str,
        sggu_cd: str,
        radius_m: int = 1000,
        years: int = 5,
        clinic_type_filter: Optional[str] = None,
    ) -> Dict[str, Any]:
        """반경 N km 내 폐업 의원 사례 분석."""
        from datetime import timedelta
        from_date = (datetime.now() - timedelta(days=365 * years)).strftime("%Y%m%d")

        records = await localdata_client.get_clinic_history(
            sido_cd=sido_cd,
            sggu_cd=sggu_cd,
            from_date=from_date,
            category="의원",
            page_size=500,
        )

        # 좌표 기반 필터링 (haversine)
        nearby = []
        for r in records:
            if not r.get("lat") or not r.get("lng"):
                continue
            d = self._haversine(latitude, longitude, r["lat"], r["lng"])
            if d <= radius_m:
                r["distance_m"] = round(d)
                nearby.append(r)

        # 진료과 필터 (biz_type에 진료과 포함되면 매칭)
        if clinic_type_filter:
            nearby = [r for r in nearby if clinic_type_filter in (r.get("biz_type") or "")]

        # 폐업 vs 영업 분리
        closed = [r for r in nearby if "폐업" in (r.get("status") or "")]
        active = [r for r in nearby if "영업" in (r.get("status") or "")]

        # 영업기간 계산 + 폐업사유 추정
        for r in closed:
            try:
                opened = datetime.strptime(r["open_date"][:8], "%Y%m%d") if r.get("open_date") else None
                closed_dt = datetime.strptime(r["close_date"][:8], "%Y%m%d") if r.get("close_date") else None
                if opened and closed_dt:
                    lifespan_days = (closed_dt - opened).days
                    r["lifespan_years"] = round(lifespan_days / 365.25, 1)
                    if lifespan_days < 365:
                        r["closure_reason_estimated"] = "자금부족 (1년 미만)"
                    elif lifespan_days < 365 * 3:
                        r["closure_reason_estimated"] = "조기 경영난 (1-3년)"
                    elif lifespan_days < 365 * 5:
                        r["closure_reason_estimated"] = "성장 정체 (3-5년)"
                    else:
                        r["closure_reason_estimated"] = "은퇴/이전 (5년+)"
            except Exception:
                pass

        # 통계
        lifespans = [r.get("lifespan_years", 0) for r in closed if r.get("lifespan_years", 0) > 0]
        avg_lifespan = sum(lifespans) / len(lifespans) if lifespans else 0
        closure_rate = len(closed) / max(len(nearby), 1) * 100

        # 가장 오래 영업 중인 의원
        oldest_active = None
        for r in active:
            try:
                opened = datetime.strptime(r["open_date"][:8], "%Y%m%d") if r.get("open_date") else None
                if opened:
                    age = (datetime.now() - opened).days / 365.25
                    if not oldest_active or age > oldest_active.get("years", 0):
                        oldest_active = {**r, "years": round(age, 1)}
            except Exception:
                pass

        # 폐업 사유 분포
        reason_dist = {}
        for r in closed:
            rsn = r.get("closure_reason_estimated", "분류불가")
            reason_dist[rsn] = reason_dist.get(rsn, 0) + 1

        return {
            "radius_m": radius_m,
            "years_analyzed": years,
            "clinic_type_filter": clinic_type_filter,
            "total_count": len(nearby),
            "active_count": len(active),
            "closed_count": len(closed),
            "closure_rate_percent": round(closure_rate, 1),
            "avg_lifespan_years": round(avg_lifespan, 1),
            "closure_reason_distribution": reason_dist,
            "oldest_active": oldest_active,
            "closed_clinics": closed[:50],
            "active_clinics": active[:50],
            "data_source": "LOCALDATA 인허가 (좌표·개업일·폐업일 실데이터)",
        }

    # ─────────────────────────────────────────────────────────────
    # 3. 비급여 시술 매출 시뮬레이터
    # ─────────────────────────────────────────────────────────────
    def simulate_procedure_revenue(
        self,
        clinic_type: str,
        procedure_volumes: Dict[str, int],
        region_code: str = "",
    ) -> Dict[str, Any]:
        """
        시술별 월 환자 수 입력 → 월 매출 + 마진 계산.
        procedure_volumes: {"보톡스 (50U)": 50, "필러 (1cc)": 30}
        """
        procedures = NON_COVERED_PROCEDURES.get(clinic_type, [])
        if not procedures:
            return {
                "clinic_type": clinic_type,
                "available": False,
                "note": f"{clinic_type}는 비급여 시술 비중이 낮습니다",
                "items": [],
                "total_revenue": 0,
                "total_margin": 0,
            }

        # 지역 보정
        from ..data.visit_price import SIDO_PRICE_FACTOR, PREMIUM_SGGU
        sido_cd = region_code[:2] if region_code else "11"
        sggu_cd = region_code[:5] if len(region_code) >= 5 else ""
        region_factor = SIDO_PRICE_FACTOR.get(sido_cd, 1.0)
        if sggu_cd in PREMIUM_SGGU and clinic_type in {"피부과", "성형외과", "안과", "치과"}:
            region_factor = PREMIUM_SGGU[sggu_cd]

        items = []
        total_revenue = 0
        total_margin = 0
        total_minutes = 0

        for proc in procedures:
            volume = procedure_volumes.get(proc["name"], 0)
            adjusted_price = int(proc["typical"] * region_factor)
            revenue = volume * adjusted_price
            margin = int(revenue * proc["margin"])
            items.append({
                "name": proc["name"],
                "volume_per_month": volume,
                "unit_price": adjusted_price,
                "unit_price_typical": proc["typical"],
                "revenue": revenue,
                "margin_amount": margin,
                "margin_ratio": proc["margin"],
                "duration_minutes": proc["duration_min"],
                "is_recommended": volume > 0,
            })
            total_revenue += revenue
            total_margin += margin
            total_minutes += volume * proc["duration_min"]

        # 월 진료시간 환산 (24일 × 8시간 = 11,520분)
        capacity_minutes = 24 * 8 * 60
        utilization = total_minutes / capacity_minutes if capacity_minutes > 0 else 0

        # ROI 추천 — 마진율 × 시간당 매출 기준
        for item in items:
            time_efficiency = item["margin_amount"] / max(item["volume_per_month"] * item["duration_minutes"], 1)
            item["roi_per_minute"] = int(time_efficiency)

        items_sorted_by_roi = sorted(items, key=lambda x: x["roi_per_minute"], reverse=True)

        return {
            "clinic_type": clinic_type,
            "available": True,
            "items": items,
            "top_3_by_roi": [it["name"] for it in items_sorted_by_roi[:3]],
            "total_revenue": total_revenue,
            "total_margin": total_margin,
            "total_minutes_used": total_minutes,
            "capacity_utilization_percent": round(utilization * 100, 1),
            "region_factor": region_factor,
            "data_source": "HIRA 비급여 공시 + 의협 시장 평균",
        }

    # ─────────────────────────────────────────────────────────────
    # 4. 가격 최적화 (탄력성 모델)
    # ─────────────────────────────────────────────────────────────
    def optimize_price(
        self,
        clinic_type: str,
        current_price: int,
        current_patients_monthly: int,
        price_change_pct: float = 0.0,
    ) -> Dict[str, Any]:
        """
        가격 X% 변경 시 환자/매출 변화 시뮬.
        """
        epsilon = get_elasticity(clinic_type)

        new_price = int(current_price * (1 + price_change_pct / 100))

        # 환자 수 변화: ΔQ% = -ε × ΔP%
        patient_change_pct = -epsilon * price_change_pct
        new_patients = int(current_patients_monthly * (1 + patient_change_pct / 100))

        # 매출 비교
        current_revenue = current_price * current_patients_monthly
        new_revenue = new_price * new_patients

        revenue_change = new_revenue - current_revenue
        revenue_change_pct = revenue_change / current_revenue * 100 if current_revenue > 0 else 0

        # 시나리오 분석 (-15% ~ +15%)
        scenarios = []
        for pct in [-15, -10, -5, 0, 5, 10, 15]:
            sim_price = int(current_price * (1 + pct / 100))
            sim_q_change = -epsilon * pct
            sim_patients = int(current_patients_monthly * (1 + sim_q_change / 100))
            sim_revenue = sim_price * sim_patients
            scenarios.append({
                "price_change_pct": pct,
                "new_price": sim_price,
                "patient_change_pct": round(sim_q_change, 2),
                "new_patients": sim_patients,
                "new_revenue": sim_revenue,
                "revenue_change_pct": round((sim_revenue - current_revenue) / current_revenue * 100, 2) if current_revenue > 0 else 0,
            })

        # 최적 가격 (매출 최대화)
        best = max(scenarios, key=lambda s: s["new_revenue"])

        return {
            "clinic_type": clinic_type,
            "elasticity": epsilon,
            "current": {
                "price": current_price,
                "patients": current_patients_monthly,
                "revenue": current_revenue,
            },
            "scenario": {
                "price_change_pct": price_change_pct,
                "new_price": new_price,
                "new_patients": new_patients,
                "new_revenue": new_revenue,
                "revenue_change": revenue_change,
                "revenue_change_pct": round(revenue_change_pct, 2),
            },
            "scenarios_grid": scenarios,
            "optimal_price": best,
            "data_source": "Korean Health Economics 2022 (가격탄력성)",
        }

    # ─────────────────────────────────────────────────────────────
    # 5. 직원 채용 ROI
    # ─────────────────────────────────────────────────────────────
    def calculate_hiring_roi(
        self,
        clinic_type: str,
        current_daily_patients: int,
        current_staff_count: int,
        new_role: str = "간호사",
        new_role_experience: str = "3년차",
        avg_revenue_per_patient: int = 50000,
        region_code: str = "",
    ) -> Dict[str, Any]:
        """
        직원 한 명 추가 시 환자 처리 +N → 매출 +M → BEP 계산.
        """
        doctor_capacity = get_doctor_capacity(clinic_type)
        recommended = get_recommended_staff(clinic_type)
        recommended_total = sum(recommended.values())

        # 현재 의원이 처리 한계까지 도달했는지
        capacity_utilized_pct = current_daily_patients / doctor_capacity * 100 if doctor_capacity > 0 else 0

        # 직원 1명 추가 시 환자 처리 증가량 (역할별)
        capacity_gain_per_role = {
            "간호사": 0.18,           # 의사 처리량 18% 증가
            "간호조무사": 0.10,
            "물리치료사": 0.25,        # 정형/재활 위주
            "방사선사": 0.08,
            "행정/원무": 0.05,
            "코디네이터": 0.20,        # 피부/성형
        }
        gain_pct = capacity_gain_per_role.get(new_role, 0.10)

        # 한계 환자 도달 시까지의 추가 처리 가능 환자
        max_new_capacity = doctor_capacity - current_daily_patients
        actual_gain = min(int(current_daily_patients * gain_pct), max(max_new_capacity, 0))

        # 월 매출 증가
        monthly_revenue_gain = actual_gain * 24 * avg_revenue_per_patient

        # 인건비
        monthly_salary = get_labor_cost(new_role, new_role_experience, region_code)
        monthly_total_cost = total_labor_cost_with_overhead(monthly_salary)

        # BEP (개월)
        net_monthly_gain = monthly_revenue_gain - monthly_total_cost
        bep_months = (
            (monthly_total_cost / monthly_revenue_gain) if monthly_revenue_gain > 0 else float("inf")
        )
        annual_roi = net_monthly_gain * 12 / monthly_total_cost * 100 if monthly_total_cost > 0 else 0

        return {
            "clinic_type": clinic_type,
            "new_role": new_role,
            "new_role_experience": new_role_experience,
            "current": {
                "daily_patients": current_daily_patients,
                "staff_count": current_staff_count,
                "doctor_capacity": doctor_capacity,
                "capacity_utilized_pct": round(capacity_utilized_pct, 1),
            },
            "after_hire": {
                "additional_daily_patients": actual_gain,
                "new_daily_patients": current_daily_patients + actual_gain,
                "new_capacity_pct": round(
                    (current_daily_patients + actual_gain) / doctor_capacity * 100, 1
                ) if doctor_capacity > 0 else 0,
            },
            "financial": {
                "monthly_salary": monthly_salary,
                "total_labor_cost": monthly_total_cost,
                "monthly_revenue_gain": monthly_revenue_gain,
                "net_monthly_gain": net_monthly_gain,
                "bep_months": round(bep_months, 1) if bep_months != float("inf") else None,
                "annual_roi_percent": round(annual_roi, 1),
                "is_profitable": net_monthly_gain > 0,
            },
            "recommended_staff_ratio": recommended,
            "data_source": "잡코리아/너스케입 2025 + HIRA 의사 1인당 환자",
        }

    # ─────────────────────────────────────────────────────────────
    # 6. 진료시간 최적화
    # ─────────────────────────────────────────────────────────────
    def optimize_working_hours(
        self,
        clinic_type: str,
        current_monthly_patients: int,
        avg_revenue_per_patient: int,
        worker_ratio: float = 0.5,  # 직장인구 비율 (0~1)
        added_hours: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        토요/야간/일요 진료 추가 시 환자/매출 증가 시뮬.
        """
        # 직장인구 비율을 카테고리로
        if worker_ratio >= 0.70:
            tier = "직장인_70%이상"
        elif worker_ratio >= 0.50:
            tier = "직장인_50_70%"
        else:
            tier = "직장인_50%이하"

        if not added_hours:
            added_hours = ["토요_오전_추가", "야간_18_21_추가"]

        # 옵션별 효과
        scenarios = []
        all_options = list(WORKING_HOUR_GAIN.keys())
        for opt in all_options:
            gain = WORKING_HOUR_GAIN[opt][tier]
            new_patients = int(current_monthly_patients * gain)

            # 가산수가 적용 (야간/토오후/공휴일은 30%)
            time_bonus = 0.0
            if "야간" in opt or "심야" in opt:
                time_bonus = 0.30
            elif "토요_오후" in opt or "일요" in opt:
                time_bonus = 0.30

            adjusted_revenue = new_patients * avg_revenue_per_patient * (1 + time_bonus)

            # 추가 인건비 추정 (한 명 야간 1시간 = 1.5만원 가산)
            extra_hours_per_month = self._estimate_extra_hours(opt)
            night_premium_cost = int(extra_hours_per_month * 15000 * 1.5)
            extra_utility_cost = int(extra_hours_per_month * 5000)
            extra_cost = night_premium_cost + extra_utility_cost

            scenarios.append({
                "option": opt,
                "option_label": opt.replace("_", " "),
                "additional_patients_monthly": new_patients,
                "patient_gain_pct": round(gain * 100, 1),
                "additional_revenue": int(adjusted_revenue),
                "time_bonus_rate": time_bonus,
                "extra_cost": extra_cost,
                "net_revenue_gain": int(adjusted_revenue) - extra_cost,
                "is_recommended": opt in (added_hours or []),
            })

        scenarios.sort(key=lambda s: s["net_revenue_gain"], reverse=True)

        return {
            "clinic_type": clinic_type,
            "worker_ratio": worker_ratio,
            "tier": tier,
            "current_monthly_patients": current_monthly_patients,
            "avg_revenue_per_patient": avg_revenue_per_patient,
            "scenarios": scenarios,
            "top_recommendation": scenarios[0] if scenarios else None,
            "data_source": "통계청 주간/야간 인구 + 보건복지부 가산수가 고시",
        }

    @staticmethod
    def _estimate_extra_hours(option: str) -> int:
        """월 추가 진료 시간 추정."""
        return {
            "토요_오전_추가": 4 * 4,    # 토요일 4시간 × 4주
            "토요_오후_추가": 5 * 4,
            "야간_18_21_추가": 3 * 20,  # 평일 3시간 × 20일
            "일요_오전_추가": 4 * 4,
        }.get(option, 16)

    # ─────────────────────────────────────────────────────────────
    # 7. 브랜딩 전략 빌더 (페르소나 + 차별화)
    # ─────────────────────────────────────────────────────────────
    def build_branding_strategy(
        self,
        clinic_type: str,
        demographics: Dict[str, Any],
        commercial_data: Optional[Dict[str, Any]] = None,
        competitors: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        인구통계 + 경쟁 → 페르소나 + 차별화 + 광고 카피.
        """
        # 페르소나 자동 생성
        age_40_plus = demographics.get("age_40_plus_ratio", 0.4)
        female_ratio = demographics.get("female_ratio", 0.5)
        income_avg = demographics.get("avg_household_income", 500)  # 만원
        floating = (commercial_data or {}).get("floating_population", 50000)
        single_hh = demographics.get("single_household_ratio", 0.3)

        personas = []

        # 진료과 타겟 + 인구 매칭
        if clinic_type in ("피부과", "성형외과") and female_ratio >= 0.48 and age_40_plus < 0.5:
            personas.append({
                "name": "20-30대 직장인 여성",
                "share": "약 35%",
                "needs": ["점심시간 시술", "예약 편의", "인스타 후기 검증"],
                "channels": ["강남언니", "인스타 광고", "직장인 소개"],
            })
        if clinic_type in ("정형외과", "재활의학과") and age_40_plus >= 0.40:
            personas.append({
                "name": "50-60대 만성통증 환자",
                "share": "약 40%",
                "needs": ["도수치료", "운동치료", "친절한 설명"],
                "channels": ["오프라인 전단", "지역 카페", "병원장 블로그"],
            })
        if clinic_type == "내과":
            if age_40_plus >= 0.45:
                personas.append({
                    "name": "노인 만성질환 (당뇨/고혈압)",
                    "share": "약 50%",
                    "needs": ["근거리", "친근감", "약 처방 신속"],
                    "channels": ["오프라인", "단골 추천"],
                })
            if floating > 60000:
                personas.append({
                    "name": "유동인구 직장인",
                    "share": "약 25%",
                    "needs": ["야간 진료", "감기 신속진료", "검진"],
                    "channels": ["네이버 검색", "똑닥"],
                })
        if clinic_type == "소아청소년과":
            personas.append({
                "name": "30-40대 부모 (특히 엄마)",
                "share": "약 60%",
                "needs": ["대기시간 짧음", "친절한 설명", "주차 편의"],
                "channels": ["맘카페", "동네 추천", "굿닥"],
            })
        if clinic_type == "정신건강의학과":
            personas.append({
                "name": "20-30대 직장인 (번아웃/불안)",
                "share": "약 45%",
                "needs": ["프라이버시", "야간 진료", "단기 상담"],
                "channels": ["네이버 검색", "강남언니 (해시태그)"],
            })

        if not personas:
            personas.append({
                "name": "지역 일반 환자",
                "share": "100%",
                "needs": ["근거리", "친절", "신속"],
                "channels": ["오프라인", "단골"],
            })

        # 경쟁 의원 분석 → 차별화 포인트 추천
        competitor_count = len(competitors) if competitors else 0
        differentiation = self._suggest_differentiation(clinic_type, competitor_count, demographics)

        # AI 카피 (간단 룰베이스)
        copy_samples = self._generate_ad_copy(clinic_type, personas[0])

        return {
            "clinic_type": clinic_type,
            "personas": personas,
            "differentiation_points": differentiation,
            "ad_copy_samples": copy_samples,
            "key_axes": DIFFERENTIATION_AXES.get(clinic_type, DIFFERENTIATION_AXES["공통"]),
            "data_source": "인구통계 매칭 + 경쟁 분석 + 진료과 표준 페르소나",
        }

    def _suggest_differentiation(
        self,
        clinic_type: str,
        competitor_count: int,
        demographics: Dict[str, Any],
    ) -> List[Dict[str, str]]:
        """경쟁 강도 + 인구 → 차별화 추천."""
        suggestions = []

        if competitor_count >= 5:
            suggestions.append({
                "axis": "시간",
                "strategy": "야간/토요 차별화",
                "rationale": f"반경 1km 동일과 {competitor_count}개 — 시간으로 차별화",
            })
            suggestions.append({
                "axis": "전문성",
                "strategy": f"{clinic_type} 세부 분야 전문화",
                "rationale": "포화 시장 — 한 시술/질환에 집중",
            })
        elif competitor_count >= 3:
            suggestions.append({
                "axis": "예약/편의",
                "strategy": "온라인 예약 + 당일진료",
                "rationale": "보통 경쟁 — 편의성으로 차별화",
            })
        else:
            suggestions.append({
                "axis": "범위",
                "strategy": "포괄 진료",
                "rationale": "경쟁 적음 — 폭넓게 진료",
            })

        # 진료과별 추가
        if clinic_type == "피부과":
            suggestions.append({
                "axis": "성별",
                "strategy": "남성 전용 라인 또는 여성 의료진",
                "rationale": "동질 진료과 中 성별 차별화 효과 큼",
            })
        elif clinic_type == "치과":
            suggestions.append({
                "axis": "보장",
                "strategy": "임플란트 5~10년 보증",
                "rationale": "고가 시술 — 신뢰가 결정적",
            })
        elif clinic_type == "정신건강의학과":
            suggestions.append({
                "axis": "프라이버시",
                "strategy": "별도 입구/대기실",
                "rationale": "환자 민감도 높음",
            })

        return suggestions

    def _generate_ad_copy(
        self,
        clinic_type: str,
        primary_persona: Dict[str, Any],
    ) -> List[Dict[str, str]]:
        """페르소나 기반 광고 카피 (의료광고법 준수)."""
        templates = {
            "피부과": [
                {"tone": "신뢰", "copy": f"{primary_persona['name']}을 위한 피부 관리 — 점심시간 30분, 출근 가능."},
                {"tone": "전문성", "copy": "피부과 전문의가 직접 상담하는 1:1 맞춤 케어."},
                {"tone": "편의", "copy": "온라인 예약 24시간, 토요 진료까지."},
            ],
            "내과": [
                {"tone": "신뢰", "copy": f"동네에서 오랫동안 함께하는 가정 주치의."},
                {"tone": "전문성", "copy": "당뇨·고혈압 만성질환 정밀 관리 클리닉."},
                {"tone": "편의", "copy": "예약 없이도 빠르게, 야간진료 ○○:○○까지."},
            ],
            "정형외과": [
                {"tone": "전문성", "copy": "관절·척추 통증, 정형외과 전문의가 직접."},
                {"tone": "편의", "copy": "도수치료 + 운동치료 원스톱."},
                {"tone": "신뢰", "copy": "수술보다 보존치료 우선 — 환자 중심 진료."},
            ],
        }
        return templates.get(clinic_type, [
            {"tone": "신뢰", "copy": f"{clinic_type} 전문의가 함께하는 든든한 진료."},
            {"tone": "편의", "copy": "예약 → 진료 → 처방까지 빠르고 정확하게."},
        ])

    @staticmethod
    def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371000
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlam = math.radians(lon2 - lon1)
        a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
        return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


growth_tools_service = GrowthToolsService()
