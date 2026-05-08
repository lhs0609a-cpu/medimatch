"""
개원 단계별 체크리스트 + 파트너 카테고리 매칭 룰

- LeadOpeningStage 별 표준 체크리스트
- 각 항목이 어느 partner 카테고리와 연결되는지 (자동 추천에 사용)
- 점수 환산 (readiness_score)
"""
from typing import List, Dict, Any

# Partner.category 와 일치하는 슬러그 (partner_category.DEFAULT_CATEGORIES 참조)
CAT_REAL_ESTATE = "realestate"   # 부동산중개법인
CAT_LEGAL = "legal"              # 법무법인 (변호사)
CAT_ACCOUNTING = "accounting"    # 회계법인
CAT_TAX = "tax"                  # 세무법인
CAT_LABOR = "labor"              # 노무법인
CAT_CONSULTING = "consulting"    # 종합 개원컨설팅 (자격사 외)
CAT_FINANCE = "finance"          # 대출·리스·보험
CAT_INTERIOR = "interior"
CAT_EQUIPMENT = "equipment"
CAT_PHARMA = "pharma"
CAT_SIGNAGE = "signage"
CAT_EMR = "emr"
CAT_MARKETING = "marketing"


# ============================================================
# 단계별 체크리스트 템플릿
# ============================================================
# 각 항목:
#   key      : 고유 식별자 (snake_case)
#   label    : UI 노출 한글
#   weight   : 점수 가중치 (default 1)
#   partner_categories : 이 항목이 미완료일 때 추천할 파트너 카테고리 (없을 수 있음)

