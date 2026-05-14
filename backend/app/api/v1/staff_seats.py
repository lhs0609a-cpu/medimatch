"""직원 ID 관리 + 청구 미리보기.

가격 정책 (의원급 SaaS 표준):
- 첫 1ID (원장 본인) 무료
- 추가 ID당 39,000원/월
- 5ID 이상 묶음 할인: 추가 ID당 29,000원/월
- 10ID 이상: 19,000원/월

  GET    /staff-seats                 — 직원 목록 + 청구 미리보기
  POST   /staff-seats                 — 직원 추가
  PATCH  /staff-seats/{id}            — 수정 (역할/상태/billable)
  DELETE /staff-seats/{id}            — 비활성 (실제 row 유지)
  GET    /staff-seats/billing-preview — 다음 달 청구 시뮬레이션
"""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..deps import get_db, get_current_active_user
from ...models.user import User
from ...models.staff_seat import StaffSeat, StaffRole, StaffStatus


router = APIRouter()


# ─── 가격 정책 ───
PRICE_FIRST_FREE = 1
PRICE_TIER_1 = 39000   # 2~4 ID
PRICE_TIER_5 = 29000   # 5~9 ID
PRICE_TIER_10 = 19000  # 10+ ID

ROLE_LABELS = {
    "OWNER": "원장",
    "DOCTOR": "의사",
    "NURSE": "간호사",
    "COORDINATOR": "상담실장",
    "RECEPTION": "데스크",
    "ASSISTANT": "보조",
    "PHARMACIST": "약사",
    "OTHER": "기타",
}


def _calc_billing(billable_count: int) -> dict:
    """ID 수 → 월 청구액."""
    chargeable = max(0, billable_count - PRICE_FIRST_FREE)
    breakdown: List[dict] = []
    total = 0

    if chargeable == 0:
        return {
            "billable_seats": billable_count,
            "free_seats": min(billable_count, PRICE_FIRST_FREE),
            "chargeable_seats": 0,
            "monthly_total": 0,
            "breakdown": [],
            "next_tier_at": 2,
            "next_tier_price": PRICE_TIER_1,
        }

    # Tier 분배
    tier1 = min(chargeable, 3)         # 2~4 (3개)
    tier2 = min(max(0, chargeable - 3), 5)   # 5~9 (5개)
    tier3 = max(0, chargeable - 8)     # 10+

    if tier1 > 0:
        amt = tier1 * PRICE_TIER_1
        breakdown.append({"label": "추가 1~3 ID", "count": tier1, "unit_price": PRICE_TIER_1, "amount": amt})
        total += amt
    if tier2 > 0:
        amt = tier2 * PRICE_TIER_5
        breakdown.append({"label": "5~9번째 ID (묶음 할인)", "count": tier2, "unit_price": PRICE_TIER_5, "amount": amt})
        total += amt
    if tier3 > 0:
        amt = tier3 * PRICE_TIER_10
        breakdown.append({"label": "10+ ID (대형 할인)", "count": tier3, "unit_price": PRICE_TIER_10, "amount": amt})
        total += amt

    next_tier_at = None
    next_tier_price = None
    if billable_count < 5:
        next_tier_at = 5
        next_tier_price = PRICE_TIER_5
    elif billable_count < 10:
        next_tier_at = 10
        next_tier_price = PRICE_TIER_10

    return {
        "billable_seats": billable_count,
        "free_seats": min(billable_count, PRICE_FIRST_FREE),
        "chargeable_seats": chargeable,
        "monthly_total": total,
        "breakdown": breakdown,
        "next_tier_at": next_tier_at,
        "next_tier_price": next_tier_price,
    }


# ─── Schemas ───
class SeatCreate(BaseModel):
    name: str
    role: str = "OTHER"
    email: Optional[str] = None
    phone: Optional[str] = None
    license_no: Optional[str] = None
    memo: Optional[str] = None
    billable: bool = True


class SeatUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    license_no: Optional[str] = None
    memo: Optional[str] = None
    billable: Optional[bool] = None
    status: Optional[str] = None


class SeatOut(BaseModel):
    id: UUID
    name: str
    role: str
    role_label: str
    status: str
    email: Optional[str]
    phone: Optional[str]
    license_no: Optional[str]
    memo: Optional[str]
    billable: bool
    added_at: Optional[datetime]
    deactivated_at: Optional[datetime]


class SeatListOut(BaseModel):
    seats: List[SeatOut]
    billing: dict


