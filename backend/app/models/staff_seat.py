"""직원(staff seat) 모델 — 사용자 ID당 과금 단위."""
import enum
from sqlalchemy import (
    Column, String, Boolean, DateTime, Text, Enum, ForeignKey, text,
)
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime

from app.core.database import Base


class StaffRole(str, enum.Enum):
    OWNER = "OWNER"
    DOCTOR = "DOCTOR"
    NURSE = "NURSE"
    COORDINATOR = "COORDINATOR"
    RECEPTION = "RECEPTION"
    ASSISTANT = "ASSISTANT"
    PHARMACIST = "PHARMACIST"
    OTHER = "OTHER"


class StaffStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    PENDING = "PENDING"
    SUSPENDED = "SUSPENDED"


class StaffSeat(Base):
    __tablename__ = "staff_seats"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    owner_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    linked_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    name = Column(String(100), nullable=False)
    role = Column(Enum(StaffRole, name="staffrole", create_type=False), default=StaffRole.OTHER, nullable=False)
    status = Column(
        Enum(StaffStatus, name="staffstatus", create_type=False),
        default=StaffStatus.ACTIVE, nullable=False,
    )
    email = Column(String(255))
    phone = Column(String(20))
    license_no = Column(String(50))
    memo = Column(Text)
    added_at = Column(DateTime, default=datetime.utcnow)
    deactivated_at = Column(DateTime)
    billable = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
