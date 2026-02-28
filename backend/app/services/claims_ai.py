"""
보험청구 AI 분석 파이프라인

5단계:
1. 코드 검증 — HIRA 레지스트리 대비 유효성 확인
2. 규정 룰 엔진 — 빈도 한도, 수량 한도, 보험적용 여부
3. 통계 모델 — rejection_patterns 기반 pass probability
4. 문서 적정성 — 차트 기록 누락 체크
5. 최적화 — 대체 코드 제안, 수익 영향 계산
"""
import logging
import time
from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

logger = logging.getLogger(__name__)


# Stage 1: Code Validation
async def validate_codes(db: AsyncSession, claim_items: list) -> dict:
    """HIRA 코드 레지스트리에서 유효성 확인"""
    from app.models.hira_code import HIRAFeeCode, HIRADiseaseCode, HIRADrugCode

    results = []
    for item in claim_items:
        # Check if code exists in HIRA registry
        fee_result = await db.execute(
            select(HIRAFeeCode).where(
                and_(HIRAFeeCode.code == item.code, HIRAFeeCode.is_active == True)
            )
        )
        fee_code = fee_result.scalar_one_or_none()
        results.append({
            "code": item.code,
            "valid": fee_code is not None,
            "insurance_type": fee_code.insurance_type if fee_code else None,
            "unit_price_match": (fee_code.unit_price == item.unit_price) if fee_code else None,
        })
    return {"stage": "code_validation", "results": results, "passed": all(r["valid"] for r in results)}


# Stage 2: Rule Engine
async def apply_rules(db: AsyncSession, claim_items: list, patient_info: dict) -> dict:
    """빈도 한도, 수량 한도, 보험적용 여부 체크"""
    from app.models.hira_code import HIRAFeeCode

    warnings = []
    for item in claim_items:
        fee_result = await db.execute(
            select(HIRAFeeCode).where(HIRAFeeCode.code == item.code)
        )
        fee_code = fee_result.scalar_one_or_none()
        if fee_code:
            if fee_code.max_frequency and hasattr(item, 'frequency_count') and item.frequency_count:
                if item.frequency_count >= fee_code.max_frequency:
                    warnings.append({
                        "code": item.code,
                        "rule": "FREQUENCY_EXCEEDED",
                        "detail": f"빈도 한도 초과 ({item.frequency_count}/{fee_code.max_frequency})",
                    })
            if fee_code.max_quantity and item.quantity > fee_code.max_quantity:
                warnings.append({
                    "code": item.code,
                    "rule": "QUANTITY_EXCEEDED",
                    "detail": f"수량 한도 초과 ({item.quantity}/{fee_code.max_quantity})",
                })
            if fee_code.insurance_type == "NON_COVERED":
                warnings.append({
                    "code": item.code,
                    "rule": "NON_COVERED",
                    "detail": "비급여 항목",
                })
    return {"stage": "rule_engine", "warnings": warnings, "passed": len(warnings) == 0}


# Stage 3: Statistical Model
async def calculate_pass_probability(
    db: AsyncSession, specialty_code: str, dx_codes: list, tx_codes: list,
) -> dict:
    """rejection_patterns 테이블 기반 통과 확률 계산"""
    from app.models.claims_ai import RejectionPattern

    probabilities = []
    for dx in dx_codes:
        for tx in tx_codes:
            result = await db.execute(
                select(RejectionPattern).where(
                    and_(
                        RejectionPattern.specialty_code == specialty_code,
                        RejectionPattern.diagnosis_code == dx,
                        RejectionPattern.treatment_code == tx,
                    )
                )
            )
            pattern = result.scalar_one_or_none()
            if pattern:
                probabilities.append({
                    "dx": dx,
                    "tx": tx,
                    "pass_rate": 1.0 - pattern.rejection_rate,
                    "sample_size": pattern.total_claims,
                    "common_reasons": pattern.common_reasons,
                })
            else:
                probabilities.append({
                    "dx": dx,
                    "tx": tx,
                    "pass_rate": 0.95,
                    "sample_size": 0,
                    "common_reasons": [],
                })
    avg_pass = sum(p["pass_rate"] for p in probabilities) / len(probabilities) if probabilities else 0.95
    return {"stage": "statistical_model", "probabilities": probabilities, "avg_pass_rate": avg_pass}


# Stage 4: Documentation Check
def check_documentation(claim_data: dict) -> dict:
    """차트 기록 누락 체크"""
    warnings = []
    if not claim_data.get("primary_dx_code"):
        warnings.append({"type": "MISSING_DX", "detail": "주상병 코드 미입력"})
    if not claim_data.get("patient_chart_no"):
        warnings.append({"type": "MISSING_CHART", "detail": "환자 차트번호 누락"})
    return {"stage": "documentation_check", "warnings": warnings, "passed": len(warnings) == 0}


