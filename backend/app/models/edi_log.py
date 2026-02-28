"""
EDI 송수신 로그 모델

- EDIMessageLog: 심평원 EDI 메시지 로그
"""
import uuid
import enum
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Text, DateTime, ForeignKey, Boolean, Index
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


# ===== Enums =====

class EDIDirection(str, enum.Enum):
    OUTBOUND = "OUTBOUND"  # 송신 (의원 → 심평원)
    INBOUND = "INBOUND"    # 수신 (심평원 → 의원)


class EDIMessageType(str, enum.Enum):
    CLAIM_SUBMIT = "CLAIM_SUBMIT"           # 청구 제출
    CLAIM_RECEIPT = "CLAIM_RECEIPT"          # 접수 확인
    REVIEW_RESULT = "REVIEW_RESULT"         # 심사 결과
    ADJUSTMENT_NOTICE = "ADJUSTMENT_NOTICE" # 조정 통보
    APPEAL_SUBMIT = "APPEAL_SUBMIT"         # 이의신청 제출
    APPEAL_RESULT = "APPEAL_RESULT"         # 이의신청 결과
    CODE_UPDATE = "CODE_UPDATE"             # 코드 업데이트


# ===== Models =====

class EDIMessageLog(Base):
    """심평원 EDI 메시지 로그"""
    __tablename__ = "edi_message_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    batch_id = Column(Integer, ForeignKey("claim_batches.id", ondelete="SET NULL"), nullable=True)

    # 메시지 정보
    direction = Column(SQLEnum(EDIDirection), nullable=False)
    message_type = Column(SQLEnum(EDIMessageType), nullable=False)
    message_id = Column(String(50), unique=True, nullable=False)

    # EDI 메시지 내용
    xml_message = Column(Text, nullable=True)
    message_size_bytes = Column(Integer, nullable=True)

    # 요양기관 정보
    ykiho = Column(String(20), nullable=True)  # 요양기관번호

    # HTTP 통신
    http_method = Column(String(10), nullable=True)
    http_url = Column(String(500), nullable=True)
    http_status = Column(Integer, nullable=True)
    http_response_time_ms = Column(Integer, nullable=True)

    # 결과
    success = Column(Boolean, nullable=True)
    error_code = Column(String(20), nullable=True)
    error_message = Column(Text, nullable=True)

    # 재시도
    retry_count = Column(Integer, default=0, nullable=False)
    max_retries = Column(Integer, default=3, nullable=False)

    # 관련 청구
    claim_ids = Column(Text, nullable=True)  # 쉼표 구분 UUID 목록

    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_edi_user", "user_id"),
        Index("ix_edi_batch", "batch_id"),
        Index("ix_edi_direction", "direction"),
        Index("ix_edi_message_type", "message_type"),
        Index("ix_edi_message_id", "message_id"),
        Index("ix_edi_created", "created_at"),
    )
