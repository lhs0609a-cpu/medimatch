'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Calculator,
  Brain,
  Sparkles,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Eye,
  Download,
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Loader2,
  Info,
  X,
  Shield,
  Percent,
  Upload,
  BarChart3,
} from 'lucide-react'

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
type CorrectionStatus = 'DRAFT' | 'PENDING_REVIEW' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'SCANNING' | 'SCAN_COMPLETE' | 'PENDING_DOCS' | 'READY_TO_SUBMIT' | 'NTS_RECEIVED' | 'UNDER_REVIEW' | 'PARTIALLY_APPROVED' | 'REFUND_PENDING' | 'APPEAL' | 'CANCELED'

interface Deduction {
  id?: number
  category: string
  description: string
  amount: number
  evidence_required?: boolean
  evidence_uploaded?: boolean
  ai_suggested?: boolean
  ai_explanation?: string
}

interface TaxCorrection {
  id: string
  tax_year: number
  correction_number: string
  original_filed_amount: number
  correct_amount: number
  refund_amount: number
  platform_fee: number
  status: CorrectionStatus
  ai_detected: boolean
  ai_confidence: number
  submitted_at?: string | null
  approved_at?: string | null
  refund_received_at?: string | null
  deductions?: Deduction[]
  is_demo?: boolean
}

interface ScanResult {
  tax_year: number
  potential_refund: number
  confidence: number
  missed_deductions: {
    category: string
    description: string
    estimated_amount: number
    confidence: number
    source: string
  }[]
  is_demo: boolean
}

