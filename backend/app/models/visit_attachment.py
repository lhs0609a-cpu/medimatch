"""차트 첨부파일 모델 — 폰 카메라/스캔 등 시각 자료."""
import enum
from sqlalchemy import (
    Column, Integer, BigInteger, String, DateTime, Text, Enum, ForeignKey, text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class AttachmentType(str, enum.Enum):
    PHOTO = "PHOTO"
    DOC = "DOC"
    SCAN = "SCAN"
    OTHER = "OTHER"


class VisitAttachment(Base):
    __tablename__ = "visit_attachments"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    visit_id = Column(UUID(as_uuid=True), ForeignKey("visits.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="SET NULL"))

    file_name = Column(String(255), nullable=False)
    file_url = Column(Text, nullable=False)
    thumbnail_url = Column(Text)
    mime_type = Column(String(100))
    size_bytes = Column(BigInteger)
    attachment_type = Column(
        Enum(AttachmentType, name="attachmenttype", create_type=False),
        default=AttachmentType.PHOTO,
        nullable=False,
    )
    description = Column(Text)
    taken_at = Column(DateTime)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    upload_token_hash = Column(String(80))
    created_at = Column(DateTime, default=datetime.utcnow)


class VisitUploadToken(Base):
    __tablename__ = "visit_upload_tokens"

    token = Column(String(80), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    visit_id = Column(UUID(as_uuid=True), ForeignKey("visits.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="SET NULL"))
    label = Column(String(100))
    expires_at = Column(DateTime, nullable=False)
    max_uploads = Column(Integer, default=20, nullable=False)
    used_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
