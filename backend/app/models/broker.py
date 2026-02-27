"""
부동산 중개 관리 시스템 모델

- Broker: 플랫폼 소속 중개인
- BrokerageDeal: 중개 딜 파이프라인
- DealCommission: 딜별 커미션 정산
- SuspiciousActivity: 우회거래 의심 감시
"""
import uuid
import enum
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, BigInteger, Float, Text, DateTime,
    ForeignKey, Boolean, Index
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base


# ===== Enums =====

class BrokerStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    TERMINATED = "TERMINATED"


class BrokerTier(str, enum.Enum):
    JUNIOR = "JUNIOR"
    SENIOR = "SENIOR"
    TEAM_LEAD = "TEAM_LEAD"
    DIRECTOR = "DIRECTOR"


class DealStatus(str, enum.Enum):
    LEAD = "LEAD"
    CONTACTED = "CONTACTED"
    VIEWING_SCHEDULED = "VIEWING_SCHEDULED"
    VIEWED = "VIEWED"
    NEGOTIATING = "NEGOTIATING"
    CONTRACT_PENDING = "CONTRACT_PENDING"
    CONTRACTED = "CONTRACTED"
    CLOSED_WON = "CLOSED_WON"
    CLOSED_LOST = "CLOSED_LOST"


# Ordered stages for transition validation
DEAL_STATUS_ORDER = [
    DealStatus.LEAD,
    DealStatus.CONTACTED,
    DealStatus.VIEWING_SCHEDULED,
    DealStatus.VIEWED,
    DealStatus.NEGOTIATING,
    DealStatus.CONTRACT_PENDING,
    DealStatus.CONTRACTED,
    DealStatus.CLOSED_WON,
]


class DealCloseReason(str, enum.Enum):
    COMPLETED = "COMPLETED"
    DOCTOR_CANCELLED = "DOCTOR_CANCELLED"
    LANDLORD_CANCELLED = "LANDLORD_CANCELLED"
    PRICE_MISMATCH = "PRICE_MISMATCH"
    LOCATION_MISMATCH = "LOCATION_MISMATCH"
    COMPETITOR = "COMPETITOR"
    CIRCUMVENTION = "CIRCUMVENTION"
    OTHER = "OTHER"


class CommissionType(str, enum.Enum):
    PLATFORM = "PLATFORM"
    BROKER = "BROKER"
    LANDLORD = "LANDLORD"


class CommissionPaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    PAID = "PAID"
    CANCELLED = "CANCELLED"


class SuspiciousActivityType(str, enum.Enum):
    DEAL_CLOSED_THEN_CONTRACTED = "DEAL_CLOSED_THEN_CONTRACTED"
    CONTACT_DETECTED = "CONTACT_DETECTED"
    RAPID_STATUS_CHANGE = "RAPID_STATUS_CHANGE"
    EXTERNAL_CONTRACT_SUSPECTED = "EXTERNAL_CONTRACT_SUSPECTED"


# ===== Models =====

class Broker(Base):
    """플랫폼 소속 중개인"""
    __tablename__ = "brokers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)

    # 자격
    license_number = Column(String(50), nullable=True)
    brokerage_office_name = Column(String(200), nullable=True)
    brokerage_registration = Column(String(100), nullable=True)

    # 프로필
    display_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    email = Column(String(200), nullable=True)
    profile_image_url = Column(String(500), nullable=True)
    introduction = Column(Text, nullable=True)

    # 담당
    assigned_regions = Column(JSONB, default=[])
    assigned_specialties = Column(JSONB, default=[])

    # 등급/상태
    tier = Column(SQLEnum(BrokerTier), default=BrokerTier.JUNIOR, nullable=False)
    status = Column(SQLEnum(BrokerStatus), default=BrokerStatus.PENDING, nullable=False)

    # 성과 캐시
    total_deals = Column(Integer, default=0)
    closed_won_deals = Column(Integer, default=0)
    total_commission_earned = Column(BigInteger, default=0)
    avg_deal_days = Column(Float, default=0)
    current_active_deals = Column(Integer, default=0)

    # 커미션 비율
    commission_rate = Column(Float, default=60.0)  # 중개인 몫 %

    # 정산
    payout_bank = Column(String(50), nullable=True)
    payout_account = Column(String(50), nullable=True)
    payout_holder = Column(String(50), nullable=True)

    # 검증
    is_verified = Column(Boolean, default=False)
    verified_at = Column(DateTime, nullable=True)
    verification_docs = Column(JSONB, default=[])

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계
    user = relationship("User", backref="broker_profile")
    deals = relationship("BrokerageDeal", back_populates="broker", lazy="dynamic")

    __table_args__ = (
        Index("ix_broker_status", "status"),
        Index("ix_broker_tier", "tier"),
        Index("ix_broker_user", "user_id"),
    )

    def __repr__(self):
        return f"<Broker {self.id} - {self.display_name}>"


