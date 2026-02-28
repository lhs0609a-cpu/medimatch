'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Brain,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Download,
  RefreshCw,
  Info,
  Target,
  Users,
  Zap,
  Lightbulb,
  Award,
  ChevronRight,
  Loader2,
  Calendar,
  Shield,
} from 'lucide-react'

/* ─── API ─── */
const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

async function fetchApi(path: string, options?: RequestInit) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

/* ─── 데모 데이터 ─── */
const demoTrends = [
  { month: '2025-09', total: 3200000, accepted: 3050000, rejected: 150000, claims: 45 },
  { month: '2025-10', total: 3500000, accepted: 3350000, rejected: 150000, claims: 48 },
  { month: '2025-11', total: 3100000, accepted: 2900000, rejected: 200000, claims: 42 },
  { month: '2025-12', total: 3800000, accepted: 3650000, rejected: 150000, claims: 52 },
  { month: '2026-01', total: 3600000, accepted: 3500000, rejected: 100000, claims: 50 },
  { month: '2026-02', total: 2800000, accepted: 2720000, rejected: 80000, claims: 38 },
]

const demoPeerBenchmark = {
  user_rejection_rate: 2.3,
  specialty_avg: 4.5,
  percentile: 82,
  specialty: '내과',
}

const demoTopRejected = [
  { code: 'HA010', name: '신경차단술', rejection_rate: 27.5, count: 12, reasons: ['주상병 부적합', '빈도 초과'] },
  { code: 'D2711', name: '갑상선검사', rejection_rate: 47.9, count: 8, reasons: ['관련성 낮음'] },
  { code: 'MM042', name: '도수치료', rejection_rate: 21.7, count: 15, reasons: ['급여기준 미충족'] },
  { code: 'B0030', name: '특수처치', rejection_rate: 18.0, count: 6, reasons: ['횟수 초과'] },
  { code: 'EB411', name: '경추 견인', rejection_rate: 21.7, count: 4, reasons: ['적응증 부적합'] },
]

const demoOptimizations = [
  { current: 'HA010', suggested: 'HA011', reason: '통과율 72.5% → 91.2%', impact: 180000 },
  { current: 'D2711', suggested: 'D2710', reason: '통과율 52.1% → 96.8%', impact: 120000 },
]

const demoCodeEfficiency = [
  { code: 'AA157', name: '초진 진찰료', usage: 312, pass_rate: 99.8, alternative: null },
  { code: 'AA258', name: '재진 진찰료', usage: 580, pass_rate: 99.5, alternative: null },
  { code: 'D2200', name: '일반혈액검사', usage: 245, pass_rate: 97.2, alternative: null },
  { code: 'HA010', name: '신경차단술', usage: 48, pass_rate: 72.5, alternative: { code: 'HA011', name: '신경차단술(소)', pass_rate: 91.2 } },
  { code: 'D2711', name: '갑상선검사', usage: 32, pass_rate: 52.1, alternative: { code: 'D2710', name: '갑상선기능(기본)', pass_rate: 96.8 } },
  { code: 'MM042', name: '도수치료', usage: 65, pass_rate: 78.3, alternative: { code: 'MM041', name: '도수치료(기본)', pass_rate: 94.1 } },
]

const demoRevenueSuggestions = [
  {
    title: '갑상선검사 코드 변경',
    description: 'D2711 대신 D2710 사용 시 삭감율 47.9% → 3.2%로 감소',
    impact: 120000,
    difficulty: '쉬움',
  },
  {
    title: '신경차단술 코드 최적화',
    description: 'HA010을 HA011로 변경하면 심사 통과율이 18.7%p 향상',
    impact: 180000,
    difficulty: '쉬움',
  },
  {
    title: '도수치료 소견서 보완',
    description: '치료 필요성 및 횟수 근거를 차트에 명시하면 삭감율 21.7% → 5.9%',
    impact: 95000,
    difficulty: '보통',
  },
  {
    title: '검사 사전 승인 프로세스 도입',
    description: '고위험 검사 청구 전 AI 사전 검증으로 월 평균 삭감 15건 방지',
    impact: 230000,
    difficulty: '보통',
  },
]

