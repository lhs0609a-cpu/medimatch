"""
영업사원↔개원의 유료 매칭 API

- 영업사원 프로필 관리
- 개원 준비중 의사 탐색
- 매칭 요청 및 결제
- 의사 응답 처리
- 자동 환불 (거절/무응답)
- 리뷰 시스템
"""
from datetime import datetime, timedelta
from typing import Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy import select, and_, or_, func, case
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..deps import get_db, get_current_active_user, RoleChecker
from ...core.security import get_current_user, TokenData
from ...models.user import User, UserRole
from ...models.sales_match import (
    SalesRepProfile, SalesMatchRequest, SalesMatchReview,
    SalesRepStatus, MatchRequestStatus, DoctorResponse, ContactResult,
    ProductCategory, MATCH_FEE, RESPONSE_TIMEOUT_HOURS,
    DOCTOR_VISIBLE_FIELDS, SALES_REP_VISIBLE_FIELDS
)
from ...models.payment import Payment, PaymentStatus
from pydantic import BaseModel, Field

router = APIRouter()


# ==================== Schemas ====================

class SalesRepProfileCreate(BaseModel):
    company: str = Field(..., max_length=200)
    department: Optional[str] = Field(None, max_length=100)
    position: Optional[str] = Field(None, max_length=100)
    product_categories: List[str] = Field(default=[])
    product_details: Optional[str] = None
    target_specialties: List[str] = Field(default=[])
    service_regions: List[str] = Field(default=[])
    experience_years: int = Field(default=0, ge=0)
    introduction: Optional[str] = None


class SalesRepProfileUpdate(BaseModel):
    company: Optional[str] = Field(None, max_length=200)
    department: Optional[str] = Field(None, max_length=100)
    position: Optional[str] = Field(None, max_length=100)
    product_categories: Optional[List[str]] = None
    product_details: Optional[str] = None
    target_specialties: Optional[List[str]] = None
    service_regions: Optional[List[str]] = None
    experience_years: Optional[int] = None
    introduction: Optional[str] = None


class MatchRequestCreate(BaseModel):
    doctor_id: UUID
    product_category: str = Field(..., max_length=50)
    message: Optional[str] = None


class DoctorResponseRequest(BaseModel):
    response: DoctorResponse
    reject_reason: Optional[str] = None


class ContactResultUpdate(BaseModel):
    contact_result: ContactResult
    contact_note: Optional[str] = None


class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None


# ==================== Helper Functions ====================

def filter_doctor_info(doctor: User, access_level: str) -> dict:
    """의사 정보를 접근 레벨에 따라 필터링"""
    allowed_fields = DOCTOR_VISIBLE_FIELDS.get(access_level, [])
    result = {}

    field_mappings = {
        "region_name": getattr(doctor, "opening_region", None),
        "specialty": getattr(doctor, "specialty", None),
        "opening_status": getattr(doctor, "opening_status", None),
        "expected_opening_date": getattr(doctor, "expected_opening_date", None),
        "name": doctor.full_name,
        "phone": doctor.phone,
        "email": doctor.email,
        "exact_region": getattr(doctor, "opening_region_detail", None),
        "clinic_name": getattr(doctor, "planned_clinic_name", None),
    }

    for field in allowed_fields:
        if field in field_mappings:
            result[field] = field_mappings[field]

    return result


def filter_sales_rep_info(profile: SalesRepProfile, access_level: str, user: User) -> dict:
    """영업사원 정보를 접근 레벨에 따라 필터링"""
    allowed_fields = SALES_REP_VISIBLE_FIELDS.get(access_level, [])
    result = {}

    field_mappings = {
        "company": profile.company,
        "product_categories": profile.product_categories,
        "target_specialties": profile.target_specialties,
        "experience_years": profile.experience_years,
        "introduction": profile.introduction,
        "rating": profile.rating,
        "acceptance_rate": profile.acceptance_rate,
        "success_rate": profile.success_rate,
        "department": profile.department,
        "position": profile.position,
        "name": user.full_name if user else None,
        "phone": user.phone if user else None,
        "email": user.email if user else None,
    }

    for field in allowed_fields:
        if field in field_mappings:
            result[field] = field_mappings[field]

    return result


# ==================== 영업사원 프로필 API ====================

