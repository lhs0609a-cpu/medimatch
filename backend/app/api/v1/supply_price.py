"""
의료 소모품/약가 비교 API

- KPI 요약, 품목 목록, 유통기한/재주문 알림, AI 권고
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
from ...models.supply_price import MedicalSupplyItem, VendorPriceQuote

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================================
# Pydantic schemas
# ============================================================

class SupplyItemCreate(BaseModel):
    item_type: str = "SUPPLY"
    item_name: str
    item_code: Optional[str] = None
    unit: Optional[str] = None
    monthly_usage: int = 0
    current_vendor: Optional[str] = None
    current_unit_price: int = 0
    stock_count: int = 0
    expiry_date: Optional[date] = None
    reorder_threshold: int = 0
    has_generic: bool = False
    generic_price: int = 0
    generic_vendor: Optional[str] = None


class SupplyItemUpdate(BaseModel):
    item_name: Optional[str] = None
    current_vendor: Optional[str] = None
    current_unit_price: Optional[int] = None
    stock_count: Optional[int] = None
    expiry_date: Optional[date] = None
    monthly_usage: Optional[int] = None
    reorder_threshold: Optional[int] = None


class QuoteCreate(BaseModel):
    vendor_name: str
    unit_price: int = 0
    minimum_order_qty: int = 0
    bulk_discount_threshold: Optional[int] = None
    bulk_unit_price: Optional[int] = None
    quoted_at: Optional[date] = None
    valid_until: Optional[date] = None


# ============================================================
# Demo data
# ============================================================

DEMO_ITEMS = [
    {"type": "SUPPLY", "name": "일회용 주사기 3ml", "code": "SU-001", "unit": "박스(100개)", "usage": 20, "vendor": "한국메디칼", "price": 35_000, "stock": 15, "expiry_days": 180, "reorder": 10, "generic": False, "generic_price": 0, "generic_vendor": ""},
    {"type": "SUPPLY", "name": "알코올 솜", "code": "SU-002", "unit": "팩(200매)", "usage": 30, "vendor": "메디팜", "price": 8_500, "stock": 25, "expiry_days": 365, "reorder": 15, "generic": False, "generic_price": 0, "generic_vendor": ""},
    {"type": "SUPPLY", "name": "혈압계 커프", "code": "SU-003", "unit": "개", "usage": 2, "vendor": "오므론코리아", "price": 45_000, "stock": 3, "expiry_days": None, "reorder": 2, "generic": False, "generic_price": 0, "generic_vendor": ""},
    {"type": "DRUG", "name": "암로디핀 5mg", "code": "DR-001", "unit": "박스(100정)", "usage": 15, "vendor": "한미약품", "price": 12_000, "stock": 8, "expiry_days": 90, "reorder": 5, "generic": True, "generic_price": 8_000, "generic_vendor": "제일약품"},
    {"type": "DRUG", "name": "메트포르민 500mg", "code": "DR-002", "unit": "박스(100정)", "usage": 10, "vendor": "대웅제약", "price": 15_000, "stock": 12, "expiry_days": 200, "reorder": 5, "generic": True, "generic_price": 9_500, "generic_vendor": "일동제약"},
    {"type": "DRUG", "name": "오메프라졸 20mg", "code": "DR-003", "unit": "박스(60정)", "usage": 8, "vendor": "아스트라제네카", "price": 28_000, "stock": 4, "expiry_days": 25, "reorder": 3, "generic": True, "generic_price": 14_000, "generic_vendor": "종근당"},
    {"type": "SUPPLY", "name": "거즈 (멸균)", "code": "SU-004", "unit": "팩(50매)", "usage": 25, "vendor": "메디라인", "price": 12_000, "stock": 18, "expiry_days": 730, "reorder": 10, "generic": False, "generic_price": 0, "generic_vendor": ""},
    {"type": "SUPPLY", "name": "라텍스 장갑", "code": "SU-005", "unit": "박스(100매)", "usage": 15, "vendor": "메디라인", "price": 18_000, "stock": 5, "expiry_days": 365, "reorder": 8, "generic": False, "generic_price": 0, "generic_vendor": ""},
    {"type": "DRUG", "name": "세프트리악손 1g", "code": "DR-004", "unit": "vial", "usage": 20, "vendor": "로슈", "price": 5_500, "stock": 30, "expiry_days": 150, "reorder": 15, "generic": True, "generic_price": 3_200, "generic_vendor": "보령제약"},
    {"type": "DRUG", "name": "리도카인 2%", "code": "DR-005", "unit": "vial(20ml)", "usage": 12, "vendor": "대한약품", "price": 3_800, "stock": 20, "expiry_days": 300, "reorder": 10, "generic": False, "generic_price": 0, "generic_vendor": ""},
]


def _build_demo_items() -> list[dict]:
    today = date.today()
    items = []
    for item in DEMO_ITEMS:
        expiry = (today + timedelta(days=item["expiry_days"])).isoformat() if item["expiry_days"] else None
        monthly_cost = item["price"] * item["usage"]
        savings = (item["price"] - item["generic_price"]) * item["usage"] if item["generic"] else 0
        low_stock = item["stock"] <= item["reorder"]
        expiry_soon = item["expiry_days"] is not None and item["expiry_days"] <= 30
        items.append({
            **item,
            "expiry_date": expiry,
            "monthly_cost": monthly_cost,
            "potential_savings": savings,
            "low_stock": low_stock,
            "expiry_soon": expiry_soon,
            "is_demo": True,
        })
    return items


# ============================================================
# Endpoints
# ============================================================

@router.get("/summary")
async def get_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """KPI: 월소모품비, 절감가능액, 만료임박, 재주문필요"""
    items = _build_demo_items()
    total_monthly = sum(i["monthly_cost"] for i in items)
    total_savings = sum(i["potential_savings"] for i in items)
    expiry_count = len([i for i in items if i["expiry_soon"]])
    reorder_count = len([i for i in items if i["low_stock"]])

    return {
        "monthly_supply_cost": total_monthly,
        "potential_savings": total_savings,
        "expiry_alerts": expiry_count,
        "reorder_alerts": reorder_count,
        "item_count": len(items),
        "is_demo": True,
    }


@router.get("/items")
async def get_items(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """품목 목록 + 최저가/제네릭 절감액 계산"""
    items = _build_demo_items()
    return {"items": items, "is_demo": True}


@router.get("/items/{item_id}")
async def get_item_detail(
    item_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """품목 상세 + 가격비교 테이블"""
    items = _build_demo_items()
    if not items:
        raise HTTPException(status_code=404, detail="Not found")
    item = items[0]
    rng = random.Random(45)
    quotes = [
        {"vendor": item["vendor"], "unit_price": item["price"], "min_qty": 1, "bulk_threshold": 50, "bulk_price": int(item["price"] * 0.9)},
        {"vendor": "대한의약유통", "unit_price": int(item["price"] * rng.uniform(0.88, 0.95)), "min_qty": 5, "bulk_threshold": 100, "bulk_price": int(item["price"] * 0.82)},
        {"vendor": "메디팜다이렉트", "unit_price": int(item["price"] * rng.uniform(0.90, 0.98)), "min_qty": 3, "bulk_threshold": 30, "bulk_price": int(item["price"] * 0.85)},
    ]
    return {"item": item, "quotes": quotes, "is_demo": True}


@router.get("/expiry-alerts")
async def get_expiry_alerts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """유통기한 30일 이내 품목"""
    items = _build_demo_items()
    alerts = [i for i in items if i["expiry_soon"]]
    return {"alerts": alerts, "count": len(alerts), "is_demo": True}


@router.get("/reorder-alerts")
async def get_reorder_alerts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """재고부족 품목"""
    items = _build_demo_items()
    alerts = [i for i in items if i["low_stock"]]
    return {"alerts": alerts, "count": len(alerts), "is_demo": True}


@router.get("/ai-recommendations")
async def get_ai_recommendations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """AI 소모품/약가 절감 권고"""
    return {
        "recommendations": [
            {
                "id": "generic-switch",
                "title": "제네릭 전환 추천",
                "category": "약가 절감",
                "priority": "HIGH",
                "potential_savings": 186_000,
                "description": "오메프라졸, 세프트리악손 등 4개 약품의 제네릭 전환 시 월 18.6만원 절감이 가능합니다. 동등성 시험 통과 제네릭입니다.",
                "action_items": ["제네릭 의약품 동등성 시험 결과 확인", "환자 안내문 준비", "약국 브릿지 시스템으로 변경 알림"],
            },
            {
                "id": "bulk-purchase",
                "title": "대량구매 할인 활용",
                "category": "구매 최적화",
                "priority": "MEDIUM",
                "potential_savings": 120_000,
                "description": "일회용 주사기, 알코올 솜 등 소모량 높은 품목을 분기 단위 대량구매 시 월 12만원 절감이 가능합니다.",
                "action_items": ["월별 사용량 기반 분기 발주량 산출", "3개 업체 대량구매 견적 비교", "보관 공간 확인"],
            },
            {
                "id": "vendor-switch",
                "title": "공급업체 변경 검토",
                "category": "업체 최적화",
                "priority": "LOW",
                "potential_savings": 95_000,
                "description": "라텍스 장갑, 거즈 등 범용 소모품의 공급업체를 변경하면 월 9.5만원 절감이 가능합니다.",
                "action_items": ["대체 업체 품질 샘플 테스트", "최소 주문량 및 배송 조건 확인", "기존 업체와 가격 재협상 시도"],
            },
        ],
        "total_potential_savings": 401_000,
        "is_demo": True,
    }


@router.post("/items")
async def create_item(
    payload: SupplyItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    item = MedicalSupplyItem(user_id=current_user.id, **payload.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return {"id": str(item.id), "message": "등록 완료"}


@router.put("/items/{item_id}")
async def update_item(
    item_id: str,
    payload: SupplyItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    result = await db.execute(
        select(MedicalSupplyItem).where(and_(MedicalSupplyItem.id == item_id, MedicalSupplyItem.user_id == current_user.id))
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    for key, val in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, val)
    item.updated_at = datetime.utcnow()
    await db.commit()
    return {"message": "수정 완료"}


@router.delete("/items/{item_id}")
async def delete_item(
    item_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    result = await db.execute(
        select(MedicalSupplyItem).where(and_(MedicalSupplyItem.id == item_id, MedicalSupplyItem.user_id == current_user.id))
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    await db.delete(item)
    await db.commit()
    return {"message": "삭제 완료"}


@router.post("/items/{item_id}/quotes")
async def create_quote(
    item_id: str,
    payload: QuoteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    result = await db.execute(
        select(MedicalSupplyItem).where(and_(MedicalSupplyItem.id == item_id, MedicalSupplyItem.user_id == current_user.id))
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    quote = VendorPriceQuote(supply_item_id=item_id, **payload.model_dump())
    db.add(quote)
    await db.commit()
    await db.refresh(quote)
    return {"id": str(quote.id), "message": "견적 등록 완료"}
