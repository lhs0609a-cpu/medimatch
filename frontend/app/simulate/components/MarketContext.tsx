'use client'

import React from 'react'
import { Wallet, TrendingUp, TrendingDown, Activity, Users } from 'lucide-react'
import { SimulationResponse } from '@/lib/api/client'

interface Props {
  result: SimulationResponse
}

function won(v: number): string {
  if (v >= 100_000_000) return `${(v / 100_000_000).toFixed(1)}억`
  if (v >= 10_000) return `${Math.round(v / 10_000).toLocaleString()}만`
  return v.toLocaleString()
}

const TREND_STYLES: Record<string, { icon: React.ComponentType<{ className?: string }>; bgClass: string; textClass: string; label: string }> = {
  positive: { icon: TrendingUp,   bgClass: 'bg-emerald-50 dark:bg-emerald-950/30', textClass: 'text-emerald-700 dark:text-emerald-300', label: '성장기' },
  neutral:  { icon: Activity,     bgClass: 'bg-blue-50 dark:bg-blue-950/30',       textClass: 'text-blue-700 dark:text-blue-300',       label: '성숙기' },
  warning:  { icon: Activity,     bgClass: 'bg-amber-50 dark:bg-amber-950/30',     textClass: 'text-amber-700 dark:text-amber-300',     label: '포화기' },
  negative: { icon: TrendingDown, bgClass: 'bg-rose-50 dark:bg-rose-950/30',       textClass: 'text-rose-700 dark:text-rose-300',       label: '축소기' },
}

export default function MarketContext({ result }: Props) {
  const income = result.regional_income_info
  const lc = result.market_lifecycle
  if (!income && !lc) return null

  return (
    <div className="space-y-4">
      {/* 가구소득 */}
      {income && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-foreground">지역 가구소득 — 환자 구매력</h3>
            <span className="ml-auto text-[11px] text-muted-foreground">출처: 통계청 가계금융복지조사 2023</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div className="p-3 bg-muted/40 rounded-xl">
              <div className="text-[11px] text-muted-foreground">지역</div>
              <div className="text-sm font-semibold mt-1 truncate" title={income.region_name}>{income.region_name}</div>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
              <div className="text-[11px] text-muted-foreground">월평균 가구소득</div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{won(income.avg_monthly_household_income)}원</div>
            </div>
            <div className="p-3 bg-muted/40 rounded-xl">
              <div className="text-[11px] text-muted-foreground">중위소득 분위</div>
              <div className="text-lg font-bold">{income.income_quartile}분위<span className="text-xs text-muted-foreground"> /4</span></div>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
              <div className="text-[11px] text-muted-foreground">고소득 가구 비율</div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {Math.round(income.high_income_household_ratio * 100)}%
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
            <div className="text-xs font-semibold text-blue-800 dark:text-blue-200 mb-1">
              {result.clinic_type} 진료과 적합도: {income.clinic_fit.target}
            </div>
            <p className="text-[11px] text-foreground">{income.clinic_fit['비고']}</p>
          </div>
        </div>
      )}

      {/* 시장 라이프사이클 */}
      {lc && (() => {
        const style = TREND_STYLES[lc.trend_color] || TREND_STYLES.neutral
        const TrendIcon = style.icon
        const netGrowth = lc.annual_open_rate - lc.annual_close_rate
        const isGrowing = netGrowth > 0
        return (
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-violet-600" />
              <h3 className="font-semibold text-foreground">{result.clinic_type} 시장 동향</h3>
              <span className="ml-auto text-[11px] text-muted-foreground">출처: HIRA 의료기관 현황 2023</span>
            </div>

            <div className={`p-3 mb-3 rounded-lg ${style.bgClass}`}>
              <div className="flex items-center gap-2">
                <TrendIcon className={`w-5 h-5 ${style.textClass}`} />
                <span className={`font-bold ${style.textClass}`}>{lc.market_trend}</span>
              </div>
              <p className="text-xs text-foreground mt-2">{lc.note}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-muted/40 rounded-xl text-center">
                <div className="text-[11px] text-muted-foreground">연 신규 개원율</div>
                <div className="text-xl font-bold text-emerald-600">{(lc.annual_open_rate * 100).toFixed(1)}%</div>
              </div>
              <div className="p-3 bg-muted/40 rounded-xl text-center">
                <div className="text-[11px] text-muted-foreground">연 폐업률</div>
                <div className="text-xl font-bold text-rose-600">{(lc.annual_close_rate * 100).toFixed(1)}%</div>
              </div>
              <div className="p-3 bg-muted/40 rounded-xl text-center">
                <div className="text-[11px] text-muted-foreground">순증가율</div>
                <div className={`text-xl font-bold ${isGrowing ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {isGrowing ? '+' : ''}{(netGrowth * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-3 bg-muted/40 rounded-xl text-center">
                <div className="text-[11px] text-muted-foreground">5년 생존율</div>
                <div className="text-xl font-bold text-blue-600">{Math.round(lc.survival_rate_5yr * 100)}%</div>
              </div>
            </div>

            <p className="mt-3 text-[11px] text-muted-foreground text-center">
              평균 운영기간: <strong>{lc.avg_operating_years.toFixed(1)}년</strong>
            </p>
          </div>
        )
      })()}
    </div>
  )
}
