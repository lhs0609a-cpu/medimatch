'use client'

import { useState, useMemo } from 'react'
import { ArrowLeft, Landmark, Calculator, ChevronDown, ChevronUp, Check, AlertTriangle, TrendingDown, Building2, Percent, Clock, FileText, BadgeCheck } from 'lucide-react'
import Link from 'next/link'

type LoanCategory = '개원자금 대출' | '의료기기 리스' | '운전자금 대출' | '전세자금 대출'

interface LoanProduct {
  id: string
  bank: string
  name: string
  category: LoanCategory
  maxAmount: string
  maxAmountNum: number
  rate: string
  rateLow: number
  rateHigh: number
  term: string
  repayment: string
  benefits: string[]
  documents: string[]
  highlight?: string
}

const loanProducts: LoanProduct[] = [
  {
    id: 'kb-1', bank: 'KB국민은행', name: '의사개원자금', category: '개원자금 대출',
    maxAmount: '최대 10억', maxAmountNum: 10, rate: '연 4.2~5.5%', rateLow: 4.2, rateHigh: 5.5,
    term: '최대 10년', repayment: '원리금균등 / 원금균등',
    benefits: ['의사면허 보유 시 금리 0.3%p 우대', '개원 3년 이내 거치기간 제공', '담보 대출 시 한도 우대'],
    documents: ['사업자등록증', '의사면허증', '소득금액증명원', '임대차계약서'],
    highlight: '의사 전용 우대금리'
  },
  {
    id: 'sh-1', bank: '신한은행', name: '메디컬론', category: '개원자금 대출',
    maxAmount: '최대 8억', maxAmountNum: 8, rate: '연 4.5~5.8%', rateLow: 4.5, rateHigh: 5.8,
    term: '최대 7년', repayment: '원리금균등',
    benefits: ['신한 주거래 시 0.2%p 인하', '급여이체 시 추가 0.1%p 인하', '온라인 신청 시 금리 우대'],
    documents: ['사업자등록증', '의사면허증', '재직증명서', '건강보험자격득실확인서']
  },
  {
    id: 'hn-1', bank: '하나은행', name: '전문직대출', category: '개원자금 대출',
    maxAmount: '최대 10억', maxAmountNum: 10, rate: '연 4.0~5.3%', rateLow: 4.0, rateHigh: 5.3,
    term: '최대 10년', repayment: '원리금균등 / 체증식',
    benefits: ['DSR 규제 완화 대상', '전문직 우대 금리 적용', '거치기간 최대 2년'],
    documents: ['사업자등록증', '면허증', '소득증빙', '부동산등기부등본'],
    highlight: '최저 금리 4.0%'
  },
  {
    id: 'wr-1', bank: '우리은행', name: '개원플러스', category: '개원자금 대출',
    maxAmount: '최대 7억', maxAmountNum: 7, rate: '연 4.3~5.6%', rateLow: 4.3, rateHigh: 5.6,
    term: '최대 8년', repayment: '원리금균등',
    benefits: ['우리은행 급여통장 시 0.2%p 인하', '자동이체 3건 이상 시 0.1%p 인하'],
    documents: ['사업자등록증', '면허증', '소득금액증명원']
  },
  {
    id: 'nh-1', bank: 'NH농협', name: '의료인전용', category: '운전자금 대출',
    maxAmount: '최대 5억', maxAmountNum: 5, rate: '연 4.8~6.0%', rateLow: 4.8, rateHigh: 6.0,
    term: '최대 5년', repayment: '원리금균등 / 만기일시',
    benefits: ['농협 조합원 가입 시 0.3%p 인하', '운전자금 전용 빠른 심사'],
    documents: ['사업자등록증', '면허증', '부가가치세 신고서', '통장사본']
  },
  {
    id: 'ibk-1', bank: 'IBK기업은행', name: '소상공인개원', category: '개원자금 대출',
    maxAmount: '최대 3억', maxAmountNum: 3, rate: '연 3.5~4.5%', rateLow: 3.5, rateHigh: 4.5,
    term: '최대 5년', repayment: '원리금균등',
    benefits: ['정부 이차보전 지원', '소상공인진흥공단 보증', '창업 3년 이내 추가 우대'],
    documents: ['사업자등록증', '면허증', '사업계획서', '소상공인확인서'],
    highlight: '정부지원 최저금리'
  },
  {
    id: 'bnk-1', bank: 'BNK부산은행', name: '의료인대출', category: '운전자금 대출',
    maxAmount: '최대 5억', maxAmountNum: 5, rate: '연 4.5~5.8%', rateLow: 4.5, rateHigh: 5.8,
    term: '최대 7년', repayment: '원리금균등 / 원금균등',
    benefits: ['부산·경남 지역 개원 시 0.5%p 우대', '지역 경제 활성화 우대금리'],
    documents: ['사업자등록증', '면허증', '소득증빙'],
    highlight: '지역 우대 금리'
  },
  {
    id: 'kakao-1', bank: '카카오뱅크', name: '전문직비대면', category: '운전자금 대출',
    maxAmount: '최대 2억', maxAmountNum: 2, rate: '연 4.0~5.5%', rateLow: 4.0, rateHigh: 5.5,
    term: '최대 5년', repayment: '원리금균등',
    benefits: ['100% 비대면 심사', '최소 서류', '당일 승인 가능'],
    documents: ['건강보험자격득실확인서', '면허증'],
    highlight: '비대면 빠른 심사'
  },
  {
    id: 'kb-lease', bank: 'KB캐피탈', name: '의료기기리스', category: '의료기기 리스',
    maxAmount: '최대 5억', maxAmountNum: 5, rate: '연 5.0~6.5%', rateLow: 5.0, rateHigh: 6.5,
    term: '3~5년', repayment: '월 리스료',
    benefits: ['초기비용 최소화', '리스료 경비처리 가능', '기기 업그레이드 옵션'],
    documents: ['사업자등록증', '견적서', '면허증']
  },
  {
    id: 'sh-lease', bank: '신한캐피탈', name: '메디컬리스', category: '의료기기 리스',
    maxAmount: '최대 7억', maxAmountNum: 7, rate: '연 4.8~6.2%', rateLow: 4.8, rateHigh: 6.2,
    term: '2~7년', repayment: '월 리스료',
    benefits: ['CT/MRI 등 고가장비 특화', '잔존가치 설정 가능', '세금 절감 효과'],
    documents: ['사업자등록증', '기기 견적서', '재무제표']
  },
  {
    id: 'kb-jeonse', bank: 'KB국민은행', name: '전세자금대출', category: '전세자금 대출',
    maxAmount: '최대 5억', maxAmountNum: 5, rate: '연 3.8~4.8%', rateLow: 3.8, rateHigh: 4.8,
    term: '최대 10년', repayment: '만기일시상환',
    benefits: ['전문직 우대 한도', '전세보증보험 연계', '자동 연장 가능'],
    documents: ['전세계약서', '등기부등본', '소득증빙', '면허증']
  },
  {
    id: 'hn-jeonse', bank: '하나은행', name: '전문직전세론', category: '전세자금 대출',
    maxAmount: '최대 6억', maxAmountNum: 6, rate: '연 3.5~4.5%', rateLow: 3.5, rateHigh: 4.5,
    term: '최대 10년', repayment: '만기일시상환',
    benefits: ['전세금 80%까지 지원', 'DSR 우대', '주거래 고객 금리 인하'],
    documents: ['전세계약서', '등기부등본', '재직증명서', '면허증'],
    highlight: '전세 최저 3.5%'
  },
]

