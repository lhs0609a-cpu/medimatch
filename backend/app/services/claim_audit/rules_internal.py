"""
내과 청구 누락 룰셋 — 보수적으로 (확실한 것만).

각 룰은:
- code: 룰 식별자
- title: 화면 표시명
- check(claim, context) -> dict|None: 검출 시 finding dict 반환, 아니면 None
- standard_fee: 누락 시 회수 가능 금액 (원)
"""
from datetime import timedelta
from typing import Any


# ----------------------------------------------------------------------
# 수가 코드 + 폴백 단가
#
# 실제 단가는 ctx["fee_schedule"](hira_fee_codes 테이블 로드분)에서 우선 조회하고,
# 테이블에 없으면 아래 폴백 상수를 쓴다. 폴백 값은 시드된 hira_fee_codes(026) 및
# HIRA 2024 의원급 기준에 맞춰 둔다.
# ----------------------------------------------------------------------
CODE_REVISIT = "AA200"        # 재진 진찰료 (의원) — 시드 11,540
CODE_INITIAL = "AA100"        # 초진 진찰료 (의원) — 시드 17,700
CODE_BASIC_TREATMENT = "M0050"  # 기본 처치 — 시드 1,440
CODE_RX_FEE = "AA570"         # 외래 처방전 발급료 (시드 미포함 → 폴백)

FALLBACK_REVISIT = 11_540
FALLBACK_INITIAL = 17_700
FALLBACK_BASIC_TREATMENT = 1_440
FALLBACK_RX_FEE = 1_900

# 진찰료 prefix (AA1xx 초진 / AA2xx 재진 / AA3xx 가산) — 어느 것이든 있으면 진찰료 청구됨
CONSULT_FEE_PREFIX = "AA"
# 이미 기본 처치료가 청구된 것으로 볼 코드 prefix (시드 M0050 + 관행상 B003 계열)
BASIC_TREATMENT_PRESENT_PREFIXES = ("M005", "B003")


def _fee(ctx: dict, code: str, fallback: int) -> int:
    """ctx에 주입된 fee_schedule에서 실단가 조회, 없으면 폴백."""
    fs = ctx.get("fee_schedule")
    if fs is None:
        return fallback
    try:
        return fs.price(code, fallback)
    except AttributeError:
        # fee_schedule 이 평범한 dict 로 주입된 경우도 허용
        return int(fs.get(code, fallback)) if isinstance(fs, dict) else fallback


# 외과 처치/주사 코드 패턴 → 기본 처치료 동반 권장
PROCEDURE_PREFIX_NEEDS_BASIC = ("KK", "MM", "PP", "QQ", "RR")  # 외과·도수·국부 등
INJECTION_CODES = {"KK054", "KK055", "B0040", "B0050"}  # 주사 일부
TEST_PREFIXES_LAB = ("L", "C")  # 검사료 (실제 코드 패턴은 hira 코드와 연동 권장)


# 흔한 만성질환 상병 (정기검사 동반 시 합리적 청구).
# ctx["chronic_dx"]가 주입되면 그쪽(hira_disease_codes)을 우선 사용.
CHRONIC_DX = {"I10", "I11", "E10", "E11", "E14", "J45", "K21", "M17", "M19", "F32", "F33"}


def _chronic_set(ctx: dict) -> set[str]:
    return ctx.get("chronic_dx") or CHRONIC_DX

# 상병별 표준 진찰+처치+검사 평균 청구액 (외래 1회)
# 이건 보수적인 *최저 합리선*. 실제 의원이 이보다 한참 낮으면 저청구 의심.
DX_STANDARD_FLOOR = {
    "I10":  18000,  # 고혈압 — 재진 진찰 + 기본 처치 정도
    "E11":  22000,  # 당뇨 — 진찰 + 기본 검사
    "J06.9": 13000, # 급성상기도감염 — 진찰 + 처치
    "J45":  18000,  # 천식 — 진찰 + 처치
    "K29":  14000,  # 위염 — 진찰 + 약처방
    "M54":  16000,  # 요통 — 진찰 + 처치
    "F32":  15000,  # 우울 — 진찰
}


def _has_item_code(claim_items: list[dict], code_or_prefix: str) -> bool:
    for it in claim_items:
        c = (it.get("code") or "").upper()
        if c == code_or_prefix or c.startswith(code_or_prefix):
            return True
    return False


def _has_any_item_prefix(claim_items: list[dict], prefixes: tuple[str, ...]) -> bool:
    for it in claim_items:
        c = (it.get("code") or "").upper()
        if any(c.startswith(p) for p in prefixes):
            return True
    return False


# ======================================================================
# 룰 1: 재진 진찰료 누락
# ======================================================================

def rule_missed_revisit_fee(claim: dict, ctx: dict) -> dict | None:
    """30일 이내 동일 환자 재방문인데 진찰료 청구가 0건이면 누락 의심.

    조건:
    - 동일 chart_no, service_date 90일 이내 직전 청구 존재
    - 현재 청구에 진찰료(AA*) 0건
    - 직전 청구에는 진찰료 있었거나 만성질환 상병
    """
    items = claim.get("items", [])
    if _has_item_code(items, CONSULT_FEE_PREFIX):
        return None  # 진찰료(AA*) 있음 — 정상

    prev = ctx.get("previous_claim_within_90d")
    if not prev:
        return None

    days_gap = ctx.get("days_since_previous", 999)
    if days_gap > 90:
        return None

    amount = _fee(ctx, CODE_REVISIT, FALLBACK_REVISIT)
    return {
        "rule": "missed_revisit_fee",
        "severity": "HIGH",
        "title": "재진 진찰료 누락 의심",
        "detail": (
            f"동일 환자가 {days_gap}일 전에도 내원했지만 이번 청구에 진찰료(AA*) 0건입니다. "
            f"외래 재진({CODE_REVISIT}) 청구 누락 가능성이 높습니다."
        ),
        "potential_amount": amount,
        "confidence": 88 if days_gap <= 30 else 70,
        "suggested_action": f"{CODE_REVISIT} (외래 재진 진찰료) 추가 청구 — 약 {amount:,}원 회수 가능",
        "suggested_code": CODE_REVISIT,
    }


