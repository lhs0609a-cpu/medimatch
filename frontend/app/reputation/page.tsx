'use client'

import { useState } from 'react'
import {
  ArrowLeft, Star, MessageSquare, ThumbsUp, ThumbsDown,
  AlertCircle, Bell, ChevronDown, ChevronUp, TrendingUp,
  Eye, Clock, CheckCircle2, Copy, BarChart3, Shield
} from 'lucide-react'
import Link from 'next/link'

const platforms = ['전체', '네이버', '카카오맵', '구글'] as const
type Platform = typeof platforms[number]

type Review = {
  id: number; author: string; date: string; platform: '네이버' | '카카오맵' | '구글';
  rating: number; content: string; sentiment: '긍정' | '부정' | '중립'; replied: boolean;
}

const reviewsData: Review[] = [
  { id: 1, author: '김**', date: '2026-02-10', platform: '네이버', rating: 5, content: '원장님이 정말 친절하시고 설명도 자세히 해주셔서 안심이 됐어요. 대기시간도 짧고 시설도 깨끗합니다.', sentiment: '긍정', replied: true },
  { id: 2, author: '박**', date: '2026-02-09', platform: '카카오맵', rating: 4, content: '전반적으로 만족합니다. 주차가 좀 불편한 점만 빼면 좋은 병원이에요.', sentiment: '긍정', replied: true },
  { id: 3, author: '이**', date: '2026-02-08', platform: '구글', rating: 2, content: '예약했는데 30분 넘게 기다렸습니다. 대기시간 관리를 좀 해주셨으면 합니다.', sentiment: '부정', replied: false },
  { id: 4, author: '최**', date: '2026-02-07', platform: '네이버', rating: 5, content: '아이가 무서워하지 않도록 잘 달래주시면서 진료해주셨어요. 소아과 추천합니다!', sentiment: '긍정', replied: true },
  { id: 5, author: '정**', date: '2026-02-05', platform: '네이버', rating: 3, content: '진료는 괜찮은데 접수 직원이 좀 불친절한 것 같아요.', sentiment: '중립', replied: false },
  { id: 6, author: '한**', date: '2026-02-03', platform: '카카오맵', rating: 1, content: '처방받은 약이 효과가 없어서 다시 갔더니 추가 비용을 받더군요. 불만입니다.', sentiment: '부정', replied: true },
  { id: 7, author: '윤**', date: '2026-02-01', platform: '구글', rating: 5, content: 'Best clinic in the area. Doctor is very knowledgeable and staff is friendly.', sentiment: '긍정', replied: false },
  { id: 8, author: '조**', date: '2026-01-28', platform: '네이버', rating: 4, content: '깔끔한 시설과 최신 장비가 인상적이었습니다. 재방문 의향 있어요.', sentiment: '긍정', replied: true },
  { id: 9, author: '강**', date: '2026-01-25', platform: '카카오맵', rating: 4, content: '야간 진료해주셔서 감사합니다. 퇴근 후에도 갈 수 있어 좋아요.', sentiment: '긍정', replied: true },
  { id: 10, author: '서**', date: '2026-01-20', platform: '네이버', rating: 2, content: '의사 선생님은 좋은데 간호사분이 주사를 너무 아프게 놔요.', sentiment: '부정', replied: false },
]

const responseTemplates = {
  positive: [
    { title: '감사 + 재방문 유도', template: '따뜻한 후기 감사드립니다! {작성자}님의 건강을 위해 항상 최선을 다하겠습니다. 다음 방문 시에도 만족스러운 진료를 제공하겠습니다. 감사합니다.' },
    { title: '구체적 칭찬 감사', template: '{칭찬내용}에 대한 좋은 말씀 감사합니다. 저희 의료진이 큰 힘을 얻습니다. 앞으로도 환자분들께 최상의 의료 서비스를 제공하도록 노력하겠습니다.' },
    { title: '추천 감사', template: '소중한 추천 감사드립니다! 주변분들에게 저희 병원을 알려주신 것에 진심으로 감사합니다. 신뢰에 보답하는 진료로 보답하겠습니다.' },
  ],
  negative: [
    { title: '불편 사과 + 개선 약속', template: '불편을 드려 진심으로 사과드립니다. {불만사항}에 대해 내부적으로 즉시 검토하여 개선하겠습니다. 더 나은 서비스로 보답할 기회를 주시면 감사하겠습니다. 구체적인 상담이 필요하시면 {전화번호}로 연락 부탁드립니다.' },
    { title: '대기시간 관련 사과', template: '오래 기다리게 해드려 죄송합니다. 환자분들의 대기시간을 줄이기 위해 예약 시스템을 개선하고 있습니다. 불편을 최소화하도록 더욱 노력하겠습니다.' },
    { title: '비용 관련 안내', template: '비용 관련 불편을 드려 죄송합니다. 진료비에 대해 보다 명확한 사전 안내가 이루어질 수 있도록 개선하겠습니다. 궁금하신 사항은 {전화번호}로 문의 주시면 상세히 안내드리겠습니다.' },
  ],
  inquiry: [
    { title: '진료 문의 안내', template: '문의 감사합니다. {문의내용}에 대해 안내드립니다. 보다 정확한 상담을 위해 {전화번호} 또는 네이버 예약을 통해 내원 상담을 권장드립니다.' },
    { title: '운영시간/위치 안내', template: '문의 감사합니다. 저희 병원 운영시간은 평일 {시간}, 토요일 {시간}이며, {주소}에 위치해 있습니다. 주차장은 건물 지하에 마련되어 있습니다.' },
  ],
}

