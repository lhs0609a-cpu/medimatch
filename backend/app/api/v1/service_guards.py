"""
서비스 구독 게이팅 유틸리티

FastAPI Depends()로 사용하여 활성 서비스 구독이 필요한 엔드포인트 보호
"""
from fastapi import Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from ..deps import get_db, get_current_active_user
from ...models.user import User
from ...models.service_subscription import (
    ServiceSubscription, ServiceType, ServiceSubStatus
)


def require_active_service(service_type: ServiceType):
    """
    활성 서비스 구독 필요 의존성 팩토리

    사용법:
        @router.get("/protected")
        async def protected_endpoint(
            sub: ServiceSubscription = Depends(require_active_service(ServiceType.HOMEPAGE))
        ):
            ...
    """
    async def _check(
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_active_user),
    ) -> ServiceSubscription:
        result = await db.execute(
            select(ServiceSubscription).where(
                and_(
                    ServiceSubscription.user_id == current_user.id,
                    ServiceSubscription.service_type == service_type,
                    ServiceSubscription.status == ServiceSubStatus.ACTIVE,
                )
            )
        )
        sub = result.scalar_one_or_none()

        if not sub:
            service_names = {
                ServiceType.HOMEPAGE: "홈페이지 제작",
                ServiceType.PROGRAM: "프로그램 개발",
                ServiceType.EMR: "클라우드 EMR",
            }
            name = service_names.get(service_type, service_type.value)
            raise HTTPException(
                status_code=403,
                detail=f"활성 {name} 구독이 필요합니다. 구독을 시작해주세요.",
            )

        return sub

    return _check
