"""
개원의 Lead CRM 모델

- DoctorLead : 광고/캠페인으로 추출된 개원 예정 의사 정보
- LeadConsultation : 통화/카톡/미팅 등 상담 기록
- LeadPartnerMatch : Lead ↔ Partner 매칭 (소개·견적·계약 추적)

ContactInquiry (홈페이지 인입 문의)와 분리:
- ContactInquiry는 의사가 직접 입력한 문의
- DoctorLead는 우리가 외부 DB/광고에서 추출 후 콜드콜하는 대상
- 전환되면 user_id, opening_project_id로 연결
"""
import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Index,
    Numeric, Enum as SQLEnum,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base


# ============================================================
# Enums
# ============================================================

class LeadFunnelStage(str, enum.Enum):
    """CRM 퍼널 단계 — 우리가 의사를 어디까지 끌어왔는지"""
    NEW = "NEW"                  # 신규 추출 (콜드)
    CONTACTED = "CONTACTED"      # 1차 컨택 시도
    ENGAGED = "ENGAGED"          # 응답·관심 표명
    QUALIFIED = "QUALIFIED"      # 예산·시기·전공 자격 확인됨
    PROPOSING = "PROPOSING"      # 솔루션·견적 제안 중
    NEGOTIATING = "NEGOTIATING"  # 협상·계약 직전
    CONVERTED = "CONVERTED"      # 전환 (User 가입 + 협력사 계약)
    DORMANT = "DORMANT"          # 휴면 (재타겟용)
    LOST = "LOST"                # 실패


class LeadOpeningStage(str, enum.Enum):
    """개원 진행 단계 — 의사가 실제 어디쯤 있는지"""
    PLANNING = "PLANNING"              # 사업계획·방향 결정
    LOCATION_REVIEW = "LOCATION_REVIEW"  # 입지 검토
    CONTRACT = "CONTRACT"              # 임대 계약
    LICENSING = "LICENSING"            # 인허가·개설신고
    CONSTRUCTION = "CONSTRUCTION"      # 인테리어·시공
    EQUIPMENT = "EQUIPMENT"            # 의료기기 도입
    HIRING = "HIRING"                  # 인력 채용
    OPENING = "OPENING"                # 개원 임박/직전
    OPERATING = "OPERATING"            # 운영 중


class LeadPriority(str, enum.Enum):
    HOT = "HOT"      # 즉시 클로징 가능
    WARM = "WARM"    # 1~3개월 내
    COLD = "COLD"    # 장기 nurturing
    DEAD = "DEAD"    # 가능성 없음


class ConsultationOutcome(str, enum.Enum):
    NO_ANSWER = "NO_ANSWER"
    REFUSED = "REFUSED"
    INTERESTED = "INTERESTED"
    FOLLOW_UP = "FOLLOW_UP"
    BOOKED_MEETING = "BOOKED_MEETING"
    PROPOSAL_SENT = "PROPOSAL_SENT"
    CONVERTED = "CONVERTED"
    LOST = "LOST"


class ContactMethod(str, enum.Enum):
    PHONE = "PHONE"
    KAKAO = "KAKAO"
    SMS = "SMS"
    EMAIL = "EMAIL"
    MEETING = "MEETING"
    OTHER = "OTHER"


class LeadPartnerMatchStatus(str, enum.Enum):
    SUGGESTED = "SUGGESTED"        # 추천만 (아직 소개 전)
    INTRODUCED = "INTRODUCED"      # 의사에게 협력사 정보 전달
    IN_PROGRESS = "IN_PROGRESS"    # 협력사가 컨택 중
    QUOTED = "QUOTED"              # 견적 발행
    CONTRACTED = "CONTRACTED"      # 계약 성사
    REJECTED = "REJECTED"          # 거절·취소


class MilestoneStatus(str, enum.Enum):
    PLANNED = "PLANNED"
    IN_PROGRESS = "IN_PROGRESS"
    DONE = "DONE"
    BLOCKED = "BLOCKED"
    SKIPPED = "SKIPPED"


class MilestoneSource(str, enum.Enum):
    AUTO = "AUTO"            # 시스템 자동 생성 (단계 시드)
    MANUAL = "MANUAL"        # 우리팀이 수동 추가
    PARTNER_EVENT = "PARTNER_EVENT"  # 매칭/견적/계약 이벤트로 자동 추가


# ============================================================
# DoctorLead
# ============================================================

