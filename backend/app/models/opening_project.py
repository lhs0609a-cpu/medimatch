"""
개원 프로젝트 관리 모델

- 개원 준비 체크리스트/진행 상황 추적
- Phase 1~8 기반 서브태스크 관리
- 예산 추적 (예상 vs 실제)
"""
import enum
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Text, Enum,
    ForeignKey, Index, BigInteger,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class ProjectStatus(str, enum.Enum):
    PLANNING = "PLANNING"
    LICENSING = "LICENSING"
    CONSTRUCTION = "CONSTRUCTION"
    EQUIPMENT = "EQUIPMENT"
    HIRING = "HIRING"
    MARKETING = "MARKETING"
    OPENING = "OPENING"
    COMPLETED = "COMPLETED"


class OpeningProject(Base):
    """개원 프로젝트 (사용자별 1개)"""
    __tablename__ = "opening_projects"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default="gen_random_uuid()")
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    title = Column(String(200))
    specialty = Column(String(100))
    target_date = Column(DateTime)
    status = Column(
        Enum(ProjectStatus, name="projectstatus", create_type=False),
        default=ProjectStatus.PLANNING,
    )
    budget_total = Column(BigInteger)
    budget_spent = Column(BigInteger, default=0)
    location_address = Column(String(500))
    notes = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tasks = relationship("OpeningProjectTask", back_populates="project", cascade="all, delete-orphan")
    user = relationship("User", backref="opening_projects")

    __table_args__ = (
        Index("ix_opening_project_user", "user_id"),
    )


class OpeningProjectTask(Base):
    """개원 프로젝트 서브태스크 (phase-subtask 매핑)"""
    __tablename__ = "opening_project_tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default="gen_random_uuid()")
    project_id = Column(UUID(as_uuid=True), ForeignKey("opening_projects.id", ondelete="CASCADE"), nullable=False)
    phase_id = Column(Integer, nullable=False)
    subtask_id = Column(String(10), nullable=False)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime)
    actual_cost = Column(BigInteger)
    memo = Column(Text)

    project = relationship("OpeningProject", back_populates="tasks")

    __table_args__ = (
        Index("ix_opening_task_project", "project_id"),
        Index("ix_opening_task_subtask", "project_id", "subtask_id", unique=True),
    )
