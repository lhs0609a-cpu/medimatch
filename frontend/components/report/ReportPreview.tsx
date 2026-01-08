'use client'

import { useState } from 'react'
import {
  FileText, TrendingUp, Users, Target, MapPin, Building2,
  CheckCircle2, AlertCircle, MinusCircle, Lock, Star,
  ChevronDown, ChevronUp
} from 'lucide-react'
import { SimulationResponse } from '@/lib/api/client'

interface ReportPreviewProps {
  simulation: SimulationResponse
  isPurchased: boolean
  onPurchase?: () => void
  isLoading?: boolean
}

export default function ReportPreview({
  simulation,
  isPurchased,
  onPurchase,
  isLoading = false
}: ReportPreviewProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    summary: true,
    revenue: true,
    competition: false,
    demographics: false,
    ai: false,
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const getRecommendationStyle = (recommendation: string) => {
    switch (recommendation) {
      case 'VERY_POSITIVE':
      case 'POSITIVE':
        return 'bg-green-50 text-green-900 border-green-200'
      case 'NEUTRAL':
        return 'bg-amber-50 text-amber-900 border-amber-200'
      case 'NEGATIVE':
      case 'VERY_NEGATIVE':
        return 'bg-red-50 text-red-900 border-red-200'
      default:
        return 'bg-secondary text-secondary-foreground border-border'
    }
  }

  const getRecommendationText = (recommendation: string) => {
    const texts: Record<string, string> = {
      VERY_POSITIVE: '매우 긍정적',
      POSITIVE: '긍정적',
      NEUTRAL: '보통',
      NEGATIVE: '부정적',
      VERY_NEGATIVE: '매우 부정적'
    }
    return texts[recommendation] || recommendation
  }

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'VERY_POSITIVE':
      case 'POSITIVE':
        return <CheckCircle2 className="w-5 h-5" />
      case 'NEUTRAL':
        return <MinusCircle className="w-5 h-5" />
      default:
        return <AlertCircle className="w-5 h-5" />
    }
  }

  const formatCurrency = (value: number) => {
    if (value >= 100000000) {
      return `${(value / 100000000).toFixed(1)}억원`
    }
    return `${(value / 10000).toLocaleString()}만원`
  }

  const SectionHeader = ({
    title,
    icon: Icon,
    section,
    locked = false
  }: {
    title: string
    icon: any
    section: string
    locked?: boolean
  }) => (
    <button
      onClick={() => !locked && toggleSection(section)}
      className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${
        locked
          ? 'bg-secondary/50 cursor-not-allowed'
          : 'bg-secondary hover:bg-secondary/80'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          locked ? 'bg-muted' : 'bg-foreground'
        }`}>
          {locked ? (
            <Lock className="w-5 h-5 text-muted-foreground" />
          ) : (
            <Icon className="w-5 h-5 text-background" />
          )}
        </div>
        <span className={`font-medium ${locked ? 'text-muted-foreground' : 'text-foreground'}`}>
          {title}
        </span>
        {locked && (
          <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
            프리미엄
          </span>
        )}
      </div>
      {!locked && (
        expandedSections[section] ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )
      )}
    </button>
  )

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="card p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 bg-foreground rounded-2xl flex items-center justify-center">
            <FileText className="w-8 h-8 text-background" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground mb-1">
              AI 상권분석 리포트
            </h1>
            <p className="text-muted-foreground">
              {simulation.address} | {simulation.clinic_type}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                getRecommendationStyle(simulation.recommendation)
              }`}>
                {getRecommendationIcon(simulation.recommendation)}
                {getRecommendationText(simulation.recommendation)}
              </span>
              <span className="text-sm text-muted-foreground">
                신뢰도 {simulation.confidence_score}%
              </span>
            </div>
          </div>
        </div>

        {!isPurchased && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">프리미엄 리포트 잠금 해제</h3>
                <p className="text-sm text-muted-foreground">
                  AI 심층 분석, SWOT 분석, 리스크 요인, 맞춤 전략 포함
                </p>
              </div>
              <button
                onClick={onPurchase}
                disabled={isLoading}
                className="btn-primary whitespace-nowrap"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    처리중...
                  </span>
                ) : (
                  '3만원 결제하고 잠금해제'
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Summary Section */}
      <div className="card overflow-hidden">
        <SectionHeader title="종합 요약" icon={TrendingUp} section="summary" />
        {expandedSections.summary && (
          <div className="p-6 border-t border-border">
            <div className={`rounded-xl p-4 mb-4 ${getRecommendationStyle(simulation.recommendation)}`}>
              <p className="font-medium">{simulation.recommendation_reason}</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-secondary rounded-xl">
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(simulation.estimated_monthly_revenue.avg)}
                </div>
                <div className="text-sm text-muted-foreground">예상 월매출</div>
              </div>
              <div className="text-center p-4 bg-secondary rounded-xl">
                <div className={`text-2xl font-bold ${
                  simulation.profitability.monthly_profit_avg >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(simulation.profitability.monthly_profit_avg)}
                </div>
                <div className="text-sm text-muted-foreground">예상 월순이익</div>
              </div>
              <div className="text-center p-4 bg-secondary rounded-xl">
                <div className="text-2xl font-bold text-foreground">
                  {simulation.profitability.breakeven_months}개월
                </div>
                <div className="text-sm text-muted-foreground">손익분기점</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Revenue Section */}
      <div className="card overflow-hidden">
        <SectionHeader title="매출/비용 상세 분석" icon={Building2} section="revenue" />
        {expandedSections.revenue && (
          <div className="p-6 border-t border-border">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Revenue */}
              <div>
                <h4 className="font-medium text-foreground mb-3">예상 월 매출</h4>
                <div className="space-y-2">
                  <div className="flex justify-between p-3 bg-secondary rounded-lg">
                    <span className="text-muted-foreground">최소</span>
                    <span className="font-medium">{formatCurrency(simulation.estimated_monthly_revenue.min)}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                    <span className="text-green-700 dark:text-green-400">평균</span>
                    <span className="font-bold text-green-700 dark:text-green-400">
                      {formatCurrency(simulation.estimated_monthly_revenue.avg)}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-secondary rounded-lg">
                    <span className="text-muted-foreground">최대</span>
                    <span className="font-medium">{formatCurrency(simulation.estimated_monthly_revenue.max)}</span>
                  </div>
                </div>
              </div>

              {/* Cost */}
              <div>
                <h4 className="font-medium text-foreground mb-3">예상 월 비용</h4>
                <div className="space-y-2">
                  <div className="flex justify-between p-3 bg-secondary rounded-lg">
                    <span className="text-muted-foreground">임대료</span>
                    <span className="font-medium">{formatCurrency(simulation.estimated_monthly_cost.rent)}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-secondary rounded-lg">
                    <span className="text-muted-foreground">인건비</span>
                    <span className="font-medium">{formatCurrency(simulation.estimated_monthly_cost.labor)}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-secondary rounded-lg">
                    <span className="text-muted-foreground">공과금</span>
                    <span className="font-medium">{formatCurrency(simulation.estimated_monthly_cost.utilities)}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-secondary rounded-lg">
                    <span className="text-muted-foreground">기타</span>
                    <span className="font-medium">{formatCurrency(simulation.estimated_monthly_cost.other)}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                    <span className="text-red-700 dark:text-red-400">총 비용</span>
                    <span className="font-bold text-red-700 dark:text-red-400">
                      {formatCurrency(simulation.estimated_monthly_cost.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ROI Stats */}
            <div className="mt-6 p-4 bg-foreground text-background rounded-xl">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{simulation.profitability.annual_roi_percent}%</div>
                  <div className="text-sm opacity-70">연간 ROI</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{simulation.profitability.breakeven_months}개월</div>
                  <div className="text-sm opacity-70">손익분기</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{simulation.confidence_score}%</div>
                  <div className="text-sm opacity-70">신뢰도</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Competition Section */}
      <div className="card overflow-hidden">
        <SectionHeader title="경쟁 현황 분석" icon={Target} section="competition" />
        {expandedSections.competition && (
          <div className="p-6 border-t border-border">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-secondary rounded-xl">
                <div className="text-2xl font-bold text-foreground">
                  {simulation.competition.radius_m}m
                </div>
                <div className="text-sm text-muted-foreground">분석 반경</div>
              </div>
              <div className="text-center p-4 bg-secondary rounded-xl">
                <div className="text-2xl font-bold text-foreground">
                  {simulation.competition.same_dept_count}개
                </div>
                <div className="text-sm text-muted-foreground">동일 진료과</div>
              </div>
              <div className="text-center p-4 bg-secondary rounded-xl">
                <div className="text-2xl font-bold text-foreground">
                  {simulation.competition.total_clinic_count}개
                </div>
                <div className="text-sm text-muted-foreground">전체 의료기관</div>
              </div>
            </div>

            {simulation.competitors.length > 0 && (
              <>
                <h4 className="font-medium text-foreground mb-3">주요 경쟁 병원</h4>
                <div className="space-y-2">
                  {simulation.competitors.slice(0, 5).map((comp, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <div>
                        <div className="font-medium text-foreground">{comp.name}</div>
                        <div className="text-sm text-muted-foreground">{comp.clinic_type}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-foreground">{comp.distance_m}m</div>
                        {comp.est_monthly_revenue && (
                          <div className="text-sm text-muted-foreground">
                            월 {formatCurrency(comp.est_monthly_revenue)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Demographics Section */}
      <div className="card overflow-hidden">
        <SectionHeader title="인구 통계 분석" icon={Users} section="demographics" />
        {expandedSections.demographics && (
          <div className="p-6 border-t border-border">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-secondary rounded-xl">
                <div className="text-2xl font-bold text-foreground">
                  {simulation.demographics.population_1km.toLocaleString()}명
                </div>
                <div className="text-sm text-muted-foreground">반경 1km 인구</div>
              </div>
              <div className="text-center p-4 bg-secondary rounded-xl">
                <div className="text-2xl font-bold text-foreground">
                  {(simulation.demographics.age_40_plus_ratio * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">40대 이상 비율</div>
              </div>
              <div className="text-center p-4 bg-secondary rounded-xl">
                <div className="text-2xl font-bold text-foreground">
                  {simulation.demographics.floating_population_daily.toLocaleString()}명
                </div>
                <div className="text-sm text-muted-foreground">일 유동인구</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Analysis Section - Locked for non-purchased */}
      <div className="card overflow-hidden">
        <SectionHeader
          title="AI 심층 분석 (SWOT, 리스크, 전략)"
          icon={Star}
          section="ai"
          locked={!isPurchased}
        />
        {isPurchased && expandedSections.ai && simulation.ai_analysis && (
          <div className="p-6 border-t border-border">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div dangerouslySetInnerHTML={{ __html: simulation.ai_analysis }} />
            </div>
          </div>
        )}
        {!isPurchased && (
          <div className="p-6 border-t border-border bg-secondary/30">
            <div className="text-center py-8">
              <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="font-medium text-foreground mb-2">프리미엄 콘텐츠</h4>
              <p className="text-sm text-muted-foreground mb-4">
                AI가 분석한 SWOT 분석, 주요 리스크 요인,<br />
                맞춤형 성공 전략을 확인하세요.
              </p>
              <button onClick={onPurchase} className="btn-primary">
                3만원 결제하고 잠금해제
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
