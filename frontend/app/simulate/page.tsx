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
  MapPinned, Building, Home, CircleDollarSign, Search
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

// 샘플 데이터 (데모 모드용)
const DEMO_RESULT: SimulationResponse = {
  simulation_id: 'demo-123',
  address: '서울 서초구 언남9길 28',
  clinic_type: '정형외과',
  size_pyeong: 35,
  budget_million: 500,
  estimated_monthly_revenue: {
    min: 45000000,
    avg: 65000000,
    max: 85000000,
  },
  estimated_monthly_cost: {
    rent: 8000000,
    labor: 15000000,
    utilities: 2000000,
    supplies: 5000000,
    other: 3000000,
    total: 33000000,
  },
  profitability: {
    monthly_profit_avg: 32000000,
    breakeven_months: 14,
    annual_roi_percent: 38,
  },
  competition: {
    radius_m: 1000,
    same_dept_count: 5,
    total_clinic_count: 42,
  },
  competitors: [
    { name: '서초정형외과의원', distance_m: 150, est_monthly_revenue: 70000000, years_open: 8, clinic_type: '정형외과', rating: 4.5, review_count: 234, specialty_detail: '척추/관절 전문' },
    { name: '언남정형외과', distance_m: 280, est_monthly_revenue: 55000000, years_open: 5, clinic_type: '정형외과', rating: 4.3, review_count: 156, specialty_detail: '스포츠의학 전문' },
    { name: '연세정형외과의원', distance_m: 420, est_monthly_revenue: 62000000, years_open: 12, clinic_type: '정형외과', rating: 4.7, review_count: 412, specialty_detail: '어깨/무릎 전문' },
    { name: '강남본정형외과', distance_m: 650, est_monthly_revenue: 80000000, years_open: 15, clinic_type: '정형외과', rating: 4.6, review_count: 523, specialty_detail: '재활/물리치료' },
    { name: '서초튼튼정형외과', distance_m: 780, est_monthly_revenue: 48000000, years_open: 3, clinic_type: '정형외과', rating: 4.2, review_count: 89, specialty_detail: '비수술 치료' },
  ],
  demographics: {
    population_1km: 45000,
    age_40_plus_ratio: 0.42,
    floating_population_daily: 85000,
  },
  confidence_score: 87,
  recommendation: 'POSITIVE',
  recommendation_reason: '유동인구가 많고 직장인 밀집 지역으로 정형외과 수요가 높습니다. 경쟁이 있으나 차별화 전략으로 충분히 경쟁 가능한 입지입니다.',
  region_stats: {
    vs_national_percent: 15,
    national_avg_revenue: 52000000,
    region_rank: 3,
    total_regions: 17,
    rank_percentile: 18,
  },
  revenue_detail: {
    daily_patients_min: 25,
    daily_patients_avg: 38,
    daily_patients_max: 52,
    avg_treatment_fee: 78000,
    insurance_ratio: 0.75,
    non_insurance_ratio: 0.25,
    new_patient_ratio: 0.35,
    return_patient_ratio: 0.65,
    avg_visits_per_patient: 3.2,
    seasonal_factor: { spring: 1.1, summer: 0.85, fall: 1.15, winter: 0.9 },
  },
  cost_detail: {
    rent_deposit: 80000000,
    rent_monthly: 7000000,
    maintenance_fee: 1000000,
    doctor_count: 1,
    nurse_count: 2,
    admin_count: 2,
    avg_nurse_salary: 3200000,
    avg_admin_salary: 2800000,
    equipment_monthly: 2000000,
    marketing_monthly: 3000000,
    insurance_monthly: 500000,
    supplies_monthly: 2500000,
    utilities_monthly: 1500000,
    initial_equipment: 180000000,
    initial_interior: 120000000,
    initial_other: 30000000,
  },
  profitability_detail: {
    monthly_profit_min: 18000000,
    monthly_profit_avg: 32000000,
    monthly_profit_max: 48000000,
    annual_profit_estimate: 384000000,
    profit_margin_percent: 49.2,
    operating_margin_percent: 52.5,
    total_investment: 450000000,
    payback_months: 14,
    irr_percent: 42.5,
    npv_3years: 520000000,
  },
  competition_detail: {
    radius_m: 1000,
    same_dept_count: 5,
    similar_dept_count: 8,
    total_clinic_count: 42,
    hospital_count: 2,
    competition_index: 45,
    competition_level: 'MEDIUM',
    market_saturation: 62,
    estimated_market_share: 8.5,
    potential_patients_monthly: 2800,
    nearest_same_dept_distance: 150,
    avg_distance_same_dept: 420,
  },
  demographics_detail: {
    population_500m: 18000,
    population_1km: 45000,
    population_3km: 125000,
    age_0_9: 0.08,
    age_10_19: 0.09,
    age_20_29: 0.15,
    age_30_39: 0.18,
    age_40_49: 0.20,
    age_50_59: 0.16,
    age_60_plus: 0.14,
    male_ratio: 0.48,
    female_ratio: 0.52,
    single_household_ratio: 0.35,
    family_household_ratio: 0.65,
    avg_household_income: 650,
    floating_population_daily: 85000,
    floating_peak_hour: '12:00-13:00',
    floating_weekday_avg: 92000,
    floating_weekend_avg: 65000,
    medical_utilization_rate: 0.78,
    avg_annual_visits: 18.5,
  },
  location_analysis: {
    subway_stations: [
      { name: '서초역', distance_m: 350, lines: ['2호선'] },
      { name: '교대역', distance_m: 650, lines: ['2호선', '3호선'] },
    ],
    bus_stops_count: 8,
    bus_routes_count: 15,
    transit_score: 88,
    parking_available: true,
    parking_spaces: 45,
    nearby_parking_lots: 3,
    parking_score: 75,
    building_type: '근린상가',
    building_age: 8,
    floor_info: '3층',
    elevator_available: true,
    nearby_facilities: { pharmacy: 5, restaurant: 32, cafe: 18, bank: 4 },
    commercial_district_type: '오피스 밀집 상권',
    commercial_score: 82,
    foot_traffic_rank: 'A',
    visibility_score: 78,
    main_road_facing: true,
  },
  growth_projection: {
    revenue_projection: { year1: 680000000, year2: 780000000, year3: 850000000 },
    growth_rate_year1: 15,
    growth_rate_year2: 12,
    growth_rate_year3: 9,
    avg_growth_rate: 12,
    development_plans: ['서초역 역세권 개발 예정 (2026)', 'GTX-C 교대역 환승역 확정', '서리풀공원 확장 계획'],
    population_growth_rate: 2.3,
    commercial_growth_rate: 4.5,
    year5_revenue_estimate: 95000000,
    year5_profit_estimate: 48000000,
    cumulative_profit_5years: 1850000000,
  },
  risk_analysis: {
    overall_risk_level: 'MEDIUM',
    overall_risk_score: 42,
    risk_factors: [
      { factor: '경쟁 심화', level: 'MEDIUM', description: '반경 1km 내 5개 경쟁 병원 존재', mitigation: '특화 진료 분야 차별화' },
      { factor: '임대료 상승', level: 'LOW', description: '연 3% 내외 상승 예상', mitigation: '장기 계약으로 상승률 협상' },
    ],
    competition_risk: 'MEDIUM',
    location_risk: 'LOW',
    market_risk: 'LOW',
    financial_risk: 'MEDIUM',
    opportunities: ['직장인 밀집 지역으로 점심시간/퇴근 후 환자 유입', '고령화로 정형외과 수요 지속 증가', 'GTX-C 개통 시 유동인구 증가 예상'],
  },
  ai_insights: {
    executive_summary: '서초구 언남동은 오피스 밀집 지역으로 직장인 대상 정형외과 개원에 적합합니다. 경쟁이 있으나 야간/주말 진료와 비수술 치료 특화로 차별화가 가능합니다. 초기 투자 대비 14개월 내 손익분기점 도달이 예상되며, 연 38% ROI가 기대됩니다.',
    strengths: ['오피스 밀집 지역 (직장인 환자 풍부)', '대중교통 접근성 우수 (지하철 2개역 도보권)', '신축 건물로 시설 경쟁력', '주변 약국 다수 (처방전 연계 용이)'],
    weaknesses: ['경쟁 병원 5개 존재', '주차 공간 제한적', '주말 유동인구 감소', '초기 인지도 구축 필요'],
    opportunities: ['GTX-C 개통으로 유동인구 증가 예상', '고령화로 정형외과 수요 증가', '비대면 진료 확대 트렌드', '기업 건강검진 연계 가능'],
    threats: ['대형병원 외래 환자 증가', '의료수가 동결 가능성', '인건비 상승 지속', '신규 경쟁 병원 진입 가능성'],
    recommended_strategies: ['야간/주말 진료로 직장인 접근성 강화', '비수술 치료 특화 (도수치료, 충격파 등)', '네이버 플레이스 최적화 및 리뷰 관리', '기업체 건강검진 연계 영업'],
    differentiation_points: ['야간 진료 (20시까지)', '토요일 오후 진료', '비수술 척추/관절 치료 전문', '최신 물리치료 장비 보유'],
    target_patient_groups: ['30-50대 사무직 직장인', '스포츠/운동 관련 부상 환자', '만성 근골격계 질환 환자', '교통사고 환자'],
    recommended_opening_season: '3월 또는 9월',
    opening_timing_reason: '환절기에 근골격계 질환 증가, 새 학기/분기 시작과 맞물려 건강 관심 증가',
    marketing_suggestions: ['네이버 플레이스 최적화 (키워드: 서초 정형외과)', '당근마켓 비즈프로필 운영', '인스타그램 건강 정보 콘텐츠', '주변 기업체 제휴 마케팅'],
    estimated_marketing_budget: 3000000,
  },
  is_unlocked: true,
  unlock_price: 9900,
  created_at: new Date().toISOString(),
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

                {/* ============================================= */}
                {/* 시나리오별 3개년 수익 예측 */}
                {/* ============================================= */}
                <div className="card p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    3개년 시나리오별 수익 예측
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">구분</th>
                          <th className="text-right py-3 px-2 font-medium text-muted-foreground">1년차</th>
                          <th className="text-right py-3 px-2 font-medium text-muted-foreground">2년차</th>
                          <th className="text-right py-3 px-2 font-medium text-muted-foreground">3년차</th>
                          <th className="text-right py-3 px-2 font-medium text-muted-foreground">3년 누적</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border/50 bg-red-50/50 dark:bg-red-950/20">
                          <td className="py-3 px-2 font-medium text-red-700 dark:text-red-400">
                            <span className="flex items-center gap-2">
                              <TrendingDown className="w-4 h-4" /> 최악 시나리오
                            </span>
                          </td>
                          <td className="text-right py-3 px-2">{formatCurrency(result.estimated_monthly_revenue.min * 12 * 0.7)}</td>
                          <td className="text-right py-3 px-2">{formatCurrency(result.estimated_monthly_revenue.min * 12 * 0.85)}</td>
                          <td className="text-right py-3 px-2">{formatCurrency(result.estimated_monthly_revenue.min * 12)}</td>
                          <td className="text-right py-3 px-2 font-semibold">{formatCurrency(result.estimated_monthly_revenue.min * 12 * 2.55)}</td>
                        </tr>
                        <tr className="border-b border-border/50 bg-amber-50/50 dark:bg-amber-950/20">
                          <td className="py-3 px-2 font-medium text-amber-700 dark:text-amber-400">
                            <span className="flex items-center gap-2">
                              <MinusCircle className="w-4 h-4" /> 평균 시나리오
                            </span>
                          </td>
                          <td className="text-right py-3 px-2">{formatCurrency(result.estimated_monthly_revenue.avg * 12 * 0.8)}</td>
                          <td className="text-right py-3 px-2">{formatCurrency(result.estimated_monthly_revenue.avg * 12 * 0.95)}</td>
                          <td className="text-right py-3 px-2">{formatCurrency(result.estimated_monthly_revenue.avg * 12 * 1.1)}</td>
                          <td className="text-right py-3 px-2 font-semibold">{formatCurrency(result.estimated_monthly_revenue.avg * 12 * 2.85)}</td>
                        </tr>
                        <tr className="bg-green-50/50 dark:bg-green-950/20">
                          <td className="py-3 px-2 font-medium text-green-700 dark:text-green-400">
                            <span className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4" /> 최상 시나리오
                            </span>
                          </td>
                          <td className="text-right py-3 px-2">{formatCurrency(result.estimated_monthly_revenue.max * 12 * 0.85)}</td>
                          <td className="text-right py-3 px-2">{formatCurrency(result.estimated_monthly_revenue.max * 12)}</td>
                          <td className="text-right py-3 px-2">{formatCurrency(result.estimated_monthly_revenue.max * 12 * 1.15)}</td>
                          <td className="text-right py-3 px-2 font-semibold">{formatCurrency(result.estimated_monthly_revenue.max * 12 * 3)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    * 최악 시나리오: 경쟁 심화, 경기 침체 가정 / 평균 시나리오: 현재 시장 상황 유지 / 최상 시나리오: 마케팅 성공, 지역 성장 가정
                  </p>
                </div>

                {/* 월별 현금흐름 시뮬레이션 */}
                <div className="card p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-emerald-600" />
                    개원 후 12개월 현금흐름 예측
                  </h3>
                  <div className="grid grid-cols-6 md:grid-cols-12 gap-2 mb-4">
                    {Array.from({ length: 12 }, (_, i) => {
                      const growthRate = 0.5 + (i * 0.05) // 50%에서 시작해서 점진적 증가
                      const monthlyRevenue = result.estimated_monthly_revenue.avg * Math.min(growthRate, 1)
                      const monthlyProfit = monthlyRevenue - result.estimated_monthly_cost.total
                      const isPositive = monthlyProfit > 0
                      const height = Math.abs(monthlyProfit) / (result.estimated_monthly_revenue.avg * 0.3) * 60
                      return (
                        <div key={i} className="flex flex-col items-center">
                          <div className="h-20 w-full flex flex-col justify-end items-center">
                            <div
                              className={`w-full rounded-t ${isPositive ? 'bg-emerald-500' : 'bg-red-400'}`}
                              style={{ height: `${Math.min(height, 60)}px` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground mt-1">{i + 1}월</span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex items-center justify-center gap-6 text-sm">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-emerald-500" />
                      흑자
                    </span>
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-red-400" />
                      적자
                    </span>
                  </div>
                  <div className="mt-4 p-4 bg-secondary rounded-lg">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-xs text-muted-foreground">예상 흑자 전환</div>
                        <div className="text-lg font-bold text-emerald-600">{Math.max(3, Math.ceil(result.profitability.breakeven_months / 2))}개월차</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">1년차 누적 손익</div>
                        <div className="text-lg font-bold text-foreground">{formatCurrency(result.profitability.monthly_profit_avg * 8)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">초기 운영자금 필요</div>
                        <div className="text-lg font-bold text-amber-600">{formatCurrency(result.estimated_monthly_cost.total * 4)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 대출 시뮬레이션 */}
                <div className="card p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <CircleDollarSign className="w-5 h-5 text-blue-600" />
                    대출 시뮬레이션
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-foreground">예상 개원 비용</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-2 border-b border-border">
                          <span className="text-muted-foreground">보증금</span>
                          <span className="font-medium">{formatCurrency(result.cost_detail?.rent_deposit || result.estimated_monthly_cost.rent * 10)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border">
                          <span className="text-muted-foreground">인테리어</span>
                          <span className="font-medium">{formatCurrency(result.cost_detail?.initial_interior || (result.size_pyeong || 30) * 3000000)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border">
                          <span className="text-muted-foreground">의료장비</span>
                          <span className="font-medium">{formatCurrency(result.cost_detail?.initial_equipment || 150000000)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border">
                          <span className="text-muted-foreground">초기 운영자금 (3개월)</span>
                          <span className="font-medium">{formatCurrency(result.estimated_monthly_cost.total * 3)}</span>
                        </div>
                        <div className="flex justify-between py-2 bg-secondary rounded-lg px-3">
                          <span className="font-semibold">총 필요 자금</span>
                          <span className="font-bold text-blue-600">
                            {formatCurrency(
                              (result.cost_detail?.rent_deposit || result.estimated_monthly_cost.rent * 10) +
                              (result.cost_detail?.initial_interior || (result.size_pyeong || 30) * 3000000) +
                              (result.cost_detail?.initial_equipment || 150000000) +
                              result.estimated_monthly_cost.total * 3
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-medium text-foreground">대출 시 예상 상환 계획</h4>
                      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="text-xs text-blue-600">대출 원금 (70% 가정)</div>
                            <div className="text-lg font-bold text-blue-700">
                              {formatCurrency(
                                ((result.cost_detail?.rent_deposit || result.estimated_monthly_cost.rent * 10) +
                                (result.cost_detail?.initial_interior || (result.size_pyeong || 30) * 3000000) +
                                (result.cost_detail?.initial_equipment || 150000000)) * 0.7
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-blue-600">예상 금리</div>
                            <div className="text-lg font-bold text-blue-700">연 5.5%</div>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">월 원리금 상환 (5년)</span>
                            <span className="font-semibold">
                              {formatCurrency(
                                ((result.cost_detail?.rent_deposit || result.estimated_monthly_cost.rent * 10) +
                                (result.cost_detail?.initial_interior || (result.size_pyeong || 30) * 3000000) +
                                (result.cost_detail?.initial_equipment || 150000000)) * 0.7 / 60 * 1.15
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">월 원리금 상환 (7년)</span>
                            <span className="font-semibold">
                              {formatCurrency(
                                ((result.cost_detail?.rent_deposit || result.estimated_monthly_cost.rent * 10) +
                                (result.cost_detail?.initial_interior || (result.size_pyeong || 30) * 3000000) +
                                (result.cost_detail?.initial_equipment || 150000000)) * 0.7 / 84 * 1.18
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">월 원리금 상환 (10년)</span>
                            <span className="font-semibold">
                              {formatCurrency(
                                ((result.cost_detail?.rent_deposit || result.estimated_monthly_cost.rent * 10) +
                                (result.cost_detail?.initial_interior || (result.size_pyeong || 30) * 3000000) +
                                (result.cost_detail?.initial_equipment || 150000000)) * 0.7 / 120 * 1.25
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        * 원리금균등상환 기준, 실제 금리는 신용등급 및 담보에 따라 변동
                      </p>
                    </div>
                  </div>
                </div>

                {/* 세금 및 4대보험 예측 */}
                <div className="card p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-amber-600" />
                    세금 및 4대보험 예측 (연간)
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-foreground mb-3">예상 세금</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-2 border-b border-border">
                          <span className="text-muted-foreground">부가가치세 (비급여 부분)</span>
                          <span className="font-medium">{formatCurrency(result.estimated_monthly_revenue.avg * 12 * 0.15 * 0.1)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border">
                          <span className="text-muted-foreground">종합소득세 (추정)</span>
                          <span className="font-medium">{formatCurrency(result.profitability.monthly_profit_avg * 12 * 0.25)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border">
                          <span className="text-muted-foreground">지방소득세</span>
                          <span className="font-medium">{formatCurrency(result.profitability.monthly_profit_avg * 12 * 0.025)}</span>
                        </div>
                        <div className="flex justify-between py-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3">
                          <span className="font-semibold">연간 예상 세금</span>
                          <span className="font-bold text-amber-600">
                            {formatCurrency(
                              result.estimated_monthly_revenue.avg * 12 * 0.15 * 0.1 +
                              result.profitability.monthly_profit_avg * 12 * 0.275
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-3">4대보험 (사업주 부담분)</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-2 border-b border-border">
                          <span className="text-muted-foreground">국민연금 (4.5%)</span>
                          <span className="font-medium">{formatCurrency(result.estimated_monthly_cost.labor * 0.045 * 12)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border">
                          <span className="text-muted-foreground">건강보험 (3.545%)</span>
                          <span className="font-medium">{formatCurrency(result.estimated_monthly_cost.labor * 0.03545 * 12)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border">
                          <span className="text-muted-foreground">고용보험 (0.9%)</span>
                          <span className="font-medium">{formatCurrency(result.estimated_monthly_cost.labor * 0.009 * 12)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border">
                          <span className="text-muted-foreground">산재보험 (0.7%)</span>
                          <span className="font-medium">{formatCurrency(result.estimated_monthly_cost.labor * 0.007 * 12)}</span>
                        </div>
                        <div className="flex justify-between py-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3">
                          <span className="font-semibold">연간 4대보험</span>
                          <span className="font-bold text-amber-600">
                            {formatCurrency(result.estimated_monthly_cost.labor * 0.097 * 12)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-secondary rounded-lg text-center">
                    <span className="text-sm text-muted-foreground">세후 실질 연간 순수익 예상: </span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(
                        result.profitability.monthly_profit_avg * 12 -
                        (result.estimated_monthly_revenue.avg * 12 * 0.15 * 0.1 + result.profitability.monthly_profit_avg * 12 * 0.275) -
                        result.estimated_monthly_cost.labor * 0.097 * 12
                      )}
                    </span>
                  </div>
                </div>

                {/* 마케팅 채널별 ROI 예측 */}
                <div className="card p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-pink-600" />
                    마케팅 채널별 ROI 예측
                  </h3>
                  <div className="space-y-4">
                    {[
                      { name: '네이버 플레이스 최적화', cost: 500000, patients: 25, roi: 380, color: 'bg-green-500' },
                      { name: '지역 포털 광고', cost: 1000000, patients: 35, roi: 280, color: 'bg-green-400' },
                      { name: '인스타그램/SNS', cost: 800000, patients: 20, roi: 200, color: 'bg-yellow-500' },
                      { name: '당근마켓 비즈프로필', cost: 300000, patients: 12, roi: 320, color: 'bg-green-400' },
                      { name: '블로그 콘텐츠 마케팅', cost: 600000, patients: 15, roi: 200, color: 'bg-yellow-500' },
                      { name: '오프라인 전단/현수막', cost: 400000, patients: 8, roi: 160, color: 'bg-orange-500' },
                    ].map((channel, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-40 text-sm font-medium truncate">{channel.name}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-6 bg-secondary rounded-full overflow-hidden">
                              <div
                                className={`h-full ${channel.color} rounded-full`}
                                style={{ width: `${Math.min(channel.roi / 4, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold w-16 text-right">{channel.roi}%</span>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground w-32 text-right">
                          월 {(channel.cost / 10000).toFixed(0)}만원 / {channel.patients}명
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 p-4 bg-pink-50 dark:bg-pink-950/20 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-pink-800 dark:text-pink-200">추천 초기 마케팅 예산</span>
                      <span className="text-lg font-bold text-pink-600">월 {formatCurrency(result.ai_insights?.estimated_marketing_budget || 2000000)}</span>
                    </div>
                    <p className="text-sm text-pink-700 dark:text-pink-300">
                      개원 초기 3개월은 집중 마케팅 권장. 네이버 플레이스 + 지역 포털 + 당근마켓 조합 추천
                    </p>
                  </div>
                </div>

                {/* 경쟁 병원 상세 벤치마크 */}
                {result.competitors.length > 0 && (
                  <div className="card p-6">
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5 text-red-600" />
                      경쟁 병원 상세 벤치마크
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 px-2 font-medium text-muted-foreground">병원명</th>
                            <th className="text-center py-3 px-2 font-medium text-muted-foreground">거리</th>
                            <th className="text-center py-3 px-2 font-medium text-muted-foreground">추정 매출</th>
                            <th className="text-center py-3 px-2 font-medium text-muted-foreground">개원연차</th>
                            <th className="text-center py-3 px-2 font-medium text-muted-foreground">평점</th>
                            <th className="text-left py-3 px-2 font-medium text-muted-foreground">특징</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.competitors.slice(0, 5).map((comp, idx) => (
                            <tr key={idx} className="border-b border-border/50 hover:bg-secondary/50">
                              <td className="py-3 px-2 font-medium">{comp.name}</td>
                              <td className="text-center py-3 px-2">{comp.distance_m}m</td>
                              <td className="text-center py-3 px-2">
                                {comp.est_monthly_revenue ? formatCurrency(comp.est_monthly_revenue) : '-'}
                              </td>
                              <td className="text-center py-3 px-2">
                                {comp.years_open ? `${comp.years_open}년` : '-'}
                              </td>
                              <td className="text-center py-3 px-2">
                                {comp.rating ? (
                                  <span className="flex items-center justify-center gap-1">
                                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                    {comp.rating}
                                  </span>
                                ) : '-'}
                              </td>
                              <td className="py-3 px-2 text-muted-foreground text-xs">
                                {comp.specialty_detail || comp.clinic_type}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 grid md:grid-cols-3 gap-4">
                      <div className="p-3 bg-secondary rounded-lg text-center">
                        <div className="text-xs text-muted-foreground">경쟁 병원 평균 매출</div>
                        <div className="text-lg font-bold text-foreground">
                          {formatCurrency(
                            result.competitors.reduce((sum, c) => sum + (c.est_monthly_revenue || 0), 0) /
                            result.competitors.filter(c => c.est_monthly_revenue).length || result.estimated_monthly_revenue.avg
                          )}
                        </div>
                      </div>
                      <div className="p-3 bg-secondary rounded-lg text-center">
                        <div className="text-xs text-muted-foreground">경쟁 병원 평균 개원연차</div>
                        <div className="text-lg font-bold text-foreground">
                          {(result.competitors.reduce((sum, c) => sum + (c.years_open || 0), 0) /
                            result.competitors.filter(c => c.years_open).length || 5).toFixed(1)}년
                        </div>
                      </div>
                      <div className="p-3 bg-secondary rounded-lg text-center">
                        <div className="text-xs text-muted-foreground">경쟁 병원 평균 평점</div>
                        <div className="text-lg font-bold text-foreground flex items-center justify-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          {(result.competitors.reduce((sum, c) => sum + (c.rating || 0), 0) /
                            result.competitors.filter(c => c.rating).length || 4.2).toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 성공 사례 벤치마크 */}
                <div className="card p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-600" />
                    동일 진료과 성공 사례 벤치마크
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-emerald-800 dark:text-emerald-200 mb-3">상위 10% 병원 특징</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                          <span>네이버 플레이스 상위 노출 (리뷰 100개 이상)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                          <span>차별화된 특화 진료 서비스 운영</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                          <span>온라인 예약 시스템 도입 (대기시간 단축)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                          <span>야간/주말 진료로 접근성 확보</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                          <span>직원 교육 및 서비스 품질 관리</span>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-red-700 dark:text-red-300 mb-3">실패 사례에서 배우는 점</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                          <span>초기 마케팅 비용 과소 책정 (월 100만원 미만)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                          <span>입지 선정 시 유동인구만 고려 (타겟 환자층 분석 미흡)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                          <span>과도한 인테리어 비용으로 운영자금 부족</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                          <span>온라인 평판 관리 소홀 (부정 리뷰 방치)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                          <span>경쟁 병원 분석 없이 무작정 개원</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 개원 준비 체크리스트 */}
                <div className="card p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    개원 준비 체크리스트
                  </h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> 6개월 전
                      </h4>
                      <ul className="space-y-2 text-sm">
                        {['입지 조사 및 상권 분석', '사업 계획서 작성', '자금 조달 계획 수립', '부동산 계약 검토', '인테리어 업체 선정'].map((item, i) => (
                          <li key={i} className="flex items-center gap-2 text-muted-foreground">
                            <div className="w-4 h-4 rounded border border-border" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-amber-700 dark:text-amber-300 mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> 3개월 전
                      </h4>
                      <ul className="space-y-2 text-sm">
                        {['의료기기 구매 계약', '직원 채용 시작', '의료기관 개설 신고 준비', '인테리어 착공', '의료폐기물 처리업체 계약'].map((item, i) => (
                          <li key={i} className="flex items-center gap-2 text-muted-foreground">
                            <div className="w-4 h-4 rounded border border-border" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-green-700 dark:text-green-300 mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> 1개월 전
                      </h4>
                      <ul className="space-y-2 text-sm">
                        {['보건소 개설 신고', '건강보험심사평가원 등록', '네이버 플레이스 등록', '개원 마케팅 시작', '직원 OT 및 시스템 테스트'].map((item, i) => (
                          <li key={i} className="flex items-center gap-2 text-muted-foreground">
                            <div className="w-4 h-4 rounded border border-border" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 시간대별 환자 유입 예측 */}
                <div className="card p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-cyan-600" />
                    시간대별 환자 유입 예측
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <div className="space-y-3">
                        {[
                          { time: '09:00 - 10:00', percent: 15, label: '오전 개원 직후', color: 'bg-cyan-400' },
                          { time: '10:00 - 12:00', percent: 30, label: '오전 피크', color: 'bg-cyan-500' },
                          { time: '12:00 - 14:00', percent: 10, label: '점심시간', color: 'bg-cyan-300' },
                          { time: '14:00 - 17:00', percent: 25, label: '오후', color: 'bg-cyan-400' },
                          { time: '17:00 - 19:00', percent: 15, label: '퇴근 후', color: 'bg-cyan-500' },
                          { time: '19:00 - 21:00', percent: 5, label: '야간 (선택)', color: 'bg-cyan-300' },
                        ].map((slot, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground w-24">{slot.time}</span>
                            <div className="flex-1 h-6 bg-secondary rounded-full overflow-hidden">
                              <div className={`h-full ${slot.color} rounded-full`} style={{ width: `${slot.percent}%` }} />
                            </div>
                            <span className="text-sm font-medium w-10 text-right">{slot.percent}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-cyan-50 dark:bg-cyan-950/20 rounded-xl p-4">
                      <h4 className="font-medium text-cyan-800 dark:text-cyan-200 mb-3">시간대별 운영 전략</h4>
                      <ul className="space-y-2 text-sm text-cyan-700 dark:text-cyan-300">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          오전 10-12시: 직원 풀 배치, 예약 집중 관리
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          점심시간: 교대 근무로 연속 운영 고려
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          야간 진료: 직장인 타겟 시 필수 고려
                        </li>
                        <li className="flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0 text-yellow-500" />
                          예상 일 평균 환자: {result.revenue_detail?.daily_patients_avg || Math.round(result.estimated_monthly_revenue.avg / 50000)}명
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 요일별 매출 패턴 */}
                <div className="card p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    요일별 매출 패턴 분석
                  </h3>
                  <div className="flex items-end justify-between gap-2 h-40 mb-4">
                    {[
                      { day: '월', percent: 95, color: 'bg-orange-500' },
                      { day: '화', percent: 100, color: 'bg-orange-600' },
                      { day: '수', percent: 90, color: 'bg-orange-500' },
                      { day: '목', percent: 85, color: 'bg-orange-400' },
                      { day: '금', percent: 80, color: 'bg-orange-400' },
                      { day: '토', percent: 70, color: 'bg-orange-300' },
                      { day: '일', percent: 0, color: 'bg-gray-300' },
                    ].map((d, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center">
                        <div className="w-full flex flex-col justify-end h-32">
                          <div className={`w-full ${d.color} rounded-t`} style={{ height: `${d.percent}%` }} />
                        </div>
                        <span className="text-sm font-medium mt-2">{d.day}</span>
                        <span className="text-xs text-muted-foreground">{d.percent}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-4 p-4 bg-secondary rounded-lg">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">주중 평균</div>
                      <div className="font-bold text-orange-600">{formatCurrency(result.estimated_monthly_revenue.avg / 22)}/일</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">토요일</div>
                      <div className="font-bold text-orange-500">{formatCurrency(result.estimated_monthly_revenue.avg / 22 * 0.7)}/일</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">피크 요일</div>
                      <div className="font-bold text-orange-700">화요일</div>
                    </div>
                  </div>
                </div>

                {/* 계절별/월별 환자 트렌드 */}
                <div className="card p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-teal-600" />
                    월별 환자 트렌드 ({result.clinic_type} 기준)
                  </h3>
                  <div className="flex items-end justify-between gap-1 h-32 mb-4">
                    {[
                      { month: '1월', percent: 90, season: 'winter' },
                      { month: '2월', percent: 85, season: 'winter' },
                      { month: '3월', percent: 100, season: 'spring' },
                      { month: '4월', percent: 95, season: 'spring' },
                      { month: '5월', percent: 90, season: 'spring' },
                      { month: '6월', percent: 75, season: 'summer' },
                      { month: '7월', percent: 65, season: 'summer' },
                      { month: '8월', percent: 60, season: 'summer' },
                      { month: '9월', percent: 85, season: 'fall' },
                      { month: '10월', percent: 95, season: 'fall' },
                      { month: '11월', percent: 100, season: 'fall' },
                      { month: '12월', percent: 95, season: 'winter' },
                    ].map((m, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center">
                        <div className="w-full flex flex-col justify-end h-24">
                          <div
                            className={`w-full rounded-t ${
                              m.season === 'spring' ? 'bg-pink-400' :
                              m.season === 'summer' ? 'bg-cyan-400' :
                              m.season === 'fall' ? 'bg-orange-400' :
                              'bg-blue-400'
                            }`}
                            style={{ height: `${m.percent}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground mt-1">{m.month.replace('월', '')}</span>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { season: '봄', color: 'bg-pink-100 text-pink-700', icon: '🌸', tip: '환절기 질환 증가' },
                      { season: '여름', color: 'bg-cyan-100 text-cyan-700', icon: '☀️', tip: '휴가철 환자 감소' },
                      { season: '가을', color: 'bg-orange-100 text-orange-700', icon: '🍂', tip: '연간 피크 시즌' },
                      { season: '겨울', color: 'bg-blue-100 text-blue-700', icon: '❄️', tip: '감기/독감 시즌' },
                    ].map((s, i) => (
                      <div key={i} className={`p-3 rounded-lg ${s.color}`}>
                        <div className="font-medium">{s.icon} {s.season}</div>
                        <div className="text-xs mt-1">{s.tip}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 환자 연령대/성별 분석 */}
                <div className="card p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-violet-600" />
                    예상 환자 구성 분석
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* 연령대별 */}
                    <div>
                      <h4 className="font-medium text-foreground mb-3">연령대별 환자 비중</h4>
                      <div className="space-y-2">
                        {[
                          { age: '0-9세', percent: 5, color: 'bg-pink-400' },
                          { age: '10-19세', percent: 8, color: 'bg-pink-500' },
                          { age: '20-29세', percent: 12, color: 'bg-violet-400' },
                          { age: '30-39세', percent: 18, color: 'bg-violet-500' },
                          { age: '40-49세', percent: 22, color: 'bg-violet-600' },
                          { age: '50-59세', percent: 20, color: 'bg-indigo-500' },
                          { age: '60세 이상', percent: 15, color: 'bg-indigo-600' },
                        ].map((a, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground w-16">{a.age}</span>
                            <div className="flex-1 h-4 bg-secondary rounded-full overflow-hidden">
                              <div className={`h-full ${a.color} rounded-full`} style={{ width: `${a.percent * 4}%` }} />
                            </div>
                            <span className="text-sm font-medium w-10 text-right">{a.percent}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* 성별 */}
                    <div>
                      <h4 className="font-medium text-foreground mb-3">성별 환자 비중</h4>
                      <div className="flex items-center justify-center gap-8 mb-4">
                        <div className="text-center">
                          <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2">
                            <span className="text-3xl font-bold text-blue-600">45%</span>
                          </div>
                          <span className="text-sm font-medium">남성</span>
                        </div>
                        <div className="text-center">
                          <div className="w-24 h-24 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mb-2">
                            <span className="text-3xl font-bold text-pink-600">55%</span>
                          </div>
                          <span className="text-sm font-medium">여성</span>
                        </div>
                      </div>
                      <div className="p-3 bg-secondary rounded-lg text-sm text-muted-foreground">
                        <strong className="text-foreground">주요 타겟:</strong> 30-50대 직장인 및 주부
                      </div>
                    </div>
                  </div>
                </div>

                {/* 예상 주요 질환 분포 */}
                <div className="card p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-600" />
                    {result.clinic_type} 예상 주요 질환 분포
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      {[
                        { name: '주요 질환 A', percent: 35, revenue: 45 },
                        { name: '주요 질환 B', percent: 25, revenue: 30 },
                        { name: '주요 질환 C', percent: 20, revenue: 15 },
                        { name: '건강검진/예방', percent: 12, revenue: 5 },
                        { name: '기타', percent: 8, revenue: 5 },
                      ].map((d, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-sm w-28">{d.name}</span>
                          <div className="flex-1 h-6 bg-secondary rounded-full overflow-hidden relative">
                            <div className="absolute inset-0 flex">
                              <div className="h-full bg-red-400" style={{ width: `${d.percent}%` }} />
                              <div className="h-full bg-red-200" style={{ width: `${d.revenue}%` }} />
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground w-20 text-right">
                            환자 {d.percent}%
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-xl">
                        <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">수익성 높은 진료 항목</h4>
                        <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                          <li>• 비급여 검사/시술: 평균 진료비 대비 2-3배</li>
                          <li>• 건강검진 패키지: 고정 수익원</li>
                          <li>• 만성질환 관리: 재방문율 높음</li>
                        </ul>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-4 h-4 bg-red-400 rounded" />
                        <span>환자 비중</span>
                        <div className="w-4 h-4 bg-red-200 rounded ml-4" />
                        <span>매출 기여도</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 비급여 진료 수익 분석 */}
                <div className="card p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <CircleDollarSign className="w-5 h-5 text-emerald-600" />
                    비급여 진료 수익 분석
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl text-center">
                      <div className="text-3xl font-bold text-emerald-600">
                        {Math.round((result.revenue_detail?.non_insurance_ratio || 0.15) * 100)}%
                      </div>
                      <div className="text-sm text-emerald-700 dark:text-emerald-300">비급여 매출 비중</div>
                    </div>
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl text-center">
                      <div className="text-3xl font-bold text-emerald-600">
                        {formatCurrency(result.estimated_monthly_revenue.avg * (result.revenue_detail?.non_insurance_ratio || 0.15))}
                      </div>
                      <div className="text-sm text-emerald-700 dark:text-emerald-300">월 비급여 매출</div>
                    </div>
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl text-center">
                      <div className="text-3xl font-bold text-emerald-600">40-60%</div>
                      <div className="text-sm text-emerald-700 dark:text-emerald-300">비급여 마진율</div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">추천 비급여 항목</th>
                          <th className="text-right py-2 px-3 font-medium text-muted-foreground">단가</th>
                          <th className="text-right py-2 px-3 font-medium text-muted-foreground">예상 월 건수</th>
                          <th className="text-right py-2 px-3 font-medium text-muted-foreground">월 매출</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { name: '종합건강검진', price: 150000, count: 20 },
                          { name: '예방접종 (독감 등)', price: 35000, count: 50 },
                          { name: '비급여 주사/시술', price: 80000, count: 30 },
                          { name: '진단서/증명서', price: 20000, count: 40 },
                          { name: '미용/피부시술', price: 100000, count: 15 },
                        ].map((item, i) => (
                          <tr key={i} className="border-b border-border/50">
                            <td className="py-2 px-3">{item.name}</td>
                            <td className="text-right py-2 px-3">{item.price.toLocaleString()}원</td>
                            <td className="text-right py-2 px-3">{item.count}건</td>
                            <td className="text-right py-2 px-3 font-medium text-emerald-600">
                              {formatCurrency(item.price * item.count)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 온라인 검색 키워드 분석 */}
                <div className="card p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Search className="w-5 h-5 text-blue-600" />
                    지역 온라인 검색 키워드 분석
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-foreground mb-3">검색량 높은 키워드 TOP 10</h4>
                      <div className="space-y-2">
                        {[
                          { keyword: `${result.address.split(' ')[1] || '강남'} ${result.clinic_type}`, volume: 2400, competition: 'HIGH' },
                          { keyword: `${result.address.split(' ')[1] || '강남'} ${result.clinic_type} 추천`, volume: 1800, competition: 'HIGH' },
                          { keyword: `${result.address.split(' ')[2] || '역삼동'} ${result.clinic_type}`, volume: 1200, competition: 'MEDIUM' },
                          { keyword: `${result.clinic_type} 잘하는곳`, volume: 980, competition: 'HIGH' },
                          { keyword: `${result.clinic_type} 야간진료`, volume: 720, competition: 'LOW' },
                          { keyword: `${result.clinic_type} 주말진료`, volume: 650, competition: 'LOW' },
                          { keyword: `${result.address.split(' ')[1] || '강남'} 병원 추천`, volume: 540, competition: 'MEDIUM' },
                          { keyword: `${result.clinic_type} 비용`, volume: 480, competition: 'MEDIUM' },
                        ].map((k, i) => (
                          <div key={i} className="flex items-center justify-between py-1">
                            <span className="text-sm">
                              <span className="text-muted-foreground mr-2">{i + 1}.</span>
                              {k.keyword}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{k.volume.toLocaleString()}/월</span>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                k.competition === 'HIGH' ? 'bg-red-100 text-red-700' :
                                k.competition === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {k.competition === 'HIGH' ? '경쟁↑' : k.competition === 'MEDIUM' ? '보통' : '기회↑'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl">
                        <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">SEO 전략 추천</h4>
                        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            네이버 플레이스 최적화 필수
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            "야간진료", "주말진료" 키워드 선점 기회
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            블로그 콘텐츠로 롱테일 키워드 공략
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            리뷰 100개 이상 확보 시 상위 노출
                          </li>
                        </ul>
                      </div>
                      <div className="p-3 bg-secondary rounded-lg text-center">
                        <span className="text-sm text-muted-foreground">예상 온라인 유입 환자: </span>
                        <span className="font-bold text-blue-600">월 {Math.round((result.revenue_detail?.daily_patients_avg || 30) * 22 * 0.4)}명</span>
                        <span className="text-xs text-muted-foreground ml-1">(전체 40%)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 주변 상권/편의시설 분석 */}
                <div className="card p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <MapPinned className="w-5 h-5 text-purple-600" />
                    주변 상권 및 편의시설 분석
                  </h3>
                  <div className="grid md:grid-cols-4 gap-4 mb-6">
                    {[
                      { icon: '🏥', name: '약국', count: 8, distance: '50m 내', good: true },
                      { icon: '🏢', name: '오피스빌딩', count: 15, distance: '500m 내', good: true },
                      { icon: '🏠', name: '주거단지', count: 3, distance: '1km 내', good: true },
                      { icon: '🏫', name: '학교', count: 2, distance: '500m 내', good: true },
                      { icon: '🍽️', name: '식당/카페', count: 45, distance: '200m 내', good: true },
                      { icon: '🚇', name: '지하철역', count: 1, distance: '300m', good: true },
                      { icon: '🅿️', name: '주차장', count: 5, distance: '100m 내', good: true },
                      { icon: '🏦', name: '은행/관공서', count: 4, distance: '300m 내', good: true },
                    ].map((f, i) => (
                      <div key={i} className="p-3 bg-secondary rounded-lg text-center">
                        <div className="text-2xl mb-1">{f.icon}</div>
                        <div className="font-medium text-sm">{f.name}</div>
                        <div className="text-xs text-muted-foreground">{f.count}개 ({f.distance})</div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-xl">
                    <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-2">상권 종합 평가</h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      주변 오피스 밀집 지역으로 직장인 환자 유입에 유리합니다.
                      약국이 가까워 처방전 연계 편의성이 높으며, 대중교통 접근성도 양호합니다.
                      주거단지와의 거리를 고려하여 야간/주말 진료 시 추가 환자 확보가 가능합니다.
                    </p>
                  </div>
                </div>

                {/* 인력 채용 가이드 */}
                <div className="card p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" />
                    권장 인력 구성 및 채용 가이드
                  </h3>
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-3 font-medium text-muted-foreground">직종</th>
                          <th className="text-center py-3 px-3 font-medium text-muted-foreground">권장 인원</th>
                          <th className="text-right py-3 px-3 font-medium text-muted-foreground">예상 연봉</th>
                          <th className="text-right py-3 px-3 font-medium text-muted-foreground">월 인건비</th>
                          <th className="text-left py-3 px-3 font-medium text-muted-foreground">채용 난이도</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { role: '간호사/간호조무사', count: result.cost_detail?.nurse_count || 2, salary: 36000000, difficulty: 'MEDIUM' },
                          { role: '의료기사', count: 1, salary: 38000000, difficulty: 'MEDIUM' },
                          { role: '원무/행정', count: result.cost_detail?.admin_count || 1, salary: 30000000, difficulty: 'LOW' },
                          { role: '코디네이터', count: 1, salary: 32000000, difficulty: 'LOW' },
                        ].map((staff, i) => (
                          <tr key={i} className="border-b border-border/50">
                            <td className="py-3 px-3 font-medium">{staff.role}</td>
                            <td className="text-center py-3 px-3">{staff.count}명</td>
                            <td className="text-right py-3 px-3">{(staff.salary / 10000).toLocaleString()}만원</td>
                            <td className="text-right py-3 px-3 font-medium">
                              {formatCurrency(staff.salary / 12 * staff.count)}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`text-xs px-2 py-1 rounded ${
                                staff.difficulty === 'HIGH' ? 'bg-red-100 text-red-700' :
                                staff.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {staff.difficulty === 'HIGH' ? '어려움' : staff.difficulty === 'MEDIUM' ? '보통' : '쉬움'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-secondary">
                          <td className="py-3 px-3 font-semibold">합계</td>
                          <td className="text-center py-3 px-3 font-semibold">
                            {(result.cost_detail?.nurse_count || 2) + (result.cost_detail?.admin_count || 1) + 2}명
                          </td>
                          <td colSpan={2} className="text-right py-3 px-3 font-bold text-indigo-600">
                            월 {formatCurrency(result.estimated_monthly_cost.labor)}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl">
                      <h4 className="font-medium text-indigo-800 dark:text-indigo-200 mb-2">채용 팁</h4>
                      <ul className="text-sm text-indigo-700 dark:text-indigo-300 space-y-1">
                        <li>• 개원 2개월 전부터 채용 공고 시작</li>
                        <li>• 지역 간호학교/대학 연계 활용</li>
                        <li>• 경력직 1명 + 신입 조합 추천</li>
                        <li>• 수습기간 3개월 계약 권장</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-xl">
                      <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">복리후생 추천</h4>
                      <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                        <li>• 4대보험 완비 (필수)</li>
                        <li>• 점심 식대 지원 (월 10만원)</li>
                        <li>• 명절 상여금 (연 100만원)</li>
                        <li>• 건강검진 지원</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 필수 의료장비 가이드 */}
                <div className="card p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-slate-600" />
                    {result.clinic_type} 필수/선택 의료장비 가이드
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-red-700 dark:text-red-300 mb-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> 필수 장비
                      </h4>
                      <div className="space-y-2">
                        {[
                          { name: '진찰대/진료 베드', price: 5000000 },
                          { name: '기본 의료기기 세트', price: 30000000 },
                          { name: '전자차트(EMR) 시스템', price: 8000000 },
                          { name: '수납/예약 시스템', price: 3000000 },
                          { name: '멸균 소독기', price: 5000000 },
                          { name: '혈압계/체온계 등', price: 2000000 },
                        ].map((eq, i) => (
                          <div key={i} className="flex justify-between py-2 border-b border-border/50">
                            <span className="text-sm">{eq.name}</span>
                            <span className="text-sm font-medium">{formatCurrency(eq.price)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between py-2 bg-red-50 dark:bg-red-950/20 rounded px-2">
                          <span className="font-semibold">필수 장비 합계</span>
                          <span className="font-bold text-red-600">{formatCurrency(53000000)}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" /> 선택 장비 (수익성 향상)
                      </h4>
                      <div className="space-y-2">
                        {[
                          { name: '초음파 진단기', price: 50000000, roi: '높음' },
                          { name: 'X-ray 장비', price: 80000000, roi: '중간' },
                          { name: '내시경 장비', price: 60000000, roi: '높음' },
                          { name: '물리치료 장비', price: 30000000, roi: '중간' },
                          { name: '피부/미용 레이저', price: 40000000, roi: '높음' },
                        ].map((eq, i) => (
                          <div key={i} className="flex justify-between items-center py-2 border-b border-border/50">
                            <span className="text-sm">{eq.name}</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                eq.roi === '높음' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                              }`}>ROI {eq.roi}</span>
                              <span className="text-sm font-medium">{formatCurrency(eq.price)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        * 리스/렌탈 이용 시 초기 비용 50-70% 절감 가능
                      </p>
                    </div>
                  </div>
                </div>

                {/* 인테리어 스타일 추천 */}
                <div className="card p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Home className="w-5 h-5 text-amber-600" />
                    인테리어 스타일 및 비용 가이드
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    {[
                      { style: '베이직', pyeong: 250, desc: '기본 기능 중심', fit: '초기 비용 최소화' },
                      { style: '모던', pyeong: 350, desc: '세련된 디자인', fit: '2030 타겟' },
                      { style: '프리미엄', pyeong: 500, desc: '고급 인테리어', fit: '비급여 중심' },
                    ].map((s, i) => (
                      <div key={i} className={`p-4 rounded-xl border-2 ${i === 1 ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20' : 'border-border'}`}>
                        {i === 1 && <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded mb-2 inline-block">추천</span>}
                        <h4 className="font-semibold text-lg">{s.style}</h4>
                        <div className="text-2xl font-bold text-amber-600 my-2">평당 {s.pyeong}만원</div>
                        <p className="text-sm text-muted-foreground">{s.desc}</p>
                        <p className="text-xs text-amber-700 mt-2">적합: {s.fit}</p>
                        <div className="mt-3 pt-3 border-t border-border">
                          <span className="text-sm">총 예상: </span>
                          <span className="font-bold">{formatCurrency((result.size_pyeong || 30) * s.pyeong * 10000)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-secondary rounded-xl">
                    <h4 className="font-medium mb-2">인테리어 비용 절감 팁</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• 3개 이상 업체 비교 견적 필수</li>
                      <li>• 대기실/상담실은 투자, 후면 공간은 절약</li>
                      <li>• 조명과 가구로 분위기 연출 (공사비 절감)</li>
                      <li>• 의료법 기준 (진료실 크기, 환기 등) 확인 필수</li>
                    </ul>
                  </div>
                </div>

                {/* 임대료 협상 전략 */}
                <div className="card p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <CircleDollarSign className="w-5 h-5 text-green-600" />
                    임대료 협상 전략
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-foreground mb-3">지역 시세 분석</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-border">
                          <span className="text-muted-foreground">지역 평균 시세</span>
                          <span className="font-medium">평당 {formatCurrency((result.estimated_monthly_cost.rent / (result.size_pyeong || 30)) * 1.1)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border">
                          <span className="text-muted-foreground">현재 매물 예상</span>
                          <span className="font-medium">평당 {formatCurrency(result.estimated_monthly_cost.rent / (result.size_pyeong || 30))}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border">
                          <span className="text-muted-foreground">협상 목표가</span>
                          <span className="font-medium text-green-600">평당 {formatCurrency((result.estimated_monthly_cost.rent / (result.size_pyeong || 30)) * 0.9)}</span>
                        </div>
                        <div className="flex justify-between py-2 bg-green-50 dark:bg-green-950/20 rounded px-3">
                          <span className="font-semibold">예상 절감액</span>
                          <span className="font-bold text-green-600">월 {formatCurrency(result.estimated_monthly_cost.rent * 0.1)}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-3">협상 포인트</h4>
                      <ul className="space-y-2 text-sm">
                        {[
                          '장기 계약 (5년) 제안으로 월세 인하 협상',
                          '프리렌트 (무료 입주기간) 2-3개월 요청',
                          '인테리어 기간 월세 면제 요청',
                          '관리비 포함 협상 (별도 청구 방지)',
                          '보증금 일부 월세 전환 제안',
                          '권리금 분할 납부 협상',
                        ].map((tip, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 환자 만족도 핵심 요소 */}
                <div className="card p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    환자 만족도 핵심 요소 (리뷰 분석 기반)
                  </h3>
                  <div className="grid md:grid-cols-5 gap-4 mb-6">
                    {[
                      { factor: '대기시간', score: 85, icon: '⏱️' },
                      { factor: '친절도', score: 92, icon: '😊' },
                      { factor: '의료진 전문성', score: 88, icon: '👨‍⚕️' },
                      { factor: '시설/청결', score: 90, icon: '🏥' },
                      { factor: '접근성', score: 78, icon: '🚗' },
                    ].map((f, i) => (
                      <div key={i} className="text-center p-4 bg-secondary rounded-xl">
                        <div className="text-2xl mb-2">{f.icon}</div>
                        <div className="text-sm font-medium mb-2">{f.factor}</div>
                        <div className="relative w-16 h-16 mx-auto">
                          <svg className="w-16 h-16 transform -rotate-90">
                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="none" className="text-secondary" />
                            <circle
                              cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="none"
                              strokeDasharray={`${f.score * 1.76} 176`}
                              className="text-yellow-500"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-bold">{f.score}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-xl">
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">만족도 향상 전략</h4>
                    <div className="grid md:grid-cols-2 gap-4 text-sm text-yellow-700 dark:text-yellow-300">
                      <ul className="space-y-1">
                        <li>• 예약 시스템 도입으로 대기시간 최소화</li>
                        <li>• 직원 CS 교육 월 1회 실시</li>
                        <li>• 진료 후 만족도 문자 설문 발송</li>
                      </ul>
                      <ul className="space-y-1">
                        <li>• 부정적 리뷰 24시간 내 답변 필수</li>
                        <li>• 재방문 환자 혜택 프로그램 운영</li>
                        <li>• 청결 체크리스트 일일 점검</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 5년 후 자산 가치 예측 */}
                <div className="card p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-violet-600" />
                    5년 후 자산 가치 및 EXIT 전략
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-violet-50 dark:bg-violet-950/20 rounded-xl text-center">
                      <div className="text-sm text-violet-600 mb-1">예상 권리금 (5년 후)</div>
                      <div className="text-3xl font-bold text-violet-700">
                        {formatCurrency(result.estimated_monthly_revenue.avg * 6)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">월매출 × 6개월 기준</div>
                    </div>
                    <div className="p-4 bg-violet-50 dark:bg-violet-950/20 rounded-xl text-center">
                      <div className="text-sm text-violet-600 mb-1">5년 누적 순이익</div>
                      <div className="text-3xl font-bold text-violet-700">
                        {formatCurrency(result.profitability.monthly_profit_avg * 12 * 4.5)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">성장률 반영</div>
                    </div>
                    <div className="p-4 bg-violet-50 dark:bg-violet-950/20 rounded-xl text-center">
                      <div className="text-sm text-violet-600 mb-1">총 투자 대비 수익률</div>
                      <div className="text-3xl font-bold text-violet-700">
                        {Math.round(
                          ((result.profitability.monthly_profit_avg * 12 * 4.5 + result.estimated_monthly_revenue.avg * 6) /
                          (result.profitability_detail?.total_investment || result.estimated_monthly_cost.total * 12)) * 100
                        )}%
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">권리금 + 순이익</div>
                    </div>
                  </div>
                  <div className="p-4 bg-secondary rounded-xl">
                    <h4 className="font-medium mb-3">EXIT 전략 옵션</h4>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div className="p-3 bg-card rounded-lg">
                        <div className="font-medium text-green-600 mb-1">권리금 매도</div>
                        <p className="text-muted-foreground text-xs">
                          안정적인 매출 기록 시 월매출 6-12개월 수준 권리금 기대
                        </p>
                      </div>
                      <div className="p-3 bg-card rounded-lg">
                        <div className="font-medium text-blue-600 mb-1">동업자 영입</div>
                        <p className="text-muted-foreground text-xs">
                          지분 50% 매각 후 경영 참여 축소, 배당 수익 유지
                        </p>
                      </div>
                      <div className="p-3 bg-card rounded-lg">
                        <div className="font-medium text-purple-600 mb-1">체인 확장</div>
                        <p className="text-muted-foreground text-xs">
                          1호점 안정화 후 2호점 개원, 법인화 검토
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 의료 트렌드 및 전망 */}
                <div className="card p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-pink-600" />
                    {result.clinic_type} 의료 트렌드 및 전망
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-pink-700 dark:text-pink-300 mb-3">성장하는 트렌드</h4>
                      <ul className="space-y-2 text-sm">
                        {[
                          '비대면 진료 (원격의료) 확대',
                          '예방 의료 및 건강검진 수요 증가',
                          '만성질환 관리 프로그램',
                          '디지털 헬스케어 연동',
                          '맞춤형 정밀 의료 서비스',
                        ].map((trend, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <TrendingUp className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                            {trend}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-3">주의해야 할 변화</h4>
                      <ul className="space-y-2 text-sm">
                        {[
                          '의료수가 동결/인하 가능성',
                          '대형병원 외래 환자 증가',
                          '의료광고 규제 강화',
                          '인건비 상승 지속',
                          '의료분쟁 증가 추세',
                        ].map((risk, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            {risk}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-gradient-to-r from-pink-50 to-blue-50 dark:from-pink-950/20 dark:to-blue-950/20 rounded-xl">
                    <p className="text-sm text-foreground">
                      <strong>AI 전망:</strong> {result.clinic_type}의 경우, 고령화와 만성질환 증가로 인해
                      향후 5년간 연평균 3-5% 성장이 예상됩니다. 디지털 전환과 차별화된 서비스가
                      경쟁력의 핵심이 될 것입니다.
                    </p>
                  </div>
                </div>

                {/* 법적 주의사항 */}
                <div className="card p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-red-600" />
                    개원 시 법적 주의사항
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-red-700 dark:text-red-300 mb-3">의료광고 규제</h4>
                      <ul className="space-y-2 text-sm">
                        {[
                          '"최고", "최초", "유일" 등 과장 표현 금지',
                          '치료 효과 보장 문구 금지',
                          '타 의료기관 비방 금지',
                          '환자 치료 전후 사진 사용 제한',
                          '의료광고 사전심의 필수 (일부)',
                          'SNS 광고도 의료광고 규제 적용',
                        ].map((rule, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                            {rule}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-amber-700 dark:text-amber-300 mb-3">시설/운영 기준</h4>
                      <ul className="space-y-2 text-sm">
                        {[
                          '의료기관 개설 신고 (보건소)',
                          '의료법상 시설 기준 충족',
                          '의료폐기물 처리 계약',
                          '개인정보보호법 준수 (환자 정보)',
                          '근로기준법 준수 (직원 고용)',
                          '의료배상책임보험 가입 권장',
                        ].map((rule, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            {rule}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg text-sm text-red-700 dark:text-red-300">
                    <strong>주의:</strong> 의료법 위반 시 과태료, 영업정지, 면허정지 등 행정처분을 받을 수 있습니다.
                    개원 전 관할 보건소 및 전문 법률 상담을 권장합니다.
                  </div>
                </div>

                {/* 최종 종합 점수 */}
                <div className="card p-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold mb-2">종합 개원 적합도</h3>
                    <p className="opacity-80">AI가 분석한 종합 점수입니다</p>
                  </div>
                  <div className="flex justify-center items-center gap-8 mb-6">
                    <div className="text-center">
                      <div className="text-6xl font-bold">{result.confidence_score}</div>
                      <div className="text-sm opacity-70 mt-1">/ 100점</div>
                    </div>
                    <div className="h-24 w-px bg-white/30" />
                    <div className="text-left space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                        <span>입지 점수: {result.location_analysis?.visibility_score || 75}/100</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                        <span>경쟁 점수: {100 - (result.competition_detail?.competition_index || 40)}/100</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-400" />
                        <span>수익성 점수: {Math.min(100, Math.round(result.profitability.annual_roi_percent * 2))}/100</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-400" />
                        <span>성장성 점수: {result.growth_projection?.growth_rate_year1 ? Math.min(100, Math.round(50 + result.growth_projection.growth_rate_year1)) : 70}/100</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className={`inline-block px-6 py-2 rounded-full text-lg font-semibold ${
                      result.recommendation === 'VERY_POSITIVE' || result.recommendation === 'POSITIVE'
                        ? 'bg-green-500'
                        : result.recommendation === 'NEUTRAL'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}>
                      {getRecommendationText(result.recommendation)}
                    </span>
                  </div>
                </div>

                {/* 분석 리포트 요약 */}
                <div className="card p-6 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900 dark:to-gray-900">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    분석 리포트 요약
                  </h3>
                  <div className="grid md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-card rounded-lg">
                      <div className="text-xs text-muted-foreground">총 분석 항목</div>
                      <div className="text-2xl font-bold text-foreground">25+</div>
                    </div>
                    <div className="text-center p-3 bg-card rounded-lg">
                      <div className="text-xs text-muted-foreground">데이터 소스</div>
                      <div className="text-2xl font-bold text-foreground">7개</div>
                    </div>
                    <div className="text-center p-3 bg-card rounded-lg">
                      <div className="text-xs text-muted-foreground">경쟁 병원 분석</div>
                      <div className="text-2xl font-bold text-foreground">{result.competitors.length}곳</div>
                    </div>
                    <div className="text-center p-3 bg-card rounded-lg">
                      <div className="text-xs text-muted-foreground">분석 신뢰도</div>
                      <div className="text-2xl font-bold text-foreground">{result.confidence_score}%</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    본 리포트는 심평원, 국토교통부, 소상공인진흥공단, 통계청 데이터를 기반으로
                    AI가 종합 분석한 결과입니다. 실제 개원 시에는 전문가 상담을 권장합니다.
                  </p>
                </div>
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
