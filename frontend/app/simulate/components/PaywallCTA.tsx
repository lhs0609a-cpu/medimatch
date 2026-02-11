'use client'

import React from 'react'
import Link from 'next/link'
import { Lock, Sparkles } from 'lucide-react'

interface PaywallCTAProps {
  onUnlock: () => void
  isLoading: boolean
  price: number
}

export default function PaywallCTA({ onUnlock, isLoading, price }: PaywallCTAProps) {
  return (
    <div className="sticky bottom-0 z-20 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-background dark:via-background/95 dark:to-transparent pt-20 pb-6 px-4 -mt-32">
      <div className="max-w-lg mx-auto">
        <div className="bg-white/95 dark:bg-card/95 backdrop-blur-md rounded-2xl border border-blue-200 dark:border-blue-800 shadow-2xl shadow-blue-500/10 p-6 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-full text-sm font-medium mb-3">
            <Lock className="w-3.5 h-3.5" />
            프리미엄 분석 잠금
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            위의 모든 차트, 데이터, AI 전략 리포트를 잠금해제하세요
          </p>

          <button
            onClick={onUnlock}
            disabled={isLoading}
            className="btn-primary text-base px-10 py-3.5 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow w-full"
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
                {price.toLocaleString()}원으로 전체 결과 잠금해제
              </>
            )}
          </button>

          <p className="text-xs text-muted-foreground mt-3">
            커피 한 잔 가격으로 수백만원 가치의 분석 ·{' '}
            <Link href="/subscribe" className="text-blue-600 hover:underline font-medium">
              구독
            </Link>
            으로 무제한
          </p>
        </div>
      </div>
    </div>
  )
}
