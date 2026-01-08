"""건물주 셀프 등록 테이블

Revision ID: 005_landlord_tables
Revises: 004_user_listing_access
Create Date: 2025-01-08

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '005_landlord_tables'
down_revision: Union[str, None] = '004_user_listing_access'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ============================================================
    # 건물주 매물 등록 테이블
    # ============================================================
    op.create_table(
        'landlord_listings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),

        # === 건물 기본 정보 ===
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('building_name', sa.String(200), nullable=True),
        sa.Column('address', sa.String(500), nullable=False),

        # 위치
        sa.Column('latitude', sa.Float, nullable=True),
        sa.Column('longitude', sa.Float, nullable=True),
        sa.Column('region_code', sa.String(10), nullable=True),
        sa.Column('region_name', sa.String(100), nullable=True),

        # 층/면적
        sa.Column('floor', sa.String(50), nullable=True),
        sa.Column('area_pyeong', sa.Float, nullable=True),
        sa.Column('area_m2', sa.Float, nullable=True),

        # === 비용 정보 ===
        sa.Column('rent_deposit', sa.BigInteger, nullable=True),
        sa.Column('rent_monthly', sa.BigInteger, nullable=True),
        sa.Column('maintenance_fee', sa.Integer, nullable=True),
        sa.Column('premium', sa.BigInteger, nullable=True),

        # === 희망 입점 업종 ===
        sa.Column('preferred_tenants', postgresql.ARRAY(sa.String), server_default='{}'),

        # 인근 시설 정보
        sa.Column('nearby_hospital_types', postgresql.ARRAY(sa.String), server_default='{}'),
        sa.Column('nearby_facilities', postgresql.JSONB, server_default='{}'),

        # === 건물 특성 ===
        sa.Column('has_parking', sa.Boolean, default=False),
        sa.Column('parking_count', sa.Integer, default=0),
        sa.Column('has_elevator', sa.Boolean, default=False),
        sa.Column('building_age', sa.Integer, nullable=True),
        sa.Column('previous_use', sa.String(100), nullable=True),

        # === 상세 설명 ===
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('features', postgresql.ARRAY(sa.String), server_default='{}'),
        sa.Column('images', postgresql.ARRAY(sa.String), server_default='{}'),

        # === 증빙 및 검증 ===
        sa.Column('verification_status', sa.String(20), default='PENDING'),  # PENDING, UNDER_REVIEW, VERIFIED, REJECTED
        sa.Column('verification_docs', postgresql.JSONB, server_default='[]'),
        sa.Column('verified_at', sa.DateTime, nullable=True),
        sa.Column('verified_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('rejection_reason', sa.Text, nullable=True),

        # === 공개 설정 ===
        sa.Column('is_public', sa.Boolean, default=False),
        sa.Column('show_exact_address', sa.Boolean, default=False),
        sa.Column('show_contact', sa.Boolean, default=False),

        # === 연락처 (비공개) ===
        sa.Column('contact_name', sa.String(100), nullable=True),
        sa.Column('contact_phone', sa.String(20), nullable=True),
        sa.Column('contact_email', sa.String(255), nullable=True),

        # === 상태 및 통계 ===
        sa.Column('status', sa.String(20), default='DRAFT'),  # DRAFT, PENDING_REVIEW, ACTIVE, RESERVED, CONTRACTED, CLOSED, REJECTED
        sa.Column('view_count', sa.Integer, default=0),
        sa.Column('inquiry_count', sa.Integer, default=0),

        # === 메타데이터 ===
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column('expires_at', sa.DateTime, nullable=True),
    )

    # 인덱스
    op.create_index('ix_landlord_listings_owner', 'landlord_listings', ['owner_id'])
    op.create_index('ix_landlord_listings_status', 'landlord_listings', ['status'])
    op.create_index('ix_landlord_listings_region', 'landlord_listings', ['region_code'])
    op.create_index('ix_landlord_listings_verification', 'landlord_listings', ['verification_status'])
    op.create_index('ix_landlord_listings_public', 'landlord_listings', ['is_public', 'status'])

    # ============================================================
    # 건물주 매물 문의 테이블
    # ============================================================
    op.create_table(
        'landlord_inquiries',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('listing_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('landlord_listings.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),

        # 문의 내용
        sa.Column('message', sa.Text, nullable=False),
        sa.Column('inquiry_type', sa.String(50), default='general'),  # general, visit, negotiation

        # 문의자 정보 (문의 시점에 저장)
        sa.Column('inquirer_name', sa.String(100), nullable=True),
        sa.Column('inquirer_phone', sa.String(20), nullable=True),
        sa.Column('inquirer_email', sa.String(255), nullable=True),
        sa.Column('inquirer_clinic_type', sa.String(50), nullable=True),

        # 상태
        sa.Column('status', sa.String(20), default='PENDING'),  # PENDING, RESPONDED, CLOSED
        sa.Column('response', sa.Text, nullable=True),
        sa.Column('responded_at', sa.DateTime, nullable=True),

        # 메타
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # 인덱스
    op.create_index('ix_landlord_inquiries_listing', 'landlord_inquiries', ['listing_id'])
    op.create_index('ix_landlord_inquiries_user', 'landlord_inquiries', ['user_id'])
    op.create_index('ix_landlord_inquiries_status', 'landlord_inquiries', ['status'])


def downgrade() -> None:
    # 건물주 매물 문의 테이블
    op.drop_index('ix_landlord_inquiries_status', table_name='landlord_inquiries')
    op.drop_index('ix_landlord_inquiries_user', table_name='landlord_inquiries')
    op.drop_index('ix_landlord_inquiries_listing', table_name='landlord_inquiries')
    op.drop_table('landlord_inquiries')

    # 건물주 매물 등록 테이블
    op.drop_index('ix_landlord_listings_public', table_name='landlord_listings')
    op.drop_index('ix_landlord_listings_verification', table_name='landlord_listings')
    op.drop_index('ix_landlord_listings_region', table_name='landlord_listings')
    op.drop_index('ix_landlord_listings_status', table_name='landlord_listings')
    op.drop_index('ix_landlord_listings_owner', table_name='landlord_listings')
    op.drop_table('landlord_listings')
