'use client'

import React from 'react'
import Link from 'next/link'
import { Lock, Sparkles, CheckCircle2, BarChart3, Users, Brain, TrendingUp, Shield, MapPin, PieChart, Zap } from 'lucide-react'

interface PaywallCTAProps {
  onUnlock: () => void
  isLoading: boolean
  price: number
}

const LOCKED_ITEMS = [
  { icon: BarChart3, label: '매출 상세 분석', count: '12개 지표' },
  { icon: PieChart, label: '비용 구조 분석', count: '15개 항목' },
  { icon: TrendingUp, label: '수익성 · ROI', count: '8개 지표' },
  { icon: Users, label: '인구 · 유동인구', count: '18개 데이터' },
  { icon: MapPin, label: '입지 · 교통 분석', count: '12개 항목' },
  { icon: Shield, label: '리스크 분석', count: '6개 요인' },
  { icon: Brain, label: 'AI 전략 리포트', count: 'SWOT + 전략' },
  { icon: Zap, label: '3년 성장 전망', count: '투자수익 예측' },
]

export default function PaywallCTA({ onUnlock, isLoading, price }: PaywallCTAProps) {
  return (
    <div className="sticky bottom-0 z-20 bg-gradient-to-t from-white via-white to-white/0 dark:from-background dark:via-background dark:to-background/0 pt-32 pb-6 px-4 -mt-48">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/98 dark:bg-card/98 backdrop-blur-xl rounded-2xl border border-blue-200 dark:border-blue-800 shadow-2xl shadow-blue-500/20 p-6">
          {/* Locked items grid */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {LOCKED_ITEMS.map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-blue-50/80 dark:bg-blue-950/30">
                <item.icon className="w-4 h-4 text-blue-500" />
                <span className="text-[10px] text-muted-foreground text-center leading-tight">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-3 py-1.5 rounded-full text-sm font-medium mb-2">
              <Lock className="w-3.5 h-3.5" />
              19개 섹션 · 80+ 데이터 포인트 잠금
            </div>
            <p className="text-sm text-muted-foreground">
              위의 블러 처리된 차트, 그래프, AI 전략 리포트를 <span className="font-semibold text-foreground">즉시 확인</span>하세요
            </p>
          </div>

          <button
            onClick={onUnlock}
            disabled={isLoading}
            className="btn-primary text-base px-10 py-4 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all w-full animate-pulse hover:animate-none"
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
                {price.toLocaleString()}원으로 전체 잠금해제
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" />즉시 열람</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" />PDF 다운로드</span>
            <span>·</span>
            <Link href="/subscribe" className="text-blue-600 hover:underline font-medium">
              구독으로 무제한
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