class BrokerageDeal(Base):
    """중개 딜 파이프라인"""
    __tablename__ = "brokerage_deals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    deal_number = Column(String(30), unique=True, nullable=False)

    # FK
    broker_id = Column(Integer, ForeignKey("brokers.id", ondelete="SET NULL"), nullable=True)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    listing_id = Column(UUID(as_uuid=True), ForeignKey("landlord_listings.id"), nullable=True)

    # 기본
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(SQLEnum(DealStatus), default=DealStatus.LEAD, nullable=False)
    close_reason = Column(SQLEnum(DealCloseReason), nullable=True)
    close_note = Column(Text, nullable=True)

    # 재무 (예상)
    expected_rent_deposit = Column(BigInteger, nullable=True)
    expected_monthly_rent = Column(BigInteger, nullable=True)
    expected_premium = Column(BigInteger, nullable=True)
    expected_commission = Column(BigInteger, nullable=True)

    # 재무 (실제)
    actual_rent_deposit = Column(BigInteger, nullable=True)
    actual_monthly_rent = Column(BigInteger, nullable=True)
    actual_premium = Column(BigInteger, nullable=True)
    actual_commission = Column(BigInteger, nullable=True)

    # 건물주/의사 커미션
    landlord_commission = Column(BigInteger, default=0)
    doctor_commission = Column(BigInteger, default=0)

    # 비용
    marketing_cost = Column(BigInteger, default=0)
    ad_cost = Column(BigInteger, default=0)

    # 일정
    viewing_scheduled_at = Column(DateTime, nullable=True)
    viewed_at = Column(DateTime, nullable=True)
    contract_date = Column(DateTime, nullable=True)
    move_in_date = Column(DateTime, nullable=True)

    # 메모
    admin_notes = Column(Text, nullable=True)
    broker_notes = Column(Text, nullable=True)

    # 활동 이력 (append-only JSONB)
    activity_log = Column(JSONB, default=[])

    # 우회 감시
    circumvention_flag = Column(Boolean, default=False)
    circumvention_reason = Column(Text, nullable=True)
    circumvention_flagged_at = Column(DateTime, nullable=True)

    # 리드
    lead_source = Column(String(100), nullable=True)
    lead_score = Column(Integer, default=0)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계
    broker = relationship("Broker", back_populates="deals")
    doctor = relationship("User", foreign_keys=[doctor_id], backref="brokerage_deals_as_doctor")
    listing = relationship("LandlordListing", backref="brokerage_deals")
    commissions = relationship("DealCommission", back_populates="deal", lazy="selectin")

    __table_args__ = (
        Index("ix_deal_status", "status"),
        Index("ix_deal_broker", "broker_id"),
        Index("ix_deal_doctor", "doctor_id"),
        Index("ix_deal_listing", "listing_id"),
        Index("ix_deal_number", "deal_number"),
        Index("ix_deal_circumvention", "circumvention_flag"),
    )

    def __repr__(self):
        return f"<BrokerageDeal {self.deal_number}>"


class DealCommission(Base):
    """딜별 커미션 정산"""
    __tablename__ = "deal_commissions"

    id = Column(Integer, primary_key=True, index=True)
    deal_id = Column(UUID(as_uuid=True), ForeignKey("brokerage_deals.id", ondelete="CASCADE"), nullable=False)

    commission_type = Column(SQLEnum(CommissionType), nullable=False)
    gross_amount = Column(BigInteger, default=0)
    tax_amount = Column(BigInteger, default=0)
    marketing_deduction = Column(BigInteger, default=0)
    ad_deduction = Column(BigInteger, default=0)
    net_amount = Column(BigInteger, default=0)

    payment_status = Column(
        SQLEnum(CommissionPaymentStatus),
        default=CommissionPaymentStatus.PENDING,
        nullable=False,
    )
    approved_at = Column(DateTime, nullable=True)
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    paid_at = Column(DateTime, nullable=True)
    payment_reference = Column(String(200), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계
    deal = relationship("BrokerageDeal", back_populates="commissions")
    approver = relationship("User", foreign_keys=[approved_by])

    __table_args__ = (
        Index("ix_commission_deal", "deal_id"),
        Index("ix_commission_status", "payment_status"),
        Index("ix_commission_type", "commission_type"),
    )


class SuspiciousActivity(Base):
    """우회거래 의심 감시"""
    __tablename__ = "suspicious_activities"

    id = Column(Integer, primary_key=True, index=True)
    deal_id = Column(UUID(as_uuid=True), ForeignKey("brokerage_deals.id"), nullable=True)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    broker_id = Column(Integer, ForeignKey("brokers.id"), nullable=True)
    listing_id = Column(UUID(as_uuid=True), ForeignKey("landlord_listings.id"), nullable=True)

    activity_type = Column(SQLEnum(SuspiciousActivityType), nullable=False)
    severity = Column(String(20), default="LOW")  # LOW, MEDIUM, HIGH, CRITICAL
    description = Column(Text, nullable=True)
    evidence = Column(JSONB, default={})

    is_resolved = Column(Boolean, default=False)
    resolved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    resolution_note = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # 관계
    deal = relationship("BrokerageDeal", backref="suspicious_activities")
    doctor = relationship("User", foreign_keys=[doctor_id])
    broker = relationship("Broker", backref="suspicious_activities")
    listing = relationship("LandlordListing", backref="suspicious_activities")
    resolver = relationship("User", foreign_keys=[resolved_by])

    __table_args__ = (
        Index("ix_suspicious_type", "activity_type"),
        Index("ix_suspicious_resolved", "is_resolved"),
        Index("ix_suspicious_severity", "severity"),
    )