const categories: LoanCategory[] = ['개원자금 대출', '의료기기 리스', '운전자금 대출', '전세자금 대출']

const tips = [
  { title: 'DSR 사전 확인', desc: '총부채원리금상환비율(DSR)이 40%를 넘으면 대출이 어렵습니다. 기존 대출 현황을 먼저 정리하세요.' },
  { title: '담보 vs 신용', desc: '부동산 담보가 있으면 금리가 1~2%p 낮아집니다. 임대차계약서로 담보 설정이 가능한지 확인하세요.' },
  { title: '신용보증기금 활용', desc: '기술보증기금(KIBO) 또는 신용보증기금 보증서를 받으면 금리 인하와 한도 확대가 가능합니다.' },
  { title: '금리 인하 요구권', desc: '개원 후 매출이 안정되면 금리인하요구권을 행사하세요. 연 0.3~0.5%p 인하 가능합니다.' },
  { title: '복수 은행 비교', desc: '최소 3개 은행에 동시에 상담받으세요. 같은 조건이라도 은행별로 0.5%p 이상 차이날 수 있습니다.' },
]

function formatWon(amount: number): string {
  if (amount >= 10000) return `${(amount / 10000).toFixed(1)}억 원`
  return `${amount.toLocaleString()}만 원`
}

