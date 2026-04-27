'use client'

import React from 'react'
import { BarChart3 } from 'lucide-react'
import { SimulationResponse } from '@/lib/api/client'

interface OverallRadarProps {
  result: SimulationResponse
}

function calcCompetitionScore(sameDeptCount: number): number {
  if (sameDeptCount === 0) return 95
  if (sameDeptCount <= 2) return 82
  if (sameDeptCount <= 5) return 65
  if (sameDeptCount <= 8) return 45
  if (sameDeptCount <= 12) return 28
  return 15
}

function calcPopulationScore(pop1km: number): number {
  if (pop1km >= 80000) return 95
  if (pop1km >= 50000) return 82
  if (pop1km >= 30000) return 68
  if (pop1km >= 15000) return 52
  if (pop1km >= 8000) return 38
  return 22
}

function getScoreLabel(score: number): { text: string; color: string } {
  if (score >= 80) return { text: '우수', color: 'text-green-600 dark:text-green-400' }
  if (score >= 60) return { text: '양호', color: 'text-blue-600 dark:text-blue-400' }
  if (score >= 40) return { text: '보통', color: 'text-amber-600 dark:text-amber-400' }
  return { text: '주의', color: 'text-red-600 dark:text-red-400' }
}

export default function OverallRadar({ result }: OverallRadarProps) {
  const compScore = calcCompetitionScore(result.competition.same_dept_count)
  const popScore = calcPopulationScore(result.demographics.population_1km)
  const avgScore = Math.round((compScore + popScore) / 2)
  const overallLabel = getScoreLabel(avgScore)

  const axes = [
    {
      label: '경쟁력',
      score: compScore,
      color: 'bg-blue-500',
      desc: result.competition.same_dept_count === 0
        ? '블루오션'
        : `동일과 ${result.competition.same_dept_count}개`,
    },
    {
      label: '인구 밀도',
      score: popScore,
      color: 'bg-blue-500',
      desc: `1km ${(result.demographics.population_1km / 10000).toFixed(1)}만명`,
    },
  ]

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-5">
        <BarChart3 className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-foreground">입지 점수</h3>
        <span className={`ml-auto text-sm font-semibold px-2.5 py-1 rounded-full ${overallLabel.color} bg-secondary`}>
          {overallLabel.text}
        </span>
      </div>

      <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200/50 dark:border-blue-800/50 mb-4">
        <div className="text-[11px] text-muted-foreground mb-1">경쟁력 + 인구밀도 종합</div>
        <div className="text-4xl font-bold text-blue-700 dark:text-blue-400">
          {avgScore}<span className="text-lg font-normal text-muted-foreground">/100</span>
        </div>
      </div>

      <div className="space-y-3">
        {axes.map((item) => {
          const label = getScoreLabel(item.score)
          return (
            <div key={item.label}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">{item.desc}</span>
                  <span className={`font-bold ${label.color}`}>{item.score}</span>
                </span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.color} rounded-full transition-all duration-1000`}
                  style={{ width: `${item.score}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
