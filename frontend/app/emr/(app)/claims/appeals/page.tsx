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
  ChevronDown,
  ChevronUp,
  ChevronRight,
  DollarSign,
  TrendingUp,
  Send,
  RefreshCw,
  Eye,
  Download,
  Trash2,
  Edit3,
  Shield,
  Scale,
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
type AppealStatus = 'DRAFT' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED'

interface AppealItem {
  code: string
  name: string
  rejected_amount: number
  rejection_reason: string
  appeal_argument: string
}

interface Appeal {
  id: string
  appeal_number: string
  claim_number: string
  claim_date: string
  submitted_at: string | null
  resolved_at: string | null
  patient_name_masked: string
  patient_chart_no: string
  original_amount: number
  rejected_amount: number
  recovered_amount: number
  status: AppealStatus
  success_probability: number
  ai_letter_preview: string
  items: AppealItem[]
}

interface AppealStats {
  total_appeals: number
  draft_count: number
  submitted_count: number
  accepted_count: number
  rejected_count: number
  total_rejected_amount: number
  total_recovered_amount: number
  success_rate: number
}

/* ─── 데모 데이터 ─── */
const demoStats: AppealStats = {
  total_appeals: 12,
  draft_count: 2,
  submitted_count: 3,
  accepted_count: 5,
  rejected_count: 2,
  total_rejected_amount: 2340000,
  total_recovered_amount: 1580000,
  success_rate: 71.4,
}

