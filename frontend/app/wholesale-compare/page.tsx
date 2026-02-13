'use client'

import { useState, useMemo } from 'react'
import { ArrowLeft, Search, Package, TrendingDown, Building2, Truck, Phone, Calculator, CheckCircle, Star, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

type Category = '전문의약품' | '일반의약품' | '건강기능식품'

interface Drug {
  name: string
  manufacturer: string
  spec: string
  insurancePrice: number
  category: Category
  prices: { geoYoung: number; baekje: number; hanKolmar: number }
}

const drugs: Drug[] = [
  { name: '아모잘탄정 5/50mg', manufacturer: '한미약품', spec: '30정/박스', insurancePrice: 850, category: '전문의약품', prices: { geoYoung: 790, baekje: 805, hanKolmar: 815 } },
  { name: '리피토정 20mg', manufacturer: '한국화이자', spec: '30정/박스', insurancePrice: 920, category: '전문의약품', prices: { geoYoung: 855, baekje: 870, hanKolmar: 862 } },
  { name: '노바스크정 5mg', manufacturer: '한국화이자', spec: '30정/박스', insurancePrice: 680, category: '전문의약품', prices: { geoYoung: 632, baekje: 640, hanKolmar: 650 } },
  { name: '트윈스타정 40/5mg', manufacturer: '베링거인겔하임', spec: '30정/박스', insurancePrice: 1100, category: '전문의약품', prices: { geoYoung: 1010, baekje: 1035, hanKolmar: 1025 } },
  { name: '자누비아정 100mg', manufacturer: '한국MSD', spec: '28정/박스', insurancePrice: 1250, category: '전문의약품', prices: { geoYoung: 1150, baekje: 1175, hanKolmar: 1162 } },
  { name: '넥시움정 20mg', manufacturer: '한국아스트라제네카', spec: '28정/박스', insurancePrice: 780, category: '전문의약품', prices: { geoYoung: 718, baekje: 725, hanKolmar: 735 } },
  { name: '크레스토정 10mg', manufacturer: '한국아스트라제네카', spec: '28정/박스', insurancePrice: 890, category: '전문의약품', prices: { geoYoung: 825, baekje: 840, hanKolmar: 830 } },
  { name: '타이레놀정 500mg', manufacturer: '한국존슨앤드존슨', spec: '100정/병', insurancePrice: 120, category: '일반의약품', prices: { geoYoung: 105, baekje: 108, hanKolmar: 110 } },
  { name: '판콜에이 내복액', manufacturer: '동화약품', spec: '180mL', insurancePrice: 6500, category: '일반의약품', prices: { geoYoung: 5850, baekje: 5920, hanKolmar: 6050 } },
  { name: '게보린정', manufacturer: '삼진제약', spec: '100정/병', insurancePrice: 4800, category: '일반의약품', prices: { geoYoung: 4320, baekje: 4400, hanKolmar: 4450 } },
  { name: '베아제정', manufacturer: '대웅제약', spec: '100정/병', insurancePrice: 5200, category: '일반의약품', prices: { geoYoung: 4680, baekje: 4750, hanKolmar: 4810 } },
  { name: '훼스탈 골드정', manufacturer: '사노피', spec: '100정/병', insurancePrice: 8500, category: '일반의약품', prices: { geoYoung: 7650, baekje: 7820, hanKolmar: 7900 } },
  { name: '인사돌 플러스정', manufacturer: '동국제약', spec: '60정/박스', insurancePrice: 15000, category: '일반의약품', prices: { geoYoung: 13200, baekje: 13500, hanKolmar: 13800 } },
  { name: '종근당 락토핏 골드', manufacturer: '종근당건강', spec: '50포/박스', insurancePrice: 25000, category: '건강기능식품', prices: { geoYoung: 21500, baekje: 22000, hanKolmar: 21800 } },
  { name: '얼라이브 멀티비타민', manufacturer: '일동제약', spec: '60정/병', insurancePrice: 32000, category: '건강기능식품', prices: { geoYoung: 27200, baekje: 28000, hanKolmar: 27800 } },
  { name: '오메가3 트리플 2000', manufacturer: '뉴트리원', spec: '90캡슐/병', insurancePrice: 28000, category: '건강기능식품', prices: { geoYoung: 24080, baekje: 24500, hanKolmar: 23800 } },
  { name: '닥터린 콜라겐 펩타이드', manufacturer: '뉴트리디데이', spec: '30포/박스', insurancePrice: 35000, category: '건강기능식품', prices: { geoYoung: 29750, baekje: 30500, hanKolmar: 30100 } },
  { name: '정관장 홍삼정 에브리타임', manufacturer: 'KGC인삼공사', spec: '30포/박스', insurancePrice: 42000, category: '건강기능식품', prices: { geoYoung: 36500, baekje: 37000, hanKolmar: 36800 } },
]

const wholesalers = [
  { name: '지오영', founded: 1978, items: 32000, region: '전국 (당일/익일배송)', minOrder: '50만원', strength: '업계 최대 규모, 전국 물류 네트워크', tel: '02-3445-7700', rating: 4.5 },
  { name: '백제약품', founded: 1985, items: 28000, region: '수도권/충청/호남', minOrder: '30만원', strength: '경쟁력 있는 가격, 유연한 결제 조건', tel: '02-2088-8800', rating: 4.3 },
  { name: '한국콜마', founded: 1990, items: 25000, region: '수도권/영남', minOrder: '40만원', strength: '건강기능식품 특화, OEM 제품 강점', tel: '02-6900-5500', rating: 4.2 },
  { name: '대원메디', founded: 1992, items: 22000, region: '수도권/강원', minOrder: '25만원', strength: '소규모 약국 맞춤 서비스, 낮은 최소주문', tel: '031-456-2200', rating: 4.1 },
  { name: '삼익유통', founded: 2001, items: 18000, region: '전국 (3일 이내)', minOrder: '20만원', strength: 'IT 기반 자동 주문 시스템, 모바일 앱', tel: '02-555-3300', rating: 4.0 },
]

const checkpoints = [
  '유통기한 최소 6개월 이상 잔여 확인',
  '반품 정책 (미개봉 시 30일 이내 반품 가능 여부)',
  '결제 조건 확인 (현금할인, 어음, 카드 수수료)',
  '배송 일정 및 긴급 배송 가능 여부 확인',
  '도매상 변경 시 기존 재고 소진 계획 수립',
  '보관 조건 특수 약품 (냉장, 차광) 별도 확인',
  '수량 할인 구간 및 프로모션 주기 파악',
  '약품 리콜 대응 체계 확인',
]

export default function WholesaleComparePage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<Category | '전체'>('전체')
  const [monthlyBudget, setMonthlyBudget] = useState('')

  const categories: (Category | '전체')[] = ['전체', '전문의약품', '일반의약품', '건강기능식품']

  const filtered = useMemo(() => {
    return drugs.filter(d => {
      if (category !== '전체' && d.category !== category) return false
      if (search) {
        const q = search.toLowerCase()
        return d.name.toLowerCase().includes(q) || d.manufacturer.toLowerCase().includes(q)
      }
      return true
    })
  }, [search, category])

  const getBest = (d: Drug) => {
    const min = Math.min(d.prices.geoYoung, d.prices.baekje, d.prices.hanKolmar)
    if (min === d.prices.geoYoung) return '지오영'
    if (min === d.prices.baekje) return '백제약품'
    return '한국콜마'
  }

  const getDiscount = (insurance: number, wholesale: number) => {
    return ((1 - wholesale / insurance) * 100).toFixed(1)
  }

  const budget = Number(monthlyBudget) || 0

  return (
    <div className="min-h-screen bg-background">
      <header className="glass sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/dashboard" className="btn-ghost p-2 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Package className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold">도매상/약품 가격 비교</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl space-y-8">
        {/* Search & Tabs */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="약품명 또는 제조사 검색..." className="input pl-12 w-full" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map(c => (
              <button key={c} onClick={() => setCategory(c)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${category === c ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Drug Table */}
        <div className="card p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><TrendingDown className="w-5 h-5 text-primary" />약품별 도매가 비교</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-semibold text-foreground">약품명</th>
                  <th className="text-left py-3 px-2 font-semibold text-foreground hidden md:table-cell">제조사</th>
                  <th className="text-right py-3 px-2 font-semibold text-foreground">보험약가</th>
                  <th className="text-right py-3 px-2 font-semibold text-primary">지오영</th>
                  <th className="text-right py-3 px-2 font-semibold text-primary">백제약품</th>
                  <th className="text-right py-3 px-2 font-semibold text-primary">한국콜마</th>
                  <th className="text-center py-3 px-2 font-semibold text-foreground">최저가</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => {
                  const best = getBest(d)
                  return (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-2">
                        <div className="font-medium text-foreground">{d.name}</div>
                        <div className="text-xs text-muted-foreground">{d.spec}</div>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground hidden md:table-cell">{d.manufacturer}</td>
                      <td className="py-3 px-2 text-right text-muted-foreground">{d.insurancePrice.toLocaleString()}원</td>
                      <td className={`py-3 px-2 text-right ${best === '지오영' ? 'text-green-600 font-bold' : 'text-foreground'}`}>
                        {d.prices.geoYoung.toLocaleString()}원
                        <div className="text-xs text-green-600">-{getDiscount(d.insurancePrice, d.prices.geoYoung)}%</div>
                      </td>
                      <td className={`py-3 px-2 text-right ${best === '백제약품' ? 'text-green-600 font-bold' : 'text-foreground'}`}>
                        {d.prices.baekje.toLocaleString()}원
                        <div className="text-xs text-green-600">-{getDiscount(d.insurancePrice, d.prices.baekje)}%</div>
                      </td>
                      <td className={`py-3 px-2 text-right ${best === '한국콜마' ? 'text-green-600 font-bold' : 'text-foreground'}`}>
                        {d.prices.hanKolmar.toLocaleString()}원
                        <div className="text-xs text-green-600">-{getDiscount(d.insurancePrice, d.prices.hanKolmar)}%</div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                          <Star className="w-3 h-3" />{best}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">검색 결과가 없습니다.</p>}
        </div>

        {/* Wholesaler Profiles */}
        <div>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" />도매상 프로필</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wholesalers.map((w, i) => (
              <div key={i} className="card p-5 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-foreground text-lg">{w.name}</h3>
                    <p className="text-xs text-muted-foreground">설립 {w.founded}년</p>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500 text-sm font-semibold">
                    <Star className="w-4 h-4 fill-current" />{w.rating}
                  </div>
                </div>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between"><span className="text-muted-foreground">취급 품목</span><span className="font-medium text-foreground">{w.items.toLocaleString()}개</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">배송 지역</span><span className="font-medium text-foreground">{w.region}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">최소 주문</span><span className="font-medium text-foreground">{w.minOrder}</span></div>
                </div>
                <div className="bg-muted rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <Truck className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-foreground">{w.strength}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Phone className="w-3.5 h-3.5" />{w.tel}
                  </div>
                  <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">거래 문의</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Savings Calculator */}
        <div className="card p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Calculator className="w-5 h-5 text-primary" />월 절감액 시뮬레이터</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-2">월 약품 구매액 (원)</label>
            <input type="number" value={monthlyBudget} onChange={e => setMonthlyBudget(e.target.value)} placeholder="예: 30000000" className="input w-full max-w-xs" />
          </div>
          {budget > 0 && (
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { name: '지오영', rate: 0.08 },
                { name: '백제약품', rate: 0.065 },
                { name: '한국콜마', rate: 0.055 },
              ].map((w, i) => (
                <div key={i} className={`rounded-xl p-4 text-center ${i === 0 ? 'bg-green-50 border-2 border-green-200' : 'bg-muted'}`}>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{w.name}</p>
                  <p className="text-2xl font-bold text-foreground">{Math.round(budget * w.rate).toLocaleString()}원</p>
                  <p className="text-xs text-muted-foreground">평균 할인율 {(w.rate * 100).toFixed(1)}%</p>
                  <p className="text-sm font-semibold text-green-600 mt-2">연간 {Math.round(budget * w.rate * 12).toLocaleString()}원 절감</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="card p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" />약품 구매 시 체크포인트</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {checkpoints.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
