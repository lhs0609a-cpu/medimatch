"""Campaign table migration - 024"""
import asyncio
import asyncpg
import os

SQL = (
    "DO $$ BEGIN "
    "IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaignstatus') THEN "
    "CREATE TYPE campaignstatus AS ENUM ('PENDING','SCHEDULED','RUNNING','COMPLETED','FAILED'); "
    "END IF; END $$;\n"
    "DO $$ BEGIN "
    "IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaigntype') THEN "
    "CREATE TYPE campaigntype AS ENUM ('SMS','EMAIL'); "
    "END IF; END $$;\n"
    "CREATE TABLE IF NOT EXISTS campaigns ("
    "id VARCHAR(36) PRIMARY KEY, "
    "user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, "
    "name VARCHAR(200) NOT NULL, "
    "campaign_type campaigntype NOT NULL, "
    "target_grade VARCHAR(10) NOT NULL, "
    "status campaignstatus DEFAULT 'PENDING', "
    "scheduled_time VARCHAR(50), "
    "total_targets INTEGER DEFAULT 0, "
    "sent_count INTEGER DEFAULT 0, "
    "delivered_count INTEGER DEFAULT 0, "
    "failed_count INTEGER DEFAULT 0, "
    "message_template TEXT, "
    "campaign_metadata JSONB DEFAULT '{}', "
    "created_at TIMESTAMP DEFAULT NOW(), "
    "completed_at TIMESTAMP"
    ");\n"
    "CREATE INDEX IF NOT EXISTS ix_campaign_user ON campaigns(user_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_campaign_status ON campaigns(status);\n"
    "CREATE INDEX IF NOT EXISTS ix_campaign_type ON campaigns(campaign_type);\n"
    "CREATE INDEX IF NOT EXISTS ix_campaign_created ON campaigns(created_at);\n"
)


async def run():
    dsn = os.getenv("DATABASE_URL", "")
    if dsn.startswith("postgresql+asyncpg://"):
        dsn = dsn.replace("postgresql+asyncpg://", "postgresql://", 1)
    elif dsn.startswith("postgres://"):
        pass
    else:
        print("WARNING: DATABASE_URL not set - skipping migration 024")
        return
    conn = await asyncpg.connect(dsn)
    try:
        for stmt in SQL.strip().split(";\n"):
            stmt = stmt.strip()
            if stmt:
                await conn.execute(stmt)
        print("OK: Migration 024 (campaign) applied")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(run())
