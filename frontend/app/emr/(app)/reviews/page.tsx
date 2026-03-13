'use client'

import { useState, useMemo } from 'react'
import {
  Star,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  ExternalLink,
  BarChart3,
  Users,
  Heart,
  Smile,
  Frown,
  Meh,
  Award,
  Globe,
  Bell,
  Settings,
  Copy,
  Eye,
  RefreshCw,
  X,
  Plus,
} from 'lucide-react'

/* ─── 타입 ─── */
type SentimentType = 'positive' | 'neutral' | 'negative'
type ReviewSource = 'internal' | 'naver' | 'kakao' | 'google'
type SurveyStatus = 'sent' | 'completed' | 'expired'

interface Review {
  id: string
  patientName: string
  date: string
  source: ReviewSource
  rating: number
  sentiment: SentimentType
  comment: string
  categories: { label: string; score: number }[]
  replied: boolean
  replyText?: string
}

interface SurveyResult {
  id: string
  patientName: string
  visitDate: string
  status: SurveyStatus
  overallScore: number
  scores: { category: string; score: number }[]
  feedback?: string
  sentTime: string
}

/* ─── 더미 데이터 ─── */
const overviewStats = {
  avgScore: 4.6,
  totalReviews: 342,
  thisMonth: 28,
  responseRate: 78.4,
  nps: 72,
  sentimentPositive: 82,
  sentimentNeutral: 12,
  sentimentNegative: 6,
}

const monthlyScores = [
  { month: '8월', score: 4.3, count: 24 },
  { month: '9월', score: 4.4, count: 27 },
  { month: '10월', score: 4.5, count: 31 },
  { month: '11월', score: 4.4, count: 26 },
  { month: '12월', score: 4.5, count: 29 },
  { month: '1월', score: 4.6, count: 28 },
]

const categoryScores = [
  { category: '진료 만족도', score: 4.7, icon: Heart, change: 0.2 },
  { category: '대기 시간', score: 3.8, icon: Clock, change: -0.1 },
  { category: '직원 친절도', score: 4.6, icon: Smile, change: 0.3 },
  { category: '시설/청결', score: 4.5, icon: Star, change: 0.1 },
  { category: '설명 충분성', score: 4.4, icon: MessageSquare, change: 0.0 },
  { category: '재방문 의향', score: 4.7, icon: RefreshCw, change: 0.2 },
]

const reviews: Review[] = [
  {
    id: 'R001', patientName: '김*수', date: '2024-01-22', source: 'internal', rating: 5, sentiment: 'positive',
    comment: '원장님이 정말 친절하게 설명해주셔서 좋았습니다. 대기시간도 짧고 진료도 꼼꼼해요. 강력 추천합니다!',
    categories: [{ label: '진료', score: 5 }, { label: '친절', score: 5 }, { label: '대기', score: 4 }],
    replied: true, replyText: '소중한 후기 감사합니다. 앞으로도 최선을 다하겠습니다.',
  },
  {
    id: 'R002', patientName: '이*경', date: '2024-01-21', source: 'naver', rating: 5, sentiment: 'positive',
    comment: '갑상선 검사 결과 상세하게 설명해주셔서 이해가 잘 됐어요. 정기적으로 다닐 예정입니다.',
    categories: [{ label: '진료', score: 5 }, { label: '설명', score: 5 }],
    replied: false,
  },
  {
    id: 'R003', patientName: '박*호', date: '2024-01-20', source: 'kakao', rating: 4, sentiment: 'positive',
    comment: '진료는 만족스러웠는데 오전에 좀 대기가 길었습니다. 그래도 원장님 실력은 확실합니다.',
    categories: [{ label: '진료', score: 5 }, { label: '대기', score: 3 }],
    replied: true, replyText: '대기시간 불편 죄송합니다. 예약제 강화로 개선하고 있습니다.',
  },
  {
    id: 'R004', patientName: '강*원', date: '2024-01-19', source: 'internal', rating: 3, sentiment: 'neutral',
    comment: '평범한 내과 진료였습니다. 특별히 좋지도 나쁘지도 않았어요.',
    categories: [{ label: '진료', score: 3 }, { label: '친절', score: 3 }],
    replied: false,
  },
  {
    id: 'R005', patientName: '정*현', date: '2024-01-18', source: 'naver', rating: 2, sentiment: 'negative',
    comment: '30분 넘게 기다렸는데 진료는 5분도 안 걸렸습니다. 좀 더 자세히 봐주셨으면 합니다.',
    categories: [{ label: '대기', score: 1 }, { label: '진료', score: 2 }],
    replied: true, replyText: '불편을 드려 죄송합니다. 진료 시간과 대기시간 개선에 노력하겠습니다.',
  },
  {
    id: 'R006', patientName: '최*지', date: '2024-01-17', source: 'google', rating: 5, sentiment: 'positive',
    comment: 'AI 음성 차트가 신기했어요! 원장님이 제 이야기에 집중하시면서 동시에 기록이 되더라고요. 첨단이네요.',
    categories: [{ label: '진료', score: 5 }, { label: '시설', score: 5 }],
    replied: false,
  },
]

