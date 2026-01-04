"""
WebSocket API - 실시간 채팅
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, HTTPException
from typing import Dict, List, Optional
import json
import asyncio
from datetime import datetime
from uuid import UUID
import logging

from app.core.security import verify_token as security_verify_token
from app.core.database import async_session
from sqlalchemy import select, update
from app.models.chat import ChatRoom, ChatMessage, ChatMessageType
from app.models.user import User
from app.services.contact_detector import ContactDetector

logger = logging.getLogger(__name__)
router = APIRouter()


class ConnectionManager:
    """WebSocket 연결 관리자"""

    def __init__(self):
        # room_id -> {user_id: WebSocket}
        self.active_connections: Dict[int, Dict[str, WebSocket]] = {}
        # user_id -> list of WebSocket (여러 탭/기기 지원)
        self.user_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: int, user_id: str):
        """WebSocket 연결"""
        await websocket.accept()

        # 룸별 연결 저장
        if room_id not in self.active_connections:
            self.active_connections[room_id] = {}
        self.active_connections[room_id][user_id] = websocket

        # 유저별 연결 저장 (여러 탭 지원)
        if user_id not in self.user_connections:
            self.user_connections[user_id] = []
        self.user_connections[user_id].append(websocket)

        logger.info(f"User {user_id} connected to room {room_id}")

    def disconnect(self, websocket: WebSocket, room_id: int, user_id: str):
        """WebSocket 연결 해제"""
        # 룸에서 제거
        if room_id in self.active_connections:
            if user_id in self.active_connections[room_id]:
                del self.active_connections[room_id][user_id]
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

        # 유저 연결에서 제거
        if user_id in self.user_connections:
            if websocket in self.user_connections[user_id]:
                self.user_connections[user_id].remove(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]

        logger.info(f"User {user_id} disconnected from room {room_id}")

    async def send_to_room(self, room_id: int, message: dict, exclude_user: Optional[str] = None):
        """특정 룸의 모든 연결에 메시지 전송"""
        if room_id not in self.active_connections:
            return

        for user_id, connection in self.active_connections[room_id].items():
            if exclude_user and user_id == exclude_user:
                continue
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Failed to send message to user {user_id}: {e}")

    async def send_to_user(self, user_id: str, message: dict):
        """특정 유저의 모든 연결에 메시지 전송"""
        if user_id not in self.user_connections:
            return

        for connection in self.user_connections[user_id]:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Failed to send message to user {user_id}: {e}")

    def get_room_users(self, room_id: int) -> List[str]:
        """특정 룸의 연결된 유저 목록"""
        if room_id not in self.active_connections:
            return []
        return list(self.active_connections[room_id].keys())


# 전역 연결 관리자
manager = ConnectionManager()


async def verify_token(token: str) -> Optional[User]:
    """JWT 토큰 검증 및 사용자 조회"""
    try:
        payload = security_verify_token(token)
        user_id = payload.get("sub")
        if not user_id:
            return None

        async with async_session() as db:
            result = await db.execute(
                select(User).where(User.id == UUID(user_id))
            )
            return result.scalar_one_or_none()
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        return None


async def verify_room_access(user_id: str, room_id: int) -> bool:
    """사용자가 해당 채팅방에 접근 권한이 있는지 확인"""
    async with async_session() as db:
        result = await db.execute(
            select(ChatRoom).where(
                ChatRoom.id == room_id
            )
        )
        room = result.scalar_one_or_none()

        if not room:
            return False

        # user_id 또는 partner의 user_id와 일치하는지 확인
        return str(room.user_id) == user_id or str(room.partner_user_id) == user_id


@router.websocket("/ws/chat/{room_id}")
async def websocket_chat(
    websocket: WebSocket,
    room_id: int,
    token: str = Query(..., description="JWT 토큰")
):
    """
    채팅 WebSocket 엔드포인트

    연결: ws://host/ws/chat/{room_id}?token={jwt_token}

    메시지 형식:
    - 전송: {"type": "message", "content": "안녕하세요"}
    - 수신: {"type": "message", "id": 1, "content": "...", "sender_id": "...", "created_at": "..."}
    - 타이핑: {"type": "typing", "is_typing": true}
    - 읽음: {"type": "read"}
    """
    # 토큰 검증
    user = await verify_token(token)
    if not user:
        await websocket.close(code=4001, reason="Unauthorized")
        return

    user_id = str(user.id)

    # 채팅방 접근 권한 확인
    has_access = await verify_room_access(user_id, room_id)
    if not has_access:
        await websocket.close(code=4003, reason="Access denied")
        return

    # 연결 수락
    await manager.connect(websocket, room_id, user_id)

    # 연결 알림
    await manager.send_to_room(room_id, {
        "type": "user_joined",
        "user_id": user_id,
        "online_users": manager.get_room_users(room_id)
    }, exclude_user=user_id)

    contact_detector = ContactDetector()

    try:
        while True:
            # 메시지 수신
            data = await websocket.receive_json()
            msg_type = data.get("type", "message")

            if msg_type == "message":
                content = data.get("content", "").strip()
                if not content:
                    continue

                # 연락처 감지
                detection_result = contact_detector.detect_and_mask(content)

                async with async_session() as db:
                    # 메시지 저장
                    message = ChatMessage(
                        room_id=room_id,
                        sender_id=UUID(user_id),
                        message_type=ChatMessageType.TEXT,
                        content=detection_result['masked_text'],
                        original_content=content if detection_result['has_contact'] else None,
                        has_contact_info=detection_result['has_contact'],
                        detected_contacts=detection_result['detected_items'] if detection_result['has_contact'] else None,
                    )
                    db.add(message)
                    await db.commit()
                    await db.refresh(message)

                    # 채팅방 마지막 메시지 업데이트
                    await db.execute(
                        update(ChatRoom)
                        .where(ChatRoom.id == room_id)
                        .values(
                            last_message=detection_result['masked_text'][:100],
                            last_message_at=datetime.utcnow()
                        )
                    )
                    await db.commit()

                    # 룸의 모든 사용자에게 메시지 전송
                    await manager.send_to_room(room_id, {
                        "type": "message",
                        "id": message.id,
                        "content": detection_result['masked_text'],
                        "sender_id": user_id,
                        "sender_name": user.full_name,
                        "has_contact_info": detection_result['has_contact'],
                        "created_at": message.created_at.isoformat(),
                    })

                    # 연락처 감지 경고 (발신자에게만)
                    if detection_result['has_contact']:
                        await websocket.send_json({
                            "type": "contact_warning",
                            "message": "연락처 정보가 감지되어 마스킹되었습니다. 에스크로 결제 전 직접 연락은 제한됩니다.",
                            "detected": detection_result['detected_items']
                        })

            elif msg_type == "typing":
                is_typing = data.get("is_typing", False)
                await manager.send_to_room(room_id, {
                    "type": "typing",
                    "user_id": user_id,
                    "user_name": user.full_name,
                    "is_typing": is_typing
                }, exclude_user=user_id)

            elif msg_type == "read":
                async with async_session() as db:
                    # 읽음 처리
                    await db.execute(
                        update(ChatMessage)
                        .where(
                            ChatMessage.room_id == room_id,
                            ChatMessage.sender_id != UUID(user_id),
                            ChatMessage.is_read == False
                        )
                        .values(is_read=True, read_at=datetime.utcnow())
                    )
                    await db.commit()

                await manager.send_to_room(room_id, {
                    "type": "read",
                    "user_id": user_id
                }, exclude_user=user_id)

            elif msg_type == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id, user_id)
        await manager.send_to_room(room_id, {
            "type": "user_left",
            "user_id": user_id,
            "online_users": manager.get_room_users(room_id)
        })
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket, room_id, user_id)
        await manager.send_to_room(room_id, {
            "type": "user_left",
            "user_id": user_id,
            "online_users": manager.get_room_users(room_id)
        })


@router.websocket("/ws/notifications")
async def websocket_notifications(
    websocket: WebSocket,
    token: str = Query(..., description="JWT 토큰")
):
    """
    알림 WebSocket 엔드포인트

    연결: ws://host/ws/notifications?token={jwt_token}

    수신 메시지:
    - {"type": "notification", "id": "...", "title": "...", "body": "...", "data": {...}}
    """
    # 토큰 검증
    user = await verify_token(token)
    if not user:
        await websocket.close(code=4001, reason="Unauthorized")
        return

    user_id = str(user.id)

    # 연결 수락
    await websocket.accept()

    # 유저별 연결 저장
    if user_id not in manager.user_connections:
        manager.user_connections[user_id] = []
    manager.user_connections[user_id].append(websocket)

    logger.info(f"User {user_id} connected to notifications")

    try:
        while True:
            # 핑-퐁으로 연결 유지
            data = await websocket.receive_json()
            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        if user_id in manager.user_connections:
            if websocket in manager.user_connections[user_id]:
                manager.user_connections[user_id].remove(websocket)
            if not manager.user_connections[user_id]:
                del manager.user_connections[user_id]
        logger.info(f"User {user_id} disconnected from notifications")
    except Exception as e:
        logger.error(f"Notification WebSocket error: {e}")
