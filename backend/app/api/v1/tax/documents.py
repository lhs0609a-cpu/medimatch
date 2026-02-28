"""
증빙서류 관리 API

- 서류 업로드/다운로드 (S3 presigned URL)
- AI 자동 분류
- 경정청구별 서류 체크리스트
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid
import logging

from ...deps import get_db, get_current_active_user
from ..service_guards import require_active_service
from ....models.user import User
from ....models.service_subscription import ServiceSubscription, ServiceType
from ....models.tax_document import TaxDocument, DocumentType, DocumentStatus
from ....models.tax_correction import TaxCorrection, TaxDeduction, DeductionCategory

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================================
# Pydantic schemas
# ============================================================

class DocumentUploadRequest(BaseModel):
    original_filename: str
    file_extension: str
    mime_type: Optional[str] = None
    file_size_bytes: Optional[int] = None
    correction_id: Optional[str] = None
    document_type: str = "OTHER"
    tax_year: Optional[int] = None
    deduction_category: Optional[str] = None


# ============================================================
# Demo data
# ============================================================

def _generate_demo_documents() -> list[dict]:
    return [
        {
            "id": "demo-doc-001",
            "original_filename": "의료기기_구매영수증_2024.pdf",
            "file_extension": "pdf",
            "document_type": "PURCHASE_RECEIPT",
            "tax_year": 2024,
            "deduction_category": "EQUIPMENT_DEPRECIATION",
            "status": "VERIFIED",
            "ai_classified_type": "PURCHASE_RECEIPT",
            "ai_classification_confidence": 95,
            "created_at": "2025-03-01T09:00:00",
            "is_demo": True,
        },
        {
            "id": "demo-doc-002",
            "original_filename": "감가상각명세서_2024.xlsx",
            "file_extension": "xlsx",
            "document_type": "DEPRECIATION_SCHEDULE",
            "tax_year": 2024,
            "deduction_category": "EQUIPMENT_DEPRECIATION",
            "status": "CLASSIFIED",
            "ai_classified_type": "DEPRECIATION_SCHEDULE",
            "ai_classification_confidence": 92,
            "created_at": "2025-03-02T10:00:00",
            "is_demo": True,
        },
        {
            "id": "demo-doc-003",
            "original_filename": "근로계약서_직원A.pdf",
            "file_extension": "pdf",
            "document_type": "EMPLOYMENT_CONTRACT",
            "tax_year": 2024,
            "deduction_category": "EMPLOYMENT_TAX_CREDIT",
            "status": "UPLOADED",
            "ai_classified_type": None,
            "ai_classification_confidence": None,
            "created_at": "2025-03-05T14:00:00",
            "is_demo": True,
        },
    ]


def _generate_demo_checklist(correction_id: str) -> dict:
    return {
        "correction_id": correction_id,
        "total_required": 8,
        "uploaded": 3,
        "verified": 1,
        "missing": 5,
        "items": [
            {"document_type": "PURCHASE_RECEIPT", "label": "구매 영수증", "status": "VERIFIED", "uploaded_at": "2025-03-01T09:00:00"},
            {"document_type": "DEPRECIATION_SCHEDULE", "label": "감가상각명세서", "status": "CLASSIFIED", "uploaded_at": "2025-03-02T10:00:00"},
            {"document_type": "EMPLOYMENT_CONTRACT", "label": "근로계약서", "status": "UPLOADED", "uploaded_at": "2025-03-05T14:00:00"},
            {"document_type": "PAYROLL_LEDGER", "label": "급여대장", "status": "MISSING", "uploaded_at": None},
            {"document_type": "MEDICAL_RECEIPT", "label": "의료비 영수증", "status": "MISSING", "uploaded_at": None},
            {"document_type": "DONATION_RECEIPT", "label": "기부금 영수증", "status": "MISSING", "uploaded_at": None},
            {"document_type": "TAX_INVOICE", "label": "세금계산서", "status": "MISSING", "uploaded_at": None},
            {"document_type": "BANK_STATEMENT", "label": "은행 거래내역", "status": "MISSING", "uploaded_at": None},
        ],
        "is_demo": True,
    }


# ============================================================
# Helpers
# ============================================================

def _document_to_dict(doc: TaxDocument) -> dict:
    return {
        "id": str(doc.id),
        "original_filename": doc.original_filename,
        "file_extension": doc.file_extension,
        "file_size_bytes": doc.file_size_bytes,
        "mime_type": doc.mime_type,
        "document_type": doc.document_type.value if doc.document_type else None,
        "ai_classified_type": doc.ai_classified_type.value if doc.ai_classified_type else None,
        "ai_classification_confidence": doc.ai_classification_confidence,
        "tax_year": doc.tax_year,
        "deduction_category": doc.deduction_category,
        "correction_id": str(doc.correction_id) if doc.correction_id else None,
        "status": doc.status.value if doc.status else None,
        "ocr_status": doc.ocr_status,
        "verified_by": doc.verified_by,
        "verified_at": doc.verified_at.isoformat() if doc.verified_at else None,
        "created_at": doc.created_at.isoformat() if doc.created_at else None,
        "is_demo": False,
    }


def _generate_presigned_url(user_id: str, doc_id: str, action: str = "upload") -> str:
    """S3 presigned URL 시뮬레이션"""
    return f"https://s3.ap-northeast-2.amazonaws.com/medimatch-tax-docs/{user_id}/{doc_id}?X-Amz-Algorithm=AWS4-HMAC-SHA256&action={action}"


# ============================================================
# Endpoints
# ============================================================

@router.post("/upload")
async def upload_document(
    payload: DocumentUploadRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """증빙서류 업로드 (presigned URL 반환)"""
    try:
        doc_type = DocumentType(payload.document_type)
    except ValueError:
        doc_type = DocumentType.OTHER

    doc_id = uuid.uuid4()
    s3_key = f"tax-docs/{current_user.id}/{payload.tax_year or 'unknown'}/{doc_type.value}/{doc_id}.{payload.file_extension}"

    document = TaxDocument(
        id=doc_id,
        user_id=current_user.id,
        correction_id=payload.correction_id if payload.correction_id else None,
        original_filename=payload.original_filename,
        file_extension=payload.file_extension,
        file_size_bytes=payload.file_size_bytes,
        mime_type=payload.mime_type,
        s3_bucket="medimatch-tax-docs",
        s3_key=s3_key,
        document_type=doc_type,
        tax_year=payload.tax_year,
        deduction_category=payload.deduction_category,
        status=DocumentStatus.UPLOADED,
    )
    db.add(document)
    await db.flush()

    upload_url = _generate_presigned_url(str(current_user.id), str(doc_id), "upload")

    return {
        "id": str(document.id),
        "upload_url": upload_url,
        "s3_key": s3_key,
        "message": "presigned URL이 생성되었습니다. 이 URL로 파일을 업로드하세요.",
    }


@router.get("/")
async def list_documents(
    correction_id: Optional[str] = Query(None),
    document_type: Optional[str] = Query(None),
    tax_year: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """증빙서류 목록"""
    query = select(TaxDocument).where(
        TaxDocument.user_id == current_user.id
    ).order_by(TaxDocument.created_at.desc())

    if correction_id:
        query = query.where(TaxDocument.correction_id == correction_id)
    if document_type:
        query = query.where(TaxDocument.document_type == document_type)
    if tax_year:
        query = query.where(TaxDocument.tax_year == tax_year)

    result = await db.execute(query)
    documents = result.scalars().all()

    if not documents:
        return {"data": _generate_demo_documents(), "is_demo": True}

    return {"data": [_document_to_dict(d) for d in documents], "is_demo": False}


@router.get("/{document_id}")
async def get_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """증빙서류 상세"""
    result = await db.execute(
        select(TaxDocument).where(
            and_(
                TaxDocument.id == document_id,
                TaxDocument.user_id == current_user.id,
            )
        )
    )
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="서류를 찾을 수 없습니다")

    doc_dict = _document_to_dict(document)
    doc_dict["ocr_result"] = document.ocr_result
    return doc_dict


@router.get("/{document_id}/download")
async def get_download_url(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """증빙서류 다운로드 URL"""
    result = await db.execute(
        select(TaxDocument).where(
            and_(
                TaxDocument.id == document_id,
                TaxDocument.user_id == current_user.id,
            )
        )
    )
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="서류를 찾을 수 없습니다")

    download_url = _generate_presigned_url(str(current_user.id), str(document.id), "download")

    return {
        "id": str(document.id),
        "original_filename": document.original_filename,
        "download_url": download_url,
    }


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """증빙서류 삭제"""
    result = await db.execute(
        select(TaxDocument).where(
            and_(
                TaxDocument.id == document_id,
                TaxDocument.user_id == current_user.id,
            )
        )
    )
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="서류를 찾을 수 없습니다")

    if document.status == DocumentStatus.VERIFIED:
        raise HTTPException(status_code=400, detail="검증 완료된 서류는 삭제할 수 없습니다")

    await db.delete(document)
    return {"deleted": True, "id": document_id}


@router.post("/{document_id}/classify")
async def classify_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """AI 서류 분류 트리거"""
    result = await db.execute(
        select(TaxDocument).where(
            and_(
                TaxDocument.id == document_id,
                TaxDocument.user_id == current_user.id,
            )
        )
    )
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="서류를 찾을 수 없습니다")

    # AI 분류 시뮬레이션 (실제로는 OCR + ML 파이프라인)
    classification_map = {
        ".pdf": DocumentType.PURCHASE_RECEIPT,
        ".xlsx": DocumentType.DEPRECIATION_SCHEDULE,
        ".jpg": DocumentType.MEDICAL_RECEIPT,
        ".png": DocumentType.MEDICAL_RECEIPT,
    }
    ext = f".{document.file_extension.lower()}" if document.file_extension else ".pdf"
    classified_type = classification_map.get(ext, DocumentType.OTHER)

    # filename 기반 분류 보정
    filename_lower = (document.original_filename or "").lower()
    if "계약서" in filename_lower or "contract" in filename_lower:
        classified_type = DocumentType.EMPLOYMENT_CONTRACT
    elif "급여" in filename_lower or "payroll" in filename_lower:
        classified_type = DocumentType.PAYROLL_LEDGER
    elif "기부" in filename_lower or "donation" in filename_lower:
        classified_type = DocumentType.DONATION_RECEIPT
    elif "교육" in filename_lower or "education" in filename_lower:
        classified_type = DocumentType.EDUCATION_RECEIPT
    elif "카드" in filename_lower or "card" in filename_lower:
        classified_type = DocumentType.CREDIT_CARD_STATEMENT
    elif "은행" in filename_lower or "bank" in filename_lower:
        classified_type = DocumentType.BANK_STATEMENT
    elif "세금계산서" in filename_lower or "invoice" in filename_lower:
        classified_type = DocumentType.TAX_INVOICE
    elif "감가상각" in filename_lower or "depreciation" in filename_lower:
        classified_type = DocumentType.DEPRECIATION_SCHEDULE
    elif "보험" in filename_lower or "insurance" in filename_lower:
        classified_type = DocumentType.INSURANCE_CERTIFICATE

    document.ai_classified_type = classified_type
    document.ai_classification_confidence = 85  # 시뮬레이션
    document.status = DocumentStatus.CLASSIFIED
    document.updated_at = datetime.utcnow()

    return {
        "id": str(document.id),
        "ai_classified_type": classified_type.value,
        "ai_classification_confidence": 85,
        "status": "CLASSIFIED",
    }


@router.get("/checklist/{correction_id}")
async def get_document_checklist(
    correction_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """경정청구별 필요 서류 체크리스트"""
    # 경정청구 확인
    corr_result = await db.execute(
        select(TaxCorrection).where(
            and_(
                TaxCorrection.id == correction_id,
                TaxCorrection.user_id == current_user.id,
            )
        )
    )
    correction = corr_result.scalar_one_or_none()
    if not correction:
        return _generate_demo_checklist(correction_id)

    # 공제 항목별 필요 서류 매핑
    CATEGORY_DOCS = {
        DeductionCategory.MEDICAL_EXPENSE: [("MEDICAL_RECEIPT", "의료비 영수증")],
        DeductionCategory.EDUCATION: [("EDUCATION_RECEIPT", "교육비 영수증")],
        DeductionCategory.DONATION: [("DONATION_RECEIPT", "기부금 영수증")],
        DeductionCategory.EQUIPMENT_DEPRECIATION: [
            ("PURCHASE_RECEIPT", "의료기기 구매 영수증"),
            ("DEPRECIATION_SCHEDULE", "감가상각명세서"),
        ],
        DeductionCategory.EMPLOYMENT_TAX_CREDIT: [
            ("EMPLOYMENT_CONTRACT", "근로계약서"),
            ("PAYROLL_LEDGER", "급여대장"),
        ],
        DeductionCategory.CREDIT_CARD: [("CREDIT_CARD_STATEMENT", "카드 사용 명세")],
        DeductionCategory.RND_TAX_CREDIT: [("RESEARCH_CERTIFICATE", "연구소 인정서")],
    }

    # 공제 항목 조회
    ded_result = await db.execute(
        select(TaxDeduction).where(TaxDeduction.correction_id == correction.id)
    )
    deductions = ded_result.scalars().all()

    # 필요 서류 목록 생성
    required_docs = set()
    for ded in deductions:
        cat_docs = CATEGORY_DOCS.get(ded.category, [("OTHER", "기타 증빙")])
        for doc_type, label in cat_docs:
            required_docs.add((doc_type, label))

    # 기본 필수 서류 추가
    required_docs.add(("BANK_STATEMENT", "은행 거래내역"))
    required_docs.add(("TAX_INVOICE", "세금계산서"))

    # 업로드된 서류 조회
    doc_result = await db.execute(
        select(TaxDocument).where(
            and_(
                TaxDocument.correction_id == correction.id,
                TaxDocument.user_id == current_user.id,
            )
        )
    )
    uploaded_docs = doc_result.scalars().all()
    uploaded_types = {d.document_type.value: d for d in uploaded_docs if d.document_type}

    items = []
    for doc_type, label in sorted(required_docs):
        uploaded_doc = uploaded_types.get(doc_type)
        if uploaded_doc:
            status = uploaded_doc.status.value if uploaded_doc.status else "UPLOADED"
            uploaded_at = uploaded_doc.created_at.isoformat() if uploaded_doc.created_at else None
        else:
            status = "MISSING"
            uploaded_at = None
        items.append({
            "document_type": doc_type,
            "label": label,
            "status": status,
            "uploaded_at": uploaded_at,
        })

    uploaded_count = sum(1 for i in items if i["status"] != "MISSING")
    verified_count = sum(1 for i in items if i["status"] == "VERIFIED")
    missing_count = sum(1 for i in items if i["status"] == "MISSING")

    return {
        "correction_id": str(correction.id),
        "total_required": len(items),
        "uploaded": uploaded_count,
        "verified": verified_count,
        "missing": missing_count,
        "items": items,
        "is_demo": False,
    }
