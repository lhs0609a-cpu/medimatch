"""
중개인 게시판 모델

- BrokerBoardPost: 게시글 (공지/QnA/팁/자유)
- BrokerBoardComment: 댓글/대댓글
"""
import enum
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Text, DateTime,
    ForeignKey, Boolean, Index
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class BoardCategory(str, enum.Enum):
    NOTICE = "NOTICE"
    QNA = "QNA"
    TIP = "TIP"
    DISCUSSION = "DISCUSSION"


class BrokerBoardPost(Base):
    """중개인 게시판 글"""
    __tablename__ = "broker_board_posts"

    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    broker_id = Column(Integer, ForeignKey("brokers.id", ondelete="SET NULL"), nullable=True)

    category = Column(SQLEnum(BoardCategory), default=BoardCategory.DISCUSSION, nullable=False)
    title = Column(String(300), nullable=False)
    content = Column(Text, nullable=False)
    is_pinned = Column(Boolean, default=False)
    view_count = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계
    author = relationship("User", backref="broker_board_posts")
    broker = relationship("Broker", backref="board_posts")
    comments = relationship("BrokerBoardComment", back_populates="post", lazy="selectin",
                            order_by="BrokerBoardComment.created_at")

    __table_args__ = (
        Index("ix_board_category", "category"),
        Index("ix_board_pinned", "is_pinned"),
        Index("ix_board_author", "author_id"),
    )


class BrokerBoardComment(Base):
    """게시판 댓글/대댓글"""
    __tablename__ = "broker_board_comments"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("broker_board_posts.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    parent_id = Column(Integer, ForeignKey("broker_board_comments.id", ondelete="CASCADE"), nullable=True)

    content = Column(Text, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계
    post = relationship("BrokerBoardPost", back_populates="comments")
    author = relationship("User", backref="broker_board_comments")
    replies = relationship("BrokerBoardComment", backref="parent", remote_side=[id], lazy="selectin")

    __table_args__ = (
        Index("ix_comment_post", "post_id"),
        Index("ix_comment_parent", "parent_id"),
    )
