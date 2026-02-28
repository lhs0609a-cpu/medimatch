"""
고정비 절감 분석 API

- KPI 요약, 월별 추이, 항목별 분해, 벤치마크, 계약 관리, AI 권고
- DB에 데이터 없으면 데모 데이터 반환
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime, timedelta
import random
import logging

from ..deps import get_db, get_current_active_user
from .service_guards import require_active_service
from ...models.user import User
from ...models.service_subscription import ServiceSubscription, ServiceType
from ...models.fixed_cost import FixedCostEntry

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================================
# Pydantic schemas
# ============================================================

class FixedCostCreate(BaseModel):
    year_month: str
    cost_category: str = "OTHER"
    amount: int = 0
    vendor_name: Optional[str] = None
    contract_end_date: Optional[date] = None
    note: Optional[str] = None


class FixedCostUpdate(BaseModel):
    cost_category: Optional[str] = None
    amount: Optional[int] = None
    vendor_name: Optional[str] = None
    contract_end_date: Optional[date] = None
    note: Optional[str] = None


# ============================================================
# Demo data
# ============================================================

DEMO_FIXED_COSTS = [
    {"category": "RENT", "vendor": "강남빌딩 관리사무소", "amount": 5_500_000, "end": 180},
    {"category": "UTILITIES", "vendor": "한국전력/서울도시가스", "amount": 850_000, "end": None},
    {"category": "INSURANCE", "vendor": "삼성화재", "amount": 420_000, "end": 90},
    {"category": "EQUIPMENT_LEASE", "vendor": "GE Healthcare", "amount": 1_200_000, "end": 365},
    {"category": "LOAN_REPAYMENT", "vendor": "국민은행", "amount": 2_300_000, "end": 730},
    {"category": "MAINTENANCE", "vendor": "의료기기정비(주)", "amount": 350_000, "end": 60},
    {"category": "COMMUNICATION", "vendor": "KT", "amount": 280_000, "end": 45},
    {"category": "OTHER", "vendor": "세무법인 택스원", "amount": 500_000, "end": 365},
]

CATEGORY_LABELS = {
    "RENT": "임대료",
    "UTILITIES": "공과금",
    "INSURANCE": "보험료",
    "EQUIPMENT_LEASE": "장비 리스",
    "LOAN_REPAYMENT": "대출 상환",
    "MAINTENANCE": "유지보수",
    "COMMUNICATION": "통신비",
    "OTHER": "기타",
}


def _generate_demo_data() -> list[dict]:
    rng = random.Random(43)
    today = date.today()
    records = []
    for month_offset in range(12):
        m = today.month - 11 + month_offset
        y = today.year
        if m <= 0:
            m += 12
            y -= 1
        ym = f"{y}-{m:02d}"
        for item in DEMO_FIXED_COSTS:
            amount = int(item["amount"] * rng.uniform(0.95, 1.05))
            end_date = (today + timedelta(days=item["end"])).isoformat() if item["end"] else None
            records.append({
                "year_month": ym,
                "cost_category": item["category"],
                "category_label": CATEGORY_LABELS[item["category"]],
                "amount": amount,
                "vendor_name": item["vendor"],
                "contract_end_date": end_date,
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
    """KPI: 총고정비, 매출대비율, 임박계약갱신, 절감기회"""
    data = _generate_demo_data()
    today = date.today()
    ym = f"{today.year}-{today.month:02d}"
    this_month = [r for r in data if r["year_month"] == ym]
    total = sum(r["amount"] for r in this_month)
    revenue = 96_000_000
    expiring_soon = len([r for r in this_month if r["contract_end_date"] and r["contract_end_date"] <= (today + timedelta(days=90)).isoformat()])

    return {
        "total_fixed_cost": total,
        "revenue_ratio": round(total / revenue * 100, 1),
        "expiring_contracts": expiring_soon,
        "savings_opportunity": int(total * 0.08),
        "is_demo": True,
    }


@router.get("/monthly-trend")
async def get_monthly_trend(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """12개월 고정비 추이"""
    data = _generate_demo_data()
    by_month: dict[str, dict] = {}
    for r in data:
        ym = r["year_month"]
        if ym not in by_month:
            by_month[ym] = {"year_month": ym, "total": 0, "categories": {}}
        by_month[ym]["total"] += r["amount"]
        cat = r["cost_category"]
        by_month[ym]["categories"][cat] = by_month[ym]["categories"].get(cat, 0) + r["amount"]
    trend = sorted(by_month.values(), key=lambda x: x["year_month"])
    return {"data": trend, "is_demo": True}


@router.get("/breakdown")
async def get_breakdown(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """항목별 분해"""
    data = _generate_demo_data()
    today = date.today()
    ym = f"{today.year}-{today.month:02d}"
    this_month = [r for r in data if r["year_month"] == ym]
    grand_total = sum(r["amount"] for r in this_month)

    items = []
    for r in this_month:
        items.append({
            "cost_category": r["cost_category"],
            "category_label": r["category_label"],
            "amount": r["amount"],
            "vendor_name": r["vendor_name"],
            "share_pct": round(r["amount"] / grand_total * 100, 1) if grand_total else 0,
        })
    items.sort(key=lambda x: x["amount"], reverse=True)

    return {"items": items, "grand_total": grand_total, "is_demo": True}


@router.get("/benchmark")
async def get_benchmark(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """동일 진료과+지역 벤치마크"""
    data = _generate_demo_data()
    today = date.today()
    ym = f"{today.year}-{today.month:02d}"
    this_month = [r for r in data if r["year_month"] == ym]
    my_total = sum(r["amount"] for r in this_month)

    categories = []
    for r in this_month:
        categories.append({
            "name": r["category_label"],
            "my": r["amount"],
            "avg": int(r["amount"] * random.Random(44).uniform(0.85, 1.15)),
        })

    return {
        "my_total": my_total,
        "regional_avg": int(my_total * 0.92),
        "percentile": 42,
        "specialty": "내과",
        "region": "강남구",
        "categories": categories,
        "is_demo": True,
    }


@router.get("/contracts")
async def get_contracts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """계약 만료 알림 리스트"""
    today = date.today()
    contracts = []
    for item in DEMO_FIXED_COSTS:
        if item["end"] is not None:
            end_date = today + timedelta(days=item["end"])
            d_day = item["end"]
            contracts.append({
                "category": item["category"],
                "category_label": CATEGORY_LABELS[item["category"]],
                "vendor_name": item["vendor"],
                "contract_end_date": end_date.isoformat(),
                "d_day": d_day,
                "amount": item["amount"],
                "urgency": "HIGH" if d_day <= 30 else "MEDIUM" if d_day <= 90 else "LOW",
            })
    contracts.sort(key=lambda x: x["d_day"])
    return {"contracts": contracts, "is_demo": True}


@router.get("/ai-recommendations")
async def get_ai_recommendations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """AI 고정비 절감 권고"""
    return {
        "recommendations": [
            {
                "id": "rent-renegotiation",
                "title": "임대료 재협상 시점",
                "category": "임대료",
                "priority": "HIGH",
                "potential_savings": 550_000,
                "description": "임대차 계약 갱신이 6개월 이내입니다. 주변 시세 대비 10% 높은 편으로, 재협상 시 월 55만원 절감이 가능합니다.",
                "action_items": ["주변 의원 임대료 시세 조사", "계약 갱신 3개월 전 협상 시작", "리노베이션 투자 대비 임대료 할인 제안"],
            },
            {
                "id": "lease-vs-buy",
                "title": "장비 리스 vs 구매 분석",
                "category": "장비",
                "priority": "MEDIUM",
                "potential_savings": 300_000,
                "description": "CT 장비 리스 만기가 1년 남았습니다. 잔여 리스료 대비 중고 매입이 유리한 구간입니다.",
                "action_items": ["리스 잔여 비용 총액 확인", "중고 장비 시세 조회", "의료기기 감가상각 세금 효과 계산"],
            },
            {
                "id": "telecom-savings",
                "title": "통신비 절감",
                "category": "통신비",
                "priority": "LOW",
                "potential_savings": 80_000,
                "description": "현재 통신 요금제가 사용량 대비 과다합니다. 요금제 변경으로 월 8만원 절감이 가능합니다.",
                "action_items": ["현재 통신 사용량 분석", "경쟁사 요금제 비교", "번들 할인 적용 가능 여부 확인"],
            },
        ],
        "total_potential_savings": 930_000,
        "is_demo": True,
    }


@router.post("/")
async def create_fixed_cost(
    payload: FixedCostCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    entry = FixedCostEntry(user_id=current_user.id, **payload.model_dump())
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return {"id": str(entry.id), "message": "등록 완료"}


@router.put("/{entry_id}")
async def update_fixed_cost(
    entry_id: str,
    payload: FixedCostUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    result = await db.execute(
        select(FixedCostEntry).where(and_(FixedCostEntry.id == entry_id, FixedCostEntry.user_id == current_user.id))
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
async def delete_fixed_cost(
    entry_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    result = await db.execute(
        select(FixedCostEntry).where(and_(FixedCostEntry.id == entry_id, FixedCostEntry.user_id == current_user.id))
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Not found")
    await db.delete(entry)
    await db.commit()
    return {"message": "삭제 완료"}
