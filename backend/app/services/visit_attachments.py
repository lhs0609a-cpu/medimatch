"""차트 첨부 파일 — 토큰 발행, 파일 저장, 목록/삭제.

저장 전략:
- 로컬 디스크 (UPLOAD_DIR, 기본 ./uploads)
- 추후 S3 환경변수 있을 때 swappable

URL은 `/uploads/visits/{visit_id}/{filename}` 로 노출.
main.py에서 StaticFiles mount.
"""
from __future__ import annotations
import os
import secrets
import hashlib
import mimetypes
import uuid as uuid_lib
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Tuple
from uuid import UUID

from fastapi import UploadFile
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.visit_attachment import (
    VisitAttachment, VisitUploadToken, AttachmentType,
)


UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./uploads")).resolve()
URL_PREFIX = "/uploads"

EXT_FROM_MIME = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "application/pdf": "pdf",
}

ALLOWED_MIME = set(EXT_FROM_MIME.keys())
MAX_BYTES = 25 * 1024 * 1024   # 25MB


def _ensure_dir(p: Path) -> None:
    p.mkdir(parents=True, exist_ok=True)


def _generate_token() -> str:
    return secrets.token_urlsafe(48)


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()[:32]


def _build_link(token: str) -> str:
    base = (getattr(settings, "FRONTEND_URL", "") or "").rstrip("/")
    if not base:
        base = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
    return f"{base}/upload/{token}"


# ────────────────────────────────────────────────────────────
#  토큰
# ────────────────────────────────────────────────────────────
async def create_upload_token(
    db: AsyncSession,
    *,
    user_id: UUID,
    visit_id: UUID,
    patient_id: Optional[UUID] = None,
    label: Optional[str] = None,
    expires_in_minutes: int = 30,
    max_uploads: int = 20,
) -> Tuple[VisitUploadToken, str]:
    """토큰 생성 + 환자 폰으로 보낼 링크 반환."""
    token = _generate_token()
    rec = VisitUploadToken(
        token=token,
        user_id=user_id,
        visit_id=visit_id,
        patient_id=patient_id,
        label=label,
        expires_at=datetime.utcnow() + timedelta(minutes=expires_in_minutes),
        max_uploads=max_uploads,
    )
    db.add(rec)
    await db.commit()
    return rec, _build_link(token)


async def fetch_token(db: AsyncSession, token: str) -> Optional[VisitUploadToken]:
    if not token or len(token) < 16:
        return None
    q = select(VisitUploadToken).where(VisitUploadToken.token == token)
    return (await db.execute(q)).scalar_one_or_none()


def is_token_valid(rec: VisitUploadToken) -> Tuple[bool, str]:
    now = datetime.utcnow()
    if rec.expires_at < now:
        return False, "만료된 링크입니다. 차트에서 새로 발급해 주세요."
    if rec.used_count >= rec.max_uploads:
        return False, "업로드 한도에 도달했어요."
    return True, ""


# ────────────────────────────────────────────────────────────
#  업로드 처리
# ────────────────────────────────────────────────────────────
async def save_upload(
    db: AsyncSession,
    *,
    user_id: UUID,
    visit_id: UUID,
    patient_id: Optional[UUID],
    file: UploadFile,
    description: Optional[str] = None,
    taken_at: Optional[datetime] = None,
    upload_token: Optional[str] = None,
    attachment_type: AttachmentType = AttachmentType.PHOTO,
) -> VisitAttachment:
    """multipart UploadFile → 디스크 저장 → DB row 생성."""
    content = await file.read()
    if len(content) > MAX_BYTES:
        raise ValueError(f"파일이 너무 큽니다 (최대 {MAX_BYTES // (1024*1024)}MB).")

    mime = file.content_type or mimetypes.guess_type(file.filename or "")[0] or "application/octet-stream"
    if mime not in ALLOWED_MIME:
        # 일단 허용 (모바일 브라우저는 가끔 빈 mime)
        ext = (Path(file.filename or "").suffix.lstrip(".") or "bin").lower()
        if ext not in {"jpg", "jpeg", "png", "webp", "heic", "pdf"}:
            raise ValueError(f"허용되지 않은 파일 형식: {mime}")
    else:
        ext = EXT_FROM_MIME[mime]

    target_dir = UPLOAD_DIR / "visits" / str(visit_id)
    _ensure_dir(target_dir)
    fname = f"{uuid_lib.uuid4().hex}.{ext}"
    fpath = target_dir / fname
    fpath.write_bytes(content)

    url = f"{URL_PREFIX}/visits/{visit_id}/{fname}"

    att = VisitAttachment(
        user_id=user_id,
        visit_id=visit_id,
        patient_id=patient_id,
        file_name=file.filename or fname,
        file_url=url,
        thumbnail_url=url,        # 동일 (추후 썸네일 생성 시 분리)
        mime_type=mime,
        size_bytes=len(content),
        attachment_type=attachment_type,
        description=description,
        taken_at=taken_at or datetime.utcnow(),
        upload_token_hash=_hash_token(upload_token) if upload_token else None,
    )
    db.add(att)
    await db.commit()
    await db.refresh(att)
    return att


async def increment_token_used(
    db: AsyncSession, rec: VisitUploadToken
) -> None:
    rec.used_count = (rec.used_count or 0) + 1
    await db.commit()


# ────────────────────────────────────────────────────────────
#  목록/삭제
# ────────────────────────────────────────────────────────────
async def list_for_visit(
    db: AsyncSession, *, user_id: UUID, visit_id: UUID
) -> list[VisitAttachment]:
    q = select(VisitAttachment).where(and_(
        VisitAttachment.user_id == user_id,
        VisitAttachment.visit_id == visit_id,
    )).order_by(VisitAttachment.uploaded_at.desc())
    return list((await db.execute(q)).scalars().all())


async def delete_attachment(
    db: AsyncSession, *, user_id: UUID, attachment_id: UUID
) -> bool:
    q = select(VisitAttachment).where(and_(
        VisitAttachment.id == attachment_id,
        VisitAttachment.user_id == user_id,
    ))
    att = (await db.execute(q)).scalar_one_or_none()
    if not att:
        return False
    # 디스크에서도 삭제 시도
    try:
        if att.file_url and att.file_url.startswith(URL_PREFIX):
            rel = att.file_url[len(URL_PREFIX):].lstrip("/")
            fpath = UPLOAD_DIR / rel
            if fpath.exists() and fpath.is_file():
                fpath.unlink()
    except Exception:
        pass
    await db.delete(att)
    await db.commit()
    return True
