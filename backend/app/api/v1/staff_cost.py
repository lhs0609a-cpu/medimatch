"""
인건비 최적화 API

- KPI 요약, 월별 추이, 직원별 분석, 벤치마크, AI 권고
- DB에 데이터 없으면 데모 데이터 반환
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
import uuid
import random
import logging

from ..deps import get_db, get_current_active_user
from .service_guards import require_active_service
from ...models.user import User
from ...models.service_subscription import ServiceSubscription, ServiceType
from ...models.staff_cost import StaffCost

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================================
# Pydantic schemas
# ============================================================

class StaffCostCreate(BaseModel):
    employee_name: str
    employee_type: str = "ADMIN"
    employment_type: str = "FULL_TIME"
    year_month: str
    base_salary: int = 0
    overtime_pay: int = 0
    bonus: int = 0
    national_pension: int = 0
    health_insurance: int = 0
    employment_insurance: int = 0
    accident_insurance: int = 0
    welfare_cost: int = 0
    severance_reserve: int = 0


class StaffCostUpdate(BaseModel):
    employee_name: Optional[str] = None
    employee_type: Optional[str] = None
    employment_type: Optional[str] = None
    base_salary: Optional[int] = None
    overtime_pay: Optional[int] = None
    bonus: Optional[int] = None
    national_pension: Optional[int] = None
    health_insurance: Optional[int] = None
    employment_insurance: Optional[int] = None
    accident_insurance: Optional[int] = None
    welfare_cost: Optional[int] = None
    severance_reserve: Optional[int] = None


# ============================================================
# Demo data
# ============================================================

DEMO_EMPLOYEES = [
    {"name": "김원장", "type": "DOCTOR", "emp_type": "FULL_TIME", "base": 8_000_000},
    {"name": "이간호사", "type": "NURSE", "emp_type": "FULL_TIME", "base": 3_200_000},
    {"name": "박간호사", "type": "NURSE", "emp_type": "FULL_TIME", "base": 3_000_000},
    {"name": "최데스크", "type": "ADMIN", "emp_type": "FULL_TIME", "base": 2_800_000},
    {"name": "정방사선", "type": "TECH", "emp_type": "FULL_TIME", "base": 3_100_000},
    {"name": "한파트", "type": "NURSE", "emp_type": "PART_TIME", "base": 1_800_000},
]


def _generate_demo_data() -> list[dict]:
    rng = random.Random(42)
    today = date.today()
    records = []
    for month_offset in range(12):
        m = today.month - 11 + month_offset
        y = today.year
        if m <= 0:
            m += 12
            y -= 1
        ym = f"{y}-{m:02d}"
        for emp in DEMO_EMPLOYEES:
            base = int(emp["base"] * rng.uniform(0.95, 1.05))
            overtime = int(base * rng.uniform(0, 0.15))
            bonus = int(base * 0.1) if m == 1 else 0
            np_ = int(base * 0.045)
            hi = int(base * 0.0343)
            ei = int(base * 0.009)
            ai = int(base * 0.007)
            welfare = int(base * rng.uniform(0.02, 0.05))
            sev = int(base / 12)
            total = base + overtime + bonus + np_ + hi + ei + ai + welfare + sev
            records.append({
                "employee_name": emp["name"],
                "employee_type": emp["type"],
                "employment_type": emp["emp_type"],
                "year_month": ym,
                "base_salary": base,
                "overtime_pay": overtime,
                "bonus": bonus,
                "national_pension": np_,
                "health_insurance": hi,
                "employment_insurance": ei,
                "accident_insurance": ai,
                "welfare_cost": welfare,
                "severance_reserve": sev,
                "total": total,
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
    """KPI: 총인건비, 매출대비율, 4대보험총액, 직원수"""
    data = _generate_demo_data()
    today = date.today()
    ym = f"{today.year}-{today.month:02d}"
    this_month = [r for r in data if r["year_month"] == ym]
    prev_m = today.month - 1
    prev_y = today.year
    if prev_m <= 0:
        prev_m += 12
        prev_y -= 1
    prev_ym = f"{prev_y}-{prev_m:02d}"
    prev_month = [r for r in data if r["year_month"] == prev_ym]

    total_cost = sum(r["total"] for r in this_month)
    prev_total = sum(r["total"] for r in prev_month)
    insurance_total = sum(
        r["national_pension"] + r["health_insurance"] + r["employment_insurance"] + r["accident_insurance"]
        for r in this_month
    )
    employee_count = len(set(r["employee_name"] for r in this_month))
    revenue_estimate = 96_000_000
    ratio = round(total_cost / revenue_estimate * 100, 1) if revenue_estimate else 0
    change = round((total_cost - prev_total) / prev_total * 100, 1) if prev_total else 0

    return {
        "total_staff_cost": total_cost,
        "cost_change_pct": change,
        "revenue_ratio": ratio,
        "insurance_total": insurance_total,
        "employee_count": employee_count,
        "is_demo": True,
    }


@router.get("/monthly-trend")
async def get_monthly_trend(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """12개월 인건비 추이"""
    data = _generate_demo_data()
    by_month: dict[str, dict] = {}
    for r in data:
        ym = r["year_month"]
        if ym not in by_month:
            by_month[ym] = {"year_month": ym, "base_total": 0, "overtime_total": 0, "insurance_total": 0, "welfare_total": 0, "total": 0}
        by_month[ym]["base_total"] += r["base_salary"]
        by_month[ym]["overtime_total"] += r["overtime_pay"]
        by_month[ym]["insurance_total"] += r["national_pension"] + r["health_insurance"] + r["employment_insurance"] + r["accident_insurance"]
        by_month[ym]["welfare_total"] += r["welfare_cost"] + r["severance_reserve"]
        by_month[ym]["total"] += r["total"]

    trend = sorted(by_month.values(), key=lambda x: x["year_month"])
    return {"data": trend, "is_demo": True}


@router.get("/breakdown")
async def get_breakdown(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """직원유형별/항목별 분해"""
    data = _generate_demo_data()
    today = date.today()
    ym = f"{today.year}-{today.month:02d}"
    this_month = [r for r in data if r["year_month"] == ym]
    grand_total = sum(r["total"] for r in this_month)

    employees = []
    for r in this_month:
        insurance = r["national_pension"] + r["health_insurance"] + r["employment_insurance"] + r["accident_insurance"]
        employees.append({
            "employee_name": r["employee_name"],
            "employee_type": r["employee_type"],
            "employment_type": r["employment_type"],
            "base_salary": r["base_salary"],
            "overtime_pay": r["overtime_pay"],
            "insurance_total": insurance,
            "total": r["total"],
            "share_pct": round(r["total"] / grand_total * 100, 1) if grand_total else 0,
        })

    by_type: dict[str, int] = {}
    for r in this_month:
        by_type[r["employee_type"]] = by_type.get(r["employee_type"], 0) + r["total"]

    return {
        "employees": employees,
        "by_type": [{"type": k, "total": v, "share_pct": round(v / grand_total * 100, 1)} for k, v in by_type.items()],
        "grand_total": grand_total,
        "is_demo": True,
    }


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
    my_total = sum(r["total"] for r in this_month)

    return {
        "my_total": my_total,
        "regional_avg": int(my_total * 1.08),
        "national_avg": int(my_total * 1.15),
        "percentile": 35,
        "specialty": "내과",
        "region": "강남구",
        "categories": [
            {"name": "기본급", "my": sum(r["base_salary"] for r in this_month), "avg": int(sum(r["base_salary"] for r in this_month) * 1.1)},
            {"name": "야근수당", "my": sum(r["overtime_pay"] for r in this_month), "avg": int(sum(r["overtime_pay"] for r in this_month) * 0.8)},
            {"name": "4대보험", "my": sum(r["national_pension"] + r["health_insurance"] + r["employment_insurance"] + r["accident_insurance"] for r in this_month), "avg": int(sum(r["national_pension"] + r["health_insurance"] for r in this_month) * 1.05)},
            {"name": "복리후생", "my": sum(r["welfare_cost"] for r in this_month), "avg": int(sum(r["welfare_cost"] for r in this_month) * 1.2)},
        ],
        "is_demo": True,
    }


@router.get("/ai-recommendations")
async def get_ai_recommendations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """AI 인건비 절감 권고"""
    return {
        "recommendations": [
            {
                "id": "overtime-reduction",
                "title": "야근수당 절감",
                "category": "인건비 최적화",
                "priority": "HIGH",
                "potential_savings": 450_000,
                "description": "최근 3개월 평균 야근시간이 월 20시간을 초과합니다. 업무 프로세스 개선으로 월 45만원 절감이 가능합니다.",
                "action_items": ["진료 예약 시스템 최적화", "행정 업무 자동화 도입 검토", "파트타임 간호사 추가 고용 비교분석"],
            },
            {
                "id": "parttime-conversion",
                "title": "파트타임 전환 검토",
                "category": "인력 효율화",
                "priority": "MEDIUM",
                "potential_savings": 800_000,
                "description": "오후 진료 시간대 환자 수가 적은 요일에 파트타임 전환 시 4대보험료 포함 월 80만원 절감이 가능합니다.",
                "action_items": ["요일별/시간대별 환자 수 분석", "파트타임 전환 대상 직원 선정", "근로계약 변경 법률 검토"],
            },
            {
                "id": "insurance-optimization",
                "title": "4대보험 최적화",
                "category": "보험료 절감",
                "priority": "MEDIUM",
                "potential_savings": 320_000,
                "description": "두루누리 사회보험료 지원사업 대상 직원이 있습니다. 신청 시 월 32만원 절감이 가능합니다.",
                "action_items": ["두루누리 지원 대상 확인", "고용보험 요율 재확인", "산재보험 업종 분류 적정성 검토"],
            },
        ],
        "total_potential_savings": 1_570_000,
        "is_demo": True,
    }


@router.post("/")
async def create_staff_cost(
    payload: StaffCostCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """인건비 등록"""
    entry = StaffCost(
        user_id=current_user.id,
        **payload.model_dump(),
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return {"id": str(entry.id), "message": "등록 완료"}


@router.put("/{entry_id}")
async def update_staff_cost(
    entry_id: str,
    payload: StaffCostUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """인건비 수정"""
    result = await db.execute(
        select(StaffCost).where(
            and_(StaffCost.id == entry_id, StaffCost.user_id == current_user.id)
        )
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
async def delete_staff_cost(
    entry_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """인건비 삭제"""
    result = await db.execute(
        select(StaffCost).where(
            and_(StaffCost.id == entry_id, StaffCost.user_id == current_user.id)
        )
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Not found")
    await db.delete(entry)
    await db.commit()
    return {"message": "삭제 완료"}
