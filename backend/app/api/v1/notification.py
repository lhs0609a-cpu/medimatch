"""
알림 API
- 디바이스 등록/해제
- 알림 내역 조회
- 알림 설정 관리
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func, desc
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.notification import (
    UserDevice, UserNotification, NotificationPreference,
    DevicePlatform, NotificationType
)

router = APIRouter(prefix="/notifications", tags=["notifications"])


# ============ Schemas ============

class DeviceRegisterRequest(BaseModel):
    fcm_token: str = Field(..., description="FCM 토큰")
    platform: DevicePlatform = Field(default=DevicePlatform.WEB)
    device_name: Optional[str] = Field(None, description="디바이스 이름 (e.g., Chrome on Windows)")


class DeviceResponse(BaseModel):
    id: UUID
    platform: DevicePlatform
    device_name: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    id: UUID
    notification_type: NotificationType
    title: str
    body: str
    data: Optional[dict]
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    notifications: List[NotificationResponse]
    total: int
    unread_count: int


class PreferenceRequest(BaseModel):
    email_enabled: Optional[bool] = None
    push_enabled: Optional[bool] = None
    sms_enabled: Optional[bool] = None
    kakao_enabled: Optional[bool] = None
    prospect_alerts: Optional[bool] = None
    chat_messages: Optional[bool] = None
    payment_updates: Optional[bool] = None
    match_updates: Optional[bool] = None
    marketing: Optional[bool] = None


class PreferenceResponse(BaseModel):
    email_enabled: bool
    push_enabled: bool
    sms_enabled: bool
    kakao_enabled: bool
    prospect_alerts: bool
    chat_messages: bool
    payment_updates: bool
    match_updates: bool
    marketing: bool

    class Config:
        from_attributes = True


# ============ 디바이스 관리 ============

@router.post("/devices", response_model=DeviceResponse)
async def register_device(
    request: DeviceRegisterRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    디바이스 등록 (FCM 푸시 알림용)
    - 같은 토큰이 이미 있으면 업데이트
    """
    # 기존 토큰 확인
    result = await db.execute(
        select(UserDevice).where(UserDevice.fcm_token == request.fcm_token)
    )
    existing = result.scalar_one_or_none()

    if existing:
        # 기존 토큰 업데이트 (다른 사용자 것이면 재할당)
        existing.user_id = current_user.id
        existing.platform = request.platform
        existing.device_name = request.device_name
        existing.is_active = True
        existing.last_used_at = datetime.utcnow()
        await db.commit()
        await db.refresh(existing)
        return existing

    # 새 디바이스 등록
    device = UserDevice(
        user_id=current_user.id,
        fcm_token=request.fcm_token,
        platform=request.platform,
        device_name=request.device_name
    )
    db.add(device)
    await db.commit()
    await db.refresh(device)

    return device


