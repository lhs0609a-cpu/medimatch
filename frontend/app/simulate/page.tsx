'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import {
  ArrowLeft, MapPin, Building2, TrendingUp, Users, Target,
  ChevronRight, Download, AlertCircle, CheckCircle2, MinusCircle, Lock, LogIn, Award,
  Sparkles, Eye, EyeOff, Train, Car, Calendar, Shield, Lightbulb, BarChart3,
  PieChart, Activity, Clock, DollarSign, Briefcase, Heart, Star, Zap, TrendingDown,
  MapPinned, Building, Home, CircleDollarSign
} from 'lucide-react'
import { simulationService } from '@/lib/api/services'
import { SimulationResponse } from '@/lib/api/client'
import { toast } from 'sonner'
import { useSimulationUnlock } from '@/lib/hooks/usePayment'

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

// 블러된 값 표시 컴포넌트
function BlurredValue({ children, isBlurred }: { children: React.ReactNode; isBlurred: boolean }) {
  if (!isBlurred) return <>{children}</>
  return (
    <span className="relative inline-block">
      <span className="blur-md select-none">{children}</span>
      <span className="absolute inset-0 flex items-center justify-center">
        <Lock className="w-4 h-4 text-muted-foreground" />
      </span>
    </span>
  )
}

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

