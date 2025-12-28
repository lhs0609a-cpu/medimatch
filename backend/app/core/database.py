from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool
from typing import AsyncGenerator
import os
from .config import settings

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
    """Initialize database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
