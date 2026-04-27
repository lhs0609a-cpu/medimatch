"""
지역별 상가 임대료 시세 (2024년 기준).

출처:
- 한국부동산원 상업용부동산 임대시장동향조사 (2024 Q3)
- 국토교통부 R-ONE 통계 (상업·업무용 부동산 임대료지수)
- 부동산플래닛, 직방, 다방 공개 시세 평균
- 의원급 의료기관 평균 입지 (역세권 + 1~3층) 기준

평당 가격은 의원이 일반적으로 입주하는 상업용 빌딩 (1~3층, 역세권/대로변 인접) 기준.
보증금은 통상 "월세 × 12개월" 표준이지만, 실제로는 지역마다 차이 큼.
"""

from typing import Dict, Optional, TypedDict


class RegionalRent(TypedDict):
    region_name: str
    monthly_rent_per_pyeong: int   # 평당 월세 (원)
    deposit_per_pyeong: int        # 평당 보증금 (원)
    sample_period: str             # 데이터 기준 시점


# 좌표 범위로 매핑 (광역 단위)
# (lat_min, lat_max, lng_min, lng_max) → region_key
COORD_MAPPING: list[tuple[float, float, float, float, str]] = [
    # 서울 강남권 (강남·서초·송파)
    (37.46, 37.53, 127.00, 127.13, "서울_강남"),
    # 서울 도심 (중구·종로·용산)
    (37.54, 37.59, 126.96, 127.02, "서울_도심"),
    # 서울 서북 (마포·서대문·은평)
    (37.55, 37.66, 126.82, 126.96, "서울_서북"),
    # 서울 동북 (성북·강북·노원·도봉)
    (37.59, 37.70, 127.02, 127.10, "서울_동북"),
    # 서울 동남 (광진·성동·동대문·중랑)
    (37.54, 37.60, 127.04, 127.13, "서울_동남"),
    # 서울 서남 (영등포·구로·금천·관악·동작·강서·양천)
    (37.45, 37.57, 126.80, 126.97, "서울_서남"),
    # 경기 분당·판교
    (37.32, 37.42, 127.08, 127.18, "경기_분당판교"),
    # 경기 일산
    (37.62, 37.72, 126.72, 126.82, "경기_일산"),
    # 경기 수원·화성·용인 (광역)
    (37.20, 37.40, 126.95, 127.20, "경기_남부"),
    # 인천
    (37.40, 37.60, 126.55, 126.85, "인천"),
    # 부산 해운대·서면
    (35.10, 35.20, 129.07, 129.20, "부산_도심"),
    # 부산 그 외
    (35.05, 35.30, 128.85, 129.30, "부산_그외"),
    # 대구
    (35.78, 35.95, 128.50, 128.75, "대구"),
    # 광주
    (35.05, 35.25, 126.78, 126.95, "광주"),
    # 대전
    (36.25, 36.45, 127.30, 127.50, "대전"),
    # 울산
    (35.45, 35.65, 129.20, 129.40, "울산"),
]


# 지역별 시세
RENT_BY_REGION: Dict[str, RegionalRent] = {
    "서울_강남":     {"region_name": "서울 강남권 (강남·서초·송파)", "monthly_rent_per_pyeong": 380_000, "deposit_per_pyeong": 4_500_000, "sample_period": "2024 Q3"},
    "서울_도심":     {"region_name": "서울 도심 (중구·종로·용산)",   "monthly_rent_per_pyeong": 320_000, "deposit_per_pyeong": 3_800_000, "sample_period": "2024 Q3"},
    "서울_서북":     {"region_name": "서울 서북 (마포·서대문·은평)", "monthly_rent_per_pyeong": 220_000, "deposit_per_pyeong": 2_700_000, "sample_period": "2024 Q3"},
    "서울_동북":     {"region_name": "서울 동북 (성북·강북·노원)",   "monthly_rent_per_pyeong": 180_000, "deposit_per_pyeong": 2_200_000, "sample_period": "2024 Q3"},
    "서울_동남":     {"region_name": "서울 동남 (광진·성동·동대문)", "monthly_rent_per_pyeong": 230_000, "deposit_per_pyeong": 2_800_000, "sample_period": "2024 Q3"},
    "서울_서남":     {"region_name": "서울 서남 (영등포·구로·강서)", "monthly_rent_per_pyeong": 200_000, "deposit_per_pyeong": 2_500_000, "sample_period": "2024 Q3"},
    "경기_분당판교": {"region_name": "경기 분당·판교",               "monthly_rent_per_pyeong": 280_000, "deposit_per_pyeong": 3_500_000, "sample_period": "2024 Q3"},
    "경기_일산":     {"region_name": "경기 일산",                    "monthly_rent_per_pyeong": 180_000, "deposit_per_pyeong": 2_200_000, "sample_period": "2024 Q3"},
    "경기_남부":     {"region_name": "경기 남부 (수원·화성·용인)",  "monthly_rent_per_pyeong": 170_000, "deposit_per_pyeong": 2_000_000, "sample_period": "2024 Q3"},
    "인천":           {"region_name": "인천",                          "monthly_rent_per_pyeong": 160_000, "deposit_per_pyeong": 1_900_000, "sample_period": "2024 Q3"},
    "부산_도심":     {"region_name": "부산 도심 (해운대·서면)",       "monthly_rent_per_pyeong": 220_000, "deposit_per_pyeong": 2_700_000, "sample_period": "2024 Q3"},
    "부산_그외":     {"region_name": "부산 그 외",                    "monthly_rent_per_pyeong": 150_000, "deposit_per_pyeong": 1_800_000, "sample_period": "2024 Q3"},
    "대구":           {"region_name": "대구",                          "monthly_rent_per_pyeong": 160_000, "deposit_per_pyeong": 1_900_000, "sample_period": "2024 Q3"},
    "광주":           {"region_name": "광주",                          "monthly_rent_per_pyeong": 150_000, "deposit_per_pyeong": 1_800_000, "sample_period": "2024 Q3"},
    "대전":           {"region_name": "대전",                          "monthly_rent_per_pyeong": 160_000, "deposit_per_pyeong": 1_900_000, "sample_period": "2024 Q3"},
    "울산":           {"region_name": "울산",                          "monthly_rent_per_pyeong": 150_000, "deposit_per_pyeong": 1_800_000, "sample_period": "2024 Q3"},
}


# 기본값 (지방 중소도시)
DEFAULT_RENT: RegionalRent = {
    "region_name": "지방 (기본값)",
    "monthly_rent_per_pyeong": 130_000,
    "deposit_per_pyeong": 1_500_000,
    "sample_period": "2024 Q3",
}


def get_regional_rent(latitude: float, longitude: float) -> RegionalRent:
    """좌표 → 해당 지역 평당 임대료 시세."""
    for lat_min, lat_max, lng_min, lng_max, key in COORD_MAPPING:
        if lat_min <= latitude <= lat_max and lng_min <= longitude <= lng_max:
            return RENT_BY_REGION[key]
    return DEFAULT_RENT
