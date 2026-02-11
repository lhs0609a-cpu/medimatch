'use client'

import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Users, Lock, Activity } from 'lucide-react'
import { SimulationResponse } from '@/lib/api/client'

interface DemographicsPreviewProps {
  result: SimulationResponse
  isUnlocked: boolean
}

const DONUT_COLORS = ['#3b82f6', '#93c5fd']

const AGE_GROUPS = [
  { key: 'age_0_9', label: '0~9세', color: 'bg-sky-300 dark:bg-sky-700' },
  { key: 'age_10_19', label: '10대', color: 'bg-sky-400 dark:bg-sky-600' },
  { key: 'age_20_29', label: '20대', color: 'bg-blue-400 dark:bg-blue-600' },
  { key: 'age_30_39', label: '30대', color: 'bg-blue-500 dark:bg-blue-500' },
  { key: 'age_40_49', label: '40대', color: 'bg-indigo-500 dark:bg-indigo-500' },
  { key: 'age_50_59', label: '50대', color: 'bg-violet-500 dark:bg-violet-500' },
  { key: 'age_60_plus', label: '60+', color: 'bg-purple-600 dark:bg-purple-500' },
] as const

export default function DemographicsPreview({ result, isUnlocked }: DemographicsPreviewProps) {
  const pop1km = result.demographics.population_1km
  const age40Plus = Math.round(result.demographics.age_40_plus_ratio * 100)
  const ageUnder40 = 100 - age40Plus
  const floatingDaily = result.demographics.floating_population_daily
  const dd = result.demographics_detail

  const donutData = [
    { name: '40대 이상', value: age40Plus },
    { name: '40대 미만', value: ageUnder40 },
  ]

  const seoulAvg = 72000
  const vsSeoul = ((floatingDaily - seoulAvg) / seoulAvg * 100).toFixed(0)
  const vsSeoulPositive = Number(vsSeoul) >= 0

  const hasAgeDetail = dd && dd.age_0_9 !== undefined && dd.age_0_9 > 0

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Users className="w-5 h-5 text-blue-500" />
        <h3 className="font-semibold text-foreground">인구 · 유동인구 분석</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Population + Age Bars */}
        <div>
          {/* Population headline + donut */}
          <div className="flex items-center gap-4 mb-5">
            <div className="relative flex-shrink-0" style={{ width: 100, height: 100 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={45}
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
                <span className="text-sm font-bold text-foreground">
                  {(pop1km / 10000).toFixed(1)}만
                </span>
                <span className="text-[9px] text-muted-foreground">1km</span>
              </div>
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">
                {pop1km.toLocaleString()}명
              </div>
              <div className="text-xs text-muted-foreground mb-1">반경 1km 추정 인구</div>
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

          {/* 7-group age distribution bars */}
          {hasAgeDetail ? (
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">
                연령별 인구 분포 (행정안전부 실데이터)
              </h4>
              {AGE_GROUPS.map((ag) => {
                const raw = (dd as Record<string, number>)[ag.key] || 0
                const pct = Math.round(raw * 100)
                const barWidth = Math.min(pct * 4, 100) // scale: 25% fills 100%
                return (
                  <div key={ag.key} className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground w-10 text-right flex-shrink-0">
                      {ag.label}
                    </span>
                    <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${ag.color} transition-all duration-1000`}
                        style={{ width: `${Math.max(barWidth, 2)}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-foreground w-8 text-right">
                      {pct}%
                    </span>
                  </div>
                )
              })}
              <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                <Database className="w-3 h-3" />
                출처: 행정안전부 주민등록 인구통계
              </p>
            </div>
          ) : (
            /* Fallback: simple 40+/40- bars */
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
          )}
        </div>

        {/* Right: Floating Population + Gender */}
        <div>
          {/* Floating Population */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-emerald-500" />
              <h4 className="text-sm font-medium text-foreground">일일 유동인구</h4>
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">
              {(floatingDaily / 10000).toFixed(1)}
              <span className="text-base font-normal text-muted-foreground">만명/일</span>
            </div>
            <p className={`text-sm font-medium ${vsSeoulPositive ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
              서울 평균 대비 {vsSeoulPositive ? '+' : ''}{vsSeoul}%
            </p>

            {/* Weekday vs Weekend */}
            {dd && dd.floating_weekday_avg > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-muted/50 rounded-lg">
                  <div className="text-[11px] text-muted-foreground">평일 평균</div>
                  <div className="text-sm font-bold text-foreground">
                    {(dd.floating_weekday_avg / 10000).toFixed(1)}만명
                  </div>
                </div>
                <div className="p-2.5 bg-muted/50 rounded-lg">
                  <div className="text-[11px] text-muted-foreground">주말 평균</div>
                  <div className="text-sm font-bold text-foreground">
                    {(dd.floating_weekend_avg / 10000).toFixed(1)}만명
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Gender Ratio */}
          {dd && dd.male_ratio > 0 && (
            <div className="mb-5">
              <h4 className="text-sm font-medium text-foreground mb-2">성별 비율</h4>
              <div className="h-6 rounded-full overflow-hidden flex text-[11px] font-semibold">
                <div
                  className="bg-blue-500 flex items-center justify-center text-white"
                  style={{ width: `${Math.round(dd.male_ratio * 100)}%` }}
                >
                  남 {Math.round(dd.male_ratio * 100)}%
                </div>
                <div
                  className="bg-pink-400 flex items-center justify-center text-white"
                  style={{ width: `${Math.round(dd.female_ratio * 100)}%` }}
                >
                  여 {Math.round(dd.female_ratio * 100)}%
                </div>
              </div>
            </div>
          )}

          {/* Medical Utilization */}
          {dd && dd.medical_utilization_rate > 0 && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
              <div className="text-[11px] text-muted-foreground mb-1">지역 의료이용률</div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {Math.round(dd.medical_utilization_rate * 100)}%
                </span>
                <span className="text-xs text-muted-foreground">
                  (연 평균 {dd.avg_annual_visits?.toFixed(1) || '-'}회 방문)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Teaser */}
      {!isUnlocked && (
        <div className="mt-5 pt-4 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="w-3 h-3 flex-shrink-0" />
          <span>가구소득 · 1인가구 비율 · 반경별 인구(500m/3km) · 피크시간대 상세는 프리미엄에서</span>
        </div>
      )}
    </div>
  )
}

function Database({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5V19A9 3 0 0 0 21 19V5" /><path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  )
}
