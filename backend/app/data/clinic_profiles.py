"""
진료과별 개원 표준 프로필 데이터.

출처:
- 보건복지부 의료기관 개설 통계
- 건강보험심사평가원 진료비 통계연보 (2023)
- 의료장비 시장 가격 (메디포스트, 메디클러스터 등 의료장비 유통사 공시)
- 의원급 의료기관 표준 사업계획서 (한국의료기기협회)
- 대한개원의협의회 개원 가이드라인

모든 금액은 만원 단위가 아니라 원 단위.
"""

from typing import Dict, List, TypedDict


class CapitalProfile(TypedDict):
    """진료과별 초기 투자비 표준"""
    interior_per_pyeong: int        # 평당 인테리어비 (원)
    equipment_min: int              # 의료장비 최소 (원)
    equipment_typical: int          # 의료장비 표준 (원)
    deposit_per_pyeong: int         # 평당 보증금 (원, 서울 평균)
    monthly_rent_per_pyeong: int    # 평당 월세 (원, 서울 평균)
    working_capital_months: int     # 운영자금 권장 개월수
    standard_size_pyeong: int       # 표준 면적 (평)
    min_size_pyeong: int            # 의료법상 최소 면적 (평)


class StaffingProfile(TypedDict):
    """진료과별 표준 인력 구성"""
    doctors: int
    nurses: int
    admins: int
    technicians: int                # 방사선사, 임상병리사 등
    avg_doctor_salary_monthly: int   # 페이닥터 월 (원)
    avg_nurse_salary_monthly: int
    avg_admin_salary_monthly: int


class RevenueProfile(TypedDict):
    """진료과별 매출 구조"""
    avg_daily_patients: int         # 1인 의사 기준 일평균 환자 수
    avg_revenue_per_patient: int    # 환자당 평균 매출 (원, 보험+비보험 합산)
    insurance_ratio: float          # 보험 진료 비율 (0.0-1.0)
    working_days_per_month: int     # 월 진료일수
    monthly_revenue_typical: int    # 표준 월 매출 (원)


class EquipmentItem(TypedDict):
    name: str
    price_min: int      # 최저가 (원)
    price_typical: int  # 표준가 (원)
    is_essential: bool  # 필수 여부


class PermitItem(TypedDict):
    name: str
    authority: str          # 담당기관
    duration_days: int      # 처리 기간
    cost: int               # 수수료 (원)
    description: str


# ────────────────────────────────────────────────────────────────────
# 14개 진료과 표준 프로필
# 가격 데이터: 2024년 기준 (수도권 평균)
# ────────────────────────────────────────────────────────────────────

