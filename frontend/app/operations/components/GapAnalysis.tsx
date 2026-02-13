'use client'

import { AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { MonthlyRecord, ForecastData } from '../data/seed'

interface GapAnalysisProps {
  records: MonthlyRecord[]
  forecasts: ForecastData[]
}

export default function GapAnalysis({ records, forecasts }: GapAnalysisProps) {
  const gaps = forecasts
    .map((f) => {
      const actual = records.find((r) => r.month === f.month)
      if (!actual) return null
      const revenueGap = actual.revenue - f.predictedRevenue
      const revenueGapPct = f.predictedRevenue > 0 ? (revenueGap / f.predictedRevenue) * 100 : 0
      const patientGap = actual.patients - f.predictedPatients
      const patientGapPct = f.predictedPatients > 0 ? (patientGap / f.predictedPatients) * 100 : 0
      return {
        month: f.month,
        revenueGap,
        revenueGapPct,
        patientGap,
        patientGapPct,
        status: revenueGapPct >= 0 ? 'above' as const : revenueGapPct >= -10 ? 'close' as const : 'below' as const,
      }
    })
    .filter(Boolean) as NonNullable<ReturnType<typeof Array.prototype.map>[number]>[]

  const avgRevenueGapPct = gaps.length > 0
    ? gaps.reduce((s, g) => s + (g as any).revenueGapPct, 0) / gaps.length
    : 0

  const latestGap = gaps[gaps.length - 1] as any

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-foreground mb-4">갭 분석</h3>

      {gaps.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          실적 데이터를 입력하면 예측과의 차이를 분석합니다.
        </p>
      ) : (
        <div className="space-y-4">
          {/* Summary */}
          <div className={`p-4 rounded-xl ${
            avgRevenueGapPct >= 0
              ? 'bg-green-50 dark:bg-green-950/20'
              : avgRevenueGapPct >= -10
              ? 'bg-amber-50 dark:bg-amber-950/20'
              : 'bg-red-50 dark:bg-red-950/20'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {avgRevenueGapPct >= 0 ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : avgRevenueGapPct >= -10 ? (
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              <span className="font-semibold text-foreground">
                {avgRevenueGapPct >= 0 ? '예측 대비 초과 달성' : avgRevenueGapPct >= -10 ? '예측에 근접' : '예측 대비 미달'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              평균 매출 갭: <span className={`font-bold ${avgRevenueGapPct >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {avgRevenueGapPct >= 0 ? '+' : ''}{avgRevenueGapPct.toFixed(1)}%
              </span>
            </p>
          </div>

          {/* Monthly gaps */}
          <div className="space-y-2">
            {(gaps as any[]).map((gap) => (
              <div key={gap.month} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-foreground">
                    {gap.month.replace(/^\d{4}-/, '').replace(/^0/, '')}월
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">매출 갭</p>
                    <p className={`text-sm font-semibold flex items-center gap-1 ${
                      gap.revenueGap >= 0 ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {gap.revenueGap >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {gap.revenueGap >= 0 ? '+' : ''}{gap.revenueGap.toLocaleString()}만
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">환자수 갭</p>
                    <p className={`text-sm font-semibold ${
                      gap.patientGap >= 0 ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {gap.patientGap >= 0 ? '+' : ''}{gap.patientGap}명
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
