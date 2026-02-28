"""
세무 분석 API

- 대시보드 KPI
- 월별/연도별 트렌드
- 동종 업계 비교 벤치마크
- 카테고리별 분석
- 절감 잠재액 계산
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import Optional
from datetime import datetime
import random
import logging

from ...deps import get_db, get_current_active_user
from ..service_guards import require_active_service
from ....models.user import User
from ....models.service_subscription import ServiceSubscription, ServiceType
from ....models.tax_correction import TaxCorrection, TaxDeduction, TaxCorrectionStatus, DeductionCategory
from ....models.tax_regulation import TaxPeerBenchmark
from ....models.tax_scan import TaxScanResult

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================================
# Demo data
# ============================================================

def _generate_demo_dashboard() -> dict:
    return {
        "summary": {
            "total_corrections": 5,
            "total_refund": 12_500_000,
            "total_fee": 1_462_500,
            "net_refund": 11_037_500,
            "active_count": 2,
            "completed_count": 3,
            "avg_confidence": 89.2,
            "avg_processing_days": 28,
        },
        "recent_corrections": [
            {"correction_number": "TAX-2025-0001", "tax_year": 2025, "refund_amount": 3_500_000, "status": "PENDING_REVIEW"},
            {"correction_number": "TAX-2024-0001", "tax_year": 2024, "refund_amount": 2_800_000, "status": "COMPLETED"},
        ],
        "top_categories": [
            {"category": "EQUIPMENT_DEPRECIATION", "label": "의료기기 감가상각", "total_savings": 4_200_000, "count": 3},
            {"category": "MEDICAL_EXPENSE", "label": "의료비 세액공제", "total_savings": 3_100_000, "count": 4},
            {"category": "EMPLOYMENT_TAX_CREDIT", "label": "고용증대 세액공제", "total_savings": 2_800_000, "count": 2},
        ],
        "is_demo": True,
    }


def _generate_demo_trends() -> dict:
    return {
        "monthly": [
            {"month": "2025-01", "corrections": 1, "refund": 1_200_000, "fee": 150_000},
            {"month": "2025-02", "corrections": 0, "refund": 0, "fee": 0},
            {"month": "2025-03", "corrections": 2, "refund": 4_800_000, "fee": 576_000},
            {"month": "2025-04", "corrections": 1, "refund": 2_800_000, "fee": 336_000},
            {"month": "2025-05", "corrections": 0, "refund": 0, "fee": 0},
            {"month": "2025-06", "corrections": 1, "refund": 3_700_000, "fee": 400_500},
        ],
        "yearly": [
            {"year": 2023, "corrections": 2, "total_refund": 3_500_000, "avg_refund": 1_750_000},
            {"year": 2024, "corrections": 3, "total_refund": 5_800_000, "avg_refund": 1_933_333},
            {"year": 2025, "corrections": 5, "total_refund": 12_500_000, "avg_refund": 2_500_000},
        ],
        "is_demo": True,
    }


def _generate_demo_peer_benchmark(specialty: str) -> dict:
    return {
        "specialty": specialty,
        "period": "2024",
        "user_stats": {
            "gross_income": 180_000_000,
            "deduction_total": 12_000_000,
            "deduction_rate": 42.5,
            "correction_count": 2,
            "total_refund": 6_300_000,
        },
        "peer_stats": {
            "sample_size": 1_250,
            "avg_gross_income": 195_000_000,
            "avg_deduction_total": 18_500_000,
            "avg_deduction_rate": 48.2,
            "avg_correction_count": 1.8,
            "avg_refund": 4_200_000,
        },
        "percentile": {
            "deduction_rate": 35,
            "total_refund": 68,
            "correction_count": 55,
        },
        "gap_analysis": {
            "EQUIPMENT_DEPRECIATION": {"user": 0, "peer_avg": 12_000_000, "gap": 12_000_000},
            "EMPLOYMENT_TAX_CREDIT": {"user": 0, "peer_avg": 4_500_000, "gap": 4_500_000},
            "FAITHFUL_FILING": {"user": 0, "peer_avg": 1_100_000, "gap": 1_100_000},
            "STAFF_EDUCATION": {"user": 800_000, "peer_avg": 1_500_000, "gap": 700_000},
        },
        "recommendation": "감가상각 방법 변경 및 고용증대 세액공제 적용을 권고합니다. 동종 업계 대비 공제율이 하위 35%입니다.",
        "is_demo": True,
    }


def _generate_demo_category_analysis() -> dict:
    return {
        "categories": [
            {
                "category": "EQUIPMENT_DEPRECIATION", "label": "의료기기 감가상각",
                "total_amount": 15_000_000, "total_savings": 4_200_000,
                "correction_count": 3, "avg_confidence": 91.5,
                "trend": "UP",
            },
            {
                "category": "MEDICAL_EXPENSE", "label": "의료비 세액공제",
                "total_amount": 8_500_000, "total_savings": 3_100_000,
                "correction_count": 4, "avg_confidence": 88.0,
                "trend": "STABLE",
            },
            {
                "category": "EMPLOYMENT_TAX_CREDIT", "label": "고용증대 세액공제",
                "total_amount": 11_000_000, "total_savings": 2_800_000,
                "correction_count": 2, "avg_confidence": 85.5,
                "trend": "UP",
            },
            {
                "category": "EDUCATION", "label": "교육비 세액공제",
                "total_amount": 3_200_000, "total_savings": 960_000,
                "correction_count": 3, "avg_confidence": 82.0,
                "trend": "STABLE",
            },
            {
                "category": "RETIREMENT", "label": "퇴직연금 세액공제",
                "total_amount": 5_000_000, "total_savings": 1_500_000,
                "correction_count": 2, "avg_confidence": 79.0,
                "trend": "DOWN",
            },
        ],
        "total_amount": 42_700_000,
        "total_savings": 12_560_000,
        "is_demo": True,
    }


def _generate_demo_savings_potential() -> dict:
    return {
        "current_deductions": 12_000_000,
        "potential_deductions": 30_500_000,
        "savings_gap": 18_500_000,
        "estimated_tax_savings": 5_550_000,
        "confidence": 82.5,
        "opportunities": [
            {
                "category": "EQUIPMENT_DEPRECIATION",
                "label": "의료기기 감가상각 방법 변경",
                "current": 0,
                "potential": 12_000_000,
                "estimated_savings": 3_600_000,
                "difficulty": "MEDIUM",
                "required_action": "감가상각 방법 변경 신청 (정액법 -> 정률법)",
            },
            {
                "category": "EMPLOYMENT_TAX_CREDIT",
                "label": "고용증대 세액공제 신청",
                "current": 0,
                "potential": 4_500_000,
                "estimated_savings": 4_500_000,
                "difficulty": "LOW",
                "required_action": "고용 증가 인원 확인 및 증빙 준비",
            },
            {
                "category": "FAITHFUL_FILING",
                "label": "성실신고 확인비용 공제",
                "current": 0,
                "potential": 1_200_000,
                "estimated_savings": 1_200_000,
                "difficulty": "LOW",
                "required_action": "세무사 성실신고 확인 수수료 증빙",
            },
            {
                "category": "PENSION_SAVINGS",
                "label": "연금저축 세액공제 최적화",
                "current": 2_000_000,
                "potential": 4_000_000,
                "estimated_savings": 600_000,
                "difficulty": "LOW",
                "required_action": "연금저축 추가 납입 (연 400만원 한도)",
            },
        ],
        "is_demo": True,
    }


# ============================================================
# Endpoints
# ============================================================

@router.get("/dashboard")
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """대시보드 KPI"""
    result = await db.execute(
        select(TaxCorrection).where(TaxCorrection.user_id == current_user.id)
    )
    corrections = result.scalars().all()

    if not corrections:
        return _generate_demo_dashboard()

    total_refund = sum(c.refund_amount or 0 for c in corrections)
    total_fee = sum(c.platform_fee or 0 for c in corrections)
    net_refund = total_refund - total_fee

    active_statuses = {
        TaxCorrectionStatus.DRAFT, TaxCorrectionStatus.SCANNING,
        TaxCorrectionStatus.SCAN_COMPLETE, TaxCorrectionStatus.PENDING_REVIEW,
        TaxCorrectionStatus.PENDING_DOCS, TaxCorrectionStatus.READY_TO_SUBMIT,
        TaxCorrectionStatus.SUBMITTED, TaxCorrectionStatus.NTS_RECEIVED,
        TaxCorrectionStatus.UNDER_REVIEW, TaxCorrectionStatus.REFUND_PENDING,
    }
    active_count = sum(1 for c in corrections if c.status in active_statuses)
    completed_count = sum(1 for c in corrections if c.status == TaxCorrectionStatus.COMPLETED)
    confidences = [c.ai_confidence for c in corrections if c.ai_confidence]
    avg_confidence = round(sum(confidences) / len(confidences), 1) if confidences else 0

    # 평균 처리 일수
    processing_days = []
    for c in corrections:
        if c.submitted_at and c.refund_received_at:
            delta = (c.refund_received_at - c.submitted_at).days
            processing_days.append(delta)
    avg_processing_days = round(sum(processing_days) / len(processing_days)) if processing_days else 0

    # 최근 경정청구
    recent = sorted(corrections, key=lambda c: c.created_at or datetime.min, reverse=True)[:5]
    recent_list = [
        {
            "correction_number": c.correction_number,
            "tax_year": c.tax_year,
            "refund_amount": c.refund_amount,
            "status": c.status.value if c.status else None,
        }
        for c in recent
    ]

    # 상위 카테고리 (공제 항목)
    ded_result = await db.execute(
        select(
            TaxDeduction.category,
            func.sum(TaxDeduction.tax_savings).label("total_savings"),
            func.count(TaxDeduction.id).label("count"),
        )
        .join(TaxCorrection, TaxDeduction.correction_id == TaxCorrection.id)
        .where(TaxCorrection.user_id == current_user.id)
        .group_by(TaxDeduction.category)
        .order_by(func.sum(TaxDeduction.tax_savings).desc())
        .limit(5)
    )
    top_categories = [
        {
            "category": row.category.value if row.category else "OTHER",
            "label": row.category.value if row.category else "기타",
            "total_savings": row.total_savings or 0,
            "count": row.count or 0,
        }
        for row in ded_result
    ]

    return {
        "summary": {
            "total_corrections": len(corrections),
            "total_refund": total_refund,
            "total_fee": total_fee,
            "net_refund": net_refund,
            "active_count": active_count,
            "completed_count": completed_count,
            "avg_confidence": avg_confidence,
            "avg_processing_days": avg_processing_days,
        },
        "recent_corrections": recent_list,
        "top_categories": top_categories,
        "is_demo": False,
    }


@router.get("/trends")
async def get_trends(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """월별/연도별 트렌드"""
    result = await db.execute(
        select(TaxCorrection).where(TaxCorrection.user_id == current_user.id)
    )
    corrections = result.scalars().all()

    if not corrections:
        return _generate_demo_trends()

    # 월별 집계
    monthly: dict[str, dict] = {}
    for c in corrections:
        if c.created_at:
            key = c.created_at.strftime("%Y-%m")
            if key not in monthly:
                monthly[key] = {"corrections": 0, "refund": 0, "fee": 0}
            monthly[key]["corrections"] += 1
            monthly[key]["refund"] += c.refund_amount or 0
            monthly[key]["fee"] += c.platform_fee or 0

    monthly_list = [
        {"month": k, **v} for k, v in sorted(monthly.items())
    ]

    # 연도별 집계
    yearly: dict[int, dict] = {}
    for c in corrections:
        y = c.tax_year
        if y not in yearly:
            yearly[y] = {"corrections": 0, "total_refund": 0}
        yearly[y]["corrections"] += 1
        yearly[y]["total_refund"] += c.refund_amount or 0

    yearly_list = [
        {
            "year": y,
            "corrections": v["corrections"],
            "total_refund": v["total_refund"],
            "avg_refund": round(v["total_refund"] / v["corrections"]) if v["corrections"] else 0,
        }
        for y, v in sorted(yearly.items())
    ]

    return {
        "monthly": monthly_list,
        "yearly": yearly_list,
        "is_demo": False,
    }


@router.get("/peer-benchmark")
async def get_peer_benchmark(
    specialty: str = Query("내과", description="진료과목"),
    period: str = Query("2024", description="기간"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """동종 업계 비교 벤치마크"""
    # 벤치마크 데이터 조회
    bench_result = await db.execute(
        select(TaxPeerBenchmark).where(
            and_(
                TaxPeerBenchmark.specialty == specialty,
                TaxPeerBenchmark.period == period,
            )
        )
    )
    benchmark = bench_result.scalar_one_or_none()

    if not benchmark:
        return _generate_demo_peer_benchmark(specialty)

    # 사용자 통계
    corr_result = await db.execute(
        select(TaxCorrection).where(TaxCorrection.user_id == current_user.id)
    )
    corrections = corr_result.scalars().all()

    user_total_refund = sum(c.refund_amount or 0 for c in corrections)

    return {
        "specialty": specialty,
        "period": period,
        "user_stats": {
            "correction_count": len(corrections),
            "total_refund": user_total_refund,
        },
        "peer_stats": {
            "sample_size": benchmark.sample_size,
            "avg_gross_income": benchmark.avg_gross_income,
            "avg_deduction_total": benchmark.avg_deduction_total,
            "avg_deduction_rate": benchmark.avg_expense_rate,
            "avg_correction_count": benchmark.avg_correction_rate,
            "avg_refund": benchmark.avg_refund_amount,
        },
        "percentiles": benchmark.percentiles,
        "avg_deduction_by_category": benchmark.avg_deduction_by_category,
        "is_demo": False,
    }


@router.get("/category-analysis")
async def get_category_analysis(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """카테고리별 공제 분석"""
    result = await db.execute(
        select(
            TaxDeduction.category,
            func.sum(TaxDeduction.amount).label("total_amount"),
            func.sum(TaxDeduction.tax_savings).label("total_savings"),
            func.count(TaxDeduction.id).label("count"),
            func.avg(TaxDeduction.ai_confidence).label("avg_confidence"),
        )
        .join(TaxCorrection, TaxDeduction.correction_id == TaxCorrection.id)
        .where(TaxCorrection.user_id == current_user.id)
        .group_by(TaxDeduction.category)
        .order_by(func.sum(TaxDeduction.amount).desc())
    )
    rows = result.all()

    if not rows:
        return _generate_demo_category_analysis()

    categories = []
    total_amount = 0
    total_savings = 0
    for row in rows:
        cat_amount = row.total_amount or 0
        cat_savings = row.total_savings or 0
        total_amount += cat_amount
        total_savings += cat_savings
        categories.append({
            "category": row.category.value if row.category else "OTHER",
            "label": row.category.value if row.category else "기타",
            "total_amount": cat_amount,
            "total_savings": cat_savings,
            "correction_count": row.count or 0,
            "avg_confidence": round(row.avg_confidence, 1) if row.avg_confidence else 0,
        })

    return {
        "categories": categories,
        "total_amount": total_amount,
        "total_savings": total_savings,
        "is_demo": False,
    }


@router.get("/savings-potential")
async def get_savings_potential(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """절감 잠재액 계산"""
    # 최근 스캔 결과 조회
    scan_result = await db.execute(
        select(TaxScanResult)
        .where(TaxScanResult.user_id == current_user.id)
        .order_by(TaxScanResult.created_at.desc())
        .limit(1)
    )
    scan = scan_result.scalar_one_or_none()

    if not scan:
        return _generate_demo_savings_potential()

    # 현재 공제 합계
    ded_result = await db.execute(
        select(func.sum(TaxDeduction.amount))
        .join(TaxCorrection, TaxDeduction.correction_id == TaxCorrection.id)
        .where(TaxCorrection.user_id == current_user.id)
    )
    current_deductions = ded_result.scalar() or 0

    # 스캔 기반 잠재액
    findings = scan.findings or []
    opportunities = []
    potential_deductions = current_deductions
    estimated_savings = 0

    for finding in findings:
        estimated_amount = finding.get("estimated_amount", 0)
        tax_savings = finding.get("tax_savings", 0)
        potential_deductions += estimated_amount
        estimated_savings += tax_savings

        confidence = finding.get("confidence", 0)
        if confidence > 0.85:
            difficulty = "LOW"
        elif confidence > 0.70:
            difficulty = "MEDIUM"
        else:
            difficulty = "HIGH"

        opportunities.append({
            "category": finding.get("category"),
            "label": finding.get("title"),
            "current": 0,
            "potential": estimated_amount,
            "estimated_savings": tax_savings,
            "difficulty": difficulty,
            "required_action": finding.get("description", ""),
        })

    return {
        "current_deductions": current_deductions,
        "potential_deductions": potential_deductions,
        "savings_gap": potential_deductions - current_deductions,
        "estimated_tax_savings": estimated_savings,
        "confidence": scan.confidence,
        "opportunities": opportunities,
        "is_demo": False,
    }
