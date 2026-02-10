'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import {
  ArrowLeft, MapPin, Building2, TrendingUp, Users, Target,
  ChevronRight, Download, AlertCircle, CheckCircle2, MinusCircle, Lock, LogIn, Award,
  Sparkles, Lightbulb, MapPinned
} from 'lucide-react'
import { simulationService } from '@/lib/api/services'
import { SimulationResponse } from '@/lib/api/client'
import { toast } from 'sonner'
import { useSimulationUnlock } from '@/lib/hooks/usePayment'
import { DEMO_RESULT } from './demo-data'
import PremiumAnalysis from './PremiumAnalysis'

const simulationSchema = z.object({
  address: z.string().min(5, '주소를 입력해주세요'),
  clinic_type: z.string().min(1, '진료과목을 선택해주세요'),
  size_pyeong: z.number().optional(),
  budget_million: z.number().optional(),
})

type SimulationForm = z.infer<typeof simulationSchema>

const clinicTypes = [
  '내과', '정형외과', '피부과', '성형외과', '이비인후과',
  '소아청소년과', '안과', '치과', '신경외과', '산부인과',
  '비뇨의학과', '정신건강의학과', '재활의학과', '가정의학과'
]

// 무료 체험 상태는 서버에서 관리됨 (is_unlocked 필드)
// 클라이언트 localStorage 기반 우회 방지

// 스켈레톤 컴포넌트
function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-muted rounded ${className || ''}`} />
  )
}

// 시뮬레이션 결과 스켈레톤 UI
function SimulationResultSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Progress Indicator */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <svg className="w-12 h-12 animate-spin" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12" cy="12" r="10"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
              />
              <path
                className="opacity-75 text-blue-600"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">AI가 분석 중입니다...</h3>
            <p className="text-sm text-blue-600 dark:text-blue-400">심평원, 국토부, 상권 데이터를 종합 분석하고 있습니다</p>
          </div>
        </div>
        {/* Progress Steps */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          {['상권 분석', '경쟁 현황', '매출 예측', '리포트 생성'].map((step, index) => (
            <div key={step} className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium mb-1 ${
                index === 0
                  ? 'bg-blue-600 text-white animate-pulse'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {index + 1}
              </div>
              <span className="text-xs text-muted-foreground text-center">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendation Skeleton */}
      <div className="rounded-xl p-6 border border-border bg-muted/30">
        <div className="flex items-center gap-3 mb-3">
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* Main Stats Grid Skeleton */}
      <div className="grid md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-6">
            <Skeleton className="h-4 w-24 mb-4" />
            <Skeleton className="h-10 w-32 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
        ))}
      </div>

      {/* ROI Card Skeleton */}
      <div className="bg-muted rounded-xl p-6">
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-10 w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Competition & Demographics Skeleton */}
      <div className="grid md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Skeleton className="w-5 h-5 rounded" />
              <Skeleton className="h-5 w-24" />
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Helper functions (outside component for better parsing)
function getRecommendationStyle(recommendation: string): string {
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

function getRecommendationText(recommendation: string): string {
  switch (recommendation) {
    case 'VERY_POSITIVE':
      return '매우 긍정적'
    case 'POSITIVE':
      return '긍정적'
    case 'NEUTRAL':
      return '보통'
    case 'NEGATIVE':
      return '부정적'
    case 'VERY_NEGATIVE':
      return '매우 부정적'
    default:
      return recommendation
  }
}

function getRecommendationIcon(recommendation: string): React.ReactNode {
  switch (recommendation) {
    case 'VERY_POSITIVE':
    case 'POSITIVE':
      return <CheckCircle2 className="w-5 h-5" />
    case 'NEUTRAL':
      return <MinusCircle className="w-5 h-5" />
    case 'NEGATIVE':
    case 'VERY_NEGATIVE':
      return <AlertCircle className="w-5 h-5" />
    default:
      return null
  }
}

function formatCurrency(value: number): string {
  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(1)}억원`
  }
  return `${(value / 10000).toLocaleString()}만원`
}

