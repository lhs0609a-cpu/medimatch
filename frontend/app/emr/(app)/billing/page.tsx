'use client'

import { useState, useMemo } from 'react'
import {
  DollarSign,
  CreditCard,
  Banknote,
  Building2,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  User,
  Calendar,
  Printer,
  Send,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Wallet,
  TrendingUp,
  BarChart3,
  FileText,
  X,
  Check,
  Smartphone,
  Download,
  PieChart,
} from 'lucide-react'

/* ─── 타입 ─── */
type PaymentStatus = 'paid' | 'unpaid' | 'partial' | 'refunded'
type PaymentMethod = 'card' | 'cash' | 'transfer' | 'insurance'

interface BillingRecord {
  id: string
  time: string
  patient: { name: string; chartNo: string; age: number; gender: string }
  items: { name: string; amount: number; insurance: number; copay: number }[]
  totalAmount: number
  insuranceAmount: number
  copay: number
  paidAmount: number
  status: PaymentStatus
  method?: PaymentMethod
  receiptIssued: boolean
}

/* ─── 더미 데이터 ─── */
const todayStats = {
  totalRevenue: 2850000,
  revenueChange: 5.8,
  totalPatients: 34,
  cardPayments: 1920000,
  cashPayments: 580000,
  transferPayments: 350000,
  unpaidAmount: 185000,
  unpaidCount: 3,
}

const billingRecords: BillingRecord[] = [
  {
    id: 'BIL-0034',
    time: '14:15',
    patient: { name: '김영수', chartNo: 'C-2024-0456', age: 45, gender: '남' },
    items: [
      { name: '초진 진찰료', amount: 18800, insurance: 13160, copay: 5640 },
      { name: '처방료', amount: 11500, insurance: 8050, copay: 3450 },
      { name: '혈액검사 (CBC)', amount: 12000, insurance: 8400, copay: 3600 },
    ],
    totalAmount: 42300,
    insuranceAmount: 29610,
    copay: 12690,
    paidAmount: 0,
    status: 'unpaid',
    receiptIssued: false,
  },
  {
    id: 'BIL-0033',
    time: '13:50',
    patient: { name: '이미경', chartNo: 'C-2024-0312', age: 33, gender: '여' },
    items: [
      { name: '재진 진찰료', amount: 15200, insurance: 10640, copay: 4560 },
      { name: '처방료', amount: 11500, insurance: 8050, copay: 3450 },
    ],
    totalAmount: 26700,
    insuranceAmount: 18690,
    copay: 8010,
    paidAmount: 8010,
    status: 'paid',
    method: 'card',
    receiptIssued: true,
  },
  {
    id: 'BIL-0032',
    time: '13:20',
    patient: { name: '박준호', chartNo: 'C-2024-0289', age: 28, gender: '남' },
    items: [
      { name: '재진 진찰료', amount: 15200, insurance: 10640, copay: 4560 },
      { name: '처방료', amount: 11500, insurance: 8050, copay: 3450 },
      { name: 'X-ray (흉부)', amount: 22000, insurance: 15400, copay: 6600 },
    ],
    totalAmount: 48700,
    insuranceAmount: 34090,
    copay: 14610,
    paidAmount: 14610,
    status: 'paid',
    method: 'cash',
    receiptIssued: true,
  },
  {
    id: 'BIL-0031',
    time: '12:45',
    patient: { name: '최은지', chartNo: 'C-2024-0178', age: 52, gender: '여' },
    items: [
      { name: '재진 진찰료', amount: 15200, insurance: 10640, copay: 4560 },
      { name: '처방료', amount: 11500, insurance: 8050, copay: 3450 },
      { name: 'HbA1c 검사', amount: 8500, insurance: 5950, copay: 2550 },
    ],
    totalAmount: 35200,
    insuranceAmount: 24640,
    copay: 10560,
    paidAmount: 10560,
    status: 'paid',
    method: 'card',
    receiptIssued: true,
  },
  {
    id: 'BIL-0030',
    time: '11:55',
    patient: { name: '정대현', chartNo: 'C-2024-0098', age: 67, gender: '남' },
    items: [
      { name: '재진 진찰료', amount: 15200, insurance: 10640, copay: 4560 },
      { name: '처방료', amount: 11500, insurance: 8050, copay: 3450 },
      { name: '관절강 내 주사', amount: 35000, insurance: 24500, copay: 10500 },
      { name: 'X-ray (무릎)', amount: 18000, insurance: 12600, copay: 5400 },
    ],
    totalAmount: 79700,
    insuranceAmount: 55790,
    copay: 23910,
    paidAmount: 10000,
    status: 'partial',
    method: 'cash',
    receiptIssued: false,
  },
  {
    id: 'BIL-0029',
    time: '11:20',
    patient: { name: '한소영', chartNo: 'C-2024-0234', age: 41, gender: '여' },
    items: [
      { name: '재진 진찰료', amount: 15200, insurance: 10640, copay: 4560 },
      { name: '처방료', amount: 11500, insurance: 8050, copay: 3450 },
    ],
    totalAmount: 26700,
    insuranceAmount: 18690,
    copay: 8010,
    paidAmount: 8010,
    status: 'paid',
    method: 'transfer',
    receiptIssued: true,
  },
  {
    id: 'BIL-0028',
    time: '10:40',
    patient: { name: '오민수', chartNo: 'C-2024-0567', age: 8, gender: '남' },
    items: [
      { name: '초진 진찰료 (소아)', amount: 21200, insurance: 14840, copay: 6360 },
      { name: '처방료', amount: 11500, insurance: 8050, copay: 3450 },
    ],
    totalAmount: 32700,
    insuranceAmount: 22890,
    copay: 9810,
    paidAmount: 0,
    status: 'unpaid',
    receiptIssued: false,
  },
]