const demoAppeals: Appeal[] = [
  {
    id: 'a1', appeal_number: 'APL-2026-00031', claim_number: 'CLM-2026-00123',
    claim_date: '2026-02-13', submitted_at: '2026-02-24', resolved_at: null,
    patient_name_masked: '김영수', patient_chart_no: 'C2024-0004',
    original_amount: 456000, rejected_amount: 456000, recovered_amount: 0,
    status: 'SUBMITTED', success_probability: 68,
    ai_letter_preview: '상기 환자는 흉부 통증 및 호흡곤란 증상으로 내원하였으며, 진찰 결과 CT 촬영이 불가피한 상황이었습니다. 환자의 과거 병력(고혈압, 당뇨)을 고려할 때 정밀 검사의 의학적 필요성이 충분합니다.',
    items: [
      { code: 'AA254', name: '재진 진찰료', rejected_amount: 12800, rejection_reason: '진료 기록 미비', appeal_argument: '진료 기록 보완 첨부 - 증상 호소 및 이학적 소견 상세 기술' },
      { code: 'E7071', name: 'CT 촬영 (조영제 사용)', rejected_amount: 280000, rejection_reason: '산정특례 기준 미달', appeal_argument: '환자 과거력(고혈압, 당뇨) 및 급성 흉부 통증으로 CT 촬영의 의학적 필요성 충분' },
      { code: 'J3501', name: '주사료', rejected_amount: 163200, rejection_reason: '투약 기준 초과', appeal_argument: '응급 상황에서의 투약으로 기준 초과 불가피했음을 소명' },
    ],
  },
  {
    id: 'a2', appeal_number: 'APL-2026-00030', claim_number: 'CLM-2026-00125',
    claim_date: '2026-02-14', submitted_at: null, resolved_at: null,
    patient_name_masked: '정은화', patient_chart_no: 'C2024-0006',
    original_amount: 315900, rejected_amount: 17500, recovered_amount: 0,
    status: 'DRAFT', success_probability: 82,
    ai_letter_preview: '상기 환자는 만성 염증성 질환으로 정기 방문하는 환자로, CRP 검사는 질환 관리를 위해 필수적인 모니터링 항목입니다.',
    items: [
      { code: 'C3811', name: 'CRP 정량', rejected_amount: 5600, rejection_reason: '중복 검사 - 동월 이미 시행', appeal_argument: '증상 악화로 인한 추가 검사 필요성 소명 - 이전 검사 이후 증상 변화 기록' },
      { code: 'J2101', name: '이부프로펜정', rejected_amount: 11900, rejection_reason: '동일 성분 이중 처방', appeal_argument: '성분은 동일하나 용량 및 제형이 상이하여 이중 처방에 해당하지 않음' },
    ],
  },
  {
    id: 'a3', appeal_number: 'APL-2026-00028', claim_number: 'CLM-2026-00108',
    claim_date: '2026-01-28', submitted_at: '2026-02-05', resolved_at: '2026-02-18',
    patient_name_masked: '박민수', patient_chart_no: 'C2024-0008',
    original_amount: 234500, rejected_amount: 45600, recovered_amount: 45600,
    status: 'ACCEPTED', success_probability: 91,
    ai_letter_preview: '이의신청이 인정되었습니다. 심사 결과 삭감 항목이 전액 재인정되었습니다.',
    items: [
      { code: 'C5211', name: '일반 혈액검사', rejected_amount: 24800, rejection_reason: '검사 횟수 초과', appeal_argument: '증상 변화에 따른 추가 검사 필요성 인정' },
      { code: 'AA157', name: '초진 진찰료', rejected_amount: 20800, rejection_reason: '초진 기준 미달', appeal_argument: '6개월 이상 미진료 환자로 초진 산정 기준 충족' },
    ],
  },
  {
    id: 'a4', appeal_number: 'APL-2026-00027', claim_number: 'CLM-2026-00102',
    claim_date: '2026-01-25', submitted_at: '2026-02-01', resolved_at: '2026-02-15',
    patient_name_masked: '최수진', patient_chart_no: 'C2024-0009',
    original_amount: 189000, rejected_amount: 32400, recovered_amount: 0,
    status: 'REJECTED', success_probability: 35,
    ai_letter_preview: '이의신청이 기각되었습니다. 심평원 심사 기준에 의거 해당 항목은 의학적 필요성이 인정되지 않습니다.',
    items: [
      { code: 'D2711', name: '갑상선 기능검사 (TSH)', rejected_amount: 18900, rejection_reason: '주호소와 관련성 부족', appeal_argument: '가족력 및 증상 연관성 주장' },
      { code: 'EB411', name: '심전도 (12유도)', rejected_amount: 13500, rejection_reason: '의학적 필요성 인정 불가', appeal_argument: '흉통 호소 기록 첨부' },
    ],
  },
  {
    id: 'a5', appeal_number: 'APL-2026-00025', claim_number: 'CLM-2026-00095',
    claim_date: '2026-01-20', submitted_at: '2026-01-28', resolved_at: '2026-02-10',
    patient_name_masked: '이정민', patient_chart_no: 'C2024-0010',
    original_amount: 567000, rejected_amount: 128000, recovered_amount: 98000,
    status: 'ACCEPTED', success_probability: 78,
    ai_letter_preview: '이의신청이 부분 인정되었습니다. 3건 중 2건이 재인정되었습니다.',
    items: [
      { code: 'E6541', name: '흉부 X-ray', rejected_amount: 45000, rejection_reason: '검사 횟수 초과', appeal_argument: '증상 경과 관찰 필요성 인정' },
      { code: 'C3811', name: 'CRP 정량', rejected_amount: 53000, rejection_reason: '중복 검사', appeal_argument: '치료 반응 모니터링 필수' },
      { code: 'J1301', name: '아목시실린캡슐', rejected_amount: 30000, rejection_reason: '투약기간 초과', appeal_argument: '감염 지속으로 연장 투약 필요' },
    ],
  },
]

