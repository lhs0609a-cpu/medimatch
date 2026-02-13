'use client'

import { useState } from 'react'
import { MessageSquare, Heart, CornerDownRight, Send } from 'lucide-react'

interface Comment {
  id: string
  author: string
  authorType: 'doctor' | 'pharmacist' | 'landlord' | 'expert'
  content: string
  createdAt: string
  likeCount: number
  replies?: Comment[]
}

interface CommentSectionProps {
  postId: string
  comments: Comment[]
}

const authorTypeLabels: Record<string, { label: string; style: string }> = {
  doctor: { label: '의사', style: 'badge-info' },
  pharmacist: { label: '약사', style: 'badge-success' },
  landlord: { label: '건물주', style: 'badge-warning' },
  expert: { label: '전문가', style: 'badge-primary' },
}

function CommentItem({ comment, depth = 0 }: { comment: Comment; depth?: number }) {
  const [liked, setLiked] = useState(false)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyText, setReplyText] = useState('')
  const info = authorTypeLabels[comment.authorType]

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-muted pl-4' : ''}`}>
      <div className="py-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {comment.author[0]}
          </div>
          <span className="text-sm font-medium text-foreground">{comment.author}</span>
          <span className={`${info.style} text-[10px]`}>{info.label}</span>
          <span className="text-xs text-muted-foreground">{comment.createdAt}</span>
        </div>
        <p className="text-sm text-foreground ml-9">{comment.content}</p>
        <div className="flex items-center gap-4 ml-9 mt-2">
          <button
            onClick={() => setLiked(!liked)}
            className={`flex items-center gap-1 text-xs transition-colors ${
              liked ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Heart className="w-3.5 h-3.5" fill={liked ? 'currentColor' : 'none'} />
            {comment.likeCount + (liked ? 1 : 0)}
          </button>
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <CornerDownRight className="w-3.5 h-3.5" /> 답글
          </button>
        </div>

        {showReplyForm && (
          <div className="ml-9 mt-2 flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="답글을 입력하세요..."
              className="input flex-1 h-9 text-sm"
            />
            <button className="btn-primary px-3 h-9 rounded-lg">
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {comment.replies?.map((reply) => (
        <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
      ))}
    </div>
  )
}

export default function CommentSection({ postId, comments }: CommentSectionProps) {
  const [newComment, setNewComment] = useState('')

  return (
    <div className="card">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          댓글 {comments.length}개
        </h3>
      </div>

      {/* Comment input */}
      <div className="p-4 border-b">
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="댓글을 작성하세요..."
            className="input flex-1"
          />
          <button className="btn-primary px-4 rounded-lg flex items-center gap-1.5">
            <Send className="w-4 h-4" /> 등록
          </button>
        </div>
      </div>

      {/* Comments list */}
      <div className="divide-y px-4">
        {comments.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  )
}

export type { Comment }