CAPITAL: Dict[str, CapitalProfile] = {
    "내과": {
        "interior_per_pyeong": 2_500_000,
        "equipment_min": 70_000_000,
        "equipment_typical": 130_000_000,
        "deposit_per_pyeong": 3_000_000,
        "monthly_rent_per_pyeong": 200_000,
        "working_capital_months": 6,
        "standard_size_pyeong": 30,
        "min_size_pyeong": 17,
    },
    "정형외과": {
        "interior_per_pyeong": 3_000_000,
        "equipment_min": 200_000_000,  # X-ray, 초음파 필수
        "equipment_typical": 350_000_000,
        "deposit_per_pyeong": 3_500_000,
        "monthly_rent_per_pyeong": 230_000,
        "working_capital_months": 6,
        "standard_size_pyeong": 50,
        "min_size_pyeong": 30,
    },
    "피부과": {
        "interior_per_pyeong": 3_500_000,
        "equipment_min": 250_000_000,  # 레이저 장비
        "equipment_typical": 500_000_000,
        "deposit_per_pyeong": 4_000_000,
        "monthly_rent_per_pyeong": 280_000,
        "working_capital_months": 9,
        "standard_size_pyeong": 40,
        "min_size_pyeong": 25,
    },
    "성형외과": {
        "interior_per_pyeong": 4_500_000,
        "equipment_min": 400_000_000,  # 수술실 + 장비
        "equipment_typical": 800_000_000,
        "deposit_per_pyeong": 5_000_000,
        "monthly_rent_per_pyeong": 350_000,
        "working_capital_months": 12,
        "standard_size_pyeong": 70,
        "min_size_pyeong": 50,
    },
    "이비인후과": {
        "interior_per_pyeong": 2_500_000,
        "equipment_min": 80_000_000,
        "equipment_typical": 150_000_000,
        "deposit_per_pyeong": 3_000_000,
        "monthly_rent_per_pyeong": 200_000,
        "working_capital_months": 6,
        "standard_size_pyeong": 30,
        "min_size_pyeong": 17,
    },
    "소아청소년과": {
        "interior_per_pyeong": 2_700_000,
        "equipment_min": 70_000_000,
        "equipment_typical": 130_000_000,
        "deposit_per_pyeong": 3_000_000,
        "monthly_rent_per_pyeong": 200_000,
        "working_capital_months": 6,
        "standard_size_pyeong": 35,
        "min_size_pyeong": 17,
    },
    "안과": {
        "interior_per_pyeong": 3_000_000,
        "equipment_min": 250_000_000,  # 검안기, OCT 등
        "equipment_typical": 450_000_000,
        "deposit_per_pyeong": 3_500_000,
        "monthly_rent_per_pyeong": 250_000,
        "working_capital_months": 9,
        "standard_size_pyeong": 40,
        "min_size_pyeong": 25,
    },
    "치과": {
        "interior_per_pyeong": 3_000_000,
        "equipment_min": 150_000_000,  # 유닛체어 3대 + 파노라마
        "equipment_typical": 280_000_000,
        "deposit_per_pyeong": 3_000_000,
        "monthly_rent_per_pyeong": 220_000,
        "working_capital_months": 6,
        "standard_size_pyeong": 35,
        "min_size_pyeong": 20,
    },
    "신경외과": {
        "interior_per_pyeong": 3_000_000,
        "equipment_min": 200_000_000,
        "equipment_typical": 350_000_000,
        "deposit_per_pyeong": 3_500_000,
        "monthly_rent_per_pyeong": 230_000,
        "working_capital_months": 6,
        "standard_size_pyeong": 45,
        "min_size_pyeong": 30,
    },
    "산부인과": {
        "interior_per_pyeong": 3_000_000,
        "equipment_min": 180_000_000,  # 초음파 + 분만 장비
        "equipment_typical": 320_000_000,
        "deposit_per_pyeong": 3_500_000,
        "monthly_rent_per_pyeong": 230_000,
        "working_capital_months": 9,
        "standard_size_pyeong": 50,
        "min_size_pyeong": 30,
    },
    "비뇨의학과": {
        "interior_per_pyeong": 2_700_000,
        "equipment_min": 150_000_000,
        "equipment_typical": 280_000_000,
        "deposit_per_pyeong": 3_000_000,
        "monthly_rent_per_pyeong": 210_000,
        "working_capital_months": 6,
        "standard_size_pyeong": 35,
        "min_size_pyeong": 20,
    },
    "정신건강의학과": {
        "interior_per_pyeong": 2_800_000,
        "equipment_min": 30_000_000,
        "equipment_typical": 60_000_000,
        "deposit_per_pyeong": 3_000_000,
        "monthly_rent_per_pyeong": 220_000,
        "working_capital_months": 6,
        "standard_size_pyeong": 30,
        "min_size_pyeong": 17,
    },
    "재활의학과": {
        "interior_per_pyeong": 2_800_000,
        "equipment_min": 200_000_000,  # 물리치료 장비 다수
        "equipment_typical": 350_000_000,
        "deposit_per_pyeong": 3_000_000,
        "monthly_rent_per_pyeong": 200_000,
        "working_capital_months": 6,
        "standard_size_pyeong": 60,
        "min_size_pyeong": 40,
    },
    "가정의학과": {
        "interior_per_pyeong": 2_500_000,
        "equipment_min": 60_000_000,
        "equipment_typical": 120_000_000,
        "deposit_per_pyeong": 3_000_000,
        "monthly_rent_per_pyeong": 200_000,
        "working_capital_months": 6,
        "standard_size_pyeong": 30,
        "min_size_pyeong": 17,
    },
}


