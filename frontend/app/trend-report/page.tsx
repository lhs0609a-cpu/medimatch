'use client'

import { useState } from 'react'
import { ArrowLeft, TrendingUp, TrendingDown, Activity, Building2, AlertTriangle, BarChart3 } from 'lucide-react'
import Link from 'next/link'

const specialties = [
  '내과', '정형외과', '피부과', '안과', '치과', '소아과', '산부인과', '비뇨기과', '정신건강의학과', '재활의학과',
] as const

const regions = [
  '전국', '서울', '경기', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
] as const

type Specialty = (typeof specialties)[number]

interface YearData { year: number; count: number; change: number }

interface SpecialtyData {
  yearlyTrend: YearData[]
  closureRate: number
  avgDailyPatients: number
  avgAnnualRevenue: string
  summary: string
  nationalTotal: number
  newOpenings: number
  closures: number
  netGrowth: number
}

const specialtyDataMap: Record<Specialty, SpecialtyData> = {
  '내과': {
    yearlyTrend: [
      { year: 2020, count: 9245, change: 0 },
      { year: 2021, count: 9412, change: 1.8 },
      { year: 2022, count: 9598, change: 2.0 },
      { year: 2023, count: 9721, change: 1.3 },
      { year: 2024, count: 9867, change: 1.5 },
      { year: 2025, count: 9953, change: 0.9 },
    ],
    closureRate: 3.2,
    avgDailyPatients: 52,
    avgAnnualRevenue: '7.8억',
    summary: '내과: 고령화로 만성질환 수요 꾸준, 동네의원 중심으로 안정적 성장. 건강검진 특화 의원이 신규 트렌드.',
    nationalTotal: 9953,
    newOpenings: 412,
    closures: 326,
    netGrowth: 86,
  },
  '정형외과': {
    yearlyTrend: [
      { year: 2020, count: 4521, change: 0 },
      { year: 2021, count: 4598, change: 1.7 },
      { year: 2022, count: 4687, change: 1.9 },
      { year: 2023, count: 4753, change: 1.4 },
      { year: 2024, count: 4834, change: 1.7 },
      { year: 2025, count: 4891, change: 1.2 },
    ],
    closureRate: 2.8,
    avgDailyPatients: 61,
    avgAnnualRevenue: '9.2억',
    summary: '정형외과: 스포츠 의학, 도수치료 수요 증가. 비급여 매출 비중 높아 수익성 양호하나 장비 투자 필요.',
    nationalTotal: 4891,
    newOpenings: 203,
    closures: 146,
    netGrowth: 57,
  },
  '피부과': {
    yearlyTrend: [
      { year: 2020, count: 3102, change: 0 },
      { year: 2021, count: 3245, change: 4.6 },
      { year: 2022, count: 3421, change: 5.4 },
      { year: 2023, count: 3589, change: 4.9 },
      { year: 2024, count: 3756, change: 4.7 },
      { year: 2025, count: 3912, change: 4.2 },
    ],
    closureRate: 4.1,
    avgDailyPatients: 38,
    avgAnnualRevenue: '11.5억',
    summary: '피부과: 미용 시술 수요 증가로 신규 개원 활발, 경쟁 심화. 비급여 중심 고매출이나 폐원율도 높은 편.',
    nationalTotal: 3912,
    newOpenings: 367,
    closures: 211,
    netGrowth: 156,
  },
  '안과': {
    yearlyTrend: [
      { year: 2020, count: 2134, change: 0 },
      { year: 2021, count: 2167, change: 1.5 },
      { year: 2022, count: 2203, change: 1.7 },
      { year: 2023, count: 2234, change: 1.4 },
      { year: 2024, count: 2271, change: 1.7 },
      { year: 2025, count: 2298, change: 1.2 },
    ],
    closureRate: 2.1,
    avgDailyPatients: 45,
    avgAnnualRevenue: '8.9억',
    summary: '안과: 라식/라섹 수요 감소, 노안/백내장 수술 수요 증가. 고가 장비 투자 필수로 진입 장벽 높음.',
    nationalTotal: 2298,
    newOpenings: 98,
    closures: 71,
    netGrowth: 27,
  },
  '치과': {
    yearlyTrend: [
      { year: 2020, count: 18234, change: 0 },
      { year: 2021, count: 18567, change: 1.8 },
      { year: 2022, count: 18912, change: 1.9 },
      { year: 2023, count: 19198, change: 1.5 },
      { year: 2024, count: 19534, change: 1.8 },
      { year: 2025, count: 19812, change: 1.4 },
    ],
    closureRate: 3.5,
    avgDailyPatients: 22,
    avgAnnualRevenue: '6.5억',
    summary: '치과: 임플란트 급여화 이후 수요 급증, 네트워크 치과 확장으로 개인 의원 경쟁 심화.',
    nationalTotal: 19812,
    newOpenings: 978,
    closures: 700,
    netGrowth: 278,
  },
  '소아과': {
    yearlyTrend: [
      { year: 2020, count: 2876, change: 0 },
      { year: 2021, count: 2798, change: -2.7 },
      { year: 2022, count: 2712, change: -3.1 },
      { year: 2023, count: 2643, change: -2.5 },
      { year: 2024, count: 2587, change: -2.1 },
      { year: 2025, count: 2534, change: -2.0 },
    ],
    closureRate: 6.8,
    avgDailyPatients: 34,
    avgAnnualRevenue: '4.8억',
    summary: '소아과: 저출산 영향으로 지속 감소. 수도권 외 지역은 폐원 가속화. 정부 지원책 필요.',
    nationalTotal: 2534,
    newOpenings: 67,
    closures: 120,
    netGrowth: -53,
  },
  '산부인과': {
    yearlyTrend: [
      { year: 2020, count: 1534, change: 0 },
      { year: 2021, count: 1498, change: -2.3 },
      { year: 2022, count: 1467, change: -2.1 },
      { year: 2023, count: 1423, change: -3.0 },
      { year: 2024, count: 1398, change: -1.8 },
      { year: 2025, count: 1378, change: -1.4 },
    ],
    closureRate: 5.9,
    avgDailyPatients: 28,
    avgAnnualRevenue: '5.2억',
    summary: '산부인과: 출산율 감소로 분만 의원 급감. 여성 건강검진, 미용 시술 등으로 전환하는 추세.',
    nationalTotal: 1378,
    newOpenings: 34,
    closures: 54,
    netGrowth: -20,
  },
  '비뇨기과': {
    yearlyTrend: [
      { year: 2020, count: 1245, change: 0 },
      { year: 2021, count: 1278, change: 2.6 },
      { year: 2022, count: 1312, change: 2.7 },
      { year: 2023, count: 1356, change: 3.4 },
      { year: 2024, count: 1398, change: 3.1 },
      { year: 2025, count: 1434, change: 2.6 },
    ],
    closureRate: 2.4,
    avgDailyPatients: 35,
    avgAnnualRevenue: '7.1억',
    summary: '비뇨기과: 남성 건강, 전립선 질환 수요 증가. 비급여(남성의학) 영역 성장으로 수익성 개선.',
    nationalTotal: 1434,
    newOpenings: 89,
    closures: 53,
    netGrowth: 36,
  },
  '정신건강의학과': {
    yearlyTrend: [
      { year: 2020, count: 1876, change: 0 },
      { year: 2021, count: 1978, change: 5.4 },
      { year: 2022, count: 2112, change: 6.8 },
      { year: 2023, count: 2267, change: 7.3 },
      { year: 2024, count: 2423, change: 6.9 },
      { year: 2025, count: 2567, change: 5.9 },
    ],
    closureRate: 1.9,
    avgDailyPatients: 29,
    avgAnnualRevenue: '5.6억',
    summary: '정신건강의학과: 코로나 이후 정신건강 수요 폭증. 가장 빠른 성장세. 초기 투자 비용 낮아 진입 용이.',
    nationalTotal: 2567,
    newOpenings: 287,
    closures: 143,
    netGrowth: 144,
  },
  '재활의학과': {
    yearlyTrend: [
      { year: 2020, count: 1687, change: 0 },
      { year: 2021, count: 1734, change: 2.8 },
      { year: 2022, count: 1789, change: 3.2 },
      { year: 2023, count: 1845, change: 3.1 },
      { year: 2024, count: 1912, change: 3.6 },
      { year: 2025, count: 1967, change: 2.9 },
    ],
    closureRate: 2.6,
    avgDailyPatients: 48,
    avgAnnualRevenue: '6.8억',
    summary: '재활의학과: 고령화·운동인구 증가로 꾸준한 성장. 도수치료 비급여 매출이 핵심 수익원.',
    nationalTotal: 1967,
    newOpenings: 145,
    closures: 90,
    netGrowth: 55,
  },
}

