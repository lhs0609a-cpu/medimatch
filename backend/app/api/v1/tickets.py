"""
시술 회차권 (티켓) API — 미용/피부/성형 의원 매출 핵심 모듈.

라우트:
- 패키지 정의: GET/POST /packages, PATCH/DELETE /packages/{id}
- 환자 회차권: POST /tickets (발급), GET /tickets, GET /patients/{pid}/tickets,
              POST /tickets/{id}/use (회차 차감), POST /tickets/{id}/void-usage/{usage_id},
              POST /tickets/{id}/extend (기간 연장), POST /tickets/{id}/cancel
- 사용 이력: GET /tickets/{id}/usages
"""
from datetime import date, datetime, timedelta
from typing import Optional
import uuid
import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..deps import get_db, get_current_active_user
from .service_guards import require_active_service
from ...models.user import User
from ...models.service_subscription import ServiceSubscription, ServiceType
from ...models.patient import Patient
from ...models.treatment_ticket import (
    TreatmentPackage, PatientTicket, TicketUsage,
    PackageCategory, TicketStatus,
)

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================================
# Schemas
# ============================================================

class PackageCreate(BaseModel):
    name: str
    short_code: Optional[str] = None
    category: str = "OTHER"
    total_sessions: int = Field(gt=0)
    price: int = 0
    taxable: bool = True
    default_validity_days: int = 365
    description: Optional[str] = None
    procedure_codes: list[str] = []


class PackageUpdate(BaseModel):
    name: Optional[str] = None
    short_code: Optional[str] = None
    category: Optional[str] = None
    total_sessions: Optional[int] = None
    price: Optional[int] = None
    taxable: Optional[bool] = None
    default_validity_days: Optional[int] = None
    description: Optional[str] = None
    procedure_codes: Optional[list[str]] = None
    is_active: Optional[bool] = None


class TicketIssue(BaseModel):
    patient_id: str
    package_id: str
    purchased_price: Optional[int] = None       # 미입력 시 패키지 가격
    expires_at: Optional[date] = None            # 미입력 시 default_validity_days 기준
    note: Optional[str] = None


class TicketUse(BaseModel):
    visit_id: Optional[str] = None
    sessions_used: int = 1
    note: Optional[str] = None


class TicketExtend(BaseModel):
    days_added: int = Field(gt=0)
    reason: Optional[str] = None


# ============================================================
# Helpers
# ============================================================

def _package_to_dict(p: TreatmentPackage) -> dict:
    return {
        "id": str(p.id),
        "name": p.name,
        "short_code": p.short_code,
        "category": p.category.value if p.category else "OTHER",
        "total_sessions": p.total_sessions,
        "price": p.price,
        "taxable": p.taxable,
        "default_validity_days": p.default_validity_days,
        "description": p.description,
        "procedure_codes": p.procedure_codes or [],
        "is_active": p.is_active,
        "created_at": p.created_at.isoformat() if p.created_at else None,
    }


def _ticket_to_dict(t: PatientTicket, *, with_package: bool = False) -> dict:
    out = {
        "id": str(t.id),
        "patient_id": str(t.patient_id),
        "package_id": str(t.package_id),
        "ticket_no": t.ticket_no,
        "purchased_at": t.purchased_at.isoformat() if t.purchased_at else None,
        "purchased_price": t.purchased_price,
        "expires_at": t.expires_at.isoformat() if t.expires_at else None,
        "total_sessions": t.total_sessions,
        "used_sessions": t.used_sessions,
        "remaining_sessions": max(0, t.total_sessions - (t.used_sessions or 0)),
        "status": t.status.value if t.status else "ACTIVE",
        "note": t.note,
        "extension_history": t.extension_history or [],
        "is_expired": bool(t.expires_at and t.expires_at < date.today()),
    }
    if with_package and t.package:
        out["package"] = _package_to_dict(t.package)
    return out


def _generate_ticket_no(short_code: Optional[str], seq: int) -> str:
    prefix = (short_code or "TK").upper()[:6]
    return f"{prefix}-{datetime.utcnow().strftime('%y%m')}-{seq:05d}"


# ============================================================
# Packages CRUD
# ============================================================