/* ─── 유틸 ─── */
function formatMonth(ym: string) {
  const [, m] = ym.split('-')
  return `${parseInt(m)}월`
}

function formatAmount(n: number) {
  if (n >= 10000) return `${(n / 10000).toFixed(0)}만`
  return `${(n / 1000).toFixed(0)}천`
}

export default function ClaimsAnalyticsPage() {
  const [trends, setTrends] = useState(demoTrends)
  const [peerBenchmark, setPeerBenchmark] = useState(demoPeerBenchmark)
  const [topRejected, setTopRejected] = useState(demoTopRejected)
  const [optimizations, setOptimizations] = useState(demoOptimizations)
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [analyticsRes] = await Promise.all([
        fetchApi('/claims/analytics'),
      ])
      if (analyticsRes.trends) setTrends(analyticsRes.trends)
      if (analyticsRes.peer_benchmark) setPeerBenchmark(analyticsRes.peer_benchmark)
      if (analyticsRes.top_rejected) setTopRejected(analyticsRes.top_rejected)
      if (analyticsRes.optimizations) setOptimizations(analyticsRes.optimizations)
      setIsDemo(analyticsRes.is_demo ?? false)
    } catch {
      // Fallback to demo data
      setIsDemo(true)
    } finally {
      setLoading(false)
    }
  }

  /* ─── 계산 ─── */
  const latestMonth = trends[trends.length - 1]
  const prevMonth = trends[trends.length - 2]
  const totalClaimed6m = trends.reduce((s, t) => s + t.total, 0)
  const totalAccepted6m = trends.reduce((s, t) => s + t.accepted, 0)
  const totalRejected6m = trends.reduce((s, t) => s + t.rejected, 0)
  const acceptanceRate = totalClaimed6m > 0 ? ((totalAccepted6m / totalClaimed6m) * 100).toFixed(1) : '0'
  const rejectionRate = totalClaimed6m > 0 ? ((totalRejected6m / totalClaimed6m) * 100).toFixed(1) : '0'
  const prevRejRate = prevMonth ? ((prevMonth.rejected / prevMonth.total) * 100) : 0
  const currRejRate = latestMonth ? ((latestMonth.rejected / latestMonth.total) * 100) : 0
  const rejTrend = currRejRate - prevRejRate
  const totalOptimImpact = demoRevenueSuggestions.reduce((s, o) => s + o.impact, 0)

  const maxTotal = Math.max(...trends.map(t => t.total))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* 데모 배너 */}
      {isDemo && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span className="text-sm text-amber-700 dark:text-amber-300">
            데모 데이터를 표시 중입니다. 실제 청구 데이터가 쌓이면 정확한 분석이 제공됩니다.
          </span>
        </div>
      )}

      {/* ───── 헤더 ───── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">청구 분석 리포트</h1>
            <p className="text-sm text-muted-foreground">AI가 분석한 청구 패턴과 수익 최적화 인사이트</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={loadData} className="btn-outline btn-sm">
            <RefreshCw className="w-3.5 h-3.5" />
            새로고침
          </button>
          <button className="btn-outline btn-sm">
            <Download className="w-3.5 h-3.5" />
            PDF 다운로드
          </button>
        </div>
      </div>

      {/* ───── KPI 카드 ───── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">월 인정률</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600">{acceptanceRate}<span className="text-sm">%</span></div>
          <div className="text-xs text-muted-foreground mt-1">최근 6개월 평균</div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">청구/인정 금액</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold">{formatAmount(totalAccepted6m)}<span className="text-sm text-muted-foreground">원</span></div>
          <div className="text-xs text-muted-foreground mt-1">
            총 청구 {formatAmount(totalClaimed6m)}원 중
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">삭감률 추이</span>
            <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <div className="text-2xl font-bold">{rejectionRate}<span className="text-sm">%</span></div>
          <div className={`flex items-center gap-1 text-xs mt-1 ${rejTrend <= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {rejTrend <= 0 ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
            {Math.abs(rejTrend).toFixed(1)}%p {rejTrend <= 0 ? '개선' : '악화'}
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">AI 방어 절감</span>
            <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <Brain className="w-4 h-4 text-violet-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-violet-600">{formatAmount(totalOptimImpact)}<span className="text-sm text-muted-foreground">원</span></div>
          <div className="text-xs text-muted-foreground mt-1">월 예상 추가 수익</div>
        </div>
      </div>

      {/* ───── 월별 트렌드 차트 ───── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              월별 청구 트렌드
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">최근 6개월 인정/삭감 금액 추이</p>
          </div>
          <div className="flex items-center gap-3 text-2xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
              인정
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-400 inline-block" />
              삭감
            </span>
          </div>
        </div>
        <div className="flex items-end gap-2 sm:gap-4 h-48">
          {trends.map((t, i) => {
            const isLatest = i === trends.length - 1
            const acceptedH = maxTotal > 0 ? (t.accepted / maxTotal) * 100 : 0
            const rejectedH = maxTotal > 0 ? (t.rejected / maxTotal) * 100 : 0
            return (
              <div key={t.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-2xs text-muted-foreground font-medium">
                  {formatAmount(t.total)}
                </div>
                <div className="text-2xs text-muted-foreground">
                  {t.claims}건
                </div>
                <div className="w-full flex flex-col items-stretch gap-0.5" style={{ height: '120px' }}>
                  <div className="flex-1" />
                  <div
                    className={`w-full rounded-t-lg ${isLatest ? 'bg-red-500' : 'bg-red-300 dark:bg-red-800/60'}`}
                    style={{ height: `${rejectedH}%`, minHeight: rejectedH > 0 ? '4px' : '0' }}
                  />
                  <div
                    className={`w-full rounded-t-lg ${isLatest ? 'bg-emerald-500' : 'bg-emerald-300 dark:bg-emerald-800/60'}`}
                    style={{ height: `${acceptedH}%`, minHeight: '4px' }}
                  />
                </div>
                <span className={`text-2xs mt-1 ${isLatest ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                  {formatMonth(t.month)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ───── 피어 벤치마크 + 삭감 상위 코드 ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 피어 벤치마크 */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold">동료 비교 벤치마크</h3>
          </div>
          <div className="space-y-5">
            <div className="text-center py-3">
              <div className="text-sm text-muted-foreground mb-1">{peerBenchmark.specialty} 전체 대비</div>
              <div className="flex items-center justify-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span className="text-3xl font-black text-primary">상위 {100 - peerBenchmark.percentile}%</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {peerBenchmark.specialty} {peerBenchmark.percentile}백분위
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium">내 삭감률</span>
                  <span className="font-bold text-emerald-600">{peerBenchmark.user_rejection_rate}%</span>
                </div>
                <div className="w-full h-4 bg-secondary rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(peerBenchmark.user_rejection_rate / 10) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium">{peerBenchmark.specialty} 평균</span>
                  <span className="font-bold text-amber-600">{peerBenchmark.specialty_avg}%</span>
                </div>
                <div className="w-full h-4 bg-secondary rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${(peerBenchmark.specialty_avg / 10) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-800 dark:text-emerald-300">
                  귀원의 삭감률은 {peerBenchmark.specialty} 평균 대비{' '}
                  <strong>{(peerBenchmark.specialty_avg - peerBenchmark.user_rejection_rate).toFixed(1)}%p 낮은</strong>{' '}
                  우수한 수준입니다.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 삭감 상위 코드 */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="font-semibold">삭감 빈발 코드 TOP 5</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border">
                  <th className="text-left py-2 font-medium">코드</th>
                  <th className="text-left py-2 font-medium">항목명</th>
                  <th className="text-right py-2 font-medium">삭감률</th>
                  <th className="text-right py-2 font-medium">건수</th>
                  <th className="text-left py-2 pl-3 font-medium hidden sm:table-cell">주요 사유</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {topRejected.map((item) => (
                  <tr key={item.code} className="hover:bg-secondary/30 transition-colors">
                    <td className="py-2.5 font-mono text-xs text-muted-foreground">{item.code}</td>
                    <td className="py-2.5 font-medium">{item.name}</td>
                    <td className="py-2.5 text-right">
                      <span className={`font-bold ${item.rejection_rate >= 30 ? 'text-red-500' : item.rejection_rate >= 20 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {item.rejection_rate}%
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-muted-foreground">{item.count}건</td>
                    <td className="py-2.5 pl-3 hidden sm:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {item.reasons.map((r, ri) => (
                          <span key={ri} className="px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-900/20 text-2xs text-red-600">
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ───── 수익 최적화 제안 ───── */}
      <div className="card p-5 border border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold">AI 수익 최적화 제안</h3>
            <Sparkles className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30">
            <DollarSign className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs font-bold text-blue-600">월 +{formatAmount(totalOptimImpact)}원 예상</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {demoRevenueSuggestions.map((sug, i) => (
            <div key={i} className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    sug.difficulty === '쉬움' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
                  }`}>
                    <Zap className={`w-3.5 h-3.5 ${
                      sug.difficulty === '쉬움' ? 'text-emerald-600' : 'text-amber-600'
                    }`} />
                  </div>
                  <span className={`px-2 py-0.5 rounded-lg text-2xs font-bold ${
                    sug.difficulty === '쉬움'
                      ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'text-amber-600 bg-amber-50 dark:bg-amber-900/20'
                  }`}>
                    {sug.difficulty}
                  </span>
                </div>
                <span className="text-sm font-bold text-blue-600">+{formatAmount(sug.impact)}원/월</span>
              </div>
              <h4 className="text-sm font-semibold mb-1">{sug.title}</h4>
              <p className="text-xs text-muted-foreground">{sug.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ───── 코드 효율성 분석 ───── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-violet-600" />
            <h3 className="font-semibold">코드 효율성 분석</h3>
          </div>
          <span className="text-2xs text-muted-foreground">사용 빈도 순</span>
        </div>
        <div className="space-y-3">
          {demoCodeEfficiency.map((item) => (
            <div key={item.code} className="flex items-center gap-4 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
              <div className="flex-shrink-0 w-12 text-center">
                <div className={`text-sm font-bold ${
                  item.pass_rate >= 95 ? 'text-emerald-600' : item.pass_rate >= 80 ? 'text-amber-600' : 'text-red-500'
                }`}>
                  {item.pass_rate}%
                </div>
                <div className="text-2xs text-muted-foreground">통과</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-mono">{item.code}</span>
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.pass_rate >= 95 ? 'bg-emerald-500' : item.pass_rate >= 80 ? 'bg-amber-400' : 'bg-red-400'
                      }`}
                      style={{ width: `${item.pass_rate}%` }}
                    />
                  </div>
                  <span className="text-2xs text-muted-foreground flex-shrink-0">{item.usage}회 사용</span>
                </div>
              </div>
              {item.alternative ? (
                <div className="flex-shrink-0 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <ArrowRight className="w-3 h-3 text-blue-600" />
                  <div>
                    <div className="text-2xs text-blue-600 font-semibold">{item.alternative.code} {item.alternative.name}</div>
                    <div className="text-2xs text-blue-500">통과율 {item.alternative.pass_rate}%</div>
                  </div>
                </div>
              ) : (
                <div className="flex-shrink-0 hidden sm:flex items-center gap-1 px-3 py-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-2xs text-emerald-600 font-medium">최적</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ───── 코드 변경 추천 ───── */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold">AI 코드 변경 추천</h3>
          <Sparkles className="w-4 h-4 text-blue-400" />
        </div>
        <div className="space-y-3">
          {demoOptimizations.map((opt, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="text-center flex-shrink-0">
                  <div className="text-xs font-mono text-red-500 font-bold">{opt.current}</div>
                  <div className="text-2xs text-muted-foreground">현재</div>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <div className="text-center flex-shrink-0">
                  <div className="text-xs font-mono text-emerald-600 font-bold">{opt.suggested}</div>
                  <div className="text-2xs text-muted-foreground">추천</div>
                </div>
                <div className="flex-1 min-w-0 ml-2">
                  <div className="text-sm font-medium">{opt.reason}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-sm font-bold text-blue-600">+{formatAmount(opt.impact)}원/월</span>
                <button className="btn-primary btn-sm text-xs">
                  적용
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
