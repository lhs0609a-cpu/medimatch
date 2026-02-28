"""
HIRA 코드 검색 엔드포인트 (자동완성)

- 수가코드 검색
- 상병코드 (KCD-7) 검색
- 약품코드 검색
- 진단+처치 조합 유효성 검사
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, or_
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import logging

from ..deps import get_db, get_current_active_user
from .service_guards import require_active_service
from ...models.user import User
from ...models.service_subscription import ServiceSubscription, ServiceType
from ...models.hira_code import HIRAFeeCode, HIRADiseaseCode, HIRADrugCode
from ...models.claims_ai import RejectionPattern

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================================
# Pydantic schemas
# ============================================================

class ValidateCombinationRequest(BaseModel):
    diagnosis_code: str
    treatment_codes: list[str]


# ============================================================
# Demo data (테이블 비어있을 때 사용)
# ============================================================

DEMO_FEE_CODES = [
    {"code": "AA157", "name": "초진 진찰료", "category": "진찰료", "unit_price": 18400, "insurance_type": "COVERED"},
    {"code": "AA258", "name": "재진 진찰료", "category": "진찰료", "unit_price": 12200, "insurance_type": "COVERED"},
    {"code": "B0010", "name": "기본 처치료", "category": "처치료", "unit_price": 26800, "insurance_type": "COVERED"},
    {"code": "B0020", "name": "물리치료-기본", "category": "물리치료", "unit_price": 15500, "insurance_type": "COVERED"},
    {"code": "B0030", "name": "물리치료-복합", "category": "물리치료", "unit_price": 28000, "insurance_type": "COVERED"},
    {"code": "C3811", "name": "흉부 CT", "category": "영상", "unit_price": 185000, "insurance_type": "SELECTIVE"},
    {"code": "C5211", "name": "복부 초음파", "category": "영상", "unit_price": 85000, "insurance_type": "COVERED"},
    {"code": "D2200", "name": "일반혈액검사(CBC)", "category": "검사", "unit_price": 24500, "insurance_type": "COVERED"},
    {"code": "D2240", "name": "당화혈색소(HbA1c)", "category": "검사", "unit_price": 24500, "insurance_type": "COVERED"},
    {"code": "D2711", "name": "갑상선기능검사(TSH+FT4)", "category": "검사", "unit_price": 32000, "insurance_type": "COVERED"},
    {"code": "E6541", "name": "흉부 X-ray", "category": "영상", "unit_price": 18500, "insurance_type": "COVERED"},
    {"code": "E7070", "name": "위내시경", "category": "내시경", "unit_price": 85000, "insurance_type": "SELECTIVE"},
    {"code": "EB411", "name": "갑상선 초음파", "category": "영상", "unit_price": 65000, "insurance_type": "SELECTIVE"},
    {"code": "F1010", "name": "처방료", "category": "처방료", "unit_price": 14400, "insurance_type": "COVERED"},
    {"code": "HA010", "name": "주사 처치료 (근육)", "category": "주사료", "unit_price": 35000, "insurance_type": "COVERED"},
    {"code": "HA011", "name": "간이 처치료", "category": "주사료", "unit_price": 22000, "insurance_type": "COVERED"},
    {"code": "J1201", "name": "원내 투약료", "category": "투약료", "unit_price": 8500, "insurance_type": "COVERED"},
    {"code": "MM041", "name": "도수치료-단순", "category": "물리치료", "unit_price": 35000, "insurance_type": "SELECTIVE"},
    {"code": "MM042", "name": "도수치료-복합", "category": "물리치료", "unit_price": 55000, "insurance_type": "SELECTIVE"},
    {"code": "N0031", "name": "봉합술-소", "category": "수술", "unit_price": 42000, "insurance_type": "COVERED"},
    {"code": "N0032", "name": "봉합술-중", "category": "수술", "unit_price": 78000, "insurance_type": "COVERED"},
    {"code": "L1510", "name": "기본 입원료", "category": "입원료", "unit_price": 65000, "insurance_type": "COVERED"},
]

DEMO_DISEASE_CODES = [
    {"code": "J06.9", "name_kr": "급성 상기도감염, 상세불명", "name_en": "Acute upper respiratory infection, unspecified", "chapter": "X", "is_chronic": False},
    {"code": "J18.9", "name_kr": "폐렴, 상세불명", "name_en": "Pneumonia, unspecified", "chapter": "X", "is_chronic": False},
    {"code": "J20.9", "name_kr": "급성 기관지염, 상세불명", "name_en": "Acute bronchitis, unspecified", "chapter": "X", "is_chronic": False},
    {"code": "J30.4", "name_kr": "알레르기성 비염, 상세불명", "name_en": "Allergic rhinitis, unspecified", "chapter": "X", "is_chronic": True},
    {"code": "J45.9", "name_kr": "천식, 상세불명", "name_en": "Asthma, unspecified", "chapter": "X", "is_chronic": True},
    {"code": "K21.0", "name_kr": "식도염을 동반한 위식도역류병", "name_en": "GERD with esophagitis", "chapter": "XI", "is_chronic": True},
    {"code": "K29.5", "name_kr": "만성 위염, 상세불명", "name_en": "Chronic gastritis, unspecified", "chapter": "XI", "is_chronic": True},
    {"code": "M54.5", "name_kr": "요통", "name_en": "Low back pain", "chapter": "XIII", "is_chronic": False},
    {"code": "M54.2", "name_kr": "경추통", "name_en": "Cervicalgia", "chapter": "XIII", "is_chronic": False},
    {"code": "M79.3", "name_kr": "지정되지 않은 지체의 연조직 장애", "name_en": "Panniculitis, unspecified", "chapter": "XIII", "is_chronic": False},
    {"code": "G43.9", "name_kr": "편두통, 상세불명", "name_en": "Migraine, unspecified", "chapter": "VI", "is_chronic": True},
    {"code": "G44.2", "name_kr": "긴장형 두통", "name_en": "Tension-type headache", "chapter": "VI", "is_chronic": False},
    {"code": "E11.9", "name_kr": "합병증이 없는 2형 당뇨병", "name_en": "Type 2 diabetes without complications", "chapter": "IV", "is_chronic": True},
    {"code": "E78.0", "name_kr": "순수 고콜레스테롤혈증", "name_en": "Pure hypercholesterolemia", "chapter": "IV", "is_chronic": True},
    {"code": "I10", "name_kr": "본태성(일차성) 고혈압", "name_en": "Essential hypertension", "chapter": "IX", "is_chronic": True},
    {"code": "I25.1", "name_kr": "죽상경화성 심장병", "name_en": "Atherosclerotic heart disease", "chapter": "IX", "is_chronic": True},
    {"code": "N39.0", "name_kr": "부위를 명시하지 않은 요로감염", "name_en": "Urinary tract infection, site not specified", "chapter": "XIV", "is_chronic": False},
    {"code": "L30.9", "name_kr": "피부염, 상세불명", "name_en": "Dermatitis, unspecified", "chapter": "XII", "is_chronic": False},
    {"code": "H10.0", "name_kr": "점액농성 결막염", "name_en": "Mucopurulent conjunctivitis", "chapter": "VII", "is_chronic": False},
    {"code": "R50.9", "name_kr": "원인 불명의 발열", "name_en": "Fever, unspecified", "chapter": "XVIII", "is_chronic": False},
]

DEMO_DRUG_CODES = [
    {"code": "648901070", "product_name": "타이레놀정 500mg", "ingredient_name": "아세트아미노펜", "manufacturer": "한국얀센", "insurance_price": 135, "is_narcotic": False},
    {"code": "670600100", "product_name": "록소닌정 60mg", "ingredient_name": "록소프로펜나트륨", "manufacturer": "제일약품", "insurance_price": 280, "is_narcotic": False},
    {"code": "645301350", "product_name": "아목시실린캡슐 500mg", "ingredient_name": "아목시실린", "manufacturer": "종근당", "insurance_price": 105, "is_narcotic": False, "is_antibiotic": True},
    {"code": "653601920", "product_name": "세파클러캡슐 250mg", "ingredient_name": "세파클러", "manufacturer": "유한양행", "insurance_price": 352, "is_narcotic": False, "is_antibiotic": True},
    {"code": "655500830", "product_name": "가스모틴정 5mg", "ingredient_name": "모사프리드", "manufacturer": "대웅제약", "insurance_price": 175, "is_narcotic": False},
    {"code": "664900010", "product_name": "넥시움정 20mg", "ingredient_name": "에소메프라졸", "manufacturer": "한국아스트라제네카", "insurance_price": 685, "is_narcotic": False},
    {"code": "642901880", "product_name": "뮤코스타정 100mg", "ingredient_name": "레바미피드", "manufacturer": "대웅제약", "insurance_price": 198, "is_narcotic": False},
    {"code": "671200160", "product_name": "리피토정 20mg", "ingredient_name": "아토르바스타틴", "manufacturer": "한국화이자", "insurance_price": 525, "is_narcotic": False},
    {"code": "655000380", "product_name": "노바스크정 5mg", "ingredient_name": "암로디핀", "manufacturer": "한국화이자", "insurance_price": 310, "is_narcotic": False},
    {"code": "650401070", "product_name": "자누비아정 100mg", "ingredient_name": "시타글립틴", "manufacturer": "한국엠에스디", "insurance_price": 1245, "is_narcotic": False},
    {"code": "643400690", "product_name": "지르텍정 10mg", "ingredient_name": "세티리진", "manufacturer": "한국유씨비", "insurance_price": 215, "is_narcotic": False},
    {"code": "657800100", "product_name": "뉴프렉스구강붕해정 10mg", "ingredient_name": "몬테루카스트", "manufacturer": "한국엠에스디", "insurance_price": 550, "is_narcotic": False},
    {"code": "671400390", "product_name": "메포민정 500mg", "ingredient_name": "메트포르민", "manufacturer": "명인제약", "insurance_price": 32, "is_narcotic": False},
    {"code": "653800570", "product_name": "코데스정", "ingredient_name": "디하이드로코데인", "manufacturer": "삼진제약", "insurance_price": 95, "is_narcotic": True},
    {"code": "645200100", "product_name": "클래리시드정 250mg", "ingredient_name": "클래리스로마이신", "manufacturer": "한국애브비", "insurance_price": 620, "is_narcotic": False, "is_antibiotic": True},
]

# 진단+처치 조합 검증 데이터
KNOWN_PROBLEMATIC_COMBINATIONS = [
    {"dx": "J06.9", "tx": "HA010", "rejection_rate": 27.5, "reason": "급성 상기도감염에 주사 처치 급여기준 미충족 빈번"},
    {"dx": "J06.9", "tx": "C3811", "rejection_rate": 45.2, "reason": "단순 감기에 흉부CT 과잉검사 판정 가능"},
    {"dx": "M54.5", "tx": "MM042", "rejection_rate": 12.3, "reason": "요통에 복합 도수치료 급여기준 미충족 빈번"},
    {"dx": "M54.5", "tx": "C3811", "rejection_rate": 8.7, "reason": "요통 초진에 CT 촬영 시 사유 필요"},
    {"dx": "G43.9", "tx": "B0030", "rejection_rate": 18.9, "reason": "편두통에 복합 물리치료 횟수 제한 초과 가능"},
    {"dx": "K21.0", "tx": "E7070", "rejection_rate": 5.2, "reason": "1년 이내 반복 내시경 시 급여 제한"},
    {"dx": "E11.9", "tx": "D2711", "rejection_rate": 3.1, "reason": "당뇨와 무관한 갑상선 검사 적합성 논란"},
    {"dx": "R50.9", "tx": "D2200", "rejection_rate": 1.5, "reason": "발열 시 CBC 검사는 일반적으로 인정"},
    {"dx": "J20.9", "tx": "E6541", "rejection_rate": 2.0, "reason": "기관지염 시 흉부X-ray는 일반적으로 인정"},
]


# ============================================================
# Endpoints
# ============================================================

@router.get("/fee")
async def search_fee_codes(
    q: str = Query(..., description="검색어 (코드 또는 명칭)"),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """수가코드 검색 (자동완성)"""
    result = await db.execute(
        select(HIRAFeeCode).where(
            and_(
                HIRAFeeCode.is_active == True,
                or_(
                    HIRAFeeCode.code.ilike(f"%{q}%"),
                    HIRAFeeCode.name.ilike(f"%{q}%"),
                ),
            )
        ).limit(limit)
    )
    codes = result.scalars().all()

    if not codes:
        # 데모 데이터 폴백
        q_lower = q.lower()
        matches = [
            c for c in DEMO_FEE_CODES
            if q_lower in c["code"].lower() or q_lower in c["name"].lower()
        ]
        if not matches:
            matches = DEMO_FEE_CODES[:limit]
        return {
            "data": matches[:limit],
            "total": len(matches[:limit]),
            "is_demo": True,
        }

    return {
        "data": [
            {
                "code": c.code,
                "name": c.name,
                "name_en": c.name_en,
                "category": c.category,
                "unit_price": c.unit_price,
                "insurance_type": c.insurance_type,
                "max_frequency": c.max_frequency,
                "frequency_period_days": c.frequency_period_days,
            }
            for c in codes
        ],
        "total": len(codes),
        "is_demo": False,
    }


@router.get("/disease")
async def search_disease_codes(
    q: str = Query(..., description="검색어 (코드 또는 한글 명칭)"),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """상병코드 검색 (KCD-7, 자동완성)"""
    result = await db.execute(
        select(HIRADiseaseCode).where(
            and_(
                HIRADiseaseCode.is_active == True,
                or_(
                    HIRADiseaseCode.code.ilike(f"%{q}%"),
                    HIRADiseaseCode.name_kr.ilike(f"%{q}%"),
                ),
            )
        ).limit(limit)
    )
    codes = result.scalars().all()

    if not codes:
        q_lower = q.lower()
        matches = [
            c for c in DEMO_DISEASE_CODES
            if q_lower in c["code"].lower() or q_lower in c["name_kr"]
        ]
        if not matches:
            matches = DEMO_DISEASE_CODES[:limit]
        return {
            "data": matches[:limit],
            "total": len(matches[:limit]),
            "is_demo": True,
        }

    return {
        "data": [
            {
                "code": c.code,
                "name_kr": c.name_kr,
                "name_en": c.name_en,
                "chapter": c.chapter,
                "is_chronic": c.is_chronic,
                "is_rare": c.is_rare,
                "common_procedures": c.common_procedures,
            }
            for c in codes
        ],
        "total": len(codes),
        "is_demo": False,
    }


@router.get("/drug")
async def search_drug_codes(
    q: str = Query(..., description="검색어 (코드 또는 약품명)"),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """약품코드 검색 (자동완성)"""
    result = await db.execute(
        select(HIRADrugCode).where(
            and_(
                HIRADrugCode.is_active == True,
                or_(
                    HIRADrugCode.code.ilike(f"%{q}%"),
                    HIRADrugCode.product_name.ilike(f"%{q}%"),
                    HIRADrugCode.ingredient_name.ilike(f"%{q}%"),
                ),
            )
        ).limit(limit)
    )
    codes = result.scalars().all()

    if not codes:
        q_lower = q.lower()
        matches = [
            c for c in DEMO_DRUG_CODES
            if q_lower in c["code"].lower()
            or q_lower in c["product_name"].lower()
            or q_lower in c["ingredient_name"].lower()
        ]
        if not matches:
            matches = DEMO_DRUG_CODES[:limit]
        return {
            "data": matches[:limit],
            "total": len(matches[:limit]),
            "is_demo": True,
        }

    return {
        "data": [
            {
                "code": c.code,
                "product_name": c.product_name,
                "ingredient_name": c.ingredient_name,
                "manufacturer": c.manufacturer,
                "insurance_price": c.insurance_price,
                "insurance_type": c.insurance_type,
                "is_narcotic": c.is_narcotic,
                "is_antibiotic": c.is_antibiotic,
                "requires_monitoring": c.requires_monitoring,
                "dosage_form": c.dosage_form,
            }
            for c in codes
        ],
        "total": len(codes),
        "is_demo": False,
    }


@router.post("/validate-combination")
async def validate_combination(
    payload: ValidateCombinationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """진단+처치 조합 유효성 검사"""
    if not payload.treatment_codes:
        raise HTTPException(status_code=400, detail="처치 코드를 입력해주세요")

    # DB rejection_patterns 조회
    patterns_result = await db.execute(
        select(RejectionPattern).where(
            and_(
                RejectionPattern.diagnosis_code == payload.diagnosis_code,
                RejectionPattern.treatment_code.in_(payload.treatment_codes),
            )
        )
    )
    db_patterns = patterns_result.scalars().all()

    warnings = []
    overall_valid = True

    if db_patterns:
        for p in db_patterns:
            w = {
                "diagnosis_code": p.diagnosis_code,
                "treatment_code": p.treatment_code,
                "rejection_rate": p.rejection_rate,
                "total_claims": p.total_claims,
                "rejected_claims": p.rejected_claims,
                "common_reasons": p.common_reasons or [],
            }
            if p.rejection_rate > 10:
                w["severity"] = "HIGH"
                overall_valid = False
            elif p.rejection_rate > 5:
                w["severity"] = "MEDIUM"
            else:
                w["severity"] = "LOW"
            warnings.append(w)
        is_demo = False
    else:
        # 데모 데이터 폴백
        for combo in KNOWN_PROBLEMATIC_COMBINATIONS:
            if combo["dx"] == payload.diagnosis_code and combo["tx"] in payload.treatment_codes:
                severity = "HIGH" if combo["rejection_rate"] > 10 else "MEDIUM" if combo["rejection_rate"] > 5 else "LOW"
                if combo["rejection_rate"] > 10:
                    overall_valid = False
                warnings.append({
                    "diagnosis_code": combo["dx"],
                    "treatment_code": combo["tx"],
                    "rejection_rate": combo["rejection_rate"],
                    "reason": combo["reason"],
                    "severity": severity,
                })
        is_demo = True

    # 검증된 조합에 없는 코드 = 일반적으로 안전
    checked_tx = {w.get("treatment_code") for w in warnings}
    safe_codes = [c for c in payload.treatment_codes if c not in checked_tx]

    return {
        "diagnosis_code": payload.diagnosis_code,
        "treatment_codes": payload.treatment_codes,
        "overall_valid": overall_valid,
        "warning_count": len(warnings),
        "warnings": warnings,
        "safe_codes": safe_codes,
        "is_demo": is_demo,
    }
