'use client'

import { useState } from 'react'
import { ArrowLeft, Users, MapPin, Brain, ArrowLeftRight, Building, Wallet, Sun, Moon } from 'lucide-react'
import Link from 'next/link'

const areas = ['강남구 역삼동', '서초구 서초동', '마포구 합정동', '송파구 잠실동', '영등포구 여의도동'] as const
type Area = (typeof areas)[number]

interface AgeGroup { label: string; percent: number }

interface AreaData {
  population: number
  households: number
  ageDistribution: AgeGroup[]
  maleRatio: number
  femaleRatio: number
  dayPopulation: number
  nightPopulation: number
  incomeLevel: string
  incomeIndex: number
  residentialRatio: number
  commercialRatio: number
  medicalDensity: number
  insight: string
}

const areaDataMap: Record<Area, AreaData> = {
  '강남구 역삼동': {
    population: 28456,
    households: 13234,
    ageDistribution: [
      { label: '10대', percent: 6 },
      { label: '20대', percent: 18 },
      { label: '30대', percent: 28 },
      { label: '40대', percent: 22 },
      { label: '50대', percent: 15 },
      { label: '60대+', percent: 11 },
    ],
    maleRatio: 48.2,
    femaleRatio: 51.8,
    dayPopulation: 187000,
    nightPopulation: 28456,
    incomeLevel: '상위',
    incomeIndex: 92,
    residentialRatio: 35,
    commercialRatio: 65,
    medicalDensity: 18.7,
    insight: '이 지역은 30~40대 직장인 밀집으로 내과/정형외과 수요가 높을 것으로 예상됩니다. 점심시간 유동인구 활용이 핵심이며, 피부과/성형외과 경쟁이 매우 치열합니다.',
  },
  '서초구 서초동': {
    population: 32145,
    households: 14567,
    ageDistribution: [
      { label: '10대', percent: 9 },
      { label: '20대', percent: 14 },
      { label: '30대', percent: 24 },
      { label: '40대', percent: 25 },
      { label: '50대', percent: 17 },
      { label: '60대+', percent: 11 },
    ],
    maleRatio: 47.5,
    femaleRatio: 52.5,
    dayPopulation: 145000,
    nightPopulation: 32145,
    incomeLevel: '상위',
    incomeIndex: 89,
    residentialRatio: 45,
    commercialRatio: 55,
    medicalDensity: 15.3,
    insight: '법조타운 인접으로 고소득 전문직 밀집. 40~50대 가족 단위 거주자가 많아 소아과, 치과, 안과 수요가 높습니다. 비급여 의료 소비 의향이 높은 지역입니다.',
  },
  '마포구 합정동': {
    population: 18923,
    households: 10234,
    ageDistribution: [
      { label: '10대', percent: 5 },
      { label: '20대', percent: 28 },
      { label: '30대', percent: 31 },
      { label: '40대', percent: 16 },
      { label: '50대', percent: 12 },
      { label: '60대+', percent: 8 },
    ],
    maleRatio: 46.8,
    femaleRatio: 53.2,
    dayPopulation: 72000,
    nightPopulation: 18923,
    incomeLevel: '중상위',
    incomeIndex: 71,
    residentialRatio: 50,
    commercialRatio: 50,
    medicalDensity: 11.2,
    insight: '20~30대 젊은 유동인구가 많아 피부과, 정신건강의학과 수요가 높습니다. 1인 가구 비율이 높아 야간/주말 진료 수요가 있으며, SNS 마케팅 효과가 큰 상권입니다.',
  },
  '송파구 잠실동': {
    population: 41234,
    households: 17890,
    ageDistribution: [
      { label: '10대', percent: 11 },
      { label: '20대', percent: 13 },
      { label: '30대', percent: 21 },
      { label: '40대', percent: 24 },
      { label: '50대', percent: 18 },
      { label: '60대+', percent: 13 },
    ],
    maleRatio: 48.9,
    femaleRatio: 51.1,
    dayPopulation: 95000,
    nightPopulation: 41234,
    incomeLevel: '상위',
    incomeIndex: 85,
    residentialRatio: 65,
    commercialRatio: 35,
    medicalDensity: 12.8,
    insight: '대규모 아파트 단지 중심의 가족 거주 지역. 소아과, 치과, 안과가 안정적이며 40~50대 대상 건강검진 내과 수요도 높습니다. 주거 비율이 높아 저녁/주말 진료가 유리합니다.',
  },
  '영등포구 여의도동': {
    population: 24678,
    households: 11345,
    ageDistribution: [
      { label: '10대', percent: 7 },
      { label: '20대', percent: 16 },
      { label: '30대', percent: 26 },
      { label: '40대', percent: 23 },
      { label: '50대', percent: 17 },
      { label: '60대+', percent: 11 },
    ],
    maleRatio: 49.1,
    femaleRatio: 50.9,
    dayPopulation: 210000,
    nightPopulation: 24678,
    incomeLevel: '상위',
    incomeIndex: 94,
    residentialRatio: 30,
    commercialRatio: 70,
    medicalDensity: 16.5,
    insight: '금융가 직장인 중심으로 주간 유동인구가 야간의 8.5배. 내과(건강검진), 정형외과, 피부과가 유리하며, 주말 매출은 낮을 수 있으므로 평일 집중 운영 전략이 필요합니다.',
  },
}

