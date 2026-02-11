'use client'

import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { CalendarDays } from 'lucide-react'
import { SimulationResponse } from '@/lib/api/client'

interface MonthlyForecastProps {
  result: SimulationResponse
}

// Korean medical seasonal patterns
const SEASONAL_FACTORS: Record<number, { factor: number; label: string }> = {
  1: { factor: 0.90, label: '1월' },
  2: { factor: 0.88, label: '2월' },
  3: { factor: 1.08, label: '3월' },
  4: { factor: 1.05, label: '4월' },
  5: { factor: 1.02, label: '5월' },
  6: { factor: 0.88, label: '6월' },
  7: { factor: 0.82, label: '7월' },
  8: { factor: 0.80, label: '8월' },
  9: { factor: 1.05, label: '9월' },
  10: { factor: 1.12, label: '10월' },
  11: { factor: 1.15, label: '11월' },
  12: { factor: 0.95, label: '12월' },
}

function formatMoney(v: number): string {
  if (v >= 100000000) return `${(v / 100000000).toFixed(1)}억`
  return `${Math.round(v / 10000).toLocaleString()}만`
}

function getBarColor(factor: number): string {
  if (factor >= 1.1) return '#22c55e'
  if (factor >= 1.0) return '#3b82f6'
  if (factor >= 0.9) return '#f59e0b'
  return '#ef4444'
}

export default function MonthlyForecast({ result }: MonthlyForecastProps) {
  const baseRevenue = result.estimated_monthly_revenue.avg

  const data = Object.entries(SEASONAL_FACTORS).map(([month, { factor, label }]) => {
    const revenue = Math.round(baseRevenue * factor)
    return {
      month: label,
      revenue,
      factor,
      profit: revenue - result.estimated_monthly_cost.total,
    }
  })

  const bestMonth = data.reduce((best, d) => d.revenue > best.revenue ? d : best, data[0])
  const worstMonth = data.reduce((worst, d) => d.revenue < worst.revenue ? d : worst, data[0])
  const yearlyTotal = data.reduce((sum, d) => sum + d.revenue, 0)

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-5">
        <CalendarDays className="w-5 h-5 text-blue-500" />
        <h3 className="font-semibold text-foreground">12개월 매출 예측</h3>
        <span className="ml-auto text-[11px] text-muted-foreground">계절 변동 반영</span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 mb-5">
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
          <div className="text-lg md:text-xl font-bold text-blue-600 dark:text-blue-400">{formatMoney(yearlyTotal)}원</div>
          <div className="text-[11px] text-muted-foreground">연간 예상 매출</div>
        </div>
        <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-xl">
          <div className="text-lg md:text-xl font-bold text-green-600 dark:text-green-400">{bestMonth.month}</div>
          <div className="text-[11px] text-muted-foreground">최고 매출월 ({formatMoney(bestMonth.revenue)})</div>
        </div>
        <div className="text-center p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
          <div className="text-lg md:text-xl font-bold text-amber-600 dark:text-amber-400">{worstMonth.month}</div>
          <div className="text-[11px] text-muted-foreground">최저 매출월 ({formatMoney(worstMonth.revenue)})</div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #e5e7eb)" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatMoney(v)} />
            <Tooltip
              formatter={(v: number, name: string) => [
                `${formatMoney(v)}원`,
                name === 'revenue' ? '매출' : '이익',
              ]}
            />
            <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
              {data.map((d, idx) => (
                <Cell key={idx} fill={getBarColor(d.factor)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-500" />성수기</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />보통</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />비수기</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500" />극비수기</span>
      </div>
    </div>
  )
}
