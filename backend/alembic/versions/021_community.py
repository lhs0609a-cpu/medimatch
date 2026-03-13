"""Community tables migration - 021"""
import asyncio
import asyncpg
import os

SQL = (
    "DO $$ BEGIN "
    "IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'communitycategory') THEN "
    "CREATE TYPE communitycategory AS ENUM ('OPENING_INFO','PHARMACY_OPS','LISTING_REVIEW','QNA','INDUSTRY_NEWS','TAX_LAW','EQUIPMENT'); "
    "END IF; END $$;\n"
    "DO $$ BEGIN "
    "IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'poststatus') THEN "
    "CREATE TYPE poststatus AS ENUM ('ACTIVE','HIDDEN','DELETED'); "
    "END IF; END $$;\n"
    "CREATE TABLE IF NOT EXISTS community_posts ("
    "id SERIAL PRIMARY KEY, "
    "user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, "
    "title VARCHAR(300) NOT NULL, "
    "content TEXT NOT NULL, "
    "category communitycategory NOT NULL, "
    "tags TEXT[] DEFAULT '{}', "
    "view_count INTEGER DEFAULT 0, "
    "like_count INTEGER DEFAULT 0, "
    "comment_count INTEGER DEFAULT 0, "
    "is_pinned BOOLEAN DEFAULT FALSE, "
    "status poststatus DEFAULT 'ACTIVE', "
    "created_at TIMESTAMP DEFAULT NOW(), "
    "updated_at TIMESTAMP DEFAULT NOW()"
    ");\n"
    "CREATE INDEX IF NOT EXISTS ix_community_category ON community_posts(category);\n"
    "CREATE INDEX IF NOT EXISTS ix_community_user ON community_posts(user_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_community_status ON community_posts(status);\n"
    "CREATE INDEX IF NOT EXISTS ix_community_pinned ON community_posts(is_pinned);\n"
    "CREATE TABLE IF NOT EXISTS community_comments ("
    "id SERIAL PRIMARY KEY, "
    "post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE, "
    "user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, "
    "parent_id INTEGER REFERENCES community_comments(id) ON DELETE CASCADE, "
    "content TEXT NOT NULL, "
    "like_count INTEGER DEFAULT 0, "
    "created_at TIMESTAMP DEFAULT NOW(), "
    "updated_at TIMESTAMP DEFAULT NOW()"
    ");\n"
    "CREATE INDEX IF NOT EXISTS ix_comm_comment_post ON community_comments(post_id);\n"
    "CREATE INDEX IF NOT EXISTS ix_comm_comment_parent ON community_comments(parent_id);\n"
    "CREATE TABLE IF NOT EXISTS community_likes ("
    "id SERIAL PRIMARY KEY, "
    "user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, "
    "post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE, "
    "created_at TIMESTAMP DEFAULT NOW(), "
    "UNIQUE(user_id, post_id)"
    ");\n"
)


async def run():
    dsn = os.getenv("DATABASE_URL", "")
    if dsn.startswith("postgresql+asyncpg://"):
        dsn = dsn.replace("postgresql+asyncpg://", "postgresql://", 1)
    elif dsn.startswith("postgres://"):
        pass
    else:
        print("\u26a0\ufe0f  DATABASE_URL not set \u2013 skipping migration 021")
        return

    conn = await asyncpg.connect(dsn)
    try:
        for stmt in SQL.strip().split(";\n"):
            stmt = stmt.strip()
            if stmt:
                await conn.execute(stmt)
        print("\u2705 Migration 021 (community) applied")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(run())
