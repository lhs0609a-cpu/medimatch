from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool
from typing import AsyncGenerator
import asyncio
import logging
import os
import socket
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
    """Initialize database tables, retrying transient DNS failures (Fly internal DNS warm-up)."""
    last_err: Exception | None = None
    for attempt in range(1, 11):
        try:
            async with engine.begin() as conn:
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
                await conn.run_sync(Base.metadata.create_all)
            return
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
    raise RuntimeError(f"Database init failed after 10 retries: {last_err}")
