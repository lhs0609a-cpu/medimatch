"""
테넌트 스코프 로직 단위 테스트 — DB 불필요.

scope_filter / stamp / TenantContext 는 순수 함수라 SQL 문자열과 객체 상태만
확인하면 된다. 크로스 테넌트 격리의 실제 동작은 test_tenancy_db.py 에서
PostgreSQL 로 검증한다.

여기를 DB 없이 돌 수 있게 만든 이유: 현재 저장소는 19만 줄에 테스트가 7개뿐이고,
테넌시 전환은 EMR 전 테이블을 건드린다. 최소한 스코프 규칙만은 로컬에서
즉시 깨지는 걸 볼 수 있어야 한다.
"""
import uuid

import pytest

from app.api.tenancy import TenantContext, scope_filter, stamp
from app.models.clinic import ClinicRole
from app.models.patient import Patient
from app.models.visit import Visit
from app.models.insurance_claim import InsuranceClaim


def _ctx(role=ClinicRole.OWNER, clinic_id=None, owner_id=None, user_id=None):
    return TenantContext(
        clinic_id=clinic_id or uuid.uuid4(),
        owner_user_id=owner_id or uuid.uuid4(),
        role=role,
        user_id=user_id or uuid.uuid4(),
    )


def _sql(expr) -> str:
    return str(expr.compile(compile_kwargs={"literal_binds": True}))


# ---------------------------------------------------------------- 역할 권한

class TestRolePermissions:
    def test_owner_can_do_everything(self):
        ctx = _ctx(ClinicRole.OWNER)
        assert ctx.is_owner
        assert ctx.can_write_chart
        assert ctx.can_view_revenue

    def test_doctor_writes_chart_but_not_revenue(self):
        ctx = _ctx(ClinicRole.DOCTOR)
        assert not ctx.is_owner
        assert ctx.can_write_chart
        assert not ctx.can_view_revenue

    def test_nurse_writes_chart(self):
        ctx = _ctx(ClinicRole.NURSE)
        assert ctx.can_write_chart
        assert not ctx.can_view_revenue

    def test_desk_is_read_only_on_chart(self):
        """데스크는 접수·수납은 하지만 차트를 쓰지 않는다."""
        ctx = _ctx(ClinicRole.DESK)
        assert not ctx.can_write_chart
        assert not ctx.can_view_revenue

    def test_accountant_sees_revenue_only(self):
        """세무·회계는 경정청구를 위해 매출은 보되 차트는 못 쓴다."""
        ctx = _ctx(ClinicRole.ACCOUNTANT)
        assert not ctx.can_write_chart
        assert ctx.can_view_revenue

    def test_context_is_immutable(self):
        """요청 도중 테넌트가 바뀌면 격리가 깨진다."""
        ctx = _ctx()
        with pytest.raises(Exception):
            ctx.clinic_id = uuid.uuid4()


# ---------------------------------------------------------------- scope_filter

class TestScopeFilter:
    @pytest.mark.parametrize("model", [Patient, Visit, InsuranceClaim])
    def test_filter_mentions_both_paths_during_migration(self, model):
        """
        1단계에서는 clinic_id 와 owner user_id 두 경로를 모두 인정해야 한다.
        아직 backfill 되지 않은 행이 사라지면 안 되기 때문이다.
        """
        ctx = _ctx()
        sql = _sql(scope_filter(model, ctx))
        assert "clinic_id" in sql
        assert "user_id" in sql
        assert " OR " in sql

    def test_filter_binds_this_tenants_ids_only(self):
        # literal_binds 는 UUID 를 하이픈 없는 32자 hex 로 렌더링한다.
        ctx = _ctx()
        sql = _sql(scope_filter(Patient, ctx))
        assert ctx.clinic_id.hex in sql
        assert ctx.owner_user_id.hex in sql

    def test_filter_does_not_leak_requesting_user_id(self):
        """
        스코프 기준은 '요청자'가 아니라 '기관'이다.
        직원(user_id != owner)이 원장 데이터를 보려면 이 구분이 필수다.
        """
        ctx = _ctx(role=ClinicRole.NURSE)
        sql = _sql(scope_filter(Patient, ctx))
        assert ctx.user_id.hex not in sql

    def test_two_tenants_produce_different_filters(self):
        a, b = _ctx(), _ctx()
        assert _sql(scope_filter(Patient, a)) != _sql(scope_filter(Patient, b))

    def test_model_without_user_id_uses_clinic_only(self):
        """
        2단계에서 user_id 컬럼이 사라진 모델도 안전하게 처리되어야 한다.
        운영 모델을 건드리지 않으려고 임시 매핑 클래스를 쓴다.
        """
        from sqlalchemy import Column, MetaData
        from sqlalchemy.dialects.postgresql import UUID as PGUUID
        from sqlalchemy.orm import declarative_base

        TmpBase = declarative_base(metadata=MetaData())

        class Stage2Model(TmpBase):
            __tablename__ = "stage2_only"
            id = Column(PGUUID(as_uuid=True), primary_key=True)
            clinic_id = Column(PGUUID(as_uuid=True))

        ctx = _ctx()
        sql = _sql(scope_filter(Stage2Model, ctx))
        assert "clinic_id" in sql
        assert "user_id" not in sql
        assert " OR " not in sql


