"""
수수료 정산 모델

- TaxFeeSettlement: 수수료 정산 (progressive 구간별)
"""
import uuid
import enum
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, BigInteger, Float, Text, DateTime,
    ForeignKey, Boolean, Index
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.core.database import Base


# ===== Enums =====

class FeeSettlementStatus(str, enum.Enum):
    PENDING = "PENDING"         # 환급 대기 (환급 전)
    CALCULATED = "CALCULATED"   # 수수료 계산 완료
    INVOICED = "INVOICED"       # 청구서 발행
    PAID = "PAID"               # 결제 완료
    OVERDUE = "OVERDUE"         # 미납
    WAIVED = "WAIVED"           # 면제
    REFUNDED = "REFUNDED"       # 수수료 환불


class PaymentMethod(str, enum.Enum):
    BANK_TRANSFER = "BANK_TRANSFER"
    CREDIT_CARD = "CREDIT_CARD"
    AUTO_DEDUCT = "AUTO_DEDUCT"     # 환급금에서 자동 차감


# 수수료 구간 (Progressive)
FEE_TIERS = [
    {"min": 0, "max": 1_000_000, "rate": 0.15},          # ~100만원: 15%
    {"min": 1_000_000, "max": 5_000_000, "rate": 0.12},  # 100~500만원: 12%
    {"min": 5_000_000, "max": 10_000_000, "rate": 0.10}, # 500~1000만원: 10%
    {"min": 10_000_000, "max": None, "rate": 0.08},       # 1000만원~: 8%
]

VAT_RATE = 0.10  # 부가세 10%


def calculate_progressive_fee(refund_amount: int) -> dict:
    """구간별 수수료 계산"""
    total_fee = 0
    breakdown = []
    remaining = refund_amount

    for tier in FEE_TIERS:
        if remaining <= 0:
            break
        tier_max = tier["max"] if tier["max"] else float("inf")
        tier_min = tier["min"]
        taxable = min(remaining, tier_max - tier_min)
        fee = int(taxable * tier["rate"])
        total_fee += fee
        breakdown.append({
            "range_min": tier_min,
            "range_max": tier["max"],
            "rate": tier["rate"],
            "taxable_amount": taxable,
            "fee": fee,
        })
        remaining -= taxable

    vat = int(total_fee * VAT_RATE)
    return {
        "base_fee": total_fee,
        "vat": vat,
        "total_fee": total_fee + vat,
        "breakdown": breakdown,
    }


# ===== Models =====

class TaxFeeSettlement(Base):
    """수수료 정산"""
    __tablename__ = "tax_fee_settlements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    correction_id = Column(UUID(as_uuid=True), ForeignKey("tax_corrections.id", ondelete="CASCADE"), nullable=False)

    # 환급 정보
    refund_amount = Column(BigInteger, default=0, nullable=False)
    actual_refund_amount = Column(BigInteger, default=0, nullable=False)  # 실수령액

    # 수수료 계산
    base_fee = Column(BigInteger, default=0, nullable=False)
    vat = Column(BigInteger, default=0, nullable=False)
    total_fee = Column(BigInteger, default=0, nullable=False)
    fee_breakdown = Column(JSONB, default=[], nullable=False)
    """
    [
        {"range_min": 0, "range_max": 1000000, "rate": 0.15, "taxable_amount": 1000000, "fee": 150000},
        {"range_min": 1000000, "range_max": 5000000, "rate": 0.12, "taxable_amount": 2000000, "fee": 240000}
    ]
    """

    # 할인/조정
    discount_rate = Column(Float, default=0.0, nullable=False)
    discount_reason = Column(String(200), nullable=True)
    adjusted_fee = Column(BigInteger, nullable=True)

    # 결제
    status = Column(SQLEnum(FeeSettlementStatus), default=FeeSettlementStatus.PENDING, nullable=False)
    payment_method = Column(SQLEnum(PaymentMethod), nullable=True)
    payment_date = Column(DateTime, nullable=True)
    payment_reference = Column(String(100), nullable=True)

    # 청구서
    invoice_number = Column(String(30), unique=True, nullable=True)
    invoice_issued_at = Column(DateTime, nullable=True)
    invoice_due_date = Column(DateTime, nullable=True)

    # 영수증
    receipt_number = Column(String(30), nullable=True)
    receipt_issued_at = Column(DateTime, nullable=True)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_fee_user", "user_id"),
        Index("ix_fee_correction", "correction_id"),
        Index("ix_fee_status", "status"),
    )
