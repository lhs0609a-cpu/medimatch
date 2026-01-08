import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from ..core.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    PHARMACIST = "PHARMACIST"
    SALES_REP = "SALES_REP"
    DOCTOR = "DOCTOR"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    role = Column(SQLEnum(UserRole), default=UserRole.DOCTOR, nullable=False)
    company = Column(String(200), nullable=True)  # For SALES_REP
    license_number = Column(String(50), nullable=True)  # For PHARMACIST/DOCTOR
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    # OAuth 연결 정보
    oauth_provider = Column(String(20), nullable=True)  # google, naver, kakao
    oauth_provider_id = Column(String(255), nullable=True)  # OAuth provider's user ID

    # 개원 준비 관련 필드 (DOCTOR용)
    is_opening_preparation = Column(Boolean, default=False)  # 개원 준비중 여부
    opening_region = Column(String(100), nullable=True)  # 희망 개원 지역 (시/구)
    opening_region_detail = Column(String(200), nullable=True)  # 상세 지역
    specialty = Column(String(50), nullable=True)  # 진료과목
    opening_status = Column(String(50), nullable=True)  # 개원 준비 상태: PLANNING, SEARCHING, NEGOTIATING
    expected_opening_date = Column(String(20), nullable=True)  # 예상 개원 시기 (YYYY-MM 형식)
    planned_clinic_name = Column(String(200), nullable=True)  # 예정 병원명

    # Relationships
    bids = relationship("Bid", back_populates="pharmacist")
    alerts = relationship("UserAlert", back_populates="user")
    simulations = relationship("Simulation", back_populates="user")
    partner_inquiries = relationship("PartnerInquiry", back_populates="user")
    payments = relationship("Payment", back_populates="user")
    subscriptions = relationship("Subscription", back_populates="user")
    credits = relationship("UsageCredit", back_populates="user")
    partner = relationship("Partner", back_populates="user", uselist=False)
    devices = relationship("UserDevice", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("UserNotification", back_populates="user", cascade="all, delete-orphan")
    notification_preference = relationship("NotificationPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.email}>"
