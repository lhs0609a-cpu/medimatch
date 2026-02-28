'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  XCircle,
  Brain,
  Sparkles,
  Loader2,
  Info,
  Clock,
  FileText,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  DollarSign,
  TrendingDown,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Eye,
  Download,
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

/* ─── 타입 ─── */
type ResultStatus = 'ACCEPTED' | 'REJECTED' | 'PARTIAL' | 'PENDING'

interface RejectedItem {
  code: string
  name: string
  claimed_amount: number
  approved_amount: number
  rejected_amount: number
  reason: string
}

interface ClaimResult {
  id: string
  claim_number: string
  claim_date: string
  review_date: string | null
  patient_name_masked: string
  patient_chart_no: string
  total_amount: number
  approved_amount: number
  rejected_amount: number
  status: ResultStatus
  rejected_items: RejectedItem[]
  appeal_status: 'NONE' | 'DRAFT' | 'SUBMITTED' | 'RESOLVED'
}

interface ResultStats {
  total_reviewed: number
  accepted_count: number
  rejected_count: number
  partial_count: number
  pending_count: number
  total_claimed: number
  total_approved: number
  total_rejected: number
  acceptance_rate: number
}

/* ─── 데모 데이터 ─── */
const demoStats: ResultStats = {
  total_reviewed: 48,
  accepted_count: 38,
  rejected_count: 3,
  partial_count: 5,
  pending_count: 2,
  total_claimed: 12450000,
  total_approved: 11860000,
  total_rejected: 590000,
  acceptance_rate: 95.3,
}

const demoResults: ClaimResult[] = [
  {
    id: 'r1', claim_number: 'CLM-2026-00120', claim_date: '2026-02-10', review_date: '2026-02-20',
    patient_name_masked: '강지원', patient_chart_no: 'C2024-0001',
    total_amount: 287400, approved_amount: 287400, rejected_amount: 0,
    status: 'ACCEPTED', rejected_items: [], appeal_status: 'NONE',
  },
  {
    id: 'r2', claim_number: 'CLM-2026-00121', claim_date: '2026-02-11', review_date: '2026-02-21',
    patient_name_masked: '이미경', patient_chart_no: 'C2024-0002',
    total_amount: 523800, approved_amount: 498200, rejected_amount: 25600,
    status: 'PARTIAL', rejected_items: [
      { code: 'EB411', name: '심전도 (12유도)', claimed_amount: 12400, approved_amount: 0, rejected_amount: 12400, reason: '의학적 필요성 인정 불가 - 주호소와 관련성 부족' },
      { code: 'D2711', name: '갑상선 기능검사 (TSH)', claimed_amount: 13200, approved_amount: 0, rejected_amount: 13200, reason: '검사의 의학적 필요성 인정 불가' },
    ], appeal_status: 'NONE',
  },
  {
    id: 'r3', claim_number: 'CLM-2026-00122', claim_date: '2026-02-12', review_date: '2026-02-22',
    patient_name_masked: '박준호', patient_chart_no: 'C2024-0003',
    total_amount: 178200, approved_amount: 178200, rejected_amount: 0,
    status: 'ACCEPTED', rejected_items: [], appeal_status: 'NONE',
  },
  {
    id: 'r4', claim_number: 'CLM-2026-00123', claim_date: '2026-02-13', review_date: '2026-02-23',
    patient_name_masked: '김영수', patient_chart_no: 'C2024-0004',
    total_amount: 456000, approved_amount: 0, rejected_amount: 456000,
    status: 'REJECTED', rejected_items: [
      { code: 'AA254', name: '재진 진찰료', claimed_amount: 12800, approved_amount: 0, rejected_amount: 12800, reason: '진료 기록 미비' },
      { code: 'E7071', name: 'CT 촬영 (조영제 사용)', claimed_amount: 280000, approved_amount: 0, rejected_amount: 280000, reason: '산정특례 기준 미달' },
      { code: 'J3501', name: '주사료', claimed_amount: 163200, approved_amount: 0, rejected_amount: 163200, reason: '투약 기준 초과' },
    ], appeal_status: 'SUBMITTED',
  },
  {
    id: 'r5', claim_number: 'CLM-2026-00124', claim_date: '2026-02-14', review_date: null,
    patient_name_masked: '한상우', patient_chart_no: 'C2024-0005',
    total_amount: 92300, approved_amount: 0, rejected_amount: 0,
    status: 'PENDING', rejected_items: [], appeal_status: 'NONE',
  },
  {
    id: 'r6', claim_number: 'CLM-2026-00125', claim_date: '2026-02-14', review_date: '2026-02-24',
    patient_name_masked: '정은화', patient_chart_no: 'C2024-0006',
    total_amount: 315900, approved_amount: 298400, rejected_amount: 17500,
    status: 'PARTIAL', rejected_items: [
      { code: 'C3811', name: 'CRP 정량', claimed_amount: 5600, approved_amount: 0, rejected_amount: 5600, reason: '중복 검사 - 동월 이미 시행' },
      { code: 'J2101', name: '이부프로펜정', claimed_amount: 11900, approved_amount: 0, rejected_amount: 11900, reason: '동일 성분 이중 처방' },
    ], appeal_status: 'DRAFT',
  },
  {
    id: 'r7', claim_number: 'CLM-2026-00126', claim_date: '2026-02-15', review_date: '2026-02-25',
    patient_name_masked: '최민호', patient_chart_no: 'C2024-0007',
    total_amount: 145600, approved_amount: 145600, rejected_amount: 0,
    status: 'ACCEPTED', rejected_items: [], appeal_status: 'NONE',
  },
]

