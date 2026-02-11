'use client'

import React from 'react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import { Lock } from 'lucide-react'
import { SimulationResponse } from '@/lib/api/client'

interface CompetitionRadarProps {
  result: SimulationResponse
  isUnlocked: boolean
}

function normalizeValue(value: number, min: number, max: number): number {
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))
}

export default function CompetitionRadar({ result, isUnlocked }: CompetitionRadarProps) {
  const sameDept = normalizeValue(result.competition.same_dept_count, 0, 15)
  const totalClinic = normalizeValue(result.competition.total_clinic_count, 0, 80)
  const floating = normalizeValue(result.demographics.floating_population_daily, 0, 150000)

  const saturation = isUnlocked && result.competition_detail ? result.competition_detail.market_saturation : 0
  const compIdx = isUnlocked && result.competition_detail ? result.competition_detail.competition_index : 0
  const marketShare = isUnlocked && result.competition_detail ? normalizeValue(result.competition_detail.estimated_market_share, 0, 20) : 0

  const data = [
    { axis: '동일과 경쟁', value: sameDept, fullMark: 100 },
    { axis: '전체 의료기관', value: totalClinic, fullMark: 100 },
    { axis: '유동인구', value: floating, fullMark: 100 },
    { axis: isUnlocked ? '시장포화도' : '시장포화도 🔒', value: saturation, fullMark: 100 },
    { axis: isUnlocked ? '경쟁강도' : '경쟁강도 🔒', value: compIdx, fullMark: 100 },
    { axis: isUnlocked ? '예상점유율' : '예상점유율 🔒', value: marketShare, fullMark: 100 },
  ]

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">경쟁 환경 레이더</h3>
        {!isUnlocked && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Lock className="w-3 h-3" />
            3개 축 잠김
          </span>
        )}
      </div>
      <div className="w-full" style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="var(--border, #e5e7eb)" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fontSize: 11, fill: 'var(--muted-foreground, #6b7280)' }}
            />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="분석 결과"
              dataKey="value"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.15}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      {!isUnlocked && (
        <p className="text-xs text-center text-muted-foreground mt-2">
          시장포화도, 경쟁강도, 예상시장점유율은 프리미엄에서 확인할 수 있습니다
        </p>
      )}
    </div>
  )
}
