"""진료과별 EMR 프리셋 (KCD 진단 / 행위 / 단축약).

상위 5개 진료과만 깊게:
- INTERNAL (내과)
- ENT (이비인후과)
- PEDIATRICS (소아청소년과)
- DERMATOLOGY (피부과)
- ORTHOPEDICS (정형외과)

기타 진료과는 GENERAL 템플릿으로 fallback.
"""
from __future__ import annotations
from typing import Dict, List, Any


# 한 진단 row: {code, name, category(가벼움)}
def _diag(code: str, name: str) -> Dict[str, str]:
    return {"code": code, "name": name}


# 한 시술 row: {code, name, category, unit_price(원)}
def _proc(code: str, name: str, category: str, unit_price: int = 0) -> Dict[str, Any]:
    return {"code": code, "name": name, "category": category, "unit_price": unit_price}


# 한 약 row: {drug_name, ingredient, dose_unit, default_freq, default_days, usage_note}
def _drug(
    drug_name: str, *,
    ingredient: str = "",
    dose_unit: str = "정",
    freq: int = 3,
    days: int = 3,
    usage: str = "식후 30분",
) -> Dict[str, Any]:
    return {
        "drug_name": drug_name,
        "ingredient": ingredient,
        "dose_unit": dose_unit,
        "frequency_per_day": freq,
        "duration_days": days,
        "usage_note": usage,
    }


