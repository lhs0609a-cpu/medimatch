'use client'

import React from 'react'
import {
  CheckCircle2, MinusCircle, AlertCircle, Database,
  DollarSign, Receipt, TrendingUp, TrendingDown,
} from 'lucide-react'
import { SimulationResponse } from '@/lib/api/client'

interface ScoreHeroProps {
  result: SimulationResponse
}

function getBadgeStyle(rec: string): string {
  switch (rec) {
    case 'VERY_POSITIVE':
    case 'POSITIVE':
      return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
    case 'NEUTRAL':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
    case 'NEGATIVE':
    case 'VERY_NEGATIVE':
      return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
    default:
      return 'bg-secondary text-secondary-foreground'
  }
}

function getRecommendationText(rec: string): string {
  switch (rec) {
    case 'VERY_POSITIVE': return '매우 긍정적'
    case 'POSITIVE': return '긍정적'
    case 'NEUTRAL': return '보통'
    case 'NEGATIVE': return '부정적'
    case 'VERY_NEGATIVE': return '매우 부정적'
    default: return rec
  }
}

function getRecommendationIcon(rec: string): React.ReactNode {
  switch (rec) {
    case 'VERY_POSITIVE':
    case 'POSITIVE':
      return <CheckCircle2 className="w-5 h-5" />
    case 'NEUTRAL':
      return <MinusCircle className="w-5 h-5" />
    default:
      return <AlertCircle className="w-5 h-5" />
  }
}

function formatMoney(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 100000000) return `${(value / 100000000).toFixed(1)}억`
  return `${Math.round(value / 10000).toLocaleString()}만`
}

const dataSources = [
  { name: '심평원', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { name: '행정안전부', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { name: '소상공인진흥공단', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
]

export default function ScoreHero({ result }: ScoreHeroProps) {
  const revenue = result.estimated_monthly_revenue.avg
  const cost = result.estimated_monthly_cost.total
  const profit = result.profitability.monthly_profit_avg
  const isProfitable = profit > 0
  const revenueMin = result.estimated_monthly_revenue.min
  const revenueMax = result.estimated_monthly_revenue.max

  return (
    <div className="card p-6 md:p-8">
      <div className="flex flex-col items-start gap-3">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${getBadgeStyle(result.recommendation)}`}>
          {getRecommendationIcon(result.recommendation)}
          개원 추천: {getRecommendationText(result.recommendation)}
        </span>
        <p className="text-foreground leading-relaxed">
          {result.recommendation_reason}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-muted-foreground mr-1">
            <Database className="w-3 h-3" />
            <span>데이터 출처:</span>
          </div>
          {dataSources.map((src) => (
            <span key={src.name} className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${src.color}`}>
              {src.name}
            </span>
          ))}
        </div>
      </div>

      {/* Financial Headline — 핵심 3대 지표 */}
      <div className="mt-6 pt-6 border-t border-border">
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          {/* Revenue */}
          <div className="text-center p-3 md:p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
            <DollarSign className="w-5 h-5 text-blue-500 mx-auto mb-1.5" />
            <div className="text-[11px] text-muted-foreground mb-1">예상 월 매출</div>
            <div className="text-base md:text-xl font-bold text-blue-600 dark:text-blue-400">
              ~{formatMoney(revenue)}원
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {formatMoney(revenueMin)}~{formatMoney(revenueMax)}
            </div>
          </div>

          {/* Cost */}
          <div className="text-center p-3 md:p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
            <Receipt className="w-5 h-5 text-amber-500 mx-auto mb-1.5" />
            <div className="text-[11px] text-muted-foreground mb-1">예상 월 비용</div>
            <div className="text-base md:text-xl font-bold text-amber-600 dark:text-amber-400">
              ~{formatMoney(cost)}원
            </div>
          </div>

          {/* Profit */}
          <div className={`text-center p-3 md:p-4 rounded-xl ${
            isProfitable ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'
          }`}>
            {isProfitable
              ? <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-1.5" />
              : <TrendingDown className="w-5 h-5 text-red-500 mx-auto mb-1.5" />
            }
            <div className="text-[11px] text-muted-foreground mb-1">예상 월 순이익</div>
            <div className={`text-base md:text-xl font-bold ${
              isProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {isProfitable ? '+' : ''}{formatMoney(profit)}원
            </div>
          </div>
        </div>
      </div>

      {/* 동일과 평균 매출 비교 (anchor) */}
      {result.competitor_revenue_stats && result.competitor_revenue_stats.sample_size > 0 && (
        <div className="mt-5 p-3 md:p-4 bg-muted/40 dark:bg-muted/20 rounded-xl border border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-foreground">
              주변 동일과 의원 평균 매출 (샘플 {result.competitor_revenue_stats.sample_size}개)
            </div>
            <div className="text-[10px] text-muted-foreground">HIRA 표준×입지 보정</div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[10px] text-muted-foreground">최소</div>
              <div className="text-sm font-bold text-foreground">
                {formatMoney(result.competitor_revenue_stats.min)}원
              </div>
            </div>
            <div className="border-x border-border">
              <div className="text-[10px] text-muted-foreground">평균</div>
              <div className="text-base font-bold text-blue-600 dark:text-blue-400">
                {formatMoney(result.competitor_revenue_stats.avg)}원
              </div>
              <div className="text-[10px] text-muted-foreground">중앙값 {formatMoney(result.competitor_revenue_stats.median)}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground">최대</div>
              <div className="text-sm font-bold text-foreground">
                {formatMoney(result.competitor_revenue_stats.max)}원
              </div>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
            본 시뮬레이션 예상 매출 <b className="text-foreground">{formatMoney(revenue)}원</b>은
            동일과 평균의 <b className="text-foreground">{Math.round((revenue / Math.max(result.competitor_revenue_stats.avg, 1)) * 100)}%</b> 수준 ·
            신규 개원 1~2년차 도달 가능 매출 anchor: 평균의 55%
            (<b>{formatMoney(result.competitor_revenue_stats.new_clinic_floor)}원</b>) 이상
          </div>
        </div>
      )}

      {/* Revenue Range Visualization */}
      {revenueMin > 0 && revenueMax > 0 && (
        <div className="mt-5">
          <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5">
            <span>보수적</span>
            <span>예상 매출 범위</span>
            <span>낙관적</span>
          </div>
          <div className="relative h-8 bg-gradient-to-r from-blue-100 via-blue-200 to-blue-100 dark:from-blue-950 dark:via-blue-800 dark:to-blue-950 rounded-full overflow-hidden">
            {/* Average marker */}
            <div
              className="absolute top-0 h-full w-0.5 bg-blue-600 dark:bg-blue-400"
              style={{
                left: `${((revenue - revenueMin) / (revenueMax - revenueMin)) * 100}%`,
              }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 bg-blue-600 dark:bg-blue-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
              style={{
                left: `${Math.min(85, Math.max(15, ((revenue - revenueMin) / (revenueMax - revenueMin)) * 100))}%`,
              }}
            >
              평균 {formatMoney(revenue)}
            </div>
          </div>
          <div className="flex justify-between text-[11px] font-medium text-foreground mt-1">
            <span>{formatMoney(revenueMin)}원</span>
            <span>{formatMoney(revenueMax)}원</span>
          </div>
        </div>
      )}
    </div>
  )
}
