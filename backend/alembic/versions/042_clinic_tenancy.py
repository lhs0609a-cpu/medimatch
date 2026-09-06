"""의료기관(테넌트) 도입 — 042

기존 EMR 데이터는 users.id 에 직접 매달려 있어 "원장 1명 = 1병원"을 가정한다.
clinics / clinic_members 를 신설하고, EMR 핵심 테이블에 nullable clinic_id 를 붙인다.

이 마이그레이션은 아무것도 깨지 않는다:
  - clinic_id 는 nullable 이고 기존 user_id 컬럼은 그대로 남는다
  - backfill 이 user 1명당 기관 1개를 만들고 기존 행에 clinic_id 를 채운다
  - 쿼리 전환(user_id -> clinic_id)은 다음 단계에서 별도로 한다

멱등이다. 여러 번 돌려도 안전하다.
"""
import asyncio
import os

import asyncpg


DDL = """
-- 기관
CREATE TABLE IF NOT EXISTS clinics (
    id                UUID PRIMARY KEY,
    owner_user_id     UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
    name              VARCHAR(200) NOT NULL,
    ykiho             VARCHAR(8) UNIQUE,
    business_no       VARCHAR(12),
    primary_specialty VARCHAR(40),
    phone             VARCHAR(20),
    address           VARCHAR(300),
    status            VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    closed_at         TIMESTAMP,
    settings          JSONB NOT NULL DEFAULT '{}'::jsonb,
    memo              TEXT,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_clinic_owner  ON clinics(owner_user_id);
CREATE INDEX IF NOT EXISTS ix_clinic_ykiho  ON clinics(ykiho);
CREATE INDEX IF NOT EXISTS ix_clinic_status ON clinics(status);

-- 구성원
CREATE TABLE IF NOT EXISTS clinic_members (
    id          UUID PRIMARY KEY,
    clinic_id   UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    role        VARCHAR(20) NOT NULL DEFAULT 'DESK',
    seat_id     UUID,
    joined_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    revoked_at  TIMESTAMP,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP,
    CONSTRAINT ux_clinic_member UNIQUE (clinic_id, user_id)
);
CREATE INDEX IF NOT EXISTS ix_clinic_member_clinic ON clinic_members(clinic_id);
CREATE INDEX IF NOT EXISTS ix_clinic_member_user   ON clinic_members(user_id);
CREATE INDEX IF NOT EXISTS ix_clinic_member_active ON clinic_members(user_id, revoked_at);
"""

# staff_seats 가 이미 있으면 FK 를 건다. 없는 배포도 있을 수 있어 조건부.
SEAT_FK = """
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff_seats')
       AND NOT EXISTS (
           SELECT 1 FROM information_schema.table_constraints
           WHERE constraint_name = 'fk_clinic_member_seat'
       )
    THEN
        ALTER TABLE clinic_members
            ADD CONSTRAINT fk_clinic_member_seat
            FOREIGN KEY (seat_id) REFERENCES staff_seats(id) ON DELETE SET NULL;
    END IF;
END $$;
"""

SCOPED_TABLES = [
    "patients",
    "visits",
    "bills",
    "prescriptions",
    "appointments",
    "insurance_claims",
    "claim_batches",
]


def _add_clinic_id(table: str) -> str:
    return (
        f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS clinic_id UUID "
        f"REFERENCES clinics(id) ON DELETE CASCADE;\n"
        f"CREATE INDEX IF NOT EXISTS ix_{table}_clinic ON {table}(clinic_id);\n"
    )


# 사용자 1명당 개인 기관 1개를 만들고 OWNER 로 등록한다.
# gen_random_uuid() 는 PG13+ 기본 제공(pgcrypto 불필요).
BACKFILL_CLINICS = """
INSERT INTO clinics (id, owner_user_id, name, primary_specialty, phone, status, settings, created_at)
SELECT gen_random_uuid(),
       u.id,
       COALESCE(NULLIF(u.full_name, ''), '내 의료기관'),
       u.specialty,
       u.phone,
       'ACTIVE',
       '{}'::jsonb,
       NOW()
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM clinics c WHERE c.owner_user_id = u.id);

INSERT INTO clinic_members (id, clinic_id, user_id, role, joined_at, created_at)
SELECT gen_random_uuid(), c.id, c.owner_user_id, 'OWNER', NOW(), NOW()
FROM clinics c
WHERE NOT EXISTS (
    SELECT 1 FROM clinic_members m
    WHERE m.clinic_id = c.id AND m.user_id = c.owner_user_id
);
"""


def _backfill_rows(table: str) -> str:
    return (
        f"UPDATE {table} t SET clinic_id = c.id "
        f"FROM clinics c WHERE c.owner_user_id = t.user_id AND t.clinic_id IS NULL;\n"
    )


async def run():
    db_url = os.environ.get("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    dsn = db_url.replace("postgresql+asyncpg://", "postgresql://")

    conn = await asyncpg.connect(dsn)
    try:
        await conn.execute(DDL)
        await conn.execute(SEAT_FK)

        for t in SCOPED_TABLES:
            await conn.execute(_add_clinic_id(t))

        await conn.execute(BACKFILL_CLINICS)

        for t in SCOPED_TABLES:
            await conn.execute(_backfill_rows(t))

        # 검증 — 남은 NULL 이 있으면 눈에 띄게 알린다.
        for t in SCOPED_TABLES:
            n = await conn.fetchval(
                f"SELECT COUNT(*) FROM {t} WHERE clinic_id IS NULL"
            )
            if n:
                print(f"WARN: {t} has {n} rows with NULL clinic_id (orphan user_id?)")

        print("OK: 042_clinic_tenancy migration completed")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(run())
