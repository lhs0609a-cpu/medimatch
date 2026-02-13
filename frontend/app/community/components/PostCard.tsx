'use client'

import { Eye, Heart, MessageSquare, Pin, Flame, Zap, Star } from 'lucide-react'
import Link from 'next/link'
import { CommunityPost } from '@/lib/data/seedListings'

interface PostCardProps {
  post: CommunityPost
  isPinned?: boolean
}

const authorTypeLabels: Record<string, { label: string; style: string }> = {
  doctor: { label: '의사', style: 'badge-info' },
  pharmacist: { label: '약사', style: 'badge-success' },
  landlord: { label: '건물주', style: 'badge-warning' },
  expert: { label: '전문가', style: 'badge-primary' },
}

export const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffHours < 1) return '방금 전'
  if (diffHours < 24) return `${diffHours}시간 전`
  if (diffDays < 7) return `${diffDays}일 전`
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

export default function PostCard({ post, isPinned }: PostCardProps) {
  const authorInfo = authorTypeLabels[post.authorType] || authorTypeLabels.doctor

  if (isPinned) {
    return (
      <Link
        href={`/community/${post.id}`}
        className="block p-4 border-b border-border bg-accent/50 hover:bg-accent cursor-pointer transition-colors"
      >
        <div className="flex items-start gap-3">
          <Pin className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="badge-info">{post.category}</span>
              <span className={authorInfo.style}>{authorInfo.label}</span>
              {post.authorBadge && (
                <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  {post.authorBadge}
                </span>
              )}
            </div>
            <h3 className="font-medium text-foreground line-clamp-1">{post.title}</h3>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span>{post.authorName}</span>
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.viewCount}</span>
              <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{post.likeCount}</span>
              <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{post.commentCount}</span>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/community/${post.id}`}
      className="block p-4 border-b border-border hover:bg-secondary/50 cursor-pointer transition-colors last:border-b-0"
    >
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="badge-default">{post.category}</span>
        <span className={authorInfo.style}>{authorInfo.label}</span>
        {post.isNew && (
          <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded flex items-center gap-1">
            <Zap className="w-3 h-3" /> NEW
          </span>
        )}
        {post.isHot && (
          <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded flex items-center gap-1">
            <Flame className="w-3 h-3" /> HOT
          </span>
        )}
        {post.authorBadge && (
          <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded">
            {post.authorBadge}
          </span>
        )}
        {post.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="text-xs text-primary">#{tag}</span>
        ))}
      </div>
      <h3 className="font-medium text-foreground mb-2 line-clamp-1">{post.title}</h3>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{post.authorName}</span>
          <span>{formatDate(post.createdAt)}</span>
          {post.lastCommentTime && <span className="text-green-600">댓글 {post.lastCommentTime}</span>}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.viewCount}</span>
          <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{post.likeCount}</span>
          <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{post.commentCount}</span>
        </div>
      </div>
    </Link>
  )
}
