'use client'

import { useState, useMemo } from 'react'
import { ArrowLeft, ShoppingBag, TrendingUp, BarChart3, Sparkles, Layout, Sun, Snowflake, ChevronDown, ChevronUp, Calculator, Lightbulb, Megaphone } from 'lucide-react'
import Link from 'next/link'

type Tab = 'otc' | 'supplement' | 'device' | 'beauty'

interface Product {
  name: string
  monthlySales: string
  margin: string
  seasonal: string
  note: string
}

const otcTop10: Product[] = [
  { name: '타이레놀정 500mg', monthlySales: '420박스', margin: '22%', seasonal: '연중', note: '해열진통 1위, 필수 비치' },
  { name: '판콜에이 내복액', monthlySales: '280박스', margin: '28%', seasonal: '겨울 집중', note: '감기약 대표 브랜드' },
  { name: '게보린정', monthlySales: '350박스', margin: '25%', seasonal: '연중', note: '두통약 1위, 브랜드 인지도 최고' },
  { name: '훼스탈 골드정', monthlySales: '200박스', margin: '30%', seasonal: '연중', note: '소화제 대표, 중장년 선호' },
  { name: '베아제정', monthlySales: '180박스', margin: '32%', seasonal: '연중', note: '복합 소화효소제' },
  { name: '인사돌 플러스정', monthlySales: '150박스', margin: '35%', seasonal: '연중', note: '잇몸약 1위, 고마진' },
  { name: '지르텍정 10mg', monthlySales: '220박스', margin: '26%', seasonal: '봄/가을', note: '항히스타민제, 꽃가루 시즌' },
  { name: '둘코락스에스정', monthlySales: '160박스', margin: '33%', seasonal: '연중', note: '변비약, 여성 고객 다수' },
  { name: '오라메디연고', monthlySales: '190박스', margin: '38%', seasonal: '연중', note: '구내염 연고 1위' },
  { name: '마데카솔겔', monthlySales: '170박스', margin: '34%', seasonal: '여름', note: '상처치료, 여름 수요 증가' },
]

const supplements: Product[] = [
  { name: '락토핏 골드 (유산균)', monthlySales: '300박스', margin: '45%', seasonal: '연중', note: '프로바이오틱스 시장 1위' },
  { name: '멀티비타민 (종합)', monthlySales: '250박스', margin: '42%', seasonal: '봄/가을', note: '건강 관심 증가로 수요 급증' },
  { name: '오메가3 트리플', monthlySales: '220박스', margin: '48%', seasonal: '연중', note: '혈행 개선, 중장년 필수' },
  { name: '콜라겐 펩타이드', monthlySales: '180박스', margin: '52%', seasonal: '연중', note: '2030 여성 핵심 타겟' },
  { name: '루테인 지아잔틴', monthlySales: '160박스', margin: '46%', seasonal: '연중', note: '눈 건강, 디지털 시대 수요' },
  { name: '비타민D 1000IU', monthlySales: '280박스', margin: '50%', seasonal: '겨울', note: '면역력, 겨울 시즌 2배 판매' },
  { name: '밀크씨슬 (간 건강)', monthlySales: '140박스', margin: '44%', seasonal: '연말', note: '음주 시즌 수요 폭증' },
  { name: '프로폴리스 스프레이', monthlySales: '120박스', margin: '55%', seasonal: '겨울', note: '목 건강, 고마진 품목' },
]

const devices: Product[] = [
  { name: '가정용 혈압계', monthlySales: '25대', margin: '28%', seasonal: '연중', note: '고혈압 환자 필수, 꾸준한 수요' },
  { name: '혈당측정기 세트', monthlySales: '20대', margin: '22%', seasonal: '연중', note: '소모품(스트립) 반복 매출' },
  { name: '체온계 (비접촉)', monthlySales: '35대', margin: '35%', seasonal: '겨울', note: '감기 시즌 수요 증가' },
  { name: '손목/무릎 보호대', monthlySales: '80개', margin: '40%', seasonal: '연중', note: '정형외과 근처 약국 인기' },
  { name: '마사지건', monthlySales: '8대', margin: '30%', seasonal: '연중', note: '고단가, 진열 시 관심 유도' },
]

const beautyProducts: Product[] = [
  { name: '약국 전용 선크림', monthlySales: '150개', margin: '55%', seasonal: '여름', note: '피부과 추천 효과' },
  { name: '시카크림 (재생)', monthlySales: '120개', margin: '52%', seasonal: '연중', note: '센텔라 성분, 피부 재생' },
  { name: '세라마이드 보습제', monthlySales: '100개', margin: '48%', seasonal: '겨울', note: '건조 시즌 매출 3배' },
  { name: '비타민C 세럼', monthlySales: '90개', margin: '58%', seasonal: '연중', note: '미백/항산화, 온라인 대비 신뢰' },
  { name: '약용 샴푸', monthlySales: '70개', margin: '45%', seasonal: '연중', note: '탈모 관심 증가, 남녀 모두' },
]

