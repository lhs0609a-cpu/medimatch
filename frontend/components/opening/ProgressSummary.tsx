'use client'

import { phases, getTotalCost } from '@/app/checklist/data/phases'
import { Wallet } from 'lucide-react'

interface ProgressSummaryProps {
  completedCount: number
  totalTasks: number
  progress: number
  budgetTotal: number | null
  budgetSpent: number
  getPhaseProgress: (phaseId: number) => { completed: number; total: number; percent: number }
}

export default function ProgressSummary({
  completedCount, totalTasks, progress, budgetTotal, budgetSpent, getPhaseProgress,
}: ProgressSummaryProps) {
  const estimatedTotal = getTotalCost(phases)
  const displayBudget = budgetTotal || estimatedTotal

  return (
    <div className="space-y-4">
      {/* 원형 진행률 */}
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="42"
              fill="none" stroke="currentColor"
              strokeWidth="8" className="text-secondary"
            />
            <circle
              cx="50" cy="50" r="42"
              fill="none" stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={`${progress * 2.64} 264`}
              strokeLinecap="round"
              className="text-primary transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold">{progress}%</span>
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold">전체 진행률</div>
          <div className="text-xs text-muted-foreground">
            {completedCount}/{totalTasks} 완료
          </div>
        </div>
      </div>

      {/* 예산 현황 */}
      <div className="bg-secondary/30 rounded-xl p-3 space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Wallet className="w-4 h-4 text-primary" />
          예산 현황
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">예상 총 비용</span>
          <span className="font-medium">{estimatedTotal.toLocaleString()}만원</span>
        </div>
        {budgetTotal && (
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">설정 예산</span>
            <span className="font-medium">{budgetTotal.toLocaleString()}만원</span>
          </div>
        )}
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">실제 지출</span>
          <span className="font-semibold text-primary">{budgetSpent.toLocaleString()}만원</span>
        </div>
        {displayBudget > 0 && (
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                budgetSpent > displayBudget ? 'bg-red-500' : 'bg-primary'
              }`}
              style={{ width: `${Math.min((budgetSpent / displayBudget) * 100, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* 단계별 진행 상황 요약 */}
      <div className="space-y-1.5">
        <div className="text-sm font-semibold mb-2">단계별 현황</div>
        {phases.map((phase) => {
          const { percent } = getPhaseProgress(phase.id)
          return (
            <div key={phase.id} className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-20 truncate">{phase.title}</span>
              <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ backgroundColor: phase.color, width: `${percent}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground w-7 text-right">{percent}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
