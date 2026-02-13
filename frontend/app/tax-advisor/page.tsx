'use client'

import { useState, useMemo } from 'react'
import { ArrowLeft, Calculator, Star, MapPin, Briefcase, Users, Phone, CheckCircle2, ChevronDown, Info, Shield, TrendingUp, FileText, Building2 } from 'lucide-react'
import Link from 'next/link'

interface Advisor {
  id: string
  name: string
  office: string
  region: string
  specialty: string[]
  experience: number
  clients: number
  monthlyFee: string
  feeRange: [number, number]
  expertise: string[]
  rating: number
  reviews: number
  photo: string
  description: string
}

const advisors: Advisor[] = [
  {
    id: '1',
    name: '김세무',
    office: '김세무회계사무소',
    region: '서울',
    specialty: ['병의원', '치과'],
    experience: 15,
    clients: 120,
    monthlyFee: '월 25~35만원',
    feeRange: [25, 35],
    expertise: ['개원초기세무구조', '절세전략', '법인전환'],
    rating: 4.8,
    reviews: 87,
    photo: 'K',
    description: '병의원 전문 15년차 세무사. 개원 초기부터 안정적인 세무 구조를 잡아드립니다. 의사 출신 세무사로 의료 현장을 잘 이해합니다.',
  },
  {
    id: '2',
    name: '박회계',
    office: '메디택스 세무법인',
    region: '서울',
    specialty: ['병의원', '약국'],
    experience: 12,
    clients: 95,
    monthlyFee: '월 30~40만원',
    feeRange: [30, 40],
    expertise: ['절세전략', '양도양수', '세무조사 대응'],
    rating: 4.6,
    reviews: 64,
    photo: 'P',
    description: '대형 세무법인 출신으로 병의원 양도양수, 세무조사 대응에 강점. 복잡한 세무 이슈를 명쾌하게 해결합니다.',
  },
  {
    id: '3',
    name: '이진영',
    office: '이진영 세무사사무소',
    region: '경기',
    specialty: ['병의원'],
    experience: 8,
    clients: 60,
    monthlyFee: '월 20~30만원',
    feeRange: [20, 30],
    expertise: ['개원초기세무구조', '부가세/종소세 절세'],
    rating: 4.5,
    reviews: 42,
    photo: 'L',
    description: '합리적인 비용으로 꼼꼼한 기장 서비스를 제공합니다. 개원 초기 의사분들에게 특히 인기가 높습니다.',
  },
  {
    id: '4',
    name: '최세무',
    office: '닥터세무 컨설팅',
    region: '부산',
    specialty: ['병의원', '한의원'],
    experience: 20,
    clients: 150,
    monthlyFee: '월 25~35만원',
    feeRange: [25, 35],
    expertise: ['법인전환', '절세전략', '부동산 세무'],
    rating: 4.7,
    reviews: 98,
    photo: 'C',
    description: '부산 지역 병의원 세무 1위. 20년 경력으로 법인전환, 부동산 취득 등 고급 세무 컨설팅까지 원스톱으로 제공합니다.',
  },
  {
    id: '5',
    name: '정민수',
    office: '정민수 세무회계',
    region: '대구',
    specialty: ['약국', '병의원'],
    experience: 10,
    clients: 75,
    monthlyFee: '월 15~25만원',
    feeRange: [15, 25],
    expertise: ['개원초기세무구조', '급여/4대보험'],
    rating: 4.3,
    reviews: 35,
    photo: 'J',
    description: '약국과 소규모 의원 전문. 합리적 비용으로 사업자등록부터 세무신고까지 올인원 서비스를 제공합니다.',
  },
  {
    id: '6',
    name: '한서윤',
    office: '메디컬세무법인',
    region: '서울',
    specialty: ['병의원', '치과', '피부과'],
    experience: 18,
    clients: 200,
    monthlyFee: '월 30~40만원',
    feeRange: [30, 40],
    expertise: ['법인전환', '양도양수', '세무조사 대응', '절세전략'],
    rating: 4.8,
    reviews: 112,
    photo: 'H',
    description: '의료법인 전환 전문가. 200개 이상의 병의원 고객사를 보유한 대형 세무법인으로, 피부과·치과 등 비급여 매출 관리에 강점.',
  },
]

const regions = ['전체', '서울', '경기', '부산', '대구', '인천', '광주', '대전']
const specialtyFilters = ['전체', '병의원', '약국', '치과', '한의원', '피부과']
const priceFilters = ['전체', '15~25만원', '25~35만원', '35만원 이상']

const keyServices = [
  { icon: <FileText className="w-5 h-5" />, title: '사업자등록 대행', desc: '업종코드 선정부터 등록까지 원스톱 대행' },
  { icon: <Calculator className="w-5 h-5" />, title: '부가세/종합소득세 신고', desc: '절세 포인트를 반영한 정확한 세금 신고' },
  { icon: <Users className="w-5 h-5" />, title: '급여/4대보험 처리', desc: '직원 급여 계산, 원천징수, 4대보험 신고' },
  { icon: <Shield className="w-5 h-5" />, title: '세무조사 대응', desc: '국세청 세무조사 시 전문적 대리 및 소명' },
  { icon: <Building2 className="w-5 h-5" />, title: '법인전환 컨설팅', desc: '개인→법인 전환 시기, 절세 효과 분석' },
  { icon: <TrendingUp className="w-5 h-5" />, title: '양도양수 세금 계산', desc: '병원 매매 시 양도소득세, 부가세 사전 분석' },
]

