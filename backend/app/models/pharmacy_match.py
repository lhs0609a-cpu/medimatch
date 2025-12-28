"""
익명 약국 매칭 시스템 모델 (PharmMatch v2)
- AnonymousListing: 익명 매물
- PharmacistProfile: 약사 희망 조건
- Interest: 관심 표시
- Match: 매칭 정보
"""
import uuid
import re
from datetime import datetime, timedelta
from sqlalchemy import (
    Column, String, Integer, BigInteger, Text, DateTime,
    ForeignKey, Boolean, Float, Index
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
from sqlalchemy.orm import relationship
import enum
from ..core.database import Base


# ============================================================
# Enums
# ============================================================

class AnonymousListingStatus(str, enum.Enum):
    """익명 매물 상태"""
    DRAFT = "DRAFT"           # 임시저장
    ACTIVE = "ACTIVE"         # 활성 (매칭 중)
    PAUSED = "PAUSED"         # 일시중지
    MATCHED = "MATCHED"       # 매칭완료
    EXPIRED = "EXPIRED"       # 만료
    WITHDRAWN = "WITHDRAWN"   # 철회


class PharmacyType(str, enum.Enum):
    """약국 유형"""
    GENERAL = "GENERAL"           # 일반약국
    DISPENSING = "DISPENSING"     # 조제전문
    ORIENTAL = "ORIENTAL"         # 한약국
    HOSPITAL = "HOSPITAL"         # 병원약국


class TransferReason(str, enum.Enum):
    """양도 사유"""
    RETIREMENT = "RETIREMENT"     # 은퇴
    RELOCATION = "RELOCATION"     # 이전
    HEALTH = "HEALTH"             # 건강상의 이유
    CAREER_CHANGE = "CAREER_CHANGE"  # 직업 변경
    FAMILY = "FAMILY"             # 가정사
    OTHER = "OTHER"               # 기타


class InterestType(str, enum.Enum):
    """관심 표시 방향"""
    LISTING_TO_PHARMACIST = "L2P"   # 매물주 → 약사
    PHARMACIST_TO_LISTING = "P2L"   # 약사 → 매물


class MatchStatus(str, enum.Enum):
    """매칭 상태"""
    PENDING = "PENDING"           # 단방향 관심
    MUTUAL = "MUTUAL"             # 상호 관심 (연락처 공개)
    CHATTING = "CHATTING"         # 대화 진행중
    MEETING = "MEETING"           # 미팅 진행중
    CONTRACTED = "CONTRACTED"     # 계약 완료
    CANCELLED = "CANCELLED"       # 취소됨


# ============================================================
# Helper Functions
# ============================================================

def generate_anonymous_id(prefix: str, region: str = "") -> str:
    """익명 ID 생성"""
    import random
    import string
    year = datetime.now().year
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))

    if prefix == "listing" and region:
        # 예: 강남-2024-A1B2
        region_short = region[:2] if len(region) >= 2 else region
        return f"{region_short}-{year}-{random_part}"
    else:
        # 예: PH-2024-X9Y8
        return f"PH-{year}-{random_part}"


def mask_personal_info(text: str) -> str:
    """개인정보 자동 마스킹"""
    if not text:
        return text

    patterns = [
        (r'\d{2,3}-\d{3,4}-\d{4}', '***-****-****'),  # 전화번호
        (r'\d{10,11}', '***********'),                 # 전화번호 (하이픈 없음)
        (r'\S+@\S+\.\S+', '***@***.***'),              # 이메일
        (r'[가-힣]{2,4}약국', '**약국'),               # 약국명
        (r'[가-힣]{1,2}(동|로|길)\s*\d+[-\d]*', '**동'),  # 상세주소
    ]

    result = text
    for pattern, replacement in patterns:
        result = re.sub(pattern, replacement, result)
    return result


# ============================================================
# Models
# ============================================================

