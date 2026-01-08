"""User 개원 준비 필드 및 매물 정보 접근 레벨 테이블

Revision ID: 004_user_listing_access
Revises: 003_partner_system
Create Date: 2025-01-08

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '004_user_listing_access'
down_revision: Union[str, None] = '003_partner_system'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ============================================================
    # users 테이블 - 개원 준비 관련 필드 추가
    # ============================================================
    op.add_column('users', sa.Column('is_opening_preparation', sa.Boolean, default=False))
    op.add_column('users', sa.Column('opening_region', sa.String(100), nullable=True))
    op.add_column('users', sa.Column('opening_region_detail', sa.String(200), nullable=True))
    op.add_column('users', sa.Column('specialty', sa.String(50), nullable=True))
    op.add_column('users', sa.Column('opening_status', sa.String(50), nullable=True))
    op.add_column('users', sa.Column('expected_opening_date', sa.String(20), nullable=True))
    op.add_column('users', sa.Column('planned_clinic_name', sa.String(200), nullable=True))

    # 인덱스
    op.create_index('ix_users_is_opening_preparation', 'users', ['is_opening_preparation'])
    op.create_index('ix_users_opening_region', 'users', ['opening_region'])
    op.create_index('ix_users_specialty', 'users', ['specialty'])

    # ============================================================
    # 매물 정보 접근 레벨 테이블
    # ============================================================
    op.create_table(
        'listing_access_levels',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('listing_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('anonymous_listings.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),

        # 접근 레벨: MINIMAL, PARTIAL, FULL
        sa.Column('access_level', sa.String(20), default='MINIMAL', nullable=False),

        # 결제 정보
        sa.Column('payment_id', sa.Integer, sa.ForeignKey('payments.id'), nullable=True),
        sa.Column('upgrade_amount', sa.Integer, default=0),

        # 기록
        sa.Column('granted_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    op.create_index('ix_listing_access_levels_listing_user', 'listing_access_levels', ['listing_id', 'user_id'], unique=True)
    op.create_index('ix_listing_access_levels_user', 'listing_access_levels', ['user_id'])

    # ============================================================
    # 접근 레벨 가격 테이블
    # ============================================================
    op.create_table(
        'access_pricing',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('from_level', sa.String(20), nullable=False),
        sa.Column('to_level', sa.String(20), nullable=False),
        sa.Column('price', sa.Integer, nullable=False),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    op.create_index('ix_access_pricing_levels', 'access_pricing', ['from_level', 'to_level'], unique=True)

    # 기본 가격 데이터 삽입
    op.execute("""
        INSERT INTO access_pricing (from_level, to_level, price) VALUES
        ('MINIMAL', 'PARTIAL', 50000),
        ('PARTIAL', 'FULL', 100000),
        ('MINIMAL', 'FULL', 130000)
    """)


def downgrade() -> None:
    # 접근 레벨 가격 테이블
    op.drop_index('ix_access_pricing_levels', table_name='access_pricing')
    op.drop_table('access_pricing')

    # 매물 정보 접근 레벨 테이블
    op.drop_index('ix_listing_access_levels_user', table_name='listing_access_levels')
    op.drop_index('ix_listing_access_levels_listing_user', table_name='listing_access_levels')
    op.drop_table('listing_access_levels')

    # users 테이블 컬럼 제거
    op.drop_index('ix_users_specialty', table_name='users')
    op.drop_index('ix_users_opening_region', table_name='users')
    op.drop_index('ix_users_is_opening_preparation', table_name='users')

    op.drop_column('users', 'planned_clinic_name')
    op.drop_column('users', 'expected_opening_date')
    op.drop_column('users', 'opening_status')
    op.drop_column('users', 'specialty')
    op.drop_column('users', 'opening_region_detail')
    op.drop_column('users', 'opening_region')
    op.drop_column('users', 'is_opening_preparation')
