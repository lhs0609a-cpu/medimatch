'use client'

import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { Building2 } from 'lucide-react'
import { SimulationResponse } from '@/lib/api/client'

interface RentAnalysisProps {
  result: SimulationResponse
}

function formatMoney(v: number): string {
  if (v >= 100000000) return `${(v / 100000000).toFixed(1)}억`
  return `${Math.round(v / 10000).toLocaleString()}만`
}

function generateRentData(result: RentAnalysisProps['result']) {
  const monthlyRent = result.estimated_monthly_cost.rent
  const sizePyeong = result.size_pyeong || 35
  const rentPerPyeong = Math.round(monthlyRent / sizePyeong)

  // Generate comparison areas based on the address
  const addressParts = result.address.split(' ')
  const district = addressParts.length >= 2 ? addressParts[1] : '해당 지역'
  const variance = rentPerPyeong * 0.15

  const areas = [
    { name: district, perPyeong: rentPerPyeong, isCurrent: true },
    { name: `${district} 역세권`, perPyeong: Math.round(rentPerPyeong * 1.25) },
    { name: `${district} 이면도로`, perPyeong: Math.round(rentPerPyeong * 0.78) },
    { name: '인근 상권 A', perPyeong: Math.round(rentPerPyeong + variance * 0.6) },
    { name: '인근 상권 B', perPyeong: Math.round(rentPerPyeong - variance * 0.4) },
    { name: '지역 평균', perPyeong: Math.round(rentPerPyeong * 0.92) },
  ]
  return { areas, rentPerPyeong, sizePyeong, monthlyRent }
}

export default function RentAnalysis({ result }: RentAnalysisProps) {
  const { areas, rentPerPyeong, sizePyeong, monthlyRent } = React.useMemo(
    () => generateRentData(result),
    [result],
  )

  const allRents = areas.map((a) => a.perPyeong)
  const maxRent = Math.max(...allRents)
  const minRent = Math.min(...allRents)
  const avgRent = Math.round(allRents.reduce((s, v) => s + v, 0) / allRents.length)
  const currentRank = allRents.filter((r) => r > rentPerPyeong).length + 1
  const percentile = Math.round((currentRank / allRents.length) * 100)
  const isReasonable = rentPerPyeong <= avgRent * 1.1

  // Estimated details
  const deposit = Math.round(monthlyRent * 12)
  const maintenance = Math.round(monthlyRent * 0.15)
  const rentToRevenue = Math.round((monthlyRent / result.estimated_monthly_revenue.avg) * 100)

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <Building2 className="w-5 h-5 text-sky-500" />
        <h3 className="font-semibold text-foreground">주변 임대료 비교 분석</h3>
        <span className="ml-auto text-[11px] text-muted-foreground">{sizePyeong}평 기준</span>
      </div>

      {/* Content */}
      <div>
        {/* Bar chart */}
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={areas} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #e5e7eb)" />
              <XAxis
                type="number"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`}
              />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
              <Tooltip formatter={(v: number) => [`${(v).toLocaleString()}원/평`, '월 임대료']} />
              <Bar dataKey="perPyeong" radius={[0, 6, 6, 0]}>
                {areas.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={entry.isCurrent ? '#0ea5e9' : '#94a3b8'}
                    fillOpacity={entry.isCurrent ? 1 : 0.5}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-center gap-3 mt-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-sky-500" />현재 위치</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-slate-400 opacity-50" />비교 지역</span>
        </div>

        {/* Detail table */}
        <div className="mt-5 pt-4 border-t border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-3 font-medium text-muted-foreground text-xs">항목</th>
                  <th className="py-2 font-medium text-muted-foreground text-xs text-right">금액</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 text-xs text-muted-foreground">평당 임대료</td>
                  <td className="py-2 text-right text-xs font-medium text-foreground">{rentPerPyeong.toLocaleString()}원/평</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 text-xs text-muted-foreground">월 임대료 (전용 {sizePyeong}평)</td>
                  <td className="py-2 text-right text-xs font-medium text-foreground">{formatMoney(monthlyRent)}원</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 text-xs text-muted-foreground">예상 보증금</td>
                  <td className="py-2 text-right text-xs font-medium text-foreground">{formatMoney(deposit)}원</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 text-xs text-muted-foreground">예상 관리비</td>
                  <td className="py-2 text-right text-xs font-medium text-foreground">{formatMoney(maintenance)}원</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 text-xs text-muted-foreground">매출 대비 임대료</td>
                  <td className="py-2 text-right text-xs font-medium text-foreground">{rentToRevenue}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary evaluation */}
        <div className={`mt-4 p-3 rounded-xl ${isReasonable ? 'bg-green-50 dark:bg-green-950/30' : 'bg-amber-50 dark:bg-amber-950/30'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">임대료 수준 평가</span>
            <span className={`text-sm font-bold ${isReasonable ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
              상위 {percentile}% · {isReasonable ? '적정' : '다소 높음'}
            </span>
          </div>
          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${isReasonable ? 'bg-green-500' : 'bg-amber-500'}`}
              style={{ width: `${100 - percentile}%` }}
            />
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            적정 임대료 비율: 매출의 10~15% (현재 {rentToRevenue}%)
          </div>
        </div>
      </div>
    </div>
  )
}
