"""Chronic care program — 만성질환관리(만관제) - 037"""
import asyncio
import asyncpg
import os

DD = "$" + "$"

SQL = (
    "DO " + DD + " BEGIN CREATE TYPE chroniccondition AS ENUM "
    "('HYPERTENSION','DIABETES','DYSLIPIDEMIA','OBESITY','OTHER'); "
    "EXCEPTION WHEN duplicate_object THEN NULL; END " + DD + ";\n"

    "DO " + DD + " BEGIN CREATE TYPE chronicstatus AS ENUM "
    "('ACTIVE','PAUSED','GRADUATED','DROPPED'); "
    "EXCEPTION WHEN duplicate_object THEN NULL; END " + DD + ";\n"

    "DO " + DD + " BEGIN CREATE TYPE chronicvisitkind AS ENUM "
    "('VISIT','EXAM','EDUCATION','PHONE','LAB'); "
    "EXCEPTION WHEN duplicate_object THEN NULL; END " + DD + ";\n"

    "CREATE TABLE IF NOT EXISTS chronic_care_programs ("
    "id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"
    "user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,"
    "patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,"
    "condition chroniccondition NOT NULL,"
    "status chronicstatus NOT NULL DEFAULT 'ACTIVE',"
    "enrolled_at TIMESTAMP DEFAULT NOW(),"
    "graduated_at TIMESTAMP,"
    # 목표 (조건별 의미 다름)
    "target_systolic INTEGER,"           # 고혈압
    "target_diastolic INTEGER,"
    "target_hba1c DOUBLE PRECISION,"     # 당뇨
    "target_fbs INTEGER,"
    "target_ldl INTEGER,"                # 이상지질혈증
    "target_weight DOUBLE PRECISION,"    # 비만
    # 진행 상황 캐싱
    "total_visits INTEGER NOT NULL DEFAULT 0,"
    "total_education_count INTEGER NOT NULL DEFAULT 0,"
    "last_visit_at TIMESTAMP,"
    "next_visit_at TIMESTAMP,"
    "interval_days INTEGER NOT NULL DEFAULT 30,"   # 회차 간격
    "memo TEXT,"
    "created_at TIMESTAMP DEFAULT NOW(),"
    "updated_at TIMESTAMP DEFAULT NOW(),"
    "UNIQUE (user_id, patient_id, condition)"
    ");\n"

    "CREATE INDEX IF NOT EXISTS ix_ccp_user ON chronic_care_programs(user_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_ccp_patient ON chronic_care_programs(patient_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_ccp_status ON chronic_care_programs(status);\n"
    "CREATE INDEX IF NOT EXISTS ix_ccp_next_visit ON chronic_care_programs(next_visit_at);\n"

    "CREATE TABLE IF NOT EXISTS chronic_care_visits ("
    "id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"
    "program_id UUID NOT NULL REFERENCES chronic_care_programs(id) ON DELETE CASCADE,"
    "user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,"
    "visit_date TIMESTAMP NOT NULL DEFAULT NOW(),"
    "kind chronicvisitkind NOT NULL DEFAULT 'VISIT',"
    "systolic INTEGER,"
    "diastolic INTEGER,"
    "fbs INTEGER,"               # 공복혈당
    "hba1c DOUBLE PRECISION,"
    "ldl INTEGER,"
    "hdl INTEGER,"
    "tg INTEGER,"
    "weight DOUBLE PRECISION,"
    "education_topic VARCHAR(200),"
    "data JSONB DEFAULT '{}'::jsonb,"
    "notes TEXT,"
    "linked_visit_id UUID REFERENCES visits(id) ON DELETE SET NULL,"
    "created_at TIMESTAMP DEFAULT NOW()"
    ");\n"

    "CREATE INDEX IF NOT EXISTS ix_ccv_program ON chronic_care_visits(program_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_ccv_user_date ON chronic_care_visits(user_id, visit_date);\n"
)


async def run():
    db_url = os.environ.get("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    dsn = db_url.replace("postgresql+asyncpg://", "postgresql://")

    conn = await asyncpg.connect(dsn)
    try:
        await conn.execute(SQL)
        print("OK: 037_chronic_care migration completed")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(run())
