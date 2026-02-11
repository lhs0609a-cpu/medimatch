'use client'

import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Users, Lock } from 'lucide-react'
import { SimulationResponse } from '@/lib/api/client'

interface DemographicsPreviewProps {
  result: SimulationResponse
  isUnlocked: boolean
}

const COLORS = ['#3b82f6', '#93c5fd']

export default function DemographicsPreview({ result, isUnlocked }: DemographicsPreviewProps) {
  const pop1km = result.demographics.population_1km
  const age40Plus = Math.round(result.demographics.age_40_plus_ratio * 100)
  const ageUnder40 = 100 - age40Plus
  const floatingDaily = result.demographics.floating_population_daily

  const donutData = [
    { name: '40대 이상', value: age40Plus },
    { name: '40대 미만', value: ageUnder40 },
  ]

  // Seoul average ~72,000/day for reference
  const seoulAvg = 72000
  const vsSeoul = ((floatingDaily - seoulAvg) / seoulAvg * 100).toFixed(0)
  const vsSeoulText = Number(vsSeoul) >= 0 ? `서울 평균 대비 +${vsSeoul}%` : `서울 평균 대비 ${vsSeoul}%`

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Users className="w-5 h-5 text-blue-500" />
        <h3 className="font-semibold text-foreground">인구 분석 미리보기</h3>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Population Donut */}
        <div className="flex flex-col items-center">
          <div className="relative" style={{ width: 140, height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={62}
                  paddingAngle={3}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {donutData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-foreground">
                {(pop1km / 10000).toFixed(1)}만
              </span>
              <span className="text-[10px] text-muted-foreground">1km 인구</span>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
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

        {/* Age Ratio Bar */}
        <div className="flex flex-col justify-center">
          <h4 className="text-sm font-medium text-foreground mb-3">연령 비율</h4>
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
        </div>

        {/* Floating Population */}
        <div className="flex flex-col justify-center">
          <h4 className="text-sm font-medium text-foreground mb-3">일일 유동인구</h4>
          <div className="text-3xl font-bold text-foreground mb-1">
            {(floatingDaily / 10000).toFixed(1)}<span className="text-lg font-normal text-muted-foreground">만명</span>
          </div>
          <p className={`text-sm ${Number(vsSeoul) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {vsSeoulText}
          </p>
        </div>
      </div>

      {/* Teaser for premium */}
      {!isUnlocked && (
        <div className="mt-5 pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="w-3 h-3" />
            <span>연령별 세부 분포 (7구간), 소득 수준, 의료이용률은 프리미엄에서 확인</span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {['연령 7구간 분포', '평균 가구소득', '의료이용률'].map((item) => (
              <div key={item} className="text-center p-2 bg-muted/50 rounded-lg blur-[3px] select-none">
                <div className="text-sm font-medium text-muted-foreground">--</div>
                <div className="text-[10px] text-muted-foreground">{item}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
