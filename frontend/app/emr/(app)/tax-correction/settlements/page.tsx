'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  DollarSign,
  CheckCircle2,
  Clock,
  FileText,
  Download,
  ChevronDown,
  ChevronUp,
  Loader2,
  Info,
  ArrowLeft,
  Receipt,
  CreditCard,
  TrendingUp,
  Percent,
  Calendar,
  Send,
  Eye,
  Printer,
} from 'lucide-react'
import { TossIcon } from '@/components/ui/TossIcon'

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
type PaymentStatus = 'PENDING' | 'INVOICED' | 'PAID'

interface FeeBreakdown {
  range: string
  rate: string
  amount: number
  fee: number
}

interface Settlement {
  id: string
  correction_number: string
  tax_year: number
  refund_amount: number
  base_fee: number
  vat: number
  total_fee: number
  status: PaymentStatus
  payment_date: string | null
  invoice_date: string | null
  created_at: string
  breakdown: FeeBreakdown[]
}

/* ─── 설정 ─── */
const paymentStatusConfig: Record<PaymentStatus, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  PENDING: { label: '정산 대기', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', icon: Clock },
  INVOICED: { label: '청구서 발행', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: Send },
  PAID: { label: '결제 완료', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: CheckCircle2 },
}

/* ─── 데모 데이터 ─── */
const demoSettlements: Settlement[] = [
  {
    id: '1',
    correction_number: 'TAX-2024-0001',
    tax_year: 2024,
    refund_amount: 2880000,
    base_fee: 346000,
    vat: 34600,
    total_fee: 380600,
    status: 'PAID',
    payment_date: '2025-06-15',
    invoice_date: '2025-06-01',
    created_at: '2025-05-20',
    breakdown: [
      { range: '~100만원', rate: '15%', amount: 1000000, fee: 150000 },
      { range: '100~500만원', rate: '12%', amount: 1880000, fee: 225600 },
    ],
  },
  {
    id: '2',
    correction_number: 'TAX-2023-0001',
    tax_year: 2023,
    refund_amount: 1450000,
    base_fee: 204000,
    vat: 20400,
    total_fee: 224400,
    status: 'PAID',
    payment_date: '2025-04-10',
    invoice_date: '2025-03-28',
    created_at: '2025-03-15',
    breakdown: [
      { range: '~100만원', rate: '15%', amount: 1000000, fee: 150000 },
      { range: '100~500만원', rate: '12%', amount: 450000, fee: 54000 },
    ],
  },
  {
    id: '3',
    correction_number: 'TAX-2024-0002',
    tax_year: 2024,
    refund_amount: 5200000,
    base_fee: 574000,
    vat: 57400,
    total_fee: 631400,
    status: 'INVOICED',
    payment_date: null,
    invoice_date: '2025-08-01',
    created_at: '2025-07-20',
    breakdown: [
      { range: '~100만원', rate: '15%', amount: 1000000, fee: 150000 },
      { range: '100~500만원', rate: '12%', amount: 4000000, fee: 480000 },
      { range: '500만원~1,000만원', rate: '10%', amount: 200000, fee: 20000 },
    ],
  },
  {
    id: '4',
    correction_number: 'TAX-2022-0001',
    tax_year: 2022,
    refund_amount: 820000,
    base_fee: 123000,
    vat: 12300,
    total_fee: 135300,
    status: 'PENDING',
    payment_date: null,
    invoice_date: null,
    created_at: '2025-08-10',
    breakdown: [
      { range: '~100만원', rate: '15%', amount: 820000, fee: 123000 },
    ],
  },
]

