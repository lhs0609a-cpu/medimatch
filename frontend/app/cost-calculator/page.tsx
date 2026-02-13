'use client'

import { useState, useMemo } from 'react'
import { ArrowLeft, Building2, ChevronDown, ChevronUp, Info } from 'lucide-react'
import Link from 'next/link'

/* ------------------------------------------------------------------ */
/*  Specialty cost profiles                                            */
/* ------------------------------------------------------------------ */
const specialties = [
  {
    id: 'internal',
    name: '내과',
    color: '#3b82f6',
    interiorRate: 280,
    equipmentItems: [
      { name: '초음파 진단기', cost: 5000, default: true },
      { name: '심전도 (ECG)', cost: 1200, default: true },
      { name: 'X-ray 장비', cost: 8000, default: false },
      { name: '혈액분석기', cost: 3500, default: true },
      { name: '내시경 세트', cost: 12000, default: false },
      { name: '체성분 분석기', cost: 800, default: false },
    ],
    supplyCost: 2000,
    avgStaffSalary: 280,
    licensingCost: 800,
    industryAvg: 42000,
  },
  {
    id: 'ortho',
    name: '정형외과',
    color: '#ef4444',
    interiorRate: 320,
    equipmentItems: [
      { name: 'C-arm (이동형 X-ray)', cost: 15000, default: true },
      { name: '초음파 진단기', cost: 5000, default: true },
      { name: '체외충격파 치료기', cost: 4500, default: true },
      { name: '재활치료 장비 세트', cost: 6000, default: true },
      { name: 'MRI (중고)', cost: 35000, default: false },
      { name: '도수치료 베드 (5대)', cost: 2500, default: true },
    ],
    supplyCost: 1500,
    avgStaffSalary: 270,
    licensingCost: 900,
    industryAvg: 55000,
  },
  {
    id: 'derma',
    name: '피부과',
    color: '#ec4899',
    interiorRate: 400,
    equipmentItems: [
      { name: '레이저 장비 (프락셀)', cost: 18000, default: true },
      { name: 'IPL 장비', cost: 8000, default: true },
      { name: '피부진단기 (더모스코피)', cost: 2000, default: true },
      { name: 'RF 리프팅 장비', cost: 12000, default: false },
      { name: '보톡스/필러 냉장고', cost: 500, default: true },
      { name: 'LED 테라피 장비', cost: 3000, default: false },
    ],
    supplyCost: 3000,
    avgStaffSalary: 300,
    licensingCost: 850,
    industryAvg: 60000,
  },
  {
    id: 'eye',
    name: '안과',
    color: '#14b8a6',
    interiorRate: 350,
    equipmentItems: [
      { name: '세극등현미경', cost: 3000, default: true },
      { name: '안압측정기', cost: 2500, default: true },
      { name: 'OCT (망막단층촬영)', cost: 15000, default: true },
      { name: '자동굴절검사기', cost: 4000, default: true },
      { name: '시야검사기', cost: 8000, default: false },
      { name: '레이저 광응고장치', cost: 20000, default: false },
    ],
    supplyCost: 1800,
    avgStaffSalary: 290,
    licensingCost: 900,
    industryAvg: 52000,
  },
  {
    id: 'dental',
    name: '치과',
    color: '#f59e0b',
    interiorRate: 450,
    equipmentItems: [
      { name: '유닛체어 (5대)', cost: 15000, default: true },
      { name: '파노라마 X-ray', cost: 8000, default: true },
      { name: 'CT (CBCT)', cost: 25000, default: false },
      { name: '구강스캐너', cost: 5000, default: false },
      { name: '멸균기/소독기 세트', cost: 2000, default: true },
      { name: '임플란트 엔진', cost: 3500, default: true },
    ],
    supplyCost: 2500,
    avgStaffSalary: 280,
    licensingCost: 1000,
    industryAvg: 65000,
  },
  {
    id: 'pediatric',
    name: '소아과',
    color: '#8b5cf6',
    interiorRate: 300,
    equipmentItems: [
      { name: '초음파 진단기', cost: 5000, default: true },
      { name: '네블라이저 (5대)', cost: 500, default: true },
      { name: '청력검사기', cost: 2000, default: false },
      { name: '영유아 체성분 분석기', cost: 1200, default: false },
      { name: '혈액분석기', cost: 3500, default: true },
      { name: '자동 신장/체중계', cost: 300, default: true },
    ],
    supplyCost: 1500,
    avgStaffSalary: 260,
    licensingCost: 750,
    industryAvg: 35000,
  },
  {
    id: 'obgyn',
    name: '산부인과',
    color: '#f43f5e',
    interiorRate: 350,
    equipmentItems: [
      { name: '4D 초음파', cost: 12000, default: true },
      { name: '태아감시장치 (NST)', cost: 3000, default: true },
      { name: '질확대경 (콜포스코프)', cost: 2500, default: true },
      { name: '자궁경 세트', cost: 4000, default: false },
      { name: '분만대 및 수술장비', cost: 8000, default: false },
      { name: 'HPV 검사기', cost: 2000, default: true },
    ],
    supplyCost: 2200,
    avgStaffSalary: 290,
    licensingCost: 950,
    industryAvg: 48000,
  },
  {
    id: 'urology',
    name: '비뇨기과',
    color: '#0ea5e9',
    interiorRate: 310,
    equipmentItems: [
      { name: '방광경', cost: 6000, default: true },
      { name: '초음파 진단기', cost: 5000, default: true },
      { name: '요류검사기', cost: 3000, default: true },
      { name: '체외충격파쇄석기', cost: 15000, default: false },
      { name: '전립선 조직검사 장비', cost: 4000, default: false },
      { name: '레이저 수술 장비', cost: 12000, default: false },
    ],
    supplyCost: 1800,
    avgStaffSalary: 280,
    licensingCost: 850,
    industryAvg: 45000,
  },
]

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function formatWon(man: number): string {
  if (man >= 10000) {
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
export default function CostCalculatorPage() {
  const [selectedId, setSelectedId] = useState('internal')
  const [deposit, setDeposit] = useState(10000)       // 만원
  const [pyeong, setPyeong] = useState(30)
  const [equipmentToggles, setEquipmentToggles] = useState<Record<string, boolean>>({})
  const [staffCount, setStaffCount] = useState(4)
  const [marketing, setMarketing] = useState(3000)
  const [workingCapital, setWorkingCapital] = useState(5000)
  const [showDetail, setShowDetail] = useState(true)

  const spec = specialties.find((s) => s.id === selectedId) || specialties[0]

  // Reset toggles when specialty changes
  const handleSpecialtyChange = (id: string) => {
    setSelectedId(id)
    setEquipmentToggles({})
  }

  const interiorCost = pyeong * spec.interiorRate
  const equipmentCost = useMemo(() => {
    return spec.equipmentItems.reduce((sum, item) => {
      const on = equipmentToggles[item.name] ?? item.default
      return sum + (on ? item.cost : 0)
    }, 0)
  }, [spec, equipmentToggles])
  const supplyCost = spec.supplyCost
  const laborCost = staffCount * spec.avgStaffSalary * 6
  const licensingCost = spec.licensingCost

  const categories = [
    { label: '보증금/권리금', value: deposit, color: '#3b82f6' },
    { label: '인테리어', value: interiorCost, color: '#8b5cf6' },
    { label: '의료기기', value: equipmentCost, color: '#ef4444' },
    { label: '초기 약품/소모품', value: supplyCost, color: '#f59e0b' },
    { label: '인건비 (6개월)', value: laborCost, color: '#10b981' },
    { label: '마케팅/홍보비', value: marketing, color: '#ec4899' },
    { label: '운전자금', value: workingCapital, color: '#0ea5e9' },
    { label: '인허가/행정비용', value: licensingCost, color: '#6366f1' },
  ]

  const totalCost = categories.reduce((s, c) => s + c.value, 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/dashboard" className="btn-ghost p-2 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Building2 className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold">개원 비용 계산기</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
        {/* Specialty selector */}
        <div className="card p-5">
          <p className="text-sm font-medium text-muted-foreground mb-3">진료과 선택</p>
          <div className="flex flex-wrap gap-2">
            {specialties.map((sp) => (
              <button
                key={sp.id}
                onClick={() => handleSpecialtyChange(sp.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedId === sp.id
                    ? 'text-white'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
                style={selectedId === sp.id ? { backgroundColor: sp.color } : undefined}
              >
                {sp.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left: Inputs */}
          <div className="lg:col-span-3 space-y-5">
            {/* Deposit */}
            <div className="card p-5">
              <label className="text-sm font-semibold text-foreground">보증금 / 권리금</label>
              <p className="text-xs text-muted-foreground mb-2">입지와 상권에 따라 큰 차이가 있습니다</p>
              <input
                type="range"
                min={5000}
                max={30000}
                step={500}
                value={deposit}
                onChange={(e) => setDeposit(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>5,000만원</span>
                <span className="font-bold text-foreground text-sm">{formatWon(deposit)}</span>
                <span>3억원</span>
              </div>
            </div>

            {/* Interior */}
            <div className="card p-5">
              <label className="text-sm font-semibold text-foreground">인테리어</label>
              <p className="text-xs text-muted-foreground mb-2">
                {spec.name} 평균 평당 {spec.interiorRate}만원
              </p>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <input
                    type="range"
                    min={10}
                    max={80}
                    value={pyeong}
                    onChange={(e) => setPyeong(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>10평</span>
                    <span>80평</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-foreground">{pyeong}평</span>
                  <p className="text-xs text-muted-foreground">{formatWon(interiorCost)}</p>
                </div>
              </div>
            </div>

            {/* Equipment */}
            <div className="card p-5">
              <button
                onClick={() => setShowDetail(!showDetail)}
                className="flex items-center justify-between w-full"
              >
                <div>
                  <span className="text-sm font-semibold text-foreground">의료기기</span>
                  <span className="ml-2 text-xs text-muted-foreground">({formatWon(equipmentCost)})</span>
                </div>
                {showDetail ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showDetail && (
                <div className="mt-3 space-y-2">
                  {spec.equipmentItems.map((item) => {
                    const on = equipmentToggles[item.name] ?? item.default
                    return (
                      <label
                        key={item.name}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={() =>
                              setEquipmentToggles((prev) => ({ ...prev, [item.name]: !on }))
                            }
                            className="rounded accent-primary"
                          />
                          <span className="text-sm">{item.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{formatWon(item.cost)}</span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Staff */}
            <div className="card p-5">
              <label className="text-sm font-semibold text-foreground">인건비 (6개월분)</label>
              <p className="text-xs text-muted-foreground mb-2">
                직원 {staffCount}명 x 월 평균 {spec.avgStaffSalary}만원 x 6개월
              </p>
              <input
                type="range"
                min={1}
                max={15}
                value={staffCount}
                onChange={(e) => setStaffCount(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1명</span>
                <span className="font-bold text-foreground text-sm">{staffCount}명 = {formatWon(laborCost)}</span>
                <span>15명</span>
              </div>
            </div>

            {/* Marketing & Working capital */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="card p-5">
                <label className="text-sm font-semibold text-foreground">마케팅/홍보비</label>
                <input
                  type="range"
                  min={500}
                  max={10000}
                  step={500}
                  value={marketing}
                  onChange={(e) => setMarketing(Number(e.target.value))}
                  className="w-full accent-primary mt-2"
                />
                <p className="text-sm text-center font-medium mt-1">{formatWon(marketing)}</p>
              </div>
              <div className="card p-5">
                <label className="text-sm font-semibold text-foreground">운전자금</label>
                <input
                  type="range"
                  min={2000}
                  max={20000}
                  step={500}
                  value={workingCapital}
                  onChange={(e) => setWorkingCapital(Number(e.target.value))}
                  className="w-full accent-primary mt-2"
                />
                <p className="text-sm text-center font-medium mt-1">{formatWon(workingCapital)}</p>
              </div>
            </div>
          </div>

          {/* Right: Summary */}
          <div className="lg:col-span-2 space-y-5">
            {/* Total */}
            <div className="card p-5 border-2 border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">예상 총 개원비용</p>
              <p className="text-3xl font-extrabold text-primary">{formatWon(totalCost)}</p>
              <p className="text-xs text-muted-foreground mt-1">{spec.name} 기준</p>
            </div>

            {/* Breakdown bars */}
            <div className="card p-5">
              <p className="text-sm font-semibold mb-3">비용 구성</p>
              <div className="space-y-3">
                {categories.map((cat) => (
                  <div key={cat.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{cat.label}</span>
                      <span className="font-medium">{formatWon(cat.value)} ({pct(cat.value, totalCost)}%)</span>
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

            {/* Industry average comparison */}
            <div className="card p-5">
              <p className="text-sm font-semibold mb-3">업계 평균 비교</p>
              <div className="flex items-end gap-4 justify-center h-32">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="w-16 rounded-t-lg transition-all duration-500"
                    style={{
                      height: `${Math.min(120, (totalCost / Math.max(totalCost, spec.industryAvg)) * 120)}px`,
                      backgroundColor: spec.color,
                    }}
                  />
                  <span className="text-xs font-medium">내 예상</span>
                  <span className="text-xs text-muted-foreground">{formatWon(totalCost)}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="w-16 rounded-t-lg bg-muted transition-all duration-500"
                    style={{
                      height: `${Math.min(120, (spec.industryAvg / Math.max(totalCost, spec.industryAvg)) * 120)}px`,
                    }}
                  />
                  <span className="text-xs font-medium">업계 평균</span>
                  <span className="text-xs text-muted-foreground">{formatWon(spec.industryAvg)}</span>
                </div>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-3">
                {totalCost > spec.industryAvg
                  ? `평균 대비 ${formatWon(totalCost - spec.industryAvg)} 높음`
                  : totalCost < spec.industryAvg
                  ? `평균 대비 ${formatWon(spec.industryAvg - totalCost)} 절감`
                  : '평균과 동일'}
              </p>
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
              <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                본 계산기는 참고용이며, 실제 개원비용은 입지, 건물 상태, 장비 사양 등에 따라 차이가 있습니다. 정확한 견적은 전문 컨설팅을 권장합니다.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
