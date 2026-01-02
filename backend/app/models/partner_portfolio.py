"""
파트너 포트폴리오 모델
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, Date, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class PartnerPortfolio(Base):
    """파트너 포트폴리오"""
    __tablename__ = "partner_portfolios"

    id = Column(Integer, primary_key=True, index=True)
    partner_id = Column(Integer, ForeignKey("partners.id"), nullable=False, index=True)

    # 프로젝트 정보
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)

    # 프로젝트 분류
    project_type = Column(String(50), nullable=True)  # 피부과, 성형외과, 치과 등
    project_subtype = Column(String(50), nullable=True)  # 신규개원, 리모델링, 확장

    # 규모/비용
    project_size = Column(Integer, nullable=True)  # 면적 (평)
    project_cost = Column(Integer, nullable=True)  # 금액 (원)
    project_duration = Column(Integer, nullable=True)  # 소요 기간 (일)

    # 위치
    location_sido = Column(String(20), nullable=True)
    location_sigungu = Column(String(30), nullable=True)

    # 이미지
    images = Column(JSONB, default=[])  # [{url, caption, is_cover}]
    cover_image_url = Column(String(500), nullable=True)

    # 날짜
    completion_date = Column(Date, nullable=True)

    # 고객 정보 (익명화)
    client_name = Column(String(50), nullable=True)  # "강남 OO의원"
    client_testimonial = Column(Text, nullable=True)  # 고객 후기

    # 표시
    display_order = Column(Integer, default=0)
    is_featured = Column(Boolean, default=False)  # 대표 포트폴리오
    is_visible = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    partner = relationship("Partner", back_populates="portfolios")

    __table_args__ = (
        Index('ix_partner_portfolios_partner_order', 'partner_id', 'display_order'),
    )


class PartnerServiceArea(Base):
    """파트너 서비스 가능 지역"""
    __tablename__ = "partner_service_areas"

    id = Column(Integer, primary_key=True, index=True)
    partner_id = Column(Integer, ForeignKey("partners.id"), nullable=False, index=True)

    sido = Column(String(20), nullable=False)  # 시도
    sigungu = Column(String(30), nullable=True)  # 시군구 (null이면 시도 전체)

    # 추가 비용
    extra_fee = Column(Integer, default=0)  # 추가 출장비 등
    extra_fee_description = Column(String(200), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    partner = relationship("Partner", back_populates="service_areas")

    __table_args__ = (
        Index('ix_partner_service_areas_location', 'sido', 'sigungu'),
        Index('uix_partner_service_area', 'partner_id', 'sido', 'sigungu', unique=True),
    )
