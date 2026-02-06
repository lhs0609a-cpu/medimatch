"""
Favorite model - 사용자 즐겨찾기
"""
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SQLEnum, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
import enum

from ..core.database import Base


class FavoriteType(str, enum.Enum):
    BUILDING = "building"
    PHARMACY = "pharmacy"


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    item_id = Column(String(255), nullable=False)  # UUID or ID of the favorited item
    item_type = Column(SQLEnum(FavoriteType), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="favorites")

    # Unique constraint: user can only favorite an item once
    __table_args__ = (
        UniqueConstraint('user_id', 'item_id', 'item_type', name='unique_user_favorite'),
    )
