import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, BigInteger, Float, Text, DateTime, ForeignKey, Boolean, Date
from sqlalchemy import Enum as SQLEnum, JSON, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from ..core.database import Base


class CohortStatus(str, enum.Enum):
    """코호트 상태"""
    RECRUITING = "recruiting"      # 모집 중
    CLOSED = "closed"              # 모집 마감
    IN_PROGRESS = "in_progress"    # 진행 중 (견적 수합/선택)
    COMPLETED = "completed"        # 완료
    CANCELLED = "cancelled"        # 취소


class ParticipantStatus(str, enum.Enum):
    """참여자 상태"""
    ACTIVE = "active"              # 참여 중
    CANCELLED = "cancelled"        # 취소
    CONTRACTED = "contracted"      # 계약 완료


class ContractStatus(str, enum.Enum):
    """계약 상태"""
    PENDING = "pending"            # 대기
    SIGNED = "signed"              # 서명 완료
    COMPLETED = "completed"        # 이행 완료
    CANCELLED = "cancelled"        # 취소


class GroupBuyingCategory(Base):
    """공동구매 카테고리"""
    __tablename__ = "group_buying_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), nullable=False)  # "의료장비", "인테리어" 등
    description = Column(Text, nullable=True)
    icon = Column(String(50), nullable=True)  # 아이콘 이름
    base_discount_rate = Column(Float, default=0)  # 기본 할인율 (%)
    market_avg_price_per_pyeong = Column(BigInteger, nullable=True)  # 평당 시장 평균가
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    vendors = relationship("GroupBuyingVendor", back_populates="category")
    cohort_vendors = relationship("CohortVendor", back_populates="category")
    participant_categories = relationship("ParticipantCategory", back_populates="category")
    contracts = relationship("ParticipantContract", back_populates="category")


