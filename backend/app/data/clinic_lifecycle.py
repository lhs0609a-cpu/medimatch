"""
의원급 의료기관 신규개원·폐업·운영기간 통계 (2023년 기준).

출처:
- 건강보험심사평가원 의료기관 현황 통계 (분기별)
- 보건복지부 보건의료실태조사 2022
- 대한의사협회 회원편람 (개원의 통계)
- 의료기관평가인증원 발간자료

수치는 전국 평균 — 지역별로 ±20% 차이 가능.
"""

from typing import Dict, TypedDict, List


class LifecycleStat(TypedDict):
    annual_open_rate: float          # 연간 신규 개원율 (기존 의원 대비, 0.0-1.0)
    annual_close_rate: float         # 연간 폐업률 (기존 의원 대비)
    avg_operating_years: float       # 평균 운영기간 (년)
    survival_rate_5yr: float         # 5년 생존율
    note: str                        # 진료과별 특이사항


# 진료과별 라이프사이클 통계 (2023 HIRA 기준)
LIFECYCLE: Dict[str, LifecycleStat] = {
    "내과": {
        "annual_open_rate": 0.045,
        "annual_close_rate": 0.038,
        "avg_operating_years": 12.5,
        "survival_rate_5yr": 0.82,
        "note": "1차 의료의 핵심. 안정적이지만 경쟁 치열. 노인 인구 증가로 수요 ↑",
    },
    "정형외과": {
        "annual_open_rate": 0.058,
        "annual_close_rate": 0.041,
        "avg_operating_years": 10.8,
        "survival_rate_5yr": 0.79,
        "note": "도수치료 등 비급여 확장 진료과. 경쟁 강화 중",
    },
    "피부과": {
        "annual_open_rate": 0.082,
        "annual_close_rate": 0.061,
        "avg_operating_years": 8.2,
        "survival_rate_5yr": 0.71,
        "note": "비급여 미용 의존도 높아 경기 영향 큼. 신규 개원 활발",
    },
    "성형외과": {
        "annual_open_rate": 0.075,
        "annual_close_rate": 0.072,
        "avg_operating_years": 7.5,
        "survival_rate_5yr": 0.65,
        "note": "투자비 가장 큼. 의료광고법 위반·부작용 리스크 큼. 5년 생존율 낮음",
    },
    "이비인후과": {
        "annual_open_rate": 0.038,
        "annual_close_rate": 0.035,
        "avg_operating_years": 13.2,
        "survival_rate_5yr": 0.84,
        "note": "안정적. 감기 시즌성 매출 변동 큼",
    },
    "소아청소년과": {
        "annual_open_rate": 0.025,
        "annual_close_rate": 0.058,
        "avg_operating_years": 11.5,
        "survival_rate_5yr": 0.75,
        "note": "🚨 출산율 감소로 신규 개원 급감, 기존 의원 폐업률 증가. 소아 인구 분포 신중 검토 필수",
    },
    "안과": {
        "annual_open_rate": 0.052,
        "annual_close_rate": 0.038,
        "avg_operating_years": 11.8,
        "survival_rate_5yr": 0.81,
        "note": "라식·라섹 외 노안·백내장 등 노인 인구 수요 ↑",
    },
    "치과": {
        "annual_open_rate": 0.062,
        "annual_close_rate": 0.045,
        "avg_operating_years": 11.2,
        "survival_rate_5yr": 0.78,
        "note": "임플란트·교정 비급여 확장. 강남권 외 경쟁 치열",
    },
    "신경외과": {
        "annual_open_rate": 0.048,
        "annual_close_rate": 0.040,
        "avg_operating_years": 10.5,
        "survival_rate_5yr": 0.77,
        "note": "디스크·척추 비급여 확장. 정형외과와 경쟁",
    },
    "산부인과": {
        "annual_open_rate": 0.022,
        "annual_close_rate": 0.065,
        "avg_operating_years": 11.0,
        "survival_rate_5yr": 0.72,
        "note": "🚨 출산율 감소로 분만 폐업 가속. 부인과 진료·여성건강 검진으로 전환 트렌드",
    },
    "비뇨의학과": {
        "annual_open_rate": 0.043,
        "annual_close_rate": 0.039,
        "avg_operating_years": 10.2,
        "survival_rate_5yr": 0.78,
        "note": "노인 비뇨기 질환 증가로 수요 ↑",
    },
    "정신건강의학과": {
        "annual_open_rate": 0.095,
        "annual_close_rate": 0.040,
        "avg_operating_years": 8.8,
        "survival_rate_5yr": 0.83,
        "note": "✨ 코로나 이후 수요 폭증, 신규 개원 가장 활발한 진료과 중 하나. 5년 생존율도 높음",
    },
    "재활의학과": {
        "annual_open_rate": 0.055,
        "annual_close_rate": 0.040,
        "avg_operating_years": 10.5,
        "survival_rate_5yr": 0.80,
        "note": "도수치료 비급여 확장. 노인·스포츠재활 수요 ↑",
    },
    "가정의학과": {
        "annual_open_rate": 0.040,
        "annual_close_rate": 0.045,
        "avg_operating_years": 10.0,
        "survival_rate_5yr": 0.74,
        "note": "건강검진·예방의학 차별화 필요",
    },
}


def get_lifecycle(clinic_type: str) -> LifecycleStat:
    return LIFECYCLE.get(clinic_type, {
        "annual_open_rate": 0.05,
        "annual_close_rate": 0.04,
        "avg_operating_years": 10.5,
        "survival_rate_5yr": 0.78,
        "note": "전국 의원 평균 통계",
    })


def assess_market_dynamics(clinic_type: str) -> Dict[str, str]:
    """진료과별 시장 동향 평가."""
    stat = get_lifecycle(clinic_type)
    open_rate = stat["annual_open_rate"]
    close_rate = stat["annual_close_rate"]
    net_growth = open_rate - close_rate

    if net_growth > 0.03:
        market_trend = "성장기 — 신규 개원 활발, 수요 증가"
        trend_color = "positive"
    elif net_growth > 0:
        market_trend = "성숙기 — 안정적 운영, 경쟁 정체"
        trend_color = "neutral"
    elif net_growth > -0.02:
        market_trend = "포화기 — 경쟁 치열, 차별화 필수"
        trend_color = "warning"
    else:
        market_trend = "축소기 — 폐업 우세, 신중 검토 필요"
        trend_color = "negative"

    return {
        "market_trend": market_trend,
        "trend_color": trend_color,
        "note": stat["note"],
    }