STAFFING: Dict[str, StaffingProfile] = {
    "내과":          {"doctors": 1, "nurses": 2, "admins": 1, "technicians": 0, "avg_doctor_salary_monthly": 12_000_000, "avg_nurse_salary_monthly": 3_500_000, "avg_admin_salary_monthly": 2_800_000},
    "정형외과":       {"doctors": 1, "nurses": 2, "admins": 1, "technicians": 1, "avg_doctor_salary_monthly": 13_000_000, "avg_nurse_salary_monthly": 3_500_000, "avg_admin_salary_monthly": 2_800_000},
    "피부과":         {"doctors": 1, "nurses": 3, "admins": 2, "technicians": 0, "avg_doctor_salary_monthly": 13_000_000, "avg_nurse_salary_monthly": 3_500_000, "avg_admin_salary_monthly": 2_800_000},
    "성형외과":       {"doctors": 1, "nurses": 4, "admins": 2, "technicians": 1, "avg_doctor_salary_monthly": 15_000_000, "avg_nurse_salary_monthly": 4_000_000, "avg_admin_salary_monthly": 3_000_000},
    "이비인후과":     {"doctors": 1, "nurses": 2, "admins": 1, "technicians": 0, "avg_doctor_salary_monthly": 12_000_000, "avg_nurse_salary_monthly": 3_500_000, "avg_admin_salary_monthly": 2_800_000},
    "소아청소년과":   {"doctors": 1, "nurses": 2, "admins": 1, "technicians": 0, "avg_doctor_salary_monthly": 12_000_000, "avg_nurse_salary_monthly": 3_500_000, "avg_admin_salary_monthly": 2_800_000},
    "안과":           {"doctors": 1, "nurses": 2, "admins": 1, "technicians": 1, "avg_doctor_salary_monthly": 13_000_000, "avg_nurse_salary_monthly": 3_500_000, "avg_admin_salary_monthly": 2_800_000},
    "치과":           {"doctors": 1, "nurses": 3, "admins": 1, "technicians": 0, "avg_doctor_salary_monthly": 13_000_000, "avg_nurse_salary_monthly": 3_500_000, "avg_admin_salary_monthly": 2_800_000},
    "신경외과":       {"doctors": 1, "nurses": 2, "admins": 1, "technicians": 1, "avg_doctor_salary_monthly": 13_000_000, "avg_nurse_salary_monthly": 3_500_000, "avg_admin_salary_monthly": 2_800_000},
    "산부인과":       {"doctors": 1, "nurses": 3, "admins": 1, "technicians": 1, "avg_doctor_salary_monthly": 13_000_000, "avg_nurse_salary_monthly": 3_500_000, "avg_admin_salary_monthly": 2_800_000},
    "비뇨의학과":     {"doctors": 1, "nurses": 2, "admins": 1, "technicians": 0, "avg_doctor_salary_monthly": 12_000_000, "avg_nurse_salary_monthly": 3_500_000, "avg_admin_salary_monthly": 2_800_000},
    "정신건강의학과": {"doctors": 1, "nurses": 1, "admins": 1, "technicians": 0, "avg_doctor_salary_monthly": 12_000_000, "avg_nurse_salary_monthly": 3_500_000, "avg_admin_salary_monthly": 2_800_000},
    "재활의학과":     {"doctors": 1, "nurses": 2, "admins": 1, "technicians": 2, "avg_doctor_salary_monthly": 12_000_000, "avg_nurse_salary_monthly": 3_500_000, "avg_admin_salary_monthly": 2_800_000},
    "가정의학과":     {"doctors": 1, "nurses": 2, "admins": 1, "technicians": 0, "avg_doctor_salary_monthly": 11_000_000, "avg_nurse_salary_monthly": 3_500_000, "avg_admin_salary_monthly": 2_800_000},
}


