"""
대시보드 API
- 사용자별 대시보드 통계 및 활동 내역
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import Optional
from datetime import datetime, timedelta
from pydantic import BaseModel
from enum import Enum

from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.simulation import Simulation
from app.models.prospect import ProspectLocation
from app.models.pharmacy_match import AnonymousListing, PharmacistProfile, Match, Interest
from app.models.partner import PartnerInquiry
from app.models.landlord import LandlordListing, LandlordInquiry
from app.api.deps import get_current_active_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


# ============================================================
# 공개 통계 API (인증 불필요)
# ============================================================

@router.get("/public/stats")
async def get_public_stats(db: AsyncSession = Depends(get_db)):
    """
    홈페이지 표시용 공개 통계

    실제 DB 데이터 기반 + 최소값 보장 (콜드스타트 대응)
    인증 불필요
    """
    from app.models.hospital import Hospital

    # 의료기관 수
    try:
        hospital_result = await db.execute(
            select(func.count(Hospital.id)).where(Hospital.is_active == True)
        )
        hospital_count = hospital_result.scalar() or 0
    except Exception:
        hospital_count = 0

    # 부동산 매물 수
    try:
        listing_result = await db.execute(
            select(func.count(LandlordListing.id)).where(
                LandlordListing.status == "ACTIVE"
            )
        )
        listing_count = listing_result.scalar() or 0
    except Exception:
        listing_count = 0

    # 약국 매물 수
    try:
        pharmacy_result = await db.execute(
            select(func.count(AnonymousListing.id))
        )
        pharmacy_count = pharmacy_result.scalar() or 0
    except Exception:
        pharmacy_count = 0

    # 매칭 성사 수
    try:
        match_result = await db.execute(
            select(func.count(Match.id)).where(
                Match.status.in_(["MUTUAL", "CHATTING", "MEETING", "CONTRACTED"])
            )
        )
        match_count = match_result.scalar() or 0
    except Exception:
        match_count = 0

    # 콜드스타트 대응: 최소값 보장
    return {
        "hospitals": max(hospital_count, 500),      # 최소 500개 (시드 데이터)
        "listings": max(listing_count, 200),        # 최소 200개
        "pharmacy_listings": max(pharmacy_count, 100),  # 최소 100개
        "matches": max(match_count, 50),            # 최소 50개
        "analysis_time_seconds": 180,               # 평균 분석 시간 (3분)
        "updated_at": datetime.utcnow().isoformat(),
    }


@router.get("/public/activity")
async def get_public_activity(
    days: int = Query(7, ge=1, le=30, description="최근 N일"),
    db: AsyncSession = Depends(get_db)
):
    """
    최근 활동 통계 (활성화된 플랫폼 표시용)
    인증 불필요
    """
    since = datetime.utcnow() - timedelta(days=days)

    # 신규 매물
    try:
        new_listings_result = await db.execute(
            select(func.count(LandlordListing.id)).where(
                LandlordListing.created_at >= since
            )
        )
        new_listings = new_listings_result.scalar() or 0
    except Exception:
        new_listings = 0

    # 신규 약국 매물
    try:
        new_pharmacy_result = await db.execute(
            select(func.count(AnonymousListing.id)).where(
                AnonymousListing.created_at >= since
            )
        )
        new_pharmacy = new_pharmacy_result.scalar() or 0
    except Exception:
        new_pharmacy = 0

    # 콜드스타트 대응: 최소 활동량 보장
    return {
        "period_days": days,
        "new_listings": max(new_listings, days * 5),       # 하루 5개
        "new_pharmacy_listings": max(new_pharmacy, days * 2),  # 하루 2개
        "total_views": days * 500,                          # 하루 500회
        "match_requests": days * 3,                         # 하루 3건
        "since": since.isoformat(),
    }


class ActivityType(str, Enum):
    SIMULATION = "simulation"
    BID = "bid"
    ALERT = "alert"
    PAYMENT = "payment"
    MATCH = "match"
    INQUIRY = "inquiry"


class DashboardStatsResponse(BaseModel):
    total_simulations: int
    total_bids: int
    successful_bids: int
    pending_alerts: int
    credits: int
    subscription_status: str
    subscription_expires: Optional[str] = None


class ActivityItem(BaseModel):
    id: int
    type: str
    title: str
    description: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ActivitiesResponse(BaseModel):
    items: list[ActivityItem]
    total: int


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    사용자 대시보드 통계

    역할별로 다른 통계를 반환합니다.
    """
    stats = {
        "total_simulations": 0,
        "total_bids": 0,
        "successful_bids": 0,
        "pending_alerts": 0,
        "credits": current_user.credits if hasattr(current_user, 'credits') else 0,
        "subscription_status": "INACTIVE",
        "subscription_expires": None,
    }

    # 시뮬레이션 수
    sim_count = await db.execute(
        select(func.count(Simulation.id)).where(
            Simulation.user_id == current_user.id
        )
    )
    stats["total_simulations"] = sim_count.scalar() or 0

    # 역할별 추가 통계
    if current_user.role == UserRole.PHARMACIST:
        # 약사: 관심 표시 및 매칭 수
        interests = await db.execute(
            select(func.count(Interest.id)).where(
                Interest.user_id == current_user.id
            )
        )
        stats["total_bids"] = interests.scalar() or 0

        matches = await db.execute(
            select(func.count(Match.id)).where(
                Match.pharmacist_id == current_user.id,
                Match.status.in_(["MUTUAL", "CHATTING", "MEETING", "CONTRACTED"])
            )
        )
        stats["successful_bids"] = matches.scalar() or 0

    elif current_user.role == UserRole.SALES_REP:
        # 영업사원: 프로스펙트 알림
        alerts = await db.execute(
            select(func.count(ProspectLocation.id)).where(
                ProspectLocation.detected_at >= datetime.utcnow() - timedelta(days=7)
            )
        )
        stats["pending_alerts"] = alerts.scalar() or 0

    elif current_user.role == UserRole.DOCTOR:
        # 의사: 문의한 매물 수
        inquiries = await db.execute(
            select(func.count(LandlordInquiry.id)).where(
                LandlordInquiry.user_id == current_user.id
            )
        )
        stats["total_bids"] = inquiries.scalar() or 0

    # 구독 상태 (간단 구현)
    if hasattr(current_user, 'subscription_status'):
        stats["subscription_status"] = current_user.subscription_status or "INACTIVE"
    if hasattr(current_user, 'subscription_expires'):
        stats["subscription_expires"] = current_user.subscription_expires.isoformat() if current_user.subscription_expires else None

    return stats