# ---------------------------------------------------------------- stamp

class TestStamp:
    def test_stamp_sets_clinic_id(self):
        ctx = _ctx()
        p = stamp(Patient(name="홍길동"), ctx)
        assert p.clinic_id == ctx.clinic_id

    def test_stamp_backfills_user_id_for_legacy_queries(self):
        """
        1단계에서는 user_id 도 채워야 기존 324곳의 쿼리가 계속 동작한다.
        owner 의 id 를 쓴다 — 직원이 만든 레코드도 기관 소유이기 때문이다.
        """
        ctx = _ctx(role=ClinicRole.DESK)
        p = stamp(Patient(name="홍길동"), ctx)
        assert p.user_id == ctx.owner_user_id
        assert p.user_id != ctx.user_id

    def test_stamp_preserves_explicit_user_id(self):
        explicit = uuid.uuid4()
        ctx = _ctx()
        p = stamp(Patient(name="홍길동", user_id=explicit), ctx)
        assert p.user_id == explicit
        assert p.clinic_id == ctx.clinic_id

    def test_stamp_returns_same_object(self):
        ctx = _ctx()
        p = Patient(name="홍길동")
        assert stamp(p, ctx) is p

    @pytest.mark.parametrize("model", [Patient, Visit, InsuranceClaim])
    def test_stamp_works_across_emr_models(self, model):
        ctx = _ctx()
        obj = stamp(model(), ctx)
        assert obj.clinic_id == ctx.clinic_id
        assert obj.user_id == ctx.owner_user_id


# ---------------------------------------------------------------- 스키마 계약

class TestSchemaContract:
    """clinic_id 가 실제로 붙었는지 — 마이그레이션과 모델의 어긋남을 잡는다."""

    SCOPED = [
        "patients", "visits", "bills", "prescriptions",
        "appointments", "insurance_claims", "claim_batches",
    ]

    def test_all_emr_tables_have_clinic_id(self):
        from app.core.database import Base
        import app.models  # noqa: F401  (모든 모델 등록)

        missing = [
            t for t in self.SCOPED
            if "clinic_id" not in Base.metadata.tables[t].c
        ]
        assert not missing, f"clinic_id 누락: {missing}"

    def test_clinic_id_is_nullable_during_stage_one(self):
        """
        1단계에서 NOT NULL 로 조이면 기존 코드가 즉시 깨진다.
        2단계 전환이 끝나면 이 테스트를 뒤집어야 한다.
        """
        from app.core.database import Base
        import app.models  # noqa: F401

        for t in self.SCOPED:
            assert Base.metadata.tables[t].c.clinic_id.nullable, t

    def test_clinic_tables_registered(self):
        from app.core.database import Base
        import app.models  # noqa: F401

        assert "clinics" in Base.metadata.tables
        assert "clinic_members" in Base.metadata.tables

    def test_member_uniqueness_constraint_exists(self):
        """같은 사람이 같은 기관에 두 번 소속되면 역할 판정이 비결정적이 된다."""
        from app.core.database import Base
        import app.models  # noqa: F401

        names = {c.name for c in Base.metadata.tables["clinic_members"].constraints}
        assert "ux_clinic_member" in names
