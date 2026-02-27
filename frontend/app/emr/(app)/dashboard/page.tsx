'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Clock,
  CalendarCheck,
  ArrowRight,
  ArrowUpRight,
  Mic,
  ChevronRight,
  MoreHorizontal,
  Activity,
  Pill,
  FileText,
  CheckCircle2,
  Circle,
  Timer,
  Stethoscope,
  Receipt,
  Bell,
  Sparkles,
  BarChart3,
  Brain,
  Heart,
  Thermometer,
  Eye,
  Syringe,
  Baby,
  Bone,
  Ear,
} from 'lucide-react'
import { TossIcon } from '@/components/ui/TossIcon'

/* ─── 더미 데이터 ─── */
const todayStats = {
  appointments: 32,
  completed: 18,
  waiting: 3,
  revenue: 4280000,
  revenueChange: 12.5,
  claimRisk: 2,
  unpaid: 150000,
  avgWaitTime: 8,
}

const upcomingPatients = [
  { id: 1, name: '김영수', age: 45, gender: 'M', time: '14:00', status: 'waiting', reason: '고혈압 정기검진', chartNo: 'C-20240312', isNew: false },
  { id: 2, name: '이미경', age: 33, gender: 'F', time: '14:15', status: 'called', reason: '감기 증상', chartNo: 'C-20250115', isNew: false },
  { id: 3, name: '박준호', age: 28, gender: 'M', time: '14:30', status: 'reserved', reason: '두통, 어지러움', chartNo: '', isNew: true },
  { id: 4, name: '최은지', age: 52, gender: 'F', time: '14:45', status: 'reserved', reason: '당뇨 경과 관찰', chartNo: 'C-20230518', isNew: false },
  { id: 5, name: '정대현', age: 67, gender: 'M', time: '15:00', status: 'reserved', reason: '무릎 통증', chartNo: 'C-20241023', isNew: false },
  { id: 6, name: '한소영', age: 41, gender: 'F', time: '15:15', status: 'reserved', reason: '건강검진 결과 상담', chartNo: 'C-20250201', isNew: false },
]

const recentCharts = [
  { id: 1, patient: '오수현', time: '13:45', dx: 'J06.9 급성 상기도감염', status: 'completed' },
  { id: 2, patient: '윤재민', time: '13:20', dx: 'I10 본태성 고혈압', status: 'completed' },
  { id: 3, patient: '서미래', time: '13:00', dx: 'M54.5 요통', status: 'claim_ready' },
  { id: 4, patient: '강도윤', time: '12:30', dx: 'E11.9 제2형 당뇨병', status: 'claimed' },
]

