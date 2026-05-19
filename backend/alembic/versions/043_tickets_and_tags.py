"""시술 회차권(티켓) + 환자 태그 + 동반자 — 043

미용·피부·성형 의원 채택률 직결 기능:
- treatment_packages: 의원이 정의하는 회차권 (10회권 슈링크, 20회권 포텐자...)
- patient_tickets: 환자가 구매한 인스턴스 (잔여 회차, 만료일, 상태)
- ticket_usages: 회차 차감/취소 감사 추적
- patients.tags (JSONB list): VIP/연예인/외국인/임신부 등 자유 운영 태그
- patients.companion_chart_nos (JSONB list of obj): 동반자/가족 차트번호
- patient_tags: 의원별 태그 사전 (이름·색·아이콘)

ENUM: packagecategory, ticketstatus (create_type=True — 새로 만듦).
"""
import asyncio
import asyncpg
import os

SQL = (
    # ENUM 생성 (IF NOT EXISTS 패턴 — DO 블록)
    "DO $$ BEGIN "
    "  CREATE TYPE packagecategory AS ENUM "
    "  ('LIFTING','SKIN','LASER','BOTOX','FILLER','HAIR_REMOVAL','SCAR','SURGERY','PHYSIO','OTHER'); "
    "EXCEPTION WHEN duplicate_object THEN NULL; END $$;\n"

    "DO $$ BEGIN "
    "  CREATE TYPE ticketstatus AS ENUM "
    "  ('ACTIVE','USED_UP','EXPIRED','CANCELED','REFUNDED'); "
    "EXCEPTION WHEN duplicate_object THEN NULL; END $$;\n"

    # treatment_packages
    "CREATE TABLE IF NOT EXISTS treatment_packages ("
    "  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"
    "  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,"
    "  name VARCHAR(200) NOT NULL,"
    "  short_code VARCHAR(50),"
    "  category packagecategory NOT NULL DEFAULT 'OTHER',"
    "  total_sessions INTEGER NOT NULL,"
    "  price BIGINT NOT NULL DEFAULT 0,"
    "  taxable BOOLEAN NOT NULL DEFAULT TRUE,"
    "  default_validity_days INTEGER DEFAULT 365,"
    "  description TEXT,"
    "  is_active BOOLEAN NOT NULL DEFAULT TRUE,"
    "  procedure_codes JSONB NOT NULL DEFAULT '[]',"
    "  created_at TIMESTAMP DEFAULT NOW(),"
    "  updated_at TIMESTAMP DEFAULT NOW(),"
    "  deleted_at TIMESTAMP"
    ");\n"
    "CREATE INDEX IF NOT EXISTS ix_pkg_user ON treatment_packages(user_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_pkg_category ON treatment_packages(category);\n"
    "CREATE INDEX IF NOT EXISTS ix_pkg_active ON treatment_packages(is_active);\n"

    # patient_tickets
    "CREATE TABLE IF NOT EXISTS patient_tickets ("
    "  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"
    "  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,"
    "  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,"
    "  package_id UUID NOT NULL REFERENCES treatment_packages(id) ON DELETE RESTRICT,"
    "  ticket_no VARCHAR(40) UNIQUE NOT NULL,"
    "  purchased_at TIMESTAMP NOT NULL DEFAULT NOW(),"
    "  purchased_price BIGINT NOT NULL DEFAULT 0,"
    "  expires_at DATE,"
    "  total_sessions INTEGER NOT NULL,"
    "  used_sessions INTEGER NOT NULL DEFAULT 0,"
    "  status ticketstatus NOT NULL DEFAULT 'ACTIVE',"
    "  note TEXT,"
    "  extension_history JSONB NOT NULL DEFAULT '[]',"
    "  created_at TIMESTAMP DEFAULT NOW(),"
    "  updated_at TIMESTAMP DEFAULT NOW()"
    ");\n"
    "CREATE INDEX IF NOT EXISTS ix_tk_user ON patient_tickets(user_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_tk_patient ON patient_tickets(patient_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_tk_status ON patient_tickets(status);\n"
    "CREATE INDEX IF NOT EXISTS ix_tk_expires ON patient_tickets(expires_at);\n"

    # ticket_usages
    "CREATE TABLE IF NOT EXISTS ticket_usages ("
    "  id SERIAL PRIMARY KEY,"
    "  ticket_id UUID NOT NULL REFERENCES patient_tickets(id) ON DELETE CASCADE,"
    "  visit_id UUID REFERENCES visits(id) ON DELETE SET NULL,"
    "  used_at TIMESTAMP NOT NULL DEFAULT NOW(),"
    "  sessions_used INTEGER NOT NULL DEFAULT 1,"
    "  note TEXT,"
    "  voided BOOLEAN NOT NULL DEFAULT FALSE"
    ");\n"
    "CREATE INDEX IF NOT EXISTS ix_tk_usage_ticket ON ticket_usages(ticket_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_tk_usage_visit ON ticket_usages(visit_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_tk_usage_used_at ON ticket_usages(used_at);\n"

    # patient_tags (사전)
    "CREATE TABLE IF NOT EXISTS patient_tags ("
    "  id SERIAL PRIMARY KEY,"
    "  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,"
    "  name VARCHAR(50) NOT NULL,"
    "  color VARCHAR(20) DEFAULT 'slate',"
    "  icon VARCHAR(50),"
    "  description VARCHAR(200),"
    "  sort_order INTEGER NOT NULL DEFAULT 100,"
    "  is_system BOOLEAN NOT NULL DEFAULT FALSE,"
    "  is_active BOOLEAN NOT NULL DEFAULT TRUE,"
    "  created_at TIMESTAMP DEFAULT NOW(),"
    "  CONSTRAINT uq_patient_tag_user_name UNIQUE (user_id, name)"
    ");\n"
    "CREATE INDEX IF NOT EXISTS ix_pttag_user ON patient_tags(user_id);\n"

    # patients 운영 컬럼
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS tags JSONB NOT NULL DEFAULT '[]';\n"
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS companion_chart_nos JSONB NOT NULL DEFAULT '[]';\n"

    # 태그 인덱스 (GIN — 배열 안 검색 빠르게)
    "CREATE INDEX IF NOT EXISTS ix_patient_tags_gin ON patients USING gin (tags);\n"
)


async def run():
    db_url = os.environ.get("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    dsn = db_url.replace("postgresql+asyncpg://", "postgresql://")

    conn = await asyncpg.connect(dsn)
    try:
        await conn.execute(SQL)
        print("OK: 043_tickets_and_tags migration completed")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(run())