export default function SimulatePage() {
  const [result, setResult] = useState<SimulationResponse | null>(null)
  const [isAuthRequired, setIsAuthRequired] = useState(false)
  const [isUnlocked, setIsUnlocked] = useState(false)

  // 데모 모드 체크 (URL에 ?demo=true 있으면 샘플 데이터 로드)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('demo') === 'true') {
        setResult(DEMO_RESULT)
        setIsUnlocked(true)
        toast.success('데모 모드: 샘플 시뮬레이션 결과를 표시합니다')
      }
    }
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SimulationForm>({
    resolver: zodResolver(simulationSchema),
  })

  const mutation = useMutation({
    mutationFn: simulationService.create,
    onSuccess: (data) => {
      setResult(data)
      setIsAuthRequired(false)

      // 서버에서 is_unlocked 상태를 반환 (무료 체험/결제 상태 반영)
      const unlocked = data.is_unlocked ?? false
      setIsUnlocked(unlocked)

      if (unlocked) {
        toast.success('시뮬레이션이 완료되었습니다!')
      } else {
        toast.success('시뮬레이션이 완료되었습니다! 전체 결과를 확인하려면 결제가 필요합니다.')
      }
    },
    onError: (error: any) => {
      const status = error.response?.status || error.status
      // CORS 에러나 인증 에러 모두 로그인 필요로 처리
      if (status === 403 || status === 401 || error.message?.includes('403') || error.message?.includes('Network Error')) {
        setIsAuthRequired(true)
      } else {
        toast.error(error.response?.data?.detail || '시뮬레이션에 실패했습니다.')
      }
    },
  })

  // 결제 훅 사용
  const { unlockSimulation, isLoading: isPaymentLoading } = useSimulationUnlock()

  // 결제 처리 (잠금해제)
  const handleUnlock = async () => {
    if (!result?.simulation_id) {
      // 데모 모드: 결제 없이 바로 잠금해제 (실제 시뮬레이션 ID가 없는 경우)
      toast.success('결과가 잠금해제되었습니다!')
      setIsUnlocked(true)
      return
    }

    // 실제 결제 플로우 - 서버에서 받은 금액 사용
    await unlockSimulation(
      result.simulation_id,
      () => setIsUnlocked(true),
      result.unlock_price ?? 9900
    )
  }

  const onSubmit = (data: SimulationForm) => {
    mutation.mutate(data)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-background" />
                </div>
                <span className="text-lg font-semibold text-foreground">OpenSim</span>
              </div>
            </div>
            <span className="text-sm text-muted-foreground">개원 시뮬레이터</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {mutation.isPending ? (
          /* Loading Skeleton */
          <SimulationResultSkeleton />
        ) : isAuthRequired ? (
          /* Login Required */
          <div className="card p-12 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">로그인이 필요합니다</h3>
            <p className="text-muted-foreground mb-6">
              개원 시뮬레이션은 로그인한 사용자만 이용할 수 있습니다.<br />
              로그인 후 AI 기반 개원 분석을 받아보세요.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/login" className="btn-primary">
                <LogIn className="w-4 h-4" />
                로그인
              </Link>
              <Link href="/register" className="btn-secondary">
                회원가입
              </Link>
            </div>
            <button
              onClick={() => setIsAuthRequired(false)}
              className="mt-4 text-sm text-muted-foreground hover:text-foreground"
            >
              다시 시도
            </button>
          </div>
        ) : !result ? (
          /* Form Section */
          <div className="card p-8 md:p-12">
            <div className="max-w-xl mx-auto">
              <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">
                3분 개원 시뮬레이션
              </h1>
              <p className="text-muted-foreground mb-8">
                주소와 진료과목만 입력하면 예상 매출, 비용, 손익분기점을 분석해드립니다.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Address */}
                <div>
                  <label className="label mb-2 block">
                    개원 예정 주소 *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      {...register('address')}
                      type="text"
                      placeholder="예: 서울시 강남구 역삼동 123-45"
                      className="input pl-12"
                    />
                  </div>
                  {errors.address && (
                    <p className="mt-2 text-sm text-red-500">{errors.address.message}</p>
                  )}
                </div>

                {/* Clinic Type */}
                <div>
                  <label className="label mb-2 block">
                    진료과목 *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <select
                      {...register('clinic_type')}
                      className="select pl-12"
                    >
                      <option value="">진료과목 선택</option>
                      {clinicTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.clinic_type && (
                    <p className="mt-2 text-sm text-red-500">{errors.clinic_type.message}</p>
                  )}
                </div>

                {/* Optional Fields */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="label mb-2 block">
                      면적 (평) <span className="text-muted-foreground font-normal">선택</span>
                    </label>
                    <input
                      {...register('size_pyeong', { valueAsNumber: true })}
                      type="number"
                      placeholder="예: 30"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label mb-2 block">
                      예산 (백만원) <span className="text-muted-foreground font-normal">선택</span>
                    </label>
                    <input
                      {...register('budget_million', { valueAsNumber: true })}
                      type="number"
                      placeholder="예: 500"
                      className="input"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="btn-primary w-full h-12 text-base"
                >
                  {mutation.isPending ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      분석 중...
                    </>
                  ) : (
                    <>
                      시뮬레이션 시작
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                심평원, 국토교통부, 소상공인진흥공단 데이터 기반 분석
              </p>
            </div>
          </div>
        ) : (
          /* Results Section */
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">시뮬레이션 결과</h1>
                <p className="text-muted-foreground">{result.address} · {result.clinic_type}</p>
              </div>
              <button
                onClick={() => {
                  setResult(null)
                  setIsUnlocked(false)
                }}
                className="btn-ghost"
              >
                새로운 시뮬레이션
              </button>
            </div>

            {/* 잠금해제 상태 배너 또는 결제 CTA */}
            {isUnlocked ? (
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <span className="font-medium text-green-800 dark:text-green-200">
                    전체 결과 열람 가능
                  </span>
                  <span className="text-green-700 dark:text-green-300 ml-2">
                    모든 분석 결과를 확인할 수 있습니다.
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-foreground">일부 결과가 잠겨있습니다</span>
                    <span className="text-sm text-muted-foreground ml-2">아래 무료 요약을 먼저 확인해보세요</span>
                  </div>
                  <button
                    onClick={handleUnlock}
                    disabled={isPaymentLoading}
                    className="btn-primary text-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    {(result?.unlock_price ?? 9900).toLocaleString()}원 잠금해제
                  </button>
                </div>
              </div>
            )}

            {/* Recommendation Card - 무료로 제공되는 핵심 인사이트 */}
            <div className={`rounded-xl p-6 border ${getRecommendationStyle(result.recommendation)}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  {getRecommendationIcon(result.recommendation)}
                  <span className="font-semibold text-lg">
                    개원 추천: {getRecommendationText(result.recommendation)}
                  </span>
                </div>
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                  무료 제공
                </span>
              </div>
              <p className="opacity-80">{result.recommendation_reason}</p>
              <div className="mt-4 flex items-center gap-3">
                <span className="badge-default">
                  신뢰도 {result.confidence_score}%
                </span>
                <span className="text-xs text-muted-foreground">
                  심평원 + 국토부 데이터 기반
                </span>
              </div>
            </div>

            {/* 무료 요약 정보 카드 - 핵심 4개만 */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl p-5 border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800 dark:text-green-200">무료 미리보기 분석 결과</span>
                </div>
                <span className="text-xs bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">4개 항목 공개</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-white/60 dark:bg-black/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {result.competition.same_dept_count}개
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400">동일과 경쟁</div>
                </div>
                <div className="p-3 bg-white/60 dark:bg-black/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {result.competition.total_clinic_count}개
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400">전체 의료기관</div>
                </div>
                <div className="p-3 bg-white/60 dark:bg-black/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {(result.demographics.population_1km / 1000).toFixed(1)}만
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400">1km 인구</div>
                </div>
                <div className="p-3 bg-white/60 dark:bg-black/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {(result.demographics.floating_population_daily / 1000).toFixed(0)}천
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400">일 유동인구</div>
                </div>
              </div>
            </div>

            {/* 입지/교통 기본 정보 - 잠금 */}
            {isUnlocked && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-foreground flex items-center gap-2">
                      <MapPinned className="w-4 h-4 text-blue-500" />
                      입지 기본 점수
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-2 bg-secondary rounded-lg">
                      <div className="text-xl font-bold text-blue-600">{result.location_analysis?.transit_score || 75}</div>
                      <div className="text-xs text-muted-foreground">교통 접근성</div>
                    </div>
                    <div className="text-center p-2 bg-secondary rounded-lg">
                      <div className="text-xl font-bold text-purple-600">{result.location_analysis?.commercial_score || 70}</div>
                      <div className="text-xs text-muted-foreground">상권 점수</div>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-muted-foreground">
                    {result.location_analysis?.subway_stations?.[0] && (
                      <p>• {result.location_analysis.subway_stations[0].name} {result.location_analysis.subway_stations[0].distance_m}m</p>
                    )}
                    <p>• 버스정류장 {result.location_analysis?.bus_stops_count || 5}개 인근</p>
                  </div>
                </div>
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-foreground flex items-center gap-2">
                      <Users className="w-4 h-4 text-teal-500" />
                      타겟 환자층 요약
                    </h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">40대 이상 비율</span>
                      <span className="font-medium">{(result.demographics.age_40_plus_ratio * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">주요 타겟</span>
                      <span className="font-medium">30-50대 직장인</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">상권 특성</span>
                      <span className="font-medium">{result.location_analysis?.commercial_district_type || '복합상권'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 무료 - AI 한줄 요약 */}
            <div className="card p-5 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-foreground flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  AI 한줄 요약
                </h3>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">무료</span>
              </div>
              <p className="text-sm text-foreground">{result.recommendation_reason}</p>
              {!isUnlocked && (
                <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  전체 SWOT 분석, 차별화 전략, 마케팅 제안은 프리미엄에서 확인
                </p>
              )}
            </div>

            {/* 중간 결제 유도 CTA - 무료 영역 끝, 잠금 영역 시작 전 */}
            {!isUnlocked && (
              <div className="relative overflow-hidden rounded-2xl border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 p-8">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-4">
                    <Lock className="w-4 h-4" />
                    50개+ 상세 분석 항목을 확인하세요
                  </div>
                  <h3 className="text-xl font-bold text-foreground">
                    아래 모든 분석 결과를 잠금해제하세요
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-foreground bg-white/60 dark:bg-black/20 rounded-lg p-3">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span>정확한 예상 매출/비용/순이익</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground bg-white/60 dark:bg-black/20 rounded-lg p-3">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span>ROI 및 손익분기점</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground bg-white/60 dark:bg-black/20 rounded-lg p-3">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span>경쟁 병원 상세 분석</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground bg-white/60 dark:bg-black/20 rounded-lg p-3">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span>3개년 시나리오 + 현금흐름</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <button
                    onClick={handleUnlock}
                    disabled={isPaymentLoading}
                    className="btn-primary text-base px-8 py-3 shadow-lg shadow-blue-500/25"
                  >
                    {isPaymentLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        결제 처리중...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        {(result?.unlock_price ?? 9900).toLocaleString()}원 결제하고 잠금해제
                      </>
                    )}
                  </button>
                  <span className="text-sm text-muted-foreground">
                    또는 <Link href="/subscribe" className="text-blue-600 hover:underline font-medium">프리미엄 구독</Link>으로 무제한 이용
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    9,900원으로 개원 컨설팅 수백만원 가치의 분석을 받아보세요
                  </p>
                </div>
              </div>
            )}

            {/* Main Stats Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Revenue Card */}
              <div className="card p-6 relative overflow-hidden">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">예상 월 매출</h3>
                {isUnlocked ? (
                  <>
                    <div className="text-3xl font-bold text-foreground mb-2">
                      {formatCurrency(result.estimated_monthly_revenue.avg)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(result.estimated_monthly_revenue.min)} ~ {formatCurrency(result.estimated_monthly_revenue.max)}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-muted-foreground/40 mb-2">****만원</div>
                    <div className="text-sm text-muted-foreground/40">****만원 ~ ****만원</div>
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent rounded-xl" />
                  </>
                )}
              </div>

              {/* Cost Card */}
              <div className="card p-6 relative overflow-hidden">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">예상 월 비용</h3>
                {isUnlocked ? (
                  <>
                    <div className="text-3xl font-bold text-foreground mb-2">
                      {formatCurrency(result.estimated_monthly_cost.total)}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>임대료: {formatCurrency(result.estimated_monthly_cost.rent)}</div>
                      <div>인건비: {formatCurrency(result.estimated_monthly_cost.labor)}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-muted-foreground/40 mb-2">****만원</div>
                    <div className="text-sm text-muted-foreground/40 space-y-1">
                      <div>임대료: ****만원</div>
                      <div>인건비: ****만원</div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent rounded-xl" />
                  </>
                )}
              </div>

              {/* Profit Card */}
              <div className="card p-6 relative overflow-hidden">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">예상 월 순이익</h3>
                {isUnlocked ? (
                  <>
                    <div className={`text-3xl font-bold mb-2 ${result.profitability.monthly_profit_avg >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(result.profitability.monthly_profit_avg)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      손익분기점: {result.profitability.breakeven_months}개월
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-muted-foreground/40 mb-2">****만원</div>
                    <div className="text-sm text-muted-foreground/40">손익분기점: **개월</div>
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent rounded-xl" />
                  </>
                )}
              </div>
            </div>

            {/* ROI Card */}
            <div className="bg-foreground text-background rounded-xl p-6 relative overflow-hidden">
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm opacity-70 mb-1">연 예상 ROI</div>
                  <div className="text-3xl font-bold">
                    {isUnlocked ? `${result.profitability.annual_roi_percent}%` : (
                      <span className="blur-md select-none">{result.profitability.annual_roi_percent}%</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm opacity-70 mb-1">손익분기점</div>
                  <div className="text-3xl font-bold">
                    {isUnlocked ? `${result.profitability.breakeven_months}개월` : (
                      <span className="blur-md select-none">{result.profitability.breakeven_months}개월</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm opacity-70 mb-1">경쟁 병원</div>
                  <div className="text-3xl font-bold">{result.competition.same_dept_count}개</div>
                </div>
              </div>
              {!isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-foreground/90">
                  <button onClick={handleUnlock} className="btn-secondary bg-background text-foreground hover:bg-background/90">
                    <Lock className="w-4 h-4" />
                    잠금해제
                  </button>
                </div>
              )}
            </div>

            {/* Competition & Demographics */}
            {isUnlocked ? (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Competition - 잠금해제 */}
                <div className="card p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    경쟁 현황
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">분석 반경</span>
                      <span className="font-medium">{result.competition.radius_m}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">동일 진료과 병원</span>
                      <span className="font-medium">{result.competition.same_dept_count}개</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">전체 의료기관</span>
                      <span className="font-medium">{result.competition.total_clinic_count}개</span>
                    </div>
                  </div>
                  {result.competitors.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <h4 className="text-sm font-medium text-foreground mb-3">주요 경쟁 병원</h4>
                      <div className="space-y-2">
                        {result.competitors.slice(0, 3).map((comp, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{comp.name}</span>
                            <span className="text-muted-foreground">{comp.distance_m}m</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Demographics - 잠금해제 */}
                <div className="card p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    인구 현황
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">반경 1km 인구</span>
                      <span className="font-medium">{result.demographics.population_1km.toLocaleString()}명</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">40대 이상 비율</span>
                      <span className="font-medium">{(result.demographics.age_40_plus_ratio * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">일 유동인구</span>
                      <span className="font-medium">{result.demographics.floating_population_daily.toLocaleString()}명</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6 relative">
                {/* Competition - 잠금 */}
                <div className="card p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    경쟁 현황
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">분석 반경</span>
                      <span className="font-medium text-muted-foreground/40">***m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">동일 진료과 병원</span>
                      <span className="font-medium text-muted-foreground/40">**개</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">전체 의료기관</span>
                      <span className="font-medium text-muted-foreground/40">**개</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border">
                    <h4 className="text-sm font-medium text-foreground mb-3">주요 경쟁 병원</h4>
                    <div className="space-y-2 text-sm text-muted-foreground/40">
                      <div className="flex justify-between"><span>OO***의원</span><span>***m</span></div>
                      <div className="flex justify-between"><span>XX***과</span><span>***m</span></div>
                    </div>
                  </div>
                </div>

                {/* Demographics - 잠금 */}
                <div className="card p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    인구 현황
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">반경 1km 인구</span>
                      <span className="font-medium text-muted-foreground/40">*****명</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">40대 이상 비율</span>
                      <span className="font-medium text-muted-foreground/40">**.*%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">일 유동인구</span>
                      <span className="font-medium text-muted-foreground/40">*****명</span>
                    </div>
                  </div>
                </div>

                {/* 잠금 오버레이 */}
                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <button onClick={handleUnlock} className="btn-primary">
                    <Lock className="w-4 h-4" />
                    상세 분석 잠금해제
                  </button>
                </div>
              </div>
            )}

            {/* Region Rank Card */}
            {result.region_stats && (
              <div className="card p-6 relative overflow-hidden">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  지역 순위 (전국 {result.clinic_type} 기준)
                </h3>
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-violet-50 rounded-xl">
                    <div className="text-3xl font-bold text-violet-600">
                      {isUnlocked ? (
                        <>
                          {result.region_stats.region_rank || '-'}
                          <span className="text-lg font-normal text-violet-400">위</span>
                        </>
                      ) : (
                        <span className="blur-md select-none">
                          {result.region_stats.region_rank || '-'}
                          <span className="text-lg font-normal">위</span>
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-violet-600 mt-1">
                      전국 {result.region_stats.total_regions}개 시도 중
                    </div>
                  </div>
                  <div className="text-center p-4 bg-secondary rounded-xl">
                    <div className="text-2xl font-bold text-foreground">
                      {isUnlocked ? (
                        <>상위 {result.region_stats.rank_percentile?.toFixed(0) || '-'}%</>
                      ) : (
                        <span className="blur-md select-none">상위 {result.region_stats.rank_percentile?.toFixed(0) || '-'}%</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">순위 백분위</div>
                  </div>
                  <div className="text-center p-4 bg-secondary rounded-xl">
                    <div className={`text-2xl font-bold ${result.region_stats.vs_national_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {isUnlocked ? (
                        <>{result.region_stats.vs_national_percent >= 0 ? '+' : ''}{result.region_stats.vs_national_percent}%</>
                      ) : (
                        <span className="blur-md select-none">{result.region_stats.vs_national_percent >= 0 ? '+' : ''}{result.region_stats.vs_national_percent}%</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">전국 평균 대비</div>
                  </div>
                  <div className="text-center p-4 bg-secondary rounded-xl">
                    <div className="text-2xl font-bold text-foreground">
                      {isUnlocked ? (
                        formatCurrency(result.region_stats.national_avg_revenue)
                      ) : (
                        <span className="blur-md select-none">{formatCurrency(result.region_stats.national_avg_revenue)}</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">전국 평균 매출</div>
                  </div>
                </div>
                {!isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
                    <button onClick={handleUnlock} className="btn-primary">
                      <Lock className="w-4 h-4" />
                      지역 분석 잠금해제
                    </button>
                  </div>
                )}
              </div>
            )}


            {/* Premium Detail Analysis */}
            {isUnlocked && <PremiumAnalysis result={result} />}

            {/* CTA */}
            {isUnlocked ? (
              <div className="card p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-foreground">PDF 리포트 다운로드</h3>
                  <p className="text-muted-foreground">AI 분석이 포함된 PDF 리포트를 받아보세요</p>
                </div>
                <Link href={`/simulate/report/${result.simulation_id}`} className="btn-primary">
                  <Download className="w-5 h-5" />
                  PDF 리포트 다운로드
                </Link>
              </div>
            ) : (
              <div className="card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-foreground">전체 분석 결과 확인하기</h3>
                    <p className="text-muted-foreground">
                      정확한 예상 매출, ROI, 경쟁 분석 등 모든 데이터를 확인하세요
                    </p>
                  </div>
                  <button
                    onClick={handleUnlock}
                    disabled={isPaymentLoading}
                    className="btn-primary text-lg px-8 py-3"
                  >
                    {isPaymentLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        결제 처리중...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        {(result?.unlock_price ?? 9900).toLocaleString()}원 결제하고 전체 결과 보기
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