const aiInsights = [
  { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', text: '화요일 14~16시 예약 공백이 많습니다', action: '마케팅 추천' },
  { icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: '이번 주 감기 환자 40% 증가 추세', action: '재고 확인' },
  { icon: Users, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', text: '3개월 미방문 환자 47명 발견', action: '리콜 문자 발송' },
  { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', text: '청구코드 M54.5 삭감 위험 2건', action: '코드 확인' },
]

const weeklyRevenue = [
  { day: '월', amount: 3800000 },
  { day: '화', amount: 4200000 },
  { day: '수', amount: 3950000 },
  { day: '목', amount: 4500000 },
  { day: '금', amount: 4280000 },
  { day: '토', amount: 2100000 },
]

const pharmacyQueue = [
  { patient: '오수현', status: 'dispensing', pharmacy: '온누리약국', time: '2분 전' },
  { patient: '윤재민', status: 'completed', pharmacy: '건강약국', time: '15분 전' },
  { patient: '서미래', status: 'sent', pharmacy: '온누리약국', time: '방금' },
]

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  waiting: { label: '대기', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  called: { label: '호출', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  reserved: { label: '예약', color: 'text-muted-foreground', bg: 'bg-secondary' },
  in_progress: { label: '진료중', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
}

const pharmacyStatusConfig: Record<string, { label: string; color: string }> = {
  sent: { label: '전송됨', color: 'text-blue-500' },
  dispensing: { label: '조제중', color: 'text-amber-500' },
  completed: { label: '조제완료', color: 'text-emerald-500' },
}

export default function EMRDashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today')
  const maxRevenue = Math.max(...weeklyRevenue.map((d) => d.amount))

  const now = new Date()
  const greeting = now.getHours() < 12 ? '좋은 아침이에요' : now.getHours() < 18 ? '좋은 오후예요' : '수고 많으셨어요'

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* ───── 인사 & 퀵액션 ───── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {greeting}, <span className="text-gradient-blue">김원장님</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            {now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/emr/chart/new" className="btn-primary">
            <Mic className="w-4 h-4" />
            AI 진료 시작
          </Link>
          <Link href="/emr/appointments" className="btn-secondary">
            <CalendarCheck className="w-4 h-4" />
            접수 관리
          </Link>
        </div>
      </div>

      {/* ───── 핵심 지표 카드 4개 ───── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 오늘 예약 */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">오늘 예약</span>
            <TossIcon icon={CalendarCheck} color="from-blue-500 to-indigo-600" size="sm" />
          </div>
          <div className="text-3xl font-bold">{todayStats.appointments}<span className="text-lg text-muted-foreground">명</span></div>
          <div className="flex items-center gap-2 mt-2">
            <span className="badge-success text-2xs">{todayStats.completed}명 완료</span>
            <span className="badge-warning text-2xs">{todayStats.waiting}명 대기</span>
          </div>
        </div>

        {/* 오늘 매출 */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">오늘 매출</span>
            <TossIcon icon={DollarSign} color="from-emerald-500 to-teal-600" size="sm" />
          </div>
          <div className="text-3xl font-bold">{(todayStats.revenue / 10000).toFixed(0)}<span className="text-lg text-muted-foreground">만원</span></div>
          <div className="flex items-center gap-1 mt-2 text-sm">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-emerald-500 font-semibold">+{todayStats.revenueChange}%</span>
            <span className="text-muted-foreground text-xs">전주 대비</span>
          </div>
        </div>

        {/* 삭감 위험 */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">삭감 위험</span>
            <TossIcon icon={AlertTriangle} color="from-amber-500 to-orange-600" size="sm" />
          </div>
          <div className="text-3xl font-bold">{todayStats.claimRisk}<span className="text-lg text-muted-foreground">건</span></div>
          <Link href="/emr/claims" className="flex items-center gap-1 mt-2 text-sm text-amber-500 font-semibold hover:underline">
            확인하기
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 미수금 */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">미수금</span>
            <TossIcon icon={Receipt} color="from-red-500 to-rose-600" size="sm" />
          </div>
          <div className="text-3xl font-bold">{(todayStats.unpaid / 10000).toFixed(0)}<span className="text-lg text-muted-foreground">만원</span></div>
          <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            평균 대기 {todayStats.avgWaitTime}분
          </div>
        </div>
      </div>

      {/* ───── 메인 그리드: 접수현황 + AI 인사이트 ───── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* 접수 현황 (2/3) */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold">접수 현황</h3>
              <span className="badge-primary text-2xs">{upcomingPatients.filter(p => p.status === 'waiting').length}명 대기</span>
            </div>
            <Link href="/emr/appointments" className="text-sm text-primary font-semibold hover:underline flex items-center gap-1">
              전체 보기
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="divide-y divide-border">
            {upcomingPatients.map((patient) => {
              const st = statusConfig[patient.status] || statusConfig.reserved
              return (
                <div key={patient.id} className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors group">
                  {/* 시간 */}
                  <div className="w-14 text-center flex-shrink-0">
                    <div className="text-sm font-bold">{patient.time}</div>
                  </div>

                  {/* 상태 */}
                  <div className={`px-2 py-1 rounded-lg text-2xs font-semibold ${st.color} ${st.bg} flex-shrink-0 w-14 text-center`}>
                    {st.label}
                  </div>

                  {/* 환자 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{patient.name}</span>
                      <span className="text-xs text-muted-foreground">{patient.age}세 {patient.gender === 'M' ? '남' : '여'}</span>
                      {patient.isNew && <span className="badge bg-primary text-white text-2xs">신환</span>}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{patient.reason}</div>
                  </div>

                  {/* 차트번호 */}
                  <div className="hidden sm:block text-xs text-muted-foreground flex-shrink-0">
                    {patient.chartNo || '-'}
                  </div>

                  {/* 진료 시작 버튼 */}
                  <Link
                    href={patient.chartNo ? `/emr/patients/${patient.id}` : '/emr/chart/new'}
                    className="btn-primary btn-sm opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  >
                    <Mic className="w-3 h-3" />
                    진료
                  </Link>
                </div>
              )
            })}
          </div>
        </div>

        {/* AI 인사이트 (1/3) */}
        <div className="space-y-6">
          {/* AI 인사이트 */}
          <div className="card">
            <div className="flex items-center gap-2 p-5 border-b border-border">
              <Brain className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold">AI 인사이트</h3>
              <Sparkles className="w-4 h-4 text-amber-400" />
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

          {/* 약국 연동 현황 */}
          <div className="card">
            <div className="flex items-center gap-2 p-5 border-b border-border">
              <Pill className="w-5 h-5 text-purple-500" />
              <h3 className="text-lg font-bold">약국 연동</h3>
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
        className="block card p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 hover:shadow-md transition-all group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TossIcon icon={BarChart3} color="from-blue-500 to-indigo-600" size="sm" />
            <div>
              <div className="font-bold text-sm">비즈니스 분석 대시보드</div>
              <div className="text-xs text-muted-foreground">매출 추이, 환자 분석, 보험 비율, 지역 벤치마크를 한눈에</div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-blue-500 group-hover:translate-x-1 transition-transform" />
        </div>
      </Link>

      {/* ───── 하단: 주간 매출 + 최근 차트 ───── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* 주간 매출 그래프 */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">이번 주 매출</h3>
            <div className="flex items-center gap-1 bg-secondary rounded-xl p-0.5">
              {(['today', 'week', 'month'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPeriod(p)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    selectedPeriod === p ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {p === 'today' ? '일' : p === 'week' ? '주' : '월'}
                </button>
              ))}
            </div>
          </div>

          {/* 막대 그래프 */}
          <div className="flex items-end gap-3 h-40">
            {weeklyRevenue.map((d, i) => {
              const height = (d.amount / maxRevenue) * 100
              const isToday = i === weeklyRevenue.length - 2 // 금요일을 오늘로 가정
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="text-2xs text-muted-foreground font-semibold">
                    {(d.amount / 10000).toFixed(0)}
                  </div>
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      isToday ? 'bg-primary' : 'bg-secondary hover:bg-primary/30'
                    }`}
                    style={{ height: `${height}%` }}
                  />
                  <div className={`text-xs ${isToday ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                    {d.day}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <div>
              <div className="text-sm text-muted-foreground">주간 합계</div>
              <div className="text-xl font-bold">
                {(weeklyRevenue.reduce((s, d) => s + d.amount, 0) / 10000).toFixed(0)}만원
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-emerald-500 font-semibold">+8.3%</span>
              <span className="text-xs text-muted-foreground">전주 대비</span>
            </div>
          </div>
        </div>

        {/* 최근 완료 차트 */}
        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h3 className="text-lg font-bold">최근 진료</h3>
            <Link href="/emr/patients" className="text-sm text-primary font-semibold hover:underline flex items-center gap-1">
              전체 보기
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="divide-y divide-border">
            {recentCharts.map((chart) => (
              <div key={chart.id} className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors">
                <div className="w-14 text-center flex-shrink-0">
                  <div className="text-sm font-medium">{chart.time}</div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{chart.patient}</div>
                  <div className="text-xs text-muted-foreground truncate">{chart.dx}</div>
                </div>

                <div className="flex-shrink-0">
                  {chart.status === 'completed' && (
                    <span className="badge-default text-2xs">완료</span>
                  )}
                  {chart.status === 'claim_ready' && (
                    <span className="badge-warning text-2xs">청구대기</span>
                  )}
                  {chart.status === 'claimed' && (
                    <span className="badge-success text-2xs">청구완료</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 오늘 요약 */}
          <div className="p-4 bg-secondary/30 rounded-b-2xl">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-primary">{todayStats.completed}</div>
                <div className="text-2xs text-muted-foreground">진료 완료</div>
              </div>
              <div>
                <div className="text-lg font-bold text-emerald-500">
                  {recentCharts.filter(c => c.status === 'claimed').length}
                </div>
                <div className="text-2xs text-muted-foreground">청구 완료</div>
              </div>
              <div>
                <div className="text-lg font-bold text-amber-500">
                  {recentCharts.filter(c => c.status === 'claim_ready').length}
                </div>
                <div className="text-2xs text-muted-foreground">청구 대기</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
