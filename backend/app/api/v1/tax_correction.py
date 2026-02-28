"""
세무 경정청구 API

- 경정청구 CRUD + AI 스캔 + 환급액 계산
- require_active_service(ServiceType.EMR) 가드
- 수수료: 100만 미만 15%, 100~500만 12%, 500만+ 10%
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
from ...models.tax_correction import (
    TaxCorrection, TaxDeduction,
    TaxCorrectionStatus, DeductionCategory,
)
from ...models.insurance_claim import InsuranceClaim, ClaimStatus

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


class TaxCorrectionCreate(BaseModel):
    tax_year: int
    original_filed_amount: int = 0
    correct_amount: int = 0
    deductions: list[DeductionCreate] = []


class TaxCorrectionUpdate(BaseModel):
    original_filed_amount: Optional[int] = None
    correct_amount: Optional[int] = None
    status: Optional[str] = None


# ============================================================
# Fee calculation
# ============================================================

def calculate_platform_fee(refund_amount: int) -> tuple[int, float]:
    """성공 보수 계산 — (수수료, 수수료율%)"""
    if refund_amount <= 0:
        return 0, 0.0
    if refund_amount < 1_000_000:
        rate = 15.0
    elif refund_amount < 5_000_000:
        rate = 12.0
    else:
        rate = 10.0
    fee = int(refund_amount * rate / 100)
    return fee, rate


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


def generate_demo_scan(tax_year: int) -> dict:
    """AI 스캔 결과 (놓친 공제 항목)"""
    return {
        "tax_year": tax_year,
        "potential_refund": 3_200_000,
        "confidence": 87.5,
        "missed_deductions": [
            {
                "category": "MEDICAL_EXPENSE",
                "description": "보험청구 본인부담금 합산 세액공제 (300만원 초과분의 15%)",
                "estimated_amount": 1_950_000,
                "confidence": 92.0,
                "source": "보험청구 데이터 분석",
            },
            {
                "category": "EDUCATION",
                "description": "직원 교육비 (위생교육, 보수교육 등) 세액공제",
                "estimated_amount": 750_000,
                "confidence": 85.0,
                "source": "일반적 의원 지출 패턴",
            },
            {
                "category": "RETIREMENT",
                "description": "퇴직연금 추가 납입분 세액공제",
                "estimated_amount": 500_000,
                "confidence": 78.0,
                "source": "세무 규정 분석",
            },
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
        "status": correction.status.value if correction.status else None,
        "ai_detected": correction.ai_detected,
        "ai_confidence": correction.ai_confidence,
        "submitted_at": correction.submitted_at.isoformat() if correction.submitted_at else None,
        "approved_at": correction.approved_at.isoformat() if correction.approved_at else None,
        "refund_received_at": correction.refund_received_at.isoformat() if correction.refund_received_at else None,
        "is_demo": False,
    }
    if include_deductions:
        result["deductions"] = [
            {
                "id": d.id,
                "category": d.category.value if d.category else None,
                "description": d.description,
                "amount": d.amount,
                "evidence_required": d.evidence_required,
                "evidence_uploaded": d.evidence_uploaded,
                "ai_suggested": d.ai_suggested,
                "ai_explanation": d.ai_explanation,
            }
            for d in (correction.deductions or [])
        ]
    return result


# ============================================================
# Endpoints
# ============================================================

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
    fee, rate = calculate_platform_fee(max(0, refund))

    correction = TaxCorrection(
        user_id=current_user.id,
        tax_year=payload.tax_year,
        correction_number=_generate_correction_number(payload.tax_year),
        original_filed_amount=payload.original_filed_amount,
        correct_amount=payload.correct_amount,
        refund_amount=max(0, refund),
        platform_fee=fee,
        status=TaxCorrectionStatus.DRAFT,
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
        )
        db.add(deduction)

    await db.flush()
    return {
        "id": str(correction.id),
        "correction_number": correction.correction_number,
        "refund_amount": correction.refund_amount,
        "platform_fee": fee,
        "fee_rate": rate,
    }


@router.get("/scan")
async def ai_scan(
    tax_year: int = Query(..., description="스캔할 세무연도"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """AI 스캔 — 놓친 공제 항목 찾기"""
    # 해당 연도 보험청구 데이터에서 본인부담금 합산
    result = await db.execute(
        select(func.sum(InsuranceClaim.copay_amount)).where(
            and_(
                InsuranceClaim.user_id == current_user.id,
                func.extract("year", InsuranceClaim.claim_date) == tax_year,
                InsuranceClaim.status.in_([
                    ClaimStatus.ACCEPTED, ClaimStatus.PARTIAL,
                ]),
            )
        )
    )
    total_copay = result.scalar() or 0

    if total_copay == 0:
        # 데모 fallback
        return generate_demo_scan(tax_year)

    # 의료비 세액공제 계산: 총급여 7천만 이하 가정, 300만원 초과분의 15%
    medical_deduction_base = max(0, total_copay - 3_000_000)
    medical_tax_credit = int(medical_deduction_base * 0.15)
    # 최대 700만원 한도
    medical_tax_credit = min(medical_tax_credit, 7_000_000)

    missed_deductions = []
    if medical_tax_credit > 0:
        missed_deductions.append({
            "category": "MEDICAL_EXPENSE",
            "description": f"보험청구 본인부담금 합산 세액공제 (총 {total_copay:,}원, 300만원 초과분의 15%)",
            "estimated_amount": medical_tax_credit,
            "confidence": 90.0,
            "source": "보험청구 데이터 분석",
        })

    # 교육비, 퇴직연금은 실 데이터 없이 일반 패턴 제안
    missed_deductions.append({
        "category": "EDUCATION",
        "description": "직원 교육비 (위생교육, 보수교육 등) 세액공제",
        "estimated_amount": 750_000,
        "confidence": 75.0,
        "source": "일반적 의원 지출 패턴",
    })
    missed_deductions.append({
        "category": "RETIREMENT",
        "description": "퇴직연금 추가 납입분 세액공제",
        "estimated_amount": 500_000,
        "confidence": 70.0,
        "source": "세무 규정 분석",
    })

    potential_refund = sum(d["estimated_amount"] for d in missed_deductions)
    avg_confidence = sum(d["confidence"] for d in missed_deductions) / len(missed_deductions) if missed_deductions else 0

    return {
        "tax_year": tax_year,
        "potential_refund": potential_refund,
        "confidence": round(avg_confidence, 1),
        "missed_deductions": missed_deductions,
        "is_demo": False,
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
        fee, _ = calculate_platform_fee(correction.refund_amount)
        correction.platform_fee = fee

    correction.updated_at = datetime.utcnow()
    return {"id": str(correction.id), "status": correction.status.value}


@router.post("/{correction_id}/calculate")
async def calculate_refund(
    correction_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """환급액 + 수수료 계산"""
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
    fee, rate = calculate_platform_fee(refund)
    net_refund = refund - fee

    # 업데이트
    correction.refund_amount = refund
    correction.platform_fee = fee
    correction.updated_at = datetime.utcnow()

    return {
        "refund_amount": refund,
        "platform_fee": fee,
        "fee_rate": rate,
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

    if correction.status not in (TaxCorrectionStatus.DRAFT, TaxCorrectionStatus.PENDING_REVIEW):
        raise HTTPException(status_code=400, detail="제출 가능한 상태가 아닙니다")

    correction.status = TaxCorrectionStatus.SUBMITTED
    correction.submitted_at = datetime.utcnow()
    correction.updated_at = datetime.utcnow()

    return {"id": str(correction.id), "status": "SUBMITTED", "submitted_at": correction.submitted_at.isoformat()}
