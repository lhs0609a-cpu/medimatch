'use client'

import React from 'react'
import Link from 'next/link'
import {
  DollarSign, PieChart, TrendingUp, Target, Brain, Users, MapPin,
  Lock, Sparkles, CheckCircle2, LineChart, Shield, BarChart3,
} from 'lucide-react'

interface PaywallCTAProps {
  onUnlock: () => void
  isLoading: boolean
  price: number
}

/* ── 블러 값 렌더러 ── */
function BlurValue({ value, color }: { value: string; color?: string }) {
  return (
    <span className={`blur-[5px] select-none font-semibold ${color || 'text-foreground'}`}>
      {value}
    </span>
  )
}

function BlurRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
      <span className="text-sm text-foreground">{label}</span>
      <BlurValue value={value} color={color} />
    </div>
  )
}

/* ── 섹션별 항목 정의 (라벨은 실제, 값은 더미 but 현실적) ── */
const sections = [
  {
    icon: <DollarSign className="w-4 h-4 text-green-500" />,
    title: '매출 상세 분석',
    color: 'border-green-200 dark:border-green-800/50',
    headerBg: 'bg-green-50 dark:bg-green-950/30',
    items: [
      { label: '일 평균 환자수', value: '42명' },
      { label: '일 최소 환자수', value: '28명' },
      { label: '일 최대 환자수', value: '61명' },
      { label: '평균 진료비', value: '45,200원' },
      { label: '보험 진료 비율', value: '72%', color: 'text-blue-600' },
      { label: '비보험 진료 비율', value: '28%', color: 'text-amber-600' },
      { label: '신환 비율', value: '35%' },
      { label: '재진 비율', value: '65%' },
      { label: '환자당 평균 방문', value: '3.2회' },
      { label: '계절 변동계수', value: '±15%' },
    ],
  },
  {
    icon: <PieChart className="w-4 h-4 text-orange-500" />,
    title: '비용 구조 분석',
    color: 'border-orange-200 dark:border-orange-800/50',
    headerBg: 'bg-orange-50 dark:bg-orange-950/30',
    items: [
      { label: '보증금', value: '1억 5,000만원' },
      { label: '월 임대료', value: '450만원' },
      { label: '관리비', value: '85만원' },
      { label: '의사 수', value: '2명' },
      { label: '간호사 수', value: '3명' },
      { label: '행정직원 수', value: '2명' },
      { label: '간호사 평균 급여', value: '320만원' },
      { label: '행정직 평균 급여', value: '280만원' },
      { label: '장비 월 비용', value: '180만원' },
      { label: '마케팅 월 비용', value: '150만원' },
      { label: '보험료 (월)', value: '45만원' },
      { label: '초기 투자비 총액', value: '3억 2,000만원', color: 'text-orange-600' },
    ],
  },
  {
    icon: <TrendingUp className="w-4 h-4 text-blue-500" />,
    title: 'ROI 및 수익성',
    color: 'border-blue-200 dark:border-blue-800/50',
    headerBg: 'bg-blue-50 dark:bg-blue-950/30',
    items: [
      { label: '영업이익률', value: '28.5%', color: 'text-green-600' },
      { label: '연간 ROI', value: '42.3%', color: 'text-blue-600' },
      { label: 'IRR (내부수익률)', value: '35.8%', color: 'text-violet-600' },
      { label: 'NPV (3년 순현재가치)', value: '2억 4,000만원', color: 'text-teal-600' },
      { label: '투자 회수기간', value: '18개월' },
      { label: '월 이익 범위', value: '1,200~2,100만원' },
      { label: '연간 이익 추정', value: '1억 8,000만원' },
    ],
  },
  {
    icon: <Target className="w-4 h-4 text-rose-500" />,
    title: '경쟁 심층 분석',
    color: 'border-rose-200 dark:border-rose-800/50',
    headerBg: 'bg-rose-50 dark:bg-rose-950/30',
    items: [
      { label: '경쟁 지수', value: '6.2 / 10' },
      { label: '경쟁 수준', value: '보통' },
      { label: '시장 포화도', value: '65%' },
      { label: '예상 시장 점유율', value: '12.5%', color: 'text-blue-600' },
      { label: '잠재 월 환자수', value: '1,850명' },
      { label: '최근접 동일과 거리', value: '320m' },
      { label: '동일과 평균 거리', value: '580m' },
      { label: '경쟁병원 실명 공개', value: '서초●●의원 외 4' },
      { label: '경쟁병원 추정 매출', value: '5,500만~8,000만원' },
    ],
  },
  {
    icon: <Users className="w-4 h-4 text-indigo-500" />,
    title: '인구 상세 분석',
    color: 'border-indigo-200 dark:border-indigo-800/50',
    headerBg: 'bg-indigo-50 dark:bg-indigo-950/30',
    items: [
      { label: '500m 반경 인구', value: '12,400명' },
      { label: '1km 반경 인구', value: '45,200명' },
      { label: '3km 반경 인구', value: '285,000명' },
      { label: '1인가구 비율', value: '38.2%' },
      { label: '평균 가구소득', value: '650만원' },
      { label: '피크 유동인구 시간대', value: '12:00~13:00' },
      { label: '의료이용률 상세', value: '82.5%' },
      { label: '연 평균 의료기관 방문', value: '18.3회' },
    ],
  },
  {
    icon: <MapPin className="w-4 h-4 text-emerald-500" />,
    title: '입지 분석',
    color: 'border-emerald-200 dark:border-emerald-800/50',
    headerBg: 'bg-emerald-50 dark:bg-emerald-950/30',
    items: [
      { label: '교통 접근성 점수', value: '82 / 100', color: 'text-green-600' },
      { label: '주차 편의성 점수', value: '65 / 100', color: 'text-amber-600' },
      { label: '상권 활성도 점수', value: '78 / 100', color: 'text-green-600' },
      { label: '가시성 점수', value: '71 / 100' },
      { label: '최근접 지하철', value: '역삼역 (250m)' },
      { label: '버스 정류장 / 노선', value: '8개 / 15노선' },
      { label: '건물 유형 / 연식', value: '상가건물 (12년)' },
      { label: '주변 편의시설', value: '약국 5, 편의점 8...' },
    ],
  },
  {
    icon: <LineChart className="w-4 h-4 text-violet-500" />,
    title: '3년 성장 전망',
    color: 'border-violet-200 dark:border-violet-800/50',
    headerBg: 'bg-violet-50 dark:bg-violet-950/30',
    items: [
      { label: '1년차 예상 매출', value: '7억 2,000만원' },
      { label: '2년차 예상 매출', value: '8억 5,000만원' },
      { label: '3년차 예상 매출', value: '9억 8,000만원' },
      { label: '1년차 성장률', value: '+15.2%', color: 'text-green-600' },
      { label: '2년차 성장률', value: '+18.1%', color: 'text-green-600' },
      { label: '주변 개발 계획', value: '3건 확인됨' },
      { label: '인구 성장률', value: '+2.3%/년' },
      { label: '5년 누적 수익 추정', value: '12억 5,000만원', color: 'text-blue-600' },
    ],
  },
  {
    icon: <Shield className="w-4 h-4 text-amber-500" />,
    title: '리스크 분석',
    color: 'border-amber-200 dark:border-amber-800/50',
    headerBg: 'bg-amber-50 dark:bg-amber-950/30',
    items: [
      { label: '전체 리스크 수준', value: '보통 (MEDIUM)' },
      { label: '리스크 점수', value: '45 / 100' },
      { label: '경쟁 리스크', value: '보통' },
      { label: '경기 변동 리스크', value: '낮음', color: 'text-green-600' },
      { label: '주요 리스크 요인', value: '3개 식별됨' },
      { label: '기회 요인', value: '4개 식별됨', color: 'text-blue-600' },
    ],
  },
  {
    icon: <Brain className="w-4 h-4 text-pink-500" />,
    title: 'AI 전략 리포트',
    color: 'border-pink-200 dark:border-pink-800/50',
    headerBg: 'bg-pink-50 dark:bg-pink-950/30',
    items: [
      { label: 'SWOT — 강점', value: '높은 유동인구, 교통...' },
      { label: 'SWOT — 약점', value: '경쟁 과밀, 주차 부족...' },
      { label: 'SWOT — 기회', value: '개발 호재, 인구 유입...' },
      { label: 'SWOT — 위협', value: '임대료 상승, 대형병...' },
      { label: '추천 차별화 전략', value: '비급여 특화 + 야간...' },
      { label: '타겟 환자층', value: '30~50대 직장인, 가...' },
      { label: '마케팅 전략', value: '네이버 플레이스 + ...' },
      { label: '추천 진료 특화', value: '2개 분야 제안' },
      { label: '추천 운영 시간', value: '평일 09~21시, 토...' },
      { label: '계절별 전략', value: '분기별 맞춤 계획' },
    ],
  },
]