const whySpecialized = [
  { title: '의료 매출 구조 이해', desc: '급여/비급여, 건강보험 청구 구조를 정확히 파악해야 절세가 가능합니다.' },
  { title: '의료법 규제 대응', desc: '의료광고비, 리베이트, 현금영수증 등 의료 특수 세무 이슈에 대한 전문 지식이 필요합니다.' },
  { title: '개원 초기 세무 설계', desc: '감가상각, 인테리어 비용 처리, 장비 리스 등 개원 시 대규모 지출의 세무 처리가 핵심입니다.' },
  { title: '법인전환 최적 타이밍', desc: '매출 규모에 따른 법인전환 시점을 정확히 판단해야 수천만원의 세금 차이가 발생합니다.' },
]

export default function TaxAdvisorPage() {
  const [region, setRegion] = useState('전체')
  const [specialty, setSpecialty] = useState('전체')
  const [priceFilter, setPriceFilter] = useState('전체')
  const [showContact, setShowContact] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return advisors.filter((a) => {
      const matchRegion = region === '전체' || a.region === region
      const matchSpecialty = specialty === '전체' || a.specialty.includes(specialty)
      const matchPrice =
        priceFilter === '전체' ||
        (priceFilter === '15~25만원' && a.feeRange[0] <= 25) ||
        (priceFilter === '25~35만원' && a.feeRange[0] >= 25 && a.feeRange[1] <= 35) ||
        (priceFilter === '35만원 이상' && a.feeRange[1] >= 35)
      return matchRegion && matchSpecialty && matchPrice
    })
  }, [region, specialty, priceFilter])

  return (
    <div className="min-h-screen bg-background">
      <header className="glass sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/dashboard" className="btn-ghost p-2 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Calculator className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold">세무/회계사 매칭</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Hero Section */}
        <div className="card p-6 mb-6 bg-gradient-to-r from-primary/10 to-transparent border border-primary/20">
          <h2 className="text-xl font-bold text-foreground mb-2">병의원 전문 세무사를 찾으세요</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            일반 세무사와 병의원 전문 세무사는 다릅니다. 의료 매출 구조를 이해하고 개원 초기 세무 설계부터
            법인전환까지, 병의원에 최적화된 절세 전략을 제공하는 전문가를 매칭해드립니다.
          </p>
        </div>

        {/* Filters */}
        <div className="card p-5 mb-6">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <ChevronDown className="w-4 h-4" />
            필터
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">지역</label>
              <div className="flex flex-wrap gap-1.5">
                {regions.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRegion(r)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      region === r ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">전문분야</label>
              <div className="flex flex-wrap gap-1.5">
                {specialtyFilters.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpecialty(s)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      specialty === s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">가격대</label>
              <div className="flex flex-wrap gap-1.5">
                {priceFilters.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriceFilter(p)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      priceFilter === p ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Advisor Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {filtered.length === 0 && (
            <div className="col-span-2 card p-8 text-center">
              <p className="text-muted-foreground">조건에 맞는 세무사가 없습니다. 필터를 조정해보세요.</p>
            </div>
          )}
          {filtered.map((advisor) => (
            <div key={advisor.id} className="card p-5">
              <div className="flex items-start gap-4 mb-3">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl shrink-0">
                  {advisor.photo}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground text-lg">{advisor.name}</h3>
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">{advisor.region}</span>
                  </div>
                  <p className="text-sm text-primary">{advisor.office}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-semibold">{advisor.rating}</span>
                      <span className="text-xs text-muted-foreground">({advisor.reviews}건)</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-3">{advisor.description}</p>

              <div className="space-y-2 text-sm mb-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-primary" />
                  <span className="text-muted-foreground">경력:</span>
                  <span className="text-foreground font-medium">{advisor.experience}년</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  <span className="text-muted-foreground">관리 고객:</span>
                  <span className="text-foreground font-medium">{advisor.clients}개 병의원</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calculator className="w-3.5 h-3.5 text-primary" />
                  <span className="text-muted-foreground">월 기장료:</span>
                  <span className="text-foreground font-bold">{advisor.monthlyFee}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span className="text-muted-foreground">전문:</span>
                  <span className="text-foreground">{advisor.specialty.join(', ')}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {advisor.expertise.map((e) => (
                  <span key={e} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{e}</span>
                ))}
              </div>

              <button
                onClick={() => setShowContact(showContact === advisor.id ? null : advisor.id)}
                className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                {showContact === advisor.id ? '상담 접수 완료' : '상담 신청'}
              </button>
              {showContact === advisor.id && (
                <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400 font-medium">상담 신청이 접수되었습니다</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">영업일 기준 1~2일 이내에 연락드리겠습니다.</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Key Services */}
        <h2 className="text-lg font-bold text-foreground mb-4">주요 서비스</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
          {keyServices.map((service) => (
            <div key={service.title} className="card p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
                {service.icon}
              </div>
              <div>
                <h4 className="font-semibold text-foreground text-sm">{service.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{service.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Why Specialized */}
        <div className="card p-6 mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            왜 병의원 전문 세무사가 필요한가?
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {whySpecialized.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                  {i + 1}
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm">{item.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="card p-6 text-center mb-8 bg-gradient-to-r from-primary/10 to-transparent border border-primary/20">
          <h3 className="font-bold text-foreground text-lg mb-2">맞춤 세무사 추천 받기</h3>
          <p className="text-sm text-muted-foreground mb-4">
            진료과, 예상 매출, 지역 정보를 알려주시면 최적의 세무사를 추천해드립니다.
          </p>
          <button className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            무료 상담 신청
          </button>
        </div>

        <p className="text-xs text-muted-foreground text-center pb-8">
          세무사 정보는 참고용이며, 실제 상담 시 구체적인 비용과 서비스 범위를 확인하세요.
        </p>
      </main>
    </div>
  )
}
