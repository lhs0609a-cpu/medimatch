"""
서비스 정기구독 모델 (홈페이지 제작 / 프로그램 개발 / 클라우드 EMR)

- 홈페이지: STARTER ₩150만/월, GROWTH ₩300만/월, PREMIUM ₩500만/월
- 프로그램: STANDARD ₩30만/월 (단일)
- EMR: STARTER 무료, GROWTH ₩120만/월, PREMIUM ₩250만/월
- 빌링키 기반 정기결제, 구독 만료 시 서비스 중단
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base


class ServiceType(str, enum.Enum):
    HOMEPAGE = "HOMEPAGE"
    PROGRAM = "PROGRAM"
    EMR = "EMR"


class ServiceTier(str, enum.Enum):
    STARTER = "STARTER"
    GROWTH = "GROWTH"
    PREMIUM = "PREMIUM"
    STANDARD = "STANDARD"


class ServiceSubStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    CANCELED = "CANCELED"       # 현재 기간 종료까지 유지
    EXPIRED = "EXPIRED"         # 기간 만료
    PAST_DUE = "PAST_DUE"      # 결제 실패 재시도 중
    SUSPENDED = "SUSPENDED"     # 재시도 3회 초과


# 가격 매핑 (원)
SERVICE_PRICING = {
    (ServiceType.HOMEPAGE, ServiceTier.STARTER): 1_500_000,
    (ServiceType.HOMEPAGE, ServiceTier.GROWTH): 3_000_000,
    (ServiceType.HOMEPAGE, ServiceTier.PREMIUM): 5_000_000,
    (ServiceType.PROGRAM, ServiceTier.STANDARD): 300_000,
    (ServiceType.EMR, ServiceTier.STARTER): 0,  # 무료 체험 (트로이 목마 전략)
    (ServiceType.EMR, ServiceTier.GROWTH): 1_200_000,
    (ServiceType.EMR, ServiceTier.PREMIUM): 2_500_000,
}


def get_service_price(service_type: ServiceType, tier: ServiceTier) -> int:
    """서비스 타입 + 티어로 월 금액 조회"""
    return SERVICE_PRICING.get((service_type, tier), 0)


class ServiceSubscription(Base):
    """서비스 정기구독 (홈페이지/프로그램)"""
    __tablename__ = "service_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # 서비스 정보
    service_type = Column(Enum(ServiceType), nullable=False)
    tier = Column(Enum(ServiceTier), nullable=False)

    # 빌링키 정보
    billing_key = Column(String(200), nullable=False)
    customer_key = Column(String(100), nullable=False)
    card_company = Column(String(50), nullable=True)
    card_number = Column(String(50), nullable=True)  # 마스킹: "****1234"

    # 구독 상태
    status = Column(Enum(ServiceSubStatus), default=ServiceSubStatus.ACTIVE, nullable=False)

    # 구독 기간
    current_period_start = Column(DateTime, nullable=False)
    current_period_end = Column(DateTime, nullable=False)
    next_billing_date = Column(DateTime, nullable=False)

    # 금액
    monthly_amount = Column(Integer, nullable=False)

    # 결제 실패 재시도
    retry_count = Column(Integer, default=0, nullable=False)
    last_retry_at = Column(DateTime, nullable=True)

    # 취소 정보
    canceled_at = Column(DateTime, nullable=True)
    cancel_reason = Column(Text, nullable=True)

    # 고객사 정보 (상담 시 수집)
    company_name = Column(String(200), nullable=True)
    contact_person = Column(String(100), nullable=True)
    contact_phone = Column(String(20), nullable=True)

    # 결제 연결
    last_payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계
    user = relationship("User", backref="service_subscriptions")
    last_payment = relationship("Payment", foreign_keys=[last_payment_id])

    __table_args__ = (
        UniqueConstraint("user_id", "service_type", name="uq_user_service_type"),
        Index("ix_service_sub_status", "status"),
        Index("ix_service_sub_next_billing", "next_billing_date"),
        Index("ix_service_sub_type", "service_type"),
    )
