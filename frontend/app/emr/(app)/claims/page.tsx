'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Receipt,
  Search,
  Filter,
  Download,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  X,
  ChevronRight,
  ChevronDown,
  Shield,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Brain,
  Sparkles,
  FileText,
  Calendar,
  ArrowRight,
  Eye,
  Edit3,
  RefreshCw,
  AlertCircle,
  Info,
  Check,
  Loader2,
} from 'lucide-react'
import { TossIcon } from '@/components/ui/TossIcon'

/* ─── 타입 ─── */
type ClaimStatus = 'DRAFT' | 'READY' | 'AI_REVIEWING' | 'SUBMITTED' | 'EDI_RECEIVED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'PARTIAL' | 'APPEALING' | 'APPEAL_ACCEPTED' | 'APPEAL_REJECTED'
type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'

interface ClaimItem {
  code: string
  name: string
  item_type: string
  quantity: number
  unit_price: number
  total_price: number
  risk_level: RiskLevel
  pass_rate: number
  issues: string[]
}

interface Claim {
  id: string
  claim_number: string
  claim_date: string
  service_date: string
  patient_name_masked: string
  patient_chart_no: string
  patient_age?: number
  patient_gender?: string
  total_amount: number
  insurance_amount: number
  copay_amount: number
  approved_amount?: number | null
  rejected_amount: number
  status: ClaimStatus
  risk_level: RiskLevel
  risk_score: number
  risk_reason?: string | null
  ai_analyzed: boolean
  ai_analysis_result: { issues: string[]; suggestions: string[] }
  submitted_at?: string | null
  items?: ClaimItem[]
  is_demo?: boolean
}

interface ClaimStats {
  pending_count: number
  pending_amount: number
  total_claimed: number
  total_accepted: number
  rejected_amount: number
  rejection_rate: number
  risk_count: number
  acceptance_rate: number
  total_claims: number
  is_demo: boolean
}

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

