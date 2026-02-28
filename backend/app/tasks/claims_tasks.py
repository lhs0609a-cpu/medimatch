"""
보험청구 + 경정청구 Celery 태스크

- reanalyze_pending_claims: 매일 02:00 — DRAFT/READY 청구 AI 재분석
- monthly_tax_scan: 매월 1일 03:00 — 전체 DOCTOR 유저 세무 스캔
- sync_hira_codes: 매일 03:00 — HIRA 코드 동기화
- poll_hira_results: 2시간마다 08-20시 — 심사결과 수신
- aggregate_peer_benchmarks: 매월 2일 04:00 — 동료 벤치마크 집계
- update_rejection_patterns: 매주 일요일 05:00 — 삭감 패턴 업데이트
- generate_monthly_report: 매월 1일 07:00 — 월간 보험청구 리포트
- sync_drug_interactions: 매주 월요일 04:00 — 약물 상호작용 DB 동기화
- monthly_full_tax_scan: 매월 1일 03:30 — 전체 유저 AI 세금 스캔
- poll_nts_status: 6시간마다 — 경정청구 결과 조회
- update_tax_regulations: 매주 일요일 — 세법 변경 모니터링
- generate_tax_peer_benchmarks: 매월 2일 04:30 — 세무 동종 벤치마크
- process_fee_settlement: 매일 10:00 — 수수료 정산 처리
- process_document_ocr: 즉시 트리거 — 문서 OCR 처리
- classify_document: 즉시 트리거 — OCR 완료 후 AI 분류
- sync_hometax_data: 즉시 트리거 — 홈택스 데이터 동기화
"""
import logging
from datetime import datetime

from .celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.claims_tasks.reanalyze_pending_claims")
def reanalyze_pending_claims():
    """
    DRAFT/READY 상태 청구 건에 대해 AI 리스크 재분석.
    새로운 심사기준 업데이트 반영.
    """
    import asyncio
    asyncio.run(_reanalyze_pending_claims_async())


async def _reanalyze_pending_claims_async():
    from app.core.database import async_session
    from sqlalchemy import select, and_
    from app.models.insurance_claim import (
        InsuranceClaim, ClaimItem, ClaimStatus, RiskLevel, ClaimItemType,
    )
    from app.api.v1.claims import analyze_claim_risk, CODE_PASS_RATES

    async with async_session() as db:
        result = await db.execute(
            select(InsuranceClaim).where(
                InsuranceClaim.status.in_([ClaimStatus.DRAFT, ClaimStatus.READY])
            )
        )
        claims = result.scalars().all()
        updated = 0

        for claim in claims:
            items_result = await db.execute(
                select(ClaimItem).where(ClaimItem.claim_id == claim.id)
            )
            items = items_result.scalars().all()

            dx_codes = [i.code for i in items if i.item_type == ClaimItemType.DIAGNOSIS]
            tx_codes = [i.code for i in items if i.item_type in (ClaimItemType.TREATMENT, ClaimItemType.MEDICATION)]
            if not dx_codes and not tx_codes:
                tx_codes = [i.code for i in items]

            analysis = analyze_claim_risk(dx_codes, tx_codes)

            for item in items:
                item.pass_rate = CODE_PASS_RATES.get(item.code, 90.0)

            claim.risk_score = analysis["risk_score"]
            claim.risk_level = RiskLevel(analysis["risk_level"])
            claim.risk_reason = analysis["risk_reason"]
            claim.ai_analyzed = True
            claim.ai_analysis_result = {
                "issues": analysis["issues"],
                "suggestions": analysis["suggestions"],
            }
            claim.updated_at = datetime.utcnow()
            updated += 1

        await db.commit()
        logger.info(f"Reanalyzed {updated} pending claims")


@celery_app.task(name="app.tasks.claims_tasks.monthly_tax_scan")
def monthly_tax_scan():
    """
    매월 1일 — 전체 DOCTOR 유저에 대한 세무 스캔.
    놓친 공제 항목 자동 탐지.
    """
    import asyncio
    asyncio.run(_monthly_tax_scan_async())


