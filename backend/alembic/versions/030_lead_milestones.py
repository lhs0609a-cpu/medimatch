"""Lead milestones (shared timeline) - 030

공유 타임라인 — 의사·우리팀·협력사 공통 마일스톤.

idempotent.
"""
import asyncio
import asyncpg
import os


ENUMS = [
    ("milestonestatus",
     "'PLANNED','IN_PROGRESS','DONE','BLOCKED','SKIPPED'"),
    ("milestonesource",
     "'AUTO','MANUAL','PARTNER_EVENT'"),
]


def _enum_sql(name: str, values: str) -> str:
    return (
        "DO $$ BEGIN "
        f"CREATE TYPE {name} AS ENUM ({values}); "
        "EXCEPTION WHEN duplicate_object THEN null; "
        "END $$;"
    )


TABLE_SQL = (
    "CREATE TABLE IF NOT EXISTS lead_milestones ("
    "id SERIAL PRIMARY KEY,"
    "lead_id UUID NOT NULL REFERENCES doctor_leads(id) ON DELETE CASCADE,"
    "stage leadopeningstage,"
    "title VARCHAR(200) NOT NULL,"
    "description TEXT,"
    "due_at TIMESTAMP,"
    "started_at TIMESTAMP,"
    "completed_at TIMESTAMP,"
    "status milestonestatus NOT NULL DEFAULT 'PLANNED',"
    "source milestonesource DEFAULT 'MANUAL',"
    "partner_match_id INTEGER REFERENCES lead_partner_matches(id) ON DELETE SET NULL,"
    "visible_to_doctor BOOLEAN DEFAULT TRUE,"
    "visible_to_partner BOOLEAN DEFAULT TRUE,"
    "owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,"
    "order_index INTEGER DEFAULT 0,"
    "metadata_json JSONB DEFAULT '{}'::jsonb,"
    "created_at TIMESTAMP DEFAULT NOW(),"
    "updated_at TIMESTAMP DEFAULT NOW()"
    ");\n"

    "CREATE INDEX IF NOT EXISTS ix_milestone_lead ON lead_milestones(lead_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_milestone_due ON lead_milestones(due_at);\n"
    "CREATE INDEX IF NOT EXISTS ix_milestone_status ON lead_milestones(status);\n"
    "CREATE INDEX IF NOT EXISTS ix_milestone_lead_due ON lead_milestones(lead_id, due_at);\n"
    "CREATE INDEX IF NOT EXISTS ix_milestone_lead_stage ON lead_milestones(lead_id, stage);\n"
)


async def run():
    dsn = os.getenv("DATABASE_URL", "")
    if dsn.startswith("postgresql+asyncpg://"):
        dsn = dsn.replace("postgresql+asyncpg://", "postgresql://", 1)
    elif dsn.startswith("postgres://"):
        pass
    else:
        print("WARN  DATABASE_URL not set – skipping migration 030")
        return

    conn = await asyncpg.connect(dsn)
    try:
        for name, values in ENUMS:
            await conn.execute(_enum_sql(name, values))

        for stmt in TABLE_SQL.strip().split(";\n"):
            stmt = stmt.strip()
            if stmt:
                await conn.execute(stmt)
        print("OK  Migration 030 (lead milestones) applied")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(run())
