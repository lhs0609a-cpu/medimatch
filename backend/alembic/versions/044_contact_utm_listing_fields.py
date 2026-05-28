"""문의(ContactInquiry) 유입추적(UTM)·매물 귀속 필드 — 044

광고(네이버 등) → 매물 페이지 → 문의 유입을 캠페인 단위로 귀속하기 위한 컬럼.
- utm_source/medium/campaign/term/content: 광고 캠페인 귀속(first-touch)
- referrer / landing_path: 유입 경로·도착 페이지
- listing_id: 문의 대상 매물(LandlordListing UUID 문자열, nullable)

ALTER ... ADD COLUMN IF NOT EXISTS — 멱등.
"""
import asyncio
import asyncpg
import os

SQL = (
    "ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100);\n"
    "ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(100);\n"
    "ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(150);\n"
    "ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS utm_term VARCHAR(150);\n"
    "ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS utm_content VARCHAR(150);\n"
    "ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS referrer VARCHAR(500);\n"
    "ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS landing_path VARCHAR(500);\n"
    "ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS listing_id VARCHAR(64);\n"
    "CREATE INDEX IF NOT EXISTS ix_contact_inquiry_campaign ON contact_inquiries(utm_campaign);\n"
    "CREATE INDEX IF NOT EXISTS ix_contact_inquiry_listing ON contact_inquiries(listing_id);\n"
)


async def run():
    db_url = os.environ.get("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    dsn = db_url.replace("postgresql+asyncpg://", "postgresql://")

    conn = await asyncpg.connect(dsn)
    try:
        await conn.execute(SQL)
        print("OK: 044_contact_utm_listing_fields migration completed")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(run())
