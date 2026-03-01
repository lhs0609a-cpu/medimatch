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


class TemplateApply(BaseModel):
    template_id: str
    specialty: Optional[str] = None
    budget_total: Optional[int] = None
    phase_deadlines: Optional[dict] = None
    region_code: Optional[str] = None


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
        "wizard_completed": project.wizard_completed or False,
        "template_applied": project.template_applied,
        "phase_deadlines": project.phase_deadlines,
        "region_code": project.region_code,
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


@router.get("/{project_id}/analytics")
async def get_analytics(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Phase별 완료율, 예산분석, 타임라인 예측, 주간 속도"""
    result = await db.execute(
        select(OpeningProject).where(
            and_(OpeningProject.id == project_id, OpeningProject.user_id == current_user.id)
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다")
    await db.refresh(project, ["tasks"])

    # Phase별 완료율
    phase_progress = {}
    phase_tasks_map = {i: [] for i in range(1, 9)}
    phase_totals = {1: 5, 2: 5, 3: 6, 4: 6, 5: 5, 6: 5, 7: 6, 8: 6}
    for t in project.tasks:
        if t.phase_id in phase_tasks_map:
            phase_tasks_map[t.phase_id].append(t)

    for pid in range(1, 9):
        completed = sum(1 for t in phase_tasks_map[pid] if t.is_completed)
        total = phase_totals[pid]
        phase_progress[pid] = {
            "completed": completed,
            "total": total,
            "percent": round(completed / total * 100, 1) if total else 0,
            "actual_cost": sum(t.actual_cost or 0 for t in phase_tasks_map[pid]),
        }

    # 전체 통계
    all_completed = [t for t in project.tasks if t.is_completed]
    total_tasks = 44

    # 주간 속도 계산 (최근 완료된 태스크 기반)
    completed_dates = sorted(
        [t.completed_at for t in all_completed if t.completed_at],
        reverse=True,
    )
    weekly_velocity = 0
    if len(completed_dates) >= 2:
        days_span = (completed_dates[0] - completed_dates[-1]).days or 1
        weekly_velocity = round(len(completed_dates) / days_span * 7, 1)

    # 예상 완료일
    remaining = total_tasks - len(all_completed)
    estimated_weeks_remaining = round(remaining / weekly_velocity, 1) if weekly_velocity > 0 else None

    return {
        "phase_progress": phase_progress,
        "total_completed": len(all_completed),
        "total_tasks": total_tasks,
        "total_progress": round(len(all_completed) / total_tasks * 100, 1),
        "budget_total": project.budget_total,
        "budget_spent": project.budget_spent or 0,
        "weekly_velocity": weekly_velocity,
        "remaining_tasks": remaining,
        "estimated_weeks_remaining": estimated_weeks_remaining,
        "target_date": project.target_date.isoformat() if project.target_date else None,
    }


@router.get("/{project_id}/weekly-tasks")
async def get_weekly_tasks(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """이번 주 추천 태스크 5개 (deadline 기반)"""
    result = await db.execute(
        select(OpeningProject).where(
            and_(OpeningProject.id == project_id, OpeningProject.user_id == current_user.id)
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다")
    await db.refresh(project, ["tasks"])

    completed_ids = {t.subtask_id for t in project.tasks if t.is_completed}

    # phases.ts 기반 전체 서브태스크 (하드코딩된 순서)
    all_subtasks = [
        ("1-1", 1, "개원 목표 및 비전 설정"),
        ("1-2", 1, "진료과 및 세부 전공 결정"),
        ("1-3", 1, "사업타당성 분석"),
        ("1-4", 1, "자금 계획 수립"),
        ("1-5", 1, "개원 컨설팅 상담"),
        ("2-1", 2, "상권 분석"),
        ("2-2", 2, "후보지 리스트업"),
        ("2-3", 2, "건물 실사"),
        ("2-4", 2, "임대차 계약"),
        ("2-5", 2, "법률 검토"),
        ("3-1", 3, "의료기관 개설 신고"),
        ("3-2", 3, "사업자등록"),
        ("3-3", 3, "요양기관 지정 신청"),
        ("3-4", 3, "의료폐기물 위탁 계약"),
        ("3-5", 3, "진단용 방사선 발생장치 신고"),
        ("3-6", 3, "세무사 / 노무사 계약"),
        ("4-1", 4, "인테리어 업체 선정"),
        ("4-2", 4, "설계 도면 확정"),
        ("4-3", 4, "인테리어 시공"),
        ("4-4", 4, "의료가스 공사"),
        ("4-5", 4, "전기/통신 공사"),
        ("4-6", 4, "간판 제작 / 설치"),
        ("5-1", 5, "필수 의료장비 구매"),
        ("5-2", 5, "진료 소모품 구매"),
        ("5-3", 5, "EMR 시스템 도입"),
        ("5-4", 5, "가구/집기 구매"),
        ("5-5", 5, "장비 설치 및 검수"),
        ("6-1", 6, "직원 채용 계획"),
        ("6-2", 6, "채용 공고 게시"),
        ("6-3", 6, "면접 및 최종 채용"),
        ("6-4", 6, "근로계약서 작성"),
        ("6-5", 6, "직원 교육"),
        ("7-1", 7, "CI/BI 디자인"),
        ("7-2", 7, "홈페이지 / 블로그 제작"),
        ("7-3", 7, "SNS 채널 개설"),
        ("7-4", 7, "지역 마케팅"),
        ("7-5", 7, "온라인 광고 셋업"),
        ("7-6", 7, "사전 예약 시스템 구축"),
        ("8-1", 8, "리허설 운영"),
        ("8-2", 8, "소방/안전 점검"),
        ("8-3", 8, "건강보험 청구 테스트"),
        ("8-4", 8, "오픈 이벤트 기획"),
        ("8-5", 8, "정식 개원"),
        ("8-6", 8, "개원 후 1개월 점검"),
    ]

    # 미완료 태스크를 순서대로 5개 추천
    recommended = []
    for subtask_id, phase_id, title in all_subtasks:
        if subtask_id not in completed_ids:
            recommended.append({
                "subtask_id": subtask_id,
                "phase_id": phase_id,
                "title": title,
            })
            if len(recommended) >= 5:
                break

    return {"tasks": recommended}


@router.put("/{project_id}/template")
async def apply_template(
    project_id: str,
    payload: TemplateApply,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """진료과 템플릿 적용"""
    result = await db.execute(
        select(OpeningProject).where(
            and_(OpeningProject.id == project_id, OpeningProject.user_id == current_user.id)
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다")

    project.template_applied = payload.template_id
    if payload.specialty:
        project.specialty = payload.specialty
    if payload.budget_total is not None:
        project.budget_total = payload.budget_total
    if payload.phase_deadlines is not None:
        project.phase_deadlines = payload.phase_deadlines
    if payload.region_code:
        project.region_code = payload.region_code
    project.wizard_completed = True
    project.updated_at = datetime.utcnow()

    await db.flush()
    await db.refresh(project, ["tasks"])
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
