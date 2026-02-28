"""Opening project + tasks migration - 018"""
import asyncio
import asyncpg
import os

SQL = (
    # ===== Create ENUM type =====
    "DO $$ BEGIN CREATE TYPE projectstatus AS ENUM "
    "('PLANNING','LICENSING','CONSTRUCTION','EQUIPMENT','HIRING','MARKETING','OPENING','COMPLETED'); "
    "EXCEPTION WHEN duplicate_object THEN NULL; END $$;\n"

    # ===== opening_projects =====
    "CREATE TABLE IF NOT EXISTS opening_projects ("
    "id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"
    "user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,"
    "title VARCHAR(200),"
    "specialty VARCHAR(100),"
    "target_date TIMESTAMP,"
    "status projectstatus DEFAULT 'PLANNING',"
    "budget_total BIGINT,"
    "budget_spent BIGINT DEFAULT 0,"
    "location_address VARCHAR(500),"
    "notes TEXT,"
    "created_at TIMESTAMP DEFAULT NOW(),"
    "updated_at TIMESTAMP DEFAULT NOW()"
    ");\n"

    "CREATE INDEX IF NOT EXISTS ix_opening_project_user ON opening_projects(user_id);\n"

    # ===== opening_project_tasks =====
    "CREATE TABLE IF NOT EXISTS opening_project_tasks ("
    "id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"
    "project_id UUID NOT NULL REFERENCES opening_projects(id) ON DELETE CASCADE,"
    "phase_id INTEGER NOT NULL,"
    "subtask_id VARCHAR(10) NOT NULL,"
    "is_completed BOOLEAN DEFAULT FALSE,"
    "completed_at TIMESTAMP,"
    "actual_cost BIGINT,"
    "memo TEXT"
    ");\n"

    "CREATE INDEX IF NOT EXISTS ix_opening_task_project ON opening_project_tasks(project_id);\n"
    "CREATE UNIQUE INDEX IF NOT EXISTS ix_opening_task_subtask ON opening_project_tasks(project_id, subtask_id);\n"
)


async def run():
    dsn = os.getenv("DATABASE_URL", "")
    if dsn.startswith("postgresql+asyncpg://"):
        dsn = dsn.replace("postgresql+asyncpg://", "postgresql://", 1)
    elif dsn.startswith("postgres://"):
        pass
    else:
        print("⚠️  DATABASE_URL not set – skipping migration 018")
        return

    conn = await asyncpg.connect(dsn)
    try:
        for stmt in SQL.strip().split(";\n"):
            stmt = stmt.strip()
            if stmt:
                await conn.execute(stmt)
        print("✅ Migration 018 (opening_project) applied")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(run())
