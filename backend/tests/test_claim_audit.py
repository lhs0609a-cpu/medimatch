"""
청구 누락검출 룰셋 + detector 회귀 테스트.

DB 불필요(순수 로직). 룰이 실제 수가표(fee_schedule)에 연동되는지,
거짓양성을 적절히 억제하는지, 집계가 맞는지 검증한다.
"""
import pytest
from datetime import date

from app.services.claim_audit import scan_claims_for_findings, FeeSchedule
from app.services.claim_audit.rules_internal import (
    rule_missed_revisit_fee,
    rule_missed_basic_treatment_fee,
    rule_low_total_for_dx,
    rule_prescription_fee_without_drugs,
    CODE_REVISIT,
    CODE_BASIC_TREATMENT,
    FALLBACK_REVISIT,
    FALLBACK_BASIC_TREATMENT,
)

pytestmark = pytest.mark.unit


def _claim(**kw):
    base = {
        "id": kw.get("id", 1),
        "patient_chart_no": kw.get("chart", "A-1"),
        "service_date": kw.get("service_date", date(2026, 1, 10)),
        "primary_dx_code": kw.get("dx", "I10"),
        "total_amount": kw.get("total", 15000),
        "items": kw.get("items", []),
    }
    return base


# ── 룰 1: 재진 진찰료 누락 ──────────────────────────────────

def test_revisit_fee_flagged_when_consult_missing():
    ctx = {"previous_claim_within_90d": {"x": 1}, "days_since_previous": 14}
    claim = _claim(items=[{"code": "KK051", "name": "근육주사", "item_type": "INJECTION"}])
    out = rule_missed_revisit_fee(claim, ctx)
    assert out is not None
    assert out["rule"] == "missed_revisit_fee"
    assert out["suggested_code"] == CODE_REVISIT
    assert out["confidence"] == 88  # 30일 이내 → 높은 신뢰도


def test_revisit_fee_not_flagged_when_consult_present():
    ctx = {"previous_claim_within_90d": {"x": 1}, "days_since_previous": 14}
    claim = _claim(items=[{"code": "AA200", "name": "재진", "item_type": "CONSULT"}])
    assert rule_missed_revisit_fee(claim, ctx) is None


def test_revisit_fee_not_flagged_without_previous_visit():
    ctx = {"previous_claim_within_90d": None, "days_since_previous": 999}
    claim = _claim(items=[{"code": "KK051", "name": "주사", "item_type": "INJECTION"}])
    assert rule_missed_revisit_fee(claim, ctx) is None


def test_revisit_fee_uses_real_fee_schedule():
    fs = FeeSchedule(prices={"AA200": 12000})
    ctx = {"previous_claim_within_90d": {"x": 1}, "days_since_previous": 5, "fee_schedule": fs}
    claim = _claim(items=[{"code": "KK051", "name": "주사", "item_type": "INJECTION"}])
    out = rule_missed_revisit_fee(claim, ctx)
    assert out["potential_amount"] == 12000  # 폴백(11540)이 아니라 실수가


def test_revisit_fee_falls_back_without_schedule():
    ctx = {"previous_claim_within_90d": {"x": 1}, "days_since_previous": 5}
    claim = _claim(items=[{"code": "KK051", "name": "주사", "item_type": "INJECTION"}])
    out = rule_missed_revisit_fee(claim, ctx)
    assert out["potential_amount"] == FALLBACK_REVISIT


# ── 룰 2: 기본 처치료 누락 ──────────────────────────────────

def test_basic_treatment_flagged_for_injection_without_fee():
    claim = _claim(items=[{"code": "KK051", "name": "근육주사", "item_type": "INJECTION"}])
    out = rule_missed_basic_treatment_fee(claim, {})
    assert out is not None
    assert out["suggested_code"] == CODE_BASIC_TREATMENT
    assert out["potential_amount"] == FALLBACK_BASIC_TREATMENT


def test_basic_treatment_not_flagged_when_present():
    claim = _claim(items=[
        {"code": "KK051", "name": "주사", "item_type": "INJECTION"},
        {"code": "M0050", "name": "기본처치", "item_type": "PROCEDURE"},
    ])
    assert rule_missed_basic_treatment_fee(claim, {}) is None


def test_basic_treatment_not_flagged_without_procedure():
    claim = _claim(items=[{"code": "AA200", "name": "재진", "item_type": "CONSULT"}])
    assert rule_missed_basic_treatment_fee(claim, {}) is None


