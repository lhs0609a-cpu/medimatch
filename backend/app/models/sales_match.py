"""
영업사원↔개원의 유료 매칭 모델

- 영업사원이 개원 준비중 의사에게 매칭 요청
- 건당 고정 수수료: 30만원
- 의사 거절/무응답 시 자동 환불
"""
import uuid
from datetime import datetime, timedelta
from sqlalchemy import (
    Column, String, Integer, Text, DateTime,
    ForeignKey, Boolean, Float, Index
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
from sqlalchemy.orm import relationship
import enum
from ..core.database import Base


class SalesRepStatus(str, enum.Enum):
    """영업사원 프로필 상태"""
    PENDING = "PENDING"           # 승인 대기
    ACTIVE = "ACTIVE"             # 활성
    SUSPENDED = "SUSPENDED"       # 정지
    INACTIVE = "INACTIVE"         # 비활성


class ProductCategory(str, enum.Enum):
    """취급 제품 카테고리"""
    MEDICAL_DEVICE = "MEDICAL_DEVICE"       # 의료기기
    PHARMACEUTICAL = "PHARMACEUTICAL"       # 제약
    INTERIOR = "INTERIOR"                   # 인테리어
    FURNITURE = "FURNITURE"                 # 가구/집기
    IT_SOLUTION = "IT_SOLUTION"             # IT/EMR 솔루션
    INSURANCE = "INSURANCE"                 # 보험
    LOAN = "LOAN"                           # 대출/금융
    CONSULTING = "CONSULTING"               # 컨설팅
    OTHER = "OTHER"                         # 기타


class MatchRequestStatus(str, enum.Enum):
    """매칭 요청 상태"""
    PENDING_PAYMENT = "PENDING_PAYMENT"     # 결제 대기
    PENDING = "PENDING"                     # 결제 완료, 의사 응답 대기
    ACCEPTED = "ACCEPTED"                   # 의사 수락
    REJECTED = "REJECTED"                   # 의사 거절
    EXPIRED = "EXPIRED"                     # 48시간 무응답 만료
    REFUNDED = "REFUNDED"                   # 환불 완료
    CONTACT_MADE = "CONTACT_MADE"           # 컨택 완료
    COMPLETED = "COMPLETED"                 # 완료 (리뷰 작성 등)
    CANCELLED = "CANCELLED"                 # 취소


class DoctorResponse(str, enum.Enum):
    """의사 응답 유형"""
    ACCEPTED = "ACCEPTED"                   # 수락
    REJECTED = "REJECTED"                   # 거절
    EXPIRED = "EXPIRED"                     # 무응답


class ContactResult(str, enum.Enum):
    """컨택 결과"""
    NOT_YET = "NOT_YET"                     # 아직 컨택 안함
    IN_PROGRESS = "IN_PROGRESS"             # 진행 중
    SUCCESS = "SUCCESS"                     # 계약 성사
    FAILED = "FAILED"                       # 실패
    POSTPONED = "POSTPONED"                 # 연기


class SalesRepProfile(Base):
    """영업사원 프로필"""
    __tablename__ = "sales_rep_profiles"

    id = Column(Integer, primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)

    # === 기본 정보 ===
    company = Column(String(200), nullable=False)  # 소속 회사
    department = Column(String(100), nullable=True)  # 부서
    position = Column(String(100), nullable=True)  # 직책
    business_card_url = Column(String(500), nullable=True)  # 명함 이미지

    # === 취급 제품/서비스 ===
    product_categories = Column(ARRAY(String), default=[])  # ProductCategory values
    product_details = Column(Text, nullable=True)  # 상세 취급 품목

    # === 타겟 진료과목 ===
    target_specialties = Column(ARRAY(String), default=[])  # 타겟 진료과
    # 예: ["내과", "정형외과", "피부과"]

    # === 영업 지역 ===
    service_regions = Column(ARRAY(String), default=[])  # 영업 지역
    # 예: ["서울", "경기", "인천"]

    # === 경력 및 소개 ===
    experience_years = Column(Integer, default=0)  # 경력 연차
    introduction = Column(Text, nullable=True)  # 자기 소개

    # === 통계 ===
    total_requests = Column(Integer, default=0)  # 총 매칭 요청 수
    accepted_requests = Column(Integer, default=0)  # 수락된 요청 수
    successful_contacts = Column(Integer, default=0)  # 성공적 컨택 수
    total_spent = Column(Integer, default=0)  # 총 지출 금액

    @property
    def acceptance_rate(self) -> float:
        """수락률"""
        if self.total_requests == 0:
            return 0.0
        return round((self.accepted_requests / self.total_requests) * 100, 1)

    @property
    def success_rate(self) -> float:
        """성공률 (컨택 성사율)"""
        if self.accepted_requests == 0:
            return 0.0
        return round((self.successful_contacts / self.accepted_requests) * 100, 1)

    # === 평점 ===
    rating = Column(Float, default=0.0)  # 평균 평점 (1-5)
    rating_count = Column(Integer, default=0)  # 평점 개수

    # === 상태 및 검증 ===
    status = Column(SQLEnum(SalesRepStatus), default=SalesRepStatus.PENDING)
    is_verified = Column(Boolean, default=False)  # 신원 확인 여부
    verified_at = Column(DateTime, nullable=True)
    verification_docs = Column(JSONB, default=[])
    # 예: [{"type": "사업자등록증", "url": "...", "uploaded_at": "..."}]

    # === 메타데이터 ===
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_active_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", backref="sales_rep_profile")

    __table_args__ = (
        Index('ix_sales_rep_profiles_status', 'status'),
        Index('ix_sales_rep_profiles_user', 'user_id'),
    )

    def __repr__(self):
        return f"<SalesRepProfile {self.id} - {self.company}>"


class SalesMatchRequest(Base):
    """영업사원 매칭 요청"""
    __tablename__ = "sales_match_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sales_rep_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # === 요청 정보 ===
    product_category = Column(String(50), nullable=False)  # 제품 카테고리
    message = Column(Text, nullable=True)  # 요청 메시지

    # === 수수료 및 결제 ===
    match_fee = Column(Integer, default=300000)  # 매칭 수수료 (30만원)
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True)
    paid_at = Column(DateTime, nullable=True)

    # === 상태 ===
    status = Column(SQLEnum(MatchRequestStatus), default=MatchRequestStatus.PENDING_PAYMENT)
    doctor_response = Column(SQLEnum(DoctorResponse), nullable=True)
    reject_reason = Column(Text, nullable=True)  # 거절 사유

    # === 컨택 정보 (수락 후 공개) ===
    contact_shared = Column(Boolean, default=False)  # 연락처 공개 여부
    contact_shared_at = Column(DateTime, nullable=True)

    # === 컨택 결과 (영업사원 기록) ===
    contact_result = Column(SQLEnum(ContactResult), default=ContactResult.NOT_YET)
    contact_note = Column(Text, nullable=True)  # 컨택 결과 메모
    contacted_at = Column(DateTime, nullable=True)

    # === 환불 ===
    refund_id = Column(Integer, ForeignKey("payments.id"), nullable=True)
    refunded_at = Column(DateTime, nullable=True)
    refund_reason = Column(String(100), nullable=True)

    # === 기간 ===
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)  # 응답 기한 (48시간)
    responded_at = Column(DateTime, nullable=True)

    # Relationships
    sales_rep_user = relationship("User", foreign_keys=[sales_rep_id], backref="sent_match_requests")
    doctor = relationship("User", foreign_keys=[doctor_id], backref="received_match_requests")
    payment = relationship("Payment", foreign_keys=[payment_id])
    reviews = relationship("SalesMatchReview", back_populates="match_request",
                          cascade="all, delete-orphan")

    __table_args__ = (
        Index('ix_sales_match_requests_status', 'status'),
        Index('ix_sales_match_requests_sales_rep', 'sales_rep_id'),
        Index('ix_sales_match_requests_doctor', 'doctor_id'),
        Index('ix_sales_match_requests_expires', 'expires_at'),
    )

    def __repr__(self):
        return f"<SalesMatchRequest {self.id} - {self.status}>"

    @property
    def is_expired(self) -> bool:
        """만료 여부"""
        if self.expires_at and datetime.utcnow() > self.expires_at:
            return True
        return False

    @property
    def time_remaining(self) -> timedelta:
        """남은 시간"""
        if self.expires_at:
            remaining = self.expires_at - datetime.utcnow()
            return max(remaining, timedelta(0))
        return timedelta(0)


