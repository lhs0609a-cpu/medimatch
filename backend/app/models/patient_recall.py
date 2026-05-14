"""환자 리콜 / 캠페인 모델 — EMR CRM 탭

- RecallCampaign: 정기검진/시즌별 일괄 발송 캠페인
- RecallSend: 개별 환자에게 보낸/보낼 알림톡 한 건
- 리콜 대상은 patients + chronic_care_programs에서 동적 산출
"""
import enum
from sqlalchemy import (
    Column, Integer, String, Date, DateTime, Text, Enum,
    ForeignKey, Index, text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class RecallCampaignStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SCHEDULED = "SCHEDULED"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class RecallSendStatus(str, enum.Enum):
    PENDING = "PENDING"
    SENT = "SENT"
    FAILED = "FAILED"
    OPENED = "OPENED"
    RESPONDED = "RESPONDED"
    BOOKED = "BOOKED"
    NO_RESPONSE = "NO_RESPONSE"


class RecallChannel(str, enum.Enum):
    KAKAO = "KAKAO"
    SMS = "SMS"
    BOTH = "BOTH"


class RecallCampaign(Base):
    __tablename__ = "recall_campaigns"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(200), nullable=False)
    target_group = Column(String(100), nullable=False, default="chronic")
    channel = Column(
        Enum(RecallChannel, name="recallchannel", create_type=False),
        nullable=False, default=RecallChannel.KAKAO,
    )
    message_template = Column(Text)
    status = Column(
        Enum(RecallCampaignStatus, name="recallcampaignstatus", create_type=False),
        nullable=False, default=RecallCampaignStatus.DRAFT,
    )
    scheduled_at = Column(DateTime)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    target_count = Column(Integer, nullable=False, default=0)
    sent_count = Column(Integer, nullable=False, default=0)
    opened_count = Column(Integer, nullable=False, default=0)
    booked_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    sends = relationship("RecallSend", backref="campaign", cascade="all, delete-orphan", passive_deletes=True)

    __table_args__ = (
        Index("ix_rcm_user", "user_id"),
        Index("ix_rcm_status", "status"),
    )


class RecallSend(Base):
    __tablename__ = "recall_sends"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("recall_campaigns.id", ondelete="SET NULL"))
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="SET NULL"))
    patient_name = Column(String(100))
    phone = Column(String(20))
    reason = Column(String(200))
    priority = Column(String(10), default="medium")
    channel = Column(
        Enum(RecallChannel, name="recallchannel", create_type=False),
        nullable=False, default=RecallChannel.KAKAO,
    )
    status = Column(
        Enum(RecallSendStatus, name="recallsendstatus", create_type=False),
        nullable=False, default=RecallSendStatus.PENDING,
    )
    provider_status = Column(String(50))
    provider_message = Column(Text)
    sent_at = Column(DateTime)
    responded_at = Column(DateTime)
    booked_at = Column(DateTime)
    last_visit_date = Column(Date)
    days_since_last_visit = Column(Integer)

    # 발송자 추적 (원장 vs 직원/코디네이터 — staff_seat 협업용)
    sent_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    sent_by_role = Column(String(20))

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_rcs_user", "user_id"),
        Index("ix_rcs_campaign", "campaign_id"),
        Index("ix_rcs_status", "status"),
        Index("ix_rcs_patient", "patient_id"),
        Index("ix_rcs_user_created", "user_id", "created_at"),
        Index("ix_rcs_patient_created", "patient_id", "created_at"),
    )
