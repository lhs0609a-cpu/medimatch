"""Doctor Lead CRM tables - 027

개원의 Lead CRM:
- doctor_leads
- lead_consultations
- lead_partner_matches

Raw asyncpg pattern (alembic on Fly.io has psycopg2 issue).
Idempotent — 안전 재실행.
"""
import asyncio
import asyncpg
import os


# ===== ENUMS =====
ENUMS = [
    ("leadfunnelstage",
     "'NEW','CONTACTED','ENGAGED','QUALIFIED','PROPOSING','NEGOTIATING','CONVERTED','DORMANT','LOST'"),
    ("leadopeningstage",
     "'PLANNING','LOCATION_REVIEW','CONTRACT','LICENSING','CONSTRUCTION','EQUIPMENT','HIRING','OPENING','OPERATING'"),
    ("leadpriority",
     "'HOT','WARM','COLD','DEAD'"),
    ("contactmethod",
     "'PHONE','KAKAO','SMS','EMAIL','MEETING','OTHER'"),
    ("consultationoutcome",
     "'NO_ANSWER','REFUSED','INTERESTED','FOLLOW_UP','BOOKED_MEETING','PROPOSAL_SENT','CONVERTED','LOST'"),
    ("leadpartnermatchstatus",
     "'SUGGESTED','INTRODUCED','IN_PROGRESS','QUOTED','CONTRACTED','REJECTED'"),
]


def _enum_sql(name: str, values: str) -> str:
    return (
        "DO $$ BEGIN "
        f"CREATE TYPE {name} AS ENUM ({values}); "
        "EXCEPTION WHEN duplicate_object THEN null; "
        "END $$;"
    )