# ======================================================================
# 룰 2: 기본 처치료 누락 (행위가 있는데 처치료 없음)
# ======================================================================

def rule_missed_basic_treatment_fee(claim: dict, ctx: dict) -> dict | None:
    """외과 처치/주사 행위가 있는데 기본 처치료(B0030) 없음.

    보수적: 주사·외과처치·도수 등 *명백히 처치료 동반인* 경우만.
    """
    items = claim.get("items", [])
    if _has_any_item_prefix(items, BASIC_TREATMENT_PRESENT_PREFIXES):
        return None  # 기본 처치료 이미 청구됨

    has_procedure = (
        _has_any_item_prefix(items, PROCEDURE_PREFIX_NEEDS_BASIC)
        or any((it.get("code") or "").upper() in INJECTION_CODES for it in items)
    )
    if not has_procedure:
        return None

    procedure_names = [
        f"{it.get('code')} {it.get('name', '')[:20]}"
        for it in items
        if (it.get("code") or "").upper().startswith(PROCEDURE_PREFIX_NEEDS_BASIC)
        or (it.get("code") or "").upper() in INJECTION_CODES
    ][:3]

    amount = _fee(ctx, CODE_BASIC_TREATMENT, FALLBACK_BASIC_TREATMENT)
    return {
        "rule": "missed_basic_treatment_fee",
        "severity": "MEDIUM",
        "title": "기본 처치료 누락 의심",
        "detail": (
            f"청구에 처치/주사 행위({', '.join(procedure_names)})가 있지만 "
            f"기본 처치료 청구가 없습니다. 일부 행위는 기본 처치료가 동반 청구되어야 합니다."
        ),
        "potential_amount": amount,
        "confidence": 65,  # 일부 행위는 처치료 동반 아님 — 의사 검토 필요
        "suggested_action": f"{CODE_BASIC_TREATMENT} (기본 처치료) 추가 청구 검토 — 약 {amount:,}원",
        "suggested_code": CODE_BASIC_TREATMENT,
    }


# ======================================================================
# 룰 3: 저청구 의심 (표준 최저선 대비 낮음)
# ======================================================================

def rule_low_total_for_dx(claim: dict, ctx: dict) -> dict | None:
    """주상병 표준 최저 청구액 대비 50% 미만이면 저청구 의심."""
    dx = (claim.get("primary_dx_code") or "").upper()
    floor = DX_STANDARD_FLOOR.get(dx)
    if not floor:
        # KCD 점이 있는 형태도 시도 (J06.9 → J06)
        floor = DX_STANDARD_FLOOR.get(dx.split(".")[0])
    if not floor:
        # 명시적 floor가 없어도 만성질환이면 (재진 진찰료 + 기본 처치료)를
        # 합리적 최저선으로 사용 — 실수가 기반.
        dx_base = dx.split(".")[0]
        if dx in _chronic_set(ctx) or dx_base in _chronic_set(ctx):
            floor = (
                _fee(ctx, CODE_REVISIT, FALLBACK_REVISIT)
                + _fee(ctx, CODE_BASIC_TREATMENT, FALLBACK_BASIC_TREATMENT)
            )
    if not floor:
        return None

    total = claim.get("total_amount", 0) or 0
    if total >= floor * 0.5:
        return None
    if total == 0:
        return None  # 데이터 누락 — 다른 룰이 잡음

    gap = floor - total
    return {
        "rule": "low_total_for_dx",
        "severity": "MEDIUM",
        "title": "동일 상병 표준 대비 저청구 의심",
        "detail": (
            f"주상병 {dx} 청구액이 {total:,}원으로, 표준 최저선({floor:,}원)의 "
            f"{int(total / floor * 100)}% 수준입니다. 처치/검사 누락 여부 확인 권장."
        ),
        "potential_amount": gap,
        "confidence": 60,  # 환자 상태에 따라 정상일 수도 — 의사 검토 필요
        "suggested_action": f"청구 항목 재검토 — 최대 {gap:,}원 회수 가능",
        "suggested_code": None,
    }


# ======================================================================
# 룰 4: 처방전 발급료 있는데 약제 누락
# ======================================================================

def rule_prescription_fee_without_drugs(claim: dict, ctx: dict) -> dict | None:
    items = claim.get("items", [])
    has_rx_fee = _has_item_code(items, "AA570") or _has_item_code(items, "AA571")
    if not has_rx_fee:
        return None
    has_drug = any(
        (it.get("item_type") or "").upper() in ("MEDICATION", "INJECTION")
        for it in items
    )
    if has_drug:
        return None
    return {
        "rule": "prescription_fee_without_drugs",
        "severity": "LOW",
        "title": "처방전 발급료만 청구 (약제 없음)",
        "detail": (
            "처방전 발급료(AA570)는 청구되었으나 처방 약제가 청구 내역에 없습니다. "
            "원외 처방이면 정상이지만 원내 투약이면 약제 청구 누락 가능."
        ),
        "potential_amount": 0,
        "confidence": 50,
        "suggested_action": "원내 투약 여부 확인 후 약제 청구",
        "suggested_code": None,
    }


INTERNAL_MEDICINE_RULES = [
    rule_missed_revisit_fee,
    rule_missed_basic_treatment_fee,
    rule_low_total_for_dx,
    rule_prescription_fee_without_drugs,
]