const statusConfig: Record<ResultStatus, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  ACCEPTED: { label: '인정', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: CheckCircle2 },
  REJECTED: { label: '삭감', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', icon: XCircle },
  PARTIAL: { label: '일부삭감', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', icon: AlertTriangle },
  PENDING: { label: '심사중', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: Clock },
}

const appealStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  NONE: { label: '', color: '', bg: '' },
  DRAFT: { label: '이의신청 작성중', color: 'text-slate-600', bg: 'bg-slate-50 dark:bg-slate-900/20' },
  SUBMITTED: { label: '이의신청 제출', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  RESOLVED: { label: '이의신청 처리완료', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
}

export default function ResultsPage() {
  const [results, setResults] = useState<ClaimResult[]>([])
  const [stats, setStats] = useState<ResultStats>(demoStats)
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)
  const [filterStatus, setFilterStatus] = useState<ResultStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [resultsRes, statsRes] = await Promise.all([
        fetchApi('/claims/?status=ACCEPTED,REJECTED,PARTIAL,SUBMITTED'),
        fetchApi('/claims/stats'),
      ])
      const data = (resultsRes.data || []).map((c: any) => ({
        id: c.id,
        claim_number: c.claim_number,
        claim_date: c.claim_date,
        review_date: c.submitted_at || null,
        patient_name_masked: c.patient_name_masked,
        patient_chart_no: c.patient_chart_no,
        total_amount: c.total_amount,
        approved_amount: c.approved_amount || 0,
        rejected_amount: c.rejected_amount || 0,
        status: c.status as ResultStatus,
        rejected_items: [],
        appeal_status: 'NONE',
      }))
      if (data.length > 0) {
        setResults(data)
        setIsDemo(resultsRes.is_demo || false)
      } else {
        setResults(demoResults)
        setIsDemo(true)
      }
      if (statsRes) {
        setStats({
          total_reviewed: statsRes.total_claims || demoStats.total_reviewed,
          accepted_count: Math.round((statsRes.acceptance_rate || 95) * (statsRes.total_claims || 48) / 100),
          rejected_count: Math.round((statsRes.rejection_rate || 2) * (statsRes.total_claims || 48) / 100),
          partial_count: demoStats.partial_count,
          pending_count: statsRes.pending_count || demoStats.pending_count,
          total_claimed: statsRes.total_claimed || demoStats.total_claimed,
          total_approved: statsRes.total_accepted || demoStats.total_approved,
          total_rejected: statsRes.rejected_amount || demoStats.total_rejected,
          acceptance_rate: statsRes.acceptance_rate || demoStats.acceptance_rate,
        })
      }
    } catch {
      setResults(demoResults)
      setStats(demoStats)
      setIsDemo(true)
    } finally {
      setLoading(false)
    }
  }

  const filteredResults = results
    .filter((r) => filterStatus === 'all' || r.status === filterStatus)
    .filter((r) => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return r.patient_name_masked.includes(q) || r.claim_number.toLowerCase().includes(q)
    })

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
            데모 데이터를 표시 중입니다. 실제 심사 결과가 도착하면 자동으로 전환됩니다.
          </span>
        </div>
      )}

      {/* ───── 헤더 ───── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">심사 결과</h1>
            <p className="text-sm text-muted-foreground">심평원 심사 결과 확인 및 이의신청 관리</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-outline btn-sm">
            <Download className="w-3.5 h-3.5" /> 내보내기
          </button>
          <button onClick={loadData} className="btn-outline btn-sm">
            <RefreshCw className="w-3.5 h-3.5" /> 새로고침
          </button>
        </div>
      </div>

      {/* ───── 통계 카드 ───── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">심사 완료</span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold">{stats.total_reviewed}<span className="text-sm text-muted-foreground">건</span></div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">인정</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{stats.accepted_count}<span className="text-sm text-muted-foreground">건</span></div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">삭감/일부삭감</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-500">{stats.rejected_count + stats.partial_count}<span className="text-sm text-muted-foreground">건</span></div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">인정률</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{stats.acceptance_rate}<span className="text-sm">%</span></div>
        </div>
        <div className="card p-4 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">삭감 금액</span>
            <TrendingDown className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-500">{(stats.total_rejected / 10000).toFixed(0)}<span className="text-sm text-muted-foreground">만원</span></div>
          <div className="text-xs text-muted-foreground mt-1">
            청구 {(stats.total_claimed / 10000).toFixed(0)}만 중
          </div>
        </div>
      </div>

      {/* ───── 금액 바 ───── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold">청구/인정 금액 비교</span>
          <span className="text-xs text-muted-foreground">
            인정률 {((stats.total_approved / stats.total_claimed) * 100).toFixed(1)}%
          </span>
        </div>
        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
          <div
            className="bg-emerald-500 rounded-l-full transition-all"
            style={{ width: `${(stats.total_approved / stats.total_claimed) * 100}%` }}
          />
          <div
            className="bg-red-400 transition-all"
            style={{ width: `${(stats.total_rejected / stats.total_claimed) * 100}%` }}
          />
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" /> 인정 {(stats.total_approved / 10000).toFixed(0)}만원
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-400" /> 삭감 {(stats.total_rejected / 10000).toFixed(0)}만원
          </div>
        </div>
      </div>

      {/* ───── 필터 & 검색 ───── */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 bg-secondary/50 rounded-xl px-4">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="환자명, 청구번호로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm outline-none w-full py-3 placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
            {([
              { key: 'all' as const, label: '전체' },
              { key: 'ACCEPTED' as const, label: '인정' },
              { key: 'PARTIAL' as const, label: '일부삭감' },
              { key: 'REJECTED' as const, label: '삭감' },
              { key: 'PENDING' as const, label: '심사중' },
            ]).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilterStatus(f.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                  filterStatus === f.key ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ───── 결과 목록 ───── */}
      <div className="card overflow-hidden">
        <div className="divide-y divide-border">
          {filteredResults.map((result) => {
            const sc = statusConfig[result.status]
            const StatusIcon = sc.icon
            const isExpanded = expandedId === result.id
            const hasRejections = result.rejected_items.length > 0

            return (
              <div key={result.id}>
                <div
                  className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-secondary/30 transition-colors ${
                    result.status === 'REJECTED' ? 'bg-red-50/30 dark:bg-red-900/5' : ''
                  }`}
                  onClick={() => setExpandedId(isExpanded ? null : result.id)}
                >
                  <StatusIcon className={`w-5 h-5 ${sc.color} flex-shrink-0`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">{result.patient_name_masked}</span>
                      <span className="text-2xs font-mono text-muted-foreground">{result.claim_number}</span>
                      <span className={`text-2xs px-2 py-0.5 rounded-lg font-bold ${sc.color} ${sc.bg}`}>{sc.label}</span>
                      {result.appeal_status !== 'NONE' && (
                        <span className={`text-2xs px-2 py-0.5 rounded-lg font-bold ${appealStatusConfig[result.appeal_status].color} ${appealStatusConfig[result.appeal_status].bg}`}>
                          {appealStatusConfig[result.appeal_status].label}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {result.claim_date}
                      {result.review_date && ` · 심사 ${result.review_date}`}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <div className="text-sm font-semibold">{result.total_amount.toLocaleString()}원</div>
                    {result.rejected_amount > 0 && (
                      <div className="text-2xs text-red-500">
                        삭감 -{result.rejected_amount.toLocaleString()}원
                      </div>
                    )}
                    {result.status === 'ACCEPTED' && (
                      <div className="text-2xs text-emerald-600">전액 인정</div>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    {hasRejections ? (
                      isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* 확장 상세 */}
                {isExpanded && hasRejections && (
                  <div className="px-4 pb-4 animate-fade-in-down">
                    <div className="bg-secondary/30 rounded-xl p-4 space-y-3">
                      <div className="text-xs font-semibold text-red-600 mb-2">삭감 항목 ({result.rejected_items.length}건)</div>

                      <div className="space-y-2">
                        {result.rejected_items.map((item, i) => (
                          <div key={i} className="p-3 rounded-xl bg-card border border-border">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-muted-foreground">{item.code}</span>
                                <span className="text-sm font-medium">{item.name}</span>
                              </div>
                              <span className="text-sm font-bold text-red-500">-{item.rejected_amount.toLocaleString()}원</span>
                            </div>
                            <div className="text-xs text-muted-foreground flex items-start gap-1.5 mt-1">
                              <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                              <span>{item.reason}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-border">
                        <div className="flex-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">삭감 합계</span>
                            <span className="font-bold text-red-500">-{result.rejected_amount.toLocaleString()}원</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        {result.appeal_status === 'NONE' && (
                          <Link href="/emr/claims/appeals" className="btn-primary btn-sm text-xs bg-amber-500 hover:bg-amber-600">
                            <RefreshCw className="w-3 h-3" /> 이의신청
                          </Link>
                        )}
                        <Link href={`/emr/claims/${result.id}`} className="btn-outline btn-sm text-xs">
                          <Eye className="w-3 h-3" /> 상세 보기
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {/* 확장: 인정된 청구 */}
                {isExpanded && !hasRejections && result.status === 'ACCEPTED' && (
                  <div className="px-4 pb-4">
                    <div className="bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl p-4 flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      <div>
                        <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">전액 인정</div>
                        <div className="text-xs text-muted-foreground">
                          청구 금액 {result.total_amount.toLocaleString()}원이 전액 인정되었습니다.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 확장: 심사중 */}
                {isExpanded && result.status === 'PENDING' && (
                  <div className="px-4 pb-4">
                    <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-4 flex items-center gap-3">
                      <Clock className="w-6 h-6 text-blue-500" />
                      <div>
                        <div className="text-sm font-semibold text-blue-700 dark:text-blue-400">심사 진행 중</div>
                        <div className="text-xs text-muted-foreground">
                          심평원 심사가 진행 중입니다. 일반적으로 3~5영업일 소요됩니다.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {filteredResults.length === 0 && (
          <div className="p-12 text-center">
            <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <div className="font-semibold text-muted-foreground">해당하는 심사 결과가 없습니다</div>
          </div>
        )}
      </div>
    </div>
  )
}
