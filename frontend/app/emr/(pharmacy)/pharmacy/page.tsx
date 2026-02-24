'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  FileText,
  Package,
  DollarSign,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Pill,
  Users,
  Building2,
  Zap,
  Bell,
  BarChart3,
  Activity,
  ArrowRight,
  Brain,
  Sparkles,
  Timer,
  RefreshCw,
  ShoppingCart,
  Calendar,
} from 'lucide-react'
import { TossIcon } from '@/components/ui/TossIcon'

/* ─── 더미 데이터 ─── */
const todayStats = {
  prescriptions: 47,
  completed: 38,
  inProgress: 3,
  pending: 6,
  revenue: 3150000,
  revenueChange: 8.2,
  avgDispenseTime: 4.2,
  durAlerts: 1,
}

const recentPrescriptions = [
  { id: 1, time: '14:05', patient: '김영수', age: 45, clinic: '메디매치내과', doctor: '김원장', drugs: 2, status: 'pending', urgent: false },
  { id: 2, time: '13:58', patient: '이미경', age: 33, clinic: '메디매치내과', doctor: '김원장', drugs: 4, status: 'dispensing', urgent: false },
  { id: 3, time: '13:45', patient: '박준호', age: 28, clinic: '하나이비인후과', doctor: '이원장', drugs: 3, status: 'dispensing', urgent: false },
  { id: 4, time: '13:32', patient: '최은지', age: 52, clinic: '메디매치내과', doctor: '김원장', drugs: 5, status: 'completed', urgent: false },
  { id: 5, time: '13:20', patient: '정대현', age: 67, clinic: '강남정형외과', doctor: '박원장', drugs: 3, status: 'completed', urgent: false },
  { id: 6, time: '13:10', patient: '한소영', age: 41, clinic: '메디매치내과', doctor: '김원장', drugs: 2, status: 'completed', urgent: false },
]

const linkedClinics = [
  { name: '메디매치 내과의원', doctor: '김원장', todayRx: 22, status: 'online' },
  { name: '하나 이비인후과', doctor: '이원장', todayRx: 15, status: 'online' },
  { name: '강남 정형외과', doctor: '박원장', todayRx: 10, status: 'online' },
]

const inventoryAlerts = [
  { drug: '아목시실린 500mg', current: 12, minimum: 30, type: 'low' as const },
  { drug: '이부프로펜 200mg', current: 8, minimum: 50, type: 'critical' as const },
  { drug: '오메프라졸 20mg', expiry: '2025-03-15', type: 'expiry' as const },
]