CHECKLIST_TEMPLATES: Dict[str, List[Dict[str, Any]]] = {
    "PLANNING": [
        {"key": "specialty_decided",   "label": "진료과·컨셉 확정",        "weight": 1,
         "partner_categories": [CAT_CONSULTING]},
        {"key": "budget_estimated",    "label": "총 예산 산정",            "weight": 2,
         "partner_categories": [CAT_ACCOUNTING, CAT_FINANCE]},
        {"key": "loan_plan",           "label": "자금조달 계획",           "weight": 2,
         "partner_categories": [CAT_FINANCE]},
        {"key": "partnership_decided", "label": "단독·동업 의사결정",      "weight": 1,
         "partner_categories": [CAT_LEGAL, CAT_ACCOUNTING]},
        {"key": "target_region_set",   "label": "타겟 지역 결정",          "weight": 1,
         "partner_categories": [CAT_REAL_ESTATE]},
        {"key": "open_timeline",       "label": "개원 타임라인 수립",      "weight": 1,
         "partner_categories": [CAT_CONSULTING]},
    ],
    "LOCATION_REVIEW": [
        {"key": "candidate_listed",    "label": "후보지 3곳 이상 검토",    "weight": 2,
         "partner_categories": [CAT_REAL_ESTATE]},
        {"key": "demographics_check",  "label": "상권·인구통계 분석",      "weight": 1,
         "partner_categories": [CAT_REAL_ESTATE, CAT_CONSULTING]},
        {"key": "competition_check",   "label": "주변 경쟁의원 분석",      "weight": 1,
         "partner_categories": [CAT_CONSULTING]},
        {"key": "rent_negotiated",     "label": "임대료 협상 진행",        "weight": 1,
         "partner_categories": [CAT_REAL_ESTATE]},
        {"key": "site_visit_done",     "label": "현장 답사 완료",          "weight": 1,
         "partner_categories": [CAT_REAL_ESTATE]},
    ],
    "CONTRACT": [
        {"key": "lease_drafted",       "label": "임대차계약서 초안",       "weight": 2,
         "partner_categories": [CAT_REAL_ESTATE, CAT_LEGAL]},
        {"key": "legal_review",        "label": "법률 검토",               "weight": 2,
         "partner_categories": [CAT_LEGAL]},
        {"key": "deposit_secured",     "label": "보증금·권리금 자금 확보", "weight": 1,
         "partner_categories": [CAT_FINANCE, CAT_ACCOUNTING]},
        {"key": "lease_signed",        "label": "임대차계약 체결",         "weight": 2,
         "partner_categories": [CAT_LEGAL]},
    ],
    "LICENSING": [
        {"key": "business_register",   "label": "사업자등록",              "weight": 2,
         "partner_categories": [CAT_TAX, CAT_ACCOUNTING]},
        {"key": "clinic_license",      "label": "의료기관 개설신고",       "weight": 3,
         "partner_categories": [CAT_LEGAL, CAT_CONSULTING]},
        {"key": "tax_register",        "label": "세무서 등록·전자세금계산서", "weight": 1,
         "partner_categories": [CAT_TAX]},
        {"key": "hira_register",       "label": "심평원 요양기관 등록",    "weight": 2,
         "partner_categories": [CAT_CONSULTING, CAT_TAX]},
        {"key": "insurance_register",  "label": "건강보험 요양급여 신청",  "weight": 1,
         "partner_categories": [CAT_CONSULTING]},
    ],
    "CONSTRUCTION": [
        {"key": "interior_vendor",     "label": "인테리어 업체 선정",      "weight": 3,
         "partner_categories": [CAT_INTERIOR]},
        {"key": "design_finalized",    "label": "설계도 확정",             "weight": 2,
         "partner_categories": [CAT_INTERIOR]},
        {"key": "construction_start",  "label": "공사 착공",               "weight": 1,
         "partner_categories": [CAT_INTERIOR]},
        {"key": "signage_ordered",     "label": "간판·사이니지 발주",      "weight": 1,
         "partner_categories": [CAT_SIGNAGE]},
        {"key": "construction_end",    "label": "준공·인수",               "weight": 2,
         "partner_categories": [CAT_INTERIOR]},
    ],
    "EQUIPMENT": [
        {"key": "equipment_listed",    "label": "필요 장비 목록 작성",     "weight": 1,
         "partner_categories": [CAT_EQUIPMENT, CAT_CONSULTING]},
        {"key": "equipment_quoted",    "label": "장비 견적 비교",          "weight": 2,
         "partner_categories": [CAT_EQUIPMENT]},
        {"key": "equipment_ordered",   "label": "장비 발주",               "weight": 2,
         "partner_categories": [CAT_EQUIPMENT, CAT_FINANCE]},
        {"key": "supplies_ordered",    "label": "소모품·약품 거래선",      "weight": 1,
         "partner_categories": [CAT_PHARMA]},
        {"key": "equipment_installed", "label": "장비 설치·세팅",          "weight": 2,
         "partner_categories": [CAT_EQUIPMENT]},
    ],
    "HIRING": [
        {"key": "staff_planned",       "label": "필요 인력 계획",          "weight": 1,
         "partner_categories": [CAT_LABOR, CAT_CONSULTING]},
        {"key": "recruitment_open",    "label": "채용 공고",               "weight": 1,
         "partner_categories": [CAT_CONSULTING]},
        {"key": "contracts_signed",    "label": "근로계약 체결",           "weight": 2,
         "partner_categories": [CAT_LABOR, CAT_LEGAL]},
        {"key": "training_done",       "label": "교육·OJT 완료",           "weight": 1,
         "partner_categories": [CAT_CONSULTING]},
        {"key": "payroll_set",         "label": "급여·4대보험 세팅",       "weight": 1,
         "partner_categories": [CAT_LABOR, CAT_TAX]},
    ],
    "OPENING": [
        {"key": "emr_setup",           "label": "EMR·청구 시스템 세팅",    "weight": 2,
         "partner_categories": [CAT_EMR]},
        {"key": "marketing_ready",     "label": "마케팅·홍보 준비",        "weight": 2,
         "partner_categories": [CAT_MARKETING]},
        {"key": "soft_open_done",      "label": "프리오픈·점검",           "weight": 1,
         "partner_categories": [CAT_CONSULTING]},
        {"key": "open_event",          "label": "개원 이벤트",             "weight": 1,
         "partner_categories": [CAT_MARKETING]},
        {"key": "patient_acquisition", "label": "초진 환자 유입 확인",     "weight": 1,
         "partner_categories": [CAT_MARKETING]},
    ],
    "OPERATING": [
        {"key": "revenue_track",       "label": "매출·청구 모니터링",      "weight": 1,
         "partner_categories": [CAT_EMR]},
        {"key": "cost_optimization",   "label": "비용·재고 최적화",        "weight": 1,
         "partner_categories": [CAT_ACCOUNTING, CAT_CONSULTING]},
        {"key": "tax_review",          "label": "세무·결산 점검",          "weight": 2,
         "partner_categories": [CAT_TAX, CAT_ACCOUNTING]},
        {"key": "marketing_roi",       "label": "마케팅 ROI 분석",         "weight": 1,
         "partner_categories": [CAT_MARKETING]},
    ],
}


STAGE_ORDER = [
    "PLANNING", "LOCATION_REVIEW", "CONTRACT", "LICENSING",
    "CONSTRUCTION", "EQUIPMENT", "HIRING", "OPENING", "OPERATING",
]

