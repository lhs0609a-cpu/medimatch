"""
진료과별 외래 1건당 평균 진료비 + 비급여 비중.
출처: HIRA 진료비통계지표 2023, 보건복지부 비급여진료비 공개시스템.

지역 보정: 서울/광역시 대비 일반 시군구 약 0.85배,
강남/성형 메카 지역은 1.4배 (피부/성형/안과).
"""
from typing import Dict, Optional


# 진료과별 외래 1건당 평균 진료비 (원, 보험+비급여 합계)
# 2023 HIRA 진료비통계지표 + 보건복지부 비급여 평균
AVG_VISIT_PRICE: Dict[str, int] = {
    # 환자 1명당 평균 매출 (외래 + 비급여 시술 가중 평균)
    # 비급여 비중이 높은 진료과는 시술 매출 반영해서 단가가 큼.
    # 보험 위주 진료과는 청구 1건당 평균 진료비.

    # ── 보험 위주 (환자 1명 = 외래 진료 1회) ──
    "내과":       45000,
    "이비인후과": 38000,
    "소아청소년과": 32000,
    "산부인과":   72000,    # 산전검사 + 일부 비급여
    "비뇨의학과": 65000,
    "정신건강의학과": 88000,  # 상담시간 길고 일부 비급여
    "신경외과":   85000,
    "마취통증의학과": 95000,  # 통증 시술 비급여 일부
    "외과":       62000,
    "가정의학과": 38000,
    "한방과":     45000,
    "영상의학과": 95000,
    "응급의학과": 78000,
    "흉부외과":   110000,
    "재활의학과": 95000,    # 도수치료 + 운동치료

    # ── 비급여 의존 진료과 (환자 1명 평균 시술 매출 반영) ──
    "정형외과":   85000,    # 도수치료/체외충격파/MRI 가중
    "치과":       220000,   # 임플란트(120만)/교정/라미네이트 평균 가중 (외래 50% + 시술 50%)
    "피부과":     250000,   # 보톡스/필러/레이저/리프팅 시술 평균 가중
    "안과":       150000,   # 라식/스마일/노안 시술 가중 (외래 50% + 시술 50%)
    "성형외과":   650000,   # 쌍커풀/코/지방흡입 시술 평균 (외래 30% + 시술 70%)
}


# 비급여 매출 비중 (전체 매출 중 비급여 %)
# 출처: 의협 + HIRA 2023 비급여 공개데이터
NON_COVERED_RATIO: Dict[str, float] = {
    "내과":           0.12,
    "이비인후과":     0.18,
    "정형외과":       0.45,  # 도수치료/체외충격파/MRI
    "소아청소년과":   0.10,
    "피부과":         0.82,  # 미용/레이저/필러
    "안과":           0.55,  # 라식/스마일/노안교정
    "산부인과":       0.42,  # 비급여 검진
    "치과":           0.65,  # 임플란트/교정/보철
    "재활의학과":     0.38,
    "비뇨의학과":     0.30,
    "정신건강의학과": 0.18,
    "성형외과":       0.92,  # 거의 비급여
    "신경외과":       0.32,
    "마취통증의학과": 0.55,  # 통증클리닉 시술
    "외과":           0.20,
    "가정의학과":     0.15,
    "한방과":         0.40,
    "응급의학과":     0.10,
}


# 지역별 보정계수 (sido_cd 기준)
# 강남/특수지역은 시군구 단위로 별도 처리
SIDO_PRICE_FACTOR: Dict[str, float] = {
    "11": 1.20,  # 서울
    "26": 1.05,  # 부산
    "27": 1.00,  # 대구
    "28": 1.05,  # 인천
    "29": 0.95,  # 광주
    "30": 0.95,  # 대전
    "31": 1.00,  # 울산
    "36": 0.98,  # 세종
    "41": 1.10,  # 경기
    "42": 0.92,  # 강원
    "43": 0.90,  # 충북
    "44": 0.92,  # 충남
    "45": 0.88,  # 전북
    "46": 0.88,  # 전남
    "47": 0.92,  # 경북
    "48": 0.95,  # 경남
    "50": 0.98,  # 제주
}


# 특수 시군구 (강남구, 서초구 등 — 비급여 진료과 단가 폭증)
PREMIUM_SGGU = {
    "11680": 1.25,  # 강남구
    "11650": 1.20,  # 서초구
    "11440": 1.15,  # 마포구
    "11710": 1.12,  # 송파구
    "26350": 1.08,  # 해운대구
}

# 비급여 의존 진료과 — 프리미엄 지역 단가 폭등 적용
PREMIUM_SENSITIVE = {"피부과", "성형외과", "안과", "치과"}


def get_avg_visit_price(clinic_type: str) -> int:
    return AVG_VISIT_PRICE.get(clinic_type, 60000)


def get_non_covered_ratio(clinic_type: str) -> float:
    return NON_COVERED_RATIO.get(clinic_type, 0.20)


def get_regional_price(
    clinic_type: str,
    region_code: str = "",
) -> int:
    """지역 보정된 1건당 단가."""
    base = get_avg_visit_price(clinic_type)
    if not region_code:
        return base

    sido_cd = region_code[:2]
    sggu_cd = region_code[:5]

    factor = SIDO_PRICE_FACTOR.get(sido_cd, 1.0)

    # 프리미엄 지역 + 비급여 진료과면 추가 배수
    if sggu_cd in PREMIUM_SGGU and clinic_type in PREMIUM_SENSITIVE:
        factor = PREMIUM_SGGU[sggu_cd]

    return int(base * factor)


def estimate_monthly_revenue(
    clinic_type: str,
    daily_patients: float,
    region_code: str = "",
    work_days_per_month: int = 24,
) -> int:
    """월 매출 = 1일 환자수 × 진료일 × 1건당 단가 (지역 보정)."""
    price = get_regional_price(clinic_type, region_code)
    return int(daily_patients * work_days_per_month * price)


def get_revenue_breakdown(
    clinic_type: str,
    monthly_revenue: int,
) -> Dict[str, int]:
    """매출을 보험/비급여로 분리."""
    nc_ratio = get_non_covered_ratio(clinic_type)
    return {
        "covered_revenue": int(monthly_revenue * (1 - nc_ratio)),
        "non_covered_revenue": int(monthly_revenue * nc_ratio),
        "non_covered_ratio": nc_ratio,
    }