const monthlyTrend = [
  { month: '9월', count: 8 },
  { month: '10월', count: 11 },
  { month: '11월', count: 14 },
  { month: '12월', count: 10 },
  { month: '1월', count: 15 },
  { month: '2월', count: 12 },
]

const reputationPrinciples = [
  '모든 리뷰에 24시간 이내 답변하기 — 빠른 응답은 관심과 성의를 보여줍니다',
  '부정 리뷰에 감정적으로 대응하지 않기 — 사실 기반의 정중한 답변이 오히려 신뢰를 높입니다',
  '리뷰 작성 요청을 자연스럽게 하기 — 진료 후 QR코드, 문자 안내 활용',
  '긍정 리뷰도 반드시 답변하기 — 감사 표현은 추가 리뷰를 유도합니다',
  '부정 리뷰의 패턴을 분석하여 실제 운영 개선에 반영하기 — 리뷰는 무료 컨설팅입니다',
]

export default function ReputationPage() {
  const [activePlatform, setActivePlatform] = useState<Platform>('전체')
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [alertNegative, setAlertNegative] = useState(true)
  const [alertNew, setAlertNew] = useState(true)

  const filteredReviews = activePlatform === '전체'
    ? reviewsData
    : reviewsData.filter(r => r.platform === activePlatform)

  const totalReviews = 127
  const avgRating = 4.3
  const recentNew = 12
  const negativeRate = 8

  const copyTemplate = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const maxTrend = Math.max(...monthlyTrend.map(m => m.count))

  return (
    <div className="min-h-screen bg-background">
      <header className="glass sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="btn-ghost p-2 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h1 className="font-bold text-lg">리뷰/평판 관리</h1>
            </div>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:block">온라인 평판이 곧 병원의 경쟁력</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        {/* Dashboard Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">총 리뷰 수</span>
            </div>
            <p className="text-2xl font-bold">{totalReviews}개</p>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-xs text-muted-foreground">평균 평점</span>
            </div>
            <p className="text-2xl font-bold">{avgRating}/5.0</p>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground">최근 30일 신규</span>
            </div>
            <p className="text-2xl font-bold">{recentNew}개</p>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-xs text-muted-foreground">부정 리뷰 비율</span>
            </div>
            <p className="text-2xl font-bold">{negativeRate}%</p>
          </div>
        </div>

        {/* Platform Tabs */}
        <div className="flex gap-2">
          {platforms.map(p => (
            <button
              key={p}
              onClick={() => setActivePlatform(p)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activePlatform === p
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Reviews List */}
        <div className="card p-5">
          <h2 className="font-bold text-lg mb-4">리뷰 목록</h2>
          <div className="space-y-3">
            {filteredReviews.map(review => (
              <div key={review.id} className={`p-4 rounded-xl border ${
                review.sentiment === '부정' ? 'border-red-500/30 bg-red-500/5' :
                review.sentiment === '중립' ? 'border-yellow-500/30 bg-yellow-500/5' :
                'border-green-500/30 bg-green-500/5'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-sm">{review.author}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      review.platform === '네이버' ? 'bg-green-500/15 text-green-600' :
                      review.platform === '카카오맵' ? 'bg-yellow-500/15 text-yellow-600' :
                      'bg-blue-500/15 text-blue-600'
                    }`}>
                      {review.platform}
                    </span>
                    <span className="text-xs text-muted-foreground">{review.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      review.sentiment === '긍정' ? 'bg-green-500/15 text-green-600' :
                      review.sentiment === '부정' ? 'bg-red-500/15 text-red-600' :
                      'bg-gray-500/15 text-muted-foreground'
                    }`}>
                      {review.sentiment}
                    </span>
                    {review.replied
                      ? <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> 답변완료</span>
                      : <span className="text-xs text-red-500 flex items-center gap-1"><Clock className="w-3 h-3" /> 미답변</span>
                    }
                  </div>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed">{review.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="card p-5">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            월별 리뷰 추이
          </h2>
          <div className="flex items-end gap-3 h-40">
            {monthlyTrend.map(m => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-semibold">{m.count}</span>
                <div
                  className="w-full bg-primary/70 rounded-t-lg transition-all duration-500"
                  style={{ height: `${(m.count / maxTrend) * 100}%` }}
                />
                <span className="text-xs text-muted-foreground">{m.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Response Templates */}
        <div className="card p-5">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            리뷰 답변 템플릿
          </h2>
          <div className="space-y-3">
            {/* Positive Templates */}
            <div className="border border-muted rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedTemplate(expandedTemplate === 'pos' ? null : 'pos')}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition"
              >
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-green-500" />
                  <span className="font-medium text-sm">긍정 리뷰 답변 템플릿 ({responseTemplates.positive.length})</span>
                </div>
                {expandedTemplate === 'pos' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {expandedTemplate === 'pos' && (
                <div className="px-4 pb-4 space-y-3">
                  {responseTemplates.positive.map((t, i) => (
                    <div key={i} className="bg-green-500/5 rounded-xl p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-green-600">{t.title}</span>
                        <button
                          onClick={() => copyTemplate(t.template, `pos-${i}`)}
                          className="text-xs flex items-center gap-1 text-muted-foreground hover:text-primary transition"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedId === `pos-${i}` ? '복사됨!' : '복사'}
                        </button>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{t.template}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Negative Templates */}
            <div className="border border-muted rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedTemplate(expandedTemplate === 'neg' ? null : 'neg')}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition"
              >
                <div className="flex items-center gap-2">
                  <ThumbsDown className="w-4 h-4 text-red-500" />
                  <span className="font-medium text-sm">부정 리뷰 답변 템플릿 ({responseTemplates.negative.length})</span>
                </div>
                {expandedTemplate === 'neg' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {expandedTemplate === 'neg' && (
                <div className="px-4 pb-4 space-y-3">
                  {responseTemplates.negative.map((t, i) => (
                    <div key={i} className="bg-red-500/5 rounded-xl p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-red-600">{t.title}</span>
                        <button
                          onClick={() => copyTemplate(t.template, `neg-${i}`)}
                          className="text-xs flex items-center gap-1 text-muted-foreground hover:text-primary transition"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedId === `neg-${i}` ? '복사됨!' : '복사'}
                        </button>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{t.template}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inquiry Templates */}
            <div className="border border-muted rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedTemplate(expandedTemplate === 'inq' ? null : 'inq')}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  <span className="font-medium text-sm">문의 리뷰 답변 템플릿 ({responseTemplates.inquiry.length})</span>
                </div>
                {expandedTemplate === 'inq' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {expandedTemplate === 'inq' && (
                <div className="px-4 pb-4 space-y-3">
                  {responseTemplates.inquiry.map((t, i) => (
                    <div key={i} className="bg-blue-500/5 rounded-xl p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-blue-600">{t.title}</span>
                        <button
                          onClick={() => copyTemplate(t.template, `inq-${i}`)}
                          className="text-xs flex items-center gap-1 text-muted-foreground hover:text-primary transition"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedId === `inq-${i}` ? '복사됨!' : '복사'}
                        </button>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{t.template}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reputation Principles */}
        <div className="card p-5">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            평판 관리 5가지 원칙
          </h2>
          <div className="space-y-3">
            {reputationPrinciples.map((p, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl">
                <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs flex items-center justify-center font-bold shrink-0">
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed">{p}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Alert Settings */}
        <div className="card p-5">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            알림 설정
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div>
                <p className="font-medium text-sm">부정 리뷰 알림</p>
                <p className="text-xs text-muted-foreground mt-0.5">별점 3점 이하 리뷰 등록 시 즉시 알림</p>
              </div>
              <button
                onClick={() => setAlertNegative(!alertNegative)}
                className={`w-12 h-6 rounded-full transition-all relative ${alertNegative ? 'bg-primary' : 'bg-muted'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${alertNegative ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div>
                <p className="font-medium text-sm">새 리뷰 알림</p>
                <p className="text-xs text-muted-foreground mt-0.5">모든 플랫폼 신규 리뷰 등록 시 알림</p>
              </div>
              <button
                onClick={() => setAlertNew(!alertNew)}
                className={`w-12 h-6 rounded-full transition-all relative ${alertNew ? 'bg-primary' : 'bg-muted'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${alertNew ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
