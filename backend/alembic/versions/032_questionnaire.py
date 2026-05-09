"""Questionnaire (사전문진) — 카톡 magic-link → SOAP prefill - 032"""
import asyncio
import asyncpg
import os

DD = "$" + "$"

SQL = (
    "DO " + DD + " BEGIN CREATE TYPE questionnairestatus AS ENUM "
    "('SENT','OPENED','SUBMITTED','CONSUMED','EXPIRED'); "
    "EXCEPTION WHEN duplicate_object THEN NULL; END " + DD + ";\n"

    "CREATE TABLE IF NOT EXISTS questionnaire_responses ("
    "id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"
    "user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,"
    "appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,"
    "patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,"
    "patient_name VARCHAR(100),"
    "patient_phone VARCHAR(20),"
    "token VARCHAR(80) NOT NULL UNIQUE,"
    "expires_at TIMESTAMP NOT NULL,"
    "template_code VARCHAR(40) NOT NULL DEFAULT 'GENERAL_V1',"
    "status questionnairestatus NOT NULL DEFAULT 'SENT',"
    "sent_at TIMESTAMP DEFAULT NOW(),"
    "opened_at TIMESTAMP,"
    "submitted_at TIMESTAMP,"
    "consumed_at TIMESTAMP,"

    # 구조화 응답 — 차트 SOAP/Patient에 자동 매핑
    "chief_complaint TEXT,"      # 주증상
    "onset TEXT,"                # 언제부터
    "severity INTEGER,"          # 통증 점수 0~10
    "accompanying TEXT,"         # 동반증상 (콤마 구분 또는 요약)
    "past_history TEXT,"         # 과거력
    "allergies TEXT,"            # 알레르기
    "current_meds TEXT,"         # 현재 복용약
    "smoking VARCHAR(20),"       # 비흡연/금연/흡연
    "alcohol VARCHAR(20),"       # 비음주/가끔/자주
    "family_history TEXT,"
    "note TEXT,"                  # 자유 메모

    "raw_answers JSONB DEFAULT '{}'::jsonb,"

    "delivery_provider VARCHAR(20),"
    "delivery_status VARCHAR(40),"

    "created_at TIMESTAMP DEFAULT NOW(),"
    "updated_at TIMESTAMP DEFAULT NOW()"
    ");\n"

    "CREATE INDEX IF NOT EXISTS ix_qr_user ON questionnaire_responses(user_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_qr_patient ON questionnaire_responses(patient_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_qr_appointment ON questionnaire_responses(appointment_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_qr_status ON questionnaire_responses(status);\n"
    "CREATE INDEX IF NOT EXISTS ix_qr_phone ON questionnaire_responses(patient_phone);\n"
    "CREATE INDEX IF NOT EXISTS ix_qr_sent ON questionnaire_responses(sent_at);\n"
)


async def run():
    db_url = os.environ.get("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    dsn = db_url.replace("postgresql+asyncpg://", "postgresql://")

    conn = await asyncpg.connect(dsn)
    try:
        await conn.execute(SQL)
        print("OK: 032_questionnaire migration completed")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(run())