def _to_out(s: StaffSeat) -> SeatOut:
    role = s.role.value if hasattr(s.role, "value") else str(s.role)
    return SeatOut(
        id=s.id,
        name=s.name,
        role=role,
        role_label=ROLE_LABELS.get(role, role),
        status=s.status.value if hasattr(s.status, "value") else str(s.status),
        email=s.email,
        phone=s.phone,
        license_no=s.license_no,
        memo=s.memo,
        billable=s.billable,
        added_at=s.added_at,
        deactivated_at=s.deactivated_at,
    )


async def _ensure_owner_seat(db: AsyncSession, owner: User) -> None:
    """원장 본인 seat가 없으면 자동 생성 (첫 진입 시 1ID 무료)."""
    q = select(StaffSeat).where(and_(
        StaffSeat.owner_user_id == owner.id,
        StaffSeat.role == StaffRole.OWNER,
    )).limit(1)
    if (await db.execute(q)).scalar_one_or_none():
        return
    s = StaffSeat(
        owner_user_id=owner.id,
        linked_user_id=owner.id,
        name=owner.name or owner.email or "원장",
        role=StaffRole.OWNER,
        status=StaffStatus.ACTIVE,
        email=owner.email,
        billable=True,
    )
    db.add(s)
    await db.commit()


async def _count_billable(db: AsyncSession, owner_id) -> int:
    q = select(func.count(StaffSeat.id)).where(and_(
        StaffSeat.owner_user_id == owner_id,
        StaffSeat.status == StaffStatus.ACTIVE,
        StaffSeat.billable == True,    # noqa: E712
    ))
    return (await db.execute(q)).scalar_one() or 0


@router.get("", response_model=SeatListOut)
async def list_seats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await _ensure_owner_seat(db, current_user)
    q = select(StaffSeat).where(StaffSeat.owner_user_id == current_user.id).order_by(StaffSeat.added_at.asc())
    seats = list((await db.execute(q)).scalars().all())
    billable_count = sum(1 for s in seats if s.status == StaffStatus.ACTIVE and s.billable)
    return SeatListOut(
        seats=[_to_out(s) for s in seats],
        billing=_calc_billing(billable_count),
    )


@router.post("", response_model=SeatOut, status_code=201)
async def create_seat(
    payload: SeatCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await _ensure_owner_seat(db, current_user)
    try:
        role = StaffRole(payload.role.upper())
    except ValueError:
        role = StaffRole.OTHER

    s = StaffSeat(
        owner_user_id=current_user.id,
        name=payload.name,
        role=role,
        status=StaffStatus.ACTIVE,
        email=payload.email,
        phone=payload.phone,
        license_no=payload.license_no,
        memo=payload.memo,
        billable=payload.billable,
    )
    db.add(s)
    await db.commit()
    await db.refresh(s)
    return _to_out(s)


@router.patch("/{seat_id}", response_model=SeatOut)
async def update_seat(
    seat_id: UUID,
    payload: SeatUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    q = select(StaffSeat).where(and_(
        StaffSeat.id == seat_id,
        StaffSeat.owner_user_id == current_user.id,
    ))
    s = (await db.execute(q)).scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="직원을 찾을 수 없습니다.")

    data = payload.model_dump(exclude_unset=True)
    if "role" in data and data["role"]:
        try:
            s.role = StaffRole(data.pop("role").upper())
        except ValueError:
            data.pop("role", None)
    if "status" in data and data["status"]:
        try:
            new_status = StaffStatus(data.pop("status").upper())
            if new_status == StaffStatus.INACTIVE and s.status == StaffStatus.ACTIVE:
                s.deactivated_at = datetime.utcnow()
            elif new_status == StaffStatus.ACTIVE:
                s.deactivated_at = None
            s.status = new_status
        except ValueError:
            data.pop("status", None)
    for k, v in data.items():
        setattr(s, k, v)
    await db.commit()
    await db.refresh(s)
    return _to_out(s)


@router.delete("/{seat_id}", status_code=204)
async def deactivate_seat(
    seat_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    q = select(StaffSeat).where(and_(
        StaffSeat.id == seat_id,
        StaffSeat.owner_user_id == current_user.id,
    ))
    s = (await db.execute(q)).scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="직원을 찾을 수 없습니다.")
    if s.role == StaffRole.OWNER:
        raise HTTPException(status_code=400, detail="원장 ID는 비활성화할 수 없습니다.")
    s.status = StaffStatus.INACTIVE
    s.deactivated_at = datetime.utcnow()
    await db.commit()


@router.get("/billing-preview")
async def billing_preview(
    add_count: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """현재 ID 수 + 추가 시뮬레이션."""
    await _ensure_owner_seat(db, current_user)
    current = await _count_billable(db, current_user.id)
    after = current + max(0, add_count)
    return {
        "current": _calc_billing(current),
        "after_add": _calc_billing(after) if add_count > 0 else None,
    }