@router.get("/devices", response_model=List[DeviceResponse])
async def get_devices(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """등록된 디바이스 목록 조회"""
    result = await db.execute(
        select(UserDevice)
        .where(UserDevice.user_id == current_user.id, UserDevice.is_active == True)
        .order_by(desc(UserDevice.last_used_at))
    )
    return result.scalars().all()


@router.delete("/devices/{device_id}")
async def unregister_device(
    device_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """디바이스 등록 해제"""
    result = await db.execute(
        select(UserDevice).where(
            UserDevice.id == device_id,
            UserDevice.user_id == current_user.id
        )
    )
    device = result.scalar_one_or_none()

    if not device:
        raise HTTPException(status_code=404, detail="디바이스를 찾을 수 없습니다")

    device.is_active = False
    await db.commit()

    return {"message": "디바이스 등록이 해제되었습니다"}


@router.delete("/devices")
async def unregister_all_devices(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """모든 디바이스 등록 해제"""
    await db.execute(
        update(UserDevice)
        .where(UserDevice.user_id == current_user.id)
        .values(is_active=False)
    )
    await db.commit()

    return {"message": "모든 디바이스 등록이 해제되었습니다"}


# ============ 알림 내역 ============

@router.get("", response_model=NotificationListResponse)
async def get_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, le=100),
    unread_only: bool = Query(False),
    notification_type: Optional[NotificationType] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """알림 내역 조회"""
    query = select(UserNotification).where(UserNotification.user_id == current_user.id)

    if unread_only:
        query = query.where(UserNotification.is_read == False)

    if notification_type:
        query = query.where(UserNotification.notification_type == notification_type)

    # 총 개수
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.execute(count_query)
    total_count = total.scalar()

    # 읽지 않은 개수
    unread_query = select(func.count()).where(
        UserNotification.user_id == current_user.id,
        UserNotification.is_read == False
    )
    unread = await db.execute(unread_query)
    unread_count = unread.scalar()

    # 알림 목록
    result = await db.execute(
        query.order_by(desc(UserNotification.created_at))
        .offset(skip)
        .limit(limit)
    )

    return {
        "notifications": result.scalars().all(),
        "total": total_count,
        "unread_count": unread_count
    }


@router.post("/{notification_id}/read")
async def mark_as_read(
    notification_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """알림 읽음 처리"""
    result = await db.execute(
        select(UserNotification).where(
            UserNotification.id == notification_id,
            UserNotification.user_id == current_user.id
        )
    )
    notification = result.scalar_one_or_none()

    if not notification:
        raise HTTPException(status_code=404, detail="알림을 찾을 수 없습니다")

    notification.is_read = True
    notification.read_at = datetime.utcnow()
    await db.commit()

    return {"message": "읽음 처리되었습니다"}


@router.post("/read-all")
async def mark_all_as_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """모든 알림 읽음 처리"""
    await db.execute(
        update(UserNotification)
        .where(
            UserNotification.user_id == current_user.id,
            UserNotification.is_read == False
        )
        .values(is_read=True, read_at=datetime.utcnow())
    )
    await db.commit()

    return {"message": "모든 알림이 읽음 처리되었습니다"}


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """알림 삭제"""
    result = await db.execute(
        select(UserNotification).where(
            UserNotification.id == notification_id,
            UserNotification.user_id == current_user.id
        )
    )
    notification = result.scalar_one_or_none()

    if not notification:
        raise HTTPException(status_code=404, detail="알림을 찾을 수 없습니다")

    await db.delete(notification)
    await db.commit()

    return {"message": "알림이 삭제되었습니다"}


# ============ 알림 설정 ============

@router.get("/preferences", response_model=PreferenceResponse)
async def get_preferences(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """알림 설정 조회"""
    result = await db.execute(
        select(NotificationPreference).where(
            NotificationPreference.user_id == current_user.id
        )
    )
    pref = result.scalar_one_or_none()

    if not pref:
        # 기본 설정 생성
        pref = NotificationPreference(user_id=current_user.id)
        db.add(pref)
        await db.commit()
        await db.refresh(pref)

    return pref


@router.put("/preferences", response_model=PreferenceResponse)
async def update_preferences(
    request: PreferenceRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """알림 설정 업데이트"""
    result = await db.execute(
        select(NotificationPreference).where(
            NotificationPreference.user_id == current_user.id
        )
    )
    pref = result.scalar_one_or_none()

    if not pref:
        pref = NotificationPreference(user_id=current_user.id)
        db.add(pref)

    # 요청된 필드만 업데이트
    update_data = request.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(pref, key, value)

    await db.commit()
    await db.refresh(pref)

    return pref


# ============ 테스트 알림 발송 ============

@router.post("/test")
async def send_test_notification(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """테스트 알림 발송 (개발용)"""
    # 알림 생성
    notification = UserNotification(
        user_id=current_user.id,
        notification_type=NotificationType.SYSTEM,
        title="테스트 알림",
        body="이것은 테스트 알림입니다. 알림이 정상적으로 작동하고 있습니다.",
        data={"url": "/notifications"}
    )
    db.add(notification)
    await db.commit()

    # FCM 푸시 발송 (디바이스가 있는 경우)
    result = await db.execute(
        select(UserDevice).where(
            UserDevice.user_id == current_user.id,
            UserDevice.is_active == True
        )
    )
    devices = result.scalars().all()

    from app.tasks.notifications import send_push_notification

    for device in devices:
        send_push_notification.delay(
            current_user.id,
            "테스트 알림",
            "이것은 테스트 푸시 알림입니다.",
            {"url": "/notifications"}
        )

    return {
        "message": "테스트 알림이 발송되었습니다",
        "devices_count": len(devices)
    }