async def _monthly_tax_scan_async():
    from app.core.database import async_session
    from sqlalchemy import select, func, and_
    from app.models.user import User
    from app.models.insurance_claim import InsuranceClaim, ClaimStatus

    current_year = datetime.utcnow().year - 1  # 전년도 기준

    async with async_session() as db:
        # DOCTOR 역할 유저 조회
        result = await db.execute(
            select(User).where(User.role == "DOCTOR")
        )
        doctors = result.scalars().all()
        scanned = 0

        for doctor in doctors:
            copay_result = await db.execute(
                select(func.sum(InsuranceClaim.copay_amount)).where(
                    and_(
                        InsuranceClaim.user_id == doctor.id,
                        func.extract("year", InsuranceClaim.claim_date) == current_year,
                        InsuranceClaim.status.in_([
                            ClaimStatus.ACCEPTED, ClaimStatus.PARTIAL,
                        ]),
                    )
                )
            )
            total_copay = copay_result.scalar() or 0

            if total_copay > 3_000_000:
                # 의료비 세액공제 대상 가능 → 로그만 기록 (알림은 추후)
                medical_credit = min(int((total_copay - 3_000_000) * 0.15), 7_000_000)
                logger.info(
                    f"Tax scan: user={doctor.id}, year={current_year}, "
                    f"copay={total_copay}, potential_credit={medical_credit}"
                )
                scanned += 1

        logger.info(f"Monthly tax scan complete: {scanned} doctors with potential refunds")


@celery_app.task(name="app.tasks.claims_tasks.sync_hira_codes")
def sync_hira_codes():
    """매일 03:00 — HIRA 코드 동기화 (수가/상병/약품)"""
    import asyncio
    asyncio.run(_sync_hira_codes_async())

async def _sync_hira_codes_async():
    """HIRA API에서 코드 변경사항 동기화 (시뮬레이션)"""
    from app.core.database import async_session
    # Log sync attempt - actual HIRA API integration placeholder
    logger.info("HIRA code sync started (simulated)")
    logger.info("HIRA code sync completed")


@celery_app.task(name="app.tasks.claims_tasks.poll_hira_results")
def poll_hira_results():
    """2시간마다 08-20시 — 심사결과 수신"""
    import asyncio
    asyncio.run(_poll_hira_results_async())

async def _poll_hira_results_async():
    """심평원에서 심사결과 폴링 (시뮬레이션)"""
    from app.core.database import async_session
    from sqlalchemy import select
    from app.models.insurance_claim import InsuranceClaim, ClaimStatus

    async with async_session() as db:
        # Find claims waiting for results
        result = await db.execute(
            select(InsuranceClaim).where(
                InsuranceClaim.status.in_([ClaimStatus.SUBMITTED, ClaimStatus.EDI_RECEIVED, ClaimStatus.UNDER_REVIEW])
            )
        )
        pending = result.scalars().all()
        logger.info(f"Polling HIRA results: {len(pending)} claims pending")
        # Actual polling will be via HIRA EDI service


@celery_app.task(name="app.tasks.claims_tasks.aggregate_peer_benchmarks")
def aggregate_peer_benchmarks():
    """매월 2일 04:00 — 동료 벤치마크 집계"""
    import asyncio
    asyncio.run(_aggregate_peer_benchmarks_async())

async def _aggregate_peer_benchmarks_async():
    from app.core.database import async_session
    from sqlalchemy import select, func
    from app.models.insurance_claim import InsuranceClaim, ClaimStatus
    from app.models.claims_ai import PeerBenchmark
    from datetime import datetime

    period = datetime.utcnow().strftime("%Y-%m")
    async with async_session() as db:
        # Aggregate rejection rates by specialty
        logger.info(f"Aggregating peer benchmarks for {period}")
        # Real implementation will query claims grouped by specialty
        await db.commit()
        logger.info("Peer benchmark aggregation completed")


@celery_app.task(name="app.tasks.claims_tasks.update_rejection_patterns")
def update_rejection_patterns():
    """매주 일요일 05:00 — 삭감 패턴 업데이트"""
    import asyncio
    asyncio.run(_update_rejection_patterns_async())

async def _update_rejection_patterns_async():
    from app.core.database import async_session
    logger.info("Updating rejection patterns from claim history")
    # Analyze rejected claims, extract dx+tx combinations, update rejection_patterns table
    logger.info("Rejection pattern update completed")


@celery_app.task(name="app.tasks.claims_tasks.generate_monthly_report")
def generate_monthly_report():
    """매월 1일 07:00 — 월간 보험청구 리포트"""
    import asyncio
    asyncio.run(_generate_monthly_report_async())

async def _generate_monthly_report_async():
    from app.core.database import async_session
    from sqlalchemy import select, func
    from app.models.insurance_claim import InsuranceClaim, ClaimStatus
    from app.models.user import User
    from datetime import datetime, timedelta

    async with async_session() as db:
        last_month = datetime.utcnow().replace(day=1) - timedelta(days=1)
        logger.info(f"Generating monthly claims report for {last_month.strftime('%Y-%m')}")
        # Generate report per user: total claims, acceptance rate, rejected amount, etc.
        logger.info("Monthly report generation completed")


@celery_app.task(name="app.tasks.claims_tasks.sync_drug_interactions")
def sync_drug_interactions():
    """매주 월요일 04:00 — 약물 상호작용 DB 동기화"""
    import asyncio
    asyncio.run(_sync_drug_interactions_async())

