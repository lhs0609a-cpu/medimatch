'use client'

import React from 'react'
import {
  MapPin, Pill, UtensilsCrossed, Coffee, Landmark, CarFront, Store, GraduationCap, Activity,
} from 'lucide-react'
import { SimulationResponse } from '@/lib/api/client'

const FACILITY_CONFIG = [
  { key: 'pharmacy', label: '약국', icon: Pill, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/30' },
  { key: 'restaurant', label: '음식점', icon: UtensilsCrossed, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/30' },
  { key: 'cafe', label: '카페', icon: Coffee, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  { key: 'bank', label: '은행', icon: Landmark, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  { key: 'parking', label: '주차장', icon: CarFront, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-950/30' },
  { key: 'convenience_store', label: '편의점', icon: Store, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30' },
  { key: 'school', label: '학교', icon: GraduationCap, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
  { key: 'hospital', label: '병원', icon: Activity, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-950/30' },
]

const DEFAULT_FACILITIES: Record<string, number> = {
  pharmacy: 5, restaurant: 23, cafe: 12, bank: 3,
  parking: 4, convenience_store: 8, school: 2, hospital: 7,
}

function getAccessScore(facilities: Record<string, number>): number {
  const total = Object.values(facilities).reduce((s, v) => s + v, 0)
  return Math.min(100, Math.round((total / 80) * 100))
}

function getGrade(score: number): { grade: string; color: string } {
  if (score >= 85) return { grade: 'A+', color: 'text-green-600 dark:text-green-400' }
  if (score >= 70) return { grade: 'A', color: 'text-green-600 dark:text-green-400' }
  if (score >= 55) return { grade: 'B', color: 'text-blue-600 dark:text-blue-400' }
  if (score >= 40) return { grade: 'C', color: 'text-amber-600 dark:text-amber-400' }
  return { grade: 'D', color: 'text-red-600 dark:text-red-400' }
}

export default function NearbyFacilities({ result }: { result: SimulationResponse }) {
  const facilities = result.location_analysis?.nearby_facilities ?? DEFAULT_FACILITIES
  const commercialScore = result.location_analysis?.commercial_score ?? 65
  const accessScore = getAccessScore(facilities)
  const { grade, color } = getGrade(accessScore)

  const impactTexts = [
    facilities['pharmacy'] >= 3
      ? '약국이 충분하여 처방전 편의성이 높습니다.'
      : '약국이 적어 환자 편의성 보완이 필요합니다.',
    (facilities['restaurant'] ?? 0) + (facilities['cafe'] ?? 0) >= 20
      ? '음식점/카페가 밀집한 상권으로 유동인구 확보에 유리합니다.'
      : '주변 상업시설이 적어 별도 마케팅이 필요합니다.',
    facilities['parking'] >= 3
      ? '주차 인프라가 양호하여 차량 환자 접근이 용이합니다.'
      : '주차 시설이 부족하여 발렛 또는 주차 안내가 필요합니다.',
  ]

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-5">
        <MapPin className="w-5 h-5 text-rose-500" />
        <h3 className="font-semibold text-foreground">주변 편의시설 분석</h3>
        <span className="ml-auto text-[11px] text-muted-foreground">반경 500m 기준</span>
      </div>

      {/* Score Header */}
      <div className="flex items-center gap-4 mb-5 p-4 bg-muted/50 rounded-xl">
        <div className="text-center">
          <div className={`text-3xl font-bold ${color}`}>{grade}</div>
          <div className="text-[11px] text-muted-foreground">접근성 등급</div>
        </div>
        <div className="flex-1">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>편의시설 접근성</span>
            <span className="font-semibold text-foreground">{accessScore}점</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-rose-400 to-green-400 transition-all duration-700"
              style={{ width: `${accessScore}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>상업지구 점수</span>
            <span className="font-semibold text-foreground">{commercialScore}점</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden mt-1">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-400 to-violet-500 transition-all duration-700"
              style={{ width: `${commercialScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Facility Grid */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {FACILITY_CONFIG.map(({ key, label, icon: Icon, color: iconColor, bg }) => {
          const count = facilities[key] ?? 0
          return (
            <div key={key} className={`${bg} rounded-xl p-3 text-center`}>
              <Icon className={`w-5 h-5 mx-auto mb-1 ${iconColor}`} />
              <div className="text-lg font-bold text-foreground">{count}</div>
              <div className="text-[10px] text-muted-foreground">{label}</div>
            </div>
          )
        })}
      </div>

      {/* Impact Analysis */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">입지 영향 분석</h4>
        {impactTexts.map((text, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-foreground">
            <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0" />
            {text}
          </div>
        ))}
      </div>
    </div>
  )
}