class AnonymousListing(Base):
    """익명 매물 등록"""
    __tablename__ = "anonymous_listings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    anonymous_id = Column(String(50), unique=True, nullable=False, index=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # === 공개 정보 (익명) ===
    region_code = Column(String(10), nullable=False, index=True)  # 행정구역 코드
    region_name = Column(String(100), nullable=False)  # "서울시 강남구"

    pharmacy_type = Column(SQLEnum(PharmacyType), default=PharmacyType.GENERAL)
    nearby_hospital_types = Column(ARRAY(String), default=[])  # 인근 병원 진료과

    # 매출 정보
    monthly_revenue_min = Column(BigInteger, nullable=True)  # 월매출 최소 (원)
    monthly_revenue_max = Column(BigInteger, nullable=True)  # 월매출 최대 (원)
    monthly_rx_count = Column(Integer, nullable=True)        # 월 처방전 수

    # 면적
    area_pyeong_min = Column(Float, nullable=True)
    area_pyeong_max = Column(Float, nullable=True)

    # 가격 정보 (만원 단위)
    premium_min = Column(Integer, nullable=True)      # 권리금 최소
    premium_max = Column(Integer, nullable=True)      # 권리금 최대
    monthly_rent = Column(Integer, nullable=True)     # 월 임대료
    deposit = Column(Integer, nullable=True)          # 보증금

    # 약국 정보
    transfer_reason = Column(SQLEnum(TransferReason), nullable=True)
    operation_years = Column(Integer, nullable=True)   # 운영 기간 (년)
    employee_count = Column(Integer, default=0)        # 직원 수

    # 시설 정보
    has_auto_dispenser = Column(Boolean, default=False)  # 자동조제기
    has_parking = Column(Boolean, default=False)
    floor_info = Column(String(50), nullable=True)    # "1층", "지하1층" 등

    # 설명 (마스킹됨)
    description = Column(Text, nullable=True)

    # === 비공개 정보 (매칭 후 공개) ===
    exact_address = Column(String(500), nullable=False)
    pharmacy_name = Column(String(200), nullable=True)
    owner_phone = Column(String(20), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # === 메타데이터 ===
    status = Column(SQLEnum(AnonymousListingStatus), default=AnonymousListingStatus.DRAFT)
    view_count = Column(Integer, default=0)
    interest_count = Column(Integer, default=0)

    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    owner = relationship("User", backref="anonymous_listings")
    interests = relationship("Interest", back_populates="listing", cascade="all, delete-orphan")
    matches = relationship("Match", back_populates="listing", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index('ix_anonymous_listings_status_region', 'status', 'region_code'),
        Index('ix_anonymous_listings_premium', 'premium_min', 'premium_max'),
    )

    def __repr__(self):
        return f"<AnonymousListing {self.anonymous_id}>"

    def set_expiry(self, days: int = 90):
        """만료일 설정"""
        self.expires_at = datetime.utcnow() + timedelta(days=days)

    def mask_description(self):
        """설명 마스킹"""
        if self.description:
            self.description = mask_personal_info(self.description)


class PharmacistProfile(Base):
    """약사 희망 조건 프로필"""
    __tablename__ = "pharmacist_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    anonymous_id = Column(String(50), unique=True, nullable=False, index=True)

    # === 공개 정보 (익명) ===
    preferred_regions = Column(ARRAY(String), default=[])  # 희망 지역 코드
    preferred_region_names = Column(ARRAY(String), default=[])  # 희망 지역명

    # 예산 (만원)
    budget_min = Column(Integer, nullable=True)
    budget_max = Column(Integer, nullable=True)

    # 희망 면적 (평)
    preferred_area_min = Column(Float, nullable=True)
    preferred_area_max = Column(Float, nullable=True)

    # 희망 매출 (원)
    preferred_revenue_min = Column(BigInteger, nullable=True)
    preferred_revenue_max = Column(BigInteger, nullable=True)

    # 경력 정보
    experience_years = Column(Integer, default=0)         # 약사 경력 (년)
    license_year = Column(Integer, nullable=True)         # 면허 취득 연도
    has_management_experience = Column(Boolean, default=False)  # 약국 운영 경험

    # 선호 사항
    specialty_areas = Column(ARRAY(String), default=[])          # 전문 분야
    preferred_pharmacy_types = Column(ARRAY(String), default=[]) # 선호 약국 유형
    preferred_hospital_types = Column(ARRAY(String), default=[]) # 선호 인근 병원

    # 자기소개 (마스킹됨)
    introduction = Column(Text, nullable=True)

    # === 비공개 정보 ===
    full_name = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    license_number = Column(String(50), nullable=True)

    # === 메타데이터 ===
    is_active = Column(Boolean, default=True)
    last_active_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", backref="pharmacist_profile")
    interests = relationship("Interest", back_populates="pharmacist_profile", cascade="all, delete-orphan")
    matches = relationship("Match", back_populates="pharmacist_profile", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<PharmacistProfile {self.anonymous_id}>"

    def mask_introduction(self):
        """자기소개 마스킹"""
        if self.introduction:
            self.introduction = mask_personal_info(self.introduction)


class Interest(Base):
    """관심 표시"""
    __tablename__ = "interests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    listing_id = Column(UUID(as_uuid=True), ForeignKey("anonymous_listings.id"), nullable=False)
    pharmacist_profile_id = Column(UUID(as_uuid=True), ForeignKey("pharmacist_profiles.id"), nullable=False)

    interest_type = Column(SQLEnum(InterestType), nullable=False)
    expressed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    message = Column(Text, nullable=True)  # 간단한 메시지

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    listing = relationship("AnonymousListing", back_populates="interests")
    pharmacist_profile = relationship("PharmacistProfile", back_populates="interests")
    expressed_by_user = relationship("User", backref="expressed_interests")

    # Indexes
    __table_args__ = (
        Index('ix_interests_listing_pharmacist', 'listing_id', 'pharmacist_profile_id'),
        Index('ix_interests_type', 'interest_type'),
    )

    def __repr__(self):
        return f"<Interest {self.interest_type} by {self.expressed_by}>"


class Match(Base):
    """매칭 정보"""
    __tablename__ = "matches"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    listing_id = Column(UUID(as_uuid=True), ForeignKey("anonymous_listings.id"), nullable=False)
    pharmacist_profile_id = Column(UUID(as_uuid=True), ForeignKey("pharmacist_profiles.id"), nullable=False)

    # 관심 표시 참조
    listing_interest_id = Column(UUID(as_uuid=True), ForeignKey("interests.id"), nullable=True)
    pharmacist_interest_id = Column(UUID(as_uuid=True), ForeignKey("interests.id"), nullable=True)

    status = Column(SQLEnum(MatchStatus), default=MatchStatus.PENDING)
    match_score = Column(Float, nullable=True)  # AI 매칭 점수 (0-100)
    match_score_breakdown = Column(JSONB, nullable=True)  # 점수 상세 내역

    # 매칭 후 활동 기록
    contact_revealed_at = Column(DateTime, nullable=True)
    first_message_at = Column(DateTime, nullable=True)
    meeting_scheduled_at = Column(DateTime, nullable=True)
    contracted_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    cancel_reason = Column(Text, nullable=True)

    # 수수료 정보
    commission_rate = Column(Float, default=3.0)  # 권리금의 3%
    commission_amount = Column(Integer, nullable=True)  # 만원 단위
    commission_paid = Column(Boolean, default=False)
    commission_paid_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    listing = relationship("AnonymousListing", back_populates="matches")
    pharmacist_profile = relationship("PharmacistProfile", back_populates="matches")
    listing_interest = relationship("Interest", foreign_keys=[listing_interest_id])
    pharmacist_interest = relationship("Interest", foreign_keys=[pharmacist_interest_id])
    messages = relationship("MatchMessage", back_populates="match", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index('ix_matches_listing_pharmacist', 'listing_id', 'pharmacist_profile_id', unique=True),
        Index('ix_matches_status', 'status'),
    )

    def __repr__(self):
        return f"<Match {self.id} - {self.status}>"

    def reveal_contacts(self):
        """연락처 공개 (상호 매칭 시)"""
        self.status = MatchStatus.MUTUAL
        self.contact_revealed_at = datetime.utcnow()

    def calculate_commission(self, premium_amount: int):
        """수수료 계산 (권리금 기준)"""
        commission = int(premium_amount * (self.commission_rate / 100))
        # 최소 50만원, 최대 500만원
        self.commission_amount = max(50, min(500, commission))


class MatchMessage(Base):
    """매칭 후 메시지"""
    __tablename__ = "match_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    match_id = Column(UUID(as_uuid=True), ForeignKey("matches.id"), nullable=False)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    match = relationship("Match", back_populates="messages")
    sender = relationship("User", backref="sent_match_messages")

    # Index
    __table_args__ = (
        Index('ix_match_messages_match_created', 'match_id', 'created_at'),
    )

    def __repr__(self):
        return f"<MatchMessage {self.id}>"
