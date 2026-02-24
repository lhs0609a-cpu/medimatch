'use client'

import { useState, useMemo } from 'react'
import {
  FileText,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Pill,
  User,
  Building2,
  Phone,
  Printer,
  Send,
  RefreshCw,
  ArrowRight,
  Package,
  ShieldAlert,
  Info,
  X,
  Bell,
  Zap,
  Timer,
  Stethoscope,
  ChevronRight,
  MoreVertical,
  Play,
  Pause,
  Check,
  XCircle,
  MessageSquare,
} from 'lucide-react'

/* ─── 타입 ─── */
type PrescriptionStatus = 'pending' | 'accepted' | 'dispensing' | 'dur_check' | 'completed' | 'rejected' | 'picked_up'
type DURSeverity = 'critical' | 'warning' | 'info'

interface Drug {
  name: string
  dose: string
  frequency: string
  days: number
  quantity: number
  durAlert?: { type: string; severity: DURSeverity; message: string }
}

interface Prescription {
  id: string
  receivedAt: string
  patient: { name: string; age: number; gender: string; phone: string; allergies: string[] }
  clinic: { name: string; doctor: string }
  status: PrescriptionStatus
  drugs: Drug[]
  totalAmount: number
  insuranceAmount: number
  copay: number
  urgent: boolean
  note?: string
  dispensedAt?: string
  pickedUpAt?: string
}

