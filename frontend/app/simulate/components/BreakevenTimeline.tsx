'use client'

import React from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { Clock, TrendingUp } from 'lucide-react'
import { SimulationResponse } from '@/lib/api/client'

interface BreakevenTimelineProps {
  result: SimulationResponse
}

function formatMoney(v: number): string {
  if (Math.abs(v) >= 100000000) return `${(v / 100000000).toFixed(1)}억`
  return `${Math.round(v / 10000).toLocaleString()}만`
}

export default function BreakevenTimeline({ result }: BreakevenTimelineProps) {
  const monthlyProfit = result.profitability.monthly_profit_avg
  const breakevenMonths = result.profitability.breakeven_months
  const monthlyCost = result.estimated_monthly_cost.total
  // Rough initial investment estimate
  const initialInvestment = monthlyCost * breakevenMonths - monthlyProfit * breakevenMonths
  const estInvestment = Math.max(initialInvestment, monthlyProfit * breakevenMonths)

  // Generate 24-month cumulative data
  const data = Array.from({ length: 25 }, (_, i) => {
    const cumulative = monthlyProfit * i - estInvestment
    return {
      month: `${i}개월`,
      cumulative,
      label: i,
    }
  })

  const roi1yr = Math.round((monthlyProfit * 12 / estInvestment) * 100)
  const roi3yr = Math.round((monthlyProfit * 36 / estInvestment) * 100)

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Clock className="w-5 h-5 text-teal-500" />
        <h3 className="font-semibold text-foreground">투자금 회수 타임라인</h3>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 mb-5">
        <div className="text-center p-3 bg-teal-50 dark:bg-teal-950/30 rounded-xl">
          <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">{breakevenMonths}<span className="text-sm font-normal">개월</span></div>
          <div className="text-[11px] text-muted-foreground">손익분기점</div>
        </div>
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{roi1yr}%</div>
          <div className="text-[11px] text-muted-foreground">1년 ROI</div>
        </div>
        <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-xl">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{roi3yr}%</div>
          <div className="text-[11px] text-muted-foreground">3년 ROI</div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #e5e7eb)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10 }}
              tickFormatter={(v) => v % 6 === 0 ? `${v}개월` : ''}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              tickFormatter={(v) => formatMoney(v)}
            />
            <Tooltip
              formatter={(v: number) => [`${formatMoney(v)}원`, '누적 수익']}
              labelFormatter={(v) => `${v}개월차`}
            />
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 4" />
            <defs>
              <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="#14b8a6"
              fill="url(#profitGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-teal-500 rounded" />
          누적 수익
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-slate-400 rounded border-dashed" />
          손익분기선 (0원)
        </span>
      </div>
    </div>
  )
}