const displayStrategies = [
  { location: '카운터 앞 (골든존)', effect: '매출 기여도 40%', desc: '계산 대기 중 충동구매 유도. 소형 고마진 제품(구내염 연고, 밴드 등) 배치' },
  { location: '입구 진열대', effect: '매출 기여도 25%', desc: '계절 상품 및 프로모션 제품 집중. 시선이 가장 먼저 닿는 자리' },
  { location: '벽면 선반 (중단)', effect: '매출 기여도 20%', desc: '눈높이 선반이 핵심. 고마진 건강기능식품 배치 권장' },
  { location: '하단 선반/사이드', effect: '매출 기여도 15%', desc: '대용량/저마진 제품 또는 보충 재고. 가격표 크게 표시' },
]

const seasonalTips = [
  { season: '봄 (3~5월)', icon: '🌸', items: '알레르기약, 비타민, 꽃가루 마스크, 다이어트 보조제' },
  { season: '여름 (6~8월)', icon: '☀️', items: '자외선차단제, 벌레물림약, 식중독약, 탈취제, 쿨링 스프레이' },
  { season: '가을 (9~11월)', icon: '🍂', items: '감기 예방(비타민C/D), 독감백신 안내, 환절기 보습제' },
  { season: '겨울 (12~2월)', icon: '❄️', items: '감기약, 핫팩, 보습크림, 프로폴리스, 밀크씨슬(연말 음주)' },
]