/* ─── 더미 처방전 데이터 ─── */
const prescriptionsData: Prescription[] = [
  {
    id: 'RX-2024-1847',
    receivedAt: '14:05',
    patient: { name: '김영수', age: 45, gender: '남', phone: '010-1234-5678', allergies: ['페니실린'] },
    clinic: { name: '메디매치내과', doctor: '김원장' },
    status: 'pending',
    drugs: [
      { name: '아목시실린캡슐 500mg', dose: '500mg', frequency: '1일 3회', days: 5, quantity: 15 },
      { name: '이부프로펜정 200mg', dose: '200mg', frequency: '1일 3회 식후', days: 5, quantity: 15, durAlert: { type: '병용주의', severity: 'warning', message: '아스피린과 병용 시 위장관 출혈 위험 증가' } },
    ],
    totalAmount: 12500,
    insuranceAmount: 8750,
    copay: 3750,
    urgent: false,
  },
  {
    id: 'RX-2024-1846',
    receivedAt: '13:58',
    patient: { name: '이미경', age: 33, gender: '여', phone: '010-2345-6789', allergies: [] },
    clinic: { name: '메디매치내과', doctor: '김원장' },
    status: 'dispensing',
    drugs: [
      { name: '레보세티리진정 5mg', dose: '5mg', frequency: '1일 1회 취침전', days: 7, quantity: 7 },
      { name: '슈도에페드린정 60mg', dose: '60mg', frequency: '1일 2회', days: 5, quantity: 10 },
      { name: '아세트아미노펜정 500mg', dose: '500mg', frequency: '1일 3회 식후', days: 3, quantity: 9 },
      { name: '덱스트로메토르판시럽', dose: '15ml', frequency: '1일 3회', days: 5, quantity: 1 },
    ],
    totalAmount: 18200,
    insuranceAmount: 12740,
    copay: 5460,
    urgent: false,
  },
  {
    id: 'RX-2024-1845',
    receivedAt: '13:45',
    patient: { name: '박준호', age: 28, gender: '남', phone: '010-3456-7890', allergies: ['설파제'] },
    clinic: { name: '하나이비인후과', doctor: '이원장' },
    status: 'dur_check',
    drugs: [
      { name: '아지스로마이신정 250mg', dose: '250mg', frequency: '1일 1회', days: 3, quantity: 3 },
      { name: '몬테루카스트정 10mg', dose: '10mg', frequency: '1일 1회 취침전', days: 7, quantity: 7 },
      { name: '플루티카손비강스프레이', dose: '2회 분무', frequency: '1일 2회', days: 14, quantity: 1, durAlert: { type: '연령주의', severity: 'info', message: '12세 미만 용량 확인 필요 (해당없음)' } },
    ],
    totalAmount: 22800,
    insuranceAmount: 15960,
    copay: 6840,
    urgent: false,
    note: '축농증 의심, 항생제 감수성 확인 필요',
  },
  {
    id: 'RX-2024-1844',
    receivedAt: '13:32',
    patient: { name: '최은지', age: 52, gender: '여', phone: '010-4567-8901', allergies: [] },
    clinic: { name: '메디매치내과', doctor: '김원장' },
    status: 'completed',
    drugs: [
      { name: '메트포르민정 500mg', dose: '500mg', frequency: '1일 2회 식후', days: 30, quantity: 60 },
      { name: '암로디핀정 5mg', dose: '5mg', frequency: '1일 1회', days: 30, quantity: 30 },
      { name: '아토르바스타틴정 20mg', dose: '20mg', frequency: '1일 1회 취침전', days: 30, quantity: 30 },
      { name: '오메프라졸캡슐 20mg', dose: '20mg', frequency: '1일 1회 식전', days: 14, quantity: 14 },
      { name: '비타민D 1000IU', dose: '1000IU', frequency: '1일 1회', days: 30, quantity: 30, durAlert: { type: '중복투여', severity: 'warning', message: '타 약국에서 동일 성분 조제 이력 확인' } },
    ],
    totalAmount: 45600,
    insuranceAmount: 31920,
    copay: 13680,
    urgent: false,
    dispensedAt: '13:48',
  },
  {
    id: 'RX-2024-1843',
    receivedAt: '13:20',
    patient: { name: '정대현', age: 67, gender: '남', phone: '010-5678-9012', allergies: ['아스피린'] },
    clinic: { name: '강남정형외과', doctor: '박원장' },
    status: 'picked_up',
    drugs: [
      { name: '셀레콕시브캡슐 200mg', dose: '200mg', frequency: '1일 2회 식후', days: 7, quantity: 14 },
      { name: '에페리손정 50mg', dose: '50mg', frequency: '1일 3회 식후', days: 7, quantity: 21 },
      { name: '레바미피드정 100mg', dose: '100mg', frequency: '1일 3회 식후', days: 7, quantity: 21 },
    ],
    totalAmount: 19800,
    insuranceAmount: 13860,
    copay: 5940,
    urgent: false,
    dispensedAt: '13:35',
    pickedUpAt: '13:52',
  },
  {
    id: 'RX-2024-1842',
    receivedAt: '13:10',
    patient: { name: '한소영', age: 41, gender: '여', phone: '010-6789-0123', allergies: [] },
    clinic: { name: '메디매치내과', doctor: '김원장' },
    status: 'completed',
    drugs: [
      { name: '타이레놀정 500mg', dose: '500mg', frequency: '1일 3회 식후', days: 3, quantity: 9 },
      { name: '슈다페드정', dose: '60mg', frequency: '1일 2회', days: 3, quantity: 6 },
    ],
    totalAmount: 8400,
    insuranceAmount: 5880,
    copay: 2520,
    urgent: false,
    dispensedAt: '13:22',
  },
  {
    id: 'RX-2024-1841',
    receivedAt: '12:55',
    patient: { name: '오민수', age: 8, gender: '남', phone: '010-7890-1234', allergies: [] },
    clinic: { name: '하나이비인후과', doctor: '이원장' },
    status: 'picked_up',
    drugs: [
      { name: '아목시실린시럽 250mg/5ml', dose: '5ml', frequency: '1일 3회 식후', days: 5, quantity: 1, durAlert: { type: '연령주의', severity: 'info', message: '소아 용량 적정 (체중 25kg 기준)' } },
      { name: '이부프로펜시럽 100mg/5ml', dose: '5ml', frequency: '발열 시', days: 3, quantity: 1 },
    ],
    totalAmount: 9200,
    insuranceAmount: 6440,
    copay: 2760,
    urgent: false,
    dispensedAt: '13:05',
    pickedUpAt: '13:15',
  },
  {
    id: 'RX-2024-1840',
    receivedAt: '12:40',
    patient: { name: '강지원', age: 72, gender: '여', phone: '010-8901-2345', allergies: ['세팔로스포린'] },
    clinic: { name: '메디매치내과', doctor: '김원장' },
    status: 'rejected',
    drugs: [
      { name: '세프디니르캡슐 100mg', dose: '100mg', frequency: '1일 3회', days: 7, quantity: 21, durAlert: { type: '알레르기', severity: 'critical', message: '세팔로스포린 알레르기 환자 - 투약 금기!' } },
      { name: '카르보시스테인정 500mg', dose: '500mg', frequency: '1일 3회', days: 7, quantity: 21 },
    ],
    totalAmount: 15600,
    insuranceAmount: 10920,
    copay: 4680,
    urgent: true,
    note: '알레르기 금기약물 포함 - 처방의에게 대체약 문의 완료',
  },
]

