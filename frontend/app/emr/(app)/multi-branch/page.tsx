'use client'

import { useState } from 'react'
import {
  Building2,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  DollarSign,
  Users,
  BarChart3,
  Stethoscope,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  Calendar,
  Star,
  Settings,
  Plus,
  Eye,
  RefreshCw,
  Activity,
  Target,
  UserCheck,
  X,
} from 'lucide-react'

/* ─── 타입 ─── */
interface Branch {
  id: string
  name: string
  region: string
  address: string
  phone: string
  doctor: string
  specialty: string
  status: 'active' | 'preparing' | 'closed'
  monthlyRevenue: number
  revenueChange: number
  patients: number
  patientChange: number
  staffCount: number
  avgWait: number
  satisfactionScore: number
  claimRate: number
  todayPatients: number
  todayRevenue: number
}

/* ─── 더미 데이터 ─── */
const branches: Branch[] = [
  {
    id: 'BR001', name: '메디매치 내과 강남점', region: '서울 강남구', address: '서울 강남구 테헤란로 123',
    phone: '02-1234-5678', doctor: '김원장', specialty: '내과', status: 'active',
    monthlyRevenue: 8420, revenueChange: 12.4, patients: 624, patientChange: 8.2,
    staffCount: 5, avgWait: 14, satisfactionScore: 4.6, claimRate: 97.6,
    todayPatients: 28, todayRevenue: 380,
  },
  {
    id: 'BR002', name: '메디매치 내과 서초점', region: '서울 서초구', address: '서울 서초구 서초대로 456',
    phone: '02-2345-6789', doctor: '박원장', specialty: '내과', status: 'active',
    monthlyRevenue: 6850, revenueChange: 5.8, patients: 512, patientChange: 3.4,
    staffCount: 4, avgWait: 18, satisfactionScore: 4.3, claimRate: 96.2,
    todayPatients: 22, todayRevenue: 310,
  },
  {
    id: 'BR003', name: '메디매치 내과 분당점', region: '경기 성남시', address: '경기 성남시 분당구 판교로 789',
    phone: '031-345-6789', doctor: '이원장', specialty: '내과', status: 'active',
    monthlyRevenue: 5420, revenueChange: -2.1, patients: 398, patientChange: -1.5,
    staffCount: 3, avgWait: 12, satisfactionScore: 4.5, claimRate: 97.1,
    todayPatients: 18, todayRevenue: 245,
  },
  {
    id: 'BR004', name: '메디매치 내과 판교점', region: '경기 성남시', address: '경기 성남시 분당구 대왕판교로 101',
    phone: '031-456-7890', doctor: '(미정)', specialty: '내과', status: 'preparing',
    monthlyRevenue: 0, revenueChange: 0, patients: 0, patientChange: 0,
    staffCount: 0, avgWait: 0, satisfactionScore: 0, claimRate: 0,
    todayPatients: 0, todayRevenue: 0,
  },
]

const activeBranches = branches.filter(b => b.status === 'active')
const totalRevenue = activeBranches.reduce((s, b) => s + b.monthlyRevenue, 0)
const totalPatients = activeBranches.reduce((s, b) => s + b.patients, 0)
const totalTodayPatients = activeBranches.reduce((s, b) => s + b.todayPatients, 0)
const avgSatisfaction = (activeBranches.reduce((s, b) => s + b.satisfactionScore, 0) / activeBranches.length).toFixed(1)

const monthlyComparison = [
  { month: '8월', branches: [{ name: '강남', value: 7200 }, { name: '서초', value: 5800 }, { name: '분당', value: 4900 }] },
  { month: '9월', branches: [{ name: '강남', value: 7580 }, { name: '서초', value: 6100 }, { name: '분당', value: 5100 }] },
  { month: '10월', branches: [{ name: '강남', value: 7850 }, { name: '서초', value: 6300 }, { name: '분당', value: 5300 }] },
  { month: '11월', branches: [{ name: '강남', value: 7490 }, { name: '서초', value: 6400 }, { name: '분당', value: 5500 }] },
  { month: '12월', branches: [{ name: '강남', value: 8120 }, { name: '서초', value: 6600 }, { name: '분당', value: 5520 }] },
  { month: '1월', branches: [{ name: '강남', value: 8420 }, { name: '서초', value: 6850 }, { name: '분당', value: 5420 }] },
]

const patientTransfers = [
  { from: '강남점', to: '서초점', count: 12, reason: '거리/편의' },
  { from: '서초점', to: '강남점', count: 8, reason: '원장님 지명' },
  { from: '강남점', to: '분당점', count: 5, reason: '이사/거주지 변경' },
  { from: '분당점', to: '강남점', count: 3, reason: '전문 검사' },
]