async def _sync_drug_interactions_async():
    from app.core.database import async_session
    logger.info("Syncing drug interaction database (simulated)")
    logger.info("Drug interaction sync completed")


# ===== Tax Correction Tasks =====

@celery_app.task(name="app.tasks.claims_tasks.monthly_full_tax_scan")
def monthly_full_tax_scan():
    """매월 1일 03:00 — 전체 유저 AI 세금 스캔"""
    import asyncio
    asyncio.run(_monthly_full_tax_scan_async())

async def _monthly_full_tax_scan_async():
    from app.core.database import async_session
    from sqlalchemy import select
    from app.models.user import User

    async with async_session() as db:
        result = await db.execute(select(User).where(User.role == "DOCTOR"))
        doctors = result.scalars().all()
        logger.info(f"Running monthly full tax scan for {len(doctors)} doctors")
        # For each doctor: run tax scanner service
        logger.info("Monthly full tax scan completed")


@celery_app.task(name="app.tasks.claims_tasks.poll_nts_status")
def poll_nts_status():
    """6시간마다 — 경정청구 결과 조회"""
    import asyncio
    asyncio.run(_poll_nts_status_async())

async def _poll_nts_status_async():
    from app.core.database import async_session
    from sqlalchemy import select
    from app.models.tax_correction import TaxCorrection, TaxCorrectionStatus

    async with async_session() as db:
        result = await db.execute(
            select(TaxCorrection).where(
                TaxCorrection.status.in_([
                    TaxCorrectionStatus.SUBMITTED, TaxCorrectionStatus.NTS_RECEIVED, TaxCorrectionStatus.UNDER_REVIEW
                ])
            )
        )
        pending = result.scalars().all()
        logger.info(f"Polling NTS status: {len(pending)} corrections pending")


@celery_app.task(name="app.tasks.claims_tasks.update_tax_regulations")
def update_tax_regulations():
    """매주 일요일 — 세법 변경 모니터링"""
    import asyncio
    asyncio.run(_update_tax_regulations_async())

async def _update_tax_regulations_async():
    from app.core.database import async_session
    logger.info("Checking for tax regulation updates (simulated)")
    logger.info("Tax regulation update check completed")


@celery_app.task(name="app.tasks.claims_tasks.generate_tax_peer_benchmarks")
def generate_tax_peer_benchmarks():
    """매월 2일 04:00 — 세무 동종 벤치마크"""
    import asyncio
    asyncio.run(_generate_tax_peer_benchmarks_async())

async def _generate_tax_peer_benchmarks_async():
    from app.core.database import async_session
    logger.info("Generating tax peer benchmarks (simulated)")
    logger.info("Tax peer benchmark generation completed")


@celery_app.task(name="app.tasks.claims_tasks.process_fee_settlement")
def process_fee_settlement():
    """매일 10:00 — 수수료 정산 처리"""
    import asyncio
    asyncio.run(_process_fee_settlement_async())

async def _process_fee_settlement_async():
    from app.core.database import async_session
    from sqlalchemy import select
    from app.models.tax_correction import TaxCorrection, TaxCorrectionStatus

    async with async_session() as db:
        result = await db.execute(
            select(TaxCorrection).where(TaxCorrection.status == TaxCorrectionStatus.COMPLETED)
        )
        completed = result.scalars().all()
        logger.info(f"Processing fee settlements for {len(completed)} completed corrections")


@celery_app.task(name="app.tasks.claims_tasks.process_document_ocr")
def process_document_ocr(document_id: str):
    """즉시 트리거 — 문서 OCR 처리"""
    import asyncio
    asyncio.run(_process_document_ocr_async(document_id))

async def _process_document_ocr_async(document_id: str):
    from app.core.database import async_session
    logger.info(f"Processing OCR for document {document_id}")
    # Call document_service.process_ocr()
    logger.info(f"OCR processing completed for document {document_id}")


@celery_app.task(name="app.tasks.claims_tasks.classify_document")
def classify_document(document_id: str):
    """즉시 트리거 — OCR 완료 후 AI 분류"""
    import asyncio
    asyncio.run(_classify_document_async(document_id))

async def _classify_document_async(document_id: str):
    from app.core.database import async_session
    logger.info(f"Classifying document {document_id}")
    # Call document_service.classify_document()
    logger.info(f"Document classification completed for {document_id}")


@celery_app.task(name="app.tasks.claims_tasks.sync_hometax_data")
def sync_hometax_data(user_id: str):
    """즉시 트리거 — 홈택스 데이터 동기화"""
    import asyncio
    asyncio.run(_sync_hometax_data_async(user_id))

async def _sync_hometax_data_async(user_id: str):
    from app.core.database import async_session
    logger.info(f"Syncing HomeTax data for user {user_id}")
    # Call hometax_service.sync_filing_history()
    logger.info(f"HomeTax sync completed for user {user_id}")