const statusConfig: Record<ClaimStatus, { label: string; color: string; bg: string }> = {
  DRAFT: { label: '작성중', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-900/20' },
  READY: { label: '청구대기', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  AI_REVIEWING: { label: 'AI분석중', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  SUBMITTED: { label: '전송완료', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  EDI_RECEIVED: { label: '접수완료', color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
  UNDER_REVIEW: { label: '심사중', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  ACCEPTED: { label: '인정', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  REJECTED: { label: '삭감', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
  PARTIAL: { label: '일부삭감', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  APPEALING: { label: '이의신청중', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20' },
  APPEAL_ACCEPTED: { label: '이의인정', color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-900/20' },
  APPEAL_REJECTED: { label: '이의기각', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20' },
}

const riskConfig: Record<RiskLevel, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  LOW: { label: '안전', color: 'text-emerald-500', icon: CheckCircle2 },
  MEDIUM: { label: '주의', color: 'text-amber-500', icon: AlertTriangle },
  HIGH: { label: '위험', color: 'text-red-500', icon: AlertCircle },
}

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [stats, setStats] = useState<ClaimStats | null>(null)
  const [isDemo, setIsDemo] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [filterStatus, setFilterStatus] = useState<ClaimStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClaims, setSelectedClaims] = useState<string[]>([])
  const [expandedClaim, setExpandedClaim] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [claimsRes, statsRes] = await Promise.all([
        fetchApi('/claims/'),
        fetchApi('/claims/stats'),
      ])
      setClaims(claimsRes.data || [])
      setStats(statsRes)
      setIsDemo(claimsRes.is_demo || statsRes.is_demo)
    } catch {
      // Fallback: use empty
      setClaims([])
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  const filteredClaims = claims
    .filter((c) => filterStatus === 'all' || c.status === filterStatus)
    .filter((c) => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return (c.patient_name_masked || '').includes(q) || (c.patient_chart_no || '').toLowerCase().includes(q)
    })

  const readyClaims = claims.filter(c => c.status === 'READY')
  const riskClaims = claims.filter(c => c.risk_level !== 'LOW' && !['ACCEPTED'].includes(c.status))

  const toggleSelect = (id: string) => {
    setSelectedClaims((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const selectAllReady = () => {
    setSelectedClaims(readyClaims.map(c => c.id))
  }

  const handleBatchSubmit = async () => {
    const ids = selectedClaims.length > 0 ? selectedClaims : readyClaims.map(c => c.id)
    if (ids.length === 0) return
    setSubmitting(true)
    try {
      await fetchApi('/claims/batch-submit', {
        method: 'POST',
        body: JSON.stringify({ claim_ids: ids }),
      })
      setSelectedClaims([])
      await loadData()
    } catch {
      // handle error
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const rejectionRate = stats ? stats.rejection_rate.toFixed(1) : '0'

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* 데모 배너 */}
      {isDemo && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span className="text-sm text-amber-700 dark:text-amber-300">
            데모 데이터를 표시 중입니다. EMR에서 실제 청구를 생성하면 실 데이터로 전환됩니다.
          </span>
        </div>
      )}

      {/* ───── 서브 네비게이션 ───── */}
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
        {[
          { href: '/emr/claims', label: '대시보드', active: true },
          { href: '/emr/claims/new', label: '청구 작성' },
          { href: '/emr/claims/batch', label: '일괄 전송' },
          { href: '/emr/claims/defense', label: 'AI 삭감방어' },
          { href: '/emr/claims/simulation', label: 'AI 모의심사' },
          { href: '/emr/claims/results', label: '심사결과' },
          { href: '/emr/claims/appeals', label: '이의신청' },
          { href: '/emr/claims/analytics', label: '분석 리포트' },
          { href: '/emr/claims/codes', label: 'HIRA 코드' },
        ].map((nav) => (
          <Link
            key={nav.href}
            href={nav.href}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              nav.active ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {nav.label}
          </Link>
        ))}
      </div>

      {/* ───── 헤더 ───── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">보험청구 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI가 삭감 위험을 미리 잡아드립니다
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/emr/claims/new" className="btn-primary btn-sm">
            <FileText className="w-3.5 h-3.5" />
            새 청구
          </Link>
          <button className="btn-outline btn-sm">
            <Download className="w-3.5 h-3.5" />
            내보내기
          </button>
          {selectedClaims.length > 0 && (
            <button onClick={handleBatchSubmit} disabled={submitting} className="btn-primary btn-sm">
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {selectedClaims.length}건 심평원 전송
            </button>
          )}
          {selectedClaims.length === 0 && readyClaims.length > 0 && (
            <button onClick={handleBatchSubmit} disabled={submitting} className="btn-primary btn-sm">
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              대기 {readyClaims.length}건 일괄 전송
            </button>
          )}
        </div>
      </div>

      {/* ───── 통계 카드 ───── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">청구 대기</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold">{stats?.pending_count ?? readyClaims.length}<span className="text-sm text-muted-foreground">건</span></div>
          <div className="text-xs text-muted-foreground mt-1">
            {((stats?.pending_amount ?? readyClaims.reduce((s, c) => s + c.total_amount, 0)) / 10000).toFixed(1)}만원
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">청구 금액</span>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold">{((stats?.total_claimed ?? 0) / 10000).toFixed(0)}<span className="text-sm text-muted-foreground">만원</span></div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">인정 금액</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-500">{((stats?.total_accepted ?? 0) / 10000).toFixed(0)}<span className="text-sm text-muted-foreground">만원</span></div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">삭감률</span>
            <TrendingDown className="w-4 h-4 text-red-500" />
          </div>
          <div className={`text-2xl font-bold ${parseFloat(rejectionRate) > 5 ? 'text-red-500' : 'text-emerald-500'}`}>
            {rejectionRate}<span className="text-sm">%</span>
          </div>
          <div className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
            <TrendingDown className="w-3 h-3" />
            전월 대비 -2.1%p
          </div>
        </div>

        <div className="card p-4 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">AI 위험 감지</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-500">{stats?.risk_count ?? riskClaims.length}<span className="text-sm text-muted-foreground">건</span></div>
          <Link href="#" className="text-xs text-primary font-semibold mt-1 hover:underline block">확인하기 →</Link>
        </div>
      </div>

      {/* ───── AI 삭감 방어 인사이트 ───── */}
      {riskClaims.length > 0 && (
        <div className="card p-5 border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5 text-amber-500" />
            <span className="font-bold">AI 삭감 방어 분석</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="space-y-2">
            {riskClaims.map((claim) => (
              <div key={claim.id} className="flex items-start gap-3 p-3 bg-card rounded-xl">
                <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                  claim.risk_level === 'HIGH' ? 'text-red-500' : 'text-amber-500'
                }`} />
                <div className="flex-1">
                  <div className="text-sm">
                    <strong>{claim.patient_name_masked}</strong> ({claim.claim_date})
                  </div>
                  {claim.risk_reason && (
                    <div className="text-xs text-muted-foreground mt-0.5">{claim.risk_reason}</div>
                  )}
                </div>
                <button className="btn-outline btn-sm text-xs flex-shrink-0">
                  <Edit3 className="w-3 h-3" />
                  수정
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ───── 필터 & 검색 ───── */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 bg-secondary/50 rounded-xl px-4">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="환자 이름, 차트번호로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm outline-none w-full py-3 placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
            {([
              { key: 'all' as const, label: '전체' },
              { key: 'READY' as const, label: '대기' },
              { key: 'SUBMITTED' as const, label: '전송' },
              { key: 'ACCEPTED' as const, label: '인정' },
              { key: 'REJECTED' as const, label: '삭감' },
              { key: 'PARTIAL' as const, label: '일부삭감' },
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

      {/* ───── 청구 목록 ───── */}
      <div className="card overflow-hidden">
        {/* 테이블 헤더 */}
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-secondary/30 text-xs font-semibold text-muted-foreground border-b border-border">
          <div className="col-span-1">
            <input
              type="checkbox"
              className="rounded"
              checked={selectedClaims.length === readyClaims.length && readyClaims.length > 0}
              onChange={() => selectedClaims.length === readyClaims.length ? setSelectedClaims([]) : selectAllReady()}
            />
          </div>
          <div className="col-span-1">날짜</div>
          <div className="col-span-2">환자</div>
          <div className="col-span-2">청구번호</div>
          <div className="col-span-2">청구액</div>
          <div className="col-span-1">위험도</div>
          <div className="col-span-1">상태</div>
          <div className="col-span-2"></div>
        </div>

        <div className="divide-y divide-border">
          {filteredClaims.map((claim) => {
            const st = statusConfig[claim.status] || statusConfig.DRAFT
            const risk = riskConfig[claim.risk_level] || riskConfig.LOW
            const RiskIcon = risk.icon

            return (
              <div key={claim.id}>
                <div
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 p-4 hover:bg-secondary/30 transition-colors items-center cursor-pointer"
                  onClick={() => setExpandedClaim(expandedClaim === claim.id ? null : claim.id)}
                >
                  {/* 모바일 */}
                  <div className="md:hidden space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <RiskIcon className={`w-4 h-4 ${risk.color}`} />
                        <span className="font-semibold text-sm">{claim.patient_name_masked}</span>
                        <span className={`text-2xs px-2 py-0.5 rounded-lg ${st.color} ${st.bg}`}>{st.label}</span>
                      </div>
                      <span className="font-bold text-sm">{claim.total_amount.toLocaleString()}원</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{claim.claim_date} · {claim.claim_number}</div>
                  </div>

                  {/* 데스크톱 */}
                  <div className="hidden md:flex col-span-1 items-center">
                    {claim.status === 'READY' && (
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selectedClaims.includes(claim.id)}
                        onChange={(e) => {
                          e.stopPropagation()
                          toggleSelect(claim.id)
                        }}
                      />
                    )}
                  </div>
                  <div className="hidden md:block col-span-1 text-xs text-muted-foreground">
                    {new Date(claim.claim_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="hidden md:block col-span-2">
                    <div className="text-sm font-semibold">{claim.patient_name_masked}</div>
                    <div className="text-xs text-muted-foreground font-mono">{claim.patient_chart_no}</div>
                  </div>
                  <div className="hidden md:block col-span-2">
                    <span className="text-xs text-muted-foreground font-mono">{claim.claim_number}</span>
                  </div>
                  <div className="hidden md:block col-span-2 text-sm font-semibold">
                    {(claim.total_amount / 10000).toFixed(1)}만
                    {claim.approved_amount != null && claim.approved_amount !== claim.total_amount && (
                      <div className="text-2xs text-red-500">→ {(claim.approved_amount / 10000).toFixed(1)}만</div>
                    )}
                  </div>
                  <div className="hidden md:flex col-span-1 items-center gap-1">
                    <RiskIcon className={`w-4 h-4 ${risk.color}`} />
                    <span className={`text-xs font-semibold ${risk.color}`}>{risk.label}</span>
                  </div>
                  <div className="hidden md:block col-span-1">
                    <span className={`text-2xs px-2.5 py-1 rounded-lg font-semibold ${st.color} ${st.bg}`}>{st.label}</span>
                  </div>
                  <div className="hidden md:flex col-span-2 justify-end">
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedClaim === claim.id ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* 확장 상세 */}
                {expandedClaim === claim.id && (
                  <div className="px-4 pb-4 animate-fade-in-down">
                    <div className="bg-secondary/30 rounded-xl p-4 space-y-3">
                      {claim.risk_reason && (
                        <div className={`flex items-start gap-2 p-3 rounded-lg ${
                          claim.risk_level === 'HIGH' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-amber-50 dark:bg-amber-900/20'
                        }`}>
                          <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                            claim.risk_level === 'HIGH' ? 'text-red-500' : 'text-amber-500'
                          }`} />
                          <div>
                            <div className="text-sm font-semibold">AI 삭감 위험 분석</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{claim.risk_reason}</div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-xs text-muted-foreground">청구 금액</span>
                          <div className="font-semibold">{claim.total_amount.toLocaleString()}원</div>
                        </div>
                        {claim.approved_amount != null && (
                          <div>
                            <span className="text-xs text-muted-foreground">인정 금액</span>
                            <div className={`font-semibold ${claim.approved_amount < claim.total_amount ? 'text-red-500' : 'text-emerald-500'}`}>
                              {claim.approved_amount.toLocaleString()}원
                              {claim.approved_amount < claim.total_amount && (
                                <span className="text-xs ml-1">(-{(claim.total_amount - claim.approved_amount).toLocaleString()}원)</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* AI 분석 결과 */}
                      {claim.ai_analysis_result?.suggestions?.length > 0 && (
                        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 mb-1">
                            <Brain className="w-3.5 h-3.5" /> AI 제안
                          </div>
                          {claim.ai_analysis_result.suggestions.map((s, i) => (
                            <div key={i} className="text-xs text-blue-700 dark:text-blue-300">{s}</div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-2">
                        <Link href={`/emr/patients/${claim.id}`} className="btn-outline btn-sm text-xs">
                          <Eye className="w-3 h-3" />
                          차트 보기
                        </Link>
                        {claim.status === 'DRAFT' && (
                          <button className="btn-outline btn-sm text-xs">
                            <Edit3 className="w-3 h-3" />
                            수정
                          </button>
                        )}
                        {claim.status === 'READY' && (
                          <button className="btn-primary btn-sm text-xs">
                            <Send className="w-3 h-3" />
                            전송
                          </button>
                        )}
                        {['REJECTED', 'PARTIAL'].includes(claim.status) && (
                          <button className="btn-primary btn-sm text-xs bg-amber-500 hover:bg-amber-600">
                            <RefreshCw className="w-3 h-3" />
                            이의신청
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {filteredClaims.length === 0 && (
          <div className="p-12 text-center">
            <Receipt className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <div className="font-semibold text-muted-foreground">해당하는 청구 내역이 없습니다</div>
          </div>
        )}
      </div>
    </div>
  )
}
