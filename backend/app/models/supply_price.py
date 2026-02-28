"""
의료 소모품/약가 비교 모델

- medical_supply_items: 소모품/약품 품목
- VendorPriceQuote: 공급업체 견적
"""
from sqlalchemy import (
    Column, Integer, BigInteger, String, Boolean, DateTime, Date,
    ForeignKey, Index,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class MedicalSupplyItem(Base):
    """소모품/약품 품목"""
    __tablename__ = "medical_supply_items"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default="gen_random_uuid()")
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    item_type = Column(String(20), nullable=False, default="SUPPLY")  # SUPPLY / DRUG
    item_name = Column(String(200), nullable=False)
    item_code = Column(String(50))
    unit = Column(String(20))  # 박스/개/vial/mg
    monthly_usage = Column(Integer, default=0)
    current_vendor = Column(String(100))
    current_unit_price = Column(BigInteger, default=0)
    stock_count = Column(Integer, default=0)
    expiry_date = Column(Date)
    reorder_threshold = Column(Integer, default=0)
    has_generic = Column(Boolean, default=False)
    generic_price = Column(BigInteger, default=0)
    generic_vendor = Column(String(100))

    is_demo = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", backref="medical_supply_items")
    quotes = relationship("VendorPriceQuote", back_populates="supply_item", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_supply_item_user", "user_id"),
        Index("ix_supply_item_type", "item_type"),
    )


class VendorPriceQuote(Base):
    """공급업체 견적"""
    __tablename__ = "vendor_price_quotes"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default="gen_random_uuid()")
    supply_item_id = Column(UUID(as_uuid=True), ForeignKey("medical_supply_items.id", ondelete="CASCADE"), nullable=False)

    vendor_name = Column(String(100), nullable=False)
    unit_price = Column(BigInteger, default=0)
    minimum_order_qty = Column(Integer, default=0)
    bulk_discount_threshold = Column(Integer)
    bulk_unit_price = Column(BigInteger)
    quoted_at = Column(Date)
    valid_until = Column(Date)

    created_at = Column(DateTime, default=datetime.utcnow)

    supply_item = relationship("MedicalSupplyItem", back_populates="quotes")

    __table_args__ = (
        Index("ix_vendor_quote_item", "supply_item_id"),
    )
