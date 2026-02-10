"""약국 양도 매물 테이블

Revision ID: 009_pharmacy_transfer
Revises: 008_listing_subscription
Create Date: 2026-02-10

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '009_pharmacy_transfer'
down_revision: Union[str, None] = '008_listing_subscription'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enum 타입 생성
    pharm_transfer_status = postgresql.ENUM(
        'PENDING_REVIEW', 'ACTIVE', 'CLOSED', 'REJECTED',
        name='pharmtransferstatus',
        create_type=True,
    )
    pharm_transfer_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        'pharmacy_transfer_listings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),

        # 약국 기본 정보
        sa.Column('pharmacy_name', sa.String(200), nullable=False),
        sa.Column('address', sa.String(500), nullable=False),
        sa.Column('region_name', sa.String(100), nullable=True),
        sa.Column('latitude', sa.Float, nullable=True),
        sa.Column('longitude', sa.Float, nullable=True),
        sa.Column('area_pyeong', sa.Float, nullable=True),

        # 매출/비용
        sa.Column('monthly_revenue', sa.BigInteger, nullable=True),
        sa.Column('monthly_rx_count', sa.Integer, nullable=True),
        sa.Column('premium', sa.BigInteger, nullable=True),
        sa.Column('rent_monthly', sa.BigInteger, nullable=True),
        sa.Column('rent_deposit', sa.BigInteger, nullable=True),

        # 상세
        sa.Column('transfer_reason', sa.String(200), nullable=True),
        sa.Column('description', sa.Text, nullable=True),

        # 연락처
        sa.Column('contact_name', sa.String(100), nullable=True),
        sa.Column('contact_phone', sa.String(20), nullable=True),

        # 이미지
        sa.Column('images', postgresql.ARRAY(sa.String), nullable=True),

        # 상태
        sa.Column('status', sa.Enum('PENDING_REVIEW', 'ACTIVE', 'CLOSED', 'REJECTED',
                                    name='pharmtransferstatus', create_type=False),
                  nullable=False, server_default='PENDING_REVIEW'),
        sa.Column('is_public', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('rejection_reason', sa.Text, nullable=True),
        sa.Column('verified_at', sa.DateTime, nullable=True),
        sa.Column('verified_by', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id'), nullable=True),

        # 통계
        sa.Column('view_count', sa.Integer, nullable=False, server_default='0'),
        sa.Column('inquiry_count', sa.Integer, nullable=False, server_default='0'),

        # 타임스탬프
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now()),
    )

    # 인덱스
    op.create_index('ix_pharm_transfer_status', 'pharmacy_transfer_listings', ['status'])
    op.create_index('ix_pharm_transfer_user', 'pharmacy_transfer_listings', ['user_id'])
    op.create_index('ix_pharm_transfer_public', 'pharmacy_transfer_listings', ['is_public', 'status'])


def downgrade() -> None:
    op.drop_index('ix_pharm_transfer_public', table_name='pharmacy_transfer_listings')
    op.drop_index('ix_pharm_transfer_user', table_name='pharmacy_transfer_listings')
    op.drop_index('ix_pharm_transfer_status', table_name='pharmacy_transfer_listings')
    op.drop_table('pharmacy_transfer_listings')
    sa.Enum(name='pharmtransferstatus').drop(op.get_bind(), checkfirst=True)
