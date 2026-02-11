'use client'

import React from 'react'
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'
import { Train, Bus, Footprints, Eye } from 'lucide-react'
import { SimulationResponse } from '@/lib/api/client'

function getGrade(score: number): string {
  if (score >= 85) return 'A'
  if (score >= 70) return 'B'
  if (score >= 50) return 'C'
  return 'D'
}

function getGradeColor(grade: string): string {
  if (grade === 'A') return 'text-green-600 dark:text-green-400'
  if (grade === 'B') return 'text-blue-600 dark:text-blue-400'
  if (grade === 'C') return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

interface GaugeProps {
  label: string
  score: number
  color: string
  icon: React.ReactNode
}

function ScoreGaugeItem({ label, score, color, icon }: GaugeProps) {
  const data = [
    { name: 'score', value: score, fill: color },
    { name: 'bg', value: 100 - score, fill: 'transparent' },
  ]

  return (
    <div className="text-center">
      <div className="relative" style={{ width: 100, height: 80, margin: '0 auto' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="100%"
            innerRadius="70%"
            outerRadius="100%"
            startAngle={180}
            endAngle={0}
            data={[data[0]]}
            barSize={8}
          >
            <RadialBar
              dataKey="value"
              cornerRadius={4}
              background={{ fill: 'var(--muted, #f1f5f9)' }}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span className="text-lg font-bold text-foreground">{score}</span>
        </div>
      </div>
      <div className="flex items-center justify-center gap-1 mt-1">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}

export default function TransitScore({ result }: { result: SimulationResponse }) {
  const loc = result.location_analysis
  const transitScore = loc?.transit_score ?? 65
  const parkingScore = loc?.parking_score ?? 50
  const visibilityScore = loc?.visibility_score ?? 60
  const walkScore = Math.round((transitScore + visibilityScore) / 2)
  const subways = loc?.subway_stations ?? []
  const busStops = loc?.bus_stops_count ?? 4
  const busRoutes = loc?.bus_routes_count ?? 8

  const overallScore = Math.round((transitScore + parkingScore + walkScore + visibilityScore) / 4)
  const overallGrade = getGrade(overallScore)
  const gradeColor = getGradeColor(overallGrade)

  const scores: GaugeProps[] = [
    { label: '대중교통', score: transitScore, color: '#3b82f6', icon: <Train className="w-3 h-3 text-blue-500" /> },
    { label: '주차', score: parkingScore, color: '#64748b', icon: <Bus className="w-3 h-3 text-slate-500" /> },
    { label: '도보접근성', score: walkScore, color: '#22c55e', icon: <Footprints className="w-3 h-3 text-green-500" /> },
    { label: '가시성', score: visibilityScore, color: '#f59e0b', icon: <Eye className="w-3 h-3 text-amber-500" /> },
  ]

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Train className="w-5 h-5 text-blue-500" />
        <h3 className="font-semibold text-foreground">교통 접근성 상세 분석</h3>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground">종합등급</span>
          <span className={`text-lg font-bold ${gradeColor}`}>{overallGrade}</span>
        </div>
      </div>

      {/* 4 Score Gauges */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {scores.map((s) => (
          <ScoreGaugeItem key={s.label} {...s} />
        ))}
      </div>

      {/* Overall Score Bar */}
      <div className="mb-5 p-3 bg-muted/50 rounded-xl">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>종합 교통 접근성 점수</span>
          <span className="font-bold text-foreground">{overallScore}/100</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-700"
            style={{ width: `${overallScore}%` }}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Subway Stations */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">지하철역</h4>
          {subways.length > 0 ? (
            <div className="space-y-1.5">
              {subways.slice(0, 4).map((station, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5 px-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <Train className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground flex-1">{station.name}</span>
                  <div className="flex gap-1">
                    {station.lines.slice(0, 3).map((line, j) => (
                      <span key={j} className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 rounded text-blue-700 dark:text-blue-300 font-medium">
                        {line}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">{station.distance_m}m</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg">
              반경 1km 내 지하철역이 없습니다. 버스 이용을 권장합니다.
            </div>
          )}
        </div>

        {/* Bus & Other Stats */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">버스 접근성</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <span className="text-sm text-foreground">정류장 수</span>
              <span className="text-sm font-bold text-foreground">{busStops}개</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <span className="text-sm text-foreground">운행 노선</span>
              <span className="text-sm font-bold text-foreground">{busRoutes}개</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-950/20 rounded-lg">
              <span className="text-sm text-foreground">주차 가능 여부</span>
              <span className="text-sm font-bold text-foreground">{loc?.parking_available ? '가능' : '제한적'}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-950/20 rounded-lg">
              <span className="text-sm text-foreground">인근 주차장</span>
              <span className="text-sm font-bold text-foreground">{loc?.nearby_parking_lots ?? 2}곳</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-xs text-muted-foreground">
        <span className="font-semibold text-blue-700 dark:text-blue-300">교통 분석 요약:</span>{' '}
        {overallScore >= 70
          ? '대중교통 접근성이 우수하여 환자 유입에 유리한 입지입니다.'
          : overallScore >= 50
          ? '교통 접근성이 보통 수준이며, 주차 편의 확보가 경쟁력에 중요합니다.'
          : '교통 접근성이 낮아 주차 인프라 확보 및 셔틀 서비스를 고려해야 합니다.'}
      </div>
    </div>
  )
}