const barColors = ['bg-blue-400', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-rose-500']

function AreaDetail({ area, data }: { area: Area; data: AreaData }) {
  const dayNightRatio = data.dayPopulation / data.nightPopulation

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-lg">{area}</h3>
      </div>

      {/* Population & Households */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/50 rounded-xl p-3">
          <p className="text-xs text-muted-foreground">총인구</p>
          <p className="text-xl font-bold">{data.population.toLocaleString()}명</p>
        </div>
        <div className="bg-muted/50 rounded-xl p-3">
          <p className="text-xs text-muted-foreground">세대수</p>
          <p className="text-xl font-bold">{data.households.toLocaleString()}</p>
        </div>
      </div>

      {/* Age Distribution */}
      <div>
        <p className="text-sm font-medium mb-2">연령 분포</p>
        <div className="space-y-2">
          {data.ageDistribution.map((ag, i) => (
            <div key={ag.label} className="flex items-center gap-2">
              <span className="text-xs w-10 text-muted-foreground">{ag.label}</span>
              <div className="flex-1 bg-muted rounded-full h-5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${barColors[i]} flex items-center justify-end pr-2 transition-all duration-500`}
                  style={{ width: `${ag.percent * 2.5}%` }}
                >
                  <span className="text-[10px] font-medium text-white">{ag.percent}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gender */}
      <div>
        <p className="text-sm font-medium mb-2">성별 비율</p>
        <div className="flex h-4 rounded-full overflow-hidden">
          <div className="bg-blue-500 flex items-center justify-center" style={{ width: `${data.maleRatio}%` }}>
            <span className="text-[10px] text-white font-medium">남 {data.maleRatio}%</span>
          </div>
          <div className="bg-pink-500 flex items-center justify-center" style={{ width: `${data.femaleRatio}%` }}>
            <span className="text-[10px] text-white font-medium">여 {data.femaleRatio}%</span>
          </div>
        </div>
      </div>

      {/* Day / Night Population */}
      <div>
        <p className="text-sm font-medium mb-2">주간/야간 유동인구</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-2.5">
            <Sun className="w-4 h-4 text-amber-500" />
            <div>
              <p className="text-xs text-muted-foreground">주간</p>
              <p className="font-semibold text-sm">{(data.dayPopulation / 1000).toFixed(0)}K</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/30 rounded-lg p-2.5">
            <Moon className="w-4 h-4 text-slate-500" />
            <div>
              <p className="text-xs text-muted-foreground">야간</p>
              <p className="font-semibold text-sm">{(data.nightPopulation / 1000).toFixed(1)}K</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">주간/야간 비율: <span className="font-medium text-foreground">{dayNightRatio.toFixed(1)}배</span></p>
      </div>

      {/* Other Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/50 rounded-xl p-3">
          <p className="text-xs text-muted-foreground">소득수준</p>
          <div className="flex items-center gap-2 mt-1">
            <Wallet className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold text-sm">{data.incomeLevel}</span>
            <span className="text-xs text-muted-foreground">({data.incomeIndex}점)</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 mt-2">
            <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${data.incomeIndex}%` }} />
          </div>
        </div>
        <div className="bg-muted/50 rounded-xl p-3">
          <p className="text-xs text-muted-foreground">의료기관 밀도</p>
          <div className="flex items-center gap-1 mt-1">
            <Building className="w-4 h-4 text-blue-500" />
            <span className="font-semibold text-sm">{data.medicalDensity}</span>
            <span className="text-xs text-muted-foreground">/ 만명</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 mt-2">
            <div
              className={`h-1.5 rounded-full ${data.medicalDensity > 15 ? 'bg-red-500' : data.medicalDensity > 10 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(data.medicalDensity * 5, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Residential vs Commercial */}
      <div>
        <p className="text-sm font-medium mb-2">주거 vs 상업 비율</p>
        <div className="flex h-5 rounded-full overflow-hidden">
          <div className="bg-teal-500 flex items-center justify-center" style={{ width: `${data.residentialRatio}%` }}>
            <span className="text-[10px] text-white font-medium">주거 {data.residentialRatio}%</span>
          </div>
          <div className="bg-orange-500 flex items-center justify-center" style={{ width: `${data.commercialRatio}%` }}>
            <span className="text-[10px] text-white font-medium">상업 {data.commercialRatio}%</span>
          </div>
        </div>
      </div>

      {/* AI Insight */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <Brain className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-primary mb-1">AI 분석 인사이트</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{data.insight}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DemographicsPage() {
  const [selectedArea, setSelectedArea] = useState<Area>('강남구 역삼동')
  const [compareMode, setCompareMode] = useState(false)
  const [compareArea, setCompareArea] = useState<Area>('서초구 서초동')

  return (
    <div className="min-h-screen bg-background">
      <header className="glass sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/dashboard" className="btn-ghost p-2 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Users className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold">상권 인구통계 분석</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Area Selector */}
        <div className="card p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">분석 지역 선택</p>
            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                compareMode ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              비교 모드
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {areas.map((a) => (
              <button key={a} onClick={() => setSelectedArea(a)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedArea === a ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >{a}</button>
            ))}
          </div>
          {compareMode && (
            <div className="mt-3 pt-3 border-t border-muted">
              <p className="text-xs text-muted-foreground mb-2">비교 지역 선택</p>
              <div className="flex flex-wrap gap-2">
                {areas.filter((a) => a !== selectedArea).map((a) => (
                  <button key={a} onClick={() => setCompareArea(a)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      compareArea === a ? 'bg-violet-600 text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >{a}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {compareMode ? (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card p-5 border-t-2 border-t-primary">
              <AreaDetail area={selectedArea} data={areaDataMap[selectedArea]} />
            </div>
            <div className="card p-5 border-t-2 border-t-violet-600">
              <AreaDetail area={compareArea} data={areaDataMap[compareArea]} />
            </div>
          </div>
        ) : (
          <div className="card p-5">
            <AreaDetail area={selectedArea} data={areaDataMap[selectedArea]} />
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-8 text-center">
          * 통계청, 서울 열린데이터광장 기반 분석. 실제 수치와 차이가 있을 수 있습니다.
        </p>
      </main>
    </div>
  )
}
