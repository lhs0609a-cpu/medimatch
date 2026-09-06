"""
테넌트 해석 — 042

EMR 데이터 접근의 유일한 경로. 라우터는 current_user.id 로 직접 필터하지 말고
여기서 받은 clinic_id 로 필터해야 한다.

왜 필요한가:
  기존 코드는 patients.user_id == current_user.id 로 스코프한다(324곳).
  그러면 간호사·데스크 직원이 원장의 환자를 볼 수 없고, 다지점도 불가능하다.
  ClinicMember 를 거치면 "이 사람이 이 기관의 활성 구성원인가"가 판정 기준이 된다.

이행 중 규칙:
  1단계에서는 clinic_id 가 nullable 이므로, 조회 필터는
  `or_(T.clinic_id == cid, T.user_id == owner_id)` 형태로 두 경로를 모두 인정한다.
  scope_filter() 가 그 표현식을 만들어준다. 2단계에서 이 함수만 고치면 된다.
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Optional

from fastapi import Depends, HTTPException, status
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from .deps import get_db, get_current_active_user
from ..models.user import User
from ..models.clinic import Clinic, ClinicMember, ClinicRole, ClinicStatus


@dataclass(frozen=True)
class TenantContext:
    """요청 하나가 어느 기관에서, 무슨 역할로 일어나는가."""
    clinic_id: uuid.UUID
    owner_user_id: uuid.UUID
    role: ClinicRole
    user_id: uuid.UUID

    @property
    def is_owner(self) -> bool:
        return self.role == ClinicRole.OWNER

    @property
    def can_write_chart(self) -> bool:
        """차트 작성 권한. 데스크·회계는 읽기만."""
        return self.role in (ClinicRole.OWNER, ClinicRole.DOCTOR, ClinicRole.NURSE)

    @property
    def can_view_revenue(self) -> bool:
        """매출·경영 지표. 원장과 회계만."""
        return self.role in (ClinicRole.OWNER, ClinicRole.ACCOUNTANT)


async def resolve_tenant(
    db: AsyncSession,
    user: User,
    clinic_id: Optional[uuid.UUID] = None,
) -> Optional[TenantContext]:
    """
    사용자의 활성 기관을 찾는다.

    clinic_id 가 주어지면 그 기관의 멤버십을 확인하고, 없으면
    소속된 활성 기관 중 하나를 고른다(OWNER 우선).
    멤버십이 없으면 None — 호출자가 404/403 을 결정한다.
    """
    stmt = (
        select(ClinicMember, Clinic)
        .join(Clinic, Clinic.id == ClinicMember.clinic_id)
        .where(
            ClinicMember.user_id == user.id,
            ClinicMember.revoked_at.is_(None),
            Clinic.status != ClinicStatus.CLOSED,
        )
    )
    if clinic_id is not None:
        stmt = stmt.where(ClinicMember.clinic_id == clinic_id)

    rows = (await db.execute(stmt)).all()
    if not rows:
        return None

    # OWNER 우선 — 원장이 여러 기관에 소속된 경우 자기 병원이 기본값이 되도록.
    rows.sort(key=lambda r: 0 if r[0].role == ClinicRole.OWNER else 1)
    member, clinic = rows[0]

    return TenantContext(
        clinic_id=clinic.id,
        owner_user_id=clinic.owner_user_id,
        role=member.role,
        user_id=user.id,
    )


async def get_tenant(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
) -> TenantContext:
    """
    FastAPI 의존성. 기관 소속이 없으면 403.

    개원 준비 단계 사용자(EMR 미사용)는 여기 걸리지 않도록,
    EMR 라우터에서만 쓴다.
    """
    ctx = await resolve_tenant(db, user)
    if ctx is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="소속된 의료기관이 없습니다. 기관을 먼저 등록해 주세요.",
        )
    return ctx


def scope_filter(model, ctx: TenantContext):
    """
    테넌트 스코프 필터 표현식.

    1단계에서는 clinic_id 가 아직 backfill 안 된 행이 있을 수 있으므로
    owner 의 user_id 경로도 함께 인정한다.
    2단계(전 행 backfill + NOT NULL)에서는 앞 조건만 남기면 된다.

        stmt = select(Patient).where(scope_filter(Patient, ctx))
    """
    conds = [model.clinic_id == ctx.clinic_id]
    if hasattr(model, "user_id"):
        conds.append(model.user_id == ctx.owner_user_id)
    return or_(*conds)


def stamp(obj, ctx: TenantContext):
    """
    새 레코드에 테넌트를 찍는다.

    1단계에서는 user_id 도 함께 채워 기존 쿼리가 계속 동작하게 한다.
    stamp(Patient(...), ctx) 형태로 쓰고, 반환값을 session.add() 한다.
    """
    obj.clinic_id = ctx.clinic_id
    if hasattr(obj, "user_id") and getattr(obj, "user_id", None) is None:
        obj.user_id = ctx.owner_user_id
    return obj


async def ensure_personal_clinic(db: AsyncSession, user: User) -> Clinic:
    """
    사용자에게 기관이 없으면 개인 기관 하나를 만들어 준다.

    backfill 과 신규 가입 양쪽에서 쓰인다. owner_user_id 가 unique 이므로
    같은 사용자로 두 번 불려도 기존 기관을 돌려준다.
    """
    existing = (
        await db.execute(select(Clinic).where(Clinic.owner_user_id == user.id))
    ).scalar_one_or_none()
    if existing is not None:
        return existing

    clinic = Clinic(
        owner_user_id=user.id,
        name=(user.full_name or "내 의료기관"),
        primary_specialty=getattr(user, "specialty", None),
        phone=getattr(user, "phone", None),
    )
    db.add(clinic)
    await db.flush()

    db.add(
        ClinicMember(
            clinic_id=clinic.id,
            user_id=user.id,
            role=ClinicRole.OWNER,
        )
    )
    await db.flush()
    return clinic
