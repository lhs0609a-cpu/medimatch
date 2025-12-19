import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, BigInteger, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy import Enum as SQLEnum, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from ..core.database import Base


class RecommendationType(str, enum.Enum):
    VERY_POSITIVE = "VERY_POSITIVE"
    POSITIVE = "POSITIVE"
    NEUTRAL = "NEUTRAL"
    NEGATIVE = "NEGATIVE"
    VERY_NEGATIVE = "VERY_NEGATIVE"


class Simulation(Base):
    """시뮬레이션 테이블 (OpenSim)"""
    __tablename__ = "simulations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Input
    address = Column(String(500), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    clinic_type = Column(String(50), nullable=False)  # 진료과목
    size_pyeong = Column(Float, nullable=True)  # 면적(평)
    budget_million = Column(Integer, nullable=True)  # 예산(백만원)

    # Estimated Revenue
    est_revenue_min = Column(BigInteger, nullable=True)
    est_revenue_avg = Column(BigInteger, nullable=True)
    est_revenue_max = Column(BigInteger, nullable=True)

    # Estimated Cost
    est_cost_rent = Column(BigInteger, nullable=True)
    est_cost_labor = Column(BigInteger, nullable=True)
    est_cost_utilities = Column(BigInteger, nullable=True)
    est_cost_supplies = Column(BigInteger, nullable=True)
    est_cost_other = Column(BigInteger, nullable=True)
    est_cost_total = Column(BigInteger, nullable=True)

    # Profitability
    monthly_profit_avg = Column(BigInteger, nullable=True)
    breakeven_months = Column(Integer, nullable=True)
    annual_roi_percent = Column(Float, nullable=True)

    # Competition
    competition_radius_m = Column(Integer, default=1000)
    same_dept_count = Column(Integer, nullable=True)
    total_clinic_count = Column(Integer, nullable=True)
    competitors_data = Column(JSON, nullable=True)  # Array of competitor info

    # Demographics
    population_1km = Column(Integer, nullable=True)
    age_40_plus_ratio = Column(Float, nullable=True)
    floating_population_daily = Column(Integer, nullable=True)
    demographics_data = Column(JSON, nullable=True)

    # Analysis Result
    confidence_score = Column(Integer, nullable=True)  # 0-100
    recommendation = Column(SQLEnum(RecommendationType), nullable=True)
    recommendation_reason = Column(Text, nullable=True)
    ai_analysis = Column(Text, nullable=True)  # AI가 생성한 상세 분석

    # Status
    is_complete = Column(Boolean, default=False)
    is_paid = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="simulations")
    report = relationship("SimulationReport", back_populates="simulation", uselist=False)

    def __repr__(self):
        return f"<Simulation {self.address} - {self.clinic_type}>"


class SimulationReport(Base):
    """유료 리포트 테이블 (OpenSim)"""
    __tablename__ = "simulation_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    simulation_id = Column(UUID(as_uuid=True), ForeignKey("simulations.id"), nullable=False)

    # Payment Info
    payment_amount = Column(Integer, nullable=False)  # 결제 금액
    payment_id = Column(String(100), nullable=True)  # 토스페이먼츠 결제 ID
    payment_status = Column(String(50), default="pending")
    paid_at = Column(DateTime, nullable=True)

    # Report
    report_content = Column(JSON, nullable=True)  # Full report data
    pdf_url = Column(String(500), nullable=True)  # S3 PDF URL

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    simulation = relationship("Simulation", back_populates="report")

    def __repr__(self):
        return f"<SimulationReport {self.simulation_id}>"
