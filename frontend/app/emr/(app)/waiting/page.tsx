'use client'

import { useState } from 'react'
import {
  Users,
  Clock,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Phone,
  MessageSquare,
  Monitor,
  Volume2,
  ArrowRight,
  User,
  Stethoscope,
  ClipboardList,
  CreditCard,
  LogOut,
  RefreshCw,
  Bell,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Timer,
  Megaphone,
  X,
  Maximize2,
  Tv,
} from 'lucide-react'

/* ─── 타입 ─── */
type WaitingStatus = 'checked_in' | 'waiting' | 'in_consultation' | 'billing' | 'completed' | 'no_show'

interface WaitingPatient {
  id: string
  name: string
  age: number
  gender: string
  chartNo: string
  checkinTime: string
  appointmentTime: string
  status: WaitingStatus
  type: '초진' | '재진'
  reason: string
  waitMinutes: number
  doctor?: string
  room?: string
  queueNumber: number
}

/* ─── 더미 데이터 ─── */
const patients: WaitingPatient[] = [
  { id: 'W001', name: '이미경', age: 38, gender: 'F', chartNo: 'C-1204', checkinTime: '09:12', appointmentTime: '09:30', status: 'completed', type: '재진', reason: '갑상선 경과', waitMinutes: 0, doctor: '김원장', room: '진료실 1', queueNumber: 1 },
  { id: 'W002', name: '김영수', age: 45, gender: 'M', chartNo: 'C-0892', checkinTime: '09:25', appointmentTime: '09:40', status: 'completed', type: '재진', reason: '고혈압 관리', waitMinutes: 0, doctor: '김원장', room: '진료실 1', queueNumber: 2 },
  { id: 'W003', name: '박준호', age: 52, gender: 'M', chartNo: 'C-0341', checkinTime: '09:45', appointmentTime: '10:00', status: 'billing', type: '재진', reason: '당뇨 관리', waitMinutes: 0, doctor: '김원장', room: '수납', queueNumber: 3 },
  { id: 'W004', name: '강지원', age: 29, gender: 'F', chartNo: 'C-1567', checkinTime: '09:58', appointmentTime: '10:15', status: 'in_consultation', type: '초진', reason: '두통, 어지러움', waitMinutes: 0, doctor: '김원장', room: '진료실 1', queueNumber: 4 },
  { id: 'W005', name: '정대현', age: 61, gender: 'M', chartNo: 'C-0128', checkinTime: '10:05', appointmentTime: '10:30', status: 'waiting', type: '재진', reason: '요통 악화', waitMinutes: 22, queueNumber: 5 },
  { id: 'W006', name: '최은지', age: 34, gender: 'F', chartNo: 'C-1891', checkinTime: '10:10', appointmentTime: '10:30', status: 'waiting', type: '초진', reason: '피부 발진', waitMinutes: 17, queueNumber: 6 },
  { id: 'W007', name: '한상우', age: 47, gender: 'M', chartNo: 'C-0654', checkinTime: '10:18', appointmentTime: '10:45', status: 'waiting', type: '재진', reason: '수면장애', waitMinutes: 9, queueNumber: 7 },
  { id: 'W008', name: '윤서연', age: 55, gender: 'F', chartNo: 'C-2011', checkinTime: '10:22', appointmentTime: '11:00', status: 'checked_in', type: '재진', reason: '고지혈증 검사', waitMinutes: 5, queueNumber: 8 },
]

