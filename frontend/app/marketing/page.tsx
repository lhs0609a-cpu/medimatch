'use client'

import { useState } from 'react'
import {
  ArrowLeft, Megaphone, Calendar, Rocket, TrendingUp,
  CheckCircle2, Circle, Calculator, Star, Phone, ExternalLink,
  Target, BarChart3, Users, MapPin
} from 'lucide-react'
import Link from 'next/link'

const phases = [
  {
    id: 'pre',
    label: '개원 전',
    period: 'D-90 ~ D-30',
    icon: Calendar,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    items: [
      { id: 'p1', text: '네이버 플레이스 사전 등록 (주소/진료과목/대표사진)', priority: '필수' },
      { id: 'p2', text: '네이버 블로그 개설 및 첫 10개 포스팅 작성', priority: '필수' },
      { id: 'p3', text: '인스타그램/카카오 채널 계정 생성 및 프로필 세팅', priority: '높음' },
      { id: 'p4', text: '지역 맘카페/주민커뮤니티 홍보 게시글 작성', priority: '높음' },
      { id: 'p5', text: '카카오맵 사업장 등록', priority: '필수' },
      { id: 'p6', text: '구글 비즈니스 프로필 등록', priority: '보통' },
      { id: 'p7', text: '현수막 디자인 및 제작 의뢰 (3~5개소)', priority: '보통' },
      { id: 'p8', text: '근처 약국/건물 제휴 배너 협의', priority: '보통' },
    ],
  },
  {
    id: 'launch',
    label: '개원 직전',
    period: 'D-30 ~ D-day',
    icon: Rocket,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    items: [
      { id: 'l1', text: '개원 이벤트 기획 (초진 할인, 건강검진 패키지 등)', priority: '필수' },
      { id: 'l2', text: '전단지 5,000부 제작 및 주변 아파트/상가 배포', priority: '높음' },
      { id: 'l3', text: '네이버 파워링크 광고 세팅 (키워드 20~30개)', priority: '필수' },
      { id: 'l4', text: '인스타그램 지역 타겟 광고 집행 시작', priority: '높음' },
      { id: 'l5', text: '현수막 게시 (관할구청 허가 확인)', priority: '보통' },
      { id: 'l6', text: '개원 안내 문자/카카오톡 발송 (지인 네트워크)', priority: '높음' },
      { id: 'l7', text: '네이버 플레이스 상세정보 최종 업데이트', priority: '필수' },
    ],
  },
  {
    id: 'post',
    label: '개원 후',
    period: 'D+1 ~ D+90',
    icon: TrendingUp,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    items: [
      { id: 'a1', text: '리뷰 수집 시스템 구축 (QR코드 + 문자 자동발송)', priority: '필수' },
      { id: 'a2', text: '재방문 프로모션 설계 (2회차 방문 할인 쿠폰)', priority: '높음' },
      { id: 'a3', text: '블로그 포스팅 주 2~3회 정기 업로드', priority: '필수' },
      { id: 'a4', text: '네이버 파워링크 키워드/입찰가 최적화', priority: '높음' },
      { id: 'a5', text: '인스타그램 릴스/스토리 주 3회 업로드', priority: '보통' },
      { id: 'a6', text: '환자 만족도 설문 시행 (월 1회)', priority: '보통' },
      { id: 'a7', text: '부정 리뷰 모니터링 및 즉시 대응', priority: '필수' },
      { id: 'a8', text: '카카오톡 채널 친구 1,000명 달성', priority: '보통' },
    ],
  },
]

const channels = [
  { name: '네이버 플레이스', cost: '무료', costRange: '필수 등록', effect: 5, roi: '최고', desc: '지역 검색 1위 채널. 리뷰·사진·예약 연동 필수', color: 'border-green-500' },
  { name: '네이버 블로그', cost: '무료~30만/월', costRange: '외주 시 30~50만', effect: 4, roi: '높음', desc: '의료정보 포스팅으로 전문성 어필. SEO 효과 탁월', color: 'border-blue-500' },
  { name: '네이버 파워링크', cost: '50~200만/월', costRange: '클릭당 500~3,000원', effect: 4, roi: '중상', desc: '즉각적인 환자 유입. 키워드별 입찰가 관리 필요', color: 'border-indigo-500' },
  { name: '인스타그램 광고', cost: '30~100만/월', costRange: '지역 타겟 광고', effect: 3, roi: '보통', desc: '20~40대 여성 타겟 효과적. 비주얼 콘텐츠 필수', color: 'border-pink-500' },
  { name: '전단지/현수막', cost: '20~50만', costRange: '1회성 비용', effect: 2, roi: '낮음', desc: '개원 초기 인지도. 반경 1km 내 효과적', color: 'border-yellow-500' },
  { name: '카카오맵 등록', cost: '무료', costRange: '필수 등록', effect: 3, roi: '높음', desc: '카카오 검색 유입. 카카오톡 채널 연동 권장', color: 'border-amber-500' },
  { name: '지역 커뮤니티', cost: '무료', costRange: '시간 투자', effect: 3, roi: '높음', desc: '맘카페, 지역카페 활동. 신뢰도 높은 입소문 채널', color: 'border-teal-500' },
]

