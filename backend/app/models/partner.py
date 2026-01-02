"""
파트너 연결 시스템 모델
- 인테리어 업체, 의료 장비, 컨설팅, 금융 서비스 등
"""
import enum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Numeric, Float, Enum as SQLEnum, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class PartnerCategory:
    """레거시 호환용 - 새로운 코드는 PartnerCategoryModel 사용"""
    INTERIOR = "interior"
    MEDICAL_EQUIPMENT = "equipment"
    CONSULTING = "consulting"
    FINANCE = "finance"
    PHARMA_WHOLESALE = "pharma"
    SIGNAGE = "signage"
    IT_SOLUTION = "emr"
    MARKETING = "marketing"
    LEGAL = "legal"
    REAL_ESTATE = "realestate"


class PartnerStatus(str, enum.Enum):
    """파트너 상태"""
    PENDING = "PENDING"      # 가입 대기 (심사중)
    ACTIVE = "ACTIVE"        # 활성
    SUSPENDED = "SUSPENDED"  # 일시 정지
    INACTIVE = "INACTIVE"    # 비활성


class PartnerTier(str, enum.Enum):
    """파트너 등급"""
    BASIC = "BASIC"          # 기본
    VERIFIED = "VERIFIED"    # 검증됨
    PREMIUM = "PREMIUM"      # 프리미엄 (광고)
    VIP = "VIP"              # VIP (최상위)


class Partner(Base):
    """파트너 업체 정보"""
    __tablename__ = "partners"

    id = Column(Integer, primary_key=True, index=True)

    # 파트너 소유자/담당자 (User 연결)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)

    # 카테고리 (기존 문자열 유지 + FK 추가)
    category = Column(String(50), nullable=False, index=True)  # 레거시 호환
    category_id = Column(Integer, ForeignKey("partner_categories.id"), nullable=True, index=True)

    # 기본 정보
    name = Column(String(200), nullable=False)
    business_number = Column(String(20), nullable=True, index=True)  # 사업자등록번호
    ceo_name = Column(String(50), nullable=True)  # 대표자명
    short_description = Column(String(200), nullable=True)  # 한줄 소개

    # 연락처
    phone = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True)
    website = Column(String(200), nullable=True)

    # 위치
    address = Column(String(300), nullable=True)
    address_detail = Column(String(100), nullable=True)
    region = Column(String(50), nullable=True, index=True)  # 레거시
    sido = Column(String(20), nullable=True, index=True)  # 시도
    sigungu = Column(String(30), nullable=True, index=True)  # 시군구
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)

    # 상세 정보
    description = Column(Text, nullable=True)
    specialties = Column(JSONB, default=[])  # ["피부과", "성형외과"]
    portfolio_url = Column(String(300), nullable=True)  # 레거시
    logo_url = Column(String(500), nullable=True)
    cover_image_url = Column(String(500), nullable=True)

    # 사업 정보
    established_year = Column(Integer, nullable=True)  # 설립연도
    employee_count = Column(Integer, nullable=True)  # 직원 수
    annual_projects = Column(Integer, nullable=True)  # 연간 시공 건수

    # 가격 정보
    price_range_min = Column(Integer, nullable=True)  # 최소 가격
    price_range_max = Column(Integer, nullable=True)  # 최대 가격
    price_unit = Column(String(20), default="total")  # total, per_pyeong, monthly

    # 평점 및 리뷰
    rating = Column(Numeric(2, 1), default=0.0)
    review_count = Column(Integer, default=0)

    # 통계
    inquiry_count = Column(Integer, default=0)  # 총 문의 수
    contract_count = Column(Integer, default=0)  # 총 계약 수
    total_contract_amount = Column(Numeric(15, 2), default=0)  # 총 계약 금액
    response_rate = Column(Numeric(5, 2), default=0)  # 응답률 (%)
    avg_response_time = Column(Integer, default=0)  # 평균 응답 시간 (분)

    # 커미션 정보 (플랫폼 수익)
    commission_rate = Column(Numeric(5, 2), default=3.0)  # 기본 3% 커미션
    min_commission = Column(Integer, default=100000)  # 최소 커미션 10만원

    # 등급 및 상태
    tier = Column(SQLEnum(PartnerTier), default=PartnerTier.BASIC)
    status = Column(SQLEnum(PartnerStatus), default=PartnerStatus.PENDING)

    # 프리미엄 파트너 (광고비 지불)
    is_premium = Column(Boolean, default=False)
    premium_started_at = Column(DateTime, nullable=True)
    premium_expires_at = Column(DateTime, nullable=True)
    premium_badge_text = Column(String(20), nullable=True)  # "추천", "인기" 등

    # 검증 정보
    is_verified = Column(Boolean, default=False)  # 검증된 업체
    verified_at = Column(DateTime, nullable=True)
    verification_docs = Column(JSONB, default=[])  # 검증 서류 목록

    # 레거시 호환
    is_active = Column(Boolean, default=True)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 정산 계좌 정보
    payout_bank = Column(String(50), nullable=True)
    payout_account = Column(String(50), nullable=True)
    payout_holder = Column(String(100), nullable=True)

    # 공공데이터 연동
    source = Column(String(50), nullable=True)  # localdata, mfds, manual
    source_id = Column(String(100), nullable=True)  # 원본 데이터 ID
    last_synced_at = Column(DateTime, nullable=True)

    # 인덱스
    __table_args__ = (
        Index('ix_partners_category_status', 'category', 'status'),
        Index('ix_partners_sido_category', 'sido', 'category'),
    )

    # 관계
    user = relationship("User", back_populates="partner")
    category_rel = relationship("PartnerCategoryModel", back_populates="partners")
    inquiries = relationship("PartnerInquiry", back_populates="partner")
    contracts = relationship("PartnerContract", back_populates="partner")
    escrow_transactions = relationship("EscrowTransaction", back_populates="partner")
    escrow_contracts = relationship("EscrowContract", back_populates="partner")
    portfolios = relationship("PartnerPortfolio", back_populates="partner", order_by="PartnerPortfolio.display_order")
    service_areas = relationship("PartnerServiceArea", back_populates="partner")
    subscription = relationship("PartnerSubscription", back_populates="partner", uselist=False)
    chat_rooms = relationship("ChatRoom", back_populates="partner")
    reviews = relationship("PartnerReview", back_populates="partner")


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
    partner = relationship("Partner", back_populates="reviews")
