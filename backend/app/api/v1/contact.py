"""
문의 접수 API
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class ContactRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    type: str = Field(..., pattern="^(general|simulation|matching|payment|partnership|bug|other)$")
    subject: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1, max_length=5000)


class ContactResponse(BaseModel):
    status: str
    message: str
    inquiry_id: str


@router.post("/", response_model=ContactResponse)
async def submit_contact(data: ContactRequest):
    """문의 접수"""
    try:
        inquiry_id = f"INQ-{datetime.now().strftime('%Y%m%d%H%M%S')}"

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
