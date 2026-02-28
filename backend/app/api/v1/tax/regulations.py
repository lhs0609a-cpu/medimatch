"""
세법 규정 레퍼런스 API

- 세법 규정 목록/검색
- 카테고리별 규정 조회
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from typing import Optional
import logging

from ...deps import get_db, get_current_active_user
from ..service_guards import require_active_service
from ....models.user import User
from ....models.service_subscription import ServiceSubscription, ServiceType
from ....models.tax_regulation import TaxRegulationReference

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================================
# Demo data
# ============================================================

DEMO_REGULATIONS = [
    {
        "id": 1,
        "law_name": "소득세법",
        "article": "제33조",
        "paragraph": "제1항",
        "deduction_category": "EQUIPMENT_DEPRECIATION",
        "title": "고정자산의 감가상각비",
        "description": "사업용 고정자산에 대한 감가상각비를 필요경비에 산입할 수 있다. 정액법, 정률법, 생산량비례법 중 선택 가능.",
        "deduction_limit": None,
        "deduction_rate": None,
        "eligibility_criteria": [
            {"condition": "사업용 고정자산", "type": "asset_type"},
            {"condition": "내용연수에 따른 상각", "type": "depreciation_rule"},
        ],
        "required_documents": ["감가상각명세서", "자산취득 영수증"],
        "is_active": True,
        "is_demo": True,
    },
    {
        "id": 2,
        "law_name": "조세특례제한법",
        "article": "제29조의7",
        "paragraph": "제1항",
        "deduction_category": "EMPLOYMENT_TAX_CREDIT",
        "title": "고용증대 세액공제",
        "description": "상시근로자 수가 전년 대비 증가한 경우 1인당 최대 1,100만원 세액공제. 수도권 내 중소기업 700만원, 수도권 외 770만원.",
        "deduction_limit": 11_000_000,
        "deduction_rate": None,
        "eligibility_criteria": [
            {"condition": "상시근로자 증가", "type": "employment_growth"},
            {"condition": "중소기업", "type": "business_size"},
        ],
        "required_documents": ["근로계약서", "4대보험 가입증명서", "급여대장"],
        "is_active": True,
        "is_demo": True,
    },
    {
        "id": 3,
        "law_name": "소득세법",
        "article": "제59조의4",
        "paragraph": "제2항",
        "deduction_category": "MEDICAL_EXPENSE",
        "title": "의료비 세액공제",
        "description": "총급여액의 3%를 초과하는 의료비의 15% 세액공제. 난임시술비 30%, 미숙아/선천성이상아 20%.",
        "deduction_limit": 7_000_000,
        "deduction_rate": 0.15,
        "eligibility_criteria": [
            {"condition": "총급여액 3% 초과분", "type": "threshold"},
            {"condition": "본인/부양가족 의료비", "type": "eligible_expense"},
        ],
        "required_documents": ["의료비 영수증", "본인부담금 납입확인서"],
        "is_active": True,
        "is_demo": True,
    },
    {
        "id": 4,
        "law_name": "소득세법",
        "article": "제59조의3",
        "paragraph": "제1항",
        "deduction_category": "RETIREMENT",
        "title": "퇴직연금 세액공제",
        "description": "퇴직연금(DC/IRP) 추가 납입액의 12~15% 세액공제. 총급여 5,500만원 이하 15%, 초과 12%.",
        "deduction_limit": 7_000_000,
        "deduction_rate": 0.12,
        "eligibility_criteria": [
            {"condition": "퇴직연금 납입", "type": "contribution"},
            {"condition": "연 700만원 한도", "type": "annual_limit"},
        ],
        "required_documents": ["퇴직연금 납입확인서"],
        "is_active": True,
        "is_demo": True,
    },
    {
        "id": 5,
        "law_name": "조세특례제한법",
        "article": "제10조",
        "paragraph": "제1항",
        "deduction_category": "RND_TAX_CREDIT",
        "title": "연구개발비 세액공제",
        "description": "연구/인력개발비의 25~50% 세액공제. 중소기업 신성장/원천기술 30~40%, 일반기술 25%.",
        "deduction_limit": None,
        "deduction_rate": 0.25,
        "eligibility_criteria": [
            {"condition": "연구전담부서 또는 연구소 설치", "type": "rd_facility"},
            {"condition": "중소기업", "type": "business_size"},
        ],
        "required_documents": ["연구개발 활동 보고서", "연구소 인정서", "연구비 지출 증빙"],
        "is_active": True,
        "is_demo": True,
    },
    {
        "id": 6,
        "law_name": "소득세법",
        "article": "제70조의2",
        "paragraph": None,
        "deduction_category": "FAITHFUL_FILING",
        "title": "성실신고 확인비용 세액공제",
        "description": "성실신고 확인 비용의 60% 세액공제 (120만원 한도).",
        "deduction_limit": 1_200_000,
        "deduction_rate": 0.60,
        "eligibility_criteria": [
            {"condition": "성실신고 확인 대상자", "type": "filing_obligation"},
        ],
        "required_documents": ["세무사 수수료 영수증", "성실신고 확인서"],
        "is_active": True,
        "is_demo": True,
    },
    {
        "id": 7,
        "law_name": "조세특례제한법",
        "article": "제24조",
        "paragraph": "제1항",
        "deduction_category": "FACILITY_INVESTMENT",
        "title": "통합투자 세액공제",
        "description": "사업용 유형자산 투자액의 3~12% 세액공제. 기본공제 10% + 증가분 추가공제 3%.",
        "deduction_limit": None,
        "deduction_rate": 0.10,
        "eligibility_criteria": [
            {"condition": "사업용 유형자산 투자", "type": "investment_type"},
            {"condition": "중소기업", "type": "business_size"},
        ],
        "required_documents": ["투자 영수증", "자산 취득 내역서"],
        "is_active": True,
        "is_demo": True,
    },
    {
        "id": 8,
        "law_name": "조세특례제한법",
        "article": "제30조",
        "paragraph": "제1항",
        "deduction_category": "YOUTH_EMPLOYMENT",
        "title": "청년 정규직 고용 세액공제",
        "description": "만 15~34세 청년 정규직 고용시 1인당 최대 1,100만원 세액공제. 3년간 적용.",
        "deduction_limit": 11_000_000,
        "deduction_rate": None,
        "eligibility_criteria": [
            {"condition": "만 15~34세 청년 고용", "type": "age_limit"},
            {"condition": "정규직 전환 또는 신규 채용", "type": "employment_type"},
        ],
        "required_documents": ["근로계약서", "주민등록등본", "4대보험 가입증명서"],
        "is_active": True,
        "is_demo": True,
    },
    {
        "id": 9,
        "law_name": "소득세법 시행령",
        "article": "제78조의3",
        "paragraph": None,
        "deduction_category": "VEHICLE_EXPENSE",
        "title": "업무용 승용차 관련비용",
        "description": "업무용 승용차 관련 비용 (감가상각비, 유류비, 보험료, 수리비 등). 연 1,500만원 한도 (전액 업무 사용시).",
        "deduction_limit": 15_000_000,
        "deduction_rate": None,
        "eligibility_criteria": [
            {"condition": "업무용 승용차 등록", "type": "vehicle_registration"},
            {"condition": "운행일지 작성", "type": "usage_log"},
        ],
        "required_documents": ["차량 등록증", "운행일지", "유류비 영수증", "보험 증서"],
        "is_active": True,
        "is_demo": True,
    },
    {
        "id": 10,
        "law_name": "소득세법",
        "article": "제59조의4",
        "paragraph": "제3항",
        "deduction_category": "EDUCATION",
        "title": "교육비 세액공제",
        "description": "본인 교육비 전액, 자녀 교육비 15% 세액공제. 대학생 연 900만원 한도.",
        "deduction_limit": 9_000_000,
        "deduction_rate": 0.15,
        "eligibility_criteria": [
            {"condition": "본인 또는 부양가족 교육비", "type": "eligible_expense"},
        ],
        "required_documents": ["교육비 납입 증명서", "수료증"],
        "is_active": True,
        "is_demo": True,
    },
]


def _regulation_to_dict(reg: TaxRegulationReference) -> dict:
    return {
        "id": reg.id,
        "law_name": reg.law_name,
        "article": reg.article,
        "paragraph": reg.paragraph,
        "sub_paragraph": reg.sub_paragraph,
        "deduction_category": reg.deduction_category,
        "title": reg.title,
        "description": reg.description,
        "deduction_limit": reg.deduction_limit,
        "deduction_rate": reg.deduction_rate,
        "eligibility_criteria": reg.eligibility_criteria,
        "required_documents": reg.required_documents,
        "applicable_specialties": reg.applicable_specialties,
        "applicable_business_types": reg.applicable_business_types,
        "effective_from": reg.effective_from.isoformat() if reg.effective_from else None,
        "effective_to": reg.effective_to.isoformat() if reg.effective_to else None,
        "is_active": reg.is_active,
        "source_url": reg.source_url,
        "notes": reg.notes,
        "is_demo": False,
    }


# ============================================================
# Endpoints
# ============================================================

@router.get("/")
async def list_regulations(
    category: Optional[str] = Query(None, description="공제 카테고리"),
    active: Optional[bool] = Query(None, description="활성 여부"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """세법 규정 목록"""
    query = select(TaxRegulationReference).order_by(TaxRegulationReference.law_name, TaxRegulationReference.article)

    if category:
        query = query.where(TaxRegulationReference.deduction_category == category)
    if active is not None:
        query = query.where(TaxRegulationReference.is_active == active)

    result = await db.execute(query)
    regulations = result.scalars().all()

    if not regulations:
        data = DEMO_REGULATIONS
        if category:
            data = [r for r in data if r["deduction_category"] == category]
        if active is not None:
            data = [r for r in data if r["is_active"] == active]
        return {"data": data, "is_demo": True}

    return {"data": [_regulation_to_dict(r) for r in regulations], "is_demo": False}


@router.get("/search")
async def search_regulations(
    q: str = Query(..., description="검색어 (예: 감가상각, 고용증대)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """세법 규정 검색"""
    result = await db.execute(
        select(TaxRegulationReference).where(
            or_(
                TaxRegulationReference.title.ilike(f"%{q}%"),
                TaxRegulationReference.description.ilike(f"%{q}%"),
                TaxRegulationReference.law_name.ilike(f"%{q}%"),
                TaxRegulationReference.deduction_category.ilike(f"%{q}%"),
            )
        ).order_by(TaxRegulationReference.law_name)
    )
    regulations = result.scalars().all()

    if not regulations:
        # 데모 데이터 검색
        q_lower = q.lower()
        matched = [
            r for r in DEMO_REGULATIONS
            if q_lower in (r.get("title", "") or "").lower()
            or q_lower in (r.get("description", "") or "").lower()
            or q_lower in (r.get("law_name", "") or "").lower()
            or q_lower in (r.get("deduction_category", "") or "").lower()
        ]
        return {"data": matched, "query": q, "total": len(matched), "is_demo": True}

    return {
        "data": [_regulation_to_dict(r) for r in regulations],
        "query": q,
        "total": len(regulations),
        "is_demo": False,
    }


@router.get("/category/{category}")
async def get_regulations_by_category(
    category: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """카테고리별 세법 규정"""
    result = await db.execute(
        select(TaxRegulationReference).where(
            and_(
                TaxRegulationReference.deduction_category == category,
                TaxRegulationReference.is_active == True,
            )
        ).order_by(TaxRegulationReference.law_name)
    )
    regulations = result.scalars().all()

    if not regulations:
        matched = [r for r in DEMO_REGULATIONS if r["deduction_category"] == category]
        if not matched:
            return {"data": [], "category": category, "total": 0, "is_demo": True}
        return {"data": matched, "category": category, "total": len(matched), "is_demo": True}

    return {
        "data": [_regulation_to_dict(r) for r in regulations],
        "category": category,
        "total": len(regulations),
        "is_demo": False,
    }


@router.get("/{regulation_id}")
async def get_regulation(
    regulation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """세법 규정 상세"""
    result = await db.execute(
        select(TaxRegulationReference).where(TaxRegulationReference.id == regulation_id)
    )
    regulation = result.scalar_one_or_none()

    if not regulation:
        # 데모 데이터에서 찾기
        demo_match = next((r for r in DEMO_REGULATIONS if r["id"] == regulation_id), None)
        if demo_match:
            return demo_match
        raise HTTPException(status_code=404, detail="세법 규정을 찾을 수 없습니다")

    return _regulation_to_dict(regulation)
