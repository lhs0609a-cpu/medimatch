"""
고정비 절감 분석 모델

- 항목별 고정비 (임대료/공과금/보험/리스/대출/유지보수/통신 등)
- 계약 만료일 추적
"""
from sqlalchemy import (
    Column, BigInteger, String, Boolean, DateTime, Date, Text,
    ForeignKey, Index,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class FixedCostEntry(Base):
    """항목별 고정비"""
    __tablename__ = "fixed_cost_entries"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default="gen_random_uuid()")
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    year_month = Column(String(7), nullable=False)
    cost_category = Column(String(30), nullable=False, default="OTHER")
    # RENT / UTILITIES / INSURANCE / EQUIPMENT_LEASE / LOAN_REPAYMENT / MAINTENANCE / COMMUNICATION / OTHER
    amount = Column(BigInteger, default=0)
    vendor_name = Column(String(200))
    contract_end_date = Column(Date)
    note = Column(Text)

    is_demo = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", backref="fixed_cost_entries")

    __table_args__ = (
        Index("ix_fixed_cost_user_month", "user_id", "year_month"),
        Index("ix_fixed_cost_category", "cost_category"),
    )
