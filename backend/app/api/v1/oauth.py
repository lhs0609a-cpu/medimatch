"""
소셜 로그인 API (Google, Naver, Kakao)

OAuth Flow:
1. Frontend calls GET /oauth/{provider}/login → gets auth_url + state
2. Frontend stores state in localStorage and redirects to auth_url
3. Provider redirects to backend GET /oauth/{provider}/callback?code=...&state=...
4. Backend exchanges code for tokens, creates/finds user, generates JWT
5. Backend redirects to FRONTEND_URL/oauth/callback?access_token=...&refresh_token=...&provider=...&state=...&oauth_success=true
6. Frontend /oauth/callback page validates state and stores tokens
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import httpx
import os
import secrets
import urllib.parse
import logging

from app.core.database import get_db
from app.core.security import create_access_token, create_refresh_token
from app.models.user import User, UserRole
from app.api.deps import get_current_active_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/oauth", tags=["oauth"])


# ============ 설정 ============

# Google OAuth
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")

# Naver OAuth
NAVER_CLIENT_ID = os.getenv("NAVER_CLIENT_ID", "")
NAVER_CLIENT_SECRET = os.getenv("NAVER_CLIENT_SECRET", "")

# Kakao OAuth
KAKAO_CLIENT_ID = os.getenv("KAKAO_CLIENT_ID", "")
KAKAO_CLIENT_SECRET = os.getenv("KAKAO_CLIENT_SECRET", "")

# URLs
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")


def _get_redirect_uri(provider: str) -> str:
    """Get OAuth redirect URI for the given provider (points to backend GET callback)."""
    env_key = f"{provider.upper()}_REDIRECT_URI"
    default = f"{BACKEND_URL}/api/v1/oauth/{provider}/callback"
    return os.getenv(env_key, default)


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
    redirect_uri = _get_redirect_uri("google")

    auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={GOOGLE_CLIENT_ID}"
        f"&redirect_uri={urllib.parse.quote(redirect_uri)}"
        f"&response_type=code"
        f"&scope=openid%20email%20profile"
        f"&state={state}"
        f"&access_type=offline"
        f"&prompt=consent"
    )

    return {"auth_url": auth_url, "state": state}


@router.get("/google/callback")
async def google_callback_get(
    code: str = Query(...),
    state: str = Query(default=""),
    db: AsyncSession = Depends(get_db),
):
    """Google OAuth 콜백 (GET - 프로바이더 리다이렉트 수신)"""
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        return _error_redirect("Google OAuth가 설정되지 않았습니다")

    redirect_uri = _get_redirect_uri("google")

    try:
        # 1. 인증 코드로 액세스 토큰 교환
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": redirect_uri,
                },
                timeout=30.0,
            )

        if token_response.status_code != 200:
            logger.error(f"Google token exchange failed: {token_response.text}")
            return _error_redirect("Google 인증 실패")

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
            return _error_redirect("사용자 정보 조회 실패")

        user_data = user_response.json()

        user_info = OAuthUserInfo(
            provider="google",
            provider_id=user_data["id"],
            email=user_data["email"],
            name=user_data.get("name", user_data["email"].split("@")[0]),
            picture=user_data.get("picture"),
        )

        return await _process_and_redirect(db, user_info, state)

    except httpx.RequestError as e:
        logger.error(f"Google OAuth error: {e}")
        return _error_redirect(f"OAuth 처리 중 오류가 발생했습니다")


# ============ Naver OAuth ============

@router.get("/naver/login")
async def naver_login():
    """Naver OAuth 로그인 URL 생성"""
    if not NAVER_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Naver OAuth가 설정되지 않았습니다")

    state = secrets.token_urlsafe(32)
    redirect_uri = _get_redirect_uri("naver")

    auth_url = (
        "https://nid.naver.com/oauth2.0/authorize"
        f"?client_id={NAVER_CLIENT_ID}"
        f"&redirect_uri={urllib.parse.quote(redirect_uri)}"
        f"&response_type=code"
        f"&state={state}"
    )

    return {"auth_url": auth_url, "state": state}


@router.get("/naver/callback")
async def naver_callback_get(
    code: str = Query(...),
    state: str = Query(default=""),
    db: AsyncSession = Depends(get_db),
):
    """Naver OAuth 콜백 (GET - 프로바이더 리다이렉트 수신)"""
    if not NAVER_CLIENT_ID or not NAVER_CLIENT_SECRET:
        return _error_redirect("Naver OAuth가 설정되지 않았습니다")

    try:
        # 1. 인증 코드로 액세스 토큰 교환
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://nid.naver.com/oauth2.0/token",
                data={
                    "grant_type": "authorization_code",
                    "client_id": NAVER_CLIENT_ID,
                    "client_secret": NAVER_CLIENT_SECRET,
                    "code": code,
                    "state": state,
                },
                timeout=30.0,
            )

        if token_response.status_code != 200:
            logger.error(f"Naver token exchange failed: {token_response.text}")
            return _error_redirect("Naver 인증 실패")

        token_data = token_response.json()

        if token_data.get("error"):
            return _error_redirect(token_data.get("error_description", "Naver 인증 실패"))

        access_token = token_data.get("access_token")

        # 2. 사용자 정보 가져오기
        async with httpx.AsyncClient() as client:
            user_response = await client.get(
                "https://openapi.naver.com/v1/nid/me",
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=30.0,
            )

        if user_response.status_code != 200:
            return _error_redirect("사용자 정보 조회 실패")

        user_data = user_response.json()

        if user_data.get("resultcode") != "00":
            return _error_redirect("사용자 정보 조회 실패")

        response_data = user_data.get("response", {})

        email = response_data.get("email")
        if not email:
            email = f"naver_{response_data['id']}@naver.local"

        user_info = OAuthUserInfo(
            provider="naver",
            provider_id=response_data["id"],
            email=email,
            name=response_data.get("name") or response_data.get("nickname") or f"User{response_data['id']}",
            picture=response_data.get("profile_image"),
        )

        return await _process_and_redirect(db, user_info, state)

    except httpx.RequestError as e:
        logger.error(f"Naver OAuth error: {e}")
        return _error_redirect("OAuth 처리 중 오류가 발생했습니다")


# ============ Kakao OAuth ============

@router.get("/kakao/login")
async def kakao_login():
    """Kakao OAuth 로그인 URL 생성"""
    if not KAKAO_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Kakao OAuth가 설정되지 않았습니다")

    state = secrets.token_urlsafe(32)
    redirect_uri = _get_redirect_uri("kakao")

    auth_url = (
        "https://kauth.kakao.com/oauth/authorize"
        f"?client_id={KAKAO_CLIENT_ID}"
        f"&redirect_uri={urllib.parse.quote(redirect_uri)}"
        f"&response_type=code"
        f"&state={state}"
    )

    return {"auth_url": auth_url, "state": state}


@router.get("/kakao/callback")
async def kakao_callback_get(
    code: str = Query(...),
    state: str = Query(default=""),
    db: AsyncSession = Depends(get_db),
):
    """Kakao OAuth 콜백 (GET - 프로바이더 리다이렉트 수신)"""
    if not KAKAO_CLIENT_ID:
        return _error_redirect("Kakao OAuth가 설정되지 않았습니다")

    redirect_uri = _get_redirect_uri("kakao")

    try:
        # 1. 인증 코드로 액세스 토큰 교환
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://kauth.kakao.com/oauth/token",
                data={
                    "grant_type": "authorization_code",
                    "client_id": KAKAO_CLIENT_ID,
                    "client_secret": KAKAO_CLIENT_SECRET,
                    "redirect_uri": redirect_uri,
                    "code": code,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=30.0,
            )

        if token_response.status_code != 200:
            logger.error(f"Kakao token exchange failed: {token_response.text}")
            return _error_redirect("Kakao 인증 실패")

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
            return _error_redirect("사용자 정보 조회 실패")

        user_data = user_response.json()

        kakao_account = user_data.get("kakao_account", {})
        profile = kakao_account.get("profile", {})

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

        return await _process_and_redirect(db, user_info, state)

    except httpx.RequestError as e:
        logger.error(f"Kakao OAuth error: {e}")
        return _error_redirect("OAuth 처리 중 오류가 발생했습니다")


# ============ 공통 함수 ============

async def process_oauth_user(db: AsyncSession, user_info: OAuthUserInfo) -> dict:
    """OAuth 사용자 처리 (생성 또는 조회) → JWT 토큰 + 유저 정보 반환"""

    # 기존 사용자 확인 (이메일로)
    result = await db.execute(
        select(User).where(User.email == user_info.email)
    )
    user = result.scalar_one_or_none()

    if not user:
        # 새 사용자 생성
        from app.core.security import get_password_hash
        temp_password = secrets.token_urlsafe(32)

        user = User(
            email=user_info.email,
            hashed_password=get_password_hash(temp_password),
            full_name=user_info.name,
            role=UserRole.DOCTOR,  # 기본 역할
            is_active=True,
            is_verified=True,  # OAuth 로그인은 이메일 인증 불필요
            oauth_provider=user_info.provider,
            oauth_provider_id=user_info.provider_id,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    else:
        # 기존 사용자 OAuth 정보 업데이트 (최초 OAuth 로그인 시)
        if not user.oauth_provider:
            user.oauth_provider = user_info.provider
            user.oauth_provider_id = user_info.provider_id
            await db.commit()

    # 로그인 시간 업데이트
    user.last_login = datetime.utcnow()
    await db.commit()

    # JWT 토큰 생성 (올바른 시그니처 사용)
    access_token = create_access_token(str(user.id), user.role.value)
    refresh_token = create_refresh_token(str(user.id))

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value,
            "is_verified": user.is_verified,
        }
    }


async def _process_and_redirect(db: AsyncSession, user_info: OAuthUserInfo, state: str) -> RedirectResponse:
    """OAuth 사용자 처리 후 프론트엔드로 리다이렉트"""
    try:
        result = await process_oauth_user(db, user_info)

        # 프론트엔드 콜백 페이지로 리다이렉트 (토큰을 URL 파라미터로 전달)
        params = urllib.parse.urlencode({
            "access_token": result["access_token"],
            "refresh_token": result["refresh_token"],
            "provider": user_info.provider,
            "state": state,
            "oauth_success": "true",
        })
        redirect_url = f"{FRONTEND_URL}/oauth/callback?{params}"
        return RedirectResponse(url=redirect_url, status_code=302)

    except Exception as e:
        logger.error(f"OAuth user processing error: {e}")
        return _error_redirect(str(e))


def _error_redirect(error_message: str) -> RedirectResponse:
    """에러 시 프론트엔드 콜백 페이지로 리다이렉트"""
    params = urllib.parse.urlencode({
        "error": error_message,
        "oauth_success": "false",
    })
    redirect_url = f"{FRONTEND_URL}/oauth/callback?{params}"
    return RedirectResponse(url=redirect_url, status_code=302)


# ============ 연결 해제 ============

@router.post("/disconnect/{provider}")
async def disconnect_oauth(
    provider: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """OAuth 연결 해제"""
    valid_providers = ["google", "naver", "kakao"]
    if provider.lower() not in valid_providers:
        raise HTTPException(status_code=400, detail="지원하지 않는 OAuth 제공자입니다")

    if not current_user.oauth_provider:
        raise HTTPException(status_code=400, detail="연결된 OAuth 계정이 없습니다")

    if current_user.oauth_provider.lower() != provider.lower():
        raise HTTPException(
            status_code=400,
            detail=f"현재 연결된 계정은 {current_user.oauth_provider}입니다"
        )

    current_user.oauth_provider = None
    current_user.oauth_provider_id = None
    await db.commit()

    return {
        "message": f"{provider} 연결이 해제되었습니다",
        "warning": "비밀번호 로그인을 사용하려면 비밀번호를 설정해주세요"
    }


@router.get("/status")
async def get_oauth_status(
    current_user: User = Depends(get_current_active_user)
):
    """현재 사용자의 OAuth 연결 상태 조회"""
    return {
        "oauth_connected": current_user.oauth_provider is not None,
        "provider": current_user.oauth_provider,
    }
