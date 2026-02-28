"""EMR cost optimization + patient management migration - 017"""
import asyncio
import asyncpg
import os

SQL = (
    # ===== Create ENUM types =====

    "DO $$ BEGIN CREATE TYPE inboundstatus AS ENUM "
    "('PENDING','BOOKED','HELD','CANCELLED','VISITED'); "
    "EXCEPTION WHEN duplicate_object THEN NULL; END $$;\n"

    "DO $$ BEGIN CREATE TYPE consentstatus AS ENUM "
    "('NOT_ASKED','CONSENTED','PARTIAL','REFUSED'); "
    "EXCEPTION WHEN duplicate_object THEN NULL; END $$;\n"

    "DO $$ BEGIN CREATE TYPE dbquality AS ENUM "
    "('HIGH','MEDIUM','LOW'); "
    "EXCEPTION WHEN duplicate_object THEN NULL; END $$;\n"

    # ===== staff_costs =====
    "CREATE TABLE IF NOT EXISTS staff_costs ("
    "id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"
    "user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,"
    "employee_name VARCHAR(100) NOT NULL,"
    "employee_type VARCHAR(20) NOT NULL DEFAULT 'ADMIN',"
    "employment_type VARCHAR(20) NOT NULL DEFAULT 'FULL_TIME',"
    "year_month VARCHAR(7) NOT NULL,"
    "base_salary BIGINT DEFAULT 0,"
    "overtime_pay BIGINT DEFAULT 0,"
    "bonus BIGINT DEFAULT 0,"
    "national_pension BIGINT DEFAULT 0,"
    "health_insurance BIGINT DEFAULT 0,"
    "employment_insurance BIGINT DEFAULT 0,"
    "accident_insurance BIGINT DEFAULT 0,"
    "welfare_cost BIGINT DEFAULT 0,"
    "severance_reserve BIGINT DEFAULT 0,"
    "is_demo BOOLEAN DEFAULT FALSE,"
    "created_at TIMESTAMP DEFAULT NOW(),"
    "updated_at TIMESTAMP DEFAULT NOW(),"
    "UNIQUE(user_id, employee_name, year_month)"
    ");\n"
    "CREATE INDEX IF NOT EXISTS ix_staff_cost_user_month ON staff_costs(user_id, year_month);\n"

    # ===== fixed_cost_entries =====
    "CREATE TABLE IF NOT EXISTS fixed_cost_entries ("
    "id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"
    "user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,"
    "year_month VARCHAR(7) NOT NULL,"
    "cost_category VARCHAR(30) NOT NULL DEFAULT 'OTHER',"
    "amount BIGINT DEFAULT 0,"
    "vendor_name VARCHAR(200),"
    "contract_end_date DATE,"
    "note TEXT,"
    "is_demo BOOLEAN DEFAULT FALSE,"
    "created_at TIMESTAMP DEFAULT NOW(),"
    "updated_at TIMESTAMP DEFAULT NOW()"
    ");\n"
    "CREATE INDEX IF NOT EXISTS ix_fixed_cost_user_month ON fixed_cost_entries(user_id, year_month);\n"
    "CREATE INDEX IF NOT EXISTS ix_fixed_cost_category ON fixed_cost_entries(cost_category);\n"

    # ===== medical_supply_items =====
    "CREATE TABLE IF NOT EXISTS medical_supply_items ("
    "id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"
    "user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,"
    "item_type VARCHAR(20) NOT NULL DEFAULT 'SUPPLY',"
    "item_name VARCHAR(200) NOT NULL,"
    "item_code VARCHAR(50),"
    "unit VARCHAR(20),"
    "monthly_usage INTEGER DEFAULT 0,"
    "current_vendor VARCHAR(100),"
    "current_unit_price BIGINT DEFAULT 0,"
    "stock_count INTEGER DEFAULT 0,"
    "expiry_date DATE,"
    "reorder_threshold INTEGER DEFAULT 0,"
    "has_generic BOOLEAN DEFAULT FALSE,"
    "generic_price BIGINT DEFAULT 0,"
    "generic_vendor VARCHAR(100),"
    "is_demo BOOLEAN DEFAULT FALSE,"
    "created_at TIMESTAMP DEFAULT NOW(),"
    "updated_at TIMESTAMP DEFAULT NOW()"
    ");\n"
    "CREATE INDEX IF NOT EXISTS ix_supply_item_user ON medical_supply_items(user_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_supply_item_type ON medical_supply_items(item_type);\n"

    # ===== vendor_price_quotes =====
    "CREATE TABLE IF NOT EXISTS vendor_price_quotes ("
    "id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"
    "supply_item_id UUID NOT NULL REFERENCES medical_supply_items(id) ON DELETE CASCADE,"
    "vendor_name VARCHAR(100) NOT NULL,"
    "unit_price BIGINT DEFAULT 0,"
    "minimum_order_qty INTEGER DEFAULT 0,"
    "bulk_discount_threshold INTEGER,"
    "bulk_unit_price BIGINT,"
    "quoted_at DATE,"
    "valid_until DATE,"
    "created_at TIMESTAMP DEFAULT NOW()"
    ");\n"
    "CREATE INDEX IF NOT EXISTS ix_vendor_quote_item ON vendor_price_quotes(supply_item_id);\n"

    # ===== marketing_spends =====
    "CREATE TABLE IF NOT EXISTS marketing_spends ("
    "id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"
    "user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,"
    "year_month VARCHAR(7) NOT NULL,"
    "channel VARCHAR(30) NOT NULL DEFAULT 'OTHER',"
    "spend_amount BIGINT DEFAULT 0,"
    "new_patients_acquired INTEGER DEFAULT 0,"
    "inquiries_count INTEGER DEFAULT 0,"
    "appointments_booked INTEGER DEFAULT 0,"
    "attributed_revenue BIGINT DEFAULT 0,"
    "notes TEXT,"
    "is_demo BOOLEAN DEFAULT FALSE,"
    "created_at TIMESTAMP DEFAULT NOW(),"
    "updated_at TIMESTAMP DEFAULT NOW(),"
    "UNIQUE(user_id, channel, year_month)"
    ");\n"
    "CREATE INDEX IF NOT EXISTS ix_marketing_user_month ON marketing_spends(user_id, year_month);\n"
    "CREATE INDEX IF NOT EXISTS ix_marketing_channel ON marketing_spends(channel);\n"

    # ===== patients =====
    "CREATE TABLE IF NOT EXISTS patients ("
    "id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"
    "user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,"
    "seq_no INTEGER,"
    "chart_no VARCHAR(50),"
    "name VARCHAR(100) NOT NULL,"
    "phone VARCHAR(20),"
    "gender VARCHAR(1),"
    "birth_date DATE,"
    "region VARCHAR(100),"
    "inflow_date DATE,"
    "inflow_path VARCHAR(100),"
    "search_keywords TEXT,"
    "symptoms TEXT,"
    "diagnosis_name VARCHAR(200),"
    "consultation_summary TEXT,"
    "db_quality dbquality DEFAULT 'MEDIUM',"
    "staff_assessment TEXT,"
    "appointment_date TIMESTAMP,"
    "appointment_path VARCHAR(100),"
    "inbound_status inboundstatus DEFAULT 'PENDING',"
    "cancellation_reason TEXT,"
    "consultation_gap_analysis TEXT,"
    "manager_name VARCHAR(100),"
    "consent_examination consentstatus DEFAULT 'NOT_ASKED',"
    "consent_treatment consentstatus DEFAULT 'NOT_ASKED',"
    "partial_consent_reason TEXT,"
    "non_consent_reason TEXT,"
    "non_consent_root_cause TEXT,"
    "is_demo BOOLEAN DEFAULT FALSE,"
    "created_at TIMESTAMP DEFAULT NOW(),"
    "updated_at TIMESTAMP DEFAULT NOW()"
    ");\n"
    "CREATE INDEX IF NOT EXISTS ix_patient_user ON patients(user_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_patient_user_inflow ON patients(user_id, inflow_date);\n"
    "CREATE INDEX IF NOT EXISTS ix_patient_status ON patients(inbound_status);\n"
    "CREATE INDEX IF NOT EXISTS ix_patient_manager ON patients(manager_name);\n"
)


async def run():
    db_url = os.environ.get("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    dsn = db_url.replace("postgresql+asyncpg://", "postgresql://")

    conn = await asyncpg.connect(dsn)
    try:
        await conn.execute(SQL)
        print("OK: 017_emr_cost_features migration completed")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(run())
