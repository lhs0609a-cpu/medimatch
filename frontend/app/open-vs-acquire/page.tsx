'use client'

import { useState } from 'react'
import { ArrowLeft, Scale, Building2, ShoppingBag, CheckCircle2, XCircle, Clock, TrendingUp, Coins, AlertTriangle, ChevronRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

const specialties = [
  '내과', '정형외과', '피부과', '안과', '치과', '소아과', '산부인과', '정신건강의학과',
] as const

type Specialty = (typeof specialties)[number]

interface OptionData {
  costRange: string
  costMin: number
  costMax: number
  prepTime: string
  bep: string
  bepMonthsMin: number
  bepMonthsMax: number
  avgMonthlyRevenue: number
  pros: string[]
  cons: string[]
}

interface SpecialtyComparison {
  newOpening: OptionData
  acquisition: OptionData
  riskScores: {
    label: string
    newScore: number
    acquireScore: number
  }[]
}

const comparisonData: Record<Specialty, SpecialtyComparison> = {
  '내과': {
    newOpening: {
      costRange: '3~4.5억', costMin: 30000, costMax: 45000,
      prepTime: '6~10개월', bep: '12~18개월', bepMonthsMin: 12, bepMonthsMax: 18,
      avgMonthlyRevenue: 6500,
      pros: ['원하는 컨셉의 건강검진 센터 구축 가능', '최신 진단 장비 도입', '타겟 입지 자유 선택'],
      cons: ['환자 기반 없이 시작', '초기 6개월 적자 예상', '건보 청구 세팅 기간 필요'],
    },
    acquisition: {
      costRange: '2.5~6억', costMin: 25000, costMax: 60000,
      prepTime: '1~3개월', bep: '3~6개월', bepMonthsMin: 3, bepMonthsMax: 6,
      avgMonthlyRevenue: 6500,
      pros: ['기존 만성질환 환자 확보', '건보 청구 이력 즉시 승계', '기존 직원·간호사 인력 유지'],
      cons: ['장비 노후화 가능', '전 원장 진료 스타일과의 차이', '권리금 협상 부담'],
    },
    riskScores: [
      { label: '초기 투자', newScore: 65, acquireScore: 70 },
      { label: '환자 확보', newScore: 30, acquireScore: 80 },
      { label: '수익 안정성', newScore: 40, acquireScore: 75 },
      { label: '시설 품질', newScore: 95, acquireScore: 50 },
      { label: '운영 자유도', newScore: 90, acquireScore: 55 },
    ],
  },
  '정형외과': {
    newOpening: {
      costRange: '4~6억', costMin: 40000, costMax: 60000,
      prepTime: '8~12개월', bep: '14~20개월', bepMonthsMin: 14, bepMonthsMax: 20,
      avgMonthlyRevenue: 7700,
      pros: ['최신 도수치료실/재활 공간 설계', 'MRI·초음파 등 장비 신규 도입', '스포츠 의학 특화 가능'],
      cons: ['고가 장비 초기 투자 부담', '물리치료사 인력 확보 어려움', '환자 유입까지 시간 소요'],
    },
    acquisition: {
      costRange: '3~7억', costMin: 30000, costMax: 70000,
      prepTime: '2~3개월', bep: '4~7개월', bepMonthsMin: 4, bepMonthsMax: 7,
      avgMonthlyRevenue: 7700,
      pros: ['물리치료 환자 즉시 확보', '치료사·스태프 인력 승계', '장비 포함 인수 시 비용 절감'],
      cons: ['장비 노후 시 추가 투자 필요', '기존 평판 리스크', '인수 후 인력 이탈 가능'],
    },
    riskScores: [
      { label: '초기 투자', newScore: 50, acquireScore: 60 },
      { label: '환자 확보', newScore: 25, acquireScore: 85 },
      { label: '수익 안정성', newScore: 35, acquireScore: 70 },
      { label: '시설 품질', newScore: 95, acquireScore: 45 },
      { label: '운영 자유도', newScore: 90, acquireScore: 50 },
    ],
  },
  '피부과': {
    newOpening: {
      costRange: '4~7억', costMin: 40000, costMax: 70000,
      prepTime: '8~12개월', bep: '10~16개월', bepMonthsMin: 10, bepMonthsMax: 16,
      avgMonthlyRevenue: 9600,
      pros: ['최신 레이저 장비로 차별화', '인테리어 브랜딩 자유', 'SNS 마케팅 최적화 입지 선택'],
      cons: ['미용 레이저 장비 고가 (대당 1~3억)', '브랜드 인지도 구축 시간 필요', '마케팅 비용 초기 집중'],
    },
    acquisition: {
      costRange: '3~8억', costMin: 30000, costMax: 80000,
      prepTime: '1~2개월', bep: '2~5개월', bepMonthsMin: 2, bepMonthsMax: 5,
      avgMonthlyRevenue: 9600,
      pros: ['기존 시술 단골 확보', '온라인 리뷰·평판 승계', '장비 포함 인수 시 절약'],
      cons: ['구형 장비 교체 비용', '전 원장 시술 스타일 기대와 차이', '권리금이 높은 편'],
    },
    riskScores: [
      { label: '초기 투자', newScore: 45, acquireScore: 55 },
      { label: '환자 확보', newScore: 35, acquireScore: 80 },
      { label: '수익 안정성', newScore: 50, acquireScore: 70 },
      { label: '시설 품질', newScore: 95, acquireScore: 40 },
      { label: '운영 자유도', newScore: 90, acquireScore: 45 },
    ],
  },
  '안과': {
    newOpening: {
      costRange: '5~8억', costMin: 50000, costMax: 80000,
      prepTime: '10~14개월', bep: '16~24개월', bepMonthsMin: 16, bepMonthsMax: 24,
      avgMonthlyRevenue: 7400,
      pros: ['최신 수술 장비(펨토초 레이저 등)', '전문 분야 특화 가능', '클린룸 등 시설 최적화'],
      cons: ['장비 투자 최소 3~5억 이상', '라식/라섹 수요 감소 추세', 'BEP 도달 기간 긴 편'],
    },
    acquisition: {
      costRange: '4~9억', costMin: 40000, costMax: 90000,
      prepTime: '2~4개월', bep: '4~8개월', bepMonthsMin: 4, bepMonthsMax: 8,
      avgMonthlyRevenue: 7400,
      pros: ['수술 환자 기반 즉시 확보', '고가 장비 포함 인수 시 유리', '숙련된 검사·간호 인력 승계'],
      cons: ['장비 세대 교체 비용', '안과 인수가가 높은 편', '전문의 교체에 민감한 환자층'],
    },
    riskScores: [
      { label: '초기 투자', newScore: 35, acquireScore: 50 },
      { label: '환자 확보', newScore: 25, acquireScore: 75 },
      { label: '수익 안정성', newScore: 30, acquireScore: 65 },
      { label: '시설 품질', newScore: 95, acquireScore: 50 },
      { label: '운영 자유도', newScore: 85, acquireScore: 50 },
    ],
  },
  '치과': {
    newOpening: {
      costRange: '3.5~5.5억', costMin: 35000, costMax: 55000,
      prepTime: '6~10개월', bep: '12~20개월', bepMonthsMin: 12, bepMonthsMax: 20,
      avgMonthlyRevenue: 5400,
      pros: ['최신 디지털 장비(CAD/CAM)', '동선·유닛 최적 설계', '네트워크 가맹 또는 독립 선택'],
      cons: ['네트워크 치과와 가격 경쟁', '초기 환자 유치 어려움', '치위생사 채용 경쟁 심화'],
    },
    acquisition: {
      costRange: '2~6억', costMin: 20000, costMax: 60000,
      prepTime: '1~3개월', bep: '3~6개월', bepMonthsMin: 3, bepMonthsMax: 6,
      avgMonthlyRevenue: 5400,
      pros: ['정기 검진 환자 확보', '유닛·장비 포함 인수', '동네 인지도 즉시 활용'],
      cons: ['유닛 교체 비용 대당 3~5천만원', '기존 스탭 관리 이슈', '진료 패턴 변경 시 환자 이탈'],
    },
    riskScores: [
      { label: '초기 투자', newScore: 55, acquireScore: 65 },
      { label: '환자 확보', newScore: 30, acquireScore: 80 },
      { label: '수익 안정성', newScore: 40, acquireScore: 75 },
      { label: '시설 품질', newScore: 90, acquireScore: 50 },
      { label: '운영 자유도', newScore: 85, acquireScore: 55 },
    ],
  },
  '소아과': {
    newOpening: {
      costRange: '2.5~4억', costMin: 25000, costMax: 40000,
      prepTime: '5~8개월', bep: '14~22개월', bepMonthsMin: 14, bepMonthsMax: 22,
      avgMonthlyRevenue: 4000,
      pros: ['아이 친화적 인테리어 구현', '예방접종·영유아검진 특화', '소아 알레르기 등 전문화 가능'],
      cons: ['저출산으로 시장 축소', '수익성이 낮은 편', '계절 편차 큼 (겨울 집중)'],
    },
    acquisition: {
      costRange: '1.5~3.5억', costMin: 15000, costMax: 35000,
      prepTime: '1~2개월', bep: '2~5개월', bepMonthsMin: 2, bepMonthsMax: 5,
      avgMonthlyRevenue: 4000,
      pros: ['단골 가족 환자 확보', '예방접종 스케줄 환자 승계', '낮은 인수 비용'],
      cons: ['시장 축소로 성장 한계', '전 원장 신뢰도 의존', '시설 리모델링 필요 가능'],
    },
    riskScores: [
      { label: '초기 투자', newScore: 70, acquireScore: 80 },
      { label: '환자 확보', newScore: 25, acquireScore: 85 },
      { label: '수익 안정성', newScore: 30, acquireScore: 65 },
      { label: '시설 품질', newScore: 85, acquireScore: 55 },
      { label: '운영 자유도', newScore: 80, acquireScore: 50 },
    ],
  },
  '산부인과': {
    newOpening: {
      costRange: '4~7억', costMin: 40000, costMax: 70000,
      prepTime: '8~14개월', bep: '18~30개월', bepMonthsMin: 18, bepMonthsMax: 30,
      avgMonthlyRevenue: 4300,
      pros: ['여성 건강검진 특화 가능', '미용·비급여 시술 결합', '최신 초음파·분만 시설'],
      cons: ['분만 기피 추세', '인력 확보 매우 어려움', 'BEP 도달 오래 걸림'],
    },
    acquisition: {
      costRange: '2~5억', costMin: 20000, costMax: 50000,
      prepTime: '2~4개월', bep: '4~8개월', bepMonthsMin: 4, bepMonthsMax: 8,
      avgMonthlyRevenue: 4300,
      pros: ['기존 산모 환자 확보', '분만실 인프라 활용', '낮은 권리금 (시장 축소 반영)'],
      cons: ['분만 수요 지속 감소', '시설 노후 가능성', '인력 이탈 리스크'],
    },
    riskScores: [
      { label: '초기 투자', newScore: 45, acquireScore: 70 },
      { label: '환자 확보', newScore: 20, acquireScore: 70 },
      { label: '수익 안정성', newScore: 25, acquireScore: 55 },
      { label: '시설 품질', newScore: 90, acquireScore: 45 },
      { label: '운영 자유도', newScore: 85, acquireScore: 50 },
    ],
  },
  '정신건강의학과': {
    newOpening: {
      costRange: '1.5~3억', costMin: 15000, costMax: 30000,
      prepTime: '4~6개월', bep: '8~14개월', bepMonthsMin: 8, bepMonthsMax: 14,
      avgMonthlyRevenue: 4700,
      pros: ['낮은 초기 투자 (장비 최소)', '빠르게 성장하는 시장', '1인 운영 가능, 인건비 절약'],
      cons: ['상담 시간 대비 수익 한계', '환자당 진료 시간 길어 회전율 낮음', '온라인 마케팅 집중 필요'],
    },
    acquisition: {
      costRange: '1~4억', costMin: 10000, costMax: 40000,
      prepTime: '1~2개월', bep: '2~4개월', bepMonthsMin: 2, bepMonthsMax: 4,
      avgMonthlyRevenue: 4700,
      pros: ['지속 치료 환자 즉시 확보', '처방 이력 환자 승계', '낮은 인수 비용'],
      cons: ['환자-의사 관계 민감', '전 원장 교체 시 이탈률 높음', '상담실 구조 변경 어려울 수 있음'],
    },
    riskScores: [
      { label: '초기 투자', newScore: 85, acquireScore: 80 },
      { label: '환자 확보', newScore: 40, acquireScore: 70 },
      { label: '수익 안정성', newScore: 50, acquireScore: 65 },
      { label: '시설 품질', newScore: 80, acquireScore: 60 },
      { label: '운영 자유도', newScore: 90, acquireScore: 45 },
    ],
  },
}

const newOpenChecklist = [
  '특정 입지·상권에 강한 확신이 있는 경우',
  '최신 장비·시설로 차별화하고 싶은 경우',
  '기존 의원과 다른 새로운 컨셉을 구현하고 싶은 경우',
  '초기 적자를 감당할 자금 여력이 있는 경우',
  '마케팅·브랜딩에 자신이 있는 경우',
]

const acquireChecklist = [
  '빠르게 매출을 올리고 싶은 경우',
  '이미 환자가 확보된 안정적 시작을 원하는 경우',
  '초기 투자 리스크를 줄이고 싶은 경우',
  '의원 운영 경험이 적어 기존 시스템을 활용하고 싶은 경우',
  '좋은 입지의 기존 의원이 매물로 나온 경우',
]

export default function OpenVsAcquirePage() {
  const [selected, setSelected] = useState<Specialty>('내과')
  const [investment, setInvestment] = useState(40000)

  const data = comparisonData[selected]

  const calcROI = (option: OptionData, months: number) => {
    const cost = (option.costMin + option.costMax) / 2
    const avgBep = (option.bepMonthsMin + option.bepMonthsMax) / 2
    if (months <= avgBep) {
      return -cost + (option.avgMonthlyRevenue * 0.15 * months * (months / avgBep))
    }
    const lossPhase = -cost + (option.avgMonthlyRevenue * 0.15 * avgBep * 0.5)
    const profitMonths = months - avgBep
    return lossPhase + (option.avgMonthlyRevenue * 0.18 * profitMonths)
  }

  const timelineMonths = [6, 12, 18, 24, 36, 48, 60]
  const investmentRatio = investment / ((data.newOpening.costMin + data.newOpening.costMax) / 2)

  return (
    <div className="min-h-screen bg-background">
      <header className="glass sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/dashboard" className="btn-ghost p-2 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Scale className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold">개원 vs 인수 비교 분석</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Specialty Selector */}
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

        {/* Two Column Comparison */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* New Opening */}
          <div className="card p-5 border-t-4 border-t-emerald-500">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold">신규 개원</h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-muted">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5"><Coins className="w-3.5 h-3.5" /> 예상 비용</span>
                <span className="font-bold text-lg">{data.newOpening.costRange}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-muted">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> 준비 기간</span>
                <span className="font-semibold">{data.newOpening.prepTime}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-muted">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> BEP 도달</span>
                <span className="font-semibold">{data.newOpening.bep}</span>
              </div>

              <div>
                <p className="text-sm font-medium text-emerald-700 mb-2">장점</p>
                <ul className="space-y-1.5">
                  {data.newOpening.pros.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium text-red-600 mb-2">단점</p>
                <ul className="space-y-1.5">
                  {data.newOpening.cons.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Acquisition */}
          <div className="card p-5 border-t-4 border-t-blue-500">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold">기존 인수</h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-muted">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5"><Coins className="w-3.5 h-3.5" /> 예상 비용</span>
                <span className="font-bold text-lg">{data.acquisition.costRange}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-muted">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> 준비 기간</span>
                <span className="font-semibold">{data.acquisition.prepTime}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-muted">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> BEP 도달</span>
                <span className="font-semibold">{data.acquisition.bep}</span>
              </div>

              <div>
                <p className="text-sm font-medium text-blue-700 mb-2">장점</p>
                <ul className="space-y-1.5">
                  {data.acquisition.pros.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium text-red-600 mb-2">단점</p>
                <ul className="space-y-1.5">
                  {data.acquisition.cons.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="card p-5 mb-8">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            리스크 평가 비교
          </h2>
          <div className="space-y-4">
            {data.riskScores.map((rs) => (
              <div key={rs.label}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-medium">{rs.label}</span>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-emerald-600">신규 {rs.newScore}점</span>
                    <span className="text-blue-600">인수 {rs.acquireScore}점</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${rs.newScore}%` }} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                      <div className="h-full rounded-full bg-blue-500 transition-all duration-700" style={{ width: `${rs.acquireScore}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex justify-center gap-6 mt-2 pt-2 border-t border-muted">
              <span className="flex items-center gap-1.5 text-xs"><span className="w-3 h-3 rounded-full bg-emerald-500" /> 신규 개원</span>
              <span className="flex items-center gap-1.5 text-xs"><span className="w-3 h-3 rounded-full bg-blue-500" /> 기존 인수</span>
            </div>
          </div>
        </div>

        {/* Decision Checklist */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="card p-5 bg-emerald-50/50 dark:bg-emerald-950/20">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <ChevronRight className="w-4 h-4" />
              이런 경우 신규 개원이 유리합니다
            </h3>
            <ul className="space-y-2">
              {newOpenChecklist.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-5 bg-blue-50/50 dark:bg-blue-950/20">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <ChevronRight className="w-4 h-4" />
              이런 경우 인수가 유리합니다
            </h3>
            <ul className="space-y-2">
              {acquireChecklist.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Scenario Simulator */}
        <div className="card p-5 mb-8">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            시나리오 시뮬레이터
          </h2>
          <div className="mb-4">
            <label className="text-sm text-muted-foreground block mb-2">투자 금액 (만원)</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={10000}
                max={100000}
                step={5000}
                value={investment}
                onChange={(e) => setInvestment(Number(e.target.value))}
                className="flex-1 accent-primary"
              />
              <span className="font-bold text-lg w-20 text-right">{(investment / 10000).toFixed(1)}억</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-muted">
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">기간</th>
                  <th className="text-right py-2 px-2 text-emerald-600 font-medium">신규 개원 ROI</th>
                  <th className="text-right py-2 px-2 text-blue-600 font-medium">인수 ROI</th>
                  <th className="text-center py-2 px-2 text-muted-foreground font-medium">유리한 쪽</th>
                </tr>
              </thead>
              <tbody>
                {timelineMonths.map((m, i) => {
                  const newROI = calcROI(data.newOpening, m) * investmentRatio
                  const acqROI = calcROI(data.acquisition, m) * investmentRatio
                  const better = acqROI > newROI ? '인수' : '개원'

                  return (
                    <tr key={m} className={i % 2 === 0 ? 'bg-muted/30' : ''}>
                      <td className="py-2 px-2 font-medium">{m}개월</td>
                      <td className={`py-2 px-2 text-right font-medium ${newROI >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {newROI >= 0 ? '+' : ''}{(newROI / 10000).toFixed(1)}억
                      </td>
                      <td className={`py-2 px-2 text-right font-medium ${acqROI >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                        {acqROI >= 0 ? '+' : ''}{(acqROI / 10000).toFixed(1)}억
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          better === '인수' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        }`}>{better}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            * 투자 금액 대비 예상 누적 수익을 추정합니다. 실제 결과는 입지, 운영 능력 등에 따라 달라질 수 있습니다.
          </p>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          * 본 분석은 HIRA·통계청 데이터 및 업계 평균을 기반으로 한 참고 자료이며, 투자 의사결정의 최종 판단은 전문 컨설팅을 권장합니다.
        </p>
      </main>
    </div>
  )
}
