"""
자동 매핑 + 정규화.

전략:
1. 헤더 별칭 사전으로 1차 매핑 (가장 강한 신호)
2. 별칭에 없는 컬럼은 데이터형 fingerprint로 2차 추론
   - 80% 이상 전화번호 패턴 → phone (이미 phone에 매핑된 컬럼이 없을 때)
   - 80% 이상 날짜 패턴 → birth_date 또는 inflow_date (위치/이름으로 결정)
   - 70% 이상 'M/F/남/여' → gender
3. 그래도 못 잡은 컬럼은 external_meta(JSONB)에 보존 — 절대 버리지 않음
4. 사용자가 수동으로 매핑을 override할 수 있음 (manual_mapping 인자)

신뢰도 점수(0~100)를 같이 반환해서 프런트가 미리보기에서 표시.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any, Optional

from .aliases import header_to_field, normalize_header
from .normalizers import (
    normalize_phone, normalize_date, normalize_datetime, normalize_gender,
    normalize_consent, normalize_db_quality, normalize_inbound_status,
    clean_str, looks_like_phone, looks_like_date, looks_like_gender,
)


# 자동 추론으로 채워질 수 있는 필드 (헤더 매핑이 우선)
INFERRABLE = {"phone", "birth_date", "gender"}


@dataclass
class MappingPlan:
    """원본 헤더 → canonical field 매핑 + 미매핑 헤더 목록."""
    mapping: dict[str, str]              # 원본 헤더 → canonical
    confidence: dict[str, int]           # 원본 헤더 → 0~100
    unmapped_headers: list[str]          # external_meta로 갈 헤더
    detected_emr: str = "unknown"        # 추정 출처 (현재는 'unknown' / 'manual_csv')
    notes: list[str] = field(default_factory=list)


@dataclass
class MappedRow:
    """정규화된 한 행. external_meta는 매핑 안 된 원본을 보존."""
    fields: dict[str, Any]               # patients 컬럼 → 값
    external_meta: dict[str, Any]        # 미매핑 원본
    issues: list[str] = field(default_factory=list)   # 행 단위 경고

    def is_valid(self) -> bool:
        """최소 요건: 이름 + (전화 또는 external_id)."""
        if not self.fields.get("name"):
            return False
        if not (self.fields.get("phone") or self.fields.get("external_id")):
            return False
        return True


def _ratio(values: list[Any], pred) -> float:
    non_empty = [v for v in values if v not in (None, "", " ")]
    if not non_empty:
        return 0.0
    hits = sum(1 for v in non_empty if pred(v))
    return hits / len(non_empty)


def auto_map(
    headers: list[str],
    sample_rows: list[dict[str, Any]],
    manual_mapping: Optional[dict[str, str]] = None,
) -> MappingPlan:
    """헤더 + 샘플행 → MappingPlan.

    sample_rows는 데이터형 추론용 — 처음 50~200행이면 충분.
    manual_mapping이 들어오면 자동 추론보다 우선.
    """
    mapping: dict[str, str] = {}
    confidence: dict[str, int] = {}
    notes: list[str] = []
    manual = manual_mapping or {}

    # 1. 헤더 별칭으로 1차 매핑
    for h in headers:
        if h in manual:
            mapping[h] = manual[h]
            confidence[h] = 100
            continue
        f = header_to_field(h)
        if f:
            mapping[h] = f
            confidence[h] = 95

    # 2. 데이터형 추론 — 별칭에 없던 컬럼만, 이미 같은 필드에 매핑된 컬럼이 있으면 skip
    already_mapped_fields = set(mapping.values())
    for h in headers:
        if h in mapping:
            continue
        col_values = [row.get(h) for row in sample_rows[:200]]

        if "phone" not in already_mapped_fields and _ratio(col_values, looks_like_phone) >= 0.8:
            mapping[h] = "phone"
            confidence[h] = 80
            already_mapped_fields.add("phone")
            notes.append(f"'{h}' 컬럼을 데이터형으로 phone으로 추론")
            continue

        if "gender" not in already_mapped_fields and _ratio(col_values, looks_like_gender) >= 0.7:
            mapping[h] = "gender"
            confidence[h] = 75
            already_mapped_fields.add("gender")
            notes.append(f"'{h}' 컬럼을 데이터형으로 gender로 추론")
            continue

        # 날짜는 birth_date / inflow_date 어디로 보낼지 모호 → 헤더 힌트가 있을 때만 매핑
        if _ratio(col_values, looks_like_date) >= 0.8:
            nh = normalize_header(h)
            if "생" in h or "birth" in nh or "dob" in nh:
                if "birth_date" not in already_mapped_fields:
                    mapping[h] = "birth_date"
                    confidence[h] = 80
                    already_mapped_fields.add("birth_date")
                    notes.append(f"'{h}' → birth_date (헤더+데이터형)")
                    continue
            if "유입" in h or "방문" in h or "내원" in h or "등록" in h or "visit" in nh or "regist" in nh:
                if "inflow_date" not in already_mapped_fields:
                    mapping[h] = "inflow_date"
                    confidence[h] = 80
                    already_mapped_fields.add("inflow_date")
                    notes.append(f"'{h}' → inflow_date (헤더+데이터형)")
                    continue

    # 3. 미매핑 헤더 목록 (external_meta로 보존)
    unmapped = [h for h in headers if h not in mapping]
    if unmapped:
        notes.append(f"미매핑 컬럼 {len(unmapped)}개는 external_meta로 보존됩니다.")

    return MappingPlan(
        mapping=mapping,
        confidence=confidence,
        unmapped_headers=unmapped,
        detected_emr="manual_csv",
        notes=notes,
    )


def apply_mapping(
    plan: MappingPlan,
    rows: list[dict[str, Any]],
    *,
    force_consent_alimtalk_not_asked: bool = True,
) -> list[MappedRow]:
    """원본 행 리스트 → 정규화된 MappedRow 리스트.

    force_consent_alimtalk_not_asked=True 면 알림톡 동의는 무조건 NOT_ASKED.
    (정통망법/PIPA — CSV에 '동의'라고 적혀 있어도 사람이 출처 확인 못 했으니 신뢰 불가)
    """
    out: list[MappedRow] = []

    for row in rows:
        fields: dict[str, Any] = {}
        external_meta: dict[str, Any] = {}
        issues: list[str] = []

        # 매핑된 컬럼 → 정규화
        for src_header, canonical in plan.mapping.items():
            raw = row.get(src_header)
            try:
                value = _normalize_for_field(canonical, raw)
            except Exception as e:
                value = None
                issues.append(f"{canonical}: 정규화 실패({e})")

            if value is not None:
                # 같은 canonical에 이미 값이 있으면 길이가 더 긴 쪽 보존
                existing = fields.get(canonical)
                if existing is None:
                    fields[canonical] = value
                else:
                    if isinstance(existing, str) and isinstance(value, str) and len(value) > len(existing):
                        fields[canonical] = value

        # 미매핑 컬럼 → external_meta (값이 있을 때만)
        for src_header in plan.unmapped_headers:
            v = row.get(src_header)
            if v is None or v == "":
                continue
            if isinstance(v, float) and v != v:  # pandas NaN — JSON 직렬화 깨짐 방지
                continue
            external_meta[src_header] = str(v) if not isinstance(v, (int, float, bool)) else v

        # 알림톡 동의 강제 NOT_ASKED
        if force_consent_alimtalk_not_asked:
            fields["consent_alimtalk"] = "NOT_ASKED"

        # 기본값 채움
        fields.setdefault("inbound_status", "PENDING")
        fields.setdefault("consent_examination", "NOT_ASKED")
        fields.setdefault("consent_treatment", "NOT_ASKED")
        fields.setdefault("db_quality", "MEDIUM")

        # 최소 요건 검사
        if not fields.get("name"):
            issues.append("이름 컬럼이 비어있음")
        if not fields.get("phone") and not fields.get("external_id"):
            issues.append("전화번호도, 차트번호도 없음 — 식별 불가")

        out.append(MappedRow(fields=fields, external_meta=external_meta, issues=issues))

    return out


def _normalize_for_field(canonical: str, raw: Any) -> Any:
    """canonical 필드별 정규화 분기."""
    if canonical == "phone":
        return normalize_phone(raw)
    if canonical == "birth_date":
        return normalize_date(raw, allow_future=False)
    if canonical == "inflow_date":
        return normalize_date(raw)
    if canonical == "appointment_date":
        return normalize_datetime(raw)
    if canonical == "gender":
        return normalize_gender(raw)
    if canonical == "inbound_status":
        return normalize_inbound_status(raw)
    if canonical in ("consent_examination", "consent_treatment", "consent_alimtalk"):
        return normalize_consent(raw)
    if canonical == "db_quality":
        return normalize_db_quality(raw)
    if canonical == "seq_no":
        s = clean_str(raw)
        if s is None:
            return None
        try:
            return int(float(s))
        except (ValueError, TypeError):
            return None
    if canonical == "name":
        return clean_str(raw, max_len=100)
    if canonical in ("external_id", "chart_no"):
        return clean_str(raw, max_len=100)
    if canonical == "region":
        return clean_str(raw, max_len=100)
    if canonical in ("inflow_path", "appointment_path"):
        return clean_str(raw, max_len=100)
    if canonical == "manager_name":
        return clean_str(raw, max_len=100)
    if canonical == "diagnosis_name":
        return clean_str(raw, max_len=200)
    # text 필드들
    if canonical in (
        "search_keywords", "symptoms", "consultation_summary",
        "consultation_gap_analysis", "cancellation_reason",
        "staff_assessment", "partial_consent_reason",
        "non_consent_reason", "non_consent_root_cause",
    ):
        return clean_str(raw)
    return clean_str(raw)
