"""External appointments inbox — 똑닥/굿닥/네이버 webhook 통합 - 034"""
import asyncio
import asyncpg
import os

DD = "$" + "$"

SQL = (
    "DO " + DD + " BEGIN CREATE TYPE extapptchannel AS ENUM "
    "('DDOCDOC','GOODOC','NAVER','KAKAO','MANUAL','OTHER'); "
    "EXCEPTION WHEN duplicate_object THEN NULL; END " + DD + ";\n"

    "DO " + DD + " BEGIN CREATE TYPE extapptstatus AS ENUM "
    "('PENDING','CONFIRMED','REJECTED','CONFLICT','EXPIRED','CANCELLED_BY_CHANNEL'); "
    "EXCEPTION WHEN duplicate_object THEN NULL; END " + DD + ";\n"

    "CREATE TABLE IF NOT EXISTS external_appointments ("
    "id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"
    "user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,"
    "channel extapptchannel NOT NULL,"
    "external_id VARCHAR(100),"
    "patient_name VARCHAR(100) NOT NULL,"
    "patient_phone VARCHAR(20),"
    "patient_birth DATE,"
    "doctor_name VARCHAR(100),"
    "requested_start TIMESTAMP NOT NULL,"
    "duration_min INTEGER NOT NULL DEFAULT 15,"
    "chief_complaint TEXT,"
    "memo TEXT,"
    "raw_payload JSONB DEFAULT '{}'::jsonb,"
    "status extapptstatus NOT NULL DEFAULT 'PENDING',"
    "conflict_with UUID REFERENCES appointments(id) ON DELETE SET NULL,"
    "linked_appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,"
    "received_at TIMESTAMP DEFAULT NOW(),"
    "decided_at TIMESTAMP,"
    "decided_by UUID REFERENCES users(id) ON DELETE SET NULL,"
    "rejection_reason TEXT,"
    "created_at TIMESTAMP DEFAULT NOW(),"
    "updated_at TIMESTAMP DEFAULT NOW(),"
    "UNIQUE (user_id, channel, external_id)"
    ");\n"

    "CREATE INDEX IF NOT EXISTS ix_extappt_user_status ON external_appointments(user_id, status);\n"
    "CREATE INDEX IF NOT EXISTS ix_extappt_channel ON external_appointments(channel);\n"
    "CREATE INDEX IF NOT EXISTS ix_extappt_received ON external_appointments(received_at);\n"
    "CREATE INDEX IF NOT EXISTS ix_extappt_start ON external_appointments(requested_start);\n"
)


async def run():
    db_url = os.environ.get("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    dsn = db_url.replace("postgresql+asyncpg://", "postgresql://")

    conn = await asyncpg.connect(dsn)
    try:
        await conn.execute(SQL)
        print("OK: 034_external_appointments migration completed")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(run())
