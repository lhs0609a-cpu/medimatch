"""Clinic setup — 5분 온보딩 + 진료과 템플릿 적용 - 036"""
import asyncio
import asyncpg
import os

SQL = (
    "CREATE TABLE IF NOT EXISTS clinic_setup ("
    "user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,"
    "clinic_name VARCHAR(200),"
    "primary_specialty VARCHAR(40),"          # INTERNAL, ENT, PEDIATRICS, DERMATOLOGY, ORTHOPEDICS, GENERAL...
    "secondary_specialties JSONB DEFAULT '[]'::jsonb,"
    "doctor_names JSONB DEFAULT '[]'::jsonb,"  # ['김원장', '이원장']
    "hours_open VARCHAR(20),"                  # '09:00'
    "hours_close VARCHAR(20),"                 # '18:00'
    "lunch_open VARCHAR(20),"
    "lunch_close VARCHAR(20),"
    "weekday_pattern VARCHAR(20),"            # 'mon-fri', 'mon-sat'
    "applied_template VARCHAR(40),"
    "applied_template_at TIMESTAMP,"
    "completed_steps JSONB DEFAULT '[]'::jsonb,"
    "completed_at TIMESTAMP,"
    "skipped_at TIMESTAMP,"
    "created_at TIMESTAMP DEFAULT NOW(),"
    "updated_at TIMESTAMP DEFAULT NOW()"
    ");\n"

    "CREATE INDEX IF NOT EXISTS ix_clinic_setup_specialty ON clinic_setup(primary_specialty);\n"
    "CREATE INDEX IF NOT EXISTS ix_clinic_setup_completed ON clinic_setup(completed_at);\n"
)


async def run():
    db_url = os.environ.get("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    dsn = db_url.replace("postgresql+asyncpg://", "postgresql://")

    conn = await asyncpg.connect(dsn)
    try:
        await conn.execute(SQL)
        print("OK: 036_clinic_setup migration completed")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(run())
