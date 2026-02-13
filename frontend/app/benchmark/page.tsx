'use client'

import { useState } from 'react'
import {
  ArrowLeft, BarChart3, Users, DollarSign, TrendingUp,
  Building2, Percent, Activity, Target, ChevronRight,
  AlertCircle, CheckCircle2, MinusCircle
} from 'lucide-react'
import Link from 'next/link'

const specialtyOptions = [
  { id: 'internal', label: '내과' },
  { id: 'ortho', label: '정형외과' },
  { id: 'derma', label: '피부과' },
  { id: 'pedia', label: '소아과' },
  { id: 'obgyn', label: '산부인과' },
  { id: 'ent', label: '이비인후과' },
  { id: 'eye', label: '안과' },
  { id: 'dental', label: '치과' },
]

const regionOptions = [
  { id: 'seoul', label: '서울' },
  { id: 'gyeonggi', label: '경기' },
  { id: 'busan', label: '부산' },
  { id: 'daegu', label: '대구' },
  { id: 'incheon', label: '인천' },
  { id: 'daejeon', label: '대전' },
  { id: 'gwangju', label: '광주' },
  { id: 'local', label: '기타 지방' },
]

type BenchmarkData = {
  dailyPatients: { avg: number; top25: number };
  monthlyRevenue: { avg: number; range: string };
  laborCostRatio: { target: string; avg: number };
  rentRatio: { target: string; avg: number };
  materialCostRatio: { avg: number };
  operatingMargin: { avg: number; range: string };
  revenuePerPatient: { avg: number };
  revisitRate: { avg: number; target: number };
}

const benchmarks: Record<string, BenchmarkData> = {
  internal: {
    dailyPatients: { avg: 42, top25: 65 },
    monthlyRevenue: { avg: 5800, range: '3,000~12,000' },
    laborCostRatio: { target: '40~50%', avg: 44 },
    rentRatio: { target: '10~15%', avg: 12 },
    materialCostRatio: { avg: 8 },
    operatingMargin: { avg: 28, range: '20~40%' },
    revenuePerPatient: { avg: 55000 },
    revisitRate: { avg: 58, target: 65 },
  },
  ortho: {
    dailyPatients: { avg: 55, top25: 85 },
    monthlyRevenue: { avg: 7200, range: '4,000~15,000' },
    laborCostRatio: { target: '40~50%', avg: 46 },
    rentRatio: { target: '10~15%', avg: 11 },
    materialCostRatio: { avg: 12 },
    operatingMargin: { avg: 25, range: '18~35%' },
    revenuePerPatient: { avg: 52000 },
    revisitRate: { avg: 62, target: 70 },
  },
  derma: {
    dailyPatients: { avg: 38, top25: 55 },
    monthlyRevenue: { avg: 6500, range: '3,500~14,000' },
    laborCostRatio: { target: '35~45%', avg: 40 },
    rentRatio: { target: '12~18%', avg: 15 },
    materialCostRatio: { avg: 18 },
    operatingMargin: { avg: 22, range: '15~35%' },
    revenuePerPatient: { avg: 68000 },
    revisitRate: { avg: 55, target: 60 },
  },
  pedia: {
    dailyPatients: { avg: 50, top25: 80 },
    monthlyRevenue: { avg: 4500, range: '2,500~9,000' },
    laborCostRatio: { target: '42~52%', avg: 47 },
    rentRatio: { target: '10~14%', avg: 12 },
    materialCostRatio: { avg: 6 },
    operatingMargin: { avg: 24, range: '18~32%' },
    revenuePerPatient: { avg: 36000 },
    revisitRate: { avg: 65, target: 70 },
  },
  obgyn: {
    dailyPatients: { avg: 30, top25: 50 },
    monthlyRevenue: { avg: 5200, range: '2,800~11,000' },
    laborCostRatio: { target: '40~50%', avg: 45 },
    rentRatio: { target: '10~15%', avg: 13 },
    materialCostRatio: { avg: 10 },
    operatingMargin: { avg: 26, range: '18~38%' },
    revenuePerPatient: { avg: 69000 },
    revisitRate: { avg: 52, target: 60 },
  },
  ent: {
    dailyPatients: { avg: 48, top25: 75 },
    monthlyRevenue: { avg: 5100, range: '2,800~10,000' },
    laborCostRatio: { target: '40~48%', avg: 43 },
    rentRatio: { target: '10~14%', avg: 11 },
    materialCostRatio: { avg: 7 },
    operatingMargin: { avg: 30, range: '22~40%' },
    revenuePerPatient: { avg: 42000 },
    revisitRate: { avg: 60, target: 65 },
  },
  eye: {
    dailyPatients: { avg: 35, top25: 55 },
    monthlyRevenue: { avg: 6800, range: '3,500~15,000' },
    laborCostRatio: { target: '38~46%', avg: 41 },
    rentRatio: { target: '10~15%', avg: 13 },
    materialCostRatio: { avg: 15 },
    operatingMargin: { avg: 27, range: '20~38%' },
    revenuePerPatient: { avg: 78000 },
    revisitRate: { avg: 50, target: 58 },
  },
  dental: {
    dailyPatients: { avg: 22, top25: 35 },
    monthlyRevenue: { avg: 7000, range: '3,500~16,000' },
    laborCostRatio: { target: '35~45%', avg: 40 },
    rentRatio: { target: '10~15%', avg: 14 },
    materialCostRatio: { avg: 20 },
    operatingMargin: { avg: 22, range: '15~32%' },
    revenuePerPatient: { avg: 127000 },
    revisitRate: { avg: 45, target: 55 },
  },
}