/* ─── 상태 관련 유틸 ─── */
const statusConfig: Record<PrescriptionStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending: { label: '대기', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', icon: Clock },
  accepted: { label: '접수', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: CheckCircle2 },
  dispensing: { label: '조제중', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', icon: Pill },
  dur_check: { label: 'DUR확인', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', icon: ShieldAlert },
  completed: { label: '조제완료', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: CheckCircle2 },
  rejected: { label: '반려', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', icon: XCircle },
  picked_up: { label: '수령완료', color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-900/20', icon: Check },
}

const durSeverityConfig: Record<DURSeverity, { color: string; bg: string; icon: React.ElementType }> = {
  critical: { color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/30', icon: AlertCircle },
  warning: { color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30', icon: AlertTriangle },
  info: { color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30', icon: Info },
}

/* ─── 필터 탭 ─── */
const filterTabs: { key: string; label: string; statuses: PrescriptionStatus[] }[] = [
  { key: 'all', label: '전체', statuses: [] },
  { key: 'active', label: '진행중', statuses: ['pending', 'accepted', 'dispensing', 'dur_check'] },
  { key: 'pending', label: '대기', statuses: ['pending'] },
  { key: 'dispensing', label: '조제중', statuses: ['dispensing'] },
  { key: 'dur_check', label: 'DUR확인', statuses: ['dur_check'] },
  { key: 'completed', label: '완료', statuses: ['completed', 'picked_up'] },
  { key: 'rejected', label: '반려', statuses: ['rejected'] },
]

export default function PrescriptionsPage() {
  const [activeFilter, setActiveFilter] = useState('active')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showMedicationGuide, setShowMedicationGuide] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const tab = filterTabs.find(t => t.key === activeFilter)
    let list = prescriptionsData
    if (tab && tab.statuses.length > 0) {
      list = list.filter(p => tab.statuses.includes(p.status))
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(p =>
        p.patient.name.includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.clinic.name.includes(q) ||
        p.drugs.some(d => d.name.toLowerCase().includes(q))
      )
    }
    return list
  }, [activeFilter, searchQuery])

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    filterTabs.forEach(tab => {
      if (tab.statuses.length === 0) {
        c[tab.key] = prescriptionsData.length
      } else {
        c[tab.key] = prescriptionsData.filter(p => tab.statuses.includes(p.status)).length
      }
    })
    return c
  }, [])

  const totalDurAlerts = prescriptionsData.reduce((acc, p) => acc + p.drugs.filter(d => d.durAlert).length, 0)

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(p => p.id)))
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">처방전 수신/조제</h1>
          <p className="text-sm text-muted-foreground mt-1">실시간 처방전 수신 및 조제 관리</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 text-sm font-medium">
            <Zap className="w-4 h-4" />
            실시간 수신 활성
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          </div>
          <button className="btn-icon">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">대기 처방전</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600">{counts.pending}</div>
          <div className="text-2xs text-muted-foreground mt-1">즉시 처리 필요</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">조제 진행중</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Pill className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-600">{counts.dispensing}</div>
          <div className="text-2xs text-muted-foreground mt-1">평균 4.2분 소요</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">DUR 알림</span>
            <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-orange-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-orange-600">{totalDurAlerts}</div>
          <div className="text-2xs text-muted-foreground mt-1">확인 필요</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">오늘 완료</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600">{counts.completed}</div>
          <div className="text-2xs text-muted-foreground mt-1">수령 대기 포함</div>
        </div>
      </div>

      {/* 필터 + 검색 */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-border">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeFilter === tab.key
                    ? 'bg-purple-500 text-white'
                    : 'text-muted-foreground hover:bg-secondary'
                }`}
              >
                {tab.label}
                <span className={`text-2xs px-1.5 py-0.5 rounded-full ${
                  activeFilter === tab.key ? 'bg-white/20' : 'bg-secondary'
                }`}>
                  {counts[tab.key]}
                </span>
              </button>
            ))}
          </div>
          <div className="sm:ml-auto flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="환자명, 처방번호, 의약품..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input pl-9 py-2 text-sm w-full"
              />
            </div>
          </div>
        </div>

        {/* 일괄 작업 바 */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-purple-50 dark:bg-purple-900/20 border-b border-border">
            <span className="text-sm font-medium text-purple-600">{selectedIds.size}건 선택됨</span>
            <div className="flex items-center gap-2 ml-auto">
              <button className="btn-sm text-xs" style={{ backgroundColor: 'rgb(168 85 247)', color: 'white' }}>
                <Play className="w-3 h-3" /> 일괄 접수
              </button>
              <button className="btn-sm text-xs bg-emerald-500 text-white hover:bg-emerald-600">
                <CheckCircle2 className="w-3 h-3" /> 일괄 조제완료
              </button>
              <button className="btn-sm text-xs bg-secondary text-foreground hover:bg-secondary/80" onClick={() => setSelectedIds(new Set())}>
                선택 해제
              </button>
            </div>
          </div>
        )}

        {/* 처방전 목록 */}
        <div className="divide-y divide-border">
          {/* 헤더 (데스크톱) */}
          <div className="hidden lg:grid grid-cols-[40px_1fr_140px_100px_100px_100px_120px_60px] items-center px-4 py-2.5 text-xs font-medium text-muted-foreground bg-secondary/30">
            <div>
              <input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} className="rounded" />
            </div>
            <div>처방전 정보</div>
            <div>의약품</div>
            <div>수신시간</div>
            <div>본인부담</div>
            <div>상태</div>
            <div>액션</div>
            <div />
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FileText className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">해당 조건의 처방전이 없습니다</p>
            </div>
          ) : (
            filtered.map(rx => {
              const sc = statusConfig[rx.status]
              const StatusIcon = sc.icon
              const isExpanded = expandedId === rx.id
              const hasDUR = rx.drugs.some(d => d.durAlert)
              const hasCriticalDUR = rx.drugs.some(d => d.durAlert?.severity === 'critical')

              return (
                <div key={rx.id} className={`${hasCriticalDUR ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                  {/* 메인 행 */}
                  <div
                    className="grid grid-cols-1 lg:grid-cols-[40px_1fr_140px_100px_100px_100px_120px_60px] items-center px-4 py-3 gap-2 lg:gap-0 cursor-pointer hover:bg-secondary/30 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : rx.id)}
                  >
                    {/* 체크박스 */}
                    <div className="hidden lg:block" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedIds.has(rx.id)} onChange={() => toggleSelect(rx.id)} className="rounded" />
                    </div>

                    {/* 처방전 정보 */}
                    <div className="flex items-center gap-3">
                      <div className="flex lg:hidden">
                        <input type="checkbox" checked={selectedIds.has(rx.id)} onChange={() => toggleSelect(rx.id)} className="rounded mr-3" onClick={e => e.stopPropagation()} />
                      </div>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${rx.urgent ? 'bg-red-100 dark:bg-red-900/30' : 'bg-purple-100 dark:bg-purple-900/30'}`}>
                        <FileText className={`w-5 h-5 ${rx.urgent ? 'text-red-600' : 'text-purple-600'}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{rx.patient.name}</span>
                          <span className="text-2xs text-muted-foreground">{rx.patient.gender}/{rx.patient.age}세</span>
                          {rx.urgent && <span className="px-1.5 py-0.5 rounded text-2xs font-bold bg-red-100 text-red-600 dark:bg-red-900/30">긴급</span>}
                          {hasDUR && (
                            <span className={`px-1.5 py-0.5 rounded text-2xs font-bold ${hasCriticalDUR ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30'}`}>
                              DUR
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-2xs text-muted-foreground mt-0.5">
                          <span>{rx.id}</span>
                          <span>·</span>
                          <Building2 className="w-3 h-3" />
                          <span>{rx.clinic.name} {rx.clinic.doctor}</span>
                        </div>
                      </div>
                    </div>

                    {/* 의약품 */}
                    <div className="hidden lg:block">
                      <span className="text-sm font-medium">{rx.drugs.length}종</span>
                      <div className="text-2xs text-muted-foreground truncate max-w-[130px]">{rx.drugs[0].name}</div>
                    </div>

                    {/* 수신시간 */}
                    <div className="hidden lg:block">
                      <span className="text-sm">{rx.receivedAt}</span>
                      {rx.status === 'pending' && (
                        <div className="flex items-center gap-1 text-2xs text-amber-600 mt-0.5">
                          <Timer className="w-3 h-3" />
                          대기중
                        </div>
                      )}
                    </div>

                    {/* 본인부담 */}
                    <div className="hidden lg:block">
                      <span className="text-sm font-medium">₩{rx.copay.toLocaleString()}</span>
                    </div>

                    {/* 상태 */}
                    <div>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${sc.color} ${sc.bg}`}>
                        <StatusIcon className="w-3 h-3" />
                        {sc.label}
                      </span>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="hidden lg:flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      {rx.status === 'pending' && (
                        <button className="btn-sm text-2xs px-2 py-1" style={{ backgroundColor: 'rgb(168 85 247)', color: 'white' }}>
                          접수
                        </button>
                      )}
                      {rx.status === 'accepted' && (
                        <button className="btn-sm text-2xs px-2 py-1 bg-purple-500 text-white">
                          조제시작
                        </button>
                      )}
                      {rx.status === 'dispensing' && (
                        <button className="btn-sm text-2xs px-2 py-1 bg-emerald-500 text-white">
                          조제완료
                        </button>
                      )}
                      {rx.status === 'dur_check' && (
                        <button className="btn-sm text-2xs px-2 py-1 bg-orange-500 text-white">
                          DUR확인
                        </button>
                      )}
                      {rx.status === 'completed' && (
                        <button className="btn-sm text-2xs px-2 py-1 bg-secondary text-foreground">
                          수령처리
                        </button>
                      )}
                    </div>

                    {/* 확장 아이콘 */}
                    <div className="hidden lg:flex justify-center">
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {/* 모바일 하단 정보 */}
                  <div className="flex lg:hidden items-center justify-between px-4 pb-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span>{rx.receivedAt} 수신</span>
                      <span>{rx.drugs.length}종 약품</span>
                      <span>₩{rx.copay.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {rx.status === 'pending' && (
                        <button className="btn-sm text-2xs px-2 py-1" style={{ backgroundColor: 'rgb(168 85 247)', color: 'white' }} onClick={e => e.stopPropagation()}>
                          접수
                        </button>
                      )}
                      {rx.status === 'dispensing' && (
                        <button className="btn-sm text-2xs px-2 py-1 bg-emerald-500 text-white" onClick={e => e.stopPropagation()}>
                          조제완료
                        </button>
                      )}
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {/* 확장 상세 */}
                  {isExpanded && (
                    <div className="px-4 pb-4 bg-secondary/20">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* 환자 정보 */}
                        <div className="card p-4">
                          <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" /> 환자 정보
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">이름</span>
                              <span className="font-medium">{rx.patient.name} ({rx.patient.gender}/{rx.patient.age}세)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">연락처</span>
                              <span className="font-medium">{rx.patient.phone}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">알레르기</span>
                              <span className="font-medium">
                                {rx.patient.allergies.length > 0 ? (
                                  rx.patient.allergies.map(a => (
                                    <span key={a} className="px-1.5 py-0.5 rounded bg-red-50 text-red-600 text-2xs font-semibold dark:bg-red-900/30 ml-1">{a}</span>
                                  ))
                                ) : (
                                  <span className="text-muted-foreground">없음</span>
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">처방의</span>
                              <span className="font-medium">{rx.clinic.name} · {rx.clinic.doctor}</span>
                            </div>
                          </div>
                          {rx.note && (
                            <div className="mt-3 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-700 dark:text-amber-400">
                              <strong>메모:</strong> {rx.note}
                            </div>
                          )}
                        </div>

                        {/* 처방 약품 목록 */}
                        <div className="card p-4 lg:col-span-2">
                          <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                            <Pill className="w-3.5 h-3.5" /> 처방 약품 ({rx.drugs.length}종)
                          </h4>
                          <div className="space-y-2">
                            {rx.drugs.map((drug, di) => (
                              <div key={di} className={`p-3 rounded-xl border ${drug.durAlert ? (drug.durAlert.severity === 'critical' ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10' : drug.durAlert.severity === 'warning' ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10' : 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/10') : 'border-border'}`}>
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <div className="text-sm font-medium">{drug.name}</div>
                                    <div className="text-2xs text-muted-foreground mt-0.5">
                                      {drug.dose} · {drug.frequency} · {drug.days}일 · {drug.quantity}{typeof drug.quantity === 'number' && drug.quantity > 1 ? '정' : '개'}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <Package className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">재고: 충분</span>
                                  </div>
                                </div>
                                {drug.durAlert && (
                                  <div className={`flex items-start gap-2 mt-2 p-2 rounded-lg ${durSeverityConfig[drug.durAlert.severity].bg}`}>
                                    {(() => { const DURIcon = durSeverityConfig[drug.durAlert.severity].icon; return <DURIcon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${durSeverityConfig[drug.durAlert.severity].color}`} /> })()}
                                    <div>
                                      <span className={`text-2xs font-bold ${durSeverityConfig[drug.durAlert.severity].color}`}>[{drug.durAlert.type}]</span>
                                      <span className="text-2xs text-foreground ml-1">{drug.durAlert.message}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* 금액 요약 */}
                          <div className="mt-4 pt-3 border-t border-border">
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-2xs text-muted-foreground">총 조제료</span>
                                <div className="font-semibold">₩{rx.totalAmount.toLocaleString()}</div>
                              </div>
                              <div>
                                <span className="text-2xs text-muted-foreground">보험부담</span>
                                <div className="font-semibold text-blue-600">₩{rx.insuranceAmount.toLocaleString()}</div>
                              </div>
                              <div>
                                <span className="text-2xs text-muted-foreground">본인부담</span>
                                <div className="font-bold text-foreground">₩{rx.copay.toLocaleString()}</div>
                              </div>
                            </div>
                          </div>

                          {/* 액션 버튼 */}
                          <div className="flex flex-wrap items-center gap-2 mt-4">
                            {rx.status === 'pending' && (
                              <>
                                <button className="btn-sm text-xs" style={{ backgroundColor: 'rgb(168 85 247)', color: 'white' }}>
                                  <Play className="w-3 h-3" /> 접수 및 조제 시작
                                </button>
                                <button className="btn-sm text-xs bg-red-500 text-white hover:bg-red-600">
                                  <XCircle className="w-3 h-3" /> 반려
                                </button>
                              </>
                            )}
                            {rx.status === 'dispensing' && (
                              <button className="btn-sm text-xs bg-emerald-500 text-white hover:bg-emerald-600">
                                <CheckCircle2 className="w-3 h-3" /> 조제 완료
                              </button>
                            )}
                            {rx.status === 'dur_check' && (
                              <>
                                <button className="btn-sm text-xs bg-orange-500 text-white hover:bg-orange-600">
                                  <ShieldAlert className="w-3 h-3" /> DUR 확인 완료
                                </button>
                                <button className="btn-sm text-xs bg-secondary text-foreground">
                                  <Phone className="w-3 h-3" /> 처방의 연락
                                </button>
                              </>
                            )}
                            {(rx.status === 'completed' || rx.status === 'picked_up') && (
                              <button className="btn-sm text-xs bg-secondary text-foreground" onClick={() => setShowMedicationGuide(rx.id)}>
                                <MessageSquare className="w-3 h-3" /> 복약지도 출력
                              </button>
                            )}
                            <button className="btn-sm text-xs bg-secondary text-foreground">
                              <Printer className="w-3 h-3" /> 라벨 출력
                            </button>
                            <button className="btn-sm text-xs bg-secondary text-foreground">
                              <Phone className="w-3 h-3" /> 환자 알림
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 타임라인 */}
                      {(rx.dispensedAt || rx.pickedUpAt) && (
                        <div className="mt-4 flex items-center gap-6 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-purple-500" />
                            수신: {rx.receivedAt}
                          </div>
                          {rx.dispensedAt && (
                            <>
                              <ArrowRight className="w-3 h-3" />
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                조제완료: {rx.dispensedAt}
                              </div>
                            </>
                          )}
                          {rx.pickedUpAt && (
                            <>
                              <ArrowRight className="w-3 h-3" />
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-gray-400" />
                                수령: {rx.pickedUpAt}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* 복약지도 모달 */}
      {showMedicationGuide && (() => {
        const rx = prescriptionsData.find(p => p.id === showMedicationGuide)
        if (!rx) return null
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowMedicationGuide(null)}>
            <div className="bg-card rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-bold text-lg">복약지도서</h3>
                <button onClick={() => setShowMedicationGuide(null)} className="btn-icon">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="text-center mb-4">
                  <div className="text-sm text-muted-foreground">메디매치 온누리약국</div>
                  <h4 className="text-lg font-bold mt-1">{rx.patient.name}님 복약안내</h4>
                  <div className="text-xs text-muted-foreground mt-1">{rx.receivedAt} · {rx.clinic.name} {rx.clinic.doctor}</div>
                </div>

                <div className="space-y-3">
                  {rx.drugs.map((drug, i) => (
                    <div key={i} className="p-3 rounded-xl bg-secondary/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Pill className="w-4 h-4 text-purple-500" />
                        <span className="font-semibold text-sm">{drug.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground ml-6 space-y-0.5">
                        <div>복용량: {drug.dose}</div>
                        <div>복용법: {drug.frequency}</div>
                        <div>복용기간: {drug.days}일</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-700 dark:text-amber-400">
                  <strong>주의사항:</strong> 처방된 약은 정해진 용법·용량을 지켜 복용하시고, 이상반응 발생 시 즉시 약사 또는 의사와 상담하세요.
                </div>

                <div className="flex gap-2">
                  <button className="btn-sm text-xs flex-1" style={{ backgroundColor: 'rgb(168 85 247)', color: 'white' }}>
                    <Printer className="w-3 h-3" /> 인쇄
                  </button>
                  <button className="btn-sm text-xs flex-1 bg-secondary text-foreground">
                    <Send className="w-3 h-3" /> 카카오톡 전송
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
