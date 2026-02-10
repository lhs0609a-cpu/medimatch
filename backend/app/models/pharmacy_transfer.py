"""
약국 양도 매물 모델

- 약사가 양도할 약국을 등록
- 관리자 승인 후 공개
- 구독 불필요 (무료 등록)
"""
import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, BigInteger, Text, DateTime,
    ForeignKey, Boolean, Float, Index
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
import enum
from ..core.database import Base


class PharmTransferStatus(str, enum.Enum):
    """약국 양도 매물 상태"""
    PENDING_REVIEW = "PENDING_REVIEW"
    ACTIVE = "ACTIVE"
    CLOSED = "CLOSED"
    REJECTED = "REJECTED"


class PharmacyTransferListing(Base):
    """약국 양도 매물"""
    __tablename__ = "pharmacy_transfer_listings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # 약국 기본 정보
    pharmacy_name = Column(String(200), nullable=False)
    address = Column(String(500), nullable=False)
    region_name = Column(String(100), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    area_pyeong = Column(Float, nullable=True)

    # 매출/비용
    monthly_revenue = Column(BigInteger, nullable=True)
    monthly_rx_count = Column(Integer, nullable=True)
    premium = Column(BigInteger, nullable=True)
    rent_monthly = Column(BigInteger, nullable=True)
    rent_deposit = Column(BigInteger, nullable=True)

    # 상세
    transfer_reason = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)

    # 연락처
    contact_name = Column(String(100), nullable=True)
    contact_phone = Column(String(20), nullable=True)

    # 이미지
    images = Column(ARRAY(String), default=[])

    # 상태
    status = Column(
        SQLEnum(PharmTransferStatus),
        default=PharmTransferStatus.PENDING_REVIEW,
        nullable=False,
    )
    is_public = Column(Boolean, default=False)
    rejection_reason = Column(Text, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    verified_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # 통계
    view_count = Column(Integer, default=0)
    inquiry_count = Column(Integer, default=0)

    # 메타
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", foreign_keys=[user_id], backref="pharmacy_transfer_listings")
    verifier = relationship("User", foreign_keys=[verified_by])

    __table_args__ = (
        Index("ix_pharm_transfer_status", "status"),
        Index("ix_pharm_transfer_user", "user_id"),
        Index("ix_pharm_transfer_public", "is_public", "status"),
    )

    def __repr__(self):
        return f"<PharmacyTransferListing {self.id} - {self.pharmacy_name}>"
