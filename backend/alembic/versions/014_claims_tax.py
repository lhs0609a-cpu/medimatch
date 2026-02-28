"""claims and tax correction migration - 014"""
import asyncio
import asyncpg
import os

SQL = (
    # ===== Enums =====
    "DO " + "$" + "$ BEGIN CREATE TYPE claimstatus AS ENUM "
    "('DRAFT','READY','SUBMITTED','ACCEPTED','REJECTED','PARTIAL'); "
    "EXCEPTION WHEN duplicate_object THEN NULL; END " + "$" + "$;\n"

    "DO " + "$" + "$ BEGIN CREATE TYPE risklevel AS ENUM "
    "('LOW','MEDIUM','HIGH'); "
    "EXCEPTION WHEN duplicate_object THEN NULL; END " + "$" + "$;\n"

    "DO " + "$" + "$ BEGIN CREATE TYPE claimitype AS ENUM "
    "('DIAGNOSIS','TREATMENT','MEDICATION'); "
    "EXCEPTION WHEN duplicate_object THEN NULL; END " + "$" + "$;\n"

    "DO " + "$" + "$ BEGIN CREATE TYPE taxcorrectionstatus AS ENUM "
    "('DRAFT','PENDING_REVIEW','SUBMITTED','APPROVED','REJECTED','COMPLETED'); "
    "EXCEPTION WHEN duplicate_object THEN NULL; END " + "$" + "$;\n"

    "DO " + "$" + "$ BEGIN CREATE TYPE deductioncategory AS ENUM "
    "('MEDICAL_EXPENSE','EDUCATION','DONATION','RETIREMENT','CREDIT_CARD','OTHER'); "
    "EXCEPTION WHEN duplicate_object THEN NULL; END " + "$" + "$;\n"

    # ===== claim_batches (referenced by insurance_claims) =====
    "CREATE TABLE IF NOT EXISTS claim_batches ("
    "id SERIAL PRIMARY KEY,"
    "user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,"
    "batch_number VARCHAR(30) NOT NULL UNIQUE,"
    "submission_date TIMESTAMP NOT NULL,"
    "total_claims INTEGER NOT NULL DEFAULT 0,"
    "total_amount BIGINT NOT NULL DEFAULT 0,"
    "status VARCHAR(20) NOT NULL DEFAULT 'PENDING',"
    "created_at TIMESTAMP DEFAULT NOW()"
    ");\n"
    "CREATE INDEX IF NOT EXISTS ix_batch_user ON claim_batches(user_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_batch_status ON claim_batches(status);\n"
    "\n"

    # ===== insurance_claims =====
    "CREATE TABLE IF NOT EXISTS insurance_claims ("
    "id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"
    "user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,"
    "claim_number VARCHAR(30) NOT NULL UNIQUE,"
    "claim_date DATE NOT NULL,"
    "service_date DATE NOT NULL,"
    "patient_chart_no VARCHAR(50),"
    "patient_name_masked VARCHAR(100),"
    "patient_age INTEGER,"
    "patient_gender VARCHAR(1),"
    "total_amount BIGINT NOT NULL DEFAULT 0,"
    "insurance_amount BIGINT NOT NULL DEFAULT 0,"
    "copay_amount BIGINT NOT NULL DEFAULT 0,"
    "approved_amount BIGINT,"
    "rejected_amount BIGINT NOT NULL DEFAULT 0,"
    "status claimstatus NOT NULL DEFAULT 'DRAFT',"
    "risk_level risklevel NOT NULL DEFAULT 'LOW',"
    "risk_score INTEGER NOT NULL DEFAULT 100,"
    "risk_reason TEXT,"
    "ai_analyzed BOOLEAN NOT NULL DEFAULT FALSE,"
    "ai_analysis_result JSONB DEFAULT '{}'::jsonb,"
    "submitted_at TIMESTAMP,"
    "result_received_at TIMESTAMP,"
    "rejection_reason TEXT,"
    "batch_id INTEGER REFERENCES claim_batches(id),"
    "created_at TIMESTAMP DEFAULT NOW(),"
    "updated_at TIMESTAMP DEFAULT NOW()"
    ");\n"
    "CREATE INDEX IF NOT EXISTS ix_claim_user ON insurance_claims(user_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_claim_status ON insurance_claims(status);\n"
    "CREATE INDEX IF NOT EXISTS ix_claim_risk ON insurance_claims(risk_level);\n"
    "CREATE INDEX IF NOT EXISTS ix_claim_date ON insurance_claims(claim_date);\n"
    "CREATE INDEX IF NOT EXISTS ix_claim_number ON insurance_claims(claim_number);\n"
    "\n"

    # ===== claim_items =====
    "CREATE TABLE IF NOT EXISTS claim_items ("
    "id SERIAL PRIMARY KEY,"
    "claim_id UUID NOT NULL REFERENCES insurance_claims(id) ON DELETE CASCADE,"
    "item_type claimitype NOT NULL,"
    "code VARCHAR(20) NOT NULL,"
    "name VARCHAR(200) NOT NULL,"
    "quantity INTEGER NOT NULL DEFAULT 1,"
    "unit_price BIGINT NOT NULL DEFAULT 0,"
    "total_price BIGINT NOT NULL DEFAULT 0,"
    "risk_level risklevel NOT NULL DEFAULT 'LOW',"
    "pass_rate DOUBLE PRECISION NOT NULL DEFAULT 100.0,"
    "ai_comment TEXT,"
    "issues JSONB DEFAULT '[]'::jsonb"
    ");\n"
    "CREATE INDEX IF NOT EXISTS ix_claim_item_claim ON claim_items(claim_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_claim_item_code ON claim_items(code);\n"
    "\n"

    # ===== tax_corrections =====
    "CREATE TABLE IF NOT EXISTS tax_corrections ("
    "id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"
    "user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,"
    "tax_year INTEGER NOT NULL,"
    "correction_number VARCHAR(30) NOT NULL UNIQUE,"
    "original_filed_amount BIGINT NOT NULL DEFAULT 0,"
    "correct_amount BIGINT NOT NULL DEFAULT 0,"
    "refund_amount BIGINT NOT NULL DEFAULT 0,"
    "platform_fee BIGINT NOT NULL DEFAULT 0,"
    "status taxcorrectionstatus NOT NULL DEFAULT 'DRAFT',"
    "submitted_at TIMESTAMP,"
    "approved_at TIMESTAMP,"
    "refund_received_at TIMESTAMP,"
    "evidence_docs JSONB DEFAULT '[]'::jsonb,"
    "ai_detected BOOLEAN NOT NULL DEFAULT FALSE,"
    "ai_confidence DOUBLE PRECISION NOT NULL DEFAULT 0.0,"
    "created_at TIMESTAMP DEFAULT NOW(),"
    "updated_at TIMESTAMP DEFAULT NOW()"
    ");\n"
    "CREATE INDEX IF NOT EXISTS ix_tax_correction_user ON tax_corrections(user_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_tax_correction_year ON tax_corrections(tax_year);\n"
    "CREATE INDEX IF NOT EXISTS ix_tax_correction_status ON tax_corrections(status);\n"
    "CREATE INDEX IF NOT EXISTS ix_tax_correction_number ON tax_corrections(correction_number);\n"
    "\n"

    # ===== tax_deductions =====
    "CREATE TABLE IF NOT EXISTS tax_deductions ("
    "id SERIAL PRIMARY KEY,"
    "correction_id UUID NOT NULL REFERENCES tax_corrections(id) ON DELETE CASCADE,"
    "category deductioncategory NOT NULL,"
    "description TEXT NOT NULL,"
    "amount BIGINT NOT NULL DEFAULT 0,"
    "evidence_required BOOLEAN NOT NULL DEFAULT TRUE,"
    "evidence_uploaded BOOLEAN NOT NULL DEFAULT FALSE,"
    "ai_suggested BOOLEAN NOT NULL DEFAULT FALSE,"
    "ai_explanation TEXT"
    ");\n"
    "CREATE INDEX IF NOT EXISTS ix_deduction_correction ON tax_deductions(correction_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_deduction_category ON tax_deductions(category);\n"
)


async def run():
    db_url = os.environ.get("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    dsn = db_url.replace("postgresql+asyncpg://", "postgresql://")

    conn = await asyncpg.connect(dsn)
    try:
        await conn.execute(SQL)
        print("OK: 014_claims_tax migration completed")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(run())