REVENUE: Dict[str, RevenueProfile] = {
    "내과":           {"avg_daily_patients": 50, "avg_revenue_per_patient": 25_000, "insurance_ratio": 0.85, "working_days_per_month": 26, "monthly_revenue_typical": 32_500_000},
    "정형외과":       {"avg_daily_patients": 55, "avg_revenue_per_patient": 35_000, "insurance_ratio": 0.75, "working_days_per_month": 26, "monthly_revenue_typical": 50_050_000},
    "피부과":         {"avg_daily_patients": 35, "avg_revenue_per_patient": 80_000, "insurance_ratio": 0.30, "working_days_per_month": 26, "monthly_revenue_typical": 72_800_000},
    "성형외과":       {"avg_daily_patients": 12, "avg_revenue_per_patient": 800_000, "insurance_ratio": 0.05, "working_days_per_month": 26, "monthly_revenue_typical": 249_600_000},
    "이비인후과":     {"avg_daily_patients": 60, "avg_revenue_per_patient": 22_000, "insurance_ratio": 0.85, "working_days_per_month": 26, "monthly_revenue_typical": 34_320_000},
    "소아청소년과":   {"avg_daily_patients": 65, "avg_revenue_per_patient": 18_000, "insurance_ratio": 0.90, "working_days_per_month": 26, "monthly_revenue_typical": 30_420_000},
    "안과":           {"avg_daily_patients": 40, "avg_revenue_per_patient": 60_000, "insurance_ratio": 0.55, "working_days_per_month": 26, "monthly_revenue_typical": 62_400_000},
    "치과":           {"avg_daily_patients": 25, "avg_revenue_per_patient": 130_000, "insurance_ratio": 0.40, "working_days_per_month": 26, "monthly_revenue_typical": 84_500_000},
    "신경외과":       {"avg_daily_patients": 45, "avg_revenue_per_patient": 38_000, "insurance_ratio": 0.75, "working_days_per_month": 26, "monthly_revenue_typical": 44_460_000},
    "산부인과":       {"avg_daily_patients": 30, "avg_revenue_per_patient": 60_000, "insurance_ratio": 0.60, "working_days_per_month": 26, "monthly_revenue_typical": 46_800_000},
    "비뇨의학과":     {"avg_daily_patients": 35, "avg_revenue_per_patient": 45_000, "insurance_ratio": 0.70, "working_days_per_month": 26, "monthly_revenue_typical": 40_950_000},
    "정신건강의학과": {"avg_daily_patients": 25, "avg_revenue_per_patient": 50_000, "insurance_ratio": 0.85, "working_days_per_month": 26, "monthly_revenue_typical": 32_500_000},
    "재활의학과":     {"avg_daily_patients": 50, "avg_revenue_per_patient": 30_000, "insurance_ratio": 0.85, "working_days_per_month": 26, "monthly_revenue_typical": 39_000_000},
    "가정의학과":     {"avg_daily_patients": 45, "avg_revenue_per_patient": 22_000, "insurance_ratio": 0.85, "working_days_per_month": 26, "monthly_revenue_typical": 25_740_000},
}


