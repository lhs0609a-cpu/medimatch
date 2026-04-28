'use client'

import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Users, Lock } from 'lucide-react'
import { SimulationResponse } from '@/lib/api/client'

interface DemographicsPreviewProps {
  result: SimulationResponse
  isUnlocked: boolean
}

const DONUT_COLORS = ['#3b82f6', '#93c5fd']

export default function DemographicsPreview({ result, isUnlocked }: DemographicsPreviewProps) {
  const pop1km = result.demographics.population_1km
  const age40Plus = Math.round(result.demographics.age_40_plus_ratio * 100)
  const ageUnder40 = 100 - age40Plus
  // 데이터 출처 정직 표시 — 실시간 vs 추정 구분
  const popSource = result.data_sources?.population
  const isRealtime = popSource?.is_realtime === true
  const sourceLabel = isRealtime ? '행정안전부' : '추정값 (좌표 기반)'

  const donutData = [
    { name: '40대 이상', value: age40Plus },
    { name: '40대 미만', value: ageUnder40 },
  ]

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Users className="w-5 h-5 text-blue-500" />
        <h3 className="font-semibold text-foreground">반경 1km 인구 분석</h3>
      </div>

      <div className="flex items-center gap-4 mb-5">
        <div className="relative flex-shrink-0" style={{ width: 120, height: 120 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={36}
                outerRadius={54}
                paddingAngle={3}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {donutData.map((_, idx) => (
                  <Cell key={idx} fill={DONUT_COLORS[idx]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base font-bold text-foreground">
              {(pop1km / 10000).toFixed(1)}만
            </span>
            <span className="text-[10px] text-muted-foreground">1km</span>
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold text-foreground">
            {pop1km.toLocaleString()}명
          </div>
          <div className="text-xs text-muted-foreground mb-2">
            반경 1km 인구 ({sourceLabel})
            {!isRealtime && <span className="ml-1 text-amber-600">⚠</span>}
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              40대+ {age40Plus}%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-300" />
              40대- {ageUnder40}%
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">40대 이상</span>
            <span className="font-medium text-foreground">{age40Plus}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-1000"
              style={{ width: `${age40Plus}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">40대 미만</span>
            <span className="font-medium text-foreground">{ageUnder40}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-300 rounded-full transition-all duration-1000"
              style={{ width: `${ageUnder40}%` }}
            />
          </div>
        </div>
      </div>

      {!isUnlocked && (
        <div className="mt-5 pt-4 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="w-3 h-3 flex-shrink-0" />
          <span>주변 의원 매출 비교는 잠금해제 후 확인 가능</span>
        </div>
      )}
    </div>
  )
}
