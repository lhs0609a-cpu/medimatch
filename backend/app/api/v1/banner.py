"""
파트너 배너 광고 API (CPM 방식)

- 노출수 기반 과금 (1000회당 5000원)
- 배너 생성/관리
- 노출/클릭 추적
- 통계 조회
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, or_
from typing import Optional, List
from uuid import UUID
from datetime import datetime, date, timedelta
import random

from ..deps import get_db, get_current_active_user
from ...core.security import get_current_user, TokenData
from ...models.user import User, UserRole
from ...models.banner import (
    BannerAd, BannerEvent, BannerDailyStats,
    BannerPosition, BannerStatus,
    BANNER_SIZES, DEFAULT_CPM_RATES
)
from ...models.partner import Partner

router = APIRouter()


# ============================================================
# 공개 API (배너 조회 및 이벤트 추적)
# ============================================================

@router.get("/banners")
async def get_banners(
    position: str = Query(..., description="배너 위치: HOME_TOP, SIDEBAR, SEARCH_RESULT, PARTNERS_LIST"),
    limit: int = Query(5, ge=1, le=10),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[TokenData] = Depends(get_current_user)
):
    """
    활성 배너 조회

    해당 위치에 노출 가능한 배너를 반환합니다.
    예산이 소진되지 않은 배너만 반환됩니다.
    """
    try:
        position_enum = BannerPosition(position)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid position")

    today = date.today()

    # 활성 배너 조회
    result = await db.execute(
        select(BannerAd).where(
            and_(
                BannerAd.position == position_enum,
                BannerAd.status == BannerStatus.ACTIVE,
                BannerAd.start_date <= today,
                BannerAd.end_date >= today,
                BannerAd.spent < BannerAd.total_budget
            )
        )
    )
    banners = result.scalars().all()

    # 일일 예산 체크 및 필터링
    available_banners = []
    for banner in banners:
        if banner.daily_budget and banner.today_spent >= banner.daily_budget:
            continue
        available_banners.append(banner)

    # 가중치 랜덤 선택 (남은 예산 기준)
    if len(available_banners) > limit:
        weights = [b.remaining_budget for b in available_banners]
        total_weight = sum(weights)
        if total_weight > 0:
            weights = [w / total_weight for w in weights]
            selected_banners = random.choices(available_banners, weights=weights, k=limit)
        else:
            selected_banners = random.sample(available_banners, limit)
    else:
        selected_banners = available_banners

    return {
        "position": position,
        "banners": [
            {
                "id": b.id,
                "title": b.title,
                "subtitle": b.subtitle,
                "image_url": b.image_url,
                "link_url": b.link_url,
            }
            for b in selected_banners
        ],
        "total": len(selected_banners)
    }


@router.post("/banners/{banner_id}/impression")
async def record_impression(
    banner_id: int,
    request: Request,
    session_id: Optional[str] = None,
    page_url: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[TokenData] = Depends(get_current_user)
):
    """
    배너 노출 기록

    1000회 노출당 CPM 요율만큼 과금됩니다.
    """
    result = await db.execute(
        select(BannerAd).where(BannerAd.id == banner_id)
    )
    banner = result.scalar_one_or_none()

    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")

    if banner.status != BannerStatus.ACTIVE:
        return {"recorded": False, "reason": "Banner not active"}

    # 예산 체크
    if banner.is_budget_exhausted:
        banner.status = BannerStatus.COMPLETED
        await db.commit()
        return {"recorded": False, "reason": "Budget exhausted"}

    if banner.is_daily_budget_exhausted:
        return {"recorded": False, "reason": "Daily budget exhausted"}

    # 중복 노출 방지 (같은 세션에서 1시간 내 중복 노출 제외)
    if session_id:
        one_hour_ago = datetime.utcnow() - timedelta(hours=1)
        dup_check = await db.execute(
            select(BannerEvent).where(
                and_(
                    BannerEvent.banner_id == banner_id,
                    BannerEvent.session_id == session_id,
                    BannerEvent.event_type == "impression",
                    BannerEvent.created_at > one_hour_ago
                )
            ).limit(1)
        )
        if dup_check.scalar_one_or_none():
            return {"recorded": False, "reason": "Duplicate impression"}

    # 이벤트 기록
    user_id = UUID(current_user.user_id) if current_user else None
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent", "")

    event = BannerEvent(
        banner_id=banner_id,
        event_type="impression",
        user_id=user_id,
        session_id=session_id,
        ip_address=client_ip,
        user_agent=user_agent[:500] if user_agent else None,
        page_url=page_url,
        referer=request.headers.get("referer"),
    )
    db.add(event)

    # 통계 업데이트
    banner.impressions += 1
    banner.today_impressions += 1
    banner.last_impression_at = datetime.utcnow()

    # CPM 과금 (1000회마다)
    if banner.impressions % 1000 == 0:
        charge_amount = banner.cpm_rate
        banner.spent += charge_amount
        banner.today_spent += charge_amount

        # 예산 소진 확인
        if banner.spent >= banner.total_budget:
            banner.status = BannerStatus.COMPLETED

    await db.commit()

    return {
        "recorded": True,
        "impressions": banner.impressions,
        "charged": banner.impressions % 1000 == 0
    }


@router.post("/banners/{banner_id}/click")
async def record_click(
    banner_id: int,
    request: Request,
    session_id: Optional[str] = None,
    page_url: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[TokenData] = Depends(get_current_user)
):
    """배너 클릭 기록"""
    result = await db.execute(
        select(BannerAd).where(BannerAd.id == banner_id)
    )
    banner = result.scalar_one_or_none()

    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")

    # 이벤트 기록
    user_id = UUID(current_user.user_id) if current_user else None
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent", "")

    event = BannerEvent(
        banner_id=banner_id,
        event_type="click",
        user_id=user_id,
        session_id=session_id,
        ip_address=client_ip,
        user_agent=user_agent[:500] if user_agent else None,
        page_url=page_url,
        referer=request.headers.get("referer"),
    )
    db.add(event)

    # 클릭 수 업데이트
    banner.clicks += 1
    banner.updated_at = datetime.utcnow()

    await db.commit()

    return {
        "recorded": True,
        "redirect_url": banner.link_url
    }


# ============================================================
# 파트너용 API (광고주)
# ============================================================

@router.post("/partners/ads")
async def create_banner_ad(
    title: str,
    image_url: str,
    position: str,
    total_budget: int,
    start_date: date,
    end_date: date,
    link_url: Optional[str] = None,
    subtitle: Optional[str] = None,
    daily_budget: Optional[int] = None,
    target_regions: Optional[List[str]] = Query(None),
    target_user_roles: Optional[List[str]] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    배너 광고 생성

    파트너만 광고를 생성할 수 있습니다.
    생성 후 관리자 승인이 필요합니다.
    """
    # 파트너 확인
    partner_result = await db.execute(
        select(Partner).where(Partner.user_id == current_user.id)
    )
    partner = partner_result.scalar_one_or_none()

    if not partner:
        raise HTTPException(status_code=403, detail="Partner registration required")

    # 위치 검증
    try:
        position_enum = BannerPosition(position)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid position")

    # CPM 요율 설정
    cpm_rate = DEFAULT_CPM_RATES.get(position_enum, 5000)

    # 최소 예산 확인
    min_budget = cpm_rate * 10  # 최소 1만회 노출
    if total_budget < min_budget:
        raise HTTPException(
            status_code=400,
            detail=f"Minimum budget is {min_budget:,}원 for {position} position"
        )

    banner = BannerAd(
        partner_id=partner.id,
        title=title,
        subtitle=subtitle,
        image_url=image_url,
        link_url=link_url,
        position=position_enum,
        cpm_rate=cpm_rate,
        daily_budget=daily_budget,
        total_budget=total_budget,
        start_date=start_date,
        end_date=end_date,
        target_regions=target_regions or [],
        target_user_roles=target_user_roles or [],
        status=BannerStatus.PENDING,
    )

    db.add(banner)
    await db.commit()
    await db.refresh(banner)

    return {
        "id": banner.id,
        "status": banner.status.value,
        "cpm_rate": banner.cpm_rate,
        "estimated_impressions": total_budget // cpm_rate * 1000,
        "message": "광고가 생성되었습니다. 관리자 승인 후 노출됩니다."
    }


