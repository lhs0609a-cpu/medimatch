"""파트너 배너 광고 테이블 (CPM 방식)

Revision ID: 006_banner_tables
Revises: 005_landlord_tables
Create Date: 2025-01-08

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '006_banner_tables'
down_revision: Union[str, None] = '005_landlord_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ============================================================
    # 배너 위치 ENUM
    # ============================================================
    banner_position = postgresql.ENUM(
        'HOME_TOP', 'SIDEBAR', 'SEARCH_RESULT', 'PARTNERS_LIST', 'CATEGORY_HEADER',
        name='bannerposition'
    )
    banner_position.create(op.get_bind(), checkfirst=True)

    # ============================================================
    # 배너 상태 ENUM
    # ============================================================
    banner_status = postgresql.ENUM(
        'DRAFT', 'PENDING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'REJECTED',
        name='bannerstatus'
    )
    banner_status.create(op.get_bind(), checkfirst=True)

    # ============================================================
    # 배너 광고 테이블
    # ============================================================
    op.create_table(
        'banner_ads',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('partner_id', sa.Integer, sa.ForeignKey('partners.id'), nullable=True),

        # === 배너 콘텐츠 ===
        sa.Column('title', sa.String(100), nullable=False),
        sa.Column('subtitle', sa.String(200), nullable=True),
        sa.Column('image_url', sa.String(500), nullable=False),
        sa.Column('link_url', sa.String(500), nullable=True),
        sa.Column('position', postgresql.ENUM(
            'HOME_TOP', 'SIDEBAR', 'SEARCH_RESULT', 'PARTNERS_LIST', 'CATEGORY_HEADER',
            name='bannerposition', create_type=False
        ), nullable=False),

        # === 예산 및 과금 ===
        sa.Column('cpm_rate', sa.Integer, default=5000),
        sa.Column('daily_budget', sa.Integer, nullable=True),
        sa.Column('total_budget', sa.Integer, nullable=False),

        # === 통계 ===
        sa.Column('impressions', sa.Integer, default=0),
        sa.Column('clicks', sa.Integer, default=0),
        sa.Column('spent', sa.Integer, default=0),
        sa.Column('today_impressions', sa.Integer, default=0),
        sa.Column('today_spent', sa.Integer, default=0),

        # === 타겟팅 ===
        sa.Column('target_regions', postgresql.ARRAY(sa.String), server_default='{}'),
        sa.Column('target_user_roles', postgresql.ARRAY(sa.String), server_default='{}'),
        sa.Column('target_clinic_types', postgresql.ARRAY(sa.String), server_default='{}'),

        # === 기간 ===
        sa.Column('start_date', sa.Date, nullable=False),
        sa.Column('end_date', sa.Date, nullable=False),

        # === 상태 ===
        sa.Column('status', postgresql.ENUM(
            'DRAFT', 'PENDING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'REJECTED',
            name='bannerstatus', create_type=False
        ), server_default='DRAFT'),
        sa.Column('rejection_reason', sa.Text, nullable=True),

        # === 메타데이터 ===
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column('last_impression_at', sa.DateTime, nullable=True),
    )

    # 인덱스
    op.create_index('ix_banner_ads_status', 'banner_ads', ['status'])
    op.create_index('ix_banner_ads_position', 'banner_ads', ['position'])
    op.create_index('ix_banner_ads_partner', 'banner_ads', ['partner_id'])
    op.create_index('ix_banner_ads_dates', 'banner_ads', ['start_date', 'end_date'])

    # ============================================================
    # 배너 이벤트 테이블 (노출/클릭 로그)
    # ============================================================
    op.create_table(
        'banner_events',
        sa.Column('id', sa.BigInteger, primary_key=True, index=True),
        sa.Column('banner_id', sa.Integer, sa.ForeignKey('banner_ads.id', ondelete='CASCADE'), nullable=False),

        # 이벤트 정보
        sa.Column('event_type', sa.String(20), nullable=False),  # 'impression', 'click'
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('session_id', sa.String(100), nullable=True),

        # 컨텍스트 정보
        sa.Column('ip_address', sa.String(50), nullable=True),
        sa.Column('user_agent', sa.Text, nullable=True),
        sa.Column('page_url', sa.String(500), nullable=True),
        sa.Column('referer', sa.String(500), nullable=True),

        # 메타
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    # 인덱스
    op.create_index('ix_banner_events_banner_type', 'banner_events', ['banner_id', 'event_type'])
    op.create_index('ix_banner_events_created', 'banner_events', ['created_at'])
    op.create_index('ix_banner_events_session', 'banner_events', ['session_id', 'banner_id'])

    # ============================================================
    # 배너 일별 통계 테이블
    # ============================================================
    op.create_table(
        'banner_daily_stats',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('banner_id', sa.Integer, sa.ForeignKey('banner_ads.id', ondelete='CASCADE'), nullable=False),
        sa.Column('date', sa.Date, nullable=False),

        # 통계
        sa.Column('impressions', sa.Integer, default=0),
        sa.Column('clicks', sa.Integer, default=0),
        sa.Column('spent', sa.Integer, default=0),
        sa.Column('ctr', sa.Float, default=0.0),

        # 메타
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # 인덱스
    op.create_index('ix_banner_daily_stats_banner_date', 'banner_daily_stats', ['banner_id', 'date'], unique=True)


def downgrade() -> None:
    # 배너 일별 통계 테이블
    op.drop_index('ix_banner_daily_stats_banner_date', table_name='banner_daily_stats')
    op.drop_table('banner_daily_stats')

    # 배너 이벤트 테이블
    op.drop_index('ix_banner_events_session', table_name='banner_events')
    op.drop_index('ix_banner_events_created', table_name='banner_events')
    op.drop_index('ix_banner_events_banner_type', table_name='banner_events')
    op.drop_table('banner_events')

    # 배너 광고 테이블
    op.drop_index('ix_banner_ads_dates', table_name='banner_ads')
    op.drop_index('ix_banner_ads_partner', table_name='banner_ads')
    op.drop_index('ix_banner_ads_position', table_name='banner_ads')
    op.drop_index('ix_banner_ads_status', table_name='banner_ads')
    op.drop_table('banner_ads')

    # ENUM 타입 삭제
    op.execute("DROP TYPE IF EXISTS bannerstatus")
    op.execute("DROP TYPE IF EXISTS bannerposition")
