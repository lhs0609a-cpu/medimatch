"""
EMR 비즈니스 분석 일별 메트릭 모델

- 매출 (전체/급여/비급여), 환자 수 (전체/신규/재진)
- 지역 평균 매출, 지역 내 백분위
- 데모 데이터 플래그 (is_demo)
"""
from sqlalchemy import (
    Column, Integer, BigInteger, String, Date, Boolean, DateTime,
    ForeignKey, Index, UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class EMRDailyMetrics(Base):
    """EMR 일별 메트릭 (매출/환자/벤치마크)"""
    __tablename__ = "emr_daily_metrics"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default="gen_random_uuid()")
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    metric_date = Column(Date, nullable=False)

    # 매출
    revenue_total = Column(BigInteger, default=0, nullable=False)
    revenue_insurance = Column(BigInteger, default=0, nullable=False)
    revenue_non_insurance = Column(BigInteger, default=0, nullable=False)

    # 환자 수
    patient_count_total = Column(Integer, default=0, nullable=False)
    patient_count_new = Column(Integer, default=0, nullable=False)
    patient_count_returning = Column(Integer, default=0, nullable=False)

    # 지역 벤치마크
    regional_avg_revenue = Column(BigInteger, default=0, nullable=False)
    regional_percentile = Column(Integer, default=50, nullable=False)  # 상위 N%

    # 분류
    specialty = Column(String(50), nullable=True)   # 진료과 (피부과, 내과 등)
    region = Column(String(100), nullable=True)      # 지역 (강남구, 서초구 등)

    # 데모 데이터 여부
    is_demo = Column(Boolean, default=False, nullable=False)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계
    user = relationship("User", backref="emr_daily_metrics")

    __table_args__ = (
        UniqueConstraint("user_id", "metric_date", name="uq_emr_user_date"),
        Index("ix_emr_metrics_user_date", "user_id", "metric_date"),
        Index("ix_emr_metrics_specialty_region", "specialty", "region"),
    )
