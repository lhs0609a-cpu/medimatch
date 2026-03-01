"""Opening project v2 migration - 019"""
import asyncio
import asyncpg
import os

SQL = (
    "ALTER TABLE opening_projects ADD COLUMN IF NOT EXISTS wizard_completed BOOLEAN DEFAULT FALSE;\n"
    "ALTER TABLE opening_projects ADD COLUMN IF NOT EXISTS template_applied VARCHAR(50);\n"
    "ALTER TABLE opening_projects ADD COLUMN IF NOT EXISTS phase_deadlines JSONB;\n"
    "ALTER TABLE opening_projects ADD COLUMN IF NOT EXISTS region_code VARCHAR(20);\n"
)


async def run():
    dsn = os.getenv("DATABASE_URL", "")
    if dsn.startswith("postgresql+asyncpg://"):
        dsn = dsn.replace("postgresql+asyncpg://", "postgresql://", 1)
    elif dsn.startswith("postgres://"):
        pass
    else:
        print("\u26a0\ufe0f  DATABASE_URL not set \u2013 skipping migration 019")
        return

    conn = await asyncpg.connect(dsn)
    try:
        for stmt in SQL.strip().split(";\n"):
            stmt = stmt.strip()
            if stmt:
                await conn.execute(stmt)
        print("\u2705 Migration 019 (opening_project_v2) applied")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(run())
