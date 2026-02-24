'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CalendarCheck,
  Clock,
  Users,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mic,
  CheckCircle2,
  Circle,
  AlertCircle,
  X,
  Timer,
  ArrowRight,
  MessageSquare,
  Bell,
  UserPlus,
  RefreshCw,
  Filter,
} from 'lucide-react'
import { TossIcon } from '@/components/ui/TossIcon'

/* ─── 더미 데이터 ─── */
const timeSlots = [
  '09:00', '09:15', '09:30', '09:45',
  '10:00', '10:15', '10:30', '10:45',
  '11:00', '11:15', '11:30', '11:45',
  '12:00',
  '14:00', '14:15', '14:30', '14:45',
  '15:00', '15:15', '15:30', '15:45',
  '16:00', '16:15', '16:30', '16:45',
  '17:00', '17:15', '17:30',
]

type AppointmentStatus = 'reserved' | 'waiting' | 'called' | 'in_progress' | 'completed' | 'no_show' | 'cancelled'

interface Appointment {
  id: number
  time: string
  patientName: string
  age: number
  gender: 'M' | 'F'
  phone: string
  reason: string
  status: AppointmentStatus
  isNew: boolean
  waitMinutes?: number
  chartNo?: string
}

const appointments: Appointment[] = [
  { id: 1, time: '09:00', patientName: '오수현', age: 60, gender: 'F', phone: '010-0123-4567', reason: '골다공증 정기검진', status: 'completed', isNew: false, chartNo: 'C-20240118' },
  { id: 2, time: '09:15', patientName: '윤재민', age: 48, gender: 'M', phone: '010-1111-2222', reason: '고혈압 약 처방', status: 'completed', isNew: false, chartNo: 'C-20230415' },
  { id: 3, time: '09:30', patientName: '서미래', age: 35, gender: 'F', phone: '010-2222-3333', reason: '요통', status: 'completed', isNew: false, chartNo: 'C-20241105' },
  { id: 4, time: '09:45', patientName: '강도윤', age: 55, gender: 'M', phone: '010-3333-4444', reason: '당뇨 경과관찰', status: 'completed', isNew: false, chartNo: 'C-20230712' },
  { id: 5, time: '10:00', patientName: '임하준', age: 29, gender: 'M', phone: '010-4444-5555', reason: '감기, 기침', status: 'completed', isNew: true },
  { id: 6, time: '10:15', patientName: '노은채', age: 42, gender: 'F', phone: '010-5555-6666', reason: '위장 불편감', status: 'completed', isNew: false, chartNo: 'C-20240920' },
  // ... 진행중 / 대기
  { id: 7, time: '10:30', patientName: '백시연', age: 38, gender: 'F', phone: '010-6666-7777', reason: '편두통', status: 'in_progress', isNew: false, chartNo: 'C-20250110' },
  { id: 8, time: '10:45', patientName: '조민규', age: 50, gender: 'M', phone: '010-7777-8888', reason: '어깨 통증', status: 'called', isNew: false, waitMinutes: 3, chartNo: 'C-20241218' },
  { id: 9, time: '11:00', patientName: '황수빈', age: 31, gender: 'F', phone: '010-8888-9999', reason: '피부 발진', status: 'waiting', isNew: true, waitMinutes: 8 },
  { id: 10, time: '11:15', patientName: '권태영', age: 63, gender: 'M', phone: '010-9999-0000', reason: '관절염 경과', status: 'waiting', isNew: false, waitMinutes: 12, chartNo: 'C-20230830' },
  // 오후 예약
  { id: 11, time: '14:00', patientName: '김영수', age: 45, gender: 'M', phone: '010-1234-5678', reason: '고혈압 정기검진', status: 'reserved', isNew: false, chartNo: 'C-20230101' },
  { id: 12, time: '14:15', patientName: '이미경', age: 33, gender: 'F', phone: '010-2345-6789', reason: '감기 증상', status: 'reserved', isNew: false, chartNo: 'C-20250115' },
  { id: 13, time: '14:30', patientName: '박준호', age: 28, gender: 'M', phone: '010-3456-7890', reason: '두통, 어지러움', status: 'reserved', isNew: true },
  { id: 14, time: '14:45', patientName: '최은지', age: 52, gender: 'F', phone: '010-4567-8901', reason: '당뇨 경과 관찰', status: 'reserved', isNew: false, chartNo: 'C-20230518' },
  { id: 15, time: '15:00', patientName: '정대현', age: 67, gender: 'M', phone: '010-5678-9012', reason: '무릎 통증', status: 'reserved', isNew: false, chartNo: 'C-20241023' },
  { id: 16, time: '15:30', patientName: '한소영', age: 41, gender: 'F', phone: '010-6789-0123', reason: '건강검진 상담', status: 'reserved', isNew: false, chartNo: 'C-20250201' },
  { id: 17, time: '16:00', patientName: '고재헌', age: 58, gender: 'M', phone: '010-7890-1234', reason: '통풍', status: 'reserved', isNew: false, chartNo: 'C-20240308' },
  { id: 18, time: '09:30', patientName: '문지유', age: 26, gender: 'F', phone: '010-8901-2345', reason: '예방접종', status: 'no_show', isNew: true },
]

