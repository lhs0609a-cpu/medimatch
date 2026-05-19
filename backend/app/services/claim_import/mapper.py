"""
청구 행 자동 매핑 + (chart_no, service_date) 단위로 그룹핑 → InsuranceClaim 후보.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from datetime import date
from typing import Any, Optional

from .aliases import header_to_field, normalize_header, normalize_item_type
from .normalizers import (
    normalize_amount, normalize_quantity, normalize_code,
    normalize_date, normalize_gender, clean_str,
    looks_like_amount, looks_like_code,
)


@dataclass
class ClaimMappingPlan:
    mapping: dict[str, str]
    confidence: dict[str, int]
    unmapped_headers: list[str]
    notes: list[str] = field(default_factory=list)


@dataclass
class MappedClaimItem:
    """원시 행 1개 → 정규화된 항목."""
    fields: dict[str, Any]           # canonical 필드
    extra: dict[str, Any]            # 미매핑 보존
    issues: list[str] = field(default_factory=list)

    def is_valid(self) -> bool:
        """최소 요건: 환자 식별(chart_no or name) + 진료일 + 항목코드."""
        if not (self.fields.get("patient_chart_no") or self.fields.get("patient_name")):
            return False
        if not self.fields.get("service_date"):
            return False
        if not self.fields.get("item_code"):
            return False
        return True


@dataclass
class GroupedClaim:
    """같은 환자·진료일 행을 묶은 청구 1건."""
    patient_chart_no: Optional[str]
    patient_name: Optional[str]
    patient_age: Optional[int]
    patient_gender: Optional[str]
    service_date: date
    claim_date: Optional[date]
    primary_dx_code: Optional[str]
    secondary_dx_codes: list[str]
    items: list[MappedClaimItem]
    total_amount: int
    insurance_amount: int
    copay_amount: int
    rejected_amount: int
    external_id: Optional[str] = None   # claim_number from source
    extra: dict[str, Any] = field(default_factory=dict)


def _ratio(values: list[Any], pred) -> float:
    non_empty = [v for v in values if v not in (None, "", " ")]
    if not non_empty:
        return 0.0
    hits = sum(1 for v in non_empty if pred(v))
    return hits / len(non_empty)


def auto_map_claims(
    headers: list[str],
    sample_rows: list[dict[str, Any]],
    manual_mapping: Optional[dict[str, str]] = None,
) -> ClaimMappingPlan:
    mapping: dict[str, str] = {}
    confidence: dict[str, int] = {}
    notes: list[str] = []
    manual = manual_mapping or {}

    # 1차: 헤더 별칭
    for h in headers:
        if h in manual:
            mapping[h] = manual[h]
            confidence[h] = 100
            continue
        f = header_to_field(h)
        if f:
            mapping[h] = f
            confidence[h] = 95

    # 2차: 데이터형 추론 (코드/금액)
    mapped_fields = set(mapping.values())
    for h in headers:
        if h in mapping:
            continue
        col_values = [row.get(h) for row in sample_rows[:200]]

        # 수가코드 패턴: 영문+숫자
        if "item_code" not in mapped_fields and _ratio(col_values, looks_like_code) >= 0.7:
            mapping[h] = "item_code"
            confidence[h] = 75
            mapped_fields.add("item_code")
            notes.append(f"'{h}' → item_code (코드 패턴 추론)")
            continue

        # 금액 추론 — 모든 숫자가 0 이상 + 1000 이상이 50% 넘으면 금액
        if "total_price" not in mapped_fields:
            amts = [normalize_amount(v) for v in col_values]
            amts = [a for a in amts if a is not None]
            if len(amts) >= 3 and sum(1 for a in amts if a >= 1000) / len(amts) >= 0.5:
                mapping[h] = "total_price"
                confidence[h] = 65
                mapped_fields.add("total_price")
                notes.append(f"'{h}' → total_price (금액 패턴 추론)")
                continue

    unmapped = [h for h in headers if h not in mapping]
    if unmapped:
        notes.append(f"미매핑 컬럼 {len(unmapped)}개는 항목 extra에 보존됩니다.")

    return ClaimMappingPlan(
        mapping=mapping, confidence=confidence,
        unmapped_headers=unmapped, notes=notes,
    )


def _apply_field(canonical: str, raw: Any) -> Any:
    if canonical in ("claim_date", "service_date"):
        return normalize_date(raw)
    if canonical in ("item_code", "dx_code"):
        return normalize_code(raw)
    if canonical == "secondary_dx_codes":
        s = clean_str(raw)
        if not s:
            return []
        # 콤마/세미콜론/공백 구분
        import re as _re
        return [normalize_code(c) for c in _re.split(r"[,;\s]+", s) if normalize_code(c)]
    if canonical in ("total_price", "unit_price", "insurance_amount",
                     "copay_amount", "approved_amount", "rejected_amount"):
        return normalize_amount(raw)
    if canonical == "quantity":
        return normalize_quantity(raw)
    if canonical == "patient_age":
        n = normalize_amount(raw)
        return n if (n is not None and 0 < n < 150) else None
    if canonical == "patient_gender":
        return normalize_gender(raw)
    if canonical == "item_type":
        return normalize_item_type(clean_str(raw)) or None
    if canonical in ("patient_chart_no", "claim_number", "ykiho", "specialty_code"):
        return clean_str(raw, max_len=50)
    if canonical == "patient_name":
        return clean_str(raw, max_len=100)
    if canonical in ("dx_name", "item_name", "rejection_reason"):
        return clean_str(raw, max_len=200)
    return clean_str(raw)


def apply_mapping_claims(plan: ClaimMappingPlan, rows: list[dict[str, Any]]) -> list[MappedClaimItem]:
    out: list[MappedClaimItem] = []
    for row in rows:
        fields: dict[str, Any] = {}
        extra: dict[str, Any] = {}
        issues: list[str] = []

        for src, canonical in plan.mapping.items():
            raw = row.get(src)
            try:
                v = _apply_field(canonical, raw)
            except Exception as e:
                issues.append(f"{canonical}: 정규화 실패({e})")
                v = None
            if v is not None and v != [] and (canonical not in fields or fields[canonical] is None):
                fields[canonical] = v

        for src in plan.unmapped_headers:
            v = row.get(src)
            if v is None or v == "":
                continue
            if isinstance(v, float) and v != v:
                continue
            extra[src] = str(v) if not isinstance(v, (int, float, bool)) else v

        # 기본값
        if "item_type" not in fields:
            # 코드 prefix로 추정 (간이)
            code = fields.get("item_code") or ""
            if code.startswith(("J", "K", "L", "M", "N", "F", "G", "H")) and "." in code:
                pass  # 상병코드 — skip
            elif code.startswith(("AA", "B0", "BB", "C")):
                fields["item_type"] = "TREATMENT"

        out.append(MappedClaimItem(fields=fields, extra=extra, issues=issues))
    return out


def group_into_claims(items: list[MappedClaimItem]) -> tuple[list[GroupedClaim], dict]:
    """같은 (chart_no, service_date) 행을 묶어 InsuranceClaim 후보 리스트로.

    Returns: (grouped_claims, stats).
    stats: 그룹 수, 항목 수, skip 항목 수.
    """
    groups: dict[tuple, GroupedClaim] = {}
    skipped_invalid = 0
    for item in items:
        if not item.is_valid():
            skipped_invalid += 1
            continue
        chart = item.fields.get("patient_chart_no") or ""
        sdate = item.fields.get("service_date")
        key = (chart, sdate)

        if key not in groups:
            groups[key] = GroupedClaim(
                patient_chart_no=chart or None,
                patient_name=item.fields.get("patient_name"),
                patient_age=item.fields.get("patient_age"),
                patient_gender=item.fields.get("patient_gender"),
                service_date=sdate,
                claim_date=item.fields.get("claim_date") or sdate,
                primary_dx_code=item.fields.get("dx_code"),
                secondary_dx_codes=item.fields.get("secondary_dx_codes") or [],
                items=[],
                total_amount=0,
                insurance_amount=0,
                copay_amount=0,
                rejected_amount=0,
                external_id=item.fields.get("claim_number"),
                extra={},
            )

        g = groups[key]
        g.items.append(item)
        # 금액 누적
        tp = item.fields.get("total_price")
        if isinstance(tp, int):
            g.total_amount += tp
        ip = item.fields.get("insurance_amount")
        if isinstance(ip, int):
            g.insurance_amount += ip
        cp = item.fields.get("copay_amount")
        if isinstance(cp, int):
            g.copay_amount += cp
        rj = item.fields.get("rejected_amount")
        if isinstance(rj, int):
            g.rejected_amount += rj
        # 환자명/age/gender 보완 (처음 비어있던 그룹에 채움)
        if not g.patient_name and item.fields.get("patient_name"):
            g.patient_name = item.fields["patient_name"]
        if not g.patient_age and item.fields.get("patient_age"):
            g.patient_age = item.fields["patient_age"]
        if not g.patient_gender and item.fields.get("patient_gender"):
            g.patient_gender = item.fields["patient_gender"]
        if not g.primary_dx_code and item.fields.get("dx_code"):
            g.primary_dx_code = item.fields["dx_code"]
        # extra 머지
        for k, v in item.extra.items():
            g.extra.setdefault(k, v)

    return list(groups.values()), {
        "groups": len(groups),
        "items": sum(len(g.items) for g in groups.values()),
        "skipped_invalid": skipped_invalid,
    }