@router.get("/partners/ads/my")
async def get_my_ads(
    status_filter: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """내 광고 목록"""
    # 파트너 확인
    partner_result = await db.execute(
        select(Partner).where(Partner.user_id == current_user.id)
    )
    partner = partner_result.scalar_one_or_none()

    if not partner:
        return {"items": [], "total": 0, "page": page, "page_size": page_size}

    query = select(BannerAd).where(BannerAd.partner_id == partner.id)

    if status_filter:
        try:
            status_enum = BannerStatus(status_filter)
            query = query.where(BannerAd.status == status_enum)
        except ValueError:
            pass

    # 전체 개수
    count_result = await db.execute(
        select(func.count(BannerAd.id)).where(BannerAd.partner_id == partner.id)
    )
    total = count_result.scalar()

    # 목록 조회
    result = await db.execute(
        query.order_by(BannerAd.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    banners = result.scalars().all()

    return {
        "items": [_banner_to_dict(b) for b in banners],
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.get("/partners/ads/{banner_id}")
async def get_my_ad(
    banner_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """내 광고 상세"""
    # 파트너 확인
    partner_result = await db.execute(
        select(Partner).where(Partner.user_id == current_user.id)
    )
    partner = partner_result.scalar_one_or_none()

    if not partner:
        raise HTTPException(status_code=403, detail="Partner registration required")

    result = await db.execute(
        select(BannerAd).where(
            and_(
                BannerAd.id == banner_id,
                BannerAd.partner_id == partner.id
            )
        )
    )
    banner = result.scalar_one_or_none()

    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")

    return _banner_to_dict(banner, include_stats=True)


@router.get("/partners/ads/{banner_id}/stats")
async def get_ad_stats(
    banner_id: int,
    days: int = Query(30, ge=1, le=90),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """광고 통계"""
    # 파트너 확인
    partner_result = await db.execute(
        select(Partner).where(Partner.user_id == current_user.id)
    )
    partner = partner_result.scalar_one_or_none()

    if not partner:
        raise HTTPException(status_code=403, detail="Partner registration required")

    result = await db.execute(
        select(BannerAd).where(
            and_(
                BannerAd.id == banner_id,
                BannerAd.partner_id == partner.id
            )
        )
    )
    banner = result.scalar_one_or_none()

    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")

    # 일별 통계 조회
    start_date = date.today() - timedelta(days=days)
    stats_result = await db.execute(
        select(BannerDailyStats).where(
            and_(
                BannerDailyStats.banner_id == banner_id,
                BannerDailyStats.date >= start_date
            )
        ).order_by(BannerDailyStats.date)
    )
    daily_stats = stats_result.scalars().all()

    return {
        "banner_id": banner_id,
        "summary": {
            "total_impressions": banner.impressions,
            "total_clicks": banner.clicks,
            "total_spent": banner.spent,
            "ctr": banner.ctr,
            "remaining_budget": banner.remaining_budget,
        },
        "daily": [
            {
                "date": s.date.isoformat(),
                "impressions": s.impressions,
                "clicks": s.clicks,
                "spent": s.spent,
                "ctr": s.ctr,
            }
            for s in daily_stats
        ]
    }


@router.put("/partners/ads/{banner_id}/pause")
async def pause_ad(
    banner_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """광고 일시정지"""
    # 파트너 확인
    partner_result = await db.execute(
        select(Partner).where(Partner.user_id == current_user.id)
    )
    partner = partner_result.scalar_one_or_none()

    if not partner:
        raise HTTPException(status_code=403, detail="Partner registration required")

    result = await db.execute(
        select(BannerAd).where(
            and_(
                BannerAd.id == banner_id,
                BannerAd.partner_id == partner.id
            )
        )
    )
    banner = result.scalar_one_or_none()

    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")

    if banner.status == BannerStatus.ACTIVE:
        banner.status = BannerStatus.PAUSED
        message = "광고가 일시정지되었습니다."
    elif banner.status == BannerStatus.PAUSED:
        banner.status = BannerStatus.ACTIVE
        message = "광고가 재개되었습니다."
    else:
        raise HTTPException(status_code=400, detail="Cannot change status")

    banner.updated_at = datetime.utcnow()
    await db.commit()

    return {"status": banner.status.value, "message": message}


@router.post("/partners/ads/{banner_id}/budget")
async def add_budget(
    banner_id: int,
    amount: int = Query(..., ge=10000, description="충전 금액 (최소 1만원)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """예산 충전"""
    # 파트너 확인
    partner_result = await db.execute(
        select(Partner).where(Partner.user_id == current_user.id)
    )
    partner = partner_result.scalar_one_or_none()

    if not partner:
        raise HTTPException(status_code=403, detail="Partner registration required")

    result = await db.execute(
        select(BannerAd).where(
            and_(
                BannerAd.id == banner_id,
                BannerAd.partner_id == partner.id
            )
        )
    )
    banner = result.scalar_one_or_none()

    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")

    # 예산 추가
    banner.total_budget += amount

    # 완료된 광고 재활성화
    if banner.status == BannerStatus.COMPLETED:
        banner.status = BannerStatus.ACTIVE

    banner.updated_at = datetime.utcnow()
    await db.commit()

    return {
        "status": banner.status.value,
        "total_budget": banner.total_budget,
        "remaining_budget": banner.remaining_budget,
        "message": f"{amount:,}원이 충전되었습니다."
    }


# ============================================================
# 관리자용 API
# ============================================================

@router.get("/admin/ads")
async def get_all_ads(
    status_filter: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """전체 광고 목록 (관리자용)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")

    query = select(BannerAd)

    if status_filter:
        try:
            status_enum = BannerStatus(status_filter)
            query = query.where(BannerAd.status == status_enum)
        except ValueError:
            pass

    # 전체 개수
    count_result = await db.execute(select(func.count(BannerAd.id)))
    total = count_result.scalar()

    # 목록 조회
    result = await db.execute(
        query.order_by(BannerAd.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    banners = result.scalars().all()

    return {
        "items": [_banner_to_dict(b, include_stats=True) for b in banners],
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.post("/admin/ads/{banner_id}/approve")
async def approve_ad(
    banner_id: int,
    approved: bool,
    rejection_reason: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """광고 승인/거부 (관리자용)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")

    result = await db.execute(
        select(BannerAd).where(BannerAd.id == banner_id)
    )
    banner = result.scalar_one_or_none()

    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")

    if approved:
        banner.status = BannerStatus.ACTIVE
        message = "광고가 승인되었습니다."
    else:
        banner.status = BannerStatus.REJECTED
        banner.rejection_reason = rejection_reason
        message = "광고가 거부되었습니다."

    banner.updated_at = datetime.utcnow()
    await db.commit()

    return {"status": banner.status.value, "message": message}


@router.get("/admin/ads/revenue")
async def get_ad_revenue(
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """광고 수익 통계 (관리자용)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")

    start_date = date.today() - timedelta(days=days)

    # 일별 수익 집계
    result = await db.execute(
        select(
            BannerDailyStats.date,
            func.sum(BannerDailyStats.impressions).label('impressions'),
            func.sum(BannerDailyStats.clicks).label('clicks'),
            func.sum(BannerDailyStats.spent).label('spent')
        ).where(
            BannerDailyStats.date >= start_date
        ).group_by(BannerDailyStats.date).order_by(BannerDailyStats.date)
    )
    daily_revenue = result.all()

    # 전체 통계
    total_result = await db.execute(
        select(
            func.sum(BannerAd.impressions),
            func.sum(BannerAd.clicks),
            func.sum(BannerAd.spent)
        )
    )
    total = total_result.one()

    return {
        "total": {
            "impressions": total[0] or 0,
            "clicks": total[1] or 0,
            "revenue": total[2] or 0,
        },
        "daily": [
            {
                "date": r.date.isoformat(),
                "impressions": r.impressions or 0,
                "clicks": r.clicks or 0,
                "revenue": r.spent or 0,
            }
            for r in daily_revenue
        ]
    }


# ============================================================
# 유틸리티 API
# ============================================================

@router.get("/banners/positions")
async def get_banner_positions():
    """배너 위치 및 사이즈 정보"""
    return {
        "positions": [
            {
                "value": pos.value,
                "width": info["width"],
                "height": info["height"],
                "description": info["description"],
                "cpm_rate": DEFAULT_CPM_RATES.get(pos, 5000),
            }
            for pos, info in BANNER_SIZES.items()
        ]
    }


# ============================================================
# Helper Functions
# ============================================================

def _banner_to_dict(banner: BannerAd, include_stats: bool = False) -> dict:
    """배너를 딕셔너리로 변환"""
    data = {
        "id": banner.id,
        "partner_id": banner.partner_id,
        "title": banner.title,
        "subtitle": banner.subtitle,
        "image_url": banner.image_url,
        "link_url": banner.link_url,
        "position": banner.position.value,
        "cpm_rate": banner.cpm_rate,
        "daily_budget": banner.daily_budget,
        "total_budget": banner.total_budget,
        "start_date": banner.start_date.isoformat() if banner.start_date else None,
        "end_date": banner.end_date.isoformat() if banner.end_date else None,
        "status": banner.status.value,
        "rejection_reason": banner.rejection_reason,
        "created_at": banner.created_at.isoformat() if banner.created_at else None,
    }

    if include_stats:
        data.update({
            "impressions": banner.impressions,
            "clicks": banner.clicks,
            "spent": banner.spent,
            "ctr": banner.ctr,
            "remaining_budget": banner.remaining_budget,
        })

    return data
