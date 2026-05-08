"""Lead partner match quote details - 029

견적 자동 비교 매트릭스용 컬럼 추가:
- quoted_at      (견적 입력 시점)
- quote_details  (JSONB — 공기·보증·포함/제외·납기·유효기간 등)

idempotent.
"""
import asyncio
import asyncpg
import os


SQL = (
    "ALTER TABLE lead_partner_matches "
    "ADD COLUMN IF NOT EXISTS quoted_at TIMESTAMP;\n"

    "ALTER TABLE lead_partner_matches "
    "ADD COLUMN IF NOT EXISTS quote_details JSONB DEFAULT '{}'::jsonb;\n"
)


async def run():
    dsn = os.getenv("DATABASE_URL", "")
    if dsn.startswith("postgresql+asyncpg://"):
        dsn = dsn.replace("postgresql+asyncpg://", "postgresql://", 1)
    elif dsn.startswith("postgres://"):
        pass
    else:
        print("WARN  DATABASE_URL not set – skipping migration 029")
        return

    conn = await asyncpg.connect(dsn)
    try:
        for stmt in SQL.strip().split(";\n"):
            stmt = stmt.strip()
            if stmt:
                await conn.execute(stmt)
        print("OK  Migration 029 (lead quote details) applied")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(run())
