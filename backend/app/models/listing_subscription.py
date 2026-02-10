"""
매물 등록 정기구독 모델
- 월 150,000원 빌링키 기반 정기결제
- 매월 매물 등록 크레딧 1건 부여
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base


class ListingSubStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    CANCELED = "CANCELED"       # 현재 기간 종료까지 유지
    EXPIRED = "EXPIRED"         # 기간 만료
    PAST_DUE = "PAST_DUE"      # 결제 실패 재시도 중
    SUSPENDED = "SUSPENDED"     # 재시도 3회 초과


class ListingSubscription(Base):
    """매물 등록 정기구독"""
    __tablename__ = "listing_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)

    # 빌링키 정보
    billing_key = Column(String(200), nullable=False)
    customer_key = Column(String(100), nullable=False)
    card_company = Column(String(50), nullable=True)
    card_number = Column(String(50), nullable=True)  # 마스킹: "****1234"

    # 구독 상태
    status = Column(Enum(ListingSubStatus), default=ListingSubStatus.ACTIVE, nullable=False)

    # 구독 기간
    current_period_start = Column(DateTime, nullable=False)
    current_period_end = Column(DateTime, nullable=False)
    next_billing_date = Column(DateTime, nullable=False)

    # 크레딧
    total_credits = Column(Integer, default=0, nullable=False)
    used_credits = Column(Integer, default=0, nullable=False)

    # 결제 실패 재시도
    retry_count = Column(Integer, default=0, nullable=False)
    last_retry_at = Column(DateTime, nullable=True)

    # 취소 정보
    canceled_at = Column(DateTime, nullable=True)
    cancel_reason = Column(Text, nullable=True)

    # 결제 연결
    last_payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True)
    monthly_amount = Column(Integer, default=150000, nullable=False)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계
    user = relationship("User", backref="listing_subscription")
    last_payment = relationship("Payment", foreign_keys=[last_payment_id])

    __table_args__ = (
        Index("ix_listing_sub_status", "status"),
        Index("ix_listing_sub_next_billing", "next_billing_date"),
    )