export default function MultiBranchPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'compare' | 'transfer'>('overview')
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null)

  const maxRevenue = Math.max(...monthlyComparison.flatMap(m => m.branches.map(b => b.value)))

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">멀티 지점 관리</h1>
            <p className="text-sm text-muted-foreground">전체 {branches.length}개 지점 · 운영 {activeBranches.length}개</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-sm text-xs bg-indigo-600 text-white hover:bg-indigo-700">
            <Plus className="w-3.5 h-3.5" /> 지점 추가
          </button>
          <button className="btn-sm text-xs bg-secondary text-foreground">
            <RefreshCw className="w-3.5 h-3.5" /> 실시간
          </button>
        </div>
      </div>

      {/* 통합 KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" />+8.4%</span>
          </div>
          <div className="text-2xl font-bold">{(totalRevenue / 10000).toFixed(1)}억</div>
          <div className="text-xs text-muted-foreground">전 지점 월 매출</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" />+4.8%</span>
          </div>
          <div className="text-2xl font-bold">{totalPatients.toLocaleString()}명</div>
          <div className="text-xs text-muted-foreground">전 지점 월 환자</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-2xl font-bold">{totalTodayPatients}명</div>
          <div className="text-xs text-muted-foreground">오늘 전체 환자</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <Star className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-2xl font-bold">{avgSatisfaction}</div>
          <div className="text-xs text-muted-foreground">평균 만족도</div>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex items-center gap-1 border-b border-border">
        {[
          { key: 'overview', label: '지점 현황', icon: Building2 },
          { key: 'compare', label: '성과 비교', icon: BarChart3 },
          { key: 'transfer', label: '환자 이동', icon: ArrowRight },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ 지점 현황 ═══ */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {branches.map(branch => (
            <div
              key={branch.id}
              className={`card overflow-hidden ${branch.status === 'preparing' ? 'opacity-70 border-dashed' : ''}`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      branch.status === 'active' ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      <Building2 className={`w-5 h-5 ${branch.status === 'active' ? 'text-indigo-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{branch.name}</span>
                        <span className={`px-1.5 py-0.5 rounded text-2xs font-bold ${
                          branch.status === 'active' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' :
                          'bg-amber-100 text-amber-600 dark:bg-amber-900/30'
                        }`}>
                          {branch.status === 'active' ? '운영 중' : '준비 중'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-2xs text-muted-foreground mt-0.5">
                        <MapPin className="w-3 h-3" /> {branch.region}
                        <span>·</span>
                        <Stethoscope className="w-3 h-3" /> {branch.doctor}
                        <span>·</span>
                        <Users className="w-3 h-3" /> 직원 {branch.staffCount}명
                      </div>
                    </div>
                  </div>
                  <button className="btn-sm text-xs bg-secondary text-foreground">
                    <Eye className="w-3 h-3" /> 상세
                  </button>
                </div>

                {branch.status === 'active' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                    <div className="bg-secondary/30 rounded-xl p-2.5">
                      <div className="text-2xs text-muted-foreground">월 매출</div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-sm">{(branch.monthlyRevenue).toLocaleString()}만</span>
                        <span className={`text-2xs font-bold ${branch.revenueChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {branch.revenueChange >= 0 ? '+' : ''}{branch.revenueChange}%
                        </span>
                      </div>
                    </div>
                    <div className="bg-secondary/30 rounded-xl p-2.5">
                      <div className="text-2xs text-muted-foreground">월 환자</div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-sm">{branch.patients}명</span>
                        <span className={`text-2xs font-bold ${branch.patientChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {branch.patientChange >= 0 ? '+' : ''}{branch.patientChange}%
                        </span>
                      </div>
                    </div>
                    <div className="bg-secondary/30 rounded-xl p-2.5">
                      <div className="text-2xs text-muted-foreground">오늘 환자</div>
                      <span className="font-bold text-sm">{branch.todayPatients}명</span>
                    </div>
                    <div className="bg-secondary/30 rounded-xl p-2.5">
                      <div className="text-2xs text-muted-foreground">평균 대기</div>
                      <span className={`font-bold text-sm ${branch.avgWait > 15 ? 'text-amber-600' : ''}`}>{branch.avgWait}분</span>
                    </div>
                    <div className="bg-secondary/30 rounded-xl p-2.5">
                      <div className="text-2xs text-muted-foreground">만족도</div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="font-bold text-sm">{branch.satisfactionScore}</span>
                      </div>
                    </div>
                    <div className="bg-secondary/30 rounded-xl p-2.5">
                      <div className="text-2xs text-muted-foreground">청구 인정률</div>
                      <span className="font-bold text-sm">{branch.claimRate}%</span>
                    </div>
                  </div>
                )}

                {branch.status === 'preparing' && (
                  <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span className="text-xs text-amber-700 dark:text-amber-300">개원 준비 중 · 인테리어 진행 · 인력 채용 중</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ 성과 비교 ═══ */}
      {activeTab === 'compare' && (
        <div className="space-y-4">
          {/* 매출 비교 차트 */}
          <div className="card p-5">
            <h2 className="font-bold text-sm mb-4">지점별 월 매출 비교 (만원)</h2>
            <div className="flex items-center gap-3 mb-3 text-2xs">
              <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded bg-blue-500" /> 강남</span>
              <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded bg-emerald-500" /> 서초</span>
              <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded bg-purple-500" /> 분당</span>
            </div>
            <div className="space-y-3">
              {monthlyComparison.map((m, mi) => (
                <div key={mi} className="flex items-center gap-3">
                  <span className="text-2xs text-muted-foreground w-10">{m.month}</span>
                  <div className="flex-1 flex gap-1">
                    {m.branches.map((b, bi) => (
                      <div
                        key={bi}
                        className={`h-5 rounded ${bi === 0 ? 'bg-blue-500' : bi === 1 ? 'bg-emerald-500' : 'bg-purple-500'}`}
                        style={{ width: `${(b.value / maxRevenue) * 100}%` }}
                        title={`${b.name}: ${b.value.toLocaleString()}만원`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* KPI 비교 테이블 */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="font-bold text-sm">지점별 KPI 비교</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left py-3 px-4 font-semibold text-xs text-muted-foreground">지표</th>
                    {activeBranches.map(b => (
                      <th key={b.id} className="text-right py-3 px-4 font-semibold text-xs text-muted-foreground">{b.name.replace('메디매치 내과 ', '')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: '월 매출', key: 'monthlyRevenue', format: (v: number) => `${v.toLocaleString()}만` },
                    { label: '월 환자 수', key: 'patients', format: (v: number) => `${v}명` },
                    { label: '직원 수', key: 'staffCount', format: (v: number) => `${v}명` },
                    { label: '평균 대기', key: 'avgWait', format: (v: number) => `${v}분` },
                    { label: '만족도', key: 'satisfactionScore', format: (v: number) => `${v}점` },
                    { label: '청구 인정률', key: 'claimRate', format: (v: number) => `${v}%` },
                  ].map((row, i) => {
                    const values = activeBranches.map(b => b[row.key as keyof Branch] as number)
                    const maxVal = Math.max(...values)
                    return (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-2.5 px-4 text-xs font-medium">{row.label}</td>
                        {activeBranches.map((b, bi) => {
                          const val = b[row.key as keyof Branch] as number
                          const isBest = val === maxVal && val > 0
                          return (
                            <td key={b.id} className={`py-2.5 px-4 text-xs text-right ${isBest ? 'font-bold text-blue-600' : ''}`}>
                              {row.format(val)}
                              {isBest && <span className="ml-1 text-2xs">👑</span>}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI 인사이트 */}
          <div className="card p-5">
            <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-600" /> AI 지점 분석
            </h2>
            <div className="space-y-2">
              {[
                { text: '서초점의 대기시간(18분)이 강남점(14분) 대비 길어 만족도 차이(0.3점)의 주요 원인입니다.', type: 'warning' as const },
                { text: '분당점 매출이 2개월 연속 하락(-2.1%). 인근 경쟁 의원 개원 영향 분석이 필요합니다.', type: 'warning' as const },
                { text: '강남점의 건강검진 매출 비중이 타 지점 대비 15%p 높습니다. 서초/분당점에도 건진 패키지 도입을 권고합니다.', type: 'tip' as const },
              ].map((insight, i) => (
                <div key={i} className={`flex items-start gap-2 p-3 rounded-xl ${
                  insight.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/10' : 'bg-blue-50 dark:bg-blue-900/10'
                }`}>
                  {insight.type === 'warning' ? <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />}
                  <p className={`text-xs ${insight.type === 'warning' ? 'text-amber-700 dark:text-amber-300' : 'text-blue-700 dark:text-blue-300'}`}>{insight.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ 환자 이동 ═══ */}
      {activeTab === 'transfer' && (
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-indigo-600" /> 지점 간 환자 이동 현황
            </h2>
            <p className="text-xs text-muted-foreground mb-4">최근 3개월 간 다른 지점으로 이동한 환자 현황</p>

            <div className="space-y-3">
              {patientTransfers.map((transfer, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-secondary/30 rounded-xl">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-xs font-bold text-blue-600">{transfer.from}</div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <div className="px-3 py-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-xs font-bold text-indigo-600">{transfer.to}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">{transfer.count}명</div>
                    <div className="text-2xs text-muted-foreground">{transfer.reason}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl p-3 flex items-start gap-2">
              <UserCheck className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-indigo-700 dark:text-indigo-300">
                지점 간 환자 이동을 통해 환자가 이탈하지 않고 네트워크 내에 유지됩니다.
                강남↔서초 간 이동이 가장 활발하며, 주로 거리/편의와 원장님 선호도가 이유입니다.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
