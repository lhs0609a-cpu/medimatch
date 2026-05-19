"""
환자 운영 태그 API.

- 의원별 태그 사전 (CRUD): /patient-tags
- 환자에 태그 할당/제거: /patients/{id}/tags
- 태그별 환자 카운트: /patient-tags/stats
"""
from typing import Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..deps import get_db, get_current_active_user
from .service_guards import require_active_service
from ...models.user import User
from ...models.service_subscription import ServiceSubscription, ServiceType
from ...models.patient import Patient
from ...models.patient_tag import PatientTag


router = APIRouter()


DEFAULT_TAGS = [
    {"name": "VIP", "color": "rose", "icon": "Crown", "description": "VIP 고객"},
    {"name": "연예인", "color": "purple", "icon": "Star", "description": "프라이버시 우선"},
    {"name": "재방문", "color": "blue", "icon": "Repeat", "description": "재방문 환자"},
    {"name": "주의", "color": "amber", "icon": "AlertTriangle", "description": "주의 환자"},
    {"name": "외국인", "color": "emerald", "icon": "Globe", "description": "외국인 환자"},
    {"name": "임신부", "color": "pink", "icon": "Baby", "description": "임신 중 — 약물 주의"},
    {"name": "알러지", "color": "red", "icon": "ShieldAlert", "description": "약물·재료 알러지"},
    {"name": "보호자필요", "color": "slate", "icon": "Users", "description": "동반자 동행 필요"},
]


class TagCreate(BaseModel):
    name: str
    color: str = "slate"
    icon: Optional[str] = None
    description: Optional[str] = None
    sort_order: int = 100


class TagUpdate(BaseModel):
    color: Optional[str] = None
    icon: Optional[str] = None
    description: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class TagAssign(BaseModel):
    tags: list[str]   # 태그 이름 리스트


def _tag_to_dict(t: PatientTag) -> dict:
    return {
        "id": t.id,
        "name": t.name,
        "color": t.color,
        "icon": t.icon,
        "description": t.description,
        "sort_order": t.sort_order,
        "is_system": t.is_system,
        "is_active": t.is_active,
    }


async def _ensure_default_tags(db: AsyncSession, user_id) -> None:
    """첫 호출 시 의원에게 기본 태그 8개 시드."""
    res = await db.execute(
        select(func.count(PatientTag.id)).where(PatientTag.user_id == user_id)
    )
    if (res.scalar() or 0) > 0:
        return
    for i, t in enumerate(DEFAULT_TAGS):
        db.add(PatientTag(
            user_id=user_id,
            name=t["name"], color=t["color"], icon=t["icon"],
            description=t["description"], sort_order=i * 10,
            is_system=True, is_active=True,
        ))
    await db.commit()


# ============================================================
# 태그 사전 CRUD
# ============================================================

@router.get("/patient-tags")
async def list_tags(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    await _ensure_default_tags(db, current_user.id)
    res = await db.execute(
        select(PatientTag).where(PatientTag.user_id == current_user.id)
        .order_by(PatientTag.sort_order, PatientTag.name)
    )
    return [_tag_to_dict(t) for t in res.scalars().all()]


@router.post("/patient-tags")
async def create_tag(
    body: TagCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    t = PatientTag(
        user_id=current_user.id,
        name=body.name.strip(),
        color=body.color,
        icon=body.icon,
        description=body.description,
        sort_order=body.sort_order,
    )
    db.add(t)
    try:
        await db.commit()
    except Exception:
        await db.rollback()
        raise HTTPException(400, "이미 같은 이름의 태그가 있습니다")
    await db.refresh(t)
    return _tag_to_dict(t)


@router.patch("/patient-tags/{tag_id}")
async def update_tag(
    tag_id: int,
    body: TagUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    res = await db.execute(select(PatientTag).where(and_(
        PatientTag.id == tag_id,
        PatientTag.user_id == current_user.id,
    )))
    t = res.scalar_one_or_none()
    if not t:
        raise HTTPException(404, "태그를 찾을 수 없습니다")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(t, k, v)
    await db.commit()
    await db.refresh(t)
    return _tag_to_dict(t)


@router.delete("/patient-tags/{tag_id}")
async def delete_tag(
    tag_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    res = await db.execute(select(PatientTag).where(and_(
        PatientTag.id == tag_id,
        PatientTag.user_id == current_user.id,
    )))
    t = res.scalar_one_or_none()
    if not t:
        raise HTTPException(404, "태그를 찾을 수 없습니다")
    if t.is_system:
        raise HTTPException(400, "시스템 태그는 비활성만 가능합니다")
    await db.delete(t)
    await db.commit()
    return {"deleted": True}


# ============================================================
# 환자에 태그 할당
# ============================================================

@router.put("/patients/{patient_id}/tags")
async def set_patient_tags(
    patient_id: str,
    body: TagAssign,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """환자의 태그 리스트를 통째로 교체. 사전에 없는 태그 이름이면 자동 생성."""
    try:
        pid = uuid.UUID(patient_id)
    except ValueError:
        raise HTTPException(400, "잘못된 id")

    res = await db.execute(select(Patient).where(and_(
        Patient.id == pid,
        Patient.user_id == current_user.id,
    )))
    p = res.scalar_one_or_none()
    if not p:
        raise HTTPException(404, "환자를 찾을 수 없습니다")

    clean_names = list(dict.fromkeys([n.strip() for n in (body.tags or []) if n.strip()]))[:20]

    # 사전에 없는 이름은 자동 생성
    if clean_names:
        tres = await db.execute(select(PatientTag.name).where(and_(
            PatientTag.user_id == current_user.id,
            PatientTag.name.in_(clean_names),
        )))
        existing = {row[0] for row in tres.all()}
        for n in clean_names:
            if n not in existing:
                db.add(PatientTag(user_id=current_user.id, name=n, color="slate"))

    p.tags = clean_names
    await db.commit()
    return {"patient_id": patient_id, "tags": clean_names}


@router.get("/patient-tags/stats")
async def tag_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """태그별 환자 수 (대시보드용)."""
    # jsonb_array_elements_text로 펼쳐서 카운트
    from sqlalchemy import text
    q = text(
        "SELECT tag_name, COUNT(*) AS n "
        "FROM patients p, jsonb_array_elements_text(p.tags) AS tag_name "
        "WHERE p.user_id = :uid AND p.deleted_at IS NULL "
        "GROUP BY tag_name "
        "ORDER BY n DESC"
    )
    res = await db.execute(q, {"uid": current_user.id})
    rows = res.all()
    return [{"name": r[0], "count": r[1]} for r in rows]
