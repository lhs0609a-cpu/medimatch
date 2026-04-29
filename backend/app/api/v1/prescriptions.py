"""처방전(Prescription) API + DUR 안전 체크"""
import logging
from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..deps import get_db, get_current_active_user
from ...models.user import User
from ...models.prescription import Prescription, PrescriptionItem, PrescriptionStatus
from ...schemas.emr_core import (
    PrescriptionCreate, PrescriptionOut,
)

logger = logging.getLogger(__name__)
router = APIRouter()


# DUR 규칙 (간이) — 임신부/연령/병용금기/과량
DUR_RULES = {
    # ingredient or drug_name keyword → warning
    "이부프로펜": "임신 32주 이후 투여 금기. 출혈 환자 주의.",
    "케토프로펜": "위장관 출혈 병력 환자 금기.",
    "아스피린": "16세 미만 라이증후군 위험. 와파린 병용 시 출혈 주의.",
    "와파린": "비스테로이드성 소염제(NSAIDs) 병용 시 출혈 위험 ↑.",
    "트라마돌": "MAOI 병용 금기 — 세로토닌 증후군 위험.",
    "코데인": "12세 미만 사용 금지. 호흡억제 위험.",
    "독시사이클린": "8세 미만 사용 금지 (치아 착색).",
    "시프로플록사신": "18세 미만 사용 시 연골 발달 영향 가능.",
    "메토트렉세이트": "NSAIDs/페니실린 병용 시 독성 ↑.",
}


def _generate_rx_no(user_id: UUID) -> str:
    today = datetime.utcnow().strftime("%Y%m%d")
    suffix = str(user_id)[:6].upper()
    micro = datetime.utcnow().strftime("%H%M%S%f")[:9]
    return f"RX-{today}-{suffix}-{micro}"


def _dur_check(items: List) -> tuple[List[dict], dict]:
    """간이 DUR 체크 — 성분별 경고 + 동일 성분 중복 검사."""
    warnings = []
    item_warnings = {}
    seen_drugs = {}

    for i, item in enumerate(items):
        warning_for_item = []
        # 성분 키워드 검사
        keys_to_check = [item.drug_name or "", item.ingredient or ""]
        for key in keys_to_check:
            for trigger, msg in DUR_RULES.items():
                if trigger in key:
                    warning_for_item.append(msg)
                    warnings.append({
                        "type": "rule",
                        "drug": item.drug_name,
                        "trigger": trigger,
                        "message": msg,
                    })
        # 동일 약품 중복
        norm = (item.drug_name or "").strip()
        if norm:
            if norm in seen_drugs:
                msg = f"동일 약품 중복 처방: {norm}"
                warning_for_item.append(msg)
                warnings.append({"type": "duplicate", "drug": norm, "message": msg})
            seen_drugs[norm] = i
        if warning_for_item:
            item_warnings[i] = "; ".join(warning_for_item)

    return warnings, item_warnings


@router.post("/dur-check")
async def dur_check_only(
    payload: PrescriptionCreate,
    current_user: User = Depends(get_current_active_user),
):
    """처방전 저장 전 DUR 안전 체크만 수행."""
    warnings, item_warnings = _dur_check(payload.items)
    return {
        "ok": len(warnings) == 0,
        "warnings": warnings,
        "item_warnings": item_warnings,
    }


@router.post("", response_model=PrescriptionOut, status_code=status.HTTP_201_CREATED)
async def create_prescription(
    payload: PrescriptionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """처방전 발행 — DUR 자동 체크 + 총액 계산."""
    warnings, item_warnings = _dur_check(payload.items)

    rx = Prescription(
        user_id=current_user.id,
        visit_id=payload.visit_id,
        patient_id=payload.patient_id,
        prescription_no=_generate_rx_no(current_user.id),
        prescribed_date=payload.prescribed_date,
        doctor_id=current_user.id,
        doctor_name=payload.doctor_name or current_user.name,
        pharmacy_name=payload.pharmacy_name,
        duration_days=payload.duration_days,
        patient_note=payload.patient_note,
        dur_warnings=warnings,
    )
    db.add(rx)
    await db.flush()

    total_amount = 0
    for i, item in enumerate(payload.items):
        total_qty = item.total_quantity or (
            item.dose_per_time * item.frequency_per_day * item.duration_days
        )
        total_price = item.total_price or int(item.unit_price * total_qty)
        db.add(PrescriptionItem(
            prescription_id=rx.id,
            drug_code=item.drug_code,
            drug_name=item.drug_name,
            ingredient=item.ingredient,
            dose_per_time=item.dose_per_time,
            dose_unit=item.dose_unit,
            frequency_per_day=item.frequency_per_day,
            duration_days=item.duration_days,
            total_quantity=total_qty,
            unit_price=item.unit_price,
            total_price=total_price,
            usage_note=item.usage_note,
            warning=item_warnings.get(i),
        ))
        total_amount += total_price

    rx.total_amount = total_amount
    await db.commit()
    await db.refresh(rx, ["items"])
    return rx


@router.get("", response_model=List[PrescriptionOut])
async def list_prescriptions(
    patient_id: Optional[UUID] = None,
    visit_id: Optional[UUID] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    q = (
        select(Prescription)
        .where(Prescription.user_id == current_user.id)
        .options(selectinload(Prescription.items))
        .order_by(desc(Prescription.prescribed_date))
    )
    if patient_id:
        q = q.where(Prescription.patient_id == patient_id)
    if visit_id:
        q = q.where(Prescription.visit_id == visit_id)
    if date_from:
        q = q.where(Prescription.prescribed_date >= date_from)
    if date_to:
        q = q.where(Prescription.prescribed_date <= date_to)
    q = q.offset((page - 1) * page_size).limit(page_size)
    res = await db.execute(q)
    return res.scalars().all()


@router.get("/{rx_id}", response_model=PrescriptionOut)
async def get_prescription(
    rx_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    q = (
        select(Prescription)
        .where(and_(Prescription.id == rx_id, Prescription.user_id == current_user.id))
        .options(selectinload(Prescription.items))
    )
    rx = (await db.execute(q)).scalar_one_or_none()
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found")
    return rx


@router.post("/{rx_id}/cancel", response_model=PrescriptionOut)
async def cancel_prescription(
    rx_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    q = (
        select(Prescription)
        .where(and_(Prescription.id == rx_id, Prescription.user_id == current_user.id))
        .options(selectinload(Prescription.items))
    )
    rx = (await db.execute(q)).scalar_one_or_none()
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found")
    rx.status = PrescriptionStatus.CANCELLED
    await db.commit()
    await db.refresh(rx, ["items"])
    return rx
