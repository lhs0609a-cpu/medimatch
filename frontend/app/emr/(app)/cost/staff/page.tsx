'use client'

import { useState } from 'react'
import {
  Users2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Shield,
  Brain,
  BarChart3,
  UserCheck,
  Clock,
  Lightbulb,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react'

/* ─── 탭 정의 ─── */
type TabKey = 'trend' | 'breakdown' | 'insurance' | 'benchmark' | 'ai'

const tabs: { key: TabKey; label: string; icon: typeof BarChart3 }[] = [
  { key: 'trend', label: '월별 추이', icon: BarChart3 },
  { key: 'breakdown', label: '직원별 분석', icon: Users2 },
  { key: 'insurance', label: '4대보험 최적화', icon: Shield },
  { key: 'benchmark', label: '벤치마크', icon: TrendingUp },
  { key: 'ai', label: 'AI 권고', icon: Brain },
]

/* ─── 데모 데이터 ─── */
const kpi = {
  totalCost: 28_450_000,
  changePct: -2.3,
  revenueRatio: 29.6,
  insuranceTotal: 4_120_000,
  employeeCount: 6,
}

const monthlyTrend = [
  { month: '3월', base: 18_200_000, overtime: 1_800_000, insurance: 3_950_000, total: 26_500_000 },
  { month: '4월', base: 18_500_000, overtime: 2_100_000, insurance: 4_000_000, total: 27_200_000 },
  { month: '5월', base: 18_400_000, overtime: 1_600_000, insurance: 3_980_000, total: 26_800_000 },
  { month: '6월', base: 18_600_000, overtime: 2_300_000, insurance: 4_050_000, total: 27_800_000 },
  { month: '7월', base: 18_700_000, overtime: 1_900_000, insurance: 4_080_000, total: 27_500_000 },
  { month: '8월', base: 18_500_000, overtime: 2_000_000, insurance: 4_020_000, total: 27_300_000 },
  { month: '9월', base: 18_800_000, overtime: 1_700_000, insurance: 4_100_000, total: 27_600_000 },
  { month: '10월', base: 19_000_000, overtime: 2_200_000, insurance: 4_120_000, total: 28_100_000 },
  { month: '11월', base: 19_100_000, overtime: 1_500_000, insurance: 4_130_000, total: 27_800_000 },
  { month: '12월', base: 19_200_000, overtime: 2_400_000, insurance: 4_150_000, total: 29_100_000 },
  { month: '1월', base: 19_300_000, overtime: 1_800_000, insurance: 4_100_000, total: 29_000_000 },
  { month: '2월', base: 19_100_000, overtime: 1_600_000, insurance: 4_120_000, total: 28_450_000 },
]

const employees = [
  { name: '김원장', type: 'DOCTOR', empType: '정규직', base: 8_000_000, overtime: 0, insurance: 1_420_000, total: 10_200_000, share: 35.8 },
  { name: '이간호사', type: 'NURSE', empType: '정규직', base: 3_200_000, overtime: 380_000, insurance: 580_000, total: 4_480_000, share: 15.7 },
  { name: '박간호사', type: 'NURSE', empType: '정규직', base: 3_000_000, overtime: 250_000, insurance: 540_000, total: 4_120_000, share: 14.5 },
  { name: '정방사선', type: 'TECH', empType: '정규직', base: 3_100_000, overtime: 420_000, insurance: 560_000, total: 4_450_000, share: 15.6 },
  { name: '최데스크', type: 'ADMIN', empType: '정규직', base: 2_800_000, overtime: 180_000, insurance: 500_000, total: 3_700_000, share: 13.0 },
  { name: '한파트', type: 'NURSE', empType: '파트타임', base: 1_800_000, overtime: 0, insurance: 320_000, total: 2_200_000, share: 7.7 },
]

const insuranceItems = [
  { name: '국민연금', current: 1_620_000, optimal: 1_520_000, savings: 100_000, note: '두루누리 지원 대상 확인' },
  { name: '건강보험', current: 1_240_000, optimal: 1_200_000, savings: 40_000, note: '보수월액 재산정' },
  { name: '고용보험', current: 680_000, optimal: 620_000, savings: 60_000, note: '지원금 활용 가능' },
  { name: '산재보험', current: 580_000, optimal: 540_000, savings: 40_000, note: '업종 재분류 검토' },
]

const benchmarkData = [
  { name: '총인건비', my: 28_450_000, avg: 30_700_000 },
  { name: '기본급', my: 19_100_000, avg: 21_000_000 },
  { name: '야근수당', my: 1_600_000, avg: 1_280_000 },
  { name: '4대보험', my: 4_120_000, avg: 4_330_000 },
  { name: '복리후생', my: 1_200_000, avg: 1_440_000 },
]

const aiRecommendations = [
  { id: 1, title: '야근수당 절감', priority: 'HIGH', savings: 450_000, desc: '최근 3개월 평균 야근시간이 월 20시간을 초과합니다. 업무 프로세스 개선으로 월 45만원 절감이 가능합니다.', actions: ['진료 예약 시스템 최적화', '행정 업무 자동화 도입 검토', '파트타임 간호사 추가 고용 비교분석'] },
  { id: 2, title: '파트타임 전환 검토', priority: 'MEDIUM', savings: 800_000, desc: '오후 진료 시간대 환자 수가 적은 요일에 파트타임 전환 시 4대보험료 포함 월 80만원 절감이 가능합니다.', actions: ['요일별/시간대별 환자 수 분석', '파트타임 전환 대상 직원 선정', '근로계약 변경 법률 검토'] },
  { id: 3, title: '4대보험 최적화', priority: 'MEDIUM', savings: 320_000, desc: '두루누리 사회보험료 지원사업 대상 직원이 있습니다. 신청 시 월 32만원 절감이 가능합니다.', actions: ['두루누리 지원 대상 확인', '고용보험 요율 재확인', '산재보험 업종 분류 적정성 검토'] },
]

const typeColors: Record<string, string> = {
  DOCTOR: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  NURSE: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  ADMIN: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  TECH: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
}
const typeLabels: Record<string, string> = { DOCTOR: '의사', NURSE: '간호사', ADMIN: '행정', TECH: '기사' }
const priorityColors: Record<string, string> = {
  HIGH: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  MEDIUM: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  LOW: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
}

function fmt(n: number) { return n.toLocaleString() + '원' }
function fmtMan(n: number) { return (n / 10000).toFixed(0) + '만' }

export default function StaffCostPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('trend')
  const maxTotal = Math.max(...monthlyTrend.map(m => m.total))

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold">인건비 최적화</h1>
        <p className="text-sm text-muted-foreground mt-1">직원별 급여/4대보험/복리후생을 분석하고 절감 기회를 발견합니다</p>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-primary" />
            <span className="text-xs text-muted-foreground">총 인건비</span>
          </div>
          <div className="text-2xl font-bold">{fmtMan(kpi.totalCost)}</div>
          <div className={`text-xs mt-1 flex items-center gap-1 ${kpi.changePct < 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {kpi.changePct < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
            전월 대비 {Math.abs(kpi.changePct)}%
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <span className="text-xs text-muted-foreground">매출 대비</span>
          </div>
          <div className="text-2xl font-bold">{kpi.revenueRatio}%</div>
          <div className="text-xs mt-1 text-muted-foreground">권장: 25~30%</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-amber-500" />
            <span className="text-xs text-muted-foreground">4대보험 합계</span>
          </div>
          <div className="text-2xl font-bold">{fmtMan(kpi.insuranceTotal)}</div>
          <div className="text-xs mt-1 text-muted-foreground">사업자 부담분</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="w-5 h-5 text-emerald-500" />
            <span className="text-xs text-muted-foreground">직원 수</span>
          </div>
          <div className="text-2xl font-bold">{kpi.employeeCount}명</div>
          <div className="text-xs mt-1 text-muted-foreground">정규 5 / 파트 1</div>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 월별 추이 */}
      {activeTab === 'trend' && (
        <div className="card p-6 space-y-4">
          <h3 className="font-bold">12개월 인건비 추이</h3>
          <div className="space-y-3">
            {monthlyTrend.map((m) => (
              <div key={m.month} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-10 text-right">{m.month}</span>
                <div className="flex-1 flex h-7 rounded-lg overflow-hidden bg-secondary/30">
                  <div className="bg-primary/70 h-full" style={{ width: `${(m.base / maxTotal) * 100}%` }} title={`기본급 ${fmtMan(m.base)}`} />
                  <div className="bg-amber-400 h-full" style={{ width: `${(m.overtime / maxTotal) * 100}%` }} title={`야근수당 ${fmtMan(m.overtime)}`} />
                  <div className="bg-red-400 h-full" style={{ width: `${(m.insurance / maxTotal) * 100}%` }} title={`4대보험 ${fmtMan(m.insurance)}`} />
                </div>
                <span className="text-xs font-semibold w-16 text-right">{fmtMan(m.total)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-6 pt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-primary/70" /> 기본급</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-400" /> 야근수당</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-400" /> 4대보험</div>
          </div>
        </div>
      )}

      {/* 직원별 분석 */}
      {activeTab === 'breakdown' && (
        <div className="card overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-secondary/30 text-xs font-semibold text-muted-foreground border-b border-border">
            <div className="col-span-2">직원명</div>
            <div className="col-span-1">유형</div>
            <div className="col-span-1">고용형태</div>
            <div className="col-span-2 text-right">기본급</div>
            <div className="col-span-2 text-right">야근수당</div>
            <div className="col-span-2 text-right">4대보험</div>
            <div className="col-span-1 text-right">합계</div>
            <div className="col-span-1">점유율</div>
          </div>
          <div className="divide-y divide-border">
            {employees.map((emp) => (
              <div key={emp.name} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 p-4 hover:bg-secondary/30 transition-colors items-center">
                <div className="md:hidden space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{emp.name}</span>
                    <span className="font-bold text-sm">{fmtMan(emp.total)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={`px-1.5 py-0.5 rounded text-2xs font-medium ${typeColors[emp.type]}`}>{typeLabels[emp.type]}</span>
                    <span>{emp.empType}</span>
                  </div>
                </div>
                <div className="hidden md:block col-span-2 font-semibold text-sm">{emp.name}</div>
                <div className="hidden md:block col-span-1">
                  <span className={`px-1.5 py-0.5 rounded text-2xs font-medium ${typeColors[emp.type]}`}>{typeLabels[emp.type]}</span>
                </div>
                <div className="hidden md:block col-span-1 text-xs text-muted-foreground">{emp.empType}</div>
                <div className="hidden md:block col-span-2 text-right text-sm">{fmt(emp.base)}</div>
                <div className="hidden md:block col-span-2 text-right text-sm">{emp.overtime > 0 ? fmt(emp.overtime) : '-'}</div>
                <div className="hidden md:block col-span-2 text-right text-sm">{fmt(emp.insurance)}</div>
                <div className="hidden md:block col-span-1 text-right font-bold text-sm">{fmtMan(emp.total)}</div>
                <div className="hidden md:flex col-span-1 items-center gap-1">
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${emp.share}%` }} />
                  </div>
                  <span className="text-2xs text-muted-foreground w-8">{emp.share}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4대보험 최적화 */}
      {activeTab === 'insurance' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insuranceItems.map((item) => (
              <div key={item.name} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold">{item.name}</h4>
                  {item.savings > 0 && (
                    <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                      -{fmtMan(item.savings)} 절감 가능
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">현재</span>
                    <span className="font-semibold">{fmt(item.current)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">최적</span>
                    <span className="font-semibold text-emerald-600">{fmt(item.optimal)}</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(item.optimal / item.current) * 100}%` }} />
                  </div>
                </div>
                <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                  <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>{item.note}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="card p-5 bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span className="font-bold text-emerald-700 dark:text-emerald-400">총 절감 가능액</span>
            </div>
            <div className="text-2xl font-bold text-emerald-600">
              월 {fmt(insuranceItems.reduce((s, i) => s + i.savings, 0))} (연 {fmt(insuranceItems.reduce((s, i) => s + i.savings, 0) * 12)})
            </div>
          </div>
        </div>
      )}

      {/* 벤치마크 */}
      {activeTab === 'benchmark' && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">내 의원 vs 지역 평균 (내과 · 강남구)</h3>
            <span className="text-xs bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full font-semibold">상위 35%</span>
          </div>
          <div className="space-y-4">
            {benchmarkData.map((item) => {
              const maxVal = Math.max(item.my, item.avg)
              return (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.name}</span>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-primary font-semibold">내 의원: {fmtMan(item.my)}</span>
                      <span className="text-muted-foreground">평균: {fmtMan(item.avg)}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xs text-muted-foreground w-8">내 의원</span>
                      <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${(item.my / maxVal) * 100}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xs text-muted-foreground w-8">평균</span>
                      <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-muted-foreground/40 rounded-full" style={{ width: `${(item.avg / maxVal) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* AI 권고 */}
      {activeTab === 'ai' && (
        <div className="space-y-4">
          <div className="card p-4 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <Brain className="w-5 h-5 text-primary" />
              <span className="font-bold">AI 분석 총 절감 가능액</span>
            </div>
            <div className="text-2xl font-bold text-primary">월 {fmt(aiRecommendations.reduce((s, r) => s + r.savings, 0))}</div>
          </div>
          {aiRecommendations.map((rec) => (
            <div key={rec.id} className="card p-5">
              <div className="flex items-center gap-3 mb-3">
                <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <h4 className="font-bold flex-1">{rec.title}</h4>
                <span className={`px-2 py-0.5 rounded-full text-2xs font-semibold ${priorityColors[rec.priority]}`}>
                  {rec.priority === 'HIGH' ? '높음' : rec.priority === 'MEDIUM' ? '보통' : '낮음'}
                </span>
                <span className="text-sm font-bold text-emerald-600">월 {fmt(rec.savings)}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{rec.desc}</p>
              <div className="space-y-1.5">
                {rec.actions.map((action, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <ChevronRight className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 데모 배너 */}
      <div className="card p-3 bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
        <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>데모 데이터로 표시 중입니다. 실제 인건비 데이터를 입력하면 정확한 분석이 가능합니다.</span>
        </div>
      </div>
    </div>
  )
}
