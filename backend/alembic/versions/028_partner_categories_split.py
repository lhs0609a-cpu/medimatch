"""Partner category split - 028

기존 'legal'(법률+세무+노무 통합)을 4개 vertical로 분리:
- legal       (법무법인/변호사) — 기존 row 그대로 두고 description만 갱신
- accounting  (회계법인) NEW
- tax         (세무법인) NEW
- labor       (노무법인) NEW

idempotent — 안전 재실행.
"""
import asyncio
import asyncpg
import os


CATEGORY_INSERTS = [
    # (code, name, description, icon, lead_fee, display_order, escrow_recommended)
    ("accounting", "회계법인", "의료기관 회계감사·재무자문·기장",
     "Calculator", 80000, 8, False),
    ("tax", "세무법인", "개원신고·세무대리·종합소득세·경정청구",
     "Receipt", 80000, 9, False),
    ("labor", "노무법인", "근로계약·4대보험·인사노무 자문",
     "UserCog", 30000, 10, False),
]


async def run():
    dsn = os.getenv("DATABASE_URL", "")
    if dsn.startswith("postgresql+asyncpg://"):
        dsn = dsn.replace("postgresql+asyncpg://", "postgresql://", 1)
    elif dsn.startswith("postgres://"):
        pass
    else:
        print("WARN  DATABASE_URL not set – skipping migration 028")
        return

    conn = await asyncpg.connect(dsn)
    try:
        # 1. 새 카테고리 삽입
        for code, name, desc, icon, lead_fee, order, escrow in CATEGORY_INSERTS:
            await conn.execute(
                """
                INSERT INTO partner_categories
                    (code, name, description, icon, lead_fee, display_order,
                     escrow_recommended, is_active, default_commission_rate,
                     min_escrow_amount, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, 3.0, 1000000, NOW(), NOW())
                ON CONFLICT (code) DO NOTHING
                """,
                code, name, desc, icon, lead_fee, order, escrow,
            )

        # 2. legal description 정비 (이미 있으면 갱신)
        await conn.execute(
            """
            UPDATE partner_categories
            SET name = $1,
                description = $2,
                lead_fee = $3,
                updated_at = NOW()
            WHERE code = 'legal'
            """,
            "법무법인/변호사",
            "의료법 전문 변호사, 임대차·동업·인수 계약 자문",
            50000,
        )

        # 3. realestate description 정비
        await conn.execute(
            """
            UPDATE partner_categories
            SET name = $1,
                description = $2,
                lead_fee = $3,
                updated_at = NOW()
            WHERE code = 'realestate'
            """,
            "부동산중개법인",
            "상가·의료시설 전문 부동산 중개",
            150000,
        )

        print("OK  Migration 028 (partner categories split) applied")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(run())
