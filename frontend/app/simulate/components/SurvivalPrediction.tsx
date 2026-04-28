'use client'

import React from 'react'
import {
  Activity, AlertTriangle, ShieldCheck, TrendingUp,
  DollarSign, Database, BarChart3,
} from 'lucide-react'
import { SimulationResponse } from '@/lib/api/client'

interface Props {
  result: SimulationResponse
}

function won(v: number): string {
  if (v >= 100_000_000) return `${(v / 100_000_000).toFixed(1)}억원`
  if (v >= 10_000) return `${(v / 10_000).toLocaleString()}만원`
  return `${v.toLocaleString()}원`
}

function survivalColor(p: number): string {
  if (p >= 90) return 'text-emerald-600 dark:text-emerald-400'
  if (p >= 75) return 'text-green-600 dark:text-green-400'
  if (p >= 60) return 'text-amber-600 dark:text-amber-400'
  if (p >= 40) return 'text-orange-600 dark:text-orange-400'
  return 'text-rose-600 dark:text-rose-400'
}

function riskBg(score: number): string {
  if (score < 20) return 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
  if (score < 40) return 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
  if (score < 60) return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
  if (score < 80) return 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800'
  return 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
}

function statusBadge(level: string) {
  const map: Record<string, { color: string; label: string }> = {
    safe: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', label: '✓ 안정 진료과' },
    moderate: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', label: '◐ 보통 시장' },
    high_risk: { color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300', label: '⚠ 위험 시장' },
  }
  const s = map[level] || map.moderate
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${s.color}`}>
      {s.label}
    </span>
  )
}

export default function SurvivalPrediction({ result }: Props) {
  const sp = result.survival_prediction
  const pp = result.proper_premium
  const rf = result.revenue_factors

  if (!sp && !pp && !rf) return null

  return (
    <div className="card overflow-hidden">
      <div className="p-6 border-b border-border bg-gradient-to-r from-violet-50/50 to-blue-50/50 dark:from-violet-950/20 dark:to-blue-950/20">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Database className="w-5 h-5 text-violet-600" />
              학계 검증 모델 — 생존확률 + 권리금
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Cox 회귀 (BMC 2025) + SVM AUC 0.762 (PMC11399738) + HIRA 진료비통계
            </p>
          </div>
          {sp?.market_status && statusBadge(sp.market_status.level)}
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* 생존확률 */}
        {sp && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-violet-600" />
              <h4 className="font-semibold text-foreground">생존확률 (학계 모델)</h4>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 bg-secondary/50 rounded-xl text-center">
                <div className={`text-3xl font-bold ${survivalColor(sp.survival_1y)}`}>
                  {sp.survival_1y.toFixed(1)}<span className="text-base">%</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">1년 생존</div>
              </div>
              <div className="p-4 bg-secondary/50 rounded-xl text-center">
                <div className={`text-3xl font-bold ${survivalColor(sp.survival_3y)}`}>
                  {sp.survival_3y.toFixed(1)}<span className="text-base">%</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">3년 생존</div>
              </div>
              <div className="p-4 bg-secondary/50 rounded-xl text-center">
                <div className={`text-3xl font-bold ${survivalColor(sp.survival_5y)}`}>
                  {sp.survival_5y.toFixed(1)}<span className="text-base">%</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">5년 생존</div>
              </div>
            </div>

            {/* 폐업위험 점수 게이지 */}
            <div className={`mt-3 p-3 rounded-xl border ${riskBg(sp.closure_risk_score)}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  폐업위험 점수
                </span>
                <span className="text-2xl font-bold text-foreground">
                  {sp.closure_risk_score.toFixed(0)}<span className="text-sm text-muted-foreground">/100</span>
                </span>
              </div>
              <div className="w-full h-2 bg-white/50 dark:bg-black/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 rounded-full transition-all"
                  style={{ width: `${Math.max(2, sp.closure_risk_score)}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                연간 폐업률 추정: <span className="font-semibold">{sp.annual_closure_rate.toFixed(2)}%</span>
                <span className="ml-2 text-[10px]">(기준 {sp.base_rate.toFixed(2)}%)</span>
              </div>
            </div>

            {/* 시장 진단 메시지 */}
            {sp.market_status && (
              <div className="mt-3 p-3 bg-muted/40 rounded-lg">
                <div className="text-xs font-semibold text-muted-foreground mb-1">진료과 시장 진단</div>
                <div className="text-sm text-foreground">{sp.market_status.message}</div>
              </div>
            )}
          </div>
        )}

        {/* 매출 예측 변수 (학계 모델 입력) */}
        {rf && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <h4 className="font-semibold text-foreground">매출 예측 변수 (일본 진료권 공식)</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <div className="text-[11px] text-muted-foreground">진료권 인구</div>
                <div className="text-base font-bold">{rf.target_population.toLocaleString()}명</div>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <div className="text-[11px] text-muted-foreground">수료율 (1000명당/년)</div>
                <div className="text-base font-bold">{rf.utilization_per_1000.toLocaleString()}건</div>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <div className="text-[11px] text-muted-foreground">경쟁의원</div>
                <div className="text-base font-bold">{rf.competitor_count}개</div>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <div className="text-[11px] text-muted-foreground">시장 점유율</div>
                <div className="text-base font-bold">{(rf.market_share * 100).toFixed(1)}%</div>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <div className="text-[11px] text-muted-foreground">입지 보정</div>
                <div className="text-base font-bold">×{rf.location_factor.toFixed(2)}</div>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <div className="text-[11px] text-muted-foreground">건당 단가 (지역)</div>
                <div className="text-base font-bold">{won(rf.regional_price_won)}</div>
              </div>
            </div>
            <div className="mt-2 p-2 bg-muted/30 rounded text-[11px] text-muted-foreground">
              공식: 1일 환자 = 인구 × 수료율 ÷ 1000 ÷ 진료일 ÷ (경쟁+1) × 입지 / 월매출 = 환자×진료일×단가
            </div>
          </div>
        )}

        {/* 권리금 */}
        {pp && pp.premium_low > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <h4 className="font-semibold text-foreground">적정 권리금 (한국 의료부동산 표준)</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
                <div className="text-[11px] text-muted-foreground">하한선</div>
                <div className="text-xl font-bold">{won(pp.premium_low)}</div>
                <div className="text-[10px] text-muted-foreground mt-1">×{pp.multiplier_low}개월</div>
              </div>
              <div className="p-4 bg-emerald-100 dark:bg-emerald-950/40 rounded-xl">
                <div className="text-[11px] text-muted-foreground">상한선 (메디컬빌딩 기준)</div>
                <div className="text-xl font-bold">{won(pp.premium_high)}</div>
                <div className="text-[10px] text-muted-foreground mt-1">×{pp.multiplier_high}개월</div>
              </div>
            </div>
            <div className="mt-2 p-2 bg-muted/30 rounded text-[11px] text-muted-foreground">
              공식: <span className="font-semibold">{pp.formula}</span> — 동일 진료과 매물 협상 기준값
            </div>
          </div>
        )}

        {/* 데이터 출처 */}
        {sp?.data_source && (
          <div className="pt-3 border-t border-border text-[10px] text-muted-foreground">
            데이터 출처: {sp.data_source}
          </div>
        )}
      </div>
    </div>
  )
}
