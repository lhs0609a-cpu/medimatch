import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
import enum
from ..core.database import Base


class ProspectType(str, enum.Enum):
    NEW_BUILD = "NEW_BUILD"  # 신축 건물
    VACANCY = "VACANCY"  # 공실 (폐업 후)
    RELOCATION = "RELOCATION"  # 이전 예정


class ProspectStatus(str, enum.Enum):
    NEW = "NEW"
    CONTACTED = "CONTACTED"
    CONVERTED = "CONVERTED"
    CLOSED = "CLOSED"


class ProspectLocation(Base):
    """잠재 개원지 테이블 (SalesScanner)"""
    __tablename__ = "prospect_locations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    building_id = Column(String(50), nullable=True)  # 건축물대장 ID
    address = Column(String(500), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    type = Column(SQLEnum(ProspectType), nullable=False)
    zoning = Column(String(100), nullable=True)  # 용도지역
    floor_area = Column(Float, nullable=True)  # 전용면적 (m2)
    floor_info = Column(String(50), nullable=True)  # 층 정보
    clinic_fit_score = Column(Integer, nullable=True)  # 병원 입점 적합도 (0-100)
    recommended_dept = Column(ARRAY(String), nullable=True)  # 추천 진료과목
    previous_clinic = Column(String(200), nullable=True)  # 이전 병원명 (공실인 경우)
    rent_estimate = Column(BigInteger, nullable=True)  # 예상 임대료
    description = Column(Text, nullable=True)
    detected_at = Column(DateTime, default=datetime.utcnow)
    status = Column(SQLEnum(ProspectStatus), default=ProspectStatus.NEW)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<ProspectLocation {self.address}>"


class UserAlert(Base):
    """사용자 알림 설정 테이블 (SalesScanner)"""
    __tablename__ = "user_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=True)  # 알림 이름
    region_codes = Column(ARRAY(String), nullable=True)  # 관심 지역 코드
    region_names = Column(ARRAY(String), nullable=True)  # 관심 지역명
    clinic_types = Column(ARRAY(String), nullable=True)  # 관심 진료과목
    min_score = Column(Integer, default=0)  # 최소 적합도 점수
    prospect_types = Column(ARRAY(String), nullable=True)  # 관심 타입 (NEW_BUILD, VACANCY 등)
    notify_email = Column(Boolean, default=True)
    notify_push = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="alerts")

    def __repr__(self):
        return f"<UserAlert {self.user_id}>"
