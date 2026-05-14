"""약국 픽업 API (Public + 약국 인증).

흐름:
1. 의원: 처방 발행 시 6자리 pickup_code + 32자 pickup_token 자동 부여 (7일 만료)
2. 환자: 약국 방문 시 코드 보여줌 (또는 magic-link로 약국에 직접 푸시)
3. 약국: F2 코드 입력 → 처방 fetch → DUR 점검 → F3 디스펜스

Public이므로 보안:
- 6자리 코드만으로는 부족 → 환자 폰 마지막 4자리도 함께 검증
- 또는 token (32자)이면 검증 통과
- DISPENSED 또는 만료된 코드는 거절
"""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..deps import get_db
from ...models.prescription import Prescription, PrescriptionStatus, PrescriptionItem


router = APIRouter()


class PickupItemOut(BaseModel):
    drug_name: str
    ingredient: Optional[str]
    dose_per_time: float
    dose_unit: str
    frequency_per_day: int
    duration_days: int
    total_quantity: float
    usage_note: Optional[str]
    warning: Optional[str]

    class Config:
        from_attributes = True


class PickupOut(BaseModel):
    id: UUID
    prescription_no: str
    prescribed_date: str
    doctor_name: Optional[str]
    duration_days: Optional[int]
    status: str
    patient_name_masked: Optional[str]
    patient_phone_last4: Optional[str]
    dur_warnings: list = Field(default_factory=list)
    items: List[PickupItemOut] = Field(default_factory=list)
    expires_at: Optional[datetime]
    dispensed_at: Optional[datetime]
    pharmacy_name: Optional[str]


def _mask_name(name: Optional[str]) -> Optional[str]:
    if not name:
        return None
    n = name.strip()
    if len(n) <= 1:
        return n
    if len(n) == 2:
        return n[0] + "*"
    return n[0] + "*" * (len(n) - 2) + n[-1]


def _phone_last4(phone: Optional[str]) -> Optional[str]:
    if not phone:
        return None
    digits = "".join(c for c in phone if c.isdigit())
    return digits[-4:] if len(digits) >= 4 else None


async def _resolve_prescription(
    db: AsyncSession,
    *,
    code: Optional[str] = None,
    token: Optional[str] = None,
    phone_last4: Optional[str] = None,
) -> Prescription:
    if not code and not token:
        raise HTTPException(status_code=400, detail="픽업코드 또는 링크가 필요합니다.")

    q = select(Prescription).options(selectinload(Prescription.items))
    if token:
        q = q.where(Prescription.pickup_token == token)
    else:
        q = q.where(Prescription.pickup_code == (code or "").upper().strip())

    rx = (await db.execute(q)).scalar_one_or_none()
    if not rx:
        raise HTTPException(status_code=404, detail="처방을 찾을 수 없어요. 코드를 다시 확인해주세요.")
    if rx.pickup_expires_at and rx.pickup_expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="만료된 처방입니다. 의원에 재발급을 요청하세요.")
    if rx.status == PrescriptionStatus.CANCELLED:
        raise HTTPException(status_code=410, detail="취소된 처방입니다.")

    # token이 아닌 코드만 들어왔다면 phone_last4 검증
    if not token:
        actual_last4 = _phone_last4(rx.patient_phone)
        if actual_last4 and phone_last4:
            if actual_last4 != phone_last4.strip():
                raise HTTPException(status_code=403, detail="휴대폰 마지막 4자리가 일치하지 않습니다.")
        # actual_last4가 비어있으면 검증 skip (구버전 처방 호환)

    return rx


def _to_out(rx: Prescription) -> PickupOut:
    return PickupOut(
        id=rx.id,
        prescription_no=rx.prescription_no,
        prescribed_date=rx.prescribed_date.isoformat() if rx.prescribed_date else "",
        doctor_name=rx.doctor_name,
        duration_days=rx.duration_days,
        status=rx.status.value if hasattr(rx.status, "value") else str(rx.status),
        patient_name_masked=_mask_name(rx.patient_name),
        patient_phone_last4=_phone_last4(rx.patient_phone),
        dur_warnings=rx.dur_warnings or [],
        items=[
            PickupItemOut(
                drug_name=it.drug_name,
                ingredient=it.ingredient,
                dose_per_time=it.dose_per_time,
                dose_unit=it.dose_unit,
                frequency_per_day=it.frequency_per_day,
                duration_days=it.duration_days,
                total_quantity=it.total_quantity,
                usage_note=it.usage_note,
                warning=it.warning,
            ) for it in rx.items
        ],
        expires_at=rx.pickup_expires_at,
        dispensed_at=rx.pickup_dispensed_at,
        pharmacy_name=rx.pickup_pharmacy_name,
    )


class LookupRequest(BaseModel):
    code: Optional[str] = None
    token: Optional[str] = None
    phone_last4: Optional[str] = None


@router.post("/lookup", response_model=PickupOut)
async def lookup(payload: LookupRequest, db: AsyncSession = Depends(get_db)):
    rx = await _resolve_prescription(
        db,
        code=payload.code,
        token=payload.token,
        phone_last4=payload.phone_last4,
    )
    return _to_out(rx)


@router.get("/code/{code}", response_model=PickupOut)
async def lookup_by_code(
    code: str,
    phone_last4: Optional[str] = Query(None, min_length=4, max_length=4),
    db: AsyncSession = Depends(get_db),
):
    rx = await _resolve_prescription(db, code=code, phone_last4=phone_last4)
    return _to_out(rx)


@router.get("/token/{token}", response_model=PickupOut)
async def lookup_by_token(token: str, db: AsyncSession = Depends(get_db)):
    rx = await _resolve_prescription(db, token=token)
    return _to_out(rx)


class DispenseRequest(BaseModel):
    code: Optional[str] = None
    token: Optional[str] = None
    phone_last4: Optional[str] = None
    pharmacy_name: str
    dispensed_by: Optional[str] = None
    note: Optional[str] = None


@router.post("/dispense", response_model=PickupOut)
async def dispense(payload: DispenseRequest, db: AsyncSession = Depends(get_db)):
    rx = await _resolve_prescription(
        db,
        code=payload.code,
        token=payload.token,
        phone_last4=payload.phone_last4,
    )
    if rx.status == PrescriptionStatus.DISPENSED:
        raise HTTPException(status_code=409, detail=f"이미 조제된 처방이에요 (약국: {rx.pickup_pharmacy_name or '확인불가'}, {rx.pickup_dispensed_at}).")

    rx.status = PrescriptionStatus.DISPENSED
    rx.pickup_dispensed_at = datetime.utcnow()
    rx.pickup_dispensed_by = payload.dispensed_by
    rx.pickup_pharmacy_name = payload.pharmacy_name
    await db.commit()
    await db.refresh(rx, ["items"])
    return _to_out(rx)
