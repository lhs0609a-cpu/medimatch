"""
진료과별 수료율 (Utilization Rate)
인구 1,000명당 연간 외래 진료건수.

출처: HIRA 진료비통계지표 + KOSIS 보건의료통계 (2023-2024).
공식: 1일 환자수 = 진료권 인구 × 수료율 ÷ 1000 ÷ 진료일수 ÷ (경쟁+1) × 입지보정

연령 가중치: 일부 진료과는 특정 연령대 환자 비율이 압도적이므로
인구를 그대로 쓰지 않고 타겟 연령 인구로 보정한다.
"""
from typing import Dict, Tuple


# 진료과별 연간 인구 1,000명당 외래 건수 (전국 평균)
# 출처: HIRA 진료비통계지표 2023, KOSIS 354 보건의료통계
ANNUAL_VISITS_PER_1000: Dict[str, float] = {
    "내과": 4200,           # 가장 높음 — 만성질환 + 감기
    "이비인후과": 2800,
    "정형외과": 1850,
    "소아청소년과": 2400,    # 0-9세 인구 대비
    "피부과": 920,
    "안과": 1100,
    "산부인과": 1380,        # 가임기 여성 대비
    "치과": 2200,
    "재활의학과": 720,
    "비뇨의학과": 540,
    "정신건강의학과": 680,
    "성형외과": 320,
    "신경외과": 420,
    "마취통증의학과": 380,
    "흉부외과": 110,
    "외과": 480,
    "가정의학과": 1500,
    "한방과": 1620,
    "영상의학과": 90,
    "응급의학과": 380,
}

# 진료과별 타겟 연령대 (가중치)
# (시작 연령, 끝 연령, 가중치) — 가중치 1.0이면 그 연령대만 환자
# 여러 구간이면 합쳐서 1.0 이하
TARGET_AGE_GROUPS: Dict[str, list] = {
    "소아청소년과": [(0, 9, 0.85), (10, 19, 0.15)],
    "산부인과": [(20, 49, 0.78), (15, 19, 0.05), (50, 64, 0.17)],
    "정형외과": [(40, 64, 0.45), (65, 100, 0.40), (20, 39, 0.15)],
    "재활의학과": [(50, 100, 0.78), (20, 49, 0.22)],
    "안과": [(60, 100, 0.55), (40, 59, 0.30), (0, 39, 0.15)],
    "비뇨의학과": [(50, 100, 0.65), (30, 49, 0.30), (0, 29, 0.05)],
    "신경외과": [(50, 100, 0.62), (30, 49, 0.30), (0, 29, 0.08)],
    "내과": [(40, 100, 0.72), (0, 39, 0.28)],
    "이비인후과": [(0, 19, 0.42), (20, 100, 0.58)],
    "피부과": [(20, 49, 0.62), (10, 19, 0.18), (50, 100, 0.20)],
    "성형외과": [(20, 49, 0.85), (50, 100, 0.15)],
    "정신건강의학과": [(20, 49, 0.55), (50, 100, 0.30), (10, 19, 0.15)],
    # 기본: 전 연령 균등
}


def get_utilization_rate(clinic_type: str) -> float:
    """진료과별 인구 1,000명당 연간 방문 횟수 (전국 평균)."""
    return ANNUAL_VISITS_PER_1000.get(clinic_type, 1200.0)


def get_target_age_groups(clinic_type: str) -> list:
    """진료과별 타겟 연령대 가중치."""
    return TARGET_AGE_GROUPS.get(clinic_type, [(0, 100, 1.0)])


def calculate_target_population(
    clinic_type: str,
    age_distribution: Dict[str, int],
    total_population: int,
) -> int:
    """
    인구 분포에서 진료과의 타겟 환자 풀 계산.

    age_distribution: {'age_0_9': 5000, 'age_10_19': 6000, ...} 형식
    total_population: 전체 인구 (폴백용)

    Returns: 진료과 타겟 환자 풀 (가중치 적용)
    """
    if not age_distribution:
        # 인구 분포 없으면 전체 인구의 60% (성인+노인 비율 가정)
        groups = get_target_age_groups(clinic_type)
        weight_sum = sum(w for _, _, w in groups)
        return int(total_population * weight_sum)

    groups = get_target_age_groups(clinic_type)
    target = 0.0

    age_buckets = [
        ("age_0_9", 0, 9),
        ("age_10_19", 10, 19),
        ("age_20_29", 20, 29),
        ("age_30_39", 30, 39),
        ("age_40_49", 40, 49),
        ("age_50_59", 50, 59),
        ("age_60_plus", 60, 100),
    ]

    for key, start, end in age_buckets:
        pop = age_distribution.get(key, 0)
        if pop == 0:
            continue
        # 이 연령 버킷이 타겟 그룹과 겹치는 비율 계산
        for tg_start, tg_end, weight in groups:
            overlap_start = max(start, tg_start)
            overlap_end = min(end, tg_end)
            if overlap_start <= overlap_end:
                bucket_span = end - start + 1
                overlap_span = overlap_end - overlap_start + 1
                target += pop * (overlap_span / bucket_span) * weight

    return max(int(target), int(total_population * 0.3))


def estimate_daily_patients(
    clinic_type: str,
    target_population: int,
    competitor_count: int,
    location_factor: float = 1.0,
    work_days_per_year: int = 290,  # 주6일 × 50주 - 공휴일
) -> float:
    """
    1일 예상 환자 수 = 타겟인구 × 수료율 ÷ 1000 ÷ 진료일 ÷ (경쟁+1) × 입지보정

    학계 검증: 일본 진료권조사 표준 공식 (Mapmarketing, 技研商事)
    """
    annual_rate = get_utilization_rate(clinic_type)
    annual_visits = target_population * annual_rate / 1000.0
    daily_visits_total_market = annual_visits / work_days_per_year
    market_share = 1.0 / (competitor_count + 1)
    return daily_visits_total_market * market_share * location_factor
