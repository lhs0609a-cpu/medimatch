"""의원 셋업 (온보딩) API.

GET    /clinic-setup                  — 현재 셋업 상태 (없으면 빈 객체)
PUT    /clinic-setup                  — 부분 업데이트 (단계별 저장)
POST   /clinic-setup/complete         — 셋업 완료 마킹
POST   /clinic-setup/skip             — 셋업 건너뛰기
GET    /clinic-setup/templates        — 진료과 리스트
GET    /clinic-setup/templates/{code} — 특정 진료과 프리셋
POST   /clinic-setup/apply-template   — 진료과 선택 + 적용 마킹
"""
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..deps import get_db, get_current_active_user
from ...models.user import User
from ...models.clinic_setup import ClinicSetup
from ...services.specialty_templates import (
    SPECIALTIES_LIST, SPECIALTY_TEMPLATES, get_template,
)


router = APIRouter()


class ClinicSetupOut(BaseModel):
    clinic_name: Optional[str] = None
    primary_specialty: Optional[str] = None
    secondary_specialties: List[str] = Field(default_factory=list)
    doctor_names: List[str] = Field(default_factory=list)
    hours_open: Optional[str] = None
    hours_close: Optional[str] = None
    lunch_open: Optional[str] = None
    lunch_close: Optional[str] = None
    weekday_pattern: Optional[str] = None
    applied_template: Optional[str] = None
    applied_template_at: Optional[datetime] = None
    completed_steps: List[str] = Field(default_factory=list)
    completed_at: Optional[datetime] = None
    skipped_at: Optional[datetime] = None


class ClinicSetupUpdate(BaseModel):
    clinic_name: Optional[str] = None
    primary_specialty: Optional[str] = None
    secondary_specialties: Optional[List[str]] = None
    doctor_names: Optional[List[str]] = None
    hours_open: Optional[str] = None
    hours_close: Optional[str] = None
    lunch_open: Optional[str] = None
    lunch_close: Optional[str] = None
    weekday_pattern: Optional[str] = None
    add_completed_step: Optional[str] = None


async def _get_or_create(db: AsyncSession, user_id) -> ClinicSetup:
    q = select(ClinicSetup).where(ClinicSetup.user_id == user_id)
    rec = (await db.execute(q)).scalar_one_or_none()
    if rec:
        return rec
    rec = ClinicSetup(user_id=user_id)
    db.add(rec)
    await db.commit()
    await db.refresh(rec)
    return rec


@router.get("", response_model=ClinicSetupOut)
async def get_setup(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    rec = await _get_or_create(db, current_user.id)
    return ClinicSetupOut(
        clinic_name=rec.clinic_name,
        primary_specialty=rec.primary_specialty,
        secondary_specialties=rec.secondary_specialties or [],
        doctor_names=rec.doctor_names or [],
        hours_open=rec.hours_open,
        hours_close=rec.hours_close,
        lunch_open=rec.lunch_open,
        lunch_close=rec.lunch_close,
        weekday_pattern=rec.weekday_pattern,
        applied_template=rec.applied_template,
        applied_template_at=rec.applied_template_at,
        completed_steps=rec.completed_steps or [],
        completed_at=rec.completed_at,
        skipped_at=rec.skipped_at,
    )


@router.put("", response_model=ClinicSetupOut)
async def update_setup(
    payload: ClinicSetupUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    rec = await _get_or_create(db, current_user.id)
    data = payload.model_dump(exclude_unset=True)

    add_step = data.pop("add_completed_step", None)
    for k, v in data.items():
        setattr(rec, k, v)
    if add_step:
        steps = list(rec.completed_steps or [])
        if add_step not in steps:
            steps.append(add_step)
        rec.completed_steps = steps
    await db.commit()
    await db.refresh(rec)
    return await get_setup(db, current_user)


class CompleteResponse(BaseModel):
    completed_at: datetime


@router.post("/complete", response_model=CompleteResponse)
async def complete_setup(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    rec = await _get_or_create(db, current_user.id)
    rec.completed_at = datetime.utcnow()
    await db.commit()
    return CompleteResponse(completed_at=rec.completed_at)


@router.post("/skip", response_model=CompleteResponse)
async def skip_setup(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    rec = await _get_or_create(db, current_user.id)
    rec.skipped_at = datetime.utcnow()
    await db.commit()
    return CompleteResponse(completed_at=rec.skipped_at)


@router.get("/templates")
async def list_templates():
    return {"specialties": SPECIALTIES_LIST}


@router.get("/templates/{specialty}")
async def get_template_detail(specialty: str):
    tpl = get_template(specialty)
    return tpl


class ApplyTemplateRequest(BaseModel):
    specialty: str


@router.post("/apply-template", response_model=ClinicSetupOut)
async def apply_template(
    payload: ApplyTemplateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if payload.specialty.upper() not in SPECIALTY_TEMPLATES:
        raise HTTPException(status_code=400, detail="알 수 없는 진료과입니다.")
    rec = await _get_or_create(db, current_user.id)
    rec.primary_specialty = payload.specialty.upper()
    rec.applied_template = payload.specialty.upper()
    rec.applied_template_at = datetime.utcnow()
    steps = list(rec.completed_steps or [])
    if "specialty" not in steps:
        steps.append("specialty")
    rec.completed_steps = steps
    await db.commit()
    await db.refresh(rec)
    return await get_setup(db, current_user)
