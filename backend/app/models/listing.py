import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, BigInteger, Float, Text, DateTime, Boolean
from sqlalchemy import Enum as SQLEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
import enum
from ..core.database import Base


class ListingStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"  # 매물 가능
    RESERVED = "RESERVED"    # 예약됨
    CONTRACTED = "CONTRACTED"  # 계약 완료
    CLOSED = "CLOSED"        # 마감


class ListingType(str, enum.Enum):
    RENT = "RENT"           # 임대
    SALE = "SALE"           # 매매
    SUBLEASE = "SUBLEASE"   # 전대


class RealEstateListing(Base):
    """부동산 매물 테이블 (부공연 연동)"""
    __tablename__ = "real_estate_listings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # 기본 정보
    title = Column(String(300), nullable=False)
    address = Column(String(500), nullable=False)
    latitude = Column(Float, nullable=False, default=0)
    longitude = Column(Float, nullable=False, default=0)

    # 건물 정보
    building_name = Column(String(200), nullable=True)
    floor = Column(String(50), nullable=True)  # 예: "3층", "B1층"
    area_pyeong = Column(Float, nullable=True)  # 전용면적 (평)
    area_m2 = Column(Float, nullable=True)  # 전용면적 (m2)

    # 비용 정보
    listing_type = Column(SQLEnum(ListingType), default=ListingType.RENT)
    rent_deposit = Column(BigInteger, nullable=True)  # 보증금
    rent_monthly = Column(BigInteger, nullable=True)  # 월세
    premium = Column(BigInteger, nullable=True)  # 권리금
    sale_price = Column(BigInteger, nullable=True)  # 매매가
    maintenance_fee = Column(Integer, nullable=True)  # 관리비 (월)

    # 매물 특성
    suitable_for = Column(ARRAY(String), nullable=True)  # 적합 진료과 ["피부과", "안과"]
    previous_use = Column(String(200), nullable=True)  # 이전 용도
    has_parking = Column(Boolean, default=False)
    has_elevator = Column(Boolean, default=False)
    near_hospital = Column(Boolean, default=False)  # 인접 병원 여부
    near_pharmacy = Column(Boolean, default=False)  # 인접 약국 여부

    # 상세 설명
    description = Column(Text, nullable=True)
    features = Column(ARRAY(String), nullable=True)  # 특징 태그

    # 담당자 정보
    contact_name = Column(String(100), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    contact_company = Column(String(200), nullable=True)  # 부공연 등

    # 상태
    status = Column(SQLEnum(ListingStatus), default=ListingStatus.AVAILABLE)
    is_featured = Column(Boolean, default=False)  # 추천 매물
    view_count = Column(Integer, default=0)

    # 시뮬레이션 연결
    simulation_id = Column(UUID(as_uuid=True), ForeignKey("simulations.id"), nullable=True)

    # 메타
    source = Column(String(50), default="BUGONGYON")  # 데이터 출처
    external_id = Column(String(100), nullable=True)  # 외부 시스템 ID
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)  # 매물 만료일

    def __repr__(self):
        return f"<RealEstateListing {self.title}>"
