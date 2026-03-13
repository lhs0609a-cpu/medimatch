"""커뮤니티 API"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_
from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime

from ..deps import get_db, get_current_active_user
from ...models.user import User
from ...models.community import (
    CommunityPost, CommunityComment, CommunityLike,
    CommunityCategory, PostStatus,
)

router = APIRouter()


# ── Schemas ────────────────────────────────────────────────────────────

class PostCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=300)
    content: str = Field(..., min_length=1)
    category: CommunityCategory
    tags: List[str] = []


class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[CommunityCategory] = None
    tags: Optional[List[str]] = None


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1)
    parent_id: Optional[int] = None


class PostResponse(BaseModel):
    id: int
    user_id: str
    author_name: str
    title: str
    content: str
    category: str
    tags: list
    view_count: int
    like_count: int
    comment_count: int
    is_pinned: bool
    created_at: datetime
    updated_at: datetime
    is_liked: bool = False

    class Config:
        from_attributes = True


class CommentResponse(BaseModel):
    id: int
    post_id: int
    user_id: str
    author_name: str
    content: str
    parent_id: Optional[int]
    like_count: int
    created_at: datetime
    replies: list = []

    class Config:
        from_attributes = True


# ── Category mapping ──────────────────────────────────────────────────

_CAT_MAP = {
    "개원정보": CommunityCategory.OPENING_INFO,
    "약국운영": CommunityCategory.PHARMACY_OPS,
    "매물후기": CommunityCategory.LISTING_REVIEW,
    "질문답변": CommunityCategory.QNA,
    "업계소식": CommunityCategory.INDUSTRY_NEWS,
    "세무/법률": CommunityCategory.TAX_LAW,
    "장비/인테리어": CommunityCategory.EQUIPMENT,
}


# ── Endpoints ─────────────────────────────────────────────────────────

@router.get("/posts")
async def list_posts(
    category: Optional[str] = None,
    search: Optional[str] = None,
    sort: str = Query("latest", pattern="^(latest|popular|views)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """게시글 목록 (비로그인 가능)"""
    query = select(CommunityPost).where(CommunityPost.status == PostStatus.ACTIVE)

    if category and category != "전체":
        enum_val = _CAT_MAP.get(category)
        if enum_val:
            query = query.where(CommunityPost.category == enum_val)

    if search:
        query = query.where(
            or_(
                CommunityPost.title.ilike(f"%{search}%"),
                CommunityPost.content.ilike(f"%{search}%"),
            )
        )

    # Count
    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    # Sort
    if sort == "popular":
        query = query.order_by(desc(CommunityPost.like_count), desc(CommunityPost.created_at))
    elif sort == "views":
        query = query.order_by(desc(CommunityPost.view_count), desc(CommunityPost.created_at))
    else:
        query = query.order_by(desc(CommunityPost.is_pinned), desc(CommunityPost.created_at))

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    posts = result.scalars().all()

    items = []
    for p in posts:
        author = await db.get(User, p.user_id)
        items.append({
            "id": p.id,
            "user_id": str(p.user_id),
            "author_name": author.full_name if author else "알 수 없음",
            "title": p.title,
            "content": p.content[:200],  # Preview
            "category": p.category.value,
            "tags": p.tags or [],
            "view_count": p.view_count,
            "like_count": p.like_count,
            "comment_count": p.comment_count,
            "is_pinned": p.is_pinned,
            "created_at": p.created_at.isoformat(),
            "updated_at": p.updated_at.isoformat(),
        })

    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.get("/posts/{post_id}")
async def get_post(
    post_id: int,
    db: AsyncSession = Depends(get_db),
):
    """게시글 상세 (조회수 +1)"""
    post = await db.get(CommunityPost, post_id)
    if not post or post.status != PostStatus.ACTIVE:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")

    post.view_count += 1
    await db.commit()

    author = await db.get(User, post.user_id)

    return {
        "id": post.id,
        "user_id": str(post.user_id),
        "author_name": author.full_name if author else "알 수 없음",
        "title": post.title,
        "content": post.content,
        "category": post.category.value,
        "tags": post.tags or [],
        "view_count": post.view_count,
        "like_count": post.like_count,
        "comment_count": post.comment_count,
        "is_pinned": post.is_pinned,
        "created_at": post.created_at.isoformat(),
        "updated_at": post.updated_at.isoformat(),
    }


@router.post("/posts", status_code=201)
async def create_post(
    data: PostCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """글쓰기 (로그인 필수)"""
    post = CommunityPost(
        user_id=current_user.id,
        title=data.title,
        content=data.content,
        category=data.category,
        tags=data.tags,
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return {"id": post.id, "message": "게시글이 등록되었습니다"}


@router.patch("/posts/{post_id}")
async def update_post(
    post_id: int,
    data: PostUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """글 수정 (작성자만)"""
    post = await db.get(CommunityPost, post_id)
    if not post or post.status == PostStatus.DELETED:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="수정 권한이 없습니다")

    update_dict = data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(post, key, value)
    post.updated_at = datetime.utcnow()
    await db.commit()
    return {"message": "수정되었습니다"}


@router.delete("/posts/{post_id}")
async def delete_post(
    post_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """글 삭제 (작성자/어드민)"""
    from ...models.user import UserRole
    post = await db.get(CommunityPost, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")
    if post.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="삭제 권한이 없습니다")

    post.status = PostStatus.DELETED
    await db.commit()
    return {"message": "삭제되었습니다"}


@router.post("/posts/{post_id}/like")
async def toggle_like(
    post_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """좋아요 토글"""
    post = await db.get(CommunityPost, post_id)
    if not post or post.status != PostStatus.ACTIVE:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")

    existing = await db.execute(
        select(CommunityLike).where(
            CommunityLike.user_id == current_user.id,
            CommunityLike.post_id == post_id,
        )
    )
    like = existing.scalar_one_or_none()

    if like:
        await db.delete(like)
        post.like_count = max(0, post.like_count - 1)
        liked = False
    else:
        db.add(CommunityLike(user_id=current_user.id, post_id=post_id))
        post.like_count += 1
        liked = True

    await db.commit()
    return {"liked": liked, "like_count": post.like_count}


@router.get("/posts/{post_id}/comments")
async def list_comments(
    post_id: int,
    db: AsyncSession = Depends(get_db),
):
    """댓글 목록"""
    result = await db.execute(
        select(CommunityComment)
        .where(CommunityComment.post_id == post_id, CommunityComment.parent_id.is_(None))
        .order_by(CommunityComment.created_at)
    )
    comments = result.scalars().all()

    items = []
    for c in comments:
        author = await db.get(User, c.user_id)
        replies_result = await db.execute(
            select(CommunityComment)
            .where(CommunityComment.parent_id == c.id)
            .order_by(CommunityComment.created_at)
        )
        replies = replies_result.scalars().all()
        reply_items = []
        for r in replies:
            r_author = await db.get(User, r.user_id)
            reply_items.append({
                "id": r.id,
                "post_id": r.post_id,
                "user_id": str(r.user_id),
                "author_name": r_author.full_name if r_author else "알 수 없음",
                "content": r.content,
                "parent_id": r.parent_id,
                "like_count": r.like_count,
                "created_at": r.created_at.isoformat(),
            })

        items.append({
            "id": c.id,
            "post_id": c.post_id,
            "user_id": str(c.user_id),
            "author_name": author.full_name if author else "알 수 없음",
            "content": c.content,
            "parent_id": None,
            "like_count": c.like_count,
            "created_at": c.created_at.isoformat(),
            "replies": reply_items,
        })

    return {"items": items, "total": len(items)}


@router.post("/posts/{post_id}/comments", status_code=201)
async def create_comment(
    post_id: int,
    data: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """댓글 작성"""
    post = await db.get(CommunityPost, post_id)
    if not post or post.status != PostStatus.ACTIVE:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")

    if data.parent_id:
        parent = await db.get(CommunityComment, data.parent_id)
        if not parent or parent.post_id != post_id:
            raise HTTPException(status_code=400, detail="잘못된 부모 댓글입니다")

    comment = CommunityComment(
        post_id=post_id,
        user_id=current_user.id,
        content=data.content,
        parent_id=data.parent_id,
    )
    db.add(comment)
    post.comment_count += 1
    await db.commit()
    await db.refresh(comment)
    return {"id": comment.id, "message": "댓글이 등록되었습니다"}


@router.get("/trending")
async def get_trending(
    db: AsyncSession = Depends(get_db),
):
    """인기글 (조회수+좋아요 기반)"""
    result = await db.execute(
        select(CommunityPost)
        .where(CommunityPost.status == PostStatus.ACTIVE)
        .order_by(desc(CommunityPost.view_count + CommunityPost.like_count * 3))
        .limit(10)
    )
    posts = result.scalars().all()

    items = []
    for p in posts:
        author = await db.get(User, p.user_id)
        items.append({
            "id": p.id,
            "title": p.title,
            "category": p.category.value,
            "view_count": p.view_count,
            "like_count": p.like_count,
            "comment_count": p.comment_count,
            "author_name": author.full_name if author else "알 수 없음",
            "created_at": p.created_at.isoformat(),
        })

    return {"items": items}
