"""
방문 분석 — 시술 카테고리별 매출/환자 분포, 내원경로 트리, 담당의 매출 등.

팔레트 EMR의 "인사이트" 대시보드에 대응하는 데이터 API.
"""
from datetime import date, datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, and_, func, text
from sqlalchemy.ext.asyncio import AsyncSession

from ..deps import get_db, get_current_active_user
from .service_guards import require_active_service
from ...models.user import User
from ...models.service_subscription import ServiceSubscription, ServiceType
from ...models.visit import Visit, VisitProcedure
from ...models.patient import Patient


router = APIRouter()


def _parse_range(start: Optional[str], end: Optional[str], default_days: int = 30) -> tuple[date, date]:
    end_d = date.fromisoformat(end) if end else date.today()
    start_d = date.fromisoformat(start) if start else end_d - timedelta(days=default_days)
    return start_d, end_d


# ============================================================
# 1. 시술 카테고리별 매출 분포 (도넛 차트용)
# ============================================================

@router.get("/category-revenue")
async def category_revenue(
    start: Optional[str] = Query(None, description="YYYY-MM-DD"),
    end: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """visit_procedures.category 별 매출 합계."""
    start_d, end_d = _parse_range(start, end)

    q = (
        select(
            VisitProcedure.category,
            func.count(VisitProcedure.id).label("count"),
            func.sum(VisitProcedure.total_price).label("revenue"),
        )
        .join(Visit, Visit.id == VisitProcedure.visit_id)
        .where(and_(
            Visit.user_id == current_user.id,
            Visit.visit_date >= start_d,
            Visit.visit_date <= end_d,
        ))
        .group_by(VisitProcedure.category)
        .order_by(func.sum(VisitProcedure.total_price).desc())
    )
    res = await db.execute(q)
    rows = res.all()
    total = sum(r.revenue or 0 for r in rows)
    return {
        "start": start_d.isoformat(),
        "end": end_d.isoformat(),
        "total_revenue": int(total),
        "categories": [{
            "category": r.category or "MISC",
            "count": int(r.count or 0),
            "revenue": int(r.revenue or 0),
            "pct": round((r.revenue or 0) / total * 100, 1) if total else 0,
        } for r in rows],
    }


# ============================================================
# 2. 내원경로 트리 (1차/2차 드릴다운)
# ============================================================

# 1차 카테고리 매핑 (간단한 휴리스틱)
_INFLOW_PRIMARY = {
    "지인추천": "지인추천", "소개": "지인추천", "지인": "지인추천",
    "간판": "간판", "오프라인": "간판", "워크인": "간판", "walkin": "간판",
    "네이버검색": "온라인", "네이버": "온라인", "구글": "온라인",
    "인스타그램": "온라인", "인스타": "온라인", "instagram": "온라인",
    "페이스북": "온라인", "facebook": "온라인",
    "유튜브": "온라인", "youtube": "온라인",
    "블로그": "온라인", "네이버블로그": "온라인",
    "강남언니": "온라인", "바비톡": "온라인", "여신티켓": "온라인",
    "당근": "온라인", "당근마켓": "온라인",
    "광고": "온라인", "검색광고": "온라인", "디스플레이": "온라인",
}


def _primary_of(path: Optional[str]) -> str:
    if not path:
        return "미분류"
    p = path.strip().lower().replace(" ", "")
    for k, v in _INFLOW_PRIMARY.items():
        if k.lower() in p:
            return v
    return "기타"


@router.get("/inflow-tree")
async def inflow_tree(
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """patients.inflow_path 를 1차(지인추천/간판/온라인) → 2차(원본 라벨) 트리로 집계."""
    start_d, end_d = _parse_range(start, end, default_days=90)

    q = select(Patient.inflow_path, func.count(Patient.id)).where(and_(
        Patient.user_id == current_user.id,
        Patient.deleted_at.is_(None),
        Patient.inflow_date >= start_d,
        Patient.inflow_date <= end_d,
    )).group_by(Patient.inflow_path)
    res = await db.execute(q)
    rows = res.all()

    tree: dict[str, dict] = {}
    total = 0
    for path, n in rows:
        primary = _primary_of(path)
        leaf = path or "(없음)"
        tree.setdefault(primary, {"count": 0, "children": {}})
        tree[primary]["count"] += int(n or 0)
        tree[primary]["children"][leaf] = tree[primary]["children"].get(leaf, 0) + int(n or 0)
        total += int(n or 0)

    out = []
    for primary, data in sorted(tree.items(), key=lambda x: -x[1]["count"]):
        out.append({
            "name": primary,
            "count": data["count"],
            "pct": round(data["count"] / total * 100, 1) if total else 0,
            "children": [
                {"name": k, "count": v}
                for k, v in sorted(data["children"].items(), key=lambda x: -x[1])
            ],
        })
    return {
        "start": start_d.isoformat(),
        "end": end_d.isoformat(),
        "total_patients": total,
        "tree": out,
    }


# ============================================================
# 3. 담당의 별 매출
# ============================================================

@router.get("/doctor-revenue")
async def doctor_revenue(
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    start_d, end_d = _parse_range(start, end)
    q = (
        select(
            Visit.doctor_name,
            func.count(Visit.id).label("visits"),
            func.coalesce(func.sum(VisitProcedure.total_price), 0).label("revenue"),
        )
        .outerjoin(VisitProcedure, VisitProcedure.visit_id == Visit.id)
        .where(and_(
            Visit.user_id == current_user.id,
            Visit.visit_date >= start_d,
            Visit.visit_date <= end_d,
        ))
        .group_by(Visit.doctor_name)
        .order_by(func.coalesce(func.sum(VisitProcedure.total_price), 0).desc())
    )
    res = await db.execute(q)
    rows = res.all()
    return {
        "start": start_d.isoformat(),
        "end": end_d.isoformat(),
        "doctors": [{
            "doctor_name": r.doctor_name or "(미지정)",
            "visits": int(r.visits or 0),
            "revenue": int(r.revenue or 0),
        } for r in rows],
    }


# ============================================================
# 4. 일별 매출/방문 추이
# ============================================================

@router.get("/daily-trend")
async def daily_trend(
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    start_d, end_d = _parse_range(start, end, default_days=7)
    q = text(
        "SELECT v.visit_date AS d, "
        "  COUNT(DISTINCT v.id) AS visits, "
        "  COALESCE(SUM(vp.total_price), 0) AS revenue, "
        "  COUNT(DISTINCT CASE WHEN v.visit_type='INITIAL' THEN v.patient_id END) AS new_pts, "
        "  COUNT(DISTINCT CASE WHEN v.visit_type<>'INITIAL' THEN v.patient_id END) AS return_pts "
        "FROM visits v LEFT JOIN visit_procedures vp ON vp.visit_id = v.id "
        "WHERE v.user_id = :uid AND v.visit_date BETWEEN :s AND :e "
        "GROUP BY v.visit_date ORDER BY v.visit_date"
    )
    res = await db.execute(q, {"uid": current_user.id, "s": start_d, "e": end_d})
    return {
        "start": start_d.isoformat(),
        "end": end_d.isoformat(),
        "days": [{
            "date": r.d.isoformat() if hasattr(r.d, "isoformat") else str(r.d),
            "visits": int(r.visits or 0),
            "revenue": int(r.revenue or 0),
            "new_patients": int(r.new_pts or 0),
            "return_patients": int(r.return_pts or 0),
        } for r in res.all()],
    }