const regionMultiplier: Record<string, number> = {
  '전국': 1.0, '서울': 0.21, '경기': 0.24, '부산': 0.07, '대구': 0.05, '인천': 0.06,
  '광주': 0.03, '대전': 0.03, '울산': 0.02, '세종': 0.01, '강원': 0.03, '충북': 0.03,
  '충남': 0.04, '전북': 0.03, '전남': 0.03, '경북': 0.05, '경남': 0.06, '제주': 0.01,
}

export default function TrendReportPage() {
  const [selected, setSelected] = useState<Specialty>('내과')
  const [region, setRegion] = useState('전국')

  const data = specialtyDataMap[selected]
  const mult = regionMultiplier[region] || 1.0

  const adjusted = {
    nationalTotal: region === '전국' ? data.nationalTotal : Math.round(data.nationalTotal * mult),
    newOpenings: region === '전국' ? data.newOpenings : Math.round(data.newOpenings * mult),
    closures: region === '전국' ? data.closures : Math.round(data.closures * mult),
    netGrowth: region === '전국' ? data.netGrowth : Math.round(data.netGrowth * mult),
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="glass sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/dashboard" className="btn-ghost p-2 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <BarChart3 className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold">진료과별 트렌드 리포트</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="card p-4">
            <p className="text-xs text-muted-foreground mb-1">{region} 의원수</p>
            <p className="text-2xl font-bold">{adjusted.nationalTotal.toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-1">
              <Building2 className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-xs text-muted-foreground">2025 기준</span>
            </div>
          </div>
          <div className="card p-4">
            <p className="text-xs text-muted-foreground mb-1">신규 개원</p>
            <p className="text-2xl font-bold text-emerald-600">+{adjusted.newOpenings}</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs text-muted-foreground">연간</span>
            </div>
          </div>
          <div className="card p-4">
            <p className="text-xs text-muted-foreground mb-1">폐원</p>
            <p className="text-2xl font-bold text-red-500">-{adjusted.closures}</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingDown className="w-3.5 h-3.5 text-red-500" />
              <span className="text-xs text-muted-foreground">연간</span>
            </div>
          </div>
          <div className="card p-4">
            <p className="text-xs text-muted-foreground mb-1">순증가</p>
            <p className={`text-2xl font-bold ${adjusted.netGrowth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {adjusted.netGrowth >= 0 ? '+' : ''}{adjusted.netGrowth}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <Activity className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-muted-foreground">개원-폐원</span>
            </div>
          </div>
        </div>

        {/* Region Filter */}
        <div className="card p-4 mb-6">
          <p className="text-sm font-medium text-muted-foreground mb-3">지역 필터</p>
          <div className="flex flex-wrap gap-2">
            {regions.map((r) => (
              <button key={r} onClick={() => setRegion(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  region === r ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >{r}</button>
            ))}
          </div>
        </div>

        {/* Specialty Tabs */}
        <div className="card p-4 mb-6">
          <p className="text-sm font-medium text-muted-foreground mb-3">진료과 선택</p>
          <div className="flex flex-wrap gap-2">
            {specialties.map((sp) => (
              <button key={sp} onClick={() => setSelected(sp)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selected === sp ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >{sp}</button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Yearly Trend Table */}
          <div className="lg:col-span-2 card p-5">
            <h2 className="font-semibold mb-4">전국 개원수 추이 (2020~2025)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-muted">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">연도</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">의원수</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">변화율</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">추이</th>
                  </tr>
                </thead>
                <tbody>
                  {data.yearlyTrend.map((row, i) => (
                    <tr key={row.year} className={i % 2 === 0 ? 'bg-muted/30' : ''}>
                      <td className="py-2.5 px-3 font-medium">{row.year}</td>
                      <td className="py-2.5 px-3 text-right">{Math.round(row.count * mult).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right">
                        {i === 0 ? (
                          <span className="text-muted-foreground">-</span>
                        ) : (
                          <span className={row.change >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                            {row.change >= 0 ? '+' : ''}{row.change}%
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {i > 0 && (
                          <div className="flex items-center">
                            <div
                              className={`h-2.5 rounded-full ${row.change >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.min(Math.abs(row.change) * 15, 100)}px` }}
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="font-semibold mb-3">핵심 지표</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-muted-foreground">폐원율</span>
                    <span className={`text-sm font-bold ${data.closureRate > 4 ? 'text-red-500' : data.closureRate > 3 ? 'text-amber-500' : 'text-emerald-600'}`}>
                      {data.closureRate}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${data.closureRate > 4 ? 'bg-red-500' : data.closureRate > 3 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(data.closureRate * 10, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-muted">
                  <span className="text-sm text-muted-foreground">평균 일 환자수</span>
                  <span className="font-semibold">{data.avgDailyPatients}명</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-muted">
                  <span className="text-sm text-muted-foreground">평균 연매출</span>
                  <span className="font-semibold">{data.avgAnnualRevenue}</span>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-start gap-2">
                {data.netGrowth >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                )}
                <div>
                  <h3 className="font-semibold mb-2">트렌드 요약</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{data.summary}</p>
                </div>
              </div>
            </div>

            <div className="card p-5 bg-primary/5 border-primary/20">
              <p className="text-xs text-muted-foreground mb-1">성장/감소 판정</p>
              {data.netGrowth >= 0 ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-sm font-semibold text-emerald-700">성장 중</span>
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm font-semibold text-red-600">감소 추세</span>
                  <TrendingDown className="w-4 h-4 text-red-500" />
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-8 text-center">
          * HIRA(건강보험심사평가원) 공개 데이터 기반 분석. 실제 수치와 차이가 있을 수 있습니다.
        </p>
      </main>
    </div>
  )
}
