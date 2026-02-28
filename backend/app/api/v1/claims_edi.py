"""
HIRA EDI 연동 엔드포인트

- 심평원 EDI 청구 제출 (시뮬레이션)
- 배치 전송 상태 조회
- 심사 결과 폴링
- EDI 포맷 유효성 검사
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid
import random
import logging

from ..deps import get_db, get_current_active_user
from .service_guards import require_active_service
from ...models.user import User
from ...models.service_subscription import ServiceSubscription, ServiceType
from ...models.insurance_claim import (
    InsuranceClaim, ClaimItem, ClaimBatch,
    ClaimStatus, RiskLevel, ClaimItemType,
)
from ...models.edi_log import (
    EDIMessageLog, EDIDirection, EDIMessageType,
)

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================================
# Pydantic schemas
# ============================================================

class EDISubmitRequest(BaseModel):
    claim_ids: list[str]
    ykiho: Optional[str] = None  # 요양기관번호


class EDIValidateRequest(BaseModel):
    claim_ids: list[str]


# ============================================================
# Demo data
# ============================================================

def _demo_batch_status(batch_id: int) -> dict:
    return {
        "batch_id": batch_id,
        "batch_number": "BAT-20260228-143200",
        "status": "TRANSMITTED",
        "total_claims": 3,
        "total_amount": 136900,
        "submitted_at": datetime.utcnow().isoformat(),
        "claim_statuses": [
            {"claim_id": "demo-001", "claim_number": "CLM-2026-0001", "status": "EDI_RECEIVED", "edi_receipt_number": "EDI-R-20260228-001"},
            {"claim_id": "demo-002", "claim_number": "CLM-2026-0002", "status": "EDI_RECEIVED", "edi_receipt_number": "EDI-R-20260228-002"},
            {"claim_id": "demo-003", "claim_number": "CLM-2026-0003", "status": "SUBMITTED", "edi_receipt_number": None},
        ],
        "edi_messages": [
            {"message_id": "EDI-MSG-001", "direction": "OUTBOUND", "type": "CLAIM_SUBMIT", "success": True, "created_at": datetime.utcnow().isoformat()},
            {"message_id": "EDI-MSG-002", "direction": "INBOUND", "type": "CLAIM_RECEIPT", "success": True, "created_at": datetime.utcnow().isoformat()},
        ],
        "is_demo": True,
    }


def _generate_edi_message_id() -> str:
    now = datetime.utcnow()
    rand = random.randint(10000, 99999)
    return f"EDI-{now.strftime('%Y%m%d%H%M%S')}-{rand}"


# ============================================================
# Helpers
# ============================================================

def _generate_simulated_xml(claims: list[InsuranceClaim], ykiho: str) -> str:
    """EDI XML 시뮬레이션 (실제 심평원 연동 시 교체)"""
    claim_count = len(claims)
    total_amount = sum(c.total_amount for c in claims)
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<HIRA_EDI version="1.0">
  <Header>
    <MessageType>CLAIM_SUBMIT</MessageType>
    <SendDate>{datetime.utcnow().strftime('%Y%m%d')}</SendDate>
    <SendTime>{datetime.utcnow().strftime('%H%M%S')}</SendTime>
    <Ykiho>{ykiho}</Ykiho>
    <ClaimCount>{claim_count}</ClaimCount>
    <TotalAmount>{total_amount}</TotalAmount>
  </Header>
  <Body>
    <!-- {claim_count} claims simulated -->
  </Body>
</HIRA_EDI>"""
    return xml


# ============================================================
# Endpoints
# ============================================================

