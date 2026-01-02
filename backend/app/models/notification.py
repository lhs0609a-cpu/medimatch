"""
알림 관련 모델
- UserDevice: 푸시 알림을 위한 디바이스 토큰
- UserNotification: 사용자 알림 내역
- NotificationPreference: 알림 설정
"""
import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum, Integer, Text, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from ..core.database import Base


class DevicePlatform(str, enum.Enum):
    WEB = "WEB"
    IOS = "IOS"
    ANDROID = "ANDROID"


class NotificationType(str, enum.Enum):
    # 시스템
    WELCOME = "WELCOME"
    SYSTEM = "SYSTEM"

    # 프로스펙트/입지
    PROSPECT_NEW = "PROSPECT_NEW"
    PROSPECT_ALERT = "PROSPECT_ALERT"
    CLOSED_HOSPITAL = "CLOSED_HOSPITAL"

    # 파트너/채팅
    PARTNER_INQUIRY = "PARTNER_INQUIRY"
    PARTNER_RESPONSE = "PARTNER_RESPONSE"
    CHAT_MESSAGE = "CHAT_MESSAGE"

    # 결제/에스크로
    PAYMENT_SUCCESS = "PAYMENT_SUCCESS"
    PAYMENT_FAILED = "PAYMENT_FAILED"
    ESCROW_FUNDED = "ESCROW_FUNDED"
    ESCROW_RELEASED = "ESCROW_RELEASED"
    MILESTONE_SUBMITTED = "MILESTONE_SUBMITTED"
    MILESTONE_APPROVED = "MILESTONE_APPROVED"

    # 매칭
    MATCH_NEW = "MATCH_NEW"
    MATCH_INTEREST = "MATCH_INTEREST"
    MATCH_MESSAGE = "MATCH_MESSAGE"


class UserDevice(Base):
    """사용자 디바이스 (푸시 알림용)"""
    __tablename__ = "user_devices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # FCM 토큰
    fcm_token = Column(String(500), nullable=False, unique=True)

    # 디바이스 정보
    platform = Column(SQLEnum(DevicePlatform), default=DevicePlatform.WEB, nullable=False)
    device_name = Column(String(200), nullable=True)  # e.g., "Chrome on Windows"

    # 상태
    is_active = Column(Boolean, default=True)
    last_used_at = Column(DateTime, default=datetime.utcnow)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="devices")

    def __repr__(self):
        return f"<UserDevice {self.platform} for user {self.user_id}>"


class UserNotification(Base):
    """사용자 알림 내역"""
    __tablename__ = "user_notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # 알림 내용
    notification_type = Column(SQLEnum(NotificationType), nullable=False)
    title = Column(String(200), nullable=False)
    body = Column(Text, nullable=False)

    # 추가 데이터 (클릭 시 이동할 URL, 관련 ID 등)
    data = Column(JSON, nullable=True)  # {"url": "/prospects/123", "prospect_id": 123}

    # 상태
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime, nullable=True)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="notifications")

    def __repr__(self):
        return f"<Notification {self.notification_type} for user {self.user_id}>"


class NotificationPreference(Base):
    """사용자 알림 설정"""
    __tablename__ = "notification_preferences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)

    # 채널별 활성화
    email_enabled = Column(Boolean, default=True)
    push_enabled = Column(Boolean, default=True)
    sms_enabled = Column(Boolean, default=False)
    kakao_enabled = Column(Boolean, default=False)

    # 알림 유형별 활성화
    prospect_alerts = Column(Boolean, default=True)  # 프로스펙트 알림
    chat_messages = Column(Boolean, default=True)    # 채팅 메시지
    payment_updates = Column(Boolean, default=True)  # 결제 알림
    match_updates = Column(Boolean, default=True)    # 매칭 알림
    marketing = Column(Boolean, default=False)       # 마케팅 알림

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="notification_preference")

    def __repr__(self):
        return f"<NotificationPreference for user {self.user_id}>"
