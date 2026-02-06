'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Sparkles,
  ArrowLeft,
  Star,
  MapPin,
  BadgeCheck,
  Crown,
  MessageCircle,
  Phone,
  Mail,
  Globe,
  Building,
  Calendar,
  Users,
  Briefcase,
  ChevronRight,
  Image as ImageIcon,
  Award,
  Clock,
  TrendingUp,
  Shield,
  X,
} from 'lucide-react'
import { partnerService, chatService } from '@/lib/api/services'

interface Portfolio {
  id: number
  title: string
  project_type?: string
  project_size?: number
  project_cost?: number
  project_duration?: number
  description?: string
  images: string[]
  is_featured: boolean
  created_at: string
}

interface ServiceArea {
  id: number
  sido: string
  sigungu?: string
  is_primary: boolean
}

interface PartnerDetail {
  id: number
  name: string
  category: string
  short_description?: string
  description?: string
  has_contact: boolean
  sido?: string
  sigungu?: string
  address?: string
  established_year?: number
  employee_count?: number
  annual_projects?: number
  price_range_min?: number
  price_range_max?: number
  price_unit: string
  specialties: string[]
  logo_url?: string
  cover_image_url?: string
  rating: number
  review_count: number
  inquiry_count: number
  contract_count: number
  response_rate: number
  avg_response_time: number
  tier: string
  status: string
  is_premium: boolean
  is_verified: boolean
  premium_badge_text?: string
  portfolios: Portfolio[]
  service_areas: ServiceArea[]
  created_at: string
}

interface Review {
  id: number
  user_id: string
  rating: number
  title?: string
  content?: string
  is_verified: boolean
  created_at: string
}

