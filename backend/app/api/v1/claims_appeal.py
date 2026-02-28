"""
이의신청 관리 엔드포인트

- 이의신청 생성
- AI 이의신청서 자동 생성
- 이의신청 제출
- 이의신청서 PDF 다운로드
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, desc
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date, timedelta
import uuid
import random
import logging

from ..deps import get_db, get_current_active_user
from .service_guards import require_active_service
from ...models.user import User
from ...models.service_subscription import ServiceSubscription, ServiceType
from ...models.insurance_claim import InsuranceClaim, ClaimStatus
from ...models.claim_appeal import ClaimAppeal, AppealType, AppealStatus

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================================
# Pydantic schemas
# ============================================================

class AppealCreateRequest(BaseModel):
    claim_id: str
    appeal_type: str = "PARTIAL_REJECTION"
    rejected_items: list[dict] = []
    """[{"item_id": 1, "code": "HA010", "rejected_amount": 15000, "reason": "..."}]"""


class AppealSubmitRequest(BaseModel):
    final_letter: Optional[str] = None
    supporting_evidence: list[dict] = []


# ============================================================
# Demo data
# ============================================================

def _generate_appeal_number() -> str:
    now = datetime.utcnow()
    rand = random.randint(1000, 9999)
    return f"APL-{now.year}-{rand:04d}"


def _demo_appeals() -> list[dict]:
    rng = random.Random(77)
    return [
        {
            "id": str(uuid.UUID(int=rng.getrandbits(128))),
            "claim_id": str(uuid.UUID(int=rng.getrandbits(128))),
            "appeal_number": "APL-2026-0001",
            "appeal_type": "PARTIAL_REJECTION",
            "status": "LETTER_GENERATED",
            "rejected_items": [
                {"item_id": 1, "code": "HA010", "rejected_amount": 15000, "reason": "주상병 대비 처치 적합성 미인정"},
            ],
            "total_rejected_amount": 15000,
            "appealed_amount": 15000,
            "ai_success_probability": 0.68,
            "submitted_at": None,
            "deadline": (date.today() + timedelta(days=72)).isoformat(),
            "created_at": datetime.utcnow().isoformat(),
            "is_demo": True,
        },
        {
            "id": str(uuid.UUID(int=rng.getrandbits(128))),
            "claim_id": str(uuid.UUID(int=rng.getrandbits(128))),
            "appeal_number": "APL-2026-0002",
            "appeal_type": "FULL_REJECTION",
            "status": "SUBMITTED",
            "rejected_items": [
                {"item_id": 2, "code": "MM042", "rejected_amount": 55000, "reason": "급여기준 미충족"},
                {"item_id": 3, "code": "B0030", "rejected_amount": 28000, "reason": "횟수 초과"},
            ],
            "total_rejected_amount": 83000,
            "appealed_amount": 83000,
            "ai_success_probability": 0.42,
            "submitted_at": (datetime.utcnow() - timedelta(days=5)).isoformat(),
            "deadline": (date.today() + timedelta(days=60)).isoformat(),
            "created_at": (datetime.utcnow() - timedelta(days=7)).isoformat(),
            "is_demo": True,
        },
    ]


def _appeal_to_dict(appeal: ClaimAppeal) -> dict:
    return {
        "id": str(appeal.id),
        "claim_id": str(appeal.claim_id),
        "appeal_number": appeal.appeal_number,
        "appeal_type": appeal.appeal_type.value if appeal.appeal_type else None,
        "status": appeal.status.value if appeal.status else None,
        "rejected_items": appeal.rejected_items or [],
        "total_rejected_amount": appeal.total_rejected_amount,
        "appealed_amount": appeal.appealed_amount,
        "ai_success_probability": appeal.ai_success_probability,
        "ai_generated_letter": appeal.ai_generated_letter,
        "final_letter": appeal.final_letter,
        "supporting_evidence": appeal.supporting_evidence or [],
        "submitted_at": appeal.submitted_at.isoformat() if appeal.submitted_at else None,
        "deadline": appeal.deadline.isoformat() if appeal.deadline else None,
        "recovered_amount": appeal.recovered_amount,
        "created_at": appeal.created_at.isoformat() if appeal.created_at else None,
        "updated_at": appeal.updated_at.isoformat() if appeal.updated_at else None,
        "is_demo": False,
    }


# ============================================================
# AI 이의신청서 생성 (시뮬레이션)
# ============================================================

def _generate_ai_appeal_letter(
    claim: InsuranceClaim,
    appeal: ClaimAppeal,
) -> dict:
    """AI 이의신청서 생성 (GPT-4o 시뮬레이션)"""

    rejected_items = appeal.rejected_items or []
    codes = [item.get("code", "") for item in rejected_items]
    reasons = [item.get("reason", "") for item in rejected_items]
    total_amount = sum(item.get("rejected_amount", 0) for item in rejected_items)

    # 유사 사례 기반 논거 생성 (시뮬레이션)
    similar_cases = [
        {
            "case_id": "APL-2025-3847",
            "diagnosis": claim.primary_dx_code or "M54.5",
            "codes": codes[:2] if codes else ["HA010"],
            "result": "ACCEPTED",
            "key_argument": "진료 필요성 소견서 첨부 시 인정 판례",
        },
        {
            "case_id": "APL-2025-2195",
            "diagnosis": claim.primary_dx_code or "M54.5",
            "codes": codes[:1] if codes else ["HA010"],
            "result": "PARTIALLY_ACCEPTED",
            "key_argument": "환자 증상 심각도에 따른 처치 필요성 인정",
        },
    ]

    legal_basis = [
        "국민건강보험법 제47조 (요양급여비용의 심사)",
        "건강보험 심사평가원 고시 제2025-142호 (요양급여의 적용기준 및 방법에 관한 세부사항)",
    ]

    key_arguments = [
        f"환자 차트번호 {claim.patient_chart_no or 'N/A'} 환자의 임상적 상태를 감안할 때, 해당 처치({', '.join(codes)})의 의학적 필요성이 인정됩니다.",
        f"삭감 사유인 '{reasons[0] if reasons else '미상'}'에 대해, 유사 사례(APL-2025-3847)에서 동일 진단 코드에 대한 처치가 인정된 바 있습니다.",
        "첨부된 진료 기록 및 환자 상태 보고서를 근거로 해당 처치의 급여 인정을 요청합니다.",
    ]

    # 이의신청서 본문 생성
    letter = f"""이의신청서

