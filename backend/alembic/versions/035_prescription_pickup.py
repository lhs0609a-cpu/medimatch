"""Prescription pickup code — 약국 magic-link / 6자리 코드 - 035"""
import asyncio
import asyncpg
import os

SQL = (
    "ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS pickup_code VARCHAR(12);\n"
    "ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS pickup_token VARCHAR(80);\n"
    "ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS pickup_expires_at TIMESTAMP;\n"
    "ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS pickup_dispensed_at TIMESTAMP;\n"
    "ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS pickup_dispensed_by VARCHAR(100);\n"
    "ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS pickup_pharmacy_name VARCHAR(200);\n"

    # patient phone 캐싱 (약국 검증용 — 마지막 4자리 매칭)
    "ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS patient_phone VARCHAR(20);\n"
    "ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS patient_name VARCHAR(100);\n"

    "CREATE UNIQUE INDEX IF NOT EXISTS ix_rx_pickup_code "
    "ON prescriptions(pickup_code) WHERE pickup_code IS NOT NULL;\n"
    "CREATE INDEX IF NOT EXISTS ix_rx_pickup_token ON prescriptions(pickup_token);\n"
)


async def run():
    db_url = os.environ.get("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    dsn = db_url.replace("postgresql+asyncpg://", "postgresql://")

    conn = await asyncpg.connect(dsn)
    try:
        await conn.execute(SQL)
        print("OK: 035_prescription_pickup migration completed")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(run())