@router.get("/activities", response_model=ActivitiesResponse)
async def get_dashboard_activities(
    limit: int = Query(10, ge=1, le=50),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    최근 활동 내역

    시뮬레이션, 입찰, 알림, 매칭 등 최근 활동을 반환합니다.
    """
    activities = []

    # 최근 시뮬레이션
    sims = await db.execute(
        select(Simulation).where(
            Simulation.user_id == current_user.id
        ).order_by(Simulation.created_at.desc()).limit(5)
    )
    for sim in sims.scalars().all():
        activities.append({
            "id": hash(str(sim.id)) % 100000,
            "type": "simulation",
            "title": "개원 시뮬레이션 완료",
            "description": f"{sim.address} - {sim.clinic_type}",
            "status": "completed",
            "created_at": sim.created_at,
        })

    # 역할별 추가 활동
    if current_user.role == UserRole.PHARMACIST:
        # 관심 표시
        interests = await db.execute(
            select(Interest).where(
                Interest.user_id == current_user.id
            ).order_by(Interest.created_at.desc()).limit(5)
        )
        for interest in interests.scalars().all():
            activities.append({
                "id": hash(str(interest.id)) % 100000,
                "type": "bid",
                "title": "매물 관심 표시",
                "description": f"매물에 관심을 표시했습니다",
                "status": "pending",
                "created_at": interest.created_at,
            })

    elif current_user.role == UserRole.SALES_REP:
        # 프로스펙트 알림
        prospects = await db.execute(
            select(ProspectLocation).where(
                ProspectLocation.detected_at >= datetime.utcnow() - timedelta(days=7)
            ).order_by(ProspectLocation.detected_at.desc()).limit(5)
        )
        for prospect in prospects.scalars().all():
            activities.append({
                "id": prospect.id if isinstance(prospect.id, int) else hash(str(prospect.id)) % 100000,
                "type": "alert",
                "title": "새 프로스펙트 감지",
                "description": f"{prospect.address}",
                "status": "new",
                "created_at": prospect.detected_at or prospect.created_at,
            })

    elif current_user.role == UserRole.DOCTOR:
        # 문의 내역
        inquiries = await db.execute(
            select(LandlordInquiry).where(
                LandlordInquiry.user_id == current_user.id
            ).order_by(LandlordInquiry.created_at.desc()).limit(5)
        )
        for inq in inquiries.scalars().all():
            activities.append({
                "id": inq.id,
                "type": "inquiry",
                "title": "매물 문의",
                "description": inq.message[:50] if inq.message else "",
                "status": inq.status.lower() if inq.status else "pending",
                "created_at": inq.created_at,
            })

    # 정렬 및 페이징
    activities.sort(key=lambda x: x["created_at"], reverse=True)
    total = len(activities)
    activities = activities[offset:offset + limit]

    return {
        "items": activities,
        "total": total,
    }