# 진료과별 필수 의료장비 (가격은 2024년 기준)
EQUIPMENT: Dict[str, List[EquipmentItem]] = {
    "내과": [
        {"name": "심전도기 (EKG)", "price_min": 3_000_000, "price_typical": 5_000_000, "is_essential": True},
        {"name": "초음파 진단기", "price_min": 30_000_000, "price_typical": 60_000_000, "is_essential": True},
        {"name": "내시경 시스템", "price_min": 40_000_000, "price_typical": 80_000_000, "is_essential": False},
        {"name": "혈액 자동분석기", "price_min": 15_000_000, "price_typical": 25_000_000, "is_essential": True},
        {"name": "혈압계·체온계 세트", "price_min": 1_000_000, "price_typical": 2_000_000, "is_essential": True},
        {"name": "산소포화도 측정기", "price_min": 500_000, "price_typical": 1_000_000, "is_essential": True},
        {"name": "EMR/처방 시스템", "price_min": 5_000_000, "price_typical": 10_000_000, "is_essential": True},
    ],
    "정형외과": [
        {"name": "디지털 X-ray 시스템", "price_min": 80_000_000, "price_typical": 150_000_000, "is_essential": True},
        {"name": "근골격 초음파", "price_min": 30_000_000, "price_typical": 60_000_000, "is_essential": True},
        {"name": "물리치료기 세트", "price_min": 30_000_000, "price_typical": 60_000_000, "is_essential": True},
        {"name": "체외충격파 (ESWT)", "price_min": 30_000_000, "price_typical": 60_000_000, "is_essential": False},
        {"name": "C-arm (방사선 유도)", "price_min": 50_000_000, "price_typical": 100_000_000, "is_essential": False},
        {"name": "수술실 기본 장비", "price_min": 20_000_000, "price_typical": 40_000_000, "is_essential": False},
        {"name": "EMR/처방 시스템", "price_min": 5_000_000, "price_typical": 10_000_000, "is_essential": True},
    ],
    "피부과": [
        {"name": "레이저 장비 (피코·토닝)", "price_min": 100_000_000, "price_typical": 200_000_000, "is_essential": True},
        {"name": "IPL/엑시머", "price_min": 50_000_000, "price_typical": 100_000_000, "is_essential": True},
        {"name": "고주파/HIFU", "price_min": 50_000_000, "price_typical": 100_000_000, "is_essential": False},
        {"name": "더마 스코프", "price_min": 5_000_000, "price_typical": 10_000_000, "is_essential": True},
        {"name": "수술 도구 세트", "price_min": 10_000_000, "price_typical": 20_000_000, "is_essential": True},
        {"name": "냉각·마취 장비", "price_min": 5_000_000, "price_typical": 10_000_000, "is_essential": True},
        {"name": "EMR/CRM 시스템", "price_min": 8_000_000, "price_typical": 15_000_000, "is_essential": True},
    ],
    "성형외과": [
        {"name": "수술용 베드 (전동)", "price_min": 30_000_000, "price_typical": 60_000_000, "is_essential": True},
        {"name": "마취기·모니터링", "price_min": 50_000_000, "price_typical": 100_000_000, "is_essential": True},
        {"name": "수술용 라이트 시스템", "price_min": 20_000_000, "price_typical": 40_000_000, "is_essential": True},
        {"name": "고주파·초음파 장비", "price_min": 80_000_000, "price_typical": 150_000_000, "is_essential": True},
        {"name": "지방흡입 장비", "price_min": 30_000_000, "price_typical": 60_000_000, "is_essential": True},
        {"name": "엔도스코프", "price_min": 30_000_000, "price_typical": 60_000_000, "is_essential": False},
        {"name": "회복실 장비 일체", "price_min": 30_000_000, "price_typical": 60_000_000, "is_essential": True},
        {"name": "EMR/CRM 시스템", "price_min": 10_000_000, "price_typical": 20_000_000, "is_essential": True},
    ],
    "이비인후과": [
        {"name": "이비인후과 유닛체어", "price_min": 30_000_000, "price_typical": 60_000_000, "is_essential": True},
        {"name": "내시경 (비강·후두)", "price_min": 30_000_000, "price_typical": 60_000_000, "is_essential": True},
        {"name": "청력 검사기", "price_min": 10_000_000, "price_typical": 20_000_000, "is_essential": True},
        {"name": "비강 흡입기", "price_min": 3_000_000, "price_typical": 5_000_000, "is_essential": True},
        {"name": "수술용 마이크로스코프", "price_min": 20_000_000, "price_typical": 40_000_000, "is_essential": False},
        {"name": "EMR/처방 시스템", "price_min": 5_000_000, "price_typical": 10_000_000, "is_essential": True},
    ],
    "소아청소년과": [
        {"name": "소아 진료대", "price_min": 5_000_000, "price_typical": 10_000_000, "is_essential": True},
        {"name": "예방접종 보관 냉장고", "price_min": 3_000_000, "price_typical": 5_000_000, "is_essential": True},
        {"name": "소아 흡입기 (네뷸라이저)", "price_min": 2_000_000, "price_typical": 5_000_000, "is_essential": True},
        {"name": "디지털 X-ray (저용량)", "price_min": 50_000_000, "price_typical": 100_000_000, "is_essential": False},
        {"name": "심전도·산소포화도", "price_min": 3_000_000, "price_typical": 6_000_000, "is_essential": True},
        {"name": "성장도 측정 장비", "price_min": 1_000_000, "price_typical": 3_000_000, "is_essential": True},
        {"name": "EMR/처방 시스템", "price_min": 5_000_000, "price_typical": 10_000_000, "is_essential": True},
    ],
    "안과": [
        {"name": "OCT (광간섭단층촬영)", "price_min": 80_000_000, "price_typical": 150_000_000, "is_essential": True},
        {"name": "자동 굴절검사기", "price_min": 15_000_000, "price_typical": 30_000_000, "is_essential": True},
        {"name": "안저카메라", "price_min": 30_000_000, "price_typical": 60_000_000, "is_essential": True},
        {"name": "세극등 (Slit-lamp)", "price_min": 10_000_000, "price_typical": 20_000_000, "is_essential": True},
        {"name": "안압계", "price_min": 5_000_000, "price_typical": 10_000_000, "is_essential": True},
        {"name": "라식·라섹 레이저", "price_min": 200_000_000, "price_typical": 400_000_000, "is_essential": False},
        {"name": "EMR/처방 시스템", "price_min": 5_000_000, "price_typical": 10_000_000, "is_essential": True},
    ],
    "치과": [
        {"name": "유닛 체어 (3대)", "price_min": 60_000_000, "price_typical": 120_000_000, "is_essential": True},
        {"name": "파노라마 X-ray", "price_min": 40_000_000, "price_typical": 70_000_000, "is_essential": True},
        {"name": "구강 스캐너", "price_min": 30_000_000, "price_typical": 60_000_000, "is_essential": False},
        {"name": "임플란트 장비", "price_min": 20_000_000, "price_typical": 40_000_000, "is_essential": False},
        {"name": "근관치료 마이크로", "price_min": 20_000_000, "price_typical": 40_000_000, "is_essential": False},
        {"name": "멸균기·소독기", "price_min": 5_000_000, "price_typical": 10_000_000, "is_essential": True},
        {"name": "치과 EMR/청구 시스템", "price_min": 5_000_000, "price_typical": 10_000_000, "is_essential": True},
    ],
    "신경외과": [
        {"name": "디지털 X-ray", "price_min": 80_000_000, "price_typical": 150_000_000, "is_essential": True},
        {"name": "근골격 초음파", "price_min": 30_000_000, "price_typical": 60_000_000, "is_essential": True},
        {"name": "신경전도·근전도 검사기", "price_min": 30_000_000, "price_typical": 60_000_000, "is_essential": True},
        {"name": "물리치료 장비", "price_min": 30_000_000, "price_typical": 60_000_000, "is_essential": True},
        {"name": "C-arm", "price_min": 50_000_000, "price_typical": 100_000_000, "is_essential": False},
        {"name": "EMR/처방 시스템", "price_min": 5_000_000, "price_typical": 10_000_000, "is_essential": True},
    ],
    "산부인과": [
        {"name": "초음파 (산과·부인과)", "price_min": 60_000_000, "price_typical": 120_000_000, "is_essential": True},
        {"name": "분만 베드 + 모니터링", "price_min": 30_000_000, "price_typical": 60_000_000, "is_essential": False},
        {"name": "콜포스코프", "price_min": 10_000_000, "price_typical": 20_000_000, "is_essential": True},
        {"name": "자궁경부 검사 장비", "price_min": 5_000_000, "price_typical": 10_000_000, "is_essential": True},
        {"name": "수술실 장비 (내진실 포함)", "price_min": 30_000_000, "price_typical": 60_000_000, "is_essential": False},
        {"name": "EMR/처방 시스템", "price_min": 5_000_000, "price_typical": 10_000_000, "is_essential": True},
    ],
    "비뇨의학과": [
        {"name": "초음파 (전립선·신장)", "price_min": 30_000_000, "price_typical": 60_000_000, "is_essential": True},
        {"name": "방광경 (시스토)", "price_min": 30_000_000, "price_typical": 60_000_000, "is_essential": True},
        {"name": "요속·요역동학 검사기", "price_min": 20_000_000, "price_typical": 40_000_000, "is_essential": True},
        {"name": "체외충격파 결석분쇄기", "price_min": 50_000_000, "price_typical": 100_000_000, "is_essential": False},
        {"name": "수술실 장비", "price_min": 20_000_000, "price_typical": 40_000_000, "is_essential": False},
        {"name": "EMR/처방 시스템", "price_min": 5_000_000, "price_typical": 10_000_000, "is_essential": True},
    ],
    "정신건강의학과": [
        {"name": "심리검사 도구 일체", "price_min": 5_000_000, "price_typical": 10_000_000, "is_essential": True},
        {"name": "상담실 가구·방음", "price_min": 15_000_000, "price_typical": 25_000_000, "is_essential": True},
        {"name": "rTMS 장비 (선택)", "price_min": 30_000_000, "price_typical": 60_000_000, "is_essential": False},
        {"name": "EEG 검사기", "price_min": 10_000_000, "price_typical": 20_000_000, "is_essential": False},
        {"name": "EMR/처방 시스템", "price_min": 5_000_000, "price_typical": 10_000_000, "is_essential": True},
    ],
    "재활의학과": [
        {"name": "물리치료 종합 (전기·온열·견인)", "price_min": 50_000_000, "price_typical": 100_000_000, "is_essential": True},
        {"name": "운동치료 장비 일체", "price_min": 30_000_000, "price_typical": 60_000_000, "is_essential": True},
        {"name": "근전도·신경전도 검사", "price_min": 30_000_000, "price_typical": 60_000_000, "is_essential": True},
        {"name": "초음파 진단기", "price_min": 30_000_000, "price_typical": 60_000_000, "is_essential": True},
        {"name": "체외충격파 (ESWT)", "price_min": 30_000_000, "price_typical": 60_000_000, "is_essential": False},
        {"name": "도수치료실 장비", "price_min": 20_000_000, "price_typical": 40_000_000, "is_essential": False},
        {"name": "EMR/처방 시스템", "price_min": 5_000_000, "price_typical": 10_000_000, "is_essential": True},
    ],
    "가정의학과": [
        {"name": "심전도기", "price_min": 3_000_000, "price_typical": 5_000_000, "is_essential": True},
        {"name": "초음파 진단기", "price_min": 30_000_000, "price_typical": 60_000_000, "is_essential": True},
        {"name": "혈액 자동분석기", "price_min": 15_000_000, "price_typical": 25_000_000, "is_essential": True},
        {"name": "예방접종 냉장고", "price_min": 3_000_000, "price_typical": 5_000_000, "is_essential": True},
        {"name": "검진용 장비 일체", "price_min": 10_000_000, "price_typical": 20_000_000, "is_essential": True},
        {"name": "EMR/처방 시스템", "price_min": 5_000_000, "price_typical": 10_000_000, "is_essential": True},
    ],
}