class SalesMatchReview(Base):
    """매칭 리뷰"""
    __tablename__ = "sales_match_reviews"

    id = Column(Integer, primary_key=True)
    match_request_id = Column(UUID(as_uuid=True), ForeignKey("sales_match_requests.id"), nullable=False)
    reviewer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # 리뷰 대상 (영업사원이면 의사가, 의사면 영업사원이 작성)
    reviewer_type = Column(String(20), nullable=False)  # 'DOCTOR', 'SALES_REP'

    # === 평가 ===
    rating = Column(Integer, nullable=False)  # 1-5점
    comment = Column(Text, nullable=True)

    # === 메타데이터 ===
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    match_request = relationship("SalesMatchRequest", back_populates="reviews")
    reviewer = relationship("User", backref="sales_match_reviews")

    __table_args__ = (
        Index('ix_sales_match_reviews_request', 'match_request_id'),
        Index('ix_sales_match_reviews_reviewer', 'reviewer_id'),
    )

    def __repr__(self):
        return f"<SalesMatchReview {self.id} - {self.rating}>"


# 매칭 수수료 설정
MATCH_FEE = 300000  # 30만원

# 응답 대기 시간
RESPONSE_TIMEOUT_HOURS = 48

# 의사 정보 공개 레벨 (영업사원에게)
DOCTOR_VISIBLE_FIELDS = {
    "MINIMAL": [
        # 매칭 전 기본 공개 정보
        "region_name",              # 개원 희망 지역 (시/구)
        "specialty",                # 진료과목
        "opening_status",           # 개원 준비 상태
        "expected_opening_date",    # 예상 개원 시기 (월 단위)
    ],
    "ACCEPTED": [
        # 매칭 수락 후 공개
        "name",                     # 이름
        "phone",                    # 연락처
        "email",                    # 이메일
        "exact_region",             # 정확한 지역
        "clinic_name",              # 예정 병원명
    ],
}

# 영업사원 정보 공개 레벨 (의사에게)
SALES_REP_VISIBLE_FIELDS = {
    "ALWAYS": [
        # 항상 공개
        "company",
        "product_categories",
        "target_specialties",
        "experience_years",
        "introduction",
        "rating",
        "acceptance_rate",
        "success_rate",
    ],
    "ACCEPTED": [
        # 매칭 수락 후 공개
        "name",
        "phone",
        "email",
        "department",
        "position",
    ],
}
