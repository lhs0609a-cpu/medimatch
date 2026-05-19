"""
범용 청구 데이터 임포트 — 의사랑/닥터팔레트/굿닥/심평원 EDI export 자동 매핑.

설계 원칙:
1. 한 행 = 한 청구항목 (수기료/약제/처치). 같은 (chart_no, service_date) 행은
   하나의 InsuranceClaim으로 자동 그룹.
2. 헤더 표기 제각각 → 별칭 사전으로 흡수 (claim_aliases.HEADER_ALIASES).
3. 매핑 안 된 컬럼은 InsuranceClaim.edi_result_detail / ClaimItem.issues에 보존.
4. 금액 정규화: 콤마/원/₩ 제거, 음수·문자 행 skip + 리포트.
"""
from .parser import parse_claim_file
from .mapper import auto_map_claims, group_into_claims, ClaimMappingPlan, MappedClaimItem

__all__ = [
    "parse_claim_file",
    "auto_map_claims",
    "group_into_claims",
    "ClaimMappingPlan",
    "MappedClaimItem",
]
