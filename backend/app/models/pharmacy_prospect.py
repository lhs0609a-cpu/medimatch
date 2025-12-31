"""
약국 타겟팅 모델
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, BigInteger, Float, Text, DateTime, Boolean
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
from sqlalchemy.orm import relationship
import enum
from ..core.database import Base


class ProspectGrade(str, enum.Enum):
    HOT = "HOT"          # 80점 이상 - 적극 영업
    WARM = "WARM"        # 60-79점 - 일반 영업
    COLD = "COLD"        # 40-59점 - 관심 목록
    INACTIVE = "INACTIVE"  # 40점 미만 - 제외


class ContactStatus(str, enum.Enum):
    NOT_CONTACTED = "not_contacted"
    CONTACTED = "contacted"
    INTERESTED = "interested"
    NOT_INTERESTED = "not_interested"
    REGISTERED = "registered"  # 매물 등록함


class PharmacyProspectTarget(Base):
    """약국 타겟 테이블"""
    __tablename__ = "pharmacy_prospect_targets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ykiho = Column(String(50), unique=True, nullable=False, index=True)  # 요양기관번호

    # 기본 정보
    name = Column(String(200), nullable=False)
    address = Column(String(500), nullable=False)
    phone = Column(String(50), nullable=True)
    email = Column(String(200), nullable=True)
    latitude = Column(Float, default=0)
    longitude = Column(Float, default=0)

    # 분석 정보
    established_date = Column(String(10), nullable=True)  # YYYYMMDD
    years_operated = Column(Integer, default=0)
    est_pharmacist_age = Column(Integer, default=0)  # 추정 연령
    pharmacist_count = Column(Integer, default=1)

    # 매출 정보
    monthly_revenue = Column(BigInteger, default=0)
    revenue_trend = Column(String(20), default="stable")  # growing, stable, declining

    # 경쟁 환경
    nearby_hospital_count = Column(Integer, default=0)
    nearby_pharmacy_count = Column(Integer, default=0)
    competition_score = Column(Integer, default=50)  # 경쟁 강도

    # 타겟팅 점수
    prospect_score = Column(Integer, default=0, index=True)
    prospect_grade = Column(SQLEnum(ProspectGrade), default=ProspectGrade.COLD, index=True)
    score_factors = Column(JSONB, default=list)  # 점수 산정 요소

    # 연락 상태
    contact_status = Column(SQLEnum(ContactStatus), default=ContactStatus.NOT_CONTACTED, index=True)
    last_contact_date = Column(DateTime, nullable=True)
    contact_count = Column(Integer, default=0)  # 연락 시도 횟수
    notes = Column(Text, nullable=True)  # 메모

    # 캠페인 정보
    last_campaign_id = Column(String(100), nullable=True)
    last_campaign_date = Column(DateTime, nullable=True)

    # 메타
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    def __repr__(self):
        return f"<PharmacyProspectTarget {self.name} ({self.prospect_grade.value})>"


class OutboundCampaign(Base):
    """아웃바운드 캠페인 테이블"""
    __tablename__ = "outbound_campaigns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    campaign_type = Column(String(20), nullable=False)  # SMS, EMAIL
    target_grade = Column(String(20), nullable=False)  # HOT, WARM, COLD

    # 템플릿
    message_template = Column(Text, nullable=True)
    email_subject = Column(String(500), nullable=True)
    email_body = Column(Text, nullable=True)

    # 상태
    status = Column(String(20), default="DRAFT")  # DRAFT, SCHEDULED, RUNNING, COMPLETED, CANCELLED
    scheduled_time = Column(DateTime, nullable=True)

    # 통계
    total_targets = Column(Integer, default=0)
    sent_count = Column(Integer, default=0)
    delivered_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    response_count = Column(Integer, default=0)

    # 메타
    created_by = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    def __repr__(self):
        return f"<OutboundCampaign {self.name} ({self.status})>"


class CampaignMessage(Base):
    """캠페인 메시지 발송 기록"""
    __tablename__ = "campaign_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    prospect_id = Column(UUID(as_uuid=True), nullable=False, index=True)

    # 수신자 정보
    recipient_phone = Column(String(50), nullable=True)
    recipient_email = Column(String(200), nullable=True)

    # 발송 정보
    message_content = Column(Text, nullable=True)
    status = Column(String(20), default="PENDING")  # PENDING, SENT, DELIVERED, FAILED

    # 결과
    sent_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)

    # 외부 ID (Solapi 등)
    external_message_id = Column(String(100), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<CampaignMessage {self.status}>"
