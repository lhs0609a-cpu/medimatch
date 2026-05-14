from datetime import datetime
from typing import AsyncGenerator, Optional
import logging

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..core.database import async_session
from ..core.security import get_current_user, TokenData, RoleChecker, UserRole, verify_token
from ..models.user import User, UserRole as UserRoleEnum
from ..models.doctor_lead import DoctorLead
from ..models.service_subscription import ServiceSubscription, ServiceType, ServiceSubStatus, ServiceTier

logger = logging.getLogger(__name__)

# Optional bearer scheme (doesn't require auth)
optional_bearer = HTTPBearer(auto_error=False)
# Required bearer for dual-token auth (JWT 또는 magic-link)
required_bearer = HTTPBearer(auto_error=True)


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


async def _resolve_magic_link_user(
    db: AsyncSession,
    token: str,
) -> Optional[User]:
    """
    Magic-link roadmap_token으로 User 조회 (없으면 DoctorLead로부터 자동 생성).

    무로그인 SSO 정책 — 마이로드맵 토큰이 사실상 사용자 식별자.
    EMR 사용은 곧 "전환된 의사"로 간주되어 lead → user 변환을 트리거.
    """
    if not token or len(token) < 16:
        return None

    lead_q = await db.execute(
        select(DoctorLead).where(DoctorLead.roadmap_token == token)
    )
    lead = lead_q.scalar_one_or_none()
    if not lead:
        return None

    # 토큰 만료 검증
    if lead.roadmap_token_expires_at and lead.roadmap_token_expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Magic-link 만료 — 새 링크를 받아주세요",
        )

    # 이미 전환된 lead → 해당 User 반환
    if lead.converted_user_id:
        ur = await db.execute(select(User).where(User.id == lead.converted_user_id))
        user = ur.scalar_one_or_none()
        if user and user.is_active:
            return user

    # 자동 전환: lead → 신규 User 생성
    # email은 lead.email 우선, 없으면 token prefix로 unique placeholder
    email = lead.email or f"lead-{token[:8]}@magic.medi"

    # 이메일 중복 방지 (재호출 시 race condition 보호)
    existing = await db.execute(select(User).where(User.email == email))
    user = existing.scalar_one_or_none()
    if not user:
        user = User(
            email=email,
            hashed_password="!magic-link-no-password!",  # bcrypt 호환 X — 일반 로그인 차단
            full_name=lead.name or "원장님",
            phone=lead.phone,
            role=UserRoleEnum.DOCTOR,
            is_active=True,
            is_verified=True,
            license_number=lead.license_number,
            specialty=lead.specialty,
        )
        db.add(user)
        await db.flush()  # id 확보

    # lead 연결 업데이트
    if not lead.converted_user_id:
        lead.converted_user_id = user.id
        lead.converted_at = datetime.utcnow()

    # EMR 서비스 구독 자동 발급 (체험 사용자 — service_guards 통과를 위해)
    sub_q = await db.execute(
        select(ServiceSubscription).where(
            ServiceSubscription.user_id == user.id,
            ServiceSubscription.service_type == ServiceType.EMR,
        )
    )
    if not sub_q.scalar_one_or_none():
        db.add(ServiceSubscription(
            user_id=user.id,
            service_type=ServiceType.EMR,
            tier=ServiceTier.STARTER,  # 무료 체험 티어 (0원)
            status=ServiceSubStatus.ACTIVE,
        ))

    await db.commit()
    await db.refresh(user)
    logger.info(f"Magic-link auth: lead {lead.id} → user {user.id} ({email})")
    return user


async def get_current_active_user(
    db: AsyncSession = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(required_bearer),
) -> User:
    """
    EMR 인증 — JWT access_token 또는 magic-link roadmap_token 모두 허용.

    1) JWT 시도 (정통 로그인 사용자)
    2) 실패 시 magic-link roadmap_token으로 DoctorLead 조회 → User 자동 전환
    3) 둘 다 실패 시 401
    """
    token = credentials.credentials

    # 1) JWT 먼저 시도
    try:
        token_data = verify_token(token)
        result = await db.execute(select(User).where(User.id == token_data.user_id))
        user = result.scalar_one_or_none()
        if user:
            if not user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="비활성 계정",
                )
            return user
        # JWT는 valid인데 user는 없는 경우 → fall through (드문 케이스)
    except HTTPException as e:
        # JWTError에서 401이 나오는 케이스만 fall through, 다른 에러는 그대로 전파
        if e.status_code != status.HTTP_401_UNAUTHORIZED:
            raise

    # 2) Magic-link 시도
    user = await _resolve_magic_link_user(db, token)
    if user:
        return user

    # 3) 둘 다 실패
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


# Role-based access control dependencies
require_admin = RoleChecker([UserRole.ADMIN])
require_pharmacist = RoleChecker([UserRole.ADMIN, UserRole.PHARMACIST])
require_sales_rep = RoleChecker([UserRole.ADMIN, UserRole.SALES_REP])
require_doctor = RoleChecker([UserRole.ADMIN, UserRole.DOCTOR])
