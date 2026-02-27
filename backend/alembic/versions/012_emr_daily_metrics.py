"""Create emr_daily_metrics table

Revision ID: 012
"""
import asyncio
import asyncpg
import os


async def run():
    db_url = os.environ.get("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    dsn = db_url.replace("postgresql+asyncpg://", "postgresql://")

    conn = await asyncpg.connect(dsn)
    try:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS emr_daily_metrics (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                metric_date DATE NOT NULL,

                revenue_total BIGINT NOT NULL DEFAULT 0,
                revenue_insurance BIGINT NOT NULL DEFAULT 0,
                revenue_non_insurance BIGINT NOT NULL DEFAULT 0,

                patient_count_total INTEGER NOT NULL DEFAULT 0,
                patient_count_new INTEGER NOT NULL DEFAULT 0,
                patient_count_returning INTEGER NOT NULL DEFAULT 0,

                regional_avg_revenue BIGINT NOT NULL DEFAULT 0,
                regional_percentile INTEGER NOT NULL DEFAULT 50,

                specialty VARCHAR(50),
                region VARCHAR(100),

                is_demo BOOLEAN NOT NULL DEFAULT FALSE,

                created_at TIMESTAMP DEFAULT now(),
                updated_at TIMESTAMP DEFAULT now()
            )
        """)
        print("OK: Created emr_daily_metrics table")

        await conn.execute("""
            CREATE UNIQUE INDEX IF NOT EXISTS uq_emr_user_date
            ON emr_daily_metrics (user_id, metric_date)
        """)
        print("OK: Created unique index uq_emr_user_date")

        await conn.execute("""
            CREATE INDEX IF NOT EXISTS ix_emr_metrics_user_date
            ON emr_daily_metrics (user_id, metric_date)
        """)
        print("OK: Created index ix_emr_metrics_user_date")

        await conn.execute("""
            CREATE INDEX IF NOT EXISTS ix_emr_metrics_specialty_region
            ON emr_daily_metrics (specialty, region)
        """)
        print("OK: Created index ix_emr_metrics_specialty_region")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(run())
