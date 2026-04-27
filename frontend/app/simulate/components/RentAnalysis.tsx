'use client'

import React from 'react'
import { Building2 } from 'lucide-react'
import { SimulationResponse } from '@/lib/api/client'

interface RentAnalysisProps {
  result: SimulationResponse
}

function formatMoney(v: number): string {
  if (v >= 100000000) return `${(v / 100000000).toFixed(1)}억`
  return `${Math.round(v / 10000).toLocaleString()}만`
}

export default function RentAnalysis({ result }: RentAnalysisProps) {
  const monthlyRent = result.estimated_monthly_cost.rent
  const sizePyeong = result.size_pyeong || 35
  const rentPerPyeong = Math.round(monthlyRent / sizePyeong)
  const rentToRevenue = Math.round((monthlyRent / result.estimated_monthly_revenue.avg) * 100)
  const isReasonable = rentToRevenue <= 15

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Building2 className="w-5 h-5 text-sky-500" />
        <h3 className="font-semibold text-foreground">임대료 분석</h3>
        <span className="ml-auto text-[11px] text-muted-foreground">{sizePyeong}평 기준</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-4 bg-sky-50 dark:bg-sky-950/30 rounded-xl">
          <div className="text-[11px] text-muted-foreground mb-1">월 임대료</div>
          <div className="text-2xl font-bold text-foreground">
            {formatMoney(monthlyRent)}<span className="text-sm font-normal text-muted-foreground">원</span>
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {rentPerPyeong.toLocaleString()}원/평
          </div>
        </div>

        <div className={`p-4 rounded-xl ${isReasonable ? 'bg-green-50 dark:bg-green-950/30' : 'bg-amber-50 dark:bg-amber-950/30'}`}>
          <div className="text-[11px] text-muted-foreground mb-1">매출 대비 임대료</div>
          <div className={`text-2xl font-bold ${isReasonable ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
            {rentToRevenue}<span className="text-sm font-normal">%</span>
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {isReasonable ? '적정 (10~15% 권장)' : '다소 높음'}
          </div>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        ※ 월 임대료는 진료과·평수 기반 추정값입니다. 실제 계약 전 부동산 시세를 확인하세요.
      </p>
    </div>
  )
}
