'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import {
  ArrowLeft, Building2, TrendingUp,
  ChevronRight, Download, Lock, LogIn, Sparkles, CheckCircle2,
} from 'lucide-react'
import { TossIcon } from '@/components/ui/TossIcon'
import { simulationService } from '@/lib/api/services'
import { SimulationResponse } from '@/lib/api/client'
import { toast } from 'sonner'
import { useSimulationUnlock } from '@/lib/hooks/usePayment'
import { DEMO_RESULT } from './demo-data'
import AddressSelector from './components/AddressSelector'
import ScoreHero from './components/ScoreHero'
import RegionBenchmark from './components/RegionBenchmark'
import FreeInsights from './components/FreeInsights'
import DemographicsPreview from './components/DemographicsPreview'
import OverallRadar from './components/OverallRadar'
import RevenueSimulator from './components/RevenueSimulator'
import BreakevenTimeline from './components/BreakevenTimeline'
import MonthlyForecast from './components/MonthlyForecast'
import CostPreview from './components/CostPreview'
import CompetitorDistance from './components/CompetitorDistance'
import WeeklyPattern from './components/WeeklyPattern'
import SuccessFactors from './components/SuccessFactors'
import MarketTrend from './components/MarketTrend'
import PatientFlow from './components/PatientFlow'
import InsuranceAnalysis from './components/InsuranceAnalysis'
import RentAnalysis from './components/RentAnalysis'
import StaffingPlan from './components/StaffingPlan'
import MarketingROI from './components/MarketingROI'
import NearbyFacilities from './components/NearbyFacilities'
import TransitScore from './components/TransitScore'
import FinancialStatement from './components/FinancialStatement'
import OpeningTimeline from './components/OpeningTimeline'
import AnalysisPack1 from './components/AnalysisPack1'
import AnalysisPack2 from './components/AnalysisPack2'
import AnalysisPack3 from './components/AnalysisPack3'
import AnalysisPack4 from './components/AnalysisPack4'
import AnalysisPack5 from './components/AnalysisPack5'
import AnalysisPack6 from './components/AnalysisPack6'
import FinancialPack from './components/FinancialPack'
import FinancialPack2 from './components/FinancialPack2'
import CompetitionPack from './components/CompetitionPack'
import LocationPack from './components/LocationPack'
import GrowthPack from './components/GrowthPack'
import PatientPack from './components/PatientPack'
import OperationalPack from './components/OperationalPack'
import ShareResult from './components/ShareResult'
import PaywallCTA from './components/PaywallCTA'
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

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded ${className || ''}`} />
}

function SimulationResultSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <svg className="w-12 h-12 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
              <path className="opacity-75 text-blue-600" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">AI가 분석 중입니다...</h3>
            <p className="text-sm text-blue-600 dark:text-blue-400">심평원, 국토부, 상권 데이터를 종합 분석하고 있습니다</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {['상권 분석', '경쟁 현황', '매출 예측', '리포트 생성'].map((step, index) => (
            <div key={step} className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium mb-1 ${
                index === 0 ? 'bg-blue-600 text-white animate-pulse' : 'bg-muted text-muted-foreground'
              }`}>
                {index + 1}
              </div>
              <span className="text-xs text-muted-foreground text-center">{step}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl p-6 border border-border bg-muted/30">
        <div className="flex items-center gap-3 mb-3">
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-6">
            <Skeleton className="h-4 w-24 mb-4" />
            <Skeleton className="h-10 w-32 mb-2" />
            <Skeleton className="h-4 w-40" />
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
    setValue,
    formState: { errors },
  } = useForm<SimulationForm>({
    resolver: zodResolver(simulationSchema),
  })

  const mutation = useMutation({
    mutationFn: simulationService.create,
    onSuccess: (data) => {
      setResult(data)
      setIsAuthRequired(false)
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
      if (status === 403 || status === 401 || error.message?.includes('403') || error.message?.includes('Network Error')) {
        setIsAuthRequired(true)
      } else {
        toast.error(error.response?.data?.detail || '시뮬레이션에 실패했습니다.')
      }
    },
  })

  const { unlockSimulation, isLoading: isPaymentLoading } = useSimulationUnlock()

  const handleUnlock = async () => {
    if (!result?.simulation_id) {
      toast.success('결과가 잠금해제되었습니다!')
      setIsUnlocked(true)
      return
    }
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
          <SimulationResultSkeleton />
        ) : isAuthRequired ? (
          /* Login Required */
          <div className="card p-12 text-center max-w-lg mx-auto">
            <div className="flex justify-center mb-6">
              <TossIcon icon={Lock} color="from-gray-500 to-slate-600" size="xl" shadow="shadow-gray-500/25" />
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
                <AddressSelector
                  onChange={(addr) => setValue('address', addr, { shouldValidate: !!addr })}
                  error={errors.address?.message}
                />

                <div>
                  <label className="label mb-2 block">진료과목 *</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <select {...register('clinic_type')} className="select pl-12">
                      <option value="">진료과목 선택</option>
                      {clinicTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  {errors.clinic_type && <p className="mt-2 text-sm text-red-500">{errors.clinic_type.message}</p>}
                </div>

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

                <button type="submit" disabled={mutation.isPending} className="btn-primary w-full h-12 text-base">
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
          /* ─── Results Section ─── */
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">시뮬레이션 결과</h1>
                <p className="text-muted-foreground">{result.address} · {result.clinic_type}</p>
              </div>
              <div className="flex items-center gap-2">
                <ShareResult result={result} />
                <button
                  onClick={() => { setResult(null); setIsUnlocked(false) }}
                  className="btn-ghost"
                >
                  새로운 시뮬레이션
                </button>
              </div>
            </div>

            {/* Status Banner */}
            {isUnlocked ? (
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <span className="font-medium text-green-800 dark:text-green-200">전체 결과 열람 가능</span>
                  <span className="text-green-700 dark:text-green-300 ml-2">모든 분석 결과를 확인할 수 있습니다.</span>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl flex-shrink-0">🔒</span>
                  <div className="flex-1">
                    <span className="font-medium text-foreground">일부 결과가 잠겨있습니다</span>
                    <span className="text-sm text-muted-foreground ml-2">아래 무료 분석을 먼저 확인해보세요</span>
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

            {/* ── Act 1: 무료 프리뷰 (핵심 2개만 완전 공개) ── */}
            <ScoreHero result={result} />
            <FreeInsights result={result} />

            {/* ── Act 2+3: 나머지 전부 블러 (잠금) / 풀 (해제) ── */}
            {!isUnlocked ? (
              <div className="relative">
                <div className="paywall-blur space-y-6">
                  {/* ── 그룹 1: 시장/경쟁 분석 ── */}
                  <RegionBenchmark result={DEMO_RESULT} />
                  <OverallRadar result={DEMO_RESULT} />
                  <CompetitorDistance result={DEMO_RESULT} />
                  <MarketTrend result={DEMO_RESULT} />

                  {/* 1차 잠금 리마인더 */}
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-foreground">아래에 160개 이상의 분석 섹션이 있습니다</span>
                      <span className="text-xs text-muted-foreground ml-2">잠금해제로 전체 확인</span>
                    </div>
                    <button onClick={handleUnlock} className="btn-primary text-xs px-4 py-2">
                      <Sparkles className="w-3 h-3" />
                      잠금해제
                    </button>
                  </div>

                  {/* ── 그룹 2: 인구/수요 분석 ── */}
                  <DemographicsPreview result={DEMO_RESULT} isUnlocked={false} />
                  <PatientFlow result={DEMO_RESULT} />
                  <InsuranceAnalysis result={DEMO_RESULT} />

                  {/* ── 그룹 3: 비용/수익 분석 ── */}
                  <CostPreview result={DEMO_RESULT} />
                  <BreakevenTimeline result={DEMO_RESULT} />
                  <MonthlyForecast result={DEMO_RESULT} />
                  <RentAnalysis result={DEMO_RESULT} />

                  {/* 2차 잠금 리마인더 */}
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <Lock className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-foreground">AI 전략 리포트 · SWOT · 리스크 분석</span>
                      <span className="text-xs text-muted-foreground ml-2">아직 140개 이상 섹션 남음</span>
                    </div>
                    <button onClick={handleUnlock} className="btn-primary text-xs px-4 py-2">
                      <Sparkles className="w-3 h-3" />
                      {(result?.unlock_price ?? 9900).toLocaleString()}원
                    </button>
                  </div>

                  {/* ── 그룹 4: 운영/시간대 분석 ── */}
                  <WeeklyPattern result={DEMO_RESULT} />
                  <RevenueSimulator result={DEMO_RESULT} />
                  <SuccessFactors result={DEMO_RESULT} />
                  <StaffingPlan result={DEMO_RESULT} />
                  <TransitScore result={DEMO_RESULT} />
                  <NearbyFacilities result={DEMO_RESULT} />

                  {/* ── 그룹 5: 진료/의료 심층 분석 (10개 카드) ── */}
                  <AnalysisPack1 result={DEMO_RESULT} />

                  {/* 3차 잠금 리마인더 */}
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-800 rounded-xl">
                    <Lock className="w-5 h-5 text-purple-600 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-foreground">심층 의료 수요 · 인구 분석 120개+ 섹션</span>
                      <span className="text-xs text-muted-foreground ml-2">끝없는 인사이트가 기다립니다</span>
                    </div>
                    <button onClick={handleUnlock} className="btn-primary text-xs px-4 py-2">
                      <Sparkles className="w-3 h-3" />
                      잠금해제
                    </button>
                  </div>

                  {/* ── 그룹 6: 의료수요/인구 심층 (10개 카드) ── */}
                  <AnalysisPack2 result={DEMO_RESULT} />

                  {/* ── 그룹 7: 부동산/입지 심층 (10개 카드) ── */}
                  <AnalysisPack3 result={DEMO_RESULT} />

                  {/* 4차 잠금 리마인더 */}
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-xl">
                    <Lock className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-foreground">재무 분석 · 세금 · 투자 회수 시뮬레이션</span>
                      <span className="text-xs text-muted-foreground ml-2">손익계산서 · 현금흐름 · 대출 상환 포함</span>
                    </div>
                    <button onClick={handleUnlock} className="btn-primary text-xs px-4 py-2">
                      <Sparkles className="w-3 h-3" />
                      {(result?.unlock_price ?? 9900).toLocaleString()}원
                    </button>
                  </div>

                  {/* ── 그룹 8: 재무 심층 (10개 카드) ── */}
                  <FinancialPack result={DEMO_RESULT} />
                  <FinancialStatement result={DEMO_RESULT} />
                  <MarketingROI result={DEMO_RESULT} />

                  {/* ── 그룹 9: 운영/개원 계획 (10개 카드) ── */}
                  <OperationalPack result={DEMO_RESULT} />
                  <OpeningTimeline result={DEMO_RESULT} />

                  {/* 5차 잠금 리마인더 */}
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 border border-rose-200 dark:border-rose-800 rounded-xl">
                    <Lock className="w-5 h-5 text-rose-600 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-foreground">디지털 헬스 · 환자 경험 · 경쟁 심층 30개+ 섹션</span>
                      <span className="text-xs text-muted-foreground ml-2">AI 진단 · 비대면 · 온라인 마케팅 ROI</span>
                    </div>
                    <button onClick={handleUnlock} className="btn-primary text-xs px-4 py-2">
                      <Sparkles className="w-3 h-3" />
                      잠금해제
                    </button>
                  </div>

                  {/* ── 그룹 10: 디지털 헬스/미래 의료 (10개) ── */}
                  <AnalysisPack4 result={DEMO_RESULT} />

                  {/* ── 그룹 11: 환자 경험/CS (10개) ── */}
                  <AnalysisPack5 result={DEMO_RESULT} />

                  {/* ── 그룹 12: 경쟁 심층 (10개) ── */}
                  <CompetitionPack result={DEMO_RESULT} />

                  {/* 6차 잠금 리마인더 */}
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 border border-cyan-200 dark:border-cyan-800 rounded-xl">
                    <Lock className="w-5 h-5 text-cyan-600 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-foreground">입지 심층 · 환자 분석 · 재무 심층 30개+ 섹션</span>
                      <span className="text-xs text-muted-foreground ml-2">보행자 동선 · 절세 · 환자 세분화</span>
                    </div>
                    <button onClick={handleUnlock} className="btn-primary text-xs px-4 py-2">
                      <Sparkles className="w-3 h-3" />
                      {(result?.unlock_price ?? 9900).toLocaleString()}원
                    </button>
                  </div>

                  {/* ── 그룹 13: 입지 심층 (10개) ── */}
                  <LocationPack result={DEMO_RESULT} />

                  {/* ── 그룹 14: 환자 분석 심층 (10개) ── */}
                  <PatientPack result={DEMO_RESULT} />

                  {/* ── 그룹 15: 재무 심층 추가 (10개) ── */}
                  <FinancialPack2 result={DEMO_RESULT} />

                  {/* 7차 잠금 리마인더 */}
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-foreground">성장 전략 · 법률 · AI 전략 리포트 30개+ 섹션</span>
                      <span className="text-xs text-muted-foreground ml-2">10년 비전 · 2호점 · SWOT · 리스크 대응</span>
                    </div>
                    <button onClick={handleUnlock} className="btn-primary text-xs px-4 py-2">
                      <Sparkles className="w-3 h-3" />
                      잠금해제
                    </button>
                  </div>

                  {/* ── 그룹 16: 성장 전략/확장 (10개) ── */}
                  <GrowthPack result={DEMO_RESULT} />

                  {/* ── 그룹 17: 법률/규제 (10개) ── */}
                  <AnalysisPack6 result={DEMO_RESULT} />

                  {/* 8차 잠금 리마인더 */}
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl">
                    <Lock className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-foreground">프리미엄 AI 전략 리포트 9개 섹션</span>
                      <span className="text-xs text-muted-foreground ml-2">SWOT · 3년 성장전략 · 마케팅 · 리스크 대응</span>
                    </div>
                    <button onClick={handleUnlock} className="btn-primary text-xs px-4 py-2">
                      <Sparkles className="w-3 h-3" />
                      {(result?.unlock_price ?? 9900).toLocaleString()}원
                    </button>
                  </div>

                  {/* ── 그룹 18: 프리미엄 9개 섹션 ── */}
                  <PremiumAnalysis result={DEMO_RESULT} />
                </div>
                <PaywallCTA
                  onUnlock={handleUnlock}
                  isLoading={isPaymentLoading}
                  price={result?.unlock_price ?? 9900}
                />
              </div>
            ) : (
              <>
                <RegionBenchmark result={result} />
                <OverallRadar result={result} />
                <CompetitorDistance result={result} />
                <MarketTrend result={result} />
                <DemographicsPreview result={result} isUnlocked={true} />
                <PatientFlow result={result} />
                <InsuranceAnalysis result={result} />
                <CostPreview result={result} />
                <BreakevenTimeline result={result} />
                <MonthlyForecast result={result} />
                <RentAnalysis result={result} />
                <WeeklyPattern result={result} />
                <RevenueSimulator result={result} />
                <SuccessFactors result={result} />
                <StaffingPlan result={result} />
                <TransitScore result={result} />
                <NearbyFacilities result={result} />
                <AnalysisPack1 result={result} />
                <AnalysisPack2 result={result} />
                <AnalysisPack3 result={result} />
                <FinancialPack result={result} />
                <FinancialStatement result={result} />
                <MarketingROI result={result} />
                <OperationalPack result={result} />
                <OpeningTimeline result={result} />
                <AnalysisPack4 result={result} />
                <AnalysisPack5 result={result} />
                <CompetitionPack result={result} />
                <LocationPack result={result} />
                <PatientPack result={result} />
                <FinancialPack2 result={result} />
                <GrowthPack result={result} />
                <AnalysisPack6 result={result} />
                <PremiumAnalysis result={result} />
              </>
            )}

            {/* ── 하단 CTA ── */}
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
                    <p className="text-muted-foreground">정확한 예상 매출, ROI, 경쟁 분석 등 모든 데이터를 확인하세요</p>
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
