'use client'

import { useState, useMemo } from 'react'
import { ArrowLeft, TrendingUp, Target, AlertTriangle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

/* ------------------------------------------------------------------ */
/*  Specialty defaults                                                 */
/* ------------------------------------------------------------------ */
const specialtyDefaults: Record<
  string,
  { name: string; avgRevPerPatient: number; variableRatio: number; color: string }
> = {
  internal: { name: '내과', avgRevPerPatient: 4.5, variableRatio: 25, color: '#3b82f6' },
  ortho: { name: '정형외과', avgRevPerPatient: 6.2, variableRatio: 20, color: '#ef4444' },
  derma: { name: '피부과', avgRevPerPatient: 8.5, variableRatio: 30, color: '#ec4899' },
  eye: { name: '안과', avgRevPerPatient: 5.8, variableRatio: 22, color: '#14b8a6' },
  dental: { name: '치과', avgRevPerPatient: 12.0, variableRatio: 28, color: '#f59e0b' },
  pediatric: { name: '소아과', avgRevPerPatient: 3.5, variableRatio: 20, color: '#8b5cf6' },
  obgyn: { name: '산부인과', avgRevPerPatient: 7.0, variableRatio: 24, color: '#f43f5e' },
  urology: { name: '비뇨기과', avgRevPerPatient: 5.5, variableRatio: 22, color: '#0ea5e9' },
  pharmacy: { name: '약국', avgRevPerPatient: 1.2, variableRatio: 65, color: '#10b981' },
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function formatWon(man: number): string {
  if (Math.abs(man) >= 10000) {
    const eok = Math.floor(man / 10000)
    const rest = Math.round(man % 10000)
    if (rest === 0) return `${eok}억원`
    return `${eok}억 ${Math.abs(rest).toLocaleString()}만원`
  }
  return `${man.toLocaleString()}만원`
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function BepAnalyzerPage() {
  const [selectedId, setSelectedId] = useState('internal')

  // Fixed costs (만원/month)
  const [rent, setRent] = useState(500)
  const [labor, setLabor] = useState(1200)
  const [loanInterest, setLoanInterest] = useState(200)
  const [maintenance, setMaintenance] = useState(150)
  const [insurance, setInsurance] = useState(80)

  // Variable & revenue
  const [variableRatio, setVariableRatio] = useState(25)
  const [avgRevPerPatient, setAvgRevPerPatient] = useState(4.5) // 만원
  const [dailyPatients, setDailyPatients] = useState(30)
  const [workingDays, setWorkingDays] = useState(22)

  const spec = specialtyDefaults[selectedId]

  const handleSpecialtyChange = (id: string) => {
    setSelectedId(id)
    const s = specialtyDefaults[id]
    setVariableRatio(s.variableRatio)
    setAvgRevPerPatient(s.avgRevPerPatient)
  }

  /* ---------- Calculations ---------- */
  const monthlyFixed = rent + labor + loanInterest + maintenance + insurance
  const monthlyRevenue = avgRevPerPatient * dailyPatients * workingDays
  const monthlyVariable = Math.round(monthlyRevenue * (variableRatio / 100))
  const monthlyTotalCost = monthlyFixed + monthlyVariable
  const monthlyProfit = monthlyRevenue - monthlyTotalCost

  // BEP patients/day
  const bepDailyPatients = useMemo(() => {
    const contributionPerPatient = avgRevPerPatient * (1 - variableRatio / 100)
    if (contributionPerPatient <= 0) return Infinity
    return Math.ceil(monthlyFixed / (contributionPerPatient * workingDays))
  }, [avgRevPerPatient, variableRatio, monthlyFixed, workingDays])

  // BEP months (assuming ramp-up: month1=40%, m2=55%, m3=70%, m4=80%, m5=90%, m6+=100%)
  const bepMonths = useMemo(() => {
    const rampRates = [0.4, 0.55, 0.7, 0.8, 0.9, 1.0]
    let cumProfit = 0
    for (let m = 0; m < 36; m++) {
      const ramp = m < rampRates.length ? rampRates[m] : 1.0
      const rev = monthlyRevenue * ramp
      const vc = rev * (variableRatio / 100)
      const profit = rev - monthlyFixed - vc
      cumProfit += profit
      if (cumProfit >= 0 && profit > 0) return m + 1
    }
    return null // not reached within 36 months
  }, [monthlyRevenue, monthlyFixed, variableRatio])

  // Status
  const profitStatus: 'loss' | 'breakeven' | 'profit' =
    monthlyProfit < -100 ? 'loss' : monthlyProfit > 100 ? 'profit' : 'breakeven'

  const statusConfig = {
    loss: { label: '적자', icon: AlertTriangle, bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-600', dot: 'bg-red-500' },
    breakeven: { label: 'BEP 근처', icon: Target, bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-600', dot: 'bg-amber-500' },
    profit: { label: '흑자', icon: CheckCircle, bg: 'bg-green-50 dark:bg-green-950/30', text: 'text-green-600', dot: 'bg-green-500' },
  }
  const st = statusConfig[profitStatus]

  /* ---------- Chart data ---------- */
  const maxBar = Math.max(monthlyRevenue, monthlyTotalCost, 1)

  /* ---------- Fixed cost items ---------- */
  const fixedItems = [
    { label: '임대료', value: rent, setter: setRent, min: 100, max: 2000, step: 50 },
    { label: '인건비', value: labor, setter: setLabor, min: 200, max: 5000, step: 100 },
    { label: '대출이자', value: loanInterest, setter: setLoanInterest, min: 0, max: 1000, step: 50 },
    { label: '관리비', value: maintenance, setter: setMaintenance, min: 50, max: 500, step: 10 },
    { label: '보험료', value: insurance, setter: setInsurance, min: 20, max: 300, step: 10 },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/dashboard" className="btn-ghost p-2 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <TrendingUp className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold">손익분기점(BEP) 분석기</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
        {/* Specialty selector */}
        <div className="card p-5">
          <p className="text-sm font-medium text-muted-foreground mb-3">진료과 선택</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(specialtyDefaults).map(([id, s]) => (
              <button
                key={id}
                onClick={() => handleSpecialtyChange(id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedId === id
                    ? 'text-white'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
                style={selectedId === id ? { backgroundColor: s.color } : undefined}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Status indicator */}
        <div className={`card p-5 ${st.bg} border-0`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${st.dot} animate-pulse`} />
              <div>
                <p className={`text-lg font-bold ${st.text}`}>{st.label}</p>
                <p className="text-sm text-muted-foreground">
                  월 영업이익: <span className={`font-semibold ${monthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{monthlyProfit >= 0 ? '+' : ''}{formatWon(Math.round(monthlyProfit))}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">BEP 환자수</p>
              <p className={`text-2xl font-extrabold ${st.text}`}>
                {bepDailyPatients === Infinity ? '-' : `${bepDailyPatients}명/일`}
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Inputs */}
          <div className="space-y-5">
            {/* Fixed costs */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-foreground">월 고정비</p>
                <span className="text-sm font-bold text-primary">{formatWon(monthlyFixed)}</span>
              </div>
              <div className="space-y-4">
                {fixedItems.map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium">{formatWon(item.value)}</span>
                    </div>
                    <input
                      type="range"
                      min={item.min}
                      max={item.max}
                      step={item.step}
                      value={item.value}
                      onChange={(e) => item.setter(Number(e.target.value))}
                      className="w-full accent-primary h-1.5"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Variable cost ratio */}
            <div className="card p-5">
              <label className="text-sm font-semibold text-foreground">월 변동비율</label>
              <p className="text-xs text-muted-foreground mb-2">약품비, 소모품, 외주비 등 매출 대비 비율</p>
              <input
                type="range"
                min={5}
                max={80}
                value={variableRatio}
                onChange={(e) => setVariableRatio(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>5%</span>
                <span className="font-bold text-foreground text-sm">{variableRatio}%</span>
                <span>80%</span>
              </div>
            </div>

            {/* Revenue per patient */}
            <div className="card p-5">
              <label className="text-sm font-semibold text-foreground">평균 환자당 진료비</label>
              <p className="text-xs text-muted-foreground mb-2">{spec.name} 평균: {spec.avgRevPerPatient}만원</p>
              <input
                type="range"
                min={0.5}
                max={30}
                step={0.5}
                value={avgRevPerPatient}
                onChange={(e) => setAvgRevPerPatient(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0.5만원</span>
                <span className="font-bold text-foreground text-sm">{avgRevPerPatient}만원</span>
                <span>30만원</span>
              </div>
            </div>

            {/* Daily patients & working days */}
            <div className="grid grid-cols-2 gap-4">
              <div className="card p-5">
                <label className="text-sm font-semibold text-foreground">일 평균 환자수</label>
                <input
                  type="range"
                  min={5}
                  max={100}
                  value={dailyPatients}
                  onChange={(e) => setDailyPatients(Number(e.target.value))}
                  className="w-full accent-primary mt-2"
                />
                <p className="text-center text-sm font-bold mt-1">{dailyPatients}명</p>
              </div>
              <div className="card p-5">
                <label className="text-sm font-semibold text-foreground">월 근무일수</label>
                <input
                  type="range"
                  min={15}
                  max={28}
                  value={workingDays}
                  onChange={(e) => setWorkingDays(Number(e.target.value))}
                  className="w-full accent-primary mt-2"
                />
                <p className="text-center text-sm font-bold mt-1">{workingDays}일</p>
              </div>
            </div>
          </div>

          {/* Right: Output */}
          <div className="space-y-5">
            {/* Revenue vs Cost bar chart */}
            <div className="card p-5">
              <p className="text-sm font-semibold mb-4">월간 매출 vs 비용</p>
              <div className="space-y-4">
                {/* Revenue bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">월 매출</span>
                    <span className="font-medium text-green-600">{formatWon(Math.round(monthlyRevenue))}</span>
                  </div>
                  <div className="h-8 rounded-lg bg-muted overflow-hidden relative">
                    <div
                      className="h-full rounded-lg bg-green-500 transition-all duration-500"
                      style={{ width: `${(monthlyRevenue / maxBar) * 100}%` }}
                    />
                  </div>
                </div>
                {/* Cost bar (stacked: fixed + variable) */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">월 총비용</span>
                    <span className="font-medium text-red-600">{formatWon(Math.round(monthlyTotalCost))}</span>
                  </div>
                  <div className="h-8 rounded-lg bg-muted overflow-hidden flex">
                    <div
                      className="h-full bg-red-400 transition-all duration-500"
                      style={{ width: `${(monthlyFixed / maxBar) * 100}%` }}
                    />
                    <div
                      className="h-full bg-orange-400 transition-all duration-500"
                      style={{ width: `${(monthlyVariable / maxBar) * 100}%` }}
                    />
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-400" /> 고정비 {formatWon(monthlyFixed)}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-orange-400" /> 변동비 {formatWon(monthlyVariable)}
                    </span>
                  </div>
                </div>

                {/* BEP line marker */}
                <div className="border-t-2 border-dashed border-amber-400 pt-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium">BEP 라인</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    하루 <span className="font-bold text-foreground">{bepDailyPatients === Infinity ? '산출불가' : `${bepDailyPatients}명`}</span> 이상 진료 시 손익분기점 도달
                  </p>
                </div>
              </div>
            </div>

            {/* BEP 도달 시점 */}
            <div className="card p-5">
              <p className="text-sm font-semibold mb-3">BEP 도달 시점 예측</p>
              <p className="text-xs text-muted-foreground mb-3">
                개원 초기 환자 증가(램프업)를 고려한 예측입니다
              </p>
              <div className="flex items-center gap-3 mb-4">
                {[
                  { month: 1, rate: '40%' },
                  { month: 2, rate: '55%' },
                  { month: 3, rate: '70%' },
                  { month: 4, rate: '80%' },
                  { month: 5, rate: '90%' },
                  { month: '6+', rate: '100%' },
                ].map((m, i) => (
                  <div key={i} className="flex-1 text-center">
                    <div
                      className="mx-auto rounded-md bg-primary/20 transition-all duration-300"
                      style={{
                        width: '100%',
                        height: `${parseInt(String(m.rate)) * 0.6}px`,
                      }}
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">{m.month}개월</p>
                    <p className="text-[10px] font-medium">{m.rate}</p>
                  </div>
                ))}
              </div>
              <div className={`p-3 rounded-lg ${st.bg}`}>
                <p className={`text-sm font-bold ${st.text}`}>
                  {bepMonths
                    ? `약 ${bepMonths}개월 후 흑자 전환 예상`
                    : '현재 조건으로는 36개월 내 BEP 도달 어려움'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {bepMonths && bepMonths <= 6
                    ? '양호한 수준입니다. 초기 자금 회전에 큰 문제가 없을 것으로 예상됩니다.'
                    : bepMonths && bepMonths <= 12
                    ? '평균적인 수준입니다. 충분한 운전자금을 확보해 두세요.'
                    : bepMonths
                    ? '다소 긴 편입니다. 비용 절감 또는 매출 증대 방안을 검토하세요.'
                    : '고정비 절감, 변동비 비율 개선, 또는 환자수 증대 전략이 필요합니다.'}
                </p>
              </div>
            </div>

            {/* Detailed numbers */}
            <div className="card p-5">
              <p className="text-sm font-semibold mb-3">상세 수치</p>
              <div className="space-y-2">
                {[
                  { label: '일 매출', value: formatWon(Math.round(avgRevPerPatient * dailyPatients)) },
                  { label: '월 매출', value: formatWon(Math.round(monthlyRevenue)) },
                  { label: '월 고정비', value: formatWon(monthlyFixed) },
                  { label: '월 변동비', value: formatWon(monthlyVariable) },
                  { label: '월 총비용', value: formatWon(monthlyTotalCost) },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between text-sm py-1 border-b border-muted last:border-0">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-medium">{row.value}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm py-2 font-bold">
                  <span>월 영업이익</span>
                  <span className={monthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {monthlyProfit >= 0 ? '+' : ''}{formatWon(Math.round(monthlyProfit))}
                  </span>
                </div>
                <div className="flex justify-between text-sm py-1">
                  <span className="text-muted-foreground">영업이익률</span>
                  <span className="font-medium">
                    {monthlyRevenue > 0 ? `${Math.round((monthlyProfit / monthlyRevenue) * 100)}%` : '0%'}
                  </span>
                </div>
                <div className="flex justify-between text-sm py-1">
                  <span className="text-muted-foreground">연 예상 수익</span>
                  <span className={`font-bold ${monthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatWon(Math.round(monthlyProfit * 12))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