# 모든 진료과 공통 인허가 절차
COMMON_PERMITS: List[PermitItem] = [
    {
        "name": "사업자등록 (세무서)",
        "authority": "관할 세무서",
        "duration_days": 3,
        "cost": 0,
        "description": "개원 예정일 20일 이내 신청. 의료업 업종코드 필수.",
    },
    {
        "name": "의료기관 개설신고",
        "authority": "관할 보건소",
        "duration_days": 14,
        "cost": 30_000,
        "description": "건축물 사용승인 + 의료기기 신고 후 진행. 의료법 제33조.",
    },
    {
        "name": "건강보험 요양기관 등록",
        "authority": "건강보험심사평가원",
        "duration_days": 7,
        "cost": 0,
        "description": "개설신고 후 자동 안내. 진료비 청구의 전제.",
    },
    {
        "name": "의료기기 신고",
        "authority": "관할 보건소 (의료기기법)",
        "duration_days": 7,
        "cost": 0,
        "description": "X-ray 등 특정 의료기기는 별도 신고 필요.",
    },
    {
        "name": "방사선 안전관리자 선임",
        "authority": "한국원자력안전기술원",
        "duration_days": 14,
        "cost": 100_000,
        "description": "X-ray, CT 등 방사선 발생장치 보유 시 필수.",
    },
    {
        "name": "건축물 사용승인",
        "authority": "구청 건축과",
        "duration_days": 14,
        "cost": 50_000,
        "description": "인테리어 완료 후 의료시설 적합 검사.",
    },
    {
        "name": "소방시설 완공검사",
        "authority": "관할 소방서",
        "duration_days": 7,
        "cost": 30_000,
        "description": "스프링클러, 비상구, 소화기 등 점검.",
    },
    {
        "name": "근로자 4대보험 가입",
        "authority": "국민연금/건강보험/고용·산재",
        "duration_days": 7,
        "cost": 0,
        "description": "직원 채용 시 14일 이내 신고.",
    },
]


