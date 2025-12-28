"""
결제 관련 모델
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base


class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELED = "CANCELED"
    REFUNDED = "REFUNDED"


class PaymentMethod(str, enum.Enum):
    CARD = "CARD"
    VIRTUAL_ACCOUNT = "VIRTUAL_ACCOUNT"
    TRANSFER = "TRANSFER"
    MOBILE = "MOBILE"


class Payment(Base):
    """결제 기록"""
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    order_id = Column(String(100), unique=True, nullable=False, index=True)
    payment_key = Column(String(200), unique=True, nullable=True)

    product_id = Column(String(50), nullable=False)
    product_name = Column(String(200), nullable=False)
    amount = Column(Integer, nullable=False)

    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    method = Column(Enum(PaymentMethod), nullable=True)

    # 결제 상세 정보
    card_company = Column(String(50), nullable=True)
    card_number = Column(String(50), nullable=True)
    receipt_url = Column(String(500), nullable=True)

    # 취소 정보
    cancel_reason = Column(Text, nullable=True)
    canceled_at = Column(DateTime, nullable=True)
    cancel_amount = Column(Integer, nullable=True)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계
    user = relationship("User", back_populates="payments")


class Subscription(Base):
    """구독 정보"""
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    plan = Column(String(50), nullable=False)  # monthly, yearly
    product_id = Column(String(50), nullable=False)

    status = Column(String(20), default="ACTIVE")  # ACTIVE, CANCELED, EXPIRED
    is_auto_renew = Column(Boolean, default=True)

    started_at = Column(DateTime, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    canceled_at = Column(DateTime, nullable=True)

    # 결제 정보
    billing_key = Column(String(200), nullable=True)  # 자동결제용
    last_payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계
    user = relationship("User", back_populates="subscriptions")
    last_payment = relationship("Payment", foreign_keys=[last_payment_id])


class UsageCredit(Base):
    """사용량 크레딧 (시뮬레이션 리포트 등)"""
    __tablename__ = "usage_credits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    credit_type = Column(String(50), nullable=False)  # simulation_report
    total_credits = Column(Integer, default=0)
    used_credits = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계
    user = relationship("User", back_populates="credits")
