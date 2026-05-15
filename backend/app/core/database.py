from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool
from typing import AsyncGenerator
import asyncio
import importlib.util
import logging
import os
import socket
from pathlib import Path
from .config import settings

logger = logging.getLogger("mediplaton.database")

# Create async engine (Fly.io internal connections don't need SSL)
connect_args = {}
if os.getenv("FLY_APP_NAME"):
    # Fly.io internal connections - disable SSL completely
    connect_args["ssl"] = False

engine = create_async_engine(
    settings.async_database_url,
    echo=settings.DATABASE_ECHO,
    poolclass=NullPool,
    connect_args=connect_args,
)

# Create async session factory
async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Base class for all models
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get database session."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def _run_async_migrations():
    """alembic/versions/*.py 중 asyncpg-style 멱등 마이그레이션을 순서대로 자동 실행.

    각 파일은 `async def run()` 정의 + `CREATE TABLE IF NOT EXISTS` /
    `ADD COLUMN IF NOT EXISTS` 같은 idempotent SQL을 사용해야 함.
    init_db()의 create_all()이 새 테이블만 만들고 컬럼 ALTER는 못하기 때문에
    이 자동 실행이 컬럼 추가/인덱스/FK 보강을 담당.
    """
    # /app/app/core/database.py → /app/alembic/versions
    versions_dir = Path(__file__).resolve().parent.parent.parent / "alembic" / "versions"
    if not versions_dir.exists():
        logger.warning(f"Auto-migration: dir not found {versions_dir} — skipping")
        return

    files = sorted([f for f in versions_dir.glob("*.py") if not f.name.startswith("__")])
    applied = 0
    skipped = 0
    failed = 0
    for f in files:
        try:
            src = f.read_text(encoding="utf-8")
        except Exception:
            continue
        if "async def run" not in src:
            skipped += 1  # alembic-style (001~010) — create_all이 처리
            continue
        try:
            spec = importlib.util.spec_from_file_location(f.stem, f)
            if spec is None or spec.loader is None:
                continue
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            if hasattr(module, "run") and asyncio.iscoroutinefunction(module.run):
                await module.run()
                applied += 1
        except Exception as e:
            failed += 1
            logger.warning(f"Auto-migration {f.name} failed (continuing): {e}")

    logger.info(
        f"Auto-migration done — applied: {applied}, skipped(alembic): {skipped}, failed: {failed}"
    )


async def init_db():
    """Initialize database tables + run asyncpg-style migrations.

    1) create_all: 신규 테이블 (alembic-style 001~010이 정의한 것 포함)
    2) _run_async_migrations: asyncpg-style 멱등 마이그레이션 011~041+
       — 컬럼 추가·인덱스·FK 보강 (create_all로는 불가)
    """
    last_err: Exception | None = None
    for attempt in range(1, 11):
        try:
            async with engine.begin() as conn:
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
                await conn.run_sync(Base.metadata.create_all)
            break
        except socket.gaierror as e:
            last_err = e
            wait = min(2 ** attempt, 30)
            logger.warning(
                "DB DNS resolution failed (attempt %d/10): %s — retrying in %ds",
                attempt, e, wait,
            )
            await asyncio.sleep(wait)
        except OSError as e:
            # asyncpg may wrap gaierror as OSError on some platforms
            if "Name or service not known" in str(e) or "gaierror" in str(e):
                last_err = e
                wait = min(2 ** attempt, 30)
                logger.warning(
                    "DB connection OSError (attempt %d/10): %s — retrying in %ds",
                    attempt, e, wait,
                )
                await asyncio.sleep(wait)
            else:
                raise
    else:
        raise RuntimeError(f"Database init failed after 10 retries: {last_err}")

    # asyncpg-style 멱등 마이그레이션 자동 실행 (create_all 다음에)
    try:
        await _run_async_migrations()
    except Exception as e:
        logger.error(f"Auto-migration runner crashed (non-fatal): {e}")
