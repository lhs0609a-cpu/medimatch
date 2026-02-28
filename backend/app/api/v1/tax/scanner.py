"""
AI Tax Scanner API

- 19개 공제 카테고리 스캔
- 누락 공제 발견 (severity / confidence / estimated amount)
- 필요 서류 안내
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import random
import logging

from ...deps import get_db, get_current_active_user
from ..service_guards import require_active_service
from ....models.user import User
from ....models.service_subscription import ServiceSubscription, ServiceType
from ....models.tax_correction import TaxCorrection, TaxDeduction, DeductionCategory
from ....models.tax_scan import TaxScanResult, TaxScanStatus, FindingSeverity
from ....models.tax_filing import TaxFilingHistory

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================================
# 19 deduction category scan definitions
# ============================================================

SCAN_CATEGORIES = {
    DeductionCategory.MEDICAL_EXPENSE: {
        "title": "의료비 세액공제",
        "description": "보험청구 본인부담금 합산 세액공제 (300만원 초과분의 15%)",
        "typical_amount_range": (500_000, 5_000_000),
        "required_documents": ["의료비 영수증", "본인부담금 납입확인서"],
        "tax_code": "소득세법 제59조의4",
    },
    DeductionCategory.EDUCATION: {
        "title": "교육비 세액공제",
        "description": "직원 교육비 (위생교육, 보수교육 등)",
        "typical_amount_range": (200_000, 2_000_000),
        "required_documents": ["교육비 영수증", "교육 수료증"],
        "tax_code": "소득세법 제59조의4",
    },
    DeductionCategory.DONATION: {
        "title": "기부금 세액공제",
        "description": "법정/지정 기부금 세액공제",
        "typical_amount_range": (100_000, 3_000_000),
        "required_documents": ["기부금 영수증"],
        "tax_code": "소득세법 제34조",
    },
    DeductionCategory.RETIREMENT: {
        "title": "퇴직연금 세액공제",
        "description": "퇴직연금 추가 납입분 세액공제",
        "typical_amount_range": (300_000, 7_000_000),
        "required_documents": ["퇴직연금 납입확인서"],
        "tax_code": "소득세법 제59조의3",
    },
    DeductionCategory.CREDIT_CARD: {
        "title": "신용카드 소득공제",
        "description": "사업용 카드 비용 추가 반영",
        "typical_amount_range": (200_000, 3_000_000),
        "required_documents": ["카드 사용 명세서"],
        "tax_code": "조세특례제한법 제126조의2",
    },
    DeductionCategory.EQUIPMENT_DEPRECIATION: {
        "title": "의료기기 감가상각",
        "description": "정액법 -> 정률법 변경시 추가 공제 가능",
        "typical_amount_range": (1_000_000, 20_000_000),
        "required_documents": ["의료기기 구매 영수증", "감가상각명세서"],
        "tax_code": "소득세법 제33조",
    },
    DeductionCategory.EMPLOYMENT_TAX_CREDIT: {
        "title": "고용증대 세액공제",
        "description": "고용 증가 인원 x 공제금액 (최대 1,100만원/인)",
        "typical_amount_range": (2_000_000, 11_000_000),
        "required_documents": ["근로계약서", "4대보험 가입증명서"],
        "tax_code": "조세특례제한법 제29조의7",
    },
    DeductionCategory.YOUTH_EMPLOYMENT: {
        "title": "청년고용 세액공제",
        "description": "청년(15~34세) 정규직 고용시 추가 공제",
        "typical_amount_range": (1_000_000, 11_000_000),
        "required_documents": ["근로계약서", "주민등록등본"],
        "tax_code": "조세특례제한법 제30조",
    },
    DeductionCategory.CAREER_BREAK_WOMEN: {
        "title": "경력단절여성 세액공제",
        "description": "경력단절여성 고용시 세액공제",
        "typical_amount_range": (1_000_000, 9_000_000),
        "required_documents": ["근로계약서", "경력단절 확인서"],
        "tax_code": "조세특례제한법 제29조의3",
    },
    DeductionCategory.RND_TAX_CREDIT: {
        "title": "연구개발비 세액공제",
        "description": "신기술/신제품 연구개발비 세액공제",
        "typical_amount_range": (500_000, 10_000_000),
        "required_documents": ["연구개발 활동 보고서", "연구소 인정서"],
        "tax_code": "조세특례제한법 제10조",
    },
    DeductionCategory.FACILITY_INVESTMENT: {
        "title": "시설투자 세액공제",
        "description": "사업용 시설 투자 세액공제 (3~12%)",
        "typical_amount_range": (500_000, 15_000_000),
        "required_documents": ["투자 영수증", "시설 사진"],
        "tax_code": "조세특례제한법 제24조",
    },
    DeductionCategory.FAITHFUL_FILING: {
        "title": "성실신고 확인비용",
        "description": "성실신고 확인 비용 세액공제 (120만원 한도)",
        "typical_amount_range": (600_000, 1_200_000),
        "required_documents": ["세무사 수수료 영수증", "성실신고 확인서"],
        "tax_code": "소득세법 제70조의2",
    },
    DeductionCategory.VAT_OPTIMIZATION: {
        "title": "부가세 최적화",
        "description": "의제매입세액공제, 과세/면세 구분 최적화",
        "typical_amount_range": (300_000, 5_000_000),
        "required_documents": ["세금계산서", "매입/매출 장부"],
        "tax_code": "부가가치세법 제42조",
    },
    DeductionCategory.VEHICLE_EXPENSE: {
        "title": "차량 관련 경비",
        "description": "업무용 차량 관련 비용 (감가상각, 유류비, 보험료)",
        "typical_amount_range": (500_000, 8_000_000),
        "required_documents": ["차량 등록증", "운행일지", "유류비 영수증"],
        "tax_code": "소득세법 시행령 제78조의3",
    },
    DeductionCategory.ENTERTAINMENT_WELFARE: {
        "title": "접대비/복리후생",
        "description": "접대비 한도 내 공제 + 직원 복리후생비",
        "typical_amount_range": (200_000, 3_000_000),
        "required_documents": ["접대비 영수증", "복리후생 지출 증빙"],
        "tax_code": "소득세법 제35조",
    },
    DeductionCategory.RETIREMENT_PROVISION: {
        "title": "퇴직급여충당금",
        "description": "퇴직급여충당금 필요경비 산입",
        "typical_amount_range": (500_000, 5_000_000),
        "required_documents": ["급여대장", "퇴직급여충당금 계산서"],
        "tax_code": "소득세법 제34조의5",
    },
    DeductionCategory.STAFF_EDUCATION: {
        "title": "직원교육훈련비",
        "description": "직원 직업훈련비 세액공제",
        "typical_amount_range": (200_000, 2_000_000),
        "required_documents": ["교육비 영수증", "교육 수료증"],
        "tax_code": "조세특례제한법 제104조의18",
    },
    DeductionCategory.PENSION_SAVINGS: {
        "title": "연금저축 세액공제",
        "description": "연금저축 납입액 세액공제 (400만원 한도)",
        "typical_amount_range": (200_000, 4_000_000),
        "required_documents": ["연금저축 납입확인서"],
        "tax_code": "소득세법 제59조의3",
    },
    DeductionCategory.INSURANCE_PREMIUM: {
        "title": "보험료 세액공제",
        "description": "보장성 보험 보험료 세액공제",
        "typical_amount_range": (100_000, 1_000_000),
        "required_documents": ["보험료 납입확인서"],
        "tax_code": "소득세법 제59조의4",
    },
}


# ============================================================
# Demo data
# ============================================================

def _generate_demo_scan_result(tax_years: list[int], scan_type: str = "FULL") -> dict:
    rng = random.Random(42)
    findings = []
    for cat_enum, cat_info in list(SCAN_CATEGORIES.items())[:8]:
        amt_min, amt_max = cat_info["typical_amount_range"]
        estimated = rng.randint(amt_min, amt_max)
        tax_savings = int(estimated * rng.uniform(0.10, 0.35))
        confidence = round(rng.uniform(0.65, 0.98), 2)
        severity = "HIGH" if confidence > 0.85 else ("MEDIUM" if confidence > 0.70 else "LOW")
        findings.append({
            "category": cat_enum.value,
            "title": cat_info["title"],
            "description": cat_info["description"],
            "severity": severity,
            "estimated_amount": estimated,
            "tax_savings": tax_savings,
            "confidence": confidence,
            "tax_year": tax_years[0] if tax_years else 2024,
            "tax_code_reference": cat_info["tax_code"],
            "required_documents": cat_info["required_documents"],
            "risk_note": None,
        })

    total_potential = sum(f["estimated_amount"] for f in findings)
    total_savings = sum(f["tax_savings"] for f in findings)
    avg_conf = round(sum(f["confidence"] for f in findings) / len(findings), 2) if findings else 0

    return {
        "id": None,
        "scan_type": scan_type,
        "tax_years": tax_years,
        "status": "COMPLETED",
        "findings": findings,
        "total_findings": len(findings),
        "total_potential_refund": total_potential,
        "total_tax_savings": total_savings,
        "confidence": avg_conf,
        "peer_benchmark": {
            "specialty": "내과",
            "user_deduction_rate": 42.5,
            "peer_avg_deduction_rate": 48.2,
            "peer_percentile": 35,
        },
        "is_demo": True,
    }


def _generate_demo_category_scan(category: str) -> dict:
    cat_enum = DeductionCategory(category)
    cat_info = SCAN_CATEGORIES.get(cat_enum, {})
    if not cat_info:
        return {"category": category, "findings": [], "is_demo": True}

    rng = random.Random(hash(category))
    amt_min, amt_max = cat_info["typical_amount_range"]
    estimated = rng.randint(amt_min, amt_max)
    tax_savings = int(estimated * 0.25)
    return {
        "category": category,
        "title": cat_info["title"],
        "findings": [
            {
                "category": category,
                "title": cat_info["title"],
                "description": cat_info["description"],
                "severity": "HIGH",
                "estimated_amount": estimated,
                "tax_savings": tax_savings,
                "confidence": 0.88,
                "tax_code_reference": cat_info["tax_code"],
                "required_documents": cat_info["required_documents"],
            }
        ],
        "total_potential_refund": estimated,
        "total_tax_savings": tax_savings,
        "is_demo": True,
    }


# ============================================================
# Endpoints
# ============================================================

@router.post("/")
async def run_full_scan(
    tax_years: list[int] = Query(default=[2024, 2025], description="스캔할 세무연도 목록"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """AI 전체 스캔 실행 - 19개 카테고리 분석"""
    # 기존 신고 데이터 확인
    filing_result = await db.execute(
        select(TaxFilingHistory).where(
            and_(
                TaxFilingHistory.user_id == current_user.id,
                TaxFilingHistory.tax_year.in_(tax_years),
            )
        )
    )
    filings = filing_result.scalars().all()

    if not filings:
        return _generate_demo_scan_result(tax_years, scan_type="FULL")

    # 스캔 결과 생성
    findings = []
    for filing in filings:
        deductions_breakdown = filing.deductions_breakdown or {}
        for cat_enum, cat_info in SCAN_CATEGORIES.items():
            cat_key = cat_enum.value
            current_deduction = deductions_breakdown.get(cat_key, 0)
            amt_min, amt_max = cat_info["typical_amount_range"]
            typical_avg = (amt_min + amt_max) // 2

            if current_deduction < typical_avg * 0.5:
                gap = typical_avg - current_deduction
                tax_savings = int(gap * 0.25)
                confidence = round(min(0.95, 0.60 + (gap / typical_avg) * 0.3), 2)
                severity = "HIGH" if confidence > 0.85 else ("MEDIUM" if confidence > 0.70 else "LOW")

                findings.append({
                    "category": cat_key,
                    "title": cat_info["title"],
                    "description": cat_info["description"],
                    "severity": severity,
                    "estimated_amount": gap,
                    "tax_savings": tax_savings,
                    "confidence": confidence,
                    "tax_year": filing.tax_year,
                    "tax_code_reference": cat_info["tax_code"],
                    "required_documents": cat_info["required_documents"],
                    "risk_note": None,
                })

    total_potential = sum(f["estimated_amount"] for f in findings)
    total_savings = sum(f["tax_savings"] for f in findings)
    avg_conf = round(sum(f["confidence"] for f in findings) / len(findings), 2) if findings else 0

    # 결과 저장
    scan_result = TaxScanResult(
        user_id=current_user.id,
        scan_type="FULL",
        tax_years=tax_years,
        status=TaxScanStatus.COMPLETED,
        findings=findings,
        total_findings=len(findings),
        total_potential_refund=total_potential,
        total_tax_savings=total_savings,
        confidence=avg_conf,
        started_at=datetime.utcnow(),
        completed_at=datetime.utcnow(),
    )
    db.add(scan_result)
    await db.flush()

    return {
        "id": scan_result.id,
        "scan_type": "FULL",
        "tax_years": tax_years,
        "status": "COMPLETED",
        "findings": findings,
        "total_findings": len(findings),
        "total_potential_refund": total_potential,
        "total_tax_savings": total_savings,
        "confidence": avg_conf,
        "is_demo": False,
    }


@router.get("/latest")
async def get_latest_scan(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """최근 스캔 결과 조회"""
    result = await db.execute(
        select(TaxScanResult)
        .where(TaxScanResult.user_id == current_user.id)
        .order_by(TaxScanResult.created_at.desc())
        .limit(1)
    )
    scan = result.scalar_one_or_none()

    if not scan:
        return _generate_demo_scan_result([2024, 2025])

    return {
        "id": scan.id,
        "scan_type": scan.scan_type,
        "tax_years": scan.tax_years,
        "status": scan.status.value if scan.status else None,
        "findings": scan.findings,
        "total_findings": scan.total_findings,
        "total_potential_refund": scan.total_potential_refund,
        "total_tax_savings": scan.total_tax_savings,
        "confidence": scan.confidence,
        "peer_benchmark": scan.peer_benchmark,
        "started_at": scan.started_at.isoformat() if scan.started_at else None,
        "completed_at": scan.completed_at.isoformat() if scan.completed_at else None,
        "is_demo": False,
    }


@router.get("/{scan_id}")
async def get_scan_result(
    scan_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """스캔 결과 상세 조회"""
    result = await db.execute(
        select(TaxScanResult).where(
            and_(
                TaxScanResult.id == scan_id,
                TaxScanResult.user_id == current_user.id,
            )
        )
    )
    scan = result.scalar_one_or_none()
    if not scan:
        raise HTTPException(status_code=404, detail="스캔 결과를 찾을 수 없습니다")

    return {
        "id": scan.id,
        "scan_type": scan.scan_type,
        "tax_years": scan.tax_years,
        "status": scan.status.value if scan.status else None,
        "findings": scan.findings,
        "total_findings": scan.total_findings,
        "total_potential_refund": scan.total_potential_refund,
        "total_tax_savings": scan.total_tax_savings,
        "confidence": scan.confidence,
        "peer_benchmark": scan.peer_benchmark,
        "model_version": scan.model_version,
        "started_at": scan.started_at.isoformat() if scan.started_at else None,
        "completed_at": scan.completed_at.isoformat() if scan.completed_at else None,
        "duration_ms": scan.duration_ms,
        "is_demo": False,
    }


@router.post("/category/{category}")
async def scan_category(
    category: str,
    tax_year: int = Query(2024, description="스캔할 세무연도"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """특정 카테고리 스캔"""
    try:
        cat_enum = DeductionCategory(category)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"유효하지 않은 카테고리: {category}")

    cat_info = SCAN_CATEGORIES.get(cat_enum)
    if not cat_info:
        raise HTTPException(status_code=400, detail=f"스캔 정보가 없는 카테고리: {category}")

    # 기존 신고 데이터 확인
    filing_result = await db.execute(
        select(TaxFilingHistory).where(
            and_(
                TaxFilingHistory.user_id == current_user.id,
                TaxFilingHistory.tax_year == tax_year,
            )
        )
    )
    filing = filing_result.scalar_one_or_none()

    if not filing:
        return _generate_demo_category_scan(category)

    deductions_breakdown = filing.deductions_breakdown or {}
    current_deduction = deductions_breakdown.get(category, 0)
    amt_min, amt_max = cat_info["typical_amount_range"]
    typical_avg = (amt_min + amt_max) // 2

    findings = []
    if current_deduction < typical_avg * 0.7:
        gap = typical_avg - current_deduction
        tax_savings = int(gap * 0.25)
        confidence = round(min(0.95, 0.60 + (gap / typical_avg) * 0.3), 2)
        findings.append({
            "category": category,
            "title": cat_info["title"],
            "description": cat_info["description"],
            "severity": "HIGH" if confidence > 0.85 else "MEDIUM",
            "estimated_amount": gap,
            "tax_savings": tax_savings,
            "confidence": confidence,
            "tax_year": tax_year,
            "tax_code_reference": cat_info["tax_code"],
            "required_documents": cat_info["required_documents"],
        })

    # 결과 저장
    scan_result = TaxScanResult(
        user_id=current_user.id,
        scan_type="CATEGORY",
        tax_years=[tax_year],
        status=TaxScanStatus.COMPLETED,
        findings=findings,
        total_findings=len(findings),
        total_potential_refund=sum(f["estimated_amount"] for f in findings),
        total_tax_savings=sum(f["tax_savings"] for f in findings),
        confidence=findings[0]["confidence"] if findings else 0,
        started_at=datetime.utcnow(),
        completed_at=datetime.utcnow(),
    )
    db.add(scan_result)
    await db.flush()

    return {
        "id": scan_result.id,
        "category": category,
        "title": cat_info["title"],
        "findings": findings,
        "total_potential_refund": scan_result.total_potential_refund,
        "total_tax_savings": scan_result.total_tax_savings,
        "is_demo": False,
    }
