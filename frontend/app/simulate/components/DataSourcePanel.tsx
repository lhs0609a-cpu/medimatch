'use client'

import React from 'react'
import { CheckCircle2, AlertCircle, Database, Zap, Calendar } from 'lucide-react'
import { SimulationResponse } from '@/lib/api/client'

interface Props {
  result: SimulationResponse
}

const ITEM_LABELS: Record<string, string> = {
  population: '반경 1km 인구',
  competition: '경쟁 의원 목록',
  closure_rate: '폐업률',
  building: '건물 메타 (층/용도)',
  non_covered_price: '비급여 단가',
  search_trend: '검색 트렌드',
  visit_price: '진료과 단가',
  utilization_rate: '진료과 수료율',
  commercial: '상권 정보',
  nearby_facilities: '주변 시설',
}

function badge(item: { is_realtime: boolean; is_estimated?: boolean }) {
  if (item.is_realtime) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
        <Zap className="w-3 h-3" /> 실시간
      </span>
    )
  }
  if (item.is_estimated) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
        <AlertCircle className="w-3 h-3" /> 추정값
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
      <Calendar className="w-3 h-3" /> 정적
    </span>
  )
}

export default function DataSourcePanel({ result }: Props) {
  const ds = result.data_sources
  if (!ds || Object.keys(ds).length === 0) return null

  const realtimeCount = Object.values(ds).filter((s) => s.is_realtime).length
  const estimatedCount = Object.values(ds).filter((s) => s.is_estimated).length
  const staticCount = Object.values(ds).filter((s) => !s.is_realtime && !s.is_estimated).length
  const total = Object.keys(ds).length

  return (
    <div className="card overflow-hidden">
      <div className="p-6 border-b border-border bg-gradient-to-r from-slate-50/80 to-zinc-50/80 dark:from-slate-950/30 dark:to-zinc-950/30">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Database className="w-5 h-5 text-slate-600" />
          데이터 출처 ({total}개)
        </h3>
        <div className="flex items-center gap-2 mt-2 text-xs">
          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            🟢 실시간 {realtimeCount}
          </span>
          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            📅 정적 {staticCount}
          </span>
          {estimatedCount > 0 && (
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              ⚠ 추정 {estimatedCount}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 divide-y divide-border">
        {Object.entries(ds).map(([key, item]) => (
          <div key={key} className="py-2.5 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground">{ITEM_LABELS[key] || key}</div>
              <div className="text-xs text-muted-foreground truncate">{item.source}</div>
              {item.note && (
                <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">{item.note}</div>
              )}
            </div>
            <div className="flex-shrink-0">{badge(item)}</div>
          </div>
        ))}
      </div>

      {/* 실시간 데이터 상세 */}
      {result.realtime_data && (
        <div className="border-t border-border p-4 bg-muted/30">
          <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            실시간 호출 결과
          </h4>
          <div className="space-y-1 text-[11px]">
            {result.realtime_data.real_closure_data && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">LOCALDATA 폐업률:</span>
                <span className="font-semibold">
                  {result.realtime_data.real_closure_data.closure_rate_percent.toFixed(1)}%
                </span>
                <span className="text-muted-foreground">
                  (분석 {result.realtime_data.real_closure_data.total}건)
                </span>
              </div>
            )}
            {result.realtime_data.building_meta && result.realtime_data.building_meta.floors_above > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">VWORLD 건물:</span>
                <span className="font-semibold">
                  {result.realtime_data.building_meta.floors_above}층
                </span>
                {result.realtime_data.building_meta.is_medical_building && (
                  <span className="text-emerald-600">🏥 메디컬빌딩</span>
                )}
                <span className="text-muted-foreground">
                  ({result.realtime_data.building_meta.built_year}년 준공)
                </span>
              </div>
            )}
            {result.realtime_data.non_covered_fees_count !== undefined && result.realtime_data.non_covered_fees_count > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">비급여 단가:</span>
                <span className="font-semibold">{result.realtime_data.non_covered_fees_count}건 조회</span>
              </div>
            )}
            {result.realtime_data.search_trend && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">네이버 트렌드 모멘텀:</span>
                <span className={`font-semibold ${
                  result.realtime_data.search_trend.momentum > 0
                    ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {(result.realtime_data.search_trend.momentum * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
