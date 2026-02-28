"""
마케팅 ROI 분석 모델

- 채널별 마케팅 지출/성과/ROI
- channel: NAVER_BLOG / NAVER_ADS / GOOGLE_ADS / KAKAO / OFFLINE_FLYER / REFERRAL / SNS / OTHER
"""
from sqlalchemy import (
    Column, Integer, BigInteger, String, Boolean, DateTime, Text,
    ForeignKey, Index, UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class MarketingSpend(Base):
    """채널별 마케팅 지출/성과"""
    __tablename__ = "marketing_spends"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default="gen_random_uuid()")
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    year_month = Column(String(7), nullable=False)
    channel = Column(String(30), nullable=False, default="OTHER")
    spend_amount = Column(BigInteger, default=0)
    new_patients_acquired = Column(Integer, default=0)
    inquiries_count = Column(Integer, default=0)
    appointments_booked = Column(Integer, default=0)
    attributed_revenue = Column(BigInteger, default=0)
    notes = Column(Text)

    is_demo = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", backref="marketing_spends")

    __table_args__ = (
        UniqueConstraint("user_id", "channel", "year_month", name="uq_marketing_user_channel_month"),
        Index("ix_marketing_user_month", "user_id", "year_month"),
        Index("ix_marketing_channel", "channel"),
    )
