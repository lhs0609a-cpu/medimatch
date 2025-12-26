"""PharmMatch v2 - Anonymous Matching Tables

Revision ID: 001_pharmacy_match
Revises:
Create Date: 2024-12-23

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_pharmacy_match'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Anonymous Listings Table
    op.create_table(
        'anonymous_listings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('anonymous_id', sa.String(50), unique=True, nullable=False, index=True),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),

        # Public Info
        sa.Column('region_code', sa.String(10), nullable=False, index=True),
        sa.Column('region_name', sa.String(100), nullable=False),
        sa.Column('pharmacy_type', sa.String(20), default='GENERAL'),
        sa.Column('nearby_hospital_types', postgresql.ARRAY(sa.String), default=[]),

        # Revenue Info
        sa.Column('monthly_revenue_min', sa.BigInteger, nullable=True),
        sa.Column('monthly_revenue_max', sa.BigInteger, nullable=True),
        sa.Column('monthly_rx_count', sa.Integer, nullable=True),

        # Area
        sa.Column('area_pyeong_min', sa.Float, nullable=True),
        sa.Column('area_pyeong_max', sa.Float, nullable=True),

        # Price (만원)
        sa.Column('premium_min', sa.Integer, nullable=True),
        sa.Column('premium_max', sa.Integer, nullable=True),
        sa.Column('monthly_rent', sa.Integer, nullable=True),
        sa.Column('deposit', sa.Integer, nullable=True),

        # Pharmacy Info
        sa.Column('transfer_reason', sa.String(20), nullable=True),
        sa.Column('operation_years', sa.Integer, nullable=True),
        sa.Column('employee_count', sa.Integer, default=0),

        # Facilities
        sa.Column('has_auto_dispenser', sa.Boolean, default=False),
        sa.Column('has_parking', sa.Boolean, default=False),
        sa.Column('floor_info', sa.String(50), nullable=True),

        # Description (masked)
        sa.Column('description', sa.Text, nullable=True),

        # Private Info (revealed after match)
        sa.Column('exact_address', sa.String(500), nullable=False),
        sa.Column('pharmacy_name', sa.String(200), nullable=True),
        sa.Column('owner_phone', sa.String(20), nullable=True),
        sa.Column('latitude', sa.Float, nullable=True),
        sa.Column('longitude', sa.Float, nullable=True),

        # Metadata
        sa.Column('status', sa.String(20), default='DRAFT'),
        sa.Column('view_count', sa.Integer, default=0),
        sa.Column('interest_count', sa.Integer, default=0),
        sa.Column('expires_at', sa.DateTime, nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    op.create_index('ix_anonymous_listings_status_region', 'anonymous_listings', ['status', 'region_code'])
    op.create_index('ix_anonymous_listings_premium', 'anonymous_listings', ['premium_min', 'premium_max'])

    # Pharmacist Profiles Table
    op.create_table(
        'pharmacist_profiles',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False, unique=True),
        sa.Column('anonymous_id', sa.String(50), unique=True, nullable=False, index=True),

        # Public Info
        sa.Column('preferred_regions', postgresql.ARRAY(sa.String), default=[]),
        sa.Column('preferred_region_names', postgresql.ARRAY(sa.String), default=[]),

        # Budget (만원)
        sa.Column('budget_min', sa.Integer, nullable=True),
        sa.Column('budget_max', sa.Integer, nullable=True),

        # Preferred Area (평)
        sa.Column('preferred_area_min', sa.Float, nullable=True),
        sa.Column('preferred_area_max', sa.Float, nullable=True),

        # Preferred Revenue (원)
        sa.Column('preferred_revenue_min', sa.BigInteger, nullable=True),
        sa.Column('preferred_revenue_max', sa.BigInteger, nullable=True),

        # Experience
        sa.Column('experience_years', sa.Integer, default=0),
        sa.Column('license_year', sa.Integer, nullable=True),
        sa.Column('has_management_experience', sa.Boolean, default=False),

        # Preferences
        sa.Column('specialty_areas', postgresql.ARRAY(sa.String), default=[]),
        sa.Column('preferred_pharmacy_types', postgresql.ARRAY(sa.String), default=[]),
        sa.Column('preferred_hospital_types', postgresql.ARRAY(sa.String), default=[]),

        # Introduction (masked)
        sa.Column('introduction', sa.Text, nullable=True),

        # Private Info
        sa.Column('full_name', sa.String(100), nullable=True),
        sa.Column('phone', sa.String(20), nullable=True),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('license_number', sa.String(50), nullable=True),

        # Metadata
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('last_active_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # Interests Table
    op.create_table(
        'interests',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('listing_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('anonymous_listings.id'), nullable=False),
        sa.Column('pharmacist_profile_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('pharmacist_profiles.id'), nullable=False),
        sa.Column('interest_type', sa.String(10), nullable=False),  # L2P or P2L
        sa.Column('expressed_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('message', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_index('ix_interests_listing_pharmacist', 'interests', ['listing_id', 'pharmacist_profile_id'])
    op.create_index('ix_interests_type', 'interests', ['interest_type'])

    # Matches Table
    op.create_table(
        'matches',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('listing_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('anonymous_listings.id'), nullable=False),
        sa.Column('pharmacist_profile_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('pharmacist_profiles.id'), nullable=False),

        # Interest References
        sa.Column('listing_interest_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('interests.id'), nullable=True),
        sa.Column('pharmacist_interest_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('interests.id'), nullable=True),

        # Match Info
        sa.Column('status', sa.String(20), default='PENDING'),
        sa.Column('match_score', sa.Float, nullable=True),
        sa.Column('match_score_breakdown', postgresql.JSONB, nullable=True),

        # Timeline
        sa.Column('contact_revealed_at', sa.DateTime, nullable=True),
        sa.Column('first_message_at', sa.DateTime, nullable=True),
        sa.Column('meeting_scheduled_at', sa.DateTime, nullable=True),
        sa.Column('contracted_at', sa.DateTime, nullable=True),
        sa.Column('cancelled_at', sa.DateTime, nullable=True),
        sa.Column('cancel_reason', sa.Text, nullable=True),

        # Commission
        sa.Column('commission_rate', sa.Float, default=3.0),
        sa.Column('commission_amount', sa.Integer, nullable=True),
        sa.Column('commission_paid', sa.Boolean, default=False),
        sa.Column('commission_paid_at', sa.DateTime, nullable=True),

        # Metadata
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    op.create_index('ix_matches_listing_pharmacist', 'matches', ['listing_id', 'pharmacist_profile_id'], unique=True)
    op.create_index('ix_matches_status', 'matches', ['status'])

    # Match Messages Table
    op.create_table(
        'match_messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('match_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('matches.id'), nullable=False),
        sa.Column('sender_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('content', sa.Text, nullable=False),
        sa.Column('is_read', sa.Boolean, default=False),
        sa.Column('read_at', sa.DateTime, nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_index('ix_match_messages_match_created', 'match_messages', ['match_id', 'created_at'])


def downgrade() -> None:
    op.drop_table('match_messages')
    op.drop_table('matches')
    op.drop_table('interests')
    op.drop_table('pharmacist_profiles')
    op.drop_table('anonymous_listings')
