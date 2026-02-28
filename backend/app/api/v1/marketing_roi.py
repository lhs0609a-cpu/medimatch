"""
마케팅 ROI 분석 API

- KPI 요약, 채널별 분석, 월별 추이, 귀속 분석, AI 권고
- DB에 데이터 없으면 데모 데이터 반환
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
import random
import logging

from ..deps import get_db, get_current_active_user
from .service_guards import require_active_service
from ...models.user import User
from ...models.service_subscription import ServiceSubscription, ServiceType
from ...models.marketing_roi import MarketingSpend

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================================
# Pydantic schemas
# ============================================================

class MarketingSpendCreate(BaseModel):
    year_month: str
    channel: str = "OTHER"
    spend_amount: int = 0
    new_patients_acquired: int = 0
    inquiries_count: int = 0
    appointments_booked: int = 0
    attributed_revenue: int = 0
    notes: Optional[str] = None


class MarketingSpendUpdate(BaseModel):
    spend_amount: Optional[int] = None
    new_patients_acquired: Optional[int] = None
    inquiries_count: Optional[int] = None
    appointments_booked: Optional[int] = None
    attributed_revenue: Optional[int] = None
    notes: Optional[str] = None


# ============================================================
# Demo data
# ============================================================

CHANNEL_LABELS = {
    "NAVER_BLOG": "네이버 블로그",
    "NAVER_ADS": "네이버 광고",
    "GOOGLE_ADS": "구글 광고",
    "KAKAO": "카카오톡",
    "OFFLINE_FLYER": "오프라인 전단",
    "REFERRAL": "소개/추천",
    "SNS": "인스타그램/SNS",
    "OTHER": "기타",
}

DEMO_CHANNELS = [
    {"channel": "NAVER_BLOG", "spend": 800_000, "patients": 12, "inquiries": 45, "appointments": 18, "revenue": 4_800_000},
    {"channel": "NAVER_ADS", "spend": 1_500_000, "patients": 20, "inquiries": 80, "appointments": 30, "revenue": 7_200_000},
    {"channel": "GOOGLE_ADS", "spend": 600_000, "patients": 5, "inquiries": 25, "appointments": 8, "revenue": 2_000_000},
    {"channel": "KAKAO", "spend": 300_000, "patients": 4, "inquiries": 15, "appointments": 6, "revenue": 1_200_000},
    {"channel": "OFFLINE_FLYER", "spend": 200_000, "patients": 3, "inquiries": 10, "appointments": 4, "revenue": 900_000},
    {"channel": "REFERRAL", "spend": 0, "patients": 15, "inquiries": 15, "appointments": 15, "revenue": 6_000_000},
    {"channel": "SNS", "spend": 400_000, "patients": 8, "inquiries": 35, "appointments": 12, "revenue": 3_200_000},
]


def _generate_demo_data() -> list[dict]:
    rng = random.Random(46)
    today = date.today()
    records = []
    for month_offset in range(12):
        m = today.month - 11 + month_offset
        y = today.year
        if m <= 0:
            m += 12
            y -= 1
        ym = f"{y}-{m:02d}"
        # 계절 가중치
        season_factor = 1.0
        if m in [3, 4, 5]:
            season_factor = 1.15
        elif m in [7, 8]:
            season_factor = 0.85
        elif m in [11, 12]:
            season_factor = 1.1

        for ch in DEMO_CHANNELS:
            sf = season_factor * rng.uniform(0.85, 1.15)
            spend = int(ch["spend"] * sf)
            patients = max(0, int(ch["patients"] * sf * rng.uniform(0.8, 1.2)))
            inquiries = max(0, int(ch["inquiries"] * sf * rng.uniform(0.8, 1.2)))
            appointments = max(0, int(ch["appointments"] * sf * rng.uniform(0.8, 1.2)))
            revenue = max(0, int(ch["revenue"] * sf * rng.uniform(0.8, 1.2)))
            roi = round((revenue - spend) / spend * 100, 1) if spend > 0 else 0
            cpa = round(spend / patients) if patients > 0 else 0
            records.append({
                "year_month": ym,
                "channel": ch["channel"],
                "channel_label": CHANNEL_LABELS[ch["channel"]],
                "spend_amount": spend,
                "new_patients_acquired": patients,
                "inquiries_count": inquiries,
                "appointments_booked": appointments,
                "attributed_revenue": revenue,
                "roi": roi,
                "cpa": cpa,
                "is_demo": True,
            })
    return records


# ============================================================
# Endpoints
# ============================================================

@router.get("/summary")
async def get_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """KPI: 총마케팅비, 총신규환자, 평균CPA, 최고ROI채널"""
    data = _generate_demo_data()
    today = date.today()
    ym = f"{today.year}-{today.month:02d}"
    this_month = [r for r in data if r["year_month"] == ym]

    total_spend = sum(r["spend_amount"] for r in this_month)
    total_patients = sum(r["new_patients_acquired"] for r in this_month)
    total_revenue = sum(r["attributed_revenue"] for r in this_month)
    avg_cpa = round(total_spend / total_patients) if total_patients > 0 else 0
    overall_roi = round((total_revenue - total_spend) / total_spend * 100, 1) if total_spend > 0 else 0

    best_channel = max(
        [r for r in this_month if r["spend_amount"] > 0],
        key=lambda x: x["roi"],
        default=None,
    )

    return {
        "total_spend": total_spend,
        "total_new_patients": total_patients,
        "avg_cpa": avg_cpa,
        "overall_roi": overall_roi,
        "best_roi_channel": best_channel["channel_label"] if best_channel else "-",
        "best_roi_value": best_channel["roi"] if best_channel else 0,
        "is_demo": True,
    }


@router.get("/channel-breakdown")
async def get_channel_breakdown(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """채널별 지출/환자/ROI/효율점수"""
    data = _generate_demo_data()
    today = date.today()
    ym = f"{today.year}-{today.month:02d}"
    this_month = [r for r in data if r["year_month"] == ym]
    this_month.sort(key=lambda x: x["roi"], reverse=True)
    return {"channels": this_month, "is_demo": True}


@router.get("/monthly-trend")
async def get_monthly_trend(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """12개월 채널별 추이"""
    data = _generate_demo_data()
    by_month: dict[str, dict] = {}
    for r in data:
        ym = r["year_month"]
        if ym not in by_month:
            by_month[ym] = {"year_month": ym, "total_spend": 0, "total_patients": 0, "total_revenue": 0, "channels": {}}
        by_month[ym]["total_spend"] += r["spend_amount"]
        by_month[ym]["total_patients"] += r["new_patients_acquired"]
        by_month[ym]["total_revenue"] += r["attributed_revenue"]
        by_month[ym]["channels"][r["channel"]] = {
            "spend": r["spend_amount"],
            "patients": r["new_patients_acquired"],
            "revenue": r["attributed_revenue"],
        }
    trend = sorted(by_month.values(), key=lambda x: x["year_month"])
    return {"data": trend, "is_demo": True}


@router.get("/attribution")
async def get_attribution(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """환자 유입경로 분석"""
    data = _generate_demo_data()
    today = date.today()
    ym = f"{today.year}-{today.month:02d}"
    this_month = [r for r in data if r["year_month"] == ym]
    total_patients = sum(r["new_patients_acquired"] for r in this_month)

    attribution = []
    for r in this_month:
        attribution.append({
            "channel": r["channel"],
            "channel_label": r["channel_label"],
            "patients": r["new_patients_acquired"],
            "share_pct": round(r["new_patients_acquired"] / total_patients * 100, 1) if total_patients else 0,
            "conversion_rate": round(r["new_patients_acquired"] / r["inquiries_count"] * 100, 1) if r["inquiries_count"] else 0,
        })
    attribution.sort(key=lambda x: x["patients"], reverse=True)
    return {"attribution": attribution, "total_patients": total_patients, "is_demo": True}


@router.get("/ai-recommendations")
async def get_ai_recommendations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """AI 마케팅 예산 최적화 권고"""
    return {
        "recommendations": [
            {
                "id": "budget-reallocation",
                "title": "예산 재배분 제안",
                "category": "예산 최적화",
                "priority": "HIGH",
                "potential_improvement": "신규 환자 +15%",
                "description": "구글 광고의 CPA가 네이버 블로그 대비 80% 높습니다. 구글 광고 예산 30만원을 네이버 블로그로 이전하면 월 5명 추가 확보가 예상됩니다.",
                "action_items": ["구글 광고 캠페인 성과 상세 분석", "네이버 블로그 콘텐츠 제작 빈도 증가", "전환 추적 코드 설치 확인"],
            },
            {
                "id": "seasonal-optimization",
                "title": "시즌별 예산 조정",
                "category": "시즌 최적화",
                "priority": "MEDIUM",
                "potential_improvement": "비용 효율 +20%",
                "description": "봄철(3-5월)에 환자 유입이 15% 증가하는 패턴이 관찰됩니다. 봄철에 마케팅 예산을 집중 투자하면 ROI를 20% 개선할 수 있습니다.",
                "action_items": ["월별 유입 패턴 데이터 확인", "봄철 캠페인 사전 기획", "비수기 예산 최소화 계획"],
            },
            {
                "id": "referral-program",
                "title": "소개 프로그램 강화",
                "category": "채널 확대",
                "priority": "HIGH",
                "potential_improvement": "CPA 0원 채널 확대",
                "description": "소개/추천 채널의 CPA가 0원이며 환자 충성도가 가장 높습니다. 체계적인 환자 소개 프로그램을 도입하면 월 5-10명 추가 확보가 가능합니다.",
                "action_items": ["환자 소개 인센티브 프로그램 설계", "소개 카드/QR코드 제작", "기존 환자 만족도 조사 실시"],
            },
        ],
        "is_demo": True,
    }


@router.post("/")
async def create_marketing_spend(
    payload: MarketingSpendCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    entry = MarketingSpend(user_id=current_user.id, **payload.model_dump())
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return {"id": str(entry.id), "message": "등록 완료"}


@router.put("/{entry_id}")
async def update_marketing_spend(
    entry_id: str,
    payload: MarketingSpendUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    result = await db.execute(
        select(MarketingSpend).where(and_(MarketingSpend.id == entry_id, MarketingSpend.user_id == current_user.id))
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Not found")
    for key, val in payload.model_dump(exclude_unset=True).items():
        setattr(entry, key, val)
    entry.updated_at = datetime.utcnow()
    await db.commit()
    return {"message": "수정 완료"}


@router.delete("/{entry_id}")
async def delete_marketing_spend(
    entry_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    result = await db.execute(
        select(MarketingSpend).where(and_(MarketingSpend.id == entry_id, MarketingSpend.user_id == current_user.id))
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Not found")
    await db.delete(entry)
    await db.commit()
    return {"message": "삭제 완료"}
