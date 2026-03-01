"""Contact inquiries table - 020

문의/상담 통합 저장 테이블
"""
import asyncio
import asyncpg
import os

SQL = (
    # ===== contact_inquiries =====
    "CREATE TABLE IF NOT EXISTS contact_inquiries ("
    "id SERIAL PRIMARY KEY,"
    "name VARCHAR(100) NOT NULL,"
    "email VARCHAR(200),"
    "phone VARCHAR(20),"
    "message TEXT,"
    "contact_type VARCHAR(30) NOT NULL,"
    "status VARCHAR(20) DEFAULT 'NEW',"
    "created_at TIMESTAMP DEFAULT NOW(),"
    "updated_at TIMESTAMP DEFAULT NOW(),"
    "specialty VARCHAR(100),"
    "area INTEGER,"
    "region VARCHAR(200),"
    "need_loan VARCHAR(20),"
    "interests TEXT,"
    "admin_note TEXT,"
    "subject VARCHAR(200),"
    "admin_reply TEXT,"
    "replied_at TIMESTAMP"
    ");\n"

    "CREATE INDEX IF NOT EXISTS ix_contact_inquiry_type ON contact_inquiries(contact_type);\n"
    "CREATE INDEX IF NOT EXISTS ix_contact_inquiry_status ON contact_inquiries(status);\n"
    "CREATE INDEX IF NOT EXISTS ix_contact_inquiry_created ON contact_inquiries(created_at);\n"
)


async def run():
    dsn = os.getenv("DATABASE_URL", "")
    if dsn.startswith("postgresql+asyncpg://"):
        dsn = dsn.replace("postgresql+asyncpg://", "postgresql://", 1)
    elif dsn.startswith("postgres://"):
        pass
    else:
        print("⚠️  DATABASE_URL not set – skipping migration 020")
        return

    conn = await asyncpg.connect(dsn)
    try:
        for stmt in SQL.strip().split(";\n"):
            stmt = stmt.strip()
            if stmt:
                await conn.execute(stmt)
        print("✅ Migration 020 (contact_inquiries) applied")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(run())
