"""매물 등록 정기구독 테이블

Revision ID: 008_listing_subscription
Revises: 007_sales_match_tables
Create Date: 2026-02-09

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '008_listing_subscription'
down_revision: Union[str, None] = '007_sales_match_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # UserRole enum에 LANDLORD 추가
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'LANDLORD'")

    # Enum 타입 생성
    listing_sub_status = postgresql.ENUM(
        'ACTIVE', 'CANCELED', 'EXPIRED', 'PAST_DUE', 'SUSPENDED',
        name='listingsubstatus',
        create_type=True
    )
    listing_sub_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        'listing_subscriptions',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True),

        # 빌링키 정보
        sa.Column('billing_key', sa.String(200), nullable=False),
        sa.Column('customer_key', sa.String(100), nullable=False),
        sa.Column('card_company', sa.String(50), nullable=True),
        sa.Column('card_number', sa.String(50), nullable=True),

        # 구독 상태
        sa.Column('status', sa.Enum('ACTIVE', 'CANCELED', 'EXPIRED', 'PAST_DUE', 'SUSPENDED',
                                    name='listingsubstatus', create_type=False),
                  nullable=False, server_default='ACTIVE'),

        # 구독 기간
        sa.Column('current_period_start', sa.DateTime(), nullable=False),
        sa.Column('current_period_end', sa.DateTime(), nullable=False),
        sa.Column('next_billing_date', sa.DateTime(), nullable=False),

        # 크레딧
        sa.Column('total_credits', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('used_credits', sa.Integer(), nullable=False, server_default='0'),

        # 결제 실패 재시도
        sa.Column('retry_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_retry_at', sa.DateTime(), nullable=True),

        # 취소 정보
        sa.Column('canceled_at', sa.DateTime(), nullable=True),
        sa.Column('cancel_reason', sa.Text(), nullable=True),

        # 결제 연결
        sa.Column('last_payment_id', sa.Integer(),
                  sa.ForeignKey('payments.id'), nullable=True),
        sa.Column('monthly_amount', sa.Integer(), nullable=False, server_default='150000'),

        # 타임스탬프
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
    )

    # 인덱스 생성
    op.create_index('ix_listing_sub_status', 'listing_subscriptions', ['status'])
    op.create_index('ix_listing_sub_next_billing', 'listing_subscriptions', ['next_billing_date'])


def downgrade() -> None:
    op.drop_index('ix_listing_sub_next_billing', table_name='listing_subscriptions')
    op.drop_index('ix_listing_sub_status', table_name='listing_subscriptions')
    op.drop_table('listing_subscriptions')
    sa.Enum(name='listingsubstatus').drop(op.get_bind(), checkfirst=True)
