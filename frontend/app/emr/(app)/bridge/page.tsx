'use client'

import { useState } from 'react'
import {
  Zap,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Package,
  Pill,
  MessageSquare,
  Phone,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  RefreshCw,
  ArrowRight,
  ArrowLeftRight,
  Building2,
  User,
  FileText,
  X,
  Star,
  Shield,
  Bell,
  Eye,
  Plus,
} from 'lucide-react'

/* ─── 타입 ─── */
type PrescriptionStatus = 'sent' | 'received' | 'dispensing' | 'dur_check' | 'completed' | 'picked_up' | 'issue'

interface BridgePrescription {
  id: string
  patientName: string
  patientAge: number
  chartNo: string
  pharmacyName: string
  sentTime: string
  status: PrescriptionStatus
  drugs: { name: string; dosage: string; days: number }[]
  estimatedTime?: string
  durAlert?: string
}

interface ChatMessage {
  id: string
  pharmacyName: string
  pharmacyId: string
  sender: 'clinic' | 'pharmacy' | 'system'
  message: string
  time: string
  type: 'text' | 'dur_alert' | 'stock_alert' | 'prescription_edit' | 'system'
  read: boolean
  relatedRx?: string
}

/* ─── 더미 데이터 ─── */
const prescriptions: BridgePrescription[] = [
  {
    id: 'RX-2024-1847', patientName: '김영수', patientAge: 45, chartNo: 'C-0892',
    pharmacyName: '메디매치 온누리약국', sentTime: '09:15',
    status: 'picked_up',
    drugs: [
      { name: '아모디핀정 5mg', dosage: '1일 1회', days: 28 },
      { name: '로수바스타틴정 10mg', dosage: '1일 1회', days: 28 },
    ],
  },
  {
    id: 'RX-2024-1848', patientName: '이미경', patientAge: 38, chartNo: 'C-1204',
    pharmacyName: '메디매치 온누리약국', sentTime: '09:42',
    status: 'completed', estimatedTime: '수령 대기',
    drugs: [
      { name: '레보티록신정 50mcg', dosage: '1일 1회', days: 30 },
    ],
  },
  {
    id: 'RX-2024-1849', patientName: '박준호', patientAge: 52, chartNo: 'C-0341',
    pharmacyName: '메디매치 온누리약국', sentTime: '10:08',
    status: 'dispensing', estimatedTime: '약 5분',
    drugs: [
      { name: '메트포르민정 850mg', dosage: '1일 2회', days: 28 },
      { name: '아모디핀정 5mg', dosage: '1일 1회', days: 28 },
    ],
  },
  {
    id: 'RX-2024-1850', patientName: '강지원', patientAge: 29, chartNo: 'C-1567',
    pharmacyName: '건강한약국', sentTime: '10:25',
    status: 'dur_check',
    durAlert: '세팔로스포린 알레르기 금기 — 약국에서 대체약 문의 중',
    drugs: [
      { name: '세파클러캡슐 250mg', dosage: '1일 3회', days: 7 },
      { name: '이부프로펜정 200mg', dosage: '1일 3회 식후', days: 5 },
    ],
  },
  {
    id: 'RX-2024-1851', patientName: '정대현', patientAge: 61, chartNo: 'C-0128',
    pharmacyName: '메디매치 온누리약국', sentTime: '10:35',
    status: 'received',
    drugs: [
      { name: '트라마돌서방정 100mg', dosage: '1일 2회', days: 7 },
      { name: '아세트아미노펜정 500mg', dosage: '1일 3회 식후', days: 7 },
      { name: '에소메프라졸캡슐 20mg', dosage: '1일 1회 식전', days: 14 },
    ],
  },
  {
    id: 'RX-2024-1852', patientName: '최은지', patientAge: 34, chartNo: 'C-1891',
    pharmacyName: '건강한약국', sentTime: '10:50',
    status: 'sent',
    drugs: [
      { name: '세티리진정 10mg', dosage: '1일 1회', days: 7 },
      { name: '프레드니솔론정 5mg', dosage: '1일 2회 식후', days: 5 },
    ],
  },
]