export default function OTCStrategyPage() {
  const [activeTab, setActiveTab] = useState<Tab>('otc')
  const [dailyVisitors, setDailyVisitors] = useState('')
  const [otcRate, setOtcRate] = useState('')
  const [avgPrice, setAvgPrice] = useState('')
  const [expandedDisplay, setExpandedDisplay] = useState<number | null>(null)

  const tabs: { key: Tab; label: string; icon: typeof ShoppingBag }[] = [
    { key: 'otc', label: '인기 OTC', icon: ShoppingBag },
    { key: 'supplement', label: '건강기능식품', icon: Sparkles },
    { key: 'device', label: '의료기기/용품', icon: BarChart3 },
    { key: 'beauty', label: '뷰티/코스메슈티컬', icon: Sun },
  ]

  const currentProducts = useMemo(() => {
    switch (activeTab) {
      case 'otc': return otcTop10
      case 'supplement': return supplements
      case 'device': return devices
      case 'beauty': return beautyProducts
    }
  }, [activeTab])

  const visitors = Number(dailyVisitors) || 0
  const rate = Number(otcRate) || 0
  const price = Number(avgPrice) || 0
  const dailyRevenue = visitors * (rate / 100) * price
  const monthlyRevenue = dailyRevenue * 30
  const yearlyRevenue = monthlyRevenue * 12

  return (
    <div className="min-h-screen bg-background">
      <header className="glass sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/dashboard" className="btn-ghost p-2 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <ShoppingBag className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold">OTC/건강기능식품 전략</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl space-y-8">
        {/* Revenue Mix Overview */}
        <div className="card p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" />약국 매출 구성 비율</h2>
          <div className="space-y-3">
            {[
              { label: '조제 매출', pct: 72, color: 'bg-blue-500' },
              { label: 'OTC 의약품', pct: 14, color: 'bg-green-500' },
              { label: '건강기능식품', pct: 9, color: 'bg-blue-500' },
              { label: '의료기기/뷰티', pct: 5, color: 'bg-amber-500' },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-foreground">{item.label}</span>
                  <span className="text-muted-foreground">{item.pct}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div className={`${item.color} h-3 rounded-full transition-all`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-4">* 전국 평균 기준. OTC/건식 비중을 28% 이상으로 높이면 수익성이 크게 개선됩니다.</p>
        </div>

        {/* Category Tabs */}
        <div>
          <div className="flex gap-2 flex-wrap mb-4">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === t.key ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
                <t.icon className="w-4 h-4" />{t.label}
              </button>
            ))}
          </div>

          <div className="card p-5">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-semibold text-foreground">품목</th>
                    <th className="text-right py-3 px-2 font-semibold text-foreground">월 판매량</th>
                    <th className="text-right py-3 px-2 font-semibold text-primary">마진율</th>
                    <th className="text-center py-3 px-2 font-semibold text-foreground">계절성</th>
                    <th className="text-left py-3 px-2 font-semibold text-foreground hidden md:table-cell">비고</th>
                  </tr>
                </thead>
                <tbody>
                  {currentProducts.map((p, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-2 font-medium text-foreground">{p.name}</td>
                      <td className="py-3 px-2 text-right text-foreground">{p.monthlySales}</td>
                      <td className="py-3 px-2 text-right">
                        <span className={`font-bold ${parseInt(p.margin) >= 40 ? 'text-green-600' : parseInt(p.margin) >= 30 ? 'text-blue-600' : 'text-foreground'}`}>{p.margin}</span>
                      </td>
                      <td className="py-3 px-2 text-center text-muted-foreground text-xs">{p.seasonal}</td>
                      <td className="py-3 px-2 text-muted-foreground text-xs hidden md:table-cell">{p.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Margin Calculator */}
        <div className="card p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Calculator className="w-5 h-5 text-primary" />OTC 추가 매출 계산기</h2>
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">일 방문 고객수</label>
              <input type="number" value={dailyVisitors} onChange={e => setDailyVisitors(e.target.value)} placeholder="예: 100" className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">OTC 구매 비율 (%)</label>
              <input type="number" value={otcRate} onChange={e => setOtcRate(e.target.value)} placeholder="예: 25" className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">평균 단가 (원)</label>
              <input type="number" value={avgPrice} onChange={e => setAvgPrice(e.target.value)} placeholder="예: 12000" className="input w-full" />
            </div>
          </div>
          {dailyRevenue > 0 && (
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-muted rounded-xl p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">일 추가 매출</p>
                <p className="text-2xl font-bold text-foreground">{Math.round(dailyRevenue).toLocaleString()}원</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center border-2 border-blue-200">
                <p className="text-sm text-muted-foreground mb-1">월 추가 매출</p>
                <p className="text-2xl font-bold text-foreground">{Math.round(monthlyRevenue).toLocaleString()}원</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center border-2 border-green-200">
                <p className="text-sm text-muted-foreground mb-1">연 추가 매출</p>
                <p className="text-2xl font-bold text-green-700">{Math.round(yearlyRevenue).toLocaleString()}원</p>
              </div>
            </div>
          )}
        </div>

        {/* Display Strategy */}
        <div className="card p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Layout className="w-5 h-5 text-primary" />진열 위치별 매출 전략</h2>
          <div className="space-y-3">
            {displayStrategies.map((s, i) => (
              <div key={i} className="border border-border rounded-lg overflow-hidden">
                <button onClick={() => setExpandedDisplay(expandedDisplay === i ? null : i)} className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">{i + 1}</span>
                    <span className="font-medium text-foreground">{s.location}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-primary">{s.effect}</span>
                    {expandedDisplay === i ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>
                {expandedDisplay === i && (
                  <div className="px-4 pb-4 pt-0">
                    <p className="text-sm text-muted-foreground pl-11">{s.desc}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Seasonal Strategy */}
        <div className="card p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Sun className="w-5 h-5 text-primary" />계절별 진열 전략</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {seasonalTips.map((s, i) => (
              <div key={i} className="bg-muted rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{s.icon}</span>
                  <h3 className="font-bold text-foreground">{s.season}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{s.items}</p>
              </div>
            ))}
          </div>
        </div>

        {/* POP & Trends */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-5">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Megaphone className="w-5 h-5 text-primary" />POP 광고 효과</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-foreground">카운터 POP 설치 시 해당 제품 매출 <strong>평균 35% 증가</strong></p>
              </div>
              <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-foreground">가격 비교 POP는 건강기능식품 매출 <strong>28% 증가</strong> 효과</p>
              </div>
              <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-foreground">&ldquo;약사 추천&rdquo; 문구 부착 시 신뢰도 기반 매출 <strong>42% 증가</strong></p>
              </div>
              <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-foreground">디지털 사이니지 도입 약국 OTC 매출 <strong>평균 20% 상승</strong></p>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" />2025년 약국 트렌드</h2>
            <div className="space-y-4 text-sm">
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-bold text-foreground mb-1">건강기능식품 시장 12조 돌파</h3>
                <p className="text-muted-foreground">약국 채널 건기식 매출 전년비 18% 성장. 소비자 신뢰도 기반 경쟁력</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-bold text-foreground mb-1">비대면 상담 확대</h3>
                <p className="text-muted-foreground">화상/전화 상담 후 택배 배송. 비대면 건기식 상담 매출 급성장</p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-bold text-foreground mb-1">약국 전용 코스메슈티컬</h3>
                <p className="text-muted-foreground">더마 화장품 시장 3조원 규모. 약국만의 전문성이 차별화 포인트</p>
              </div>
              <div className="border-l-4 border-amber-500 pl-4">
                <h3 className="font-bold text-foreground mb-1">개인 맞춤 영양제 패키징</h3>
                <p className="text-muted-foreground">고객별 맞춤 영양제 소분 서비스. 객단가 2배 이상 상승 효과</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
