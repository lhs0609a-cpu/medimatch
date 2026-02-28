"""
수수료 정산 API

- 구간별 progressive 수수료 계산
- 청구서 발행 / 결제 기록
- 영수증 발급
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import uuid
import random
import logging

from ...deps import get_db, get_current_active_user
from ..service_guards import require_active_service
from ....models.user import User
from ....models.service_subscription import ServiceSubscription, ServiceType
from ....models.tax_fee import TaxFeeSettlement, FeeSettlementStatus, calculate_progressive_fee
from ....models.tax_correction import TaxCorrection

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================================
# Pydantic schemas
# ============================================================

class PaymentPayload(BaseModel):
    payment_method: str = "AUTO_DEDUCT"
    payment_reference: Optional[str] = None


# ============================================================
# Demo data
# ============================================================

def _generate_demo_settlements() -> list[dict]:
    rng = random.Random(42)
    return [
        {
            "id": str(uuid.UUID(int=rng.getrandbits(128))),
            "correction_id": str(uuid.UUID(int=rng.getrandbits(128))),
            "refund_amount": 2_800_000,
            "base_fee": 366_000,
            "vat": 36_600,
            "total_fee": 402_600,
            "fee_breakdown": [
                {"range_min": 0, "range_max": 1_000_000, "rate": 0.15, "taxable_amount": 1_000_000, "fee": 150_000},
                {"range_min": 1_000_000, "range_max": 5_000_000, "rate": 0.12, "taxable_amount": 1_800_000, "fee": 216_000},
            ],
            "status": "PAID",
            "payment_method": "AUTO_DEDUCT",
            "payment_date": "2025-04-20T09:00:00",
            "invoice_number": "INV-2025-0001",
            "receipt_number": "RCT-2025-0001",
            "is_demo": True,
        },
        {
            "id": str(uuid.UUID(int=rng.getrandbits(128))),
            "correction_id": str(uuid.UUID(int=rng.getrandbits(128))),
            "refund_amount": 3_500_000,
            "base_fee": 450_000,
            "vat": 45_000,
            "total_fee": 495_000,
            "fee_breakdown": [
                {"range_min": 0, "range_max": 1_000_000, "rate": 0.15, "taxable_amount": 1_000_000, "fee": 150_000},
                {"range_min": 1_000_000, "range_max": 5_000_000, "rate": 0.12, "taxable_amount": 2_500_000, "fee": 300_000},
            ],
            "status": "PENDING",
            "payment_method": None,
            "payment_date": None,
            "invoice_number": None,
            "receipt_number": None,
            "is_demo": True,
        },
    ]


# ============================================================
# Helpers
# ============================================================

def _settlement_to_dict(s: TaxFeeSettlement) -> dict:
    return {
        "id": str(s.id),
        "correction_id": str(s.correction_id) if s.correction_id else None,
        "refund_amount": s.refund_amount,
        "actual_refund_amount": s.actual_refund_amount,
        "base_fee": s.base_fee,
        "vat": s.vat,
        "total_fee": s.total_fee,
        "fee_breakdown": s.fee_breakdown,
        "discount_rate": s.discount_rate,
        "discount_reason": s.discount_reason,
        "adjusted_fee": s.adjusted_fee,
        "status": s.status.value if s.status else None,
        "payment_method": s.payment_method.value if s.payment_method else None,
        "payment_date": s.payment_date.isoformat() if s.payment_date else None,
        "payment_reference": s.payment_reference,
        "invoice_number": s.invoice_number,
        "invoice_issued_at": s.invoice_issued_at.isoformat() if s.invoice_issued_at else None,
        "invoice_due_date": s.invoice_due_date.isoformat() if s.invoice_due_date else None,
        "receipt_number": s.receipt_number,
        "receipt_issued_at": s.receipt_issued_at.isoformat() if s.receipt_issued_at else None,
        "created_at": s.created_at.isoformat() if s.created_at else None,
        "is_demo": False,
    }


def _generate_invoice_number() -> str:
    now = datetime.utcnow()
    rand = random.randint(1000, 9999)
    return f"INV-{now.year}-{rand:04d}"


def _generate_receipt_number() -> str:
    now = datetime.utcnow()
    rand = random.randint(1000, 9999)
    return f"RCT-{now.year}-{rand:04d}"


# ============================================================
# Endpoints
# ============================================================

@router.get("/")
async def list_settlements(
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """수수료 정산 목록"""
    query = select(TaxFeeSettlement).where(
        TaxFeeSettlement.user_id == current_user.id
    ).order_by(TaxFeeSettlement.created_at.desc())

    if status:
        query = query.where(TaxFeeSettlement.status == status)

    result = await db.execute(query)
    settlements = result.scalars().all()

    if not settlements:
        return {"data": _generate_demo_settlements(), "is_demo": True}

    return {"data": [_settlement_to_dict(s) for s in settlements], "is_demo": False}


@router.get("/{settlement_id}")
async def get_settlement(
    settlement_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """수수료 정산 상세"""
    result = await db.execute(
        select(TaxFeeSettlement).where(
            and_(
                TaxFeeSettlement.id == settlement_id,
                TaxFeeSettlement.user_id == current_user.id,
            )
        )
    )
    settlement = result.scalar_one_or_none()
    if not settlement:
        raise HTTPException(status_code=404, detail="정산 내역을 찾을 수 없습니다")

    return _settlement_to_dict(settlement)


@router.post("/calculate/{correction_id}")
async def calculate_fee(
    correction_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """경정청구 수수료 계산 + 정산 레코드 생성"""
    # 경정청구 조회
    corr_result = await db.execute(
        select(TaxCorrection).where(
            and_(
                TaxCorrection.id == correction_id,
                TaxCorrection.user_id == current_user.id,
            )
        )
    )
    correction = corr_result.scalar_one_or_none()
    if not correction:
        raise HTTPException(status_code=404, detail="경정청구를 찾을 수 없습니다")

    refund = correction.refund_amount or 0
    if refund <= 0:
        raise HTTPException(status_code=400, detail="환급액이 없어 수수료를 계산할 수 없습니다")

    fee_result = calculate_progressive_fee(refund)

    # 기존 정산 레코드 확인
    existing = await db.execute(
        select(TaxFeeSettlement).where(
            and_(
                TaxFeeSettlement.correction_id == correction.id,
                TaxFeeSettlement.user_id == current_user.id,
            )
        )
    )
    settlement = existing.scalar_one_or_none()

    if settlement:
        # 업데이트
        settlement.refund_amount = refund
        settlement.base_fee = fee_result["base_fee"]
        settlement.vat = fee_result["vat"]
        settlement.total_fee = fee_result["total_fee"]
        settlement.fee_breakdown = fee_result["breakdown"]
        settlement.status = FeeSettlementStatus.CALCULATED
        settlement.updated_at = datetime.utcnow()
    else:
        # 신규 생성
        settlement = TaxFeeSettlement(
            user_id=current_user.id,
            correction_id=correction.id,
            refund_amount=refund,
            base_fee=fee_result["base_fee"],
            vat=fee_result["vat"],
            total_fee=fee_result["total_fee"],
            fee_breakdown=fee_result["breakdown"],
            status=FeeSettlementStatus.CALCULATED,
        )
        db.add(settlement)

    await db.flush()

    return {
        "id": str(settlement.id),
        "correction_id": str(correction.id),
        "refund_amount": refund,
        "base_fee": fee_result["base_fee"],
        "vat": fee_result["vat"],
        "total_fee": fee_result["total_fee"],
        "fee_breakdown": fee_result["breakdown"],
        "net_refund": refund - fee_result["total_fee"],
    }


@router.post("/{settlement_id}/invoice")
async def issue_invoice(
    settlement_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """청구서 발행"""
    result = await db.execute(
        select(TaxFeeSettlement).where(
            and_(
                TaxFeeSettlement.id == settlement_id,
                TaxFeeSettlement.user_id == current_user.id,
            )
        )
    )
    settlement = result.scalar_one_or_none()
    if not settlement:
        raise HTTPException(status_code=404, detail="정산 내역을 찾을 수 없습니다")

    if settlement.invoice_number:
        raise HTTPException(status_code=400, detail="이미 청구서가 발행되었습니다")

    settlement.invoice_number = _generate_invoice_number()
    settlement.invoice_issued_at = datetime.utcnow()
    settlement.invoice_due_date = datetime.utcnow() + timedelta(days=14)
    settlement.status = FeeSettlementStatus.INVOICED
    settlement.updated_at = datetime.utcnow()

    return {
        "id": str(settlement.id),
        "invoice_number": settlement.invoice_number,
        "invoice_issued_at": settlement.invoice_issued_at.isoformat(),
        "invoice_due_date": settlement.invoice_due_date.isoformat(),
        "total_fee": settlement.total_fee,
        "status": "INVOICED",
    }


@router.post("/{settlement_id}/pay")
async def record_payment(
    settlement_id: str,
    payload: PaymentPayload,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """결제 기록"""
    result = await db.execute(
        select(TaxFeeSettlement).where(
            and_(
                TaxFeeSettlement.id == settlement_id,
                TaxFeeSettlement.user_id == current_user.id,
            )
        )
    )
    settlement = result.scalar_one_or_none()
    if not settlement:
        raise HTTPException(status_code=404, detail="정산 내역을 찾을 수 없습니다")

    if settlement.status == FeeSettlementStatus.PAID:
        raise HTTPException(status_code=400, detail="이미 결제 완료된 내역입니다")

    from ....models.tax_fee import PaymentMethod
    try:
        payment_method = PaymentMethod(payload.payment_method)
    except ValueError:
        payment_method = PaymentMethod.BANK_TRANSFER

    settlement.payment_method = payment_method
    settlement.payment_date = datetime.utcnow()
    settlement.payment_reference = payload.payment_reference
    settlement.status = FeeSettlementStatus.PAID
    settlement.updated_at = datetime.utcnow()

    return {
        "id": str(settlement.id),
        "status": "PAID",
        "payment_method": payment_method.value,
        "payment_date": settlement.payment_date.isoformat(),
        "total_fee": settlement.total_fee,
    }


@router.get("/{settlement_id}/receipt")
async def get_receipt(
    settlement_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """영수증 조회/발급"""
    result = await db.execute(
        select(TaxFeeSettlement).where(
            and_(
                TaxFeeSettlement.id == settlement_id,
                TaxFeeSettlement.user_id == current_user.id,
            )
        )
    )
    settlement = result.scalar_one_or_none()
    if not settlement:
        raise HTTPException(status_code=404, detail="정산 내역을 찾을 수 없습니다")

    if settlement.status != FeeSettlementStatus.PAID:
        raise HTTPException(status_code=400, detail="결제 완료 후 영수증을 발급받을 수 있습니다")

    if not settlement.receipt_number:
        settlement.receipt_number = _generate_receipt_number()
        settlement.receipt_issued_at = datetime.utcnow()
        settlement.updated_at = datetime.utcnow()

    return {
        "id": str(settlement.id),
        "receipt_number": settlement.receipt_number,
        "receipt_issued_at": settlement.receipt_issued_at.isoformat() if settlement.receipt_issued_at else None,
        "total_fee": settlement.total_fee,
        "base_fee": settlement.base_fee,
        "vat": settlement.vat,
        "payment_method": settlement.payment_method.value if settlement.payment_method else None,
        "payment_date": settlement.payment_date.isoformat() if settlement.payment_date else None,
        "fee_breakdown": settlement.fee_breakdown,
    }
