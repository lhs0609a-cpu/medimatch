"""
건물주 셀프 등록 모델

- 의사/약국 입점 희망 건물 등록
- 등기부등본/임대차계약서 증빙 필수
- 관리자 승인 후 공개
"""
import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, BigInteger, Text, DateTime,
    ForeignKey, Boolean, Float, Index
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
from sqlalchemy.orm import relationship
import enum
from ..core.database import Base


class VerificationStatus(str, enum.Enum):
    """증빙 검증 상태"""
    PENDING = "PENDING"           # 검토 대기
    UNDER_REVIEW = "UNDER_REVIEW"  # 검토 중
    VERIFIED = "VERIFIED"          # 승인됨
    REJECTED = "REJECTED"          # 거부됨


class LandlordListingStatus(str, enum.Enum):
    """건물주 매물 상태"""
    DRAFT = "DRAFT"               # 임시저장
    PENDING_REVIEW = "PENDING_REVIEW"  # 승인 대기
    ACTIVE = "ACTIVE"             # 활성 (공개)
    RESERVED = "RESERVED"         # 예약됨
    CONTRACTED = "CONTRACTED"     # 계약완료
    CLOSED = "CLOSED"             # 마감
    REJECTED = "REJECTED"         # 거부됨


class PreferredTenant(str, enum.Enum):
    """희망 입점 업종"""
    CLINIC = "CLINIC"             # 의원/병원
    PHARMACY = "PHARMACY"         # 약국
    DENTAL = "DENTAL"             # 치과
    ORIENTAL = "ORIENTAL"         # 한의원
    ANY_MEDICAL = "ANY_MEDICAL"   # 의료업종 무관


class LandlordListing(Base):
    """건물주 매물 등록"""
    __tablename__ = "landlord_listings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # === 건물 기본 정보 ===
    title = Column(String(200), nullable=False)  # 매물 제목
    building_name = Column(String(200), nullable=True)  # 건물명
    address = Column(String(500), nullable=False)  # 전체 주소

    # 위치
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    region_code = Column(String(10), nullable=True)  # 행정구역 코드
    region_name = Column(String(100), nullable=True)  # "서울시 강남구"

    # 층/면적
    floor = Column(String(50), nullable=True)  # "1층", "지하1층", "2-3층"
    area_pyeong = Column(Float, nullable=True)  # 전용면적 (평)
    area_m2 = Column(Float, nullable=True)  # 전용면적 (m²)

    # === 비용 정보 ===
    rent_deposit = Column(BigInteger, nullable=True)  # 보증금 (원)
    rent_monthly = Column(BigInteger, nullable=True)  # 월세 (원)
    maintenance_fee = Column(Integer, nullable=True)  # 관리비 (원)
    premium = Column(BigInteger, nullable=True)  # 권리금 (원)

    # === 희망 입점 업종 ===
    preferred_tenants = Column(ARRAY(String), default=[])  # PreferredTenant values

    # 인근 시설 정보
    nearby_hospital_types = Column(ARRAY(String), default=[])  # 인근 병원 진료과
    nearby_facilities = Column(JSONB, default={})  # 기타 인근 시설

    # === 건물 특성 ===
    has_parking = Column(Boolean, default=False)
    parking_count = Column(Integer, default=0)
    has_elevator = Column(Boolean, default=False)
    building_age = Column(Integer, nullable=True)  # 건물 연식 (년)
    previous_use = Column(String(100), nullable=True)  # 이전 용도

    # === 상세 설명 ===
    description = Column(Text, nullable=True)
    features = Column(ARRAY(String), default=[])  # 특징 태그
    images = Column(ARRAY(String), default=[])  # 이미지 URL 목록

    # === 증빙 및 검증 ===
    verification_status = Column(
        SQLEnum(VerificationStatus),
        default=VerificationStatus.PENDING
    )
    verification_docs = Column(JSONB, default=[])
    # 예: [{"type": "등기부등본", "url": "...", "uploaded_at": "..."}]

    verified_at = Column(DateTime, nullable=True)
    verified_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    rejection_reason = Column(Text, nullable=True)

    # === 공개 설정 ===
    # 부분 정보 공개 (약국 매매와 동일한 3단계)
    # MINIMAL: 지역, 면적 범위, 희망 업종
    # PARTIAL: + 정확한 비용, 건물 특성
    # FULL (문의 후): + 정확한 주소, 연락처

    is_public = Column(Boolean, default=False)  # 승인 후 공개
    show_exact_address = Column(Boolean, default=False)  # 정확한 주소 공개 여부
    show_contact = Column(Boolean, default=False)  # 연락처 공개 여부

    # === 연락처 (비공개) ===
    contact_name = Column(String(100), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    contact_email = Column(String(255), nullable=True)

    # === 상태 및 통계 ===
    status = Column(
        SQLEnum(LandlordListingStatus),
        default=LandlordListingStatus.DRAFT
    )
    view_count = Column(Integer, default=0)
    inquiry_count = Column(Integer, default=0)

    # === 메타데이터 ===
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)

    # Relationships
    owner = relationship("User", foreign_keys=[owner_id], backref="landlord_listings")
    verifier = relationship("User", foreign_keys=[verified_by])
    inquiries = relationship("LandlordInquiry", back_populates="listing", cascade="all, delete-orphan")

    __table_args__ = (
        Index('ix_landlord_listings_status', 'status'),
        Index('ix_landlord_listings_region', 'region_code'),
        Index('ix_landlord_listings_verification', 'verification_status'),
    )

    def __repr__(self):
        return f"<LandlordListing {self.id} - {self.title}>"


