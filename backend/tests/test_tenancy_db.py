"""
테넌트 격리 통합 테스트 — PostgreSQL 필요.

로컬에서 DATABASE_URL 없이 돌리면 자동 skip 된다. CI(ci.yml)는 postgres:15
서비스를 띄우므로 거기서 실제로 실행된다.

여기서 증명하려는 것은 하나다: **A 병원의 데이터가 B 병원에 절대 보이지 않는다.**
현재 코드가 user_id 로 스코프하는 324곳을 clinic_id 로 옮기는 작업의 안전망이다.
"""
import os
import uuid

import pytest
from sqlalchemy import select

from app.api.tenancy import (
    TenantContext, resolve_tenant, scope_filter, stamp, ensure_personal_clinic,
)
from app.models.clinic import Clinic, ClinicMember, ClinicRole, ClinicStatus
from app.models.patient import Patient
from app.models.user import User, UserRole
from app.core.security import get_password_hash


pytestmark = pytest.mark.skipif(
    not os.getenv("DATABASE_URL", "").startswith("postgresql"),
    reason="PostgreSQL 필요 (UUID/JSONB/ARRAY 컬럼). CI에서 실행됨.",
)


async def _mk_user(db, email: str) -> User:
    u = User(
        id=uuid.uuid4(),
        email=email,
        hashed_password=get_password_hash("pw12345678"),
        full_name=email.split("@")[0],
        role=UserRole.DOCTOR,
        is_active=True,
        is_verified=True,
    )
    db.add(u)
    await db.flush()
    return u


async def _mk_clinic(db, owner: User, name: str) -> Clinic:
    c = await ensure_personal_clinic(db, owner)
    c.name = name
    await db.flush()
    return c


# ------------------------------------------------------------ 기관 생성

class TestEnsurePersonalClinic:
    async def test_creates_clinic_and_owner_membership(self, db_session):
        u = await _mk_user(db_session, "owner@a.com")
        c = await ensure_personal_clinic(db_session, u)

        assert c.owner_user_id == u.id
        assert c.status == ClinicStatus.ACTIVE

        m = (
            await db_session.execute(
                select(ClinicMember).where(ClinicMember.clinic_id == c.id)
            )
        ).scalar_one()
        assert m.user_id == u.id
        assert m.role == ClinicRole.OWNER
        assert m.revoked_at is None

    async def test_is_idempotent(self, db_session):
        """backfill 과 신규 가입 양쪽에서 불리므로 두 번 불려도 안전해야 한다."""
        u = await _mk_user(db_session, "owner@b.com")
        c1 = await ensure_personal_clinic(db_session, u)
        c2 = await ensure_personal_clinic(db_session, u)
        assert c1.id == c2.id

        n = len(
            (
                await db_session.execute(
                    select(Clinic).where(Clinic.owner_user_id == u.id)
                )
            ).scalars().all()
        )
        assert n == 1


# ------------------------------------------------------------ 해석

class TestResolveTenant:
    async def test_returns_none_without_membership(self, db_session):
        u = await _mk_user(db_session, "nobody@x.com")
        assert await resolve_tenant(db_session, u) is None

    async def test_resolves_own_clinic(self, db_session):
        u = await _mk_user(db_session, "own@x.com")
        c = await ensure_personal_clinic(db_session, u)
        await db_session.flush()

        ctx = await resolve_tenant(db_session, u)
        assert ctx is not None
        assert ctx.clinic_id == c.id
        assert ctx.role == ClinicRole.OWNER
        assert ctx.owner_user_id == u.id

    async def test_staff_resolves_to_employers_clinic(self, db_session):
        """
        간호사가 원장의 기관을 해석해야 한다. 이게 안 되면 직원은
        환자를 못 본다 — 현재 user_id 스코프의 핵심 결함.
        """
        owner = await _mk_user(db_session, "doc@c.com")
        nurse = await _mk_user(db_session, "nurse@c.com")
        c = await ensure_personal_clinic(db_session, owner)
        db_session.add(
            ClinicMember(clinic_id=c.id, user_id=nurse.id, role=ClinicRole.NURSE)
        )
        await db_session.flush()

        ctx = await resolve_tenant(db_session, nurse)
        assert ctx is not None
        assert ctx.clinic_id == c.id
        assert ctx.owner_user_id == owner.id   # 스코프는 원장 기준
        assert ctx.user_id == nurse.id         # 행위자는 간호사
        assert ctx.role == ClinicRole.NURSE

    async def test_revoked_member_loses_access(self, db_session):
        """퇴사자는 즉시 접근을 잃되, 이력 때문에 행은 남는다."""
        from datetime import datetime

        owner = await _mk_user(db_session, "doc@d.com")
        ex = await _mk_user(db_session, "ex@d.com")
        c = await ensure_personal_clinic(db_session, owner)
        m = ClinicMember(
            clinic_id=c.id, user_id=ex.id, role=ClinicRole.DESK,
            revoked_at=datetime.utcnow(),
        )
        db_session.add(m)
        await db_session.flush()

        assert await resolve_tenant(db_session, ex) is None
        # 행은 남아 있어야 한다 (의료법 제23조 제4항 이력 보관)
        still = (
            await db_session.execute(
                select(ClinicMember).where(ClinicMember.user_id == ex.id)
            )
        ).scalar_one()
        assert still.revoked_at is not None

    async def test_closed_clinic_is_not_resolvable(self, db_session):
        owner = await _mk_user(db_session, "doc@e.com")
        c = await ensure_personal_clinic(db_session, owner)
        c.status = ClinicStatus.CLOSED
        await db_session.flush()

        assert await resolve_tenant(db_session, owner) is None

    async def test_owner_role_wins_when_multiple(self, db_session):
        """여러 기관에 소속돼도 자기 병원이 기본값이어야 한다."""
        owner = await _mk_user(db_session, "multi@f.com")
        other_owner = await _mk_user(db_session, "other@f.com")
        mine = await ensure_personal_clinic(db_session, owner)
        theirs = await ensure_personal_clinic(db_session, other_owner)
        db_session.add(
            ClinicMember(clinic_id=theirs.id, user_id=owner.id, role=ClinicRole.DOCTOR)
        )
        await db_session.flush()

        ctx = await resolve_tenant(db_session, owner)
        assert ctx.clinic_id == mine.id
        assert ctx.role == ClinicRole.OWNER

    async def test_explicit_clinic_id_requires_membership(self, db_session):
        owner = await _mk_user(db_session, "doc@g.com")
        stranger = await _mk_user(db_session, "stranger@g.com")
        c = await ensure_personal_clinic(db_session, owner)
        await ensure_personal_clinic(db_session, stranger)
        await db_session.flush()

        # 남의 기관 id 를 넣어도 멤버십이 없으면 None
        assert await resolve_tenant(db_session, stranger, clinic_id=c.id) is None


