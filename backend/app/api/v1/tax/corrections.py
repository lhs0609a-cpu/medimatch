"""
세무 경정청구 CRUD API

- 경정청구 생성/조회/수정/삭제/제출
- 환급액 계산 (progressive fee)
- 세무사 검토 / 상태 타임라인
- 대시보드 KPI 통계
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, case
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid
import random
import logging

from ...deps import get_db, get_current_active_user
from ..service_guards import require_active_service
from ....models.user import User
from ....models.service_subscription import ServiceSubscription, ServiceType
from ....models.tax_correction import (
    TaxCorrection, TaxDeduction,
    TaxCorrectionStatus, DeductionCategory,
)
from ....models.tax_fee import calculate_progressive_fee

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================================
# Pydantic schemas
# ============================================================

class DeductionCreate(BaseModel):
    category: str = "MEDICAL_EXPENSE"
    description: str
    amount: int = 0
    evidence_required: bool = True
    original_amount: int = 0
    additional_amount: int = 0
    tax_code_reference: Optional[str] = None


class TaxCorrectionCreate(BaseModel):
    tax_year: int
    original_filed_amount: int = 0
    correct_amount: int = 0
    deductions: list[DeductionCreate] = []
    ai_scan_id: Optional[int] = None


class TaxCorrectionUpdate(BaseModel):
    original_filed_amount: Optional[int] = None
    correct_amount: Optional[int] = None
    status: Optional[str] = None


class AccountantReviewPayload(BaseModel):
    tax_accountant_id: str
    tax_accountant_name: str
    review: str
    approved: bool


class StatusUpdatePayload(BaseModel):
    status: str
    note: Optional[str] = None


# ============================================================
# Demo data
# ============================================================

def generate_demo_corrections() -> list[dict]:
    rng = random.Random(42)
    return [
        {
            "id": str(uuid.UUID(int=rng.getrandbits(128))),
            "tax_year": 2024,
            "correction_number": "TAX-2024-0001",
            "original_filed_amount": 45_000_000,
            "correct_amount": 42_200_000,
            "refund_amount": 2_800_000,
            "platform_fee": 336_000,
            "status": "COMPLETED",
            "ai_detected": True,
            "ai_confidence": 92.5,
            "submitted_at": "2025-03-15T10:00:00",
            "approved_at": "2025-04-02T14:00:00",
            "refund_received_at": "2025-04-20T09:00:00",
            "deductions": [
                {"category": "MEDICAL_EXPENSE", "description": "의료비 세액공제 누락 (본인부담금 합산)", "amount": 1_800_000, "ai_suggested": True},
                {"category": "EDUCATION", "description": "직원 교육비 세액공제 누락", "amount": 600_000, "ai_suggested": True},
                {"category": "DONATION", "description": "기부금 세액공제 미반영", "amount": 400_000, "ai_suggested": False},
            ],
            "is_demo": True,
        },
        {
            "id": str(uuid.UUID(int=rng.getrandbits(128))),
            "tax_year": 2025,
            "correction_number": "TAX-2025-0001",
            "original_filed_amount": 52_000_000,
            "correct_amount": 48_500_000,
            "refund_amount": 3_500_000,
            "platform_fee": 420_000,
            "status": "PENDING_REVIEW",
            "ai_detected": True,
            "ai_confidence": 88.3,
            "submitted_at": None,
            "approved_at": None,
            "refund_received_at": None,
            "deductions": [
                {"category": "MEDICAL_EXPENSE", "description": "의료비 세액공제 추가분", "amount": 2_200_000, "ai_suggested": True},
                {"category": "RETIREMENT", "description": "퇴직연금 세액공제 누락", "amount": 800_000, "ai_suggested": True},
                {"category": "CREDIT_CARD", "description": "사업용 카드 비용 추가 반영", "amount": 500_000, "ai_suggested": True},
            ],
            "is_demo": True,
        },
    ]


def generate_demo_stats() -> dict:
    return {
        "total_corrections": 2,
        "total_refund": 6_300_000,
        "total_fee": 756_000,
        "active_count": 1,
        "completed_count": 1,
        "avg_confidence": 90.4,
        "avg_refund": 3_150_000,
        "by_status": {
            "COMPLETED": 1,
            "PENDING_REVIEW": 1,
        },
        "by_year": {
            "2024": {"count": 1, "refund": 2_800_000},
            "2025": {"count": 1, "refund": 3_500_000},
        },
        "is_demo": True,
    }


def generate_demo_timeline(correction_id: str) -> dict:
    return {
        "correction_id": correction_id,
        "timeline": [
            {"status": "DRAFT", "timestamp": "2025-03-01T09:00:00", "note": "경정청구 초안 작성"},
            {"status": "SCANNING", "timestamp": "2025-03-01T09:05:00", "note": "AI 스캔 시작"},
            {"status": "SCAN_COMPLETE", "timestamp": "2025-03-01T09:08:00", "note": "AI 스캔 완료 - 3건 발견"},
            {"status": "PENDING_REVIEW", "timestamp": "2025-03-05T10:00:00", "note": "세무사 검토 요청"},
            {"status": "READY_TO_SUBMIT", "timestamp": "2025-03-10T14:00:00", "note": "세무사 승인 완료"},
            {"status": "SUBMITTED", "timestamp": "2025-03-15T10:00:00", "note": "국세청 제출"},
            {"status": "APPROVED", "timestamp": "2025-04-02T14:00:00", "note": "국세청 승인"},
            {"status": "COMPLETED", "timestamp": "2025-04-20T09:00:00", "note": "환급금 입금 완료"},
        ],
        "is_demo": True,
    }


# ============================================================
# Helpers
# ============================================================

def _generate_correction_number(tax_year: int) -> str:
    rand = random.randint(1000, 9999)
    return f"TAX-{tax_year}-{rand:04d}"


def _correction_to_dict(correction: TaxCorrection, include_deductions: bool = False) -> dict:
    result = {
        "id": str(correction.id),
        "tax_year": correction.tax_year,
        "correction_number": correction.correction_number,
        "original_filed_amount": correction.original_filed_amount,
        "correct_amount": correction.correct_amount,
        "refund_amount": correction.refund_amount,
        "platform_fee": correction.platform_fee,
        "net_refund": correction.net_refund,
        "status": correction.status.value if correction.status else None,
        "ai_detected": correction.ai_detected,
        "ai_confidence": correction.ai_confidence,
        "ai_scan_id": correction.ai_scan_id,
        "tax_accountant_name": correction.tax_accountant_name,
        "tax_accountant_approved": correction.tax_accountant_approved,
        "nts_submission_id": correction.nts_submission_id,
        "submitted_at": correction.submitted_at.isoformat() if correction.submitted_at else None,
        "approved_at": correction.approved_at.isoformat() if correction.approved_at else None,
        "refund_received_at": correction.refund_received_at.isoformat() if correction.refund_received_at else None,
        "created_at": correction.created_at.isoformat() if correction.created_at else None,
        "updated_at": correction.updated_at.isoformat() if correction.updated_at else None,
        "is_demo": False,
    }
    if include_deductions:
        result["deductions"] = [
            {
                "id": d.id,
                "category": d.category.value if d.category else None,
                "description": d.description,
                "amount": d.amount,
                "original_amount": d.original_amount,
                "additional_amount": d.additional_amount,
                "tax_savings": d.tax_savings,
                "evidence_required": d.evidence_required,
                "evidence_uploaded": d.evidence_uploaded,
                "ai_suggested": d.ai_suggested,
                "ai_explanation": d.ai_explanation,
                "ai_confidence": d.ai_confidence,
                "tax_code_reference": d.tax_code_reference,
                "review_status": d.review_status,
                "reviewer_note": d.reviewer_note,
            }
            for d in (correction.deductions or [])
        ]
    return result


# ============================================================
# Endpoints
# ============================================================

@router.get("/stats")
async def get_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """대시보드 KPI 통계"""
    base = select(TaxCorrection).where(TaxCorrection.user_id == current_user.id)
    result = await db.execute(base)
    corrections = result.scalars().all()

    if not corrections:
        return generate_demo_stats()

    total_refund = sum(c.refund_amount or 0 for c in corrections)
    total_fee = sum(c.platform_fee or 0 for c in corrections)
    active_statuses = {
        TaxCorrectionStatus.DRAFT, TaxCorrectionStatus.SCANNING,
        TaxCorrectionStatus.SCAN_COMPLETE, TaxCorrectionStatus.PENDING_REVIEW,
        TaxCorrectionStatus.PENDING_DOCS, TaxCorrectionStatus.READY_TO_SUBMIT,
        TaxCorrectionStatus.SUBMITTED, TaxCorrectionStatus.NTS_RECEIVED,
        TaxCorrectionStatus.UNDER_REVIEW,
    }
    active_count = sum(1 for c in corrections if c.status in active_statuses)
    completed_count = sum(1 for c in corrections if c.status == TaxCorrectionStatus.COMPLETED)
    confidences = [c.ai_confidence for c in corrections if c.ai_confidence]
    avg_confidence = round(sum(confidences) / len(confidences), 1) if confidences else 0

    by_status: dict[str, int] = {}
    for c in corrections:
        s = c.status.value if c.status else "UNKNOWN"
        by_status[s] = by_status.get(s, 0) + 1

    by_year: dict[str, dict] = {}
    for c in corrections:
        y = str(c.tax_year)
        if y not in by_year:
            by_year[y] = {"count": 0, "refund": 0}
        by_year[y]["count"] += 1
        by_year[y]["refund"] += c.refund_amount or 0

    return {
        "total_corrections": len(corrections),
        "total_refund": total_refund,
        "total_fee": total_fee,
        "active_count": active_count,
        "completed_count": completed_count,
        "avg_confidence": avg_confidence,
        "avg_refund": round(total_refund / len(corrections)) if corrections else 0,
        "by_status": by_status,
        "by_year": by_year,
        "is_demo": False,
    }


@router.get("/active")
async def list_active_corrections(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """진행 중인 경정청구 목록"""
    active_statuses = [
        TaxCorrectionStatus.DRAFT, TaxCorrectionStatus.SCANNING,
        TaxCorrectionStatus.SCAN_COMPLETE, TaxCorrectionStatus.PENDING_REVIEW,
        TaxCorrectionStatus.PENDING_DOCS, TaxCorrectionStatus.READY_TO_SUBMIT,
        TaxCorrectionStatus.SUBMITTED, TaxCorrectionStatus.NTS_RECEIVED,
        TaxCorrectionStatus.UNDER_REVIEW, TaxCorrectionStatus.REFUND_PENDING,
    ]
    query = (
        select(TaxCorrection)
        .where(
            and_(
                TaxCorrection.user_id == current_user.id,
                TaxCorrection.status.in_(active_statuses),
            )
        )
        .order_by(TaxCorrection.updated_at.desc())
    )
    result = await db.execute(query)
    corrections = result.scalars().all()

    if not corrections:
        demo = [c for c in generate_demo_corrections() if c["status"] not in ("COMPLETED", "CANCELED", "REJECTED")]
        return {"data": demo, "is_demo": True}

    return {"data": [_correction_to_dict(c) for c in corrections], "is_demo": False}


@router.get("/")
async def list_corrections(
    tax_year: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """경정청구 목록"""
    query = select(TaxCorrection).where(
        TaxCorrection.user_id == current_user.id
    ).order_by(TaxCorrection.tax_year.desc(), TaxCorrection.created_at.desc())

    if tax_year:
        query = query.where(TaxCorrection.tax_year == tax_year)
    if status:
        statuses = [s.strip() for s in status.split(",")]
        query = query.where(TaxCorrection.status.in_(statuses))

    result = await db.execute(query)
    corrections = result.scalars().all()

    if not corrections:
        return {"data": generate_demo_corrections(), "is_demo": True}

    return {"data": [_correction_to_dict(c) for c in corrections], "is_demo": False}


@router.post("/")
async def create_correction(
    payload: TaxCorrectionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """경정청구 생성"""
    refund = payload.original_filed_amount - payload.correct_amount
    refund = max(0, refund)
    fee_result = calculate_progressive_fee(refund)

    correction = TaxCorrection(
        user_id=current_user.id,
        tax_year=payload.tax_year,
        correction_number=_generate_correction_number(payload.tax_year),
        original_filed_amount=payload.original_filed_amount,
        correct_amount=payload.correct_amount,
        refund_amount=refund,
        platform_fee=fee_result["total_fee"],
        net_refund=refund - fee_result["total_fee"],
        status=TaxCorrectionStatus.DRAFT,
        ai_scan_id=payload.ai_scan_id,
    )
    db.add(correction)
    await db.flush()

    for ded in payload.deductions:
        deduction = TaxDeduction(
            correction_id=correction.id,
            category=DeductionCategory(ded.category),
            description=ded.description,
            amount=ded.amount,
            evidence_required=ded.evidence_required,
            original_amount=ded.original_amount,
            additional_amount=ded.additional_amount,
            tax_code_reference=ded.tax_code_reference,
        )
        db.add(deduction)

    await db.flush()
    return {
        "id": str(correction.id),
        "correction_number": correction.correction_number,
        "refund_amount": correction.refund_amount,
        "platform_fee": fee_result["total_fee"],
        "fee_breakdown": fee_result["breakdown"],
        "net_refund": correction.net_refund,
    }


@router.get("/{correction_id}")
async def get_correction(
    correction_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """경정청구 상세"""
    result = await db.execute(
        select(TaxCorrection).where(
            and_(
                TaxCorrection.id == correction_id,
                TaxCorrection.user_id == current_user.id,
            )
        )
    )
    correction = result.scalar_one_or_none()
    if not correction:
        raise HTTPException(status_code=404, detail="경정청구를 찾을 수 없습니다")

    ded_result = await db.execute(
        select(TaxDeduction).where(TaxDeduction.correction_id == correction.id)
    )
    correction.deductions = ded_result.scalars().all()

    return _correction_to_dict(correction, include_deductions=True)


@router.put("/{correction_id}")
async def update_correction(
    correction_id: str,
    payload: TaxCorrectionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """경정청구 수정"""
    result = await db.execute(
        select(TaxCorrection).where(
            and_(
                TaxCorrection.id == correction_id,
                TaxCorrection.user_id == current_user.id,
            )
        )
    )
    correction = result.scalar_one_or_none()
    if not correction:
        raise HTTPException(status_code=404, detail="경정청구를 찾을 수 없습니다")

    if correction.status in (TaxCorrectionStatus.SUBMITTED, TaxCorrectionStatus.APPROVED, TaxCorrectionStatus.COMPLETED):
        raise HTTPException(status_code=400, detail="제출 이후 단계의 경정청구는 수정할 수 없습니다")

    for field, value in payload.dict(exclude_unset=True).items():
        if field == "status" and value:
            setattr(correction, field, TaxCorrectionStatus(value))
        elif value is not None:
            setattr(correction, field, value)

    # 환급액 재계산
    if payload.original_filed_amount is not None or payload.correct_amount is not None:
        refund = correction.original_filed_amount - correction.correct_amount
        correction.refund_amount = max(0, refund)
        fee_result = calculate_progressive_fee(correction.refund_amount)
        correction.platform_fee = fee_result["total_fee"]
        correction.net_refund = correction.refund_amount - fee_result["total_fee"]

    correction.updated_at = datetime.utcnow()
    return {"id": str(correction.id), "status": correction.status.value}


@router.post("/{correction_id}/calculate")
async def calculate_refund(
    correction_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """환급액 + 수수료 계산 (progressive fee)"""
    result = await db.execute(
        select(TaxCorrection).where(
            and_(
                TaxCorrection.id == correction_id,
                TaxCorrection.user_id == current_user.id,
            )
        )
    )
    correction = result.scalar_one_or_none()
    if not correction:
        raise HTTPException(status_code=404, detail="경정청구를 찾을 수 없습니다")

    # 공제 항목 합산
    ded_result = await db.execute(
        select(func.sum(TaxDeduction.amount)).where(
            TaxDeduction.correction_id == correction.id
        )
    )
    total_deductions = ded_result.scalar() or 0

    refund = correction.original_filed_amount - correction.correct_amount
    refund = max(0, refund)
    fee_result = calculate_progressive_fee(refund)
    net_refund = refund - fee_result["total_fee"]

    # 업데이트
    correction.refund_amount = refund
    correction.platform_fee = fee_result["total_fee"]
    correction.net_refund = net_refund
    correction.updated_at = datetime.utcnow()

    return {
        "refund_amount": refund,
        "base_fee": fee_result["base_fee"],
        "vat": fee_result["vat"],
        "total_fee": fee_result["total_fee"],
        "fee_breakdown": fee_result["breakdown"],
        "net_refund": net_refund,
        "total_deductions": total_deductions,
    }


@router.post("/{correction_id}/submit")
async def submit_correction(
    correction_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """경정청구 제출"""
    result = await db.execute(
        select(TaxCorrection).where(
            and_(
                TaxCorrection.id == correction_id,
                TaxCorrection.user_id == current_user.id,
            )
        )
    )
    correction = result.scalar_one_or_none()
    if not correction:
        raise HTTPException(status_code=404, detail="경정청구를 찾을 수 없습니다")

    if correction.status not in (TaxCorrectionStatus.DRAFT, TaxCorrectionStatus.PENDING_REVIEW, TaxCorrectionStatus.READY_TO_SUBMIT):
        raise HTTPException(status_code=400, detail="제출 가능한 상태가 아닙니다")

    correction.status = TaxCorrectionStatus.SUBMITTED
    correction.submitted_at = datetime.utcnow()
    correction.updated_at = datetime.utcnow()

    return {"id": str(correction.id), "status": "SUBMITTED", "submitted_at": correction.submitted_at.isoformat()}


@router.delete("/{correction_id}")
async def cancel_correction(
    correction_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """경정청구 취소"""
    result = await db.execute(
        select(TaxCorrection).where(
            and_(
                TaxCorrection.id == correction_id,
                TaxCorrection.user_id == current_user.id,
            )
        )
    )
    correction = result.scalar_one_or_none()
    if not correction:
        raise HTTPException(status_code=404, detail="경정청구를 찾을 수 없습니다")

    non_cancelable = {
        TaxCorrectionStatus.APPROVED, TaxCorrectionStatus.COMPLETED,
        TaxCorrectionStatus.REFUND_PENDING, TaxCorrectionStatus.CANCELED,
    }
    if correction.status in non_cancelable:
        raise HTTPException(status_code=400, detail="취소할 수 없는 상태입니다")

    correction.status = TaxCorrectionStatus.CANCELED
    correction.updated_at = datetime.utcnow()

    return {"id": str(correction.id), "status": "CANCELED"}


@router.get("/{correction_id}/timeline")
async def get_timeline(
    correction_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """경정청구 상태 타임라인"""
    result = await db.execute(
        select(TaxCorrection).where(
            and_(
                TaxCorrection.id == correction_id,
                TaxCorrection.user_id == current_user.id,
            )
        )
    )
    correction = result.scalar_one_or_none()
    if not correction:
        return generate_demo_timeline(correction_id)

    # 실제 타임라인은 audit log에서 가져오지만, 기본 정보로 구성
    timeline = []
    if correction.created_at:
        timeline.append({"status": "DRAFT", "timestamp": correction.created_at.isoformat(), "note": "경정청구 생성"})
    if correction.submitted_at:
        timeline.append({"status": "SUBMITTED", "timestamp": correction.submitted_at.isoformat(), "note": "국세청 제출"})
    if correction.nts_submission_date:
        timeline.append({"status": "NTS_RECEIVED", "timestamp": correction.nts_submission_date.isoformat(), "note": "국세청 접수"})
    if correction.approved_at:
        timeline.append({"status": "APPROVED", "timestamp": correction.approved_at.isoformat(), "note": "승인"})
    if correction.refund_received_at:
        timeline.append({"status": "COMPLETED", "timestamp": correction.refund_received_at.isoformat(), "note": "환급금 입금"})

    # 현재 상태 추가
    if correction.status and correction.updated_at:
        current_in_timeline = any(t["status"] == correction.status.value for t in timeline)
        if not current_in_timeline:
            timeline.append({
                "status": correction.status.value,
                "timestamp": correction.updated_at.isoformat(),
                "note": f"현재 상태: {correction.status.value}",
            })

    timeline.sort(key=lambda t: t["timestamp"])
    return {"correction_id": str(correction.id), "timeline": timeline, "is_demo": False}


@router.post("/{correction_id}/accountant-review")
async def submit_accountant_review(
    correction_id: str,
    payload: AccountantReviewPayload,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """세무사 검토 제출"""
    result = await db.execute(
        select(TaxCorrection).where(
            and_(
                TaxCorrection.id == correction_id,
                TaxCorrection.user_id == current_user.id,
            )
        )
    )
    correction = result.scalar_one_or_none()
    if not correction:
        raise HTTPException(status_code=404, detail="경정청구를 찾을 수 없습니다")

    correction.tax_accountant_id = payload.tax_accountant_id
    correction.tax_accountant_name = payload.tax_accountant_name
    correction.tax_accountant_review = payload.review
    correction.tax_accountant_approved = payload.approved

    if payload.approved:
        correction.status = TaxCorrectionStatus.READY_TO_SUBMIT
    else:
        correction.status = TaxCorrectionStatus.PENDING_DOCS

    correction.updated_at = datetime.utcnow()

    return {
        "id": str(correction.id),
        "accountant_approved": payload.approved,
        "status": correction.status.value,
    }


@router.post("/{correction_id}/status")
async def update_status(
    correction_id: str,
    payload: StatusUpdatePayload,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """경정청구 상태 변경"""
    result = await db.execute(
        select(TaxCorrection).where(
            and_(
                TaxCorrection.id == correction_id,
                TaxCorrection.user_id == current_user.id,
            )
        )
    )
    correction = result.scalar_one_or_none()
    if not correction:
        raise HTTPException(status_code=404, detail="경정청구를 찾을 수 없습니다")

    try:
        new_status = TaxCorrectionStatus(payload.status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"유효하지 않은 상태: {payload.status}")

    old_status = correction.status.value if correction.status else None
    correction.status = new_status
    correction.updated_at = datetime.utcnow()

    # 상태별 타임스탬프 자동 설정
    if new_status == TaxCorrectionStatus.SUBMITTED and not correction.submitted_at:
        correction.submitted_at = datetime.utcnow()
    elif new_status == TaxCorrectionStatus.APPROVED and not correction.approved_at:
        correction.approved_at = datetime.utcnow()
    elif new_status == TaxCorrectionStatus.COMPLETED and not correction.refund_received_at:
        correction.refund_received_at = datetime.utcnow()

    return {
        "id": str(correction.id),
        "old_status": old_status,
        "new_status": new_status.value,
    }
