"""EMR core: visits, prescriptions, appointments, billing - 025"""
import asyncio
import asyncpg
import os

DD = "$" + "$"  # avoid $$ HEREDOC parser issues on some shells

SQL = (
    # ===== Enums =====
    "DO " + DD + " BEGIN CREATE TYPE visitstatus AS ENUM "
    "('SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED'); "
    "EXCEPTION WHEN duplicate_object THEN NULL; END " + DD + ";\n"

    "DO " + DD + " BEGIN CREATE TYPE appointmentstatus AS ENUM "
    "('SCHEDULED','CONFIRMED','ARRIVED','IN_PROGRESS','COMPLETED','NO_SHOW','CANCELLED'); "
    "EXCEPTION WHEN duplicate_object THEN NULL; END " + DD + ";\n"

    "DO " + DD + " BEGIN CREATE TYPE billstatus AS ENUM "
    "('DRAFT','ISSUED','PARTIAL','PAID','REFUNDED','CANCELLED'); "
    "EXCEPTION WHEN duplicate_object THEN NULL; END " + DD + ";\n"

    "DO " + DD + " BEGIN CREATE TYPE paymentmethod AS ENUM "
    "('CASH','CARD','MOBILE','TRANSFER','INSURANCE','OTHER'); "
    "EXCEPTION WHEN duplicate_object THEN NULL; END " + DD + ";\n"

    "DO " + DD + " BEGIN CREATE TYPE prescriptionstatus AS ENUM "
    "('DRAFT','ISSUED','DISPENSED','CANCELLED'); "
    "EXCEPTION WHEN duplicate_object THEN NULL; END " + DD + ";\n"

    # ===== visits (전자차트 SOAP) =====
    "CREATE TABLE IF NOT EXISTS visits ("
    "id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"
    "user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,"
    "patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,"
    "chart_no VARCHAR(50),"
    "visit_no VARCHAR(40) NOT NULL UNIQUE,"
    "visit_date DATE NOT NULL,"
    "visit_type VARCHAR(20) NOT NULL DEFAULT 'INITIAL',"  # INITIAL/REVISIT/CHECKUP
    "chief_complaint TEXT,"
    "subjective TEXT,"
    "objective TEXT,"
    "assessment TEXT,"
    "plan TEXT,"
    # Vitals
    "vital_systolic INTEGER,"
    "vital_diastolic INTEGER,"
    "vital_hr INTEGER,"
    "vital_temp DOUBLE PRECISION,"
    "vital_spo2 INTEGER,"
    "vital_weight DOUBLE PRECISION,"
    "vital_height DOUBLE PRECISION,"
    "vital_bmi DOUBLE PRECISION,"
    "doctor_id UUID REFERENCES users(id),"
    "doctor_name VARCHAR(100),"
    "status visitstatus NOT NULL DEFAULT 'IN_PROGRESS',"
    "duration_min INTEGER,"
    "next_visit_date DATE,"
    "visit_notes TEXT,"
    "voice_transcript TEXT,"  # AI 음성 인식 원문
    "ai_suggestions JSONB DEFAULT '[]'::jsonb,"
    "created_at TIMESTAMP DEFAULT NOW(),"
    "updated_at TIMESTAMP DEFAULT NOW()"
    ");\n"
    "CREATE INDEX IF NOT EXISTS ix_visit_user ON visits(user_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_visit_patient ON visits(patient_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_visit_date ON visits(visit_date);\n"
    "CREATE INDEX IF NOT EXISTS ix_visit_status ON visits(status);\n"
    "\n"

    # ===== visit_diagnoses (KCD-8 진단 코드) =====
    "CREATE TABLE IF NOT EXISTS visit_diagnoses ("
    "id SERIAL PRIMARY KEY,"
    "visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,"
    "code VARCHAR(20) NOT NULL,"  # KCD-8 / ICD-10
    "name VARCHAR(300) NOT NULL,"
    "is_primary BOOLEAN NOT NULL DEFAULT FALSE,"
    "note TEXT,"
    "created_at TIMESTAMP DEFAULT NOW()"
    ");\n"
    "CREATE INDEX IF NOT EXISTS ix_diag_visit ON visit_diagnoses(visit_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_diag_code ON visit_diagnoses(code);\n"
    "\n"

    # ===== visit_procedures (시술/검사) =====
    "CREATE TABLE IF NOT EXISTS visit_procedures ("
    "id SERIAL PRIMARY KEY,"
    "visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,"
    "code VARCHAR(20) NOT NULL,"  # 행위 수가 코드
    "name VARCHAR(300) NOT NULL,"
    "category VARCHAR(50),"  # 진찰/검사/시술/주사/처치
    "quantity INTEGER NOT NULL DEFAULT 1,"
    "unit_price BIGINT NOT NULL DEFAULT 0,"
    "total_price BIGINT NOT NULL DEFAULT 0,"
    "insurance_covered BOOLEAN NOT NULL DEFAULT TRUE,"
    "note TEXT,"
    "created_at TIMESTAMP DEFAULT NOW()"
    ");\n"
    "CREATE INDEX IF NOT EXISTS ix_proc_visit ON visit_procedures(visit_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_proc_code ON visit_procedures(code);\n"
    "\n"

    # ===== prescriptions (처방전) =====
    "CREATE TABLE IF NOT EXISTS prescriptions ("
    "id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"
    "user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,"
    "visit_id UUID REFERENCES visits(id) ON DELETE SET NULL,"
    "patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,"
    "prescription_no VARCHAR(40) NOT NULL UNIQUE,"
    "prescribed_date DATE NOT NULL,"
    "doctor_id UUID REFERENCES users(id),"
    "doctor_name VARCHAR(100),"
    "pharmacy_id UUID,"
    "pharmacy_name VARCHAR(200),"
    "status prescriptionstatus NOT NULL DEFAULT 'ISSUED',"
    "duration_days INTEGER,"
    "total_amount BIGINT NOT NULL DEFAULT 0,"
    "dur_warnings JSONB DEFAULT '[]'::jsonb,"  # 약물 상호작용
    "patient_note TEXT,"
    "created_at TIMESTAMP DEFAULT NOW(),"
    "updated_at TIMESTAMP DEFAULT NOW()"
    ");\n"
    "CREATE INDEX IF NOT EXISTS ix_rx_user ON prescriptions(user_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_rx_patient ON prescriptions(patient_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_rx_visit ON prescriptions(visit_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_rx_date ON prescriptions(prescribed_date);\n"
    "CREATE INDEX IF NOT EXISTS ix_rx_status ON prescriptions(status);\n"
    "\n"

    # ===== prescription_items (처방 약품) =====
    "CREATE TABLE IF NOT EXISTS prescription_items ("
    "id SERIAL PRIMARY KEY,"
    "prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,"
    "drug_code VARCHAR(20),"  # 식약처 의약품코드
    "drug_name VARCHAR(300) NOT NULL,"
    "ingredient VARCHAR(300),"
    "dose_per_time DOUBLE PRECISION NOT NULL DEFAULT 1.0,"  # 1회분
    "dose_unit VARCHAR(20) NOT NULL DEFAULT '정',"  # 정/캡슐/ml
    "frequency_per_day INTEGER NOT NULL DEFAULT 1,"  # 일 3회
    "duration_days INTEGER NOT NULL DEFAULT 1,"
    "total_quantity DOUBLE PRECISION NOT NULL DEFAULT 1,"
    "unit_price BIGINT NOT NULL DEFAULT 0,"
    "total_price BIGINT NOT NULL DEFAULT 0,"
    "usage_note TEXT,"  # 식후 30분 등
    "warning TEXT,"  # DUR 경고
    "created_at TIMESTAMP DEFAULT NOW()"
    ");\n"
    "CREATE INDEX IF NOT EXISTS ix_rxitem_prescription ON prescription_items(prescription_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_rxitem_drug ON prescription_items(drug_code);\n"
    "\n"

    # ===== appointments (예약) =====
    "CREATE TABLE IF NOT EXISTS appointments ("
    "id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"
    "user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,"
    "patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,"
    "patient_name VARCHAR(100) NOT NULL,"  # 비-가입 예약자도 가능
    "patient_phone VARCHAR(20),"
    "patient_birth DATE,"
    "doctor_id UUID REFERENCES users(id),"
    "doctor_name VARCHAR(100),"
    "start_time TIMESTAMP NOT NULL,"
    "end_time TIMESTAMP NOT NULL,"
    "duration_min INTEGER NOT NULL DEFAULT 15,"
    "status appointmentstatus NOT NULL DEFAULT 'SCHEDULED',"
    "appointment_type VARCHAR(30) NOT NULL DEFAULT 'INITIAL',"  # INITIAL/REVISIT/CHECKUP
    "chief_complaint TEXT,"
    "memo TEXT,"
    "channel VARCHAR(30),"  # PHONE/WALKIN/ONLINE/QR
    "arrived_at TIMESTAMP,"
    "completed_at TIMESTAMP,"
    "cancelled_reason TEXT,"
    "reminder_sent BOOLEAN NOT NULL DEFAULT FALSE,"
    "created_at TIMESTAMP DEFAULT NOW(),"
    "updated_at TIMESTAMP DEFAULT NOW()"
    ");\n"
    "CREATE INDEX IF NOT EXISTS ix_appt_user ON appointments(user_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_appt_patient ON appointments(patient_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_appt_start ON appointments(start_time);\n"
    "CREATE INDEX IF NOT EXISTS ix_appt_status ON appointments(status);\n"
    "CREATE INDEX IF NOT EXISTS ix_appt_doctor ON appointments(doctor_id);\n"
    "\n"

    # ===== bills (수납/청구서) =====
    "CREATE TABLE IF NOT EXISTS bills ("
    "id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"
    "user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,"
    "visit_id UUID REFERENCES visits(id) ON DELETE SET NULL,"
    "patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,"
    "bill_no VARCHAR(40) NOT NULL UNIQUE,"
    "bill_date DATE NOT NULL,"
    "subtotal BIGINT NOT NULL DEFAULT 0,"
    "insurance_amount BIGINT NOT NULL DEFAULT 0,"  # 공단 부담
    "patient_amount BIGINT NOT NULL DEFAULT 0,"  # 본인 부담
    "non_covered_amount BIGINT NOT NULL DEFAULT 0,"  # 비급여
    "discount_amount BIGINT NOT NULL DEFAULT 0,"
    "final_amount BIGINT NOT NULL DEFAULT 0,"  # 최종 청구
    "paid_amount BIGINT NOT NULL DEFAULT 0,"  # 받은 금액
    "balance BIGINT NOT NULL DEFAULT 0,"  # 미수금
    "status billstatus NOT NULL DEFAULT 'DRAFT',"
    "issued_at TIMESTAMP,"
    "completed_at TIMESTAMP,"
    "memo TEXT,"
    "created_at TIMESTAMP DEFAULT NOW(),"
    "updated_at TIMESTAMP DEFAULT NOW()"
    ");\n"
    "CREATE INDEX IF NOT EXISTS ix_bill_user ON bills(user_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_bill_visit ON bills(visit_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_bill_patient ON bills(patient_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_bill_date ON bills(bill_date);\n"
    "CREATE INDEX IF NOT EXISTS ix_bill_status ON bills(status);\n"
    "\n"

    # ===== bill_items =====
    "CREATE TABLE IF NOT EXISTS bill_items ("
    "id SERIAL PRIMARY KEY,"
    "bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,"
    "item_type VARCHAR(30) NOT NULL,"  # CONSULTATION/EXAM/PROCEDURE/MEDICATION/MATERIAL
    "code VARCHAR(30),"
    "name VARCHAR(300) NOT NULL,"
    "quantity INTEGER NOT NULL DEFAULT 1,"
    "unit_price BIGINT NOT NULL DEFAULT 0,"
    "total_price BIGINT NOT NULL DEFAULT 0,"
    "insurance_covered BOOLEAN NOT NULL DEFAULT TRUE,"
    "copay_rate DOUBLE PRECISION NOT NULL DEFAULT 0.30"  # 본인부담률
    ");\n"
    "CREATE INDEX IF NOT EXISTS ix_billitem_bill ON bill_items(bill_id);\n"
    "\n"

    # ===== payments (수납 거래) =====
    "CREATE TABLE IF NOT EXISTS payments_emr ("
    "id SERIAL PRIMARY KEY,"
    "bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,"
    "amount BIGINT NOT NULL,"
    "method paymentmethod NOT NULL DEFAULT 'CARD',"
    "transaction_id VARCHAR(100),"  # PG/Toss tx id
    "card_last4 VARCHAR(4),"
    "card_company VARCHAR(50),"
    "received_at TIMESTAMP NOT NULL DEFAULT NOW(),"
    "received_by VARCHAR(100),"
    "is_refund BOOLEAN NOT NULL DEFAULT FALSE,"
    "refund_reason TEXT,"
    "note TEXT,"
    "created_at TIMESTAMP DEFAULT NOW()"
    ");\n"
    "CREATE INDEX IF NOT EXISTS ix_pay_bill ON payments_emr(bill_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_pay_received ON payments_emr(received_at);\n"
)


async def run():
    db_url = os.environ.get("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    dsn = db_url.replace("postgresql+asyncpg://", "postgresql://")

    conn = await asyncpg.connect(dsn)
    try:
        await conn.execute(SQL)
        print("OK: 025_emr_core migration completed")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(run())
