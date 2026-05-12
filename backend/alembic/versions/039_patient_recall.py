"""Patient recall / CRM campaigns - 039"""
import asyncio
import asyncpg
import os

DD = "$" + "$"

SQL = (
    "DO " + DD + " BEGIN CREATE TYPE recallcampaignstatus AS ENUM "
    "('DRAFT','SCHEDULED','ACTIVE','COMPLETED','CANCELLED'); "
    "EXCEPTION WHEN duplicate_object THEN NULL; END " + DD + ";\n"

    "DO " + DD + " BEGIN CREATE TYPE recallsendstatus AS ENUM "
    "('PENDING','SENT','FAILED','OPENED','RESPONDED','BOOKED','NO_RESPONSE'); "
    "EXCEPTION WHEN duplicate_object THEN NULL; END " + DD + ";\n"

    "DO " + DD + " BEGIN CREATE TYPE recallchannel AS ENUM "
    "('KAKAO','SMS','BOTH'); "
    "EXCEPTION WHEN duplicate_object THEN NULL; END " + DD + ";\n"

    "CREATE TABLE IF NOT EXISTS recall_campaigns ("
    "id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"
    "user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,"
    "name VARCHAR(200) NOT NULL,"
    "target_group VARCHAR(100) NOT NULL DEFAULT 'chronic',"
    "channel recallchannel NOT NULL DEFAULT 'KAKAO',"
    "message_template TEXT,"
    "status recallcampaignstatus NOT NULL DEFAULT 'DRAFT',"
    "scheduled_at TIMESTAMP,"
    "started_at TIMESTAMP,"
    "completed_at TIMESTAMP,"
    "target_count INTEGER NOT NULL DEFAULT 0,"
    "sent_count INTEGER NOT NULL DEFAULT 0,"
    "opened_count INTEGER NOT NULL DEFAULT 0,"
    "booked_count INTEGER NOT NULL DEFAULT 0,"
    "created_at TIMESTAMP DEFAULT NOW(),"
    "updated_at TIMESTAMP DEFAULT NOW()"
    ");\n"

    "CREATE INDEX IF NOT EXISTS ix_rcm_user ON recall_campaigns(user_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_rcm_status ON recall_campaigns(status);\n"

    "CREATE TABLE IF NOT EXISTS recall_sends ("
    "id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"
    "user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,"
    "campaign_id UUID REFERENCES recall_campaigns(id) ON DELETE SET NULL,"
    "patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,"
    "patient_name VARCHAR(100),"
    "phone VARCHAR(20),"
    "reason VARCHAR(200),"
    "priority VARCHAR(10) DEFAULT 'medium',"
    "channel recallchannel NOT NULL DEFAULT 'KAKAO',"
    "status recallsendstatus NOT NULL DEFAULT 'PENDING',"
    "provider_status VARCHAR(50),"
    "provider_message TEXT,"
    "sent_at TIMESTAMP,"
    "responded_at TIMESTAMP,"
    "booked_at TIMESTAMP,"
    "last_visit_date DATE,"
    "days_since_last_visit INTEGER,"
    "created_at TIMESTAMP DEFAULT NOW(),"
    "updated_at TIMESTAMP DEFAULT NOW()"
    ");\n"

    "CREATE INDEX IF NOT EXISTS ix_rcs_user ON recall_sends(user_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_rcs_campaign ON recall_sends(campaign_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_rcs_status ON recall_sends(status);\n"
    "CREATE INDEX IF NOT EXISTS ix_rcs_patient ON recall_sends(patient_id);\n"
)


async def run():
    db_url = os.environ.get("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    dsn = db_url.replace("postgresql+asyncpg://", "postgresql://")

    conn = await asyncpg.connect(dsn)
    try:
        await conn.execute(SQL)
        print("OK: 039_patient_recall migration completed")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(run())
