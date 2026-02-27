"""
중개인 전용 API

- SALES_REP 역할 + Broker.ACTIVE 인증
- 딜 파이프라인 관리, 매물 조회, 게시판, 수수료 계산
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from typing import Optional, List
from uuid import UUID
from datetime import datetime, timedelta
from pydantic import BaseModel

from ..deps import get_db, get_current_active_user
from ...core.security import get_current_user
from ...models.user import User, UserRole
from ...models.broker import (
    Broker, BrokerageDeal, DealCommission, BrokerStatus,
    DealStatus, DealCloseReason, CommissionType, CommissionPaymentStatus,
    DEAL_STATUS_ORDER, SuspiciousActivityType,
)
from ...models.broker_board import BrokerBoardPost, BrokerBoardComment, BoardCategory
from ...models.landlord import LandlordListing, LandlordListingStatus

router = APIRouter()


# ===== 권한 체크 =====

async def require_broker(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> tuple:
    """SALES_REP + ACTIVE Broker 확인"""
    if current_user.role != UserRole.SALES_REP:
        raise HTTPException(status_code=403, detail="중개인 권한이 필요합니다")
    result = await db.execute(
        select(Broker).where(Broker.user_id == current_user.id)
    )
    broker = result.scalar_one_or_none()
    if not broker or broker.status != BrokerStatus.ACTIVE:
        raise HTTPException(status_code=403, detail="활성 중개인 계정이 필요합니다")
    return current_user, broker


# ===== Schemas =====

class DealStatusUpdate(BaseModel):
    new_status: str
    note: Optional[str] = None
    close_reason: Optional[str] = None

class DealLogEntry(BaseModel):
    note: str

class DealClaimRequest(BaseModel):
    listing_id: str
    doctor_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    expected_rent_deposit: Optional[int] = None
    expected_monthly_rent: Optional[int] = None
    expected_premium: Optional[int] = None
    expected_commission: Optional[int] = None
    lead_source: Optional[str] = None

class BoardPostCreate(BaseModel):
    category: Optional[str] = "DISCUSSION"
    title: str
    content: str

class CommentCreate(BaseModel):
    content: str
    parent_id: Optional[int] = None

class CommissionCalcRequest(BaseModel):
    deposit: Optional[int] = 0
    monthly_rent: Optional[int] = 0
    gross_commission: Optional[int] = 0
    landlord_commission: Optional[int] = 0
    marketing_cost: Optional[int] = 0
    ad_cost: Optional[int] = 0
    platform_rate: Optional[float] = 40.0
    broker_rate: Optional[float] = 60.0
    tax_rate: Optional[float] = 10.0
    withholding_tax: Optional[float] = 3.3


# ===== Helper =====

def generate_deal_number() -> str:
    now = datetime.utcnow()
    import random
    suffix = f"{random.randint(100000, 999999)}"
    return f"DEAL-{now.strftime('%Y%m%d')}-{suffix}"


def calc_legal_commission(deposit: int, monthly_rent: int) -> dict:
    """상가 임대차 법정 중개 수수료 계산"""
    transaction_amount = deposit + (monthly_rent * 100)
    if transaction_amount < 50_000_000:
        rate = 0.009
    elif transaction_amount < 200_000_000:
        rate = 0.008
    elif transaction_amount < 600_000_000:
        rate = 0.005
    elif transaction_amount < 900_000_000:
        rate = 0.004
    else:
        rate = 0.003  # 협의 (기본 0.3%)
    commission = int(transaction_amount * rate)
    vat = int(commission * 0.1)
    return {
        "transaction_amount": transaction_amount,
        "rate": rate * 100,
        "commission": commission,
        "vat": vat,
        "total": commission + vat,
    }


# ===== API Endpoints =====

@router.get("/dashboard")
async def broker_dashboard(
    auth: tuple = Depends(require_broker),
    db: AsyncSession = Depends(get_db),
):
    """중개인 대시보드 KPI"""
    user, broker = auth

    # 파이프라인 요약
    pipeline_result = await db.execute(
        select(BrokerageDeal.status, func.count(BrokerageDeal.id))
        .where(BrokerageDeal.broker_id == broker.id)
        .group_by(BrokerageDeal.status)
    )
    pipeline = {row[0].value: row[1] for row in pipeline_result.all()}

    # 최근 딜 5건
    recent_result = await db.execute(
        select(BrokerageDeal)
        .where(BrokerageDeal.broker_id == broker.id)
        .order_by(desc(BrokerageDeal.updated_at))
        .limit(5)
    )
    recent_deals = recent_result.scalars().all()

    # 커미션 합계
    commission_result = await db.execute(
        select(func.sum(DealCommission.net_amount))
        .join(BrokerageDeal, DealCommission.deal_id == BrokerageDeal.id)
        .where(
            and_(
                BrokerageDeal.broker_id == broker.id,
                DealCommission.commission_type == CommissionType.BROKER,
                DealCommission.payment_status == CommissionPaymentStatus.PAID,
            )
        )
    )
    total_paid_commission = commission_result.scalar() or 0

    return {
        "broker": {
            "id": broker.id,
            "display_name": broker.display_name,
            "tier": broker.tier.value,
            "total_deals": broker.total_deals,
            "closed_won_deals": broker.closed_won_deals,
            "commission_rate": broker.commission_rate,
        },
        "kpi": {
            "active_deals": broker.current_active_deals,
            "closed_won": broker.closed_won_deals,
            "total_commission_earned": broker.total_commission_earned,
            "total_paid_commission": total_paid_commission,
            "success_rate": round(
                (broker.closed_won_deals / broker.total_deals * 100) if broker.total_deals > 0 else 0, 1
            ),
        },
        "pipeline": pipeline,
        "recent_deals": [
            {
                "id": str(d.id),
                "deal_number": d.deal_number,
                "title": d.title,
                "status": d.status.value,
                "updated_at": d.updated_at.isoformat() if d.updated_at else None,
            }
            for d in recent_deals
        ],
    }


@router.get("/deals")
async def list_my_deals(
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    auth: tuple = Depends(require_broker),
    db: AsyncSession = Depends(get_db),
):
    """내 딜 목록"""
    _, broker = auth
    query = select(BrokerageDeal).where(BrokerageDeal.broker_id == broker.id)

    if status:
        query = query.where(BrokerageDeal.status == DealStatus(status))

    total_result = await db.execute(
        select(func.count(BrokerageDeal.id))
        .where(BrokerageDeal.broker_id == broker.id)
        .where(BrokerageDeal.status == DealStatus(status) if status else True)
    )
    total = total_result.scalar() or 0

    result = await db.execute(
        query.order_by(desc(BrokerageDeal.updated_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    deals = result.scalars().all()

    return {
        "items": [
            {
                "id": str(d.id),
                "deal_number": d.deal_number,
                "title": d.title,
                "status": d.status.value,
                "close_reason": d.close_reason.value if d.close_reason else None,
                "expected_commission": d.expected_commission,
                "actual_commission": d.actual_commission,
                "lead_score": d.lead_score,
                "circumvention_flag": d.circumvention_flag,
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
async def get_deal_detail(
    deal_id: str,
    auth: tuple = Depends(require_broker),
    db: AsyncSession = Depends(get_db),
):
    """딜 상세 (본인 딜만)"""
    _, broker = auth
    result = await db.execute(
        select(BrokerageDeal).where(
            and_(BrokerageDeal.id == deal_id, BrokerageDeal.broker_id == broker.id)
        )
    )
    deal = result.scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="딜을 찾을 수 없습니다")

    # 의사 정보
    doctor_info = None
    if deal.doctor_id:
        dr = await db.execute(select(User).where(User.id == deal.doctor_id))
        doctor = dr.scalar_one_or_none()
        if doctor:
            doctor_info = {
                "id": str(doctor.id),
                "name": doctor.full_name,
                "specialty": doctor.specialty,
                "opening_status": doctor.opening_status,
                "opening_region": doctor.opening_region,
            }

    # 매물 정보
    listing_info = None
    if deal.listing_id:
        lr = await db.execute(select(LandlordListing).where(LandlordListing.id == deal.listing_id))
        listing = lr.scalar_one_or_none()
        if listing:
            listing_info = {
                "id": str(listing.id),
                "title": listing.title,
                "address": listing.address,
                "rent_deposit": listing.rent_deposit,
                "rent_monthly": listing.rent_monthly,
                "premium": listing.premium,
            }

    return {
        "id": str(deal.id),
        "deal_number": deal.deal_number,
        "title": deal.title,
        "description": deal.description,
        "status": deal.status.value,
        "close_reason": deal.close_reason.value if deal.close_reason else None,
        "close_note": deal.close_note,
        "expected_rent_deposit": deal.expected_rent_deposit,
        "expected_monthly_rent": deal.expected_monthly_rent,
        "expected_premium": deal.expected_premium,
        "expected_commission": deal.expected_commission,
        "actual_rent_deposit": deal.actual_rent_deposit,
        "actual_monthly_rent": deal.actual_monthly_rent,
        "actual_premium": deal.actual_premium,
        "actual_commission": deal.actual_commission,
        "landlord_commission": deal.landlord_commission,
        "doctor_commission": deal.doctor_commission,
        "marketing_cost": deal.marketing_cost,
        "ad_cost": deal.ad_cost,
        "viewing_scheduled_at": deal.viewing_scheduled_at.isoformat() if deal.viewing_scheduled_at else None,
        "viewed_at": deal.viewed_at.isoformat() if deal.viewed_at else None,
        "contract_date": deal.contract_date.isoformat() if deal.contract_date else None,
        "move_in_date": deal.move_in_date.isoformat() if deal.move_in_date else None,
        "broker_notes": deal.broker_notes,
        "activity_log": deal.activity_log or [],
        "circumvention_flag": deal.circumvention_flag,
        "lead_source": deal.lead_source,
        "lead_score": deal.lead_score,
        "doctor": doctor_info,
        "listing": listing_info,
        "commissions": [
            {
                "id": c.id,
                "commission_type": c.commission_type.value,
                "gross_amount": c.gross_amount,
                "net_amount": c.net_amount,
                "payment_status": c.payment_status.value,
            }
            for c in (deal.commissions or [])
        ],
        "created_at": deal.created_at.isoformat() if deal.created_at else None,
        "updated_at": deal.updated_at.isoformat() if deal.updated_at else None,
    }


@router.post("/deals/{deal_id}/update-status")
async def update_deal_status(
    deal_id: str,
    body: DealStatusUpdate,
    auth: tuple = Depends(require_broker),
    db: AsyncSession = Depends(get_db),
):
    """딜 상태 변경 (순서 강제)"""
    user, broker = auth
    result = await db.execute(
        select(BrokerageDeal).where(
            and_(BrokerageDeal.id == deal_id, BrokerageDeal.broker_id == broker.id)
        )
    )
    deal = result.scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="딜을 찾을 수 없습니다")

    try:
        new_status = DealStatus(body.new_status)
    except ValueError:
        raise HTTPException(status_code=400, detail="유효하지 않은 상태입니다")

    old_status = deal.status

    # CLOSED_LOST는 어디서든 가능 (사유 필수)
    if new_status == DealStatus.CLOSED_LOST:
        if not body.close_reason:
            raise HTTPException(status_code=400, detail="종료 사유가 필요합니다")
        try:
            deal.close_reason = DealCloseReason(body.close_reason)
        except ValueError:
            raise HTTPException(status_code=400, detail="유효하지 않은 종료 사유입니다")
        deal.close_note = body.note
    else:
        # 순서 강제
        if old_status not in DEAL_STATUS_ORDER or new_status not in DEAL_STATUS_ORDER:
            raise HTTPException(status_code=400, detail="상태 전이가 불가합니다")
        old_idx = DEAL_STATUS_ORDER.index(old_status)
        new_idx = DEAL_STATUS_ORDER.index(new_status)
        if new_idx != old_idx + 1:
            raise HTTPException(status_code=400, detail=f"{old_status.value}에서 {new_status.value}로 직접 전환할 수 없습니다")

    # 상태별 필드 자동 설정
    if new_status == DealStatus.CLOSED_WON:
        deal.close_reason = DealCloseReason.COMPLETED

    # activity_log 추가
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "actor": str(user.id),
        "actor_name": broker.display_name,
        "action": "STATUS_CHANGE",
        "from": old_status.value,
        "to": new_status.value,
        "note": body.note or "",
    }
    current_log = deal.activity_log or []
    deal.activity_log = current_log + [log_entry]
    deal.status = new_status
    deal.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(deal)

    return {"message": "상태가 변경되었습니다", "status": deal.status.value}


@router.post("/deals/{deal_id}/log")
async def add_deal_log(
    deal_id: str,
    body: DealLogEntry,
    auth: tuple = Depends(require_broker),
    db: AsyncSession = Depends(get_db),
):
    """딜 메모 추가"""
    user, broker = auth
    result = await db.execute(
        select(BrokerageDeal).where(
            and_(BrokerageDeal.id == deal_id, BrokerageDeal.broker_id == broker.id)
        )
    )
    deal = result.scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="딜을 찾을 수 없습니다")

    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "actor": str(user.id),
        "actor_name": broker.display_name,
        "action": "NOTE",
        "note": body.note,
    }
    current_log = deal.activity_log or []
    deal.activity_log = current_log + [log_entry]
    deal.updated_at = datetime.utcnow()

    await db.commit()
    return {"message": "메모가 추가되었습니다"}


@router.get("/listings")
async def list_assigned_listings(
    region: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    auth: tuple = Depends(require_broker),
    db: AsyncSession = Depends(get_db),
):
    """담당 지역 ACTIVE 매물"""
    _, broker = auth
    query = select(LandlordListing).where(
        LandlordListing.status == LandlordListingStatus.ACTIVE
    )

    if region:
        query = query.where(LandlordListing.region_name.ilike(f"%{region}%"))
    elif broker.assigned_regions:
        region_filters = [
            LandlordListing.region_name.ilike(f"%{r}%") for r in broker.assigned_regions
        ]
        if region_filters:
            query = query.where(or_(*region_filters))

    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    result = await db.execute(
        query.order_by(desc(LandlordListing.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    listings = result.scalars().all()

    return {
        "items": [
            {
                "id": str(l.id),
                "title": l.title,
                "address": l.address,
                "region_name": l.region_name,
                "rent_deposit": l.rent_deposit,
                "rent_monthly": l.rent_monthly,
                "premium": l.premium,
                "area_pyeong": l.area_pyeong,
                "created_at": l.created_at.isoformat() if l.created_at else None,
            }
            for l in listings
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.post("/deals/claim")
async def claim_listing_as_deal(
    body: DealClaimRequest,
    auth: tuple = Depends(require_broker),
    db: AsyncSession = Depends(get_db),
):
    """매물을 딜로 생성 (LEAD)"""
    user, broker = auth

    # 매물 확인
    lr = await db.execute(
        select(LandlordListing).where(LandlordListing.id == body.listing_id)
    )
    listing = lr.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="매물을 찾을 수 없습니다")

    deal = BrokerageDeal(
        deal_number=generate_deal_number(),
        broker_id=broker.id,
        listing_id=listing.id,
        doctor_id=body.doctor_id if body.doctor_id else None,
        title=body.title,
        description=body.description,
        status=DealStatus.LEAD,
        expected_rent_deposit=body.expected_rent_deposit or listing.rent_deposit,
        expected_monthly_rent=body.expected_monthly_rent or listing.rent_monthly,
        expected_premium=body.expected_premium or listing.premium,
        expected_commission=body.expected_commission,
        lead_source=body.lead_source,
        activity_log=[{
            "timestamp": datetime.utcnow().isoformat(),
            "actor": str(user.id),
            "actor_name": broker.display_name,
            "action": "DEAL_CREATED",
            "note": f"매물 {listing.title}에서 딜 생성",
        }],
    )
    db.add(deal)

    # 성과 캐시 업데이트
    broker.total_deals = (broker.total_deals or 0) + 1
    broker.current_active_deals = (broker.current_active_deals or 0) + 1

    await db.commit()
    await db.refresh(deal)

    return {
        "message": "딜이 생성되었습니다",
        "deal_id": str(deal.id),
        "deal_number": deal.deal_number,
    }


# ===== 게시판 =====

@router.get("/board")
async def list_board_posts(
    category: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    auth: tuple = Depends(require_broker),
    db: AsyncSession = Depends(get_db),
):
    """게시판 목록"""
    query = select(BrokerBoardPost)
    if category:
        query = query.where(BrokerBoardPost.category == BoardCategory(category))

    total = (await db.execute(
        select(func.count(BrokerBoardPost.id))
    )).scalar() or 0

    result = await db.execute(
        query.order_by(desc(BrokerBoardPost.is_pinned), desc(BrokerBoardPost.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    posts = result.scalars().all()

    return {
        "items": [
            {
                "id": p.id,
                "category": p.category.value,
                "title": p.title,
                "is_pinned": p.is_pinned,
                "view_count": p.view_count,
                "comment_count": p.comment_count,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in posts
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.post("/board")
async def create_board_post(
    body: BoardPostCreate,
    auth: tuple = Depends(require_broker),
    db: AsyncSession = Depends(get_db),
):
    """게시글 작성 (NOTICE 제외)"""
    user, broker = auth
    cat = BoardCategory(body.category) if body.category else BoardCategory.DISCUSSION
    if cat == BoardCategory.NOTICE:
        raise HTTPException(status_code=403, detail="공지는 관리자만 작성할 수 있습니다")

    post = BrokerBoardPost(
        author_id=user.id,
        broker_id=broker.id,
        category=cat,
        title=body.title,
        content=body.content,
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return {"message": "글이 작성되었습니다", "id": post.id}


@router.get("/board/{post_id}")
async def get_board_post(
    post_id: int,
    auth: tuple = Depends(require_broker),
    db: AsyncSession = Depends(get_db),
):
    """게시글 + 댓글"""
    result = await db.execute(
        select(BrokerBoardPost).where(BrokerBoardPost.id == post_id)
    )
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="글을 찾을 수 없습니다")

    post.view_count += 1
    await db.commit()

    # 댓글
    comments_result = await db.execute(
        select(BrokerBoardComment)
        .where(BrokerBoardComment.post_id == post_id)
        .order_by(BrokerBoardComment.created_at)
    )
    comments = comments_result.scalars().all()

    return {
        "id": post.id,
        "category": post.category.value,
        "title": post.title,
        "content": post.content,
        "is_pinned": post.is_pinned,
        "view_count": post.view_count,
        "comment_count": post.comment_count,
        "created_at": post.created_at.isoformat() if post.created_at else None,
        "comments": [
            {
                "id": c.id,
                "content": c.content,
                "parent_id": c.parent_id,
                "author_id": str(c.author_id),
                "created_at": c.created_at.isoformat() if c.created_at else None,
            }
            for c in comments
        ],
    }


@router.post("/board/{post_id}/comments")
async def create_comment(
    post_id: int,
    body: CommentCreate,
    auth: tuple = Depends(require_broker),
    db: AsyncSession = Depends(get_db),
):
    """댓글/대댓글"""
    user, broker = auth
    result = await db.execute(
        select(BrokerBoardPost).where(BrokerBoardPost.id == post_id)
    )
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="글을 찾을 수 없습니다")

    comment = BrokerBoardComment(
        post_id=post_id,
        author_id=user.id,
        parent_id=body.parent_id,
        content=body.content,
    )
    db.add(comment)
    post.comment_count += 1
    await db.commit()
    await db.refresh(comment)
    return {"message": "댓글이 작성되었습니다", "id": comment.id}


# ===== 수수료 계산 =====

@router.get("/calculator")
async def calculate_commission(
    deposit: int = Query(0),
    monthly_rent: int = Query(0),
    gross_commission: int = Query(0),
    landlord_commission: int = Query(0),
    marketing_cost: int = Query(0),
    ad_cost: int = Query(0),
    platform_rate: float = Query(40.0),
    broker_rate: float = Query(60.0),
    auth: tuple = Depends(require_broker),
):
    """수수료 계산"""
    legal = calc_legal_commission(deposit, monthly_rent)

    total_income = gross_commission + landlord_commission
    total_cost = marketing_cost + ad_cost
    pre_tax = total_income - total_cost
    vat = int(pre_tax * 0.1)
    after_tax = pre_tax - vat
    platform_share = int(after_tax * platform_rate / 100)
    broker_share = int(after_tax * broker_rate / 100)
    withholding = int(broker_share * 0.033)
    broker_net = broker_share - withholding
    roi = round((after_tax / total_cost * 100), 1) if total_cost > 0 else 0

    return {
        "legal_commission": legal,
        "breakdown": {
            "total_income": total_income,
            "total_cost": total_cost,
            "pre_tax_profit": pre_tax,
            "vat": vat,
            "after_tax_profit": after_tax,
            "platform_share": platform_share,
            "broker_share_gross": broker_share,
            "withholding_tax": withholding,
            "broker_net": broker_net,
            "roi_percent": roi,
        },
    }


@router.get("/performance")
async def get_my_performance(
    auth: tuple = Depends(require_broker),
    db: AsyncSession = Depends(get_db),
):
    """본인 성과"""
    _, broker = auth

    # 월별 성사 건수 (최근 6개월)
    six_months_ago = datetime.utcnow() - timedelta(days=180)
    monthly_result = await db.execute(
        select(
            func.date_trunc('month', BrokerageDeal.updated_at).label('month'),
            func.count(BrokerageDeal.id),
        )
        .where(
            and_(
                BrokerageDeal.broker_id == broker.id,
                BrokerageDeal.status == DealStatus.CLOSED_WON,
                BrokerageDeal.updated_at >= six_months_ago,
            )
        )
        .group_by('month')
        .order_by('month')
    )
    monthly = [
        {"month": row[0].isoformat() if row[0] else None, "count": row[1]}
        for row in monthly_result.all()
    ]

    return {
        "total_deals": broker.total_deals,
        "closed_won": broker.closed_won_deals,
        "active_deals": broker.current_active_deals,
        "total_commission": broker.total_commission_earned,
        "avg_deal_days": broker.avg_deal_days,
        "success_rate": round(
            (broker.closed_won_deals / broker.total_deals * 100) if broker.total_deals > 0 else 0, 1
        ),
        "monthly_closed": monthly,
    }
