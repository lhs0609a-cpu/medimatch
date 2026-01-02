"""
파트너 구독 모델
"""
import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class SubscriptionPlan(str, enum.Enum):
    """구독 플랜"""
    FREE = "FREE"           # 무료 (리드 건당 과금)
    BASIC = "BASIC"         # 기본 (월 30만원, 리드 10건)
    STANDARD = "STANDARD"   # 스탠다드 (월 50만원, 리드 30건)
    PREMIUM = "PREMIUM"     # 프리미엄 (월 100만원, 무제한 + 상위노출)


class PartnerSubscription(Base):
    """파트너 구독"""
    __tablename__ = "partner_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    partner_id = Column(Integer, ForeignKey("partners.id"), nullable=False, unique=True)

    # 플랜 정보
    plan = Column(SQLEnum(SubscriptionPlan), default=SubscriptionPlan.FREE)

    # 리드 잔여량
    leads_total = Column(Integer, default=0)  # 총 제공 리드 수
    leads_used = Column(Integer, default=0)  # 사용한 리드 수
    leads_remaining = Column(Integer, default=0)  # 남은 리드 수 (-1 = 무제한)

    # 구독 기간
    started_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)

    # 자동 갱신
    is_auto_renew = Column(Boolean, default=False)
    billing_key = Column(String(200), nullable=True)  # 자동결제용

    # 상태
    is_active = Column(Boolean, default=True)
    canceled_at = Column(DateTime, nullable=True)

    # 결제 정보
    last_payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True)
    next_billing_date = Column(DateTime, nullable=True)
    monthly_fee = Column(Integer, default=0)  # 월 구독료

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    partner = relationship("Partner", back_populates="subscription")
    last_payment = relationship("Payment", foreign_keys=[last_payment_id])


# 플랜별 설정
SUBSCRIPTION_PLANS = {
    SubscriptionPlan.FREE: {
        "name": "무료",
        "monthly_fee": 0,
        "leads_per_month": 0,  # 건당 과금
        "features": ["기본 프로필", "리드 건당 과금"]
    },
    SubscriptionPlan.BASIC: {
        "name": "베이직",
        "monthly_fee": 300000,
        "leads_per_month": 10,
        "features": ["월 10건 리드", "기본 프로필"]
    },
    SubscriptionPlan.STANDARD: {
        "name": "스탠다드",
        "monthly_fee": 500000,
        "leads_per_month": 30,
        "features": ["월 30건 리드", "포트폴리오 5개", "검색 우선 노출"]
    },
    SubscriptionPlan.PREMIUM: {
        "name": "프리미엄",
        "monthly_fee": 1000000,
        "leads_per_month": -1,  # 무제한
        "features": ["무제한 리드", "포트폴리오 무제한", "최상단 노출", "프리미엄 배지"]
    },
}
