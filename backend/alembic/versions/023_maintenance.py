"""maintenance subscription migration - 023"""
import asyncio
import asyncpg
import os

SQL = (
    # ===== Enums =====
    "DO " + "$" + "$ BEGIN CREATE TYPE maintenancestatus AS ENUM "
    "('PENDING_SETUP','ACTIVE','PAST_DUE','SUSPENDED','CANCELED','EXPIRED'); "
    "EXCEPTION WHEN duplicate_object THEN NULL; END " + "$" + "$;\n"

    "DO " + "$" + "$ BEGIN CREATE TYPE maintenanceservicetype AS ENUM "
    "('HOMEPAGE','PROGRAM'); "
    "EXCEPTION WHEN duplicate_object THEN NULL; END " + "$" + "$;\n"

    "DO " + "$" + "$ BEGIN CREATE TYPE requestcategory AS ENUM "
    "('MODIFICATION','FEATURE','BUG','CONTENT','OTHER'); "
    "EXCEPTION WHEN duplicate_object THEN NULL; END " + "$" + "$;\n"

    "DO " + "$" + "$ BEGIN CREATE TYPE requeststatus AS ENUM "
    "('RECEIVED','IN_PROGRESS','COMPLETED','CLOSED'); "
    "EXCEPTION WHEN duplicate_object THEN NULL; END " + "$" + "$;\n"

    "DO " + "$" + "$ BEGIN CREATE TYPE requestpriority AS ENUM "
    "('LOW','NORMAL','HIGH','URGENT'); "
    "EXCEPTION WHEN duplicate_object THEN NULL; END " + "$" + "$;\n"

    # ===== maintenance_contracts =====
    "CREATE TABLE IF NOT EXISTS maintenance_contracts ("
    "id SERIAL PRIMARY KEY,"
    "user_id UUID REFERENCES users(id) ON DELETE SET NULL,"
    "created_by UUID REFERENCES users(id) ON DELETE SET NULL,"
    "project_name VARCHAR(200) NOT NULL,"
    "service_type maintenanceservicetype NOT NULL,"
    "description TEXT,"
    "monthly_amount INTEGER NOT NULL,"
    "billing_day INTEGER NOT NULL DEFAULT 1,"
    "company_name VARCHAR(200),"
    "contact_person VARCHAR(100),"
    "contact_email VARCHAR(200),"
    "contact_phone VARCHAR(20),"
    "billing_key VARCHAR(200),"
    "customer_key VARCHAR(100),"
    "card_company VARCHAR(50),"
    "card_number VARCHAR(50),"
    "status maintenancestatus NOT NULL DEFAULT 'PENDING_SETUP',"
    "contract_start_date TIMESTAMP,"
    "current_period_start TIMESTAMP,"
    "current_period_end TIMESTAMP,"
    "next_billing_date TIMESTAMP,"
    "retry_count INTEGER NOT NULL DEFAULT 0,"
    "last_retry_at TIMESTAMP,"
    "total_paid INTEGER NOT NULL DEFAULT 0,"
    "total_months INTEGER NOT NULL DEFAULT 0,"
    "last_payment_id INTEGER REFERENCES payments(id),"
    "admin_memo TEXT,"
    "canceled_at TIMESTAMP,"
    "cancel_reason TEXT,"
    "created_at TIMESTAMP DEFAULT NOW(),"
    "updated_at TIMESTAMP DEFAULT NOW()"
    ");\n"
    "CREATE INDEX IF NOT EXISTS ix_maint_contract_status ON maintenance_contracts(status);\n"
    "CREATE INDEX IF NOT EXISTS ix_maint_contract_next_billing ON maintenance_contracts(next_billing_date);\n"
    "CREATE INDEX IF NOT EXISTS ix_maint_contract_user ON maintenance_contracts(user_id);\n"

    # ===== maintenance_requests =====
    "CREATE TABLE IF NOT EXISTS maintenance_requests ("
    "id SERIAL PRIMARY KEY,"
    "contract_id INTEGER NOT NULL REFERENCES maintenance_contracts(id) ON DELETE CASCADE,"
    "author_id UUID REFERENCES users(id) ON DELETE SET NULL,"
    "category requestcategory NOT NULL,"
    "priority requestpriority NOT NULL DEFAULT 'NORMAL',"
    "title VARCHAR(200) NOT NULL,"
    "content TEXT NOT NULL,"
    "attachments JSONB DEFAULT '[]'::jsonb,"
    "status requeststatus NOT NULL DEFAULT 'RECEIVED',"
    "resolved_at TIMESTAMP,"
    "created_at TIMESTAMP DEFAULT NOW(),"
    "updated_at TIMESTAMP DEFAULT NOW()"
    ");\n"
    "CREATE INDEX IF NOT EXISTS ix_maint_request_contract ON maintenance_requests(contract_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_maint_request_status ON maintenance_requests(status);\n"

    # ===== maintenance_comments =====
    "CREATE TABLE IF NOT EXISTS maintenance_comments ("
    "id SERIAL PRIMARY KEY,"
    "request_id INTEGER NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,"
    "author_id UUID REFERENCES users(id) ON DELETE SET NULL,"
    "content TEXT NOT NULL,"
    "attachments JSONB DEFAULT '[]'::jsonb,"
    "is_internal BOOLEAN NOT NULL DEFAULT FALSE,"
    "created_at TIMESTAMP DEFAULT NOW(),"
    "updated_at TIMESTAMP DEFAULT NOW()"
    ");\n"

    # ===== maintenance_plan_presets =====
    "CREATE TABLE IF NOT EXISTS maintenance_plan_presets ("
    "id SERIAL PRIMARY KEY,"
    "name VARCHAR(100) NOT NULL,"
    "amount INTEGER NOT NULL,"
    "description TEXT,"
    "sort_order INTEGER DEFAULT 0,"
    "created_at TIMESTAMP DEFAULT NOW()"
    ");\n"

    # ===== Default presets =====
    "INSERT INTO maintenance_plan_presets (name, amount, description, sort_order) "
    "SELECT 'Basic', 150000, '기본 유지보수 — 월 1회 점검, 텍스트/이미지 수정', 1 "
    "WHERE NOT EXISTS (SELECT 1 FROM maintenance_plan_presets WHERE name='Basic');\n"

    "INSERT INTO maintenance_plan_presets (name, amount, description, sort_order) "
    "SELECT 'Standard', 300000, '표준 유지보수 — 월 2회 점검, 디자인 수정, 콘텐츠 업데이트', 2 "
    "WHERE NOT EXISTS (SELECT 1 FROM maintenance_plan_presets WHERE name='Standard');\n"

    "INSERT INTO maintenance_plan_presets (name, amount, description, sort_order) "
    "SELECT 'Premium', 450000, '프리미엄 유지보수 — 무제한 수정, 기능 추가, 우선 대응', 3 "
    "WHERE NOT EXISTS (SELECT 1 FROM maintenance_plan_presets WHERE name='Premium');\n"
)


async def run():
    db_url = os.getenv("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    # asyncpg needs raw postgresql:// not postgresql+asyncpg://
    db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
    if "?sslmode=" in db_url:
        db_url = db_url.split("?sslmode=")[0]

    conn = await asyncpg.connect(db_url)
    try:
        await conn.execute(SQL)
        print("023_maintenance migration completed successfully")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(run())
