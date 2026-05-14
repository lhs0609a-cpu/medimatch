"""차트 첨부 파일 API.

의사용 (인증):
  POST   /emr/visits/{visit_id}/attachments/token   — 폰 업로드 토큰 발급
  POST   /emr/visits/{visit_id}/attachments         — 데스크탑 직접 업로드
  GET    /emr/visits/{visit_id}/attachments         — 목록
  DELETE /emr/visits/{visit_id}/attachments/{aid}   — 삭제

환자/의사폰 (Public, 토큰):
  GET    /upload/{token}            — 토큰 검증 + 차트 메타
  POST   /upload/{token}/photo      — 사진 업로드
"""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status as http_status
from pydantic import BaseModel
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from ..deps import get_db, get_current_active_user
from ...models.user import User
from ...models.visit import Visit
from ...models.visit_attachment import VisitAttachment, AttachmentType
from ...services import visit_attachments as att_svc


# ════════════════════════════════════════════════════════════
#  의사용 (인증)
# ════════════════════════════════════════════════════════════
doctor_router = APIRouter()


class TokenCreateRequest(BaseModel):
    label: Optional[str] = None
    expires_in_minutes: int = 30
    max_uploads: int = 20


class TokenCreateResponse(BaseModel):
    token: str
    upload_url: str
    expires_at: datetime
    max_uploads: int
    label: Optional[str] = None


class AttachmentOut(BaseModel):
    id: UUID
    visit_id: UUID
    file_name: str
    file_url: str
    thumbnail_url: Optional[str]
    mime_type: Optional[str]
    size_bytes: Optional[int]
    attachment_type: str
    description: Optional[str]
    taken_at: Optional[datetime]
    uploaded_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


async def _ensure_visit(
    db: AsyncSession, user_id: UUID, visit_id: UUID
) -> Visit:
    q = select(Visit).where(and_(
        Visit.id == visit_id,
        Visit.user_id == user_id,
    ))
    v = (await db.execute(q)).scalar_one_or_none()
    if not v:
        raise HTTPException(status_code=404, detail="진료 기록을 찾을 수 없습니다.")
    return v


@doctor_router.post("/{visit_id}/attachments/token", response_model=TokenCreateResponse, status_code=http_status.HTTP_201_CREATED)
async def create_token(
    visit_id: UUID,
    payload: TokenCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """폰으로 보낼 magic-link 토큰 발급. 30분 유효, 최대 20장 기본."""
    v = await _ensure_visit(db, current_user.id, visit_id)
    rec, link = await att_svc.create_upload_token(
        db,
        user_id=current_user.id,
        visit_id=visit_id,
        patient_id=v.patient_id,
        label=payload.label,
        expires_in_minutes=max(5, min(payload.expires_in_minutes, 240)),
        max_uploads=max(1, min(payload.max_uploads, 100)),
    )
    return TokenCreateResponse(
        token=rec.token,
        upload_url=link,
        expires_at=rec.expires_at,
        max_uploads=rec.max_uploads,
        label=rec.label,
    )


@doctor_router.post("/{visit_id}/attachments", response_model=AttachmentOut, status_code=http_status.HTTP_201_CREATED)
async def upload_direct(
    visit_id: UUID,
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    attachment_type: str = Form("PHOTO"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """데스크탑에서 직접 업로드 (파일 선택)."""
    v = await _ensure_visit(db, current_user.id, visit_id)
    try:
        atype = AttachmentType(attachment_type)
    except ValueError:
        atype = AttachmentType.PHOTO
    try:
        att = await att_svc.save_upload(
            db,
            user_id=current_user.id,
            visit_id=visit_id,
            patient_id=v.patient_id,
            file=file,
            description=description,
            attachment_type=atype,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return att


@doctor_router.get("/{visit_id}/attachments", response_model=List[AttachmentOut])
async def list_attachments(
    visit_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await _ensure_visit(db, current_user.id, visit_id)
    return await att_svc.list_for_visit(db, user_id=current_user.id, visit_id=visit_id)


@doctor_router.delete("/{visit_id}/attachments/{attachment_id}", status_code=http_status.HTTP_204_NO_CONTENT)
async def delete_attachment(
    visit_id: UUID,
    attachment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await _ensure_visit(db, current_user.id, visit_id)
    ok = await att_svc.delete_attachment(db, user_id=current_user.id, attachment_id=attachment_id)
    if not ok:
        raise HTTPException(status_code=404, detail="첨부를 찾을 수 없습니다.")


# ════════════════════════════════════════════════════════════
#  Public (토큰)
# ════════════════════════════════════════════════════════════
public_router = APIRouter()


class TokenInfoOut(BaseModel):
    valid: bool
    label: Optional[str] = None
    expires_at: Optional[datetime] = None
    max_uploads: int = 0
    used_count: int = 0
    visit_id: Optional[str] = None
    patient_name: Optional[str] = None
    clinic_name: Optional[str] = None
    error: Optional[str] = None


@public_router.get("/{token}", response_model=TokenInfoOut)
async def get_token_info(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    rec = await att_svc.fetch_token(db, token)
    if not rec:
        raise HTTPException(status_code=404, detail="잘못된 링크입니다.")
    ok, msg = att_svc.is_token_valid(rec)
    if not ok:
        return TokenInfoOut(valid=False, error=msg)

    # 차트/환자명 보강
    patient_name = None
    clinic_name = None
    try:
        v = (await db.execute(select(Visit).where(Visit.id == rec.visit_id))).scalar_one_or_none()
        if v:
            from ...models.patient import Patient
            if v.patient_id:
                p = (await db.execute(select(Patient).where(Patient.id == v.patient_id))).scalar_one_or_none()
                if p:
                    patient_name = p.name
            user = (await db.execute(select(User).where(User.id == rec.user_id))).scalar_one_or_none()
            if user:
                clinic_name = user.name or user.email
    except Exception:
        pass

    return TokenInfoOut(
        valid=True,
        label=rec.label,
        expires_at=rec.expires_at,
        max_uploads=rec.max_uploads,
        used_count=rec.used_count,
        visit_id=str(rec.visit_id),
        patient_name=patient_name,
        clinic_name=clinic_name,
    )


@public_router.post("/{token}/photo", response_model=AttachmentOut)
async def upload_via_token(
    token: str,
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
):
    rec = await att_svc.fetch_token(db, token)
    if not rec:
        raise HTTPException(status_code=404, detail="잘못된 링크입니다.")
    ok, msg = att_svc.is_token_valid(rec)
    if not ok:
        raise HTTPException(status_code=410, detail=msg)
    try:
        att = await att_svc.save_upload(
            db,
            user_id=rec.user_id,
            visit_id=rec.visit_id,
            patient_id=rec.patient_id,
            file=file,
            description=description,
            upload_token=token,
            attachment_type=AttachmentType.PHOTO,
        )
        await att_svc.increment_token_used(db, rec)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return att
