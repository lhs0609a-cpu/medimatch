'use client'

import React from 'react'
import Link from 'next/link'
import {
  DollarSign, PieChart, TrendingUp, Target, Brain,
  Lock, Sparkles, CheckCircle2, LineChart,
} from 'lucide-react'
import BlurredCard from './BlurredCard'

interface PaywallCTAProps {
  onUnlock: () => void
  isLoading: boolean
  price: number
}

const premiumSections = [
  {
    icon: <DollarSign className="w-5 h-5 text-green-500" />,
    title: '매출 상세 분석',
    description: '일 환자수, 평균 진료비, 보험/비보험 비율, 계절 변동 분석',
    items: 8,
  },
  {
    icon: <PieChart className="w-5 h-5 text-orange-500" />,
    title: '비용 구조 분석',
    description: '임대료, 인건비, 장비, 마케팅 등 항목별 비용과 초기 투자비',
    items: 12,
  },
  {
    icon: <TrendingUp className="w-5 h-5 text-blue-500" />,
    title: 'ROI 및 수익성',
    description: '영업이익률, IRR, NPV, 연간 수익 등 핵심 재무지표',
    items: 6,
  },
  {
    icon: <Target className="w-5 h-5 text-rose-500" />,
    title: '경쟁 심층 분석',
    description: '경쟁 병원별 매출/평점/특화 분야, 시장 포화도, 예상 점유율',
    items: 10,
  },
  {
    icon: <LineChart className="w-5 h-5 text-violet-500" />,
    title: '3년 성장 전망',
    description: '연도별 매출/이익 예측, 주변 개발 계획, 인구 성장률',
    items: 8,
  },
  {
    icon: <Brain className="w-5 h-5 text-indigo-500" />,
    title: 'AI 전략 리포트',
    description: 'SWOT 분석, 차별화 전략, 타겟 환자층, 마케팅 제안',
    items: 15,
  },
]

const valueChecklist = [
  '정확한 예상 매출/비용/순이익 분석',
  'ROI, IRR, NPV 등 핵심 재무지표',
  '경쟁 병원별 상세 분석 (매출/평점/특화)',
  '연령별 인구 분포 및 의료이용률',
  '교통/주차/상권/가시성 입지 점수',
  '3개년 매출·이익 시나리오',
  '리스크 분석 및 기회 요인',
  'AI 기반 SWOT + 맞춤 전략 리포트',
]

export default function PaywallCTA({ onUnlock, isLoading, price }: PaywallCTAProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 p-6 md:p-8">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-3">
          <Lock className="w-4 h-4" />
          50개+ 상세 분석 항목
        </div>
        <h3 className="text-xl font-bold text-foreground">
          전체 분석 리포트를 확인하세요
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          아래 6개 섹션의 상세 데이터가 잠금해제됩니다
        </p>
      </div>

      {/* Blurred Preview Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {premiumSections.map((section) => (
          <BlurredCard
            key={section.title}
            icon={section.icon}
            title={section.title}
            description={section.description}
            itemCount={section.items}
          />
        ))}
      </div>

      {/* CTA Button */}
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={onUnlock}
          disabled={isLoading}
          className="btn-primary text-base px-10 py-3.5 shadow-lg shadow-blue-500/25 animate-pulse hover:animate-none"
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
              {price.toLocaleString()}원으로 전체 리포트 잠금해제
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

      {/* Value Checklist */}
      <div className="mt-8 pt-6 border-t border-blue-200/50 dark:border-blue-800/50">
        <h4 className="text-sm font-semibold text-foreground text-center mb-4">
          리포트에 포함된 분석 항목
        </h4>
        <div className="grid md:grid-cols-2 gap-x-6 gap-y-2">
          {valueChecklist.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 text-sm text-foreground"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Social Proof */}
      <p className="text-center text-xs text-muted-foreground mt-6">
        커피 한 잔 가격으로 개원 컨설팅 수백만원 가치의 데이터 분석을 받아보세요
      </p>
    </div>
  )
}
