from typing import AsyncGenerator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..core.database import async_session
from ..core.security import get_current_user, TokenData, RoleChecker, UserRole, verify_token
from ..models.user import User

# Optional bearer scheme (doesn't require auth)
optional_bearer = HTTPBearer(auto_error=False)


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_bearer)
) -> Optional[TokenData]:
    """Get current user if authenticated, None otherwise."""
    if not credentials:
        return None

    try:
        token = credentials.credentials
        token_data = verify_token(token)
        return token_data
    except Exception:
        return None


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Get database session dependency."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def get_current_active_user(
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(get_current_user)
) -> User:
    """Get current active user from database."""
    result = await db.execute(
        select(User).where(User.id == token_data.user_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )

    return user


# Role-based access control dependencies
require_admin = RoleChecker([UserRole.ADMIN])
require_pharmacist = RoleChecker([UserRole.ADMIN, UserRole.PHARMACIST])
require_sales_rep = RoleChecker([UserRole.ADMIN, UserRole.SALES_REP])
require_doctor = RoleChecker([UserRole.ADMIN, UserRole.DOCTOR])
