"""
관리자 중개 관리 API

- ADMIN 전용
- 중개사 CRUD, 딜 관리, 커미션 정산, 컨트롤타워, 우회감시
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc, case
from typing import Optional, List
from uuid import UUID
from datetime import datetime, timedelta
from pydantic import BaseModel

from ..deps import get_db, get_current_active_user
from ...models.user import User, UserRole
from ...models.broker import (
    Broker, BrokerageDeal, DealCommission, SuspiciousActivity,
    BrokerStatus, BrokerTier, DealStatus, DealCloseReason,
    CommissionType, CommissionPaymentStatus, SuspiciousActivityType,
    DEAL_STATUS_ORDER,
)
from ...models.broker_board import BrokerBoardPost, BrokerBoardComment, BoardCategory
from ...models.landlord import LandlordListing

router = APIRouter()


# ===== 권한 체크 =====

async def require_admin(current_user: User = Depends(get_current_active_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다")
    return current_user


# ===== Schemas =====

class BrokerCreate(BaseModel):
    user_id: str
    display_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    license_number: Optional[str] = None
    brokerage_office_name: Optional[str] = None
    assigned_regions: Optional[List[str]] = []
    assigned_specialties: Optional[List[str]] = []
    tier: Optional[str] = "JUNIOR"
    commission_rate: Optional[float] = 60.0

class BrokerUpdate(BaseModel):
    display_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    license_number: Optional[str] = None
    brokerage_office_name: Optional[str] = None
    assigned_regions: Optional[List[str]] = None
    assigned_specialties: Optional[List[str]] = None
    tier: Optional[str] = None
    status: Optional[str] = None
    commission_rate: Optional[float] = None
    payout_bank: Optional[str] = None
    payout_account: Optional[str] = None
    payout_holder: Optional[str] = None
    is_verified: Optional[bool] = None

class DealAssign(BaseModel):
    broker_id: int

class CircumventionFlag(BaseModel):
    reason: str

class SuspiciousResolve(BaseModel):
    resolution_note: str

class BoardPostAdminCreate(BaseModel):
    category: str = "NOTICE"
    title: str
    content: str
    is_pinned: Optional[bool] = False


# ===== 중개사 관리 =====

@router.get("/brokers")
async def list_brokers(
    status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """전체 중개사 목록"""
    query = select(Broker)
    if status:
        query = query.where(Broker.status == BrokerStatus(status))
    if search:
        query = query.where(
            or_(
                Broker.display_name.ilike(f"%{search}%"),
                Broker.phone.ilike(f"%{search}%"),
                Broker.email.ilike(f"%{search}%"),
            )
        )

    total = (await db.execute(
        select(func.count(Broker.id)).select_from(query.subquery())
    )).scalar() or 0

    result = await db.execute(
        query.order_by(desc(Broker.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    brokers = result.scalars().all()

    return {
        "items": [
            {
                "id": b.id,
                "user_id": str(b.user_id),
                "display_name": b.display_name,
                "phone": b.phone,
                "email": b.email,
                "tier": b.tier.value,
                "status": b.status.value,
                "total_deals": b.total_deals,
                "closed_won_deals": b.closed_won_deals,
                "current_active_deals": b.current_active_deals,
                "total_commission_earned": b.total_commission_earned,
                "commission_rate": b.commission_rate,
                "is_verified": b.is_verified,
                "assigned_regions": b.assigned_regions or [],
                "created_at": b.created_at.isoformat() if b.created_at else None,
            }
            for b in brokers
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.post("/brokers")
async def create_broker(
    body: BrokerCreate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """중개사 등록"""
    # 유저 확인
    user_result = await db.execute(select(User).where(User.id == body.user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")

    # 이미 등록 확인
    existing = await db.execute(select(Broker).where(Broker.user_id == user.id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="이미 등록된 중개사입니다")

    # SALES_REP로 역할 변경
    user.role = UserRole.SALES_REP

    broker = Broker(
        user_id=user.id,
        display_name=body.display_name,
        phone=body.phone or user.phone,
        email=body.email or user.email,
        license_number=body.license_number,
        brokerage_office_name=body.brokerage_office_name,
        assigned_regions=body.assigned_regions or [],
        assigned_specialties=body.assigned_specialties or [],
        tier=BrokerTier(body.tier) if body.tier else BrokerTier.JUNIOR,
        commission_rate=body.commission_rate or 60.0,
        status=BrokerStatus.ACTIVE,
    )
    db.add(broker)
    await db.commit()
    await db.refresh(broker)

    return {"message": "중개사가 등록되었습니다", "broker_id": broker.id}


@router.get("/brokers/{broker_id}")
async def get_broker_detail(
    broker_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """중개사 상세"""
    result = await db.execute(select(Broker).where(Broker.id == broker_id))
    broker = result.scalar_one_or_none()
    if not broker:
        raise HTTPException(status_code=404, detail="중개사를 찾을 수 없습니다")

    return {
        "id": broker.id,
        "user_id": str(broker.user_id),
        "display_name": broker.display_name,
        "phone": broker.phone,
        "email": broker.email,
        "license_number": broker.license_number,
        "brokerage_office_name": broker.brokerage_office_name,
        "tier": broker.tier.value,
        "status": broker.status.value,
        "assigned_regions": broker.assigned_regions or [],
        "assigned_specialties": broker.assigned_specialties or [],
        "commission_rate": broker.commission_rate,
        "total_deals": broker.total_deals,
        "closed_won_deals": broker.closed_won_deals,
        "current_active_deals": broker.current_active_deals,
        "total_commission_earned": broker.total_commission_earned,
        "avg_deal_days": broker.avg_deal_days,
        "payout_bank": broker.payout_bank,
        "payout_account": broker.payout_account,
        "payout_holder": broker.payout_holder,
        "is_verified": broker.is_verified,
        "verified_at": broker.verified_at.isoformat() if broker.verified_at else None,
        "created_at": broker.created_at.isoformat() if broker.created_at else None,
    }


@router.patch("/brokers/{broker_id}")
async def update_broker(
    broker_id: int,
    body: BrokerUpdate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """중개사 수정"""
    result = await db.execute(select(Broker).where(Broker.id == broker_id))
    broker = result.scalar_one_or_none()
    if not broker:
        raise HTTPException(status_code=404, detail="중개사를 찾을 수 없습니다")

    update_data = body.dict(exclude_unset=True)
    for key, value in update_data.items():
        if key == "tier" and value:
            setattr(broker, key, BrokerTier(value))
        elif key == "status" and value:
            setattr(broker, key, BrokerStatus(value))
        elif key == "is_verified" and value:
            broker.is_verified = value
            broker.verified_at = datetime.utcnow()
        else:
            setattr(broker, key, value)

    broker.updated_at = datetime.utcnow()
    await db.commit()
    return {"message": "중개사 정보가 수정되었습니다"}


@router.get("/brokers/{broker_id}/performance")
async def get_broker_performance(
    broker_id: int,
    period: Optional[str] = None,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """중개사 상세 성과"""
    result = await db.execute(select(Broker).where(Broker.id == broker_id))
    broker = result.scalar_one_or_none()
    if not broker:
        raise HTTPException(status_code=404, detail="중개사를 찾을 수 없습니다")

    # 상태별 딜 수
    pipeline = await db.execute(
        select(BrokerageDeal.status, func.count(BrokerageDeal.id))
        .where(BrokerageDeal.broker_id == broker_id)
        .group_by(BrokerageDeal.status)
    )
    pipeline_data = {row[0].value: row[1] for row in pipeline.all()}

    # 커미션 요약
    comm = await db.execute(
        select(
            DealCommission.payment_status,
            func.sum(DealCommission.net_amount),
        )
        .join(BrokerageDeal, DealCommission.deal_id == BrokerageDeal.id)
        .where(
            and_(
                BrokerageDeal.broker_id == broker_id,
                DealCommission.commission_type == CommissionType.BROKER,
            )
        )
        .group_by(DealCommission.payment_status)
    )
    commission_by_status = {row[0].value: row[1] or 0 for row in comm.all()}

    return {
        "broker_id": broker_id,
        "display_name": broker.display_name,
        "tier": broker.tier.value,
        "total_deals": broker.total_deals,
        "closed_won": broker.closed_won_deals,
        "active_deals": broker.current_active_deals,
        "avg_deal_days": broker.avg_deal_days,
        "pipeline": pipeline_data,
        "commission_by_status": commission_by_status,
    }


# ===== 딜 관리 =====

@router.get("/deals")
async def list_all_deals(
    broker_id: Optional[int] = None,
    status: Optional[str] = None,
    doctor: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """전체 딜 목록"""
    query = select(BrokerageDeal)
    if broker_id:
        query = query.where(BrokerageDeal.broker_id == broker_id)
    if status:
        query = query.where(BrokerageDeal.status == DealStatus(status))
    if doctor:
        query = query.where(BrokerageDeal.doctor_id == doctor)

    total = (await db.execute(
        select(func.count(BrokerageDeal.id)).select_from(query.subquery())
    )).scalar() or 0

    result = await db.execute(
        query.order_by(desc(BrokerageDeal.updated_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    deals = result.scalars().all()

    # Broker names lookup
    broker_ids = list(set(d.broker_id for d in deals if d.broker_id))
    broker_names = {}
    if broker_ids:
        br = await db.execute(select(Broker.id, Broker.display_name).where(Broker.id.in_(broker_ids)))
        broker_names = {row[0]: row[1] for row in br.all()}

    return {
        "items": [
            {
                "id": str(d.id),
                "deal_number": d.deal_number,
                "title": d.title,
                "status": d.status.value,
                "close_reason": d.close_reason.value if d.close_reason else None,
                "broker_id": d.broker_id,
                "broker_name": broker_names.get(d.broker_id, ""),
                "doctor_id": str(d.doctor_id) if d.doctor_id else None,
                "listing_id": str(d.listing_id) if d.listing_id else None,
                "expected_commission": d.expected_commission,
                "actual_commission": d.actual_commission,
                "circumvention_flag": d.circumvention_flag,
                "lead_score": d.lead_score,
                "created_at": d.created_at.isoformat() if d.created_at else None,
                "updated_at": d.updated_at.isoformat() if d.updated_at else None,
            }
            for d in deals
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/deals/{deal_id}")
async def get_deal_detail_admin(
    deal_id: str,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """딜 상세 + 전체 이력"""
    result = await db.execute(
        select(BrokerageDeal).where(BrokerageDeal.id == deal_id)
    )
    deal = result.scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="딜을 찾을 수 없습니다")

    # 브로커 정보
    broker_info = None
    if deal.broker_id:
        br = await db.execute(select(Broker).where(Broker.id == deal.broker_id))
        b = br.scalar_one_or_none()
        if b:
            broker_info = {"id": b.id, "display_name": b.display_name, "tier": b.tier.value}

    return {
        "id": str(deal.id),
        "deal_number": deal.deal_number,
        "title": deal.title,
        "description": deal.description,
        "status": deal.status.value,
        "close_reason": deal.close_reason.value if deal.close_reason else None,
        "close_note": deal.close_note,
        "broker": broker_info,
        "doctor_id": str(deal.doctor_id) if deal.doctor_id else None,
        "listing_id": str(deal.listing_id) if deal.listing_id else None,
        "expected_commission": deal.expected_commission,
        "actual_commission": deal.actual_commission,
        "landlord_commission": deal.landlord_commission,
        "marketing_cost": deal.marketing_cost,
        "ad_cost": deal.ad_cost,
        "activity_log": deal.activity_log or [],
        "admin_notes": deal.admin_notes,
        "circumvention_flag": deal.circumvention_flag,
        "circumvention_reason": deal.circumvention_reason,
        "commissions": [
            {
                "id": c.id,
                "commission_type": c.commission_type.value,
                "gross_amount": c.gross_amount,
                "tax_amount": c.tax_amount,
                "net_amount": c.net_amount,
                "payment_status": c.payment_status.value,
                "approved_at": c.approved_at.isoformat() if c.approved_at else None,
                "paid_at": c.paid_at.isoformat() if c.paid_at else None,
            }
            for c in (deal.commissions or [])
        ],
        "created_at": deal.created_at.isoformat() if deal.created_at else None,
    }


@router.patch("/deals/{deal_id}/assign")
async def assign_deal(
    deal_id: str,
    body: DealAssign,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """중개사 배정/재배정"""
    deal_r = await db.execute(select(BrokerageDeal).where(BrokerageDeal.id == deal_id))
    deal = deal_r.scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="딜을 찾을 수 없습니다")

    broker_r = await db.execute(select(Broker).where(Broker.id == body.broker_id))
    broker = broker_r.scalar_one_or_none()
    if not broker:
        raise HTTPException(status_code=404, detail="중개사를 찾을 수 없습니다")

    old_broker_id = deal.broker_id
    deal.broker_id = broker.id

    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "actor": str(admin.id),
        "actor_name": "관리자",
        "action": "BROKER_ASSIGNED",
        "note": f"중개사 {broker.display_name} 배정 (이전: {old_broker_id})",
    }
    current_log = deal.activity_log or []
    deal.activity_log = current_log + [log_entry]

    await db.commit()
    return {"message": f"중개사 {broker.display_name}이(가) 배정되었습니다"}


@router.post("/deals/{deal_id}/flag-circumvention")
async def flag_circumvention(
    deal_id: str,
    body: CircumventionFlag,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """우회 플래그"""
    deal_r = await db.execute(select(BrokerageDeal).where(BrokerageDeal.id == deal_id))
    deal = deal_r.scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="딜을 찾을 수 없습니다")

    deal.circumvention_flag = True
    deal.circumvention_reason = body.reason
    deal.circumvention_flagged_at = datetime.utcnow()

    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "actor": str(admin.id),
        "actor_name": "관리자",
        "action": "CIRCUMVENTION_FLAGGED",
        "note": body.reason,
    }
    current_log = deal.activity_log or []
    deal.activity_log = current_log + [log_entry]

    await db.commit()
    return {"message": "우회 플래그가 설정되었습니다"}


# ===== 파이프라인 & 커미션 =====

@router.get("/pipeline")
async def get_pipeline(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """단계별 딜 수 + 금액"""
    result = await db.execute(
        select(
            BrokerageDeal.status,
            func.count(BrokerageDeal.id),
            func.sum(BrokerageDeal.expected_commission),
        )
        .group_by(BrokerageDeal.status)
    )
    stages = [
        {
            "status": row[0].value,
            "count": row[1],
            "total_expected_commission": row[2] or 0,
        }
        for row in result.all()
    ]
    return {"stages": stages}


@router.get("/commissions")
async def list_commissions(
    status: Optional[str] = None,
    broker_id: Optional[int] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """커미션 리포트"""
    query = select(DealCommission).join(BrokerageDeal, DealCommission.deal_id == BrokerageDeal.id)
    if status:
        query = query.where(DealCommission.payment_status == CommissionPaymentStatus(status))
    if broker_id:
        query = query.where(BrokerageDeal.broker_id == broker_id)

    total = (await db.execute(
        select(func.count(DealCommission.id)).select_from(query.subquery())
    )).scalar() or 0

    result = await db.execute(
        query.order_by(desc(DealCommission.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    commissions = result.scalars().all()

    return {
        "items": [
            {
                "id": c.id,
                "deal_id": str(c.deal_id),
                "commission_type": c.commission_type.value,
                "gross_amount": c.gross_amount,
                "tax_amount": c.tax_amount,
                "net_amount": c.net_amount,
                "payment_status": c.payment_status.value,
                "approved_at": c.approved_at.isoformat() if c.approved_at else None,
                "paid_at": c.paid_at.isoformat() if c.paid_at else None,
            }
            for c in commissions
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.post("/commissions/{commission_id}/approve")
async def approve_commission(
    commission_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """커미션 승인"""
    result = await db.execute(select(DealCommission).where(DealCommission.id == commission_id))
    comm = result.scalar_one_or_none()
    if not comm:
        raise HTTPException(status_code=404, detail="커미션을 찾을 수 없습니다")
    comm.payment_status = CommissionPaymentStatus.APPROVED
    comm.approved_at = datetime.utcnow()
    comm.approved_by = admin.id
    await db.commit()
    return {"message": "커미션이 승인되었습니다"}


@router.post("/commissions/{commission_id}/pay")
async def pay_commission(
    commission_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """정산 완료"""
    result = await db.execute(select(DealCommission).where(DealCommission.id == commission_id))
    comm = result.scalar_one_or_none()
    if not comm:
        raise HTTPException(status_code=404, detail="커미션을 찾을 수 없습니다")
    if comm.payment_status != CommissionPaymentStatus.APPROVED:
        raise HTTPException(status_code=400, detail="승인된 커미션만 정산할 수 있습니다")
    comm.payment_status = CommissionPaymentStatus.PAID
    comm.paid_at = datetime.utcnow()
    await db.commit()
    return {"message": "정산이 완료되었습니다"}


@router.post("/commissions/{commission_id}/cancel")
async def cancel_commission(
    commission_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """커미션 취소"""
    result = await db.execute(select(DealCommission).where(DealCommission.id == commission_id))
    comm = result.scalar_one_or_none()
    if not comm:
        raise HTTPException(status_code=404, detail="커미션을 찾을 수 없습니다")
    comm.payment_status = CommissionPaymentStatus.CANCELLED
    await db.commit()
    return {"message": "커미션이 취소되었습니다"}


# ===== 컨트롤타워 =====

@router.get("/control-tower")
async def control_tower(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """종합 현황"""
    # 브로커 수
    broker_count = (await db.execute(
        select(func.count(Broker.id)).where(Broker.status == BrokerStatus.ACTIVE)
    )).scalar() or 0

    # 활성 딜
    active_statuses = [
        DealStatus.LEAD, DealStatus.CONTACTED, DealStatus.VIEWING_SCHEDULED,
        DealStatus.VIEWED, DealStatus.NEGOTIATING, DealStatus.CONTRACT_PENDING,
        DealStatus.CONTRACTED,
    ]
    active_deals = (await db.execute(
        select(func.count(BrokerageDeal.id)).where(BrokerageDeal.status.in_(active_statuses))
    )).scalar() or 0

    # 이번달 매출
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly_revenue = (await db.execute(
        select(func.sum(DealCommission.net_amount))
        .join(BrokerageDeal, DealCommission.deal_id == BrokerageDeal.id)
        .where(
            and_(
                BrokerageDeal.status == DealStatus.CLOSED_WON,
                DealCommission.commission_type == CommissionType.PLATFORM,
                BrokerageDeal.updated_at >= month_start,
            )
        )
    )).scalar() or 0

    # 전환율
    total_deals = (await db.execute(select(func.count(BrokerageDeal.id)))).scalar() or 0
    won_deals = (await db.execute(
        select(func.count(BrokerageDeal.id)).where(BrokerageDeal.status == DealStatus.CLOSED_WON)
    )).scalar() or 0
    conversion_rate = round((won_deals / total_deals * 100) if total_deals > 0 else 0, 1)

    # Top 5 브로커
    top5 = await db.execute(
        select(Broker.id, Broker.display_name, Broker.closed_won_deals, Broker.total_commission_earned)
        .where(Broker.status == BrokerStatus.ACTIVE)
        .order_by(desc(Broker.closed_won_deals))
        .limit(5)
    )
    leaderboard = [
        {"id": r[0], "name": r[1], "won": r[2], "commission": r[3]}
        for r in top5.all()
    ]

    # 우회 의심
    suspicious_count = (await db.execute(
        select(func.count(SuspiciousActivity.id)).where(SuspiciousActivity.is_resolved == False)
    )).scalar() or 0

    # 미정산 커미션
    pending_commissions = (await db.execute(
        select(func.count(DealCommission.id)).where(
            DealCommission.payment_status.in_([
                CommissionPaymentStatus.PENDING,
                CommissionPaymentStatus.APPROVED,
            ])
        )
    )).scalar() or 0

    return {
        "kpi": {
            "broker_count": broker_count,
            "active_deals": active_deals,
            "monthly_revenue": monthly_revenue,
            "conversion_rate": conversion_rate,
        },
        "leaderboard": leaderboard,
        "alerts": {
            "suspicious_activities": suspicious_count,
            "pending_commissions": pending_commissions,
        },
    }


# ===== 개원 추적 =====

@router.get("/doctors/opening-status")
async def list_opening_doctors(
    status: Optional[str] = None,
    region: Optional[str] = None,
    specialty: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """개원 준비 의사 목록"""
    query = select(User).where(User.is_opening_preparation == True)
    if status:
        query = query.where(User.opening_status == status)
    if region:
        query = query.where(User.opening_region.ilike(f"%{region}%"))
    if specialty:
        query = query.where(User.specialty.ilike(f"%{specialty}%"))

    total = (await db.execute(
        select(func.count(User.id)).select_from(query.subquery())
    )).scalar() or 0

    result = await db.execute(
        query.order_by(desc(User.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    doctors = result.scalars().all()

    # 각 의사별 딜 수
    items = []
    for doc in doctors:
        deal_count = (await db.execute(
            select(func.count(BrokerageDeal.id)).where(BrokerageDeal.doctor_id == doc.id)
        )).scalar() or 0
        items.append({
            "id": str(doc.id),
            "name": doc.full_name,
            "specialty": doc.specialty,
            "opening_region": doc.opening_region,
            "opening_status": doc.opening_status,
            "expected_opening_date": doc.expected_opening_date,
            "deal_count": deal_count,
        })

    return {"items": items, "total": total, "page": page, "page_size": page_size}


# ===== 우회거래 감시 =====

@router.get("/suspicious-activities")
async def list_suspicious(
    resolved: Optional[bool] = None,
    severity: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """의심 목록"""
    query = select(SuspiciousActivity)
    if resolved is not None:
        query = query.where(SuspiciousActivity.is_resolved == resolved)
    if severity:
        query = query.where(SuspiciousActivity.severity == severity)

    total = (await db.execute(
        select(func.count(SuspiciousActivity.id)).select_from(query.subquery())
    )).scalar() or 0

    result = await db.execute(
        query.order_by(desc(SuspiciousActivity.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    activities = result.scalars().all()

    return {
        "items": [
            {
                "id": a.id,
                "activity_type": a.activity_type.value,
                "severity": a.severity,
                "description": a.description,
                "is_resolved": a.is_resolved,
                "deal_id": str(a.deal_id) if a.deal_id else None,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in activities
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.post("/suspicious-activities/{activity_id}/resolve")
async def resolve_suspicious(
    activity_id: int,
    body: SuspiciousResolve,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """의심 해결"""
    result = await db.execute(select(SuspiciousActivity).where(SuspiciousActivity.id == activity_id))
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="의심 활동을 찾을 수 없습니다")

    activity.is_resolved = True
    activity.resolved_by = admin.id
    activity.resolution_note = body.resolution_note
    activity.resolved_at = datetime.utcnow()
    await db.commit()
    return {"message": "해결 처리되었습니다"}


# ===== 게시판 관리 =====

@router.post("/board")
async def admin_create_post(
    body: BoardPostAdminCreate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """공지 작성"""
    post = BrokerBoardPost(
        author_id=admin.id,
        category=BoardCategory(body.category),
        title=body.title,
        content=body.content,
        is_pinned=body.is_pinned or False,
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return {"message": "글이 작성되었습니다", "id": post.id}


@router.delete("/board/{post_id}")
async def admin_delete_post(
    post_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """글 삭제"""
    result = await db.execute(select(BrokerBoardPost).where(BrokerBoardPost.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="글을 찾을 수 없습니다")
    await db.delete(post)
    await db.commit()
    return {"message": "글이 삭제되었습니다"}


@router.post("/board/{post_id}/pin")
async def toggle_pin(
    post_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """고정/해제"""
    result = await db.execute(select(BrokerBoardPost).where(BrokerBoardPost.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="글을 찾을 수 없습니다")
    post.is_pinned = not post.is_pinned
    await db.commit()
    return {"message": "고정" if post.is_pinned else "고정 해제", "is_pinned": post.is_pinned}


# ===== 정산 리포트 =====

@router.get("/settlement-report")
async def settlement_report(
    month: Optional[str] = None,
    broker_id: Optional[int] = None,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """월간 정산 데이터"""
    query = (
        select(
            Broker.id,
            Broker.display_name,
            func.count(BrokerageDeal.id).label("deal_count"),
            func.sum(DealCommission.gross_amount).label("total_gross"),
            func.sum(DealCommission.net_amount).label("total_net"),
        )
        .join(BrokerageDeal, BrokerageDeal.broker_id == Broker.id)
        .join(DealCommission, DealCommission.deal_id == BrokerageDeal.id)
        .where(DealCommission.commission_type == CommissionType.BROKER)
        .group_by(Broker.id, Broker.display_name)
    )

    if broker_id:
        query = query.where(Broker.id == broker_id)

    result = await db.execute(query)
    rows = result.all()

    return {
        "items": [
            {
                "broker_id": r[0],
                "broker_name": r[1],
                "deal_count": r[2],
                "total_gross": r[3] or 0,
                "total_net": r[4] or 0,
            }
            for r in rows
        ],
    }
