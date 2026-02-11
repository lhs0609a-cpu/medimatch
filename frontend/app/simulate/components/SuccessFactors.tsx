'use client'

import React from 'react'
import { CheckCircle2, AlertTriangle, XCircle, Lightbulb, Lock } from 'lucide-react'
import { SimulationResponse } from '@/lib/api/client'

interface SuccessFactorsProps {
  result: SimulationResponse
}

type FactorLevel = 'good' | 'caution' | 'risk'

interface Factor {
  label: string
  detail: string
  level: FactorLevel
}

function analyzeFreeFactors(result: SimulationResponse): Factor[] {
  const factors: Factor[] = []
  const { competition, demographics, estimated_monthly_revenue, profitability } = result

  // Competition
  if (competition.same_dept_count === 0) {
    factors.push({ label: '경쟁 없음 (블루오션)', detail: `반경 ${competition.radius_m}m 내 동일과 0개`, level: 'good' })
  } else if (competition.same_dept_count <= 3) {
    factors.push({ label: '경쟁 적음', detail: `동일과 ${competition.same_dept_count}개 — 유리한 경쟁 환경`, level: 'good' })
  } else if (competition.same_dept_count <= 7) {
    factors.push({ label: '보통 경쟁', detail: `동일과 ${competition.same_dept_count}개 — 차별화 전략 필요`, level: 'caution' })
  } else {
    factors.push({ label: '치열한 경쟁', detail: `동일과 ${competition.same_dept_count}개 — 포화 시장`, level: 'risk' })
  }

  // Population
  const pop = demographics.population_1km
  if (pop >= 50000) {
    factors.push({ label: '높은 인구 밀도', detail: `1km 내 ${(pop / 10000).toFixed(1)}만명 — 환자 확보 유리`, level: 'good' })
  } else if (pop >= 20000) {
    factors.push({ label: '적정 인구', detail: `1km 내 ${(pop / 10000).toFixed(1)}만명`, level: 'good' })
  } else {
    factors.push({ label: '낮은 인구 밀도', detail: `1km 내 ${pop.toLocaleString()}명 — 환자 확보 어려울 수 있음`, level: 'caution' })
  }

  // Floating population
  const floating = demographics.floating_population_daily
  if (floating >= 80000) {
    factors.push({ label: '풍부한 유동인구', detail: `일 ${(floating / 10000).toFixed(1)}만명 — 높은 노출도`, level: 'good' })
  } else if (floating >= 40000) {
    factors.push({ label: '적정 유동인구', detail: `일 ${(floating / 10000).toFixed(1)}만명`, level: 'good' })
  } else {
    factors.push({ label: '낮은 유동인구', detail: `일 ${(floating / 10000).toFixed(1)}만명 — 마케팅 강화 필요`, level: 'caution' })
  }

  // Age ratio
  const ageRatio = demographics.age_40_plus_ratio
  if (ageRatio >= 0.45) {
    factors.push({ label: '높은 40대+ 비율', detail: `${Math.round(ageRatio * 100)}% — 의료 수요 높은 연령대`, level: 'good' })
  } else if (ageRatio >= 0.30) {
    factors.push({ label: '적정 40대+ 비율', detail: `${Math.round(ageRatio * 100)}%`, level: 'good' })
  } else {
    factors.push({ label: '젊은 인구 비율 높음', detail: `40대+ ${Math.round(ageRatio * 100)}% — 진료과에 따라 긍정적`, level: 'caution' })
  }

  // Profitability
  if (profitability.monthly_profit_avg > 0) {
    factors.push({ label: '흑자 예상', detail: `월 ${Math.round(profitability.monthly_profit_avg / 10000).toLocaleString()}만원 순이익`, level: 'good' })
  } else {
    factors.push({ label: '적자 위험', detail: '예상 비용이 매출을 초과', level: 'risk' })
  }

  // Breakeven
  if (profitability.breakeven_months <= 12) {
    factors.push({ label: '빠른 투자 회수', detail: `${profitability.breakeven_months}개월 내 손익분기`, level: 'good' })
  } else if (profitability.breakeven_months <= 24) {
    factors.push({ label: '적정 투자 회수', detail: `${profitability.breakeven_months}개월 내 손익분기`, level: 'caution' })
  } else {
    factors.push({ label: '긴 투자 회수기간', detail: `${profitability.breakeven_months}개월 — 재무 리스크`, level: 'risk' })
  }

  // Revenue vs national
  if (result.region_stats) {
    const vs = result.region_stats.vs_national_percent
    if (vs >= 10) {
      factors.push({ label: '전국 평균 이상 매출', detail: `전국 대비 +${vs}%`, level: 'good' })
    } else if (vs >= 0) {
      factors.push({ label: '전국 평균 수준', detail: `전국 대비 +${vs}%`, level: 'good' })
    } else {
      factors.push({ label: '전국 평균 미만', detail: `전국 대비 ${vs}%`, level: 'caution' })
    }
  }

  // Confidence
  if (result.confidence_score >= 80) {
    factors.push({ label: '높은 분석 신뢰도', detail: `${result.confidence_score}/100`, level: 'good' })
  } else if (result.confidence_score >= 60) {
    factors.push({ label: '보통 신뢰도', detail: `${result.confidence_score}/100 — 추가 검증 권장`, level: 'caution' })
  }

  return factors
}