class LandlordInquiry(Base):
    """건물주 매물 문의"""
    __tablename__ = "landlord_inquiries"

    id = Column(Integer, primary_key=True)
    listing_id = Column(UUID(as_uuid=True), ForeignKey("landlord_listings.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # 문의 내용
    message = Column(Text, nullable=False)
    inquiry_type = Column(String(50), default="general")  # general, visit, negotiation

    # 문의자 정보 (문의 시점에 저장)
    inquirer_name = Column(String(100), nullable=True)
    inquirer_phone = Column(String(20), nullable=True)
    inquirer_email = Column(String(255), nullable=True)
    inquirer_clinic_type = Column(String(50), nullable=True)  # 희망 진료과

    # 상태
    status = Column(String(20), default="PENDING")  # PENDING, RESPONDED, CLOSED
    response = Column(Text, nullable=True)
    responded_at = Column(DateTime, nullable=True)

    # 메타
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    listing = relationship("LandlordListing", back_populates="inquiries")
    user = relationship("User", backref="landlord_inquiries")

    __table_args__ = (
        Index('ix_landlord_inquiries_listing', 'listing_id'),
        Index('ix_landlord_inquiries_user', 'user_id'),
    )

    def __repr__(self):
        return f"<LandlordInquiry {self.id}>"


# 건물주 매물 정보 공개 레벨 정의 (약국 매매와 유사)
LANDLORD_ACCESS_FIELDS = {
    "MINIMAL": [
        # 항상 공개되는 기본 정보
        "id",
        "title",
        "region_name",
        "floor",
        "preferred_tenants",
        "status",
        "created_at",
    ],
    "PARTIAL": [
        # + 재무/특성 정보
        "area_pyeong",
        "area_m2",
        "rent_deposit",
        "rent_monthly",
        "maintenance_fee",
        "premium",
        "has_parking",
        "parking_count",
        "has_elevator",
        "building_age",
        "previous_use",
        "description",
        "features",
        "images",
        "nearby_hospital_types",
    ],
    "FULL": [
        # + 정확한 위치 및 연락처
        "building_name",
        "address",
        "latitude",
        "longitude",
        "contact_name",
        "contact_phone",
        "contact_email",
    ],
}
