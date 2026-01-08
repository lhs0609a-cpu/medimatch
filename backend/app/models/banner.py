"""
파트너 배너 광고 모델 (CPM 방식)

- 노출수 기반 과금 (1000회당 5000원)
- 배너 위치: 홈상단, 사이드바, 검색결과, 파트너목록
- 일일/총 예산 설정
- 노출/클릭 추적
"""
import uuid
from datetime import datetime, date
from sqlalchemy import (
    Column, String, Integer, BigInteger, Text, DateTime, Date,
    ForeignKey, Boolean, Float, Index
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
from sqlalchemy.orm import relationship
import enum
from ..core.database import Base


class BannerPosition(str, enum.Enum):
    """배너 위치"""
    HOME_TOP = "HOME_TOP"         # 홈페이지 상단 (1920x600)
    SIDEBAR = "SIDEBAR"           # 사이드바 (300x600)
    SEARCH_RESULT = "SEARCH_RESULT"  # 검색 결과 (728x90)
    PARTNERS_LIST = "PARTNERS_LIST"  # 파트너 목록 (400x300)
    CATEGORY_HEADER = "CATEGORY_HEADER"  # 카테고리 상단 (1200x300)


class BannerStatus(str, enum.Enum):
    """배너 상태"""
    DRAFT = "DRAFT"               # 임시저장
    PENDING = "PENDING"           # 승인 대기
    ACTIVE = "ACTIVE"             # 활성
    PAUSED = "PAUSED"             # 일시정지
    COMPLETED = "COMPLETED"       # 완료 (예산 소진/기간 만료)
    REJECTED = "REJECTED"         # 거부됨


class BannerAd(Base):
    """배너 광고"""
    __tablename__ = "banner_ads"

    id = Column(Integer, primary_key=True)
    partner_id = Column(Integer, ForeignKey("partners.id"), nullable=True)  # NULL이면 관리자 배너

    # === 배너 콘텐츠 ===
    title = Column(String(100), nullable=False)
    subtitle = Column(String(200), nullable=True)
    image_url = Column(String(500), nullable=False)
    link_url = Column(String(500), nullable=True)
    position = Column(SQLEnum(BannerPosition), nullable=False)

    # === 예산 및 과금 ===
    cpm_rate = Column(Integer, default=5000)  # 1000회 노출당 가격 (원)
    daily_budget = Column(Integer, nullable=True)  # 일일 예산 (원)
    total_budget = Column(Integer, nullable=False)  # 총 예산 (원)

    # === 통계 ===
    impressions = Column(Integer, default=0)  # 총 노출수
    clicks = Column(Integer, default=0)       # 총 클릭수
    spent = Column(Integer, default=0)        # 소진 금액 (원)
    today_impressions = Column(Integer, default=0)  # 오늘 노출수
    today_spent = Column(Integer, default=0)  # 오늘 소진 금액

    # === 타겟팅 ===
    target_regions = Column(ARRAY(String), default=[])  # 지역 타겟
    target_user_roles = Column(ARRAY(String), default=[])  # 역할 타겟 (DOCTOR, PHARMACIST)
    target_clinic_types = Column(ARRAY(String), default=[])  # 진료과 타겟

    # === 기간 ===
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)

    # === 상태 ===
    status = Column(SQLEnum(BannerStatus), default=BannerStatus.DRAFT)
    rejection_reason = Column(Text, nullable=True)

    # === 메타데이터 ===
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_impression_at = Column(DateTime, nullable=True)

    # Relationships
    partner = relationship("Partner", backref="banner_ads")
    events = relationship("BannerEvent", back_populates="banner", cascade="all, delete-orphan")
    daily_stats = relationship("BannerDailyStats", back_populates="banner", cascade="all, delete-orphan")

    __table_args__ = (
        Index('ix_banner_ads_status', 'status'),
        Index('ix_banner_ads_position', 'position'),
        Index('ix_banner_ads_partner', 'partner_id'),
        Index('ix_banner_ads_dates', 'start_date', 'end_date'),
    )

    def __repr__(self):
        return f"<BannerAd {self.id} - {self.title}>"

    @property
    def ctr(self) -> float:
        """클릭률 (Click Through Rate)"""
        if self.impressions == 0:
            return 0.0
        return round((self.clicks / self.impressions) * 100, 2)

    @property
    def remaining_budget(self) -> int:
        """남은 예산"""
        return max(0, self.total_budget - self.spent)

    @property
    def is_budget_exhausted(self) -> bool:
        """예산 소진 여부"""
        return self.spent >= self.total_budget

    @property
    def is_daily_budget_exhausted(self) -> bool:
        """일일 예산 소진 여부"""
        if not self.daily_budget:
            return False
        return self.today_spent >= self.daily_budget


class BannerEvent(Base):
    """배너 이벤트 (노출/클릭 로그)"""
    __tablename__ = "banner_events"

    id = Column(BigInteger, primary_key=True)
    banner_id = Column(Integer, ForeignKey("banner_ads.id"), nullable=False)

    event_type = Column(String(20), nullable=False)  # 'impression', 'click'
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    session_id = Column(String(100), nullable=True)  # 비로그인 사용자용

    # 컨텍스트 정보
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(Text, nullable=True)
    page_url = Column(String(500), nullable=True)
    referer = Column(String(500), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    banner = relationship("BannerAd", back_populates="events")
    user = relationship("User", backref="banner_events")

    __table_args__ = (
        Index('ix_banner_events_banner_type', 'banner_id', 'event_type'),
        Index('ix_banner_events_created', 'created_at'),
        Index('ix_banner_events_session', 'session_id', 'banner_id'),
    )

    def __repr__(self):
        return f"<BannerEvent {self.id} - {self.event_type}>"


class BannerDailyStats(Base):
    """배너 일별 통계"""
    __tablename__ = "banner_daily_stats"

    id = Column(Integer, primary_key=True)
    banner_id = Column(Integer, ForeignKey("banner_ads.id"), nullable=False)
    date = Column(Date, nullable=False)

    impressions = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    spent = Column(Integer, default=0)
    ctr = Column(Float, default=0.0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    banner = relationship("BannerAd", back_populates="daily_stats")

    __table_args__ = (
        Index('ix_banner_daily_stats_banner_date', 'banner_id', 'date', unique=True),
    )

    def __repr__(self):
        return f"<BannerDailyStats {self.banner_id} - {self.date}>"


# 배너 위치별 권장 크기
BANNER_SIZES = {
    BannerPosition.HOME_TOP: {"width": 1920, "height": 600, "description": "홈페이지 상단 배너"},
    BannerPosition.SIDEBAR: {"width": 300, "height": 600, "description": "사이드바 배너"},
    BannerPosition.SEARCH_RESULT: {"width": 728, "height": 90, "description": "검색결과 배너"},
    BannerPosition.PARTNERS_LIST: {"width": 400, "height": 300, "description": "파트너 목록 배너"},
    BannerPosition.CATEGORY_HEADER: {"width": 1200, "height": 300, "description": "카테고리 헤더 배너"},
}

# 기본 CPM 요율 (위치별)
DEFAULT_CPM_RATES = {
    BannerPosition.HOME_TOP: 10000,      # 1만원/1000회
    BannerPosition.SIDEBAR: 3000,        # 3천원/1000회
    BannerPosition.SEARCH_RESULT: 5000,  # 5천원/1000회
    BannerPosition.PARTNERS_LIST: 4000,  # 4천원/1000회
    BannerPosition.CATEGORY_HEADER: 7000,  # 7천원/1000회
}