@router.get("/packages")
async def list_packages(
    include_inactive: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    q = select(TreatmentPackage).where(and_(
        TreatmentPackage.user_id == current_user.id,
        TreatmentPackage.deleted_at.is_(None),
    ))
    if not include_inactive:
        q = q.where(TreatmentPackage.is_active.is_(True))
    res = await db.execute(q.order_by(TreatmentPackage.category, TreatmentPackage.name))
    return [_package_to_dict(p) for p in res.scalars().all()]


@router.post("/packages")
async def create_package(
    body: PackageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    try:
        cat = PackageCategory[body.category]
    except KeyError:
        raise HTTPException(400, f"카테고리 잘못됨: {body.category}")

    p = TreatmentPackage(
        user_id=current_user.id,
        name=body.name,
        short_code=body.short_code,
        category=cat,
        total_sessions=body.total_sessions,
        price=body.price,
        taxable=body.taxable,
        default_validity_days=body.default_validity_days,
        description=body.description,
        procedure_codes=body.procedure_codes,
    )
    db.add(p)
    await db.commit()
    await db.refresh(p)
    return _package_to_dict(p)


@router.patch("/packages/{pkg_id}")
async def update_package(
    pkg_id: str,
    body: PackageUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    try:
        pid = uuid.UUID(pkg_id)
    except ValueError:
        raise HTTPException(400, "잘못된 id")
    res = await db.execute(select(TreatmentPackage).where(and_(
        TreatmentPackage.id == pid,
        TreatmentPackage.user_id == current_user.id,
        TreatmentPackage.deleted_at.is_(None),
    )))
    p = res.scalar_one_or_none()
    if not p:
        raise HTTPException(404, "패키지를 찾을 수 없습니다")

    updates = body.model_dump(exclude_unset=True)
    if "category" in updates:
        try:
            updates["category"] = PackageCategory[updates["category"]]
        except KeyError:
            raise HTTPException(400, f"카테고리 잘못됨: {updates['category']}")
    for k, v in updates.items():
        setattr(p, k, v)
    await db.commit()
    await db.refresh(p)
    return _package_to_dict(p)


@router.delete("/packages/{pkg_id}")
async def delete_package(
    pkg_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    try:
        pid = uuid.UUID(pkg_id)
    except ValueError:
        raise HTTPException(400, "잘못된 id")
    res = await db.execute(select(TreatmentPackage).where(and_(
        TreatmentPackage.id == pid,
        TreatmentPackage.user_id == current_user.id,
    )))
    p = res.scalar_one_or_none()
    if not p:
        raise HTTPException(404, "패키지를 찾을 수 없습니다")
    p.deleted_at = datetime.utcnow()
    p.is_active = False
    await db.commit()
    return {"deleted": True, "id": pkg_id}


# ============================================================
# Tickets — issue / use / extend / cancel
# ============================================================

@router.post("/tickets")
async def issue_ticket(
    body: TicketIssue,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """환자에게 회차권 발급."""
    try:
        patient_uuid = uuid.UUID(body.patient_id)
        pkg_uuid = uuid.UUID(body.package_id)
    except ValueError:
        raise HTTPException(400, "id 형식 오류")

    # 패키지 & 환자 확인
    pkg_res = await db.execute(select(TreatmentPackage).where(and_(
        TreatmentPackage.id == pkg_uuid,
        TreatmentPackage.user_id == current_user.id,
        TreatmentPackage.deleted_at.is_(None),
    )))
    pkg = pkg_res.scalar_one_or_none()
    if not pkg:
        raise HTTPException(404, "패키지를 찾을 수 없습니다")

    pt_res = await db.execute(select(Patient).where(and_(
        Patient.id == patient_uuid,
        Patient.user_id == current_user.id,
        Patient.deleted_at.is_(None),
    )))
    patient = pt_res.scalar_one_or_none()
    if not patient:
        raise HTTPException(404, "환자를 찾을 수 없습니다")

    # 시퀀스 — 이 의원의 티켓 총수 + 1
    cnt_res = await db.execute(
        select(func.count(PatientTicket.id)).where(PatientTicket.user_id == current_user.id)
    )
    seq = (cnt_res.scalar() or 0) + 1

    expires_at = body.expires_at
    if not expires_at and pkg.default_validity_days:
        expires_at = (date.today() + timedelta(days=pkg.default_validity_days))

    t = PatientTicket(
        user_id=current_user.id,
        patient_id=patient_uuid,
        package_id=pkg_uuid,
        ticket_no=_generate_ticket_no(pkg.short_code, seq),
        purchased_price=body.purchased_price if body.purchased_price is not None else pkg.price,
        expires_at=expires_at,
        total_sessions=pkg.total_sessions,
        used_sessions=0,
        status=TicketStatus.ACTIVE,
        note=body.note,
    )
    db.add(t)
    await db.commit()
    await db.refresh(t)
    t.package = pkg
    return _ticket_to_dict(t, with_package=True)


@router.get("/tickets")
async def list_tickets(
    patient_id: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    expiring_in_days: Optional[int] = Query(None, ge=0, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """티켓 리스트. patient_id로 필터 가능, status로 필터 가능, 만료 임박 필터."""
    q = select(PatientTicket).where(PatientTicket.user_id == current_user.id)
    if patient_id:
        try:
            q = q.where(PatientTicket.patient_id == uuid.UUID(patient_id))
        except ValueError:
            raise HTTPException(400, "patient_id 형식 오류")
    if status_filter:
        try:
            q = q.where(PatientTicket.status == TicketStatus[status_filter])
        except KeyError:
            raise HTTPException(400, f"status 잘못됨: {status_filter}")
    if expiring_in_days is not None:
        soon = date.today() + timedelta(days=expiring_in_days)
        q = q.where(and_(
            PatientTicket.expires_at.is_not(None),
            PatientTicket.expires_at <= soon,
            PatientTicket.expires_at >= date.today(),
        ))
    res = await db.execute(q.order_by(PatientTicket.purchased_at.desc()))
    tickets = res.scalars().all()

    # 패키지 미리 로드 (N+1 회피)
    pkg_ids = list({t.package_id for t in tickets})
    pkg_map: dict = {}
    if pkg_ids:
        pres = await db.execute(select(TreatmentPackage).where(TreatmentPackage.id.in_(pkg_ids)))
        for p in pres.scalars().all():
            pkg_map[p.id] = p
    out = []
    for t in tickets:
        t.package = pkg_map.get(t.package_id)
        out.append(_ticket_to_dict(t, with_package=True))
    return out


@router.post("/tickets/{ticket_id}/use")
async def use_ticket(
    ticket_id: str,
    body: TicketUse,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """회차 차감 — visit 연동 가능."""
    try:
        tid = uuid.UUID(ticket_id)
    except ValueError:
        raise HTTPException(400, "잘못된 id")

    res = await db.execute(select(PatientTicket).where(and_(
        PatientTicket.id == tid,
        PatientTicket.user_id == current_user.id,
    )))
    t = res.scalar_one_or_none()
    if not t:
        raise HTTPException(404, "티켓을 찾을 수 없습니다")
    if t.status != TicketStatus.ACTIVE:
        raise HTTPException(400, f"활성 상태가 아닙니다: {t.status.value}")
    if t.expires_at and t.expires_at < date.today():
        t.status = TicketStatus.EXPIRED
        await db.commit()
        raise HTTPException(400, "이미 만료된 티켓입니다")

    remaining = t.total_sessions - (t.used_sessions or 0)
    if body.sessions_used > remaining:
        raise HTTPException(400, f"잔여 {remaining}회 — {body.sessions_used}회 사용 불가")

    visit_uuid = None
    if body.visit_id:
        try:
            visit_uuid = uuid.UUID(body.visit_id)
        except ValueError:
            raise HTTPException(400, "visit_id 형식 오류")

    usage = TicketUsage(
        ticket_id=tid,
        visit_id=visit_uuid,
        sessions_used=body.sessions_used,
        note=body.note,
    )
    db.add(usage)
    t.used_sessions = (t.used_sessions or 0) + body.sessions_used
    if t.used_sessions >= t.total_sessions:
        t.status = TicketStatus.USED_UP

    await db.commit()
    await db.refresh(t)
    await db.refresh(usage)
    return {
        "ticket": _ticket_to_dict(t),
        "usage_id": usage.id,
        "used_at": usage.used_at.isoformat(),
    }


@router.post("/tickets/{ticket_id}/void-usage/{usage_id}")
async def void_usage(
    ticket_id: str,
    usage_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """사용 취소 — 차감 복원."""
    try:
        tid = uuid.UUID(ticket_id)
    except ValueError:
        raise HTTPException(400, "잘못된 id")

    tk_res = await db.execute(select(PatientTicket).where(and_(
        PatientTicket.id == tid,
        PatientTicket.user_id == current_user.id,
    )))
    t = tk_res.scalar_one_or_none()
    if not t:
        raise HTTPException(404, "티켓을 찾을 수 없습니다")

    u_res = await db.execute(select(TicketUsage).where(and_(
        TicketUsage.id == usage_id,
        TicketUsage.ticket_id == tid,
    )))
    u = u_res.scalar_one_or_none()
    if not u:
        raise HTTPException(404, "사용 기록을 찾을 수 없습니다")
    if u.voided:
        raise HTTPException(400, "이미 취소된 기록입니다")

    u.voided = True
    t.used_sessions = max(0, (t.used_sessions or 0) - (u.sessions_used or 0))
    if t.status == TicketStatus.USED_UP and t.used_sessions < t.total_sessions:
        t.status = TicketStatus.ACTIVE
    await db.commit()
    return {"voided": True, "ticket": _ticket_to_dict(t)}


@router.post("/tickets/{ticket_id}/extend")
async def extend_ticket(
    ticket_id: str,
    body: TicketExtend,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """티켓 만료일 연장."""
    try:
        tid = uuid.UUID(ticket_id)
    except ValueError:
        raise HTTPException(400, "잘못된 id")
    res = await db.execute(select(PatientTicket).where(and_(
        PatientTicket.id == tid,
        PatientTicket.user_id == current_user.id,
    )))
    t = res.scalar_one_or_none()
    if not t:
        raise HTTPException(404, "티켓을 찾을 수 없습니다")

    base = t.expires_at or date.today()
    new_exp = base + timedelta(days=body.days_added)
    t.expires_at = new_exp
    hist = list(t.extension_history or [])
    hist.append({
        "date": date.today().isoformat(),
        "days_added": body.days_added,
        "reason": body.reason,
        "new_expires_at": new_exp.isoformat(),
    })
    t.extension_history = hist
    # EXPIRED였다면 ACTIVE 복귀
    if t.status == TicketStatus.EXPIRED and t.used_sessions < t.total_sessions:
        t.status = TicketStatus.ACTIVE
    await db.commit()
    await db.refresh(t)
    return _ticket_to_dict(t)


@router.post("/tickets/{ticket_id}/cancel")
async def cancel_ticket(
    ticket_id: str,
    refund: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    try:
        tid = uuid.UUID(ticket_id)
    except ValueError:
        raise HTTPException(400, "잘못된 id")
    res = await db.execute(select(PatientTicket).where(and_(
        PatientTicket.id == tid,
        PatientTicket.user_id == current_user.id,
    )))
    t = res.scalar_one_or_none()
    if not t:
        raise HTTPException(404, "티켓을 찾을 수 없습니다")
    t.status = TicketStatus.REFUNDED if refund else TicketStatus.CANCELED
    await db.commit()
    await db.refresh(t)
    return _ticket_to_dict(t)


@router.get("/tickets/{ticket_id}/usages")
async def list_usages(
    ticket_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    try:
        tid = uuid.UUID(ticket_id)
    except ValueError:
        raise HTTPException(400, "잘못된 id")
    # 권한 — 같은 user 소유 ticket인지 확인
    tk_res = await db.execute(select(PatientTicket).where(and_(
        PatientTicket.id == tid,
        PatientTicket.user_id == current_user.id,
    )))
    if not tk_res.scalar_one_or_none():
        raise HTTPException(404, "티켓을 찾을 수 없습니다")

    u_res = await db.execute(select(TicketUsage).where(
        TicketUsage.ticket_id == tid
    ).order_by(TicketUsage.used_at.desc()))
    return [{
        "id": u.id,
        "used_at": u.used_at.isoformat() if u.used_at else None,
        "sessions_used": u.sessions_used,
        "visit_id": str(u.visit_id) if u.visit_id else None,
        "note": u.note,
        "voided": u.voided,
    } for u in u_res.scalars().all()]