const statusConfig: Record<CorrectionStatus, { label: string; color: string; bg: string }> = {
  DRAFT: { label: '초안', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-900/20' },
  SCANNING: { label: 'AI스캔중', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  SCAN_COMPLETE: { label: '스캔완료', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20' },
  PENDING_REVIEW: { label: '검토중', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  PENDING_DOCS: { label: '서류필요', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  READY_TO_SUBMIT: { label: '제출준비', color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
  SUBMITTED: { label: '제출완료', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  NTS_RECEIVED: { label: '국세청접수', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  UNDER_REVIEW: { label: '심사중', color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-900/20' },
  APPROVED: { label: '승인', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  PARTIALLY_APPROVED: { label: '일부승인', color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-900/20' },
  REJECTED: { label: '반려', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
  REFUND_PENDING: { label: '환급대기', color: 'text-lime-600 dark:text-lime-400', bg: 'bg-lime-50 dark:bg-lime-900/20' },
  COMPLETED: { label: '환급완료', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
  APPEAL: { label: '이의신청', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20' },
  CANCELED: { label: '취소', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-900/20' },
}

const categoryLabels: Record<string, string> = {
  MEDICAL_EXPENSE: '의료비',
  EDUCATION: '교육비',
  DONATION: '기부금',
  RETIREMENT: '퇴직연금',
  CREDIT_CARD: '카드공제',
  OTHER: '기타',
  EQUIPMENT_DEPRECIATION: '의료기기 감가상각',
  EMPLOYMENT_TAX_CREDIT: '고용증대 세액공제',
  YOUTH_EMPLOYMENT: '청년고용 세액공제',
  CAREER_BREAK_WOMEN: '경력단절여성 세액공제',
  RND_TAX_CREDIT: '연구개발비 세액공제',
  FACILITY_INVESTMENT: '시설투자 세액공제',
  FAITHFUL_FILING: '성실신고 확인비용',
  VAT_OPTIMIZATION: '부가세 최적화',
  VEHICLE_EXPENSE: '차량 경비',
  ENTERTAINMENT_WELFARE: '접대·복리후생비',
  RETIREMENT_PROVISION: '퇴직급여 충당금',
  STAFF_EDUCATION: '직원 교육훈련비',
  PENSION_SAVINGS: '연금저축',
  HOUSING_FUND: '주택자금',
  INSURANCE_PREMIUM: '보험료',
}

function formatAmount(amount: number) {
  if (amount >= 10000) return `${(amount / 10000).toFixed(0)}만원`
  return `${amount.toLocaleString()}원`
}

export default function TaxCorrectionPage() {
  const [corrections, setCorrections] = useState<TaxCorrection[]>([])
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [isDemo, setIsDemo] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterYear, setFilterYear] = useState<number | 'all'>('all')
  const [showNewModal, setShowNewModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const res = await fetchApi('/tax-correction/')
      setCorrections(res.data || [])
      setIsDemo(res.is_demo)
    } catch {
      setCorrections([])
    } finally {
      setLoading(false)
    }
  }

  async function handleAiScan() {
    setScanning(true)
    try {
      const year = new Date().getFullYear() - 1
      const res = await fetchApi(`/tax-correction/scan?tax_year=${year}`)
      setScanResult(res)
    } catch {
      // fallback
    } finally {
      setScanning(false)
    }
  }

  async function handleSubmit(id: string) {
    try {
      await fetchApi(`/tax-correction/${id}/submit`, { method: 'POST' })
      await loadData()
    } catch {}
  }

  async function handleCalculate(id: string) {
    try {
      const res = await fetchApi(`/tax-correction/${id}/calculate`, { method: 'POST' })
      await loadData()
      return res
    } catch {
      return null
    }
  }

  // 통계
  const totalPotentialRefund = corrections.reduce((s, c) => s + c.refund_amount, 0)
  const inProgressCount = corrections.filter(c => ['DRAFT', 'PENDING_REVIEW', 'SUBMITTED'].includes(c.status)).length
  const completedCount = corrections.filter(c => c.status === 'COMPLETED').length

  const filteredCorrections = corrections.filter(c => filterYear === 'all' || c.tax_year === filterYear)
  const uniqueYears = [...new Set(corrections.map(c => c.tax_year))].sort((a, b) => b - a)

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
            데모 데이터입니다. 보험청구 데이터가 쌓이면 AI가 자동으로 놓친 공제를 찾아드립니다.
          </span>
        </div>
      )}

      {/* ───── 서브 네비게이션 ───── */}
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
        {[
          { href: '/emr/tax-correction', label: '대시보드', active: true },
          { href: '/emr/tax-correction/scan', label: 'AI 세금스캔' },
          { href: '/emr/tax-correction/new', label: '경정청구 생성' },
          { href: '/emr/tax-correction/documents', label: '증빙 서류' },
          { href: '/emr/tax-correction/settlements', label: '수수료 정산' },
          { href: '/emr/tax-correction/hometax', label: '홈택스 연동' },
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
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">세무 경정청구</h1>
            <p className="text-sm text-muted-foreground">AI가 놓친 공제를 찾아 세금을 돌려드립니다</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/emr/tax-correction/scan" className="btn-sm text-xs bg-emerald-600 text-white hover:bg-emerald-700">
            <Brain className="w-3.5 h-3.5" />
            AI 스캔
          </Link>
          <Link href="/emr/tax-correction/new" className="btn-primary btn-sm">
            <Plus className="w-3.5 h-3.5" />
            새 경정청구
          </Link>
        </div>
      </div>

      {/* ───── 통계 카드 ───── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground font-medium">환급 가능 예상액</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-600">
            ₩{formatAmount(totalPotentialRefund)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            수수료 공제 전 금액
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground font-medium">진행중</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-600">{inProgressCount}<span className="text-sm text-muted-foreground">건</span></div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground font-medium">환급 완료</span>
            <div className="w-8 h-8 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-green-600">{completedCount}<span className="text-sm text-muted-foreground">건</span></div>
        </div>
      </div>

      {/* ───── AI 스캔 결과 ───── */}
      {scanResult && (
        <div className="card p-5 border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-emerald-600" />
              <span className="font-bold">AI 공제 스캔 결과</span>
              <Sparkles className="w-4 h-4 text-emerald-400" />
              {scanResult.is_demo && (
                <span className="text-2xs px-2 py-0.5 rounded bg-amber-100 text-amber-600 font-medium">데모</span>
              )}
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">예상 환급액</div>
              <div className="text-xl font-bold text-emerald-600">₩{formatAmount(scanResult.potential_refund)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {scanResult.missed_deductions.map((ded, i) => (
              <div key={i} className="p-4 bg-card rounded-xl border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-lg text-2xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700">
                    {categoryLabels[ded.category] || ded.category}
                  </span>
                  <span className="text-2xs text-muted-foreground">신뢰도 {ded.confidence}%</span>
                </div>
                <div className="text-sm font-medium mb-1">{ded.description}</div>
                <div className="text-lg font-bold text-emerald-600">₩{formatAmount(ded.estimated_amount)}</div>
                <div className="text-2xs text-muted-foreground mt-1">{ded.source}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between p-3 bg-card rounded-xl">
            <div className="text-sm">
              <span className="text-muted-foreground">이 공제 항목으로 경정청구 시:</span>
              <span className="font-bold text-emerald-600 ml-2">
                환급 ₩{formatAmount(scanResult.potential_refund)}
              </span>
              <span className="text-muted-foreground mx-1">→</span>
              <span className="text-sm text-muted-foreground">
                수수료 ₩{formatAmount(Math.round(scanResult.potential_refund * 0.12))} (12%)
              </span>
              <span className="text-muted-foreground mx-1">→</span>
              <span className="font-bold">
                순 환급 ₩{formatAmount(Math.round(scanResult.potential_refund * 0.88))}
              </span>
            </div>
            <button className="btn-primary btn-sm text-xs flex-shrink-0">
              <FileText className="w-3 h-3" />
              경정청구 시작
            </button>
          </div>
        </div>
      )}

      {/* ───── 필터 ───── */}
      <div className="card p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setFilterYear('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                filterYear === 'all' ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              전체
            </button>
            {uniqueYears.map(year => (
              <button
                key={year}
                onClick={() => setFilterYear(year)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                  filterYear === year ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {year}년
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ───── 경정청구 목록 ───── */}
      <div className="card overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-secondary/30 text-xs font-semibold text-muted-foreground border-b border-border">
          <div className="col-span-1">연도</div>
          <div className="col-span-2">청구번호</div>
          <div className="col-span-2">원 신고액</div>
          <div className="col-span-2">환급 예상</div>
          <div className="col-span-1">수수료</div>
          <div className="col-span-1">순 환급</div>
          <div className="col-span-1">상태</div>
          <div className="col-span-2"></div>
        </div>

        <div className="divide-y divide-border">
          {filteredCorrections.map((correction) => {
            const st = statusConfig[correction.status] || statusConfig.DRAFT
            const netRefund = correction.refund_amount - correction.platform_fee
            const isExpanded = expandedId === correction.id

            return (
              <div key={correction.id}>
                <div
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 p-4 hover:bg-secondary/30 transition-colors items-center cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : correction.id)}
                >
                  {/* 모바일 */}
                  <div className="md:hidden space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{correction.tax_year}년</span>
                        <span className={`text-2xs px-2 py-0.5 rounded-lg ${st.color} ${st.bg}`}>{st.label}</span>
                        {correction.ai_detected && <Sparkles className="w-3 h-3 text-emerald-500" />}
                      </div>
                      <span className="font-bold text-sm text-emerald-600">₩{formatAmount(correction.refund_amount)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{correction.correction_number}</div>
                  </div>

                  {/* 데스크톱 */}
                  <div className="hidden md:block col-span-1 text-sm font-semibold">
                    {correction.tax_year}년
                  </div>
                  <div className="hidden md:flex col-span-2 items-center gap-1.5">
                    <span className="text-xs font-mono text-muted-foreground">{correction.correction_number}</span>
                    {correction.ai_detected && <Sparkles className="w-3 h-3 text-emerald-500" title="AI 발견" />}
                  </div>
                  <div className="hidden md:block col-span-2 text-sm">
                    ₩{formatAmount(correction.original_filed_amount)}
                  </div>
                  <div className="hidden md:block col-span-2 text-sm font-semibold text-emerald-600">
                    ₩{formatAmount(correction.refund_amount)}
                  </div>
                  <div className="hidden md:block col-span-1 text-xs text-muted-foreground">
                    ₩{formatAmount(correction.platform_fee)}
                  </div>
                  <div className="hidden md:block col-span-1 text-sm font-bold">
                    ₩{formatAmount(netRefund)}
                  </div>
                  <div className="hidden md:block col-span-1">
                    <span className={`text-2xs px-2.5 py-1 rounded-lg font-semibold ${st.color} ${st.bg}`}>{st.label}</span>
                  </div>
                  <div className="hidden md:flex col-span-2 justify-end items-center gap-2">
                    {correction.status === 'DRAFT' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSubmit(correction.id); }}
                        className="btn-primary btn-sm text-xs"
                      >
                        제출
                      </button>
                    )}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>

                {/* 확장 상세 */}
                {isExpanded && (
                  <div className="px-4 pb-4 animate-fade-in-down">
                    <div className="bg-secondary/30 rounded-xl p-4 space-y-4">
                      {/* 수수료 계산 */}
                      <div className="flex flex-col sm:flex-row sm:flex-wrap items-center gap-3 p-3 bg-card rounded-xl">
                        <div className="text-center px-4">
                          <div className="text-xs text-muted-foreground">환급 예상</div>
                          <div className="text-lg font-bold text-emerald-600">₩{formatAmount(correction.refund_amount)}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
                        <div className="text-center px-4">
                          <div className="text-xs text-muted-foreground">수수료</div>
                          <div className="text-lg font-bold text-amber-600">-₩{formatAmount(correction.platform_fee)}</div>
                          <div className="text-2xs text-muted-foreground">
                            ({correction.refund_amount > 0 ? Math.round(correction.platform_fee / correction.refund_amount * 100) : 0}%)
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
                        <div className="text-center px-4">
                          <div className="text-xs text-muted-foreground">순 환급액</div>
                          <div className="text-lg font-bold">₩{formatAmount(netRefund)}</div>
                        </div>
                      </div>

                      {/* 공제 항목 */}
                      {correction.deductions && correction.deductions.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground mb-2">공제 항목</h4>
                          <div className="space-y-2">
                            {correction.deductions.map((ded, i) => (
                              <div key={i} className="flex items-center gap-3 p-3 bg-card rounded-xl">
                                <span className="px-2 py-0.5 rounded-lg text-2xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700">
                                  {categoryLabels[ded.category] || ded.category}
                                </span>
                                <div className="flex-1 text-sm">{ded.description}</div>
                                <div className="text-sm font-semibold">₩{formatAmount(ded.amount)}</div>
                                {ded.ai_suggested && <Sparkles className="w-3 h-3 text-emerald-500" title="AI 제안" />}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 타임라인 */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {correction.submitted_at && <span>제출: {new Date(correction.submitted_at).toLocaleDateString('ko-KR')}</span>}
                        {correction.approved_at && <span>· 승인: {new Date(correction.approved_at).toLocaleDateString('ko-KR')}</span>}
                        {correction.refund_received_at && <span>· 환급: {new Date(correction.refund_received_at).toLocaleDateString('ko-KR')}</span>}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCalculate(correction.id)}
                          className="btn-outline btn-sm text-xs"
                        >
                          <Calculator className="w-3 h-3" />
                          환급액 재계산
                        </button>
                        {correction.status === 'DRAFT' && (
                          <button
                            onClick={() => handleSubmit(correction.id)}
                            className="btn-primary btn-sm text-xs"
                          >
                            <FileText className="w-3 h-3" />
                            제출
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

        {filteredCorrections.length === 0 && (
          <div className="p-12 text-center">
            <Calculator className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <div className="font-semibold text-muted-foreground mb-2">경정청구 내역이 없습니다</div>
            <p className="text-sm text-muted-foreground mb-4">AI 스캔을 실행하여 놓친 공제를 찾아보세요</p>
            <button onClick={handleAiScan} disabled={scanning} className="btn-primary btn-sm">
              {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
              AI 스캔 시작
            </button>
          </div>
        )}
      </div>

      {/* 수수료 안내 */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Percent className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold">수수료 안내 (성공 보수제)</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-secondary/30 text-center">
            <div className="text-xs text-muted-foreground mb-1">~100만원</div>
            <div className="text-2xl font-bold text-blue-600">15%</div>
            <div className="text-2xs text-muted-foreground mt-1">환급액의 15%</div>
          </div>
          <div className="p-4 rounded-xl bg-secondary/30 text-center">
            <div className="text-xs text-muted-foreground mb-1">100만~500만원</div>
            <div className="text-2xl font-bold text-blue-600">12%</div>
            <div className="text-2xs text-muted-foreground mt-1">구간별 누진</div>
          </div>
          <div className="p-4 rounded-xl bg-secondary/30 text-center">
            <div className="text-xs text-muted-foreground mb-1">500만~1,000만원</div>
            <div className="text-2xl font-bold text-blue-600">10%</div>
            <div className="text-2xs text-muted-foreground mt-1">구간별 누진</div>
          </div>
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 text-center border border-blue-200 dark:border-blue-800">
            <div className="text-xs text-muted-foreground mb-1">1,000만원 이상</div>
            <div className="text-2xl font-bold text-blue-600">8%</div>
            <div className="text-2xs text-muted-foreground mt-1">최대 혜택</div>
          </div>
        </div>
        <p className="text-2xs text-muted-foreground mt-3 text-center">
          환급 실패 시 수수료 0원. 성공한 경우에만 환급액에서 자동 공제됩니다.
        </p>
      </div>

      {/* 새 경정청구 모달 */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowNewModal(false)}>
          <div className="bg-card rounded-2xl shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-bold text-lg">새 경정청구</h3>
              <button onClick={() => setShowNewModal(false)} className="btn-icon"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-muted-foreground">
                AI 스캔을 먼저 실행하면 놓친 공제 항목을 자동으로 찾아줍니다.
                스캔 결과를 바탕으로 경정청구를 생성하시는 것을 권장합니다.
              </p>
              <button
                onClick={() => { setShowNewModal(false); handleAiScan(); }}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2"
              >
                <Brain className="w-4 h-4" /> AI 스캔 후 자동 생성
              </button>
              <div className="text-center text-xs text-muted-foreground">또는</div>
              <button
                onClick={() => setShowNewModal(false)}
                className="w-full py-3 rounded-xl font-semibold text-sm bg-secondary text-foreground flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" /> 직접 입력하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
