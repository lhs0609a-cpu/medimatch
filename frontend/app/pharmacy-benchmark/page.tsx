'use client'

import { useState, useMemo } from 'react'
import { ArrowLeft, BarChart3, MapPin, Ruler, Target, TrendingUp, Award, Info, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

type LocationType = '병원밀집' | '주택가' | '역세권' | '대학가' | '오피스가'
type ScaleType = '소형' | '중형' | '대형'

interface BenchmarkMetric {
  key: string
  label: string
  unit: string
  ranges: Record<LocationType, Record<ScaleType, [number, number]>>
}

const metrics: BenchmarkMetric[] = [
  {
    key: 'prescriptions', label: '일평균 처방전 수', unit: '건',
    ranges: {
      '병원밀집': { '소형': [100, 140], '중형': [130, 180], '대형': [170, 250] },
      '주택가': { '소형': [60, 90], '중형': [85, 120], '대형': [110, 160] },
      '역세권': { '소형': [80, 110], '중형': [100, 150], '대형': [140, 200] },
      '대학가': { '소형': [50, 80], '중형': [75, 110], '대형': [100, 140] },
      '오피스가': { '소형': [70, 100], '중형': [95, 135], '대형': [125, 180] },
    },
  },
  {
    key: 'revenue', label: '월 매출', unit: '만원',
    ranges: {
      '병원밀집': { '소형': [7000, 10000], '중형': [9500, 13000], '대형': [12000, 18000] },
      '주택가': { '소형': [4500, 7000], '중형': [6500, 9500], '대형': [8500, 13000] },
      '역세권': { '소형': [5500, 8000], '중형': [7500, 11000], '대형': [10000, 15000] },
      '대학가': { '소형': [3500, 5500], '중형': [5000, 8000], '대형': [7000, 11000] },
      '오피스가': { '소형': [5000, 7500], '중형': [7000, 10500], '대형': [9500, 14000] },
    },
  },
  {
    key: 'rxRatio', label: '조제 매출 비율', unit: '%',
    ranges: {
      '병원밀집': { '소형': [82, 90], '중형': [80, 88], '대형': [78, 85] },
      '주택가': { '소형': [70, 80], '중형': [68, 78], '대형': [65, 75] },
      '역세권': { '소형': [72, 82], '중형': [70, 80], '대형': [68, 78] },
      '대학가': { '소형': [60, 72], '중형': [58, 70], '대형': [55, 68] },
      '오피스가': { '소형': [74, 84], '중형': [72, 82], '대형': [70, 80] },
    },
  },
  {
    key: 'otcRatio', label: 'OTC/건식 매출 비율', unit: '%',
    ranges: {
      '병원밀집': { '소형': [10, 18], '중형': [12, 20], '대형': [15, 22] },
      '주택가': { '소형': [20, 30], '중형': [22, 32], '대형': [25, 35] },
      '역세권': { '소형': [18, 28], '중형': [20, 30], '대형': [22, 32] },
      '대학가': { '소형': [28, 40], '중형': [30, 42], '대형': [32, 45] },
      '오피스가': { '소형': [16, 26], '중형': [18, 28], '대형': [20, 30] },
    },
  },
  {
    key: 'drugCostRatio', label: '약품비 비율', unit: '%',
    ranges: {
      '병원밀집': { '소형': [68, 75], '중형': [67, 74], '대형': [65, 72] },
      '주택가': { '소형': [65, 72], '중형': [63, 70], '대형': [62, 68] },
      '역세권': { '소형': [66, 73], '중형': [64, 71], '대형': [63, 70] },
      '대학가': { '소형': [62, 70], '중형': [60, 68], '대형': [58, 66] },
      '오피스가': { '소형': [67, 74], '중형': [65, 72], '대형': [64, 70] },
    },
  },
  {
    key: 'laborCostRatio', label: '인건비 비율', unit: '%',
    ranges: {
      '병원밀집': { '소형': [8, 12], '중형': [10, 14], '대형': [12, 16] },
      '주택가': { '소형': [9, 13], '중형': [10, 14], '대형': [11, 15] },
      '역세권': { '소형': [9, 13], '중형': [11, 15], '대형': [12, 16] },
      '대학가': { '소형': [10, 14], '중형': [11, 15], '대형': [13, 17] },
      '오피스가': { '소형': [9, 13], '중형': [10, 14], '대형': [12, 16] },
    },
  },
  {
    key: 'netMargin', label: '순이익률', unit: '%',
    ranges: {
      '병원밀집': { '소형': [10, 16], '중형': [11, 17], '대형': [12, 18] },
      '주택가': { '소형': [8, 13], '중형': [9, 14], '대형': [10, 15] },
      '역세권': { '소형': [9, 14], '중형': [10, 15], '대형': [11, 16] },
      '대학가': { '소형': [7, 12], '중형': [8, 13], '대형': [9, 14] },
      '오피스가': { '소형': [9, 14], '중형': [10, 15], '대형': [11, 16] },
    },
  },
  {
    key: 'rxPerPharmacist', label: '약사 1인당 처방전', unit: '건/일',
    ranges: {
      '병원밀집': { '소형': [50, 65], '중형': [48, 62], '대형': [45, 58] },
      '주택가': { '소형': [35, 50], '중형': [38, 52], '대형': [40, 55] },
      '역세권': { '소형': [42, 55], '중형': [40, 54], '대형': [38, 52] },
      '대학가': { '소형': [30, 45], '중형': [33, 48], '대형': [35, 50] },
      '오피스가': { '소형': [40, 52], '중형': [38, 50], '대형': [36, 48] },
    },
  },
]

const improvementTips = [
  { title: '처방전 확보 전략', desc: '인근 병원/의원과 관계 구축. 처방전 유출 방지를 위해 대기시간 10분 이내 유지, 복약 상담 강화로 단골 확보', icon: '📋' },
  { title: 'OTC/건식 매출 확대', desc: '카운터 앞 골든존 활용, 계절별 진열 변경, "약사 추천" POP 활용. 건강기능식품 전문 상담 역량 강화', icon: '💊' },
  { title: '인건비 최적화', desc: '피크 시간대 파트타임 약사 활용, 자동 조제기(ATC) 도입으로 효율화. 약사 1인당 처방전 50건 이상 목표', icon: '👥' },
  { title: '약품비 절감', desc: '도매상 2~3곳 비교 구매, 수량 할인 적극 활용. 제네릭 전환으로 마진율 개선. 재고 회전율 월 2회 이상 유지', icon: '📦' },
  { title: '고객 경험 개선', desc: '대기 공간 쾌적화, 키오스크 순번 시스템, 복약 지도 앱 연동. 단골 고객 프로그램으로 재방문율 30% 이상 확보', icon: '⭐' },
]

const locationTypes: LocationType[] = ['병원밀집', '주택가', '역세권', '대학가', '오피스가']
const scaleTypes: ScaleType[] = ['소형', '중형', '대형']

export default function PharmacyBenchmarkPage() {
  const [location, setLocation] = useState<LocationType>('병원밀집')
  const [scale, setScale] = useState<ScaleType>('중형')
  const [myValues, setMyValues] = useState<Record<string, string>>({})
  const [showComparison, setShowComparison] = useState(false)

  const getGrade = (key: string, value: number): { grade: string; color: string } => {
    const metric = metrics.find(m => m.key === key)
    if (!metric) return { grade: '-', color: 'text-muted-foreground' }
    const [low, high] = metric.ranges[location][scale]
    const mid = (low + high) / 2

    // For cost ratios (lower is better)
    const lowerIsBetter = ['drugCostRatio', 'laborCostRatio'].includes(key)

    if (lowerIsBetter) {
      if (value <= low) return { grade: 'A', color: 'text-green-600' }
      if (value <= mid) return { grade: 'B', color: 'text-blue-600' }
      if (value <= high) return { grade: 'C', color: 'text-amber-600' }
      return { grade: 'D', color: 'text-red-600' }
    } else {
      if (value >= high) return { grade: 'A', color: 'text-green-600' }
      if (value >= mid) return { grade: 'B', color: 'text-blue-600' }
      if (value >= low) return { grade: 'C', color: 'text-amber-600' }
      return { grade: 'D', color: 'text-red-600' }
    }
  }

  const overallGrade = useMemo(() => {
    const grades = metrics.map(m => {
      const val = Number(myValues[m.key])
      if (!val) return null
      return getGrade(m.key, val).grade
    }).filter(Boolean) as string[]
    if (grades.length === 0) return null
    const score = grades.reduce((sum, g) => sum + ({ A: 4, B: 3, C: 2, D: 1 }[g] || 0), 0) / grades.length
    if (score >= 3.5) return { grade: 'A', color: 'text-green-600', label: '우수' }
    if (score >= 2.5) return { grade: 'B', color: 'text-blue-600', label: '양호' }
    if (score >= 1.5) return { grade: 'C', color: 'text-amber-600', label: '보통' }
    return { grade: 'D', color: 'text-red-600', label: '개선 필요' }
  }, [myValues, location, scale])

  return (
    <div className="min-h-screen bg-background">
      <header className="glass sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/dashboard" className="btn-ghost p-2 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <BarChart3 className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold">약국 경영 벤치마크</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl space-y-8">
        {/* Selectors */}
        <div className="card p-5">
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <MapPin className="w-4 h-4 text-primary" />입지 유형
              </label>
              <div className="flex flex-wrap gap-2">
                {locationTypes.map(l => (
                  <button key={l} onClick={() => setLocation(l)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${location === l ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <Ruler className="w-4 h-4 text-primary" />약국 규모
              </label>
              <div className="flex gap-2">
                {scaleTypes.map(s => (
                  <button key={s} onClick={() => setScale(s)} className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${scale === s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
                    {s}
                    <span className="block text-xs opacity-80 mt-0.5">
                      {s === '소형' ? '(20평 미만)' : s === '중형' ? '(20~40평)' : '(40평 이상)'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Overall Grade */}
        {overallGrade && (
          <div className="card p-5 text-center">
            <p className="text-sm text-muted-foreground mb-2">내 약국 종합 등급</p>
            <div className={`text-6xl font-black ${overallGrade.color}`}>{overallGrade.grade}</div>
            <p className={`text-lg font-semibold mt-1 ${overallGrade.color}`}>{overallGrade.label}</p>
          </div>
        )}

        {/* Benchmark Table */}
        <div className="card p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            {location} / {scale} 기준 벤치마크
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-semibold text-foreground">지표</th>
                  <th className="text-center py-3 px-2 font-semibold text-foreground">업계 평균 범위</th>
                  <th className="text-center py-3 px-2 font-semibold text-primary">내 약국</th>
                  <th className="text-center py-3 px-2 font-semibold text-foreground">등급</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((m) => {
                  const [low, high] = m.ranges[location][scale]
                  const myVal = Number(myValues[m.key])
                  const gradeInfo = myVal ? getGrade(m.key, myVal) : null
                  return (
                    <tr key={m.key} className="border-b border-border/50">
                      <td className="py-3 px-2 font-medium text-foreground">{m.label}</td>
                      <td className="py-3 px-2 text-center text-muted-foreground">
                        {m.key === 'revenue' ? `${(low / 10000).toFixed(0)}억~${(high / 10000).toFixed(0) === '0' ? high.toLocaleString() + '만원' : (high / 10000).toFixed(1) + '억'}` : `${low.toLocaleString()}~${high.toLocaleString()}${m.unit}`}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <input
                          type="number"
                          value={myValues[m.key] || ''}
                          onChange={e => setMyValues(prev => ({ ...prev, [m.key]: e.target.value }))}
                          placeholder="입력"
                          className="input w-24 text-center text-sm mx-auto"
                        />
                      </td>
                      <td className="py-3 px-2 text-center">
                        {gradeInfo ? (
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-lg ${gradeInfo.color} ${gradeInfo.grade === 'A' ? 'bg-green-100' : gradeInfo.grade === 'B' ? 'bg-blue-100' : gradeInfo.grade === 'C' ? 'bg-amber-100' : 'bg-red-100'}`}>
                            {gradeInfo.grade}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-start gap-2 mt-4 p-3 bg-muted rounded-lg">
            <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">등급 기준: A(상위 25%) B(평균 이상) C(평균 범위) D(개선 필요). 비용 지표(약품비/인건비)는 낮을수록 좋은 등급입니다.</p>
          </div>
        </div>

        {/* Location Comparison */}
        <div className="card p-5">
          <button onClick={() => setShowComparison(!showComparison)} className="w-full flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" />입지 유형별 비교 ({scale})</h2>
            {showComparison ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </button>
          {showComparison && (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-semibold text-foreground">지표</th>
                    {locationTypes.map(l => (
                      <th key={l} className={`text-center py-3 px-2 font-semibold ${l === location ? 'text-primary' : 'text-foreground'}`}>{l}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metrics.slice(0, 5).map(m => (
                    <tr key={m.key} className="border-b border-border/50">
                      <td className="py-3 px-2 font-medium text-foreground text-xs">{m.label}</td>
                      {locationTypes.map(l => {
                        const [low, high] = m.ranges[l][scale]
                        return (
                          <td key={l} className={`py-3 px-2 text-center text-xs ${l === location ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                            {low.toLocaleString()}~{high.toLocaleString()}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Improvement Tips */}
        <div className="card p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" />매출 향상 전략 5가지</h2>
          <div className="space-y-4">
            {improvementTips.map((tip, i) => (
              <div key={i} className="flex items-start gap-4 p-4 bg-muted rounded-xl">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg flex-shrink-0">{tip.icon}</div>
                <div>
                  <h3 className="font-bold text-foreground mb-1">{tip.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grade Legend */}
        <div className="card p-5">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Award className="w-5 h-5 text-primary" />등급 해석 가이드</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { grade: 'A', label: '우수', desc: '업계 상위 25%', color: 'bg-green-100 text-green-700 border-green-200' },
              { grade: 'B', label: '양호', desc: '평균 이상', color: 'bg-blue-100 text-blue-700 border-blue-200' },
              { grade: 'C', label: '보통', desc: '업계 평균 수준', color: 'bg-amber-100 text-amber-700 border-amber-200' },
              { grade: 'D', label: '개선 필요', desc: '평균 미달', color: 'bg-red-100 text-red-700 border-red-200' },
            ].map(g => (
              <div key={g.grade} className={`rounded-xl p-3 text-center border ${g.color}`}>
                <div className="text-2xl font-black">{g.grade}</div>
                <div className="font-semibold text-sm">{g.label}</div>
                <div className="text-xs opacity-80 mt-1">{g.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
