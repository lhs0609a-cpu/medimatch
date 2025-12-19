import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, BigInteger, Text, DateTime, ForeignKey
from sqlalchemy import Enum as SQLEnum, Float
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
import enum
from ..core.database import Base


class SlotStatus(str, enum.Enum):
    OPEN = "OPEN"
    BIDDING = "BIDDING"
    MATCHED = "MATCHED"
    CLOSED = "CLOSED"


class BidStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"


class PharmacySlot(Base):
    """약국 자리 등록 테이블 (PharmMatch)"""
    __tablename__ = "pharmacy_slots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    address = Column(String(500), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    clinic_type = Column(String(50), nullable=False)  # 진료과목
    clinic_name = Column(String(200), nullable=True)  # 입점 예정 병원명
    est_daily_rx = Column(Integer, nullable=True)  # 예상 일일 처방전 수
    est_monthly_revenue = Column(BigInteger, nullable=True)  # 예상 월 조제료 매출
    min_bid_amount = Column(BigInteger, nullable=False)  # 최소 입찰가
    floor_info = Column(String(100), nullable=True)  # 층 정보
    area_pyeong = Column(Float, nullable=True)  # 면적(평)
    description = Column(Text, nullable=True)  # 상세 설명
    status = Column(SQLEnum(SlotStatus), default=SlotStatus.OPEN)
    bid_deadline = Column(DateTime, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    bids = relationship("Bid", back_populates="slot", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<PharmacySlot {self.address}>"


class Bid(Base):
    """입찰 테이블 (PharmMatch)"""
    __tablename__ = "bids"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slot_id = Column(UUID(as_uuid=True), ForeignKey("pharmacy_slots.id"), nullable=False)
    pharmacist_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    bid_amount = Column(BigInteger, nullable=False)  # 입찰 금액
    message = Column(Text, nullable=True)  # 입찰 메시지
    experience_years = Column(Integer, nullable=True)  # 경력 연차
    pharmacy_name = Column(String(200), nullable=True)  # 약국명 (예정)
    status = Column(SQLEnum(BidStatus), default=BidStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    slot = relationship("PharmacySlot", back_populates="bids")
    pharmacist = relationship("User", back_populates="bids")

    def __repr__(self):
        return f"<Bid {self.bid_amount} for {self.slot_id}>"
