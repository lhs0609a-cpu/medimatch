"""
임포트된 청구 전체에 대해 룰셋을 돌려 누락 항목을 검출.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from datetime import date
from typing import Any

from .rules_internal import INTERNAL_MEDICINE_RULES


@dataclass
class AuditFinding:
    claim_id: str | None
    rule: str
    severity: str            # HIGH | MEDIUM | LOW
    title: str
    detail: str
    potential_amount: int
    confidence: int          # 0-100
    suggested_action: str
    suggested_code: str | None = None
    patient_chart_no: str | None = None
    service_date: str | None = None

    def to_dict(self) -> dict:
        return {
            "claim_id": self.claim_id,
            "rule": self.rule,
            "severity": self.severity,
            "title": self.title,
            "detail": self.detail,
            "potential_amount": self.potential_amount,
            "confidence": self.confidence,
            "suggested_action": self.suggested_action,
            "suggested_code": self.suggested_code,
            "patient_chart_no": self.patient_chart_no,
            "service_date": self.service_date,
        }


@dataclass
class AuditSummary:
    total_claims: int
    scanned: int
    findings_count: int
    high_confidence_count: int           # confidence >= 80
    total_potential: int
    high_confidence_potential: int       # 80+ confidence 항목 합계
    by_rule: dict[str, dict]             # rule_code → {count, potential}
    findings: list[AuditFinding]

    def to_dict(self) -> dict:
        return {
            "total_claims": self.total_claims,
            "scanned": self.scanned,
            "findings_count": self.findings_count,
            "high_confidence_count": self.high_confidence_count,
            "total_potential": self.total_potential,
            "high_confidence_potential": self.high_confidence_potential,
            "by_rule": self.by_rule,
            "findings": [f.to_dict() for f in self.findings],
        }


def _build_patient_history(claims: list[dict]) -> dict[str, list[dict]]:
    """차트번호별 진료일 오름차순 청구 리스트."""
    hist: dict[str, list[dict]] = {}
    for c in claims:
        chart = c.get("patient_chart_no") or ""
        if not chart:
            continue
        hist.setdefault(chart, []).append(c)
    for chart in hist:
        hist[chart].sort(key=lambda x: x.get("service_date") or date.min)
    return hist


def _previous_in_window(claims: list[dict], current: dict, window_days: int = 90) -> dict | None:
    """동일 환자 직전 청구 (window 이내)."""
    cur_date = current.get("service_date")
    if not isinstance(cur_date, date):
        return None
    prev_in_window = None
    for c in claims:
        d = c.get("service_date")
        if not isinstance(d, date):
            continue
        if d >= cur_date:
            continue
        if (cur_date - d).days > window_days:
            continue
        if prev_in_window is None or d > prev_in_window["service_date"]:
            prev_in_window = c
    return prev_in_window


def scan_claims_for_findings(
    claims: list[dict],
    rules: list = INTERNAL_MEDICINE_RULES,
    *,
    min_confidence: int = 0,
    fee_schedule: Any = None,
    chronic_dx: set[str] | None = None,
) -> AuditSummary:
    """청구 리스트 → AuditSummary.

    각 청구 dict는 최소 다음 키를 포함:
    - id (있으면 그대로, 없으면 None)
    - patient_chart_no, service_date (date), primary_dx_code
    - total_amount, items (list of {code, name, item_type, total_price})

    fee_schedule: FeeSchedule(또는 {code: 단가} dict). 룰이 실제 수가를 조회.
                  None이면 룰 내장 폴백 상수 사용.
    chronic_dx:   만성질환 상병코드 집합(hira_disease_codes 기반). None이면 룰 내장 집합.
    """
    history = _build_patient_history(claims)
    findings: list[AuditFinding] = []
    by_rule: dict[str, dict] = {}

    for claim in claims:
        chart = claim.get("patient_chart_no") or ""
        prev = _previous_in_window(history.get(chart, []), claim) if chart else None
        cur_d = claim.get("service_date")
        days_gap = (cur_d - prev["service_date"]).days if (prev and isinstance(cur_d, date)) else None

        ctx = {
            "previous_claim_within_90d": prev,
            "days_since_previous": days_gap if days_gap is not None else 999,
            "patient_history": history.get(chart, []),
            "fee_schedule": fee_schedule,
            "chronic_dx": chronic_dx,
        }

        for rule_fn in rules:
            try:
                result = rule_fn(claim, ctx)
            except Exception:
                continue
            if not result:
                continue
            if result.get("confidence", 0) < min_confidence:
                continue
            f = AuditFinding(
                claim_id=str(claim.get("id")) if claim.get("id") else None,
                rule=result["rule"],
                severity=result["severity"],
                title=result["title"],
                detail=result["detail"],
                potential_amount=int(result.get("potential_amount", 0)),
                confidence=int(result.get("confidence", 0)),
                suggested_action=result["suggested_action"],
                suggested_code=result.get("suggested_code"),
                patient_chart_no=chart or None,
                service_date=cur_d.isoformat() if isinstance(cur_d, date) else None,
            )
            findings.append(f)
            agg = by_rule.setdefault(result["rule"], {
                "count": 0, "potential": 0, "title": result["title"],
            })
            agg["count"] += 1
            agg["potential"] += int(result.get("potential_amount", 0))

    return AuditSummary(
        total_claims=len(claims),
        scanned=len(claims),
        findings_count=len(findings),
        high_confidence_count=sum(1 for f in findings if f.confidence >= 80),
        total_potential=sum(f.potential_amount for f in findings),
        high_confidence_potential=sum(f.potential_amount for f in findings if f.confidence >= 80),
        by_rule=by_rule,
        findings=findings,
    )
