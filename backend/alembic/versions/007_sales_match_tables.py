"""영업사원↔개원의 유료 매칭 테이블

Revision ID: 007_sales_match_tables
Revises: 006_banner_tables
Create Date: 2025-01-08

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '007_sales_match_tables'
down_revision: Union[str, None] = '006_banner_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ============================================================
    # ENUM 타입 생성
    # ============================================================

    # 영업사원 프로필 상태
    sales_rep_status = postgresql.ENUM(
        'PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE',
        name='salesrepstatus'
    )
    sales_rep_status.create(op.get_bind(), checkfirst=True)

    # 매칭 요청 상태
    match_request_status = postgresql.ENUM(
        'PENDING_PAYMENT', 'PENDING', 'ACCEPTED', 'REJECTED',
        'EXPIRED', 'REFUNDED', 'CONTACT_MADE', 'COMPLETED', 'CANCELLED',
        name='matchrequeststatus'
    )
    match_request_status.create(op.get_bind(), checkfirst=True)

    # 의사 응답 유형
    doctor_response = postgresql.ENUM(
        'ACCEPTED', 'REJECTED', 'EXPIRED',
        name='doctorresponse'
    )
    doctor_response.create(op.get_bind(), checkfirst=True)

    # 컨택 결과
    contact_result = postgresql.ENUM(
        'NOT_YET', 'IN_PROGRESS', 'SUCCESS', 'FAILED', 'POSTPONED',
        name='contactresult'
    )
    contact_result.create(op.get_bind(), checkfirst=True)

    # ============================================================
    # 영업사원 프로필 테이블
    # ============================================================
    op.create_table(
        'sales_rep_profiles',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False),

        # === 기본 정보 ===
        sa.Column('company', sa.String(200), nullable=False),
        sa.Column('department', sa.String(100), nullable=True),
        sa.Column('position', sa.String(100), nullable=True),
        sa.Column('business_card_url', sa.String(500), nullable=True),

        # === 취급 제품/서비스 ===
        sa.Column('product_categories', postgresql.ARRAY(sa.String), server_default='{}'),
        sa.Column('product_details', sa.Text, nullable=True),

        # === 타겟 진료과목 ===
        sa.Column('target_specialties', postgresql.ARRAY(sa.String), server_default='{}'),

        # === 영업 지역 ===
        sa.Column('service_regions', postgresql.ARRAY(sa.String), server_default='{}'),

        # === 경력 및 소개 ===
        sa.Column('experience_years', sa.Integer, default=0),
        sa.Column('introduction', sa.Text, nullable=True),

        # === 통계 ===
        sa.Column('total_requests', sa.Integer, default=0),
        sa.Column('accepted_requests', sa.Integer, default=0),
        sa.Column('successful_contacts', sa.Integer, default=0),
        sa.Column('total_spent', sa.Integer, default=0),

        # === 평점 ===
        sa.Column('rating', sa.Float, default=0.0),
        sa.Column('rating_count', sa.Integer, default=0),

        # === 상태 및 검증 ===
        sa.Column('status', postgresql.ENUM(
            'PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE',
            name='salesrepstatus', create_type=False
        ), server_default='PENDING'),
        sa.Column('is_verified', sa.Boolean, default=False),
        sa.Column('verified_at', sa.DateTime, nullable=True),
        sa.Column('verification_docs', postgresql.JSONB, server_default='[]'),

        # === 메타데이터 ===
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column('last_active_at', sa.DateTime, nullable=True),
    )

    # 인덱스
    op.create_index('ix_sales_rep_profiles_status', 'sales_rep_profiles', ['status'])
    op.create_index('ix_sales_rep_profiles_user', 'sales_rep_profiles', ['user_id'])

    # ============================================================
    # 영업사원 매칭 요청 테이블
    # ============================================================
    op.create_table(
        'sales_match_requests',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('sales_rep_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('doctor_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),

        # === 요청 정보 ===
        sa.Column('product_category', sa.String(50), nullable=False),
        sa.Column('message', sa.Text, nullable=True),

        # === 수수료 및 결제 ===
        sa.Column('match_fee', sa.Integer, default=300000),
        sa.Column('payment_id', sa.Integer, sa.ForeignKey('payments.id'), nullable=True),
        sa.Column('paid_at', sa.DateTime, nullable=True),

        # === 상태 ===
        sa.Column('status', postgresql.ENUM(
            'PENDING_PAYMENT', 'PENDING', 'ACCEPTED', 'REJECTED',
            'EXPIRED', 'REFUNDED', 'CONTACT_MADE', 'COMPLETED', 'CANCELLED',
            name='matchrequeststatus', create_type=False
        ), server_default='PENDING_PAYMENT'),
        sa.Column('doctor_response', postgresql.ENUM(
            'ACCEPTED', 'REJECTED', 'EXPIRED',
            name='doctorresponse', create_type=False
        ), nullable=True),
        sa.Column('reject_reason', sa.Text, nullable=True),

        # === 컨택 정보 (수락 후 공개) ===
        sa.Column('contact_shared', sa.Boolean, default=False),
        sa.Column('contact_shared_at', sa.DateTime, nullable=True),

        # === 컨택 결과 (영업사원 기록) ===
        sa.Column('contact_result', postgresql.ENUM(
            'NOT_YET', 'IN_PROGRESS', 'SUCCESS', 'FAILED', 'POSTPONED',
            name='contactresult', create_type=False
        ), server_default='NOT_YET'),
        sa.Column('contact_note', sa.Text, nullable=True),
        sa.Column('contacted_at', sa.DateTime, nullable=True),

        # === 환불 ===
        sa.Column('refund_id', sa.Integer, sa.ForeignKey('payments.id'), nullable=True),
        sa.Column('refunded_at', sa.DateTime, nullable=True),
        sa.Column('refund_reason', sa.String(100), nullable=True),

        # === 기간 ===
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column('expires_at', sa.DateTime, nullable=True),
        sa.Column('responded_at', sa.DateTime, nullable=True),
    )

    # 인덱스
    op.create_index('ix_sales_match_requests_status', 'sales_match_requests', ['status'])
    op.create_index('ix_sales_match_requests_sales_rep', 'sales_match_requests', ['sales_rep_id'])
    op.create_index('ix_sales_match_requests_doctor', 'sales_match_requests', ['doctor_id'])
    op.create_index('ix_sales_match_requests_expires', 'sales_match_requests', ['expires_at'])

    # ============================================================
    # 매칭 리뷰 테이블
    # ============================================================
    op.create_table(
        'sales_match_reviews',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('match_request_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('sales_match_requests.id', ondelete='CASCADE'), nullable=False),
        sa.Column('reviewer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),

        # 리뷰 대상 (영업사원이면 의사가, 의사면 영업사원이 작성)
        sa.Column('reviewer_type', sa.String(20), nullable=False),  # 'DOCTOR', 'SALES_REP'

        # === 평가 ===
        sa.Column('rating', sa.Integer, nullable=False),  # 1-5점
        sa.Column('comment', sa.Text, nullable=True),

        # === 메타데이터 ===
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # 인덱스
    op.create_index('ix_sales_match_reviews_request', 'sales_match_reviews', ['match_request_id'])
    op.create_index('ix_sales_match_reviews_reviewer', 'sales_match_reviews', ['reviewer_id'])


def downgrade() -> None:
    # 매칭 리뷰 테이블
    op.drop_index('ix_sales_match_reviews_reviewer', table_name='sales_match_reviews')
    op.drop_index('ix_sales_match_reviews_request', table_name='sales_match_reviews')
    op.drop_table('sales_match_reviews')

    # 영업사원 매칭 요청 테이블
    op.drop_index('ix_sales_match_requests_expires', table_name='sales_match_requests')
    op.drop_index('ix_sales_match_requests_doctor', table_name='sales_match_requests')
    op.drop_index('ix_sales_match_requests_sales_rep', table_name='sales_match_requests')
    op.drop_index('ix_sales_match_requests_status', table_name='sales_match_requests')
    op.drop_table('sales_match_requests')

    # 영업사원 프로필 테이블
    op.drop_index('ix_sales_rep_profiles_user', table_name='sales_rep_profiles')
    op.drop_index('ix_sales_rep_profiles_status', table_name='sales_rep_profiles')
    op.drop_table('sales_rep_profiles')

    # ENUM 타입 삭제
    op.execute("DROP TYPE IF EXISTS contactresult")
    op.execute("DROP TYPE IF EXISTS doctorresponse")
    op.execute("DROP TYPE IF EXISTS matchrequeststatus")
    op.execute("DROP TYPE IF EXISTS salesrepstatus")
