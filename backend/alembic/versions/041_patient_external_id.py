"""Patient external_id / source_emr / external_meta — 041

기존 무료 CRM/EMR(의사랑·닥터팔레트·비트·두번째뇌·굿닥 등)에서
환자 데이터를 자동 매핑으로 옮길 때 중복 방지·역추적·재동기화의 기준키.

- external_id: 원천 시스템의 차트번호/환자코드 (사람이 읽을 수 있는 문자열)
- source_emr: 원천 EMR 식별자 (예: 'usarang', 'docpalette', 'bit', 'unknown', 'manual_csv')
- external_meta: 매핑되지 않은 컬럼을 손실 없이 보존 (JSONB)

unique (user_id, source_emr, external_id) — 같은 출처의 같은 차트 두 번 임포트 차단.
"""
import asyncio
import asyncpg
import os

SQL = (
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS external_id VARCHAR(100);\n"
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS source_emr VARCHAR(50);\n"
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS external_meta JSONB;\n"
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS imported_at TIMESTAMP;\n"
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS import_batch_id UUID;\n"

    "CREATE UNIQUE INDEX IF NOT EXISTS ux_patient_user_source_external "
    "ON patients(user_id, source_emr, external_id) "
    "WHERE source_emr IS NOT NULL AND external_id IS NOT NULL;\n"

    "CREATE INDEX IF NOT EXISTS ix_patient_import_batch "
    "ON patients(import_batch_id) WHERE import_batch_id IS NOT NULL;\n"
)


async def run():
    db_url = os.environ.get("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    dsn = db_url.replace("postgresql+asyncpg://", "postgresql://")

    conn = await asyncpg.connect(dsn)
    try:
        await conn.execute(SQL)
        print("OK: 041_patient_external_id migration completed")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(run())
