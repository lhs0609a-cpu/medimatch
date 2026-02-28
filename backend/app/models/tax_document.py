"""
증빙 서류 관리 모델

- TaxDocument: 증빙 서류 (S3 저장, OCR 결과, AI 분류)
"""
import uuid
import enum
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, BigInteger, Text, DateTime,
    ForeignKey, Boolean, Index
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.core.database import Base


# ===== Enums =====

class DocumentType(str, enum.Enum):
    PURCHASE_RECEIPT = "PURCHASE_RECEIPT"          # 구매 영수증
    DEPRECIATION_SCHEDULE = "DEPRECIATION_SCHEDULE"  # 감가상각명세서
    EMPLOYMENT_CONTRACT = "EMPLOYMENT_CONTRACT"    # 근로계약서
    PAYROLL_LEDGER = "PAYROLL_LEDGER"              # 급여대장
    INSURANCE_CERTIFICATE = "INSURANCE_CERTIFICATE"  # 보험가입증명서
    DONATION_RECEIPT = "DONATION_RECEIPT"           # 기부금 영수증
    EDUCATION_RECEIPT = "EDUCATION_RECEIPT"         # 교육비 영수증
    MEDICAL_RECEIPT = "MEDICAL_RECEIPT"             # 의료비 영수증
    LEASE_CONTRACT = "LEASE_CONTRACT"               # 임대차계약서
    TAX_INVOICE = "TAX_INVOICE"                     # 세금계산서
    CREDIT_CARD_STATEMENT = "CREDIT_CARD_STATEMENT"  # 카드 사용 명세
    BANK_STATEMENT = "BANK_STATEMENT"               # 은행 거래내역
    RESEARCH_CERTIFICATE = "RESEARCH_CERTIFICATE"   # 연구소/전담부서 인정서
    OTHER = "OTHER"


class DocumentStatus(str, enum.Enum):
    UPLOADED = "UPLOADED"
    OCR_PROCESSING = "OCR_PROCESSING"
    OCR_COMPLETED = "OCR_COMPLETED"
    CLASSIFIED = "CLASSIFIED"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"


# ===== Models =====

class TaxDocument(Base):
    """증빙 서류 관리"""
    __tablename__ = "tax_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    correction_id = Column(UUID(as_uuid=True), ForeignKey("tax_corrections.id", ondelete="SET NULL"), nullable=True)

    # 파일 정보
    original_filename = Column(String(500), nullable=False)
    file_extension = Column(String(10), nullable=False)
    file_size_bytes = Column(Integer, nullable=True)
    mime_type = Column(String(100), nullable=True)

    # S3 저장
    s3_bucket = Column(String(100), nullable=True)
    s3_key = Column(String(500), nullable=True)
    """경로: tax-docs/{user_id}/{tax_year}/{document_type}/{uuid}.{ext}"""

    # 암호화
    encryption_algorithm = Column(String(20), default="AES-256-GCM", nullable=False)
    encryption_key_id = Column(String(100), nullable=True)

    # 분류
    document_type = Column(SQLEnum(DocumentType), default=DocumentType.OTHER, nullable=False)
    ai_classified_type = Column(SQLEnum(DocumentType), nullable=True)
    ai_classification_confidence = Column(Integer, nullable=True)  # 0-100
    tax_year = Column(Integer, nullable=True)
    deduction_category = Column(String(50), nullable=True)

    # OCR 결과
    ocr_status = Column(String(20), default="PENDING", nullable=False)
    ocr_provider = Column(String(30), nullable=True)  # CLOVA/GOOGLE_VISION
    ocr_result = Column(JSONB, default={}, nullable=False)
    """
    {
        "text": "...",
        "structured_data": {
            "vendor_name": "...",
            "amount": 5000000,
            "date": "2024-03-15",
            "items": [...]
        },
        "confidence": 0.95
    }
    """

    # 상태
    status = Column(SQLEnum(DocumentStatus), default=DocumentStatus.UPLOADED, nullable=False)
    verified_by = Column(String(100), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_doc_user", "user_id"),
        Index("ix_doc_correction", "correction_id"),
        Index("ix_doc_type", "document_type"),
        Index("ix_doc_status", "status"),
        Index("ix_doc_year", "tax_year"),
    )
