'use client'

import { useState, useMemo } from 'react'
import { ArrowLeft, Pill, Info, MapPin, Ruler } from 'lucide-react'
import Link from 'next/link'

/* ------------------------------------------------------------------ */
/*  Data: location types                                               */
/* ------------------------------------------------------------------ */
const locationTypes = [
  {
    id: 'hospital',
    name: '병원 밀집지역',
    icon: '🏥',
    depositRange: [12000, 20000],
    keyMoneyRange: [8000, 15000],
    description: '처방전 유입이 안정적이나 권리금이 높음',
  },
  {
    id: 'residential',
    name: '주거지역',
    icon: '🏘️',
    depositRange: [5000, 10000],
    keyMoneyRange: [3000, 8000],
    description: '초기 비용이 낮으나 고객 확보에 시간 소요',
  },
  {
    id: 'station',
    name: '역세권',
    icon: '🚇',
    depositRange: [10000, 18000],
    keyMoneyRange: [10000, 20000],
    description: '유동인구 많으나 임대료 부담이 큼',
  },
  {
    id: 'university',
    name: '대학가',
    icon: '🎓',
    depositRange: [6000, 12000],
    keyMoneyRange: [5000, 10000],
    description: '젊은 고객층, 비급여 수요 높음',
  },
]

const scaleTypes = [
  { id: 'small', name: '소형', label: '20평 미만', pyeong: 15, interiorRate: 320 },
  { id: 'medium', name: '중형', label: '20~35평', pyeong: 28, interiorRate: 300 },
  { id: 'large', name: '대형', label: '35평 이상', pyeong: 45, interiorRate: 280 },
]

/* ------------------------------------------------------------------ */
/*  Regional comparison data                                           */
/* ------------------------------------------------------------------ */
const regionalComparison = [
  { region: '서울 강남', avg: 58000 },
  { region: '서울 기타', avg: 42000 },
  { region: '경기/인천', avg: 35000 },
  { region: '부산/대구', avg: 30000 },
  { region: '광역시', avg: 27000 },
  { region: '중소도시', avg: 22000 },
]

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function formatWon(man: number): string {
  if (Math.abs(man) >= 10000) {
    const eok = Math.floor(man / 10000)
    const rest = man % 10000
    if (rest === 0) return `${eok}억원`
    return `${eok}억 ${rest.toLocaleString()}만원`
  }
  return `${man.toLocaleString()}만원`
}