const totalItems = sections.reduce((sum, s) => sum + s.items.length, 0)

export default function PaywallCTA({ onUnlock, isLoading, price }: PaywallCTAProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/50 dark:from-blue-950/20 dark:via-background dark:to-indigo-950/20">
      {/* Header */}
      <div className="text-center p-6 md:p-8 pb-4">
        <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-3">
          <Lock className="w-4 h-4" />
          {totalItems}개 상세 분석 항목
        </div>
        <h3 className="text-xl font-bold text-foreground">
          아래 데이터가 모두 잠금해제됩니다
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          라벨은 보이지만 값은 블러 처리되어 있습니다
        </p>
      </div>

      {/* ── All Items by Section ── */}
      <div className="px-4 md:px-8 space-y-4 pb-4">
        {sections.map((section, sIdx) => (
          <div
            key={section.title}
            className={`rounded-xl border ${section.color} overflow-hidden`}
          >
            {/* Section Header */}
            <div className={`flex items-center gap-2 px-4 py-2.5 ${section.headerBg}`}>
              {section.icon}
              <span className="text-sm font-semibold text-foreground">{section.title}</span>
              <span className="ml-auto text-[11px] text-muted-foreground">{section.items.length}개 항목</span>
            </div>

            {/* Blurred Items */}
            <div className="px-2 py-1 grid sm:grid-cols-2 gap-x-2">
              {section.items.map((item, iIdx) => (
                <BlurRow
                  key={iIdx}
                  label={item.label}
                  value={item.value}
                  color={item.color}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Sticky CTA ── */}
      <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-white/80 dark:from-background dark:via-background dark:to-background/80 pt-6 pb-6 px-6 md:px-8">
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={onUnlock}
            disabled={isLoading}
            className="btn-primary text-base px-10 py-3.5 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow w-full max-w-md"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                결제 처리중...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                {price.toLocaleString()}원으로 {totalItems}개 항목 잠금해제
              </>
            )}
          </button>

          <span className="text-sm text-muted-foreground">
            또는{' '}
            <Link href="/subscribe" className="text-blue-600 hover:underline font-medium">
              프리미엄 구독
            </Link>
            으로 무제한 이용
          </span>
        </div>
      </div>

      {/* Social Proof */}
      <p className="text-center text-xs text-muted-foreground pb-6 px-6">
        커피 한 잔 가격으로 개원 컨설팅 수백만원 가치의 데이터 분석을 받아보세요
      </p>
    </div>
  )
}
