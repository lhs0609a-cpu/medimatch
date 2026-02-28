"""
보험청구 관리 API

- 청구 CRUD + AI 리스크 분석 + 일괄 전송 + 통계
- require_active_service(ServiceType.EMR) 가드
- DB에 데이터 없으면 데모 데이터 반환 (is_demo: true)
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, or_
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime, timedelta
import uuid
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

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================================
# Pydantic schemas
# ============================================================

class ClaimItemCreate(BaseModel):
    item_type: str = "TREATMENT"
    code: str
    name: str
    quantity: int = 1
    unit_price: int = 0
    total_price: int = 0


class ClaimCreate(BaseModel):
    claim_date: date
    service_date: date
    patient_chart_no: Optional[str] = None
    patient_name_masked: Optional[str] = None
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    total_amount: int = 0
    insurance_amount: int = 0
    copay_amount: int = 0
    items: list[ClaimItemCreate] = []


class ClaimUpdate(BaseModel):
    claim_date: Optional[date] = None
    service_date: Optional[date] = None
    patient_chart_no: Optional[str] = None
    patient_name_masked: Optional[str] = None
    total_amount: Optional[int] = None
    insurance_amount: Optional[int] = None
    copay_amount: Optional[int] = None
    status: Optional[str] = None


class BatchSubmitRequest(BaseModel):
    claim_ids: list[str]


# ============================================================
# AI risk analysis (rule-based)
# ============================================================

# 고위험 코드 조합 패턴
HIGH_RISK_PATTERNS = [
    {
        "dx": ["J06.9"],
        "tx": ["HA010"],
        "reason": "급성 상기도감염(J06.9)에 대한 HA010 처치 비급여 전환 가능",
        "penalty": 40,
    },
    {
        "dx": ["M54.5"],
        "tx": ["MM042"],
        "reason": "요통(M54.5) + 도수치료(MM042) 조합 삭감률 12% (급여기준 미충족 가능)",
        "penalty": 25,
    },
    {
        "dx": ["G43.9"],
        "tx": ["HA010", "B0030"],
        "reason": "편두통(G43.9)에 HA010 투약기준 미충족 + B0030 횟수 초과 가능",
        "penalty": 45,
    },
]

# 코드별 통과율 기본값
CODE_PASS_RATES = {
    "AA157": 99.8,
    "B0010": 98.5,
    "B0020": 95.2,
    "B0030": 82.0,
    "F1010": 97.3,
    "D2200": 96.8,
    "D2240": 95.5,
    "HA010": 72.5,
    "MM042": 78.3,
    "E7070": 96.0,
    "C5211": 99.2,
    "C3811": 92.4,
    "E6541": 98.7,
    "EB411": 78.3,
    "D2711": 52.1,
    "J1201": 99.9,
}


def analyze_claim_risk(dx_codes: list[str], tx_codes: list[str]) -> dict:
    """규칙 기반 AI 리스크 분석"""
    issues = []
    suggestions = []
    total_penalty = 0

    for pattern in HIGH_RISK_PATTERNS:
        dx_match = any(dx in dx_codes for dx in pattern["dx"])
        tx_match = any(tx in tx_codes for tx in pattern["tx"])
        if dx_match and tx_match:
            issues.append(pattern["reason"])
            total_penalty += pattern["penalty"]
            suggestions.append(
                f"코드 조합 {pattern['dx']} + {pattern['tx']} 검토 필요"
            )

    risk_score = max(0, 100 - total_penalty)

    if risk_score >= 80:
        risk_level = "LOW"
    elif risk_score >= 50:
        risk_level = "MEDIUM"
    else:
        risk_level = "HIGH"

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "issues": issues,
        "suggestions": suggestions,
        "risk_reason": "; ".join(issues) if issues else None,
    }


# ============================================================
# Demo data generator
# ============================================================

def generate_demo_claims() -> list[dict]:
    """기존 프론트엔드 더미와 유사한 패턴의 데모 데이터"""
    rng = random.Random(42)
    today = date.today()

    demo = [
        {
            "id": str(uuid.UUID(int=rng.getrandbits(128))),
            "claim_number": "CLM-2026-0001",
            "claim_date": (today - timedelta(days=0)).isoformat(),
            "service_date": (today - timedelta(days=0)).isoformat(),
            "patient_chart_no": "C-20240118",
            "patient_name_masked": "오○현",
            "patient_age": 45,
            "patient_gender": "F",
            "total_amount": 45200,
            "insurance_amount": 38000,
            "copay_amount": 7200,
            "approved_amount": None,
            "rejected_amount": 0,
            "status": "READY",
            "risk_level": "LOW",
            "risk_score": 95,
            "risk_reason": None,
            "ai_analyzed": True,
            "ai_analysis_result": {"issues": [], "suggestions": []},
            "submitted_at": None,
            "items": [
                {"code": "AA157", "name": "초진 진찰료", "item_type": "TREATMENT", "quantity": 1, "unit_price": 18400, "total_price": 18400, "risk_level": "LOW", "pass_rate": 99.8, "issues": []},
                {"code": "B0010", "name": "기본 처치료", "item_type": "TREATMENT", "quantity": 1, "unit_price": 26800, "total_price": 26800, "risk_level": "LOW", "pass_rate": 98.5, "issues": []},
            ],
        },
        {
            "id": str(uuid.UUID(int=rng.getrandbits(128))),
            "claim_number": "CLM-2026-0002",
            "claim_date": (today - timedelta(days=0)).isoformat(),
            "service_date": (today - timedelta(days=0)).isoformat(),
            "patient_chart_no": "C-20230415",
            "patient_name_masked": "윤○민",
            "patient_age": 62,
            "patient_gender": "M",
            "total_amount": 32800,
            "insurance_amount": 28000,
            "copay_amount": 4800,
            "approved_amount": None,
            "rejected_amount": 0,
            "status": "READY",
            "risk_level": "LOW",
            "risk_score": 97,
            "risk_reason": None,
            "ai_analyzed": True,
            "ai_analysis_result": {"issues": [], "suggestions": []},
            "submitted_at": None,
            "items": [
                {"code": "AA157", "name": "초진 진찰료", "item_type": "TREATMENT", "quantity": 1, "unit_price": 18400, "total_price": 18400, "risk_level": "LOW", "pass_rate": 99.8, "issues": []},
                {"code": "F1010", "name": "처방료", "item_type": "MEDICATION", "quantity": 1, "unit_price": 14400, "total_price": 14400, "risk_level": "LOW", "pass_rate": 97.3, "issues": []},
            ],
        },
        {
            "id": str(uuid.UUID(int=rng.getrandbits(128))),
            "claim_number": "CLM-2026-0003",
            "claim_date": (today - timedelta(days=0)).isoformat(),
            "service_date": (today - timedelta(days=0)).isoformat(),
            "patient_chart_no": "C-20241105",
            "patient_name_masked": "서○래",
            "patient_age": 38,
            "patient_gender": "F",
            "total_amount": 58900,
            "insurance_amount": 48000,
            "copay_amount": 10900,
            "approved_amount": None,
            "rejected_amount": 0,
            "status": "DRAFT",
            "risk_level": "MEDIUM",
            "risk_score": 75,
            "risk_reason": "요통(M54.5) + 도수치료(MM042) 조합 삭감률 12% (급여기준 미충족 가능)",
            "ai_analyzed": True,
            "ai_analysis_result": {"issues": ["M54.5 + MM042 조합 삭감 위험"], "suggestions": ["도수치료 시행 사유 소견서 첨부 권고"]},
            "submitted_at": None,
            "items": [
                {"code": "AA157", "name": "초진 진찰료", "item_type": "TREATMENT", "quantity": 1, "unit_price": 18400, "total_price": 18400, "risk_level": "LOW", "pass_rate": 99.8, "issues": []},
                {"code": "MM042", "name": "도수치료", "item_type": "TREATMENT", "quantity": 1, "unit_price": 25000, "total_price": 25000, "risk_level": "MEDIUM", "pass_rate": 78.3, "issues": ["급여기준 미충족 가능"]},
                {"code": "B0020", "name": "물리치료", "item_type": "TREATMENT", "quantity": 1, "unit_price": 15500, "total_price": 15500, "risk_level": "LOW", "pass_rate": 95.2, "issues": []},
            ],
        },
        {
            "id": str(uuid.UUID(int=rng.getrandbits(128))),
            "claim_number": "CLM-2026-0004",
            "claim_date": (today - timedelta(days=0)).isoformat(),
            "service_date": (today - timedelta(days=0)).isoformat(),
            "patient_chart_no": "C-20230712",
            "patient_name_masked": "강○윤",
            "patient_age": 55,
            "patient_gender": "M",
            "total_amount": 67400,
            "insurance_amount": 55000,
            "copay_amount": 12400,
            "approved_amount": None,
            "rejected_amount": 0,
            "status": "SUBMITTED",
            "risk_level": "LOW",
            "risk_score": 92,
            "risk_reason": None,
            "ai_analyzed": True,
            "ai_analysis_result": {"issues": [], "suggestions": []},
            "submitted_at": (datetime.utcnow() - timedelta(hours=4)).isoformat(),
            "items": [
                {"code": "AA157", "name": "초진 진찰료", "item_type": "TREATMENT", "quantity": 1, "unit_price": 18400, "total_price": 18400, "risk_level": "LOW", "pass_rate": 99.8, "issues": []},
                {"code": "D2200", "name": "일반혈액검사", "item_type": "TREATMENT", "quantity": 1, "unit_price": 24500, "total_price": 24500, "risk_level": "LOW", "pass_rate": 96.8, "issues": []},
                {"code": "D2240", "name": "HbA1c 검사", "item_type": "TREATMENT", "quantity": 1, "unit_price": 24500, "total_price": 24500, "risk_level": "LOW", "pass_rate": 95.5, "issues": []},
            ],
        },
        {
            "id": str(uuid.UUID(int=rng.getrandbits(128))),
            "claim_number": "CLM-2026-0005",
            "claim_date": (today - timedelta(days=1)).isoformat(),
            "service_date": (today - timedelta(days=1)).isoformat(),
            "patient_chart_no": "C-20230101",
            "patient_name_masked": "김○수",
            "patient_age": 48,
            "patient_gender": "M",
            "total_amount": 32800,
            "insurance_amount": 28000,
            "copay_amount": 4800,
            "approved_amount": 32800,
            "rejected_amount": 0,
            "status": "ACCEPTED",
            "risk_level": "LOW",
            "risk_score": 98,
            "risk_reason": None,
            "ai_analyzed": True,
            "ai_analysis_result": {"issues": [], "suggestions": []},
            "submitted_at": (datetime.utcnow() - timedelta(days=1)).isoformat(),
            "items": [],
        },
        {
            "id": str(uuid.UUID(int=rng.getrandbits(128))),
            "claim_number": "CLM-2026-0006",
            "claim_date": (today - timedelta(days=1)).isoformat(),
            "service_date": (today - timedelta(days=1)).isoformat(),
            "patient_chart_no": "C-20230518",
            "patient_name_masked": "최○지",
            "patient_age": 35,
            "patient_gender": "F",
            "total_amount": 78600,
            "insurance_amount": 65000,
            "copay_amount": 13600,
            "approved_amount": 78600,
            "rejected_amount": 0,
            "status": "ACCEPTED",
            "risk_level": "LOW",
            "risk_score": 96,
            "risk_reason": None,
            "ai_analyzed": True,
            "ai_analysis_result": {"issues": [], "suggestions": []},
            "submitted_at": (datetime.utcnow() - timedelta(days=1)).isoformat(),
            "items": [],
        },
        {
            "id": str(uuid.UUID(int=rng.getrandbits(128))),
            "claim_number": "CLM-2026-0007",
            "claim_date": (today - timedelta(days=2)).isoformat(),
            "service_date": (today - timedelta(days=2)).isoformat(),
            "patient_chart_no": "C-20250210",
            "patient_name_masked": "임○준",
            "patient_age": 29,
            "patient_gender": "M",
            "total_amount": 28500,
            "insurance_amount": 22000,
            "copay_amount": 6500,
            "approved_amount": 22100,
            "rejected_amount": 6400,
            "status": "PARTIAL",
            "risk_level": "HIGH",
            "risk_score": 35,
            "risk_reason": "HA010 처치료 삭감 (진단 부적합)",
            "ai_analyzed": True,
            "ai_analysis_result": {"issues": ["HA010 처치료 삭감"], "suggestions": ["진단-처치 적합성 검토"]},
            "submitted_at": (datetime.utcnow() - timedelta(days=2)).isoformat(),
            "items": [],
        },
        {
            "id": str(uuid.UUID(int=rng.getrandbits(128))),
            "claim_number": "CLM-2026-0008",
            "claim_date": (today - timedelta(days=2)).isoformat(),
            "service_date": (today - timedelta(days=2)).isoformat(),
            "patient_chart_no": "C-20240920",
            "patient_name_masked": "노○채",
            "patient_age": 41,
            "patient_gender": "F",
            "total_amount": 42300,
            "insurance_amount": 35000,
            "copay_amount": 7300,
            "approved_amount": 42300,
            "rejected_amount": 0,
            "status": "ACCEPTED",
            "risk_level": "LOW",
            "risk_score": 94,
            "risk_reason": None,
            "ai_analyzed": True,
            "ai_analysis_result": {"issues": [], "suggestions": []},
            "submitted_at": (datetime.utcnow() - timedelta(days=2)).isoformat(),
            "items": [],
        },
        {
            "id": str(uuid.UUID(int=rng.getrandbits(128))),
            "claim_number": "CLM-2026-0009",
            "claim_date": (today - timedelta(days=3)).isoformat(),
            "service_date": (today - timedelta(days=3)).isoformat(),
            "patient_chart_no": "C-20250110",
            "patient_name_masked": "백○연",
            "patient_age": 52,
            "patient_gender": "F",
            "total_amount": 55700,
            "insurance_amount": 45000,
            "copay_amount": 10700,
            "approved_amount": 38200,
            "rejected_amount": 17500,
            "status": "REJECTED",
            "risk_level": "HIGH",
            "risk_score": 28,
            "risk_reason": "HA010 투약기준 미충족, B0030 횟수 초과",
            "ai_analyzed": True,
            "ai_analysis_result": {"issues": ["HA010 투약기준 미충족", "B0030 횟수 초과"], "suggestions": ["투약 기준 재확인", "처치 횟수 조정"]},
            "submitted_at": (datetime.utcnow() - timedelta(days=3)).isoformat(),
            "items": [],
        },
    ]
    return demo


def generate_demo_stats() -> dict:
    """데모 통계 KPI"""
    return {
        "pending_count": 3,
        "pending_amount": 136900,
        "total_claimed": 268900,
        "total_accepted": 215200,
        "rejected_amount": 23900,
        "rejection_rate": 8.9,
        "risk_count": 3,
        "acceptance_rate": 91.1,
        "total_claims": 9,
        "is_demo": True,
    }


# ============================================================
# Helpers
# ============================================================

def _generate_claim_number() -> str:
    now = datetime.utcnow()
    rand = random.randint(1000, 9999)
    return f"CLM-{now.year}-{rand:04d}"


def _claim_to_dict(claim: InsuranceClaim, include_items: bool = False) -> dict:
    result = {
        "id": str(claim.id),
        "claim_number": claim.claim_number,
        "claim_date": claim.claim_date.isoformat() if claim.claim_date else None,
        "service_date": claim.service_date.isoformat() if claim.service_date else None,
        "patient_chart_no": claim.patient_chart_no,
        "patient_name_masked": claim.patient_name_masked,
        "patient_age": claim.patient_age,
        "patient_gender": claim.patient_gender,
        "total_amount": claim.total_amount,
        "insurance_amount": claim.insurance_amount,
        "copay_amount": claim.copay_amount,
        "approved_amount": claim.approved_amount,
        "rejected_amount": claim.rejected_amount,
        "status": claim.status.value if claim.status else None,
        "risk_level": claim.risk_level.value if claim.risk_level else None,
        "risk_score": claim.risk_score,
        "risk_reason": claim.risk_reason,
        "ai_analyzed": claim.ai_analyzed,
        "ai_analysis_result": claim.ai_analysis_result,
        "submitted_at": claim.submitted_at.isoformat() if claim.submitted_at else None,
        "is_demo": False,
    }
    if include_items:
        result["items"] = [
            {
                "id": item.id,
                "item_type": item.item_type.value if item.item_type else None,
                "code": item.code,
                "name": item.name,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "total_price": item.total_price,
                "risk_level": item.risk_level.value if item.risk_level else None,
                "pass_rate": item.pass_rate,
                "ai_comment": item.ai_comment,
                "issues": item.issues or [],
            }
            for item in (claim.items or [])
        ]
    return result


# ============================================================
# Endpoints
# ============================================================

@router.get("/")
async def list_claims(
    status: Optional[str] = Query(None, description="콤마 구분: DRAFT,READY"),
    risk_level: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """보험청구 목록 조회"""
    query = select(InsuranceClaim).where(
        InsuranceClaim.user_id == current_user.id
    ).order_by(InsuranceClaim.claim_date.desc(), InsuranceClaim.created_at.desc())

    if status:
        statuses = [s.strip() for s in status.split(",")]
        query = query.where(InsuranceClaim.status.in_(statuses))

    if risk_level:
        query = query.where(InsuranceClaim.risk_level == risk_level)

    if date_from:
        query = query.where(InsuranceClaim.claim_date >= date_from)

    if date_to:
        query = query.where(InsuranceClaim.claim_date <= date_to)

    if search:
        query = query.where(
            or_(
                InsuranceClaim.patient_name_masked.ilike(f"%{search}%"),
                InsuranceClaim.patient_chart_no.ilike(f"%{search}%"),
                InsuranceClaim.claim_number.ilike(f"%{search}%"),
            )
        )

    result = await db.execute(query)
    claims = result.scalars().all()

    if not claims:
        return {"data": generate_demo_claims(), "is_demo": True}

    return {
        "data": [_claim_to_dict(c) for c in claims],
        "is_demo": False,
    }


@router.post("/")
async def create_claim(
    payload: ClaimCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """보험청구 생성"""
    claim = InsuranceClaim(
        user_id=current_user.id,
        claim_number=_generate_claim_number(),
        claim_date=payload.claim_date,
        service_date=payload.service_date,
        patient_chart_no=payload.patient_chart_no,
        patient_name_masked=payload.patient_name_masked,
        patient_age=payload.patient_age,
        patient_gender=payload.patient_gender,
        total_amount=payload.total_amount,
        insurance_amount=payload.insurance_amount,
        copay_amount=payload.copay_amount,
        status=ClaimStatus.DRAFT,
    )
    db.add(claim)
    await db.flush()

    # 항목 추가
    for item_data in payload.items:
        item = ClaimItem(
            claim_id=claim.id,
            item_type=ClaimItemType(item_data.item_type),
            code=item_data.code,
            name=item_data.name,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price,
            total_price=item_data.total_price,
            pass_rate=CODE_PASS_RATES.get(item_data.code, 90.0),
        )
        db.add(item)

    await db.flush()
    return {"id": str(claim.id), "claim_number": claim.claim_number, "status": "DRAFT"}


@router.get("/stats")
async def get_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """통계 KPI"""
    result = await db.execute(
        select(InsuranceClaim).where(InsuranceClaim.user_id == current_user.id)
    )
    claims = result.scalars().all()

    if not claims:
        return generate_demo_stats()

    pending = [c for c in claims if c.status in (ClaimStatus.DRAFT, ClaimStatus.READY)]
    resolved = [c for c in claims if c.status in (ClaimStatus.ACCEPTED, ClaimStatus.PARTIAL, ClaimStatus.REJECTED)]
    total_claimed = sum(c.total_amount for c in resolved)
    total_accepted = sum((c.approved_amount or 0) for c in resolved)
    rejected_amt = total_claimed - total_accepted

    return {
        "pending_count": len(pending),
        "pending_amount": sum(c.total_amount for c in pending),
        "total_claimed": total_claimed,
        "total_accepted": total_accepted,
        "rejected_amount": rejected_amt,
        "rejection_rate": round((rejected_amt / total_claimed * 100), 1) if total_claimed > 0 else 0,
        "risk_count": len([c for c in claims if c.risk_level != RiskLevel.LOW and c.status not in (ClaimStatus.ACCEPTED,)]),
        "acceptance_rate": round((total_accepted / total_claimed * 100), 1) if total_claimed > 0 else 0,
        "total_claims": len(claims),
        "is_demo": False,
    }


@router.get("/{claim_id}")
async def get_claim(
    claim_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """청구 상세 (items 포함)"""
    result = await db.execute(
        select(InsuranceClaim).where(
            and_(
                InsuranceClaim.id == claim_id,
                InsuranceClaim.user_id == current_user.id,
            )
        )
    )
    claim = result.scalar_one_or_none()
    if not claim:
        raise HTTPException(status_code=404, detail="청구를 찾을 수 없습니다")

    # Eagerly load items
    items_result = await db.execute(
        select(ClaimItem).where(ClaimItem.claim_id == claim.id)
    )
    claim.items = items_result.scalars().all()

    return _claim_to_dict(claim, include_items=True)


@router.put("/{claim_id}")
async def update_claim(
    claim_id: str,
    payload: ClaimUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """청구 수정"""
    result = await db.execute(
        select(InsuranceClaim).where(
            and_(
                InsuranceClaim.id == claim_id,
                InsuranceClaim.user_id == current_user.id,
            )
        )
    )
    claim = result.scalar_one_or_none()
    if not claim:
        raise HTTPException(status_code=404, detail="청구를 찾을 수 없습니다")

    if claim.status in (ClaimStatus.SUBMITTED, ClaimStatus.ACCEPTED):
        raise HTTPException(status_code=400, detail="전송 완료 또는 인정된 청구는 수정할 수 없습니다")

    for field, value in payload.dict(exclude_unset=True).items():
        if field == "status" and value:
            setattr(claim, field, ClaimStatus(value))
        elif value is not None:
            setattr(claim, field, value)

    claim.updated_at = datetime.utcnow()
    return {"id": str(claim.id), "status": claim.status.value}


@router.post("/{claim_id}/analyze")
async def analyze_claim(
    claim_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """AI 리스크 분석 실행"""
    result = await db.execute(
        select(InsuranceClaim).where(
            and_(
                InsuranceClaim.id == claim_id,
                InsuranceClaim.user_id == current_user.id,
            )
        )
    )
    claim = result.scalar_one_or_none()
    if not claim:
        raise HTTPException(status_code=404, detail="청구를 찾을 수 없습니다")

    # 항목에서 코드 추출
    items_result = await db.execute(
        select(ClaimItem).where(ClaimItem.claim_id == claim.id)
    )
    items = items_result.scalars().all()

    dx_codes = [i.code for i in items if i.item_type == ClaimItemType.DIAGNOSIS]
    tx_codes = [i.code for i in items if i.item_type in (ClaimItemType.TREATMENT, ClaimItemType.MEDICATION)]

    # 코드가 없으면 모든 코드를 tx로 처리 (간소화)
    if not dx_codes and not tx_codes:
        tx_codes = [i.code for i in items]

    analysis = analyze_claim_risk(dx_codes, tx_codes)

    # 항목별 통과율 업데이트
    for item in items:
        item.pass_rate = CODE_PASS_RATES.get(item.code, 90.0)
        if item.code in [p["tx"][0] for p in HIGH_RISK_PATTERNS if p["tx"]]:
            item.risk_level = RiskLevel.MEDIUM
        if item.pass_rate < 60:
            item.risk_level = RiskLevel.HIGH

    claim.risk_score = analysis["risk_score"]
    claim.risk_level = RiskLevel(analysis["risk_level"])
    claim.risk_reason = analysis["risk_reason"]
    claim.ai_analyzed = True
    claim.ai_analysis_result = {
        "issues": analysis["issues"],
        "suggestions": analysis["suggestions"],
    }
    claim.updated_at = datetime.utcnow()

    return {
        "claim_id": str(claim.id),
        "risk_score": analysis["risk_score"],
        "risk_level": analysis["risk_level"],
        "issues": analysis["issues"],
        "suggestions": analysis["suggestions"],
    }


@router.post("/batch-submit")
async def batch_submit(
    payload: BatchSubmitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """일괄 심평원 전송"""
    if not payload.claim_ids:
        raise HTTPException(status_code=400, detail="전송할 청구를 선택해주세요")

    # 배치 생성
    batch = ClaimBatch(
        user_id=current_user.id,
        batch_number=f"BAT-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}",
        submission_date=datetime.utcnow(),
        total_claims=len(payload.claim_ids),
        status="TRANSMITTED",
    )
    db.add(batch)
    await db.flush()

    total_amount = 0
    updated = 0

    for cid in payload.claim_ids:
        result = await db.execute(
            select(InsuranceClaim).where(
                and_(
                    InsuranceClaim.id == cid,
                    InsuranceClaim.user_id == current_user.id,
                    InsuranceClaim.status.in_([ClaimStatus.DRAFT, ClaimStatus.READY]),
                )
            )
        )
        claim = result.scalar_one_or_none()
        if claim:
            claim.status = ClaimStatus.SUBMITTED
            claim.submitted_at = datetime.utcnow()
            claim.batch_id = batch.id
            total_amount += claim.total_amount
            updated += 1

    batch.total_amount = total_amount
    batch.total_claims = updated

    return {
        "batch_number": batch.batch_number,
        "submitted_count": updated,
        "total_amount": total_amount,
    }