function pct(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function PharmacyCostPage() {
  const [locationId, setLocationId] = useState('hospital')
  const [scaleId, setScaleId] = useState('medium')

  // Individual cost controls
  const [depositKeyMoney, setDepositKeyMoney] = useState(20000)
  const [interiorAdjust, setInteriorAdjust] = useState(0) // % adjustment from default
  const [autoDispenser, setAutoDispenser] = useState(false)
  const [initialInventory, setInitialInventory] = useState(5000)
  const [posSystem, setPosSystem] = useState(true)
  const [signage, setSignage] = useState(1500)
  const [pharmacistCount, setPharmacistCount] = useState(1) // additional pharmacists
  const [assistantCount, setAssistantCount] = useState(2)
  const [workingCapital, setWorkingCapital] = useState(5000)

  const location = locationTypes.find((l) => l.id === locationId) || locationTypes[0]
  const scale = scaleTypes.find((s) => s.id === scaleId) || scaleTypes[1]

  // Auto-update deposit range when location changes
  const handleLocationChange = (id: string) => {
    setLocationId(id)
    const loc = locationTypes.find((l) => l.id === id)!
    const midDeposit = Math.round((loc.depositRange[0] + loc.depositRange[1] + loc.keyMoneyRange[0] + loc.keyMoneyRange[1]) / 4)
    setDepositKeyMoney(midDeposit)
  }

  /* ---------- Cost calculations ---------- */
  const interiorBase = scale.pyeong * scale.interiorRate
  const interiorCost = Math.round(interiorBase * (1 + interiorAdjust / 100))

  const dispensingSystem = autoDispenser ? 8000 : 2500 // 자동조제기 vs 수동 조제대
  const posCost = posSystem ? 1200 : 500 // 풀 시스템 vs 기본

  const laborCost = useMemo(() => {
    const pharmacistSalary = 450 // 만원/월
    const assistantSalary = 250
    return (pharmacistCount * pharmacistSalary + assistantCount * assistantSalary) * 6
  }, [pharmacistCount, assistantCount])

  const categories = [
    { label: '보증금/권리금', value: depositKeyMoney, color: '#3b82f6' },
    { label: '인테리어 (조제실/매장/상담실)', value: interiorCost, color: '#8b5cf6' },
    { label: '조제 시스템' + (autoDispenser ? ' (자동조제기)' : ''), value: dispensingSystem, color: '#ef4444' },
    { label: '초기 약품 재고', value: initialInventory, color: '#f59e0b' },
    { label: 'POS/약국 관리 시스템', value: posCost, color: '#10b981' },
    { label: '간판/사인물', value: signage, color: '#ec4899' },
    { label: '인건비 6개월분', value: laborCost, color: '#0ea5e9' },
    { label: '운전자금', value: workingCapital, color: '#6366f1' },
  ]

  const totalCost = categories.reduce((s, c) => s + c.value, 0)
  const maxRegional = Math.max(...regionalComparison.map((r) => r.avg))

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/dashboard" className="btn-ghost p-2 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Pill className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold">약국 개국 비용 계산기</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
        {/* Location type selector */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">입지 유형 선택</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {locationTypes.map((loc) => (
              <button
                key={loc.id}
                onClick={() => handleLocationChange(loc.id)}
                className={`p-3 rounded-xl text-left transition-all ${
                  locationId === loc.id
                    ? 'bg-primary/10 border-2 border-primary'
                    : 'bg-muted hover:bg-muted/80 border-2 border-transparent'
                }`}
              >
                <span className="text-2xl">{loc.icon}</span>
                <p className="text-sm font-semibold mt-1">{loc.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{loc.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Scale selector */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Ruler className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">규모 선택</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {scaleTypes.map((s) => (
              <button
                key={s.id}
                onClick={() => setScaleId(s.id)}
                className={`p-3 rounded-xl text-center transition-all ${
                  scaleId === s.id
                    ? 'bg-primary/10 border-2 border-primary'
                    : 'bg-muted hover:bg-muted/80 border-2 border-transparent'
                }`}
              >
                <p className="text-sm font-semibold">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xs text-muted-foreground mt-1">기준 {s.pyeong}평</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left: Adjustable inputs */}
          <div className="lg:col-span-3 space-y-5">
            {/* Deposit & key money */}
            <div className="card p-5">
              <label className="text-sm font-semibold text-foreground">보증금 / 권리금</label>
              <p className="text-xs text-muted-foreground mb-2">
                {location.name} 평균: 보증금 {formatWon(location.depositRange[0])}~{formatWon(location.depositRange[1])}, 권리금 {formatWon(location.keyMoneyRange[0])}~{formatWon(location.keyMoneyRange[1])}
              </p>
              <input
                type="range"
                min={3000}
                max={40000}
                step={500}
                value={depositKeyMoney}
                onChange={(e) => setDepositKeyMoney(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>3,000만원</span>
                <span className="font-bold text-foreground text-sm">{formatWon(depositKeyMoney)}</span>
                <span>4억원</span>
              </div>
            </div>

            {/* Interior */}
            <div className="card p-5">
              <label className="text-sm font-semibold text-foreground">인테리어 (조제실, 매장, 상담실)</label>
              <p className="text-xs text-muted-foreground mb-2">
                {scale.name} 기준 {scale.pyeong}평 x 평당 {scale.interiorRate}만원 = {formatWon(interiorBase)}
              </p>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground whitespace-nowrap">비용 조정</span>
                <input
                  type="range"
                  min={-30}
                  max={50}
                  value={interiorAdjust}
                  onChange={(e) => setInteriorAdjust(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <span className="text-sm font-medium whitespace-nowrap w-20 text-right">
                  {interiorAdjust > 0 ? '+' : ''}{interiorAdjust}%
                </span>
              </div>
              <p className="text-right text-sm font-semibold mt-1">{formatWon(interiorCost)}</p>
            </div>

            {/* Dispensing system */}
            <div className="card p-5">
              <label className="text-sm font-semibold text-foreground">조제 시스템</label>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <button
                  onClick={() => setAutoDispenser(false)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    !autoDispenser
                      ? 'bg-primary/10 border-2 border-primary'
                      : 'bg-muted hover:bg-muted/80 border-2 border-transparent'
                  }`}
                >
                  <p className="text-sm font-semibold">수동 조제대</p>
                  <p className="text-xs text-muted-foreground mt-1">조제대 + 약품장 세트</p>
                  <p className="text-sm font-bold text-primary mt-1">{formatWon(2500)}</p>
                </button>
                <button
                  onClick={() => setAutoDispenser(true)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    autoDispenser
                      ? 'bg-primary/10 border-2 border-primary'
                      : 'bg-muted hover:bg-muted/80 border-2 border-transparent'
                  }`}
                >
                  <p className="text-sm font-semibold">자동조제기 (ATC)</p>
                  <p className="text-xs text-muted-foreground mt-1">자동 포장 + 조제 로봇</p>
                  <p className="text-sm font-bold text-primary mt-1">{formatWon(8000)}</p>
                </button>
              </div>
            </div>

            {/* Initial inventory */}
            <div className="card p-5">
              <label className="text-sm font-semibold text-foreground">초기 약품 재고</label>
              <p className="text-xs text-muted-foreground mb-2">전문의약품, 일반의약품, 건강기능식품 등</p>
              <input
                type="range"
                min={2000}
                max={15000}
                step={500}
                value={initialInventory}
                onChange={(e) => setInitialInventory(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>2,000만원</span>
                <span className="font-bold text-foreground text-sm">{formatWon(initialInventory)}</span>
                <span>1.5억원</span>
              </div>
            </div>

            {/* POS & Signage */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="card p-5">
                <label className="text-sm font-semibold text-foreground">POS/관리 시스템</label>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setPosSystem(false)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      !posSystem ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    기본 ({formatWon(500)})
                  </button>
                  <button
                    onClick={() => setPosSystem(true)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      posSystem ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    풀옵션 ({formatWon(1200)})
                  </button>
                </div>
              </div>
              <div className="card p-5">
                <label className="text-sm font-semibold text-foreground">간판/사인물</label>
                <input
                  type="range"
                  min={500}
                  max={5000}
                  step={100}
                  value={signage}
                  onChange={(e) => setSignage(Number(e.target.value))}
                  className="w-full accent-primary mt-2"
                />
                <p className="text-sm text-center font-medium mt-1">{formatWon(signage)}</p>
              </div>
            </div>

            {/* Staff */}
            <div className="card p-5">
              <label className="text-sm font-semibold text-foreground">인건비 (6개월분)</label>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">추가 약사 (월 450만원)</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setPharmacistCount(Math.max(0, pharmacistCount - 1))}
                      className="w-8 h-8 rounded-lg bg-muted text-foreground flex items-center justify-center font-bold"
                    >
                      -
                    </button>
                    <span className="text-lg font-bold w-8 text-center">{pharmacistCount}</span>
                    <button
                      onClick={() => setPharmacistCount(Math.min(5, pharmacistCount + 1))}
                      className="w-8 h-8 rounded-lg bg-muted text-foreground flex items-center justify-center font-bold"
                    >
                      +
                    </button>
                    <span className="text-xs text-muted-foreground">명</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">보조 인력 (월 250만원)</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setAssistantCount(Math.max(0, assistantCount - 1))}
                      className="w-8 h-8 rounded-lg bg-muted text-foreground flex items-center justify-center font-bold"
                    >
                      -
                    </button>
                    <span className="text-lg font-bold w-8 text-center">{assistantCount}</span>
                    <button
                      onClick={() => setAssistantCount(Math.min(10, assistantCount + 1))}
                      className="w-8 h-8 rounded-lg bg-muted text-foreground flex items-center justify-center font-bold"
                    >
                      +
                    </button>
                    <span className="text-xs text-muted-foreground">명</span>
                  </div>
                </div>
              </div>
              <p className="text-right text-sm font-semibold text-muted-foreground mt-2">
                6개월 합계: {formatWon(laborCost)}
              </p>
            </div>

            {/* Working capital */}
            <div className="card p-5">
              <label className="text-sm font-semibold text-foreground">운전자금</label>
              <input
                type="range"
                min={2000}
                max={15000}
                step={500}
                value={workingCapital}
                onChange={(e) => setWorkingCapital(Number(e.target.value))}
                className="w-full accent-primary mt-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>2,000만원</span>
                <span className="font-bold text-foreground text-sm">{formatWon(workingCapital)}</span>
                <span>1.5억원</span>
              </div>
            </div>
          </div>

          {/* Right: Summary */}
          <div className="lg:col-span-2 space-y-5">
            {/* Total */}
            <div className="card p-5 border-2 border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">예상 총 개국비용</p>
              <p className="text-3xl font-extrabold text-primary">{formatWon(totalCost)}</p>
              <p className="text-xs text-muted-foreground mt-1">{location.name} / {scale.name} ({scale.label}) 기준</p>
            </div>

            {/* Breakdown bars */}
            <div className="card p-5">
              <p className="text-sm font-semibold mb-3">비용 구성</p>
              <div className="space-y-3">
                {categories.map((cat) => (
                  <div key={cat.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground truncate mr-2">{cat.label}</span>
                      <span className="font-medium whitespace-nowrap">{formatWon(cat.value)} ({pct(cat.value, totalCost)}%)</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct(cat.value, totalCost)}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Regional comparison */}
            <div className="card p-5">
              <p className="text-sm font-semibold mb-3">지역별 평균 개국비용 비교</p>
              <div className="space-y-2.5">
                {regionalComparison.map((r) => (
                  <div key={r.region}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{r.region}</span>
                      <span className="font-medium">{formatWon(r.avg)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/60 transition-all duration-500"
                        style={{ width: `${(r.avg / maxRegional) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-muted">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-primary">내 예상 비용</span>
                  <span className="font-bold text-primary">{formatWon(totalCost)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden mt-1">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${Math.min(100, (totalCost / maxRegional) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
              <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                실제 비용은 입지, 규모, 컨셉에 따라 차이가 있습니다. 자동조제기 도입 시 인건비 절감 효과가 있으나 초기 투자비가 높아집니다. 정확한 견적은 전문 컨설팅을 통해 확인하세요.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
