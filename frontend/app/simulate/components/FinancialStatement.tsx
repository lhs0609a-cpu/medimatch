'use client'

import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts'
import { Calculator } from 'lucide-react'
import { SimulationResponse } from '@/lib/api/client'

function formatMoney(v: number): string {
  if (Math.abs(v) >= 100000000) return `${(v / 100000000).toFixed(1)}억`
  return `${Math.round(v / 10000).toLocaleString()}만`
}

function cellColor(v: number): string {
  if (v > 0) return 'text-green-600 dark:text-green-400'
  if (v < 0) return 'text-red-600 dark:text-red-400'
  return 'text-foreground'
}

export default function FinancialStatement({ result }: { result: SimulationResponse }) {
  const rev = result.estimated_monthly_revenue
  const cost = result.estimated_monthly_cost
  const growth = result.growth_projection

  const g1 = growth?.growth_rate_year1 ?? 0
  const g2 = growth?.growth_rate_year2 ?? 8
  const g3 = growth?.growth_rate_year3 ?? 12

  const annualRevAvg = rev.avg * 12
  const insuranceRatio = 0.7
  const marketingRatio = 0.05

  const years = [
    { label: '1차년도', growthFactor: 1 + g1 / 100 },
    { label: '2차년도', growthFactor: (1 + g1 / 100) * (1 + g2 / 100) },
    { label: '3차년도', growthFactor: (1 + g1 / 100) * (1 + g2 / 100) * (1 + g3 / 100) },
  ]

  const statements = years.map(({ label, growthFactor }) => {
    const totalRev = Math.round(annualRevAvg * growthFactor)
    const insRev = Math.round(totalRev * insuranceRatio)
    const nonInsRev = totalRev - insRev
    const rent = cost.rent * 12
    const labor = Math.round(cost.labor * 12 * growthFactor)
    const supplies = Math.round(cost.supplies * 12 * growthFactor)
    const utilities = cost.utilities * 12
    const marketing = Math.round(totalRev * marketingRatio)
    const other = cost.other * 12
    const totalCost = rent + labor + supplies + utilities + marketing + other
    const profit = totalRev - totalCost
    const margin = totalRev > 0 ? ((profit / totalRev) * 100).toFixed(1) : '0.0'

    return {
      label,
      insRev,
      nonInsRev,
      totalRev,
      rent,
      labor,
      supplies,
      utilities,
      marketing,
      other,
      totalCost,
      profit,
      margin: parseFloat(margin),
    }
  })

  const chartData = statements.map((s) => ({
    name: s.label,
    매출: s.totalRev,
    비용: s.totalCost,
    영업이익: s.profit,
  }))

  const rows: { label: string; key: string; isBold?: boolean; isRevenue?: boolean }[] = [
    { label: '매출 (보험)', key: 'insRev', isRevenue: true },
    { label: '매출 (비보험)', key: 'nonInsRev', isRevenue: true },
    { label: '매출 합계', key: 'totalRev', isBold: true, isRevenue: true },
    { label: '임대료', key: 'rent' },
    { label: '인건비', key: 'labor' },
    { label: '재료비', key: 'supplies' },
    { label: '공과금', key: 'utilities' },
    { label: '마케팅비', key: 'marketing' },
    { label: '기타', key: 'other' },
    { label: '비용 합계', key: 'totalCost', isBold: true },
    { label: '영업이익', key: 'profit', isBold: true },
    { label: '영업이익률 (%)', key: 'margin', isBold: true },
  ]

  // Find the growth insight
  const yr3Profit = statements[2].profit
  const yr1Profit = statements[0].profit
  const profitGrowth = yr1Profit > 0 ? Math.round(((yr3Profit - yr1Profit) / yr1Profit) * 100) : 0

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Calculator className="w-5 h-5 text-emerald-500" />
        <h3 className="font-semibold text-foreground">3개년 추정 손익계산서</h3>
        <span className="ml-auto text-[11px] text-muted-foreground">(단위: 만원)</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mb-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-border">
              <th className="text-left py-2 text-muted-foreground font-medium text-xs">항목</th>
              {statements.map((s) => (
                <th key={s.label} className="text-right py-2 text-muted-foreground font-medium text-xs">{s.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isProfit = row.key === 'profit'
              const isMargin = row.key === 'margin'
              return (
                <tr
                  key={row.key}
                  className={`border-b border-border/50 ${row.isBold ? 'bg-muted/30' : ''} ${isProfit ? 'border-t-2 border-border' : ''}`}
                >
                  <td className={`py-1.5 ${row.isBold ? 'font-semibold text-foreground' : 'text-muted-foreground'} text-xs`}>
                    {row.label}
                  </td>
                  {statements.map((s) => {
                    const val = s[row.key as keyof typeof s] as number
                    const displayVal = isMargin ? `${val}%` : formatMoney(val * 10000)
                    const color = isProfit || isMargin ? cellColor(val) : row.isRevenue ? 'text-foreground' : 'text-muted-foreground'
                    return (
                      <td
                        key={s.label}
                        className={`text-right py-1.5 text-xs ${row.isBold ? 'font-semibold' : ''} ${color}`}
                      >
                        {displayVal}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 3-year Profit Trend Chart */}
      <h4 className="text-sm font-medium text-muted-foreground mb-3">3개년 매출/비용/이익 추이</h4>
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #e5e7eb)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatMoney(v)} />
            <Tooltip formatter={(v: number) => [`${formatMoney(v)}원`, '']} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="매출" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="비용" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="영업이익" radius={[4, 4, 0, 0]}>
              {chartData.map((d, idx) => (
                <Cell key={idx} fill={d['영업이익'] >= 0 ? '#22c55e' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg text-xs text-muted-foreground">
        <span className="font-semibold text-emerald-700 dark:text-emerald-300">수익 성장 포인트:</span>{' '}
        {profitGrowth > 0
          ? `3년간 영업이익이 약 ${profitGrowth}% 성장할 것으로 전망됩니다. 비보험 진료 비중 확대와 인건비 효율화가 핵심입니다.`
          : '초기 투자비용 회수 후 안정적인 수익 구조 구축이 중요합니다. 환자 수 확보에 집중하세요.'}
      </div>
    </div>
  )
}