TABLES_SQL = (
    # doctor_leads
    "CREATE TABLE IF NOT EXISTS doctor_leads ("
    "id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"
    "name VARCHAR(100) NOT NULL,"
    "phone VARCHAR(30),"
    "email VARCHAR(200),"
    "license_number VARCHAR(50),"
    "specialty VARCHAR(100),"
    "sub_specialty VARCHAR(100),"
    "current_workplace VARCHAR(200),"
    "years_of_practice INTEGER,"
    "target_region_sido VARCHAR(50),"
    "target_region_sigungu VARCHAR(50),"
    "target_region_dong VARCHAR(50),"
    "target_open_date TIMESTAMP,"
    "budget_total NUMERIC(15,0),"
    "has_partner BOOLEAN DEFAULT FALSE,"
    "needs_loan BOOLEAN DEFAULT FALSE,"
    "expected_clinic_size_pyeong INTEGER,"
    "funnel_stage leadfunnelstage NOT NULL DEFAULT 'NEW',"
    "opening_stage leadopeningstage NOT NULL DEFAULT 'PLANNING',"
    "priority leadpriority NOT NULL DEFAULT 'WARM',"
    "lead_score INTEGER DEFAULT 50,"
    "readiness_score INTEGER DEFAULT 0,"
    "checklist JSONB DEFAULT '{}'::jsonb,"
    "notes TEXT,"
    "next_action VARCHAR(500),"
    "next_followup_at TIMESTAMP,"
    "last_contacted_at TIMESTAMP,"
    "source VARCHAR(50),"
    "source_campaign_id VARCHAR(36) REFERENCES campaigns(id) ON DELETE SET NULL,"
    "source_meta JSONB DEFAULT '{}'::jsonb,"
    "owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,"
    "converted_user_id UUID REFERENCES users(id) ON DELETE SET NULL,"
    "converted_project_id UUID REFERENCES opening_projects(id) ON DELETE SET NULL,"
    "converted_at TIMESTAMP,"
    "created_at TIMESTAMP DEFAULT NOW(),"
    "updated_at TIMESTAMP DEFAULT NOW()"
    ");\n"

    "CREATE INDEX IF NOT EXISTS ix_doctor_leads_phone ON doctor_leads(phone);\n"
    "CREATE INDEX IF NOT EXISTS ix_doctor_leads_specialty ON doctor_leads(specialty);\n"
    "CREATE INDEX IF NOT EXISTS ix_doctor_leads_sido ON doctor_leads(target_region_sido);\n"
    "CREATE INDEX IF NOT EXISTS ix_doctor_leads_sigungu ON doctor_leads(target_region_sigungu);\n"
    "CREATE INDEX IF NOT EXISTS ix_doctor_leads_funnel ON doctor_leads(funnel_stage);\n"
    "CREATE INDEX IF NOT EXISTS ix_doctor_leads_opening ON doctor_leads(opening_stage);\n"
    "CREATE INDEX IF NOT EXISTS ix_doctor_leads_priority ON doctor_leads(priority);\n"
    "CREATE INDEX IF NOT EXISTS ix_doctor_leads_owner ON doctor_leads(owner_user_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_doctor_leads_followup ON doctor_leads(next_followup_at);\n"
    "CREATE INDEX IF NOT EXISTS ix_doctor_leads_source ON doctor_leads(source);\n"
    "CREATE INDEX IF NOT EXISTS ix_doctor_leads_created ON doctor_leads(created_at);\n"
    "CREATE INDEX IF NOT EXISTS ix_doctor_leads_owner_funnel ON doctor_leads(owner_user_id, funnel_stage);\n"
    "CREATE INDEX IF NOT EXISTS ix_doctor_leads_priority_funnel ON doctor_leads(priority, funnel_stage);\n"

    # lead_consultations
    "CREATE TABLE IF NOT EXISTS lead_consultations ("
    "id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"
    "lead_id UUID NOT NULL REFERENCES doctor_leads(id) ON DELETE CASCADE,"
    "user_id UUID REFERENCES users(id) ON DELETE SET NULL,"
    "contact_method contactmethod DEFAULT 'PHONE',"
    "direction VARCHAR(10) DEFAULT 'OUTBOUND',"
    "duration_seconds INTEGER DEFAULT 0,"
    "summary TEXT,"
    "transcript TEXT,"
    "talked_about JSONB DEFAULT '[]'::jsonb,"
    "pain_points JSONB DEFAULT '[]'::jsonb,"
    "outcome consultationoutcome DEFAULT 'FOLLOW_UP',"
    "next_action VARCHAR(500),"
    "next_followup_at TIMESTAMP,"
    "created_at TIMESTAMP DEFAULT NOW()"
    ");\n"

    "CREATE INDEX IF NOT EXISTS ix_lead_consult_lead ON lead_consultations(lead_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_lead_consult_created ON lead_consultations(created_at);\n"

    # lead_partner_matches
    "CREATE TABLE IF NOT EXISTS lead_partner_matches ("
    "id SERIAL PRIMARY KEY,"
    "lead_id UUID NOT NULL REFERENCES doctor_leads(id) ON DELETE CASCADE,"
    "partner_id INTEGER REFERENCES partners(id) ON DELETE SET NULL,"
    "category VARCHAR(50) NOT NULL,"
    "match_reason VARCHAR(500),"
    "status leadpartnermatchstatus NOT NULL DEFAULT 'SUGGESTED',"
    "matched_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,"
    "matched_at TIMESTAMP DEFAULT NOW(),"
    "introduced_at TIMESTAMP,"
    "quoted_amount NUMERIC(15,0),"
    "contracted_amount NUMERIC(15,0),"
    "contracted_at TIMESTAMP,"
    "commission_rate NUMERIC(5,2),"
    "commission_amount NUMERIC(15,0),"
    "note TEXT,"
    "created_at TIMESTAMP DEFAULT NOW(),"
    "updated_at TIMESTAMP DEFAULT NOW()"
    ");\n"

    "CREATE INDEX IF NOT EXISTS ix_lpm_lead ON lead_partner_matches(lead_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_lpm_partner ON lead_partner_matches(partner_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_lpm_status ON lead_partner_matches(status);\n"
    "CREATE INDEX IF NOT EXISTS ix_lpm_category ON lead_partner_matches(category);\n"
    "CREATE INDEX IF NOT EXISTS ix_lpm_lead_cat ON lead_partner_matches(lead_id, category);\n"
)


async def run():
    dsn = os.getenv("DATABASE_URL", "")
    if dsn.startswith("postgresql+asyncpg://"):
        dsn = dsn.replace("postgresql+asyncpg://", "postgresql://", 1)
    elif dsn.startswith("postgres://"):
        pass
    else:
        print("WARN  DATABASE_URL not set – skipping migration 027")
        return

    conn = await asyncpg.connect(dsn)
    try:
        # 1. enums
        for name, values in ENUMS:
            await conn.execute(_enum_sql(name, values))

        # 2. tables + indexes
        for stmt in TABLES_SQL.strip().split(";\n"):
            stmt = stmt.strip()
            if stmt:
                await conn.execute(stmt)

        print("OK  Migration 027 (doctor_lead_crm) applied")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(run())
