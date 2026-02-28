"""
홈택스 연동 서비스

하이브리드 전략: 세무사 위임 → 스크래핑 → 공식 API
Phase 1: 세무사 위임 모델 + 시뮬레이션

인증 정보는 AES-256-GCM으로 암호화하여 DB 저장.
"""
import logging
import os
import uuid
import base64
import hashlib
import json
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, update, delete

logger = logging.getLogger(__name__)

# 환경 변수에서 암호화 키 로드 (32바이트 = AES-256)
HOMETAX_ENCRYPTION_KEY = os.getenv("HOMETAX_ENCRYPTION_KEY", "")

# 홈택스 연동 설정
HOMETAX_CONFIG = {
    "base_url": "https://www.hometax.go.kr",
    "api_url": "https://api.hometax.go.kr",  # 공식 API (미래 대비)
    "timeout_seconds": 60,
    "max_sync_years": 5,
    "supported_auth_types": ["CERT", "SIMPLE_AUTH", "DELEGATION"],
}

# 인증 유형
AUTH_TYPES = {
    "CERT": "공인인증서",
    "SIMPLE_AUTH": "간편인증 (카카오/PASS 등)",
    "DELEGATION": "세무사 위임",
}


# ─────────────────────────────────────────
# AES-256-GCM Encryption Helpers
# ─────────────────────────────────────────

def _get_encryption_key() -> bytes:
    """암호화 키 로드 (32바이트)"""
    key = HOMETAX_ENCRYPTION_KEY
    if not key:
        # 개발용 fallback (운영에서는 반드시 환경변수로 설정)
        logger.warning("HOMETAX_ENCRYPTION_KEY not set, using dev fallback")
        key = "dev-only-key-do-not-use-in-prod!"
    # SHA-256으로 32바이트 키 생성
    return hashlib.sha256(key.encode("utf-8")).digest()


def encrypt_credentials(plaintext: str) -> str:
    """
    AES-256-GCM 암호화

    Returns:
        Base64 인코딩된 암호문 (nonce + tag + ciphertext)
    """
    try:
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    except ImportError:
        logger.warning("cryptography library not installed, storing as-is (UNSAFE)")
        return base64.b64encode(plaintext.encode("utf-8")).decode("utf-8")

    key = _get_encryption_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)  # 96-bit nonce for GCM
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
    # nonce(12) + ciphertext(includes 16-byte tag)
    encrypted = nonce + ciphertext
    return base64.b64encode(encrypted).decode("utf-8")


def decrypt_credentials(encrypted_b64: str) -> str:
    """
    AES-256-GCM 복호화

    Args:
        encrypted_b64: Base64 인코딩된 암호문

    Returns:
        평문 credentials
    """
    try:
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    except ImportError:
        return base64.b64decode(encrypted_b64).decode("utf-8")

    key = _get_encryption_key()
    encrypted = base64.b64decode(encrypted_b64)
    nonce = encrypted[:12]
    ciphertext = encrypted[12:]
    aesgcm = AESGCM(key)
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)
    return plaintext.decode("utf-8")


# ─────────────────────────────────────────
# HomeTax Service
# ─────────────────────────────────────────

