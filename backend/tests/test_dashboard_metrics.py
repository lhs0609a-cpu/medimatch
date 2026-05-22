"""
EMR 대시보드 실데이터 집계 회귀 테스트.

build_live_metrics / _aggregate_summary 순수 로직 검증 (DB 불필요).
"""
import pytest
from datetime import date

from app.api.v1.emr_dashboard import build_live_metrics, _aggregate_summary

pytestmark = pytest.mark.unit


def test_build_live_metrics_empty():
    assert build_live_metrics([], []) == []


def test_revenue_split_invariant():
    # 총매출 = 급여 + 비급여 (항상 성립)
    bills = [
        (date(2026, 5, 1), 60000, 30000, 20000),
        (date(2026, 5, 1), 10000, 10000, 0),
    ]
    m = build_live_metrics(bills, [])
    assert len(m) == 1
    row = m[0]
    assert row["revenue_total"] == 70000
    assert row["revenue_non_insurance"] == 20000
    assert row["revenue_insurance"] == 50000
    assert row["revenue_insurance"] + row["revenue_non_insurance"] == row["revenue_total"]


def test_non_covered_clamped_to_total():
    # 비급여가 총액보다 크게 들어와도 음수 급여가 나오지 않음
    bills = [(date(2026, 5, 1), 5000, 0, 9999)]
    row = build_live_metrics(bills, [])[0]
    assert row["revenue_non_insurance"] <= row["revenue_total"]
    assert row["revenue_insurance"] >= 0


def test_patient_new_vs_returning():
    visits = [
        (date(2026, 5, 1), "p1", "INITIAL"),
        (date(2026, 5, 1), "p2", "FOLLOWUP"),
        (date(2026, 5, 1), "p1", "FOLLOWUP"),  # 같은 환자 중복 → distinct 1
    ]
    row = build_live_metrics([], visits)[0]
    assert row["patient_count_total"] == 2   # p1, p2
    assert row["patient_count_new"] == 1     # p1 초진
    assert row["patient_count_returning"] == 1


def test_anonymous_visit_without_patient_id_counted():
    visits = [
        (date(2026, 5, 1), None, "INITIAL"),
        (date(2026, 5, 1), None, "FOLLOWUP"),
    ]
    row = build_live_metrics([], visits)[0]
    assert row["patient_count_total"] == 2
    assert row["patient_count_new"] == 1


def test_metrics_sorted_by_date_and_not_demo():
    bills = [
        (date(2026, 5, 3), 1000, 0, 0),
        (date(2026, 5, 1), 1000, 0, 0),
    ]
    m = build_live_metrics(bills, [])
    dates = [r["metric_date"] for r in m]
    assert dates == sorted(dates)
    assert all(r["is_demo"] is False for r in m)
    assert all(r["regional_avg_revenue"] is None for r in m)


def test_none_dates_skipped():
    bills = [(None, 1000, 0, 0), (date(2026, 5, 1), 2000, 0, 0)]
    m = build_live_metrics(bills, [])
    assert len(m) == 1
    assert m[0]["revenue_total"] == 2000


def test_aggregate_summary_handles_null_regional():
    # 실데이터엔 지역 백분위가 없음 → None 이어도 예외 없이 집계
    today = date.today()
    bills = [(today, 50000, 30000, 20000)]
    visits = [(today, "p1", "INITIAL")]
    metrics = build_live_metrics(bills, visits)
    summary = _aggregate_summary(metrics)
    assert summary["regional_percentile"] is None
    assert summary["total_revenue"] == 50000
    assert summary["total_patients"] == 1
    assert summary["non_insurance_ratio"] == 40.0
