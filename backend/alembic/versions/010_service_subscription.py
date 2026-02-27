"""서비스 정기구독 테이블 (홈페이지/프로그램)

Revision ID: 010_service_subscription
Revises: 009_pharmacy_transfer
Create Date: 2026-02-26

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '010_service_subscription'
down_revision: Union[str, None] = '009_pharmacy_transfer'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enum 타입 생성
    service_type = postgresql.ENUM(
        'HOMEPAGE', 'PROGRAM',
        name='servicetype',
        create_type=True
    )
    service_type.create(op.get_bind(), checkfirst=True)

    service_tier = postgresql.ENUM(
        'STARTER', 'GROWTH', 'PREMIUM', 'STANDARD',
        name='servicetier',
        create_type=True
    )
    service_tier.create(op.get_bind(), checkfirst=True)

    service_sub_status = postgresql.ENUM(
        'ACTIVE', 'CANCELED', 'EXPIRED', 'PAST_DUE', 'SUSPENDED',
        name='servicesubstatus',
        create_type=True
    )
    service_sub_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        'service_subscriptions',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),

        # 서비스 정보
        sa.Column('service_type', sa.Enum('HOMEPAGE', 'PROGRAM',
                                          name='servicetype', create_type=False),
                  nullable=False),
        sa.Column('tier', sa.Enum('STARTER', 'GROWTH', 'PREMIUM', 'STANDARD',
                                  name='servicetier', create_type=False),
                  nullable=False),

        # 빌링키 정보
        sa.Column('billing_key', sa.String(200), nullable=False),
        sa.Column('customer_key', sa.String(100), nullable=False),
        sa.Column('card_company', sa.String(50), nullable=True),
        sa.Column('card_number', sa.String(50), nullable=True),

        # 구독 상태
        sa.Column('status', sa.Enum('ACTIVE', 'CANCELED', 'EXPIRED', 'PAST_DUE', 'SUSPENDED',
                                    name='servicesubstatus', create_type=False),
                  nullable=False, server_default='ACTIVE'),

        # 구독 기간
        sa.Column('current_period_start', sa.DateTime(), nullable=False),
        sa.Column('current_period_end', sa.DateTime(), nullable=False),
        sa.Column('next_billing_date', sa.DateTime(), nullable=False),

        # 금액
        sa.Column('monthly_amount', sa.Integer(), nullable=False),

        # 결제 실패 재시도
        sa.Column('retry_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_retry_at', sa.DateTime(), nullable=True),

        # 취소 정보
        sa.Column('canceled_at', sa.DateTime(), nullable=True),
        sa.Column('cancel_reason', sa.Text(), nullable=True),

        # 고객사 정보
        sa.Column('company_name', sa.String(200), nullable=True),
        sa.Column('contact_person', sa.String(100), nullable=True),
        sa.Column('contact_phone', sa.String(20), nullable=True),

        # 결제 연결
        sa.Column('last_payment_id', sa.Integer(),
                  sa.ForeignKey('payments.id'), nullable=True),

        # 타임스탬프
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
    )

    # Unique constraint: 한 유저당 서비스 타입 1개
    op.create_unique_constraint('uq_user_service_type', 'service_subscriptions',
                                ['user_id', 'service_type'])

    # 인덱스 생성
    op.create_index('ix_service_sub_status', 'service_subscriptions', ['status'])
    op.create_index('ix_service_sub_next_billing', 'service_subscriptions', ['next_billing_date'])
    op.create_index('ix_service_sub_type', 'service_subscriptions', ['service_type'])


def downgrade() -> None:
    op.drop_index('ix_service_sub_type', table_name='service_subscriptions')
    op.drop_index('ix_service_sub_next_billing', table_name='service_subscriptions')
    op.drop_index('ix_service_sub_status', table_name='service_subscriptions')
    op.drop_constraint('uq_user_service_type', 'service_subscriptions', type_='unique')
    op.drop_table('service_subscriptions')
    sa.Enum(name='servicesubstatus').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='servicetier').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='servicetype').drop(op.get_bind(), checkfirst=True)
