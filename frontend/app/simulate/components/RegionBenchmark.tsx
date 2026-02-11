'use client'

import React from 'react'
import { Trophy, TrendingUp, Medal } from 'lucide-react'
import { SimulationResponse } from '@/lib/api/client'

interface RegionBenchmarkProps {
  result: SimulationResponse
}

function formatMoney(value: number): string {
  if (value >= 100000000) return `${(value / 100000000).toFixed(1)}억`
  return `${Math.round(value / 10000).toLocaleString()}만`
}

export default function RegionBenchmark({ result }: RegionBenchmarkProps) {
  const rs = result.region_stats
  if (!rs) return null

  const percentile = rs.rank_percentile ?? 50
  const vsNational = rs.vs_national_percent
  const isAboveAvg = vsNational >= 0
  const rank = rs.region_rank
  const total = rs.total_regions
  const nationalAvg = rs.national_avg_revenue
  const myAvgRevenue = result.estimated_monthly_revenue.avg

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Trophy className="w-5 h-5 text-amber-500" />
        <h3 className="font-semibold text-foreground">전국 벤치마크</h3>
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-4">
        {/* Percentile */}
        <div className="text-center p-3 md:p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl">
          <div className="text-xl md:text-3xl font-bold text-amber-600 dark:text-amber-400">
            상위 {percentile}%
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">전국 매출 기준</div>
          <div className="mt-3 h-2 bg-amber-200/50 dark:bg-amber-800/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-1000"
              style={{ width: `${100 - percentile}%` }}
            />
          </div>
        </div>

        {/* vs National Average */}
        <div className="text-center p-3 md:p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl">
          <div className={`text-xl md:text-3xl font-bold ${isAboveAvg ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {isAboveAvg ? '+' : ''}{vsNational}%
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">전국 평균 대비</div>
          <div className="mt-2 flex items-center justify-center gap-1">
            <TrendingUp className={`w-3 h-3 ${isAboveAvg ? 'text-green-500' : 'text-red-500 rotate-180'}`} />
            <span className="text-[10px] text-muted-foreground">
              전국 {formatMoney(nationalAvg)}원
            </span>
          </div>
        </div>

        {/* Region Rank */}
        <div className="text-center p-3 md:p-4 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 rounded-xl">
          {rank ? (
            <>
              <div className="text-xl md:text-3xl font-bold text-violet-600 dark:text-violet-400">
                {rank}<span className="text-base font-normal">위</span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                {total}개 지역 중
              </div>
              <div className="mt-2 flex items-center justify-center gap-1">
                <Medal className="w-3 h-3 text-violet-400" />
                <span className="text-[10px] text-muted-foreground">동일 진료과</span>
              </div>
            </>
          ) : (
            <>
              <div className="text-xl md:text-3xl font-bold text-violet-600 dark:text-violet-400">
                ~{formatMoney(myAvgRevenue)}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">예상 월매출</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
