"""
범용 환자 데이터 임포트 — 어떤 CSV/엑셀이든 자동 매핑 + 정규화.

핵심 원칙:
1. 한국 EMR/CRM 헤더는 표기가 제각각이지만 의미는 한정적이다 → 별칭 사전으로 흡수
2. 헤더로 못 잡는 컬럼은 데이터형(전화번호 패턴, 날짜 패턴, 성별 1글자 등)으로 추론
3. 매핑 안 된 컬럼도 절대 버리지 않고 external_meta(JSONB)에 그대로 보존
4. 사람 확인을 거치지 않은 동의는 NOT_ASKED로 강제 (정통망법/PIPA)
"""
from .parser import parse_file, ParsedFile
from .mapper import auto_map, apply_mapping, MappedRow, MappingPlan
from .normalizers import (
    normalize_phone, normalize_date, normalize_gender,
    normalize_consent, normalize_inbound_status,
)

__all__ = [
    "parse_file", "ParsedFile",
    "auto_map", "apply_mapping", "MappedRow", "MappingPlan",
    "normalize_phone", "normalize_date", "normalize_gender",
    "normalize_consent", "normalize_inbound_status",
]