const surveyResults: SurveyResult[] = [
  { id: 'S001', patientName: '김영수', visitDate: '2024-01-22', status: 'completed', overallScore: 9, scores: [{ category: '진료', score: 10 }, { category: '대기', score: 7 }, { category: '친절', score: 9 }], feedback: '전반적으로 만족합니다', sentTime: '진료 후 1시간' },
  { id: 'S002', patientName: '이미경', visitDate: '2024-01-21', status: 'completed', overallScore: 10, scores: [{ category: '진료', score: 10 }, { category: '대기', score: 9 }, { category: '친절', score: 10 }], sentTime: '진료 후 1시간' },
  { id: 'S003', patientName: '박준호', visitDate: '2024-01-20', status: 'completed', overallScore: 7, scores: [{ category: '진료', score: 8 }, { category: '대기', score: 5 }, { category: '친절', score: 8 }], feedback: '대기시간이 좀 길었습니다', sentTime: '진료 후 1시간' },
  { id: 'S004', patientName: '강지원', visitDate: '2024-01-19', status: 'sent', overallScore: 0, scores: [], sentTime: '진료 후 1시간' },
  { id: 'S005', patientName: '한상우', visitDate: '2024-01-18', status: 'expired', overallScore: 0, scores: [], sentTime: '진료 후 1시간' },
]

