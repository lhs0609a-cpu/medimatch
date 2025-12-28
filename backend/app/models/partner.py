"""
파트너 연결 시스템 모델
- 인테리어 업체, 의료 장비, 컨설팅, 금융 서비스 등
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Numeric, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class PartnerCategory:
    INTERIOR = "interior"           # 인테리어 업체
    MEDICAL_EQUIPMENT = "equipment" # 의료 장비
    CONSULTING = "consulting"       # 개원 컨설팅
    FINANCE = "finance"            # 금융 서비스 (대출, 리스)
    PHARMA_WHOLESALE = "pharma"    # 약품 도매상
    SIGNAGE = "signage"            # 간판/사인물
    IT_SOLUTION = "it"             # 의료 IT 솔루션 (EMR, 예약 시스템)
    MARKETING = "marketing"        # 마케팅/홍보
    LEGAL = "legal"                # 법률/세무 서비스
    REAL_ESTATE = "realestate"     # 부동산 중개


class Partner(Base):
    """파트너 업체 정보"""
    __tablename__ = "partners"

    id = Column(Integer, primary_key=True, index=True)

    # 파트너 소유자/담당자 (User 연결)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)

    # 기본 정보
    name = Column(String(200), nullable=False)
    category = Column(String(50), nullable=False, index=True)  # PartnerCategory
    subcategory = Column(String(100), nullable=True)  # 세부 카테고리

    # 연락처
    phone = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True)
    website = Column(String(200), nullable=True)

    # 위치
    address = Column(String(300), nullable=True)
    region = Column(String(50), nullable=True, index=True)  # 서울, 경기 등
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)

    # 상세 정보
    description = Column(Text, nullable=True)
    specialties = Column(Text, nullable=True)  # JSON 형태로 전문 분야 저장
    portfolio_url = Column(String(300), nullable=True)
    logo_url = Column(String(300), nullable=True)

    # 평점 및 리뷰
    rating = Column(Float, default=0.0)
    review_count = Column(Integer, default=0)

    # 커미션 정보 (플랫폼 수익)
    commission_rate = Column(Numeric(5, 2), default=3.0)  # 기본 3% 커미션
    min_commission = Column(Integer, default=100000)  # 최소 커미션 10만원

    # 프리미엄 파트너 (광고비 지불)
    is_premium = Column(Boolean, default=False)
    premium_expires_at = Column(DateTime, nullable=True)

    # 상태
    is_verified = Column(Boolean, default=False)  # 검증된 업체
    is_active = Column(Boolean, default=True)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 정산 계좌 정보
    payout_bank = Column(String(50), nullable=True)
    payout_account = Column(String(50), nullable=True)
    payout_holder = Column(String(100), nullable=True)

    # 관계
    user = relationship("User", back_populates="partner")
    inquiries = relationship("PartnerInquiry", back_populates="partner")
    contracts = relationship("PartnerContract", back_populates="partner")
    escrow_transactions = relationship("EscrowTransaction", back_populates="partner")
    escrow_contracts = relationship("EscrowContract", back_populates="partner")


class PartnerInquiry(Base):
    """파트너 문의 (연결 요청)"""
    __tablename__ = "partner_inquiries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    partner_id = Column(Integer, ForeignKey("partners.id"), nullable=False)

    # 문의 내용
    inquiry_type = Column(String(50), nullable=False)  # quote(견적), info(정보), consult(상담)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)

    # 프로젝트 정보
    project_location = Column(String(300), nullable=True)
    project_size = Column(String(50), nullable=True)  # 평수
    budget_range = Column(String(100), nullable=True)  # 예산 범위
    expected_start_date = Column(DateTime, nullable=True)  # 예상 시작일

    # 상태
    status = Column(String(20), default="pending")  # pending, contacted, in_progress, completed, cancelled

    # 연락처 (별도 입력 시)
    contact_name = Column(String(50), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    contact_email = Column(String(100), nullable=True)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    responded_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    # 관계
    user = relationship("User", back_populates="partner_inquiries")
    partner = relationship("Partner", back_populates="inquiries")


class PartnerContract(Base):
    """파트너 계약 (수익 추적용)"""
    __tablename__ = "partner_contracts"

    id = Column(Integer, primary_key=True, index=True)
    inquiry_id = Column(Integer, ForeignKey("partner_inquiries.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    partner_id = Column(Integer, ForeignKey("partners.id"), nullable=False)

    # 계약 정보
    contract_amount = Column(Numeric(15, 2), nullable=False)  # 계약 금액
    commission_amount = Column(Numeric(15, 2), nullable=False)  # 플랫폼 커미션
    commission_status = Column(String(20), default="pending")  # pending, paid, cancelled

    # 계약 상세
    contract_date = Column(DateTime, nullable=False)
    service_start_date = Column(DateTime, nullable=True)
    service_end_date = Column(DateTime, nullable=True)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계
    inquiry = relationship("PartnerInquiry")
    user = relationship("User")
    partner = relationship("Partner", back_populates="contracts")


class PartnerReview(Base):
    """파트너 리뷰"""
    __tablename__ = "partner_reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    partner_id = Column(Integer, ForeignKey("partners.id"), nullable=False)
    contract_id = Column(Integer, ForeignKey("partner_contracts.id"), nullable=True)

    # 평점 (1-5)
    rating = Column(Float, nullable=False)

    # 세부 평점
    quality_rating = Column(Float, nullable=True)  # 품질
    price_rating = Column(Float, nullable=True)  # 가격
    communication_rating = Column(Float, nullable=True)  # 소통
    timeliness_rating = Column(Float, nullable=True)  # 시간 준수

    # 리뷰 내용
    title = Column(String(200), nullable=True)
    content = Column(Text, nullable=True)

    # 사진
    photo_urls = Column(Text, nullable=True)  # JSON array

    # 상태
    is_verified = Column(Boolean, default=False)  # 실제 계약 후 작성된 리뷰
    is_visible = Column(Boolean, default=True)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계
    user = relationship("User")
    partner = relationship("Partner")
