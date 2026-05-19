"""
환자 태그 사전 — 의원이 자유롭게 정의하는 운영 태그(VIP/연예인/외국인/주의 등).

Patient.tags (JSONB list of strings) 는 이 사전의 name 값을 참조.
별도 m2m 테이블 대신 ARRAY+JOIN 으로 빠르게 처리.
"""
import uuid
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey, Index, UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class PatientTag(Base):
    __tablename__ = "patient_tags"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    name = Column(String(50), nullable=False)             # 예: "VIP", "연예인", "일본", "임신부"
    color = Column(String(20), default="slate")           # tailwind color name
    icon = Column(String(50))                              # lucide icon name (optional)
    description = Column(String(200))
    sort_order = Column(Integer, default=100, nullable=False)
    is_system = Column(Boolean, default=False, nullable=False)  # 시스템 기본 태그 (삭제 불가)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_patient_tag_user_name"),
        Index("ix_pttag_user", "user_id"),
    )
