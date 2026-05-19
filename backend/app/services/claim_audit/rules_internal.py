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


# 진찰료 표준 (2026년 기준 — 추후 hira_fee_codes 테이블과 연동 가능)
FEE_AA157 = 8930   # 외래 재진 진찰료 (의원급)
FEE_AA154 = 17040  # 외래 초진 진찰료
FEE_B0030 = 4040   # 기본 처치료 (행위료)
FEE_AA570 = 1900   # 외래 처방전 발급료


# 외과 처치/주사 코드 패턴 → 기본 처치료(B0030) 동반 권장
PROCEDURE_PREFIX_NEEDS_BASIC = ("KK", "MM", "PP", "QQ", "RR")  # 외과·도수·국부 등
INJECTION_CODES = {"KK054", "KK055", "B0040", "B0050"}  # 주사 일부
TEST_PREFIXES_LAB = ("L", "C")  # 검사료 (실제 코드 패턴은 hira 코드와 연동 권장)


# 흔한 만성질환 상병 (정기검사 동반 시 합리적 청구)
CHRONIC_DX = {"I10", "I11", "E10", "E11", "E14", "J45", "K21", "M17", "M19", "F32", "F33"}

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
    if _has_item_code(items, "AA"):
        return None  # 진찰료 있음 — 정상

    prev = ctx.get("previous_claim_within_90d")
    if not prev:
        return None

    days_gap = ctx.get("days_since_previous", 999)
    if days_gap > 90:
        return None

    return {
        "rule": "missed_revisit_fee",
        "severity": "HIGH",
        "title": "재진 진찰료 누락 의심",
        "detail": (
            f"동일 환자가 {days_gap}일 전에도 내원했지만 이번 청구에 진찰료(AA*) 0건입니다. "
            f"외래 재진(AA157) 청구 누락 가능성이 높습니다."
        ),
        "potential_amount": FEE_AA157,
        "confidence": 88 if days_gap <= 30 else 70,
        "suggested_action": f"AA157 (외래 재진 진찰료) 추가 청구 — 약 {FEE_AA157:,}원 회수 가능",
        "suggested_code": "AA157",
    }


# ======================================================================
# 룰 2: 기본 처치료 누락 (행위가 있는데 처치료 없음)
# ======================================================================

def rule_missed_basic_treatment_fee(claim: dict, ctx: dict) -> dict | None:
    """외과 처치/주사 행위가 있는데 기본 처치료(B0030) 없음.

    보수적: 주사·외과처치·도수 등 *명백히 처치료 동반인* 경우만.
    """
    items = claim.get("items", [])
    if _has_item_code(items, "B003"):
        return None  # 기본 처치료 있음

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

    return {
        "rule": "missed_basic_treatment_fee",
        "severity": "MEDIUM",
        "title": "기본 처치료(B0030) 누락 의심",
        "detail": (
            f"청구에 처치/주사 행위({', '.join(procedure_names)})가 있지만 "
            f"기본 처치료 청구가 없습니다. 일부 행위는 기본 처치료가 동반 청구되어야 합니다."
        ),
        "potential_amount": FEE_B0030,
        "confidence": 65,  # 일부 행위는 처치료 동반 아님 — 의사 검토 필요
        "suggested_action": f"B0030 (기본 처치료) 추가 청구 검토 — 약 {FEE_B0030:,}원",
        "suggested_code": "B0030",
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
