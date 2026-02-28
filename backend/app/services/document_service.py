"""
증빙 서류 관리 서비스

S3 저장 + OCR (CLOVA/Google Vision) + AI 문서 분류.
Phase 1: 시뮬레이션 모드 (실제 S3/OCR 연동 placeholder)

S3 경로 패턴: tax-docs/{user_id}/{tax_year}/{document_type}/{uuid}.{ext}
"""
import logging
import os
import uuid
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, delete

logger = logging.getLogger(__name__)

# S3 설정
S3_CONFIG = {
    "bucket": os.getenv("TAX_DOCS_S3_BUCKET", "medimatch-tax-docs"),
    "region": os.getenv("AWS_REGION", "ap-northeast-2"),
    "encryption": "AES-256-GCM",
    "max_file_size_mb": 50,
    "allowed_extensions": [
        "pdf", "jpg", "jpeg", "png", "tiff", "tif",
        "doc", "docx", "xls", "xlsx", "hwp",
    ],
}

# OCR 제공자 설정
OCR_CONFIG = {
    "primary_provider": "CLOVA",
    "fallback_provider": "GOOGLE_VISION",
    "confidence_threshold": 0.7,
}

# 문서 유형별 키워드 (AI 분류용)
DOCUMENT_CLASSIFICATION_KEYWORDS = {
    "PURCHASE_RECEIPT": ["구매", "영수증", "거래명세", "구입", "매입"],
    "DEPRECIATION_SCHEDULE": ["감가상각", "고정자산", "내용연수"],
    "EMPLOYMENT_CONTRACT": ["근로계약", "고용계약", "연봉", "월급"],
    "PAYROLL_LEDGER": ["급여대장", "급여명세", "원천징수"],
    "INSURANCE_CERTIFICATE": ["보험가입", "보험증명", "보험증권"],
    "DONATION_RECEIPT": ["기부금", "기부", "후원"],
    "EDUCATION_RECEIPT": ["교육비", "수업료", "등록금", "학원"],
    "MEDICAL_RECEIPT": ["의료비", "진료비", "약제비", "병원비"],
    "LEASE_CONTRACT": ["임대차", "전세", "월세", "임차"],
    "TAX_INVOICE": ["세금계산서", "전자세금", "매출세금"],
    "CREDIT_CARD_STATEMENT": ["카드명세", "카드사용", "카드거래"],
    "BANK_STATEMENT": ["은행거래", "계좌이체", "입출금"],
    "RESEARCH_CERTIFICATE": ["연구소", "전담부서", "인정서"],
}

# 경정청구 유형별 필요 서류 체크리스트
CORRECTION_DOCUMENT_CHECKLIST = {
    "EQUIPMENT_DEPRECIATION": [
        {"type": "PURCHASE_RECEIPT", "name": "의료기기 구매 영수증", "required": True},
        {"type": "DEPRECIATION_SCHEDULE", "name": "감가상각명세서", "required": True},
    ],
    "EMPLOYMENT_TAX_CREDIT": [
        {"type": "EMPLOYMENT_CONTRACT", "name": "근로계약서", "required": True},
        {"type": "PAYROLL_LEDGER", "name": "급여대장", "required": True},
        {"type": "INSURANCE_CERTIFICATE", "name": "4대보험 가입확인서", "required": True},
    ],
    "YOUTH_EMPLOYMENT": [
        {"type": "EMPLOYMENT_CONTRACT", "name": "근로계약서 (청년)", "required": True},
        {"type": "OTHER", "name": "주민등록등본 (연령 확인)", "required": True},
        {"type": "INSURANCE_CERTIFICATE", "name": "4대보험 가입확인서", "required": True},
    ],
    "FAITHFUL_FILING": [
        {"type": "OTHER", "name": "성실신고확인서", "required": True},
        {"type": "PURCHASE_RECEIPT", "name": "세무조정 수수료 영수증", "required": True},
    ],
    "MEDICAL_EXPENSE": [
        {"type": "MEDICAL_RECEIPT", "name": "의료비 영수증", "required": True},
        {"type": "OTHER", "name": "의료비 납입확인서", "required": False},
    ],
    "EDUCATION": [
        {"type": "EDUCATION_RECEIPT", "name": "교육비 납입증명서", "required": True},
        {"type": "OTHER", "name": "재학증명서", "required": False},
    ],
}