SPECIALTY_TEMPLATES: Dict[str, Dict[str, Any]] = {
    "INTERNAL": {
        "label": "내과",
        "icon": "🩺",
        "summary": "감기·고혈압·당뇨·위장 질환 등 내과 다빈도 진단·검사·약물 패키지",
        "diagnoses": [
            _diag("J20.9", "급성 기관지염"),
            _diag("J00", "급성 비인두염(감기)"),
            _diag("K29.7", "위염"),
            _diag("K21.0", "위식도역류병"),
            _diag("I10", "본태성 고혈압"),
            _diag("E11.9", "제2형 당뇨병"),
            _diag("E78.5", "이상지질혈증"),
            _diag("J30.4", "알레르기성 비염"),
            _diag("R51", "두통"),
            _diag("A09", "감염성 위장염"),
        ],
        "procedures": [
            _proc("AA154", "초진 진찰료(가-1)", "진찰", 17610),
            _proc("AA254", "재진 진찰료(가-2)", "진찰", 12580),
            _proc("B0010", "일반혈액검사 5종", "검사", 5500),
            _proc("B2400", "공복혈당", "검사", 1100),
            _proc("E6541", "심전도(EKG)", "검사", 6630),
            _proc("MX181", "표층열치료", "처치", 2520),
        ],
        "drugs": [
            _drug("아세트아미노펜정 500mg", ingredient="아세트아미노펜", freq=3, days=3),
            _drug("이부프로펜정 200mg", ingredient="이부프로펜", freq=3, days=3),
            _drug("오메프라졸캡슐 20mg", ingredient="오메프라졸", freq=1, days=14, usage="식전 30분"),
            _drug("암로디핀정 5mg", ingredient="암로디핀", freq=1, days=30, usage="아침 식후"),
            _drug("메트포르민정 500mg", ingredient="메트포르민", freq=2, days=30, usage="식후"),
            _drug("아토르바스타틴정 10mg", ingredient="아토르바스타틴", freq=1, days=30, usage="저녁 식후"),
            _drug("로라타딘정 10mg", ingredient="로라타딘", freq=1, days=7, usage="저녁 식후"),
        ],
    },
    "ENT": {
        "label": "이비인후과",
        "icon": "👂",
        "summary": "편도염·중이염·비염·부비동염 등 이비인후과 다빈도",
        "diagnoses": [
            _diag("J03.9", "급성 편도염"),
            _diag("H66.9", "중이염"),
            _diag("J30.1", "계절성 알레르기 비염"),
            _diag("J01.9", "급성 부비동염"),
            _diag("J04.0", "급성 후두염"),
            _diag("J02.9", "급성 인두염"),
            _diag("R07.0", "인후통"),
            _diag("H81.0", "메니에르병"),
        ],
        "procedures": [
            _proc("AA154", "초진 진찰료", "진찰", 17610),
            _proc("AA254", "재진 진찰료", "진찰", 12580),
            _proc("E7100", "비강내시경 검사", "검사", 21000),
            _proc("E7200", "이경 검사", "검사", 4400),
            _proc("E6101", "순음청력검사", "검사", 7470),
            _proc("PR201", "비강 흡입 처치", "처치", 4400),
        ],
        "drugs": [
            _drug("아목시실린캡슐 250mg", ingredient="아목시실린", freq=3, days=5),
            _drug("클래리스로마이신정 250mg", ingredient="클래리스로마이신", freq=2, days=7),
            _drug("슈도에페드린정", ingredient="슈도에페드린", freq=3, days=5),
            _drug("플루티카손비강분무액", ingredient="플루티카손", dose_unit="회", freq=2, days=14, usage="콧속 좌우 1번씩"),
            _drug("세티리진정 10mg", ingredient="세티리진", freq=1, days=14, usage="저녁"),
        ],
    },
    "PEDIATRICS": {
        "label": "소아청소년과",
        "icon": "🧒",
        "summary": "감기·중이염·수두·예방접종·영유아검진 다빈도",
        "diagnoses": [
            _diag("J20.9", "급성 기관지염"),
            _diag("J00", "감기"),
            _diag("A09", "급성 위장염"),
            _diag("J30.9", "알레르기 비염"),
            _diag("B01.9", "수두"),
            _diag("B05.9", "홍역"),
            _diag("L20.9", "아토피피부염"),
            _diag("Z00.1", "영유아 일반건강검진"),
        ],
        "procedures": [
            _proc("AA154", "초진 진찰료", "진찰", 17610),
            _proc("AA254", "재진 진찰료", "진찰", 12580),
            _proc("CV001", "영유아 건강검진", "검사", 24000),
            _proc("VAC01", "DTaP 예방접종", "주사", 0),
            _proc("VAC02", "MMR 예방접종", "주사", 0),
            _proc("E7200", "이경 검사", "검사", 4400),
        ],
        "drugs": [
            _drug("아세트아미노펜시럽", ingredient="아세트아미노펜", dose_unit="ml", freq=4, days=3, usage="체중당 10~15mg/kg"),
            _drug("이부프로펜시럽", ingredient="이부프로펜", dose_unit="ml", freq=3, days=3, usage="체중당 5~10mg/kg"),
            _drug("세파클러시럽 125mg/5ml", ingredient="세파클러", dose_unit="ml", freq=3, days=5),
            _drug("로페라미드시럽", ingredient="로페라미드", dose_unit="ml", freq=2, days=2),
        ],
    },
    "DERMATOLOGY": {
        "label": "피부과",
        "icon": "✨",
        "summary": "아토피·여드름·피부염·사마귀 등 피부 다빈도",
        "diagnoses": [
            _diag("L20.9", "아토피피부염"),
            _diag("L40.9", "건선"),
            _diag("L70.0", "심상성 여드름"),
            _diag("L30.9", "피부염"),
            _diag("B07", "사마귀"),
            _diag("L50.9", "두드러기"),
            _diag("B86", "옴"),
            _diag("L25.9", "접촉 피부염"),
        ],
        "procedures": [
            _proc("AA154", "초진 진찰료", "진찰", 17610),
            _proc("MM110", "피부 절제술 (소)", "시술", 35000),
            _proc("MM010", "냉동치료(사마귀)", "시술", 13000),
            _proc("BX001", "피부생검", "검사", 28000),
            _proc("EX001", "더모스코피", "검사", 0),
        ],
        "drugs": [
            _drug("베타메타손크림 0.05%", ingredient="베타메타손", dose_unit="g", freq=2, days=7, usage="환부 도포"),
            _drug("타크롤리무스연고 0.03%", ingredient="타크롤리무스", dose_unit="g", freq=2, days=14, usage="환부 도포"),
            _drug("클로르페니라민정 4mg", ingredient="클로르페니라민", freq=3, days=5, usage="식후 30분"),
            _drug("이소트레티노인캡슐 10mg", ingredient="이소트레티노인", freq=1, days=30,
                  usage="저녁 식후 — 가임여성 주의"),
        ],
    },
    "ORTHOPEDICS": {
        "label": "정형외과",
        "icon": "🦴",
        "summary": "근골격 통증·물리치료·도수치료·관절강내주사 다빈도",
        "diagnoses": [
            _diag("M54.5", "요통"),
            _diag("M51.1", "추간판탈출증"),
            _diag("M25.5", "관절통"),
            _diag("M77.0", "건염"),
            _diag("M75.0", "어깨 유착성 관절낭염"),
            _diag("S52.5", "요골 원위부 골절"),
            _diag("M17.9", "무릎 관절증"),
            _diag("M79.6", "사지 통증"),
        ],
        "procedures": [
            _proc("AA154", "초진 진찰료", "진찰", 17610),
            _proc("MM181", "표층열치료", "물리치료", 2520),
            _proc("MM151", "심층열치료(초음파)", "물리치료", 5040),
            _proc("MM301", "간섭파전류치료", "물리치료", 2010),
            _proc("MO001", "도수치료", "물리치료", 60000),
            _proc("ML001", "관절강내 주사", "주사", 22000),
            _proc("ESW01", "체외충격파(ESWT)", "시술", 90000),
        ],
        "drugs": [
            _drug("이부프로펜정 200mg", ingredient="이부프로펜", freq=3, days=5, usage="식후 30분"),
            _drug("아세클로페낙정 100mg", ingredient="아세클로페낙", freq=2, days=5),
            _drug("세레콕시브캡슐 200mg", ingredient="셀레콕시브", freq=1, days=7),
            _drug("에페리손정 50mg", ingredient="에페리손", freq=3, days=5, usage="근이완제"),
            _drug("트라마돌캡슐 50mg", ingredient="트라마돌", freq=2, days=3, usage="강한 통증 시"),
        ],
    },
    "GENERAL": {
        "label": "일반",
        "icon": "🏥",
        "summary": "기본 진찰료 + 다빈도 진단 (감기·통증·복통)",
        "diagnoses": [
            _diag("J00", "감기"),
            _diag("R51", "두통"),
            _diag("R10.4", "복통"),
            _diag("R50.9", "발열"),
            _diag("M54.5", "요통"),
        ],
        "procedures": [
            _proc("AA154", "초진 진찰료", "진찰", 17610),
            _proc("AA254", "재진 진찰료", "진찰", 12580),
        ],
        "drugs": [
            _drug("아세트아미노펜정 500mg", ingredient="아세트아미노펜", freq=3, days=3),
            _drug("이부프로펜정 200mg", ingredient="이부프로펜", freq=3, days=3),
        ],
    },
}


SPECIALTIES_LIST = [
    {"code": k, "label": v["label"], "icon": v["icon"], "summary": v["summary"]}
    for k, v in SPECIALTY_TEMPLATES.items()
]


def get_template(specialty: str) -> Dict[str, Any]:
    return SPECIALTY_TEMPLATES.get((specialty or "").upper(), SPECIALTY_TEMPLATES["GENERAL"])
