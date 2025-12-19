'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import {
  ArrowLeft, MapPin, Building2, TrendingUp, Users, Target,
  ChevronRight, Download, AlertCircle, CheckCircle2, MinusCircle
} from 'lucide-react'
import { simulationService } from '@/lib/api/services'
import { SimulationResponse } from '@/lib/api/client'
import { toast } from 'sonner'

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

export default function SimulatePage() {
  const [result, setResult] = useState<SimulationResponse | null>(null)

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
      toast.success('시뮬레이션이 완료되었습니다!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || '시뮬레이션에 실패했습니다.')
    },
  })

  const onSubmit = (data: SimulationForm) => {
    mutation.mutate(data)
  }

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'VERY_POSITIVE':
        return 'text-green-600 bg-green-100'
      case 'POSITIVE':
        return 'text-green-500 bg-green-50'
      case 'NEUTRAL':
        return 'text-yellow-600 bg-yellow-100'
      case 'NEGATIVE':
        return 'text-orange-600 bg-orange-100'
      case 'VERY_NEGATIVE':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">OpenSim</span>
            </div>
          </div>
          <span className="text-sm text-gray-500">개원 시뮬레이터</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {!result ? (
            /* Form Section */
            <div className="bg-white rounded-2xl shadow-sm border p-8">
              <div className="max-w-xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  3분 개원 시뮬레이션
                </h1>
                <p className="text-gray-600 mb-8">
                  주소와 진료과목만 입력하면 예상 매출, 비용, 손익분기점을 분석해드립니다.
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      개원 예정 주소 *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        {...register('address')}
                        type="text"
                        placeholder="예: 서울시 강남구 역삼동 123-45"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    {errors.address && (
                      <p className="mt-1 text-sm text-red-500">{errors.address.message}</p>
                    )}
                  </div>

                  {/* Clinic Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      진료과목 *
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        {...register('clinic_type')}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white"
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
                      <p className="mt-1 text-sm text-red-500">{errors.clinic_type.message}</p>
                    )}
                  </div>

                  {/* Optional Fields */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        면적 (평) <span className="text-gray-400">선택</span>
                      </label>
                      <input
                        {...register('size_pyeong', { valueAsNumber: true })}
                        type="number"
                        placeholder="예: 30"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        예산 (백만원) <span className="text-gray-400">선택</span>
                      </label>
                      <input
                        {...register('budget_million', { valueAsNumber: true })}
                        type="number"
                        placeholder="예: 500"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="w-full bg-primary-600 text-white py-4 rounded-xl font-medium hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

                <p className="mt-4 text-center text-sm text-gray-500">
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
                  <h1 className="text-2xl font-bold text-gray-900">시뮬레이션 결과</h1>
                  <p className="text-gray-600">{result.address} · {result.clinic_type}</p>
                </div>
                <button
                  onClick={() => setResult(null)}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  새로운 시뮬레이션
                </button>
              </div>

              {/* Recommendation Card */}
              <div className={`rounded-2xl p-6 ${getRecommendationColor(result.recommendation)}`}>
                <div className="flex items-center gap-3 mb-2">
                  {getRecommendationIcon(result.recommendation)}
                  <span className="font-bold text-lg">
                    개원 추천: {getRecommendationText(result.recommendation)}
                  </span>
                </div>
                <p>{result.recommendation_reason}</p>
                <div className="mt-4 flex items-center gap-2">
                  <div className="bg-white/50 rounded-full px-3 py-1 text-sm font-medium">
                    신뢰도 {result.confidence_score}%
                  </div>
                </div>
              </div>

              {/* Main Stats Grid */}
              <div className="grid md:grid-cols-3 gap-6">
                {/* Revenue Card */}
                <div className="bg-white rounded-2xl border p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-4">예상 월 매출</h3>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {formatCurrency(result.estimated_monthly_revenue.avg)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatCurrency(result.estimated_monthly_revenue.min)} ~ {formatCurrency(result.estimated_monthly_revenue.max)}
                  </div>
                </div>

                {/* Cost Card */}
                <div className="bg-white rounded-2xl border p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-4">예상 월 비용</h3>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {formatCurrency(result.estimated_monthly_cost.total)}
                  </div>
                  <div className="text-sm text-gray-500 space-y-1">
                    <div>임대료: {formatCurrency(result.estimated_monthly_cost.rent)}</div>
                    <div>인건비: {formatCurrency(result.estimated_monthly_cost.labor)}</div>
                  </div>
                </div>

                {/* Profit Card */}
                <div className="bg-white rounded-2xl border p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-4">예상 월 순이익</h3>
                  <div className={`text-3xl font-bold mb-2 ${result.profitability.monthly_profit_avg >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(result.profitability.monthly_profit_avg)}
                  </div>
                  <div className="text-sm text-gray-500">
                    손익분기점: {result.profitability.breakeven_months}개월
                  </div>
                </div>
              </div>

              {/* ROI Card */}
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-sm opacity-80 mb-1">연 예상 ROI</div>
                    <div className="text-3xl font-bold">{result.profitability.annual_roi_percent}%</div>
                  </div>
                  <div>
                    <div className="text-sm opacity-80 mb-1">손익분기점</div>
                    <div className="text-3xl font-bold">{result.profitability.breakeven_months}개월</div>
                  </div>
                  <div>
                    <div className="text-sm opacity-80 mb-1">경쟁 병원</div>
                    <div className="text-3xl font-bold">{result.competition.same_dept_count}개</div>
                  </div>
                </div>
              </div>

              {/* Competition & Demographics */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Competition */}
                <div className="bg-white rounded-2xl border p-6">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary-600" />
                    경쟁 현황
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">분석 반경</span>
                      <span className="font-medium">{result.competition.radius_m}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">동일 진료과 병원</span>
                      <span className="font-medium">{result.competition.same_dept_count}개</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">전체 의료기관</span>
                      <span className="font-medium">{result.competition.total_clinic_count}개</span>
                    </div>
                  </div>

                  {result.competitors.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">주요 경쟁 병원</h4>
                      <div className="space-y-2">
                        {result.competitors.slice(0, 3).map((comp, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-600">{comp.name}</span>
                            <span className="text-gray-500">{comp.distance_m}m</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Demographics */}
                <div className="bg-white rounded-2xl border p-6">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary-600" />
                    인구 현황
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">반경 1km 인구</span>
                      <span className="font-medium">{result.demographics.population_1km.toLocaleString()}명</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">40대 이상 비율</span>
                      <span className="font-medium">{(result.demographics.age_40_plus_ratio * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">일 유동인구</span>
                      <span className="font-medium">{result.demographics.floating_population_daily.toLocaleString()}명</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="bg-white rounded-2xl border p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-gray-900">상세 리포트 받기</h3>
                  <p className="text-gray-600">AI 분석이 포함된 PDF 리포트를 받아보세요</p>
                </div>
                <button className="bg-primary-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-700 transition flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  리포트 구매 (3만원)
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
