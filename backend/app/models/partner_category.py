"""
파트너 카테고리 마스터 테이블
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, Numeric, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class PartnerCategoryModel(Base):
    """파트너 업체 카테고리 마스터"""
    __tablename__ = "partner_categories"

    id = Column(Integer, primary_key=True, index=True)

    # 카테고리 정보
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(50), nullable=True)

    # 정렬 및 표시
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    # 수수료 설정 (카테고리별 차등)
    default_commission_rate = Column(Numeric(5, 2), default=3.0)
    lead_fee = Column(Integer, default=50000)

    # 에스크로 적합성
    escrow_recommended = Column(Boolean, default=True)
    min_escrow_amount = Column(Integer, default=1000000)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    partners = relationship("Partner", back_populates="category_rel")


# 초기 데이터 시딩용
DEFAULT_CATEGORIES = [
    {
        "code": "interior",
        "name": "인테리어/시공",
        "description": "병원/약국 전문 인테리어 업체",
        "icon": "Paintbrush",
        "lead_fee": 100000,
        "display_order": 1,
        "escrow_recommended": True,
    },
    {
        "code": "equipment",
        "name": "의료기기",
        "description": "의료 기기 판매 및 렌탈",
        "icon": "Stethoscope",
        "lead_fee": 100000,
        "display_order": 2,
        "escrow_recommended": True,
    },
    {
        "code": "furniture",
        "name": "의료가구",
        "description": "병원/약국 전문 가구",
        "icon": "Armchair",
        "lead_fee": 50000,
        "display_order": 3,
        "escrow_recommended": True,
    },
    {
        "code": "signage",
        "name": "간판/사인물",
        "description": "외부 간판 및 내부 사인물",
        "icon": "PenTool",
        "lead_fee": 30000,
        "display_order": 4,
        "escrow_recommended": True,
    },
    {
        "code": "emr",
        "name": "EMR/의료IT",
        "description": "EMR, 예약 시스템, 홈페이지",
        "icon": "Monitor",
        "lead_fee": 50000,
        "display_order": 5,
        "escrow_recommended": True,
    },
    {
        "code": "consulting",
        "name": "개원컨설팅",
        "description": "개원 전문 컨설팅 서비스",
        "icon": "Briefcase",
        "lead_fee": 50000,
        "display_order": 6,
        "escrow_recommended": True,
    },
    {
        "code": "legal",
        "name": "법률/세무/노무",
        "description": "의료법 전문 변호사, 세무사, 노무사",
        "icon": "Scale",
        "lead_fee": 30000,
        "display_order": 7,
        "escrow_recommended": False,
    },
    {
        "code": "finance",
        "name": "금융(대출/리스)",
        "description": "개원 대출, 리스, 보험",
        "icon": "Landmark",
        "lead_fee": 100000,
        "display_order": 8,
        "escrow_recommended": False,
    },
    {
        "code": "marketing",
        "name": "마케팅/홍보",
        "description": "온라인 마케팅, 홍보 대행",
        "icon": "Megaphone",
        "lead_fee": 30000,
        "display_order": 9,
        "escrow_recommended": True,
    },
    {
        "code": "realestate",
        "name": "부동산",
        "description": "상가 전문 부동산 중개",
        "icon": "Building",
        "lead_fee": 100000,
        "display_order": 10,
        "escrow_recommended": True,
    },
    {
        "code": "supplies",
        "name": "소모품/유니폼",
        "description": "의료 소모품 및 유니폼",
        "icon": "Package",
        "lead_fee": 20000,
        "display_order": 11,
        "escrow_recommended": False,
    },
    {
        "code": "pharma",
        "name": "약품도매",
        "description": "약국용 약품 도매상",
        "icon": "Pill",
        "lead_fee": 50000,
        "display_order": 12,
        "escrow_recommended": False,
    },
]