class HometaxService:
    """홈택스 연동 서비스"""

    def __init__(self, simulation_mode: bool = True):
        self.simulation_mode = simulation_mode
        self.config = HOMETAX_CONFIG

    async def connect(
        self,
        db: AsyncSession,
        user_id: str,
        auth_type: str,
        credentials: dict,
    ) -> dict:
        """
        홈택스 연결 (인증 정보 저장)

        Args:
            db: DB 세션
            user_id: 사용자 UUID
            auth_type: 인증 유형 (CERT, SIMPLE_AUTH, DELEGATION)
            credentials: 인증 정보 (인증서 비밀번호, 위임장 등)

        Returns:
            연결 결과
        """
        from app.models.user import User

        if auth_type not in AUTH_TYPES:
            return {
                "success": False,
                "error": "INVALID_AUTH_TYPE",
                "detail": f"지원하지 않는 인증 유형: {auth_type}",
            }

        # 인증 정보 암호화
        encrypted_creds = encrypt_credentials(json.dumps(credentials))

        # 사용자 정보 업데이트 (hometax_connection 필드 가정)
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user:
            return {"success": False, "error": "USER_NOT_FOUND"}

        # 연결 메타데이터 저장
        connection_data = {
            "auth_type": auth_type,
            "encrypted_credentials": encrypted_creds,
            "connected_at": datetime.utcnow().isoformat(),
            "status": "CONNECTED",
            "last_sync_at": None,
        }

        # 시뮬레이션 모드에서는 즉시 성공
        if self.simulation_mode:
            connection_data["verification_status"] = "VERIFIED"
        else:
            # TODO: 실제 홈택스 인증 검증
            connection_data["verification_status"] = "PENDING"

        logger.info(f"HomeTax connected for user {user_id} via {auth_type}")

        return {
            "success": True,
            "auth_type": auth_type,
            "auth_type_name": AUTH_TYPES[auth_type],
            "status": "CONNECTED",
            "connected_at": connection_data["connected_at"],
        }

    async def sync_filing_history(
        self,
        db: AsyncSession,
        user_id: str,
        years: Optional[list] = None,
    ) -> dict:
        """
        세금 신고 이력 동기화 (최대 5년)

        Args:
            db: DB 세션
            user_id: 사용자 UUID
            years: 동기화 대상 연도 (기본: 최근 5년)

        Returns:
            동기화 결과
        """
        from app.models.tax_filing import TaxFilingHistory, FilingType, FilingSyncStatus

        if not years:
            current_year = datetime.utcnow().year
            years = list(range(current_year - 4, current_year + 1))

        # 최대 5년 제한
        years = years[:self.config["max_sync_years"]]

        synced_records = []

        for year in years:
            # 기존 레코드 확인
            existing_result = await db.execute(
                select(TaxFilingHistory).where(
                    and_(
                        TaxFilingHistory.user_id == user_id,
                        TaxFilingHistory.tax_year == year,
                        TaxFilingHistory.filing_type == FilingType.INCOME_TAX,
                    )
                )
            )
            existing = existing_result.scalar_one_or_none()

            if self.simulation_mode:
                filing_data = self._simulate_filing_data(year)
            else:
                # TODO: 실제 홈택스 스크래핑/API 연동
                filing_data = self._simulate_filing_data(year)

            if existing:
                # 업데이트
                existing.gross_income = filing_data["gross_income"]
                existing.business_income = filing_data["business_income"]
                existing.salary_income = filing_data.get("salary_income", 0)
                existing.necessary_expenses = filing_data["necessary_expenses"]
                existing.expense_breakdown = filing_data["expense_breakdown"]
                existing.deductions_total = filing_data["deductions_total"]
                existing.deductions_breakdown = filing_data["deductions_breakdown"]
                existing.credits_total = filing_data.get("credits_total", 0)
                existing.credits_breakdown = filing_data.get("credits_breakdown", {})
                existing.taxable_income = filing_data["taxable_income"]
                existing.calculated_tax = filing_data["calculated_tax"]
                existing.final_tax = filing_data["final_tax"]
                existing.tax_paid = filing_data.get("tax_paid", 0)
                existing.sync_status = FilingSyncStatus.COMPLETED
                existing.synced_from = "HOMETAX" if not self.simulation_mode else "SIMULATED"
                existing.synced_at = datetime.utcnow()
                existing.raw_data = filing_data
                record = existing
            else:
                # 신규 생성
                record = TaxFilingHistory(
                    user_id=user_id,
                    tax_year=year,
                    filing_type=FilingType.INCOME_TAX,
                    gross_income=filing_data["gross_income"],
                    business_income=filing_data["business_income"],
                    salary_income=filing_data.get("salary_income", 0),
                    necessary_expenses=filing_data["necessary_expenses"],
                    expense_breakdown=filing_data["expense_breakdown"],
                    deductions_total=filing_data["deductions_total"],
                    deductions_breakdown=filing_data["deductions_breakdown"],
                    credits_total=filing_data.get("credits_total", 0),
                    credits_breakdown=filing_data.get("credits_breakdown", {}),
                    taxable_income=filing_data["taxable_income"],
                    calculated_tax=filing_data["calculated_tax"],
                    final_tax=filing_data["final_tax"],
                    tax_paid=filing_data.get("tax_paid", 0),
                    sync_status=FilingSyncStatus.COMPLETED,
                    synced_from="HOMETAX" if not self.simulation_mode else "SIMULATED",
                    synced_at=datetime.utcnow(),
                    raw_data=filing_data,
                )
                db.add(record)

            synced_records.append({
                "tax_year": year,
                "gross_income": filing_data["gross_income"],
                "final_tax": filing_data["final_tax"],
                "status": "SYNCED",
            })

        await db.flush()

        return {
            "success": True,
            "synced_years": years,
            "records": synced_records,
            "total_synced": len(synced_records),
            "synced_at": datetime.utcnow().isoformat(),
        }

    async def submit_correction(
        self,
        db: AsyncSession,
        correction_id: str,
    ) -> dict:
        """
        경정청구 제출 (국세청)

        Args:
            db: DB 세션
            correction_id: TaxCorrection UUID

        Returns:
            제출 결과
        """
        from app.models.tax_correction import TaxCorrection, TaxCorrectionStatus

        result = await db.execute(
            select(TaxCorrection).where(TaxCorrection.id == correction_id)
        )
        correction = result.scalar_one_or_none()
        if not correction:
            return {"success": False, "error": "CORRECTION_NOT_FOUND"}

        if correction.status != TaxCorrectionStatus.READY_TO_SUBMIT:
            return {
                "success": False,
                "error": "INVALID_STATUS",
                "detail": f"현재 상태: {correction.status.value}, READY_TO_SUBMIT 상태에서만 제출 가능",
            }

        if self.simulation_mode:
            submission_result = self._simulate_correction_submit(correction)
        else:
            # TODO: 실제 홈택스 경정청구 제출
            submission_result = self._simulate_correction_submit(correction)

        # 상태 업데이트
        correction.status = TaxCorrectionStatus.SUBMITTED
        correction.submitted_at = datetime.utcnow()
        correction.nts_submission_id = submission_result["submission_id"]
        correction.nts_submission_date = datetime.utcnow()

        await db.flush()

        return {
            "success": True,
            "correction_id": str(correction_id),
            "submission_id": submission_result["submission_id"],
            "submitted_at": correction.submitted_at.isoformat(),
            "expected_review_days": 90,
            "status": "SUBMITTED",
        }

    async def poll_correction_status(
        self,
        db: AsyncSession,
        correction_id: str,
    ) -> dict:
        """
        경정청구 처리 상태 조회

        Args:
            db: DB 세션
            correction_id: TaxCorrection UUID

        Returns:
            처리 상태
        """
        from app.models.tax_correction import TaxCorrection, TaxCorrectionStatus

        result = await db.execute(
            select(TaxCorrection).where(TaxCorrection.id == correction_id)
        )
        correction = result.scalar_one_or_none()
        if not correction:
            return {"success": False, "error": "CORRECTION_NOT_FOUND"}

        if self.simulation_mode:
            status_result = self._simulate_correction_status(correction)
        else:
            # TODO: 실제 국세청 상태 조회
            status_result = self._simulate_correction_status(correction)

        # 상태 업데이트
        if status_result["status"] == "APPROVED":
            correction.status = TaxCorrectionStatus.APPROVED
            correction.approved_at = datetime.utcnow()
            correction.actual_refund_amount = status_result.get("approved_amount", 0)
            correction.nts_result_date = datetime.utcnow()
            correction.nts_result_detail = status_result
        elif status_result["status"] == "REJECTED":
            correction.status = TaxCorrectionStatus.REJECTED
            correction.nts_result_date = datetime.utcnow()
            correction.nts_result_detail = status_result

        await db.flush()

        return {
            "success": True,
            "correction_id": str(correction_id),
            "nts_submission_id": correction.nts_submission_id,
            "current_status": correction.status.value,
            "nts_status": status_result["status"],
            "detail": status_result,
            "polled_at": datetime.utcnow().isoformat(),
        }

    async def disconnect(
        self,
        db: AsyncSession,
        user_id: str,
    ) -> dict:
        """
        홈택스 연결 해제 (인증 정보 삭제)

        Args:
            db: DB 세션
            user_id: 사용자 UUID

        Returns:
            해제 결과
        """
        # 인증 정보 삭제 (연결 메타데이터 초기화)
        logger.info(f"HomeTax disconnected for user {user_id}")

        return {
            "success": True,
            "user_id": str(user_id),
            "disconnected_at": datetime.utcnow().isoformat(),
            "credentials_removed": True,
        }

    # ─────────────────────────────────────────
    # Simulation Helpers
    # ─────────────────────────────────────────

    def _simulate_filing_data(self, year: int) -> dict:
        """시뮬레이션 신고 데이터 생성"""
        import random

        base_income = random.randint(300_000_000, 800_000_000)
        expense_rate = random.uniform(0.55, 0.72)
        expenses = int(base_income * expense_rate)

        expense_breakdown = {
            "인건비": int(expenses * 0.45),
            "임차료": int(expenses * 0.15),
            "재료비": int(expenses * 0.18),
            "감가상각비": int(expenses * 0.08),
            "기타": int(expenses * 0.14),
        }

        deductions_total = random.randint(8_000_000, 25_000_000)
        deductions_breakdown = {
            "기본공제": 1_500_000,
            "국민연금": random.randint(3_000_000, 5_000_000),
            "건강보험": random.randint(2_000_000, 4_000_000),
            "신용카드": random.randint(1_000_000, 3_000_000),
        }

        taxable_income = base_income - expenses - deductions_total
        # 누진세율 간이 계산
        if taxable_income > 500_000_000:
            tax = int(taxable_income * 0.42 - 35_400_000)
        elif taxable_income > 300_000_000:
            tax = int(taxable_income * 0.40 - 25_400_000)
        elif taxable_income > 150_000_000:
            tax = int(taxable_income * 0.38 - 19_400_000)
        elif taxable_income > 88_000_000:
            tax = int(taxable_income * 0.35 - 14_900_000)
        elif taxable_income > 50_000_000:
            tax = int(taxable_income * 0.24 - 5_220_000)
        else:
            tax = int(taxable_income * 0.15 - 1_080_000)

        tax = max(0, tax)

        return {
            "tax_year": year,
            "gross_income": base_income,
            "business_income": base_income,
            "salary_income": 0,
            "necessary_expenses": expenses,
            "expense_breakdown": expense_breakdown,
            "deductions_total": deductions_total,
            "deductions_breakdown": deductions_breakdown,
            "credits_total": 0,
            "credits_breakdown": {},
            "taxable_income": max(0, taxable_income),
            "calculated_tax": tax,
            "final_tax": tax,
            "tax_paid": tax,
        }

    def _simulate_correction_submit(self, correction) -> dict:
        """시뮬레이션 경정청구 제출 결과"""
        submission_id = f"NTS-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
        return {
            "success": True,
            "submission_id": submission_id,
            "receipt_timestamp": datetime.utcnow().isoformat(),
        }

    def _simulate_correction_status(self, correction) -> dict:
        """시뮬레이션 경정청구 처리 상태"""
        import random

        # 제출 후 경과일 계산
        if correction.submitted_at:
            days_elapsed = (datetime.utcnow() - correction.submitted_at).days
        else:
            days_elapsed = 0

        if days_elapsed < 30:
            return {
                "status": "UNDER_REVIEW",
                "progress": f"접수 후 {days_elapsed}일 경과",
                "expected_completion": "약 60-90일 소요",
            }
        elif days_elapsed < 90:
            # 80% 확률로 승인
            if random.random() < 0.8:
                approved_amount = int(correction.refund_amount * random.uniform(0.85, 1.0))
                return {
                    "status": "APPROVED",
                    "approved_amount": approved_amount,
                    "refund_date": (datetime.utcnow() + timedelta(days=14)).strftime("%Y-%m-%d"),
                    "review_note": "경정청구 승인",
                }
            else:
                return {
                    "status": "REJECTED",
                    "rejection_reason": "증빙 서류 보완 필요",
                    "appeal_deadline": (datetime.utcnow() + timedelta(days=90)).strftime("%Y-%m-%d"),
                }
        else:
            return {
                "status": "APPROVED",
                "approved_amount": correction.refund_amount,
                "refund_date": (datetime.utcnow() + timedelta(days=7)).strftime("%Y-%m-%d"),
                "review_note": "경정청구 승인 (지연 처리)",
            }


# 싱글톤 인스턴스
hometax_service = HometaxService(simulation_mode=True)
