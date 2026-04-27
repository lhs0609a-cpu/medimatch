'use client'

import React from 'react'
import { TrendingUp, TrendingDown, Database } from 'lucide-react'
import { SimulationResponse } from '@/lib/api/client'

interface Props {
  result: SimulationResponse
}

function won(value: number): string {
  if (value >= 100000000) return `${(value / 100000000).toFixed(1)}억`
  return `${Math.round(value / 10000).toLocaleString()}만`
}

export default function RegionBenchmark({ result }: Props) {
  const rs = result.region_stats
  if (!rs || !rs.national_avg_revenue) return null

  const myAvg = result.estimated_monthly_revenue.avg
  const nationalAvg = rs.national_avg_revenue
  const vsNational = rs.vs_national_percent
  const isAbove = vsNational >= 0

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        {isAbove ? <TrendingUp className="w-5 h-5 text-emerald-600" /> : <TrendingDown className="w-5 h-5 text-rose-600" />}
        <h3 className="font-semibold text-foreground">전국 진료과 평균 대비</h3>
        <span className="ml-auto text-[11px] text-muted-foreground">출처: HIRA 진료비 통계</span>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-center">
          <div className="text-[11px] text-muted-foreground">예상 월 매출</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{won(myAvg)}원</div>
        </div>

        <div className="p-4 bg-muted/40 rounded-xl text-center">
          <div className="text-[11px] text-muted-foreground">전국 {result.clinic_type} 평균</div>
          <div className="text-2xl font-bold text-foreground">{won(nationalAvg)}원</div>
        </div>

        <div className={`p-4 rounded-xl text-center ${isAbove ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-rose-50 dark:bg-rose-950/30'}`}>
          <div className="text-[11px] text-muted-foreground">차이</div>
          <div className={`text-2xl font-bold ${isAbove ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {isAbove ? '+' : ''}{vsNational.toFixed(1)}%
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {isAbove ? '평균 이상' : '평균 이하'}
          </div>
        </div>
      </div>

      <p className="mt-3 text-[10px] text-muted-foreground flex items-center gap-1">
        <Database className="w-3 h-3" />
        건강보험심사평가원 2023 진료과별 평균 매출 기준
      </p>
    </div>
  )
}
