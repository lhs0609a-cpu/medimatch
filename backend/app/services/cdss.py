"""
CDSS (Clinical Decision Support System) — 사전심사 9종 점검 엔진

처방·진단·시술을 한 번에 받아 보험 삭감 위험을 사전에 점검하고,
삭감예방 점수와 예상청구액을 계산한다.

9종 카테고리:
  1. DIAG_REQUIRED   인정상병 — 처방약/시술이 요구하는 진단 누락
  2. DRUG_INTERACTION 병용금기 — 약물 상호작용
  3. DRUG_DUPLICATE  중복투약 — 동일 ATC 클래스 중복
  4. DOSAGE          투여량 — 1일 최대 한도 초과
  5. FEE_MISSING     수가누락 — 진찰료/처방료 누락
  6. PHYS_THERAPY    물리치료 — 근골격 진단 누락
  7. SEX_AGE         성별·연령 제한 — 약/시술 제약 위반
  8. SPEC_NOTE       특정내역 — 사유/구분코드 누락
  9. PEDI_DOSE       소아용량 — 체중 기반 적정성

각 룰은 데이터 구조이므로 새 룰 추가는 룰셋만 늘리면 된다.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Any, Iterable, Callable

# ────────────────────────────────────────────────────────────
#  카테고리 / 심각도
# ────────────────────────────────────────────────────────────
CATEGORIES = [
    "DIAG_REQUIRED",
    "DRUG_INTERACTION",
    "DRUG_DUPLICATE",
    "DOSAGE",
    "FEE_MISSING",
    "PHYS_THERAPY",
    "SEX_AGE",
    "SPEC_NOTE",
    "PEDI_DOSE",
]

CATEGORY_LABELS_KO = {
    "DIAG_REQUIRED": "인정상병",
    "DRUG_INTERACTION": "병용금기",
    "DRUG_DUPLICATE": "중복투약",
    "DOSAGE": "투여량",
    "FEE_MISSING": "수가누락",
    "PHYS_THERAPY": "물리치료",
    "SEX_AGE": "성별·연령",
    "SPEC_NOTE": "특정내역",
    "PEDI_DOSE": "소아용량",
}

SEVERITY_PENALTY = {"HIGH": 12, "MEDIUM": 6, "LOW": 2}


# ────────────────────────────────────────────────────────────
#  입출력 데이터
# ────────────────────────────────────────────────────────────
@dataclass
class CdssDiagnosis:
    code: str                 # KCD-8 / ICD-10
    name: str = ""
    is_primary: bool = False


@dataclass
class CdssDrug:
    drug_name: str = ""
    ingredient: str = ""
    dose_per_time: float = 1.0
    dose_unit: str = "정"
    frequency_per_day: int = 1
    duration_days: int = 1
    total_quantity: float = 0.0


@dataclass
class CdssProcedure:
    code: str = ""
    name: str = ""
    category: str = ""        # 진찰/검사/시술/주사/처치/물리치료
    quantity: int = 1
    unit_price: int = 0
    insurance_covered: bool = True


@dataclass
class CdssPatient:
    age: Optional[int] = None     # 만 나이
    sex: Optional[str] = None     # M / F
    weight_kg: Optional[float] = None


@dataclass
class CdssIssue:
    code: str
    category: str
    severity: str                 # HIGH / MEDIUM / LOW
    title: str
    message: str
    fix_hint: str = ""
    blocking: bool = False
    item_index: Optional[int] = None     # drug index
    procedure_index: Optional[int] = None
    refs: List[str] = field(default_factory=list)


@dataclass
class CdssEstimate:
    consultation_fee: int = 0     # 진찰료
    prescription_fee: int = 0     # 원외처방료
    procedure_total: int = 0      # 시술/검사 합산
    drug_total: int = 0           # 약값 (참고치 — 실제는 약국 청구)
    subtotal: int = 0
    insurance_amount: int = 0
    patient_amount: int = 0
    copay_rate: float = 0.30


@dataclass
class CdssResult:
    score: int                    # 0~100
    estimate: CdssEstimate
    issues: List[CdssIssue]
    passed: List[str]             # 통과한 카테고리
    summary: Dict[str, int]       # severity별 개수
    blocking_count: int


# ────────────────────────────────────────────────────────────
#  시드 데이터 — 한국 의원급 청구 기준
# ────────────────────────────────────────────────────────────
# 진찰료 (의원급 가-1, 가-2 기준치 — 매년 고시)
FEE_INITIAL = 17610   # 초진 진찰료
FEE_REVISIT = 12580   # 재진 진찰료
FEE_RX_OUTPATIENT = 1210  # 원외처방료

# 약물군별 인정상병 매핑
# 처방약 키워드 → 요구되는 KCD 첫글자(prefix) 후보
DRUG_DIAG_REQUIREMENT = [
    # 항생제 → 감염성 (A/B/J/L/N/O 등)
    {
        "keywords": ["아목시실린", "amoxicillin", "세파", "cephalosporin", "세팔렉신",
                     "아지스로마이신", "azithromycin", "클래리스로마이신",
                     "독시사이클린", "doxycycline", "메트로니다졸", "metronidazole",
                     "시프로플록사신", "ciprofloxacin", "레보플록사신",
                     "페니실린", "penicillin"],
        "label": "항생제",
        "diag_prefix": ["A", "B", "J", "L", "N", "O", "H", "K"],
        "fix_hint": "감염성 진단(예: J20.9 급성기관지염, J03 급성편도염, N30 방광염, L08 피부감염)을 추가하세요.",
    },
    # PPI → 위장 (K)
    {
        "keywords": ["오메프라졸", "omeprazole", "에소메프라졸", "esomeprazole",
                     "판토프라졸", "pantoprazole", "라베프라졸", "rabeprazole",
                     "란소프라졸", "lansoprazole"],
        "label": "PPI(위산억제제)",
        "diag_prefix": ["K"],
        "fix_hint": "위장 진단(예: K29 위염, K21 GERD, K25 위궤양)을 추가하세요.",
    },
    # 항히스타민(전신) → 알레르기/비염
    {
        "keywords": ["세티리진", "cetirizine", "로라타딘", "loratadine",
                     "페니라민", "데스로라타딘", "펙소페나딘", "fexofenadine"],
        "label": "전신 항히스타민",
        "diag_prefix": ["J", "L", "T", "H"],   # J30 알레르기 비염, L20 아토피, T78 알레르기
        "fix_hint": "알레르기/비염 진단(J30, L20, T78)을 추가하세요.",
    },
    # 향정신성 — 벤조 → F 또는 G
    {
        "keywords": ["알프라졸람", "alprazolam", "로라제팜", "lorazepam",
                     "디아제팜", "diazepam", "졸피뎀", "zolpidem",
                     "클로나제팜", "clonazepam"],
        "label": "벤조디아제핀/수면제",
        "diag_prefix": ["F", "G"],
        "fix_hint": "F32 우울, F41 불안, G47 수면장애 등 정신·신경계 진단을 추가하세요.",
    },
    # 스타틴 → 이상지질혈증 E78
    {
        "keywords": ["아토르바스타틴", "atorvastatin", "로수바스타틴", "rosuvastatin",
                     "심바스타틴", "simvastatin", "프라바스타틴", "pravastatin"],
        "label": "스타틴",
        "diag_prefix": ["E", "I"],
        "fix_hint": "E78 이상지질혈증, I10 본태성고혈압 등 순환기·내분비 진단을 추가하세요.",
    },
    # ARB / ACE-I → 고혈압 I10
    {
        "keywords": ["로사르탄", "losartan", "발사르탄", "valsartan",
                     "텔미사르탄", "telmisartan", "라미프릴", "ramipril",
                     "에날라프릴", "enalapril"],
        "label": "고혈압 약",
        "diag_prefix": ["I"],
        "fix_hint": "I10 본태성고혈압 또는 I11~I15 등 순환기 진단을 추가하세요.",
    },
    # 메트포르민 → 당뇨 E11
    {
        "keywords": ["메트포르민", "metformin", "글리메피리드", "글리피지드",
                     "시타글립틴", "sitagliptin"],
        "label": "당뇨약",
        "diag_prefix": ["E"],
        "fix_hint": "E10/E11/E13 당뇨 진단을 추가하세요.",
    },
]


# 약물 1일 최대용량 (성분 키워드 → mg 또는 정)
# (간소판 — 추후 식약처 데이터로 확장)
DOSAGE_LIMITS = {
    "아세트아미노펜": {"max_per_day_mg": 4000, "name": "아세트아미노펜"},
    "acetaminophen": {"max_per_day_mg": 4000, "name": "아세트아미노펜"},
    "이부프로펜": {"max_per_day_mg": 3200, "name": "이부프로펜"},
    "ibuprofen": {"max_per_day_mg": 3200, "name": "이부프로펜"},
    "트라마돌": {"max_per_day_mg": 400, "name": "트라마돌"},
    "tramadol": {"max_per_day_mg": 400, "name": "트라마돌"},
    "졸피뎀": {"max_per_day_mg": 10, "name": "졸피뎀"},
    "zolpidem": {"max_per_day_mg": 10, "name": "졸피뎀"},
    "알프라졸람": {"max_per_day_mg": 4, "name": "알프라졸람"},
    "alprazolam": {"max_per_day_mg": 4, "name": "알프라졸람"},
}


# 성별·연령 제한 — (키워드, 조건, severity, message)
SEX_AGE_RULES = [
    {
        "keywords": ["코데인", "codeine"],
        "max_age": 11,
        "severity": "HIGH",
        "title": "코데인 12세 미만 금기",
        "message": "코데인은 12세 미만 환자에게 금지(호흡억제 위험). 18세 미만 비만/수면무호흡 환자에도 금기.",
        "fix_hint": "12세 이상이라면 진료기록에 정확한 만나이를 기재하거나, 비-코데인 진해제로 대체하세요.",
    },
    {
        "keywords": ["독시사이클린", "doxycycline", "테트라사이클린", "tetracycline"],
        "max_age": 7,
        "severity": "HIGH",
        "title": "테트라사이클린계 8세 미만 금기",
        "message": "치아 영구 착색·성장저해 우려로 8세 미만에 금지.",
        "fix_hint": "아목시실린 등 다른 항생제로 대체하세요.",
    },
    {
        "keywords": ["시프로플록사신", "ciprofloxacin", "플록사신"],
        "max_age": 17,
        "severity": "MEDIUM",
        "title": "퀴놀론계 18세 미만 신중 사용",
        "message": "관절·연골 발달에 영향 가능. 소아는 다른 약제 우선 고려.",
        "fix_hint": "특정내역(사유)을 기재해야 청구 가능. 가능하면 대체 약제 처방.",
    },
    {
        "keywords": ["아스피린", "aspirin"],
        "max_age": 15,
        "severity": "MEDIUM",
        "title": "아스피린 16세 미만 라이증후군 위험",
        "message": "바이러스성 열성 질환 시 16세 미만에 라이증후군 위험.",
        "fix_hint": "아세트아미노펜·이부프로펜으로 대체.",
    },
    {
        "keywords": ["피나스테리드", "finasteride", "두타스테리드", "dutasteride"],
        "sex": "F",
        "severity": "HIGH",
        "title": "여성 사용 금기 (탈모치료제)",
        "message": "임신/가임여성 접촉 시 태아 기형 위험. 여성 처방 불가.",
        "fix_hint": "여성 환자에게는 미녹시딜 등 대체 약제 사용.",
    },
    {
        "keywords": ["이소트레티노인", "isotretinoin"],
        "sex": "F",
        "severity": "HIGH",
        "title": "가임여성 임신검사 필수",
        "message": "강한 기형유발 위험. 가임 여성에게 처방 시 임신검사·피임 확인 필수.",
        "fix_hint": "특정내역에 임신검사 결과·피임 동의를 명시하세요.",
    },
]


# 물리치료 행위코드 prefix (간소판) — 실제 운영 시 보험 행위코드 마스터 사용
PT_PROCEDURE_KEYWORDS = ["물리치료", "표층열", "심층열", "한랭", "전기자극",
                        "간섭파", "초음파", "ESWT", "도수치료", "운동치료",
                        "MM", "MO", "MX"]

# 물리치료 인정 상병 prefix
PT_DIAG_PREFIX = ["M"]   # 근골격계


# 특정내역(사유) 필요한 시술/검사 키워드
SPEC_NOTE_KEYWORDS = [
    {"keyword": "MRI", "label": "MRI 검사"},
    {"keyword": "CT", "label": "CT 검사"},
    {"keyword": "초음파", "label": "초음파"},
    {"keyword": "도수치료", "label": "도수치료"},
    {"keyword": "체외충격파", "label": "체외충격파(ESWT)"},
]


# ────────────────────────────────────────────────────────────
#  헬퍼
# ────────────────────────────────────────────────────────────
def _drug_text(d: CdssDrug) -> str:
    return f"{d.drug_name or ''} {d.ingredient or ''}".lower()


def _has_diag_prefix(diags: List[CdssDiagnosis], prefixes: List[str]) -> bool:
    for d in diags:
        code = (d.code or "").upper()
        for p in prefixes:
            if code.startswith(p):
                return True
    return False


def _kw_match(text: str, keywords: List[str]) -> Optional[str]:
    t = text.lower()
    for kw in keywords:
        if kw.lower() in t:
            return kw
    return None


def _extract_strength_mg(name: str) -> Optional[float]:
    """'아세트아미노펜 500mg' → 500.0"""
    import re
    m = re.search(r"(\d+(?:\.\d+)?)\s*(mg|g)\b", name.lower())
    if not m:
        return None
    val = float(m.group(1))
    if m.group(2) == "g":
        val *= 1000
    return val


# ────────────────────────────────────────────────────────────
#  9종 점검 — 각 함수는 issues 리스트를 반환
# ────────────────────────────────────────────────────────────
def check_diag_required(
    diags: List[CdssDiagnosis], drugs: List[CdssDrug]
) -> List[CdssIssue]:
    issues = []
    for i, drug in enumerate(drugs):
        text = _drug_text(drug)
        for rule in DRUG_DIAG_REQUIREMENT:
            kw = _kw_match(text, rule["keywords"])
            if not kw:
                continue
            if _has_diag_prefix(diags, rule["diag_prefix"]):
                continue
            issues.append(CdssIssue(
                code="CDS-DR-01",
                category="DIAG_REQUIRED",
                severity="HIGH",
                title=f"{rule['label']} 처방 — 인정상병 누락",
                message=f"'{drug.drug_name}'은(는) {rule['label']}로 분류되며, "
                        f"진단 코드 ({'/'.join(rule['diag_prefix'])}…)가 1건 이상 필요합니다.",
                fix_hint=rule["fix_hint"],
                blocking=True,
                item_index=i,
            ))
            break
    return issues


def check_drug_interaction(drugs: List[CdssDrug]) -> List[CdssIssue]:
    """기존 prescriptions._dur_check와 동일 로직 — 중복 코드를 피해 import"""
    try:
        from app.api.v1.prescriptions import _dur_check as _legacy_dur_check
    except Exception:
        return []

    class _Adapter:
        def __init__(self, d: CdssDrug):
            self.drug_name = d.drug_name
            self.ingredient = d.ingredient

    legacy_input = [_Adapter(d) for d in drugs]
    warnings, item_warnings = _legacy_dur_check(legacy_input)
    out: List[CdssIssue] = []
    for w in warnings:
        if w.get("type") != "interaction":
            continue
        out.append(CdssIssue(
            code="CDS-DI-01",
            category="DRUG_INTERACTION",
            severity=w.get("severity", "MEDIUM"),
            title="병용금기 약물 조합",
            message=w.get("message", ""),
            fix_hint="대체 약제 처방 또는 병용 회피.",
            blocking=(w.get("severity") == "HIGH"),
        ))
    return out


def check_drug_duplicate(drugs: List[CdssDrug]) -> List[CdssIssue]:
    """동일 약품명/주성분 중복 — DUR과 별도로 카테고리만 따로 보고."""
    issues: List[CdssIssue] = []
    seen: Dict[str, int] = {}
    for i, d in enumerate(drugs):
        key = (d.drug_name or d.ingredient or "").strip().lower()
        if not key:
            continue
        if key in seen:
            issues.append(CdssIssue(
                code="CDS-DUP-01",
                category="DRUG_DUPLICATE",
                severity="LOW",
                title="동일 약품 중복",
                message=f"'{d.drug_name}'이(가) 처방전 내 2회 이상 등장합니다.",
                fix_hint="동일 약품은 1건으로 통합하고 용량/일수만 조정하세요.",
                item_index=i,
            ))
        else:
            seen[key] = i
    return issues


def check_dosage(drugs: List[CdssDrug]) -> List[CdssIssue]:
    issues: List[CdssIssue] = []
    for i, d in enumerate(drugs):
        text = _drug_text(d)
        strength = _extract_strength_mg(d.drug_name)
        for kw, rule in DOSAGE_LIMITS.items():
            if kw.lower() not in text:
                continue
            if strength is None:
                continue
            daily_mg = strength * d.dose_per_time * d.frequency_per_day
            if daily_mg <= rule["max_per_day_mg"]:
                continue
            issues.append(CdssIssue(
                code="CDS-DOSE-01",
                category="DOSAGE",
                severity="HIGH",
                title=f"{rule['name']} 1일 최대량 초과",
                message=f"1일 {daily_mg:.0f}mg ≥ 한도 {rule['max_per_day_mg']}mg. 간독성/호흡억제 등 위험.",
                fix_hint=f"용법을 조정해 1일 {rule['max_per_day_mg']}mg 이하로 처방하세요.",
                blocking=True,
                item_index=i,
            ))
            break
    return issues


def check_fee_missing(
    procedures: List[CdssProcedure], visit_type: str
) -> List[CdssIssue]:
    """진찰료 누락 점검 — 처방료는 별도 청구 시스템에서 자동 부가."""
    issues: List[CdssIssue] = []
    has_consult = any(
        ("진찰" in (p.name or "")) or
        (p.category == "진찰") or
        ((p.code or "").startswith("AA"))   # 진찰료 코드 prefix(가)
        for p in procedures
    )
    if not has_consult:
        label = "초진" if (visit_type or "").upper() == "INITIAL" else "재진"
        fee = FEE_INITIAL if label == "초진" else FEE_REVISIT
        issues.append(CdssIssue(
            code="CDS-FEE-01",
            category="FEE_MISSING",
            severity="MEDIUM",
            title=f"{label} 진찰료 누락",
            message=f"진찰료(가-{1 if label=='초진' else 2})가 시술 목록에 없습니다. 약 {fee:,}원 청구 누락.",
            fix_hint=f"진찰료 코드(AA{'1' if label=='초진' else '2'}…)를 시술 목록에 추가하세요.",
        ))
    return issues


def check_phys_therapy(
    diags: List[CdssDiagnosis], procedures: List[CdssProcedure]
) -> List[CdssIssue]:
    issues: List[CdssIssue] = []
    has_pt = False
    for j, p in enumerate(procedures):
        text = (p.name or "") + " " + (p.code or "") + " " + (p.category or "")
        if any(kw in text for kw in PT_PROCEDURE_KEYWORDS):
            has_pt = True
            if not _has_diag_prefix(diags, PT_DIAG_PREFIX):
                issues.append(CdssIssue(
                    code="CDS-PT-01",
                    category="PHYS_THERAPY",
                    severity="HIGH",
                    title="물리치료 인정상병 누락",
                    message=f"'{p.name}' 시행 시 근골격계 진단(M코드)이 1건 이상 필요합니다.",
                    fix_hint="M54 척추병증, M25 관절통, M79 근육·연조직 등 M코드를 추가하세요.",
                    blocking=True,
                    procedure_index=j,
                ))
                break
    return issues


def check_sex_age(
    drugs: List[CdssDrug], patient: CdssPatient
) -> List[CdssIssue]:
    issues: List[CdssIssue] = []
    for i, d in enumerate(drugs):
        text = _drug_text(d)
        for rule in SEX_AGE_RULES:
            kw = _kw_match(text, rule["keywords"])
            if not kw:
                continue
            violated = False
            if "max_age" in rule and patient.age is not None and patient.age <= rule["max_age"]:
                violated = True
            if "min_age" in rule and patient.age is not None and patient.age >= rule["min_age"]:
                violated = True
            if "sex" in rule and patient.sex and patient.sex.upper() == rule["sex"].upper():
                violated = True
            if violated:
                issues.append(CdssIssue(
                    code="CDS-SA-01",
                    category="SEX_AGE",
                    severity=rule.get("severity", "MEDIUM"),
                    title=rule["title"],
                    message=rule["message"],
                    fix_hint=rule["fix_hint"],
                    blocking=(rule.get("severity") == "HIGH"),
                    item_index=i,
                ))
                break
    return issues


def check_spec_note(procedures: List[CdssProcedure]) -> List[CdssIssue]:
    issues: List[CdssIssue] = []
    for j, p in enumerate(procedures):
        text = (p.name or "") + " " + (p.code or "")
        for sn in SPEC_NOTE_KEYWORDS:
            if sn["keyword"] in text:
                # 사유 기재 여부는 procedure.note에 있다고 가정 — 비어있으면 경고
                # (현재 CdssProcedure 스키마엔 note 없음. 향후 확장.)
                issues.append(CdssIssue(
                    code="CDS-SN-01",
                    category="SPEC_NOTE",
                    severity="MEDIUM",
                    title=f"{sn['label']} 특정내역 사유 필요",
                    message=f"{sn['label']}는 청구 시 사유 기재(특정내역 구분코드)가 요구됩니다.",
                    fix_hint="진료기록 '검사사유' 필드와 청구 특정내역에 사유를 명시하세요.",
                    procedure_index=j,
                ))
                break
    return issues


def check_pedi_dose(
    drugs: List[CdssDrug], patient: CdssPatient
) -> List[CdssIssue]:
    """소아(만 12세 미만) 체중 기준 — 체중 정보 없으면 경고만."""
    if patient.age is None or patient.age >= 12:
        return []
    issues: List[CdssIssue] = []
    if patient.weight_kg is None:
        issues.append(CdssIssue(
            code="CDS-PD-01",
            category="PEDI_DOSE",
            severity="MEDIUM",
            title="소아 환자 체중 정보 누락",
            message=f"만 {patient.age}세 환자의 체중이 기록되지 않아 용량 적정성 검증이 어렵습니다.",
            fix_hint="활력징후에 체중(kg)을 입력하세요. 소아 용량은 mg/kg 기준으로 산출됩니다.",
        ))
        return issues
    # 체중 있음 — 추후 mg/kg 룰셋 확장 가능
    return issues


# ────────────────────────────────────────────────────────────
#  비용 추산
# ────────────────────────────────────────────────────────────
def estimate_amount(
    procedures: List[CdssProcedure],
    drugs: List[CdssDrug],
    visit_type: str,
    has_prescription: bool,
    copay_rate: float = 0.30,
) -> CdssEstimate:
    consult = 0
    if not any(("진찰" in (p.name or "")) or (p.category == "진찰") for p in procedures):
        consult = FEE_INITIAL if (visit_type or "").upper() == "INITIAL" else FEE_REVISIT

    proc_total = sum((p.unit_price or 0) * (p.quantity or 1) for p in procedures)
    drug_total = 0
    rx_fee = FEE_RX_OUTPATIENT if has_prescription else 0
    subtotal = consult + proc_total + drug_total + rx_fee
    insurance = int(subtotal * (1 - copay_rate))
    patient = subtotal - insurance
    return CdssEstimate(
        consultation_fee=consult,
        prescription_fee=rx_fee,
        procedure_total=proc_total,
        drug_total=drug_total,
        subtotal=subtotal,
        insurance_amount=insurance,
        patient_amount=patient,
        copay_rate=copay_rate,
    )


# ────────────────────────────────────────────────────────────
#  메인 — pre_screen
# ────────────────────────────────────────────────────────────
def pre_screen(
    *,
    patient: Optional[CdssPatient] = None,
    diagnoses: Optional[List[CdssDiagnosis]] = None,
    procedures: Optional[List[CdssProcedure]] = None,
    drugs: Optional[List[CdssDrug]] = None,
    visit_type: str = "INITIAL",
    copay_rate: float = 0.30,
) -> CdssResult:
    """모든 9종 룰을 돌리고 점수·예상청구액·이슈를 반환."""
    patient = patient or CdssPatient()
    diagnoses = diagnoses or []
    procedures = procedures or []
    drugs = drugs or []

    runners: List[tuple[str, Callable[[], List[CdssIssue]]]] = [
        ("DIAG_REQUIRED", lambda: check_diag_required(diagnoses, drugs)),
        ("DRUG_INTERACTION", lambda: check_drug_interaction(drugs)),
        ("DRUG_DUPLICATE", lambda: check_drug_duplicate(drugs)),
        ("DOSAGE", lambda: check_dosage(drugs)),
        ("FEE_MISSING", lambda: check_fee_missing(procedures, visit_type)),
        ("PHYS_THERAPY", lambda: check_phys_therapy(diagnoses, procedures)),
        ("SEX_AGE", lambda: check_sex_age(drugs, patient)),
        ("SPEC_NOTE", lambda: check_spec_note(procedures)),
        ("PEDI_DOSE", lambda: check_pedi_dose(drugs, patient)),
    ]

    all_issues: List[CdssIssue] = []
    passed: List[str] = []
    for category, fn in runners:
        try:
            found = fn() or []
        except Exception as exc:
            found = [CdssIssue(
                code=f"CDS-ERR-{category}",
                category=category,
                severity="LOW",
                title=f"{CATEGORY_LABELS_KO.get(category, category)} 점검 오류",
                message=f"내부 오류로 점검을 건너뜀: {exc}",
            )]
        if not found:
            passed.append(category)
        all_issues.extend(found)

    summary = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for it in all_issues:
        summary[it.severity] = summary.get(it.severity, 0) + 1

    # 점수: 100점 시작 → severity별 패널티 차감 (최저 0)
    penalty = sum(SEVERITY_PENALTY.get(it.severity, 0) for it in all_issues)
    score = max(0, 100 - penalty)

    estimate = estimate_amount(
        procedures=procedures,
        drugs=drugs,
        visit_type=visit_type,
        has_prescription=bool(drugs),
        copay_rate=copay_rate,
    )

    blocking_count = sum(1 for it in all_issues if it.blocking)

    return CdssResult(
        score=score,
        estimate=estimate,
        issues=all_issues,
        passed=passed,
        summary=summary,
        blocking_count=blocking_count,
    )
