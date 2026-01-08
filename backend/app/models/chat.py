"""
채팅 시스템 모델 (견적 요청 기반)
"""
import uuid
import enum
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Text, Boolean, DateTime,
    ForeignKey, Enum as SQLEnum, Index
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base


class ChatRoomStatus(str, enum.Enum):
    """채팅방 상태"""
    ACTIVE = "ACTIVE"
    CONTRACTED = "CONTRACTED"  # 계약으로 전환됨
    CLOSED = "CLOSED"  # 종료됨


class ChatRoom(Base):
    """채팅방 (견적 요청 기반 1:1)"""
    __tablename__ = "chat_rooms"

    id = Column(Integer, primary_key=True, index=True)
    room_code = Column(String(50), unique=True, nullable=False, index=True)

    # 참여자
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    partner_id = Column(Integer, ForeignKey("partners.id"), nullable=False)

    # 연결 정보
    inquiry_id = Column(Integer, ForeignKey("partner_inquiries.id"), nullable=True)

    # 상태
    status = Column(SQLEnum(ChatRoomStatus), default=ChatRoomStatus.ACTIVE)

    # 마지막 메시지
    last_message = Column(Text, nullable=True)
    last_message_at = Column(DateTime, nullable=True)
    last_message_by = Column(UUID(as_uuid=True), nullable=True)

    # 읽지 않은 메시지 수
    user_unread_count = Column(Integer, default=0)
    partner_unread_count = Column(Integer, default=0)

    # 계약 연결
    escrow_contract_id = Column(Integer, ForeignKey("escrow_contracts.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    partner = relationship("Partner", back_populates="chat_rooms")
    inquiry = relationship("PartnerInquiry")
    messages = relationship("ChatMessage", back_populates="room", order_by="ChatMessage.created_at")
    escrow_contract = relationship("EscrowContract")

    __table_args__ = (
        Index('ix_chat_rooms_user', 'user_id', 'status'),
        Index('ix_chat_rooms_partner', 'partner_id', 'status'),
    )


class ChatMessageType(str, enum.Enum):
    """메시지 유형"""
    TEXT = "TEXT"
    IMAGE = "IMAGE"
    FILE = "FILE"
    QUOTE = "QUOTE"  # 견적서
    CONTRACT = "CONTRACT"  # 계약서 제안
    SYSTEM = "SYSTEM"  # 시스템 메시지


class ChatMessage(Base):
    """채팅 메시지"""
    __tablename__ = "chat_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    room_id = Column(Integer, ForeignKey("chat_rooms.id"), nullable=False, index=True)

    # 발신자
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    sender_type = Column(String(20), nullable=False)  # user, partner, system

    # 메시지 내용
    message_type = Column(SQLEnum(ChatMessageType), default=ChatMessageType.TEXT)
    content = Column(Text, nullable=False)
    filtered_content = Column(Text, nullable=True)  # 연락처 필터링된 내용

    # 첨부파일
    attachments = Column(JSONB, default=[])  # [{name, url, size, type}]

    # 연락처 탐지
    contains_contact = Column(Boolean, default=False)
    contact_detection_id = Column(Integer, ForeignKey("contact_detection_logs.id"), nullable=True)

    # 읽음 상태
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime, nullable=True)

    # 메타데이터 (견적서, 계약서 정보 등)
    message_metadata = Column(JSONB, default={})

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    room = relationship("ChatRoom", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id])
    contact_detection = relationship("ContactDetectionLog")

    __table_args__ = (
        Index('ix_chat_messages_room_created', 'room_id', 'created_at'),
    )


def generate_room_code() -> str:
    """채팅방 코드 생성"""
    return f"CHAT-{uuid.uuid4().hex[:8].upper()}"