export default function SimulatePage() {
  const [result, setResult] = useState<SimulationResponse | null>(null)
  const [isAuthRequired, setIsAuthRequired] = useState(false)
  const [isUnlocked, setIsUnlocked] = useState(false)

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

  const getRecommendationIcon = (recommendation: string) => {
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

  const formatCurrency = (value: number) => {
    if (value >= 100000000) {
      return `${(value / 100000000).toFixed(1)}억원`
    }
    return `${(value / 10000).toLocaleString()}만원`
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
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Lock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">결과가 잠겨있습니다</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      정확한 예상 매출, 비용, 손익분기점 등 상세 분석 결과를 확인하세요.
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleUnlock}
                        disabled={isPaymentLoading}
                        className="btn-primary"
                      >
                        {isPaymentLoading ? (
                          <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            처리중...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            {(result?.unlock_price ?? 9900).toLocaleString()}원 결제하고 잠금해제
                          </>
                        )}
                      </button>
                      <span className="text-sm text-muted-foreground">
                        또는 <Link href="/subscribe" className="text-blue-600 hover:underline">프리미엄 구독</Link>으로 무제한 이용
                      </span>
                    </div>
                  </div>
                </div>

                {/* 무료 vs 유료 비교 테이블 */}
                <div className="mt-6 pt-6 border-t border-amber-200 dark:border-amber-800">
                  <div className="text-sm font-medium text-foreground mb-4">무료 미리보기 vs 전체 분석 비교</div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {/* 무료 */}
                    <div className="p-4 bg-white/50 dark:bg-black/20 rounded-xl">
                      <div className="font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <EyeOff className="w-4 h-4" />
                        지금 확인 가능
                      </div>
                      <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          개원 추천 등급
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          경쟁 병원 수
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          매출 범위 (대략)
                        </li>
                      </ul>
                    </div>
                    {/* 유료 */}
                    <div className="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20">
                      <div className="font-medium text-foreground mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-500" />
                        잠금해제 시 추가
                      </div>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-foreground">
                          <Eye className="w-4 h-4 text-blue-500" />
                          <strong>정확한 예상 매출</strong>
                        </li>
                        <li className="flex items-center gap-2 text-foreground">
                          <Eye className="w-4 h-4 text-blue-500" />
                          세부 비용 분석
                        </li>
                        <li className="flex items-center gap-2 text-foreground">
                          <Eye className="w-4 h-4 text-blue-500" />
                          경쟁 병원 이름/위치
                        </li>
                        <li className="flex items-center gap-2 text-foreground">
                          <Eye className="w-4 h-4 text-blue-500" />
                          ROI 및 손익분기점
                        </li>
                        <li className="flex items-center gap-2 text-foreground">
                          <Eye className="w-4 h-4 text-blue-500" />
                          지역 순위 분석
                        </li>
                        <li className="flex items-center gap-2 text-foreground">
                          <Eye className="w-4 h-4 text-blue-500" />
                          PDF 리포트 다운로드
                        </li>
                      </ul>
                    </div>
                  </div>
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

            {/* 무료 요약 정보 카드 */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl p-5 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800 dark:text-green-200">무료로 확인한 핵심 정보</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {result.competition.same_dept_count}개
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400">동일과 경쟁</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {getRecommendationText(result.recommendation)}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400">AI 추천</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {result.confidence_score}%
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400">분석 신뢰도</div>
                </div>
              </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Revenue Card */}
              <div className="card p-6 relative">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">예상 월 매출</h3>
                <div className="text-3xl font-bold text-foreground mb-2">
                  <BlurredValue isBlurred={!isUnlocked}>
                    {formatCurrency(result.estimated_monthly_revenue.avg)}
                  </BlurredValue>
                </div>
                <div className="text-sm text-muted-foreground">
                  <BlurredValue isBlurred={!isUnlocked}>
                    {formatCurrency(result.estimated_monthly_revenue.min)} ~ {formatCurrency(result.estimated_monthly_revenue.max)}
                  </BlurredValue>
                </div>
                {!isUnlocked && (
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent rounded-xl" />
                )}
              </div>

              {/* Cost Card */}
              <div className="card p-6 relative">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">예상 월 비용</h3>
                <div className="text-3xl font-bold text-foreground mb-2">
                  <BlurredValue isBlurred={!isUnlocked}>
                    {formatCurrency(result.estimated_monthly_cost.total)}
                  </BlurredValue>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>임대료: <BlurredValue isBlurred={!isUnlocked}>{formatCurrency(result.estimated_monthly_cost.rent)}</BlurredValue></div>
                  <div>인건비: <BlurredValue isBlurred={!isUnlocked}>{formatCurrency(result.estimated_monthly_cost.labor)}</BlurredValue></div>
                </div>
                {!isUnlocked && (
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent rounded-xl" />
                )}
              </div>

              {/* Profit Card */}
              <div className="card p-6 relative">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">예상 월 순이익</h3>
                <div className={`text-3xl font-bold mb-2 ${result.profitability.monthly_profit_avg >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <BlurredValue isBlurred={!isUnlocked}>
                    {formatCurrency(result.profitability.monthly_profit_avg)}
                  </BlurredValue>
                </div>
                <div className="text-sm text-muted-foreground">
                  손익분기점: <BlurredValue isBlurred={!isUnlocked}>{result.profitability.breakeven_months}개월</BlurredValue>
                </div>
                {!isUnlocked && (
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent rounded-xl" />
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
            <div className="grid md:grid-cols-2 gap-6">
              {/* Competition */}
              <div className="card p-6 relative">
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
                      {isUnlocked ? (
                        result.competitors.slice(0, 3).map((comp, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{comp.name}</span>
                            <span className="text-muted-foreground">{comp.distance_m}m</span>
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground blur-sm select-none">OO내과의원</span>
                            <span className="text-muted-foreground blur-sm select-none">120m</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground blur-sm select-none">XX정형외과</span>
                            <span className="text-muted-foreground blur-sm select-none">250m</span>
                          </div>
                          <div className="flex items-center justify-center text-sm text-amber-600 mt-2">
                            <Lock className="w-3 h-3 mr-1" />
                            <span>잠금해제로 상세 정보 확인</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Demographics */}
              <div className="card p-6 relative">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  인구 현황
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">반경 1km 인구</span>
                    <span className="font-medium">
                      <BlurredValue isBlurred={!isUnlocked}>
                        {result.demographics.population_1km.toLocaleString()}명
                      </BlurredValue>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">40대 이상 비율</span>
                    <span className="font-medium">
                      <BlurredValue isBlurred={!isUnlocked}>
                        {(result.demographics.age_40_plus_ratio * 100).toFixed(1)}%
                      </BlurredValue>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">일 유동인구</span>
                    <span className="font-medium">
                      <BlurredValue isBlurred={!isUnlocked}>
                        {result.demographics.floating_population_daily.toLocaleString()}명
                      </BlurredValue>
                    </span>
                  </div>
                </div>
              </div>
            </div>

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

            {/* ============================================= */}
            {/* 상세 분석 섹션 - Premium Detail Analysis */}
            {/* ============================================= */}

            {isUnlocked && (
              <>
                {/* Section Divider */}
                <div className="flex items-center gap-4 my-8">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                  <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 rounded-full">
                    <Sparkles className="w-4 h-4 text-violet-600" />
                    <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">프리미엄 상세 분석</span>
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-border via-transparent to-transparent" />
                </div>

                {/* AI 인사이트 - Executive Summary */}
                {result.ai_insights && (
                  <div className="card p-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30 border-indigo-200 dark:border-indigo-800">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <Lightbulb className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">AI 핵심 인사이트</h3>
                        <p className="text-sm text-muted-foreground">GPT-4 기반 종합 분석</p>
                      </div>
                    </div>
                    <div className="bg-white/60 dark:bg-black/20 rounded-xl p-4 mb-4">
                      <p className="text-foreground leading-relaxed">{result.ai_insights.executive_summary}</p>
                    </div>

                    {/* SWOT Analysis */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-4">
                        <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" /> 강점 (Strengths)
                        </h4>
                        <ul className="space-y-1 text-sm text-green-800 dark:text-green-200">
                          {result.ai_insights.strengths.map((s, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-green-500 mt-1">•</span> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-red-50 dark:bg-red-950/30 rounded-xl p-4">
                        <h4 className="font-semibold text-red-700 dark:text-red-300 mb-2 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" /> 약점 (Weaknesses)
                        </h4>
                        <ul className="space-y-1 text-sm text-red-800 dark:text-red-200">
                          {result.ai_insights.weaknesses.map((w, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-red-500 mt-1">•</span> {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4">
                        <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" /> 기회 (Opportunities)
                        </h4>
                        <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                          {result.ai_insights.opportunities.map((o, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-blue-500 mt-1">•</span> {o}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4">
                        <h4 className="font-semibold text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-2">
                          <Shield className="w-4 h-4" /> 위협 (Threats)
                        </h4>
                        <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-200">
                          {result.ai_insights.threats.map((t, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-amber-500 mt-1">•</span> {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* 상세 매출/비용/수익성 분석 */}
                <div className="grid md:grid-cols-3 gap-6">
                  {/* 매출 상세 분석 */}
                  {result.revenue_detail && (
                    <div className="card p-6">
                      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <CircleDollarSign className="w-5 h-5 text-green-600" />
                        매출 상세 분석
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center py-2 border-b border-border">
                          <span className="text-muted-foreground">일일 평균 환자 수</span>
                          <span className="font-semibold text-foreground">{result.revenue_detail.daily_patients_avg}명</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border">
                          <span className="text-muted-foreground">평균 진료비</span>
                          <span className="font-semibold text-foreground">{result.revenue_detail.avg_treatment_fee.toLocaleString()}원</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border">
                          <span className="text-muted-foreground">보험/비보험 비율</span>
                          <span className="font-semibold text-foreground">
                            {(result.revenue_detail.insurance_ratio * 100).toFixed(0)}% / {(result.revenue_detail.non_insurance_ratio * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border">
                          <span className="text-muted-foreground">초진/재진 비율</span>
                          <span className="font-semibold text-foreground">
                            {(result.revenue_detail.new_patient_ratio * 100).toFixed(0)}% / {(result.revenue_detail.return_patient_ratio * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-muted-foreground">환자당 평균 방문</span>
                          <span className="font-semibold text-foreground">{result.revenue_detail.avg_visits_per_patient}회</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 비용 상세 분석 */}
                  {result.cost_detail && (
                    <div className="card p-6">
                      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-orange-600" />
                        비용 상세 분석
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center py-2 border-b border-border">
                          <span className="text-muted-foreground">보증금</span>
                          <span className="font-semibold text-foreground">{formatCurrency(result.cost_detail.rent_deposit)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border">
                          <span className="text-muted-foreground">월세 + 관리비</span>
                          <span className="font-semibold text-foreground">
                            {formatCurrency(result.cost_detail.rent_monthly + result.cost_detail.maintenance_fee)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border">
                          <span className="text-muted-foreground">인력 구성</span>
                          <span className="font-semibold text-foreground">
                            의사 {result.cost_detail.doctor_count} / 간호사 {result.cost_detail.nurse_count} / 행정 {result.cost_detail.admin_count}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border">
                          <span className="text-muted-foreground">마케팅 월 예산</span>
                          <span className="font-semibold text-foreground">{formatCurrency(result.cost_detail.marketing_monthly)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-muted-foreground">초기 인테리어</span>
                          <span className="font-semibold text-foreground">{formatCurrency(result.cost_detail.initial_interior)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 수익성 상세 분석 */}
                  {result.profitability_detail && (
                    <div className="card p-6">
                      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-violet-600" />
                        수익성 분석
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center py-2 border-b border-border">
                          <span className="text-muted-foreground">연간 예상 수익</span>
                          <span className="font-semibold text-green-600">{formatCurrency(result.profitability_detail.annual_profit_estimate)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border">
                          <span className="text-muted-foreground">순이익률</span>
                          <span className="font-semibold text-foreground">{result.profitability_detail.profit_margin_percent.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border">
                          <span className="text-muted-foreground">총 투자금</span>
                          <span className="font-semibold text-foreground">{formatCurrency(result.profitability_detail.total_investment)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border">
                          <span className="text-muted-foreground">투자금 회수</span>
                          <span className="font-semibold text-foreground">{result.profitability_detail.payback_months}개월</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-muted-foreground">내부수익률 (IRR)</span>
                          <span className="font-semibold text-violet-600">{result.profitability_detail.irr_percent.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 입지 분석 */}
                {result.location_analysis && (
                  <div className="card p-6">
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <MapPinned className="w-5 h-5 text-blue-600" />
                      입지 분석
                    </h3>
                    <div className="grid md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
                        <Train className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-blue-700">{result.location_analysis.transit_score}</div>
                        <div className="text-xs text-blue-600">대중교통 점수</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-xl">
                        <Car className="w-6 h-6 text-green-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-green-700">{result.location_analysis.parking_score}</div>
                        <div className="text-xs text-green-600">주차 점수</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/30 rounded-xl">
                        <Building className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-purple-700">{result.location_analysis.commercial_score}</div>
                        <div className="text-xs text-purple-600">상권 점수</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/30 rounded-xl">
                        <Eye className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-orange-700">{result.location_analysis.visibility_score}</div>
                        <div className="text-xs text-orange-600">가시성 점수</div>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-foreground mb-3">대중교통</h4>
                        <div className="space-y-2 text-sm">
                          {result.location_analysis.subway_stations.length > 0 && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Train className="w-4 h-4" />
                              {result.location_analysis.subway_stations.map(s => `${s.name}(${s.distance_m}m)`).join(', ')}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            버스정류장 {result.location_analysis.bus_stops_count}개 ({result.location_analysis.bus_routes_count}개 노선)
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground mb-3">상권 정보</h4>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div>상권 유형: <span className="text-foreground font-medium">{result.location_analysis.commercial_district_type}</span></div>
                          <div>유동인구 등급: <span className="text-foreground font-medium">{result.location_analysis.foot_traffic_rank}</span></div>
                          <div>대로변 여부: <span className="text-foreground font-medium">{result.location_analysis.main_road_facing ? '예' : '아니오'}</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 경쟁 & 인구 상세 분석 */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* 경쟁 상세 */}
                  {result.competition_detail && (
                    <div className="card p-6">
                      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Target className="w-5 h-5 text-red-600" />
                        경쟁 상세 분석
                      </h3>
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">경쟁 강도</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            result.competition_detail.competition_level === 'LOW' ? 'bg-green-100 text-green-700' :
                            result.competition_detail.competition_level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                            result.competition_detail.competition_level === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {result.competition_detail.competition_level}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              result.competition_detail.competition_index < 30 ? 'bg-green-500' :
                              result.competition_detail.competition_index < 60 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${result.competition_detail.competition_index}%` }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">동일 진료과</span>
                          <span className="font-medium">{result.competition_detail.same_dept_count}개</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">유사 진료과</span>
                          <span className="font-medium">{result.competition_detail.similar_dept_count}개</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">시장 포화도</span>
                          <span className="font-medium">{result.competition_detail.market_saturation.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">예상 시장점유율</span>
                          <span className="font-medium text-green-600">{result.competition_detail.estimated_market_share.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">월 잠재환자 수</span>
                          <span className="font-medium">{result.competition_detail.potential_patients_monthly.toLocaleString()}명</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 인구 상세 */}
                  {result.demographics_detail && (
                    <div className="card p-6">
                      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-teal-600" />
                        인구 상세 분석
                      </h3>
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="text-center p-3 bg-teal-50 dark:bg-teal-950/30 rounded-lg">
                          <div className="text-lg font-bold text-teal-700">{result.demographics_detail.population_500m.toLocaleString()}</div>
                          <div className="text-xs text-teal-600">500m 인구</div>
                        </div>
                        <div className="text-center p-3 bg-teal-50 dark:bg-teal-950/30 rounded-lg">
                          <div className="text-lg font-bold text-teal-700">{result.demographics_detail.population_1km.toLocaleString()}</div>
                          <div className="text-xs text-teal-600">1km 인구</div>
                        </div>
                        <div className="text-center p-3 bg-teal-50 dark:bg-teal-950/30 rounded-lg">
                          <div className="text-lg font-bold text-teal-700">{result.demographics_detail.population_3km.toLocaleString()}</div>
                          <div className="text-xs text-teal-600">3km 인구</div>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">평균 가구소득</span>
                          <span className="font-medium">{result.demographics_detail.avg_household_income.toLocaleString()}만원</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">의료 이용률</span>
                          <span className="font-medium">{(result.demographics_detail.medical_utilization_rate * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">유동인구 피크</span>
                          <span className="font-medium">{result.demographics_detail.floating_peak_hour}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">60대 이상 비율</span>
                          <span className="font-medium">{(result.demographics_detail.age_60_plus * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 성장 전망 & 리스크 분석 */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* 성장 전망 */}
                  {result.growth_projection && (
                    <div className="card p-6">
                      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        5년 성장 전망
                      </h3>
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                          <div className="text-lg font-bold text-green-700">+{result.growth_projection.growth_rate_year1.toFixed(0)}%</div>
                          <div className="text-xs text-green-600">1년차</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                          <div className="text-lg font-bold text-green-700">+{result.growth_projection.growth_rate_year2.toFixed(0)}%</div>
                          <div className="text-xs text-green-600">2년차</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                          <div className="text-lg font-bold text-green-700">+{result.growth_projection.growth_rate_year3.toFixed(0)}%</div>
                          <div className="text-xs text-green-600">3년차</div>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">5년차 예상 매출</span>
                          <span className="font-medium text-green-600">{formatCurrency(result.growth_projection.year5_revenue_estimate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">5년 누적 수익</span>
                          <span className="font-medium">{formatCurrency(result.growth_projection.cumulative_profit_5years)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">인구 증감률</span>
                          <span className={`font-medium ${result.growth_projection.population_growth_rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {result.growth_projection.population_growth_rate >= 0 ? '+' : ''}{result.growth_projection.population_growth_rate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      {result.growth_projection.development_plans.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <h4 className="text-sm font-medium text-foreground mb-2">지역 개발 계획</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {result.growth_projection.development_plans.map((plan, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <Zap className="w-3 h-3 text-yellow-500 mt-1 flex-shrink-0" /> {plan}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 리스크 분석 */}
                  {result.risk_analysis && (
                    <div className="card p-6">
                      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-amber-600" />
                        리스크 분석
                      </h3>
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                          result.risk_analysis.overall_risk_level === 'LOW' ? 'bg-green-100 text-green-700' :
                          result.risk_analysis.overall_risk_level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          전체 리스크: {result.risk_analysis.overall_risk_level}
                        </div>
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                result.risk_analysis.overall_risk_score < 30 ? 'bg-green-500' :
                                result.risk_analysis.overall_risk_score < 60 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${result.risk_analysis.overall_risk_score}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {[
                          { label: '경쟁 리스크', value: result.risk_analysis.competition_risk },
                          { label: '입지 리스크', value: result.risk_analysis.location_risk },
                          { label: '시장 리스크', value: result.risk_analysis.market_risk },
                          { label: '재무 리스크', value: result.risk_analysis.financial_risk },
                        ].map((risk, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-secondary rounded-lg text-sm">
                            <span className="text-muted-foreground">{risk.label}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              risk.value === 'LOW' ? 'bg-green-100 text-green-700' :
                              risk.value === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {risk.value}
                            </span>
                          </div>
                        ))}
                      </div>
                      {result.risk_analysis.opportunities.length > 0 && (
                        <div className="pt-4 border-t border-border">
                          <h4 className="text-sm font-medium text-green-700 mb-2">기회 요소</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {result.risk_analysis.opportunities.map((opp, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <Star className="w-3 h-3 text-green-500 mt-1 flex-shrink-0" /> {opp}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* AI 추천 전략 */}
                {result.ai_insights && (
                  <div className="card p-6 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20">
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-violet-600" />
                      AI 추천 전략
                    </h3>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-violet-700 dark:text-violet-300 mb-3">차별화 포인트</h4>
                        <ul className="space-y-2 text-sm">
                          {result.ai_insights.differentiation_points.map((point, i) => (
                            <li key={i} className="flex items-start gap-2 text-muted-foreground">
                              <CheckCircle2 className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" /> {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-violet-700 dark:text-violet-300 mb-3">타겟 환자군</h4>
                        <ul className="space-y-2 text-sm">
                          {result.ai_insights.target_patient_groups.map((group, i) => (
                            <li key={i} className="flex items-start gap-2 text-muted-foreground">
                              <Heart className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" /> {group}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-violet-700 dark:text-violet-300 mb-3">마케팅 전략</h4>
                        <ul className="space-y-2 text-sm">
                          {result.ai_insights.marketing_suggestions.slice(0, 4).map((sug, i) => (
                            <li key={i} className="flex items-start gap-2 text-muted-foreground">
                              <Zap className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" /> {sug}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    {result.ai_insights.recommended_opening_season && (
                      <div className="mt-4 pt-4 border-t border-violet-200 dark:border-violet-800 flex items-center gap-4">
                        <Calendar className="w-5 h-5 text-violet-600" />
                        <div>
                          <span className="text-sm font-medium text-foreground">추천 개원 시기: </span>
                          <span className="text-sm text-violet-700 dark:text-violet-300 font-semibold">{result.ai_insights.recommended_opening_season}</span>
                          <span className="text-sm text-muted-foreground ml-2">- {result.ai_insights.opening_timing_reason}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

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