const statusConfig: Record<WaitingStatus, { label: string; color: string; bg: string; step: number }> = {
  checked_in: { label: '접수', color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-800', step: 0 },
  waiting: { label: '대기', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', step: 1 },
  in_consultation: { label: '진료 중', color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30', step: 2 },
  billing: { label: '수납', color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30', step: 3 },
  completed: { label: '완료', color: 'text-gray-400', bg: 'bg-gray-50 dark:bg-gray-900/20', step: 4 },
  no_show: { label: '미도착', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', step: -1 },
}

const pipelineSteps = [
  { key: 'checked_in' as WaitingStatus, label: '접수', icon: ClipboardList },
  { key: 'waiting' as WaitingStatus, label: '대기', icon: Clock },
  { key: 'in_consultation' as WaitingStatus, label: '진료 중', icon: Stethoscope },
  { key: 'billing' as WaitingStatus, label: '수납', icon: CreditCard },
  { key: 'completed' as WaitingStatus, label: '완료', icon: CheckCircle2 },
]

const hourlyStats = [
  { hour: '09시', count: 8, avg: 12 },
  { hour: '10시', count: 11, avg: 18 },
  { hour: '11시', count: 9, avg: 15 },
  { hour: '12시', count: 3, avg: 5 },
  { hour: '14시', count: 10, avg: 16 },
  { hour: '15시', count: 12, avg: 22 },
  { hour: '16시', count: 8, avg: 14 },
  { hour: '17시', count: 5, avg: 8 },
]

export default function WaitingPage() {
  const [showDisplayMode, setShowDisplayMode] = useState(false)
  const [showCallModal, setShowCallModal] = useState<string | null>(null)

  const waitingPatients = patients.filter(p => p.status === 'waiting' || p.status === 'checked_in')
  const inConsultation = patients.filter(p => p.status === 'in_consultation')
  const avgWait = waitingPatients.length > 0
    ? Math.round(waitingPatients.reduce((sum, p) => sum + p.waitMinutes, 0) / waitingPatients.length)
    : 0
  const completedToday = patients.filter(p => p.status === 'completed').length
  const maxHourly = Math.max(...hourlyStats.map(h => h.count))

  // 대기실 TV 디스플레이 모드
  if (showDisplayMode) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-950 z-50 p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Stethoscope className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold">메디매치 내과의원</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-lg text-muted-foreground">{new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
            <button onClick={() => setShowDisplayMode(false)} className="p-2 rounded-lg hover:bg-secondary">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* 현재 진료 중 */}
          <div>
            <h2 className="text-xl font-bold text-emerald-600 mb-4 flex items-center gap-2">
              <Stethoscope className="w-6 h-6" /> 진료 중
            </h2>
            {inConsultation.map(p => (
              <div key={p.id} className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-6 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-3xl font-bold">#{p.queueNumber}</span>
                    <span className="text-xl ml-3">{p.name.charAt(0)}**</span>
                  </div>
                  <span className="text-lg text-emerald-600 font-semibold">{p.room}</span>
                </div>
              </div>
            ))}
          </div>

          {/* 대기 목록 */}
          <div>
            <h2 className="text-xl font-bold text-blue-600 mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6" /> 대기 중 ({waitingPatients.length}명)
            </h2>
            <div className="space-y-3">
              {waitingPatients.map(p => (
                <div key={p.id} className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-blue-600">#{p.queueNumber}</span>
                    <span className="text-lg">{p.name.charAt(0)}**</span>
                  </div>
                  <span className="text-lg text-muted-foreground">약 {p.waitMinutes + 10}분</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-muted-foreground">현재 평균 대기시간: <span className="text-2xl font-bold text-blue-600">{avgWait}분</span></p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">환자 대기/동선 관리</h1>
            <p className="text-sm text-muted-foreground">실시간 대기 현황 · 환자 호출 · 동선 최적화</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDisplayMode(true)}
            className="btn-sm text-xs bg-blue-600 text-white hover:bg-blue-700"
          >
            <Tv className="w-3.5 h-3.5" /> 대기실 화면
          </button>
          <button className="btn-sm text-xs bg-secondary text-foreground">
            <RefreshCw className="w-3.5 h-3.5" /> 새로고침
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="w-4.5 h-4.5 text-blue-600" />
            </div>
            <span className="text-2xs text-muted-foreground">현재</span>
          </div>
          <div className="text-2xl font-bold">{waitingPatients.length}명</div>
          <div className="text-xs text-muted-foreground">대기 환자</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Timer className="w-4.5 h-4.5 text-amber-600" />
            </div>
            {avgWait > 15 && <AlertCircle className="w-4 h-4 text-amber-500" />}
          </div>
          <div className="text-2xl font-bold">{avgWait}분</div>
          <div className="text-xs text-muted-foreground">평균 대기시간</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Stethoscope className="w-4.5 h-4.5 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-bold">{inConsultation.length}명</div>
          <div className="text-xs text-muted-foreground">진료 중</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-4.5 h-4.5 text-purple-600" />
            </div>
          </div>
          <div className="text-2xl font-bold">{completedToday}명</div>
          <div className="text-xs text-muted-foreground">오늘 완료</div>
        </div>
      </div>

      {/* 파이프라인 뷰 */}
      <div className="card p-4">
        <h2 className="font-bold text-sm mb-4">환자 동선 파이프라인</h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {pipelineSteps.map((step, si) => {
            const stepPatients = patients.filter(p => p.status === step.key)
            return (
              <div key={step.key} className="flex items-start gap-2 min-w-0">
                <div className="flex-shrink-0 w-48 min-h-[180px]">
                  <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-lg ${
                    si === 2 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-secondary/50'
                  }`}>
                    <step.icon className={`w-4 h-4 ${si === 2 ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                    <span className="text-xs font-semibold">{step.label}</span>
                    <span className="ml-auto text-2xs font-bold bg-card px-1.5 py-0.5 rounded">{stepPatients.length}</span>
                  </div>
                  <div className="space-y-2">
                    {stepPatients.map(p => (
                      <div
                        key={p.id}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${
                          p.status === 'in_consultation' ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/5' :
                          p.status === 'waiting' && p.waitMinutes > 15 ? 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/5' :
                          'border-border'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold">#{p.queueNumber}</span>
                            <span className="text-xs font-medium">{p.name}</span>
                          </div>
                          {p.type === '초진' && <span className="px-1 py-0.5 rounded text-2xs bg-purple-100 text-purple-600 dark:bg-purple-900/30">초진</span>}
                        </div>
                        <div className="text-2xs text-muted-foreground truncate">{p.reason}</div>
                        {p.status === 'waiting' && (
                          <div className="flex items-center justify-between mt-1.5">
                            <span className={`text-2xs font-bold ${p.waitMinutes > 15 ? 'text-amber-600' : 'text-blue-600'}`}>
                              {p.waitMinutes}분 대기
                            </span>
                            <button
                              onClick={() => setShowCallModal(p.id)}
                              className="px-1.5 py-0.5 rounded bg-blue-500 text-white text-2xs font-bold hover:bg-blue-600"
                            >
                              호출
                            </button>
                          </div>
                        )}
                        {p.status === 'in_consultation' && p.room && (
                          <div className="text-2xs text-emerald-600 font-medium mt-1">{p.room}</div>
                        )}
                      </div>
                    ))}
                    {stepPatients.length === 0 && (
                      <div className="text-center py-4 text-2xs text-muted-foreground">없음</div>
                    )}
                  </div>
                </div>
                {si < pipelineSteps.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-muted-foreground mt-10 flex-shrink-0" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 시간대별 현황 + AI 인사이트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 시간대별 내원 현황 */}
        <div className="card p-4">
          <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" /> 시간대별 내원 현황
          </h2>
          <div className="flex items-end gap-2 h-32">
            {hourlyStats.map((h, i) => {
              const height = (h.count / maxHourly) * 100
              const isCurrent = h.hour === '10시'
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-2xs font-bold">{h.count}</span>
                  <div
                    className={`w-full rounded-t-lg transition-all ${
                      isCurrent ? 'bg-blue-500' : 'bg-blue-200 dark:bg-blue-800/40'
                    }`}
                    style={{ height: `${height}%` }}
                  />
                  <span className={`text-2xs ${isCurrent ? 'font-bold text-blue-600' : 'text-muted-foreground'}`}>{h.hour}</span>
                </div>
              )
            })}
          </div>
          <div className="mt-3 flex items-center justify-between text-2xs text-muted-foreground">
            <span>피크타임: 15시 (평균 12명)</span>
            <span>평균 대기: 14.8분</span>
          </div>
        </div>

        {/* AI 인사이트 */}
        <div className="card p-4">
          <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-purple-600" /> AI 동선 최적화
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">대기시간 경고</p>
                <p className="text-2xs text-amber-600 mt-0.5">정대현 환자가 22분 대기 중입니다. 평균 대비 50% 초과.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl">
              <TrendingUp className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">피크타임 예측</p>
                <p className="text-2xs text-blue-600 mt-0.5">14~15시 구간에 예약 10건이 집중되어 있습니다. 점심시간 전 빠른 진료를 권고합니다.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">오전 진료 효율</p>
                <p className="text-2xs text-emerald-600 mt-0.5">오전 평균 진료 시간 11.2분. 전주 대비 1.8분 단축. 효율적으로 운영 중입니다.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 환자 호출 모달 */}
      {showCallModal && (() => {
        const patient = patients.find(p => p.id === showCallModal)
        if (!patient) return null
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCallModal(null)}>
            <div className="bg-card rounded-2xl shadow-xl max-w-sm w-full" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-bold text-lg">환자 호출</h3>
                <button onClick={() => setShowCallModal(null)} className="btn-icon"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-3">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="text-lg font-bold">{patient.name}</div>
                  <div className="text-sm text-muted-foreground">#{patient.queueNumber} · {patient.reason}</div>
                </div>

                <div className="space-y-2">
                  <button className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2">
                    <Volume2 className="w-4 h-4" /> 대기실 호출 (음성)
                  </button>
                  <button className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2">
                    <MessageSquare className="w-4 h-4" /> 카카오 알림 전송
                  </button>
                  <button className="w-full py-3 rounded-xl font-semibold text-sm bg-secondary text-foreground flex items-center justify-center gap-2">
                    <Phone className="w-4 h-4" /> 전화 호출
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
