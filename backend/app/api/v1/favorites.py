"""
Favorites API - 즐겨찾기 CRUD
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

from ...models.favorite import Favorite, FavoriteType
from ...models.user import User
from ..deps import get_db, get_current_active_user

router = APIRouter()


class FavoriteCreate(BaseModel):
    item_id: str
    item_type: FavoriteType


class FavoriteResponse(BaseModel):
    id: str
    item_id: str
    item_type: FavoriteType
    created_at: datetime

    class Config:
        from_attributes = True


class FavoriteListResponse(BaseModel):
    favorites: list[FavoriteResponse]
    total: int


@router.get("", response_model=FavoriteListResponse)
async def get_favorites(
    item_type: Optional[FavoriteType] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """현재 사용자의 즐겨찾기 목록 조회"""
    query = select(Favorite).where(Favorite.user_id == current_user.id)

    if item_type:
        query = query.where(Favorite.item_type == item_type)

    query = query.order_by(Favorite.created_at.desc())

    result = await db.execute(query)
    favorites = result.scalars().all()

    return FavoriteListResponse(
        favorites=[
            FavoriteResponse(
                id=str(f.id),
                item_id=f.item_id,
                item_type=f.item_type,
                created_at=f.created_at
            )
            for f in favorites
        ],
        total=len(favorites)
    )


@router.post("", response_model=FavoriteResponse, status_code=status.HTTP_201_CREATED)
async def add_favorite(
    data: FavoriteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """즐겨찾기 추가"""
    # Check if already favorited
    existing = await db.execute(
        select(Favorite).where(
            Favorite.user_id == current_user.id,
            Favorite.item_id == data.item_id,
            Favorite.item_type == data.item_type
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 찜한 매물입니다"
        )

    favorite = Favorite(
        user_id=current_user.id,
        item_id=data.item_id,
        item_type=data.item_type
    )

    db.add(favorite)
    await db.commit()
    await db.refresh(favorite)

    return FavoriteResponse(
        id=str(favorite.id),
        item_id=favorite.item_id,
        item_type=favorite.item_type,
        created_at=favorite.created_at
    )


@router.delete("/{favorite_id}")
async def remove_favorite(
    favorite_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """즐겨찾기 삭제"""
    result = await db.execute(
        select(Favorite).where(
            Favorite.id == uuid.UUID(favorite_id),
            Favorite.user_id == current_user.id
        )
    )
    favorite = result.scalar_one_or_none()

    if not favorite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="즐겨찾기를 찾을 수 없습니다"
        )

    await db.delete(favorite)
    await db.commit()

    return {"message": "즐겨찾기가 삭제되었습니다"}


@router.delete("/item/{item_type}/{item_id}")
async def remove_favorite_by_item(
    item_type: FavoriteType,
    item_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """아이템 ID로 즐겨찾기 삭제"""
    result = await db.execute(
        delete(Favorite).where(
            Favorite.user_id == current_user.id,
            Favorite.item_id == item_id,
            Favorite.item_type == item_type
        )
    )
    await db.commit()

    if result.rowcount == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="즐겨찾기를 찾을 수 없습니다"
        )

    return {"message": "즐겨찾기가 삭제되었습니다"}


@router.get("/check/{item_type}/{item_id}")
async def check_favorite(
    item_type: FavoriteType,
    item_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """특정 아이템의 즐겨찾기 여부 확인"""
    result = await db.execute(
        select(Favorite).where(
            Favorite.user_id == current_user.id,
            Favorite.item_id == item_id,
            Favorite.item_type == item_type
        )
    )
    favorite = result.scalar_one_or_none()

    return {"is_favorited": favorite is not None}