class DoctorLead(Base):
    __tablename__ = "doctor_leads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # 기본 식별 정보
    name = Column(String(100), nullable=False)
    phone = Column(String(30), nullable=True, index=True)
    email = Column(String(200), nullable=True)
    license_number = Column(String(50), nullable=True)  # 면허번호 (확인된 경우)

    # 의사 프로필
    specialty = Column(String(100), nullable=True, index=True)  # 진료과
    sub_specialty = Column(String(100), nullable=True)
    current_workplace = Column(String(200), nullable=True)  # 현재 근무처
    years_of_practice = Column(Integer, nullable=True)

    # 개원 의향
    target_region_sido = Column(String(50), nullable=True, index=True)
    target_region_sigungu = Column(String(50), nullable=True, index=True)
    target_region_dong = Column(String(50), nullable=True)
    target_open_date = Column(DateTime, nullable=True)  # 희망 개원일
    budget_total = Column(Numeric(15, 0), nullable=True)
    has_partner = Column(Boolean, default=False)  # 동업 여부
    needs_loan = Column(Boolean, default=False)
    expected_clinic_size_pyeong = Column(Integer, nullable=True)

    # CRM 핵심 상태
    funnel_stage = Column(
        SQLEnum(LeadFunnelStage, name="leadfunnelstage"),
        default=LeadFunnelStage.NEW, nullable=False, index=True,
    )
    opening_stage = Column(
        SQLEnum(LeadOpeningStage, name="leadopeningstage"),
        default=LeadOpeningStage.PLANNING, nullable=False, index=True,
    )
    priority = Column(
        SQLEnum(LeadPriority, name="leadpriority"),
        default=LeadPriority.WARM, nullable=False, index=True,
    )

    # 점수
    lead_score = Column(Integer, default=50)         # 매출 가능성 (0-100)
    readiness_score = Column(Integer, default=0)     # 개원 준비도 (체크리스트 완료율)

    # 단계별 체크리스트 — JSONB 스토어
    # 구조: {"PLANNING": [{"key":"specialty_decided","done":true,"note":"...","completed_at":"..."}], ...}
    checklist = Column(JSONB, default=dict)

    # 우리 팀 메모·다음 액션
    notes = Column(Text, nullable=True)
    next_action = Column(String(500), nullable=True)
    next_followup_at = Column(DateTime, nullable=True, index=True)
    last_contacted_at = Column(DateTime, nullable=True)

    # 출처
    source = Column(String(50), nullable=True, index=True)  # facebook_ad, google, referral, scraped, manual
    source_campaign_id = Column(String(36), ForeignKey("campaigns.id"), nullable=True)
    source_meta = Column(JSONB, default=dict)  # 광고 ID, utm 등

    # 할당
    owner_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)

    # 전환된 경우
    converted_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    converted_project_id = Column(UUID(as_uuid=True), ForeignKey("opening_projects.id"), nullable=True)
    converted_at = Column(DateTime, nullable=True)

    # 의사 본인용 매직링크 (/my-roadmap?token=...)
    roadmap_token = Column(String(64), nullable=True, unique=True, index=True)
    roadmap_token_expires_at = Column(DateTime, nullable=True)
    roadmap_last_viewed_at = Column(DateTime, nullable=True)
    roadmap_view_count = Column(Integer, default=0)

    # 메타
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    consultations = relationship(
        "LeadConsultation", back_populates="lead",
        cascade="all, delete-orphan",
        order_by="LeadConsultation.created_at.desc()",
    )
    partner_matches = relationship(
        "LeadPartnerMatch", back_populates="lead",
        cascade="all, delete-orphan",
    )
    milestones = relationship(
        "LeadMilestone", back_populates="lead",
        cascade="all, delete-orphan",
        order_by="LeadMilestone.due_at.asc().nullslast()",
    )
    owner = relationship("User", foreign_keys=[owner_user_id])
    converted_user = relationship("User", foreign_keys=[converted_user_id])

    __table_args__ = (
        Index("ix_doctor_leads_owner_funnel", "owner_user_id", "funnel_stage"),
        Index("ix_doctor_leads_followup", "next_followup_at"),
        Index("ix_doctor_leads_priority_funnel", "priority", "funnel_stage"),
    )


# ============================================================
# LeadConsultation
# ============================================================