export default function PartnerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const partnerId = Number(params.id)

  const [partner, setPartner] = useState<PartnerDetail | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'info' | 'portfolio' | 'reviews'>('info')
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null)
  const [isChatLoading, setIsChatLoading] = useState(false)

  useEffect(() => {
    loadPartner()
    loadReviews()
  }, [partnerId])

  const loadPartner = async () => {
    setIsLoading(true)
    try {
      const data = await partnerService.getPartnerFull(partnerId)
      setPartner(data)
    } catch (error) {
      // Mock data for demo
      setPartner({
        id: partnerId,
        name: '메디인테리어',
        category: 'interior',
        short_description: '병원/의원 전문 인테리어 15년 경력',
        description: `메디인테리어는 15년 이상의 의료시설 전문 인테리어 경험을 바탕으로,
        환자와 의료진 모두가 만족하는 최적의 공간을 설계합니다.

        - 피부과, 성형외과, 치과 등 진료과목별 특화 설계
        - 의료법규 및 소방법 완벽 대응
        - 3D 시뮬레이션으로 사전 확인
        - 공사 후 6개월 무상 A/S`,
        has_contact: true,
        sido: '서울',
        sigungu: '강남구',
        address: '서울 강남구 테헤란로 123 메디빌딩 5층',
        established_year: 2009,
        employee_count: 25,
        annual_projects: 50,
        price_range_min: 30000000,
        price_range_max: 200000000,
        price_unit: 'total',
        specialties: ['피부과', '성형외과', '치과', '안과'],
        logo_url: undefined,
        cover_image_url: undefined,
        rating: 4.8,
        review_count: 127,
        inquiry_count: 342,
        contract_count: 156,
        response_rate: 98,
        avg_response_time: 30,
        tier: 'PREMIUM',
        status: 'ACTIVE',
        is_premium: true,
        is_verified: true,
        premium_badge_text: '추천',
        portfolios: [
          {
            id: 1,
            title: '강남 A피부과 신규 개원',
            project_type: '피부과',
            project_size: 45,
            project_cost: 120000000,
            project_duration: 45,
            description: '모던하고 세련된 피부과 인테리어. 레이저실 3개, 시술실 5개 구성.',
            images: [
              'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&q=80',
              'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800&q=80'
            ],
            is_featured: true,
            created_at: '2024-11-15',
          },
          {
            id: 2,
            title: '분당 B성형외과 리모델링',
            project_type: '성형외과',
            project_size: 80,
            project_cost: 180000000,
            project_duration: 60,
            description: '수술실 2개, 회복실 8개를 갖춘 대형 성형외과 리모델링.',
            images: [
              'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80'
            ],
            is_featured: true,
            created_at: '2024-10-20',
          },
          {
            id: 3,
            title: '잠실 C치과 신규 개원',
            project_type: '치과',
            project_size: 35,
            project_cost: 80000000,
            project_duration: 30,
            description: '친환경 소재를 활용한 치과 인테리어.',
            images: [
              'https://images.unsplash.com/photo-1629909615184-74f495363b67?w=800&q=80'
            ],
            is_featured: false,
            created_at: '2024-09-10',
          },
        ],
        service_areas: [
          { id: 1, sido: '서울', sigungu: undefined, is_primary: true },
          { id: 2, sido: '경기', sigungu: undefined, is_primary: false },
          { id: 3, sido: '인천', sigungu: undefined, is_primary: false },
        ],
        created_at: '2020-03-15',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadReviews = async () => {
    try {
      const data = await partnerService.getPartnerReviews(partnerId)
      setReviews(data)
    } catch (error) {
      // Mock reviews
      setReviews([
        {
          id: 1,
          user_id: 'user1',
          rating: 5,
          title: '정말 만족스러운 시공이었습니다',
          content: '처음 개원하는 거라 걱정이 많았는데, 세심하게 신경써주셔서 감사합니다. 환자분들도 인테리어 칭찬을 많이 해주세요.',
          is_verified: true,
          created_at: '2024-12-01',
        },
        {
          id: 2,
          user_id: 'user2',
          rating: 4.5,
          title: '전문적인 의료시설 인테리어',
          content: '의료법규 관련해서 꼼꼼하게 체크해주셔서 인허가 과정이 순조로웠습니다.',
          is_verified: true,
          created_at: '2024-11-20',
        },
      ])
    }
  }

  const handleStartChat = async () => {
    if (!partner) return

    setIsChatLoading(true)
    try {
      const room = await chatService.createRoom({
        partner_id: partner.id,
      })
      router.push(`/chat/${room.id}`)
    } catch (error) {
      // Demo: redirect to mock chat
      router.push(`/chat/demo-${partner.id}`)
    } finally {
      setIsChatLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    if (price >= 100000000) {
      return `${(price / 100000000).toFixed(1)}억`
    }
    if (price >= 10000) {
      return `${(price / 10000).toLocaleString()}만`
    }
    return price.toLocaleString()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-600 border-t-transparent" />
      </div>
    )
  }

  if (!partner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">파트너를 찾을 수 없습니다</h2>
          <Link href="/partners" className="text-violet-600 hover:underline">
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">메디플라톤</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Cover Image */}
      <div className="h-48 md:h-64 bg-gradient-to-br from-violet-600 to-indigo-600 relative">
        {partner.cover_image_url && (
          <img src={partner.cover_image_url} alt="" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Profile Section */}
      <div className="container mx-auto px-4 -mt-16 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Logo */}
            <div className={`w-24 h-24 md:w-32 md:h-32 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              partner.is_premium
                ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                : 'bg-gradient-to-br from-violet-500 to-indigo-600'
            }`}>
              {partner.logo_url ? (
                <img src={partner.logo_url} alt={partner.name} className="w-16 h-16 object-contain" />
              ) : (
                <Building className="w-12 h-12 text-white" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{partner.name}</h1>
                    {partner.is_premium && (
                      <span className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-medium">
                        <Crown className="w-3 h-3" />
                        {partner.premium_badge_text || '프리미엄'}
                      </span>
                    )}
                    {partner.is_verified && (
                      <BadgeCheck className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                  <p className="text-gray-600 mb-3">{partner.short_description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="font-semibold">{partner.rating.toFixed(1)}</span>
                      <span className="text-gray-500">({partner.review_count} 리뷰)</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <MapPin className="w-4 h-4" />
                      {partner.sido} {partner.sigungu}
                    </div>
                    {partner.established_year && (
                      <div className="flex items-center gap-1 text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {partner.established_year}년 설립
                      </div>
                    )}
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={handleStartChat}
                  disabled={isChatLoading}
                  className="hidden md:flex items-center gap-2 bg-violet-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50"
                >
                  {isChatLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <MessageCircle className="w-5 h-5" />
                  )}
                  상담 시작하기
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{partner.contract_count}</div>
                  <div className="text-sm text-gray-500">완료 계약</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{partner.response_rate}%</div>
                  <div className="text-sm text-gray-500">응답률</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{partner.avg_response_time}분</div>
                  <div className="text-sm text-gray-500">평균 응답</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{partner.annual_projects || 0}건</div>
                  <div className="text-sm text-gray-500">연간 시공</div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile CTA */}
          <button
            onClick={handleStartChat}
            disabled={isChatLoading}
            className="md:hidden w-full flex items-center justify-center gap-2 bg-violet-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-violet-700 transition-colors mt-6 disabled:opacity-50"
          >
            {isChatLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <MessageCircle className="w-5 h-5" />
            )}
            상담 시작하기
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 mt-6">
        <div className="bg-white rounded-xl p-1 inline-flex gap-1">
          {[
            { key: 'info', label: '소개' },
            { key: 'portfolio', label: `포트폴리오 (${partner.portfolios.length})` },
            { key: 'reviews', label: `리뷰 (${partner.review_count})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="container mx-auto px-4 py-6">
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <div className="bg-white rounded-2xl p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">업체 소개</h2>
                <p className="text-gray-600 whitespace-pre-line">{partner.description}</p>
              </div>

              {/* Specialties */}
              {partner.specialties.length > 0 && (
                <div className="bg-white rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">전문 분야</h2>
                  <div className="flex flex-wrap gap-2">
                    {partner.specialties.map((specialty, idx) => (
                      <span
                        key={idx}
                        className="bg-violet-50 text-violet-700 px-3 py-1.5 rounded-lg text-sm font-medium"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Service Areas */}
              <div className="bg-white rounded-2xl p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">서비스 지역</h2>
                <div className="flex flex-wrap gap-2">
                  {partner.service_areas.map((area) => (
                    <span
                      key={area.id}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                        area.is_primary
                          ? 'bg-violet-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {area.sido} {area.sigungu || '전체'}
                      {area.is_primary && ' (주요)'}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Price Range */}
              {(partner.price_range_min || partner.price_range_max) && (
                <div className="bg-white rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">예상 비용</h2>
                  <div className="text-2xl font-bold text-violet-600">
                    {partner.price_range_min ? formatPrice(partner.price_range_min) : '0'}
                    {' ~ '}
                    {partner.price_range_max ? formatPrice(partner.price_range_max) : '상담'}
                    {partner.price_unit === 'per_pyeong' && ' /평'}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    * 실제 비용은 상담을 통해 확인하세요
                  </p>
                </div>
              )}

              {/* Business Info */}
              <div className="bg-white rounded-2xl p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">사업 정보</h2>
                <div className="space-y-3">
                  {partner.established_year && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">{partner.established_year}년 설립 ({new Date().getFullYear() - partner.established_year}년차)</span>
                    </div>
                  )}
                  {partner.employee_count && (
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">직원 {partner.employee_count}명</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">{partner.address}</span>
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="bg-white rounded-2xl p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">신뢰 지표</h2>
                <div className="space-y-3">
                  {partner.is_verified && (
                    <div className="flex items-center gap-3 text-blue-600">
                      <Shield className="w-5 h-5" />
                      <span className="font-medium">메디플라톤 인증 업체</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-green-600">
                    <TrendingUp className="w-5 h-5" />
                    <span className="font-medium">응답률 {partner.response_rate}%</span>
                  </div>
                  <div className="flex items-center gap-3 text-amber-600">
                    <Clock className="w-5 h-5" />
                    <span className="font-medium">평균 {partner.avg_response_time}분 내 응답</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {partner.portfolios.map((portfolio) => (
              <div
                key={portfolio.id}
                onClick={() => setSelectedPortfolio(portfolio)}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-violet-200 hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="aspect-video bg-gray-100 relative">
                  {portfolio.images.length > 0 ? (
                    <img src={portfolio.images[0]} alt={portfolio.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  {portfolio.is_featured && (
                    <div className="absolute top-3 left-3 bg-amber-500 text-white px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      대표
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-2 group-hover:text-violet-600 transition-colors">
                    {portfolio.title}
                  </h3>
                  <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                    {portfolio.project_type && (
                      <span className="bg-gray-100 px-2 py-0.5 rounded">{portfolio.project_type}</span>
                    )}
                    {portfolio.project_size && (
                      <span className="bg-gray-100 px-2 py-0.5 rounded">{portfolio.project_size}평</span>
                    )}
                    {portfolio.project_cost && (
                      <span className="bg-gray-100 px-2 py-0.5 rounded">{formatPrice(portfolio.project_cost)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {partner.portfolios.length === 0 && (
              <div className="col-span-full text-center py-16">
                <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">아직 포트폴리오가 없습니다</h3>
                <p className="text-gray-500">파트너가 포트폴리오를 등록하면 여기에 표시됩니다.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-2xl p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-semibold">{review.rating.toFixed(1)}</span>
                    {review.is_verified && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        인증된 리뷰
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(review.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                {review.title && (
                  <h3 className="font-semibold text-gray-900 mb-2">{review.title}</h3>
                )}
                <p className="text-gray-600">{review.content}</p>
              </div>
            ))}

            {reviews.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl">
                <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">아직 리뷰가 없습니다</h3>
                <p className="text-gray-500">이 파트너와 계약을 완료하면 리뷰를 작성할 수 있습니다.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Portfolio Modal */}
      {selectedPortfolio && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h2 className="font-bold text-lg">{selectedPortfolio.title}</h2>
              <button
                onClick={() => setSelectedPortfolio(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {selectedPortfolio.images.length > 0 ? (
                <div className="grid gap-4 mb-6">
                  {selectedPortfolio.images.map((img, idx) => (
                    <img key={idx} src={img} alt="" className="w-full rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center mb-6">
                  <ImageIcon className="w-16 h-16 text-gray-300" />
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {selectedPortfolio.project_type && (
                  <div>
                    <div className="text-sm text-gray-500">진료과목</div>
                    <div className="font-semibold">{selectedPortfolio.project_type}</div>
                  </div>
                )}
                {selectedPortfolio.project_size && (
                  <div>
                    <div className="text-sm text-gray-500">면적</div>
                    <div className="font-semibold">{selectedPortfolio.project_size}평</div>
                  </div>
                )}
                {selectedPortfolio.project_cost && (
                  <div>
                    <div className="text-sm text-gray-500">비용</div>
                    <div className="font-semibold">{formatPrice(selectedPortfolio.project_cost)}</div>
                  </div>
                )}
                {selectedPortfolio.project_duration && (
                  <div>
                    <div className="text-sm text-gray-500">기간</div>
                    <div className="font-semibold">{selectedPortfolio.project_duration}일</div>
                  </div>
                )}
              </div>

              {selectedPortfolio.description && (
                <div>
                  <h3 className="font-semibold mb-2">상세 설명</h3>
                  <p className="text-gray-600">{selectedPortfolio.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
