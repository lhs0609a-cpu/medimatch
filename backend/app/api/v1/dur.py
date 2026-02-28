"""
DUR (Drug Utilization Review) 약물 안전성 엔드포인트

- 실시간 단일 처방 DUR 체크
- 청구 내 전체 약물 배치 DUR 체크
- 약물 상호작용 조회
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
from ...models.insurance_claim import InsuranceClaim, ClaimItem, ClaimItemType
from ...models.dur_check import (
    DURCheckLog, DrugInteraction,
    DURSeverity, DURCheckType, InteractionType,
)

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================================
# Pydantic schemas
# ============================================================

class DURCheckRequest(BaseModel):
    drug_codes: list[str]
    disease_codes: list[str] = []
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None


class BatchDURRequest(BaseModel):
    claim_id: str


# ============================================================
# Demo / hardcoded rules
# ============================================================

# 데모 약물 상호작용 데이터
DEMO_INTERACTIONS = [
    {
        "drug_code_a": "WARF001",
        "drug_code_b": "ASPR001",
        "interaction_type": "MAJOR",
        "severity": "CRITICAL",
        "description": "와파린(Warfarin)과 아스피린(Aspirin) 병용 시 출혈 위험 증가",
        "mechanism": "혈소판 기능 억제와 항응고 작용 중복",
        "clinical_effect": "중대 출혈, 소화관 출혈 위험 3배 이상 증가",
        "management": "가능하면 병용 회피. 불가피할 경우 INR 모니터링 강화 및 위장관 보호제 투여",
    },
    {
        "drug_code_a": "METO001",
        "drug_code_b": "VERA001",
        "interaction_type": "CONTRAINDICATED",
        "severity": "CONTRAINDICATED",
        "description": "메토프롤롤(Metoprolol)과 베라파밀(Verapamil) 병용 금기",
        "mechanism": "이중 AV전도 억제: 심각한 서맥 및 심차단 유발",
        "clinical_effect": "서맥, 심차단, 심부전 악화",
        "management": "절대 병용 금기. 대체 약물 선택 필요",
    },
    {
        "drug_code_a": "CIPR001",
        "drug_code_b": "THEO001",
        "interaction_type": "MAJOR",
        "severity": "WARNING",
        "description": "시프로플록사신(Ciprofloxacin)과 테오필린(Theophylline) 병용 주의",
        "mechanism": "CYP1A2 억제에 의한 테오필린 혈중 농도 상승",
        "clinical_effect": "테오필린 독성 (구역, 구토, 경련, 부정맥)",
        "management": "테오필린 용량 50% 감량 또는 대체 항균제 사용",
    },
    {
        "drug_code_a": "KETO001",
        "drug_code_b": "STAT001",
        "interaction_type": "MAJOR",
        "severity": "CRITICAL",
        "description": "케토코나졸(Ketoconazole)과 심바스타틴(Simvastatin) 병용 금기",
        "mechanism": "CYP3A4 억제에 의한 스타틴 혈중 농도 현저히 상승",
        "clinical_effect": "횡문근 융해증 위험 현저히 증가",
        "management": "절대 병용 금기. 대체 항진균제 또는 대체 스타틴 선택",
    },
    {
        "drug_code_a": "SSRI001",
        "drug_code_b": "MAOI001",
        "interaction_type": "CONTRAINDICATED",
        "severity": "CONTRAINDICATED",
        "description": "SSRI와 MAO 억제제 병용 절대 금기",
        "mechanism": "세로토닌 과잉 축적",
        "clinical_effect": "세로토닌 증후군 (고열, 경련, 사망 가능)",
        "management": "절대 병용 금기. 최소 14일 세척 기간 필요",
    },
]

# 연령 금기 규칙
AGE_CONTRAINDICATIONS = [
    {"drug_pattern": "ASPR", "min_age": None, "max_age": 18, "severity": "CRITICAL", "reason": "18세 미만 아스피린 투여 시 라이 증후군 위험"},
    {"drug_pattern": "TETR", "min_age": None, "max_age": 8, "severity": "WARNING", "reason": "8세 미만 테트라사이클린 투여 시 치아 착색 및 골 성장 억제"},
    {"drug_pattern": "FLUO", "min_age": None, "max_age": 18, "severity": "WARNING", "reason": "18세 미만 플루오로퀴놀론 투여 시 연골 손상 가능"},
    {"drug_pattern": "METP", "min_age": 65, "max_age": None, "severity": "WARNING", "reason": "65세 이상 메트포르민 투여 시 신기능 평가 필요 (젖산산증 위험)"},
]

# 중복 처방 규칙 (성분군)
DUPLICATE_GROUPS = {
    "NSAID": ["IBUP001", "NAPR001", "DICL001", "MELO001", "CELE001"],
    "PPI": ["OMEP001", "LANS001", "RABE001", "ESOP001", "PANT001"],
    "STATIN": ["STAT001", "ATOR001", "ROSA001", "PITA001"],
    "ACEi": ["ENAL001", "RAMI001", "LISP001", "PERI001"],
    "ARB": ["LOSA001", "VALS001", "CAND001", "IRBE001", "TELE001"],
}


def _check_drug_interactions(drug_codes: list[str], interactions: list) -> list[dict]:
    """약물 상호작용 확인"""
    warnings = []
    for i in range(len(drug_codes)):
        for j in range(i + 1, len(drug_codes)):
            code_a = drug_codes[i]
            code_b = drug_codes[j]
            for interaction in interactions:
                a = interaction.get("drug_code_a") if isinstance(interaction, dict) else interaction.drug_code_a
                b = interaction.get("drug_code_b") if isinstance(interaction, dict) else interaction.drug_code_b
                sev = interaction.get("severity") if isinstance(interaction, dict) else interaction.severity.value
                desc = interaction.get("description") if isinstance(interaction, dict) else interaction.description
                mgmt = interaction.get("management") if isinstance(interaction, dict) else interaction.management

                if (code_a == a and code_b == b) or (code_a == b and code_b == a):
                    warnings.append({
                        "check_type": "DRUG_DRUG",
                        "severity": sev,
                        "drug_codes": [code_a, code_b],
                        "message": desc,
                        "management": mgmt,
                    })
    return warnings


def _check_age_contraindications(drug_codes: list[str], patient_age: Optional[int]) -> list[dict]:
    """연령 금기 확인"""
    if patient_age is None:
        return []
    warnings = []
    for rule in AGE_CONTRAINDICATIONS:
        for code in drug_codes:
            if code.startswith(rule["drug_pattern"]):
                if rule["max_age"] is not None and patient_age <= rule["max_age"]:
                    warnings.append({
                        "check_type": "DRUG_AGE",
                        "severity": rule["severity"],
                        "drug_codes": [code],
                        "message": rule["reason"],
                        "patient_age": patient_age,
                    })
                if rule["min_age"] is not None and patient_age >= rule["min_age"]:
                    warnings.append({
                        "check_type": "DRUG_AGE",
                        "severity": rule["severity"],
                        "drug_codes": [code],
                        "message": rule["reason"],
                        "patient_age": patient_age,
                    })
    return warnings


def _check_duplicates(drug_codes: list[str]) -> list[dict]:
    """중복 처방 확인"""
    warnings = []
    for group_name, group_codes in DUPLICATE_GROUPS.items():
        found = [c for c in drug_codes if c in group_codes]
        if len(found) >= 2:
            warnings.append({
                "check_type": "DUPLICATE",
                "severity": "WARNING",
                "drug_codes": found,
                "message": f"{group_name} 계열 중복 처방 ({len(found)}종): {', '.join(found)}",
            })
    return warnings


# ============================================================
# Endpoints
# ============================================================

@router.post("/check")
async def dur_check_single(
    payload: DURCheckRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """실시간 DUR 체크 (단일 처방)"""
    if not payload.drug_codes:
        raise HTTPException(status_code=400, detail="약물 코드를 입력해주세요")

    all_warnings = []

    # 1. DB에서 약물 상호작용 조회
    interactions_result = await db.execute(
        select(DrugInteraction).where(
            or_(
                DrugInteraction.drug_code_a.in_(payload.drug_codes),
                DrugInteraction.drug_code_b.in_(payload.drug_codes),
            )
        )
    )
    db_interactions = interactions_result.scalars().all()

    if db_interactions:
        # DB 데이터 사용
        interaction_data = [
            {
                "drug_code_a": i.drug_code_a,
                "drug_code_b": i.drug_code_b,
                "severity": i.severity.value,
                "description": i.description,
                "management": i.management,
            }
            for i in db_interactions
        ]
    else:
        # 데모 데이터 폴백
        interaction_data = DEMO_INTERACTIONS

    # 2. 약물 상호작용 확인
    all_warnings.extend(_check_drug_interactions(payload.drug_codes, interaction_data))

    # 3. 연령 금기 확인
    all_warnings.extend(_check_age_contraindications(payload.drug_codes, payload.patient_age))

    # 4. 중복 처방 확인
    all_warnings.extend(_check_duplicates(payload.drug_codes))

    # DUR 로그 저장
    for warning in all_warnings:
        dur_log = DURCheckLog(
            user_id=current_user.id,
            check_type=DURCheckType(warning["check_type"]),
            drug_codes=warning.get("drug_codes", []),
            disease_codes=payload.disease_codes,
            severity=DURSeverity(warning["severity"]),
            message=warning["message"],
            detail=warning,
            patient_age=payload.patient_age,
            patient_gender=payload.patient_gender,
        )
        db.add(dur_log)

    # 전체 심각도 판정
    if any(w["severity"] == "CONTRAINDICATED" for w in all_warnings):
        overall_severity = "CONTRAINDICATED"
    elif any(w["severity"] == "CRITICAL" for w in all_warnings):
        overall_severity = "CRITICAL"
    elif any(w["severity"] == "WARNING" for w in all_warnings):
        overall_severity = "WARNING"
    elif all_warnings:
        overall_severity = "INFO"
    else:
        overall_severity = "PASS"

    return {
        "overall_result": overall_severity,
        "warning_count": len(all_warnings),
        "warnings": all_warnings,
        "checked_drugs": payload.drug_codes,
        "checked_diseases": payload.disease_codes,
        "patient_age": payload.patient_age,
        "patient_gender": payload.patient_gender,
        "is_demo": len(db_interactions) == 0,
    }


@router.post("/batch-check")
async def dur_batch_check(
    payload: BatchDURRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """청구 내 전체 약물 배치 DUR 체크"""
    # 청구 확인
    claim_result = await db.execute(
        select(InsuranceClaim).where(
            and_(
                InsuranceClaim.id == payload.claim_id,
                InsuranceClaim.user_id == current_user.id,
            )
        )
    )
    claim = claim_result.scalar_one_or_none()
    if not claim:
        raise HTTPException(status_code=404, detail="청구를 찾을 수 없습니다")

    # 항목에서 약물 코드 추출
    items_result = await db.execute(
        select(ClaimItem).where(ClaimItem.claim_id == claim.id)
    )
    items = items_result.scalars().all()

    drug_codes = [
        i.code for i in items
        if i.item_type in (ClaimItemType.MEDICATION, ClaimItemType.INJECTION)
    ]

    if not drug_codes:
        # 약물 항목이 없으면 모든 항목 코드로 체크
        drug_codes = [i.code for i in items]

    all_warnings = []

    # DB 약물 상호작용 조회
    interactions_result = await db.execute(
        select(DrugInteraction).where(
            or_(
                DrugInteraction.drug_code_a.in_(drug_codes),
                DrugInteraction.drug_code_b.in_(drug_codes),
            )
        )
    )
    db_interactions = interactions_result.scalars().all()

    if db_interactions:
        interaction_data = [
            {
                "drug_code_a": i.drug_code_a,
                "drug_code_b": i.drug_code_b,
                "severity": i.severity.value,
                "description": i.description,
                "management": i.management,
            }
            for i in db_interactions
        ]
    else:
        interaction_data = DEMO_INTERACTIONS

    all_warnings.extend(_check_drug_interactions(drug_codes, interaction_data))
    all_warnings.extend(_check_age_contraindications(drug_codes, claim.patient_age))
    all_warnings.extend(_check_duplicates(drug_codes))

    # 청구 항목에 DUR 결과 반영
    for item in items:
        item_warnings = [w for w in all_warnings if item.code in w.get("drug_codes", [])]
        if item_warnings:
            worst = max(item_warnings, key=lambda w: ["INFO", "WARNING", "CRITICAL", "CONTRAINDICATED"].index(w["severity"]))
            item.dur_checked = True
            item.dur_result = worst["severity"]
            item.dur_warnings = item_warnings
        else:
            item.dur_checked = True
            item.dur_result = "PASS"
            item.dur_warnings = []

    # DUR 로그 저장
    for warning in all_warnings:
        dur_log = DURCheckLog(
            claim_id=claim.id,
            user_id=current_user.id,
            check_type=DURCheckType(warning["check_type"]),
            drug_codes=warning.get("drug_codes", []),
            disease_codes=[claim.primary_dx_code] if claim.primary_dx_code else [],
            severity=DURSeverity(warning["severity"]),
            message=warning["message"],
            detail=warning,
            patient_age=claim.patient_age,
            patient_gender=claim.patient_gender,
        )
        db.add(dur_log)

    overall_severity = "PASS"
    if any(w["severity"] == "CONTRAINDICATED" for w in all_warnings):
        overall_severity = "CONTRAINDICATED"
    elif any(w["severity"] == "CRITICAL" for w in all_warnings):
        overall_severity = "CRITICAL"
    elif any(w["severity"] == "WARNING" for w in all_warnings):
        overall_severity = "WARNING"
    elif all_warnings:
        overall_severity = "INFO"

    return {
        "claim_id": str(claim.id),
        "claim_number": claim.claim_number,
        "overall_result": overall_severity,
        "warning_count": len(all_warnings),
        "warnings": all_warnings,
        "checked_drugs": drug_codes,
        "item_count": len(items),
        "is_demo": len(db_interactions) == 0,
    }


@router.get("/interactions")
async def get_drug_interactions(
    drug_code: str = Query(..., description="약물 코드"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """약물 상호작용 조회"""
    result = await db.execute(
        select(DrugInteraction).where(
            or_(
                DrugInteraction.drug_code_a == drug_code,
                DrugInteraction.drug_code_b == drug_code,
            )
        )
    )
    interactions = result.scalars().all()

    if not interactions:
        # 데모 데이터 폴백
        demo_matches = [
            d for d in DEMO_INTERACTIONS
            if d["drug_code_a"] == drug_code or d["drug_code_b"] == drug_code
        ]
        if not demo_matches:
            # drug_code 패턴 매칭
            demo_matches = [
                d for d in DEMO_INTERACTIONS
                if drug_code[:4] in d["drug_code_a"] or drug_code[:4] in d["drug_code_b"]
            ]
        if not demo_matches:
            demo_matches = DEMO_INTERACTIONS[:3]

        return {
            "drug_code": drug_code,
            "interactions": demo_matches,
            "total": len(demo_matches),
            "is_demo": True,
        }

    return {
        "drug_code": drug_code,
        "interactions": [
            {
                "drug_code_a": i.drug_code_a,
                "drug_code_b": i.drug_code_b,
                "interaction_type": i.interaction_type.value,
                "severity": i.severity.value,
                "description": i.description,
                "mechanism": i.mechanism,
                "clinical_effect": i.clinical_effect,
                "management": i.management,
                "reference_source": i.reference_source,
            }
            for i in interactions
        ],
        "total": len(interactions),
        "is_demo": False,
    }