const regionMultiplier: Record<string, number> = {
  seoul: 1.15, gyeonggi: 1.05, busan: 0.95, daegu: 0.92,
  incheon: 0.98, daejeon: 0.94, gwangju: 0.90, local: 0.85,
}

function getGrade(value: number, benchAvg: number, top25: number, higher: boolean = true): 'good' | 'normal' | 'poor' {
  if (higher) {
    if (value >= top25) return 'good'
    if (value >= benchAvg * 0.85) return 'normal'
    return 'poor'
  } else {
    if (value <= benchAvg * 0.85) return 'good'
    if (value <= benchAvg * 1.1) return 'normal'
    return 'poor'
  }
}

const gradeConfig = {
  good: { label: '우수', color: 'text-green-600', bg: 'bg-green-500/15', icon: CheckCircle2 },
  normal: { label: '보통', color: 'text-yellow-600', bg: 'bg-yellow-500/15', icon: MinusCircle },
  poor: { label: '개선필요', color: 'text-red-600', bg: 'bg-red-500/15', icon: AlertCircle },
}

export default function BenchmarkPage() {
  const [specialty, setSpecialty] = useState('internal')
  const [region, setRegion] = useState('seoul')
  const [myPatients, setMyPatients] = useState(0)
  const [myRevenue, setMyRevenue] = useState(0)
  const [myLaborRatio, setMyLaborRatio] = useState(0)
  const [myRentRatio, setMyRentRatio] = useState(0)
  const [myMargin, setMyMargin] = useState(0)
  const [myRevisit, setMyRevisit] = useState(0)
  const [showResult, setShowResult] = useState(false)

  const data = benchmarks[specialty] || benchmarks.internal
  const mult = regionMultiplier[region] || 1.0
  const specLabel = specialtyOptions.find(s => s.id === specialty)?.label || ''
  const regionLabel = regionOptions.find(r => r.id === region)?.label || ''

  const adjAvgPatients = Math.round(data.dailyPatients.avg * mult)
  const adjTop25Patients = Math.round(data.dailyPatients.top25 * mult)
  const adjAvgRevenue = Math.round(data.monthlyRevenue.avg * mult)
  const adjPerPatient = Math.round(data.revenuePerPatient.avg * mult)

  const grades = showResult ? {
    patients: getGrade(myPatients, adjAvgPatients, adjTop25Patients, true),
    revenue: getGrade(myRevenue, adjAvgRevenue, adjAvgRevenue * 1.3, true),
    labor: getGrade(myLaborRatio, data.laborCostRatio.avg, data.laborCostRatio.avg * 0.9, false),
    rent: getGrade(myRentRatio, data.rentRatio.avg, data.rentRatio.avg * 0.85, false),
    margin: getGrade(myMargin, data.operatingMargin.avg, data.operatingMargin.avg * 1.25, true),
    revisit: getGrade(myRevisit, data.revisitRate.avg, data.revisitRate.target, true),
  } : null

  const goodCount = grades ? Object.values(grades).filter(g => g === 'good').length : 0
  const poorCount = grades ? Object.values(grades).filter(g => g === 'poor').length : 0

  const handleAnalyze = () => {
    setShowResult(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="glass sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="btn-ghost p-2 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h1 className="font-bold text-lg">병원 운영 벤치마크</h1>
            </div>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:block">내 병원 vs 업계 평균</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: `${specLabel} 평균 환자수`, value: `${adjAvgPatients}명/일`, icon: Users, color: 'text-blue-500' },
            { label: '평균 월매출', value: `${adjAvgRevenue.toLocaleString()}만`, icon: DollarSign, color: 'text-green-500' },
            { label: '평균 영업이익률', value: `${data.operatingMargin.avg}%`, icon: TrendingUp, color: 'text-orange-500' },
            { label: '환자당 진료비', value: `${adjPerPatient.toLocaleString()}원`, icon: Activity, color: 'text-purple-500' },
          ].map(kpi => (
            <div key={kpi.label} className="card p-5">
              <div className="flex items-center gap-2 mb-1">
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Selectors */}
        <div className="card p-5">
          <h2 className="font-bold text-lg mb-4">진료과목 및 지역 선택</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-muted-foreground block mb-2">진료과목</label>
              <div className="flex flex-wrap gap-2">
                {specialtyOptions.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setSpecialty(s.id); setShowResult(false) }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      specialty === s.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-2">지역</label>
              <div className="flex flex-wrap gap-2">
                {regionOptions.map(r => (
                  <button
                    key={r.id}
                    onClick={() => { setRegion(r.id); setShowResult(false) }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      region === r.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Industry Benchmark Table */}
        <div className="card p-5">
          <h2 className="font-bold text-lg mb-4">
            {regionLabel} {specLabel} 업계 벤치마크
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-muted">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">지표</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">업계 평균</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">상위 25%</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">권장 범위</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-muted/50">
                  <td className="py-2.5 px-3 font-medium">일평균 환자수</td>
                  <td className="py-2.5 px-3 text-right">{adjAvgPatients}명</td>
                  <td className="py-2.5 px-3 text-right text-green-600 font-semibold">{adjTop25Patients}명+</td>
                  <td className="py-2.5 px-3 text-right text-muted-foreground">{adjAvgPatients}~{adjTop25Patients}명</td>
                </tr>
                <tr className="border-b border-muted/50">
                  <td className="py-2.5 px-3 font-medium">월 매출</td>
                  <td className="py-2.5 px-3 text-right">{adjAvgRevenue.toLocaleString()}만원</td>
                  <td className="py-2.5 px-3 text-right text-green-600 font-semibold">{Math.round(adjAvgRevenue * 1.5).toLocaleString()}만원+</td>
                  <td className="py-2.5 px-3 text-right text-muted-foreground">{data.monthlyRevenue.range}만원</td>
                </tr>
                <tr className="border-b border-muted/50">
                  <td className="py-2.5 px-3 font-medium">인건비 비율</td>
                  <td className="py-2.5 px-3 text-right">{data.laborCostRatio.avg}%</td>
                  <td className="py-2.5 px-3 text-right text-green-600 font-semibold">{Math.round(data.laborCostRatio.avg * 0.85)}%</td>
                  <td className="py-2.5 px-3 text-right text-muted-foreground">{data.laborCostRatio.target}</td>
                </tr>
                <tr className="border-b border-muted/50">
                  <td className="py-2.5 px-3 font-medium">임대료 비율</td>
                  <td className="py-2.5 px-3 text-right">{data.rentRatio.avg}%</td>
                  <td className="py-2.5 px-3 text-right text-green-600 font-semibold">{Math.round(data.rentRatio.avg * 0.8)}%</td>
                  <td className="py-2.5 px-3 text-right text-muted-foreground">{data.rentRatio.target}</td>
                </tr>
                <tr className="border-b border-muted/50">
                  <td className="py-2.5 px-3 font-medium">재료비 비율</td>
                  <td className="py-2.5 px-3 text-right">{data.materialCostRatio.avg}%</td>
                  <td className="py-2.5 px-3 text-right text-green-600 font-semibold">{Math.round(data.materialCostRatio.avg * 0.8)}%</td>
                  <td className="py-2.5 px-3 text-right text-muted-foreground">-</td>
                </tr>
                <tr className="border-b border-muted/50">
                  <td className="py-2.5 px-3 font-medium">영업이익률</td>
                  <td className="py-2.5 px-3 text-right">{data.operatingMargin.avg}%</td>
                  <td className="py-2.5 px-3 text-right text-green-600 font-semibold">{Math.round(data.operatingMargin.avg * 1.3)}%+</td>
                  <td className="py-2.5 px-3 text-right text-muted-foreground">{data.operatingMargin.range}</td>
                </tr>
                <tr className="border-b border-muted/50">
                  <td className="py-2.5 px-3 font-medium">환자당 진료비</td>
                  <td className="py-2.5 px-3 text-right">{adjPerPatient.toLocaleString()}원</td>
                  <td className="py-2.5 px-3 text-right text-green-600 font-semibold">{Math.round(adjPerPatient * 1.2).toLocaleString()}원+</td>
                  <td className="py-2.5 px-3 text-right text-muted-foreground">-</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium">재방문율</td>
                  <td className="py-2.5 px-3 text-right">{data.revisitRate.avg}%</td>
                  <td className="py-2.5 px-3 text-right text-green-600 font-semibold">{data.revisitRate.target}%+</td>
                  <td className="py-2.5 px-3 text-right text-muted-foreground">{data.revisitRate.target}% 이상</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* My Hospital Input */}
        <div className="card p-5">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            내 병원 데이터 입력
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {[
              { label: '일평균 환자수 (명)', value: myPatients, set: setMyPatients },
              { label: '월 매출 (만원)', value: myRevenue, set: setMyRevenue },
              { label: '인건비 비율 (%)', value: myLaborRatio, set: setMyLaborRatio },
              { label: '임대료 비율 (%)', value: myRentRatio, set: setMyRentRatio },
              { label: '영업이익률 (%)', value: myMargin, set: setMyMargin },
              { label: '재방문율 (%)', value: myRevisit, set: setMyRevisit },
            ].map(field => (
              <div key={field.label}>
                <label className="text-xs text-muted-foreground block mb-1.5">{field.label}</label>
                <input
                  type="number"
                  value={field.value || ''}
                  onChange={e => { field.set(Number(e.target.value)); setShowResult(false) }}
                  placeholder="0"
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border-none text-foreground text-sm"
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleAnalyze}
            className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            <Target className="w-4 h-4" />
            벤치마크 분석 실행
          </button>
        </div>

        {/* Results */}
        {showResult && grades && (
          <>
            {/* Grade Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {([
                { label: '일평균 환자수', mine: `${myPatients}명`, bench: `${adjAvgPatients}명`, grade: grades.patients },
                { label: '월 매출', mine: `${myRevenue.toLocaleString()}만`, bench: `${adjAvgRevenue.toLocaleString()}만`, grade: grades.revenue },
                { label: '인건비 비율', mine: `${myLaborRatio}%`, bench: `${data.laborCostRatio.avg}%`, grade: grades.labor },
                { label: '임대료 비율', mine: `${myRentRatio}%`, bench: `${data.rentRatio.avg}%`, grade: grades.rent },
                { label: '영업이익률', mine: `${myMargin}%`, bench: `${data.operatingMargin.avg}%`, grade: grades.margin },
                { label: '재방문율', mine: `${myRevisit}%`, bench: `${data.revisitRate.avg}%`, grade: grades.revisit },
              ] as const).map(item => {
                const cfg = gradeConfig[item.grade]
                const GradeIcon = cfg.icon
                return (
                  <div key={item.label} className={`card p-4 border-l-4 ${
                    item.grade === 'good' ? 'border-green-500' : item.grade === 'normal' ? 'border-yellow-500' : 'border-red-500'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} flex items-center gap-1`}>
                        <GradeIcon className="w-3 h-3" /> {cfg.label}
                      </span>
                    </div>
                    <p className="text-xl font-bold">{item.mine}</p>
                    <p className="text-xs text-muted-foreground mt-1">업계 평균: {item.bench}</p>
                  </div>
                )
              })}
            </div>

            {/* Diagnosis Summary */}
            <div className="card p-5 bg-gradient-to-r from-primary/5 to-blue-500/5">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                진단 결과
              </h2>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-green-500/10 rounded-xl">
                  <p className="text-3xl font-bold text-green-600">{goodCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">우수 항목</p>
                </div>
                <div className="text-center p-4 bg-yellow-500/10 rounded-xl">
                  <p className="text-3xl font-bold text-yellow-600">{6 - goodCount - poorCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">보통 항목</p>
                </div>
                <div className="text-center p-4 bg-red-500/10 rounded-xl">
                  <p className="text-3xl font-bold text-red-600">{poorCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">개선 필요</p>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">맞춤 추천사항</h3>
                {grades.patients === 'poor' && (
                  <div className="flex items-start gap-2 text-sm p-3 bg-muted/50 rounded-xl">
                    <ChevronRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>환자수가 업계 평균 대비 부족합니다. 마케팅 강화 및 네이버 플레이스 최적화를 권장합니다.</span>
                  </div>
                )}
                {grades.revenue === 'poor' && (
                  <div className="flex items-start gap-2 text-sm p-3 bg-muted/50 rounded-xl">
                    <ChevronRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>매출이 평균 이하입니다. 환자당 진료 단가 분석 및 비급여 수가 검토를 권장합니다.</span>
                  </div>
                )}
                {grades.labor === 'poor' && (
                  <div className="flex items-start gap-2 text-sm p-3 bg-muted/50 rounded-xl">
                    <ChevronRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>인건비 비율이 높습니다. 인력 효율화 및 업무 자동화 도입을 검토하세요.</span>
                  </div>
                )}
                {grades.rent === 'poor' && (
                  <div className="flex items-start gap-2 text-sm p-3 bg-muted/50 rounded-xl">
                    <ChevronRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>임대료 비율이 업계 평균보다 높습니다. 임대 재협상 또는 이전을 고려해보세요.</span>
                  </div>
                )}
                {grades.margin === 'poor' && (
                  <div className="flex items-start gap-2 text-sm p-3 bg-muted/50 rounded-xl">
                    <ChevronRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>영업이익률 개선이 필요합니다. 비용 구조 전반을 재검토하시기 바랍니다.</span>
                  </div>
                )}
                {grades.revisit === 'poor' && (
                  <div className="flex items-start gap-2 text-sm p-3 bg-muted/50 rounded-xl">
                    <ChevronRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>재방문율이 낮습니다. 환자 경험 개선, 리콜 시스템 도입을 권장합니다.</span>
                  </div>
                )}
                {poorCount === 0 && goodCount >= 4 && (
                  <div className="flex items-start gap-2 text-sm p-3 bg-green-500/10 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <span>전반적으로 우수한 운영 지표를 보이고 있습니다. 현재 전략을 유지하면서 성장에 집중하세요.</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