class LeadConsultation(Base):
    __tablename__ = "lead_consultations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id = Column(UUID(as_uuid=True), ForeignKey("doctor_leads.id", ondelete="CASCADE"),
                     nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)  # 상담사

    contact_method = Column(SQLEnum(ContactMethod, name="contactmethod"),
                            default=ContactMethod.PHONE)
    direction = Column(String(10), default="OUTBOUND")  # OUTBOUND / INBOUND
    duration_seconds = Column(Integer, default=0)

    # 내용
    summary = Column(Text, nullable=True)              # 1줄 요약
    transcript = Column(Text, nullable=True)           # 상세 내용
    talked_about = Column(JSONB, default=list)         # 다룬 체크리스트 키 ["budget","specialty",...]
    pain_points = Column(JSONB, default=list)          # 불편/니즈 ["세무사 못구함","입지 막막"]

    outcome = Column(SQLEnum(ConsultationOutcome, name="consultationoutcome"),
                     default=ConsultationOutcome.FOLLOW_UP)
    next_action = Column(String(500), nullable=True)
    next_followup_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    lead = relationship("DoctorLead", back_populates="consultations")
    user = relationship("User")


# ============================================================
# LeadPartnerMatch
# ============================================================

class LeadPartnerMatch(Base):
    __tablename__ = "lead_partner_matches"

    id = Column(Integer, primary_key=True, autoincrement=True)
    lead_id = Column(UUID(as_uuid=True), ForeignKey("doctor_leads.id", ondelete="CASCADE"),
                     nullable=False, index=True)
    partner_id = Column(Integer, ForeignKey("partners.id"), nullable=True, index=True)

    # 카테고리는 partner 없이 추천만 한 상태도 있을 수 있어서 분리 보관
    category = Column(String(50), nullable=False, index=True)
    match_reason = Column(String(500), nullable=True)  # "세무사 미배정 + 강남 지역"

    status = Column(SQLEnum(LeadPartnerMatchStatus, name="leadpartnermatchstatus"),
                    default=LeadPartnerMatchStatus.SUGGESTED, nullable=False, index=True)

    matched_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    matched_at = Column(DateTime, default=datetime.utcnow)

    introduced_at = Column(DateTime, nullable=True)
    quoted_amount = Column(Numeric(15, 0), nullable=True)
    quoted_at = Column(DateTime, nullable=True)
    # 비교 매트릭스용 견적 상세
    # 구조: {"unit":"total","duration_days":60,"warranty_months":24,
    #        "includes":["설계도","3D"],"excludes":["사이니지"],
    #        "payment_terms":"50/30/20","valid_until":"2026-06-01",
    #        "extra":{...}}
    quote_details = Column(JSONB, default=dict)
    contracted_amount = Column(Numeric(15, 0), nullable=True)
    contracted_at = Column(DateTime, nullable=True)

    commission_rate = Column(Numeric(5, 2), nullable=True)  # %
    commission_amount = Column(Numeric(15, 0), nullable=True)

    note = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    lead = relationship("DoctorLead", back_populates="partner_matches")
    partner = relationship("Partner")
    matched_by = relationship("User")

    __table_args__ = (
        Index("ix_lead_partner_match_lead_cat", "lead_id", "category"),
    )


# ============================================================
# LeadMilestone — 공유 타임라인
# ============================================================

class LeadMilestone(Base):
    __tablename__ = "lead_milestones"

    id = Column(Integer, primary_key=True, autoincrement=True)
    lead_id = Column(UUID(as_uuid=True), ForeignKey("doctor_leads.id", ondelete="CASCADE"),
                     nullable=False, index=True)

    # 어느 단계에 속한 마일스톤인지 (LeadOpeningStage)
    stage = Column(SQLEnum(LeadOpeningStage, name="leadopeningstage", create_type=False),
                   nullable=True, index=True)

    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)

    due_at = Column(DateTime, nullable=True, index=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    status = Column(SQLEnum(MilestoneStatus, name="milestonestatus"),
                    default=MilestoneStatus.PLANNED, nullable=False, index=True)
    source = Column(SQLEnum(MilestoneSource, name="milestonesource"),
                    default=MilestoneSource.MANUAL)

    # 관련 매칭 (있으면 그 협력사가 담당)
    partner_match_id = Column(Integer, ForeignKey("lead_partner_matches.id", ondelete="SET NULL"),
                              nullable=True)

    # 담당 가시성 — 의사·우리팀·협력사 누가 볼 수 있는지
    visible_to_doctor = Column(Boolean, default=True)
    visible_to_partner = Column(Boolean, default=True)

    # 우리팀 담당자
    owner_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    order_index = Column(Integer, default=0)
    metadata_json = Column(JSONB, default=dict)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    lead = relationship("DoctorLead", back_populates="milestones")
    partner_match = relationship("LeadPartnerMatch")
    owner = relationship("User")

    __table_args__ = (
        Index("ix_milestone_lead_due", "lead_id", "due_at"),
        Index("ix_milestone_lead_stage", "lead_id", "stage"),
    )
