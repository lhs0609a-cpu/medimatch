"""
문의/상담 통합 모델

- 홈페이지 문의 (contact page) + 개원 상담 (opening-package) 통합 저장
- 관리자 페이지에서 조회/상태변경/답변
"""
import enum
from sqlalchemy import Column, Integer, String, DateTime, Text, Index
from datetime import datetime

from app.core.database import Base


class ContactStatus(str, enum.Enum):
    # 공통
    NEW = "NEW"
    # consultation only
    CONTACTED = "CONTACTED"
    IN_PROGRESS = "IN_PROGRESS"
    CONVERTED = "CONVERTED"
    CLOSED = "CLOSED"
    # inquiry only
    REPLIED = "REPLIED"
    RESOLVED = "RESOLVED"
    SPAM = "SPAM"


class ContactInquiry(Base):
    """문의/상담 통합 테이블"""
    __tablename__ = "contact_inquiries"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # 공통 필드
    name = Column(String(100), nullable=False)
    email = Column(String(200))
    phone = Column(String(20))
    message = Column(Text)
    contact_type = Column(String(30), nullable=False)  # consultation, general, simulation, etc.
    status = Column(String(20), default="NEW")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 상담 전용 필드
    specialty = Column(String(100))
    area = Column(Integer)
    region = Column(String(200))
    need_loan = Column(String(20))
    interests = Column(Text)
    admin_note = Column(Text)

    # 문의 전용 필드
    subject = Column(String(200))
    admin_reply = Column(Text)
    replied_at = Column(DateTime)

    # 유입 추적 (광고 캠페인 귀속 — first-touch)
    utm_source = Column(String(100))
    utm_medium = Column(String(100))
    utm_campaign = Column(String(150))
    utm_term = Column(String(150))
    utm_content = Column(String(150))
    referrer = Column(String(500))
    landing_path = Column(String(500))
    listing_id = Column(String(64))  # 문의 대상 매물(LandlordListing UUID 문자열, nullable)

    __table_args__ = (
        Index("ix_contact_inquiry_type", "contact_type"),
        Index("ix_contact_inquiry_status", "status"),
        Index("ix_contact_inquiry_created", "created_at"),
        Index("ix_contact_inquiry_campaign", "utm_campaign"),
        Index("ix_contact_inquiry_listing", "listing_id"),
    )
