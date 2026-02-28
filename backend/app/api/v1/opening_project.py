"""
개원 프로젝트 API

- 프로젝트 CRUD + 태스크 토글 + localStorage 동기화
- 로그인 사용자 전용 (EMR 서비스 구독 불필요)
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import logging

from ..deps import get_db, get_current_active_user
from ...models.user import User
from ...models.opening_project import OpeningProject, OpeningProjectTask, ProjectStatus

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================================
# Pydantic schemas
# ============================================================

class ProjectCreate(BaseModel):
    title: Optional[str] = None
    specialty: Optional[str] = None
    target_date: Optional[datetime] = None
    budget_total: Optional[int] = None
    location_address: Optional[str] = None
    notes: Optional[str] = None


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    specialty: Optional[str] = None
    target_date: Optional[datetime] = None
    status: Optional[str] = None
    budget_total: Optional[int] = None
    budget_spent: Optional[int] = None
    location_address: Optional[str] = None
    notes: Optional[str] = None


class TaskToggle(BaseModel):
    is_completed: bool
    actual_cost: Optional[int] = None
    memo: Optional[str] = None


class SyncTask(BaseModel):
    subtask_id: str
    is_completed: bool
    actual_cost: Optional[int] = None
    memo: Optional[str] = None


class SyncPayload(BaseModel):
    title: Optional[str] = None
    specialty: Optional[str] = None
    target_date: Optional[datetime] = None
    budget_total: Optional[int] = None
    location_address: Optional[str] = None
    notes: Optional[str] = None
    tasks: list[SyncTask] = []


# ============================================================
# Helpers
# ============================================================

def _serialize_project(project: OpeningProject) -> dict:
    completed = [t for t in project.tasks if t.is_completed]
    total_tasks = 48  # phases.ts 총 태스크 수
    return {
        "id": str(project.id),
        "title": project.title,
        "specialty": project.specialty,
        "target_date": project.target_date.isoformat() if project.target_date else None,
        "status": project.status.value if project.status else "PLANNING",
        "budget_total": project.budget_total,
        "budget_spent": project.budget_spent or 0,
        "location_address": project.location_address,
        "notes": project.notes,
        "progress": round(len(completed) / total_tasks * 100, 1) if total_tasks else 0,
        "completed_count": len(completed),
        "total_tasks": total_tasks,
        "created_at": project.created_at.isoformat() if project.created_at else None,
        "updated_at": project.updated_at.isoformat() if project.updated_at else None,
        "tasks": [
            {
                "id": str(t.id),
                "phase_id": t.phase_id,
                "subtask_id": t.subtask_id,
                "is_completed": t.is_completed,
                "completed_at": t.completed_at.isoformat() if t.completed_at else None,
                "actual_cost": t.actual_cost,
                "memo": t.memo,
            }
            for t in project.tasks
        ],
    }


# ============================================================
# Endpoints
# ============================================================

@router.post("/")
async def create_project(
    payload: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """프로젝트 생성 (사용자당 최대 1개)"""
    existing = await db.execute(
        select(OpeningProject).where(OpeningProject.user_id == current_user.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="이미 프로젝트가 존재합니다")

    project = OpeningProject(
        user_id=current_user.id,
        **payload.model_dump(exclude_unset=True),
    )
    db.add(project)
    await db.flush()
    await db.refresh(project, ["tasks"])
    return _serialize_project(project)


@router.get("/")
async def list_projects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """내 프로젝트 목록"""
    result = await db.execute(
        select(OpeningProject).where(OpeningProject.user_id == current_user.id)
    )
    projects = result.scalars().all()
    for p in projects:
        await db.refresh(p, ["tasks"])
    return {"items": [_serialize_project(p) for p in projects]}


@router.get("/{project_id}")
async def get_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """프로젝트 상세"""
    result = await db.execute(
        select(OpeningProject).where(
            and_(OpeningProject.id == project_id, OpeningProject.user_id == current_user.id)
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다")
    await db.refresh(project, ["tasks"])
    return _serialize_project(project)


@router.put("/{project_id}")
async def update_project(
    project_id: str,
    payload: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """프로젝트 수정"""
    result = await db.execute(
        select(OpeningProject).where(
            and_(OpeningProject.id == project_id, OpeningProject.user_id == current_user.id)
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다")

    for key, val in payload.model_dump(exclude_unset=True).items():
        if key == "status" and val:
            setattr(project, key, ProjectStatus(val))
        else:
            setattr(project, key, val)
    project.updated_at = datetime.utcnow()
    await db.flush()
    await db.refresh(project, ["tasks"])
    return _serialize_project(project)


@router.patch("/{project_id}/tasks/{subtask_id}")
async def toggle_task(
    project_id: str,
    subtask_id: str,
    payload: TaskToggle,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """태스크 완료/미완료 토글"""
    # 프로젝트 소유 확인
    proj_result = await db.execute(
        select(OpeningProject).where(
            and_(OpeningProject.id == project_id, OpeningProject.user_id == current_user.id)
        )
    )
    project = proj_result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다")

    # 태스크 찾기 또는 생성
    task_result = await db.execute(
        select(OpeningProjectTask).where(
            and_(
                OpeningProjectTask.project_id == project_id,
                OpeningProjectTask.subtask_id == subtask_id,
            )
        )
    )
    task = task_result.scalar_one_or_none()

    if not task:
        phase_id = int(subtask_id.split("-")[0])
        task = OpeningProjectTask(
            project_id=project_id,
            phase_id=phase_id,
            subtask_id=subtask_id,
            is_completed=payload.is_completed,
            completed_at=datetime.utcnow() if payload.is_completed else None,
            actual_cost=payload.actual_cost,
            memo=payload.memo,
        )
        db.add(task)
    else:
        task.is_completed = payload.is_completed
        task.completed_at = datetime.utcnow() if payload.is_completed else None
        if payload.actual_cost is not None:
            task.actual_cost = payload.actual_cost
        if payload.memo is not None:
            task.memo = payload.memo

    # budget_spent 재계산
    await db.flush()
    await db.refresh(project, ["tasks"])
    total_spent = sum(t.actual_cost or 0 for t in project.tasks)
    project.budget_spent = total_spent
    project.updated_at = datetime.utcnow()

    return {
        "subtask_id": subtask_id,
        "is_completed": task.is_completed,
        "actual_cost": task.actual_cost,
        "memo": task.memo,
        "budget_spent": total_spent,
    }


@router.patch("/{project_id}/sync")
async def sync_from_local(
    project_id: str,
    payload: SyncPayload,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """localStorage → 서버 일괄 동기화"""
    result = await db.execute(
        select(OpeningProject).where(
            and_(OpeningProject.id == project_id, OpeningProject.user_id == current_user.id)
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다")

    # 프로젝트 메타 업데이트
    for field in ["title", "specialty", "target_date", "budget_total", "location_address", "notes"]:
        val = getattr(payload, field, None)
        if val is not None:
            setattr(project, field, val)

    # 태스크 일괄 동기화
    for sync_task in payload.tasks:
        task_result = await db.execute(
            select(OpeningProjectTask).where(
                and_(
                    OpeningProjectTask.project_id == project_id,
                    OpeningProjectTask.subtask_id == sync_task.subtask_id,
                )
            )
        )
        task = task_result.scalar_one_or_none()
        if task:
            task.is_completed = sync_task.is_completed
            task.completed_at = datetime.utcnow() if sync_task.is_completed else None
            if sync_task.actual_cost is not None:
                task.actual_cost = sync_task.actual_cost
            if sync_task.memo is not None:
                task.memo = sync_task.memo
        else:
            phase_id = int(sync_task.subtask_id.split("-")[0])
            task = OpeningProjectTask(
                project_id=project_id,
                phase_id=phase_id,
                subtask_id=sync_task.subtask_id,
                is_completed=sync_task.is_completed,
                completed_at=datetime.utcnow() if sync_task.is_completed else None,
                actual_cost=sync_task.actual_cost,
                memo=sync_task.memo,
            )
            db.add(task)

    project.updated_at = datetime.utcnow()
    await db.flush()
    await db.refresh(project, ["tasks"])

    total_spent = sum(t.actual_cost or 0 for t in project.tasks)
    project.budget_spent = total_spent

    return _serialize_project(project)


@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """프로젝트 삭제"""
    result = await db.execute(
        select(OpeningProject).where(
            and_(OpeningProject.id == project_id, OpeningProject.user_id == current_user.id)
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다")
    await db.delete(project)
    return {"message": "프로젝트가 삭제되었습니다"}
