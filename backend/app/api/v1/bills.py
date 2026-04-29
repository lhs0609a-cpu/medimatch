"""수납(Bill) + 결제(Payment) API"""
import logging
from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, and_, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..deps import get_db, get_current_active_user
from ...models.user import User
from ...models.bill import Bill, BillItem, EmrPayment, BillStatus, PaymentMethod
from ...schemas.emr_core import (
    BillCreate, BillOut, PaymentIn, PaymentOut,
)

logger = logging.getLogger(__name__)
router = APIRouter()


def _generate_bill_no(user_id: UUID) -> str:
    today = datetime.utcnow().strftime("%Y%m%d")
    suffix = str(user_id)[:6].upper()
    micro = datetime.utcnow().strftime("%H%M%S%f")[:9]
    return f"B-{today}-{suffix}-{micro}"


def _calc_amounts(items: list, discount: int) -> dict:
    """건강보험 본인부담률 + 비급여 분리하여 청구 금액 계산."""
    subtotal = 0
    insurance = 0
    patient = 0
    non_covered = 0

    for it in items:
        total = it.unit_price * it.quantity if not getattr(it, "total_price", None) else it.total_price
        subtotal += total
        if it.insurance_covered:
            copay = int(total * it.copay_rate)
            patient += copay
            insurance += total - copay
        else:
            non_covered += total
            patient += total

    final = max(0, patient + non_covered - discount)
    return {
        "subtotal": subtotal,
        "insurance_amount": insurance,
        "patient_amount": patient,
        "non_covered_amount": non_covered,
        "discount_amount": discount,
        "final_amount": final,
    }