const sourceConfig: Record<ReviewSource, { label: string; color: string }> = {
  internal: { label: '자체', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' },
  naver: { label: '네이버', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' },
  kakao: { label: '카카오', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30' },
  google: { label: 'Google', color: 'bg-red-100 text-red-600 dark:bg-red-900/30' },
}

export default function ReviewsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'surveys' | 'promote'>('overview')
  const [expandedReview, setExpandedReview] = useState<string | null>(null)
  const [filterSource, setFilterSource] = useState<'all' | ReviewSource>('all')
  const [showReplyModal, setShowReplyModal] = useState<string | null>(null)

  const filteredReviews = filterSource === 'all' ? reviews : reviews.filter(r => r.source === filterSource)
  const maxMonthly = Math.max(...monthlyScores.map(m => m.score))

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Star className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">환자 만족도 / 리뷰 관리</h1>
            <p className="text-sm text-muted-foreground">AI 감정 분석 · 리뷰 모니터링 · 평판 관리</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-sm text-xs bg-blue-600 text-white hover:bg-blue-700">
            <Send className="w-3.5 h-3.5" /> 설문 발송
          </button>
          <button className="btn-sm text-xs bg-secondary text-foreground">
            <Settings className="w-3.5 h-3.5" /> 설정
          </button>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto scrollbar-hide">
        {[
          { key: 'overview', label: '대시보드', icon: BarChart3 },
          { key: 'reviews', label: '리뷰 관리', icon: MessageSquare },
          { key: 'surveys', label: '설문 결과', icon: CheckCircle2 },
          { key: 'promote', label: '리뷰 유도', icon: Globe },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key ? 'border-amber-500 text-amber-600' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ 대시보드 ═══ */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* KPI */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={`w-4 h-4 ${i <= Math.round(overviewStats.avgScore) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                  ))}
                </div>
              </div>
              <div className="text-2xl font-bold">{overviewStats.avgScore}</div>
              <div className="text-xs text-muted-foreground">평균 평점 ({overviewStats.totalReviews}건)</div>
            </div>
            <div className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" />+4</span>
              </div>
              <div className="text-2xl font-bold">{overviewStats.nps}</div>
              <div className="text-xs text-muted-foreground">NPS 점수</div>
            </div>
            <div className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <Send className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold">{overviewStats.responseRate}%</div>
              <div className="text-xs text-muted-foreground">설문 응답률</div>
            </div>
            <div className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <MessageSquare className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-2xl font-bold">{overviewStats.thisMonth}건</div>
              <div className="text-xs text-muted-foreground">이번 달 리뷰</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 만족도 추이 */}
            <div className="card p-5">
              <h2 className="font-bold text-sm mb-4">월별 만족도 추이</h2>
              <div className="flex items-end gap-3 h-32">
                {monthlyScores.map((m, i) => {
                  const barH = ((m.score - 3) / 2) * 100
                  const isLatest = i === monthlyScores.length - 1
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-2xs font-bold">{m.score}</span>
                      <div
                        className={`w-full rounded-t-lg ${isLatest ? 'bg-amber-500' : 'bg-amber-200 dark:bg-amber-800/40'}`}
                        style={{ height: `${barH}%` }}
                      />
                      <span className={`text-2xs ${isLatest ? 'font-bold text-amber-600' : 'text-muted-foreground'}`}>{m.month}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* AI 감정 분석 */}
            <div className="card p-5">
              <h2 className="font-bold text-sm mb-4">AI 감정 분석</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Smile className="w-5 h-5 text-emerald-500" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">긍정</span>
                      <span className="text-xs font-bold text-emerald-600">{overviewStats.sentimentPositive}%</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${overviewStats.sentimentPositive}%` }} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Meh className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">중립</span>
                      <span className="text-xs font-bold text-gray-500">{overviewStats.sentimentNeutral}%</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gray-400 rounded-full" style={{ width: `${overviewStats.sentimentNeutral}%` }} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Frown className="w-5 h-5 text-red-500" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">부정</span>
                      <span className="text-xs font-bold text-red-500">{overviewStats.sentimentNegative}%</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: `${overviewStats.sentimentNegative}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-3 flex items-start gap-2">
                <Award className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-2xs text-emerald-700 dark:text-emerald-300">
                  긍정 리뷰 비율이 82%로 동종 의원 평균(71%) 대비 우수합니다. 대기시간 관련 부정 피드백이 가장 많으니 개선에 집중하세요.
                </p>
              </div>
            </div>
          </div>

          {/* 카테고리별 점수 */}
          <div className="card p-5">
            <h2 className="font-bold text-sm mb-4">카테고리별 만족도</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryScores.map((cat, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <cat.icon className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">{cat.category}</div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{cat.score}</span>
                      <span className={`text-2xs font-bold ${cat.change > 0 ? 'text-emerald-600' : cat.change < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                        {cat.change > 0 ? '+' : ''}{cat.change}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ 리뷰 관리 ═══ */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {(['all', 'internal', 'naver', 'kakao', 'google'] as const).map(src => (
              <button
                key={src}
                onClick={() => setFilterSource(src)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterSource === src ? 'bg-amber-500 text-white' : 'text-muted-foreground hover:bg-secondary'
                }`}
              >
                {src === 'all' ? '전체' : sourceConfig[src].label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredReviews.map(review => {
              const srcConf = sourceConfig[review.source]
              const isExpanded = expandedReview === review.id
              return (
                <div key={review.id} className={`card overflow-hidden ${review.sentiment === 'negative' ? 'ring-1 ring-red-200 dark:ring-red-800' : ''}`}>
                  <div className="p-4 cursor-pointer" onClick={() => setExpandedReview(isExpanded ? null : review.id)}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{review.patientName}</span>
                        <span className={`px-1.5 py-0.5 rounded text-2xs font-bold ${srcConf.color}`}>{srcConf.label}</span>
                        {review.sentiment === 'negative' && <span className="px-1.5 py-0.5 rounded text-2xs font-bold bg-red-100 text-red-600 dark:bg-red-900/30">주의</span>}
                        {review.replied && <span className="px-1.5 py-0.5 rounded text-2xs font-bold bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">답변 완료</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} className={`w-3 h-3 ${i <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{review.comment}</p>
                    <div className="flex items-center gap-2 mt-2 text-2xs text-muted-foreground">
                      <span>{review.date}</span>
                      <span>·</span>
                      {review.categories.map((cat, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-secondary">{cat.label} {cat.score}/5</span>
                      ))}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                      {review.replied && review.replyText && (
                        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-3">
                          <div className="text-2xs font-semibold text-blue-600 mb-1">원장님 답변</div>
                          <p className="text-xs text-blue-700 dark:text-blue-300">{review.replyText}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        {!review.replied && (
                          <button onClick={() => setShowReplyModal(review.id)} className="btn-sm text-xs bg-blue-600 text-white hover:bg-blue-700">
                            <MessageSquare className="w-3 h-3" /> 답변 작성
                          </button>
                        )}
                        <button className="btn-sm text-xs bg-secondary text-foreground">
                          <Eye className="w-3 h-3" /> 원문 보기
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ═══ 설문 결과 ═══ */}
      {activeTab === 'surveys' && (
        <div className="space-y-4">
          <div className="card">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-sm">최근 설문 발송 내역</h3>
              <div className="text-2xs text-muted-foreground">자동 발송: 진료 후 1시간</div>
            </div>
            <div className="divide-y divide-border">
              {surveyResults.map(s => (
                <div key={s.id} className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    s.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                    s.status === 'sent' ? 'bg-blue-100 dark:bg-blue-900/30' :
                    'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    {s.status === 'completed' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> :
                     s.status === 'sent' ? <Send className="w-5 h-5 text-blue-600" /> :
                     <Clock className="w-5 h-5 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{s.patientName}</span>
                      <span className={`px-1.5 py-0.5 rounded text-2xs font-bold ${
                        s.status === 'completed' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' :
                        s.status === 'sent' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' :
                        'bg-gray-100 text-gray-500 dark:bg-gray-800'
                      }`}>
                        {s.status === 'completed' ? '응답 완료' : s.status === 'sent' ? '발송됨' : '만료'}
                      </span>
                    </div>
                    <div className="text-2xs text-muted-foreground">{s.visitDate} 진료 · {s.sentTime}</div>
                    {s.feedback && <p className="text-2xs text-muted-foreground mt-0.5 italic">&quot;{s.feedback}&quot;</p>}
                  </div>
                  {s.status === 'completed' && (
                    <div className="text-right">
                      <div className={`text-lg font-bold ${s.overallScore >= 8 ? 'text-emerald-600' : s.overallScore >= 6 ? 'text-amber-600' : 'text-red-500'}`}>
                        {s.overallScore}/10
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ 리뷰 유도 ═══ */}
      {activeTab === 'promote' && (
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" /> 리뷰 유도 캠페인
            </h2>
            <p className="text-xs text-muted-foreground mb-4">만족도 8점 이상 환자에게 자동으로 리뷰 작성을 요청합니다.</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { platform: '네이버 플레이스', icon: '🟢', sent: 156, written: 48, rate: '30.8%' },
                { platform: '카카오맵', icon: '🟡', sent: 142, written: 31, rate: '21.8%' },
                { platform: 'Google Maps', icon: '🔴', sent: 89, written: 12, rate: '13.5%' },
              ].map((p, i) => (
                <div key={i} className="card p-4 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{p.icon}</span>
                    <span className="font-semibold text-sm">{p.platform}</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">요청 발송</span><span className="font-bold">{p.sent}건</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">리뷰 작성</span><span className="font-bold">{p.written}건</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">전환율</span><span className="font-bold text-blue-600">{p.rate}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-bold text-sm mb-3">자동 발송 설정</h2>
            <div className="space-y-3">
              {[
                { label: '만족도 설문 자동 발송', desc: '진료 완료 1시간 후 카카오 알림톡으로 발송', enabled: true },
                { label: '리뷰 유도 메시지', desc: '만족도 8점 이상 환자에게 플랫폼 리뷰 요청', enabled: true },
                { label: '부정 리뷰 즉시 알림', desc: '3점 이하 리뷰 등록 시 원장님에게 알림', enabled: true },
                { label: '감사 메시지 자동 발송', desc: '리뷰 작성 환자에게 감사 알림톡 발송', enabled: false },
              ].map((setting, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl">
                  <div>
                    <div className="text-sm font-medium">{setting.label}</div>
                    <div className="text-2xs text-muted-foreground mt-0.5">{setting.desc}</div>
                  </div>
                  <div className={`w-10 h-6 rounded-full flex items-center px-0.5 cursor-pointer transition-colors ${setting.enabled ? 'bg-blue-500 justify-end' : 'bg-gray-300 dark:bg-gray-600 justify-start'}`}>
                    <div className="w-5 h-5 rounded-full bg-white shadow" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 답변 모달 */}
      {showReplyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowReplyModal(null)}>
          <div className="bg-card rounded-2xl shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-bold text-lg">리뷰 답변</h3>
              <button onClick={() => setShowReplyModal(null)} className="btn-icon"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-secondary/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground italic">
                  &quot;{reviews.find(r => r.id === showReplyModal)?.comment}&quot;
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">답변 내용</label>
                <textarea className="input mt-1 min-h-[100px] text-sm" placeholder="답변을 입력하세요..." />
              </div>
              <div className="flex items-center gap-2 text-2xs text-muted-foreground">
                <Smile className="w-3.5 h-3.5" />
                AI 추천: &quot;소중한 의견 감사합니다. 말씀하신 부분 개선하도록 노력하겠습니다.&quot;
              </div>
              <button className="w-full py-2.5 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2">
                <Send className="w-4 h-4" /> 답변 등록
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
