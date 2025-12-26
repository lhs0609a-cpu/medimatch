"""에스크로 결제 시스템 테이블

Revision ID: 002_escrow_tables
Revises: 001_pharmacy_match
Create Date: 2024-12-23

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '002_escrow_tables'
down_revision: Union[str, None] = '001_pharmacy_match'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ============================================================
    # 전자계약 테이블
    # ============================================================
    op.create_table(
        'escrow_contracts',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('contract_number', sa.String(50), unique=True, nullable=False),

        # 참여자
        sa.Column('customer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('partner_id', sa.Integer, sa.ForeignKey('partners.id'), nullable=False),
        sa.Column('inquiry_id', sa.Integer, sa.ForeignKey('partner_inquiries.id'), nullable=True),

        # 계약 내용
        sa.Column('title', sa.String(300), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('contract_content', sa.Text, nullable=False),
        sa.Column('terms_and_conditions', sa.Text, nullable=True),

        # 금액
        sa.Column('total_amount', sa.Numeric(15, 2), nullable=False),
        sa.Column('deposit_amount', sa.Numeric(15, 2), nullable=True),
        sa.Column('commission_rate', sa.Numeric(5, 2), default=3.0),
        sa.Column('commission_amount', sa.Numeric(15, 2), nullable=True),

        # 일정
        sa.Column('service_start_date', sa.DateTime, nullable=True),
        sa.Column('service_end_date', sa.DateTime, nullable=True),

        # 고객 서명
        sa.Column('customer_signed', sa.Boolean, default=False),
        sa.Column('customer_signature', sa.Text, nullable=True),
        sa.Column('customer_signed_at', sa.DateTime, nullable=True),
        sa.Column('customer_signed_ip', sa.String(50), nullable=True),

        # 파트너 서명
        sa.Column('partner_signed', sa.Boolean, default=False),
        sa.Column('partner_signature', sa.Text, nullable=True),
        sa.Column('partner_signed_at', sa.DateTime, nullable=True),
        sa.Column('partner_signed_ip', sa.String(50), nullable=True),

        # 상태
        sa.Column('status', sa.String(30), default='DRAFT'),

        # 타임스탬프
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    op.create_index('ix_escrow_contracts_customer', 'escrow_contracts', ['customer_id'])
    op.create_index('ix_escrow_contracts_partner', 'escrow_contracts', ['partner_id'])
    op.create_index('ix_escrow_contracts_status', 'escrow_contracts', ['status'])

    # ============================================================
    # 연락처 탐지 로그 테이블 (먼저 생성 - FK 참조용)
    # ============================================================
    op.create_table(
        'contact_detection_logs',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('escrow_id', postgresql.UUID(as_uuid=True), nullable=True),  # 나중에 FK 추가
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),

        # 탐지 정보
        sa.Column('detected_pattern', sa.String(100), nullable=False),
        sa.Column('detected_value', sa.String(500), nullable=False),
        sa.Column('original_content', sa.Text, nullable=False),

        # 조치
        sa.Column('action_taken', sa.String(20), nullable=False),

        # 반복 횟수
        sa.Column('user_violation_count', sa.Integer, default=1),

        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_index('ix_contact_detection_user', 'contact_detection_logs', ['user_id'])

    # ============================================================
    # 에스크로 거래 테이블
    # ============================================================
    op.create_table(
        'escrow_transactions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('escrow_number', sa.String(50), unique=True, nullable=False, index=True),

        # 참여자
        sa.Column('customer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('partner_id', sa.Integer, sa.ForeignKey('partners.id'), nullable=False),

        # 연결된 계약
        sa.Column('contract_id', sa.Integer, sa.ForeignKey('escrow_contracts.id'), nullable=False),

        # 금액 정보
        sa.Column('total_amount', sa.Numeric(15, 2), nullable=False),
        sa.Column('platform_fee', sa.Numeric(15, 2), nullable=False),
        sa.Column('partner_payout', sa.Numeric(15, 2), nullable=False),

        # 상태
        sa.Column('status', sa.String(20), default='INITIATED'),

        # 토스페이먼츠 결제 정보
        sa.Column('payment_key', sa.String(200), nullable=True),
        sa.Column('order_id', sa.String(100), nullable=True),

        # 정산 정보
        sa.Column('payout_account_bank', sa.String(50), nullable=True),
        sa.Column('payout_account_number', sa.String(50), nullable=True),
        sa.Column('payout_account_holder', sa.String(100), nullable=True),
        sa.Column('paid_at', sa.DateTime, nullable=True),

        # 타임스탬프
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('funded_at', sa.DateTime, nullable=True),
        sa.Column('completed_at', sa.DateTime, nullable=True),
        sa.Column('released_at', sa.DateTime, nullable=True),
    )

    op.create_index('ix_escrow_transactions_customer', 'escrow_transactions', ['customer_id'])
    op.create_index('ix_escrow_transactions_partner', 'escrow_transactions', ['partner_id'])
    op.create_index('ix_escrow_transactions_status', 'escrow_transactions', ['status'])

    # contact_detection_logs에 escrow_id FK 추가
    op.create_foreign_key(
        'fk_contact_detection_escrow',
        'contact_detection_logs', 'escrow_transactions',
        ['escrow_id'], ['id']
    )
    op.create_index('ix_contact_detection_escrow', 'contact_detection_logs', ['escrow_id'])

    # ============================================================
    # 마일스톤 테이블
    # ============================================================
    op.create_table(
        'escrow_milestones',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('escrow_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('escrow_transactions.id'), nullable=False),

        # 마일스톤 정보
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('sequence', sa.Integer, nullable=False),

        # 금액
        sa.Column('amount', sa.Numeric(15, 2), nullable=False),
        sa.Column('percentage', sa.Numeric(5, 2), nullable=False),

        # 상태
        sa.Column('status', sa.String(20), default='PENDING'),

        # 완료 조건
        sa.Column('due_date', sa.DateTime, nullable=True),
        sa.Column('submitted_at', sa.DateTime, nullable=True),
        sa.Column('approved_at', sa.DateTime, nullable=True),
        sa.Column('released_at', sa.DateTime, nullable=True),

        # 증빙
        sa.Column('proof_description', sa.Text, nullable=True),
        sa.Column('proof_files', postgresql.JSONB, default=[]),

        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_index('ix_escrow_milestones_escrow_seq', 'escrow_milestones', ['escrow_id', 'sequence'])

    # ============================================================
    # 에스크로 메시지 테이블
    # ============================================================
    op.create_table(
        'escrow_messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('escrow_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('escrow_transactions.id'), nullable=False),
        sa.Column('sender_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),

        # 메시지 내용
        sa.Column('message_type', sa.String(20), default='TEXT'),
        sa.Column('content', sa.Text, nullable=False),
        sa.Column('filtered_content', sa.Text, nullable=True),

        # 첨부 파일
        sa.Column('attachments', postgresql.JSONB, default=[]),

        # 연락처 탐지
        sa.Column('contains_contact_info', sa.Boolean, default=False),
        sa.Column('contact_detection_log_id', sa.Integer, sa.ForeignKey('contact_detection_logs.id'), nullable=True),

        # 읽음 상태
        sa.Column('is_read', sa.Boolean, default=False),
        sa.Column('read_at', sa.DateTime, nullable=True),

        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_index('ix_escrow_messages_escrow_created', 'escrow_messages', ['escrow_id', 'created_at'])

    # ============================================================
    # 분쟁 테이블
    # ============================================================
    op.create_table(
        'escrow_disputes',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('escrow_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('escrow_transactions.id'), nullable=False),
        sa.Column('raised_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),

        # 분쟁 내용
        sa.Column('reason', sa.String(100), nullable=False),
        sa.Column('description', sa.Text, nullable=False),
        sa.Column('evidence_files', postgresql.JSONB, default=[]),

        # 해결
        sa.Column('status', sa.String(30), default='OPEN'),
        sa.Column('resolution_notes', sa.Text, nullable=True),
        sa.Column('refund_amount', sa.Numeric(15, 2), nullable=True),

        # 담당자
        sa.Column('assigned_admin_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),

        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('resolved_at', sa.DateTime, nullable=True),
    )

    op.create_index('ix_escrow_disputes_status', 'escrow_disputes', ['status'])

    # ============================================================
    # Partner 테이블에 정산 계좌 컬럼 추가
    # ============================================================
    op.add_column('partners', sa.Column('payout_bank', sa.String(50), nullable=True))
    op.add_column('partners', sa.Column('payout_account', sa.String(50), nullable=True))
    op.add_column('partners', sa.Column('payout_holder', sa.String(100), nullable=True))


def downgrade() -> None:
    # Partner 컬럼 제거
    op.drop_column('partners', 'payout_holder')
    op.drop_column('partners', 'payout_account')
    op.drop_column('partners', 'payout_bank')

    # 테이블 삭제 (역순)
    op.drop_table('escrow_disputes')
    op.drop_table('escrow_messages')
    op.drop_table('escrow_milestones')
    op.drop_table('escrow_transactions')
    op.drop_table('contact_detection_logs')
    op.drop_table('escrow_contracts')