const aiInsights = [
  { icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', text: '감기약 처방 40% 증가 추세 — 재고 확보 추천', action: '주문하기' },
  { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', text: '오후 2~4시 처방 집중 — 인력 배치 조정 추천', action: '확인' },
  { icon: ShoppingCart, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: '이부프로펜 도매가 5% 인하 — 대량 주문 적기', action: '주문하기' },
]

const weeklyRevenue = [
  { day: '월', amount: 2800000, count: 42 },
  { day: '화', amount: 3200000, count: 48 },
  { day: '수', amount: 2950000, count: 45 },
  { day: '목', amount: 3400000, count: 52 },
  { day: '금', amount: 3150000, count: 47 },
  { day: '토', amount: 1800000, count: 28 },
]

const statusMap: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending: { label: '수신', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', dot: 'bg-blue-500 animate-pulse' },
  dispensing: { label: '조제중', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', dot: 'bg-amber-500 animate-pulse' },
  completed: { label: '완료', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', dot: 'bg-emerald-500' },
  dur_alert: { label: 'DUR주의', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', dot: 'bg-red-500 animate-pulse' },
}

export default function PharmacyDashboardPage() {
  const maxRevenue = Math.max(...weeklyRevenue.map(d => d.amount))
  const now = new Date()
  const greeting = now.getHours() < 12 ? '좋은 아침이에요' : now.getHours() < 18 ? '좋은 오후예요' : '수고 많으셨어요'

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* 인사 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{greeting}, <span className="text-purple-500">박약사님</span></h1>
          <p className="text-muted-foreground mt-1">{now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/emr/pharmacy/prescriptions" className="btn-sm" style={{ backgroundColor: 'rgb(168 85 247)', color: 'white' }}>
            <FileText className="w-4 h-4" />
            처방전 수신함
            <span className="badge bg-white/20 text-white text-2xs">{todayStats.pending}</span>
          </Link>
          <Link href="/emr/pharmacy/inventory" className="btn-secondary btn-sm">
            <Package className="w-4 h-4" />
            재고 관리
          </Link>
        </div>
      </div>

      {/* 핵심 지표 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">오늘 처방</span>
            <TossIcon icon={FileText} color="from-purple-500 to-violet-600" size="sm" />
          </div>
          <div className="text-3xl font-bold">{todayStats.prescriptions}<span className="text-lg text-muted-foreground">건</span></div>
          <div className="flex items-center gap-2 mt-2">
            <span className="badge-success text-2xs">{todayStats.completed} 완료</span>
            <span className="badge-warning text-2xs">{todayStats.inProgress} 조제중</span>
            <span className="badge-info text-2xs">{todayStats.pending} 대기</span>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">오늘 매출</span>
            <TossIcon icon={DollarSign} color="from-emerald-500 to-teal-600" size="sm" />
          </div>
          <div className="text-3xl font-bold">{(todayStats.revenue / 10000).toFixed(0)}<span className="text-lg text-muted-foreground">만원</span></div>
          <div className="flex items-center gap-1 mt-2 text-sm">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-emerald-500 font-semibold">+{todayStats.revenueChange}%</span>
            <span className="text-xs text-muted-foreground">전주 대비</span>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">평균 조제시간</span>
            <TossIcon icon={Timer} color="from-blue-500 to-indigo-600" size="sm" />
          </div>
          <div className="text-3xl font-bold">{todayStats.avgDispenseTime}<span className="text-lg text-muted-foreground">분</span></div>
          <div className="flex items-center gap-1 mt-2 text-sm">
            <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-emerald-500 font-semibold">-0.8분</span>
            <span className="text-xs text-muted-foreground">전월 대비</span>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">DUR 경고</span>
            <TossIcon icon={AlertTriangle} color="from-red-500 to-rose-600" size="sm" />
          </div>
          <div className="text-3xl font-bold">{todayStats.durAlerts}<span className="text-lg text-muted-foreground">건</span></div>
          <Link href="/emr/pharmacy/prescriptions" className="flex items-center gap-1 mt-2 text-sm text-red-500 font-semibold hover:underline">
            확인하기 <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 메인: 처방전 현황 + 사이드 */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* 실시간 처방전 현황 */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold">실시간 처방전</h3>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-muted-foreground">실시간</span>
            </div>
            <Link href="/emr/pharmacy/prescriptions" className="text-sm text-purple-500 font-semibold hover:underline flex items-center gap-1">
              전체 보기 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="divide-y divide-border">
            {recentPrescriptions.map((rx) => {
              const st = statusMap[rx.status]
              return (
                <div key={rx.id} className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors group">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${st.dot}`} />
                  <div className="w-12 text-center flex-shrink-0">
                    <div className="text-sm font-bold">{rx.time}</div>
                  </div>
                  <div className={`px-2.5 py-1 rounded-lg text-2xs font-semibold ${st.color} ${st.bg} flex-shrink-0 w-16 text-center`}>
                    {st.label}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{rx.patient}</span>
                      <span className="text-xs text-muted-foreground">{rx.age}세</span>
                      <span className="text-2xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{rx.drugs}종</span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{rx.clinic} · {rx.doctor}</div>
                  </div>
                  {rx.status === 'pending' && (
                    <button className="btn-sm text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: 'rgb(168 85 247)', color: 'white' }}>
                      조제 시작
                    </button>
                  )}
                  {rx.status === 'dispensing' && (
                    <button className="btn-primary btn-sm text-xs opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-500 hover:bg-emerald-600">
                      <CheckCircle2 className="w-3 h-3" />
                      완료
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* 사이드 패널 */}
        <div className="space-y-6">
          {/* 연동 의원 현황 */}
          <div className="card">
            <div className="flex items-center gap-2 p-5 border-b border-border">
              <Zap className="w-5 h-5 text-purple-500" />
              <h3 className="font-bold">연동 의원</h3>
            </div>
            <div className="p-3 space-y-2">
              {linkedClinics.map((clinic, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${clinic.status === 'online' ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{clinic.name}</div>
                    <div className="text-2xs text-muted-foreground">{clinic.doctor}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold text-purple-500">{clinic.todayRx}</div>
                    <div className="text-2xs text-muted-foreground">오늘 처방</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI 인사이트 */}
          <div className="card">
            <div className="flex items-center gap-2 p-5 border-b border-border">
              <Brain className="w-5 h-5 text-purple-500" />
              <h3 className="font-bold">AI 인사이트</h3>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="p-3 space-y-2">
              {aiInsights.map((insight, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${insight.bg}`}>
                  <insight.icon className={`w-4 h-4 ${insight.color} flex-shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs leading-relaxed">{insight.text}</div>
                    <button className="text-2xs text-purple-500 font-semibold mt-1 hover:underline">{insight.action} →</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 재고 알림 */}
          <div className="card">
            <div className="flex items-center gap-2 p-5 border-b border-border">
              <Package className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold">재고 알림</h3>
              <span className="badge-warning text-2xs ml-auto">{inventoryAlerts.length}</span>
            </div>
            <div className="p-3 space-y-2">
              {inventoryAlerts.map((alert, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${
                  alert.type === 'critical' ? 'bg-red-50 dark:bg-red-900/20' :
                  alert.type === 'low' ? 'bg-amber-50 dark:bg-amber-900/20' :
                  'bg-blue-50 dark:bg-blue-900/20'
                }`}>
                  <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${
                    alert.type === 'critical' ? 'text-red-500' : alert.type === 'low' ? 'text-amber-500' : 'text-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{alert.drug}</div>
                    <div className="text-2xs text-muted-foreground">
                      {alert.type === 'expiry'
                        ? `유효기간 ${alert.expiry}`
                        : `현재 ${alert.current}개 / 최소 ${alert.minimum}개`}
                    </div>
                  </div>
                  <button className="text-2xs font-semibold text-purple-500 hover:underline flex-shrink-0">
                    {alert.type === 'expiry' ? '확인' : '주문'}
                  </button>
                </div>
              ))}
              <Link href="/emr/pharmacy/inventory" className="block text-center text-xs text-muted-foreground hover:text-foreground pt-2">
                전체 재고 관리 →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 하단: 주간 매출 */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">이번 주 현황</h3>
          <Link href="/emr/pharmacy/analytics" className="text-sm text-purple-500 font-semibold hover:underline flex items-center gap-1">
            상세 분석 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="flex items-end gap-4 h-40">
          {weeklyRevenue.map((d, i) => {
            const height = (d.amount / maxRevenue) * 100
            const isToday = i === weeklyRevenue.length - 2
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="text-2xs text-muted-foreground">{d.count}건</div>
                <div className="text-2xs text-muted-foreground font-semibold">{(d.amount / 10000).toFixed(0)}</div>
                <div
                  className={`w-full rounded-t-lg transition-all duration-500 ${isToday ? 'bg-purple-500' : 'bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50'}`}
                  style={{ height: `${height}%` }}
                />
                <div className={`text-xs ${isToday ? 'font-bold text-purple-500' : 'text-muted-foreground'}`}>{d.day}</div>
              </div>
            )
          })}
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <div>
            <div className="text-sm text-muted-foreground">주간 합계</div>
            <div className="text-xl font-bold">{(weeklyRevenue.reduce((s, d) => s + d.amount, 0) / 10000).toFixed(0)}만원 · {weeklyRevenue.reduce((s, d) => s + d.count, 0)}건</div>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-emerald-500 font-semibold">+5.4%</span>
            <span className="text-xs text-muted-foreground">전주 대비</span>
          </div>
        </div>
      </div>
    </div>
  )
}
