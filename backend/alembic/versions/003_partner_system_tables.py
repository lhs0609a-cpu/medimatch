"""파트너 시스템 확장 테이블 (카테고리, 포트폴리오, 구독, 채팅)

Revision ID: 003_partner_system
Revises: 002_escrow_tables
Create Date: 2025-01-02

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '003_partner_system'
down_revision: Union[str, None] = '002_escrow_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ============================================================
    # 파트너 카테고리 마스터 테이블
    # ============================================================
    op.create_table(
        'partner_categories',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('code', sa.String(50), unique=True, nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('icon', sa.String(50), nullable=True),

        # 수수료 정책
        sa.Column('lead_fee', sa.Integer, default=50000),  # 연결당 수수료
        sa.Column('commission_rate', sa.Numeric(5, 2), default=3.0),  # 거래 수수료 %

        sa.Column('display_order', sa.Integer, default=0),
        sa.Column('is_active', sa.Boolean, default=True),

        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    op.create_index('ix_partner_categories_code', 'partner_categories', ['code'])

    # ============================================================
    # partners 테이블 확장 (새 컬럼 추가)
    # ============================================================
    # 카테고리 FK
    op.add_column('partners', sa.Column('category_id', sa.Integer, sa.ForeignKey('partner_categories.id'), nullable=True))

    # 사업자 정보
    op.add_column('partners', sa.Column('business_number', sa.String(20), nullable=True))
    op.add_column('partners', sa.Column('ceo_name', sa.String(50), nullable=True))
    op.add_column('partners', sa.Column('short_description', sa.String(200), nullable=True))

    # 위치 (시도/시군구)
    op.add_column('partners', sa.Column('address_detail', sa.String(100), nullable=True))
    op.add_column('partners', sa.Column('sido', sa.String(20), nullable=True))
    op.add_column('partners', sa.Column('sigungu', sa.String(30), nullable=True))

    # 사업 정보
    op.add_column('partners', sa.Column('established_year', sa.Integer, nullable=True))
    op.add_column('partners', sa.Column('employee_count', sa.Integer, nullable=True))
    op.add_column('partners', sa.Column('annual_projects', sa.Integer, nullable=True))

    # 가격 정보
    op.add_column('partners', sa.Column('price_range_min', sa.Integer, nullable=True))
    op.add_column('partners', sa.Column('price_range_max', sa.Integer, nullable=True))
    op.add_column('partners', sa.Column('price_unit', sa.String(20), default='total'))

    # 이미지
    op.add_column('partners', sa.Column('cover_image_url', sa.String(500), nullable=True))

    # 통계
    op.add_column('partners', sa.Column('inquiry_count', sa.Integer, default=0))
    op.add_column('partners', sa.Column('contract_count', sa.Integer, default=0))
    op.add_column('partners', sa.Column('total_contract_amount', sa.Numeric(15, 2), default=0))
    op.add_column('partners', sa.Column('response_rate', sa.Numeric(5, 2), default=0))
    op.add_column('partners', sa.Column('avg_response_time', sa.Integer, default=0))

    # 커미션 정보
    op.add_column('partners', sa.Column('commission_rate', sa.Numeric(5, 2), default=3.0))
    op.add_column('partners', sa.Column('min_commission', sa.Integer, default=100000))

    # 등급
    op.add_column('partners', sa.Column('tier', sa.String(20), default='BASIC'))
    op.add_column('partners', sa.Column('status', sa.String(20), default='PENDING'))

    # 프리미엄
    op.add_column('partners', sa.Column('premium_started_at', sa.DateTime, nullable=True))
    op.add_column('partners', sa.Column('premium_expires_at', sa.DateTime, nullable=True))
    op.add_column('partners', sa.Column('premium_badge_text', sa.String(20), nullable=True))

    # 검증
    op.add_column('partners', sa.Column('verified_at', sa.DateTime, nullable=True))
    op.add_column('partners', sa.Column('verification_docs', postgresql.JSONB, default=[]))

    # 정산 계좌
    op.add_column('partners', sa.Column('payout_bank', sa.String(50), nullable=True))
    op.add_column('partners', sa.Column('payout_account', sa.String(50), nullable=True))
    op.add_column('partners', sa.Column('payout_holder', sa.String(100), nullable=True))

    # 공공데이터 연동
    op.add_column('partners', sa.Column('source', sa.String(50), nullable=True))
    op.add_column('partners', sa.Column('source_id', sa.String(100), nullable=True))
    op.add_column('partners', sa.Column('last_synced_at', sa.DateTime, nullable=True))

    # 인덱스
    op.create_index('ix_partners_business_number', 'partners', ['business_number'])
    op.create_index('ix_partners_sido', 'partners', ['sido'])
    op.create_index('ix_partners_sigungu', 'partners', ['sigungu'])
    op.create_index('ix_partners_tier', 'partners', ['tier'])
    op.create_index('ix_partners_status', 'partners', ['status'])
    op.create_index('ix_partners_category_id', 'partners', ['category_id'])

    # ============================================================
    # 파트너 포트폴리오 테이블
    # ============================================================
    op.create_table(
        'partner_portfolios',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('partner_id', sa.Integer, sa.ForeignKey('partners.id', ondelete='CASCADE'), nullable=False),

        # 프로젝트 정보
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('project_type', sa.String(50), nullable=True),  # 피부과, 성형외과
        sa.Column('project_size', sa.Integer, nullable=True),  # 면적 (평)
        sa.Column('project_cost', sa.Integer, nullable=True),  # 비용
        sa.Column('project_duration', sa.Integer, nullable=True),  # 기간 (일)
        sa.Column('location', sa.String(200), nullable=True),
        sa.Column('client_type', sa.String(50), nullable=True),

        # 상세 내용
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('images', postgresql.JSONB, default=[]),
        sa.Column('tags', postgresql.JSONB, default=[]),

        # 표시
        sa.Column('is_featured', sa.Boolean, default=False),
        sa.Column('is_visible', sa.Boolean, default=True),
        sa.Column('display_order', sa.Integer, default=0),
        sa.Column('view_count', sa.Integer, default=0),

        sa.Column('completed_at', sa.DateTime, nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    op.create_index('ix_partner_portfolios_partner', 'partner_portfolios', ['partner_id'])
    op.create_index('ix_partner_portfolios_featured', 'partner_portfolios', ['is_featured'])

    # ============================================================
    # 파트너 서비스 지역 테이블
    # ============================================================
    op.create_table(
        'partner_service_areas',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('partner_id', sa.Integer, sa.ForeignKey('partners.id', ondelete='CASCADE'), nullable=False),

        sa.Column('sido', sa.String(20), nullable=False),
        sa.Column('sigungu', sa.String(30), nullable=True),  # NULL이면 시도 전체
        sa.Column('is_primary', sa.Boolean, default=False),  # 주요 서비스 지역

        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_index('ix_partner_service_areas_partner', 'partner_service_areas', ['partner_id'])
    op.create_index('ix_partner_service_areas_sido', 'partner_service_areas', ['sido'])

    # ============================================================
    # 파트너 구독 테이블
    # ============================================================
    op.create_table(
        'partner_subscriptions',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('partner_id', sa.Integer, sa.ForeignKey('partners.id', ondelete='CASCADE'), nullable=False, unique=True),

        sa.Column('plan', sa.String(20), default='FREE'),  # FREE, BASIC, STANDARD, PREMIUM
        sa.Column('billing_cycle', sa.String(10), default='monthly'),  # monthly, yearly

        # 결제 정보
        sa.Column('amount', sa.Integer, default=0),
        sa.Column('next_billing_date', sa.DateTime, nullable=True),
        sa.Column('last_billed_at', sa.DateTime, nullable=True),

        # 기간
        sa.Column('started_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('expires_at', sa.DateTime, nullable=True),

        # 상태
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('cancelled_at', sa.DateTime, nullable=True),
        sa.Column('cancel_reason', sa.String(200), nullable=True),

        # 자동결제
        sa.Column('auto_renew', sa.Boolean, default=True),
        sa.Column('payment_method_id', sa.String(100), nullable=True),

        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    op.create_index('ix_partner_subscriptions_partner', 'partner_subscriptions', ['partner_id'])
    op.create_index('ix_partner_subscriptions_plan', 'partner_subscriptions', ['plan'])

    # ============================================================
    # 채팅방 테이블
    # ============================================================
    op.create_table(
        'chat_rooms',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('room_code', sa.String(50), unique=True, nullable=False),

        # 참여자
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('partner_id', sa.Integer, sa.ForeignKey('partners.id'), nullable=False),

        # 연결 정보
        sa.Column('inquiry_id', sa.Integer, sa.ForeignKey('partner_inquiries.id'), nullable=True),
        sa.Column('escrow_contract_id', sa.Integer, sa.ForeignKey('escrow_contracts.id'), nullable=True),

        # 상태
        sa.Column('status', sa.String(20), default='ACTIVE'),  # ACTIVE, CONTRACTED, CLOSED

        # 마지막 메시지
        sa.Column('last_message', sa.Text, nullable=True),
        sa.Column('last_message_at', sa.DateTime, nullable=True),
        sa.Column('last_message_by', postgresql.UUID(as_uuid=True), nullable=True),

        # 읽지 않은 메시지
        sa.Column('user_unread_count', sa.Integer, default=0),
        sa.Column('partner_unread_count', sa.Integer, default=0),

        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    op.create_index('ix_chat_rooms_room_code', 'chat_rooms', ['room_code'])
    op.create_index('ix_chat_rooms_user', 'chat_rooms', ['user_id', 'status'])
    op.create_index('ix_chat_rooms_partner', 'chat_rooms', ['partner_id', 'status'])

    # ============================================================
    # 채팅 메시지 테이블
    # ============================================================
    op.create_table(
        'chat_messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('room_id', sa.Integer, sa.ForeignKey('chat_rooms.id', ondelete='CASCADE'), nullable=False),

        # 발신자
        sa.Column('sender_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('sender_type', sa.String(20), nullable=False),  # user, partner, system

        # 메시지 내용
        sa.Column('message_type', sa.String(20), default='TEXT'),  # TEXT, IMAGE, FILE, QUOTE, CONTRACT, SYSTEM
        sa.Column('content', sa.Text, nullable=False),
        sa.Column('filtered_content', sa.Text, nullable=True),

        # 첨부파일
        sa.Column('attachments', postgresql.JSONB, default=[]),

        # 연락처 탐지
        sa.Column('contains_contact', sa.Boolean, default=False),
        sa.Column('contact_detection_id', sa.Integer, sa.ForeignKey('contact_detection_logs.id'), nullable=True),

        # 읽음 상태
        sa.Column('is_read', sa.Boolean, default=False),
        sa.Column('read_at', sa.DateTime, nullable=True),

        # 메타데이터
        sa.Column('metadata', postgresql.JSONB, default={}),

        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_index('ix_chat_messages_room', 'chat_messages', ['room_id'])
    op.create_index('ix_chat_messages_room_created', 'chat_messages', ['room_id', 'created_at'])

    # ============================================================
    # 기본 카테고리 데이터 삽입
    # ============================================================
    op.execute("""
        INSERT INTO partner_categories (code, name, description, icon, lead_fee, commission_rate, display_order) VALUES
        ('interior', '인테리어', '병원/약국 전문 인테리어', 'Paintbrush', 100000, 3.0, 1),
        ('equipment', '의료장비', '의료기기 판매/렌탈', 'Stethoscope', 50000, 2.5, 2),
        ('furniture', '가구/집기', '의료용 가구 및 집기', 'Sofa', 30000, 3.0, 3),
        ('signage', '간판/사인물', '외부 간판 및 내부 사인물', 'PenTool', 30000, 3.0, 4),
        ('emr', 'EMR/의료IT', 'EMR, 예약시스템, 홈페이지', 'Monitor', 50000, 5.0, 5),
        ('consulting', '개원컨설팅', '입지분석, 사업계획', 'Briefcase', 100000, 5.0, 6),
        ('legal', '법률/세무', '의료전문 변호사, 세무사', 'Scale', 50000, 5.0, 7),
        ('finance', '금융/대출', '개원자금 대출, 리스', 'Landmark', 100000, 1.0, 8),
        ('marketing', '마케팅/홍보', '온라인마케팅, 홍보대행', 'Megaphone', 50000, 5.0, 9),
        ('realestate', '부동산', '상가 전문 중개', 'Building', 0, 0.5, 10),
        ('supplies', '소모품/비품', '의료소모품, 사무용품', 'Package', 10000, 2.0, 11),
        ('pharma', '약품도매', '약국용 약품 도매', 'Pill', 30000, 1.0, 12)
    """)


def downgrade() -> None:
    # 채팅 메시지
    op.drop_index('ix_chat_messages_room_created', table_name='chat_messages')
    op.drop_index('ix_chat_messages_room', table_name='chat_messages')
    op.drop_table('chat_messages')

    # 채팅방
    op.drop_index('ix_chat_rooms_partner', table_name='chat_rooms')
    op.drop_index('ix_chat_rooms_user', table_name='chat_rooms')
    op.drop_index('ix_chat_rooms_room_code', table_name='chat_rooms')
    op.drop_table('chat_rooms')

    # 파트너 구독
    op.drop_index('ix_partner_subscriptions_plan', table_name='partner_subscriptions')
    op.drop_index('ix_partner_subscriptions_partner', table_name='partner_subscriptions')
    op.drop_table('partner_subscriptions')

    # 파트너 서비스 지역
    op.drop_index('ix_partner_service_areas_sido', table_name='partner_service_areas')
    op.drop_index('ix_partner_service_areas_partner', table_name='partner_service_areas')
    op.drop_table('partner_service_areas')

    # 파트너 포트폴리오
    op.drop_index('ix_partner_portfolios_featured', table_name='partner_portfolios')
    op.drop_index('ix_partner_portfolios_partner', table_name='partner_portfolios')
    op.drop_table('partner_portfolios')

    # partners 테이블 확장 컬럼 제거
    op.drop_index('ix_partners_category_id', table_name='partners')
    op.drop_index('ix_partners_status', table_name='partners')
    op.drop_index('ix_partners_tier', table_name='partners')
    op.drop_index('ix_partners_sigungu', table_name='partners')
    op.drop_index('ix_partners_sido', table_name='partners')
    op.drop_index('ix_partners_business_number', table_name='partners')

    op.drop_column('partners', 'last_synced_at')
    op.drop_column('partners', 'source_id')
    op.drop_column('partners', 'source')
    op.drop_column('partners', 'payout_holder')
    op.drop_column('partners', 'payout_account')
    op.drop_column('partners', 'payout_bank')
    op.drop_column('partners', 'verification_docs')
    op.drop_column('partners', 'verified_at')
    op.drop_column('partners', 'premium_badge_text')
    op.drop_column('partners', 'premium_expires_at')
    op.drop_column('partners', 'premium_started_at')
    op.drop_column('partners', 'status')
    op.drop_column('partners', 'tier')
    op.drop_column('partners', 'min_commission')
    op.drop_column('partners', 'commission_rate')
    op.drop_column('partners', 'avg_response_time')
    op.drop_column('partners', 'response_rate')
    op.drop_column('partners', 'total_contract_amount')
    op.drop_column('partners', 'contract_count')
    op.drop_column('partners', 'inquiry_count')
    op.drop_column('partners', 'cover_image_url')
    op.drop_column('partners', 'price_unit')
    op.drop_column('partners', 'price_range_max')
    op.drop_column('partners', 'price_range_min')
    op.drop_column('partners', 'annual_projects')
    op.drop_column('partners', 'employee_count')
    op.drop_column('partners', 'established_year')
    op.drop_column('partners', 'sigungu')
    op.drop_column('partners', 'sido')
    op.drop_column('partners', 'address_detail')
    op.drop_column('partners', 'short_description')
    op.drop_column('partners', 'ceo_name')
    op.drop_column('partners', 'business_number')
    op.drop_column('partners', 'category_id')

    # 파트너 카테고리
    op.drop_index('ix_partner_categories_code', table_name='partner_categories')
    op.drop_table('partner_categories')
