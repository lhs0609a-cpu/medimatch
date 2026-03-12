"""
관리유지비 정기결제 API

- 관리자: 계약 CRUD, 대시보드, 프리셋, 초대/독촉 이메일
- 고객: 내 계약 조회, 카드 등록/변경, 미납 재결제, 해지
- 요청 게시판: 요청 등록/조회, 댓글, 상태 변경
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timedelta
import uuid
import logging

from ..deps import get_db, get_current_active_user
from ...models.user import User, UserRole
from ...models.payment import Payment, PaymentStatus, PaymentMethod
from ...models.maintenance import (
    MaintenanceContract, MaintenanceRequest, MaintenanceComment, MaintenancePlanPreset,
    MaintenanceStatus, MaintenanceServiceType,
    RequestCategory, RequestStatus, RequestPriority,
)
from ...services.toss_payments import toss_payments_service
from ...services.email import (
    send_maintenance_invite, send_payment_success, send_request_reply,
    send_payment_reminder,
)
from ...core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

PERIOD_DAYS = 30
MAX_RETRY = 3

SERVICE_NAMES = {
    MaintenanceServiceType.HOMEPAGE: "홈페이지",
    MaintenanceServiceType.PROGRAM: "프로그램",
}


# ============================================================
# 관리자 권한
# ============================================================

async def require_admin(current_user: User = Depends(get_current_active_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다")
    return current_user


# ============================================================
# Schemas
# ============================================================

class ContractCreateRequest(BaseModel):
    project_name: str = Field(..., min_length=1, max_length=200)
    service_type: MaintenanceServiceType
    monthly_amount: int = Field(..., gt=0)
    billing_day: int = Field(1, ge=1, le=28)
    company_name: Optional[str] = None
    contact_person: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    description: Optional[str] = None
    admin_memo: Optional[str] = None
    user_id: Optional[str] = None  # 기존 유저 연결 (UUID)


class ContractUpdateRequest(BaseModel):
    project_name: Optional[str] = None
    monthly_amount: Optional[int] = None
    billing_day: Optional[int] = None
    company_name: Optional[str] = None
    contact_person: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    description: Optional[str] = None


class MemoUpdateRequest(BaseModel):
    memo: str


class SetupBillingRequest(BaseModel):
    contract_id: int
    auth_key: str
    customer_key: str


class ChangeCardRequest(BaseModel):
    auth_key: str
    customer_key: str


class CancelRequest(BaseModel):
    reason: Optional[str] = None


class CreateRequestBody(BaseModel):
    category: RequestCategory
    priority: RequestPriority = RequestPriority.NORMAL
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)


class CreateCommentBody(BaseModel):
    content: str = Field(..., min_length=1)
    is_internal: bool = False


class StatusUpdateBody(BaseModel):
    status: RequestStatus


class PresetCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    amount: int = Field(..., gt=0)
    description: Optional[str] = None
    sort_order: int = 0


# ============================================================
# Helper
# ============================================================

def _contract_to_dict(c: MaintenanceContract) -> dict:
    return {
        "id": c.id,
        "user_id": str(c.user_id) if c.user_id else None,
        "project_name": c.project_name,
        "service_type": c.service_type.value,
        "monthly_amount": c.monthly_amount,
        "billing_day": c.billing_day,
        "company_name": c.company_name,
        "contact_person": c.contact_person,
        "contact_email": c.contact_email,
        "contact_phone": c.contact_phone,
        "card_company": c.card_company,
        "card_number": c.card_number,
        "status": c.status.value,
        "contract_start_date": c.contract_start_date.isoformat() if c.contract_start_date else None,
        "current_period_start": c.current_period_start.isoformat() if c.current_period_start else None,
        "current_period_end": c.current_period_end.isoformat() if c.current_period_end else None,
        "next_billing_date": c.next_billing_date.isoformat() if c.next_billing_date else None,
        "retry_count": c.retry_count,
        "total_paid": c.total_paid,
        "total_months": c.total_months,
        "admin_memo": c.admin_memo,
        "description": c.description,
        "canceled_at": c.canceled_at.isoformat() if c.canceled_at else None,
        "cancel_reason": c.cancel_reason,
        "created_at": c.created_at.isoformat() if c.created_at else None,
        "updated_at": c.updated_at.isoformat() if c.updated_at else None,
    }


# ============================================================
# 관리자 API
# ============================================================

@router.get("/admin/contracts")
async def admin_list_contracts(
    status: Optional[str] = None,
    service_type: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """관리자: 계약 목록 (필터, 검색, 페이지네이션)"""
    query = select(MaintenanceContract)
    count_query = select(func.count(MaintenanceContract.id))

    conditions = []
    if status:
        conditions.append(MaintenanceContract.status == status)
    if service_type:
        conditions.append(MaintenanceContract.service_type == service_type)
    if search:
        like = f"%{search}%"
        conditions.append(
            or_(
                MaintenanceContract.project_name.ilike(like),
                MaintenanceContract.company_name.ilike(like),
                MaintenanceContract.contact_person.ilike(like),
            )
        )

    if conditions:
        query = query.where(and_(*conditions))
        count_query = count_query.where(and_(*conditions))

    total = (await db.execute(count_query)).scalar() or 0

    result = await db.execute(
        query.order_by(desc(MaintenanceContract.created_at))
        .offset((page - 1) * size)
        .limit(size)
    )
    contracts = result.scalars().all()

    return {
        "items": [_contract_to_dict(c) for c in contracts],
        "total": total,
        "page": page,
        "size": size,
    }


@router.get("/admin/dashboard")
async def admin_dashboard(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """관리자: 대시보드 통계"""
    now = datetime.utcnow()

    # MRR (Active contracts monthly total)
    mrr_result = await db.execute(
        select(func.coalesce(func.sum(MaintenanceContract.monthly_amount), 0)).where(
            MaintenanceContract.status == MaintenanceStatus.ACTIVE
        )
    )
    mrr = mrr_result.scalar() or 0

    # 각 상태별 건수
    status_counts = {}
    for s in MaintenanceStatus:
        cnt = await db.execute(
            select(func.count(MaintenanceContract.id)).where(
                MaintenanceContract.status == s
            )
        )
        status_counts[s.value] = cnt.scalar() or 0

    # 미처리 요청
    pending_requests = await db.execute(
        select(func.count(MaintenanceRequest.id)).where(
            MaintenanceRequest.status.in_([RequestStatus.RECEIVED, RequestStatus.IN_PROGRESS])
        )
    )
    pending_req_count = pending_requests.scalar() or 0

    # 이번달 결제 예정
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if now.month == 12:
        month_end = month_start.replace(year=now.year + 1, month=1)
    else:
        month_end = month_start.replace(month=now.month + 1)

    upcoming = await db.execute(
        select(func.count(MaintenanceContract.id)).where(
            and_(
                MaintenanceContract.status == MaintenanceStatus.ACTIVE,
                MaintenanceContract.next_billing_date >= month_start,
                MaintenanceContract.next_billing_date < month_end,
            )
        )
    )
    upcoming_count = upcoming.scalar() or 0

    return {
        "mrr": mrr,
        "status_counts": status_counts,
        "pending_requests": pending_req_count,
        "upcoming_billing_this_month": upcoming_count,
        "total_contracts": sum(status_counts.values()),
    }


@router.post("/admin/contracts")
async def admin_create_contract(
    data: ContractCreateRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """관리자: 새 계약 생성 → 초대 이메일 발송"""
    user_id = None
    if data.user_id:
        try:
            user_id = uuid.UUID(data.user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="유효하지 않은 user_id")

    contract = MaintenanceContract(
        user_id=user_id,
        created_by=admin.id,
        project_name=data.project_name,
        service_type=data.service_type,
        monthly_amount=data.monthly_amount,
        billing_day=data.billing_day,
        company_name=data.company_name,
        contact_person=data.contact_person,
        contact_email=data.contact_email,
        contact_phone=data.contact_phone,
        description=data.description,
        admin_memo=data.admin_memo,
        status=MaintenanceStatus.PENDING_SETUP,
    )
    db.add(contract)
    await db.flush()

    # 초대 이메일 발송
    if data.contact_email:
        base_url = str(settings.FRONTEND_URL).rstrip("/")
        setup_url = f"{base_url}/my/maintenance?setup={contract.id}"
        try:
            await send_maintenance_invite(
                to_email=data.contact_email,
                contact_person=data.contact_person or data.company_name or "고객",
                project_name=data.project_name,
                monthly_amount=data.monthly_amount,
                setup_url=setup_url,
            )
        except Exception as e:
            logger.warning(f"Failed to send invite email for contract {contract.id}: {e}")

    return {
        "contract": _contract_to_dict(contract),
        "message": "계약이 생성되었습니다.",
    }


@router.put("/admin/contracts/{contract_id}")
async def admin_update_contract(
    contract_id: int,
    data: ContractUpdateRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """관리자: 계약 수정"""
    result = await db.execute(
        select(MaintenanceContract).where(MaintenanceContract.id == contract_id)
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=404, detail="계약을 찾을 수 없습니다")

    if data.project_name is not None:
        contract.project_name = data.project_name
    if data.monthly_amount is not None:
        contract.monthly_amount = data.monthly_amount
    if data.billing_day is not None:
        contract.billing_day = data.billing_day
    if data.company_name is not None:
        contract.company_name = data.company_name
    if data.contact_person is not None:
        contract.contact_person = data.contact_person
    if data.contact_email is not None:
        contract.contact_email = data.contact_email
    if data.contact_phone is not None:
        contract.contact_phone = data.contact_phone
    if data.description is not None:
        contract.description = data.description
    contract.updated_at = datetime.utcnow()

    return {"contract": _contract_to_dict(contract), "message": "수정되었습니다."}


@router.post("/admin/contracts/{contract_id}/suspend")
async def admin_suspend_contract(
    contract_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """관리자: 강제 정지"""
    result = await db.execute(
        select(MaintenanceContract).where(MaintenanceContract.id == contract_id)
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=404, detail="계약을 찾을 수 없습니다")

    contract.status = MaintenanceStatus.SUSPENDED
    contract.updated_at = datetime.utcnow()
    return {"status": contract.status.value, "message": "서비스가 정지되었습니다."}


@router.post("/admin/contracts/{contract_id}/activate")
async def admin_activate_contract(
    contract_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """관리자: 수동 활성화"""
    result = await db.execute(
        select(MaintenanceContract).where(MaintenanceContract.id == contract_id)
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=404, detail="계약을 찾을 수 없습니다")

    now = datetime.utcnow()
    contract.status = MaintenanceStatus.ACTIVE
    contract.retry_count = 0
    if not contract.current_period_start:
        contract.current_period_start = now
        contract.current_period_end = now + timedelta(days=PERIOD_DAYS)
        contract.next_billing_date = now + timedelta(days=PERIOD_DAYS)
        contract.contract_start_date = now
    contract.updated_at = now
    return {"status": contract.status.value, "message": "서비스가 활성화되었습니다."}


@router.put("/admin/contracts/{contract_id}/memo")
async def admin_update_memo(
    contract_id: int,
    data: MemoUpdateRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """관리자: 메모 수정"""
    result = await db.execute(
        select(MaintenanceContract).where(MaintenanceContract.id == contract_id)
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=404, detail="계약을 찾을 수 없습니다")

    contract.admin_memo = data.memo
    contract.updated_at = datetime.utcnow()
    return {"message": "메모가 저장되었습니다."}


@router.post("/admin/contracts/{contract_id}/send-invite")
async def admin_send_invite(
    contract_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """관리자: 초대 이메일 재발송"""
    result = await db.execute(
        select(MaintenanceContract).where(MaintenanceContract.id == contract_id)
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=404, detail="계약을 찾을 수 없습니다")
    if not contract.contact_email:
        raise HTTPException(status_code=400, detail="이메일 주소가 없습니다")

    base_url = str(settings.FRONTEND_URL).rstrip("/")
    setup_url = f"{base_url}/my/maintenance?setup={contract.id}"
    sent = await send_maintenance_invite(
        to_email=contract.contact_email,
        contact_person=contract.contact_person or "고객",
        project_name=contract.project_name,
        monthly_amount=contract.monthly_amount,
        setup_url=setup_url,
    )
    return {"sent": sent, "message": "초대 이메일이 발송되었습니다." if sent else "이메일 발송에 실패했습니다."}


@router.post("/admin/contracts/{contract_id}/send-reminder")
async def admin_send_reminder(
    contract_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """관리자: 독촉/리마인더 이메일"""
    result = await db.execute(
        select(MaintenanceContract).where(MaintenanceContract.id == contract_id)
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=404, detail="계약을 찾을 수 없습니다")
    if not contract.contact_email:
        raise HTTPException(status_code=400, detail="이메일 주소가 없습니다")

    base_url = str(settings.FRONTEND_URL).rstrip("/")
    setup_url = f"{base_url}/my/maintenance?setup={contract.id}"
    days_since = (datetime.utcnow() - contract.created_at).days if contract.created_at else 0
    sent = await send_payment_reminder(
        to_email=contract.contact_email,
        contact_person=contract.contact_person or "고객",
        project_name=contract.project_name,
        setup_url=setup_url,
        days_since=days_since,
    )
    return {"sent": sent, "message": "리마인더가 발송되었습니다." if sent else "발송 실패"}


# ===== 프리셋 CRUD =====

@router.get("/admin/presets")
async def admin_list_presets(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """관리자: 프리셋 목록"""
    result = await db.execute(
        select(MaintenancePlanPreset).order_by(MaintenancePlanPreset.sort_order)
    )
    presets = result.scalars().all()
    return {
        "items": [
            {"id": p.id, "name": p.name, "amount": p.amount, "description": p.description, "sort_order": p.sort_order}
            for p in presets
        ]
    }


@router.post("/admin/presets")
async def admin_create_preset(
    data: PresetCreateRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """관리자: 프리셋 추가"""
    preset = MaintenancePlanPreset(
        name=data.name, amount=data.amount,
        description=data.description, sort_order=data.sort_order,
    )
    db.add(preset)
    await db.flush()
    return {"id": preset.id, "message": "프리셋이 추가되었습니다."}


@router.put("/admin/presets/{preset_id}")
async def admin_update_preset(
    preset_id: int,
    data: PresetCreateRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """관리자: 프리셋 수정"""
    result = await db.execute(
        select(MaintenancePlanPreset).where(MaintenancePlanPreset.id == preset_id)
    )
    preset = result.scalar_one_or_none()
    if not preset:
        raise HTTPException(status_code=404, detail="프리셋을 찾을 수 없습니다")

    preset.name = data.name
    preset.amount = data.amount
    preset.description = data.description
    preset.sort_order = data.sort_order
    return {"message": "프리셋이 수정되었습니다."}


@router.delete("/admin/presets/{preset_id}")
async def admin_delete_preset(
    preset_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """관리자: 프리셋 삭제"""
    result = await db.execute(
        select(MaintenancePlanPreset).where(MaintenancePlanPreset.id == preset_id)
    )
    preset = result.scalar_one_or_none()
    if not preset:
        raise HTTPException(status_code=404, detail="프리셋을 찾을 수 없습니다")
    await db.delete(preset)
    return {"message": "프리셋이 삭제되었습니다."}


# ===== 관리자: 요청 전체 목록 =====

@router.get("/admin/requests")
async def admin_list_all_requests(
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """관리자: 전체 요청 목록"""
    query = select(MaintenanceRequest)
    count_query = select(func.count(MaintenanceRequest.id))

    if status:
        query = query.where(MaintenanceRequest.status == status)
        count_query = count_query.where(MaintenanceRequest.status == status)

    total = (await db.execute(count_query)).scalar() or 0
    result = await db.execute(
        query.order_by(desc(MaintenanceRequest.created_at))
        .offset((page - 1) * size).limit(size)
    )
    requests = result.scalars().all()

    items = []
    for r in requests:
        # contract info
        c_result = await db.execute(
            select(MaintenanceContract.project_name, MaintenanceContract.company_name)
            .where(MaintenanceContract.id == r.contract_id)
        )
        c_info = c_result.first()
        items.append({
            "id": r.id,
            "contract_id": r.contract_id,
            "project_name": c_info[0] if c_info else None,
            "company_name": c_info[1] if c_info else None,
            "category": r.category.value,
            "priority": r.priority.value,
            "title": r.title,
            "status": r.status.value,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })

    return {"items": items, "total": total, "page": page, "size": size}


# ============================================================
# 고객 API
# ============================================================

@router.get("/my-contracts")
async def get_my_contracts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """고객: 내 계약 목록"""
    result = await db.execute(
        select(MaintenanceContract).where(
            MaintenanceContract.user_id == current_user.id
        ).order_by(desc(MaintenanceContract.created_at))
    )
    contracts = result.scalars().all()

    # user_id가 없는 경우 이메일로도 검색
    if not contracts and current_user.email:
        result2 = await db.execute(
            select(MaintenanceContract).where(
                MaintenanceContract.contact_email == current_user.email
            ).order_by(desc(MaintenanceContract.created_at))
        )
        contracts = result2.scalars().all()
        # 찾았으면 user_id 연결
        for c in contracts:
            if not c.user_id:
                c.user_id = current_user.id

    return {"items": [_contract_to_dict(c) for c in contracts]}


@router.get("/config/{contract_id}")
async def get_billing_config(
    contract_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """고객: Toss 빌링 설정"""
    result = await db.execute(
        select(MaintenanceContract).where(MaintenanceContract.id == contract_id)
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=404, detail="계약을 찾을 수 없습니다")

    # 본인 계약 또는 이메일 매칭 확인
    if contract.user_id and contract.user_id != current_user.id:
        if contract.contact_email != current_user.email:
            raise HTTPException(status_code=403, detail="접근 권한이 없습니다")

    billing_client_key = getattr(settings, 'TOSS_BILLING_CLIENT_KEY', '') or settings.TOSS_CLIENT_KEY
    customer_key = f"maint_{contract.id}_{current_user.id}"

    base_url = str(settings.FRONTEND_URL).rstrip("/")
    svc_name = SERVICE_NAMES.get(contract.service_type, "관리유지비")

    return {
        "clientKey": billing_client_key,
        "customerKey": customer_key,
        "amount": contract.monthly_amount,
        "successUrl": f"{base_url}/my/maintenance/setup/callback?contractId={contract.id}",
        "failUrl": f"{base_url}/my/maintenance?fail=true",
        "orderName": f"{contract.project_name} {svc_name} 관리유지비 (월)",
    }


@router.post("/setup-billing")
async def setup_billing(
    data: SetupBillingRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """고객: 카드 등록 + 첫 결제 → ACTIVE"""
    result = await db.execute(
        select(MaintenanceContract).where(MaintenanceContract.id == data.contract_id)
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=404, detail="계약을 찾을 수 없습니다")

    if contract.status not in (MaintenanceStatus.PENDING_SETUP, MaintenanceStatus.SUSPENDED):
        raise HTTPException(status_code=400, detail=f"현재 상태({contract.status.value})에서는 카드 등록이 불가합니다")

    # 빌링키 발급
    billing_result = await toss_payments_service.issue_billing_key(
        auth_key=data.auth_key,
        customer_key=data.customer_key,
    )
    if not billing_result.get("success"):
        raise HTTPException(
            status_code=400,
            detail=billing_result.get("error_message", "빌링키 발급 실패")
        )

    billing_key = billing_result["billingKey"]
    now = datetime.utcnow()

    # 첫 결제
    order_id = f"MAINT_{contract.id}_{now.strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:6]}"
    svc_name = SERVICE_NAMES.get(contract.service_type, "관리유지비")
    order_name = f"{contract.project_name} {svc_name} 관리유지비 (월)"
    product_id = f"maintenance_{contract.service_type.value.lower()}_{contract.id}"

    charge_result = await toss_payments_service.charge_billing_key(
        billing_key=billing_key,
        customer_key=data.customer_key,
        amount=contract.monthly_amount,
        order_id=order_id,
        order_name=order_name,
    )
    if not charge_result.get("success"):
        raise HTTPException(
            status_code=400,
            detail=charge_result.get("error_message", "첫 결제 실패")
        )

    # Payment 기록
    payment = Payment(
        user_id=current_user.id,
        order_id=order_id,
        payment_key=charge_result.get("paymentKey"),
        product_id=product_id,
        product_name=order_name,
        amount=contract.monthly_amount,
        status=PaymentStatus.COMPLETED,
        method=PaymentMethod.CARD,
        card_company=charge_result.get("cardCompany"),
        card_number=charge_result.get("cardNumber"),
        receipt_url=charge_result.get("receipt_url"),
        paid_at=now,
    )
    db.add(payment)
    await db.flush()

    # 계약 활성화
    contract.user_id = current_user.id
    contract.billing_key = billing_key
    contract.customer_key = data.customer_key
    contract.card_company = charge_result.get("cardCompany") or billing_result.get("cardCompany")
    contract.card_number = charge_result.get("cardNumber") or billing_result.get("cardNumber")
    contract.status = MaintenanceStatus.ACTIVE
    contract.contract_start_date = now
    contract.current_period_start = now
    contract.current_period_end = now + timedelta(days=PERIOD_DAYS)
    contract.next_billing_date = now + timedelta(days=PERIOD_DAYS)
    contract.retry_count = 0
    contract.total_paid = contract.monthly_amount
    contract.total_months = 1
    contract.last_payment_id = payment.id
    contract.updated_at = now

    # 결제 성공 이메일
    if contract.contact_email:
        try:
            await send_payment_success(
                to_email=contract.contact_email,
                contact_person=contract.contact_person or "고객",
                project_name=contract.project_name,
                amount=contract.monthly_amount,
                card_number=contract.card_number or "",
                next_billing_date=contract.next_billing_date.strftime("%Y년 %m월 %d일"),
            )
        except Exception:
            pass

    return {
        "contract": _contract_to_dict(contract),
        "message": "카드 등록 및 첫 결제가 완료되었습니다.",
    }


@router.post("/{contract_id}/change-card")
async def change_card(
    contract_id: int,
    data: ChangeCardRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """고객: 카드 변경"""
    result = await db.execute(
        select(MaintenanceContract).where(
            and_(MaintenanceContract.id == contract_id, MaintenanceContract.user_id == current_user.id)
        )
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=404, detail="계약을 찾을 수 없습니다")

    billing_result = await toss_payments_service.issue_billing_key(
        auth_key=data.auth_key,
        customer_key=data.customer_key,
    )
    if not billing_result.get("success"):
        raise HTTPException(status_code=400, detail=billing_result.get("error_message", "빌링키 발급 실패"))

    contract.billing_key = billing_result["billingKey"]
    contract.customer_key = data.customer_key
    contract.card_company = billing_result.get("cardCompany")
    contract.card_number = billing_result.get("cardNumber")
    contract.updated_at = datetime.utcnow()

    # PAST_DUE면 즉시 재결제
    if contract.status == MaintenanceStatus.PAST_DUE:
        now = datetime.utcnow()
        order_id = f"MAINT_{contract.id}_{now.strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:6]}"
        svc_name = SERVICE_NAMES.get(contract.service_type, "관리유지비")
        order_name = f"{contract.project_name} {svc_name} 관리유지비 (월) 재결제"
        product_id = f"maintenance_{contract.service_type.value.lower()}_{contract.id}"

        charge_result = await toss_payments_service.charge_billing_key(
            billing_key=contract.billing_key,
            customer_key=contract.customer_key,
            amount=contract.monthly_amount,
            order_id=order_id,
            order_name=order_name,
        )
        if charge_result.get("success"):
            payment = Payment(
                user_id=current_user.id,
                order_id=order_id,
                payment_key=charge_result.get("paymentKey"),
                product_id=product_id,
                product_name=order_name,
                amount=contract.monthly_amount,
                status=PaymentStatus.COMPLETED,
                method=PaymentMethod.CARD,
                card_company=charge_result.get("cardCompany"),
                card_number=charge_result.get("cardNumber"),
                receipt_url=charge_result.get("receipt_url"),
                paid_at=now,
            )
            db.add(payment)
            await db.flush()

            contract.status = MaintenanceStatus.ACTIVE
            contract.current_period_start = now
            contract.current_period_end = now + timedelta(days=PERIOD_DAYS)
            contract.next_billing_date = now + timedelta(days=PERIOD_DAYS)
            contract.retry_count = 0
            contract.total_paid += contract.monthly_amount
            contract.total_months += 1
            contract.last_payment_id = payment.id

    return {
        "contract": _contract_to_dict(contract),
        "message": "카드가 변경되었습니다.",
    }


@router.post("/{contract_id}/retry-payment")
async def retry_payment(
    contract_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """고객: 미납분 즉시 결제"""
    result = await db.execute(
        select(MaintenanceContract).where(
            and_(MaintenanceContract.id == contract_id, MaintenanceContract.user_id == current_user.id)
        )
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=404, detail="계약을 찾을 수 없습니다")

    if contract.status not in (MaintenanceStatus.PAST_DUE, MaintenanceStatus.SUSPENDED):
        raise HTTPException(status_code=400, detail="미납 상태가 아닙니다")

    if not contract.billing_key:
        raise HTTPException(status_code=400, detail="등록된 카드가 없습니다. 카드를 먼저 등록해주세요.")

    now = datetime.utcnow()
    order_id = f"MAINT_{contract.id}_{now.strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:6]}"
    svc_name = SERVICE_NAMES.get(contract.service_type, "관리유지비")
    order_name = f"{contract.project_name} {svc_name} 관리유지비 (월) 재결제"
    product_id = f"maintenance_{contract.service_type.value.lower()}_{contract.id}"

    charge_result = await toss_payments_service.charge_billing_key(
        billing_key=contract.billing_key,
        customer_key=contract.customer_key,
        amount=contract.monthly_amount,
        order_id=order_id,
        order_name=order_name,
    )
    if not charge_result.get("success"):
        raise HTTPException(status_code=400, detail=charge_result.get("error_message", "결제 실패"))

    payment = Payment(
        user_id=current_user.id,
        order_id=order_id,
        payment_key=charge_result.get("paymentKey"),
        product_id=product_id,
        product_name=order_name,
        amount=contract.monthly_amount,
        status=PaymentStatus.COMPLETED,
        method=PaymentMethod.CARD,
        card_company=charge_result.get("cardCompany"),
        card_number=charge_result.get("cardNumber"),
        receipt_url=charge_result.get("receipt_url"),
        paid_at=now,
    )
    db.add(payment)
    await db.flush()

    contract.status = MaintenanceStatus.ACTIVE
    contract.current_period_start = now
    contract.current_period_end = now + timedelta(days=PERIOD_DAYS)
    contract.next_billing_date = now + timedelta(days=PERIOD_DAYS)
    contract.retry_count = 0
    contract.total_paid += contract.monthly_amount
    contract.total_months += 1
    contract.last_payment_id = payment.id
    contract.updated_at = now

    return {"contract": _contract_to_dict(contract), "message": "결제가 완료되었습니다."}


@router.post("/{contract_id}/cancel")
async def cancel_contract(
    contract_id: int,
    data: CancelRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """고객: 해지 요청"""
    result = await db.execute(
        select(MaintenanceContract).where(
            and_(MaintenanceContract.id == contract_id, MaintenanceContract.user_id == current_user.id)
        )
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=404, detail="계약을 찾을 수 없습니다")

    if contract.status != MaintenanceStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="활성 계약만 해지할 수 있습니다")

    contract.status = MaintenanceStatus.CANCELED
    contract.canceled_at = datetime.utcnow()
    contract.cancel_reason = data.reason
    contract.updated_at = datetime.utcnow()

    return {
        "status": contract.status.value,
        "current_period_end": contract.current_period_end.isoformat() if contract.current_period_end else None,
        "message": f"해지 요청이 접수되었습니다. {contract.current_period_end.strftime('%Y년 %m월 %d일') if contract.current_period_end else '기간 종료'}까지 서비스가 유지됩니다.",
    }


@router.get("/{contract_id}/billing-history")
async def get_billing_history(
    contract_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """고객: 결제 내역"""
    result = await db.execute(
        select(MaintenanceContract).where(
            and_(MaintenanceContract.id == contract_id, MaintenanceContract.user_id == current_user.id)
        )
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=404, detail="계약을 찾을 수 없습니다")

    product_prefix = f"maintenance_{contract.service_type.value.lower()}_{contract.id}"
    payments_result = await db.execute(
        select(Payment).where(
            and_(
                Payment.user_id == current_user.id,
                Payment.product_id == product_prefix,
            )
        ).order_by(Payment.created_at.desc())
    )
    payments = payments_result.scalars().all()

    return {
        "items": [
            {
                "id": p.id,
                "order_id": p.order_id,
                "amount": p.amount,
                "status": p.status.value,
                "card_company": p.card_company,
                "card_number": p.card_number,
                "paid_at": p.paid_at.isoformat() if p.paid_at else None,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in payments
        ],
        "total": len(payments),
    }


# ============================================================
# 요청 게시판 API (Step 6)
# ============================================================

@router.get("/{contract_id}/requests")
async def list_requests(
    contract_id: int,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """요청 목록 (고객: 자기것만, 관리자: 전체)"""
    # 계약 존재 확인 + 권한
    result = await db.execute(
        select(MaintenanceContract).where(MaintenanceContract.id == contract_id)
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=404, detail="계약을 찾을 수 없습니다")

    is_admin = current_user.role == UserRole.ADMIN
    if not is_admin and contract.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다")

    query = select(MaintenanceRequest).where(MaintenanceRequest.contract_id == contract_id)
    count_query = select(func.count(MaintenanceRequest.id)).where(
        MaintenanceRequest.contract_id == contract_id
    )

    total = (await db.execute(count_query)).scalar() or 0
    result = await db.execute(
        query.order_by(desc(MaintenanceRequest.created_at))
        .offset((page - 1) * size).limit(size)
    )
    requests = result.scalars().all()

    return {
        "items": [
            {
                "id": r.id,
                "category": r.category.value,
                "priority": r.priority.value,
                "title": r.title,
                "status": r.status.value,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in requests
        ],
        "total": total,
        "page": page,
        "size": size,
    }


@router.post("/{contract_id}/requests")
async def create_request(
    contract_id: int,
    data: CreateRequestBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """새 요청 등록"""
    result = await db.execute(
        select(MaintenanceContract).where(MaintenanceContract.id == contract_id)
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=404, detail="계약을 찾을 수 없습니다")

    if contract.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다")

    req = MaintenanceRequest(
        contract_id=contract_id,
        author_id=current_user.id,
        category=data.category,
        priority=data.priority,
        title=data.title,
        content=data.content,
    )
    db.add(req)
    await db.flush()

    return {"id": req.id, "message": "요청이 등록되었습니다."}


@router.get("/requests/{request_id}")
async def get_request_detail(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """요청 상세 + 댓글"""
    result = await db.execute(
        select(MaintenanceRequest).where(MaintenanceRequest.id == request_id)
    )
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="요청을 찾을 수 없습니다")

    # 권한 확인
    c_result = await db.execute(
        select(MaintenanceContract).where(MaintenanceContract.id == req.contract_id)
    )
    contract = c_result.scalar_one_or_none()
    is_admin = current_user.role == UserRole.ADMIN
    if not is_admin and (not contract or contract.user_id != current_user.id):
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다")

    # 댓글
    comments_result = await db.execute(
        select(MaintenanceComment).where(
            MaintenanceComment.request_id == request_id
        ).order_by(MaintenanceComment.created_at)
    )
    comments = comments_result.scalars().all()

    return {
        "id": req.id,
        "contract_id": req.contract_id,
        "project_name": contract.project_name if contract else None,
        "category": req.category.value,
        "priority": req.priority.value,
        "title": req.title,
        "content": req.content,
        "attachments": req.attachments or [],
        "status": req.status.value,
        "resolved_at": req.resolved_at.isoformat() if req.resolved_at else None,
        "created_at": req.created_at.isoformat() if req.created_at else None,
        "comments": [
            {
                "id": c.id,
                "content": c.content,
                "attachments": c.attachments or [],
                "is_internal": c.is_internal if is_admin else False,
                "is_admin_reply": c.is_internal is False and c.author_id != (contract.user_id if contract else None),
                "author_id": str(c.author_id) if c.author_id else None,
                "created_at": c.created_at.isoformat() if c.created_at else None,
            }
            for c in comments
            if is_admin or not c.is_internal  # 고객에게는 내부 메모 숨김
        ],
    }


@router.post("/requests/{request_id}/comments")
async def create_comment(
    request_id: int,
    data: CreateCommentBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """댓글 등록"""
    result = await db.execute(
        select(MaintenanceRequest).where(MaintenanceRequest.id == request_id)
    )
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="요청을 찾을 수 없습니다")

    # 권한 확인
    c_result = await db.execute(
        select(MaintenanceContract).where(MaintenanceContract.id == req.contract_id)
    )
    contract = c_result.scalar_one_or_none()
    is_admin = current_user.role == UserRole.ADMIN
    if not is_admin and (not contract or contract.user_id != current_user.id):
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다")

    # 내부 메모는 관리자만
    if data.is_internal and not is_admin:
        raise HTTPException(status_code=403, detail="내부 메모는 관리자만 작성할 수 있습니다")

    comment = MaintenanceComment(
        request_id=request_id,
        author_id=current_user.id,
        content=data.content,
        is_internal=data.is_internal,
    )
    db.add(comment)
    await db.flush()

    # 관리자 답변 시 고객에게 이메일 알림
    if is_admin and not data.is_internal and contract and contract.contact_email:
        try:
            await send_request_reply(
                to_email=contract.contact_email,
                contact_person=contract.contact_person or "고객",
                project_name=contract.project_name,
                request_title=req.title,
                reply_preview=data.content,
            )
        except Exception:
            pass

    return {"id": comment.id, "message": "댓글이 등록되었습니다."}


@router.patch("/requests/{request_id}/status")
async def update_request_status(
    request_id: int,
    data: StatusUpdateBody,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """관리자: 요청 상태 변경"""
    result = await db.execute(
        select(MaintenanceRequest).where(MaintenanceRequest.id == request_id)
    )
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="요청을 찾을 수 없습니다")

    req.status = data.status
    if data.status == RequestStatus.COMPLETED:
        req.resolved_at = datetime.utcnow()
    req.updated_at = datetime.utcnow()

    return {"status": req.status.value, "message": "상태가 변경되었습니다."}
