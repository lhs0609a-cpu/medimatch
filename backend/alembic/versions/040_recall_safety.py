"""Recall safety — consent_alimtalk / sent_by_user_id / indexes - 040"""
import asyncio
import asyncpg
import os

SQL = (
    # 1. Patient.consent_alimtalk — 알림톡 수신 동의 (정통망법/PIPA)
    #    consentstatus enum 재사용 (NOT_ASKED/CONSENTED/PARTIAL/REFUSED)
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS consent_alimtalk consentstatus NOT NULL DEFAULT 'NOT_ASKED';\n"

    # 2. Patient soft delete
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;\n"

    # 3. RecallSend.sent_by_user_id — 실제 발송자(원장 vs 직원) 추적
    "ALTER TABLE recall_sends ADD COLUMN IF NOT EXISTS sent_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;\n"
    "ALTER TABLE recall_sends ADD COLUMN IF NOT EXISTS sent_by_role VARCHAR(20);\n"

    # 4. 성능 인덱스
    "CREATE INDEX IF NOT EXISTS ix_patient_user_appointment "
    "ON patients(user_id, appointment_date DESC);\n"
    "CREATE INDEX IF NOT EXISTS ix_rcs_patient_created "
    "ON recall_sends(patient_id, created_at DESC);\n"
    "CREATE INDEX IF NOT EXISTS ix_rcs_user_created "
    "ON recall_sends(user_id, created_at DESC);\n"
)


async def run():
    db_url = os.environ.get("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    dsn = db_url.replace("postgresql+asyncpg://", "postgresql://")

    conn = await asyncpg.connect(dsn)
    try:
        await conn.execute(SQL)
        print("OK: 040_recall_safety migration completed")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(run())
