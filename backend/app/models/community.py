"""
커뮤니티 게시판 모델
- CommunityPost: 게시글
- CommunityComment: 댓글/대댓글
- CommunityLike: 좋아요 (중복 방지)
"""
import enum
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Text, DateTime,
    ForeignKey, Boolean, Index, UniqueConstraint
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship

from app.core.database import Base


class CommunityCategory(str, enum.Enum):
    OPENING_INFO = "OPENING_INFO"      # 개원정보
    PHARMACY_OPS = "PHARMACY_OPS"      # 약국운영
    LISTING_REVIEW = "LISTING_REVIEW"  # 매물후기
    QNA = "QNA"                         # 질문답변
    INDUSTRY_NEWS = "INDUSTRY_NEWS"    # 업계소식
    TAX_LAW = "TAX_LAW"               # 세무/법률
    EQUIPMENT = "EQUIPMENT"            # 장비/인테리어


class PostStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    HIDDEN = "HIDDEN"
    DELETED = "DELETED"


class CommunityPost(Base):
    __tablename__ = "community_posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(300), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(SQLEnum(CommunityCategory), nullable=False)
    tags = Column(ARRAY(String(50)), default=[])
    view_count = Column(Integer, default=0)
    like_count = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)
    is_pinned = Column(Boolean, default=False)
    status = Column(SQLEnum(PostStatus), default=PostStatus.ACTIVE)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    author = relationship("User", backref="community_posts")
    comments = relationship("CommunityComment", back_populates="post", lazy="selectin")

    __table_args__ = (
        Index("ix_community_category", "category"),
        Index("ix_community_user", "user_id"),
        Index("ix_community_status", "status"),
        Index("ix_community_pinned", "is_pinned"),
    )


class CommunityComment(Base):
    __tablename__ = "community_comments"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    parent_id = Column(Integer, ForeignKey("community_comments.id", ondelete="CASCADE"), nullable=True)
    content = Column(Text, nullable=False)
    like_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    post = relationship("CommunityPost", back_populates="comments")
    author = relationship("User", backref="community_comments")
    replies = relationship("CommunityComment", backref="parent", remote_side=[id], lazy="selectin")

    __table_args__ = (
        Index("ix_comm_comment_post", "post_id"),
        Index("ix_comm_comment_parent", "parent_id"),
    )


class CommunityLike(Base):
    __tablename__ = "community_likes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    post_id = Column(Integer, ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "post_id", name="uq_community_like"),
    )