export default function LoanComparePage() {
  const [activeTab, setActiveTab] = useState<LoanCategory>('개원자금 대출')
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [calcAmount, setCalcAmount] = useState(50000)
  const [calcRate, setCalcRate] = useState(4.5)
  const [calcYears, setCalcYears] = useState(5)
  const [showCalc, setShowCalc] = useState(false)

  const filtered = useMemo(() => loanProducts.filter(p => p.category === activeTab), [activeTab])
  const compareProducts = useMemo(() => loanProducts.filter(p => compareIds.includes(p.id)), [compareIds])

  const toggleCompare = (id: string) => {
    setCompareIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev)
  }

  const monthlyEqualPrincipalInterest = useMemo(() => {
    const P = calcAmount * 10000
    const r = calcRate / 100 / 12
    const n = calcYears * 12
    if (r === 0) return P / n
    return P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1)
  }, [calcAmount, calcRate, calcYears])

  const monthlyEqualPrincipal = useMemo(() => {
    const P = calcAmount * 10000
    const r = calcRate / 100 / 12
    const n = calcYears * 12
    const principalPayment = P / n
    const firstMonth = principalPayment + P * r
    const lastMonth = principalPayment + principalPayment * r
    return { first: firstMonth, last: lastMonth, avg: (firstMonth + lastMonth) / 2 }
  }, [calcAmount, calcRate, calcYears])

  const totalInterestEPI = monthlyEqualPrincipalInterest * calcYears * 12 - calcAmount * 10000
  const totalInterestEP = useMemo(() => {
    const P = calcAmount * 10000
    const r = calcRate / 100 / 12
    const n = calcYears * 12
    let total = 0
    for (let i = 0; i < n; i++) total += (P - (P / n) * i) * r
    return total
  }, [calcAmount, calcRate, calcYears])

  return (
    <div className="min-h-screen bg-background">
      <header className="glass sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/dashboard" className="btn-ghost p-2 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Landmark className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold">대출/금융 상품 비교</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {categories.map(cat => (
            <button key={cat} onClick={() => { setActiveTab(cat); setExpandedId(null) }}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeTab === cat ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Compare bar */}
        {compareIds.length > 0 && (
          <div className="card p-4 mb-6 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">비교 상품: <strong className="text-foreground">{compareIds.length}/3</strong></span>
            <div className="flex gap-2">
              <button onClick={() => setCompareIds([])} className="text-sm text-muted-foreground hover:text-foreground">초기화</button>
              {compareIds.length >= 2 && (
                <a href="#compare-table" className="text-sm text-primary font-medium">비교표 보기 &darr;</a>
              )}
            </div>
          </div>
        )}

        {/* Product Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {filtered.map(product => (
            <div key={product.id} className="card p-5 relative">
              {product.highlight && (
                <span className="absolute top-3 right-3 bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded-full">
                  {product.highlight}
                </span>
              )}
              <div className="flex items-start gap-3 mb-3">
                <Building2 className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">{product.bank}</p>
                  <h3 className="font-bold text-foreground">{product.name}</h3>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div className="flex items-center gap-2"><Landmark className="w-4 h-4 text-muted-foreground" /><span>{product.maxAmount}</span></div>
                <div className="flex items-center gap-2"><Percent className="w-4 h-4 text-muted-foreground" /><span>{product.rate}</span></div>
                <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-muted-foreground" /><span>{product.term}</span></div>
                <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-muted-foreground" /><span>{product.repayment}</span></div>
              </div>

              <button onClick={() => setExpandedId(expandedId === product.id ? null : product.id)}
                className="text-sm text-primary flex items-center gap-1 mb-3">
                상세보기 {expandedId === product.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {expandedId === product.id && (
                <div className="border-t border-border pt-3 space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-foreground mb-1 flex items-center gap-1"><BadgeCheck className="w-4 h-4 text-green-500" /> 우대조건</p>
                    <ul className="space-y-1 pl-5">
                      {product.benefits.map((b, i) => <li key={i} className="text-muted-foreground list-disc">{b}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-1 flex items-center gap-1"><FileText className="w-4 h-4 text-blue-500" /> 필요서류</p>
                    <ul className="space-y-1 pl-5">
                      {product.documents.map((d, i) => <li key={i} className="text-muted-foreground list-disc">{d}</li>)}
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={compareIds.includes(product.id)} onChange={() => toggleCompare(product.id)}
                    className="w-4 h-4 rounded border-border" />
                  비교함에 담기
                </label>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        {compareProducts.length >= 2 && (
          <div id="compare-table" className="card p-5 mb-8 overflow-x-auto">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-primary" /> 상품 비교표
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-muted-foreground font-medium">항목</th>
                  {compareProducts.map(p => <th key={p.id} className="text-left p-2 font-semibold">{p.bank}<br /><span className="text-primary font-normal">{p.name}</span></th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { label: '대출한도', key: 'maxAmount' as const },
                  { label: '금리', key: 'rate' as const },
                  { label: '기간', key: 'term' as const },
                  { label: '상환방식', key: 'repayment' as const },
                ].map(row => (
                  <tr key={row.label}>
                    <td className="p-2 text-muted-foreground">{row.label}</td>
                    {compareProducts.map(p => <td key={p.id} className="p-2">{p[row.key]}</td>)}
                  </tr>
                ))}
                <tr>
                  <td className="p-2 text-muted-foreground">우대조건</td>
                  {compareProducts.map(p => <td key={p.id} className="p-2">{p.benefits[0]}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Loan Calculator */}
        <div className="card p-5 mb-8">
          <button onClick={() => setShowCalc(!showCalc)} className="w-full flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" /> 대출 계산기
            </h2>
            {showCalc ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </button>

          {showCalc && (
            <div className="mt-5 space-y-6">
              <div>
                <label className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">대출금액</span>
                  <span className="font-bold text-foreground">{formatWon(calcAmount)}</span>
                </label>
                <input type="range" min={1000} max={100000} step={1000} value={calcAmount}
                  onChange={e => setCalcAmount(Number(e.target.value))}
                  className="w-full accent-primary" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>1천만</span><span>10억</span></div>
              </div>

              <div>
                <label className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">금리 (연)</span>
                  <span className="font-bold text-foreground">{calcRate.toFixed(1)}%</span>
                </label>
                <input type="range" min={3} max={7} step={0.1} value={calcRate}
                  onChange={e => setCalcRate(Number(e.target.value))}
                  className="w-full accent-primary" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>3%</span><span>7%</span></div>
              </div>

              <div>
                <label className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">대출기간</span>
                  <span className="font-bold text-foreground">{calcYears}년</span>
                </label>
                <input type="range" min={1} max={10} step={1} value={calcYears}
                  onChange={e => setCalcYears(Number(e.target.value))}
                  className="w-full accent-primary" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>1년</span><span>10년</span></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted rounded-xl p-4">
                  <p className="text-sm text-muted-foreground mb-1">원리금균등상환</p>
                  <p className="text-2xl font-bold text-foreground">{Math.round(monthlyEqualPrincipalInterest).toLocaleString()}<span className="text-sm font-normal text-muted-foreground"> 원/월</span></p>
                  <p className="text-xs text-muted-foreground mt-2">총 이자: {formatWon(Math.round(totalInterestEPI / 10000))}</p>
                </div>
                <div className="bg-muted rounded-xl p-4">
                  <p className="text-sm text-muted-foreground mb-1">원금균등상환</p>
                  <p className="text-2xl font-bold text-foreground">{Math.round(monthlyEqualPrincipal.avg).toLocaleString()}<span className="text-sm font-normal text-muted-foreground"> 원/월 (평균)</span></p>
                  <p className="text-xs text-muted-foreground mt-1">첫달 {Math.round(monthlyEqualPrincipal.first).toLocaleString()}원 → 마지막 {Math.round(monthlyEqualPrincipal.last).toLocaleString()}원</p>
                  <p className="text-xs text-muted-foreground mt-1">총 이자: {formatWon(Math.round(totalInterestEP / 10000))}</p>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm">
                <p className="font-medium text-primary mb-1">원금균등이 유리한 이유</p>
                <p className="text-muted-foreground">
                  원금균등상환은 초기 부담이 크지만 총 이자가{' '}
                  <strong className="text-foreground">{formatWon(Math.round((totalInterestEPI - totalInterestEP) / 10000))}</strong>{' '}
                  더 적습니다. 매출이 안정적이라면 원금균등을 추천합니다.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="card p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" /> 개원대출 시 체크포인트
          </h2>
          <div className="space-y-4">
            {tips.map((tip, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <div>
                  <p className="font-medium text-foreground">{tip.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
