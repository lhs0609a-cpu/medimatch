'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  Search,
  Star,
  MapPin,
  Phone,
  ExternalLink,
  BadgeCheck,
  Crown,
  Paintbrush,
  Stethoscope,
  Briefcase,
  Landmark,
  Pill,
  PenTool,
  Monitor,
  Megaphone,
  Scale,
  Building,
  ChevronRight,
  Filter,
  ArrowUpDown,
} from 'lucide-react'
import { partnerService } from '@/lib/api/services'

interface Partner {
  id: number
  name: string
  category: string
  subcategory?: string
  phone?: string
  email?: string
  website?: string
  address?: string
  region?: string
  description?: string
  rating: number
  review_count: number
  is_premium: boolean
  is_verified: boolean
  logo_url?: string
  specialties?: string
}

interface Category {
  code: string
  name: string
  description: string
  icon: string
}

const categoryIcons: Record<string, any> = {
  interior: Paintbrush,
  equipment: Stethoscope,
  consulting: Briefcase,
  finance: Landmark,
  pharma: Pill,
  signage: PenTool,
  it: Monitor,
  marketing: Megaphone,
  legal: Scale,
  realestate: Building,
}

export default function PartnersPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('rating')
  const [isLoading, setIsLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    loadCategories()
    loadPartners()
  }, [])

  useEffect(() => {
    loadPartners()
  }, [selectedCategory, sortBy])

  const loadCategories = async () => {
    try {
      const data = await partnerService.getCategories()
      setCategories(data)
    } catch (error) {
      // Mock categories for demo
      setCategories([
        { code: 'interior', name: '인테리어', description: '병원/약국 전문 인테리어 업체', icon: 'Paintbrush' },
        { code: 'equipment', name: '의료 장비', description: '의료 기기 판매 및 렌탈', icon: 'Stethoscope' },
        { code: 'consulting', name: '개원 컨설팅', description: '개원 전문 컨설팅 서비스', icon: 'Briefcase' },
        { code: 'finance', name: '금융 서비스', description: '개원 대출, 리스, 보험', icon: 'Landmark' },
        { code: 'pharma', name: '약품 도매', description: '약국용 약품 도매상', icon: 'Pill' },
        { code: 'it', name: '의료 IT', description: 'EMR, 예약 시스템, 홈페이지', icon: 'Monitor' },
        { code: 'signage', name: '간판/사인물', description: '외부 간판 및 내부 사인물', icon: 'PenTool' },
        { code: 'marketing', name: '마케팅', description: '온라인 마케팅, 홍보 대행', icon: 'Megaphone' },
      ])
    }
  }

  const loadPartners = async () => {
    setIsLoading(true)
    try {
      const data = await partnerService.getPartners({
        category: selectedCategory || undefined,
        search: searchQuery || undefined,
        sort_by: sortBy,
        page: 1,
        page_size: 20,
      })
      setPartners(data.partners)
      setTotalCount(data.total)
    } catch (error) {
      // Mock partners for demo
      setPartners([
        {
          id: 1,
          name: '메디인테리어',
          category: 'interior',
          description: '병원/의원 전문 인테리어 15년 경력. 서울/경기 지역 500건 이상 시공 완료.',
          address: '서울 강남구 테헤란로 123',
          region: '서울',
          phone: '02-1234-5678',
          rating: 4.8,
          review_count: 127,
          is_premium: true,
          is_verified: true,
        },
        {
          id: 2,
          name: '헬스케어솔루션',
          category: 'equipment',
          description: '최신 의료장비 렌탈 및 판매. 설치부터 AS까지 원스톱 서비스.',
          address: '서울 서초구 강남대로 456',
          region: '서울',
          phone: '02-2345-6789',
          rating: 4.6,
          review_count: 89,
          is_premium: true,
          is_verified: true,
        },
        {
          id: 3,
          name: '개원컨설팅그룹',
          category: 'consulting',
          description: '개원 입지 분석부터 인허가, 세무까지 토탈 컨설팅 서비스.',
          address: '서울 송파구 올림픽로 789',
          region: '서울',
          phone: '02-3456-7890',
          rating: 4.9,
          review_count: 203,
          is_premium: false,
          is_verified: true,
        },
        {
          id: 4,
          name: '메디뱅크',
          category: 'finance',
          description: '의료인 전문 대출 상품. 낮은 금리, 빠른 심사.',
          address: '서울 중구 을지로 321',
          region: '서울',
          phone: '1588-1234',
          rating: 4.5,
          review_count: 156,
          is_premium: true,
          is_verified: true,
        },
        {
          id: 5,
          name: '클리닉EMR',
          category: 'it',
          description: '클라우드 기반 EMR 시스템. 예약, 접수, 차트까지 통합 관리.',
          address: '경기 성남시 분당구 판교로 555',
          region: '경기',
          phone: '031-1234-5678',
          rating: 4.7,
          review_count: 312,
          is_premium: false,
          is_verified: true,
        },
      ])
      setTotalCount(5)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadPartners()
  }

  const getCategoryIcon = (code: string) => {
    const Icon = categoryIcons[code] || Briefcase
    return Icon
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">메디플라톤</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">대시보드</Link>
            <Link href="/map" className="text-gray-600 hover:text-gray-900 transition-colors">지도</Link>
            <Link href="/partners" className="text-violet-600 font-semibold">파트너</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="gradient-bg py-16 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">
              개원의 모든 것, 파트너와 함께
            </h1>
            <p className="text-xl text-white/80 mb-8">
              검증된 인테리어, 의료장비, 컨설팅 파트너를 만나보세요.<br />
              메디플라톤이 엄선한 전문 업체와 함께 성공적인 개원을 시작하세요.
            </p>

            {/* Search */}
            <form onSubmit={handleSearch} className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="업체명, 지역, 서비스 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl text-gray-900 placeholder-gray-400 shadow-xl focus:outline-none focus:ring-4 focus:ring-white/30"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-violet-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-violet-700 transition-colors"
                >
                  검색
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                !selectedCategory
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              전체
            </button>
            {categories.map((category) => {
              const Icon = getCategoryIcon(category.code)
              return (
                <button
                  key={category.code}
                  onClick={() => setSelectedCategory(category.code)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                    selectedCategory === category.code
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {category.name}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600">
              총 <span className="font-semibold text-gray-900">{totalCount}</span>개의 파트너
            </p>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                <Filter className="w-4 h-4" />
                필터
              </button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="rating">평점순</option>
                <option value="review_count">리뷰순</option>
                <option value="created_at">최신순</option>
              </select>
            </div>
          </div>

          {/* Partner Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-xl" />
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {partners.map((partner) => {
                const CategoryIcon = getCategoryIcon(partner.category)
                return (
                  <Link
                    key={partner.id}
                    href={`/partners/${partner.id}`}
                    className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-violet-200 hover:shadow-lg transition-all group"
                  >
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                        partner.is_premium
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                          : 'bg-gradient-to-br from-violet-500 to-indigo-600'
                      }`}>
                        {partner.logo_url ? (
                          <img src={partner.logo_url} alt={partner.name} className="w-10 h-10 object-contain" />
                        ) : (
                          <CategoryIcon className="w-8 h-8 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 truncate group-hover:text-violet-600 transition-colors">
                            {partner.name}
                          </h3>
                          {partner.is_premium && (
                            <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />
                          )}
                          {partner.is_verified && (
                            <BadgeCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span className="text-sm font-medium text-gray-900">{partner.rating.toFixed(1)}</span>
                          <span className="text-sm text-gray-500">({partner.review_count})</span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {partner.description}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <MapPin className="w-4 h-4" />
                        {partner.region || '전국'}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-violet-600 font-medium">
                        상세보기
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && partners.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">파트너를 찾을 수 없습니다</h3>
              <p className="text-gray-500">다른 검색어나 카테고리를 선택해보세요.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              파트너로 등록하시겠습니까?
            </h2>
            <p className="text-gray-600 mb-8">
              메디플라톤의 파트너가 되어 수많은 개원 예정자들과 연결되세요.<br />
              검증된 파트너에게는 프리미엄 노출 기회를 제공합니다.
            </p>
            <Link
              href="/partners/register"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              파트너 등록 신청
              <ExternalLink className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
