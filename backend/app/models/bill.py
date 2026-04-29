"""수납(bill) + 결제(payment) 모델"""
import enum
from sqlalchemy import (
    Column, Integer, BigInteger, String, Boolean, DateTime, Date, Text, Enum,
    ForeignKey, Float, text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class BillStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    ISSUED = "ISSUED"
    PARTIAL = "PARTIAL"
    PAID = "PAID"
    REFUNDED = "REFUNDED"
    CANCELLED = "CANCELLED"


class PaymentMethod(str, enum.Enum):
    CASH = "CASH"
    CARD = "CARD"
    MOBILE = "MOBILE"
    TRANSFER = "TRANSFER"
    INSURANCE = "INSURANCE"
    OTHER = "OTHER"


class Bill(Base):
    __tablename__ = "bills"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    visit_id = Column(UUID(as_uuid=True), ForeignKey("visits.id", ondelete="SET NULL"))
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="SET NULL"))

    bill_no = Column(String(40), unique=True, nullable=False)
    bill_date = Column(Date, nullable=False)

    subtotal = Column(BigInteger, default=0)
    insurance_amount = Column(BigInteger, default=0)
    patient_amount = Column(BigInteger, default=0)
    non_covered_amount = Column(BigInteger, default=0)
    discount_amount = Column(BigInteger, default=0)
    final_amount = Column(BigInteger, default=0)
    paid_amount = Column(BigInteger, default=0)
    balance = Column(BigInteger, default=0)

    status = Column(
        Enum(BillStatus, name="billstatus", create_type=False),
        default=BillStatus.DRAFT,
        nullable=False,
    )
    issued_at = Column(DateTime)
    completed_at = Column(DateTime)
    memo = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    items = relationship("BillItem", back_populates="bill", cascade="all, delete-orphan")
    payments = relationship("EmrPayment", back_populates="bill", cascade="all, delete-orphan")


class BillItem(Base):
    __tablename__ = "bill_items"
    id = Column(Integer, primary_key=True, autoincrement=True)
    bill_id = Column(UUID(as_uuid=True), ForeignKey("bills.id", ondelete="CASCADE"), nullable=False)
    item_type = Column(String(30), nullable=False)
    code = Column(String(30))
    name = Column(String(300), nullable=False)
    quantity = Column(Integer, default=1)
    unit_price = Column(BigInteger, default=0)
    total_price = Column(BigInteger, default=0)
    insurance_covered = Column(Boolean, default=True)
    copay_rate = Column(Float, default=0.30)

    bill = relationship("Bill", back_populates="items")


class EmrPayment(Base):
    __tablename__ = "payments_emr"
    id = Column(Integer, primary_key=True, autoincrement=True)
    bill_id = Column(UUID(as_uuid=True), ForeignKey("bills.id", ondelete="CASCADE"), nullable=False)
    amount = Column(BigInteger, nullable=False)
    method = Column(
        Enum(PaymentMethod, name="paymentmethod", create_type=False),
        default=PaymentMethod.CARD,
        nullable=False,
    )
    transaction_id = Column(String(100))
    card_last4 = Column(String(4))
    card_company = Column(String(50))
    received_at = Column(DateTime, default=datetime.utcnow)
    received_by = Column(String(100))
    is_refund = Column(Boolean, default=False)
    refund_reason = Column(Text)
    note = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    bill = relationship("Bill", back_populates="payments")
