'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
  DollarSign,
  Users,
  ShieldCheck,
  MapPin,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Calendar,
  ChevronDown,
  BarChart3,
  ArrowLeft,
} from 'lucide-react'
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { TossIcon } from '@/components/ui/TossIcon'
import { emrDashboardService } from '@/lib/api/services'

type PeriodDays = 30 | 90 | 180

const PERIOD_OPTIONS: { label: string; value: PeriodDays }[] = [
  { label: '30일', value: 30 },
  { label: '90일', value: 90 },
  { label: '180일', value: 180 },
]

const PIE_COLORS = ['#3182f6', '#f97316']

function formatKRW(amount: number): string {
  if (amount >= 100_000_000) return `${(amount / 100_000_000).toFixed(1)}억`
  if (amount >= 10_000) return `${Math.round(amount / 10_000).toLocaleString()}만`
  return amount.toLocaleString()
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export default function EMRDashboardPage() {
  const router = useRouter()
  const [days, setDays] = useState<PeriodDays>(90)
  const [showPeriodMenu, setShowPeriodMenu] = useState(false)

  const { data: summary, isLoading: summaryLoading, error: summaryError } = useQuery({
    queryKey: ['emr-summary'],
    queryFn: () => emrDashboardService.getSummary(),
    retry: false,
  })

  const { data: revenueTrend, isLoading: revenueLoading } = useQuery({
    queryKey: ['emr-revenue-trend', days],
    queryFn: () => emrDashboardService.getRevenueTrend(days),
    retry: false,
  })

  const { data: patientTrend, isLoading: patientLoading } = useQuery({
    queryKey: ['emr-patient-trend', days],
    queryFn: () => emrDashboardService.getPatientTrend(days),
    retry: false,
  })

  const { data: insuranceBreakdown, isLoading: insuranceLoading } = useQuery({
    queryKey: ['emr-insurance-breakdown'],
    queryFn: () => emrDashboardService.getInsuranceBreakdown(),
    retry: false,
  })

  const { data: benchmark, isLoading: benchmarkLoading } = useQuery({
    queryKey: ['emr-regional-benchmark'],
    queryFn: () => emrDashboardService.getRegionalBenchmark(),
    retry: false,
  })

  // 403 에러 → 구독 안내 페이지
  const is403 = (summaryError as any)?.response?.status === 403
  if (is403) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-md text-center space-y-4">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto">
            <BarChart3 className="w-8 h-8 text-blue-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">EMR 구독이 필요합니다</h2>
          <p className="text-gray-500 text-sm">
            비즈니스 분석 대시보드는 PlatonEMR 구독자만 이용할 수 있습니다.
            무료 STARTER 플랜으로 시작해보세요.
          </p>
          <button
            onClick={() => router.push('/subscription/emr')}
            className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
          >
            구독 시작하기
          </button>
          <button
            onClick={() => router.back()}
            className="text-gray-400 text-sm hover:text-gray-600"
          >
            돌아가기
          </button>
        </div>
      </div>
    )
  }

  const isDemo = summary?.is_demo || revenueTrend?.is_demo || patientTrend?.is_demo
  const isLoading = summaryLoading || revenueLoading || patientLoading || insuranceLoading || benchmarkLoading

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">EMR 비즈니스 분석</h1>
              <p className="text-sm text-gray-500 mt-0.5">매출, 환자, 보험 비율, 지역 벤치마크를 한눈에</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* 기간 선택 */}
            <div className="relative">
              <button
                onClick={() => setShowPeriodMenu(!showPeriodMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                {PERIOD_OPTIONS.find((o) => o.value === days)?.label}
                <ChevronDown className="w-4 h-4" />
              </button>
              {showPeriodMenu && (
                <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                  {PERIOD_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setDays(opt.value)
                        setShowPeriodMenu(false)
                      }}
                      className={`w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors ${
                        days === opt.value ? 'text-blue-600 font-medium bg-blue-50' : 'text-gray-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Demo Banner */}
        {isDemo && (
          <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              현재 <span className="font-semibold">데모 데이터</span>를 표시하고 있습니다. 실제 EMR 데이터가 연동되면 자동으로 전환됩니다.
            </p>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 이번달 매출 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <TossIcon icon={DollarSign} color="from-blue-500 to-cyan-500" size="sm" />
              {summary && summary.revenue_change_pct !== 0 && (
                <span
                  className={`flex items-center gap-0.5 text-xs font-medium ${
                    summary.revenue_change_pct > 0 ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {summary.revenue_change_pct > 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {summary.revenue_change_pct > 0 ? '+' : ''}
                  {summary.revenue_change_pct}%
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {summaryLoading ? (
                <span className="inline-block w-24 h-7 bg-gray-100 rounded animate-pulse" />
              ) : (
                `\u20A9${formatKRW(summary?.total_revenue || 0)}`
              )}
            </p>
            <p className="text-xs text-gray-500 mt-1">이번달 매출</p>
          </div>

          {/* 환자 수 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <TossIcon icon={Users} color="from-emerald-500 to-green-500" size="sm" />
              {summary && summary.patient_change_pct !== 0 && (
                <span
                  className={`flex items-center gap-0.5 text-xs font-medium ${
                    summary.patient_change_pct > 0 ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {summary.patient_change_pct > 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {summary.patient_change_pct > 0 ? '+' : ''}
                  {summary.patient_change_pct}%
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {summaryLoading ? (
                <span className="inline-block w-20 h-7 bg-gray-100 rounded animate-pulse" />
              ) : (
                `${(summary?.total_patients || 0).toLocaleString()}명`
              )}
            </p>
            <p className="text-xs text-gray-500 mt-1">이번달 환자 수</p>
          </div>

          {/* 비급여 비율 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <TossIcon icon={ShieldCheck} color="from-orange-500 to-amber-500" size="sm" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {summaryLoading ? (
                <span className="inline-block w-16 h-7 bg-gray-100 rounded animate-pulse" />
              ) : (
                `${summary?.non_insurance_ratio || 0}%`
              )}
            </p>
            <p className="text-xs text-gray-500 mt-1">비급여 비율</p>
          </div>

          {/* 지역 순위 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <TossIcon icon={MapPin} color="from-purple-500 to-violet-500" size="sm" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {summaryLoading ? (
                <span className="inline-block w-20 h-7 bg-gray-100 rounded animate-pulse" />
              ) : (
                `상위 ${summary?.regional_percentile || 0}%`
              )}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {summary ? `${summary.specialty} \u00B7 ${summary.region}` : '지역 순위'}
            </p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* 매출 추이 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-1">매출 추이</h3>
            <p className="text-xs text-gray-500 mb-4">일별 전체 / 급여 / 비급여 매출</p>
            <div className="h-[280px]">
              {revenueLoading ? (
                <div className="w-full h-full bg-gray-50 rounded-xl animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueTrend?.data || []} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      interval={Math.max(0, Math.floor((revenueTrend?.data?.length || 0) / 8))}
                    />
                    <YAxis
                      tickFormatter={(v: number) => `${Math.round(v / 10000)}만`}
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      width={50}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        `\u20A9${value.toLocaleString()}`,
                        name === 'total' ? '전체' : name === 'insurance' ? '급여' : '비급여',
                      ]}
                      labelFormatter={(label: string) => {
                        const d = new Date(label)
                        return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`
                      }}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                    />
                    <Legend
                      formatter={(value: string) =>
                        value === 'total' ? '전체' : value === 'insurance' ? '급여' : '비급여'
                      }
                      wrapperStyle={{ fontSize: '12px' }}
                    />
                    <Line type="monotone" dataKey="total" stroke="#3182f6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="insurance" stroke="#10b981" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                    <Line type="monotone" dataKey="non_insurance" stroke="#f97316" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* 환자 수 추이 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-1">환자 수 추이</h3>
            <p className="text-xs text-gray-500 mb-4">일별 전체 / 신규 / 재진 환자</p>
            <div className="h-[280px]">
              {patientLoading ? (
                <div className="w-full h-full bg-gray-50 rounded-xl animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={patientTrend?.data || []} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      interval={Math.max(0, Math.floor((patientTrend?.data?.length || 0) / 8))}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      width={35}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        `${value}명`,
                        name === 'total' ? '전체' : name === 'new' ? '신규' : '재진',
                      ]}
                      labelFormatter={(label: string) => {
                        const d = new Date(label)
                        return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`
                      }}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                    />
                    <Legend
                      formatter={(value: string) =>
                        value === 'total' ? '전체' : value === 'new' ? '신규' : '재진'
                      }
                      wrapperStyle={{ fontSize: '12px' }}
                    />
                    <Line type="monotone" dataKey="total" stroke="#3182f6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="new" stroke="#a855f7" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                    <Line type="monotone" dataKey="returning" stroke="#10b981" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* 보험/비보험 도넛 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-1">보험 / 비보험 비율</h3>
            <p className="text-xs text-gray-500 mb-4">이번달 급여 vs 비급여 매출 비율</p>
            <div className="h-[280px] flex items-center">
              {insuranceLoading ? (
                <div className="w-full h-full bg-gray-50 rounded-xl animate-pulse" />
              ) : (
                <div className="flex items-center w-full gap-6">
                  <div className="flex-1 h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={insuranceBreakdown?.data || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {(insuranceBreakdown?.data || []).map((_: any, idx: number) => (
                            <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [`\u20A9${value.toLocaleString()}`, '']}
                          contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-4 min-w-[140px]">
                    {(insuranceBreakdown?.data || []).map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500">
                            {item.percentage}% \u00B7 \u20A9{formatKRW(item.value)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-400">총 매출</p>
                      <p className="text-sm font-bold text-gray-900">
                        \u20A9{formatKRW(insuranceBreakdown?.total || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 지역 벤치마크 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-1">지역 벤치마크</h3>
            <p className="text-xs text-gray-500 mb-6">
              {benchmark ? `${benchmark.specialty} \u00B7 ${benchmark.region} 기준` : '우리 병원 vs 지역 평균'}
            </p>
            {benchmarkLoading ? (
              <div className="space-y-6">
                <div className="h-10 bg-gray-50 rounded-xl animate-pulse" />
                <div className="h-10 bg-gray-50 rounded-xl animate-pulse" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* 우리 병원 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">우리 병원</span>
                    <span className="text-sm font-bold text-blue-600">
                      \u20A9{formatKRW(benchmark?.my_revenue || 0)}/월
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(
                          100,
                          benchmark?.regional_avg_revenue
                            ? (benchmark.my_revenue / Math.max(benchmark.my_revenue, benchmark.regional_avg_revenue)) * 100
                            : 50
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* 지역 평균 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">지역 평균</span>
                    <span className="text-sm font-bold text-gray-500">
                      \u20A9{formatKRW(benchmark?.regional_avg_revenue || 0)}/월
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-400 rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(
                          100,
                          benchmark?.my_revenue
                            ? (benchmark.regional_avg_revenue / Math.max(benchmark.my_revenue, benchmark.regional_avg_revenue)) * 100
                            : 50
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* 순위 뱃지 */}
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                  <div>
                    <p className="text-sm text-blue-800 font-medium">지역 내 순위</p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      {benchmark?.specialty} \u00B7 {benchmark?.region}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-700">
                      상위 {benchmark?.percentile || 0}%
                    </p>
                    {benchmark?.comparison_pct !== 0 && (
                      <p className={`text-xs font-medium ${(benchmark?.comparison_pct || 0) > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        지역 평균 대비 {(benchmark?.comparison_pct || 0) > 0 ? '+' : ''}{benchmark?.comparison_pct}%
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CTA Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold">오직 PlatonEMR만의 차별점</h3>
              <p className="text-blue-100 text-sm mt-1">
                단순 차팅을 넘어, 매출 분석 · 지역 벤치마크 · AI 인사이트까지.
                경쟁 EMR에서는 볼 수 없는 데이터를 제공합니다.
              </p>
            </div>
            <button
              onClick={() => router.push('/emr')}
              className="flex-shrink-0 px-6 py-3 bg-white text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition-colors text-sm"
            >
              PlatonEMR 둘러보기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
