import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, Boolean
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, ARRAY
import enum
from ..core.database import Base


class HospitalStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    CLOSED = "CLOSED"
    RELOCATED = "RELOCATED"


class Hospital(Base):
    """병원 정보 테이블"""
    __tablename__ = "hospitals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ykiho = Column(String(50), unique=True, nullable=True)  # 심평원 요양기관 기호
    name = Column(String(200), nullable=False)
    address = Column(String(500), nullable=False)
    latitude = Column(Float, nullable=False, default=0)
    longitude = Column(Float, nullable=False, default=0)
    phone = Column(String(50), nullable=True)
    clinic_type = Column(String(100), nullable=True)  # 진료과목
    clinic_types = Column(ARRAY(String), nullable=True)  # 복수 진료과목
    doctor_count = Column(Integer, default=1)
    established = Column(String(20), nullable=True)  # 개업일 (YYYYMMDD)

    # 추가 정보
    floor_info = Column(String(50), nullable=True)
    area_pyeong = Column(Float, nullable=True)
    parking_available = Column(Boolean, default=False)

    # 상태 정보
    status = Column(SQLEnum(HospitalStatus), default=HospitalStatus.ACTIVE)
    closed_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)

    # 메타 정보
    last_verified_at = Column(DateTime, nullable=True)  # 마지막 확인 일시
    data_source = Column(String(50), default="HIRA")  # 데이터 출처

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Hospital {self.name}>"


class CommercialData(Base):
    """상권 데이터 테이블"""
    __tablename__ = "commercial_data"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    region_code = Column(String(20), nullable=False)  # 행정동 코드
    region_name = Column(String(100), nullable=False)  # 행정동명

    # 인구 데이터
    population_total = Column(Integer, nullable=True)
    population_male = Column(Integer, nullable=True)
    population_female = Column(Integer, nullable=True)
    population_20s = Column(Integer, nullable=True)
    population_30s = Column(Integer, nullable=True)
    population_40s = Column(Integer, nullable=True)
    population_50s = Column(Integer, nullable=True)
    population_60_plus = Column(Integer, nullable=True)

    # 유동인구 데이터
    floating_population_daily = Column(Integer, nullable=True)
    floating_population_weekday = Column(Integer, nullable=True)
    floating_population_weekend = Column(Integer, nullable=True)

    # 세대/가구 데이터
    household_count = Column(Integer, nullable=True)
    avg_household_income = Column(Integer, nullable=True)  # 만원 단위

    # 상권 지표
    commercial_change_rate = Column(Float, nullable=True)  # 상권 변화율
    store_count = Column(Integer, nullable=True)  # 점포 수
    medical_store_count = Column(Integer, nullable=True)  # 의료업종 점포 수

    # 좌표 (중심점)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # 메타
    data_period = Column(String(10), nullable=True)  # 데이터 기준 기간 (YYYY-QQ)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<CommercialData {self.region_name}>"
