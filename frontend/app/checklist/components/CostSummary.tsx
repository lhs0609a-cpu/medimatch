'use client'

import { Coins, TrendingUp } from 'lucide-react'
import { Phase, getPhaseCost, getTotalCost } from '../data/phases'

interface CostSummaryProps {
  phases: Phase[]
}

export default function CostSummary({ phases }: CostSummaryProps) {
  const totalCost = getTotalCost(phases)

  const formatCost = (cost: number) => {
    if (cost >= 10000) return `${(cost / 10000).toFixed(1)}억`
    return `${cost.toLocaleString()}만`
  }

  const topCostPhases = [...phases]
    .sort((a, b) => getPhaseCost(b) - getPhaseCost(a))
    .filter((p) => getPhaseCost(p) > 0)

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Coins className="w-5 h-5 text-amber-500" />
          예상 총 비용
        </h3>
        <span className="text-xl font-bold text-foreground">{formatCost(totalCost)}원</span>
      </div>

      <div className="space-y-3">
        {topCostPhases.map((phase) => {
          const cost = getPhaseCost(phase)
          const ratio = totalCost > 0 ? (cost / totalCost) * 100 : 0

          return (
            <div key={phase.id}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">{phase.title}</span>
                <span className="font-medium text-foreground">{formatCost(cost)}원</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${ratio}%`, backgroundColor: phase.color }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-4 border-t">
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <TrendingUp className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            비용은 2024년 기준 평균치이며, 지역·진료과·규모에 따라 ±30% 차이가 발생할 수 있습니다.
            정확한 견적은 인테리어 견적 시뮬레이터를 활용하세요.
          </p>
        </div>
      </div>
    </div>
  )
}