const chatConversations: ChatMessage[] = [
  {
    id: 'M001', pharmacyName: '건강한약국', pharmacyId: 'PH002', sender: 'pharmacy',
    message: 'RX-2024-1850 강지원 환자 — 세팔로스포린 알레르기 기록 확인됩니다. 대체약으로 아목시실린 추천드립니다.',
    time: '10:28', type: 'dur_alert', read: false, relatedRx: 'RX-2024-1850',
  },
  {
    id: 'M002', pharmacyName: '건강한약국', pharmacyId: 'PH002', sender: 'pharmacy',
    message: '처방 수정 부탁드립니다.',
    time: '10:29', type: 'text', read: false, relatedRx: 'RX-2024-1850',
  },
  {
    id: 'M003', pharmacyName: '메디매치 온누리약국', pharmacyId: 'PH001', sender: 'pharmacy',
    message: 'RX-2024-1849 박준호 환자 조제 중입니다. 약 5분 소요 예정.',
    time: '10:12', type: 'text', read: true, relatedRx: 'RX-2024-1849',
  },
  {
    id: 'M004', pharmacyName: '메디매치 온누리약국', pharmacyId: 'PH001', sender: 'pharmacy',
    message: '이부프로펜정 200mg 재고가 부족합니다. 록소프로펜으로 대체 가능할까요?',
    time: '09:55', type: 'stock_alert', read: true,
  },
  {
    id: 'M005', pharmacyName: '메디매치 온누리약국', pharmacyId: 'PH001', sender: 'clinic',
    message: '네, 록소프로펜 60mg 1일 3회로 대체해주세요.',
    time: '09:58', type: 'text', read: true,
  },
  {
    id: 'M006', pharmacyName: '메디매치 온누리약국', pharmacyId: 'PH001', sender: 'system',
    message: 'RX-2024-1847 김영수 환자 — 수령 완료',
    time: '09:45', type: 'system', read: true, relatedRx: 'RX-2024-1847',
  },
]

const linkedPharmacies = [
  { id: 'PH001', name: '메디매치 온누리약국', distance: '50m', status: 'online' as const, todayRx: 12, avgTime: '8분' },
  { id: 'PH002', name: '건강한약국', distance: '120m', status: 'online' as const, todayRx: 3, avgTime: '12분' },
  { id: 'PH003', name: '세종약국', distance: '300m', status: 'offline' as const, todayRx: 0, avgTime: '-' },
]

const statusSteps: { key: PrescriptionStatus; label: string }[] = [
  { key: 'sent', label: '전송' },
  { key: 'received', label: '접수' },
  { key: 'dispensing', label: '조제 중' },
  { key: 'completed', label: '조제 완료' },
  { key: 'picked_up', label: '수령' },
]

const statusOrder: PrescriptionStatus[] = ['sent', 'received', 'dispensing', 'dur_check', 'completed', 'picked_up']

function getStepIndex(status: PrescriptionStatus): number {
  if (status === 'dur_check' || status === 'issue') return 2
  return statusOrder.indexOf(status)
}

