'use client'

import { useState, useMemo } from 'react'
import { ArrowLeft, Monitor, Star, Filter, ThumbsUp, Cloud, Headphones, Smartphone, BarChart3, CalendarCheck, ClipboardList, CreditCard, Search } from 'lucide-react'
import Link from 'next/link'

type Rating = 'excellent' | 'good' | 'limited'
const ratingLabel: Record<Rating, string> = { excellent: '\u2B50', good: '\u25CB', limited: '\u25B3' }
const ratingColor: Record<Rating, string> = { excellent: 'text-amber-400', good: 'text-green-400', limited: 'text-muted-foreground' }

interface EMRSystem {
  id: string
  name: string
  brand: string
  product: string
  price: string
  priceRange: [number, number]
  marketShare: string
  badges: string[]
  specialties: string[]
  description: string
  features: Record<string, Rating>
  pros: string[]
  cons: string[]
  reviews: number
  rating: number
  support: string
}

const emrSystems: EMRSystem[] = [
  {
    id: 'bitcomputer',
    name: '비트컴퓨터',
    brand: 'BitComputer',
    product: 'UBIST',
    price: '월 35~50만원',
    priceRange: [35, 50],
    marketShare: '시장점유율 1위 (약 30%)',
    badges: ['대형 병원 추천'],
    specialties: ['내과', '정형외과', '외과', '산부인과', '소아과'],
    description: '국내 의료 IT 1위 기업으로 30년 이상의 업력. 대형 병원부터 의원까지 폭넓은 라인업을 보유하고 있으며, 안정성과 확장성이 강점입니다.',
    features: {
      예약관리: 'excellent',
      접수: 'excellent',
      처방: 'excellent',
      청구: 'excellent',
      통계: 'excellent',
      모바일: 'good',
      클라우드: 'limited',
      고객지원: 'excellent',
    },
    pros: ['안정적인 시스템 운영', '풍부한 레퍼런스', '다양한 연동 모듈'],
    cons: ['높은 초기 도입 비용', '클라우드 전환 느림', 'UI가 다소 올드함'],
    reviews: 342,
    rating: 4.2,
    support: '전국 지사, 24시간 콜센터',
  },
  {
    id: 'ubcare',
    name: '유비케어',
    brand: 'UBCare',
    product: 'Dr.Chart',
    price: '월 30~45만원',
    priceRange: [30, 45],
    marketShare: '시장점유율 2위 (약 22%)',
    badges: ['가성비 추천'],
    specialties: ['내과', '가정의학과', '피부과', '소아과', '이비인후과'],
    description: '클라우드 기반 EMR의 선두주자. 직관적인 UI와 합리적인 가격으로 개원의에게 인기가 높습니다. 모바일 앱 지원이 뛰어납니다.',
    features: {
      예약관리: 'excellent',
      접수: 'excellent',
      처방: 'excellent',
      청구: 'excellent',
      통계: 'good',
      모바일: 'excellent',
      클라우드: 'excellent',
      고객지원: 'good',
    },
    pros: ['클라우드 기반으로 어디서나 접속', '직관적 UI', '합리적 월 비용'],
    cons: ['대형 병원에는 부족할 수 있음', '커스터마이징 한계', '동시 접속 시 속도 저하 가끔'],
    reviews: 287,
    rating: 4.5,
    support: '원격 지원, 전화 상담',
  },
  {
    id: 'pointnix',
    name: '포인트닉스',
    brand: 'Pointnix',
    product: 'PACSPLUS',
    price: '월 40~55만원',
    priceRange: [40, 55],
    marketShare: '영상의학 분야 1위',
    badges: ['대형 병원 추천'],
    specialties: ['영상의학과', '정형외과', '신경외과', '외과'],
    description: 'PACS(의료영상저장전송시스템) 분야 국내 1위. 영상 판독이 많은 진료과에 최적화되어 있으며, 3D 영상 뷰어 등 고급 기능을 제공합니다.',
    features: {
      예약관리: 'good',
      접수: 'good',
      처방: 'good',
      청구: 'good',
      통계: 'excellent',
      모바일: 'good',
      클라우드: 'good',
      고객지원: 'good',
    },
    pros: ['최고 수준의 영상 처리', 'PACS 연동 완벽', '3D 뷰어 지원'],
    cons: ['EMR 자체 기능은 평범', '비영상 과목에는 과한 스펙', '높은 가격대'],
    reviews: 156,
    rating: 4.3,
    support: '전국 엔지니어 파견',
  },
  {
    id: 'ezis',
    name: '이지스헬스케어',
    brand: 'EZIS Healthcare',
    product: 'EZIS EMR',
    price: '월 25~35만원',
    priceRange: [25, 35],
    marketShare: '소규모 의원 특화',
    badges: ['가성비 추천', 'IT 초보 추천'],
    specialties: ['내과', '가정의학과', '이비인후과', '소아과'],
    description: '소규모 의원에 특화된 가성비 EMR. 설치가 간편하고 학습 곡선이 낮아 IT에 익숙하지 않은 의사도 쉽게 사용할 수 있습니다.',
    features: {
      예약관리: 'good',
      접수: 'excellent',
      처방: 'good',
      청구: 'excellent',
      통계: 'limited',
      모바일: 'limited',
      클라우드: 'good',
      고객지원: 'excellent',
    },
    pros: ['저렴한 월 비용', '간편한 설치', '친절한 고객지원'],
    cons: ['확장성 제한', '고급 통계 기능 부족', '모바일 앱 미흡'],
    reviews: 198,
    rating: 4.0,
    support: '전화, 원격, 방문 지원',
  },
  {
    id: 'medicalsoft',
    name: '메디칼소프트',
    brand: 'MedicalSoft',
    product: 'MediOffice',
    price: '월 30~40만원',
    priceRange: [30, 40],
    marketShare: '한의원/치과 점유율 1위',
    badges: [],
    specialties: ['한의원', '치과', '피부과'],
    description: '한의원과 치과에 최적화된 EMR. 한방 처방, 치과 차트 등 특수 진료과 기능이 강점이며, 해당 분야 레퍼런스가 풍부합니다.',
    features: {
      예약관리: 'excellent',
      접수: 'good',
      처방: 'excellent',
      청구: 'excellent',
      통계: 'good',
      모바일: 'good',
      클라우드: 'good',
      고객지원: 'good',
    },
    pros: ['한의원/치과 전용 기능', '전문 처방 DB', '진료과 맞춤 차트'],
    cons: ['일반 의원에는 부적합', '범용성 부족', 'UI 디자인 평범'],
    reviews: 134,
    rating: 4.1,
    support: '전문 상담원, 방문 교육',
  },
  {
    id: 'drpharm',
    name: '닥터팜',
    brand: 'Dr.Pharm',
    product: 'PharmManager',
    price: '월 20~30만원',
    priceRange: [20, 30],
    marketShare: '약국 관리 특화',
    badges: ['가성비 추천'],
    specialties: ['약국'],
    description: '약국 경영 관리에 특화된 시스템. 조제, 재고관리, DUR 연동이 핵심이며, 약국 개국 시 가장 많이 선택됩니다.',
    features: {
      예약관리: 'limited',
      접수: 'good',
      처방: 'excellent',
      청구: 'excellent',
      통계: 'good',
      모바일: 'good',
      클라우드: 'good',
      고객지원: 'good',
    },
    pros: ['약국 전용 기능 최적화', '저렴한 비용', 'DUR 완벽 연동'],
    cons: ['의원용 EMR로는 사용 불가', '기능 범위 제한적'],
    reviews: 221,
    rating: 4.4,
    support: '전화, 원격 지원',
  },
]