# ------------------------------------------------------------ 격리 (핵심)

class TestCrossTenantIsolation:
    async def test_patients_do_not_leak_between_clinics(self, db_session):
        a_owner = await _mk_user(db_session, "a@iso.com")
        b_owner = await _mk_user(db_session, "b@iso.com")
        a = await _mk_clinic(db_session, a_owner, "A의원")
        b = await _mk_clinic(db_session, b_owner, "B의원")
        await db_session.flush()

        ctx_a = await resolve_tenant(db_session, a_owner)
        ctx_b = await resolve_tenant(db_session, b_owner)

        db_session.add(stamp(Patient(name="A환자"), ctx_a))
        db_session.add(stamp(Patient(name="B환자"), ctx_b))
        await db_session.flush()

        seen_a = (
            await db_session.execute(
                select(Patient).where(scope_filter(Patient, ctx_a))
            )
        ).scalars().all()
        seen_b = (
            await db_session.execute(
                select(Patient).where(scope_filter(Patient, ctx_b))
            )
        ).scalars().all()

        assert [p.name for p in seen_a] == ["A환자"]
        assert [p.name for p in seen_b] == ["B환자"]

    async def test_staff_sees_clinic_data_not_own_empty_set(self, db_session):
        """
        간호사가 만든 환자도, 원장이 만든 환자도 둘 다 같은 기관에서 보여야 한다.
        user_id 스코프로는 불가능했던 동작.
        """
        owner = await _mk_user(db_session, "doc@st.com")
        nurse = await _mk_user(db_session, "nurse@st.com")
        c = await ensure_personal_clinic(db_session, owner)
        db_session.add(
            ClinicMember(clinic_id=c.id, user_id=nurse.id, role=ClinicRole.NURSE)
        )
        await db_session.flush()

        ctx_owner = await resolve_tenant(db_session, owner)
        ctx_nurse = await resolve_tenant(db_session, nurse)

        db_session.add(stamp(Patient(name="원장환자"), ctx_owner))
        db_session.add(stamp(Patient(name="간호사환자"), ctx_nurse))
        await db_session.flush()

        seen = (
            await db_session.execute(
                select(Patient).where(scope_filter(Patient, ctx_nurse))
            )
        ).scalars().all()
        assert {p.name for p in seen} == {"원장환자", "간호사환자"}

    async def test_legacy_rows_without_clinic_id_still_visible_to_owner(self, db_session):
        """
        1단계 호환성: backfill 전 행(clinic_id NULL)이 사라지면 안 된다.
        2단계로 넘어가면 이 테스트를 제거해야 한다.
        """
        owner = await _mk_user(db_session, "legacy@x.com")
        c = await ensure_personal_clinic(db_session, owner)
        await db_session.flush()

        legacy = Patient(name="구환자", user_id=owner.id)  # clinic_id 없음
        db_session.add(legacy)
        await db_session.flush()

        ctx = await resolve_tenant(db_session, owner)
        seen = (
            await db_session.execute(
                select(Patient).where(scope_filter(Patient, ctx))
            )
        ).scalars().all()
        assert "구환자" in {p.name for p in seen}

    async def test_member_uniqueness_is_enforced_by_db(self, db_session):
        """
        같은 사람이 같은 기관에 두 번 소속되면 역할 판정이 비결정적이 된다.
        애플리케이션이 아니라 DB가 막아야 한다.
        """
        from sqlalchemy.exc import IntegrityError

        owner = await _mk_user(db_session, "dup@x.com")
        c = await ensure_personal_clinic(db_session, owner)
        await db_session.flush()

        db_session.add(
            ClinicMember(clinic_id=c.id, user_id=owner.id, role=ClinicRole.DOCTOR)
        )
        with pytest.raises(IntegrityError):
            await db_session.flush()