@router.post("", response_model=BillOut, status_code=status.HTTP_201_CREATED)
async def create_bill(
    payload: BillCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """청구서 생성 (보험·본인·비급여 자동 분리)."""
    amounts = _calc_amounts(payload.items, payload.discount_amount)

    bill = Bill(
        user_id=current_user.id,
        visit_id=payload.visit_id,
        patient_id=payload.patient_id,
        bill_no=_generate_bill_no(current_user.id),
        bill_date=payload.bill_date,
        memo=payload.memo,
        status=BillStatus.ISSUED,
        issued_at=datetime.utcnow(),
        balance=amounts["final_amount"],
        **amounts,
    )
    db.add(bill)
    await db.flush()

    for it in payload.items:
        total = it.unit_price * it.quantity
        db.add(BillItem(
            bill_id=bill.id,
            item_type=it.item_type,
            code=it.code,
            name=it.name,
            quantity=it.quantity,
            unit_price=it.unit_price,
            total_price=total,
            insurance_covered=it.insurance_covered,
            copay_rate=it.copay_rate,
        ))

    await db.commit()
    await db.refresh(bill, ["items", "payments"])
    return bill


@router.get("", response_model=List[BillOut])
async def list_bills(
    patient_id: Optional[UUID] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    q = (
        select(Bill)
        .where(Bill.user_id == current_user.id)
        .options(selectinload(Bill.items), selectinload(Bill.payments))
        .order_by(desc(Bill.bill_date), desc(Bill.created_at))
    )
    if patient_id:
        q = q.where(Bill.patient_id == patient_id)
    if status_filter:
        q = q.where(Bill.status == status_filter)
    if date_from:
        q = q.where(Bill.bill_date >= date_from)
    if date_to:
        q = q.where(Bill.bill_date <= date_to)
    q = q.offset((page - 1) * page_size).limit(page_size)
    res = await db.execute(q)
    return res.scalars().all()


@router.get("/{bill_id}", response_model=BillOut)
async def get_bill(
    bill_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    q = (
        select(Bill)
        .where(and_(Bill.id == bill_id, Bill.user_id == current_user.id))
        .options(selectinload(Bill.items), selectinload(Bill.payments))
    )
    bill = (await db.execute(q)).scalar_one_or_none()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    return bill


@router.post("/{bill_id}/payments", response_model=BillOut)
async def add_payment(
    bill_id: UUID,
    payment: PaymentIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """결제 입력 — 부분 결제 누적, 잔액 자동 계산."""
    q = (
        select(Bill)
        .where(and_(Bill.id == bill_id, Bill.user_id == current_user.id))
        .options(selectinload(Bill.items), selectinload(Bill.payments))
    )
    bill = (await db.execute(q)).scalar_one_or_none()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    if bill.status == BillStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="취소된 청구서에는 결제할 수 없습니다.")

    if payment.amount <= 0:
        raise HTTPException(status_code=400, detail="결제 금액은 양수여야 합니다.")

    if payment.amount > bill.balance:
        raise HTTPException(
            status_code=400,
            detail=f"잔액 ({bill.balance}원)을 초과하는 결제는 불가합니다.",
        )

    pay = EmrPayment(
        bill_id=bill.id,
        amount=payment.amount,
        method=payment.method,
        transaction_id=payment.transaction_id,
        card_last4=payment.card_last4,
        card_company=payment.card_company,
        received_by=payment.received_by or (current_user.name or ""),
        note=payment.note,
    )
    db.add(pay)

    bill.paid_amount = (bill.paid_amount or 0) + payment.amount
    bill.balance = max(0, bill.final_amount - bill.paid_amount)
    if bill.balance == 0:
        bill.status = BillStatus.PAID
        bill.completed_at = datetime.utcnow()
    elif bill.paid_amount > 0:
        bill.status = BillStatus.PARTIAL

    await db.commit()
    await db.refresh(bill, ["items", "payments"])
    return bill


@router.post("/{bill_id}/refund", response_model=BillOut)
async def refund_bill(
    bill_id: UUID,
    amount: int,
    reason: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """환불 처리 (음수 결제 레코드 추가)."""
    q = (
        select(Bill)
        .where(and_(Bill.id == bill_id, Bill.user_id == current_user.id))
        .options(selectinload(Bill.items), selectinload(Bill.payments))
    )
    bill = (await db.execute(q)).scalar_one_or_none()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    if amount <= 0 or amount > bill.paid_amount:
        raise HTTPException(status_code=400, detail="환불 금액이 받은 금액을 초과할 수 없습니다.")

    db.add(EmrPayment(
        bill_id=bill.id,
        amount=-amount,
        method=PaymentMethod.OTHER,
        is_refund=True,
        refund_reason=reason,
        received_by=current_user.name or "",
    ))
    bill.paid_amount -= amount
    bill.balance = bill.final_amount - bill.paid_amount
    bill.status = BillStatus.REFUNDED if bill.paid_amount == 0 else BillStatus.PARTIAL
    await db.commit()
    await db.refresh(bill, ["items", "payments"])
    return bill


@router.post("/{bill_id}/cancel", response_model=BillOut)
async def cancel_bill(
    bill_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    q = (
        select(Bill)
        .where(and_(Bill.id == bill_id, Bill.user_id == current_user.id))
        .options(selectinload(Bill.items), selectinload(Bill.payments))
    )
    bill = (await db.execute(q)).scalar_one_or_none()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    if bill.paid_amount > 0:
        raise HTTPException(status_code=400, detail="이미 결제된 청구서는 환불 후 취소.")
    bill.status = BillStatus.CANCELLED
    await db.commit()
    await db.refresh(bill, ["items", "payments"])
    return bill


@router.get("/stats/summary")
async def bill_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """수납 통계: 오늘/이달 수금액 + 미수금."""
    today = date.today()
    month_start = today.replace(day=1)

    today_paid = (await db.execute(
        select(func.coalesce(func.sum(EmrPayment.amount), 0))
        .join(Bill, Bill.id == EmrPayment.bill_id)
        .where(and_(
            Bill.user_id == current_user.id,
            func.date(EmrPayment.received_at) == today,
        ))
    )).scalar() or 0

    month_paid = (await db.execute(
        select(func.coalesce(func.sum(EmrPayment.amount), 0))
        .join(Bill, Bill.id == EmrPayment.bill_id)
        .where(and_(
            Bill.user_id == current_user.id,
            func.date(EmrPayment.received_at) >= month_start,
        ))
    )).scalar() or 0

    outstanding = (await db.execute(
        select(func.coalesce(func.sum(Bill.balance), 0))
        .where(and_(
            Bill.user_id == current_user.id,
            Bill.status.in_([BillStatus.ISSUED, BillStatus.PARTIAL]),
        ))
    )).scalar() or 0

    return {
        "today_revenue": today_paid,
        "month_revenue": month_paid,
        "outstanding": outstanding,
        "as_of": datetime.utcnow().isoformat(),
    }
