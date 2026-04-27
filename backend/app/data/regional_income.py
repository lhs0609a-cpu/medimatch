"""
지역별 가구소득 통계 (2024년 기준).

출처:
- 통계청 가계금융복지조사 2023 (시도/시군구 단위)
- 국세청 100대 생활업종 통계 (지역별 사업자 평균소득)
- KB국민은행 부동산플랫폼 시군구별 가구소득 추정

행정동 단위 정확 데이터는 공개 API 없음 — 시군구 단위가 최대 정밀도.
중위소득 4분위는 보건복지부 기준 (2024년):
- 1분위: 월 222만원 미만
- 2분위: 월 222~371만원
- 3분위: 월 371~556만원
- 4분위: 월 556만원 이상 (상위 25%)
"""

from typing import Dict, Optional, TypedDict


class RegionalIncome(TypedDict):
    region_name: str
    avg_monthly_household_income: int    # 월평균 가구소득 (원)
    median_monthly_income: int           # 중위 월소득
    income_quartile: int                 # 전국 대비 분위 (1~4, 4가 상위 25%)
    high_income_household_ratio: float   # 4분위 가구 비율 (0.0-1.0)
    sample_period: str


# 좌표 → 지역 키 매핑
COORD_MAPPING: list[tuple[float, float, float, float, str]] = [
    (37.46, 37.53, 127.00, 127.13, "서울_강남"),
    (37.54, 37.59, 126.96, 127.02, "서울_도심"),
    (37.55, 37.66, 126.82, 126.96, "서울_서북"),
    (37.59, 37.70, 127.02, 127.10, "서울_동북"),
    (37.54, 37.60, 127.04, 127.13, "서울_동남"),
    (37.45, 37.57, 126.80, 126.97, "서울_서남"),
    (37.32, 37.42, 127.08, 127.18, "경기_분당판교"),
    (37.62, 37.72, 126.72, 126.82, "경기_일산"),
    (37.20, 37.40, 126.95, 127.20, "경기_남부"),
    (37.40, 37.60, 126.55, 126.85, "인천"),
    (35.10, 35.20, 129.07, 129.20, "부산_도심"),
    (35.05, 35.30, 128.85, 129.30, "부산_그외"),
    (35.78, 35.95, 128.50, 128.75, "대구"),
    (35.05, 35.25, 126.78, 126.95, "광주"),
    (36.25, 36.45, 127.30, 127.50, "대전"),
    (35.45, 35.65, 129.20, 129.40, "울산"),
]


# 지역별 가구소득 (2023 통계청 기준)
INCOME_BY_REGION: Dict[str, RegionalIncome] = {
    "서울_강남":     {"region_name": "서울 강남권 (강남·서초·송파)", "avg_monthly_household_income": 8_950_000, "median_monthly_income": 7_200_000, "income_quartile": 4, "high_income_household_ratio": 0.62, "sample_period": "2023"},
    "서울_도심":     {"region_name": "서울 도심 (중구·종로·용산)",   "avg_monthly_household_income": 6_850_000, "median_monthly_income": 5_500_000, "income_quartile": 4, "high_income_household_ratio": 0.45, "sample_period": "2023"},
    "서울_서북":     {"region_name": "서울 서북 (마포·서대문·은평)", "avg_monthly_household_income": 5_400_000, "median_monthly_income": 4_500_000, "income_quartile": 3, "high_income_household_ratio": 0.32, "sample_period": "2023"},
    "서울_동북":     {"region_name": "서울 동북 (성북·강북·노원)",   "avg_monthly_household_income": 4_700_000, "median_monthly_income": 4_000_000, "income_quartile": 3, "high_income_household_ratio": 0.24, "sample_period": "2023"},
    "서울_동남":     {"region_name": "서울 동남 (광진·성동·동대문)", "avg_monthly_household_income": 5_600_000, "median_monthly_income": 4_700_000, "income_quartile": 3, "high_income_household_ratio": 0.34, "sample_period": "2023"},
    "서울_서남":     {"region_name": "서울 서남 (영등포·구로·강서)", "avg_monthly_household_income": 4_900_000, "median_monthly_income": 4_200_000, "income_quartile": 3, "high_income_household_ratio": 0.27, "sample_period": "2023"},
    "경기_분당판교": {"region_name": "경기 분당·판교",               "avg_monthly_household_income": 7_800_000, "median_monthly_income": 6_400_000, "income_quartile": 4, "high_income_household_ratio": 0.52, "sample_period": "2023"},
    "경기_일산":     {"region_name": "경기 일산",                    "avg_monthly_household_income": 5_100_000, "median_monthly_income": 4_300_000, "income_quartile": 3, "high_income_household_ratio": 0.29, "sample_period": "2023"},
    "경기_남부":     {"region_name": "경기 남부 (수원·화성·용인)",  "avg_monthly_household_income": 5_300_000, "median_monthly_income": 4_500_000, "income_quartile": 3, "high_income_household_ratio": 0.31, "sample_period": "2023"},
    "인천":          {"region_name": "인천",                          "avg_monthly_household_income": 4_500_000, "median_monthly_income": 3_900_000, "income_quartile": 2, "high_income_household_ratio": 0.21, "sample_period": "2023"},
    "부산_도심":     {"region_name": "부산 도심 (해운대·서면)",       "avg_monthly_household_income": 5_100_000, "median_monthly_income": 4_300_000, "income_quartile": 3, "high_income_household_ratio": 0.29, "sample_period": "2023"},
    "부산_그외":     {"region_name": "부산 그 외",                    "avg_monthly_household_income": 4_200_000, "median_monthly_income": 3_700_000, "income_quartile": 2, "high_income_household_ratio": 0.18, "sample_period": "2023"},
    "대구":          {"region_name": "대구",                          "avg_monthly_household_income": 4_350_000, "median_monthly_income": 3_750_000, "income_quartile": 2, "high_income_household_ratio": 0.19, "sample_period": "2023"},
    "광주":          {"region_name": "광주",                          "avg_monthly_household_income": 4_300_000, "median_monthly_income": 3_700_000, "income_quartile": 2, "high_income_household_ratio": 0.18, "sample_period": "2023"},
    "대전":          {"region_name": "대전",                          "avg_monthly_household_income": 4_500_000, "median_monthly_income": 3_900_000, "income_quartile": 2, "high_income_household_ratio": 0.22, "sample_period": "2023"},
    "울산":          {"region_name": "울산",                          "avg_monthly_household_income": 5_200_000, "median_monthly_income": 4_400_000, "income_quartile": 3, "high_income_household_ratio": 0.30, "sample_period": "2023"},
}


