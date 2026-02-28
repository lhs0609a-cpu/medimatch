"""
홈택스 연동 API

- 홈택스 인증 정보 등록/해제
- 신고 데이터 동기화
- 세무사 위임 관리
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
from ....models.tax_audit import HometaxCredential, HometaxAuthType
from ....models.tax_filing import TaxFilingHistory, FilingSyncStatus

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================================
# Pydantic schemas
# ============================================================

class HometaxConnectPayload(BaseModel):
    auth_type: str = "SIMPLE_AUTH"
    encrypted_credential: Optional[str] = None
    encryption_key_id: Optional[str] = None


class DelegatePayload(BaseModel):
    tax_accountant_name: str
    tax_accountant_license: str
    delegation_scope: list[str] = ["소득세_조회", "경정청구", "증빙_조회"]
    delegation_end: Optional[str] = None


# ============================================================
# Demo data
# ============================================================

def _generate_demo_connection_status() -> dict:
    return {
        "connected": True,
        "auth_type": "SIMPLE_AUTH",
        "last_used_at": "2025-06-01T10:00:00",
        "expires_at": "2026-06-01T00:00:00",
        "delegation": {
            "tax_accountant_name": "김세무",
            "tax_accountant_license": "제2020-12345호",
            "delegation_scope": ["소득세_조회", "경정청구", "증빙_조회"],
        },
        "is_demo": True,
    }


def _generate_demo_filings() -> list[dict]:
    return [
        {
            "id": 1,
            "tax_year": 2024,
            "filing_type": "INCOME_TAX",
            "gross_income": 180_000_000,
            "business_income": 150_000_000,
            "necessary_expenses": 95_000_000,
            "deductions_total": 12_000_000,
            "credits_total": 3_500_000,
            "taxable_income": 73_000_000,
            "calculated_tax": 15_940_000,
            "final_tax": 12_440_000,
            "tax_paid": 12_440_000,
            "sync_status": "COMPLETED",
            "synced_at": "2025-05-15T10:00:00",
            "is_demo": True,
        },
        {
            "id": 2,
            "tax_year": 2023,
            "filing_type": "INCOME_TAX",
            "gross_income": 165_000_000,
            "business_income": 140_000_000,
            "necessary_expenses": 88_000_000,
            "deductions_total": 10_500_000,
            "credits_total": 2_800_000,
            "taxable_income": 66_500_000,
            "calculated_tax": 13_580_000,
            "final_tax": 10_780_000,
            "tax_paid": 10_780_000,
            "sync_status": "COMPLETED",
            "synced_at": "2025-05-15T10:00:00",
            "is_demo": True,
        },
    ]


def _generate_demo_filing_detail(year: int) -> dict:
    return {
        "tax_year": year,
        "filing_type": "INCOME_TAX",
        "gross_income": 180_000_000,
        "business_income": 150_000_000,
        "salary_income": 0,
        "other_income": 30_000_000,
        "necessary_expenses": 95_000_000,
        "expense_breakdown": {
            "인건비": 45_000_000,
            "임차료": 18_000_000,
            "재료비": 15_000_000,
            "감가상각비": 8_000_000,
            "기타": 9_000_000,
        },
        "deductions_total": 12_000_000,
        "deductions_breakdown": {
            "기본공제": 1_500_000,
            "국민연금": 4_500_000,
            "건강보험": 3_200_000,
            "신용카드": 2_800_000,
        },
        "credits_total": 3_500_000,
        "credits_breakdown": {
            "의료비": 1_200_000,
            "교육비": 800_000,
            "기부금": 500_000,
            "퇴직연금": 1_000_000,
        },
        "taxable_income": 73_000_000,
        "calculated_tax": 15_940_000,
        "final_tax": 12_440_000,
        "tax_paid": 12_440_000,
        "is_demo": True,
    }


# ============================================================
# Endpoints
# ============================================================

@router.post("/connect")
async def connect_hometax(
    payload: HometaxConnectPayload,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """홈택스 인증 정보 등록"""
    try:
        auth_type = HometaxAuthType(payload.auth_type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"유효하지 않은 인증 방식: {payload.auth_type}")

    # 기존 인증 정보 확인
    result = await db.execute(
        select(HometaxCredential).where(HometaxCredential.user_id == current_user.id)
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.auth_type = auth_type
        existing.encrypted_credential = payload.encrypted_credential
        existing.encryption_key_id = payload.encryption_key_id
        existing.is_active = True
        existing.updated_at = datetime.utcnow()
        credential = existing
    else:
        credential = HometaxCredential(
            user_id=current_user.id,
            auth_type=auth_type,
            encrypted_credential=payload.encrypted_credential,
            encryption_key_id=payload.encryption_key_id,
            is_active=True,
        )
        db.add(credential)

    await db.flush()

    return {
        "id": credential.id,
        "auth_type": auth_type.value,
        "connected": True,
        "message": "홈택스 연결이 완료되었습니다",
    }


@router.get("/status")
async def get_connection_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """홈택스 연결 상태 확인"""
    result = await db.execute(
        select(HometaxCredential).where(
            and_(
                HometaxCredential.user_id == current_user.id,
                HometaxCredential.is_active == True,
            )
        )
    )
    credential = result.scalar_one_or_none()

    if not credential:
        return _generate_demo_connection_status()

    delegation = None
    if credential.auth_type == HometaxAuthType.DELEGATION:
        delegation = {
            "tax_accountant_name": credential.tax_accountant_name,
            "tax_accountant_license": credential.tax_accountant_license,
            "delegation_scope": credential.delegation_scope,
            "delegation_start": credential.delegation_start.isoformat() if credential.delegation_start else None,
            "delegation_end": credential.delegation_end.isoformat() if credential.delegation_end else None,
        }

    return {
        "connected": True,
        "auth_type": credential.auth_type.value,
        "last_used_at": credential.last_used_at.isoformat() if credential.last_used_at else None,
        "expires_at": credential.expires_at.isoformat() if credential.expires_at else None,
        "delegation": delegation,
        "is_demo": False,
    }


@router.post("/sync")
async def trigger_sync(
    tax_years: list[int] = Query(default=[2021, 2022, 2023, 2024, 2025], description="동기화할 세무연도"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """홈택스 데이터 동기화 트리거 (비동기 작업)"""
    # 인증 정보 확인
    cred_result = await db.execute(
        select(HometaxCredential).where(
            and_(
                HometaxCredential.user_id == current_user.id,
                HometaxCredential.is_active == True,
            )
        )
    )
    credential = cred_result.scalar_one_or_none()

    if not credential:
        # 데모 모드
        task_id = str(uuid.uuid4())
        return {
            "task_id": task_id,
            "tax_years": tax_years,
            "status": "DEMO_COMPLETED",
            "message": "홈택스 연결이 없어 데모 데이터를 사용합니다",
            "is_demo": True,
        }

    # 실제 동기화 태스크 생성 (Celery task ID 시뮬레이션)
    task_id = str(uuid.uuid4())

    # 동기화 이력 생성
    for year in tax_years:
        existing = await db.execute(
            select(TaxFilingHistory).where(
                and_(
                    TaxFilingHistory.user_id == current_user.id,
                    TaxFilingHistory.tax_year == year,
                )
            )
        )
        filing = existing.scalar_one_or_none()
        if not filing:
            filing = TaxFilingHistory(
                user_id=current_user.id,
                tax_year=year,
                sync_status=FilingSyncStatus.SYNCING,
                synced_from="HOMETAX",
            )
            db.add(filing)
        else:
            filing.sync_status = FilingSyncStatus.SYNCING
            filing.updated_at = datetime.utcnow()

    credential.last_used_at = datetime.utcnow()
    await db.flush()

    return {
        "task_id": task_id,
        "tax_years": tax_years,
        "status": "SYNCING",
        "message": "동기화가 시작되었습니다. 상태를 확인해주세요.",
        "is_demo": False,
    }


@router.get("/sync/{task_id}/status")
async def get_sync_status(
    task_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """동기화 상태 확인"""
    # 실제로는 Celery task 상태를 조회하지만, 현재는 DB에서 확인
    result = await db.execute(
        select(TaxFilingHistory).where(
            TaxFilingHistory.user_id == current_user.id
        ).order_by(TaxFilingHistory.updated_at.desc())
    )
    filings = result.scalars().all()

    if not filings:
        return {
            "task_id": task_id,
            "status": "COMPLETED",
            "synced_years": [],
            "message": "동기화 데이터가 없습니다 (데모 모드)",
            "is_demo": True,
        }

    synced = [f for f in filings if f.sync_status == FilingSyncStatus.COMPLETED]
    syncing = [f for f in filings if f.sync_status == FilingSyncStatus.SYNCING]
    failed = [f for f in filings if f.sync_status == FilingSyncStatus.FAILED]

    overall_status = "COMPLETED"
    if syncing:
        overall_status = "SYNCING"
    elif failed and not synced:
        overall_status = "FAILED"
    elif failed and synced:
        overall_status = "PARTIAL"

    return {
        "task_id": task_id,
        "status": overall_status,
        "synced_years": [f.tax_year for f in synced],
        "syncing_years": [f.tax_year for f in syncing],
        "failed_years": [f.tax_year for f in failed],
        "is_demo": False,
    }


@router.get("/filings")
async def list_filings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """동기화된 신고 이력 목록"""
    result = await db.execute(
        select(TaxFilingHistory)
        .where(TaxFilingHistory.user_id == current_user.id)
        .order_by(TaxFilingHistory.tax_year.desc())
    )
    filings = result.scalars().all()

    if not filings:
        return {"data": _generate_demo_filings(), "is_demo": True}

    data = []
    for f in filings:
        data.append({
            "id": f.id,
            "tax_year": f.tax_year,
            "filing_type": f.filing_type.value if f.filing_type else None,
            "gross_income": f.gross_income,
            "business_income": f.business_income,
            "necessary_expenses": f.necessary_expenses,
            "deductions_total": f.deductions_total,
            "credits_total": f.credits_total,
            "taxable_income": f.taxable_income,
            "calculated_tax": f.calculated_tax,
            "final_tax": f.final_tax,
            "tax_paid": f.tax_paid,
            "sync_status": f.sync_status.value if f.sync_status else None,
            "synced_at": f.synced_at.isoformat() if f.synced_at else None,
            "is_demo": False,
        })

    return {"data": data, "is_demo": False}


@router.get("/filings/{year}")
async def get_filing_detail(
    year: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """특정 연도 신고 상세"""
    result = await db.execute(
        select(TaxFilingHistory).where(
            and_(
                TaxFilingHistory.user_id == current_user.id,
                TaxFilingHistory.tax_year == year,
            )
        )
    )
    filing = result.scalar_one_or_none()

    if not filing:
        return _generate_demo_filing_detail(year)

    return {
        "id": filing.id,
        "tax_year": filing.tax_year,
        "filing_type": filing.filing_type.value if filing.filing_type else None,
        "filing_period": filing.filing_period,
        "gross_income": filing.gross_income,
        "business_income": filing.business_income,
        "salary_income": filing.salary_income,
        "other_income": filing.other_income,
        "necessary_expenses": filing.necessary_expenses,
        "expense_breakdown": filing.expense_breakdown,
        "deductions_total": filing.deductions_total,
        "deductions_breakdown": filing.deductions_breakdown,
        "credits_total": filing.credits_total,
        "credits_breakdown": filing.credits_breakdown,
        "taxable_income": filing.taxable_income,
        "calculated_tax": filing.calculated_tax,
        "final_tax": filing.final_tax,
        "tax_paid": filing.tax_paid,
        "sync_status": filing.sync_status.value if filing.sync_status else None,
        "synced_from": filing.synced_from,
        "synced_at": filing.synced_at.isoformat() if filing.synced_at else None,
        "is_demo": False,
    }


@router.delete("/disconnect")
async def disconnect_hometax(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """홈택스 연결 해제"""
    result = await db.execute(
        select(HometaxCredential).where(HometaxCredential.user_id == current_user.id)
    )
    credential = result.scalar_one_or_none()

    if not credential:
        raise HTTPException(status_code=404, detail="홈택스 연결 정보가 없습니다")

    credential.is_active = False
    credential.encrypted_credential = None
    credential.updated_at = datetime.utcnow()

    return {"disconnected": True, "message": "홈택스 연결이 해제되었습니다"}


@router.post("/delegate")
async def register_delegation(
    payload: DelegatePayload,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """세무사 위임 등록"""
    result = await db.execute(
        select(HometaxCredential).where(HometaxCredential.user_id == current_user.id)
    )
    credential = result.scalar_one_or_none()

    if not credential:
        credential = HometaxCredential(
            user_id=current_user.id,
            auth_type=HometaxAuthType.DELEGATION,
            is_active=True,
        )
        db.add(credential)
    else:
        credential.auth_type = HometaxAuthType.DELEGATION

    credential.tax_accountant_name = payload.tax_accountant_name
    credential.tax_accountant_license = payload.tax_accountant_license
    credential.delegation_scope = payload.delegation_scope
    credential.delegation_start = datetime.utcnow()
    if payload.delegation_end:
        try:
            credential.delegation_end = datetime.fromisoformat(payload.delegation_end)
        except ValueError:
            pass
    credential.is_active = True
    credential.updated_at = datetime.utcnow()

    await db.flush()

    return {
        "id": credential.id,
        "auth_type": "DELEGATION",
        "tax_accountant_name": payload.tax_accountant_name,
        "delegation_scope": payload.delegation_scope,
        "message": "세무사 위임이 등록되었습니다",
    }


@router.get("/delegate")
async def get_delegation_info(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """세무사 위임 정보 조회"""
    result = await db.execute(
        select(HometaxCredential).where(
            and_(
                HometaxCredential.user_id == current_user.id,
                HometaxCredential.auth_type == HometaxAuthType.DELEGATION,
                HometaxCredential.is_active == True,
            )
        )
    )
    credential = result.scalar_one_or_none()

    if not credential:
        return {
            "has_delegation": False,
            "delegation": {
                "tax_accountant_name": "김세무",
                "tax_accountant_license": "제2020-12345호",
                "delegation_scope": ["소득세_조회", "경정청구", "증빙_조회"],
                "delegation_start": "2025-01-01T00:00:00",
                "delegation_end": "2025-12-31T23:59:59",
            },
            "is_demo": True,
        }

    return {
        "has_delegation": True,
        "delegation": {
            "tax_accountant_name": credential.tax_accountant_name,
            "tax_accountant_license": credential.tax_accountant_license,
            "delegation_scope": credential.delegation_scope,
            "delegation_start": credential.delegation_start.isoformat() if credential.delegation_start else None,
            "delegation_end": credential.delegation_end.isoformat() if credential.delegation_end else None,
        },
        "is_demo": False,
    }


@router.delete("/delegate")
async def remove_delegation(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """세무사 위임 해제"""
    result = await db.execute(
        select(HometaxCredential).where(
            and_(
                HometaxCredential.user_id == current_user.id,
                HometaxCredential.auth_type == HometaxAuthType.DELEGATION,
            )
        )
    )
    credential = result.scalar_one_or_none()

    if not credential:
        raise HTTPException(status_code=404, detail="세무사 위임 정보가 없습니다")

    credential.is_active = False
    credential.tax_accountant_name = None
    credential.tax_accountant_license = None
    credential.delegation_scope = []
    credential.delegation_end = datetime.utcnow()
    credential.updated_at = datetime.utcnow()

    return {"removed": True, "message": "세무사 위임이 해제되었습니다"}
