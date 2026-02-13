'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft, MessageSquare, Eye, Heart, Share2, Bookmark, Clock, Star
} from 'lucide-react'
import { generateCommunityPosts } from '@/lib/data/seedListings'
import CommentSection, { type Comment } from '../components/CommentSection'

const allPosts = generateCommunityPosts(150)

const authorTypeLabels: Record<string, { label: string; style: string }> = {
  doctor: { label: '의사', style: 'badge-info' },
  pharmacist: { label: '약사', style: 'badge-success' },
  landlord: { label: '건물주', style: 'badge-warning' },
  expert: { label: '전문가', style: 'badge-primary' },
}

const sampleComments: Comment[] = [
  {
    id: 'c1',
    author: '강남내과의사',
    authorType: 'doctor',
    content: '좋은 정보 감사합니다. 저도 비슷한 경험을 했는데, 특히 입지 선정 부분이 중요하더라고요.',
    createdAt: '2시간 전',
    likeCount: 12,
    replies: [
      {
        id: 'c1-1',
        author: '개원준비중',
        authorType: 'doctor',
        content: '맞습니다. 상권 분석을 꼼꼼히 하는 게 핵심인 것 같아요.',
        createdAt: '1시간 전',
        likeCount: 3,
      },
    ],
  },
  {
    id: 'c2',
    author: '10년차약사',
    authorType: 'pharmacist',
    content: '약국 입장에서도 참고할 만한 내용이 많네요. 특히 경쟁 분석 파트가 인상적이었습니다.',
    createdAt: '3시간 전',
    likeCount: 8,
  },
  {
    id: 'c3',
    author: '의료컨설턴트',
    authorType: 'expert',
    content: '전문가 관점에서 몇 가지 보충하자면, 최근 트렌드는 디지털 마케팅 투자 비중을 높이는 방향입니다. SNS 활용도 적극 권장합니다.',
    createdAt: '5시간 전',
    likeCount: 15,
    replies: [
      {
        id: 'c3-1',
        author: '마포약국장',
        authorType: 'pharmacist',
        content: '네이버 플레이스 관리가 정말 중요하더라고요. 리뷰 관리도 필수!',
        createdAt: '4시간 전',
        likeCount: 6,
      },
      {
        id: 'c3-2',
        author: '신사동원장',
        authorType: 'doctor',
        content: '저도 인스타그램 효과를 많이 봤습니다. 진료 전후 사진이 환자 유입에 큰 도움이 됩니다.',
        createdAt: '3시간 전',
        likeCount: 4,
      },
    ],
  },
]

const sampleContent = `
## 개원 6개월차 솔직 후기

안녕하세요, 올해 상반기에 개원한 내과 원장입니다.

개원을 준비하면서 이 커뮤니티에서 정말 많은 도움을 받았기에, 저도 경험을 공유하고자 합니다.

### 1. 입지 선정
가장 중요했던 것은 **상권 분석**이었습니다. 처음에는 유동인구만 보고 위치를 정하려 했는데, 실제로 중요한 것은 **주거인구와 경쟁 의원 수**였습니다.

- 역세권이라고 무조건 좋은 건 아닙니다
- 주거 밀집 지역의 1층이 가장 이상적
- 같은 진료과가 500m 이내에 3개 이상이면 재고 필요

### 2. 인테리어
평당 250만원 정도로 35평 인테리어를 진행했습니다. 총 8,750만원 정도 들었는데, 의료 전문 업체를 통해서 하는 게 확실히 좋았습니다.

### 3. 장비 구매
초기 장비 투자가 생각보다 많이 들었습니다. 리스로 진행한 것도 있고, 중고로 구매한 것도 있습니다.

| 장비 | 비용 | 비고 |
|------|------|------|
| 초음파 | 3,500만원 | 신품 |
| X-ray | 2,000만원 | 리스 |
| EMR | 800만원 | 클라우드형 |
| 심전도 | 500만원 | 신품 |

### 4. 현재 상황
- 일 환자수: 35~45명 (점진적 증가 중)
- 월 매출: 약 4,000만원
- 손익분기점: 아직 미도달 (8개월차 예상)

질문 있으시면 댓글로 남겨주세요!
`

export default function CommunityPostPage() {
  const params = useParams()
  const postId = params.id as string
  const [liked, setLiked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)

  const post = useMemo(() => allPosts.find((p) => p.id === postId) || allPosts[0], [postId])
  const authorInfo = authorTypeLabels[post.authorType] || authorTypeLabels.doctor

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <Link href="/community" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">목록으로</span>
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBookmarked(!bookmarked)}
                className={`p-2 rounded-lg transition-colors ${bookmarked ? 'text-amber-500' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Bookmark className="w-5 h-5" fill={bookmarked ? 'currentColor' : 'none'} />
              </button>
              <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Post header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="badge-info">{post.category}</span>
            <span className={authorInfo.style}>{authorInfo.label}</span>
            {post.authorBadge && (
              <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded flex items-center gap-1">
                <Star className="w-3 h-3" />{post.authorBadge}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-4">{post.title}</h1>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                {post.authorName[0]}
              </div>
              <div>
                <p className="font-medium text-foreground">{post.authorName}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(post.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{post.viewCount}</span>
              <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4" />{post.commentCount}</span>
            </div>
          </div>
        </div>

        {/* Post content */}
        <div className="card p-6 mb-6">
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-line text-foreground leading-relaxed">
            {sampleContent}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t">
            {post.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 bg-secondary text-muted-foreground rounded-full text-sm">
                #{tag}
              </span>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t">
            <button
              onClick={() => setLiked(!liked)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                liked ? 'bg-red-50 dark:bg-red-950/20 text-red-500' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <Heart className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} />
              <span className="font-medium">{post.likeCount + (liked ? 1 : 0)}</span>
            </button>
            <button
              onClick={() => setBookmarked(!bookmarked)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                bookmarked ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-500' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <Bookmark className="w-5 h-5" fill={bookmarked ? 'currentColor' : 'none'} />
              <span>북마크</span>
            </button>
          </div>
        </div>

        {/* Comments */}
        <CommentSection postId={postId} comments={sampleComments} />
      </main>
    </div>
  )
}