@router.post("/sales/profile")
async def create_sales_profile(
    data: SalesRepProfileCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """영업사원 프로필 생성"""
    # 이미 프로필이 있는지 확인
    result = await db.execute(
        select(SalesRepProfile).where(SalesRepProfile.user_id == current_user.id)
    )
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(status_code=400, detail="이미 영업사원 프로필이 존재합니다")

    profile = SalesRepProfile(
        user_id=current_user.id,
        company=data.company,
        department=data.department,
        position=data.position,
        product_categories=data.product_categories,
        product_details=data.product_details,
        target_specialties=data.target_specialties,
        service_regions=data.service_regions,
        experience_years=data.experience_years,
        introduction=data.introduction,
        status=SalesRepStatus.PENDING
    )

    db.add(profile)
    await db.commit()
    await db.refresh(profile)

    return {
        "success": True,
        "message": "영업사원 프로필이 생성되었습니다. 관리자 승인 후 활동 가능합니다.",
        "profile_id": profile.id
    }


@router.get("/sales/profile/me")
async def get_my_sales_profile(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """내 영업사원 프로필 조회"""
    result = await db.execute(
        select(SalesRepProfile).where(SalesRepProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()

    if not profile:
        raise HTTPException(status_code=404, detail="영업사원 프로필이 없습니다")

    return {
        "id": profile.id,
        "company": profile.company,
        "department": profile.department,
        "position": profile.position,
        "product_categories": profile.product_categories,
        "product_details": profile.product_details,
        "target_specialties": profile.target_specialties,
        "service_regions": profile.service_regions,
        "experience_years": profile.experience_years,
        "introduction": profile.introduction,
        "status": profile.status.value,
        "is_verified": profile.is_verified,
        "rating": profile.rating,
        "rating_count": profile.rating_count,
        "total_requests": profile.total_requests,
        "accepted_requests": profile.accepted_requests,
        "acceptance_rate": profile.acceptance_rate,
        "success_rate": profile.success_rate,
        "total_spent": profile.total_spent,
        "created_at": profile.created_at.isoformat()
    }


@router.put("/sales/profile/me")
async def update_my_sales_profile(
    data: SalesRepProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """내 영업사원 프로필 수정"""
    result = await db.execute(
        select(SalesRepProfile).where(SalesRepProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()

    if not profile:
        raise HTTPException(status_code=404, detail="영업사원 프로필이 없습니다")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)

    profile.updated_at = datetime.utcnow()
    await db.commit()

    return {"success": True, "message": "프로필이 수정되었습니다"}


@router.post("/sales/profile/docs")
async def upload_verification_docs(
    doc_type: str = Query(..., description="문서 유형 (사업자등록증, 명함 등)"),
    doc_url: str = Query(..., description="업로드된 문서 URL"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """증빙 서류 업로드"""
    result = await db.execute(
        select(SalesRepProfile).where(SalesRepProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()

    if not profile:
        raise HTTPException(status_code=404, detail="영업사원 프로필이 없습니다")

    doc_entry = {
        "type": doc_type,
        "url": doc_url,
        "uploaded_at": datetime.utcnow().isoformat()
    }

    if profile.verification_docs is None:
        profile.verification_docs = []
    profile.verification_docs = profile.verification_docs + [doc_entry]

    await db.commit()

    return {"success": True, "message": "서류가 업로드되었습니다"}


# ==================== 개원의 탐색 API (영업사원용) ====================

@router.get("/sales/doctors")
async def search_opening_doctors(
    region: Optional[str] = Query(None, description="지역 필터"),
    specialty: Optional[str] = Query(None, description="진료과목 필터"),
    opening_status: Optional[str] = Query(None, description="개원 준비 상태"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """개원 준비중 의사 탐색 (익명 정보)"""
    # 영업사원 프로필 확인
    result = await db.execute(
        select(SalesRepProfile).where(
            and_(
                SalesRepProfile.user_id == current_user.id,
                SalesRepProfile.status == SalesRepStatus.ACTIVE
            )
        )
    )
    profile = result.scalar_one_or_none()

    if not profile:
        raise HTTPException(
            status_code=403,
            detail="활성화된 영업사원 프로필이 필요합니다"
        )

    # 개원 준비중인 의사 조회 (DOCTOR 역할 + 개원 준비 상태)
    query = select(User).where(
        and_(
            User.role == UserRole.DOCTOR,
            User.is_opening_preparation == True  # 개원 준비 플래그
        )
    )

    if region:
        query = query.where(User.opening_region.ilike(f"%{region}%"))
    if specialty:
        query = query.where(User.specialty == specialty)
    if opening_status:
        query = query.where(User.opening_status == opening_status)

    # 페이지네이션
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    doctors = result.scalars().all()

    # 익명화된 정보만 반환
    doctor_list = []
    for doctor in doctors:
        doctor_info = filter_doctor_info(doctor, "MINIMAL")
        doctor_info["doctor_id"] = str(doctor.id)

        # 이미 매칭 요청한 의사인지 확인
        existing_request = await db.execute(
            select(SalesMatchRequest).where(
                and_(
                    SalesMatchRequest.sales_rep_id == current_user.id,
                    SalesMatchRequest.doctor_id == doctor.id,
                    SalesMatchRequest.status.in_([
                        MatchRequestStatus.PENDING,
                        MatchRequestStatus.ACCEPTED
                    ])
                )
            )
        )
        doctor_info["already_requested"] = existing_request.scalar_one_or_none() is not None

        doctor_list.append(doctor_info)

    return {
        "doctors": doctor_list,
        "page": page,
        "limit": limit,
        "match_fee": MATCH_FEE
    }


# ==================== 매칭 요청 API ====================

@router.post("/sales/match/request")
async def create_match_request(
    data: MatchRequestCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """매칭 요청 생성 (결제 대기 상태)"""
    # 영업사원 프로필 확인
    result = await db.execute(
        select(SalesRepProfile).where(
            and_(
                SalesRepProfile.user_id == current_user.id,
                SalesRepProfile.status == SalesRepStatus.ACTIVE
            )
        )
    )
    profile = result.scalar_one_or_none()

    if not profile:
        raise HTTPException(
            status_code=403,
            detail="활성화된 영업사원 프로필이 필요합니다"
        )

    # 의사 확인
    result = await db.execute(
        select(User).where(
            and_(
                User.id == data.doctor_id,
                User.role == UserRole.DOCTOR
            )
        )
    )
    doctor = result.scalar_one_or_none()

    if not doctor:
        raise HTTPException(status_code=404, detail="해당 의사를 찾을 수 없습니다")

    # 중복 요청 확인
    result = await db.execute(
        select(SalesMatchRequest).where(
            and_(
                SalesMatchRequest.sales_rep_id == current_user.id,
                SalesMatchRequest.doctor_id == data.doctor_id,
                SalesMatchRequest.status.in_([
                    MatchRequestStatus.PENDING_PAYMENT,
                    MatchRequestStatus.PENDING,
                    MatchRequestStatus.ACCEPTED
                ])
            )
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="이미 해당 의사에게 활성 매칭 요청이 있습니다"
        )

    # 매칭 요청 생성
    match_request = SalesMatchRequest(
        sales_rep_id=current_user.id,
        doctor_id=data.doctor_id,
        product_category=data.product_category,
        message=data.message,
        match_fee=MATCH_FEE,
        status=MatchRequestStatus.PENDING_PAYMENT
    )

    db.add(match_request)
    await db.commit()
    await db.refresh(match_request)

    return {
        "success": True,
        "match_request_id": str(match_request.id),
        "match_fee": MATCH_FEE,
        "message": f"매칭 요청이 생성되었습니다. {MATCH_FEE:,}원 결제 후 의사에게 전달됩니다."
    }


@router.post("/sales/match/{request_id}/pay")
async def pay_match_request(
    request_id: UUID,
    background_tasks: BackgroundTasks,
    payment_key: str = Query(..., description="토스페이먼츠 paymentKey"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """매칭 요청 결제 완료 처리"""
    result = await db.execute(
        select(SalesMatchRequest).where(
            and_(
                SalesMatchRequest.id == request_id,
                SalesMatchRequest.sales_rep_id == current_user.id,
                SalesMatchRequest.status == MatchRequestStatus.PENDING_PAYMENT
            )
        )
    )
    match_request = result.scalar_one_or_none()

    if not match_request:
        raise HTTPException(status_code=404, detail="매칭 요청을 찾을 수 없습니다")

    # TODO: 토스페이먼츠 결제 확인
    # payment = await verify_payment(payment_key, match_request.match_fee)

    # 결제 기록 생성
    import uuid as uuid_lib
    order_id = f"SALES_{uuid_lib.uuid4().hex[:16]}"
    payment = Payment(
        user_id=current_user.id,
        order_id=order_id,
        product_id="sales_match_request",
        product_name="개원의 매칭 수수료",
        amount=match_request.match_fee,
        payment_key=payment_key,
        status=PaymentStatus.COMPLETED
    )
    db.add(payment)
    await db.flush()

    # 매칭 요청 상태 업데이트
    match_request.status = MatchRequestStatus.PENDING
    match_request.payment_id = payment.id
    match_request.paid_at = datetime.utcnow()
    match_request.expires_at = datetime.utcnow() + timedelta(hours=RESPONSE_TIMEOUT_HOURS)

    # 영업사원 프로필 통계 업데이트
    result = await db.execute(
        select(SalesRepProfile).where(SalesRepProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if profile:
        profile.total_requests += 1
        profile.total_spent += match_request.match_fee

    await db.commit()

    # TODO: 의사에게 알림 발송 (백그라운드)
    # background_tasks.add_task(send_match_notification, match_request.doctor_id, match_request.id)

    return {
        "success": True,
        "message": f"결제가 완료되었습니다. 의사의 응답을 {RESPONSE_TIMEOUT_HOURS}시간 내 기다립니다.",
        "expires_at": match_request.expires_at.isoformat()
    }


@router.get("/sales/match/my-requests")
async def get_my_match_requests(
    status: Optional[str] = Query(None, description="상태 필터"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """내 매칭 요청 목록 조회 (영업사원)"""
    query = select(SalesMatchRequest).where(
        SalesMatchRequest.sales_rep_id == current_user.id
    )

    if status:
        query = query.where(SalesMatchRequest.status == MatchRequestStatus(status))

    query = query.order_by(SalesMatchRequest.created_at.desc())

    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    requests = result.scalars().all()

    request_list = []
    for req in requests:
        # 의사 정보 조회
        doctor_result = await db.execute(
            select(User).where(User.id == req.doctor_id)
        )
        doctor = doctor_result.scalar_one_or_none()

        # 수락된 경우 전체 정보, 아니면 최소 정보
        access_level = "ACCEPTED" if req.status == MatchRequestStatus.ACCEPTED else "MINIMAL"
        doctor_info = filter_doctor_info(doctor, access_level) if doctor else {}

        request_list.append({
            "id": str(req.id),
            "doctor": doctor_info,
            "product_category": req.product_category,
            "message": req.message,
            "match_fee": req.match_fee,
            "status": req.status.value,
            "doctor_response": req.doctor_response.value if req.doctor_response else None,
            "reject_reason": req.reject_reason,
            "contact_result": req.contact_result.value if req.contact_result else None,
            "created_at": req.created_at.isoformat(),
            "expires_at": req.expires_at.isoformat() if req.expires_at else None,
            "responded_at": req.responded_at.isoformat() if req.responded_at else None
        })

    return {
        "requests": request_list,
        "page": page,
        "limit": limit
    }


@router.get("/sales/match/{request_id}")
async def get_match_request_detail(
    request_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """매칭 요청 상세 조회"""
    result = await db.execute(
        select(SalesMatchRequest).where(SalesMatchRequest.id == request_id)
    )
    match_request = result.scalar_one_or_none()

    if not match_request:
        raise HTTPException(status_code=404, detail="매칭 요청을 찾을 수 없습니다")

    # 권한 확인 (영업사원 또는 해당 의사)
    if match_request.sales_rep_id != current_user.id and match_request.doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다")

    # 의사 정보
    doctor_result = await db.execute(
        select(User).where(User.id == match_request.doctor_id)
    )
    doctor = doctor_result.scalar_one_or_none()

    # 영업사원 정보
    sales_rep_result = await db.execute(
        select(User).where(User.id == match_request.sales_rep_id)
    )
    sales_rep = sales_rep_result.scalar_one_or_none()

    profile_result = await db.execute(
        select(SalesRepProfile).where(SalesRepProfile.user_id == match_request.sales_rep_id)
    )
    profile = profile_result.scalar_one_or_none()

    # 접근 레벨 결정
    is_accepted = match_request.status == MatchRequestStatus.ACCEPTED
    doctor_access = "ACCEPTED" if is_accepted else "MINIMAL"
    sales_rep_access = "ACCEPTED" if is_accepted else "ALWAYS"

    return {
        "id": str(match_request.id),
        "doctor": filter_doctor_info(doctor, doctor_access) if doctor else {},
        "sales_rep": filter_sales_rep_info(profile, sales_rep_access, sales_rep) if profile else {},
        "product_category": match_request.product_category,
        "message": match_request.message,
        "match_fee": match_request.match_fee,
        "status": match_request.status.value,
        "doctor_response": match_request.doctor_response.value if match_request.doctor_response else None,
        "reject_reason": match_request.reject_reason,
        "contact_result": match_request.contact_result.value if match_request.contact_result else None,
        "contact_note": match_request.contact_note if is_accepted else None,
        "contact_shared": match_request.contact_shared,
        "created_at": match_request.created_at.isoformat(),
        "expires_at": match_request.expires_at.isoformat() if match_request.expires_at else None,
        "responded_at": match_request.responded_at.isoformat() if match_request.responded_at else None
    }


# ==================== 컨택 결과 기록 API ====================

@router.post("/sales/match/{request_id}/contact-result")
async def update_contact_result(
    request_id: UUID,
    data: ContactResultUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """컨택 결과 기록 (영업사원)"""
    result = await db.execute(
        select(SalesMatchRequest).where(
            and_(
                SalesMatchRequest.id == request_id,
                SalesMatchRequest.sales_rep_id == current_user.id,
                SalesMatchRequest.status == MatchRequestStatus.ACCEPTED
            )
        )
    )
    match_request = result.scalar_one_or_none()

    if not match_request:
        raise HTTPException(
            status_code=404,
            detail="수락된 매칭 요청을 찾을 수 없습니다"
        )

    match_request.contact_result = data.contact_result
    match_request.contact_note = data.contact_note
    match_request.contacted_at = datetime.utcnow()

    if data.contact_result == ContactResult.SUCCESS:
        match_request.status = MatchRequestStatus.COMPLETED
        # 성공 통계 업데이트
        profile_result = await db.execute(
            select(SalesRepProfile).where(SalesRepProfile.user_id == current_user.id)
        )
        profile = profile_result.scalar_one_or_none()
        if profile:
            profile.successful_contacts += 1

    await db.commit()

    return {"success": True, "message": "컨택 결과가 기록되었습니다"}


# ==================== 의사용 API ====================

@router.get("/doctor/match-requests")
async def get_doctor_match_requests(
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """내게 온 매칭 요청 목록 조회 (의사)"""
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="의사 계정만 접근 가능합니다")

    query = select(SalesMatchRequest).where(
        SalesMatchRequest.doctor_id == current_user.id
    )

    if status:
        query = query.where(SalesMatchRequest.status == MatchRequestStatus(status))

    query = query.order_by(SalesMatchRequest.created_at.desc())

    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    requests = result.scalars().all()

    request_list = []
    for req in requests:
        # 영업사원 정보
        profile_result = await db.execute(
            select(SalesRepProfile).where(SalesRepProfile.user_id == req.sales_rep_id)
        )
        profile = profile_result.scalar_one_or_none()

        sales_rep_result = await db.execute(
            select(User).where(User.id == req.sales_rep_id)
        )
        sales_rep = sales_rep_result.scalar_one_or_none()

        access_level = "ACCEPTED" if req.status == MatchRequestStatus.ACCEPTED else "ALWAYS"
        sales_rep_info = filter_sales_rep_info(profile, access_level, sales_rep) if profile else {}

        request_list.append({
            "id": str(req.id),
            "sales_rep": sales_rep_info,
            "product_category": req.product_category,
            "message": req.message,
            "status": req.status.value,
            "created_at": req.created_at.isoformat(),
            "expires_at": req.expires_at.isoformat() if req.expires_at else None,
            "time_remaining_hours": req.time_remaining.total_seconds() / 3600 if req.expires_at else None
        })

    return {
        "requests": request_list,
        "page": page,
        "limit": limit
    }


@router.post("/doctor/match/{request_id}/respond")
async def respond_to_match_request(
    request_id: UUID,
    data: DoctorResponseRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """매칭 요청 응답 (의사)"""
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="의사 계정만 접근 가능합니다")

    result = await db.execute(
        select(SalesMatchRequest).where(
            and_(
                SalesMatchRequest.id == request_id,
                SalesMatchRequest.doctor_id == current_user.id,
                SalesMatchRequest.status == MatchRequestStatus.PENDING
            )
        )
    )
    match_request = result.scalar_one_or_none()

    if not match_request:
        raise HTTPException(status_code=404, detail="대기중인 매칭 요청을 찾을 수 없습니다")

    # 만료 확인
    if match_request.is_expired:
        raise HTTPException(status_code=400, detail="응답 기한이 만료되었습니다")

    match_request.doctor_response = data.response
    match_request.responded_at = datetime.utcnow()

    if data.response == DoctorResponse.ACCEPTED:
        match_request.status = MatchRequestStatus.ACCEPTED
        match_request.contact_shared = True
        match_request.contact_shared_at = datetime.utcnow()

        # 영업사원 프로필 수락 통계 업데이트
        profile_result = await db.execute(
            select(SalesRepProfile).where(SalesRepProfile.user_id == match_request.sales_rep_id)
        )
        profile = profile_result.scalar_one_or_none()
        if profile:
            profile.accepted_requests += 1

        message = "매칭 요청을 수락했습니다. 연락처가 영업사원에게 공개됩니다."

    else:  # REJECTED
        match_request.status = MatchRequestStatus.REJECTED
        match_request.reject_reason = data.reject_reason

        # TODO: 환불 처리
        # await process_refund(match_request)

        message = "매칭 요청을 거절했습니다. 영업사원에게 수수료가 환불됩니다."

    await db.commit()

    # TODO: 영업사원에게 알림 발송
    # background_tasks.add_task(send_response_notification, match_request.sales_rep_id, match_request.id)

    return {"success": True, "message": message}


# ==================== 리뷰 API ====================

@router.post("/sales/match/{request_id}/review")
async def create_review(
    request_id: UUID,
    data: ReviewCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """리뷰 작성"""
    result = await db.execute(
        select(SalesMatchRequest).where(SalesMatchRequest.id == request_id)
    )
    match_request = result.scalar_one_or_none()

    if not match_request:
        raise HTTPException(status_code=404, detail="매칭 요청을 찾을 수 없습니다")

    # 수락된 매칭만 리뷰 가능
    if match_request.status != MatchRequestStatus.ACCEPTED and \
       match_request.status != MatchRequestStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="완료된 매칭만 리뷰할 수 있습니다")

    # 리뷰어 유형 결정
    if current_user.id == match_request.doctor_id:
        reviewer_type = "DOCTOR"
    elif current_user.id == match_request.sales_rep_id:
        reviewer_type = "SALES_REP"
    else:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다")

    # 중복 리뷰 확인
    existing_result = await db.execute(
        select(SalesMatchReview).where(
            and_(
                SalesMatchReview.match_request_id == request_id,
                SalesMatchReview.reviewer_id == current_user.id
            )
        )
    )
    if existing_result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="이미 리뷰를 작성했습니다")

    review = SalesMatchReview(
        match_request_id=request_id,
        reviewer_id=current_user.id,
        reviewer_type=reviewer_type,
        rating=data.rating,
        comment=data.comment
    )
    db.add(review)

    # 의사가 영업사원에게 리뷰한 경우, 영업사원 평점 업데이트
    if reviewer_type == "DOCTOR":
        profile_result = await db.execute(
            select(SalesRepProfile).where(
                SalesRepProfile.user_id == match_request.sales_rep_id
            )
        )
        profile = profile_result.scalar_one_or_none()
        if profile:
            total_rating = profile.rating * profile.rating_count + data.rating
            profile.rating_count += 1
            profile.rating = round(total_rating / profile.rating_count, 2)

    await db.commit()

    return {"success": True, "message": "리뷰가 등록되었습니다"}


# ==================== 관리자 API ====================

@router.get("/admin/sales/profiles")
async def admin_get_sales_profiles(
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: TokenData = Depends(RoleChecker([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    """영업사원 프로필 목록 조회 (관리자)"""
    query = select(SalesRepProfile)

    if status:
        query = query.where(SalesRepProfile.status == SalesRepStatus(status))

    query = query.order_by(SalesRepProfile.created_at.desc())

    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    profiles = result.scalars().all()

    profile_list = []
    for profile in profiles:
        user_result = await db.execute(
            select(User).where(User.id == profile.user_id)
        )
        user = user_result.scalar_one_or_none()

        profile_list.append({
            "id": profile.id,
            "user_id": str(profile.user_id),
            "user_name": user.full_name if user else None,
            "user_email": user.email if user else None,
            "company": profile.company,
            "product_categories": profile.product_categories,
            "status": profile.status.value,
            "is_verified": profile.is_verified,
            "rating": profile.rating,
            "total_requests": profile.total_requests,
            "verification_docs": profile.verification_docs,
            "created_at": profile.created_at.isoformat()
        })

    return {
        "profiles": profile_list,
        "page": page,
        "limit": limit
    }


@router.post("/admin/sales/profiles/{profile_id}/verify")
async def admin_verify_sales_profile(
    profile_id: int,
    approve: bool = Query(..., description="승인 여부"),
    reason: Optional[str] = Query(None, description="거부 사유"),
    current_user: TokenData = Depends(RoleChecker([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    """영업사원 프로필 승인/거부 (관리자)"""
    result = await db.execute(
        select(SalesRepProfile).where(SalesRepProfile.id == profile_id)
    )
    profile = result.scalar_one_or_none()

    if not profile:
        raise HTTPException(status_code=404, detail="프로필을 찾을 수 없습니다")

    if approve:
        profile.status = SalesRepStatus.ACTIVE
        profile.is_verified = True
        profile.verified_at = datetime.utcnow()
        message = "영업사원 프로필이 승인되었습니다"
    else:
        profile.status = SalesRepStatus.SUSPENDED
        message = f"영업사원 프로필이 거부되었습니다: {reason}"

    await db.commit()

    return {"success": True, "message": message}


@router.get("/admin/sales/stats")
async def admin_get_sales_stats(
    current_user: TokenData = Depends(RoleChecker([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    """영업사원 매칭 통계 (관리자)"""
    # 프로필 통계
    profile_stats = await db.execute(
        select(
            func.count(SalesRepProfile.id).label("total"),
            func.count(case((SalesRepProfile.status == SalesRepStatus.ACTIVE, 1))).label("active"),
            func.count(case((SalesRepProfile.status == SalesRepStatus.PENDING, 1))).label("pending")
        )
    )
    profile_row = profile_stats.one()

    # 매칭 요청 통계
    request_stats = await db.execute(
        select(
            func.count(SalesMatchRequest.id).label("total"),
            func.count(case((SalesMatchRequest.status == MatchRequestStatus.ACCEPTED, 1))).label("accepted"),
            func.count(case((SalesMatchRequest.status == MatchRequestStatus.REJECTED, 1))).label("rejected"),
            func.count(case((SalesMatchRequest.status == MatchRequestStatus.EXPIRED, 1))).label("expired"),
            func.sum(case((SalesMatchRequest.status.in_([
                MatchRequestStatus.ACCEPTED, MatchRequestStatus.COMPLETED
            ]), SalesMatchRequest.match_fee), else_=0)).label("total_revenue")
        )
    )
    request_row = request_stats.one()

    return {
        "profiles": {
            "total": profile_row.total,
            "active": profile_row.active,
            "pending": profile_row.pending
        },
        "requests": {
            "total": request_row.total,
            "accepted": request_row.accepted,
            "rejected": request_row.rejected,
            "expired": request_row.expired
        },
        "revenue": {
            "total": request_row.total_revenue or 0,
            "match_fee": MATCH_FEE
        }
    }


# ==================== 자동 만료 처리 (Celery 태스크용) ====================

async def process_expired_requests(db: AsyncSession):
    """만료된 매칭 요청 처리"""
    # 만료된 요청 조회
    result = await db.execute(
        select(SalesMatchRequest).where(
            and_(
                SalesMatchRequest.status == MatchRequestStatus.PENDING,
                SalesMatchRequest.expires_at < datetime.utcnow()
            )
        )
    )
    expired_requests = result.scalars().all()

    for req in expired_requests:
        req.status = MatchRequestStatus.EXPIRED
        req.doctor_response = DoctorResponse.EXPIRED

        # TODO: 환불 처리
        # await process_refund(req)

    await db.commit()

    return len(expired_requests)
