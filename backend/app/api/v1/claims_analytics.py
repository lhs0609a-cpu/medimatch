"""
청구 분석 및 리포트 엔드포인트

- 분석 대시보드 종합 데이터
- 월별 청구 트렌드
- 동료 벤치마크 비교
- 수익 최적화 제안
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, extract, desc
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date, timedelta
from collections import defaultdict
import random
import logging

from ..deps import get_db, get_current_active_user
from .service_guards import require_active_service
from ...models.user import User
from ...models.service_subscription import ServiceSubscription, ServiceType
from ...models.insurance_claim import (
    InsuranceClaim, ClaimItem, ClaimBatch,
    ClaimStatus, RiskLevel, ClaimItemType,
)
from ...models.claims_ai import PeerBenchmark, RejectionPattern

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================================
# Demo data generators
# ============================================================

def _demo_dashboard() -> dict:
    """데모 대시보드 데이터"""
    today = date.today()
    return {
        "period": f"{(today - timedelta(days=30)).isoformat()} ~ {today.isoformat()}",
        "summary": {
            "total_claims": 156,
            "total_amount": 12_450_000,
            "accepted_amount": 11_320_000,
            "rejected_amount": 1_130_000,
            "acceptance_rate": 90.9,
            "rejection_rate": 9.1,
            "avg_risk_score": 82.3,
            "high_risk_count": 12,
        },
        "monthly_trends": [
            {"month": "2025-09", "total_claims": 128, "accepted": 118, "rejected": 5, "partial": 5, "total_amount": 10_200_000, "rejected_amount": 680_000},
            {"month": "2025-10", "total_claims": 135, "accepted": 122, "rejected": 7, "partial": 6, "total_amount": 10_800_000, "rejected_amount": 850_000},
            {"month": "2025-11", "total_claims": 141, "accepted": 128, "rejected": 6, "partial": 7, "total_amount": 11_100_000, "rejected_amount": 790_000},
            {"month": "2025-12", "total_claims": 148, "accepted": 135, "rejected": 8, "partial": 5, "total_amount": 11_800_000, "rejected_amount": 920_000},
            {"month": "2026-01", "total_claims": 152, "accepted": 138, "rejected": 7, "partial": 7, "total_amount": 12_100_000, "rejected_amount": 1_050_000},
            {"month": "2026-02", "total_claims": 156, "accepted": 141, "rejected": 8, "partial": 7, "total_amount": 12_450_000, "rejected_amount": 1_130_000},
        ],
        "risk_distribution": {
            "LOW": 108,
            "MEDIUM": 36,
            "HIGH": 12,
        },
        "top_rejected_codes": [
            {"code": "HA010", "name": "주사 처치료", "rejection_count": 18, "rejection_rate": 27.5, "total_amount": 630_000},
            {"code": "MM042", "name": "도수치료-복합", "rejection_count": 14, "rejection_rate": 12.3, "total_amount": 770_000},
            {"code": "B0030", "name": "물리치료-복합", "rejection_count": 11, "rejection_rate": 18.9, "total_amount": 308_000},
            {"code": "D2711", "name": "갑상선기능검사", "rejection_count": 8, "rejection_rate": 47.9, "total_amount": 256_000},
            {"code": "EB411", "name": "갑상선 초음파", "rejection_count": 6, "rejection_rate": 21.7, "total_amount": 390_000},
        ],
        "status_breakdown": {
            "DRAFT": 5,
            "READY": 3,
            "SUBMITTED": 7,
            "ACCEPTED": 141,
            "REJECTED": 8,
            "PARTIAL": 7,
            "APPEALING": 2,
        },
        "is_demo": True,
    }


def _demo_trends(months: int) -> dict:
    """데모 월별 트렌드"""
    rng = random.Random(42)
    today = date.today()
    trends = []
    for i in range(months - 1, -1, -1):
        month_date = today.replace(day=1) - timedelta(days=30 * i)
        month_str = month_date.strftime("%Y-%m")
        total = rng.randint(120, 160)
        rejected_count = rng.randint(5, 12)
        partial_count = rng.randint(3, 8)
        accepted_count = total - rejected_count - partial_count
        total_amount = total * rng.randint(75000, 85000)
        rejected_amount = int(total_amount * rng.uniform(0.06, 0.12))
        trends.append({
            "month": month_str,
            "total_claims": total,
            "accepted": accepted_count,
            "rejected": rejected_count,
            "partial": partial_count,
            "total_amount": total_amount,
            "rejected_amount": rejected_amount,
            "acceptance_rate": round(accepted_count / total * 100, 1),
            "rejection_rate": round((rejected_count + partial_count) / total * 100, 1),
        })
    return {"trends": trends, "months": months, "is_demo": True}


def _demo_peer_benchmark() -> dict:
    """데모 동료 벤치마크"""
    return {
        "user_stats": {
            "rejection_rate": 9.1,
            "avg_risk_score": 82.3,
            "total_claims_month": 156,
            "total_amount_month": 12_450_000,
        },
        "specialty_avg": {
            "rejection_rate": 7.2,
            "avg_risk_score": 85.1,
            "total_claims_month": 142,
            "total_amount_month": 11_800_000,
        },
        "percentile": 62,
        "percentile_detail": {
            "p10": 2.1,
            "p25": 4.3,
            "p50": 7.2,
            "p75": 11.5,
            "p90": 16.8,
            "user": 9.1,
        },
        "recommendations": [
            {
                "type": "CODE_OPTIMIZATION",
                "message": "HA010 (주사 처치료) 삭감률이 동료 평균 대비 15.3%p 높습니다. 급여 기준 확인을 권고합니다.",
                "potential_savings": 315_000,
            },
            {
                "type": "DOCUMENTATION",
                "message": "MM042 (도수치료) 사용 시 시행 사유 소견서 첨부율이 45%입니다. 소견서 첨부로 삭감률 50% 감소 가능합니다.",
                "potential_savings": 385_000,
            },
            {
                "type": "FREQUENCY",
                "message": "B0030 (물리치료-복합) 평균 처방 빈도가 동료 대비 1.5배 높습니다. 빈도 조절로 삭감 방지 가능합니다.",
                "potential_savings": 154_000,
            },
        ],
        "top_rejected_vs_peers": [
            {"code": "HA010", "user_rate": 27.5, "peer_rate": 12.2, "gap": 15.3},
            {"code": "MM042", "user_rate": 12.3, "peer_rate": 8.1, "gap": 4.2},
            {"code": "B0030", "user_rate": 18.9, "peer_rate": 14.5, "gap": 4.4},
        ],
        "is_demo": True,
    }


def _demo_revenue_optimization() -> dict:
    """데모 수익 최적화 제안"""
    return {
        "total_potential_savings": 1_254_000,
        "total_potential_revenue_increase": 680_000,
        "suggestions": [
            {
                "id": 1,
                "type": "CODE_SWITCH",
                "title": "HA010 → HA011 코드 전환",
                "description": "주사 처치료(HA010)의 삭감률이 27.5%입니다. 급여 기준에 맞는 경우 간이 처치료(HA011)로 전환하면 통과율 95.2%를 기대할 수 있습니다.",
                "current_code": "HA010",
                "suggested_code": "HA011",
                "estimated_savings": 315_000,
                "estimated_revenue_impact": -54_000,
                "net_impact": 261_000,
                "confidence": 0.82,
            },
            {
                "id": 2,
                "type": "DOCUMENTATION_IMPROVEMENT",
                "title": "도수치료 소견서 첨부율 향상",
                "description": "MM042 도수치료 시행 사유 소견서 첨부율을 45%에서 90%로 높이면 삭감률 12.3% → 6.1%로 감소 예상됩니다.",
                "current_rejection_rate": 12.3,
                "target_rejection_rate": 6.1,
                "estimated_savings": 385_000,
                "estimated_revenue_impact": 0,
                "net_impact": 385_000,
                "confidence": 0.75,
            },
            {
                "id": 3,
                "type": "FREQUENCY_OPTIMIZATION",
                "title": "물리치료 빈도 최적화",
                "description": "B0030 물리치료-복합의 월 평균 처방 빈도가 급여 기준 상한에 근접합니다. 빈도를 조절하면 삭감 방지 및 환자당 단가 유지가 가능합니다.",
                "current_frequency": 4.2,
                "recommended_frequency": 3.0,
                "estimated_savings": 154_000,
                "estimated_revenue_impact": -85_000,
                "net_impact": 69_000,
                "confidence": 0.68,
            },
            {
                "id": 4,
                "type": "UPCODING_OPPORTUNITY",
                "title": "재진 → 초진 분류 재검토",
                "description": "30일 이상 미내원 후 재방문 환자 중 재진(AA258)으로 청구된 건 15건 확인. 초진(AA157) 요건 충족 시 청구 단가 증가.",
                "estimated_savings": 0,
                "estimated_revenue_impact": 93_000,
                "net_impact": 93_000,
                "confidence": 0.60,
            },
            {
                "id": 5,
                "type": "BUNDLED_SERVICE",
                "title": "검사 패키지 최적화",
                "description": "당뇨 환자 정기 검사 시 CBC+HbA1c+Lipid 패키지를 활용하면 개별 청구 대비 삭감 위험이 낮아집니다.",
                "estimated_savings": 120_000,
                "estimated_revenue_impact": 45_000,
                "net_impact": 165_000,
                "confidence": 0.72,
            },
        ],
        "is_demo": True,
    }


# ============================================================
# Endpoints
# ============================================================

@router.get("/dashboard")
async def analytics_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """분석 대시보드 종합 데이터"""
    result = await db.execute(
        select(InsuranceClaim).where(InsuranceClaim.user_id == current_user.id)
    )
    claims = result.scalars().all()

    if not claims:
        return _demo_dashboard()

    today = date.today()
    thirty_days_ago = today - timedelta(days=30)

    # 최근 30일 청구
    recent = [c for c in claims if c.claim_date and c.claim_date >= thirty_days_ago]
    all_claims = claims

    # 요약 통계
    total_amount = sum(c.total_amount for c in recent)
    accepted_claims = [c for c in recent if c.status == ClaimStatus.ACCEPTED]
    rejected_claims = [c for c in recent if c.status == ClaimStatus.REJECTED]
    partial_claims = [c for c in recent if c.status == ClaimStatus.PARTIAL]
    resolved = [c for c in recent if c.status in (ClaimStatus.ACCEPTED, ClaimStatus.PARTIAL, ClaimStatus.REJECTED)]

    accepted_amount = sum(c.approved_amount or 0 for c in resolved)
    rejected_amount = sum(c.rejected_amount or 0 for c in resolved)
    total_resolved = sum(c.total_amount for c in resolved)

    acceptance_rate = round(accepted_amount / total_resolved * 100, 1) if total_resolved > 0 else 0
    rejection_rate = round(rejected_amount / total_resolved * 100, 1) if total_resolved > 0 else 0

    avg_risk_score = round(sum(c.risk_score or 0 for c in recent) / len(recent), 1) if recent else 0
    high_risk_count = sum(1 for c in recent if c.risk_level == RiskLevel.HIGH)

    # 리스크 분포
    risk_dist = {"LOW": 0, "MEDIUM": 0, "HIGH": 0}
    for c in recent:
        if c.risk_level:
            risk_dist[c.risk_level.value] = risk_dist.get(c.risk_level.value, 0) + 1

    # 상태 분포
    status_breakdown = defaultdict(int)
    for c in all_claims:
        if c.status:
            status_breakdown[c.status.value] += 1

    # 월별 트렌드 (최근 6개월)
    monthly_trends = []
    for i in range(5, -1, -1):
        month_start = today.replace(day=1) - timedelta(days=30 * i)
        month_end = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
        month_str = month_start.strftime("%Y-%m")

        month_claims = [c for c in all_claims if c.claim_date and month_start <= c.claim_date <= month_end]
        m_accepted = sum(1 for c in month_claims if c.status == ClaimStatus.ACCEPTED)
        m_rejected = sum(1 for c in month_claims if c.status == ClaimStatus.REJECTED)
        m_partial = sum(1 for c in month_claims if c.status == ClaimStatus.PARTIAL)
        m_total_amount = sum(c.total_amount for c in month_claims)
        m_rejected_amount = sum(c.rejected_amount or 0 for c in month_claims)

        monthly_trends.append({
            "month": month_str,
            "total_claims": len(month_claims),
            "accepted": m_accepted,
            "rejected": m_rejected,
            "partial": m_partial,
            "total_amount": m_total_amount,
            "rejected_amount": m_rejected_amount,
        })

    # 자주 삭감되는 코드 (항목 기반 분석)
    top_rejected_codes = []
    items_result = await db.execute(
        select(ClaimItem).where(
            ClaimItem.claim_id.in_([c.id for c in rejected_claims + partial_claims])
        )
    )
    rejected_items = items_result.scalars().all()

    code_stats = defaultdict(lambda: {"count": 0, "amount": 0, "name": ""})
    for item in rejected_items:
        code_stats[item.code]["count"] += 1
        code_stats[item.code]["amount"] += item.total_price
        code_stats[item.code]["name"] = item.name

    for code, stats in sorted(code_stats.items(), key=lambda x: x[1]["count"], reverse=True)[:5]:
        top_rejected_codes.append({
            "code": code,
            "name": stats["name"],
            "rejection_count": stats["count"],
            "total_amount": stats["amount"],
        })

    return {
        "period": f"{thirty_days_ago.isoformat()} ~ {today.isoformat()}",
        "summary": {
            "total_claims": len(recent),
            "total_amount": total_amount,
            "accepted_amount": accepted_amount,
            "rejected_amount": rejected_amount,
            "acceptance_rate": acceptance_rate,
            "rejection_rate": rejection_rate,
            "avg_risk_score": avg_risk_score,
            "high_risk_count": high_risk_count,
        },
        "monthly_trends": monthly_trends,
        "risk_distribution": risk_dist,
        "top_rejected_codes": top_rejected_codes,
        "status_breakdown": dict(status_breakdown),
        "is_demo": False,
    }


@router.get("/trends")
async def claim_trends(
    months: int = Query(6, ge=1, le=24, description="조회 개월 수"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """월별 청구 트렌드"""
    today = date.today()
    start_date = today.replace(day=1) - timedelta(days=30 * (months - 1))

    result = await db.execute(
        select(InsuranceClaim).where(
            and_(
                InsuranceClaim.user_id == current_user.id,
                InsuranceClaim.claim_date >= start_date,
            )
        )
    )
    claims = result.scalars().all()

    if not claims:
        return _demo_trends(months)

    trends = []
    for i in range(months - 1, -1, -1):
        month_start = today.replace(day=1) - timedelta(days=30 * i)
        month_end = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
        month_str = month_start.strftime("%Y-%m")

        month_claims = [c for c in claims if c.claim_date and month_start <= c.claim_date <= month_end]
        accepted = sum(1 for c in month_claims if c.status == ClaimStatus.ACCEPTED)
        rejected = sum(1 for c in month_claims if c.status == ClaimStatus.REJECTED)
        partial = sum(1 for c in month_claims if c.status == ClaimStatus.PARTIAL)
        total_amount = sum(c.total_amount for c in month_claims)
        rejected_amount = sum(c.rejected_amount or 0 for c in month_claims)

        total = len(month_claims)
        trends.append({
            "month": month_str,
            "total_claims": total,
            "accepted": accepted,
            "rejected": rejected,
            "partial": partial,
            "total_amount": total_amount,
            "rejected_amount": rejected_amount,
            "acceptance_rate": round(accepted / total * 100, 1) if total > 0 else 0,
            "rejection_rate": round((rejected + partial) / total * 100, 1) if total > 0 else 0,
        })

    return {"trends": trends, "months": months, "is_demo": False}


@router.get("/peer-benchmark")
async def peer_benchmark(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """동료 벤치마크 비교"""
    # 사용자 통계 계산
    today = date.today()
    month_start = today.replace(day=1)

    result = await db.execute(
        select(InsuranceClaim).where(
            and_(
                InsuranceClaim.user_id == current_user.id,
                InsuranceClaim.claim_date >= month_start,
            )
        )
    )
    user_claims = result.scalars().all()

    if not user_claims:
        return _demo_peer_benchmark()

    # 사용자 삭감률 계산
    resolved = [c for c in user_claims if c.status in (ClaimStatus.ACCEPTED, ClaimStatus.PARTIAL, ClaimStatus.REJECTED)]
    total_claimed = sum(c.total_amount for c in resolved)
    total_rejected = sum(c.rejected_amount or 0 for c in resolved)
    user_rejection_rate = round(total_rejected / total_claimed * 100, 1) if total_claimed > 0 else 0
    user_avg_risk = round(sum(c.risk_score or 0 for c in user_claims) / len(user_claims), 1) if user_claims else 0

    # PeerBenchmark DB 조회
    period_str = today.strftime("%Y-%m")
    benchmark_result = await db.execute(
        select(PeerBenchmark).where(PeerBenchmark.period == period_str).limit(1)
    )
    peer = benchmark_result.scalar_one_or_none()

    if not peer:
        # 데모 데이터로 동료 평균 생성
        demo = _demo_peer_benchmark()
        demo["user_stats"] = {
            "rejection_rate": user_rejection_rate,
            "avg_risk_score": user_avg_risk,
            "total_claims_month": len(user_claims),
            "total_amount_month": sum(c.total_amount for c in user_claims),
        }
        return demo

    # 백분위 계산
    percentiles = peer.percentiles or {}
    user_rate = user_rejection_rate
    if user_rate <= percentiles.get("p10", 0):
        percentile = 90
    elif user_rate <= percentiles.get("p25", 0):
        percentile = 75
    elif user_rate <= percentiles.get("p50", 0):
        percentile = 50
    elif user_rate <= percentiles.get("p75", 0):
        percentile = 25
    else:
        percentile = 10

    return {
        "user_stats": {
            "rejection_rate": user_rejection_rate,
            "avg_risk_score": user_avg_risk,
            "total_claims_month": len(user_claims),
            "total_amount_month": sum(c.total_amount for c in user_claims),
        },
        "specialty_avg": {
            "rejection_rate": peer.avg_rejection_rate,
            "avg_risk_score": None,
            "total_claims_month": None,
            "total_amount_month": None,
        },
        "percentile": percentile,
        "percentile_detail": {
            **percentiles,
            "user": user_rejection_rate,
        },
        "top_rejected_codes": peer.top_rejected_codes or [],
        "sample_size": peer.sample_size,
        "recommendations": [],
        "is_demo": False,
    }


@router.get("/revenue-optimization")
async def revenue_optimization(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """수익 최적화 제안"""
    result = await db.execute(
        select(InsuranceClaim).where(
            and_(
                InsuranceClaim.user_id == current_user.id,
                InsuranceClaim.claim_date >= date.today() - timedelta(days=90),
            )
        )
    )
    claims = result.scalars().all()

    if not claims:
        return _demo_revenue_optimization()

    # 삭감 패턴 분석
    rejected_claims = [c for c in claims if c.status in (ClaimStatus.REJECTED, ClaimStatus.PARTIAL)]
    if not rejected_claims:
        return {
            "total_potential_savings": 0,
            "total_potential_revenue_increase": 0,
            "suggestions": [],
            "message": "최근 90일 삭감 건이 없습니다. 현재 청구 패턴이 양호합니다.",
            "is_demo": False,
        }

    # 삭감 항목 분석
    rejected_claim_ids = [c.id for c in rejected_claims]
    items_result = await db.execute(
        select(ClaimItem).where(ClaimItem.claim_id.in_(rejected_claim_ids))
    )
    items = items_result.scalars().all()

    code_rejection_stats = defaultdict(lambda: {"count": 0, "amount": 0, "name": ""})
    for item in items:
        code_rejection_stats[item.code]["count"] += 1
        code_rejection_stats[item.code]["amount"] += item.total_price
        code_rejection_stats[item.code]["name"] = item.name

    # 제안 생성
    suggestions = []
    total_savings = 0
    sid = 1

    ALTERNATIVE_MAP = {
        "HA010": ("HA011", "간이 처치료", 95.2),
        "MM042": ("MM041", "도수치료-단순", 91.5),
        "B0030": ("B0020", "물리치료-기본", 95.2),
        "D2711": ("D2200", "일반혈액검사", 96.8),
        "EB411": ("EB410", "초음파-기본", 94.1),
    }

    for code, stats in sorted(code_rejection_stats.items(), key=lambda x: x[1]["amount"], reverse=True):
        alt = ALTERNATIVE_MAP.get(code)
        if alt:
            est_savings = int(stats["amount"] * 0.5)
            total_savings += est_savings
            suggestions.append({
                "id": sid,
                "type": "CODE_SWITCH",
                "title": f"{code} → {alt[0]} 코드 전환",
                "description": f"{stats['name']}({code}) 삭감 {stats['count']}건. {alt[1]}({alt[0]}) 전환 시 통과율 {alt[2]}% 기대.",
                "current_code": code,
                "suggested_code": alt[0],
                "estimated_savings": est_savings,
                "confidence": 0.75,
            })
            sid += 1

        if stats["count"] >= 3:
            doc_savings = int(stats["amount"] * 0.3)
            total_savings += doc_savings
            suggestions.append({
                "id": sid,
                "type": "DOCUMENTATION_IMPROVEMENT",
                "title": f"{code} 서류 보완",
                "description": f"{stats['name']}({code}) 반복 삭감 {stats['count']}건. 시행 사유 소견서 및 근거 서류 첨부 강화 권고.",
                "estimated_savings": doc_savings,
                "confidence": 0.65,
            })
            sid += 1

    return {
        "total_potential_savings": total_savings,
        "total_potential_revenue_increase": int(total_savings * 0.4),
        "suggestions": suggestions[:10],
        "analysis_period": f"{(date.today() - timedelta(days=90)).isoformat()} ~ {date.today().isoformat()}",
        "is_demo": False,
    }
