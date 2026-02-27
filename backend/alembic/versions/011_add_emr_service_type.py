"""Add EMR to servicetype enum

Revision ID: 011
"""
import asyncio
import asyncpg
import os


async def run():
    db_url = os.environ.get("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    # asyncpg needs the raw DSN without the +asyncpg driver
    dsn = db_url.replace("postgresql+asyncpg://", "postgresql://").replace("postgresql://", "postgresql://")

    conn = await asyncpg.connect(dsn)
    try:
        await conn.execute("ALTER TYPE servicetype ADD VALUE IF NOT EXISTS 'EMR'")
        print("OK: Added 'EMR' to servicetype enum")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(run())