const statusConfig: Record<AppealStatus, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  DRAFT: { label: '작성중', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-900/20', icon: Edit3 },
  SUBMITTED: { label: '제출완료', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: Send },
  ACCEPTED: { label: '인정', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: CheckCircle2 },
  REJECTED: { label: '기각', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', icon: XCircle },
}

function probabilityColor(p: number) {
  if (p >= 75) return 'text-emerald-600'
  if (p >= 50) return 'text-amber-600'
  return 'text-red-600'
}

function probabilityBg(p: number) {
  if (p >= 75) return 'bg-emerald-100 dark:bg-emerald-900/30'
  if (p >= 50) return 'bg-amber-100 dark:bg-amber-900/30'
  return 'bg-red-100 dark:bg-red-900/30'
}

export default function AppealsPage() {
  const [appeals, setAppeals] = useState<Appeal[]>([])
  const [stats, setStats] = useState<AppealStats>(demoStats)
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)
  const [filterStatus, setFilterStatus] = useState<AppealStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const res = await fetchApi('/claims/appeals')
      if (res.data && res.data.length > 0) {
        setAppeals(res.data)
        setIsDemo(res.is_demo || false)
        if (res.stats) setStats(res.stats)
      } else {
        setAppeals(demoAppeals)
        setIsDemo(true)
      }
    } catch {
      setAppeals(demoAppeals)
      setIsDemo(true)
    } finally {
      setLoading(false)
    }
  }

  const filteredAppeals = appeals
    .filter((a) => filterStatus === 'all' || a.status === filterStatus)
    .filter((a) => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return a.patient_name_masked.includes(q) || a.appeal_number.toLowerCase().includes(q) || a.claim_number.toLowerCase().includes(q)
    })

  const handleSubmitAppeal = async (appealId: string) => {
    setSubmitting(appealId)
    try {
      await fetchApi(`/claims/appeals/${appealId}/submit`, { method: 'POST' })
      await loadData()
    } catch {
      setAppeals((prev) =>
        prev.map((a) => (a.id === appealId ? { ...a, status: 'SUBMITTED' as AppealStatus, submitted_at: new Date().toISOString() } : a))
      )
    } finally {
      setSubmitting(null)
    }
  }

  const handleWithdraw = async (appealId: string) => {
    if (!confirm('이의신청을 철회하시겠습니까?')) return
    try {
      await fetchApi(`/claims/appeals/${appealId}/withdraw`, { method: 'POST' })
      await loadData()
    } catch {
      setAppeals((prev) => prev.filter((a) => a.id !== appealId))
    }
  }

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
            데모 데이터를 표시 중입니다. 실제 이의신청 건이 생성되면 자동으로 전환됩니다.
          </span>
        </div>
      )}

      {/* ───── 헤더 ───── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Scale className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">이의신청 관리</h1>
            <p className="text-sm text-muted-foreground">AI가 삭감 항목에 대한 이의신청서를 자동 생성합니다</p>
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">전체 이의신청</span>
            <Scale className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold">{stats.total_appeals}<span className="text-sm text-muted-foreground">건</span></div>
          <div className="text-xs text-muted-foreground mt-1 space-x-2">
            <span>작성중 {stats.draft_count}</span>
            <span>제출 {stats.submitted_count}</span>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">인정률</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{stats.success_rate}<span className="text-sm">%</span></div>
          <div className="text-xs text-muted-foreground mt-1">
            {stats.accepted_count}건 인정 / {stats.rejected_count}건 기각
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">삭감 금액</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-500">{(stats.total_rejected_amount / 10000).toFixed(0)}<span className="text-sm text-muted-foreground">만원</span></div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">회수 금액</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{(stats.total_recovered_amount / 10000).toFixed(0)}<span className="text-sm text-muted-foreground">만원</span></div>
          <div className="text-xs text-muted-foreground mt-1">
            회수율 {((stats.total_recovered_amount / stats.total_rejected_amount) * 100).toFixed(1)}%
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
              placeholder="환자명, 이의신청번호, 청구번호로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm outline-none w-full py-3 placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
            {([
              { key: 'all' as const, label: '전체' },
              { key: 'DRAFT' as const, label: '작성중' },
              { key: 'SUBMITTED' as const, label: '제출' },
              { key: 'ACCEPTED' as const, label: '인정' },
              { key: 'REJECTED' as const, label: '기각' },
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

      {/* ───── 이의신청 목록 ───── */}
      <div className="card overflow-hidden">
        <div className="divide-y divide-border">
          {filteredAppeals.map((appeal) => {
            const sc = statusConfig[appeal.status]
            const StatusIcon = sc.icon
            const isExpanded = expandedId === appeal.id

            return (
              <div key={appeal.id}>
                <div
                  className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-secondary/30 transition-colors ${
                    appeal.status === 'REJECTED' ? 'bg-red-50/20 dark:bg-red-900/5' : ''
                  }`}
                  onClick={() => setExpandedId(isExpanded ? null : appeal.id)}
                >
                  <StatusIcon className={`w-5 h-5 ${sc.color} flex-shrink-0`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">{appeal.patient_name_masked}</span>
                      <span className="text-2xs font-mono text-muted-foreground">{appeal.appeal_number}</span>
                      <span className={`text-2xs px-2 py-0.5 rounded-lg font-bold ${sc.color} ${sc.bg}`}>{sc.label}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      청구 {appeal.claim_number} · {appeal.claim_date}
                      {appeal.submitted_at && ` · 제출 ${appeal.submitted_at.split('T')[0]}`}
                    </div>
                  </div>

                  {/* 성공 확률 */}
                  <div className="flex-shrink-0 hidden sm:flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${probabilityBg(appeal.success_probability)}`}>
                      <span className={`text-xs font-bold ${probabilityColor(appeal.success_probability)}`}>
                        {appeal.success_probability}%
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-red-500">-{appeal.rejected_amount.toLocaleString()}원</div>
                      {appeal.recovered_amount > 0 && (
                        <div className="text-2xs text-emerald-600">+{appeal.recovered_amount.toLocaleString()}원 회수</div>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>

                {/* 확장 상세 */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4 animate-fade-in-down">
                    {/* 모바일 확률 + 금액 */}
                    <div className="sm:hidden flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">성공 확률</span>
                        <span className={`text-sm font-bold ${probabilityColor(appeal.success_probability)}`}>
                          {appeal.success_probability}%
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-red-500">-{appeal.rejected_amount.toLocaleString()}원</div>
                        {appeal.recovered_amount > 0 && (
                          <div className="text-2xs text-emerald-600">+{appeal.recovered_amount.toLocaleString()}원 회수</div>
                        )}
                      </div>
                    </div>

                    {/* AI 이의신청서 미리보기 */}
                    <div className="card p-4 border border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-semibold text-blue-600">AI 이의신청서 미리보기</span>
                      </div>
                      <p className="text-sm leading-relaxed text-blue-800 dark:text-blue-300">
                        {appeal.ai_letter_preview}
                      </p>
                    </div>

                    {/* 삭감 항목별 이의 사유 */}
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-2">항목별 이의 내역 ({appeal.items.length}건)</div>
                      <div className="space-y-2">
                        {appeal.items.map((item, i) => (
                          <div key={i} className="p-3 rounded-xl bg-secondary/30 border border-border">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-muted-foreground">{item.code}</span>
                                <span className="text-sm font-medium">{item.name}</span>
                              </div>
                              <span className="text-sm font-bold text-red-500">-{item.rejected_amount.toLocaleString()}원</span>
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex items-start gap-2 text-xs">
                                <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                                <div>
                                  <span className="text-red-600 font-semibold">삭감 사유: </span>
                                  <span className="text-muted-foreground">{item.rejection_reason}</span>
                                </div>
                              </div>
                              <div className="flex items-start gap-2 text-xs">
                                <Brain className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <span className="text-blue-600 font-semibold">이의 논거: </span>
                                  <span className="text-muted-foreground">{item.appeal_argument}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 금액 요약 */}
                    <div className="p-3 rounded-xl bg-secondary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="grid grid-cols-3 gap-4 text-center flex-1">
                        <div>
                          <div className="text-xs text-muted-foreground">삭감 금액</div>
                          <div className="text-sm font-bold text-red-500">{appeal.rejected_amount.toLocaleString()}원</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">성공 확률</div>
                          <div className={`text-sm font-bold ${probabilityColor(appeal.success_probability)}`}>
                            {appeal.success_probability}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">회수 금액</div>
                          <div className="text-sm font-bold text-emerald-600">
                            {appeal.recovered_amount > 0 ? `${appeal.recovered_amount.toLocaleString()}원` : '-'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {appeal.status === 'DRAFT' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSubmitAppeal(appeal.id)
                            }}
                            disabled={submitting === appeal.id}
                            className="btn-primary btn-sm text-xs"
                          >
                            {submitting === appeal.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Send className="w-3 h-3" />
                            )}
                            이의신청 제출
                          </button>
                          <button className="btn-outline btn-sm text-xs">
                            <Edit3 className="w-3 h-3" /> 편집
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleWithdraw(appeal.id)
                            }}
                            className="btn-outline btn-sm text-xs text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-3 h-3" /> 삭제
                          </button>
                        </>
                      )}
                      {appeal.status === 'SUBMITTED' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleWithdraw(appeal.id)
                          }}
                          className="btn-outline btn-sm text-xs text-red-500 hover:text-red-600"
                        >
                          <XCircle className="w-3 h-3" /> 철회
                        </button>
                      )}
                      <Link href={`/emr/claims/${appeal.id}`} className="btn-outline btn-sm text-xs">
                        <Eye className="w-3 h-3" /> 청구서 보기
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {filteredAppeals.length === 0 && (
          <div className="p-12 text-center">
            <Scale className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <div className="font-semibold text-muted-foreground">해당하는 이의신청이 없습니다</div>
            <Link href="/emr/claims/results" className="text-primary text-sm hover:underline mt-2 inline-block">
              심사 결과 확인하기 →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
