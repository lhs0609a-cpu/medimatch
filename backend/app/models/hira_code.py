"""
HIRA 코드 레지스트리 모델

- HIRAFeeCode: 수가코드 (~10만건)
- HIRADiseaseCode: 상병코드 KCD-7
- HIRADrugCode: 약품코드
- HIRACodeChangeLog: 코드 변경 이력
"""
import enum
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, BigInteger, Text, DateTime, Date,
    Boolean, Index, Float
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import JSONB, ARRAY

from app.core.database import Base


# ===== Enums =====

class CodeChangeType(str, enum.Enum):
    ADDED = "ADDED"
    MODIFIED = "MODIFIED"
    DEPRECATED = "DEPRECATED"
    DELETED = "DELETED"


class HIRACodeType(str, enum.Enum):
    FEE = "FEE"
    DISEASE = "DISEASE"
    DRUG = "DRUG"


# ===== Models =====

class HIRAFeeCode(Base):
    """심평원 수가코드 레지스트리"""
    __tablename__ = "hira_fee_codes"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # 코드 정보
    code = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(500), nullable=False)
    name_en = Column(String(500), nullable=True)
    category = Column(String(100), nullable=True)
    subcategory = Column(String(100), nullable=True)

    # 수가 정보
    unit_price = Column(BigInteger, default=0, nullable=False)
    relative_value = Column(Float, nullable=True)

    # 적용 범위
    specialty_codes = Column(ARRAY(String), default=[], nullable=False)
    insurance_type = Column(String(20), default="COVERED", nullable=False)  # COVERED/NON_COVERED/SELECTIVE

    # 빈도/수량 제한
    max_frequency = Column(Integer, nullable=True)
    frequency_period_days = Column(Integer, nullable=True)
    max_quantity = Column(Integer, nullable=True)

    # 유효기간
    effective_from = Column(Date, nullable=True)
    effective_to = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # 메타
    notes = Column(Text, nullable=True)
    related_codes = Column(ARRAY(String), default=[], nullable=False)
    last_synced_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_hira_fee_name_trgm", "name", postgresql_using="gin",
              postgresql_ops={"name": "gin_trgm_ops"}),
        Index("ix_hira_fee_category", "category"),
        Index("ix_hira_fee_active", "is_active"),
    )


class HIRADiseaseCode(Base):
    """상병코드 (KCD-7)"""
    __tablename__ = "hira_disease_codes"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # 코드 정보
    code = Column(String(20), unique=True, nullable=False, index=True)
    name_kr = Column(String(500), nullable=False)
    name_en = Column(String(500), nullable=True)

    # 분류
    chapter = Column(String(10), nullable=True)
    block = Column(String(20), nullable=True)
    category_code = Column(String(10), nullable=True)

    # 특성
    is_chronic = Column(Boolean, default=False, nullable=False)
    is_rare = Column(Boolean, default=False, nullable=False)
    severity_level = Column(Integer, nullable=True)  # 1-5

    # 연관 처치
    common_procedures = Column(ARRAY(String), default=[], nullable=False)
    common_medications = Column(ARRAY(String), default=[], nullable=False)

    # 유효기간
    effective_from = Column(Date, nullable=True)
    effective_to = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # 메타
    last_synced_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_hira_disease_name_trgm", "name_kr", postgresql_using="gin",
              postgresql_ops={"name_kr": "gin_trgm_ops"}),
        Index("ix_hira_disease_chapter", "chapter"),
        Index("ix_hira_disease_chronic", "is_chronic"),
    )


class HIRADrugCode(Base):
    """약품코드 레지스트리"""
    __tablename__ = "hira_drug_codes"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # 코드 정보
    code = Column(String(30), unique=True, nullable=False, index=True)
    product_name = Column(String(500), nullable=False)
    ingredient_name = Column(String(500), nullable=True)
    manufacturer = Column(String(200), nullable=True)

    # 보험 정보
    insurance_price = Column(BigInteger, default=0, nullable=False)
    insurance_type = Column(String(20), default="COVERED", nullable=False)

    # DUR 정보
    dur_ingredients = Column(ARRAY(String), default=[], nullable=False)
    atc_code = Column(String(20), nullable=True)

    # 용법/용량
    dosage_form = Column(String(100), nullable=True)
    max_daily_dose = Column(Float, nullable=True)
    max_single_dose = Column(Float, nullable=True)
    dose_unit = Column(String(20), nullable=True)

    # 특수 약물 분류
    is_narcotic = Column(Boolean, default=False, nullable=False)
    is_antibiotic = Column(Boolean, default=False, nullable=False)
    requires_monitoring = Column(Boolean, default=False, nullable=False)

    # 유효기간
    effective_from = Column(Date, nullable=True)
    effective_to = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # 메타
    last_synced_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_hira_drug_product_trgm", "product_name", postgresql_using="gin",
              postgresql_ops={"product_name": "gin_trgm_ops"}),
        Index("ix_hira_drug_ingredient_trgm", "ingredient_name", postgresql_using="gin",
              postgresql_ops={"ingredient_name": "gin_trgm_ops"}),
        Index("ix_hira_drug_atc", "atc_code"),
    )


class HIRACodeChangeLog(Base):
    """HIRA 코드 변경 이력"""
    __tablename__ = "hira_code_change_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)

    code_type = Column(SQLEnum(HIRACodeType), nullable=False)
    code = Column(String(30), nullable=False)
    change_type = Column(SQLEnum(CodeChangeType), nullable=False)

    old_value = Column(JSONB, nullable=True)
    new_value = Column(JSONB, nullable=True)

    effective_date = Column(Date, nullable=False)
    description = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_code_change_code_type", "code_type"),
        Index("ix_code_change_code", "code"),
        Index("ix_code_change_date", "effective_date"),
    )