# Stage 5: Optimization
async def suggest_optimizations(db: AsyncSession, claim_items: list, dx_codes: list) -> dict:
    """대체 코드 제안, 수익 영향 계산"""
    # Hardcoded optimization rules (to be replaced with ML model)
    OPTIMIZATION_RULES = {
        "HA010": {
            "alternative": "HA011",
            "alt_name": "신경차단술(소)",
            "reason": "통과율 높은 대체 코드",
            "pass_rate_improvement": 0.15,
        },
        "D2711": {
            "alternative": "D2710",
            "alt_name": "일반 갑상선검사",
            "reason": "관련성 높은 기본검사로 변경",
            "pass_rate_improvement": 0.30,
        },
    }
    suggestions = []
    for item in claim_items:
        if item.code in OPTIMIZATION_RULES:
            opt = OPTIMIZATION_RULES[item.code]
            suggestions.append({
                "type": "ALTERNATIVE_CODE",
                "current_code": item.code,
                "suggested_code": opt["alternative"],
                "suggested_name": opt["alt_name"],
                "reason": opt["reason"],
                "pass_rate_improvement": opt["pass_rate_improvement"],
                "revenue_impact": 0,
            })
    return {"stage": "optimization", "suggestions": suggestions}


# Main pipeline
async def run_analysis_pipeline(db: AsyncSession, claim, items: list) -> dict:
    """전체 AI 사전심사 파이프라인 실행"""
    from app.models.claims_ai import ClaimAnalysisResult, AnalysisStatus

    start_time = time.time()

    # Get latest version
    version_result = await db.execute(
        select(func.max(ClaimAnalysisResult.version)).where(
            ClaimAnalysisResult.claim_id == claim.id
        )
    )
    latest_version = version_result.scalar() or 0
    new_version = latest_version + 1

    # Create analysis record
    analysis = ClaimAnalysisResult(
        claim_id=claim.id,
        version=new_version,
        status=AnalysisStatus.RUNNING,
    )
    db.add(analysis)
    await db.flush()

    try:
        dx_codes = [i.code for i in items if i.item_type.value in ("DIAGNOSIS",)]
        tx_codes = [i.code for i in items if i.item_type.value not in ("DIAGNOSIS",)]
        patient_info = {"age": claim.patient_age, "gender": claim.patient_gender}
        claim_data = {
            "primary_dx_code": claim.primary_dx_code,
            "patient_chart_no": claim.patient_chart_no,
        }

        # Run pipeline stages
        stage1 = await validate_codes(db, items)
        stage2 = await apply_rules(db, items, patient_info)
        stage3 = await calculate_pass_probability(
            db,
            claim.specialty_code or "00",
            dx_codes or [""],
            tx_codes or [i.code for i in items],
        )
        stage4 = check_documentation(claim_data)
        stage5 = await suggest_optimizations(db, items, dx_codes)

        # Calculate overall score
        penalty = 0
        if not stage1["passed"]:
            penalty += 30
        penalty += len(stage2["warnings"]) * 10
        penalty += int((1.0 - stage3["avg_pass_rate"]) * 40)
        if not stage4["passed"]:
            penalty += 5

        overall_score = max(0, min(100, 100 - penalty))
        pass_probability = stage3["avg_pass_rate"]
        risk_level = "LOW" if overall_score >= 80 else ("MEDIUM" if overall_score >= 50 else "HIGH")

        duration_ms = int((time.time() - start_time) * 1000)

        # Update analysis record
        analysis.status = AnalysisStatus.COMPLETED
        analysis.overall_risk_score = overall_score
        analysis.pass_probability = pass_probability
        analysis.risk_level = risk_level
        analysis.pipeline_results = {
            "code_validation": stage1,
            "rule_engine": stage2,
            "statistical_model": stage3,
            "documentation_check": stage4,
            "optimization": stage5,
        }
        analysis.optimization_suggestions = stage5["suggestions"]
        analysis.analysis_duration_ms = duration_ms

        return {
            "analysis_id": analysis.id,
            "version": new_version,
            "overall_risk_score": overall_score,
            "pass_probability": pass_probability,
            "risk_level": risk_level,
            "pipeline_results": analysis.pipeline_results,
            "optimization_suggestions": stage5["suggestions"],
            "duration_ms": duration_ms,
        }
    except Exception as e:
        analysis.status = AnalysisStatus.FAILED
        logger.error(f"Analysis pipeline failed: {e}")
        raise


# Appeal letter generation (simulated AI)
async def generate_appeal_letter(
    claim, rejected_items: list, rejection_reasons: list,
) -> dict:
    """AI 이의신청서 생성 (GPT-4o 연동 시뮬레이션)"""
    letter_template = f"""
이의신청서

1. 이의신청 대상
   - 청구번호: {claim.claim_number}
   - 진료일: {claim.service_date}
   - 삭감 항목: {len(rejected_items)}건

2. 이의신청 사유
{chr(10).join(f'   - {reason}' for reason in rejection_reasons)}

3. 근거 자료
   - 환자의 임상적 상태를 고려한 의학적 필요성 설명
   - 관련 진료지침 및 근거문헌 첨부
   - 유사 승인 사례 참조

4. 결론
   위 사유를 근거로 삭감된 {len(rejected_items)}건에 대해 재심을 요청합니다.
"""

    # Simulated success probability based on rejection reasons
    success_prob = 0.65  # Base probability
    if len(rejected_items) == 1:
        success_prob += 0.1
    if any("빈도" in str(r) for r in rejection_reasons):
        success_prob -= 0.1

    return {
        "letter": letter_template.strip(),
        "success_probability": min(0.95, max(0.2, success_prob)),
        "key_arguments": ["의학적 필요성", "진료지침 근거", "유사 승인 사례"],
        "model": "simulated-gpt4o",
    }
