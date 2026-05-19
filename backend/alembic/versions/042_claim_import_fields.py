"""InsuranceClaim 임포트 필드 — 042

기존 무료 EMR(의사랑/닥터팔레트/굿닥/비트)에서 청구내역을 통째 임포트하여
*사후 누락 검출(잃어버린 돈 찾기)* 을 돌리기 위한 추적 키.

- external_id: 원천 EMR의 청구번호/접수번호
- source_emr: 원천 EMR 식별자
- import_batch_id: 배치 단위 롤백·감사
- imported_at: 임포트 시각
- deleted_at: soft delete (의료법 5년 보존)
- audit_status: 누락 검출 상태 (NULL/SCANNED/RECOVERED/IGNORED)
- audit_potential_amount: 검출된 회수 가능 금액 추정
- audit_findings: 검출 항목 상세 (JSONB)

unique (user_id, source_emr, external_id) — 같은 출처 같은 청구 두 번 임포트 차단.
"""
import asyncio
import asyncpg
import os

SQL = (
    "ALTER TABLE insurance_claims ADD COLUMN IF NOT EXISTS external_id VARCHAR(100);\n"
    "ALTER TABLE insurance_claims ADD COLUMN IF NOT EXISTS source_emr VARCHAR(50);\n"
    "ALTER TABLE insurance_claims ADD COLUMN IF NOT EXISTS import_batch_id UUID;\n"
    "ALTER TABLE insurance_claims ADD COLUMN IF NOT EXISTS imported_at TIMESTAMP;\n"
    "ALTER TABLE insurance_claims ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;\n"

    "ALTER TABLE insurance_claims ADD COLUMN IF NOT EXISTS audit_status VARCHAR(20);\n"
    "ALTER TABLE insurance_claims ADD COLUMN IF NOT EXISTS audit_potential_amount BIGINT DEFAULT 0;\n"
    "ALTER TABLE insurance_claims ADD COLUMN IF NOT EXISTS audit_findings JSONB DEFAULT '[]';\n"
    "ALTER TABLE insurance_claims ADD COLUMN IF NOT EXISTS audit_scanned_at TIMESTAMP;\n"

    "CREATE UNIQUE INDEX IF NOT EXISTS ux_claim_user_source_external "
    "ON insurance_claims(user_id, source_emr, external_id) "
    "WHERE source_emr IS NOT NULL AND external_id IS NOT NULL;\n"

    "CREATE INDEX IF NOT EXISTS ix_claim_import_batch "
    "ON insurance_claims(import_batch_id) WHERE import_batch_id IS NOT NULL;\n"

    "CREATE INDEX IF NOT EXISTS ix_claim_audit_status "
    "ON insurance_claims(audit_status) WHERE audit_status IS NOT NULL;\n"

    "CREATE INDEX IF NOT EXISTS ix_claim_deleted "
    "ON insurance_claims(deleted_at) WHERE deleted_at IS NULL;\n"
)


async def run():
    db_url = os.environ.get("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    dsn = db_url.replace("postgresql+asyncpg://", "postgresql://")

    conn = await asyncpg.connect(dsn)
    try:
        await conn.execute(SQL)
        print("OK: 042_claim_import_fields migration completed")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(run())
