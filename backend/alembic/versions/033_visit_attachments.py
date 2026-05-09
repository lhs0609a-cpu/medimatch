"""Visit attachments — 폰 카메라 → 차트 사진 첨부 - 033"""
import asyncio
import asyncpg
import os

DD = "$" + "$"

SQL = (
    "DO " + DD + " BEGIN CREATE TYPE attachmenttype AS ENUM "
    "('PHOTO','DOC','SCAN','OTHER'); "
    "EXCEPTION WHEN duplicate_object THEN NULL; END " + DD + ";\n"

    "CREATE TABLE IF NOT EXISTS visit_attachments ("
    "id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"
    "user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,"
    "visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,"
    "patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,"

    "file_name VARCHAR(255) NOT NULL,"
    "file_url TEXT NOT NULL,"           # 상대 또는 절대 URL
    "thumbnail_url TEXT,"
    "mime_type VARCHAR(100),"
    "size_bytes BIGINT,"
    "attachment_type attachmenttype NOT NULL DEFAULT 'PHOTO',"
    "description TEXT,"
    "taken_at TIMESTAMP,"
    "uploaded_at TIMESTAMP DEFAULT NOW(),"

    # 어떤 토큰으로 업로드됐는지 (감사용)
    "upload_token_hash VARCHAR(80),"

    "created_at TIMESTAMP DEFAULT NOW()"
    ");\n"

    "CREATE INDEX IF NOT EXISTS ix_va_visit ON visit_attachments(visit_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_va_user ON visit_attachments(user_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_va_patient ON visit_attachments(patient_id);\n"

    # 업로드 토큰 (의사 폰으로 보낸 magic-link)
    "CREATE TABLE IF NOT EXISTS visit_upload_tokens ("
    "token VARCHAR(80) PRIMARY KEY,"
    "user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,"
    "visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,"
    "patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,"
    "label VARCHAR(100),"               # 의사가 토큰에 붙인 메모 (예: '환부')
    "expires_at TIMESTAMP NOT NULL,"
    "max_uploads INTEGER NOT NULL DEFAULT 20,"
    "used_count INTEGER NOT NULL DEFAULT 0,"
    "created_at TIMESTAMP DEFAULT NOW()"
    ");\n"

    "CREATE INDEX IF NOT EXISTS ix_vut_visit ON visit_upload_tokens(visit_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_vut_user ON visit_upload_tokens(user_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_vut_expires ON visit_upload_tokens(expires_at);\n"
)


async def run():
    db_url = os.environ.get("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    dsn = db_url.replace("postgresql+asyncpg://", "postgresql://")

    conn = await asyncpg.connect(dsn)
    try:
        await conn.execute(SQL)
        print("OK: 033_visit_attachments migration completed")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(run())