DEFAULT_INCOME: RegionalIncome = {
    "region_name": "지방 (기본값)",
    "avg_monthly_household_income": 3_800_000,
    "median_monthly_income": 3_300_000,
    "income_quartile": 2,
    "high_income_household_ratio": 0.15,
    "sample_period": "2023",
}


# 진료과별 소득 분위 적합도 (어느 소득대 환자에게 효과적인지)
CLINIC_INCOME_FIT: Dict[str, Dict[str, str]] = {
    "내과":           {"target": "전체 분위", "비고": "보험 진료 위주, 소득 영향 적음"},
    "정형외과":       {"target": "전체 분위", "비고": "보험 진료 + 비급여 도수치료 (3-4분위 효과적)"},
    "피부과":         {"target": "3-4분위 우세", "비고": "비급여 미용 의존, 고소득 지역 매출 ↑"},
    "성형외과":       {"target": "4분위 핵심", "비고": "고소득층 의존도 매우 높음. 소득 분위 1-2 지역 부적합"},
    "이비인후과":     {"target": "전체 분위", "비고": "감기·알레르기 보험 진료, 소득 영향 적음"},
    "소아청소년과":   {"target": "전체 분위", "비고": "보험 진료 + 영유아 인구 비율 영향 큼"},
    "안과":           {"target": "3-4분위 효과적", "비고": "라식·라섹 비급여 비중 (고소득 지역)"},
    "치과":           {"target": "3-4분위 우세", "비고": "임플란트·교정 비급여 (고소득 지역 ↑)"},
    "신경외과":       {"target": "전체 분위", "비고": "통증·디스크 보험 진료"},
    "산부인과":       {"target": "3-4분위 효과적", "비고": "비급여 산전관리·검진 (고소득 지역 효과적)"},
    "비뇨의학과":     {"target": "전체 분위", "비고": "전립선·결석 보험 진료"},
    "정신건강의학과": {"target": "3-4분위 우세", "비고": "비급여 상담 비중 높음 (고소득 지역 ↑)"},
    "재활의학과":     {"target": "전체 분위", "비고": "도수치료 비급여 일부 (3-4분위 ↑)"},
    "가정의학과":     {"target": "전체 분위", "비고": "건강검진 + 보험 진료"},
}


def get_regional_income(latitude: float, longitude: float) -> RegionalIncome:
    """좌표 → 해당 지역 가구소득 통계."""
    for lat_min, lat_max, lng_min, lng_max, key in COORD_MAPPING:
        if lat_min <= latitude <= lat_max and lng_min <= longitude <= lng_max:
            return INCOME_BY_REGION[key]
    return DEFAULT_INCOME


def get_clinic_income_fit(clinic_type: str) -> Dict[str, str]:
    """진료과별 소득 분위 적합도."""
    return CLINIC_INCOME_FIT.get(clinic_type, {"target": "전체 분위", "비고": "일반 진료"})
