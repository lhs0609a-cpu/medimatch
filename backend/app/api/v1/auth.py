from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from datetime import datetime
import logging

from ...schemas.user import (
    UserCreate, UserResponse, UserLogin, UserUpdate,
    Token, TokenRefresh
)
from ...models.user import User
from ...core.security import (
    get_password_hash, verify_password,
    create_access_token, create_refresh_token, verify_token,
    get_current_user, TokenData
)
from ..deps import get_db, get_current_active_user

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """새 사용자 등록"""
    # Check if email already exists
    result = await db.execute(
        select(User).where(User.email == user_data.email)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create user
    user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        phone=user_data.phone,
        role=user_data.role,
        company=user_data.company,
        license_number=user_data.license_number
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)

    return user


@router.post("/login", response_model=Token)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """로그인"""
    result = await db.execute(
        select(User).where(User.email == credentials.email)
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )

    # Update last login
    user.last_login = datetime.utcnow()
    await db.commit()

    # Create tokens
    access_token = create_access_token(str(user.id), user.role.value)
    refresh_token = create_refresh_token(str(user.id))

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user)
    )


@router.post("/refresh", response_model=Token)
async def refresh_token(
    token_data: TokenRefresh,
    db: AsyncSession = Depends(get_db)
):
    """토큰 갱신"""
    try:
        payload = verify_token(token_data.refresh_token, "refresh")
    except HTTPException:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    result = await db.execute(
        select(User).where(User.id == payload.user_id)
    )
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )

    # Create new tokens
    access_token = create_access_token(str(user.id), user.role.value)
    refresh_token = create_refresh_token(str(user.id))

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """현재 사용자 정보 조회"""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    update_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """현재 사용자 정보 수정"""
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(current_user, key, value)

    await db.commit()
    await db.refresh(current_user)

    return current_user


@router.post("/logout")
async def logout(
    current_user: TokenData = Depends(get_current_user)
):
    """로그아웃 (클라이언트에서 토큰 삭제)"""
    # In a real implementation, you might want to blacklist the token
    return {"message": "Successfully logged out"}


@router.delete("/me")
async def delete_account(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """계정 삭제 (GDPR/개인정보보호법 준수)"""
    # Soft delete - mark as inactive and anonymize personal data
    current_user.is_active = False
    current_user.email = f"deleted_{current_user.id}@deleted.local"
    current_user.full_name = "삭제된 사용자"
    current_user.phone = None
    current_user.company = None
    current_user.license_number = None

    await db.commit()

    return {"message": "계정이 성공적으로 삭제되었습니다"}


class PasswordResetRequest(BaseModel):
    email: EmailStr


@router.post("/forgot-password")
async def forgot_password(
    data: PasswordResetRequest,
    db: AsyncSession = Depends(get_db)
):
    """비밀번호 재설정 이메일 발송 요청"""
    # Always return success to prevent email enumeration
    result = await db.execute(
        select(User).where(User.email == data.email)
    )
    user = result.scalar_one_or_none()

    if user and user.is_active:
        # TODO: Send password reset email via SMTP when configured
        logger.info(f"Password reset requested for: {data.email}")

    return {"message": "등록된 이메일이라면 비밀번호 재설정 링크가 발송됩니다."}
