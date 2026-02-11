'use client'

import React from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'
import { BarChart3, Lock } from 'lucide-react'
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

function calcFloatingScore(daily: number): number {
  if (daily >= 120000) return 95
  if (daily >= 80000) return 82
  if (daily >= 50000) return 68
  if (daily >= 30000) return 52
  if (daily >= 15000) return 38
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
  const floatScore = calcFloatingScore(result.demographics.floating_population_daily)

  const data = [
    { subject: '경쟁력', value: compScore, fullMark: 100 },
    { subject: '인구', value: popScore, fullMark: 100 },
    { subject: '유동인구', value: floatScore, fullMark: 100 },
    { subject: '수익성', value: 0, fullMark: 100 },
    { subject: '성장성', value: 0, fullMark: 100 },
    { subject: '안전성', value: 0, fullMark: 100 },
  ]

  const avgScore = Math.round((compScore + popScore + floatScore) / 3)
  const overallLabel = getScoreLabel(avgScore)

  const freeAxes = [
    {
      label: '경쟁력',
      score: compScore,
      color: 'bg-blue-500',
      desc: result.competition.same_dept_count === 0
        ? '블루오션!'
        : `동일과 ${result.competition.same_dept_count}개`,
    },
    {
      label: '인구 밀도',
      score: popScore,
      color: 'bg-violet-500',
      desc: `1km ${(result.demographics.population_1km / 10000).toFixed(1)}만명`,
    },
    {
      label: '유동인구',
      score: floatScore,
      color: 'bg-emerald-500',
      desc: `일 ${(result.demographics.floating_population_daily / 10000).toFixed(1)}만명`,
    },
  ]

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-5">
        <BarChart3 className="w-5 h-5 text-indigo-500" />
        <h3 className="font-semibold text-foreground">종합 입지 점수</h3>
        <span className={`ml-auto text-sm font-semibold px-2.5 py-1 rounded-full ${overallLabel.color} bg-secondary`}>
          {overallLabel.text}
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="flex flex-col items-center">
          <div style={{ width: '100%', maxWidth: 300, height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="var(--border, #e5e7eb)" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fontSize: 11, fill: 'var(--foreground, #111)' }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  dataKey="value"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.15}
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#6366f1' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="w-3 h-3" />
            <span>수익성 · 성장성 · 안전성은 프리미엄에서 확인</span>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="space-y-3">
          {/* Overall Score */}
          <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50 mb-4">
            <div className="text-[11px] text-muted-foreground mb-1">무료 분석 종합</div>
            <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
              {avgScore}<span className="text-lg font-normal text-muted-foreground">/100</span>
            </div>
          </div>

          {/* Free Axes */}
          {freeAxes.map((item) => {
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

          {/* Locked Axes */}
          {['수익성', '성장성', '안전성'].map((label) => (
            <div key={label} className="opacity-50">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">{label}</span>
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
