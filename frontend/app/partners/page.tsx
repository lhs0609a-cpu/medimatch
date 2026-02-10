'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Sparkles,
  Search,
  Star,
  MapPin,
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
  X,
  MessageCircle,
  Clock,
  Users,
  Award,
  Calculator,
  Lock,
  CheckCircle,
} from 'lucide-react'
import {
  getAllPartners,
  getPartnersByCategory,
  partnerCategories,
  partnerStats,
  Partner,
} from '@/lib/data/seedPartners'

const categoryIcons: Record<string, any> = {
  interior: Paintbrush,
  equipment: Stethoscope,
  consulting: Briefcase,
  finance: Calculator,
  pharma: Pill,
  signage: PenTool,
  it: Monitor,
  marketing: Megaphone,
  legal: Scale,
  realestate: Building,
}

export default function PartnersPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('rating')
  const [showInquiryModal, setShowInquiryModal] = useState(false)
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)

  // 파트너 데이터
  const allPartners = useMemo(() => getAllPartners(), [])

  // 필터링된 파트너
  const filteredPartners = useMemo(() => {
    let partners = selectedCategory
      ? getPartnersByCategory(selectedCategory)
      : allPartners

    // 검색어 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      partners = partners.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.region.toLowerCase().includes(query) ||
          p.specialties.some((s) => s.toLowerCase().includes(query))
      )
    }

    // 정렬
    switch (sortBy) {
      case 'rating':
        partners = [...partners].sort((a, b) => b.rating - a.rating)
        break
      case 'review_count':
        partners = [...partners].sort((a, b) => b.reviewCount - a.reviewCount)
        break
      case 'project_count':
        partners = [...partners].sort((a, b) => b.projectCount - a.projectCount)
        break
    }

    return partners
  }, [allPartners, selectedCategory, searchQuery, sortBy])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
  }

  const handlePartnerClick = (partner: Partner) => {
    setSelectedPartner(partner)
    setShowInquiryModal(true)
  }

  const getCategoryIcon = (code: string) => {
    return categoryIcons[code] || Briefcase
  }

  const getCategoryName = (code: string) => {
    const category = partnerCategories.find((c) => c.code === code)
    return category?.name || code
  }

  // 업체명 마스킹 함수 (예: "메디컬스페이스" → "메디컬○○○○")
  const maskPartnerName = (name: string) => {
    if (name.length <= 3) {
      return name[0] + '○'.repeat(name.length - 1)
    }
    // 앞 2-3글자만 보여주고 나머지는 ○으로 마스킹
    const visibleLength = name.length <= 6 ? 2 : 3
    const maskedLength = Math.min(name.length - visibleLength, 4) // 최대 4개의 ○
    return name.slice(0, visibleLength) + '○'.repeat(maskedLength)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center">
              <span className="text-background font-bold text-lg">M</span>
            </div>
            <span className="text-xl font-bold text-foreground">메디플라톤</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/map" className="text-muted-foreground hover:text-foreground transition-colors">
              지도
            </Link>
            <Link href="/partners" className="text-primary font-semibold">
              파트너
            </Link>
            <Link href="/community" className="text-muted-foreground hover:text-foreground transition-colors">
              커뮤니티
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 py-16 text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">개원의 모든 것, 파트너와 함께</h1>
            <p className="text-xl text-primary-foreground/80 mb-8">
              검증된 인테리어, 의료장비, 회계/세무, 법무 파트너를 만나보세요.
              <br />
              메디플라톤이 엄선한 <span className="font-bold">{partnerStats.totalPartners}개</span> 전문 업체와 함께
              성공적인 개원을 시작하세요.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-8">
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="text-2xl font-bold">{partnerStats.totalPartners}</div>
                <div className="text-sm text-primary-foreground/70">검증된 파트너</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="text-2xl font-bold">{partnerStats.totalCategories}</div>
                <div className="text-sm text-primary-foreground/70">전문 분야</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="text-2xl font-bold">{partnerStats.averageRating}</div>
                <div className="text-sm text-primary-foreground/70">평균 평점</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="text-2xl font-bold">{(partnerStats.totalReviews / 1000).toFixed(1)}K</div>
                <div className="text-sm text-primary-foreground/70">누적 리뷰</div>
              </div>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="업체명, 지역, 서비스 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-card text-foreground placeholder-muted-foreground shadow-xl focus:outline-none focus:ring-4 focus:ring-white/30"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-6 py-2 rounded-xl font-medium hover:bg-primary/90 transition-colors"
                >
                  검색
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                !selectedCategory
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent'
              }`}
            >
              전체 ({allPartners.length})
            </button>
            {partnerCategories.map((category) => {
              const Icon = getCategoryIcon(category.code)
              const count = getPartnersByCategory(category.code).length
              return (
                <button
                  key={category.code}
                  onClick={() => setSelectedCategory(category.code)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                    selectedCategory === category.code
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-accent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {category.name} ({count})
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
            <p className="text-muted-foreground">
              총 <span className="font-semibold text-foreground">{filteredPartners.length}</span>개의 파트너
            </p>
            <div className="flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-border rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="rating">평점순</option>
                <option value="review_count">리뷰순</option>
                <option value="project_count">시공건수순</option>
              </select>
            </div>
          </div>

          {/* Partner Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPartners.map((partner) => {
              const CategoryIcon = getCategoryIcon(partner.category)
              return (
                <div
                  key={partner.id}
                  onClick={() => handlePartnerClick(partner)}
                  className="bg-card rounded-2xl p-6 border border-border hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer group"
                >
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
                    {/* 블러 처리된 이미지 */}
                    <div
                      className={`relative w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center ${
                        partner.isPremium
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                          : 'bg-gradient-to-br from-primary to-primary/80'
                      }`}
                    >
                      <div className="absolute inset-0 backdrop-blur-sm bg-white/20" />
                      <CategoryIcon className="w-8 h-8 text-white relative z-10" />
                      {/* 잠금 아이콘 */}
                      <div className="absolute bottom-0 right-0 w-5 h-5 bg-background rounded-tl-lg flex items-center justify-center">
                        <Lock className="w-3 h-3 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-foreground truncate group-hover:text-primary transition-colors">
                          {maskPartnerName(partner.name)}
                        </h3>
                        {partner.isPremium && <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                        {partner.isVerified && <BadgeCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-medium text-foreground">{partner.rating.toFixed(1)}</span>
                        <span className="text-sm text-muted-foreground">({partner.reviewCount})</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-secondary rounded-full text-secondary-foreground">
                          {getCategoryName(partner.category)}
                        </span>
                        {partner.subcategory && (
                          <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                            {partner.subcategory}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{partner.description}</p>

                  {/* Specialties */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {partner.specialties.slice(0, 3).map((specialty, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 bg-secondary/50 rounded text-muted-foreground"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      경력 {partner.experience}
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" />
                      {partner.projectCount.toLocaleString()}건 완료
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {partner.region}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-primary font-medium">
                      문의하기
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Empty State */}
          {filteredPartners.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">파트너를 찾을 수 없습니다</h3>
              <p className="text-muted-foreground">다른 검색어나 카테고리를 선택해보세요.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-card border-t border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">파트너로 등록하시겠습니까?</h2>
            <p className="text-muted-foreground mb-8">
              메디플라톤의 파트너가 되어 수많은 개원 예정자들과 연결되세요.
              <br />
              검증된 파트너에게는 프리미엄 노출 기회를 제공합니다.
            </p>
            <button
              onClick={() => {
                setSelectedPartner(null)
                setShowInquiryModal(true)
              }}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-semibold hover:bg-primary/90 transition-all"
            >
              파트너 등록 문의
              <MessageCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Inquiry Modal */}
      {showInquiryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl max-w-md w-full p-6 relative animate-fade-in-up">
            <button
              onClick={() => setShowInquiryModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                {selectedPartner ? `${maskPartnerName(selectedPartner.name)} 문의` : '파트너 등록 문의'}
              </h3>
              <p className="text-muted-foreground text-sm">
                {selectedPartner
                  ? '해당 파트너사 연결을 위해 메디플라톤으로 문의해주세요.'
                  : '파트너 등록을 원하시면 아래 연락처로 문의해주세요.'}
              </p>
            </div>

            {selectedPartner && (
              <div className="bg-secondary/50 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  {(() => {
                    const Icon = getCategoryIcon(selectedPartner.category)
                    return (
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                    )
                  })()}
                  <div>
                    <div className="font-medium text-foreground">{maskPartnerName(selectedPartner.name)}</div>
                    <div className="text-xs text-muted-foreground">
                      {getCategoryName(selectedPartner.category)} · {selectedPartner.region}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    {selectedPartner.rating}
                  </div>
                  <div>리뷰 {selectedPartner.reviewCount}개</div>
                  <div>경력 {selectedPartner.experience}</div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <a href="https://open.kakao.com/o/sMLX4Zei" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-secondary/50 rounded-xl hover:bg-secondary/70 transition-colors">
                <MessageCircle className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">카톡 상담</div>
                  <div className="font-semibold text-foreground">카카오톡 오픈채팅</div>
                </div>
              </a>

              <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-xl">
                <MessageCircle className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">카카오톡 상담</div>
                  <div className="font-semibold text-foreground">@메디플라톤</div>
                </div>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                평일 09:00 - 18:00 (점심시간 12:00 - 13:00)
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p>
                  메디플라톤을 통해 연결된 파트너사는 검증된 업체로, 안심하고 상담받으실 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