@router.post("/edi/submit")
async def edi_submit(
    payload: EDISubmitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """심평원 EDI 청구 제출 (시뮬레이션)"""
    if not payload.claim_ids:
        raise HTTPException(status_code=400, detail="전송할 청구를 선택해주세요")

    ykiho = payload.ykiho or "99999999"

    # 청구 조회 및 유효성 확인
    valid_claims = []
    for cid in payload.claim_ids:
        result = await db.execute(
            select(InsuranceClaim).where(
                and_(
                    InsuranceClaim.id == cid,
                    InsuranceClaim.user_id == current_user.id,
                    InsuranceClaim.status.in_([ClaimStatus.DRAFT, ClaimStatus.READY]),
                )
            )
        )
        claim = result.scalar_one_or_none()
        if claim:
            valid_claims.append(claim)

    if not valid_claims:
        raise HTTPException(status_code=400, detail="전송 가능한 청구가 없습니다 (DRAFT 또는 READY 상태만 가능)")

    # 배치 생성
    batch = ClaimBatch(
        user_id=current_user.id,
        batch_number=f"BAT-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}",
        submission_date=datetime.utcnow(),
        total_claims=len(valid_claims),
        total_amount=sum(c.total_amount for c in valid_claims),
        status="TRANSMITTED",
    )
    db.add(batch)
    await db.flush()

    # EDI XML 생성
    xml_content = _generate_simulated_xml(valid_claims, ykiho)

    # EDI 송신 로그
    edi_msg_id = _generate_edi_message_id()
    edi_log = EDIMessageLog(
        user_id=current_user.id,
        batch_id=batch.id,
        direction=EDIDirection.OUTBOUND,
        message_type=EDIMessageType.CLAIM_SUBMIT,
        message_id=edi_msg_id,
        xml_message=xml_content,
        message_size_bytes=len(xml_content.encode("utf-8")),
        ykiho=ykiho,
        http_method="POST",
        http_url="https://edi.hira.or.kr/api/claims/submit",
        http_status=200,
        http_response_time_ms=random.randint(200, 1500),
        success=True,
        claim_ids=",".join(str(c.id) for c in valid_claims),
    )
    db.add(edi_log)

    # 청구 상태 업데이트
    claim_statuses = []
    for claim in valid_claims:
        claim.status = ClaimStatus.SUBMITTED
        claim.submitted_at = datetime.utcnow()
        claim.batch_id = batch.id
        claim.edi_message_id = edi_msg_id
        claim.edi_submitted_at = datetime.utcnow()
        claim.ykiho = ykiho
        claim_statuses.append({
            "claim_id": str(claim.id),
            "claim_number": claim.claim_number,
            "status": "SUBMITTED",
        })

    # 접수 확인 시뮬레이션 (바로 EDI_RECEIVED)
    receipt_msg_id = _generate_edi_message_id()
    receipt_log = EDIMessageLog(
        user_id=current_user.id,
        batch_id=batch.id,
        direction=EDIDirection.INBOUND,
        message_type=EDIMessageType.CLAIM_RECEIPT,
        message_id=receipt_msg_id,
        ykiho=ykiho,
        http_status=200,
        success=True,
        claim_ids=",".join(str(c.id) for c in valid_claims),
    )
    db.add(receipt_log)

    # 일부 청구 EDI_RECEIVED 처리
    for claim in valid_claims:
        claim.edi_receipt_number = f"EDI-R-{datetime.utcnow().strftime('%Y%m%d')}-{random.randint(100, 999)}"

    return {
        "batch_id": batch.id,
        "batch_number": batch.batch_number,
        "edi_message_id": edi_msg_id,
        "submitted_count": len(valid_claims),
        "total_amount": batch.total_amount,
        "claim_statuses": claim_statuses,
        "message": f"{len(valid_claims)}건이 심평원 EDI로 전송되었습니다.",
    }


@router.get("/edi/status/{batch_id}")
async def edi_batch_status(
    batch_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """배치 전송 상태 조회"""
    result = await db.execute(
        select(ClaimBatch).where(
            and_(
                ClaimBatch.id == batch_id,
                ClaimBatch.user_id == current_user.id,
            )
        )
    )
    batch = result.scalar_one_or_none()

    if not batch:
        return _demo_batch_status(batch_id)

    # 배치에 속한 청구 조회
    claims_result = await db.execute(
        select(InsuranceClaim).where(InsuranceClaim.batch_id == batch.id)
    )
    claims = claims_result.scalars().all()

    claim_statuses = [
        {
            "claim_id": str(c.id),
            "claim_number": c.claim_number,
            "status": c.status.value,
            "edi_receipt_number": c.edi_receipt_number,
            "edi_result_code": c.edi_result_code,
        }
        for c in claims
    ]

    # EDI 메시지 로그
    edi_result = await db.execute(
        select(EDIMessageLog).where(EDIMessageLog.batch_id == batch.id).order_by(EDIMessageLog.created_at)
    )
    edi_logs = edi_result.scalars().all()

    edi_messages = [
        {
            "message_id": e.message_id,
            "direction": e.direction.value,
            "type": e.message_type.value,
            "success": e.success,
            "http_status": e.http_status,
            "response_time_ms": e.http_response_time_ms,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        }
        for e in edi_logs
    ]

    return {
        "batch_id": batch.id,
        "batch_number": batch.batch_number,
        "status": batch.status,
        "total_claims": batch.total_claims,
        "total_amount": batch.total_amount,
        "submitted_at": batch.submission_date.isoformat() if batch.submission_date else None,
        "claim_statuses": claim_statuses,
        "edi_messages": edi_messages,
        "is_demo": False,
    }


@router.post("/edi/poll-results")
async def edi_poll_results(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """심사 결과 폴링 (시뮬레이션)"""
    # 제출 완료되었으나 아직 결과가 없는 청구 조회
    result = await db.execute(
        select(InsuranceClaim).where(
            and_(
                InsuranceClaim.user_id == current_user.id,
                InsuranceClaim.status.in_([ClaimStatus.SUBMITTED, ClaimStatus.EDI_RECEIVED, ClaimStatus.UNDER_REVIEW]),
            )
        )
    )
    pending_claims = result.scalars().all()

    if not pending_claims:
        return {
            "polled_count": 0,
            "results_received": 0,
            "message": "대기 중인 청구가 없습니다.",
            "results": [],
        }

    # 시뮬레이션: 일부 청구에 결과 반환
    rng = random.Random()
    results_received = []

    for claim in pending_claims:
        # 30% 확률로 결과 수신 시뮬레이션
        if rng.random() < 0.3:
            # 결과 생성
            outcome = rng.choices(
                ["ACCEPTED", "PARTIAL", "REJECTED"],
                weights=[70, 20, 10],
                k=1,
            )[0]

            if outcome == "ACCEPTED":
                claim.status = ClaimStatus.ACCEPTED
                claim.approved_amount = claim.total_amount
                claim.rejected_amount = 0
            elif outcome == "PARTIAL":
                rejected_pct = rng.uniform(0.05, 0.25)
                rejected_amt = int(claim.total_amount * rejected_pct)
                claim.status = ClaimStatus.PARTIAL
                claim.approved_amount = claim.total_amount - rejected_amt
                claim.rejected_amount = rejected_amt
                claim.rejection_reason = "일부 항목 급여 기준 미충족"
            else:
                claim.status = ClaimStatus.REJECTED
                claim.approved_amount = 0
                claim.rejected_amount = claim.total_amount
                claim.rejection_reason = "주상병 대비 처치 적합성 미인정"

            claim.result_received_at = datetime.utcnow()
            claim.edi_result_code = outcome
            claim.edi_result_detail = {
                "result_code": outcome,
                "received_at": datetime.utcnow().isoformat(),
            }

            # 수신 EDI 로그
            edi_log = EDIMessageLog(
                user_id=current_user.id,
                batch_id=claim.batch_id,
                direction=EDIDirection.INBOUND,
                message_type=EDIMessageType.REVIEW_RESULT,
                message_id=f"EDI-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{rng.randint(10000, 99999)}",
                ykiho=claim.ykiho,
                http_status=200,
                success=True,
                claim_ids=str(claim.id),
            )
            db.add(edi_log)

            results_received.append({
                "claim_id": str(claim.id),
                "claim_number": claim.claim_number,
                "result": outcome,
                "approved_amount": claim.approved_amount,
                "rejected_amount": claim.rejected_amount,
                "rejection_reason": claim.rejection_reason,
            })

    return {
        "polled_count": len(pending_claims),
        "results_received": len(results_received),
        "message": f"{len(results_received)}건의 심사 결과가 수신되었습니다." if results_received else "아직 수신된 결과가 없습니다.",
        "results": results_received,
    }


@router.post("/edi/validate")
async def edi_validate(
    payload: EDIValidateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """EDI 포맷 유효성 검사"""
    if not payload.claim_ids:
        raise HTTPException(status_code=400, detail="검증할 청구를 선택해주세요")

    validation_results = []
    all_valid = True

    for cid in payload.claim_ids:
        result = await db.execute(
            select(InsuranceClaim).where(
                and_(
                    InsuranceClaim.id == cid,
                    InsuranceClaim.user_id == current_user.id,
                )
            )
        )
        claim = result.scalar_one_or_none()
        if not claim:
            validation_results.append({
                "claim_id": cid,
                "valid": False,
                "errors": ["청구를 찾을 수 없습니다"],
                "warnings": [],
            })
            all_valid = False
            continue

        errors = []
        warnings = []

        # 필수 필드 검증
        if not claim.claim_date:
            errors.append("청구일(claim_date) 필수")
        if not claim.service_date:
            errors.append("진료일(service_date) 필수")
        if claim.total_amount <= 0:
            errors.append("총 금액이 0 이하")
        if not claim.patient_chart_no:
            warnings.append("환자 차트번호 미입력")

        # 항목 검증
        items_result = await db.execute(
            select(ClaimItem).where(ClaimItem.claim_id == claim.id)
        )
        items = items_result.scalars().all()

        if not items:
            errors.append("청구 항목이 없습니다")
        else:
            for item in items:
                if not item.code:
                    errors.append(f"항목 코드 누락 (id={item.id})")
                if item.total_price <= 0:
                    warnings.append(f"항목 {item.code} 금액이 0 이하")

        if errors:
            all_valid = False

        validation_results.append({
            "claim_id": str(claim.id),
            "claim_number": claim.claim_number,
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
        })

    return {
        "all_valid": all_valid,
        "total_checked": len(validation_results),
        "valid_count": sum(1 for v in validation_results if v["valid"]),
        "invalid_count": sum(1 for v in validation_results if not v["valid"]),
        "results": validation_results,
    }
