"""
관리자 문의/상담 관리 API

- GET  /contacts          → 목록 조회 (pagination, filter)
- PATCH /contacts/{id}/status → 상태 변경
- POST  /contacts/{id}/reply  → 답변 작성
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from typing import Optional
from datetime import datetime
from pydantic import BaseModel

from app.core.database import get_db
from app.api.v1.admin import require_admin
from app.models.user import User
from app.models.contact_inquiry import ContactInquiry

router = APIRouter()

# consultation으로 분류되는 contact_type 목록
CONSULTATION_TYPES = ("consultation", "homepage_consultation", "program_consultation")


class StatusUpdateRequest(BaseModel):
    status: str


class ReplyRequest(BaseModel):
    reply: str


@router.get("/contacts")
async def list_contacts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    type: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """문의/상담 목록 조회"""
    is_consultation = type == "consultation"

    # 기본 쿼리
    base_filter = []
    if is_consultation:
        base_filter.append(ContactInquiry.contact_type.in_(CONSULTATION_TYPES))
    elif type:
        base_filter.append(ContactInquiry.contact_type == type)

    if status:
        base_filter.append(ContactInquiry.status == status)

    if search:
        search_term = f"%{search}%"
        search_filter = or_(
            ContactInquiry.name.ilike(search_term),
            ContactInquiry.phone.ilike(search_term),
            ContactInquiry.email.ilike(search_term),
            ContactInquiry.subject.ilike(search_term),
            ContactInquiry.specialty.ilike(search_term),
        )
        base_filter.append(search_filter)

    # 총 건수
    count_query = select(func.count(ContactInquiry.id)).where(*base_filter)
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # status_counts (type 필터 기준, search/status 무관)
    type_filter = []
    if is_consultation:
        type_filter.append(ContactInquiry.contact_type.in_(CONSULTATION_TYPES))
    elif type:
        type_filter.append(ContactInquiry.contact_type == type)

    status_counts_query = (
        select(ContactInquiry.status, func.count(ContactInquiry.id))
        .where(*type_filter)
        .group_by(ContactInquiry.status)
    )
    status_counts_result = await db.execute(status_counts_query)
    status_counts = {s: c for s, c in status_counts_result.all()}

    # 데이터 조회
    query = (
        select(ContactInquiry)
        .where(*base_filter)
        .order_by(ContactInquiry.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(query)
    rows = result.scalars().all()

    # 응답 변환
    items = []
    for r in rows:
        item: dict = {
            "id": str(r.id),
            "name": r.name,
            "phone": r.phone or "",
            "status": r.status,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "message": r.message or "",
        }

        if is_consultation:
            item.update({
                "specialty": r.specialty or "",
                "area": r.area or 0,
                "region": r.region or "",
                "need_loan": r.need_loan or "",
                "interests": r.interests or "",
                "admin_note": r.admin_note or "",
            })
        else:
            item.update({
                "email": r.email or "",
                "type": r.contact_type,
                "subject": r.subject or "",
                "admin_reply": r.admin_reply or "",
                "replied_at": r.replied_at.isoformat() if r.replied_at else None,
            })

        items.append(item)

    return {
        "items": items,
        "total": total,
        "status_counts": status_counts,
    }


@router.patch("/contacts/{contact_id}/status")
async def update_contact_status(
    contact_id: int,
    body: StatusUpdateRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """문의/상담 상태 변경"""
    result = await db.execute(
        select(ContactInquiry).where(ContactInquiry.id == contact_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="해당 문의를 찾을 수 없습니다.")

    record.status = body.status
    record.updated_at = datetime.utcnow()
    await db.commit()

    return {"status": "updated", "new_status": body.status}


@router.post("/contacts/{contact_id}/reply")
async def reply_to_contact(
    contact_id: int,
    body: ReplyRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """문의 답변 작성"""
    result = await db.execute(
        select(ContactInquiry).where(ContactInquiry.id == contact_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="해당 문의를 찾을 수 없습니다.")

    record.admin_reply = body.reply
    record.replied_at = datetime.utcnow()
    record.status = "REPLIED"
    record.updated_at = datetime.utcnow()
    await db.commit()

    return {
        "status": "replied",
        "replied_at": record.replied_at.isoformat(),
    }