1. 이의신청 개요
- 청구번호: {claim.claim_number}
- 진료일: {claim.service_date.isoformat() if claim.service_date else 'N/A'}
- 삭감 코드: {', '.join(codes) if codes else 'N/A'}
- 삭감 금액: {total_amount:,}원

2. 이의신청 사유

본 이의신청은 상기 청구 건에 대한 삭감 결정에 대하여, 아래의 근거를 바탕으로 재심사를 요청하는 것입니다.

{chr(10).join(f'  ({i+1}) {arg}' for i, arg in enumerate(key_arguments))}

3. 법적 근거

{chr(10).join(f'  - {basis}' for basis in legal_basis)}

4. 첨부 서류
  - 진료 기록 사본
  - 환자 상태 보고서
  - 유사 사례 심사 결과 참고 자료

5. 결론

상기 근거를 참고하시어 해당 청구 건에 대한 삭감 결정을 재검토하여 주시기 바랍니다.
삭감된 {total_amount:,}원에 대한 급여 인정을 요청 드립니다.

감사합니다."""

    # 성공 확률 추정
    base_probability = 0.45
    if similar_cases[0]["result"] == "ACCEPTED":
        base_probability += 0.15
    if len(rejected_items) == 1:
        base_probability += 0.10
    if total_amount < 30000:
        base_probability += 0.05
    success_probability = round(min(base_probability, 0.95), 2)

    return {
        "letter": letter,
        "success_probability": success_probability,
        "reasoning": {
            "similar_cases": similar_cases,
            "legal_basis": legal_basis,
            "key_arguments": key_arguments,
        },
    }


# ============================================================
# Endpoints
# ============================================================

@router.get("/")
async def list_appeals(
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """이의신청 목록 조회"""
    query = select(ClaimAppeal).where(
        ClaimAppeal.user_id == current_user.id
    ).order_by(desc(ClaimAppeal.created_at))

    if status:
        query = query.where(ClaimAppeal.status == status)

    result = await db.execute(query)
    appeals = result.scalars().all()

    if not appeals:
        return {"data": _demo_appeals(), "is_demo": True}

    return {
        "data": [_appeal_to_dict(a) for a in appeals],
        "is_demo": False,
    }


@router.post("/")
async def create_appeal(
    payload: AppealCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """이의신청 생성"""
    # 청구 확인
    claim_result = await db.execute(
        select(InsuranceClaim).where(
            and_(
                InsuranceClaim.id == payload.claim_id,
                InsuranceClaim.user_id == current_user.id,
            )
        )
    )
    claim = claim_result.scalar_one_or_none()
    if not claim:
        raise HTTPException(status_code=404, detail="청구를 찾을 수 없습니다")

    if claim.status not in (ClaimStatus.REJECTED, ClaimStatus.PARTIAL):
        raise HTTPException(
            status_code=400,
            detail="삭감(REJECTED/PARTIAL) 상태의 청구만 이의신청 가능합니다",
        )

    # 이의신청 기한 확인 (결과 수신 후 90일)
    deadline = None
    if claim.result_received_at:
        deadline = (claim.result_received_at + timedelta(days=90)).date()
        if deadline < date.today():
            raise HTTPException(
                status_code=400,
                detail=f"이의신청 기한({deadline.isoformat()})이 경과하였습니다",
            )
    else:
        deadline = date.today() + timedelta(days=90)

    total_rejected = sum(item.get("rejected_amount", 0) for item in payload.rejected_items)

    appeal = ClaimAppeal(
        claim_id=claim.id,
        user_id=current_user.id,
        appeal_number=_generate_appeal_number(),
        appeal_type=AppealType(payload.appeal_type),
        status=AppealStatus.DRAFT,
        rejected_items=payload.rejected_items,
        total_rejected_amount=total_rejected,
        appealed_amount=total_rejected,
        deadline=deadline,
    )
    db.add(appeal)
    await db.flush()

    # 청구에 이의신청 플래그
    claim.has_appeal = True
    claim.appeal_count = (claim.appeal_count or 0) + 1
    claim.status = ClaimStatus.APPEALING

    return {
        "id": str(appeal.id),
        "appeal_number": appeal.appeal_number,
        "status": appeal.status.value,
        "deadline": deadline.isoformat() if deadline else None,
        "total_rejected_amount": total_rejected,
    }


@router.post("/{appeal_id}/generate-letter")
async def generate_appeal_letter(
    appeal_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """AI 이의신청서 자동 생성"""
    result = await db.execute(
        select(ClaimAppeal).where(
            and_(
                ClaimAppeal.id == appeal_id,
                ClaimAppeal.user_id == current_user.id,
            )
        )
    )
    appeal = result.scalar_one_or_none()
    if not appeal:
        raise HTTPException(status_code=404, detail="이의신청을 찾을 수 없습니다")

    # 관련 청구 로드
    claim_result = await db.execute(
        select(InsuranceClaim).where(InsuranceClaim.id == appeal.claim_id)
    )
    claim = claim_result.scalar_one_or_none()
    if not claim:
        raise HTTPException(status_code=404, detail="관련 청구를 찾을 수 없습니다")

    # AI 이의신청서 생성
    ai_result = _generate_ai_appeal_letter(claim, appeal)

    # 결과 저장
    appeal.ai_generated_letter = ai_result["letter"]
    appeal.ai_success_probability = ai_result["success_probability"]
    appeal.ai_reasoning = ai_result["reasoning"]
    appeal.status = AppealStatus.LETTER_GENERATED
    appeal.updated_at = datetime.utcnow()

    return {
        "appeal_id": str(appeal.id),
        "appeal_number": appeal.appeal_number,
        "status": appeal.status.value,
        "ai_generated_letter": ai_result["letter"],
        "ai_success_probability": ai_result["success_probability"],
        "ai_reasoning": ai_result["reasoning"],
        "message": "AI 이의신청서가 생성되었습니다. 검토 후 수정하거나 바로 제출하세요.",
    }


@router.post("/{appeal_id}/submit")
async def submit_appeal(
    appeal_id: str,
    payload: AppealSubmitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """이의신청 제출"""
    result = await db.execute(
        select(ClaimAppeal).where(
            and_(
                ClaimAppeal.id == appeal_id,
                ClaimAppeal.user_id == current_user.id,
            )
        )
    )
    appeal = result.scalar_one_or_none()
    if not appeal:
        raise HTTPException(status_code=404, detail="이의신청을 찾을 수 없습니다")

    if appeal.status in (AppealStatus.SUBMITTED, AppealStatus.ACCEPTED, AppealStatus.REJECTED):
        raise HTTPException(status_code=400, detail=f"현재 상태({appeal.status.value})에서는 제출할 수 없습니다")

    # 이의신청서 확인
    if not appeal.ai_generated_letter and not payload.final_letter:
        raise HTTPException(status_code=400, detail="이의신청서가 없습니다. 먼저 AI 이의신청서를 생성하거나 직접 작성해주세요.")

    # 최종 이의신청서 설정
    if payload.final_letter:
        appeal.final_letter = payload.final_letter
    elif not appeal.final_letter:
        appeal.final_letter = appeal.ai_generated_letter

    if payload.supporting_evidence:
        appeal.supporting_evidence = payload.supporting_evidence

    appeal.status = AppealStatus.SUBMITTED
    appeal.submitted_at = datetime.utcnow()
    appeal.updated_at = datetime.utcnow()

    return {
        "appeal_id": str(appeal.id),
        "appeal_number": appeal.appeal_number,
        "status": appeal.status.value,
        "submitted_at": appeal.submitted_at.isoformat(),
        "message": "이의신청이 제출되었습니다.",
    }


@router.get("/{appeal_id}/pdf")
async def download_appeal_pdf(
    appeal_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """이의신청서 PDF 다운로드 (텍스트 시뮬레이션)"""
    result = await db.execute(
        select(ClaimAppeal).where(
            and_(
                ClaimAppeal.id == appeal_id,
                ClaimAppeal.user_id == current_user.id,
            )
        )
    )
    appeal = result.scalar_one_or_none()
    if not appeal:
        raise HTTPException(status_code=404, detail="이의신청을 찾을 수 없습니다")

    letter_content = appeal.final_letter or appeal.ai_generated_letter
    if not letter_content:
        raise HTTPException(status_code=400, detail="이의신청서가 생성되지 않았습니다")

    # PDF 생성 시뮬레이션 (텍스트 반환)
    # 실제 운영 시에는 reportlab 또는 weasyprint 등으로 PDF 생성
    pdf_content = f"""[PDF SIMULATION - 실제 운영 시 PDF 파일로 생성됩니다]

========================================
        보험청구 이의신청서
========================================

이의신청 번호: {appeal.appeal_number}
신청일: {appeal.submitted_at.strftime('%Y-%m-%d') if appeal.submitted_at else datetime.utcnow().strftime('%Y-%m-%d')}
삭감 금액: {appeal.total_rejected_amount:,}원
AI 성공 확률: {(appeal.ai_success_probability or 0) * 100:.0f}%

----------------------------------------

{letter_content}

========================================
"""

    return Response(
        content=pdf_content.encode("utf-8"),
        media_type="text/plain; charset=utf-8",
        headers={
            "Content-Disposition": f"attachment; filename=appeal_{appeal.appeal_number}.txt",
        },
    )
