'use client'

import React from 'react'
import { Target, Shield, Lock } from 'lucide-react'
import { SimulationResponse } from '@/lib/api/client'

interface FreeInsightsProps {
  result: SimulationResponse
}

function getCompetitionLevel(count: number): { text: string; color: string; bg: string } {
  if (count <= 2) return { text: '매우 유리', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/40' }
  if (count <= 5) return { text: '유리', color: 'text-green-500 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/30' }
  if (count <= 8) return { text: '보통', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30' }
  if (count <= 12) return { text: '경쟁 치열', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/30' }
  return { text: '과밀 경쟁', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30' }
}

export default function FreeInsights({ result }: FreeInsightsProps) {
  const { same_dept_count, total_clinic_count, radius_m } = result.competition
  const competitors = result.competitors || []
  const level = getCompetitionLevel(same_dept_count)

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-rose-500" />
          <h3 className="font-semibold text-foreground">경쟁 현황 분석</h3>
        </div>
        <span className={`text-sm font-semibold px-2.5 py-1 rounded-full ${level.color} ${level.bg}`}>
          {level.text}
        </span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 md:gap-3 mb-5">
        <div className="text-center p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg">
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{same_dept_count}</div>
          <div className="text-[11px] text-muted-foreground">동일과 의원</div>
        </div>
        <div className="text-center p-3 bg-slate-100 dark:bg-slate-800/30 rounded-lg">
          <div className="text-2xl font-bold text-foreground">{total_clinic_count}</div>
          <div className="text-[11px] text-muted-foreground">전체 의료기관</div>
        </div>
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{radius_m}m</div>
          <div className="text-[11px] text-muted-foreground">분석 반경</div>
        </div>
      </div>

      {/* Competitor Table or Blue Ocean */}
      {same_dept_count === 0 ? (
        <div className="text-center py-8">
          <Shield className="w-10 h-10 mx-auto mb-3 text-green-500" />
          <p className="font-semibold text-foreground text-lg mb-1">블루오션!</p>
          <p className="text-sm text-muted-foreground">
            반경 {radius_m}m 내 동일 진료과 의원이 없어 매우 유리한 입지입니다.
          </p>
        </div>
      ) : competitors.length > 0 ? (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            주변 경쟁 의원 ({competitors.length}개)
          </h4>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm min-w-[400px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">의원명</th>
                  <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">거리</th>
                  <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">진료과</th>
                  <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">
                    <span className="flex items-center gap-1 justify-end text-muted-foreground/60">
                      추정 매출
                      <Lock className="w-3 h-3" />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {competitors.slice(0, 6).map((comp, idx) => (
                  <tr key={idx} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-muted-foreground flex-shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <div>
                          <span className="font-medium text-foreground text-sm">{comp.name}</span>
                          {comp.specialty_detail && (
                            <span className="block text-[10px] text-muted-foreground">{comp.specialty_detail}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <span className="font-medium text-foreground">{comp.distance_m}m</span>
                    </td>
                    <td className="py-2.5 px-2 text-muted-foreground text-xs">{comp.clinic_type}</td>
                    <td className="py-2.5 px-2 text-right">
                      <span className="text-muted-foreground/30 blur-[4px] select-none text-xs">5,000만원</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {competitors.length > 6 && (
            <p className="text-xs text-muted-foreground text-center mt-3">
              외 {competitors.length - 6}개 의원 더보기는 프리미엄에서
            </p>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <Target className="w-8 h-8 mx-auto mb-2 text-amber-500" />
          <p className="font-medium text-foreground mb-1">
            반경 {radius_m}m 내 동일과 {same_dept_count}개 의원 존재
          </p>
          <p className="text-sm text-muted-foreground">
            경쟁 의원 상세 정보(실명·매출·점유율)는 프리미엄에서 확인하세요.
          </p>
        </div>
      )}

      {/* Teaser */}
      <div className="mt-4 pt-3 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
        <Lock className="w-3 h-3 flex-shrink-0" />
        <span>경쟁병원 실명 · 추정 매출 · 시장점유율 · 경쟁강도 지수는 프리미엄에서 확인</span>
      </div>
    </div>
  )
}
