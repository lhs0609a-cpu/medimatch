'use client'

import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Wallet, Lock } from 'lucide-react'
import { SimulationResponse } from '@/lib/api/client'

interface CostPreviewProps {
  result: SimulationResponse
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444']

function formatMoney(v: number): string {
  if (v >= 100000000) return `${(v / 100000000).toFixed(1)}억원`
  return `${Math.round(v / 10000).toLocaleString()}만원`
}

export default function CostPreview({ result }: CostPreviewProps) {
  const c = result.estimated_monthly_cost
  const costItems = [
    { name: '임대료', value: c.rent, color: COLORS[0] },
    { name: '인건비', value: c.labor, color: COLORS[1] },
    { name: '소모품', value: c.supplies, color: COLORS[2] },
    { name: '공과금', value: c.utilities, color: COLORS[3] },
    { name: '기타', value: c.other, color: COLORS[4] },
  ].filter((item) => item.value > 0)

  const total = c.total
  const revenue = result.estimated_monthly_revenue.avg
  const costRatio = Math.round((total / revenue) * 100)
  const biggestCost = costItems.reduce((max, item) => item.value > max.value ? item : max, costItems[0])

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Wallet className="w-5 h-5 text-orange-500" />
        <h3 className="font-semibold text-foreground">비용 구조 미리보기</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Donut Chart */}
        <div className="flex flex-col items-center">
          <div className="relative" style={{ width: 200, height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={costItems}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {costItems.map((item, idx) => (
                    <Cell key={idx} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatMoney(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs text-muted-foreground">월 총 비용</span>
              <span className="text-lg font-bold text-foreground">{formatMoney(total)}</span>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3">
            {costItems.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-muted-foreground">{item.name}</span>
                <span className="font-medium text-foreground ml-auto">{Math.round(item.value / total * 100)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cost Insights */}
        <div className="space-y-4">
          <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-xl">
            <div className="text-xs text-muted-foreground mb-1">매출 대비 비용 비율</div>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{costRatio}%</div>
            <div className="mt-2 h-2 bg-orange-200/50 dark:bg-orange-800/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full"
                style={{ width: `${Math.min(costRatio, 100)}%` }}
              />
            </div>
          </div>

          <div className="p-3 bg-secondary/50 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">최대 비용 항목</div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{biggestCost.name}</span>
              <span className="text-sm font-bold" style={{ color: biggestCost.color }}>
                {formatMoney(biggestCost.value)} ({Math.round(biggestCost.value / total * 100)}%)
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {costItems.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-12 flex-shrink-0">{item.name}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${(item.value / biggestCost.value) * 100}%`, backgroundColor: item.color }}
                  />
                </div>
                <span className="text-xs font-medium text-foreground w-16 text-right">{formatMoney(item.value)}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
            <Lock className="w-3 h-3" />
            <span>항목별 상세 내역 · 초기투자비 · 인건비 구성은 프리미엄에서</span>
          </div>
        </div>
      </div>
    </div>
  )
}
