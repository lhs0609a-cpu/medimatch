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


async def init_db():
    """Initialize DB tables on startup.

    1) create_all: 신규 테이블만 생성 (alembic-style 001~010이 정의한 것 + 모델)
    2) drift detector: 모델과 실제 DB 컬럼 비교 — 누락 시 ERROR 로그
    3) 마이그레이션 적용: fly.toml의 release_command(`python -m app.db.migrate`)가
       deploy 단계에서 실행 — startup 시점에는 이미 완료되어 있음

    startup에서 마이그레이션을 안 돌리는 이유:
    - 다중 머신 race condition 회피
    - 마이그레이션 실패가 머신 죽음으로 이어지지 않음
    - deploy 실패가 트래픽에 영향 X (이전 빌드 그대로 유지)
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

    # Schema drift 점검 — 모델과 DB 불일치 사전 경고 (non-fatal)
    try:
        from ..db.drift import log_drift_or_clean
        await log_drift_or_clean(engine, Base.metadata)
    except Exception as e:
        logger.warning(f"Drift detector skipped: {e}")
