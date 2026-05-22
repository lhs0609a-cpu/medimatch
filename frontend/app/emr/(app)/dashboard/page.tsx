'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  Users,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Clock,
  CalendarCheck,
  ArrowRight,
  Mic,
  ChevronRight,
  Pill,
  Brain,
  Sparkles,
  BarChart3,
  Loader2,
  Inbox,
} from 'lucide-react'
import { TossIcon } from '@/components/ui/TossIcon'
import ModuleHeader from '@/components/emr/ModuleHeader'
import {
  appointmentService,
  billService,
  visitService,
  type Appointment,
  type VisitListItem,
} from '@/lib/api/emr'

/* ─── 예시 데이터 (전용 백엔드 연동 전까지 노출) ─── */
const aiInsights = [
  { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', text: '화요일 14~16시 예약 공백이 많습니다', action: '마케팅 추천' },
  { icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: '이번 주 감기 환자 40% 증가 추세', action: '재고 확인' },
  { icon: Users, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', text: '3개월 미방문 환자 47명 발견', action: '리콜 문자 발송' },
  { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', text: '청구코드 M54.5 삭감 위험 2건', action: '코드 확인' },
]

const pharmacyQueue = [
  { patient: '오수현', status: 'dispensing', pharmacy: '온누리약국', time: '2분 전' },
  { patient: '윤재민', status: 'completed', pharmacy: '건강약국', time: '15분 전' },
  { patient: '서미래', status: 'sent', pharmacy: '온누리약국', time: '방금' },
]

/* ─── 상태 매핑 ─── */
const apptStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  SCHEDULED: { label: '예약', color: 'text-muted-foreground', bg: 'bg-secondary' },
  CONFIRMED: { label: '확정', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  ARRIVED: { label: '대기', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  IN_PROGRESS: { label: '진료중', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  COMPLETED: { label: '완료', color: 'text-muted-foreground', bg: 'bg-secondary' },
  NO_SHOW: { label: '미방문', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
  CANCELLED: { label: '취소', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
}

const visitStatusBadge: Record<string, { label: string; cls: string }> = {
  COMPLETED: { label: '완료', cls: 'badge-default' },
  IN_PROGRESS: { label: '진료중', cls: 'badge-warning' },
  SCHEDULED: { label: '대기', cls: 'badge-warning' },
  CANCELLED: { label: '취소', cls: 'badge-default' },
}

const pharmacyStatusConfig: Record<string, { label: string; color: string }> = {
  sent: { label: '전송됨', color: 'text-blue-500' },
  dispensing: { label: '조제중', color: 'text-amber-500' },
  completed: { label: '조제완료', color: 'text-emerald-500' },
}

const won = (n: number) => (n / 10000).toFixed(0)
const hhmm = (iso?: string) => {
  if (!iso) return '-'
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '-' : d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export default function EMRDashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today')
  const today = new Date().toISOString().slice(0, 10)

  // 오늘 예약 통계
  const { data: apptStats } = useQuery({
    queryKey: ['dash-appt-stats'],
    queryFn: () => appointmentService.todayStats(),
  })
  // 수납 통계 (오늘 매출 / 미수금)
  const { data: billStats } = useQuery({
    queryKey: ['dash-bill-stats'],
    queryFn: () => billService.stats(),
  })
  // 오늘 접수 현황
  const { data: todayAppts, isLoading: apptsLoading } = useQuery({
    queryKey: ['dash-today-appts', today],
    queryFn: () => appointmentService.list({ date_from: today, date_to: today }),
  })
  // 최근 진료
  const { data: recentVisits, isLoading: visitsLoading } = useQuery({
    queryKey: ['dash-recent-visits'],
    queryFn: () => visitService.list({ page_size: 6 }),
  })
  // 월별 매출 추이
  const { data: trend } = useQuery({
    queryKey: ['dash-revenue-trend'],
    queryFn: () => visitService.dashboard(6),
  })

  const waiting = (apptStats?.arrived ?? 0)
  const completed = apptStats?.completed ?? 0

  const sortedAppts = (todayAppts ?? [])
    .slice()
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))

  const monthly = trend?.monthly ?? []
  const maxRevenue = Math.max(1, ...monthly.map((m) => m.revenue || 0))
  const monthlyTotal = monthly.reduce((s, m) => s + (m.revenue || 0), 0)

  const now = new Date()
  const greeting = now.getHours() < 12 ? '좋은 아침이에요' : now.getHours() < 18 ? '좋은 오후예요' : '수고 많으셨어요'

  return (
    <div>
      <ModuleHeader
        moduleKey="dashboard"
        title={greeting}
        subtitle={now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        maxWidthClass="max-w-[1400px]"
        actions={
          <>
            <Link href="/emr/chart/new" className="btn-primary">
              <Mic className="w-4 h-4" /> AI 진료 시작
            </Link>
            <Link href="/emr/appointments" className="btn-secondary">
              <CalendarCheck className="w-4 h-4" /> 접수 관리
            </Link>
          </>
        }
      />
    <div className="max-w-[1400px] mx-auto space-y-6 p-6">
      {/* ───── 핵심 지표 카드 4개 ───── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 오늘 예약 */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">오늘 예약</span>
            <TossIcon icon={CalendarCheck} color="from-blue-500 to-blue-700" size="sm" />
          </div>
          <div className="text-3xl font-bold">{apptStats?.total ?? 0}<span className="text-lg text-muted-foreground">명</span></div>
          <div className="flex items-center gap-2 mt-2">
            <span className="badge-success text-2xs">{completed}명 완료</span>
            <span className="badge-warning text-2xs">{waiting}명 대기</span>
          </div>
        </div>

        {/* 오늘 매출 */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">오늘 매출</span>
            <TossIcon icon={DollarSign} color="from-emerald-500 to-blue-600" size="sm" />
          </div>
          <div className="text-3xl font-bold">{won(billStats?.today_revenue ?? 0)}<span className="text-lg text-muted-foreground">만원</span></div>
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            이번 달 누적 {won(billStats?.month_revenue ?? 0)}만원
          </div>
        </div>

        {/* 청구 점검 */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">청구 점검</span>
            <TossIcon icon={AlertTriangle} color="from-amber-500 to-orange-600" size="sm" />
          </div>
          <div className="text-base font-bold mt-1">누락·삭감 검출</div>
          <Link href="/emr/claims" className="flex items-center gap-1 mt-2 text-sm text-amber-500 font-semibold hover:underline">
            청구 분석 열기
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 미수금 */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">미수금</span>
            <TossIcon icon={DollarSign} color="from-red-500 to-rose-600" size="sm" />
          </div>
          <div className="text-3xl font-bold">{won(billStats?.outstanding ?? 0)}<span className="text-lg text-muted-foreground">만원</span></div>
          <Link href="/emr/billing" className="flex items-center gap-1 mt-2 text-sm text-muted-foreground hover:underline">
            <Clock className="w-3.5 h-3.5" />
            수납 관리
          </Link>
        </div>
      </div>

      {/* ───── 메인 그리드: 접수현황 + AI 인사이트 ───── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* 접수 현황 (2/3) */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold">오늘 접수 현황</h3>
              {waiting > 0 && <span className="badge-primary text-2xs">{waiting}명 대기</span>}
            </div>
            <Link href="/emr/appointments" className="text-sm text-primary font-semibold hover:underline flex items-center gap-1">
              전체 보기
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {apptsLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : sortedAppts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Inbox className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">오늘 예약이 없습니다</p>
              <Link href="/emr/appointments" className="btn-secondary btn-sm mt-3">
                <CalendarCheck className="w-3.5 h-3.5" /> 예약 등록
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {sortedAppts.map((appt: Appointment) => {
                const st = apptStatusConfig[(appt.status || '').toUpperCase()] || apptStatusConfig.SCHEDULED
                const isNew = !appt.patient_id
                return (
                  <div key={appt.id} className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors group">
                    <div className="w-14 text-center flex-shrink-0">
                      <div className="text-sm font-bold">{hhmm(appt.start_time)}</div>
                    </div>
                    <div className={`px-2 py-1 rounded-lg text-2xs font-semibold ${st.color} ${st.bg} flex-shrink-0 w-14 text-center`}>
                      {st.label}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{appt.patient_name}</span>
                        {isNew && <span className="badge bg-primary text-white text-2xs">신환</span>}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{appt.chief_complaint || appt.appointment_type || '-'}</div>
                    </div>
                    <Link
                      href={appt.patient_id ? `/emr/patients/${appt.patient_id}` : '/emr/chart/new'}
                      className="btn-primary btn-sm opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    >
                      <Mic className="w-3 h-3" />
                      진료
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* AI 인사이트 (1/3) */}
        <div className="space-y-6">
          {/* AI 인사이트 — 예시 */}
          <div className="card">
            <div className="flex items-center gap-2 p-5 border-b border-border">
              <Brain className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold">AI 인사이트</h3>
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="badge-default text-2xs ml-auto">예시</span>
            </div>

            <div className="p-3 space-y-2">
              {aiInsights.map((insight, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${insight.bg} transition-colors`}>
                  <insight.icon className={`w-4 h-4 ${insight.color} flex-shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs leading-relaxed">{insight.text}</div>
                    <button className="text-2xs text-primary font-semibold mt-1 hover:underline">
                      {insight.action} →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 약국 연동 현황 — 예시 */}
          <div className="card">
            <div className="flex items-center gap-2 p-5 border-b border-border">
              <Pill className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-bold">약국 연동</h3>
              <span className="badge-default text-2xs ml-auto">예시</span>
            </div>

            <div className="p-3 space-y-2">
              {pharmacyQueue.map((item, i) => {
                const st = pharmacyStatusConfig[item.status]
                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      item.status === 'completed' ? 'bg-emerald-500' :
                      item.status === 'dispensing' ? 'bg-amber-500 animate-pulse' :
                      'bg-blue-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{item.patient}</div>
                      <div className="text-2xs text-muted-foreground">{item.pharmacy} · {item.time}</div>
                    </div>
                    <span className={`text-2xs font-semibold ${st.color}`}>{st.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ───── 비즈니스 분석 배너 ───── */}
      <Link
        href="/emr-dashboard"
        className="block card p-5 bg-gradient-to-r from-blue-50 to-blue-50 dark:from-blue-900/20 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800 hover:shadow-md transition-all group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TossIcon icon={BarChart3} color="from-blue-500 to-blue-700" size="sm" />
            <div>
              <div className="font-bold text-sm">비즈니스 분석 대시보드</div>
              <div className="text-xs text-muted-foreground">매출 추이, 환자 분석, 보험 비율, 지역 벤치마크를 한눈에</div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-blue-500 group-hover:translate-x-1 transition-transform" />
        </div>
      </Link>

      {/* ───── 하단: 월별 매출 + 최근 진료 ───── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* 월별 매출 그래프 */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">최근 매출 추이</h3>
            <span className="text-xs text-muted-foreground">최근 {monthly.length || 6}개월</span>
          </div>

          {monthly.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <BarChart3 className="w-8 h-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">아직 매출 데이터가 없습니다</p>
            </div>
          ) : (
            <div className="flex items-end gap-3 h-40">
              {monthly.map((m, i) => {
                const height = (m.revenue / maxRevenue) * 100
                const isLast = i === monthly.length - 1
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="text-2xs text-muted-foreground font-semibold">
                      {won(m.revenue || 0)}
                    </div>
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        isLast ? 'bg-primary' : 'bg-secondary hover:bg-primary/30'
                      }`}
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                    <div className={`text-xs ${isLast ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                      {(m.month || '').slice(5)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <div>
              <div className="text-sm text-muted-foreground">기간 합계</div>
              <div className="text-xl font-bold">{won(monthlyTotal)}만원</div>
            </div>
          </div>
        </div>

        {/* 최근 진료 */}
        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h3 className="text-lg font-bold">최근 진료</h3>
            <Link href="/emr/chart" className="text-sm text-primary font-semibold hover:underline flex items-center gap-1">
              전체 보기
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {visitsLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : (recentVisits ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Inbox className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">아직 진료 기록이 없습니다</p>
              <Link href="/emr/chart/new" className="btn-secondary btn-sm mt-3">
                <Mic className="w-3.5 h-3.5" /> 진료 시작
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {(recentVisits ?? []).map((v: VisitListItem) => {
                const badge = visitStatusBadge[(v.status || '').toUpperCase()] || visitStatusBadge.COMPLETED
                return (
                  <Link
                    key={v.id}
                    href={`/emr/chart/${v.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors"
                  >
                    <div className="w-16 text-center flex-shrink-0">
                      <div className="text-xs font-medium text-muted-foreground">{v.chart_no || v.visit_no}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{v.primary_diagnosis || v.chief_complaint || '진료 기록'}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {v.visit_date} · {v.procedure_count}개 행위
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span className={`${badge.cls} text-2xs`}>{badge.label}</span>
                      {v.total_amount > 0 && (
                        <div className="text-2xs text-muted-foreground mt-1">{won(v.total_amount)}만원</div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  )
}
