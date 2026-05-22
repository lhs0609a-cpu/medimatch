"""
EMR 비즈니스 분석 대시보드 API

- 매출/환자/보험비율/지역벤치마크 KPI
- DB에 실제 데이터 없으면 데모 데이터 반환 (is_demo: true)
- require_active_service(ServiceType.EMR) 가드 적용
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from datetime import date, timedelta
import random
import math
import logging

from ..deps import get_db, get_current_active_user
from .service_guards import require_active_service
from ...models.user import User
from ...models.service_subscription import ServiceSubscription, ServiceType
from ...models.emr_analytics import EMRDailyMetrics

logger = logging.getLogger(__name__)

router = APIRouter()

# ============================================================
# 데모 데이터 생성기
# ============================================================

DEMO_SPECIALTY = "피부과"
DEMO_REGION = "강남구"


def generate_demo_metrics(days: int = 90) -> list[dict]:
    """
    데모용 일별 메트릭 생성.
    - 평일 > 주말 (30% 감소)
    - 월 5% 성장 추세
    - 비급여 비율 30~40%
    - seed 고정으로 일관된 결과
    """
    today = date.today()
    metrics = []
    rng = random.Random(42)  # 고정 seed

    base_revenue = 3_200_000  # 일 기본 매출 320만
    base_patients = 45  # 일 기본 환자 수

    for i in range(days):
        d = today - timedelta(days=days - 1 - i)
        day_of_week = d.weekday()  # 0=Mon, 6=Sun

        # 성장 추세: 월 5% → 일 0.167%
        growth = 1 + (i / days) * 0.15  # 90일 동안 총 15% 성장

        # 주말 감소
        weekend_factor = 0.7 if day_of_week >= 5 else 1.0
        # 일요일 더 감소
        if day_of_week == 6:
            weekend_factor = 0.3

        # 노이즈
        noise = rng.uniform(0.85, 1.15)

        daily_revenue = int(base_revenue * growth * weekend_factor * noise)
        non_insurance_ratio = rng.uniform(0.30, 0.40)
        revenue_non_insurance = int(daily_revenue * non_insurance_ratio)
        revenue_insurance = daily_revenue - revenue_non_insurance

        total_patients = max(1, int(base_patients * growth * weekend_factor * rng.uniform(0.85, 1.15)))
        new_ratio = rng.uniform(0.15, 0.30)
        new_patients = max(0, int(total_patients * new_ratio))
        returning_patients = total_patients - new_patients

        # 지역 벤치마크
        regional_avg = int(base_revenue * weekend_factor * rng.uniform(0.90, 1.10))
        percentile = rng.randint(20, 40)  # 상위 20~40%

        metrics.append({
            "metric_date": d.isoformat(),
            "revenue_total": daily_revenue,
            "revenue_insurance": revenue_insurance,
            "revenue_non_insurance": revenue_non_insurance,
            "patient_count_total": total_patients,
            "patient_count_new": new_patients,
            "patient_count_returning": returning_patients,
            "regional_avg_revenue": regional_avg,
            "regional_percentile": percentile,
            "specialty": DEMO_SPECIALTY,
            "region": DEMO_REGION,
            "is_demo": True,
        })

    return metrics


def _aggregate_summary(metrics: list[dict]) -> dict:
    """이번 달 데이터로 KPI 요약 생성"""
    today = date.today()
    first_of_month = today.replace(day=1)

    # 이번 달 데이터만
    this_month = [m for m in metrics if m["metric_date"] >= first_of_month.isoformat()]
    if not this_month:
        this_month = metrics[-30:]  # fallback

    # 저번 달 데이터
    last_month_end = first_of_month - timedelta(days=1)
    last_month_start = last_month_end.replace(day=1)
    last_month = [
        m for m in metrics
        if last_month_start.isoformat() <= m["metric_date"] <= last_month_end.isoformat()
    ]

    total_revenue = sum(m["revenue_total"] for m in this_month)
    total_patients = sum(m["patient_count_total"] for m in this_month)

    # 비급여 비율
    total_non_ins = sum(m["revenue_non_insurance"] for m in this_month)
    non_insurance_ratio = (total_non_ins / total_revenue * 100) if total_revenue > 0 else 0

    # 지역 순위 (평균 백분위) — 실데이터엔 지역 소스가 없어 None일 수 있음
    pctile_vals = [
        m["regional_percentile"] for m in this_month
        if m.get("regional_percentile") is not None
    ]
    avg_percentile = (sum(pctile_vals) / len(pctile_vals)) if pctile_vals else None

    # 전월 대비 증감율
    prev_revenue = sum(m["revenue_total"] for m in last_month) if last_month else 0
    prev_patients = sum(m["patient_count_total"] for m in last_month) if last_month else 0

    revenue_change = (
        ((total_revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0
    )
    patient_change = (
        ((total_patients - prev_patients) / prev_patients * 100) if prev_patients > 0 else 0
    )

    return {
        "total_revenue": total_revenue,
        "revenue_change_pct": round(revenue_change, 1),
        "total_patients": total_patients,
        "patient_change_pct": round(patient_change, 1),
        "non_insurance_ratio": round(non_insurance_ratio, 1),
        "regional_percentile": round(avg_percentile) if avg_percentile is not None else None,
        "specialty": this_month[0]["specialty"] if this_month else DEMO_SPECIALTY,
        "region": this_month[0]["region"] if this_month else DEMO_REGION,
    }


async def _get_real_metrics(
    db: AsyncSession, user_id, days: int
) -> list[dict] | None:
    """DB의 사전집계 메트릭 테이블(EMRDailyMetrics) 조회. 없으면 None."""
    start_date = date.today() - timedelta(days=days)
    result = await db.execute(
        select(EMRDailyMetrics).where(
            and_(
                EMRDailyMetrics.user_id == user_id,
                EMRDailyMetrics.metric_date >= start_date,
            )
        ).order_by(EMRDailyMetrics.metric_date.asc())
    )
    rows = result.scalars().all()
    if not rows:
        return None

    return [
        {
            "metric_date": r.metric_date.isoformat(),
            "revenue_total": r.revenue_total,
            "revenue_insurance": r.revenue_insurance,
            "revenue_non_insurance": r.revenue_non_insurance,
            "patient_count_total": r.patient_count_total,
            "patient_count_new": r.patient_count_new,
            "patient_count_returning": r.patient_count_returning,
            "regional_avg_revenue": r.regional_avg_revenue,
            "regional_percentile": r.regional_percentile,
            "specialty": r.specialty,
            "region": r.region,
            "is_demo": r.is_demo,
        }
        for r in rows
    ]


# ============================================================
# 실데이터 집계 (bills + visits → 일별 메트릭)
# ============================================================

def build_live_metrics(
    bill_rows: list[tuple],
    visit_rows: list[tuple],
    *,
    specialty: str | None = None,
    region: str | None = None,
) -> list[dict]:
    """수납/진료 원장에서 일별 메트릭을 집계한다 (순수 함수, DB 무관 → 단위테스트 가능).

    bill_rows:  (bill_date: date, final_amount, insurance_amount, non_covered_amount)
    visit_rows: (visit_date: date, patient_id, visit_type)

    매출 분해: 총매출=final_amount, 비급여=non_covered_amount,
              급여(보험)=총매출-비급여 (음수 방지). 두 값의 합 = 총매출 (파이/추이 정합).
    환자: 일별 distinct patient, 초진(INITIAL)=신규 / 그 외=재진.
    지역 벤치마크는 외부 데이터 소스가 없으므로 None(미제공)으로 둔다.
    """
    days: dict = {}

    def _day(d: date) -> dict:
        return days.setdefault(d, {
            "revenue_total": 0,
            "revenue_non_insurance": 0,
            "_new_patients": set(),
            "_all_patients": set(),
            "_new_count": 0,
            "_total_count": 0,
        })

    for bill_date, final_amount, insurance_amount, non_covered_amount in bill_rows:
        if bill_date is None:
            continue
        bucket = _day(bill_date)
        bucket["revenue_total"] += int(final_amount or 0)
        bucket["revenue_non_insurance"] += int(non_covered_amount or 0)

    for visit_date, patient_id, visit_type in visit_rows:
        if visit_date is None:
            continue
        bucket = _day(visit_date)
        is_new = (visit_type or "").upper() == "INITIAL"
        if patient_id is not None:
            bucket["_all_patients"].add(patient_id)
            if is_new:
                bucket["_new_patients"].add(patient_id)
        else:
            # patient_id 없는 진료도 카운트엔 포함 (익명/외부)
            bucket["_total_count"] += 1
            if is_new:
                bucket["_new_count"] += 1

    metrics: list[dict] = []
    for d in sorted(days.keys()):
        b = days[d]
        total_patients = len(b["_all_patients"]) + b["_total_count"]
        new_patients = len(b["_new_patients"]) + b["_new_count"]
        revenue_total = b["revenue_total"]
        revenue_non_ins = min(b["revenue_non_insurance"], revenue_total)
        revenue_ins = max(revenue_total - revenue_non_ins, 0)
        metrics.append({
            "metric_date": d.isoformat(),
            "revenue_total": revenue_total,
            "revenue_insurance": revenue_ins,
            "revenue_non_insurance": revenue_non_ins,
            "patient_count_total": total_patients,
            "patient_count_new": new_patients,
            "patient_count_returning": max(total_patients - new_patients, 0),
            "regional_avg_revenue": None,
            "regional_percentile": None,
            "specialty": specialty,
            "region": region,
            "is_demo": False,
        })
    return metrics


async def _get_live_metrics(
    db: AsyncSession, user_id, days: int
) -> list[dict] | None:
    """bills + visits 원장을 일별 집계. 둘 다 비어있으면 None."""
    from ...models.bill import Bill, BillStatus
    from ...models.visit import Visit, VisitStatus
    from ...models.user import User

    start_date = date.today() - timedelta(days=days)

    bill_res = await db.execute(
        select(
            Bill.bill_date, Bill.final_amount,
            Bill.insurance_amount, Bill.non_covered_amount,
        ).where(and_(
            Bill.user_id == user_id,
            Bill.bill_date >= start_date,
            Bill.status != BillStatus.CANCELLED,
        ))
    )
    bill_rows = list(bill_res.all())

    visit_res = await db.execute(
        select(Visit.visit_date, Visit.patient_id, Visit.visit_type).where(and_(
            Visit.user_id == user_id,
            Visit.visit_date >= start_date,
            Visit.status != VisitStatus.CANCELLED,
        ))
    )
    visit_rows = list(visit_res.all())

    if not bill_rows and not visit_rows:
        return None

    # 진료과/지역은 사용자 프로필에서 (있으면)
    specialty = None
    region = None
    try:
        u = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
        if u is not None:
            specialty = getattr(u, "specialty", None) or getattr(u, "department", None)
            region = getattr(u, "region", None) or getattr(u, "address_region", None)
    except Exception:
        pass

    return build_live_metrics(bill_rows, visit_rows, specialty=specialty, region=region)


async def _resolve_metrics(
    db: AsyncSession, user_id, days: int
) -> tuple[list[dict], str]:
    """메트릭 우선순위: 사전집계 테이블 → 실데이터 집계 → 데모.

    반환: (metrics, source)  source ∈ {"metrics", "live", "demo"}
    """
    pre = await _get_real_metrics(db, user_id, days)
    if pre:
        return pre, "metrics"
    live = await _get_live_metrics(db, user_id, days)
    if live:
        return live, "live"
    return generate_demo_metrics(days), "demo"


# ============================================================
# Endpoints
# ============================================================

@router.get("/summary")
async def get_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """KPI 4개: 이번달 매출 / 환자 수 / 비급여 비율 / 지역 순위"""
    metrics, source = await _resolve_metrics(db, current_user.id, days=90)
    summary = _aggregate_summary(metrics)
    summary["is_demo"] = source == "demo"
    summary["data_source"] = source
    summary["regional_available"] = summary.get("regional_percentile") is not None
    return summary


@router.get("/revenue-trend")
async def get_revenue_trend(
    days: int = Query(default=90, ge=7, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """일별 매출 추이 (전체/급여/비급여)"""
    metrics, source = await _resolve_metrics(db, current_user.id, days=days)
    data = [
        {
            "date": m["metric_date"],
            "total": m["revenue_total"],
            "insurance": m["revenue_insurance"],
            "non_insurance": m["revenue_non_insurance"],
        }
        for m in metrics
    ]
    return {"data": data, "is_demo": source == "demo", "data_source": source, "days": days}


@router.get("/patient-trend")
async def get_patient_trend(
    days: int = Query(default=90, ge=7, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """일별 환자 수 추이 (전체/신규/재진)"""
    metrics, source = await _resolve_metrics(db, current_user.id, days=days)
    data = [
        {
            "date": m["metric_date"],
            "total": m["patient_count_total"],
            "new": m["patient_count_new"],
            "returning": m["patient_count_returning"],
        }
        for m in metrics
    ]
    return {"data": data, "is_demo": source == "demo", "data_source": source, "days": days}


@router.get("/insurance-breakdown")
async def get_insurance_breakdown(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """이번달 보험/비보험 비율 (파이차트용)"""
    metrics, source = await _resolve_metrics(db, current_user.id, days=90)
    today = date.today()
    first_of_month = today.replace(day=1)

    this_month = [m for m in metrics if m["metric_date"] >= first_of_month.isoformat()]
    if not this_month:
        this_month = metrics[-30:]
    is_demo = source == "demo"

    total_insurance = sum(m["revenue_insurance"] for m in this_month)
    total_non_insurance = sum(m["revenue_non_insurance"] for m in this_month)
    grand_total = total_insurance + total_non_insurance

    insurance_pct = round(total_insurance / grand_total * 100, 1) if grand_total > 0 else 0
    non_insurance_pct = round(total_non_insurance / grand_total * 100, 1) if grand_total > 0 else 0

    return {
        "data": [
            {"name": "급여 (보험)", "value": total_insurance, "percentage": insurance_pct},
            {"name": "비급여", "value": total_non_insurance, "percentage": non_insurance_pct},
        ],
        "total": grand_total,
        "is_demo": is_demo,
        "data_source": source,
    }


@router.get("/regional-benchmark")
async def get_regional_benchmark(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """내 매출 vs 지역 평균 + 백분위.

    내 매출(my_revenue)은 실데이터로 계산하지만, 지역 평균/백분위는 외부 벤치마크
    데이터 소스가 연동되기 전까지 실데이터(source=='live')에서는 제공하지 않는다
    (regional_available=false). 데모/사전집계에서만 비교치를 채운다.
    """
    metrics, source = await _resolve_metrics(db, current_user.id, days=90)
    today = date.today()
    first_of_month = today.replace(day=1)

    this_month = [m for m in metrics if m["metric_date"] >= first_of_month.isoformat()]
    if not this_month:
        this_month = metrics[-30:]
    is_demo = source == "demo"

    my_avg_daily = (
        sum(m["revenue_total"] for m in this_month) / len(this_month)
        if this_month else 0
    )
    my_monthly = int(my_avg_daily * 30)

    specialty = this_month[0]["specialty"] if this_month else DEMO_SPECIALTY
    region = this_month[0]["region"] if this_month else DEMO_REGION

    # 지역 벤치마크 가용 여부 — regional_avg_revenue 값이 실제로 채워져 있을 때만
    regional_vals = [
        m["regional_avg_revenue"] for m in this_month
        if m.get("regional_avg_revenue") is not None
    ]
    pctile_vals = [
        m["regional_percentile"] for m in this_month
        if m.get("regional_percentile") is not None
    ]
    regional_available = bool(regional_vals)

    if not regional_available:
        return {
            "my_revenue": my_monthly,
            "regional_avg_revenue": None,
            "percentile": None,
            "specialty": specialty,
            "region": region,
            "comparison_pct": None,
            "regional_available": False,
            "is_demo": is_demo,
            "data_source": source,
        }

    regional_avg_daily = sum(regional_vals) / len(regional_vals)
    avg_percentile = (sum(pctile_vals) / len(pctile_vals)) if pctile_vals else 50
    regional_monthly = int(regional_avg_daily * 30)

    return {
        "my_revenue": my_monthly,
        "regional_avg_revenue": regional_monthly,
        "percentile": round(avg_percentile),
        "specialty": specialty,
        "region": region,
        "comparison_pct": round(
            ((my_monthly - regional_monthly) / regional_monthly * 100)
            if regional_monthly > 0 else 0,
            1,
        ),
        "regional_available": True,
        "is_demo": is_demo,
        "data_source": source,
    }