class DocumentService:
    """증빙 서류 관리 서비스"""

    def __init__(self, simulation_mode: bool = True):
        self.simulation_mode = simulation_mode
        self.s3_config = S3_CONFIG
        self.ocr_config = OCR_CONFIG

    async def upload_document(
        self,
        db: AsyncSession,
        user_id: str,
        file_data: bytes,
        filename: str,
        metadata: dict,
    ) -> dict:
        """
        증빙 서류 업로드 (S3 + DB 기록)

        Args:
            db: DB 세션
            user_id: 사용자 UUID
            file_data: 파일 바이너리 데이터
            filename: 원본 파일명
            metadata: {tax_year, document_type, correction_id, ...}

        Returns:
            업로드 결과 (document_id, s3_key)
        """
        from app.models.tax_document import TaxDocument, DocumentType, DocumentStatus

        # 파일 확장자 검증
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if ext not in self.s3_config["allowed_extensions"]:
            return {
                "success": False,
                "error": "INVALID_FILE_TYPE",
                "detail": f"허용되지 않는 파일 형식: .{ext}",
                "allowed": self.s3_config["allowed_extensions"],
            }

        # 파일 크기 검증
        file_size = len(file_data)
        max_size = self.s3_config["max_file_size_mb"] * 1024 * 1024
        if file_size > max_size:
            return {
                "success": False,
                "error": "FILE_TOO_LARGE",
                "detail": f"최대 {self.s3_config['max_file_size_mb']}MB까지 업로드 가능",
            }

        # S3 키 생성
        doc_id = uuid.uuid4()
        tax_year = metadata.get("tax_year", datetime.utcnow().year)
        doc_type = metadata.get("document_type", "OTHER")
        s3_key = f"tax-docs/{user_id}/{tax_year}/{doc_type}/{doc_id}.{ext}"

        # S3 업로드
        if self.simulation_mode:
            upload_result = self._simulate_s3_upload(s3_key, file_size)
        else:
            # TODO: 실제 S3 업로드 구현
            # upload_result = await self._upload_to_s3(s3_key, file_data)
            upload_result = self._simulate_s3_upload(s3_key, file_size)

        if not upload_result["success"]:
            return upload_result

        # MIME 타입 결정
        mime_map = {
            "pdf": "application/pdf",
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "png": "image/png",
            "tiff": "image/tiff",
            "tif": "image/tiff",
            "doc": "application/msword",
            "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "xls": "application/vnd.ms-excel",
            "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "hwp": "application/x-hwp",
        }

        # DB 레코드 생성
        doc_type_enum = DocumentType.OTHER
        try:
            doc_type_enum = DocumentType(doc_type)
        except (ValueError, KeyError):
            pass

        document = TaxDocument(
            id=doc_id,
            user_id=user_id,
            correction_id=metadata.get("correction_id"),
            original_filename=filename,
            file_extension=ext,
            file_size_bytes=file_size,
            mime_type=mime_map.get(ext, "application/octet-stream"),
            s3_bucket=self.s3_config["bucket"],
            s3_key=s3_key,
            encryption_algorithm=self.s3_config["encryption"],
            document_type=doc_type_enum,
            tax_year=tax_year,
            deduction_category=metadata.get("deduction_category"),
            status=DocumentStatus.UPLOADED,
        )
        db.add(document)
        await db.flush()

        return {
            "success": True,
            "document_id": str(doc_id),
            "s3_key": s3_key,
            "file_size": file_size,
            "status": "UPLOADED",
        }

    async def get_presigned_url(
        self,
        db: AsyncSession,
        document_id: str,
        expires_in: int = 900,
    ) -> dict:
        """
        Pre-signed 다운로드 URL 생성

        Args:
            db: DB 세션
            document_id: 문서 UUID
            expires_in: URL 만료 시간 (초, 기본 15분)

        Returns:
            pre-signed URL
        """
        from app.models.tax_document import TaxDocument

        result = await db.execute(
            select(TaxDocument).where(TaxDocument.id == document_id)
        )
        document = result.scalar_one_or_none()
        if not document:
            return {"success": False, "error": "DOCUMENT_NOT_FOUND"}

        if self.simulation_mode:
            url = (
                f"https://{self.s3_config['bucket']}.s3.{self.s3_config['region']}"
                f".amazonaws.com/{document.s3_key}"
                f"?X-Amz-Expires={expires_in}"
                f"&X-Amz-Signature=SIMULATED"
            )
        else:
            # TODO: 실제 boto3 pre-signed URL 생성
            # url = self._generate_presigned_url(document.s3_key, expires_in)
            url = f"https://{self.s3_config['bucket']}.s3.amazonaws.com/{document.s3_key}"

        return {
            "success": True,
            "document_id": str(document_id),
            "url": url,
            "expires_in": expires_in,
            "expires_at": (datetime.utcnow() + timedelta(seconds=expires_in)).isoformat(),
        }

    async def process_ocr(
        self,
        db: AsyncSession,
        document_id: str,
    ) -> dict:
        """
        OCR 처리 (CLOVA OCR / Google Vision)

        Args:
            db: DB 세션
            document_id: 문서 UUID

        Returns:
            OCR 결과
        """
        from app.models.tax_document import TaxDocument, DocumentStatus

        result = await db.execute(
            select(TaxDocument).where(TaxDocument.id == document_id)
        )
        document = result.scalar_one_or_none()
        if not document:
            return {"success": False, "error": "DOCUMENT_NOT_FOUND"}

        # 상태 업데이트
        document.status = DocumentStatus.OCR_PROCESSING
        document.ocr_status = "PROCESSING"
        await db.flush()

        try:
            if self.simulation_mode:
                ocr_result = self._simulate_ocr_result(document)
            else:
                # TODO: 실제 OCR API 호출
                # ocr_result = await self._call_clova_ocr(document.s3_key)
                ocr_result = self._simulate_ocr_result(document)

            # 결과 저장
            document.ocr_status = "COMPLETED"
            document.ocr_provider = self.ocr_config["primary_provider"]
            document.ocr_result = ocr_result
            document.status = DocumentStatus.OCR_COMPLETED
            await db.flush()

            return {
                "success": True,
                "document_id": str(document_id),
                "ocr_provider": self.ocr_config["primary_provider"],
                "text": ocr_result.get("text", ""),
                "structured_data": ocr_result.get("structured_data", {}),
                "confidence": ocr_result.get("confidence", 0.0),
            }

        except Exception as e:
            document.ocr_status = "FAILED"
            await db.flush()
            logger.error(f"OCR processing failed for document {document_id}: {e}")
            return {"success": False, "error": "OCR_FAILED", "detail": str(e)}

    async def classify_document(
        self,
        db: AsyncSession,
        document_id: str,
    ) -> dict:
        """
        AI 문서 분류

        Args:
            db: DB 세션
            document_id: 문서 UUID

        Returns:
            분류 결과
        """
        from app.models.tax_document import TaxDocument, DocumentType, DocumentStatus

        result = await db.execute(
            select(TaxDocument).where(TaxDocument.id == document_id)
        )
        document = result.scalar_one_or_none()
        if not document:
            return {"success": False, "error": "DOCUMENT_NOT_FOUND"}

        # OCR 텍스트가 있으면 키워드 기반 분류
        ocr_text = ""
        if document.ocr_result:
            ocr_text = document.ocr_result.get("text", "")

        if self.simulation_mode or not ocr_text:
            classification = self._simulate_classification(document, ocr_text)
        else:
            classification = self._classify_by_keywords(ocr_text)

        # 결과 저장
        try:
            classified_type = DocumentType(classification["document_type"])
            document.ai_classified_type = classified_type
        except (ValueError, KeyError):
            document.ai_classified_type = DocumentType.OTHER

        document.ai_classification_confidence = classification["confidence"]
        document.status = DocumentStatus.CLASSIFIED
        await db.flush()

        return {
            "success": True,
            "document_id": str(document_id),
            "classified_type": classification["document_type"],
            "confidence": classification["confidence"],
            "alternative_types": classification.get("alternatives", []),
        }

    async def get_document_checklist(
        self,
        db: AsyncSession,
        correction_id: str,
    ) -> dict:
        """
        경정청구 필요 서류 체크리스트

        Args:
            db: DB 세션
            correction_id: TaxCorrection UUID

        Returns:
            필요 서류 목록 + 업로드 상태
        """
        from app.models.tax_correction import TaxCorrection, TaxDeduction
        from app.models.tax_document import TaxDocument

        # 경정청구 공제 항목 조회
        correction_result = await db.execute(
            select(TaxCorrection).where(TaxCorrection.id == correction_id)
        )
        correction = correction_result.scalar_one_or_none()
        if not correction:
            return {"success": False, "error": "CORRECTION_NOT_FOUND"}

        deductions_result = await db.execute(
            select(TaxDeduction).where(TaxDeduction.correction_id == correction_id)
        )
        deductions = deductions_result.scalars().all()

        # 기 업로드된 서류 조회
        docs_result = await db.execute(
            select(TaxDocument).where(TaxDocument.correction_id == correction_id)
        )
        uploaded_docs = docs_result.scalars().all()
        uploaded_types = {doc.document_type.value for doc in uploaded_docs}

        # 체크리스트 생성
        checklist = []
        for deduction in deductions:
            category = deduction.category.value
            required_docs = CORRECTION_DOCUMENT_CHECKLIST.get(category, [])
            for doc_req in required_docs:
                checklist.append({
                    "deduction_category": category,
                    "document_type": doc_req["type"],
                    "document_name": doc_req["name"],
                    "required": doc_req["required"],
                    "uploaded": doc_req["type"] in uploaded_types,
                })

        total_required = sum(1 for c in checklist if c["required"])
        total_uploaded = sum(1 for c in checklist if c["required"] and c["uploaded"])

        return {
            "success": True,
            "correction_id": str(correction_id),
            "checklist": checklist,
            "total_required": total_required,
            "total_uploaded": total_uploaded,
            "completion_rate": round(total_uploaded / total_required * 100, 1) if total_required > 0 else 100.0,
            "all_required_uploaded": total_uploaded >= total_required,
        }

    async def delete_document(
        self,
        db: AsyncSession,
        document_id: str,
        user_id: str,
    ) -> dict:
        """
        증빙 서류 삭제 (S3 + DB)

        Args:
            db: DB 세션
            document_id: 문서 UUID
            user_id: 요청자 UUID (권한 확인)

        Returns:
            삭제 결과
        """
        from app.models.tax_document import TaxDocument

        result = await db.execute(
            select(TaxDocument).where(
                and_(
                    TaxDocument.id == document_id,
                    TaxDocument.user_id == user_id,
                )
            )
        )
        document = result.scalar_one_or_none()
        if not document:
            return {"success": False, "error": "DOCUMENT_NOT_FOUND"}

        s3_key = document.s3_key

        # S3 삭제
        if self.simulation_mode:
            s3_delete_result = {"success": True}
        else:
            # TODO: 실제 S3 삭제
            # s3_delete_result = await self._delete_from_s3(s3_key)
            s3_delete_result = {"success": True}

        if not s3_delete_result["success"]:
            logger.error(f"Failed to delete S3 object: {s3_key}")
            # S3 삭제 실패해도 DB에서는 삭제 진행 (orphan cleanup 별도 처리)

        # DB 삭제
        await db.delete(document)
        await db.flush()

        return {
            "success": True,
            "document_id": str(document_id),
            "s3_key": s3_key,
            "deleted_at": datetime.utcnow().isoformat(),
        }

    # ─────────────────────────────────────────
    # Private / Simulation Helpers
    # ─────────────────────────────────────────

    def _simulate_s3_upload(self, s3_key: str, file_size: int) -> dict:
        """시뮬레이션 S3 업로드"""
        return {
            "success": True,
            "s3_key": s3_key,
            "etag": uuid.uuid4().hex[:32],
            "file_size": file_size,
        }

    def _simulate_ocr_result(self, document) -> dict:
        """시뮬레이션 OCR 결과 생성"""
        import random

        doc_type = document.document_type.value if document.document_type else "OTHER"

        # 문서 유형별 시뮬레이션 텍스트
        simulated_texts = {
            "PURCHASE_RECEIPT": "거래명세서\n품목: 초음파 진단기\n금액: 45,000,000원\n일자: 2024-03-15\n공급자: (주)메디텍",
            "DEPRECIATION_SCHEDULE": "감가상각명세서\n자산명: CT스캐너\n취득가액: 350,000,000원\n내용연수: 8년\n상각방법: 정액법",
            "EMPLOYMENT_CONTRACT": "근로계약서\n근로자: 홍길동\n직위: 간호사\n연봉: 42,000,000원\n입사일: 2024-01-02",
            "PAYROLL_LEDGER": "급여대장\n2024년 3월\n총 직원: 8명\n총 급여: 28,000,000원",
        }

        text = simulated_texts.get(doc_type, f"시뮬레이션 OCR 텍스트 ({doc_type})")
        confidence = random.uniform(0.85, 0.98)

        return {
            "text": text,
            "structured_data": {
                "vendor_name": "(주)메디텍" if "RECEIPT" in doc_type else None,
                "amount": 45_000_000 if "RECEIPT" in doc_type else None,
                "date": "2024-03-15",
            },
            "confidence": round(confidence, 3),
            "page_count": 1,
            "language": "ko",
        }

    def _simulate_classification(self, document, ocr_text: str) -> dict:
        """시뮬레이션 문서 분류"""
        import random

        # 파일명 기반 분류 시도
        filename = document.original_filename.lower()

        for doc_type, keywords in DOCUMENT_CLASSIFICATION_KEYWORDS.items():
            if any(kw in filename for kw in keywords):
                return {
                    "document_type": doc_type,
                    "confidence": random.randint(80, 95),
                    "alternatives": [],
                }

        # OCR 텍스트 기반 분류 시도
        if ocr_text:
            return self._classify_by_keywords(ocr_text)

        # 기본 분류
        return {
            "document_type": document.document_type.value if document.document_type else "OTHER",
            "confidence": 50,
            "alternatives": [
                {"type": "PURCHASE_RECEIPT", "confidence": 30},
                {"type": "TAX_INVOICE", "confidence": 20},
            ],
        }

    def _classify_by_keywords(self, text: str) -> dict:
        """키워드 기반 문서 분류"""
        scores = {}
        for doc_type, keywords in DOCUMENT_CLASSIFICATION_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in text)
            if score > 0:
                scores[doc_type] = score

        if not scores:
            return {"document_type": "OTHER", "confidence": 30, "alternatives": []}

        # 최고 점수 문서 유형
        best_type = max(scores, key=scores.get)
        max_score = scores[best_type]
        total_keywords = len(DOCUMENT_CLASSIFICATION_KEYWORDS.get(best_type, []))
        confidence = min(95, int((max_score / max(total_keywords, 1)) * 100))

        # 대안 유형
        alternatives = [
            {"type": t, "confidence": int((s / max_score) * confidence * 0.8)}
            for t, s in sorted(scores.items(), key=lambda x: -x[1])
            if t != best_type
        ][:3]

        return {
            "document_type": best_type,
            "confidence": confidence,
            "alternatives": alternatives,
        }


# 싱글톤 인스턴스
document_service = DocumentService(simulation_mode=True)