# ── 룰 3: 저청구 의심 ───────────────────────────────────────

def test_low_total_flagged_below_floor():
    # I10 명시적 floor=18000, 50%=9000 미만이면 검출
    claim = _claim(dx="I10", total=4000, items=[{"code": "AA200", "item_type": "CONSULT"}])
    out = rule_low_total_for_dx(claim, {})
    assert out is not None
    assert out["rule"] == "low_total_for_dx"
    assert out["potential_amount"] == 18000 - 4000


def test_low_total_not_flagged_above_threshold():
    claim = _claim(dx="I10", total=12000)
    assert rule_low_total_for_dx(claim, {}) is None


def test_low_total_uses_chronic_floor_from_fee_schedule():
    # 명시적 DX_STANDARD_FLOOR 없는 만성 상병(E10) → (재진 + 기본처치) 합을 floor로 사용
    fs = FeeSchedule(prices={"AA200": 11540, "M0050": 1440})
    ctx = {"fee_schedule": fs, "chronic_dx": {"E10"}}
    claim = _claim(dx="E10", total=2000, items=[])
    out = rule_low_total_for_dx(claim, ctx)
    assert out is not None
    assert out["potential_amount"] == (11540 + 1440) - 2000


def test_low_total_ignored_for_unknown_non_chronic_dx():
    claim = _claim(dx="Z00", total=1000)
    assert rule_low_total_for_dx(claim, {}) is None


def test_low_total_ignored_when_total_zero():
    claim = _claim(dx="I10", total=0)
    assert rule_low_total_for_dx(claim, {}) is None


# ── 룰 4: 처방전 발급료 + 약제 누락 ─────────────────────────

def test_rx_fee_without_drugs_flagged():
    claim = _claim(items=[{"code": "AA570", "name": "처방전발급", "item_type": "FEE"}])
    out = rule_prescription_fee_without_drugs(claim, {})
    assert out is not None
    assert out["rule"] == "prescription_fee_without_drugs"


def test_rx_fee_with_drugs_not_flagged():
    claim = _claim(items=[
        {"code": "AA570", "name": "처방전발급", "item_type": "FEE"},
        {"code": "670105100", "name": "타이레놀", "item_type": "MEDICATION"},
    ])
    assert rule_prescription_fee_without_drugs(claim, {}) is None


# ── detector 통합 + 집계 ────────────────────────────────────

def test_scan_aggregates_findings_and_potential():
    claims = [
        # 1차: 정상 재진
        _claim(id=1, chart="A1", service_date=date(2026, 1, 1), dx="I10", total=13000,
               items=[{"code": "AA200", "item_type": "CONSULT"}]),
        # 2차: 진찰료 없음 + 주사만 + 저청구 → 룰1+룰2+룰3
        _claim(id=2, chart="A1", service_date=date(2026, 1, 20), dx="I10", total=2140,
               items=[{"code": "KK051", "name": "근육주사", "item_type": "INJECTION"}]),
    ]
    fs = FeeSchedule(prices={"AA200": 11540, "M0050": 1440})
    summary = scan_claims_for_findings(claims, fee_schedule=fs, chronic_dx={"I10"})

    rules_hit = {f.rule for f in summary.findings}
    assert "missed_revisit_fee" in rules_hit
    assert "missed_basic_treatment_fee" in rules_hit
    assert "low_total_for_dx" in rules_hit
    assert summary.total_claims == 2
    assert summary.total_potential == sum(f.potential_amount for f in summary.findings)
    # 재진 누락(conf 88)은 high-confidence에 포함
    assert summary.high_confidence_count >= 1


def test_scan_min_confidence_filters():
    claims = [
        _claim(id=1, chart="A1", service_date=date(2026, 1, 1),
               items=[{"code": "AA200", "item_type": "CONSULT"}]),
        _claim(id=2, chart="A1", service_date=date(2026, 1, 10), dx="I10", total=2000,
               items=[{"code": "KK051", "item_type": "INJECTION"}]),
    ]
    # min_confidence=80 → 재진누락(88)만 남고 기본처치(65)/저청구(60)는 제외
    summary = scan_claims_for_findings(claims, min_confidence=80)
    assert all(f.confidence >= 80 for f in summary.findings)
    assert "missed_basic_treatment_fee" not in {f.rule for f in summary.findings}


def test_scan_empty_returns_zero_summary():
    summary = scan_claims_for_findings([])
    assert summary.total_claims == 0
    assert summary.findings_count == 0
    assert summary.total_potential == 0