const defaultAlloc = [
  { channel: '네이버 파워링크', pct: 35 },
  { channel: '네이버 블로그 (외주)', pct: 20 },
  { channel: '인스타그램 광고', pct: 15 },
  { channel: '전단지/현수막', pct: 10 },
  { channel: '카카오 채널 운영', pct: 10 },
  { channel: '리뷰 이벤트', pct: 10 },
]

export default function MarketingPage() {
  const [activePhase, setActivePhase] = useState('pre')
  const [completed, setCompleted] = useState<string[]>([])
  const [budget, setBudget] = useState(300)

  const toggle = (id: string) => {
    setCompleted(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const currentPhase = phases.find(p => p.id === activePhase)!
  const phaseProgress = currentPhase.items.length > 0
    ? Math.round((currentPhase.items.filter(i => completed.includes(i.id)).length / currentPhase.items.length) * 100)
    : 0

  return (
    <div className="min-h-screen bg-background">
      <header className="glass sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="btn-ghost p-2 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-primary" />
              <h1 className="font-bold text-lg">개원 마케팅 패키지</h1>
            </div>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:block">체계적인 마케팅으로 개원 성공률 UP</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: '총 체크리스트', value: `${phases.reduce((s, p) => s + p.items.length, 0)}개`, icon: Target, color: 'text-blue-500' },
            { label: '완료 항목', value: `${completed.length}개`, icon: CheckCircle2, color: 'text-green-500' },
            { label: '예상 월 예산', value: `${budget}만원`, icon: Calculator, color: 'text-orange-500' },
            { label: '추천 채널', value: '7개', icon: BarChart3, color: 'text-purple-500' },
          ].map((kpi) => (
            <div key={kpi.label} className="card p-5">
              <div className="flex items-center gap-2 mb-1">
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Phase Tabs */}
        <div className="card p-5">
          <h2 className="font-bold text-lg mb-4">단계별 마케팅 체크리스트</h2>
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {phases.map(phase => (
              <button
                key={phase.id}
                onClick={() => setActivePhase(phase.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  activePhase === phase.id
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <phase.icon className="w-4 h-4" />
                <span>{phase.label}</span>
                <span className="text-xs opacity-75">({phase.period})</span>
              </button>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">{currentPhase.label} 진행률</span>
              <span className="font-semibold">{phaseProgress}%</span>
            </div>
            <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${phaseProgress}%` }} />
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-2">
            {currentPhase.items.map(item => (
              <button
                key={item.id}
                onClick={() => toggle(item.id)}
                className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all ${
                  completed.includes(item.id) ? 'bg-green-500/10' : 'bg-muted/50 hover:bg-muted'
                }`}
              >
                {completed.includes(item.id)
                  ? <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  : <Circle className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                }
                <div className="flex-1">
                  <span className={`text-sm ${completed.includes(item.id) ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {item.text}
                  </span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                  item.priority === '필수' ? 'bg-red-500/15 text-red-500' :
                  item.priority === '높음' ? 'bg-orange-500/15 text-orange-500' :
                  'bg-gray-500/15 text-muted-foreground'
                }`}>
                  {item.priority}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Budget Calculator */}
        <div className="card p-5">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            마케팅 예산 배분 계산기
          </h2>
          <div className="mb-6">
            <label className="text-sm text-muted-foreground mb-2 block">월 마케팅 총 예산 (만원)</label>
            <input
              type="range"
              min={100}
              max={1000}
              step={50}
              value={budget}
              onChange={e => setBudget(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>100만원</span>
              <span className="text-lg font-bold text-foreground">{budget}만원</span>
              <span>1,000만원</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {defaultAlloc.map(a => (
              <div key={a.channel} className="bg-muted/50 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">{a.channel}</span>
                  <span className="text-xs text-muted-foreground">{a.pct}%</span>
                </div>
                <p className="text-xl font-bold text-primary">{Math.round(budget * a.pct / 100)}만원</p>
                <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-primary/60 rounded-full" style={{ width: `${a.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Channel Comparison */}
        <div className="card p-5">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            마케팅 채널 비교
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {channels.map(ch => (
              <div key={ch.name} className={`border-l-4 ${ch.color} bg-muted/30 rounded-xl p-4`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{ch.name}</h3>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">ROI {ch.roi}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{ch.desc}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{ch.cost}</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < ch.effect ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{ch.costRange}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="card p-8 text-center bg-gradient-to-r from-primary/10 to-blue-500/10">
          <Users className="w-10 h-10 text-primary mx-auto mb-3" />
          <h2 className="text-xl font-bold mb-2">마케팅 전문가 무료 상담</h2>
          <p className="text-sm text-muted-foreground mb-4">
            개원 마케팅 경험 풍부한 전문가가 맞춤 전략을 제안해 드립니다.<br />
            상담 후 계약 의무 없이 견적서만 받아보셔도 됩니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:opacity-90 transition">
              <Phone className="w-4 h-4" /> 마케팅 전문가 상담 신청
            </button>
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-muted text-foreground rounded-xl font-medium hover:bg-muted/80 transition">
              <ExternalLink className="w-4 h-4" /> 성공 사례 보기
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