const statusConfig: Record<AppointmentStatus, { label: string; color: string; bg: string; dot: string }> = {
  reserved: { label: '예약', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-900/20', dot: 'bg-slate-400' },
  waiting: { label: '대기', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', dot: 'bg-amber-500 animate-pulse' },
  called: { label: '호출', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', dot: 'bg-blue-500 animate-pulse' },
  in_progress: { label: '진료중', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', dot: 'bg-emerald-500' },
  completed: { label: '완료', color: 'text-muted-foreground', bg: 'bg-secondary', dot: 'bg-muted-foreground' },
  no_show: { label: '부도', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', dot: 'bg-red-500' },
  cancelled: { label: '취소', color: 'text-muted-foreground', bg: 'bg-secondary', dot: 'bg-muted-foreground' },
}

export default function AppointmentsPage() {
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list')
  const [showNewModal, setShowNewModal] = useState(false)
  const [selectedDate] = useState(new Date())
  const [filterStatus, setFilterStatus] = useState<'all' | 'active'>('active')

  const activeAppointments = appointments.filter((a) =>
    filterStatus === 'active'
      ? !['completed', 'cancelled', 'no_show'].includes(a.status)
      : true
  )

  const stats = {
    total: appointments.length,
    completed: appointments.filter((a) => a.status === 'completed').length,
    waiting: appointments.filter((a) => a.status === 'waiting').length,
    inProgress: appointments.filter((a) => a.status === 'in_progress').length,
    noShow: appointments.filter((a) => a.status === 'no_show').length,
    remaining: appointments.filter((a) => a.status === 'reserved').length,
  }

  const avgWaitTime = Math.round(
    appointments
      .filter((a) => a.waitMinutes)
      .reduce((sum, a) => sum + (a.waitMinutes || 0), 0) /
    (appointments.filter((a) => a.waitMinutes).length || 1)
  )

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* ───── 헤더 ───── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">예약/접수 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-secondary rounded-xl p-0.5">
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filterStatus === 'active' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
              }`}
            >
              진행중
            </button>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filterStatus === 'all' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
              }`}
            >
              전체
            </button>
          </div>
          <button onClick={() => setShowNewModal(true)} className="btn-primary btn-sm">
            <Plus className="w-3.5 h-3.5" />
            예약 추가
          </button>
        </div>
      </div>

      {/* ───── 실시간 현황 카드 ───── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">진료중</span>
          </div>
          <div className="text-2xl font-bold">{stats.inProgress}</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">대기중</span>
          </div>
          <div className="text-2xl font-bold">{stats.waiting}</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Timer className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">평균 대기</span>
          </div>
          <div className="text-2xl font-bold">{avgWaitTime}<span className="text-sm text-muted-foreground">분</span></div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">완료</span>
          </div>
          <div className="text-2xl font-bold">{stats.completed}<span className="text-sm text-muted-foreground">/{stats.total}</span></div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <CalendarCheck className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">남은 예약</span>
          </div>
          <div className="text-2xl font-bold">{stats.remaining}</div>
        </div>
      </div>

      {/* ───── 접수 리스트 ───── */}
      <div className="card overflow-hidden">
        <div className="divide-y divide-border">
          {(filterStatus === 'active' ? activeAppointments : appointments)
            .sort((a, b) => {
              const statusOrder: Record<AppointmentStatus, number> = {
                in_progress: 0,
                called: 1,
                waiting: 2,
                reserved: 3,
                completed: 4,
                no_show: 5,
                cancelled: 6,
              }
              const orderDiff = statusOrder[a.status] - statusOrder[b.status]
              if (orderDiff !== 0) return orderDiff
              return a.time.localeCompare(b.time)
            })
            .map((apt) => {
              const st = statusConfig[apt.status]
              return (
                <div key={apt.id} className={`flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors group ${
                  apt.status === 'completed' || apt.status === 'no_show' ? 'opacity-60' : ''
                }`}>
                  {/* 상태 점 */}
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${st.dot}`} />

                  {/* 시간 */}
                  <div className="w-14 text-center flex-shrink-0">
                    <div className="text-sm font-bold">{apt.time}</div>
                  </div>

                  {/* 상태 뱃지 */}
                  <div className={`px-2.5 py-1 rounded-lg text-2xs font-semibold ${st.color} ${st.bg} flex-shrink-0 w-16 text-center`}>
                    {st.label}
                  </div>

                  {/* 환자 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{apt.patientName}</span>
                      <span className="text-xs text-muted-foreground">{apt.age}세 {apt.gender === 'M' ? '남' : '여'}</span>
                      {apt.isNew && <span className="badge bg-primary text-white text-2xs">신환</span>}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{apt.reason}</div>
                  </div>

                  {/* 대기시간 */}
                  {apt.waitMinutes !== undefined && apt.status !== 'completed' && (
                    <div className="hidden sm:flex items-center gap-1 text-xs flex-shrink-0">
                      <Clock className={`w-3.5 h-3.5 ${apt.waitMinutes > 10 ? 'text-red-500' : 'text-muted-foreground'}`} />
                      <span className={apt.waitMinutes > 10 ? 'text-red-500 font-semibold' : 'text-muted-foreground'}>
                        {apt.waitMinutes}분
                      </span>
                    </div>
                  )}

                  {/* 전화 */}
                  <a href={`tel:${apt.phone}`} className="hidden sm:block text-xs text-muted-foreground hover:text-primary flex-shrink-0">
                    <Phone className="w-4 h-4" />
                  </a>

                  {/* 액션 버튼 */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {apt.status === 'reserved' && (
                      <button className="btn-outline btn-sm text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        접수
                      </button>
                    )}
                    {apt.status === 'waiting' && (
                      <button className="btn-outline btn-sm text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        호출
                      </button>
                    )}
                    {(apt.status === 'called' || apt.status === 'waiting') && (
                      <Link href="/emr/chart/new" className="btn-primary btn-sm text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        <Mic className="w-3 h-3" />
                        진료
                      </Link>
                    )}
                    {apt.status === 'in_progress' && (
                      <span className="badge-success text-2xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        진료중
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
        </div>

        {/* 없을 때 */}
        {filterStatus === 'active' && activeAppointments.length === 0 && (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto mb-4" />
            <div className="font-semibold text-muted-foreground">모든 진료가 완료되었습니다</div>
            <div className="text-sm text-muted-foreground mt-1">오늘도 수고하셨습니다</div>
          </div>
        )}
      </div>

      {/* ───── 대기 현황 모니터 (환자 표시용) ───── */}
      <div className="card p-6 bg-gradient-to-r from-primary/5 to-violet-500/5 border border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            대기 현황 모니터
          </h3>
          <span className="text-xs text-muted-foreground">환자 대기실 화면에 표시됩니다</span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* 진료중 */}
          <div className="p-4 bg-card rounded-xl text-center">
            <div className="text-xs text-emerald-500 font-semibold mb-2">진료중</div>
            {appointments
              .filter((a) => a.status === 'in_progress')
              .map((a) => (
                <div key={a.id} className="text-lg font-bold">{a.patientName.slice(0, 1)}OO님</div>
              ))}
          </div>

          {/* 다음 환자 */}
          <div className="p-4 bg-card rounded-xl text-center">
            <div className="text-xs text-blue-500 font-semibold mb-2">다음 환자</div>
            {appointments
              .filter((a) => a.status === 'called')
              .slice(0, 1)
              .map((a) => (
                <div key={a.id} className="text-lg font-bold">{a.patientName.slice(0, 1)}OO님</div>
              ))}
          </div>

          {/* 대기 인원 */}
          <div className="p-4 bg-card rounded-xl text-center">
            <div className="text-xs text-amber-500 font-semibold mb-2">대기 인원</div>
            <div className="text-lg font-bold">{stats.waiting}명</div>
            <div className="text-xs text-muted-foreground">예상 대기 {avgWaitTime}분</div>
          </div>
        </div>
      </div>

      {/* ───── 예약 추가 모달 ───── */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowNewModal(false)}>
          <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-lg font-bold">예약 추가</h3>
              <button onClick={() => setShowNewModal(false)} className="btn-icon">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="label mb-1.5 block">환자 검색</label>
                <div className="flex items-center gap-2 bg-secondary/50 rounded-xl px-4">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <input className="bg-transparent text-sm outline-none w-full py-3" placeholder="이름, 차트번호, 연락처" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label mb-1.5 block">날짜</label>
                  <input type="date" className="input" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
                <div>
                  <label className="label mb-1.5 block">시간</label>
                  <select className="select">
                    {timeSlots.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label mb-1.5 block">방문 사유</label>
                <input className="input" placeholder="증상 또는 방문 사유" />
              </div>

              <div>
                <label className="label mb-1.5 block">메모</label>
                <textarea className="textarea" placeholder="추가 메모" rows={2} />
              </div>
            </div>

            <div className="flex items-center gap-3 p-5 border-t border-border">
              <button onClick={() => setShowNewModal(false)} className="btn-secondary flex-1">취소</button>
              <button className="btn-primary flex-1">
                <CalendarCheck className="w-4 h-4" />
                예약 등록
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
