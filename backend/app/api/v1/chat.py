"""
채팅 API
- 플랫폼 내 1:1 채팅
- 연락처 우회 탐지 및 차단
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import selectinload
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.models.chat import ChatRoom, ChatMessage, ChatRoomStatus, ChatMessageType, generate_room_code
from app.models.partner import Partner, PartnerInquiry
from app.models.user import User
from app.models.escrow import ContactDetectionLog, DetectionAction
from app.api.deps import get_current_active_user
from app.services.contact_detector import detect_contact, ContactType

router = APIRouter(prefix="/chat", tags=["chat"])


# ============ Schemas ============

class ChatRoomSummary(BaseModel):
    id: int
    room_code: str
    partner_id: int
    partner_name: str
    partner_logo: Optional[str] = None
    status: str
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class ChatRoomListResponse(BaseModel):
    rooms: List[ChatRoomSummary]
    total: int


class ChatMessageResponse(BaseModel):
    id: str
    sender_id: str
    sender_type: str
    sender_name: Optional[str] = None
    message_type: str
    content: str
    filtered_content: Optional[str] = None
    contains_contact: bool
    attachments: List[dict]
    metadata: dict
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ChatRoomDetailResponse(BaseModel):
    id: int
    room_code: str
    partner_id: int
    partner_name: str
    partner_logo: Optional[str] = None
    inquiry_id: Optional[int] = None
    inquiry_title: Optional[str] = None
    status: str
    messages: List[ChatMessageResponse]
    created_at: datetime


class SendMessageRequest(BaseModel):
    message_type: str = "TEXT"  # TEXT, IMAGE, FILE, QUOTE
    content: str
    attachments: List[dict] = []
    metadata: dict = {}


class SendMessageResponse(BaseModel):
    message: ChatMessageResponse
    contact_detected: bool
    warning_message: Optional[str] = None


class CreateRoomRequest(BaseModel):
    partner_id: int
    inquiry_id: Optional[int] = None
    initial_message: Optional[str] = None


# ============ Endpoints ============

@router.get("/rooms", response_model=ChatRoomListResponse)
async def get_chat_rooms(
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """내 채팅방 목록"""
    query = select(ChatRoom).where(ChatRoom.user_id == current_user.id)

    if status:
        query = query.where(ChatRoom.status == status)

    query = query.options(selectinload(ChatRoom.partner))
    query = query.order_by(ChatRoom.last_message_at.desc().nullsfirst())

    # 총 개수
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # 페이지네이션
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    rooms = result.scalars().all()

    room_summaries = []
    for room in rooms:
        room_summaries.append(ChatRoomSummary(
            id=room.id,
            room_code=room.room_code,
            partner_id=room.partner_id,
            partner_name=room.partner.name if room.partner else "알 수 없음",
            partner_logo=room.partner.logo_url if room.partner else None,
            status=room.status.value if room.status else "ACTIVE",
            last_message=room.last_message,
            last_message_at=room.last_message_at,
            unread_count=room.user_unread_count,
            created_at=room.created_at
        ))

    return ChatRoomListResponse(rooms=room_summaries, total=total)


@router.get("/rooms/{room_id}", response_model=ChatRoomDetailResponse)
async def get_chat_room(
    room_id: int,
    before: Optional[datetime] = None,
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """채팅방 상세 (메시지 포함)"""
    # 채팅방 조회
    result = await db.execute(
        select(ChatRoom)
        .where(ChatRoom.id == room_id)
        .options(
            selectinload(ChatRoom.partner),
            selectinload(ChatRoom.inquiry)
        )
    )
    room = result.scalar_one_or_none()

    if not room:
        raise HTTPException(status_code=404, detail="채팅방을 찾을 수 없습니다")

    # 권한 확인 (참여자만)
    is_user = str(room.user_id) == str(current_user.id)
    is_partner = room.partner and room.partner.user_id and str(room.partner.user_id) == str(current_user.id)

    if not is_user and not is_partner:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다")

    # 메시지 조회
    msg_query = select(ChatMessage).where(ChatMessage.room_id == room_id)
    if before:
        msg_query = msg_query.where(ChatMessage.created_at < before)
    msg_query = msg_query.order_by(ChatMessage.created_at.desc()).limit(limit)

    msg_result = await db.execute(msg_query)
    messages = msg_result.scalars().all()

    # 읽음 처리
    if is_user:
        room.user_unread_count = 0
    else:
        room.partner_unread_count = 0
    await db.commit()

    # 발신자 정보 조회를 위해 sender_id 수집
    sender_ids = list(set(msg.sender_id for msg in messages if msg.sender_id))
    sender_names = {}

    if sender_ids:
        # 사용자 정보 조회
        users_result = await db.execute(
            select(User).where(User.id.in_(sender_ids))
        )
        users = users_result.scalars().all()
        for user in users:
            sender_names[str(user.id)] = user.full_name or "사용자"

    # 파트너 이름 (채팅방에서 조회)
    partner_name = room.partner.name if room.partner else "파트너"

    # 메시지 응답 생성
    message_responses = []
    for msg in reversed(messages):  # 시간순 정렬
        # 사용자에게는 필터링된 내용 표시
        display_content = msg.filtered_content if msg.contains_contact else msg.content

        # 발신자 이름 결정
        if msg.sender_type == "system":
            sender_name = "시스템"
        elif msg.sender_type == "partner":
            sender_name = partner_name
        else:  # user
            sender_name = sender_names.get(str(msg.sender_id), "사용자")

        message_responses.append(ChatMessageResponse(
            id=str(msg.id),
            sender_id=str(msg.sender_id),
            sender_type=msg.sender_type,
            sender_name=sender_name,
            message_type=msg.message_type.value if msg.message_type else "TEXT",
            content=display_content,
            filtered_content=msg.filtered_content,
            contains_contact=msg.contains_contact,
            attachments=msg.attachments or [],
            metadata=msg.metadata or {},
            is_read=msg.is_read,
            created_at=msg.created_at
        ))

    return ChatRoomDetailResponse(
        id=room.id,
        room_code=room.room_code,
        partner_id=room.partner_id,
        partner_name=room.partner.name if room.partner else "알 수 없음",
        partner_logo=room.partner.logo_url if room.partner else None,
        inquiry_id=room.inquiry_id,
        inquiry_title=room.inquiry.title if room.inquiry else None,
        status=room.status.value if room.status else "ACTIVE",
        messages=message_responses,
        created_at=room.created_at
    )


@router.post("/rooms", response_model=ChatRoomDetailResponse)
async def create_chat_room(
    request: CreateRoomRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """채팅방 생성"""
    # 파트너 확인
    partner_result = await db.execute(
        select(Partner).where(Partner.id == request.partner_id, Partner.is_active == True)
    )
    partner = partner_result.scalar_one_or_none()

    if not partner:
        raise HTTPException(status_code=404, detail="파트너를 찾을 수 없습니다")

    # 기존 채팅방 확인 (동일 파트너와의 활성 채팅방)
    existing_result = await db.execute(
        select(ChatRoom).where(
            ChatRoom.user_id == current_user.id,
            ChatRoom.partner_id == request.partner_id,
            ChatRoom.status == ChatRoomStatus.ACTIVE
        )
    )
    existing_room = existing_result.scalar_one_or_none()

    if existing_room:
        # 기존 채팅방 반환
        return await get_chat_room(existing_room.id, None, 50, db, current_user)

    # 새 채팅방 생성
    new_room = ChatRoom(
        room_code=generate_room_code(),
        user_id=current_user.id,
        partner_id=request.partner_id,
        inquiry_id=request.inquiry_id,
        status=ChatRoomStatus.ACTIVE
    )
    db.add(new_room)
    await db.flush()

    # 시스템 메시지 추가
    system_message = ChatMessage(
        room_id=new_room.id,
        sender_id=current_user.id,
        sender_type="system",
        message_type=ChatMessageType.SYSTEM,
        content=f"{partner.name}와의 상담이 시작되었습니다. 플랫폼 내에서 안전하게 상담하세요.",
        contains_contact=False
    )
    db.add(system_message)

    # 초기 메시지가 있으면 추가
    if request.initial_message:
        # 연락처 탐지
        detection = detect_contact(request.initial_message)

        initial_msg = ChatMessage(
            room_id=new_room.id,
            sender_id=current_user.id,
            sender_type="user",
            message_type=ChatMessageType.TEXT,
            content=request.initial_message,
            filtered_content=detection.filtered_content if detection.detected else None,
            contains_contact=detection.detected
        )
        db.add(initial_msg)

        new_room.last_message = detection.filtered_content if detection.detected else request.initial_message
        new_room.last_message_at = datetime.utcnow()
        new_room.last_message_by = current_user.id
        new_room.partner_unread_count = 1

        # 연락처 탐지 로그
        if detection.detected:
            log = ContactDetectionLog(
                user_id=current_user.id,
                detected_pattern=detection.contact_type.value if detection.contact_type else "unknown",
                detected_value=detection.original_value[:50] if detection.original_value else "",
                original_content=request.initial_message[:500],
                action_taken=DetectionAction.WARNING
            )
            db.add(log)

    await db.commit()
    await db.refresh(new_room)

    return await get_chat_room(new_room.id, None, 50, db, current_user)


@router.post("/rooms/{room_id}/messages", response_model=SendMessageResponse)
async def send_message(
    room_id: int,
    request: SendMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """메시지 전송"""
    # 채팅방 조회
    result = await db.execute(
        select(ChatRoom)
        .where(ChatRoom.id == room_id)
        .options(selectinload(ChatRoom.partner))
    )
    room = result.scalar_one_or_none()

    if not room:
        raise HTTPException(status_code=404, detail="채팅방을 찾을 수 없습니다")

    # 권한 확인
    is_user = str(room.user_id) == str(current_user.id)
    is_partner = room.partner and room.partner.user_id and str(room.partner.user_id) == str(current_user.id)

    if not is_user and not is_partner:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다")

    if room.status != ChatRoomStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="종료된 채팅방입니다")

    # 연락처 탐지
    detection = detect_contact(request.content)
    warning_message = None

    if detection.detected:
        warning_message = "연락처가 감지되어 마스킹 처리되었습니다. 플랫폼 내에서 상담을 진행해 주세요."

        # 탐지 로그 저장
        log = ContactDetectionLog(
            user_id=current_user.id,
            detected_pattern=detection.contact_type.value if detection.contact_type else "unknown",
            detected_value=detection.original_value[:50] if detection.original_value else "",
            original_content=request.content[:500],
            action_taken=DetectionAction.WARNING
        )
        db.add(log)
        await db.flush()

    # 메시지 저장
    message = ChatMessage(
        room_id=room_id,
        sender_id=current_user.id,
        sender_type="user" if is_user else "partner",
        message_type=ChatMessageType(request.message_type),
        content=request.content,
        filtered_content=detection.filtered_content if detection.detected else None,
        contains_contact=detection.detected,
        attachments=request.attachments,
        metadata=request.metadata,
        contact_detection_id=log.id if detection.detected else None
    )
    db.add(message)

    # 채팅방 업데이트
    display_content = detection.filtered_content if detection.detected else request.content
    room.last_message = display_content[:100] if len(display_content) > 100 else display_content
    room.last_message_at = datetime.utcnow()
    room.last_message_by = current_user.id

    # 상대방 읽지 않은 메시지 수 증가
    if is_user:
        room.partner_unread_count += 1
    else:
        room.user_unread_count += 1

    await db.commit()
    await db.refresh(message)

    return SendMessageResponse(
        message=ChatMessageResponse(
            id=str(message.id),
            sender_id=str(message.sender_id),
            sender_type=message.sender_type,
            sender_name=current_user.name,
            message_type=message.message_type.value,
            content=display_content,
            filtered_content=message.filtered_content,
            contains_contact=message.contains_contact,
            attachments=message.attachments or [],
            metadata=message.metadata or {},
            is_read=False,
            created_at=message.created_at
        ),
        contact_detected=detection.detected,
        warning_message=warning_message
    )


@router.post("/rooms/{room_id}/read")
async def mark_as_read(
    room_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """읽음 처리"""
    result = await db.execute(
        select(ChatRoom)
        .where(ChatRoom.id == room_id)
        .options(selectinload(ChatRoom.partner))
    )
    room = result.scalar_one_or_none()

    if not room:
        raise HTTPException(status_code=404, detail="채팅방을 찾을 수 없습니다")

    is_user = str(room.user_id) == str(current_user.id)
    is_partner = room.partner and room.partner.user_id and str(room.partner.user_id) == str(current_user.id)

    if not is_user and not is_partner:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다")

    # 읽지 않은 메시지 읽음 처리
    if is_user:
        room.user_unread_count = 0
    else:
        room.partner_unread_count = 0

    # 메시지 읽음 상태 업데이트
    await db.execute(
        ChatMessage.__table__.update()
        .where(
            ChatMessage.room_id == room_id,
            ChatMessage.sender_id != current_user.id,
            ChatMessage.is_read == False
        )
        .values(is_read=True, read_at=datetime.utcnow())
    )

    await db.commit()

    return {"success": True, "message": "읽음 처리되었습니다"}
