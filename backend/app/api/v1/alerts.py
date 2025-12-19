from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from ...schemas.prospect import (
    UserAlertCreate, UserAlertUpdate, UserAlertResponse, UserAlertListResponse
)
from ...services.prospect import prospect_service
from ...models.user import User
from ..deps import get_db, get_current_active_user

router = APIRouter()


@router.post("", response_model=UserAlertResponse, status_code=status.HTTP_201_CREATED)
async def create_alert(
    alert_data: UserAlertCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    알림 조건 설정

    새로운 잠재 개원지가 조건에 맞으면 알림을 받습니다.

    - **region_codes**: 관심 지역 코드 배열
    - **region_names**: 관심 지역명 배열
    - **clinic_types**: 관심 진료과목 배열
    - **min_score**: 최소 적합도 점수
    - **prospect_types**: 관심 유형 (NEW_BUILD, VACANCY 등)
    - **notify_email**: 이메일 알림 여부
    - **notify_push**: 푸시 알림 여부
    """
    alert = await prospect_service.create_alert(
        db=db,
        alert_data=alert_data,
        user_id=current_user.id
    )
    return UserAlertResponse.model_validate(alert)


@router.get("", response_model=UserAlertListResponse)
async def get_alerts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """내 알림 조건 목록"""
    alerts = await prospect_service.get_user_alerts(db, current_user.id)
    return UserAlertListResponse(
        items=[UserAlertResponse.model_validate(a) for a in alerts],
        total=len(alerts)
    )


@router.put("/{alert_id}", response_model=UserAlertResponse)
async def update_alert(
    alert_id: UUID,
    update_data: UserAlertUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """알림 조건 수정"""
    alert = await prospect_service.update_alert(
        db=db,
        alert_id=alert_id,
        user_id=current_user.id,
        update_data=update_data
    )
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    return UserAlertResponse.model_validate(alert)


@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_alert(
    alert_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """알림 조건 삭제"""
    deleted = await prospect_service.delete_alert(
        db=db,
        alert_id=alert_id,
        user_id=current_user.id
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
