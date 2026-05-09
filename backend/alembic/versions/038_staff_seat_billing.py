"""Staff seat billing — 사용자 ID당 과금 (PC당 X) - 038"""
import asyncio
import asyncpg
import os

DD = "$" + "$"

SQL = (
    "DO " + DD + " BEGIN CREATE TYPE staffrole AS ENUM "
    "('OWNER','DOCTOR','NURSE','COORDINATOR','RECEPTION','ASSISTANT','PHARMACIST','OTHER'); "
    "EXCEPTION WHEN duplicate_object THEN NULL; END " + DD + ";\n"

    "DO " + DD + " BEGIN CREATE TYPE staffstatus AS ENUM "
    "('ACTIVE','INACTIVE','PENDING','SUSPENDED'); "
    "EXCEPTION WHEN duplicate_object THEN NULL; END " + DD + ";\n"

    "CREATE TABLE IF NOT EXISTS staff_seats ("
    "id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"
    "owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,"   # 의원장
    "linked_user_id UUID REFERENCES users(id) ON DELETE SET NULL,"            # 별도 로그인 계정 (있다면)
    "name VARCHAR(100) NOT NULL,"
    "role staffrole NOT NULL DEFAULT 'OTHER',"
    "status staffstatus NOT NULL DEFAULT 'ACTIVE',"
    "email VARCHAR(255),"
    "phone VARCHAR(20),"
    "license_no VARCHAR(50),"     # 의사면허/간호사면허 번호
    "memo TEXT,"
    "added_at TIMESTAMP DEFAULT NOW(),"
    "deactivated_at TIMESTAMP,"
    "billable BOOLEAN NOT NULL DEFAULT TRUE,"
    "created_at TIMESTAMP DEFAULT NOW(),"
    "updated_at TIMESTAMP DEFAULT NOW()"
    ");\n"

    "CREATE INDEX IF NOT EXISTS ix_seat_owner ON staff_seats(owner_user_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_seat_status ON staff_seats(status);\n"
)


async def run():
    db_url = os.environ.get("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    dsn = db_url.replace("postgresql+asyncpg://", "postgresql://")

    conn = await asyncpg.connect(dsn)
    try:
        await conn.execute(SQL)
        print("OK: 038_staff_seat_billing migration completed")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(run())