function formatAmount(amount: number) {
  if (amount >= 10000) return `${(amount / 10000).toFixed(0)}만원`
  return `${amount.toLocaleString()}원`
}

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    loadSettlements()
  }, [])

  async function loadSettlements() {
    setLoading(true)
    try {
      const res = await fetchApi('/tax-correction/settlements')
      setSettlements(res.data || [])
      setIsDemo(res.is_demo || false)
    } catch {
      setSettlements(demoSettlements)
      setIsDemo(true)
    } finally {
      setLoading(false)
    }
  }

  const totalRefunded = settlements.filter(s => s.status === 'PAID').reduce((sum, s) => sum + s.refund_amount, 0)
  const totalFeesPaid = settlements.filter(s => s.status === 'PAID').reduce((sum, s) => sum + s.total_fee, 0)
  const pendingCount = settlements.filter(s => s.status !== 'PAID').length
  const pendingAmount = settlements.filter(s => s.status !== 'PAID').reduce((sum, s) => sum + s.total_fee, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      {/* 데모 배너 */}
      {isDemo && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span className="text-sm text-amber-700 dark:text-amber-300">
            데모 데이터입니다.
          </span>
        </div>
      )}

      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/emr/tax-correction" className="btn-outline btn-sm text-xs">
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">수수료 정산</h1>
            <p className="text-sm text-muted-foreground">경정청구 수수료 및 영수증 관리</p>
          </div>
        </div>
      </div>

      {/* ───── 요약 카드 ───── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground font-medium">총 환급액</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-600">{formatAmount(totalRefunded)}</div>
          <div className="text-xs text-muted-foreground mt-1">결제 완료 건 합계</div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground font-medium">총 수수료 납부</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-600">{formatAmount(totalFeesPaid)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            평균 수수료율 {totalRefunded > 0 ? ((totalFeesPaid / totalRefunded) * 100).toFixed(1) : 0}%
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground font-medium">미정산</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-amber-600">{pendingCount}<span className="text-sm text-muted-foreground">건</span></div>
          <div className="text-xs text-muted-foreground mt-1">{formatAmount(pendingAmount)}</div>
        </div>
      </div>

      {/* ───── 정산 목록 ───── */}
      <div className="card overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-secondary/30 text-xs font-semibold text-muted-foreground border-b border-border">
          <div className="col-span-2">청구번호</div>
          <div className="col-span-1">연도</div>
          <div className="col-span-2 text-right">환급액</div>
          <div className="col-span-2 text-right">수수료</div>
          <div className="col-span-1">상태</div>
          <div className="col-span-2">결제일</div>
          <div className="col-span-2"></div>
        </div>

        <div className="divide-y divide-border">
          {settlements.map(settlement => {
            const ps = paymentStatusConfig[settlement.status]
            const PsIcon = ps.icon
            const isExpanded = expandedId === settlement.id
            const netRefund = settlement.refund_amount - settlement.total_fee

            return (
              <div key={settlement.id}>
                <div
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 p-4 hover:bg-secondary/30 transition-colors items-center cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : settlement.id)}
                >
                  {/* 모바일 */}
                  <div className="md:hidden space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{settlement.correction_number}</span>
                        <span className={`text-2xs px-2 py-0.5 rounded-lg ${ps.color} ${ps.bg}`}>{ps.label}</span>
                      </div>
                      <span className="font-bold text-sm">{formatAmount(settlement.total_fee)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{settlement.tax_year}년 | 환급 {formatAmount(settlement.refund_amount)}</span>
                      <span>{settlement.payment_date || settlement.invoice_date || '-'}</span>
                    </div>
                  </div>

                  {/* 데스크톱 */}
                  <div className="hidden md:block col-span-2">
                    <span className="text-sm font-semibold font-mono">{settlement.correction_number}</span>
                  </div>
                  <div className="hidden md:block col-span-1 text-sm">
                    {settlement.tax_year}년
                  </div>
                  <div className="hidden md:block col-span-2 text-right text-sm font-semibold text-emerald-600">
                    {formatAmount(settlement.refund_amount)}
                  </div>
                  <div className="hidden md:block col-span-2 text-right">
                    <div className="text-sm font-semibold">{formatAmount(settlement.total_fee)}</div>
                    <div className="text-2xs text-muted-foreground">
                      (기본 {formatAmount(settlement.base_fee)} + VAT {formatAmount(settlement.vat)})
                    </div>
                  </div>
                  <div className="hidden md:flex col-span-1 items-center gap-1">
                    <PsIcon className={`w-3.5 h-3.5 ${ps.color}`} />
                    <span className={`text-2xs font-semibold ${ps.color}`}>{ps.label}</span>
                  </div>
                  <div className="hidden md:block col-span-2 text-xs text-muted-foreground">
                    {settlement.status === 'PAID' && settlement.payment_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        결제: {settlement.payment_date}
                      </div>
                    )}
                    {settlement.status === 'INVOICED' && settlement.invoice_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        청구: {settlement.invoice_date}
                      </div>
                    )}
                    {settlement.status === 'PENDING' && (
                      <span className="text-amber-600">환급 완료 후 정산</span>
                    )}
                  </div>
                  <div className="hidden md:flex col-span-2 justify-end items-center gap-2">
                    {settlement.status === 'PAID' && (
                      <>
                        <button className="btn-outline btn-sm text-xs" onClick={e => e.stopPropagation()}>
                          <Download className="w-3 h-3" />
                          영수증
                        </button>
                      </>
                    )}
                    {settlement.status === 'INVOICED' && (
                      <button className="btn-outline btn-sm text-xs" onClick={e => e.stopPropagation()}>
                        <Download className="w-3 h-3" />
                        청구서
                      </button>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* 확장: 수수료 상세 */}
                {isExpanded && (
                  <div className="px-4 pb-4 animate-fade-in-down">
                    <div className="bg-secondary/30 rounded-xl p-4 space-y-4">
                      {/* 수수료 단계 */}
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                          <Percent className="w-3.5 h-3.5" /> 수수료 단계별 내역
                        </h4>
                        <div className="space-y-2">
                          {settlement.breakdown.map((tier, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-card rounded-xl">
                              <div className="flex items-center gap-4">
                                <span className="text-xs text-muted-foreground w-24">{tier.range}</span>
                                <span className="text-xs font-semibold text-blue-600">{tier.rate}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground">대상: {formatAmount(tier.amount)}</div>
                                <div className="text-sm font-semibold">{formatAmount(tier.fee)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 합계 */}
                      <div className="p-4 bg-card rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">환급액</span>
                          <span className="font-semibold text-emerald-600">{settlement.refund_amount.toLocaleString()}원</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">기본 수수료</span>
                          <span>{settlement.base_fee.toLocaleString()}원</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">VAT (10%)</span>
                          <span>{settlement.vat.toLocaleString()}원</span>
                        </div>
                        <div className="border-t border-border pt-2 flex items-center justify-between text-sm font-bold">
                          <span>총 수수료</span>
                          <span className="text-amber-600">{settlement.total_fee.toLocaleString()}원</span>
                        </div>
                        <div className="border-t border-border pt-2 flex items-center justify-between text-sm font-bold">
                          <span>순 환급액</span>
                          <span className="text-lg">{netRefund.toLocaleString()}원</span>
                        </div>
                      </div>

                      {/* 결제 상태 추적 */}
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground mb-3">결제 상태 추적</h4>
                        <div className="flex items-center gap-2">
                          {(['PENDING', 'INVOICED', 'PAID'] as PaymentStatus[]).map((status, i) => {
                            const config = paymentStatusConfig[status]
                            const StatusIcon = config.icon
                            const isActive = (['PENDING', 'INVOICED', 'PAID'] as PaymentStatus[]).indexOf(settlement.status) >= i
                            const isCurrent = settlement.status === status
                            return (
                              <div key={status} className="flex items-center gap-2 flex-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  isActive ? (isCurrent ? 'bg-primary text-white' : 'bg-emerald-500 text-white') : 'bg-secondary text-muted-foreground'
                                }`}>
                                  <StatusIcon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className={`text-2xs font-semibold ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{config.label}</div>
                                  <div className="text-2xs text-muted-foreground">
                                    {status === 'PENDING' && settlement.created_at}
                                    {status === 'INVOICED' && (settlement.invoice_date || '-')}
                                    {status === 'PAID' && (settlement.payment_date || '-')}
                                  </div>
                                </div>
                                {i < 2 && <div className={`flex-1 h-0.5 rounded ${isActive ? 'bg-emerald-500' : 'bg-secondary'}`} />}
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* 다운로드 버튼 */}
                      <div className="flex items-center gap-2">
                        {settlement.status === 'INVOICED' || settlement.status === 'PAID' ? (
                          <button className="btn-outline btn-sm text-xs">
                            <FileText className="w-3 h-3" />
                            청구서 PDF
                          </button>
                        ) : null}
                        {settlement.status === 'PAID' && (
                          <button className="btn-outline btn-sm text-xs">
                            <Receipt className="w-3 h-3" />
                            영수증 PDF
                          </button>
                        )}
                        <button className="btn-outline btn-sm text-xs">
                          <Printer className="w-3 h-3" />
                          인쇄
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {settlements.length === 0 && (
          <div className="p-12 text-center">
            <Receipt className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <div className="font-semibold text-muted-foreground mb-2">정산 내역이 없습니다</div>
            <p className="text-sm text-muted-foreground">경정청구 환급이 완료되면 수수료가 자동으로 정산됩니다.</p>
          </div>
        )}
      </div>

      {/* ───── 수수료 요율표 ───── */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Percent className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold">수수료 요율표 (성공 보수제)</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { range: '100만원 미만', rate: '15%', desc: '환급액의 15%' },
            { range: '100만~500만원', rate: '12%', desc: '환급액의 12%' },
            { range: '500만~1,000만원', rate: '10%', desc: '환급액의 10%' },
            { range: '1,000만원 이상', rate: '8%', desc: '환급액의 8%' },
          ].map((tier, i) => (
            <div key={i} className={`p-4 rounded-xl text-center ${i === 1 ? 'bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800' : 'bg-secondary/30'}`}>
              <div className="text-xs text-muted-foreground mb-1">{tier.range}</div>
              <div className="text-2xl font-bold text-blue-600">{tier.rate}</div>
              <div className="text-2xs text-muted-foreground mt-1">{tier.desc}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 p-3 rounded-xl bg-secondary/20 text-center">
          <p className="text-2xs text-muted-foreground">
            환급 실패 시 수수료 0원. 성공한 경우에만 환급액에서 자동 공제됩니다. 모든 수수료에 VAT(10%)가 별도 부과됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}
