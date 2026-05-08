"""Lead roadmap magic-link token - 031

의사 본인이 자기 진행도를 보는 /my-roadmap 매직링크.

doctor_leads에:
- roadmap_token (UUID-like 문자열, unique)
- roadmap_token_expires_at (TIMESTAMP)
- roadmap_last_viewed_at (TIMESTAMP)
- roadmap_view_count (INTEGER)

Idempotent — 안전 재실행.
"""
import asyncio
import asyncpg
import os


COLUMN_SQL = (
    "ALTER TABLE doctor_leads ADD COLUMN IF NOT EXISTS roadmap_token VARCHAR(64);\n"
    "ALTER TABLE doctor_leads ADD COLUMN IF NOT EXISTS roadmap_token_expires_at TIMESTAMP;\n"
    "ALTER TABLE doctor_leads ADD COLUMN IF NOT EXISTS roadmap_last_viewed_at TIMESTAMP;\n"
    "ALTER TABLE doctor_leads ADD COLUMN IF NOT EXISTS roadmap_view_count INTEGER DEFAULT 0;\n"
    "CREATE UNIQUE INDEX IF NOT EXISTS ix_doctor_leads_roadmap_token "
    "ON doctor_leads(roadmap_token) WHERE roadmap_token IS NOT NULL;\n"
)


async def run():
    dsn = os.getenv("DATABASE_URL", "")
    if dsn.startswith("postgresql+asyncpg://"):
        dsn = dsn.replace("postgresql+asyncpg://", "postgresql://", 1)
    elif dsn.startswith("postgres://"):
        pass
    else:
        print("WARN  DATABASE_URL not set – skipping migration 031")
        return

    conn = await asyncpg.connect(dsn)
    try:
        for stmt in COLUMN_SQL.strip().split(";\n"):
            stmt = stmt.strip()
            if stmt:
                await conn.execute(stmt)
        print("OK  Migration 031 (lead roadmap token) applied")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(run())
