'use client'

import { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  Building2,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Server,
  Shield,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  Pill,
  Star,
  BarChart3,
  Bell,
  FileText,
  Settings,
  Eye,
  MessageSquare,
  Zap,
  Globe,
  Database,
  Cpu,
  HardDrive,
  Wifi,
  X,
  Plus,
  RefreshCw,
} from 'lucide-react'

/* ─── 타입 ─── */
type FacilityType = 'clinic' | 'pharmacy'
type PlanType = 'starter' | 'clinic' | 'clinic_pro' | 'pharmacy'
type FacilityStatus = 'active' | 'trial' | 'suspended' | 'churned'

interface Facility {
  id: string
  name: string
  type: FacilityType
  plan: PlanType
  status: FacilityStatus
  region: string
  joinDate: string
  lastActive: string
  users: number
  monthlyRevenue: number
  specialty?: string
}

/* ─── 더미 데이터 ─── */
const platformKpis = [
  { label: '총 가입 기관', value: '3,247', change: '+124', positive: true, icon: Building2, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' },
  { label: '활성 사용자', value: '8,952', change: '+342', positive: true, icon: Users, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' },
  { label: '월 구독 매출', value: '4.82억', change: '+18.7%', positive: true, icon: DollarSign, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30' },
  { label: '이탈률', value: '2.1%', change: '-0.3%p', positive: true, icon: Activity, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' },
]

const facilityBreakdown = {
  clinics: { total: 2397, trial: 312, starter: 480, paid: 1605 },
  pharmacies: { total: 850, trial: 95, starter: 180, paid: 575 },
}

const facilities: Facility[] = [
  { id: 'F001', name: '메디매치 내과의원', type: 'clinic', plan: 'clinic_pro', status: 'active', region: '서울 강남구', joinDate: '2023-08-15', lastActive: '2분 전', users: 5, monthlyRevenue: 290000, specialty: '내과' },
  { id: 'F002', name: '서울정형외과의원', type: 'clinic', plan: 'clinic', status: 'active', region: '서울 서초구', joinDate: '2023-10-02', lastActive: '15분 전', users: 4, monthlyRevenue: 190000, specialty: '정형외과' },
  { id: 'F003', name: '메디매치 온누리약국', type: 'pharmacy', plan: 'pharmacy', status: 'active', region: '서울 강남구', joinDate: '2023-08-20', lastActive: '5분 전', users: 3, monthlyRevenue: 90000 },
  { id: 'F004', name: '참좋은소아과의원', type: 'clinic', plan: 'clinic_pro', status: 'active', region: '경기 성남시', joinDate: '2023-11-10', lastActive: '30분 전', users: 6, monthlyRevenue: 290000, specialty: '소아과' },
  { id: 'F005', name: '건강한약국', type: 'pharmacy', plan: 'pharmacy', status: 'active', region: '서울 강남구', joinDate: '2023-12-05', lastActive: '1시간 전', users: 2, monthlyRevenue: 90000 },
  { id: 'F006', name: '밝은눈안과의원', type: 'clinic', plan: 'starter', status: 'trial', region: '서울 마포구', joinDate: '2024-01-10', lastActive: '3시간 전', users: 2, monthlyRevenue: 0, specialty: '안과' },
  { id: 'F007', name: '미래이비인후과', type: 'clinic', plan: 'clinic', status: 'active', region: '부산 해운대구', joinDate: '2023-09-18', lastActive: '20분 전', users: 3, monthlyRevenue: 190000, specialty: '이비인후과' },
  { id: 'F008', name: '행복한의원', type: 'clinic', plan: 'clinic', status: 'suspended', region: '대구 수성구', joinDate: '2023-07-25', lastActive: '15일 전', users: 3, monthlyRevenue: 0, specialty: '가정의학과' },
]

const recentTickets = [
  { id: 'TK-042', facility: '서울정형외과의원', title: '처방전 전송 오류', priority: 'high' as const, time: '2시간 전' },
  { id: 'TK-041', facility: '메디매치 온누리약국', title: '재고 연동 문의', priority: 'medium' as const, time: '4시간 전' },
  { id: 'TK-040', facility: '참좋은소아과의원', title: '직원 계정 추가 문의', priority: 'low' as const, time: '6시간 전' },
]

const systemStatus = [
  { name: 'API 서버', status: 'healthy' as const, uptime: '99.98%', latency: '42ms' },
  { name: '데이터베이스', status: 'healthy' as const, uptime: '99.99%', latency: '8ms' },
  { name: 'AI 엔진', status: 'healthy' as const, uptime: '99.95%', latency: '120ms' },
  { name: '약국 브릿지', status: 'warning' as const, uptime: '99.82%', latency: '85ms' },
  { name: '파일 스토리지', status: 'healthy' as const, uptime: '99.99%', latency: '15ms' },
]

const monthlyRevenueData = [
  { month: '8월', revenue: 3.2 },
  { month: '9월', revenue: 3.5 },
  { month: '10월', revenue: 3.8 },
  { month: '11월', revenue: 4.1 },
  { month: '12월', revenue: 4.5 },
  { month: '1월', revenue: 4.82 },
]

const planConfig: Record<PlanType, { label: string; color: string }> = {
  starter: { label: 'Starter', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800' },
  clinic: { label: 'Clinic', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' },
  clinic_pro: { label: 'Clinic Pro', color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30' },
  pharmacy: { label: 'Pharmacy', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' },
}

const statusBadge: Record<FacilityStatus, { label: string; color: string }> = {
  active: { label: '활성', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
  trial: { label: '체험', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
  suspended: { label: '정지', color: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
  churned: { label: '해지', color: 'text-gray-400 bg-gray-50 dark:bg-gray-800' },
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'facilities' | 'system'>('overview')
  const [facilityFilter, setFacilityFilter] = useState<'all' | FacilityType>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const maxRevenue = Math.max(...monthlyRevenueData.map(d => d.revenue))

  const filteredFacilities = facilities.filter(f => {
    if (facilityFilter !== 'all' && f.type !== facilityFilter) return false
    if (searchQuery && !f.name.includes(searchQuery) && !f.region.includes(searchQuery)) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">플랫폼 관리자</h1>
            <p className="text-sm text-muted-foreground">MediMatch EMR SaaS 운영 대시보드</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            시스템 정상
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {platformKpis.map((kpi, i) => (
          <div key={i} className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${kpi.color} flex items-center justify-center`}>
                <kpi.icon className="w-5 h-5" />
              </div>
              <div className={`flex items-center gap-0.5 text-xs font-bold ${kpi.positive ? 'text-emerald-600' : 'text-red-500'}`}>
                {kpi.positive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {kpi.change}
              </div>
            </div>
            <div className="text-2xl font-bold">{kpi.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* 탭 */}
      <div className="flex items-center gap-1 border-b border-border">
        {[
          { key: 'overview', label: '개요', icon: BarChart3 },
          { key: 'facilities', label: '가입 기관', icon: Building2 },
          { key: 'system', label: '시스템', icon: Server },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ 개요 ═══ */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 구독 매출 추이 */}
            <div className="card p-5">
              <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" /> 월간 구독 매출 추이
              </h2>
              <div className="flex items-end gap-3 h-40">
                {monthlyRevenueData.map((d, i) => {
                  const height = (d.revenue / maxRevenue) * 100
                  const isLatest = i === monthlyRevenueData.length - 1
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-2xs font-bold">{d.revenue}억</span>
                      <div
                        className={`w-full rounded-t-lg ${isLatest ? 'bg-blue-500' : 'bg-blue-200 dark:bg-blue-800/40'}`}
                        style={{ height: `${height}%` }}
                      />
                      <span className={`text-2xs ${isLatest ? 'font-bold text-blue-600' : 'text-muted-foreground'}`}>{d.month}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 기관 구성 */}
            <div className="card p-5">
              <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-600" /> 가입 기관 현황
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold">의원</span>
                    </div>
                    <span className="text-sm font-bold">{facilityBreakdown.clinics.total.toLocaleString()}곳</span>
                  </div>
                  <div className="flex h-4 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <div className="bg-blue-500" style={{ width: `${(facilityBreakdown.clinics.paid / facilityBreakdown.clinics.total) * 100}%` }} title="유료" />
                    <div className="bg-blue-300" style={{ width: `${(facilityBreakdown.clinics.starter / facilityBreakdown.clinics.total) * 100}%` }} title="무료" />
                    <div className="bg-blue-100" style={{ width: `${(facilityBreakdown.clinics.trial / facilityBreakdown.clinics.total) * 100}%` }} title="체험" />
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-2xs text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> 유료 {facilityBreakdown.clinics.paid}</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-300" /> 무료 {facilityBreakdown.clinics.starter}</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-100" /> 체험 {facilityBreakdown.clinics.trial}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Pill className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-semibold">약국</span>
                    </div>
                    <span className="text-sm font-bold">{facilityBreakdown.pharmacies.total.toLocaleString()}곳</span>
                  </div>
                  <div className="flex h-4 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <div className="bg-purple-500" style={{ width: `${(facilityBreakdown.pharmacies.paid / facilityBreakdown.pharmacies.total) * 100}%` }} />
                    <div className="bg-purple-300" style={{ width: `${(facilityBreakdown.pharmacies.starter / facilityBreakdown.pharmacies.total) * 100}%` }} />
                    <div className="bg-purple-100" style={{ width: `${(facilityBreakdown.pharmacies.trial / facilityBreakdown.pharmacies.total) * 100}%` }} />
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-2xs text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> 유료 {facilityBreakdown.pharmacies.paid}</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-300" /> 무료 {facilityBreakdown.pharmacies.starter}</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-100" /> 체험 {facilityBreakdown.pharmacies.trial}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 최근 문의 + 플랜별 분포 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-600" /> 최근 고객 문의
                </h2>
                <button className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
                  전체 보기 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-3">
                {recentTickets.map(ticket => (
                  <div key={ticket.id} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      ticket.priority === 'high' ? 'bg-red-500' : ticket.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium truncate">{ticket.title}</span>
                        <span className="text-2xs text-muted-foreground">{ticket.id}</span>
                      </div>
                      <div className="text-2xs text-muted-foreground">{ticket.facility} · {ticket.time}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-emerald-600" /> 주요 지표
              </h2>
              <div className="space-y-3">
                {[
                  { label: '전환율 (체험→유료)', value: '34.2%', change: '+2.1%p', positive: true },
                  { label: '평균 고객 수명 (LTV)', value: '18.4개월', change: '+1.2개월', positive: true },
                  { label: 'ARPU', value: '14.8만원', change: '+3.2%', positive: true },
                  { label: 'DAU/MAU', value: '72.4%', change: '+1.8%p', positive: true },
                  { label: 'NPS 점수', value: '67', change: '+4', positive: true },
                ].map((m, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{m.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{m.value}</span>
                      <span className={`text-2xs font-bold ${m.positive ? 'text-emerald-600' : 'text-red-500'}`}>{m.change}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ 가입 기관 ═══ */}
      {activeTab === 'facilities' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="기관명, 지역 검색..."
                className="input pl-10 text-sm"
              />
            </div>
            <div className="flex items-center gap-1">
              {[
                { key: 'all', label: '전체' },
                { key: 'clinic', label: '의원' },
                { key: 'pharmacy', label: '약국' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFacilityFilter(f.key as typeof facilityFilter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    facilityFilter === f.key ? 'bg-blue-600 text-white' : 'text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left py-3 px-4 font-semibold text-xs text-muted-foreground">기관명</th>
                    <th className="text-left py-3 px-4 font-semibold text-xs text-muted-foreground">유형</th>
                    <th className="text-left py-3 px-4 font-semibold text-xs text-muted-foreground">플랜</th>
                    <th className="text-left py-3 px-4 font-semibold text-xs text-muted-foreground">상태</th>
                    <th className="text-left py-3 px-4 font-semibold text-xs text-muted-foreground">지역</th>
                    <th className="text-right py-3 px-4 font-semibold text-xs text-muted-foreground">사용자</th>
                    <th className="text-right py-3 px-4 font-semibold text-xs text-muted-foreground">월 매출</th>
                    <th className="text-left py-3 px-4 font-semibold text-xs text-muted-foreground">최근 활동</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFacilities.map(f => {
                    const plan = planConfig[f.plan]
                    const status = statusBadge[f.status]
                    return (
                      <tr key={f.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors cursor-pointer">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              f.type === 'clinic' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-purple-100 dark:bg-purple-900/30'
                            }`}>
                              {f.type === 'clinic' ? <Stethoscope className="w-4 h-4 text-blue-600" /> : <Pill className="w-4 h-4 text-purple-600" />}
                            </div>
                            <div>
                              <span className="font-medium text-xs">{f.name}</span>
                              {f.specialty && <span className="text-2xs text-muted-foreground ml-1">({f.specialty})</span>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">{f.type === 'clinic' ? '의원' : '약국'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-lg text-2xs font-bold ${plan.color}`}>{plan.label}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-lg text-2xs font-bold ${status.color}`}>{status.label}</span>
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">{f.region}</td>
                        <td className="py-3 px-4 text-xs text-right">{f.users}명</td>
                        <td className="py-3 px-4 text-xs text-right font-medium">
                          {f.monthlyRevenue > 0 ? `${(f.monthlyRevenue / 10000).toFixed(0)}만원` : '-'}
                        </td>
                        <td className="py-3 px-4 text-2xs text-muted-foreground">{f.lastActive}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ 시스템 ═══ */}
      {activeTab === 'system' && (
        <div className="space-y-4">
          {/* 시스템 상태 */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-600" /> 시스템 상태
              </h2>
              <span className="text-2xs text-muted-foreground">마지막 확인: 방금</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {systemStatus.map((sys, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${
                  sys.status === 'healthy' ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/5' :
                  'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/5'
                }`}>
                  <div className={`w-3 h-3 rounded-full ${
                    sys.status === 'healthy' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">{sys.name}</span>
                      <span className={`text-2xs font-bold ${sys.status === 'healthy' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {sys.status === 'healthy' ? '정상' : '주의'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-2xs text-muted-foreground mt-0.5">
                      <span>가동률 {sys.uptime}</span>
                      <span>·</span>
                      <span>응답 {sys.latency}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 인프라 메트릭 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'CPU 사용률', value: '34%', icon: Cpu, color: 'text-blue-600', barWidth: 34 },
              { label: '메모리 사용률', value: '62%', icon: Database, color: 'text-purple-600', barWidth: 62 },
              { label: '디스크 사용률', value: '48%', icon: HardDrive, color: 'text-amber-600', barWidth: 48 },
              { label: '네트워크 I/O', value: '1.2 Gbps', icon: Wifi, color: 'text-emerald-600', barWidth: 45 },
            ].map((m, i) => (
              <div key={i} className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <m.icon className={`w-4 h-4 ${m.color}`} />
                  <span className="text-xs text-muted-foreground">{m.label}</span>
                </div>
                <div className="text-lg font-bold mb-2">{m.value}</div>
                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      m.barWidth > 80 ? 'bg-red-500' : m.barWidth > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${m.barWidth}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* 공지사항 관리 */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-600" /> 공지사항
              </h2>
              <button className="btn-sm text-xs bg-blue-600 text-white hover:bg-blue-700">
                <Plus className="w-3 h-3" /> 새 공지
              </button>
            </div>
            <div className="space-y-2">
              {[
                { title: '2024년 4월 수가 개정 반영 안내', date: '2024-01-20', target: '전체' },
                { title: '시스템 정기 점검 안내 (1/25 02:00~04:00)', date: '2024-01-18', target: '전체' },
                { title: 'AI 청구 방어 v2.4.1 업데이트', date: '2024-01-15', target: '의원' },
              ].map((notice, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl hover:bg-secondary/50 transition-colors cursor-pointer">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1">
                    <span className="text-xs font-medium">{notice.title}</span>
                    <div className="text-2xs text-muted-foreground mt-0.5">
                      {notice.date} · 대상: {notice.target}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