const featureKeys = ['예약관리', '접수', '처방', '청구', '통계', '모바일', '클라우드', '고객지원']
const featureIcons: Record<string, React.ReactNode> = {
  예약관리: <CalendarCheck className="w-3.5 h-3.5" />,
  접수: <ClipboardList className="w-3.5 h-3.5" />,
  처방: <ClipboardList className="w-3.5 h-3.5" />,
  청구: <CreditCard className="w-3.5 h-3.5" />,
  통계: <BarChart3 className="w-3.5 h-3.5" />,
  모바일: <Smartphone className="w-3.5 h-3.5" />,
  클라우드: <Cloud className="w-3.5 h-3.5" />,
  고객지원: <Headphones className="w-3.5 h-3.5" />,
}

const specialtyOptions = ['전체', '내과', '정형외과', '피부과', '안과', '치과', '한의원', '약국', '가정의학과', '소아과', '이비인후과']
const tabs = ['기능', '가격', '지원', '연동성', '후기']

export default function EmrComparePage() {
  const [selectedSpecialty, setSelectedSpecialty] = useState('전체')
  const [activeTab, setActiveTab] = useState('기능')
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = useMemo(() => {
    return emrSystems.filter((emr) => {
      const matchSpecialty = selectedSpecialty === '전체' || emr.specialties.includes(selectedSpecialty)
      const matchSearch = searchQuery === '' || emr.name.includes(searchQuery) || emr.product.includes(searchQuery)
      return matchSpecialty && matchSearch
    })
  }, [selectedSpecialty, searchQuery])

  const recommended = useMemo(() => {
    if (selectedSpecialty === '전체') return null
    const match = emrSystems.filter((e) => e.specialties.includes(selectedSpecialty))
    return match.sort((a, b) => b.rating - a.rating)[0] || null
  }, [selectedSpecialty])

  return (
    <div className="min-h-screen bg-background">
      <header className="glass sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/dashboard" className="btn-ghost p-2 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Monitor className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold">EMR/전자차트 비교</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Filters */}
        <div className="card p-5 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-foreground mb-2 block">
                <Filter className="w-4 h-4 inline mr-1" />
                진료과 선택
              </label>
              <div className="flex flex-wrap gap-2">
                {specialtyOptions.map((sp) => (
                  <button
                    key={sp}
                    onClick={() => setSelectedSpecialty(sp)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedSpecialty === sp
                        ? 'bg-primary text-white'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {sp}
                  </button>
                ))}
              </div>
            </div>
            <div className="w-full md:w-64">
              <label className="text-sm font-medium text-foreground mb-2 block">검색</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="EMR 이름 검색..."
                  className="w-full pl-9 pr-3 py-2 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recommended */}
        {recommended && (
          <div className="card p-5 mb-6 border border-primary/30 bg-primary/5">
            <div className="flex items-center gap-2 mb-2">
              <ThumbsUp className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-foreground">
                {selectedSpecialty} 추천 EMR
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <span className="text-lg font-bold text-primary">{recommended.name}</span>
                <span className="text-sm text-muted-foreground ml-2">{recommended.product}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-sm font-semibold">{recommended.rating}</span>
              </div>
              <span className="text-sm text-muted-foreground">{recommended.price}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{recommended.description}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Feature Matrix Table */}
        {activeTab === '기능' && (
          <div className="card overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-3 font-semibold text-foreground sticky left-0 bg-background z-10">기능</th>
                    {filtered.map((emr) => (
                      <th key={emr.id} className="p-3 text-center font-semibold text-foreground min-w-[100px]">
                        <div>{emr.name}</div>
                        <div className="text-xs text-muted-foreground font-normal">{emr.product}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {featureKeys.map((feat) => (
                    <tr key={feat} className="border-b border-white/5 hover:bg-muted/30">
                      <td className="p-3 font-medium text-foreground sticky left-0 bg-background z-10">
                        <span className="flex items-center gap-2">{featureIcons[feat]} {feat}</span>
                      </td>
                      {filtered.map((emr) => (
                        <td key={emr.id} className="p-3 text-center">
                          <span className={`text-lg ${ratingColor[emr.features[feat]]}`}>
                            {ratingLabel[emr.features[feat]]}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-3 border-t border-white/5 flex gap-6 text-xs text-muted-foreground">
              <span><span className="text-amber-400">{ratingLabel.excellent}</span> 우수</span>
              <span><span className="text-green-400">{ratingLabel.good}</span> 양호</span>
              <span>{ratingLabel.limited} 제한적</span>
            </div>
          </div>
        )}

        {/* Price Tab */}
        {activeTab === '가격' && (
          <div className="space-y-3 mb-6">
            {filtered.map((emr) => (
              <div key={emr.id} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-foreground">{emr.name} <span className="text-muted-foreground font-normal text-sm">{emr.product}</span></h3>
                    <p className="text-xs text-muted-foreground">{emr.marketShare}</p>
                  </div>
                  <span className="text-lg font-bold text-primary">{emr.price}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-4 relative">
                  <div
                    className="h-full bg-primary/60 rounded-full"
                    style={{ marginLeft: `${(emr.priceRange[0] / 60) * 100}%`, width: `${((emr.priceRange[1] - emr.priceRange[0]) / 60) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0</span><span>20만</span><span>40만</span><span>60만</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Support Tab */}
        {activeTab === '지원' && (
          <div className="grid md:grid-cols-2 gap-3 mb-6">
            {filtered.map((emr) => (
              <div key={emr.id} className="card p-5">
                <h3 className="font-bold text-foreground mb-1">{emr.name}</h3>
                <div className="flex items-center gap-2 mb-3">
                  <Headphones className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">{emr.support}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {emr.badges.map((b) => (
                    <span key={b} className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">{b}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Compatibility Tab */}
        {activeTab === '연동성' && (
          <div className="card p-5 mb-6">
            <h3 className="font-bold text-foreground mb-4">주요 연동 항목 체크</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-2 text-muted-foreground">연동 항목</th>
                    {filtered.map((emr) => (
                      <th key={emr.id} className="p-2 text-center text-foreground">{emr.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {['건강보험 EDI', 'DUR 연동', 'PACS 연동', '예약 플랫폼', '키오스크', '약국 연동'].map((item) => (
                    <tr key={item} className="border-b border-white/5">
                      <td className="p-2 text-foreground">{item}</td>
                      {filtered.map((emr) => (
                        <td key={emr.id} className="p-2 text-center">
                          {emr.features.청구 === 'excellent' || emr.features.처방 === 'excellent'
                            ? <span className="text-green-400">O</span>
                            : <span className="text-muted-foreground">-</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Review Tab */}
        {activeTab === '후기' && (
          <div className="space-y-3 mb-6">
            {filtered.sort((a, b) => b.rating - a.rating).map((emr) => (
              <div key={emr.id} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-foreground">{emr.name} <span className="text-sm font-normal text-muted-foreground">{emr.product}</span></h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-4 h-4 ${s <= Math.round(emr.rating) ? 'text-amber-400 fill-amber-400' : 'text-muted'}`} />
                      ))}
                    </div>
                    <span className="font-bold text-foreground">{emr.rating}</span>
                    <span className="text-xs text-muted-foreground">({emr.reviews}건)</span>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="bg-green-500/5 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-green-400 mb-1">장점</h4>
                    <ul className="space-y-1">
                      {emr.pros.map((p, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-1">
                          <span className="text-green-400 shrink-0">+</span> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-red-500/5 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-red-400 mb-1">단점</h4>
                    <ul className="space-y-1">
                      {emr.cons.map((c, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-1">
                          <span className="text-red-400 shrink-0">-</span> {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EMR Cards */}
        <h2 className="text-lg font-bold text-foreground mb-4">상세 정보</h2>
        <div className="grid md:grid-cols-2 gap-4 pb-8">
          {filtered.map((emr) => (
            <div key={emr.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-foreground text-lg">{emr.name}</h3>
                  <p className="text-sm text-primary">{emr.product}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-sm font-bold">{emr.rating}</span>
                </div>
              </div>
              {emr.badges.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {emr.badges.map((b) => (
                    <span key={b} className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">{b}</span>
                  ))}
                </div>
              )}
              <p className="text-sm text-muted-foreground mb-3">{emr.description}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">월 비용</span>
                  <span className="font-semibold text-foreground">{emr.price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">시장 위치</span>
                  <span className="text-foreground">{emr.marketShare}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">고객 지원</span>
                  <span className="text-foreground">{emr.support}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">추천 진료과</span>
                  <span className="text-foreground">{emr.specialties.join(', ')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
