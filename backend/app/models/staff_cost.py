"""
인건비 최적화 모델

- 직원별 월 급여/4대보험/복리후생/퇴직금 충당금
- employee_type: DOCTOR / NURSE / ADMIN / TECH
- employment_type: FULL_TIME / PART_TIME / CONTRACT
"""
from sqlalchemy import (
    Column, BigInteger, String, Boolean, DateTime,
    ForeignKey, Index, UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class StaffCost(Base):
    """직원별 월 인건비"""
    __tablename__ = "staff_costs"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default="gen_random_uuid()")
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    employee_name = Column(String(100), nullable=False)
    employee_type = Column(String(20), nullable=False, default="ADMIN")  # DOCTOR/NURSE/ADMIN/TECH
    employment_type = Column(String(20), nullable=False, default="FULL_TIME")  # FULL_TIME/PART_TIME/CONTRACT
    year_month = Column(String(7), nullable=False)  # "2025-02"

    base_salary = Column(BigInteger, default=0)
    overtime_pay = Column(BigInteger, default=0)
    bonus = Column(BigInteger, default=0)
    national_pension = Column(BigInteger, default=0)
    health_insurance = Column(BigInteger, default=0)
    employment_insurance = Column(BigInteger, default=0)
    accident_insurance = Column(BigInteger, default=0)
    welfare_cost = Column(BigInteger, default=0)
    severance_reserve = Column(BigInteger, default=0)

    is_demo = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", backref="staff_costs")

    __table_args__ = (
        UniqueConstraint("user_id", "employee_name", "year_month", name="uq_staff_cost_user_emp_month"),
        Index("ix_staff_cost_user_month", "user_id", "year_month"),
    )