const levelConfig = {
  good: {
    icon: <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />,
    bg: 'bg-green-50 dark:bg-green-950/20',
    border: 'border-green-200/50 dark:border-green-800/50',
  },
  caution: {
    icon: <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />,
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-200/50 dark:border-amber-800/50',
  },
  risk: {
    icon: <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />,
    bg: 'bg-red-50 dark:bg-red-950/20',
    border: 'border-red-200/50 dark:border-red-800/50',
  },
}

export default function SuccessFactors({ result }: SuccessFactorsProps) {
  const factors = analyzeFreeFactors(result)
  const goodCount = factors.filter((f) => f.level === 'good').length
  const cautionCount = factors.filter((f) => f.level === 'caution').length
  const riskCount = factors.filter((f) => f.level === 'risk').length
  const score = Math.round((goodCount / factors.length) * 100)

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Lightbulb className="w-5 h-5 text-yellow-500" />
        <h3 className="font-semibold text-foreground">개원 성공 요인 분석</h3>
      </div>

      {/* Score Summary */}
      <div className="flex items-center gap-4 mb-5 p-4 bg-secondary/50 rounded-xl">
        <div className="text-center">
          <div className="text-3xl font-bold text-foreground">{score}<span className="text-lg font-normal text-muted-foreground">점</span></div>
          <div className="text-[11px] text-muted-foreground">성공 지수</div>
        </div>
        <div className="flex-1 flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
            <span className="font-bold text-green-600">{goodCount}</span>
            <span className="text-muted-foreground">긍정</span>
          </span>
          <span className="flex items-center gap-1.5 text-xs">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-bold text-amber-600">{cautionCount}</span>
            <span className="text-muted-foreground">주의</span>
          </span>
          {riskCount > 0 && (
            <span className="flex items-center gap-1.5 text-xs">
              <XCircle className="w-3.5 h-3.5 text-red-500" />
              <span className="font-bold text-red-600">{riskCount}</span>
              <span className="text-muted-foreground">위험</span>
            </span>
          )}
        </div>
      </div>

      {/* Factor Grid */}
      <div className="grid sm:grid-cols-2 gap-2">
        {factors.map((factor, idx) => {
          const config = levelConfig[factor.level]
          return (
            <div
              key={idx}
              className={`flex items-start gap-3 p-3 rounded-xl border ${config.bg} ${config.border}`}
            >
              {config.icon}
              <div>
                <div className="text-sm font-medium text-foreground">{factor.label}</div>
                <div className="text-xs text-muted-foreground">{factor.detail}</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4 pt-3 border-t border-border">
        <Lock className="w-3 h-3" />
        <span>SWOT 분석 · 리스크 대응 전략 · AI 맞춤 전략은 프리미엄에서</span>
      </div>
    </div>
  )
}
