"""
청구 누락/저청구 검출 엔진 — "잃어버린 돈" 찾기.

전제: 의원이 기존 EMR에서 청구내역을 임포트했다는 상황.
우리는 임포트된 청구를 *역방향*으로 검사하여 다음을 잡는다:

1. 재진 진찰료 누락 — 30일 이내 동일 상병 재방문인데 AA157 없음
2. 기본 처치료 누락 — 주사/외과처치/검사 행위가 있는데 처치료(B0030) 없음
3. 저청구 의심 — 동일 상병의 표준 청구액 대비 30% 이상 낮은 청구
4. 약제비 누락 — 처방전 발급료는 청구했는데 처방 약품 청구 없음

검출 결과는 InsuranceClaim.audit_findings (JSONB)에 저장:
[{
    "rule": "missed_revisit_fee",
    "severity": "HIGH",
    "title": "재진 진찰료 누락 의심",
    "detail": "...",
    "potential_amount": 7800,
    "confidence": 85,   # 0-100
    "suggested_action": "AA157 추가 청구"
}]

설계 원칙:
- **거짓 양성 최소화** — 확실하지 않으면 안 잡음
- **각 룰은 confidence(0-100)** 를 가짐. 사용자는 80+만 봐도 됨
- **suggested_action**: 원클릭 정정청구로 연결할 텍스트
"""
from .detector import scan_claims_for_findings, AuditFinding, AuditSummary
from .rules_internal import INTERNAL_MEDICINE_RULES
from .fee_schedule import FeeSchedule, load_fee_schedule, load_chronic_dx

__all__ = [
    "scan_claims_for_findings", "AuditFinding", "AuditSummary",
    "INTERNAL_MEDICINE_RULES",
    "FeeSchedule", "load_fee_schedule", "load_chronic_dx",
]