/* ─── 유틸 ─── */
const statusConfig: Record<PaymentStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  paid: { label: '수납완료', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: CheckCircle2 },
  unpaid: { label: '미수납', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', icon: XCircle },
  partial: { label: '부분수납', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', icon: AlertTriangle },
  refunded: { label: '환불', color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-900/20', icon: RefreshCw },
}

const methodLabels: Record<PaymentMethod, { label: string; icon: React.ElementType }> = {
  card: { label: '카드', icon: CreditCard },
  cash: { label: '현금', icon: Banknote },
  transfer: { label: '계좌이체', icon: Building2 },
  insurance: { label: '보험', icon: FileText },
}

const filterTabs = [
  { key: 'all', label: '전체' },
  { key: 'unpaid', label: '미수납' },
  { key: 'paid', label: '수납완료' },
  { key: 'partial', label: '부분수납' },
]

export default function BillingPage() {
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showPayModal, setShowPayModal] = useState<string | null>(null)
  const [payMethod, setPayMethod] = useState<PaymentMethod>('card')

  const filtered = useMemo(() => {
    let list = billingRecords
    if (activeFilter !== 'all') {
      list = list.filter(r => r.status === activeFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(r =>
        r.patient.name.includes(q) ||
        r.patient.chartNo.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      )
    }
    return list
  }, [activeFilter, searchQuery])

  const counts = useMemo(() => ({
    all: billingRecords.length,
    unpaid: billingRecords.filter(r => r.status === 'unpaid').length,
    paid: billingRecords.filter(r => r.status === 'paid').length,
    partial: billingRecords.filter(r => r.status === 'partial').length,
  }), [])

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">수납/결제 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">오늘의 수납 현황 및 결제 관리</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-sm text-xs bg-secondary text-foreground">
            <Download className="w-3.5 h-3.5" /> 정산 내역
          </button>
          <button className="btn-sm text-xs bg-blue-600 text-white hover:bg-blue-700">
            <Receipt className="w-3.5 h-3.5" /> 일일 마감
          </button>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">오늘 수납액</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-bold">₩{(todayStats.totalRevenue / 10000).toFixed(0)}<span className="text-sm font-normal text-muted-foreground">만</span></div>
          <div className="flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3 h-3 text-emerald-500" />
            <span className="text-2xs text-emerald-600 font-semibold">+{todayStats.revenueChange}%</span>
            <span className="text-2xs text-muted-foreground">전일비</span>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">카드 결제</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold">₩{(todayStats.cardPayments / 10000).toFixed(0)}<span className="text-sm font-normal text-muted-foreground">만</span></div>
          <div className="text-2xs text-muted-foreground mt-1">{((todayStats.cardPayments / todayStats.totalRevenue) * 100).toFixed(0)}% 비율</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">현금/이체</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Banknote className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <div className="text-2xl font-bold">₩{((todayStats.cashPayments + todayStats.transferPayments) / 10000).toFixed(0)}<span className="text-sm font-normal text-muted-foreground">만</span></div>
          <div className="text-2xs text-muted-foreground mt-1">현금 ₩{(todayStats.cashPayments / 10000).toFixed(0)}만 / 이체 ₩{(todayStats.transferPayments / 10000).toFixed(0)}만</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">미수금</span>
            <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-red-600">₩{todayStats.unpaidAmount.toLocaleString()}</div>
          <div className="text-2xs text-muted-foreground mt-1">{todayStats.unpaidCount}건 미수납</div>
        </div>
      </div>

      {/* 결제 수단별 비율 바 */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">오늘 결제 수단별 비율</span>
          <span className="text-xs text-muted-foreground">{todayStats.totalPatients}명 진료</span>
        </div>
        <div className="flex h-3 rounded-full overflow-hidden">
          <div className="bg-blue-500 transition-all" style={{ width: `${(todayStats.cardPayments / todayStats.totalRevenue) * 100}%` }} />
          <div className="bg-emerald-500 transition-all" style={{ width: `${(todayStats.cashPayments / todayStats.totalRevenue) * 100}%` }} />
          <div className="bg-purple-500 transition-all" style={{ width: `${(todayStats.transferPayments / todayStats.totalRevenue) * 100}%` }} />
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> 카드 {((todayStats.cardPayments / todayStats.totalRevenue) * 100).toFixed(0)}%</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> 현금 {((todayStats.cashPayments / todayStats.totalRevenue) * 100).toFixed(0)}%</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500" /> 이체 {((todayStats.transferPayments / todayStats.totalRevenue) * 100).toFixed(0)}%</div>
        </div>
      </div>

      {/* 수납 목록 */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-border">
          <div className="flex items-center gap-1">
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeFilter === tab.key ? 'bg-blue-600 text-white' : 'text-muted-foreground hover:bg-secondary'
                }`}
              >
                {tab.label}
                <span className={`text-2xs px-1.5 py-0.5 rounded-full ${activeFilter === tab.key ? 'bg-white/20' : 'bg-secondary'}`}>
                  {counts[tab.key as keyof typeof counts]}
                </span>
              </button>
            ))}
          </div>
          <div className="sm:ml-auto relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="환자명, 차트번호..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input pl-9 py-2 text-sm w-full"
            />
          </div>
        </div>

        <div className="divide-y divide-border">
          {filtered.map(record => {
            const sc = statusConfig[record.status]
            const StatusIcon = sc.icon
            const isExpanded = expandedId === record.id
            const remaining = record.copay - record.paidAmount

            return (
              <div key={record.id}>
                <div
                  className={`flex items-center gap-4 px-4 py-3.5 cursor-pointer hover:bg-secondary/30 transition-colors ${
                    record.status === 'unpaid' ? 'bg-red-50/30 dark:bg-red-900/5' : ''
                  }`}
                  onClick={() => setExpandedId(isExpanded ? null : record.id)}
                >
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-muted-foreground">{record.patient.name[0]}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{record.patient.name}</span>
                      <span className="text-2xs text-muted-foreground">{record.patient.gender}/{record.patient.age}세</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-2xs font-bold ${sc.color} ${sc.bg}`}>
                        <StatusIcon className="w-3 h-3" /> {sc.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-2xs text-muted-foreground mt-0.5">
                      <span>{record.id}</span>
                      <span>·</span>
                      <Clock className="w-3 h-3" />
                      <span>{record.time}</span>
                      {record.method && (
                        <>
                          <span>·</span>
                          <span>{methodLabels[record.method].label}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <div className="text-sm font-bold">₩{record.copay.toLocaleString()}</div>
                    {record.status === 'partial' && (
                      <div className="text-2xs text-red-500">잔액: ₩{remaining.toLocaleString()}</div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    {(record.status === 'unpaid' || record.status === 'partial') && (
                      <button
                        className="btn-sm text-2xs bg-blue-600 text-white hover:bg-blue-700"
                        onClick={() => setShowPayModal(record.id)}
                      >
                        <Wallet className="w-3 h-3" /> 수납
                      </button>
                    )}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 bg-secondary/10">
                    <div className="card p-4">
                      <h4 className="text-xs font-semibold text-muted-foreground mb-3">진료 항목</h4>
                      <div className="space-y-2">
                        {record.items.map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/40">
                            <span className="text-sm">{item.name}</span>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-muted-foreground">₩{item.amount.toLocaleString()}</span>
                              <span className="text-blue-600">-₩{item.insurance.toLocaleString()}</span>
                              <span className="font-semibold">₩{item.copay.toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-border grid grid-cols-4 gap-4 text-sm">
                        <div><span className="text-2xs text-muted-foreground">총 진료비</span><div className="font-medium">₩{record.totalAmount.toLocaleString()}</div></div>
                        <div><span className="text-2xs text-muted-foreground">보험부담</span><div className="font-medium text-blue-600">₩{record.insuranceAmount.toLocaleString()}</div></div>
                        <div><span className="text-2xs text-muted-foreground">본인부담</span><div className="font-bold">₩{record.copay.toLocaleString()}</div></div>
                        <div><span className="text-2xs text-muted-foreground">수납액</span><div className={`font-bold ${record.paidAmount < record.copay ? 'text-red-600' : 'text-emerald-600'}`}>₩{record.paidAmount.toLocaleString()}</div></div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        {(record.status === 'unpaid' || record.status === 'partial') && (
                          <button className="btn-sm text-xs bg-blue-600 text-white" onClick={() => setShowPayModal(record.id)}>
                            <Wallet className="w-3 h-3" /> 수납 처리
                          </button>
                        )}
                        <button className="btn-sm text-xs bg-secondary text-foreground">
                          <Printer className="w-3 h-3" /> 영수증
                        </button>
                        <button className="btn-sm text-xs bg-secondary text-foreground">
                          <Send className="w-3 h-3" /> 카카오 전송
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Receipt className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">해당 조건의 수납 내역이 없습니다</p>
          </div>
        )}
      </div>

      {/* 수납 모달 */}
      {showPayModal && (() => {
        const record = billingRecords.find(r => r.id === showPayModal)
        if (!record) return null
        const remaining = record.copay - record.paidAmount
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowPayModal(null)}>
            <div className="bg-card rounded-2xl shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-bold text-lg">수납 처리</h3>
                <button onClick={() => setShowPayModal(null)} className="btn-icon"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{record.patient.name}</div>
                    <div className="text-2xs text-muted-foreground">{record.patient.chartNo}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-secondary/50 text-center">
                    <div className="text-2xs text-muted-foreground">본인부담금</div>
                    <div className="text-lg font-bold mt-0.5">₩{record.copay.toLocaleString()}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-center">
                    <div className="text-2xs text-red-600">미수납액</div>
                    <div className="text-lg font-bold text-red-600 mt-0.5">₩{remaining.toLocaleString()}</div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">결제 수단</label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {(['card', 'cash', 'transfer'] as PaymentMethod[]).map(method => {
                      const ml = methodLabels[method]
                      const Icon = ml.icon
                      return (
                        <button
                          key={method}
                          onClick={() => setPayMethod(method)}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                            payMethod === method ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-border'
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${payMethod === method ? 'text-blue-600' : 'text-muted-foreground'}`} />
                          <span className={`text-xs font-medium ${payMethod === method ? 'text-blue-600' : ''}`}>{ml.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">수납 금액</label>
                  <input type="text" defaultValue={remaining.toLocaleString()} className="input mt-1 text-lg font-bold text-right" />
                </div>

                <div className="flex gap-2 pt-2">
                  <button className="flex-1 py-3 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> 수납 완료
                  </button>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded" />
                    영수증 자동 발행
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    카카오톡 영수증 전송
                  </label>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
