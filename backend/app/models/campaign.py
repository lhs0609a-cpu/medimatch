"""
캠페인 모델 -- 아웃바운드 캠페인 이력 영속화
"""
import enum
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Text, DateTime,
    ForeignKey, Index
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base


class CampaignStatus(str, enum.Enum):
    PENDING = "PENDING"
    SCHEDULED = "SCHEDULED"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class CampaignType(str, enum.Enum):
    SMS = "SMS"
    EMAIL = "EMAIL"


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(String(36), primary_key=True)  # UUID string
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(200), nullable=False)
    campaign_type = Column(SQLEnum(CampaignType), nullable=False)
    target_grade = Column(String(10), nullable=False)  # HOT/WARM/COLD
    status = Column(SQLEnum(CampaignStatus), default=CampaignStatus.PENDING)
    scheduled_time = Column(String(50), nullable=True)
    total_targets = Column(Integer, default=0)
    sent_count = Column(Integer, default=0)
    delivered_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    message_template = Column(Text, nullable=True)
    campaign_metadata = Column(JSONB, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    author = relationship("User", backref="campaigns")

    __table_args__ = (
        Index("ix_campaign_user", "user_id"),
        Index("ix_campaign_status", "status"),
        Index("ix_campaign_type", "campaign_type"),
        Index("ix_campaign_created", "created_at"),
    )
