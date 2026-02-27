"""
Demographics Analysis API - 상권 인구통계 분석
전국 읍/면/동 단위 인구통계 실시간 분석 (행안부 MOIS 실데이터 + 좌표추정 폴백)
"""

import asyncio
import time
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ...services.external_api import external_api_service

router = APIRouter()

# ── In-memory cache (address → result, 24h TTL) ────────────────────
_cache: Dict[str, Dict[str, Any]] = {}
_cache_ts: Dict[str, float] = {}
_CACHE_TTL = 86400  # 24 hours


class AnalyzeRequest(BaseModel):
    address: str  # e.g. "서울특별시 강남구 역삼동"


# ── Helper: age distribution → display labels ──────────────────────
def _format_age_distribution(age_dist: Dict[str, float]) -> List[Dict[str, Any]]:
    label_map = [
        ("age_0_9", "10대 미만"),
        ("age_10_19", "10대"),
        ("age_20_29", "20대"),
        ("age_30_39", "30대"),
        ("age_40_49", "40대"),
        ("age_50_59", "50대"),
        ("age_60_plus", "60대+"),
    ]
    result = []
    for key, label in label_map:
        val = age_dist.get(key, 0)
        result.append({"label": label, "percent": round(val * 100, 1) if val <= 1 else round(val, 1)})
    return result


# ── Helper: income level from avg_household_income ─────────────────
def _classify_income(avg_income: int) -> tuple:
    if avg_income >= 700:
        return "상위", 95
    elif avg_income >= 550:
        return "중상위", 75
    elif avg_income >= 400:
        return "중위", 55
    else:
        return "중하위", 35


# ── Helper: residential/commercial ratio from day/night ────────────
def _estimate_land_use(day_pop: int, night_pop: int) -> tuple:
    if night_pop == 0:
        return 20, 80
    ratio = day_pop / night_pop
    if ratio <= 2:
        return 70, 30
    elif ratio <= 5:
        return 50, 50
    else:
        return 30, 70


# ── Helper: generate insight text ──────────────────────────────────
def _generate_insight(
    age_dist: List[Dict[str, Any]],
    day_pop: int,
    night_pop: int,
    medical_density: float,
    income_level: str,
) -> str:
    parts = []

    # Dominant age group → recommended specialty
    if age_dist:
        sorted_ages = sorted(age_dist, key=lambda x: x["percent"], reverse=True)
        top = sorted_ages[0]
        specialty_map = {
            "10대 미만": "소아청소년과",
            "10대": "소아청소년과, 교정 치과",
            "20대": "피부과, 정신건강의학과",
            "30대": "내과, 피부과, 산부인과",
            "40대": "내과, 정형외과",
            "50대": "내과(건강검진), 정형외과, 안과",
            "60대+": "내과, 정형외과, 재활의학과",
        }
        rec = specialty_map.get(top["label"], "내과")
        parts.append(f'{top["label"]} 인구 비율이 {top["percent"]}%로 가장 높아 {rec} 수요가 클 것으로 예상됩니다.')

    # Day/night ratio → worker vs residential
    if night_pop > 0:
        dn_ratio = day_pop / night_pop
        if dn_ratio > 5:
            parts.append(f"주간 유동인구가 야간의 {dn_ratio:.1f}배로 직장인 중심 상권입니다. 평일 점심시간 집중 운영 전략이 유리합니다.")
        elif dn_ratio > 2:
            parts.append("주거와 상업이 혼합된 지역으로 오전~저녁까지 고른 환자 분포가 예상됩니다.")
        else:
            parts.append("주거 밀집 지역으로 저녁/주말 진료 수요가 높을 것으로 보입니다.")

    # Medical density → competition
    if medical_density > 15:
        parts.append("의료기관 밀도가 높아 경쟁이 치열합니다. 차별화된 진료 서비스가 필요합니다.")
    elif medical_density > 10:
        parts.append("적정 수준의 의료기관이 분포해 있으며, 전문성을 갖추면 경쟁력 확보가 가능합니다.")
    else:
        parts.append("의료기관이 부족한 지역으로 신규 개원 시 안정적인 환자 확보가 기대됩니다.")

    # Income → out-of-pocket demand
    if income_level in ("상위", "중상위"):
        parts.append("소득수준이 높아 비급여 진료(건강검진, 미용시술 등) 수요가 기대됩니다.")

    return " ".join(parts)


@router.post("/analyze")
async def analyze_demographics(req: AnalyzeRequest):
    """
    주소 기반 인구통계 분석.
    행안부 MOIS 실데이터 우선, 실패 시 좌표추정 모델 폴백.
    """
    address = req.address.strip()
    if not address:
        raise HTTPException(status_code=400, detail="주소를 입력해주세요")

    # ── Cache check ────────────────────────────────────────────────
    now = time.time()
    if address in _cache and (now - _cache_ts.get(address, 0)) < _CACHE_TTL:
        return _cache[address]

    # ── Step 1: Geocode ────────────────────────────────────────────
    geo = await external_api_service.geocode_address(address)
    if not geo:
        raise HTTPException(status_code=404, detail="주소를 찾을 수 없습니다. 정확한 주소를 입력해주세요.")

    lat = geo["latitude"]
    lng = geo["longitude"]
    region_code = geo.get("region_code", "")
    bjdong_code = geo.get("bjdong_code", "")

    # ── Step 2: Parallel API calls ─────────────────────────────────
    demo_task = external_api_service.get_demographics(
        lat, lng, radius_m=1000, stdg_cd=bjdong_code or region_code
    )
    hospital_task = external_api_service.get_nearby_hospitals(
        lat, lng, 1000, region_code=region_code
    )
    demographics, hospitals = await asyncio.gather(demo_task, hospital_task)

    # ── Step 3: Transform to AreaData format ───────────────────────
    population = demographics.get("dong_population") or demographics.get("population_1km", 0)
    households = demographics.get("household_count", 0)

    age_distribution = _format_age_distribution(demographics.get("age_distribution", {}))

    male_ratio = round(demographics.get("male_ratio", 0.5) * 100, 1)
    female_ratio = round(demographics.get("female_ratio", 0.5) * 100, 1)
    # Ensure they sum to 100
    if male_ratio + female_ratio != 100:
        female_ratio = round(100 - male_ratio, 1)

    day_population = demographics.get("floating_weekday_avg", 0)
    night_population = population  # 주민등록 인구 = 야간

    avg_income = demographics.get("avg_household_income", 400)
    income_level, income_index = _classify_income(avg_income)

    nearby_hospital_count = len(hospitals) if isinstance(hospitals, list) else 0
    medical_density = round(
        nearby_hospital_count / (population / 10000), 1
    ) if population > 0 else 0

    residential_ratio, commercial_ratio = _estimate_land_use(day_population, night_population)

    insight = _generate_insight(
        age_distribution, day_population, night_population, medical_density, income_level
    )

    data_source = demographics.get("data_source", "estimation")

    result = {
        "address": geo.get("formatted_address", address),
        "dataSource": data_source,
        "population": population,
        "households": households,
        "ageDistribution": age_distribution,
        "maleRatio": male_ratio,
        "femaleRatio": female_ratio,
        "dayPopulation": day_population,
        "nightPopulation": night_population,
        "incomeLevel": income_level,
        "incomeIndex": income_index,
        "residentialRatio": residential_ratio,
        "commercialRatio": commercial_ratio,
        "medicalDensity": medical_density,
        "nearbyHospitalCount": nearby_hospital_count,
        "insight": insight,
    }

    # ── Cache store ────────────────────────────────────────────────
    _cache[address] = result
    _cache_ts[address] = now

    return result
