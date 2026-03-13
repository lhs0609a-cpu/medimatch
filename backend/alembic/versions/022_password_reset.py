"""Password reset token fields - 022"""
import asyncio
import asyncpg
import os

SQL = (
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(100);\n"
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;\n"
    "CREATE INDEX IF NOT EXISTS ix_users_reset_token ON users(reset_token);\n"
)

async def run():
    dsn = os.getenv("DATABASE_URL", "")
    if dsn.startswith("postgresql+asyncpg://"):
        dsn = dsn.replace("postgresql+asyncpg://", "postgresql://", 1)
    elif dsn.startswith("postgres://"):
        pass
    else:
        print("Warning: DATABASE_URL not set - skipping migration 022")
        return
    conn = await asyncpg.connect(dsn)
    try:
        for stmt in SQL.strip().split(";\n"):
            stmt = stmt.strip()
            if stmt:
                await conn.execute(stmt)
        print("Migration 022 (password_reset) applied")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(run())