export default function BridgePage() {
  const [activeTab, setActiveTab] = useState<'tracking' | 'chat'>('tracking')
  const [selectedRx, setSelectedRx] = useState<string | null>(null)
  const [selectedPharmacy, setSelectedPharmacy] = useState<string>('all')
  const [chatInput, setChatInput] = useState('')
  const [chatPharmacy, setChatPharmacy] = useState('PH002')

  const filteredRx = selectedPharmacy === 'all'
    ? prescriptions
    : prescriptions.filter(rx => rx.pharmacyName === linkedPharmacies.find(p => p.id === selectedPharmacy)?.name)

  const unreadMessages = chatConversations.filter(m => !m.read).length
  const activeIssues = prescriptions.filter(rx => rx.status === 'dur_check' || rx.status === 'issue').length

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <ArrowLeftRight className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">의원↔약국 브릿지</h1>
            <p className="text-sm text-muted-foreground">실시간 처방 추적 · 의약 커뮤니케이션</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeIssues > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 text-xs font-semibold">
              <AlertCircle className="w-3.5 h-3.5" /> 확인 필요 {activeIssues}건
            </div>
          )}
          <button className="btn-sm text-xs bg-secondary text-foreground">
            <RefreshCw className="w-3.5 h-3.5" /> 새로고침
          </button>
        </div>
      </div>

      {/* 연동 약국 현황 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {linkedPharmacies.map(ph => (
          <div key={ph.id} className="card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              ph.status === 'online' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-gray-100 dark:bg-gray-800'
            }`}>
              <Building2 className={`w-5 h-5 ${ph.status === 'online' ? 'text-emerald-600' : 'text-gray-400'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold truncate">{ph.name}</span>
                <span className={`w-2 h-2 rounded-full ${ph.status === 'online' ? 'bg-emerald-500' : 'bg-gray-300'}`} />
              </div>
              <div className="flex items-center gap-3 text-2xs text-muted-foreground mt-0.5">
                <span>{ph.distance}</span>
                <span>오늘 {ph.todayRx}건</span>
                <span>평균 {ph.avgTime}</span>
              </div>
            </div>
            <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        ))}
      </div>

      {/* 탭 */}
      <div className="flex items-center gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab('tracking')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'tracking' ? 'border-blue-500 text-blue-600' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Package className="w-4 h-4" /> 처방 추적
          <span className="px-1.5 py-0.5 rounded-full text-2xs bg-blue-100 text-blue-600 dark:bg-blue-900/30">{prescriptions.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'chat' ? 'border-blue-500 text-blue-600' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> 메신저
          {unreadMessages > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-2xs bg-red-500 text-white font-bold">{unreadMessages}</span>
          )}
        </button>
      </div>

      {/* ═══ 처방 추적 탭 ═══ */}
      {activeTab === 'tracking' && (
        <div className="space-y-3">
          {/* 필터 */}
          <div className="flex items-center gap-2">
            <select
              value={selectedPharmacy}
              onChange={e => setSelectedPharmacy(e.target.value)}
              className="input text-sm py-1.5 w-48"
            >
              <option value="all">전체 약국</option>
              {linkedPharmacies.map(ph => (
                <option key={ph.id} value={ph.id}>{ph.name}</option>
              ))}
            </select>
          </div>

          {/* 처방 카드 목록 */}
          <div className="space-y-3">
            {filteredRx.map(rx => {
              const stepIdx = getStepIndex(rx.status)
              const isExpanded = selectedRx === rx.id
              const hasIssue = rx.status === 'dur_check' || rx.status === 'issue'

              return (
                <div key={rx.id} className={`card overflow-hidden ${hasIssue ? 'ring-1 ring-red-300 dark:ring-red-800' : ''}`}>
                  {/* 처방 헤더 */}
                  <div
                    className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-secondary/30 transition-colors ${
                      hasIssue ? 'bg-red-50/50 dark:bg-red-900/5' : ''
                    }`}
                    onClick={() => setSelectedRx(isExpanded ? null : rx.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm">{rx.patientName}</span>
                        <span className="text-2xs text-muted-foreground">{rx.patientAge}세</span>
                        <span className="text-2xs text-muted-foreground px-1.5 py-0.5 bg-secondary rounded">{rx.id}</span>
                        {hasIssue && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-2xs font-bold text-red-600">
                            <AlertTriangle className="w-3 h-3" /> DUR 확인
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-2xs text-muted-foreground">
                        <Building2 className="w-3 h-3" />
                        <span>{rx.pharmacyName}</span>
                        <span>·</span>
                        <Clock className="w-3 h-3" />
                        <span>{rx.sentTime} 전송</span>
                        {rx.estimatedTime && (
                          <>
                            <span>·</span>
                            <span className="text-blue-600 font-medium">{rx.estimatedTime}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>

                  {/* 진행 상태 바 */}
                  <div className="px-4 pb-3">
                    <div className="flex items-center justify-between">
                      {statusSteps.map((step, i) => {
                        const isCompleted = i <= stepIdx
                        const isCurrent = i === stepIdx
                        return (
                          <div key={step.key} className="flex items-center flex-1">
                            <div className="flex flex-col items-center">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-2xs font-bold ${
                                hasIssue && isCurrent
                                  ? 'bg-red-500 text-white'
                                  : isCompleted
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                              }`}>
                                {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                              </div>
                              <span className={`text-2xs mt-1 ${isCurrent ? 'font-bold text-blue-600' : 'text-muted-foreground'}`}>
                                {hasIssue && isCurrent ? 'DUR' : step.label}
                              </span>
                            </div>
                            {i < statusSteps.length - 1 && (
                              <div className={`flex-1 h-0.5 mx-1 ${i < stepIdx ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* DUR 알림 배너 */}
                  {rx.durAlert && (
                    <div className="mx-4 mb-3 flex items-start gap-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-3">
                      <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-red-600">DUR 알림</p>
                        <p className="text-2xs text-red-600/80 mt-0.5">{rx.durAlert}</p>
                      </div>
                      <button className="px-2 py-1 rounded-lg text-2xs font-semibold text-white bg-red-500 hover:bg-red-600">처방 수정</button>
                    </div>
                  )}

                  {/* 확장 상세 */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-border pt-3">
                      <div className="text-xs font-semibold mb-2">처방 약품</div>
                      <div className="space-y-1.5">
                        {rx.drugs.map((drug, i) => (
                          <div key={i} className="flex items-center justify-between bg-secondary/30 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2">
                              <Pill className="w-3.5 h-3.5 text-purple-600" />
                              <span className="text-xs font-medium">{drug.name}</span>
                            </div>
                            <span className="text-2xs text-muted-foreground">{drug.dosage} · {drug.days}일분</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <button className="btn-sm text-xs bg-blue-600 text-white hover:bg-blue-700">
                          <MessageSquare className="w-3 h-3" /> 약국 채팅
                        </button>
                        <button className="btn-sm text-xs bg-secondary text-foreground">
                          <FileText className="w-3 h-3" /> 처방 상세
                        </button>
                        <button className="btn-sm text-xs bg-secondary text-foreground">
                          <Phone className="w-3 h-3" /> 약국 전화
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ═══ 메신저 탭 ═══ */}
      {activeTab === 'chat' && (
        <div className="flex gap-4 h-[calc(100vh-320px)] min-h-[450px]">
          {/* 약국 목록 */}
          <div className="w-64 flex-shrink-0 card flex flex-col overflow-hidden">
            <div className="p-3 border-b border-border">
              <h3 className="font-semibold text-sm">연동 약국</h3>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-border">
              {linkedPharmacies.filter(p => p.status === 'online').map(ph => {
                const phMessages = chatConversations.filter(m => m.pharmacyId === ph.id)
                const unread = phMessages.filter(m => !m.read && m.sender === 'pharmacy').length
                const lastMsg = phMessages[0]
                return (
                  <div
                    key={ph.id}
                    onClick={() => setChatPharmacy(ph.id)}
                    className={`p-3 cursor-pointer transition-colors ${
                      chatPharmacy === ph.id ? 'bg-blue-50 dark:bg-blue-900/10' : 'hover:bg-secondary/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold">{ph.name}</span>
                      {unread > 0 && (
                        <span className="w-5 h-5 rounded-full bg-red-500 text-white text-2xs font-bold flex items-center justify-center">{unread}</span>
                      )}
                    </div>
                    {lastMsg && (
                      <p className="text-2xs text-muted-foreground truncate">{lastMsg.message}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* 채팅 영역 */}
          <div className="flex-1 card flex flex-col overflow-hidden">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">
                    {linkedPharmacies.find(p => p.id === chatPharmacy)?.name}
                  </h3>
                  <div className="flex items-center gap-1 text-2xs text-emerald-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 온라인
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="btn-icon p-2"><Phone className="w-4 h-4" /></button>
                <button className="btn-icon p-2"><Bell className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatConversations
                .filter(m => m.pharmacyId === chatPharmacy)
                .reverse()
                .map(msg => (
                  <div key={msg.id}>
                    {msg.type === 'system' ? (
                      <div className="flex items-center justify-center">
                        <span className="px-3 py-1 rounded-full bg-secondary text-2xs text-muted-foreground">{msg.message}</span>
                      </div>
                    ) : (
                      <div className={`flex ${msg.sender === 'clinic' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] ${
                          msg.type === 'dur_alert' ? 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800' :
                          msg.type === 'stock_alert' ? 'bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800' :
                          msg.sender === 'clinic' ? 'bg-blue-500 text-white' : 'bg-secondary'
                        } px-3 py-2.5 rounded-2xl ${msg.sender === 'clinic' ? 'rounded-br-md' : 'rounded-bl-md'}`}>
                          {(msg.type === 'dur_alert' || msg.type === 'stock_alert') && (
                            <div className="flex items-center gap-1.5 mb-1.5">
                              {msg.type === 'dur_alert' && <Shield className="w-3.5 h-3.5 text-red-600" />}
                              {msg.type === 'stock_alert' && <Package className="w-3.5 h-3.5 text-amber-600" />}
                              <span className={`text-2xs font-bold ${msg.type === 'dur_alert' ? 'text-red-600' : 'text-amber-600'}`}>
                                {msg.type === 'dur_alert' ? 'DUR 알림' : '재고 알림'}
                              </span>
                              {msg.relatedRx && (
                                <span className="text-2xs text-muted-foreground ml-1">{msg.relatedRx}</span>
                              )}
                            </div>
                          )}
                          <p className="text-xs">{msg.message}</p>
                          <p className={`text-2xs mt-1 ${
                            msg.sender === 'clinic' && msg.type === 'text' ? 'text-blue-100' : 'text-muted-foreground'
                          }`}>{msg.time}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>

            {/* 빠른 응답 */}
            <div className="px-4 py-2 border-t border-border flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {['네, 확인했습니다', '처방 수정하겠습니다', '대체약 승인합니다', '전화 부탁드립니다'].map((q, i) => (
                <button key={i} className="px-3 py-1.5 rounded-full bg-secondary text-2xs font-medium whitespace-nowrap hover:bg-secondary/70 transition-colors">
                  {q}
                </button>
              ))}
            </div>

            {/* 입력 */}
            <div className="p-3 border-t border-border">
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-secondary"><Plus className="w-4 h-4 text-muted-foreground" /></button>
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="메시지를 입력하세요..."
                  className="input text-sm flex-1 py-2"
                />
                <button className="p-2.5 rounded-xl bg-blue-500 text-white hover:bg-blue-600">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
