"""
Pytest configuration and fixtures for 메디플라톤 tests
"""
import pytest
import asyncio
from typing import AsyncGenerator, Generator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool
import uuid

from app.main import app
from app.core.database import Base, get_db
from app.core.security import create_access_token, get_password_hash
from app.models.user import User, UserRole


# Test database URL (use SQLite for testing or a separate PostgreSQL DB)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


# Create test engine
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    poolclass=NullPool,
)

# Test session factory
TestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an instance of the default event loop for each test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Create a fresh database session for each test.
    Tables are created and dropped for each test.
    """
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestSessionLocal() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """
    Create a test client with database session override.
    """
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password=get_password_hash("testpassword123"),
        full_name="Test User",
        phone="010-1234-5678",
        role=UserRole.DOCTOR,
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def test_admin(db_session: AsyncSession) -> User:
    """Create a test admin user."""
    admin = User(
        id=uuid.uuid4(),
        email="admin@example.com",
        hashed_password=get_password_hash("adminpassword123"),
        full_name="Admin User",
        phone="010-9999-9999",
        role=UserRole.ADMIN,
        is_active=True,
        is_verified=True,
    )
    db_session.add(admin)
    await db_session.commit()
    await db_session.refresh(admin)
    return admin


@pytest.fixture
async def test_pharmacist(db_session: AsyncSession) -> User:
    """Create a test pharmacist user."""
    pharmacist = User(
        id=uuid.uuid4(),
        email="pharmacist@example.com",
        hashed_password=get_password_hash("pharmpassword123"),
        full_name="Test Pharmacist",
        phone="010-5555-5555",
        role=UserRole.PHARMACIST,
        license_number="PHARM-12345",
        is_active=True,
        is_verified=True,
    )
    db_session.add(pharmacist)
    await db_session.commit()
    await db_session.refresh(pharmacist)
    return pharmacist


@pytest.fixture
async def test_sales_rep(db_session: AsyncSession) -> User:
    """Create a test sales representative user."""
    sales_rep = User(
        id=uuid.uuid4(),
        email="sales@example.com",
        hashed_password=get_password_hash("salespassword123"),
        full_name="Test Sales Rep",
        phone="010-7777-7777",
        role=UserRole.SALES_REP,
        company="Test Pharma Corp",
        is_active=True,
        is_verified=True,
    )
    db_session.add(sales_rep)
    await db_session.commit()
    await db_session.refresh(sales_rep)
    return sales_rep


@pytest.fixture
def auth_headers(test_user: User) -> dict:
    """Generate authentication headers for test user."""
    token = create_access_token(data={"sub": str(test_user.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_auth_headers(test_admin: User) -> dict:
    """Generate authentication headers for admin user."""
    token = create_access_token(data={"sub": str(test_admin.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def pharmacist_auth_headers(test_pharmacist: User) -> dict:
    """Generate authentication headers for pharmacist user."""
    token = create_access_token(data={"sub": str(test_pharmacist.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sales_rep_auth_headers(test_sales_rep: User) -> dict:
    """Generate authentication headers for sales rep user."""
    token = create_access_token(data={"sub": str(test_sales_rep.id)})
    return {"Authorization": f"Bearer {token}"}