class Cohort(Base):
    """공동구매 코호트 (회차)"""
    __tablename__ = "cohorts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)  # "2024년 4월 개원 동기"
    target_month = Column(Date, nullable=False)  # 개원 목표 월
    status = Column(SQLEnum(CohortStatus), default=CohortStatus.RECRUITING)
    min_participants = Column(Integer, default=30)
    max_participants = Column(Integer, default=50)
    deadline = Column(DateTime, nullable=False)  # 모집 마감일
    description = Column(Text, nullable=True)

    # 통계 캐시 (성능 최적화)
    participant_count = Column(Integer, default=0)
    total_estimated_savings = Column(BigInteger, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    participants = relationship("CohortParticipant", back_populates="cohort", cascade="all, delete-orphan")
    cohort_vendors = relationship("CohortVendor", back_populates="cohort", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Cohort {self.name}>"


class CohortParticipant(Base):
    """코호트 참여자"""
    __tablename__ = "cohort_participants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cohort_id = Column(UUID(as_uuid=True), ForeignKey("cohorts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # 개원 정보
    opening_date = Column(Date, nullable=False)  # 개원 예정일
    region = Column(String(50), nullable=False)  # 시/도
    district = Column(String(50), nullable=False)  # 구/군
    specialty = Column(String(50), nullable=False)  # 진료과목
    size_pyeong = Column(Integer, nullable=False)  # 평수

    status = Column(SQLEnum(ParticipantStatus), default=ParticipantStatus.ACTIVE)
    estimated_savings = Column(BigInteger, nullable=True)  # 예상 절감액

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Unique constraint
    __table_args__ = (
        UniqueConstraint('cohort_id', 'user_id', name='uq_cohort_participant'),
    )

    # Relationships
    cohort = relationship("Cohort", back_populates="participants")
    user = relationship("User", back_populates="cohort_participations")
    categories = relationship("ParticipantCategory", back_populates="participant", cascade="all, delete-orphan")
    contracts = relationship("ParticipantContract", back_populates="participant", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<CohortParticipant {self.user_id} in {self.cohort_id}>"


class ParticipantCategory(Base):
    """참여자 관심 카테고리"""
    __tablename__ = "participant_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    participant_id = Column(UUID(as_uuid=True), ForeignKey("cohort_participants.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("group_buying_categories.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Unique constraint
    __table_args__ = (
        UniqueConstraint('participant_id', 'category_id', name='uq_participant_category'),
    )

    # Relationships
    participant = relationship("CohortParticipant", back_populates="categories")
    category = relationship("GroupBuyingCategory", back_populates="participant_categories")


class GroupBuyingVendor(Base):
    """공동구매 업체"""
    __tablename__ = "group_buying_vendors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_id = Column(UUID(as_uuid=True), ForeignKey("group_buying_categories.id"), nullable=False)

    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    contact_name = Column(String(50), nullable=True)
    contact_email = Column(String(100), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)

    # 평점/리뷰
    rating = Column(Float, default=0)  # 0-5
    review_count = Column(Integer, default=0)

    # 상태
    is_verified = Column(Boolean, default=False)  # 인증 업체
    is_active = Column(Boolean, default=True)

    # 추가 정보
    logo_url = Column(String(500), nullable=True)
    website_url = Column(String(500), nullable=True)
    features = Column(JSON, nullable=True)  # 특징 목록

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    category = relationship("GroupBuyingCategory", back_populates="vendors")
    cohort_vendors = relationship("CohortVendor", back_populates="vendor")
    contracts = relationship("ParticipantContract", back_populates="vendor")

    def __repr__(self):
        return f"<GroupBuyingVendor {self.name}>"


class CohortVendor(Base):
    """코호트-업체 매핑 (입찰/선정)"""
    __tablename__ = "cohort_vendors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cohort_id = Column(UUID(as_uuid=True), ForeignKey("cohorts.id", ondelete="CASCADE"), nullable=False)
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("group_buying_vendors.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("group_buying_categories.id"), nullable=False)

    discount_rate = Column(Float, nullable=True)  # 할인율 (%)
    quote_price = Column(BigInteger, nullable=True)  # 견적가
    quote_details = Column(JSON, nullable=True)  # 상세 견적

    is_selected = Column(Boolean, default=False)  # 최종 선정 여부
    selection_rank = Column(Integer, nullable=True)  # 선정 순위 (1, 2, 3...)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Unique constraint
    __table_args__ = (
        UniqueConstraint('cohort_id', 'vendor_id', 'category_id', name='uq_cohort_vendor_category'),
    )

    # Relationships
    cohort = relationship("Cohort", back_populates="cohort_vendors")
    vendor = relationship("GroupBuyingVendor", back_populates="cohort_vendors")
    category = relationship("GroupBuyingCategory", back_populates="cohort_vendors")


class ParticipantContract(Base):
    """참여자 계약"""
    __tablename__ = "participant_contracts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    participant_id = Column(UUID(as_uuid=True), ForeignKey("cohort_participants.id", ondelete="CASCADE"), nullable=False)
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("group_buying_vendors.id"), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("group_buying_categories.id"), nullable=False)

    contract_amount = Column(BigInteger, nullable=False)  # 계약 금액
    original_amount = Column(BigInteger, nullable=False)  # 원래 시장가
    saved_amount = Column(BigInteger, nullable=False)  # 절감액

    status = Column(SQLEnum(ContractStatus), default=ContractStatus.PENDING)
    contracted_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    participant = relationship("CohortParticipant", back_populates="contracts")
    vendor = relationship("GroupBuyingVendor", back_populates="contracts")
    category = relationship("GroupBuyingCategory", back_populates="contracts")

    def __repr__(self):
        return f"<ParticipantContract {self.id}>"


class GroupBuyingStats(Base):
    """공동구매 전체 통계 (캐시 테이블)"""
    __tablename__ = "group_buying_stats"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    total_participants = Column(Integer, default=0)  # 총 참여자 수
    total_savings = Column(BigInteger, default=0)  # 총 절감액
    total_cohorts_completed = Column(Integer, default=0)  # 완료된 코호트 수
    avg_savings_per_participant = Column(BigInteger, default=0)  # 참여자당 평균 절감액
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
