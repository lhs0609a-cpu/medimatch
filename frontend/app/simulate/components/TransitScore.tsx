'use client'

import React from 'react'
import { Train, Bus, MapPin } from 'lucide-react'
import { SimulationResponse } from '@/lib/api/client'

interface Props {
  result: SimulationResponse
}

function calcSubwayScore(nearestM: number | null, count: number): number {
  if (nearestM === null) return 20
  let distScore = 60
  if (nearestM > 800) distScore = Math.max(20, 60 - (nearestM - 800) / 30)
  else if (nearestM > 500) distScore = 60 - (nearestM - 500) / 10
  const countScore = Math.min(count * 10, 40)
  return Math.round(distScore + countScore)
}

function calcBusScore(nearestM: number | null, count: number): number {
  if (nearestM === null) return 30
  let distScore = 50
  if (nearestM > 200) distScore = Math.max(20, 50 - (nearestM - 200))
  const countScore = Math.min(count * 10, 50)
  return Math.round(distScore + countScore)
}

function getGrade(s: number): { label: string; color: string; bg: string } {
  if (s >= 80) return { label: '우수', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' }
  if (s >= 60) return { label: '양호', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' }
  if (s >= 40) return { label: '보통', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' }
  return { label: '주의', color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/30' }
}

export default function TransitScore({ result }: Props) {
  const env = result.clinic_environment
  if (!env) return null

  const subway = env.subway_stations
  const bus = env.bus_stops

  const subwayDist = subway?.nearest?.distance_m ?? null
  const subwayCount = subway?.count_total ?? 0
  const busDist = bus?.nearest?.distance_m ?? null
  const busCount = bus?.count_total ?? 0

  const subwayScore = calcSubwayScore(subwayDist, subwayCount)
  const busScore = calcBusScore(busDist, busCount)
  const totalScore = Math.round(subwayScore * 0.6 + busScore * 0.4)
  const grade = getGrade(totalScore)

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-foreground">대중교통 접근성</h3>
        <span className={`ml-auto text-sm font-bold px-2.5 py-0.5 rounded-full ${grade.color} ${grade.bg}`}>
          {grade.label}
        </span>
      </div>

      <div className={`p-4 rounded-xl mb-4 text-center ${grade.bg}`}>
        <div className="text-[11px] text-muted-foreground mb-1">종합 접근성 점수</div>
        <div className={`text-4xl font-bold ${grade.color}`}>
          {totalScore}<span className="text-lg font-normal text-muted-foreground">/100</span>
        </div>
        <div className="text-[10px] text-muted-foreground mt-1">지하철 60% + 버스 40% 가중 평균</div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="p-4 border border-border rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Train className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-sm">지하철역</span>
            <span className="ml-auto font-bold text-indigo-600">{subwayScore}점</span>
          </div>
          <div className="text-[11px] text-muted-foreground space-y-1">
            <div>반경 800m 내: <strong className="text-foreground">{subwayCount}개</strong></div>
            {subway?.nearest && (
              <div>가장 가까운: <strong className="text-foreground">{subway.nearest.name}</strong> ({subwayDist}m)</div>
            )}
          </div>
        </div>

        <div className="p-4 border border-border rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Bus className="w-4 h-4 text-cyan-600" />
            <span className="font-semibold text-sm">버스정류장</span>
            <span className="ml-auto font-bold text-cyan-600">{busScore}점</span>
          </div>
          <div className="text-[11px] text-muted-foreground space-y-1">
            <div>반경 300m 내: <strong className="text-foreground">{busCount}개</strong></div>
            {bus?.nearest && (
              <div>가장 가까운: <strong className="text-foreground">{bus.nearest.name}</strong> ({busDist}m)</div>
            )}
          </div>
        </div>
      </div>

      <p className="mt-3 text-[10px] text-muted-foreground">
        ※ 카카오 Local API 실측 거리·카운트 기반 알고리즘 (가짜 random 아님)
      </p>
    </div>
  )
}
