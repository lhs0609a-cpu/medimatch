'use client'

import React from 'react'
import {
  Cross, Pill, GraduationCap, Baby, Users, Train, Bus, Building2, Home,
} from 'lucide-react'
import { SimulationResponse, ClinicEnvCategory } from '@/lib/api/client'

interface Props {
  result: SimulationResponse
}

// 진료과별 핵심 항목 (가장 영업/동선에 중요한 것)
const CLINIC_PRIORITY: Record<string, string[]> = {
  소아청소년과: ['kindergartens', 'schools', 'apartments', 'pharmacies'],
  치과: ['schools', 'apartments', 'office_buildings', 'subway_stations'],
  내과: ['senior_centers', 'apartments', 'pharmacies', 'general_hospitals'],
  정형외과: ['general_hospitals', 'apartments', 'office_buildings', 'pharmacies'],
  피부과: ['office_buildings', 'subway_stations', 'apartments', 'bus_stops'],
  성형외과: ['subway_stations', 'office_buildings', 'apartments', 'bus_stops'],
  이비인후과: ['kindergartens', 'schools', 'apartments', 'pharmacies'],
  안과: ['schools', 'apartments', 'pharmacies', 'general_hospitals'],
  신경외과: ['general_hospitals', 'senior_centers', 'apartments', 'pharmacies'],
  산부인과: ['apartments', 'kindergartens', 'office_buildings', 'general_hospitals'],
  비뇨의학과: ['apartments', 'office_buildings', 'pharmacies', 'general_hospitals'],
  정신건강의학과: ['office_buildings', 'apartments', 'subway_stations', 'schools'],
  재활의학과: ['senior_centers', 'apartments', 'general_hospitals', 'pharmacies'],
  가정의학과: ['apartments', 'office_buildings', 'pharmacies', 'subway_stations'],
}

const META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; helpText: string }> = {
  general_hospitals: { label: '종합병원',      icon: Cross,         color: 'text-rose-600',     helpText: '응급·협진 동선' },
  pharmacies:        { label: '약국',          icon: Pill,          color: 'text-emerald-600',  helpText: '처방·조제 (가까울수록 환자 편의 ↑)' },
  schools:           { label: '초등학교',       icon: GraduationCap, color: 'text-blue-600',     helpText: '소아·치과 핵심 영업 타겟' },
  kindergartens:     { label: '어린이집',       icon: Baby,          color: 'text-pink-600',     helpText: '소아 진료 수요' },
  senior_centers:    { label: '요양원',         icon: Users,         color: 'text-amber-600',    helpText: '노인 진료 수요' },
  subway_stations:   { label: '지하철역',       icon: Train,         color: 'text-indigo-600',   helpText: '광역 환자 접근성' },
  bus_stops:         { label: '버스정류장',     icon: Bus,           color: 'text-cyan-600',     helpText: '도보 환자 접근성' },
  office_buildings:  { label: '오피스',         icon: Building2,     color: 'text-slate-600',    helpText: '직장인 검진 영업' },
  apartments:        { label: '아파트',         icon: Home,          color: 'text-violet-600',   helpText: '주거 환자 기반' },
}

function formatDistance(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(1)}km`
  return `${m}m`
}

export default function ClinicEnvironment({ result }: Props) {
  const env = result.clinic_environment
  if (!env) return null

  const priorityKeys = CLINIC_PRIORITY[result.clinic_type] || ['apartments', 'pharmacies', 'subway_stations', 'office_buildings']
  const otherKeys = Object.keys(META).filter((k) => !priorityKeys.includes(k))

  const renderCategory = (key: string, isPriority: boolean) => {
    const cat = (env as Record<string, ClinicEnvCategory | undefined>)[key]
    const meta = META[key]
    if (!cat || !meta) return null
    const Icon = meta.icon

    return (
      <div
        key={key}
        className={`p-4 rounded-xl border ${
          isPriority
            ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
            : 'border-border bg-muted/30'
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`w-5 h-5 ${meta.color}`} />
          <span className="font-semibold text-foreground text-sm">{meta.label}</span>
          {isPriority && (
            <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-blue-600 text-white rounded font-semibold">
              핵심
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-2xl font-bold text-foreground">{cat.count_total.toLocaleString()}</span>
          <span className="text-[11px] text-muted-foreground">개 (반경 {formatDistance(cat.search_radius_m)})</span>
        </div>
        {cat.nearest && (
          <div className="text-[11px] text-muted-foreground border-t border-border/50 pt-2">
            <div className="flex items-center justify-between gap-1">
              <span className="truncate">{cat.nearest.name}</span>
              <span className="font-semibold text-foreground whitespace-nowrap">{formatDistance(cat.nearest.distance_m)}</span>
            </div>
          </div>
        )}
        <p className="text-[10px] text-muted-foreground mt-1.5">{meta.helpText}</p>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-semibold text-foreground">개원 환경 — 영업·동선·접근성</h3>
        <span className="ml-auto text-[11px] text-muted-foreground">출처: 카카오 Local API 키워드 검색</span>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        {result.clinic_type} 진료과에 핵심적인 시설(파란 카드)을 우선 검토하세요.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {priorityKeys.map((k) => renderCategory(k, true))}
      </div>

      <div className="mt-2">
        <div className="text-sm text-muted-foreground mb-2">
          기타 시설 정보 ({otherKeys.length}개)
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          {otherKeys.map((k) => renderCategory(k, false))}
        </div>
      </div>
    </div>
  )
}
