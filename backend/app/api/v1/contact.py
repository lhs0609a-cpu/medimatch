"""
문의 접수 API
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.core.database import get_db
from app.models.contact_inquiry import ContactInquiry

logger = logging.getLogger(__name__)

router = APIRouter()


class ContactRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    type: str = Field(..., pattern="^(general|simulation|matching|payment|partnership|bug|other|homepage_consultation|program_consultation|consultation)$")
    subject: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1, max_length=5000)
    # 상담 전용 (optional)
    specialty: Optional[str] = Field(None, max_length=100)
    area: Optional[int] = None
    region: Optional[str] = Field(None, max_length=200)
    need_loan: Optional[str] = Field(None, max_length=20)
    interests: Optional[str] = None


class ContactResponse(BaseModel):
    status: str
    message: str
    inquiry_id: str


@router.post("/", response_model=ContactResponse)
async def submit_contact(data: ContactRequest, db: AsyncSession = Depends(get_db)):
    """문의 접수"""
    try:
        # DB에 저장
        record = ContactInquiry(
            name=data.name,
            email=data.email,
            phone=data.phone,
            message=data.message,
            contact_type=data.type,
            subject=data.subject,
            specialty=data.specialty,
            area=data.area,
            region=data.region,
            need_loan=data.need_loan,
            interests=data.interests,
        )
        db.add(record)
        await db.commit()
        await db.refresh(record)

        inquiry_id = f"INQ-{record.id}"

        logger.info(
            f"문의 접수: {inquiry_id} | type={data.type} | email={data.email} | subject={data.subject}"
        )

        return ContactResponse(
            status="success",
            message="문의가 접수되었습니다. 빠른 시일 내에 답변드리겠습니다.",
            inquiry_id=inquiry_id,
        )

    except Exception as e:
        logger.error(f"문의 접수 실패: {e}")
        raise HTTPException(status_code=500, detail="문의 접수에 실패했습니다.")
