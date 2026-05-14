"""의원 셋업 — 5분 온보딩의 결과 저장."""
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime

from app.core.database import Base


class ClinicSetup(Base):
    __tablename__ = "clinic_setup"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    clinic_name = Column(String(200))
    primary_specialty = Column(String(40))
    secondary_specialties = Column(JSONB, default=list)
    doctor_names = Column(JSONB, default=list)
    hours_open = Column(String(20))
    hours_close = Column(String(20))
    lunch_open = Column(String(20))
    lunch_close = Column(String(20))
    weekday_pattern = Column(String(20))
    applied_template = Column(String(40))
    applied_template_at = Column(DateTime)
    completed_steps = Column(JSONB, default=list)
    completed_at = Column(DateTime)
    skipped_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