STAGE_LABELS = {
    "PLANNING":         "사업계획",
    "LOCATION_REVIEW":  "입지검토",
    "CONTRACT":         "임대계약",
    "LICENSING":        "인허가",
    "CONSTRUCTION":     "인테리어",
    "EQUIPMENT":        "의료기기",
    "HIRING":           "인력채용",
    "OPENING":          "개원준비",
    "OPERATING":        "운영안정",
}

CATEGORY_LABELS = {
    CAT_REAL_ESTATE:  "부동산중개법인",
    CAT_LEGAL:        "법무법인/변호사",
    CAT_ACCOUNTING:   "회계법인",
    CAT_TAX:          "세무법인",
    CAT_LABOR:        "노무법인",
    CAT_CONSULTING:   "개원종합컨설팅",
    CAT_FINANCE:      "금융·대출",
    CAT_INTERIOR:     "인테리어",
    CAT_EQUIPMENT:    "의료기기",
    CAT_PHARMA:       "의약품·소모품",
    CAT_SIGNAGE:      "간판·사이니지",
    CAT_EMR:          "EMR·청구",
    CAT_MARKETING:    "마케팅",
}


# ============================================================
# Helpers
# ============================================================

def build_default_checklist() -> Dict[str, List[Dict[str, Any]]]:
    """신규 lead 생성 시 기본 체크리스트 구조 생성"""
    out: Dict[str, List[Dict[str, Any]]] = {}
    for stage_key, items in CHECKLIST_TEMPLATES.items():
        out[stage_key] = [
            {
                "key": item["key"],
                "label": item["label"],
                "weight": item.get("weight", 1),
                "partner_categories": item.get("partner_categories", []),
                "done": False,
                "completed_at": None,
                "note": None,
            }
            for item in items
        ]
    return out


def calc_readiness_score(checklist: Dict[str, Any] | None) -> int:
    """체크리스트 완료율 (0-100)"""
    if not checklist:
        return 0
    total_weight = 0
    done_weight = 0
    for items in checklist.values():
        for it in items or []:
            w = int(it.get("weight", 1) or 1)
            total_weight += w
            if it.get("done"):
                done_weight += w
    if total_weight == 0:
        return 0
    return int(round(done_weight * 100 / total_weight))


def missing_categories(checklist: Dict[str, Any] | None,
                       opening_stage: str | None) -> List[str]:
    """현재 단계에서 미완료 항목과 연결된 파트너 카테고리 목록 (중복 제거)"""
    if not checklist:
        return []
    cats: List[str] = []
    seen: set[str] = set()

    # 현재 단계 우선
    stages_to_scan = []
    if opening_stage and opening_stage in checklist:
        stages_to_scan.append(opening_stage)
    # 이전 단계 미완료도 보여줌
    if opening_stage in STAGE_ORDER:
        idx = STAGE_ORDER.index(opening_stage)
        for prev in STAGE_ORDER[:idx]:
            if prev in checklist:
                stages_to_scan.append(prev)

    for stage in stages_to_scan:
        for it in checklist.get(stage, []) or []:
            if it.get("done"):
                continue
            for c in it.get("partner_categories", []) or []:
                if c not in seen:
                    seen.add(c)
                    cats.append(c)
    return cats


def calc_lead_score(lead) -> int:
    """매출 가능성 점수 (0-100). 단순 휴리스틱."""
    score = 30
    # 예산
    try:
        if lead.budget_total and int(lead.budget_total) >= 100_000_000:
            score += 15
        elif lead.budget_total and int(lead.budget_total) >= 50_000_000:
            score += 8
    except (TypeError, ValueError):
        pass
    # 단계 (뒤로 갈수록 가능성↑, OPERATING은 매출 적음)
    stage_bonus = {
        "PLANNING": 5, "LOCATION_REVIEW": 10, "CONTRACT": 15,
        "LICENSING": 20, "CONSTRUCTION": 25, "EQUIPMENT": 20,
        "HIRING": 15, "OPENING": 10, "OPERATING": 5,
    }
    if lead.opening_stage:
        score += stage_bonus.get(
            lead.opening_stage.value if hasattr(lead.opening_stage, "value") else str(lead.opening_stage),
            0,
        )
    # 응답 여부
    if lead.last_contacted_at:
        score += 10
    # 자금 필요 여부
    if lead.needs_loan:
        score += 5
    return max(0, min(100, score))
