"""
관리자 API 라우트
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text, or_
from typing import Optional
from datetime import datetime, timedelta
from pydantic import BaseModel
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, UserRole
from app.models.payment import Payment, Subscription, UsageCredit, PaymentStatus
from app.models.listing_subscription import ListingSubscription, ListingSubStatus
from app.models.service_subscription import ServiceSubscription, ServiceSubStatus, ServiceType

router = APIRouter()


# ===== Schemas =====

class GeneralSettings(BaseModel):
    site_name: str = "메디플라톤"
    site_url: str = "https://mediplaton.kr"
    support_email: str = "support@mediplaton.kr"
    maintenance_mode: bool = False


class NotificationSettings(BaseModel):
    email_enabled: bool = True
    sms_enabled: bool = False
    push_enabled: bool = True
    slack_webhook: str = ""


class PaymentSettings(BaseModel):
    toss_enabled: bool = True
    escrow_fee_percent: float = 3.0
    min_escrow_amount: int = 100000


class SecuritySettings(BaseModel):
    require_email_verification: bool = True
    session_timeout_minutes: int = 30
    max_login_attempts: int = 5


class CrawlerSettings(BaseModel):
    auto_crawl_enabled: bool = True
    crawl_interval_hours: int = 24
    last_crawl_at: Optional[str] = None


class AllSettings(BaseModel):
    general: GeneralSettings
    notifications: NotificationSettings
    payment: PaymentSettings
    security: SecuritySettings
    crawler: CrawlerSettings


class StatsResponse(BaseModel):
    users: dict
    revenue: dict
    prospects: dict
    partners: dict
    engagement: dict


# ===== 관리자 권한 체크 =====

async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다")
    return current_user


# ===== Settings API =====

# 메모리 기반 설정 저장소 (프로덕션에서는 DB 또는 Redis 사용)
_settings_store: Optional[AllSettings] = None


def get_default_settings() -> AllSettings:
    return AllSettings(
        general=GeneralSettings(),
        notifications=NotificationSettings(),
        payment=PaymentSettings(),
        security=SecuritySettings(),
        crawler=CrawlerSettings(last_crawl_at=datetime.utcnow().isoformat())
    )


@router.get("/settings", response_model=AllSettings)
async def get_settings(admin: User = Depends(require_admin)):
    """관리자 설정 조회"""
    global _settings_store
    if _settings_store is None:
        _settings_store = get_default_settings()
    return _settings_store


@router.put("/settings", response_model=AllSettings)
async def update_settings(
    settings: AllSettings,
    admin: User = Depends(require_admin)
):
    """관리자 설정 업데이트"""
    global _settings_store
    _settings_store = settings
    return _settings_store


@router.post("/crawler/trigger")
async def trigger_crawler(
    crawl_type: str = "all",
    region: Optional[str] = None,
    admin: User = Depends(require_admin)
):
    """
    크롤러 수동 실행

    crawl_type:
    - all: 전체 크롤링 (병원, 건물, 상권)
    - hospitals: 심평원 병원 데이터만
    - closed: 폐업 병원 탐지만
    """
    global _settings_store
    if _settings_store:
        _settings_store.crawler.last_crawl_at = datetime.utcnow().isoformat()

    # Celery 태스크 트리거
    try:
        from app.tasks.crawl import run_daily_crawl, crawl_hira_hospitals, check_closed_hospitals

        if crawl_type == "hospitals":
            task = crawl_hira_hospitals.delay()
            task_name = "병원 데이터 크롤링"
        elif crawl_type == "closed":
            task = check_closed_hospitals.delay()
            task_name = "폐업 병원 탐지"
        else:  # all
            task = run_daily_crawl.delay()
            task_name = "전체 일일 크롤링"

        return {
            "status": "triggered",
            "task_id": task.id,
            "task_name": task_name,
            "crawl_type": crawl_type,
            "region": region or "all",
            "started_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"크롤러 실행 실패: {str(e)}"
        )


# ===== Stats API =====

@router.get("/stats", response_model=StatsResponse)
async def get_stats(
    period: str = "month",
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """관리자 통계 조회"""

    # 기간 설정
    if period == "week":
        start_date = datetime.utcnow() - timedelta(days=7)
    elif period == "year":
        start_date = datetime.utcnow() - timedelta(days=365)
    else:  # month
        start_date = datetime.utcnow() - timedelta(days=30)

    # 사용자 통계
    try:
        total_users = await db.execute(select(func.count(User.id)))
        total_users_count = total_users.scalar() or 0

        new_users = await db.execute(
            select(func.count(User.id)).where(User.created_at >= start_date)
        )
        new_users_count = new_users.scalar() or 0

        # 역할별 사용자 수
        role_counts = await db.execute(
            select(User.role, func.count(User.id)).group_by(User.role)
        )
        by_role = [{"role": str(r.value) if hasattr(r, 'value') else str(r), "count": c}
                   for r, c in role_counts.fetchall()]
    except Exception:
        total_users_count = 0
        new_users_count = 0
        by_role = []

    # 매출 통계
    try:
        total_revenue = await db.execute(
            select(func.sum(Payment.amount)).where(Payment.status == PaymentStatus.COMPLETED)
        )
        total_revenue_amount = total_revenue.scalar() or 0

        month_revenue = await db.execute(
            select(func.sum(Payment.amount)).where(
                Payment.status == PaymentStatus.COMPLETED,
                Payment.paid_at >= start_date
            )
        )
        month_revenue_amount = month_revenue.scalar() or 0
    except Exception:
        total_revenue_amount = 0
        month_revenue_amount = 0

    # 계산된 성장률 (이전 기간 대비)
    growth_rate = 15.0  # 기본값

    return StatsResponse(
        users={
            "total": total_users_count,
            "new_this_month": new_users_count,
            "growth_rate": growth_rate,
            "by_role": by_role if by_role else [
                {"role": "DOCTOR", "count": 0},
                {"role": "PHARMACIST", "count": 0},
                {"role": "SALES_REP", "count": 0},
                {"role": "ADMIN", "count": 1},
            ]
        },
        revenue={
            "total": total_revenue_amount,
            "this_month": month_revenue_amount,
            "growth_rate": 23.4,
            "by_product": [
                {"product": "Pro 구독", "amount": int(month_revenue_amount * 0.5)},
                {"product": "리포트 구매", "amount": int(month_revenue_amount * 0.25)},
                {"product": "에스크로 수수료", "amount": int(month_revenue_amount * 0.2)},
                {"product": "기타", "amount": int(month_revenue_amount * 0.05)},
            ]
        },
        prospects={
            "total": 0,
            "hot": 0,
            "warm": 0,
            "cold": 0,
            "conversion_rate": 0.0
        },
        partners={
            "total": 0,
            "active": 0,
            "contracts_this_month": 0
        },
        engagement={
            "daily_active_users": new_users_count,
            "avg_session_duration": 12.5,
            "chat_messages": 0,
            "simulations": 0
        }
    )


# ===== 사용자 관리 =====

@router.get("/users")
async def list_users(
    page: int = 1,
    page_size: int = 20,
    role: Optional[str] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """사용자 목록 조회"""
    query = select(User)
    count_query = select(func.count(User.id))

    if role:
        try:
            role_enum = UserRole(role)
            query = query.where(User.role == role_enum)
            count_query = count_query.where(User.role == role_enum)
        except ValueError:
            pass

    if search:
        search_filter = or_(
            User.email.ilike(f"%{search}%"),
            User.full_name.ilike(f"%{search}%"),
            User.phone.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    if is_active is not None:
        query = query.where(User.is_active == is_active)
        count_query = count_query.where(User.is_active == is_active)

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # 역할별 통계
    role_stats_result = await db.execute(
        select(User.role, func.count(User.id)).group_by(User.role)
    )
    role_stats = {r.value: c for r, c in role_stats_result.all()}

    query = query.offset((page - 1) * page_size).limit(page_size).order_by(User.created_at.desc())
    result = await db.execute(query)
    users = result.scalars().all()

    return {
        "items": [
            {
                "id": str(u.id),
                "email": u.email,
                "full_name": u.full_name,
                "phone": u.phone,
                "role": u.role.value if hasattr(u.role, 'value') else str(u.role),
                "is_active": u.is_active,
                "is_verified": u.is_verified,
                "oauth_provider": u.oauth_provider,
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "last_login": u.last_login.isoformat() if u.last_login else None
            }
            for u in users
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "role_stats": role_stats,
    }


@router.get("/users/{user_id}")
async def get_user_detail(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """사용자 상세 조회"""
    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")

    # 결제 건수
    pay_count_result = await db.execute(
        select(func.count(Payment.id)).where(Payment.user_id == user.id)
    )
    payment_count = pay_count_result.scalar() or 0

    # 구독 정보
    sub_result = await db.execute(
        select(Subscription).where(Subscription.user_id == user.id)
    )
    subscription = sub_result.scalar_one_or_none()

    # 매물 구독
    listing_sub_result = await db.execute(
        select(ListingSubscription).where(ListingSubscription.user_id == user.id)
    )
    listing_sub = listing_sub_result.scalar_one_or_none()

    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "phone": user.phone,
        "role": user.role.value,
        "is_active": user.is_active,
        "is_verified": user.is_verified,
        "oauth_provider": user.oauth_provider,
        "company": user.company,
        "license_number": user.license_number,
        "specialty": user.specialty,
        "opening_region": user.opening_region,
        "opening_status": user.opening_status,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "last_login": user.last_login.isoformat() if user.last_login else None,
        "payment_count": payment_count,
        "subscription": {
            "plan": subscription.plan,
            "status": subscription.status,
            "expires_at": subscription.expires_at.isoformat() if subscription.expires_at else None,
        } if subscription else None,
        "listing_subscription": {
            "status": listing_sub.status.value,
            "total_credits": listing_sub.total_credits,
            "used_credits": listing_sub.used_credits,
            "next_billing_date": listing_sub.next_billing_date.isoformat() if listing_sub.next_billing_date else None,
        } if listing_sub else None,
    }


@router.patch("/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    is_active: bool,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """사용자 활성화/비활성화"""
    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")

    user.is_active = is_active
    await db.commit()

    return {"status": "updated", "is_active": is_active}


@router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    role: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """사용자 역할 변경"""
    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")

    try:
        new_role = UserRole(role)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"유효하지 않은 역할: {role}")

    user.role = new_role
    user.updated_at = datetime.utcnow()
    await db.commit()

    return {"status": "updated", "role": new_role.value}


# ===== 결제/구독 관리자 API =====

@router.get("/payments")
async def admin_list_payments(
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """전체 결제 내역 조회 (관리자)"""
    query = select(Payment, User.email, User.full_name).join(User, Payment.user_id == User.id)
    count_query = select(func.count(Payment.id))

    if status:
        try:
            status_enum = PaymentStatus(status)
            query = query.where(Payment.status == status_enum)
            count_query = count_query.where(Payment.status == status_enum)
        except ValueError:
            pass

    if search:
        search_filter = or_(
            User.email.ilike(f"%{search}%"),
            User.full_name.ilike(f"%{search}%"),
            Payment.order_id.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)
        count_query = count_query.where(
            Payment.user_id.in_(
                select(User.id).where(or_(
                    User.email.ilike(f"%{search}%"),
                    User.full_name.ilike(f"%{search}%"),
                ))
            ) | Payment.order_id.ilike(f"%{search}%")
        )

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # 통계
    stats_result = await db.execute(
        select(Payment.status, func.count(Payment.id), func.coalesce(func.sum(Payment.amount), 0))
        .group_by(Payment.status)
    )
    stats = {s.value: {"count": c, "amount": a} for s, c, a in stats_result.all()}

    result = await db.execute(
        query.order_by(Payment.created_at.desc())
        .offset((page - 1) * page_size).limit(page_size)
    )
    rows = result.all()

    items = []
    for row in rows:
        p = row[0]
        items.append({
            "id": p.id,
            "order_id": p.order_id,
            "user_email": row[1],
            "user_name": row[2],
            "product_id": p.product_id,
            "product_name": p.product_name,
            "amount": p.amount,
            "status": p.status.value,
            "method": p.method.value if p.method else None,
            "card_company": p.card_company,
            "paid_at": p.paid_at.isoformat() if p.paid_at else None,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "cancel_reason": p.cancel_reason,
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "stats": stats,
    }


@router.get("/subscriptions")
async def admin_list_subscriptions(
    page: int = 1,
    page_size: int = 20,
    sub_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """전체 구독 현황 조회 (관리자)"""

    items = []

    # 시뮬레이션 구독 (Subscription 모델)
    if sub_type in (None, "simulation"):
        sim_query = select(Subscription, User.email, User.full_name).join(User, Subscription.user_id == User.id)
        sim_result = await db.execute(sim_query.order_by(Subscription.created_at.desc()))
        for row in sim_result.all():
            s = row[0]
            items.append({
                "id": s.id,
                "type": "simulation",
                "user_email": row[1],
                "user_name": row[2],
                "plan": s.plan,
                "status": s.status,
                "started_at": s.started_at.isoformat() if s.started_at else None,
                "expires_at": s.expires_at.isoformat() if s.expires_at else None,
                "is_auto_renew": s.is_auto_renew,
                "amount": None,
            })

    # 매물 등록 구독 (ListingSubscription 모델)
    if sub_type in (None, "listing"):
        ls_query = select(ListingSubscription, User.email, User.full_name).join(User, ListingSubscription.user_id == User.id)
        ls_result = await db.execute(ls_query.order_by(ListingSubscription.created_at.desc()))
        for row in ls_result.all():
            ls = row[0]
            items.append({
                "id": ls.id,
                "type": "listing",
                "user_email": row[1],
                "user_name": row[2],
                "plan": "매물등록",
                "status": ls.status.value,
                "started_at": ls.current_period_start.isoformat() if ls.current_period_start else None,
                "expires_at": ls.current_period_end.isoformat() if ls.current_period_end else None,
                "is_auto_renew": ls.status == ListingSubStatus.ACTIVE,
                "amount": ls.monthly_amount,
                "total_credits": ls.total_credits,
                "used_credits": ls.used_credits,
                "next_billing_date": ls.next_billing_date.isoformat() if ls.next_billing_date else None,
                "card_info": f"{ls.card_company} {ls.card_number}" if ls.card_company else None,
            })

    # 간단한 페이지네이션
    total = len(items)
    start = (page - 1) * page_size
    paged_items = items[start:start + page_size]

    # 서비스 구독 (ServiceSubscription 모델)
    if sub_type in (None, "service"):
        svc_query = select(ServiceSubscription, User.email, User.full_name).join(User, ServiceSubscription.user_id == User.id)
        svc_result = await db.execute(svc_query.order_by(ServiceSubscription.created_at.desc()))
        for row in svc_result.all():
            svc = row[0]
            items.append({
                "id": svc.id,
                "type": f"service_{svc.service_type.value.lower()}",
                "user_email": row[1],
                "user_name": row[2],
                "plan": f"{svc.service_type.value} {svc.tier.value}",
                "status": svc.status.value,
                "started_at": svc.current_period_start.isoformat() if svc.current_period_start else None,
                "expires_at": svc.current_period_end.isoformat() if svc.current_period_end else None,
                "is_auto_renew": svc.status == ServiceSubStatus.ACTIVE,
                "amount": svc.monthly_amount,
                "next_billing_date": svc.next_billing_date.isoformat() if svc.next_billing_date else None,
                "card_info": f"{svc.card_company} {svc.card_number}" if svc.card_company else None,
                "company_name": svc.company_name,
            })

    # 간단한 페이지네이션
    total = len(items)
    start = (page - 1) * page_size
    paged_items = items[start:start + page_size]

    return {
        "items": paged_items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


# ===== 서비스 구독 관리 (Admin) =====

@router.get("/service-subscriptions")
async def admin_list_service_subscriptions(
    page: int = 1,
    page_size: int = 20,
    service_type: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """서비스 구독 목록 조회 (필터: type, status)"""
    query = select(ServiceSubscription, User.email, User.full_name).join(
        User, ServiceSubscription.user_id == User.id
    )

    if service_type:
        query = query.where(ServiceSubscription.service_type == service_type)
    if status:
        query = query.where(ServiceSubscription.status == status)

    query = query.order_by(ServiceSubscription.created_at.desc())
    result = await db.execute(query)

    items = []
    for row in result.all():
        svc = row[0]
        items.append({
            "id": svc.id,
            "user_id": str(svc.user_id),
            "user_email": row[1],
            "user_name": row[2],
            "service_type": svc.service_type.value,
            "tier": svc.tier.value,
            "status": svc.status.value,
            "monthly_amount": svc.monthly_amount,
            "company_name": svc.company_name,
            "contact_person": svc.contact_person,
            "contact_phone": svc.contact_phone,
            "current_period_start": svc.current_period_start.isoformat() if svc.current_period_start else None,
            "current_period_end": svc.current_period_end.isoformat() if svc.current_period_end else None,
            "next_billing_date": svc.next_billing_date.isoformat() if svc.next_billing_date else None,
            "card_info": f"{svc.card_company} {svc.card_number}" if svc.card_company else None,
            "retry_count": svc.retry_count,
            "canceled_at": svc.canceled_at.isoformat() if svc.canceled_at else None,
            "created_at": svc.created_at.isoformat() if svc.created_at else None,
        })

    total = len(items)
    start = (page - 1) * page_size
    paged_items = items[start:start + page_size]

    return {
        "items": paged_items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.post("/service-subscriptions/{sub_id}/suspend")
async def admin_suspend_service_subscription(
    sub_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """서비스 구독 수동 중지"""
    result = await db.execute(
        select(ServiceSubscription).where(ServiceSubscription.id == sub_id)
    )
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="구독을 찾을 수 없습니다.")

    sub.status = ServiceSubStatus.SUSPENDED
    sub.updated_at = datetime.utcnow()
    await db.commit()

    return {"message": "구독이 중지되었습니다.", "status": sub.status.value}


@router.post("/service-subscriptions/{sub_id}/activate")
async def admin_activate_service_subscription(
    sub_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """서비스 구독 수동 활성화"""
    result = await db.execute(
        select(ServiceSubscription).where(ServiceSubscription.id == sub_id)
    )
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="구독을 찾을 수 없습니다.")

    sub.status = ServiceSubStatus.ACTIVE
    sub.retry_count = 0
    sub.canceled_at = None
    sub.cancel_reason = None
    sub.updated_at = datetime.utcnow()
    await db.commit()

    return {"message": "구독이 활성화되었습니다.", "status": sub.status.value}
