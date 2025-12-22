"""
소셜 로그인 API (Google, Kakao)
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import httpx
import os
import secrets

from app.core.database import get_db
from app.core.security import create_access_token, create_refresh_token
from app.models.user import User, UserRole

router = APIRouter(prefix="/oauth", tags=["oauth"])


# ============ 설정 ============

# Google OAuth
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:3000/api/auth/callback/google")

# Kakao OAuth
KAKAO_CLIENT_ID = os.getenv("KAKAO_CLIENT_ID", "")
KAKAO_CLIENT_SECRET = os.getenv("KAKAO_CLIENT_SECRET", "")
KAKAO_REDIRECT_URI = os.getenv("KAKAO_REDIRECT_URI", "http://localhost:3000/api/auth/callback/kakao")

# Frontend URL
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


# ============ Schemas ============

class OAuthCallbackRequest(BaseModel):
    code: str
    state: Optional[str] = None


class OAuthTokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


class OAuthUserInfo(BaseModel):
    provider: str
    provider_id: str
    email: str
    name: str
    picture: Optional[str] = None


# ============ Google OAuth ============

@router.get("/google/login")
async def google_login():
    """Google OAuth 로그인 URL 생성"""
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google OAuth가 설정되지 않았습니다")

    state = secrets.token_urlsafe(32)

    auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={GOOGLE_CLIENT_ID}"
        f"&redirect_uri={GOOGLE_REDIRECT_URI}"
        f"&response_type=code"
        f"&scope=openid%20email%20profile"
        f"&state={state}"
        f"&access_type=offline"
        f"&prompt=consent"
    )

    return {"auth_url": auth_url, "state": state}


@router.post("/google/callback", response_model=OAuthTokenResponse)
async def google_callback(
    data: OAuthCallbackRequest,
    db: AsyncSession = Depends(get_db)
):
    """Google OAuth 콜백 처리"""
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Google OAuth가 설정되지 않았습니다")

    try:
        # 1. 인증 코드로 액세스 토큰 교환
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "code": data.code,
                    "grant_type": "authorization_code",
                    "redirect_uri": GOOGLE_REDIRECT_URI,
                },
                timeout=30.0,
            )

        if token_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Google 인증 실패")

        token_data = token_response.json()
        access_token = token_data.get("access_token")

        # 2. 사용자 정보 가져오기
        async with httpx.AsyncClient() as client:
            user_response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=30.0,
            )

        if user_response.status_code != 200:
            raise HTTPException(status_code=400, detail="사용자 정보 조회 실패")

        user_data = user_response.json()

        user_info = OAuthUserInfo(
            provider="google",
            provider_id=user_data["id"],
            email=user_data["email"],
            name=user_data.get("name", user_data["email"].split("@")[0]),
            picture=user_data.get("picture"),
        )

        # 3. 사용자 생성/조회
        return await process_oauth_user(db, user_info)

    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"OAuth 처리 중 오류: {str(e)}")


# ============ Kakao OAuth ============

@router.get("/kakao/login")
async def kakao_login():
    """Kakao OAuth 로그인 URL 생성"""
    if not KAKAO_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Kakao OAuth가 설정되지 않았습니다")

    state = secrets.token_urlsafe(32)

    auth_url = (
        "https://kauth.kakao.com/oauth/authorize"
        f"?client_id={KAKAO_CLIENT_ID}"
        f"&redirect_uri={KAKAO_REDIRECT_URI}"
        f"&response_type=code"
        f"&state={state}"
    )

    return {"auth_url": auth_url, "state": state}


@router.post("/kakao/callback", response_model=OAuthTokenResponse)
async def kakao_callback(
    data: OAuthCallbackRequest,
    db: AsyncSession = Depends(get_db)
):
    """Kakao OAuth 콜백 처리"""
    if not KAKAO_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Kakao OAuth가 설정되지 않았습니다")

    try:
        # 1. 인증 코드로 액세스 토큰 교환
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://kauth.kakao.com/oauth/token",
                data={
                    "grant_type": "authorization_code",
                    "client_id": KAKAO_CLIENT_ID,
                    "client_secret": KAKAO_CLIENT_SECRET,
                    "redirect_uri": KAKAO_REDIRECT_URI,
                    "code": data.code,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=30.0,
            )

        if token_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Kakao 인증 실패")

        token_data = token_response.json()
        access_token = token_data.get("access_token")

        # 2. 사용자 정보 가져오기
        async with httpx.AsyncClient() as client:
            user_response = await client.get(
                "https://kapi.kakao.com/v2/user/me",
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=30.0,
            )

        if user_response.status_code != 200:
            raise HTTPException(status_code=400, detail="사용자 정보 조회 실패")

        user_data = user_response.json()

        kakao_account = user_data.get("kakao_account", {})
        profile = kakao_account.get("profile", {})

        # 이메일이 없는 경우 카카오 ID로 대체 이메일 생성
        email = kakao_account.get("email")
        if not email:
            email = f"kakao_{user_data['id']}@kakao.local"

        user_info = OAuthUserInfo(
            provider="kakao",
            provider_id=str(user_data["id"]),
            email=email,
            name=profile.get("nickname", f"User{user_data['id']}"),
            picture=profile.get("profile_image_url"),
        )

        # 3. 사용자 생성/조회
        return await process_oauth_user(db, user_info)

    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"OAuth 처리 중 오류: {str(e)}")


# ============ 공통 함수 ============

async def process_oauth_user(db: AsyncSession, user_info: OAuthUserInfo) -> OAuthTokenResponse:
    """OAuth 사용자 처리 (생성 또는 조회)"""

    # 기존 사용자 확인 (이메일로)
    result = await db.execute(
        select(User).where(User.email == user_info.email)
    )
    user = result.scalar_one_or_none()

    if not user:
        # 새 사용자 생성
        # OAuth 로그인의 경우 임시 비밀번호 설정 (실제로는 사용되지 않음)
        from app.core.security import get_password_hash
        temp_password = secrets.token_urlsafe(32)

        user = User(
            email=user_info.email,
            hashed_password=get_password_hash(temp_password),
            full_name=user_info.name,
            role=UserRole.DOCTOR,  # 기본 역할
            is_active=True,
            is_verified=True,  # OAuth 로그인은 이메일 인증 불필요
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    # 로그인 시간 업데이트
    user.last_login = datetime.utcnow()
    await db.commit()

    # JWT 토큰 생성
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return OAuthTokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user={
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value,
            "is_verified": user.is_verified,
        }
    )


# ============ 연결 해제 ============

@router.post("/disconnect/{provider}")
async def disconnect_oauth(
    provider: str,
    db: AsyncSession = Depends(get_db)
    # current_user = Depends(get_current_user)
):
    """OAuth 연결 해제"""
    # TODO: 사용자의 OAuth 연결 정보 삭제
    # 실제 구현에서는 별도의 OAuth 연결 테이블이 필요

    return {"message": f"{provider} 연결이 해제되었습니다"}