# 진료과별 추가 인허가 (방사선 발생장치 등)
SPECIFIC_PERMITS: Dict[str, List[str]] = {
    "정형외과": ["방사선 안전관리자 선임", "C-arm 방사선 신고"],
    "치과": ["방사선 안전관리자 선임", "치과방사선 사용신고"],
    "안과": ["라식·라섹 장비 신고 (해당 시)"],
    "성형외과": ["수술실 장비 신고", "마취장비 사용 인증"],
    "산부인과": ["분만실 운영 신고 (해당 시)"],
    "정신건강의학과": ["향정신성의약품 취급 면허"],
    "재활의학과": ["방사선 안전관리자 (X-ray 보유 시)"],
    "이비인후과": ["X-ray 신고 (해당 시)"],
}


# 진료과별 개원 일정 (월 단위, 임대 계약 ~ 개원일까지)
TIMELINE_MONTHS: Dict[str, int] = {
    "내과": 4,
    "정형외과": 5,
    "피부과": 4,
    "성형외과": 6,
    "이비인후과": 4,
    "소아청소년과": 4,
    "안과": 5,
    "치과": 5,
    "신경외과": 5,
    "산부인과": 6,
    "비뇨의학과": 4,
    "정신건강의학과": 3,
    "재활의학과": 5,
    "가정의학과": 4,
}


def get_capital_profile(clinic_type: str) -> CapitalProfile:
    return CAPITAL.get(clinic_type, CAPITAL["내과"])


def get_staffing_profile(clinic_type: str) -> StaffingProfile:
    return STAFFING.get(clinic_type, STAFFING["내과"])


def get_revenue_profile(clinic_type: str) -> RevenueProfile:
    return REVENUE.get(clinic_type, REVENUE["내과"])


def get_equipment_list(clinic_type: str) -> List[EquipmentItem]:
    return EQUIPMENT.get(clinic_type, EQUIPMENT["내과"])


def get_permits(clinic_type: str) -> List[PermitItem]:
    return list(COMMON_PERMITS)


def get_specific_permits(clinic_type: str) -> List[str]:
    return SPECIFIC_PERMITS.get(clinic_type, [])


def get_timeline_months(clinic_type: str) -> int:
    return TIMELINE_MONTHS.get(clinic_type, 4)
