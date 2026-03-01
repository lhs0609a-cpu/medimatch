'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useOpeningProject } from '@/components/opening/useOpeningProject'
import { phases, getPhaseCost } from '@/app/checklist/data/phases'
import { calculateLoanRepayment, nationalAverageByPhase, specialtyBudgetDistribution, regionMultipliers } from '@/app/checklist/data/budget-benchmarks'
import {
  Wallet, ArrowLeft, TrendingUp, Landmark, BarChart3, Loader2,
} from 'lucide-react'

const tabs = [
  { id: 'overview', label: '전체 예산', icon: Wallet },
  { id: 'phase', label: '단계별 분석', icon: BarChart3 },
  { id: 'loan', label: '대출 계산', icon: Landmark },
  { id: 'benchmark', label: '벤치마크', icon: TrendingUp },
] as const

type TabId = (typeof tabs)[number]['id']

export default function BudgetPage() {
  const {
    data, loading, budgetSpent,
  } = useOpeningProject(true)

  const [activeTab, setActiveTab] = useState<TabId>('overview')

  // Loan calculator state
  const [loanAmount, setLoanAmount] = useState(20000) // 만원
  const [loanRate, setLoanRate] = useState(4.5)        // %
  const [loanMonths, setLoanMonths] = useState(60)     // 개월

  // Budget calculations
  const budgetTotal = data.budgetTotal || 0
  const budgetRemaining = budgetTotal - budgetSpent

  // Phase-level budget data
  const phaseData = useMemo(() => {
    return phases.map(phase => {
      const estimated = getPhaseCost(phase)
      const actual = phase.subtasks.reduce(
        (sum, s) => sum + (data.actualCosts[s.id] || 0),
        0
      )
      return {
        phase,
        estimated,
        actual,
        diff: actual - estimated,
      }
    })
  }, [data.actualCosts])

  const totalEstimated = useMemo(
    () => phaseData.reduce((sum, p) => sum + p.estimated, 0),
    [phaseData]
  )

  const totalActual = useMemo(
    () => phaseData.reduce((sum, p) => sum + p.actual, 0),
    [phaseData]
  )

  // Loan repayment calculation
  const loanResult = useMemo(
    () => calculateLoanRepayment(loanAmount, loanRate, loanMonths),
    [loanAmount, loanRate, loanMonths]
  )

  // Stacked bar percentages for donut-like visualization
  const stackedSegments = useMemo(() => {
    const total = totalEstimated || 1
    return phaseData.map(p => ({
      ...p,
      percent: (p.estimated / total) * 100,
    }))
  }, [phaseData, totalEstimated])

  // Benchmark: specialty distribution
  const specialtyName = data.specialty || '내과'
  const specialtyDist = specialtyBudgetDistribution[specialtyName] || specialtyBudgetDistribution['내과']
  const nationalTotal = nationalAverageByPhase.reduce((s, p) => s + p.average, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">예산 데이터 로딩 중...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/emr/opening"
          className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">예산 관리</h1>
          <p className="text-sm text-muted-foreground">
            {data.specialty ? `${data.specialty} · ` : ''}개원 예산 분석 및 대출 계산
          </p>
        </div>
      </div>

      {/* Tab Buttons */}
      <div className="flex gap-1 bg-secondary/50 rounded-xl p-1">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all
                ${activeTab === tab.id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* ========== Tab 1: 전체 예산 ========== */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* 3 KPI Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card rounded-2xl border border-border p-4 text-center">
              <div className="text-xs text-muted-foreground mb-1">총예산</div>
              <div className="text-2xl font-bold text-primary">
                {budgetTotal > 0
                  ? `${budgetTotal.toLocaleString()}`
                  : totalEstimated.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">만원</div>
            </div>
            <div className="bg-card rounded-2xl border border-border p-4 text-center">
              <div className="text-xs text-muted-foreground mb-1">사용액</div>
              <div className="text-2xl font-bold text-amber-600">
                {totalActual.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">만원</div>
            </div>
            <div className="bg-card rounded-2xl border border-border p-4 text-center">
              <div className="text-xs text-muted-foreground mb-1">잔액</div>
              <div className={`text-2xl font-bold ${(budgetTotal || totalEstimated) - totalActual < 0 ? 'text-red-500' : 'text-green-600'}`}>
                {((budgetTotal || totalEstimated) - totalActual).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">만원</div>
            </div>
          </div>

          {/* Stacked Bar Chart (Phase proportion) */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="text-sm font-semibold mb-4">Phase별 예산 비중</h3>
            <div className="w-full h-8 rounded-full overflow-hidden flex">
              {stackedSegments.map(seg => (
                <div
                  key={seg.phase.id}
                  className="h-full transition-all relative group"
                  style={{
                    width: `${seg.percent}%`,
                    backgroundColor: seg.phase.color,
                    minWidth: seg.percent > 0 ? '4px' : '0px',
                  }}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="bg-popover text-popover-foreground text-xs rounded-lg px-2 py-1 shadow-lg whitespace-nowrap border border-border">
                      {seg.phase.title}: {seg.estimated.toLocaleString()}만원 ({seg.percent.toFixed(1)}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-3">
              {stackedSegments.filter(s => s.estimated > 0).map(seg => (
                <div key={seg.phase.id} className="flex items-center gap-1.5 text-xs">
                  <span
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: seg.phase.color }}
                  />
                  <span className="text-muted-foreground">{seg.phase.title}</span>
                  <span className="font-medium">{seg.percent.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Budget Table */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-semibold">항목별 예산 현황</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">단계</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">예상 비용</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">실제 비용</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">차이</th>
                  </tr>
                </thead>
                <tbody>
                  {phaseData.map(p => (
                    <tr key={p.phase.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: p.phase.color }}
                          />
                          <span className="text-sm">{p.phase.title}</span>
                        </div>
                      </td>
                      <td className="text-right px-4 py-3 text-muted-foreground">
                        {p.estimated > 0 ? `${p.estimated.toLocaleString()}만원` : '-'}
                      </td>
                      <td className="text-right px-4 py-3 font-medium">
                        {p.actual > 0 ? `${p.actual.toLocaleString()}만원` : '-'}
                      </td>
                      <td className={`text-right px-4 py-3 font-medium ${p.diff > 0 ? 'text-red-500' : p.diff < 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {p.actual > 0 || p.estimated > 0
                          ? `${p.diff > 0 ? '+' : ''}${p.diff.toLocaleString()}만원`
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-secondary/30 font-semibold">
                    <td className="px-4 py-3 text-sm">합계</td>
                    <td className="text-right px-4 py-3 text-sm">{totalEstimated.toLocaleString()}만원</td>
                    <td className="text-right px-4 py-3 text-sm">{totalActual.toLocaleString()}만원</td>
                    <td className={`text-right px-4 py-3 text-sm ${totalActual - totalEstimated > 0 ? 'text-red-500' : totalActual - totalEstimated < 0 ? 'text-green-600' : ''}`}>
                      {`${totalActual - totalEstimated > 0 ? '+' : ''}${(totalActual - totalEstimated).toLocaleString()}만원`}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========== Tab 2: 단계별 분석 ========== */}
      {activeTab === 'phase' && (
        <PhaseAnalysis phaseData={phaseData} data={data} />
      )}

      {/* ========== Tab 3: 대출 계산 ========== */}
      {activeTab === 'loan' && (
        <div className="space-y-4">
          {/* Input Card */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">대출 조건 입력</h3>
              <button
                onClick={() => {
                  setLoanAmount(20000)
                  setLoanRate(4.5)
                  setLoanMonths(60)
                }}
                className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium"
              >
                개원대출 평균
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">대출금액 (만원)</label>
                <input
                  type="number"
                  value={loanAmount}
                  onChange={e => setLoanAmount(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  = {(loanAmount / 10000).toFixed(1)}억원
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">연이자율 (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={loanRate}
                  onChange={e => setLoanRate(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">상환기간 (개월)</label>
                <input
                  type="number"
                  value={loanMonths}
                  onChange={e => setLoanMonths(Number(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  = {(loanMonths / 12).toFixed(1)}년
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card rounded-2xl border border-border p-4 text-center">
              <div className="text-xs text-muted-foreground mb-1">월상환금</div>
              <div className="text-2xl font-bold text-primary">
                {loanResult.monthlyPayment.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">만원</div>
            </div>
            <div className="bg-card rounded-2xl border border-border p-4 text-center">
              <div className="text-xs text-muted-foreground mb-1">총이자</div>
              <div className="text-2xl font-bold text-amber-600">
                {loanResult.totalInterest.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">만원</div>
            </div>
            <div className="bg-card rounded-2xl border border-border p-4 text-center">
              <div className="text-xs text-muted-foreground mb-1">총상환금</div>
              <div className="text-2xl font-bold">
                {loanResult.totalPayment.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">만원</div>
            </div>
          </div>

          {/* Repayment Schedule (first 12 months) */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-semibold">상환 스케줄 (최초 12개월)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-center px-4 py-2.5 text-xs font-medium text-muted-foreground">월</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">원금</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">이자</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">잔액</th>
                  </tr>
                </thead>
                <tbody>
                  {loanResult.schedule.slice(0, 12).map(row => (
                    <tr key={row.month} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                      <td className="text-center px-4 py-2.5 text-muted-foreground">{row.month}개월</td>
                      <td className="text-right px-4 py-2.5">{row.principal.toLocaleString()}만원</td>
                      <td className="text-right px-4 py-2.5 text-amber-600">{row.interest.toLocaleString()}만원</td>
                      <td className="text-right px-4 py-2.5 font-medium">{row.balance.toLocaleString()}만원</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {loanMonths > 12 && (
              <div className="px-4 py-3 text-xs text-muted-foreground text-center border-t border-border bg-secondary/20">
                총 {loanMonths}개월 중 12개월만 표시 · 최종 잔액: {loanResult.schedule[loanResult.schedule.length - 1]?.balance.toLocaleString() || 0}만원
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== Tab 4: 벤치마크 ========== */}
      {activeTab === 'benchmark' && (
        <div className="space-y-4">
          {/* Info header */}
          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">벤치마크 비교</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              내 예산을 {specialtyName} 평균 및 전국 평균과 비교합니다.
            </p>
            {/* Legend */}
            <div className="flex gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-3 h-3 rounded-sm bg-primary flex-shrink-0" />
                <span>내 예산</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-3 h-3 rounded-sm bg-amber-500 flex-shrink-0" />
                <span>{specialtyName} 평균</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-3 h-3 rounded-sm bg-gray-400 flex-shrink-0" />
                <span>전국 평균</span>
              </div>
            </div>
          </div>

          {/* Phase-by-phase comparison */}
          <div className="space-y-3">
            {phases.map(phase => {
              const myEstimated = getPhaseCost(phase)
              const myActual = phase.subtasks.reduce(
                (sum, s) => sum + (data.actualCosts[s.id] || 0),
                0
              )
              const myValue = myActual > 0 ? myActual : myEstimated
              const national = nationalAverageByPhase.find(n => n.phase === phase.id)
              const nationalAvg = national?.average || 0
              const specPercent = specialtyDist[phase.id] || 0
              const specAvg = Math.round((specPercent / 100) * nationalTotal)

              // Max value for bar scale
              const maxVal = Math.max(myValue, nationalAvg, specAvg, national?.max || 0, 1)

              return (
                <div key={phase.id} className="bg-card rounded-2xl border border-border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: phase.color }}
                    />
                    <span className="text-sm font-medium">{phase.title}</span>
                    {national && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        범위: {national.min.toLocaleString()} ~ {national.max.toLocaleString()}만원
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {/* My budget */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs w-20 text-muted-foreground">내 예산</span>
                      <div className="flex-1 h-5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${(myValue / maxVal) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium w-20 text-right">
                        {myValue > 0 ? `${myValue.toLocaleString()}만원` : '-'}
                      </span>
                    </div>

                    {/* Specialty average */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs w-20 text-muted-foreground">{specialtyName}</span>
                      <div className="flex-1 h-5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all"
                          style={{ width: `${(specAvg / maxVal) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium w-20 text-right">
                        {specAvg > 0 ? `${specAvg.toLocaleString()}만원` : '-'}
                      </span>
                    </div>

                    {/* National average */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs w-20 text-muted-foreground">전국 평균</span>
                      <div className="flex-1 h-5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gray-400 rounded-full transition-all"
                          style={{ width: `${(nationalAvg / maxVal) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium w-20 text-right">
                        {nationalAvg > 0 ? `${nationalAvg.toLocaleString()}만원` : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Total comparison */}
          <div className="bg-card rounded-2xl border border-border p-4">
            <h4 className="text-sm font-semibold mb-3">총 비용 비교</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-primary/5 rounded-xl">
                <div className="text-xs text-muted-foreground mb-1">내 총 예산</div>
                <div className="text-lg font-bold text-primary">
                  {(totalActual > 0 ? totalActual : totalEstimated).toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">만원</div>
              </div>
              <div className="text-center p-3 bg-amber-500/5 rounded-xl">
                <div className="text-xs text-muted-foreground mb-1">{specialtyName} 평균</div>
                <div className="text-lg font-bold text-amber-600">
                  {nationalTotal.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">만원</div>
              </div>
              <div className="text-center p-3 bg-secondary/50 rounded-xl">
                <div className="text-xs text-muted-foreground mb-1">전국 평균</div>
                <div className="text-lg font-bold">
                  {nationalTotal.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">만원</div>
              </div>
            </div>
          </div>

          {/* Region multiplier reference */}
          <div className="bg-card rounded-2xl border border-border p-4">
            <h4 className="text-sm font-semibold mb-3">지역별 비용 배율</h4>
            <div className="space-y-2">
              {regionMultipliers.map(r => (
                <div key={r.code} className="flex items-center gap-3">
                  <span className="text-xs w-28 font-medium">{r.region}</span>
                  <div className="flex-1 h-4 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/60 rounded-full transition-all"
                      style={{ width: `${(r.multiplier / 1.6) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs w-12 text-right font-medium">x{r.multiplier}</span>
                  <span className="text-xs w-12 text-right text-muted-foreground">임대 x{r.rentMultiplier}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ============================================================
   Phase Analysis sub-component (Tab 2)
   ============================================================ */
interface PhaseAnalysisProps {
  phaseData: { phase: (typeof phases)[number]; estimated: number; actual: number; diff: number }[]
  data: ReturnType<typeof useOpeningProject>['data']
}

function PhaseAnalysis({ phaseData, data }: PhaseAnalysisProps) {
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null)

  const maxCost = useMemo(() => {
    return Math.max(
      ...phaseData.map(p => Math.max(p.estimated, p.actual)),
      1
    )
  }, [phaseData])

  return (
    <div className="space-y-3">
      {phaseData.map(p => {
        const isExpanded = expandedPhase === p.phase.id
        return (
          <div key={p.phase.id} className="bg-card rounded-2xl border border-border overflow-hidden">
            <button
              onClick={() => setExpandedPhase(isExpanded ? null : p.phase.id)}
              className="w-full p-4 text-left hover:bg-secondary/20 transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: p.phase.color }}
                />
                <span className="text-sm font-medium flex-1">{p.phase.title}</span>
                <span className="text-xs text-muted-foreground">
                  {isExpanded ? '접기' : '펼치기'}
                </span>
              </div>

              {/* Estimated bar */}
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs w-12 text-muted-foreground">예상</span>
                <div className="flex-1 h-4 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(p.estimated / maxCost) * 100}%`,
                      backgroundColor: p.phase.color,
                      opacity: 0.5,
                    }}
                  />
                </div>
                <span className="text-xs w-20 text-right text-muted-foreground">
                  {p.estimated > 0 ? `${p.estimated.toLocaleString()}만원` : '-'}
                </span>
              </div>

              {/* Actual bar */}
              <div className="flex items-center gap-2">
                <span className="text-xs w-12 text-muted-foreground">실제</span>
                <div className="flex-1 h-4 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(p.actual / maxCost) * 100}%`,
                      backgroundColor: p.phase.color,
                    }}
                  />
                </div>
                <span className="text-xs w-20 text-right font-medium">
                  {p.actual > 0 ? `${p.actual.toLocaleString()}만원` : '-'}
                </span>
              </div>
            </button>

            {/* Subtask drilldown */}
            {isExpanded && (
              <div className="border-t border-border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-secondary/20">
                        <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">항목</th>
                        <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">예상</th>
                        <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">실제</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.phase.subtasks.map(sub => {
                        const actualCost = data.actualCosts[sub.id] || 0
                        return (
                          <tr key={sub.id} className="border-t border-border hover:bg-secondary/10">
                            <td className="px-4 py-2 text-xs">{sub.title}</td>
                            <td className="text-right px-4 py-2 text-xs text-muted-foreground">
                              {sub.estimatedCost ? `${sub.estimatedCost.toLocaleString()}만원` : '-'}
                            </td>
                            <td className="text-right px-4 py-2 text-xs font-medium">
                              {actualCost > 0 ? `${actualCost.toLocaleString()}만원` : '-'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
