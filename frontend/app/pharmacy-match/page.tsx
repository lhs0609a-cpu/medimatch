'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Pill, MapPin, Building2, Heart,
  ChevronRight, Search, Eye, Plus, Sparkles,
  Lock, MessageCircle, TrendingUp, Users, CheckCircle,
  Flame, Clock, Zap, AlertTriangle, SlidersHorizontal, X, RotateCcw
} from 'lucide-react'
import Image from 'next/image'
import { generatePharmacyListings, generateActivityFeed, platformStats, recentSuccessStories, memberTestimonials, type PharmacyListing } from '@/lib/data/seedListings'
import { pharmacyListingImages } from '@/components/BlurredListingImage'
import { TossIcon } from '@/components/ui/TossIcon'

// 시드 데이터 생성
const allListings = generatePharmacyListings(80)
const activityFeed = generateActivityFeed(20)

type SortOption = 'latest' | 'matchScore' | 'premiumAsc' | 'premiumDesc' | 'rentAsc' | 'rentDesc' | 'popular'

const sortLabels: Record<SortOption, string> = {
  latest: '최신순',
  matchScore: '매칭률순',
  premiumAsc: '권리금 낮은순',
  premiumDesc: '권리금 높은순',
  rentAsc: '월세 낮은순',
  rentDesc: '월세 높은순',
  popular: '인기순',
}

const premiumRanges = [
  { label: '전체', min: 0, max: Infinity },
  { label: '1억 미만', min: 0, max: 10000 },
  { label: '1억~2억', min: 10000, max: 20000 },
  { label: '2억~3억', min: 20000, max: 30000 },
  { label: '3억~5억', min: 30000, max: 50000 },
  { label: '5억 이상', min: 50000, max: Infinity },
]

const rentRanges = [
  { label: '전체', min: 0, max: Infinity },
  { label: '200만 미만', min: 0, max: 200 },
  { label: '200~400만', min: 200, max: 400 },
  { label: '400~600만', min: 400, max: 600 },
  { label: '600만 이상', min: 600, max: Infinity },
]

const statusLabels: Record<string, { label: string; style: string }> = {
  ACTIVE: { label: '매칭중', style: 'badge-success' },
  PAUSED: { label: '일시중지', style: 'badge-warning' },
  MATCHED: { label: '매칭완료', style: 'badge-default' },
}

const competitionLabels = {
  low: { label: '경쟁 낮음', style: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
  medium: { label: '경쟁 보통', style: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
  high: { label: '경쟁 높음', style: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
}

const regions = [
  '전체', '서울', '경기', '인천', '부산', '대구', '대전', '광주'
]

export default function PharmacyMatchPage() {
  const [selectedRegion, setSelectedRegion] = useState('전체')
  const [searchQuery, setSearchQuery] = useState('')
  const [showInquiryModal, setShowInquiryModal] = useState(false)
  const [selectedListing, setSelectedListing] = useState<PharmacyListing | null>(null)
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0)
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0)

  // 추가 필터 상태
  const [sortOption, setSortOption] = useState<SortOption>('latest')
  const [selectedPremiumRange, setSelectedPremiumRange] = useState(0) // 인덱스
  const [selectedRentRange, setSelectedRentRange] = useState(0) // 인덱스
  const [showFilters, setShowFilters] = useState(false)

  // 실시간 활동 피드 롤링
  useEffect(() => {
    const activityInterval = setInterval(() => {
      setCurrentActivityIndex((prev) => (prev + 1) % activityFeed.length)
    }, 4000)
    const testimonialInterval = setInterval(() => {
      setCurrentTestimonialIndex((prev) => (prev + 1) % memberTestimonials.length)
    }, 6000)
    return () => {
      clearInterval(activityInterval)
      clearInterval(testimonialInterval)
    }
  }, [])

  // 필터링 및 정렬된 매물
  const filteredListings = useMemo(() => {
    const premiumRange = premiumRanges[selectedPremiumRange]
    const rentRange = rentRanges[selectedRentRange]

    const filtered = allListings.filter(listing => {
      // 지역 필터
      if (selectedRegion !== '전체' && !listing.region.includes(selectedRegion)) {
        return false
      }
      // 검색어 필터
      if (searchQuery && !listing.region.includes(searchQuery) && !listing.pharmacyType.includes(searchQuery)) {
        return false
      }
      // 권리금 범위 필터
      if (premiumRange.max !== Infinity || premiumRange.min !== 0) {
        if (listing.premiumMin < premiumRange.min || listing.premiumMin > premiumRange.max) {
          return false
        }
      }
      // 월세 범위 필터
      if (rentRange.max !== Infinity || rentRange.min !== 0) {
        if (listing.monthlyRent < rentRange.min || listing.monthlyRent > rentRange.max) {
          return false
        }
      }
      return true
    })

    // 정렬
    return filtered.sort((a, b) => {
      switch (sortOption) {
        case 'matchScore':
          return (b.matchScore || 0) - (a.matchScore || 0)
        case 'premiumAsc':
          return a.premiumMin - b.premiumMin
        case 'premiumDesc':
          return b.premiumMin - a.premiumMin
        case 'rentAsc':
          return a.monthlyRent - b.monthlyRent
        case 'rentDesc':
          return b.monthlyRent - a.monthlyRent
        case 'popular':
          return b.viewCount - a.viewCount
        case 'latest':
        default:
          return 0 // 기본 순서 유지
      }
    })
  }, [selectedRegion, searchQuery, selectedPremiumRange, selectedRentRange, sortOption])

  // AI 추천 (상위 5개)
  const recommendations = useMemo(() => {
    return [...allListings]
      .filter(l => l.status === 'ACTIVE')
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      .slice(0, 5)
  }, [])

  const formatCurrency = (value: number) => {
    if (value >= 10000) {
      return `${(value / 10000).toFixed(1)}억`
    }
    return `${value.toLocaleString()}만`
  }

  const handleInquiry = (listing: PharmacyListing) => {
    setSelectedListing(listing)
    setShowInquiryModal(true)
  }

  // 활성 필터 확인
  const hasActiveFilters = useMemo(() => {
    return selectedRegion !== '전체' ||
      searchQuery !== '' ||
      selectedPremiumRange !== 0 ||
      selectedRentRange !== 0
  }, [selectedRegion, searchQuery, selectedPremiumRange, selectedRentRange])

  // 필터 초기화
  const resetFilters = () => {
    setSelectedRegion('전체')
    setSearchQuery('')
    setSelectedPremiumRange(0)
    setSelectedRentRange(0)
    setSortOption('latest')
  }

  // 개별 필터 제거
  const removeFilter = (filterType: string) => {
    switch (filterType) {
      case 'region':
        setSelectedRegion('전체')
        break
      case 'search':
        setSearchQuery('')
        break
      case 'premium':
        setSelectedPremiumRange(0)
        break
      case 'rent':
        setSelectedRentRange(0)
        break
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <TossIcon icon={Pill} color="from-rose-500 to-pink-500" size="xs" shadow="shadow-rose-500/25" />
                <span className="text-lg font-bold text-foreground">익명 약국 매칭</span>
                <span className="badge-info">
                  {platformStats.activePharmacyListings}+ 매물
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/pharmacy-match/listings/new"
                className="btn-primary"
              >
                <Plus className="w-4 h-4" />
                매물 등록
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-600 to-cyan-600 dark:from-blue-700 dark:to-cyan-700 text-white rounded-2xl p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">익명 약국 매칭</h1>
            <p className="text-white/80 mb-6">
              신원 노출 없이 약국 매물을 등록하고<br />
              조건에 맞는 약사를 AI가 자동으로 매칭해드립니다.
            </p>
            <div className="flex gap-4 flex-wrap">
              <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3">
                <div className="text-2xl font-bold">{platformStats.activePharmacyListings}+</div>
                <div className="text-sm text-white/70">활성 매물</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3">
                <div className="text-2xl font-bold">{platformStats.monthlyMatches}건</div>
                <div className="text-sm text-white/70">이번달 매칭</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3">
                <div className="text-2xl font-bold">100%</div>
                <div className="text-sm text-white/70">익명 보장</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3">
                <div className="text-2xl font-bold">{platformStats.onlineNow}</div>
                <div className="text-sm text-white/70">현재 접속</div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Activity + Testimonial */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {/* Live Activity */}
          <div className="bg-gradient-to-r from-blue-600/10 to-cyan-600/10 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-muted-foreground">실시간</span>
              <span className="text-foreground font-medium">
                {activityFeed[currentActivityIndex]?.region && `${activityFeed[currentActivityIndex].region}에서 `}
                {activityFeed[currentActivityIndex]?.message}
              </span>
            </div>
          </div>

          {/* Rolling Testimonial */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <span className="text-green-700 dark:text-green-400 font-medium">
                  "{memberTestimonials[currentTestimonialIndex]?.content.slice(0, 40)}..."
                </span>
                <span className="text-green-600 dark:text-green-500 text-xs block mt-1">
                  - {memberTestimonials[currentTestimonialIndex]?.authorName}, {memberTestimonials[currentTestimonialIndex]?.region}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Success Stories */}
        <div className="card p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h2 className="font-semibold text-foreground">최근 매칭 성공 사례</h2>
            <span className="text-sm text-muted-foreground">(익명)</span>
            <span className="ml-auto text-xs text-green-600 flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              실시간 업데이트
            </span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {recentSuccessStories.map((story, idx) => (
              <div key={idx} className="flex-shrink-0 px-4 py-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                <p className="font-medium text-foreground">{story.region}</p>
                <p className="text-sm text-muted-foreground">{story.type} · {story.days}일 만에 매칭</p>
                <p className="text-xs text-green-600 mt-1">"{story.testimonial}"</p>
                <p className="text-xs text-muted-foreground mt-1">{story.date}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <h2 className="font-semibold text-foreground">AI 추천 매물</h2>
            <span className="text-sm text-amber-600">내 조건과 매칭률 높은 순</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {recommendations.map((listing) => (
              <div
                key={listing.id}
                onClick={() => handleInquiry(listing)}
                className="flex-shrink-0 w-64 bg-card rounded-xl p-4 border border-amber-200 dark:border-amber-800 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 text-xs font-medium rounded">
                    매칭률 {listing.matchScore}%
                  </span>
                  {listing.isHot && (
                    <Flame className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <p className="font-medium text-foreground mb-1">{listing.region}</p>
                <p className="text-sm text-muted-foreground mb-2">{listing.pharmacyType}</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">
                    권리금 {formatCurrency(listing.premiumMin)}~
                  </p>
                  {listing.currentViewers > 0 && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {listing.currentViewers}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="flex flex-col gap-4">
            {/* Search + Filter Toggle */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="지역 또는 조건으로 검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-12"
                />
              </div>

              {/* Filter Toggle Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-primary/10 border-primary' : ''}`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                상세 필터
                {(selectedPremiumRange !== 0 || selectedRentRange !== 0) && (
                  <span className="w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                    {(selectedPremiumRange !== 0 ? 1 : 0) + (selectedRentRange !== 0 ? 1 : 0)}
                  </span>
                )}
              </button>
            </div>

            {/* Region Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {regions.map((region) => (
                <button
                  key={region}
                  onClick={() => setSelectedRegion(region)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedRegion === region
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="pt-4 border-t border-border space-y-4">
                {/* Premium Range */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">권리금 범위</p>
                  <div className="flex gap-2 flex-wrap">
                    {premiumRanges.map((range, idx) => (
                      <button
                        key={range.label}
                        onClick={() => setSelectedPremiumRange(idx)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          selectedPremiumRange === idx
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rent Range */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">월세 범위</p>
                  <div className="flex gap-2 flex-wrap">
                    {rentRanges.map((range, idx) => (
                      <button
                        key={range.label}
                        onClick={() => setSelectedRentRange(idx)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          selectedRentRange === idx
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">적용된 필터:</span>
            {selectedRegion !== '전체' && (
              <button
                onClick={() => removeFilter('region')}
                className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20 transition-colors"
              >
                지역: {selectedRegion}
                <X className="w-3 h-3" />
              </button>
            )}
            {searchQuery && (
              <button
                onClick={() => removeFilter('search')}
                className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20 transition-colors"
              >
                검색: {searchQuery}
                <X className="w-3 h-3" />
              </button>
            )}
            {selectedPremiumRange !== 0 && (
              <button
                onClick={() => removeFilter('premium')}
                className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20 transition-colors"
              >
                권리금: {premiumRanges[selectedPremiumRange].label}
                <X className="w-3 h-3" />
              </button>
            )}
            {selectedRentRange !== 0 && (
              <button
                onClick={() => removeFilter('rent')}
                className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20 transition-colors"
              >
                월세: {rentRanges[selectedRentRange].label}
                <X className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 px-3 py-1 text-muted-foreground hover:text-foreground rounded-full text-sm hover:bg-secondary transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              전체 초기화
            </button>
          </div>
        )}

        {/* Results Count + Sort */}
        <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-muted-foreground">
            총 <span className="font-semibold text-primary">{filteredListings.length}</span>개의 매물
          </p>
          <div className="flex items-center gap-4">
            <p className="text-xs text-muted-foreground hidden sm:block">
              상세 정보는 상호 관심 표시 후 공개됩니다
            </p>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="px-3 py-1.5 bg-secondary text-foreground rounded-lg text-sm border-0 focus:ring-2 focus:ring-primary cursor-pointer"
            >
              {Object.entries(sortLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing, index) => (
            <div
              key={listing.id}
              className="card card-interactive overflow-hidden cursor-pointer"
              onClick={() => handleInquiry(listing)}
            >
              {/* 블러 처리된 약국 이미지 - index 기반 순차 배정 */}
              <div className="h-32 relative overflow-hidden bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30">
                <Image
                  src={pharmacyListingImages[index % pharmacyListingImages.length]}
                  alt="약국 매물"
                  fill
                  className="object-cover blur-md scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-black/10" />
                {/* 잠금 아이콘 오버레이 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-white text-xs">
                    <Lock className="w-3 h-3" />
                    <span>관심 표시 후 공개</span>
                  </div>
                </div>
                {/* 조회수 */}
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {listing.viewCount}
                </div>
              </div>

              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className={statusLabels[listing.status]?.style}>
                      {statusLabels[listing.status]?.label}
                    </span>
                    {listing.isNew && (
                      <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        NEW
                      </span>
                    )}
                    {listing.isHot && (
                      <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded flex items-center gap-1">
                        <Flame className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {listing.anonymousId}
                  </span>
                </div>

                {/* Urgency Tag */}
                {listing.urgencyTag && (
                  <div className="mb-3 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <span className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {listing.urgencyTag}
                    </span>
                  </div>
                )}

                {/* Location */}
                <div className="flex items-start gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">{listing.region}</p>
                    <p className="text-sm text-muted-foreground">
                      {listing.pharmacyType}
                      {listing.floorInfo && ` · ${listing.floorInfo}`}
                    </p>
                  </div>
                </div>

                {/* Nearby Hospitals */}
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    인근: {listing.nearbyHospitals.slice(0, 3).join(', ')}
                  </span>
                </div>

                {/* Competition Level */}
                <div className={`mb-4 px-3 py-1.5 rounded-lg text-xs font-medium ${competitionLabels[listing.competitionLevel].style}`}>
                  {competitionLabels[listing.competitionLevel].label} · {listing.interestCount}명 관심
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">예상 월매출</p>
                    <p className="text-lg font-bold text-foreground">
                      {formatCurrency(listing.monthlyRevenueMin)}~
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">권리금</p>
                    <p className="text-lg font-bold text-foreground">
                      {formatCurrency(listing.premiumMin)}~
                    </p>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {listing.viewCount}
                    </span>
                    {listing.currentViewers > 0 && (
                      <span className="flex items-center gap-1 text-green-600">
                        <Users className="w-4 h-4" />
                        {listing.currentViewers}명 보는 중
                      </span>
                    )}
                  </div>
                  {listing.lastInterestTime && (
                    <span className="text-xs text-muted-foreground">
                      {listing.lastInterestTime} 관심
                    </span>
                  )}
                </div>
              </div>

              {/* CTA */}
              <div className="px-6 py-4 bg-secondary/50 rounded-b-xl flex items-center justify-between group-hover:bg-accent transition">
                <span className="text-sm text-muted-foreground group-hover:text-primary">상세 정보 보기</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            더 많은 매물 정보를 원하시면 문의해주세요
          </p>
          <a
            href="https://open.kakao.com/o/sMLX4Zei"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline inline-flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            카카오톡으로 문의하기
          </a>
        </div>

        {/* How it Works */}
        <div className="mt-12 card p-8">
          <h2 className="text-xl font-bold text-foreground mb-6 text-center">익명 매칭 프로세스</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: Lock, color: 'from-slate-500 to-gray-600', shadow: 'shadow-slate-500/25', title: '익명 등록', desc: '구 단위 위치와 조건만 공개\n정확한 주소는 비공개' },
              { icon: Sparkles, color: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/25', title: 'AI 매칭', desc: '조건에 맞는 약사를\n자동으로 추천' },
              { icon: Heart, color: 'from-rose-500 to-pink-500', shadow: 'shadow-rose-500/25', title: '상호 관심', desc: '양방향 관심 표시 시\n연락처 자동 공개' },
              { icon: Building2, color: 'from-blue-500 to-indigo-500', shadow: 'shadow-blue-500/25', title: '계약 진행', desc: '직접 만나서 협의\n성사 시 수수료 3~5%' },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="flex justify-center mb-3">
                  <TossIcon icon={item.icon} color={item.color} size="md" shadow={item.shadow} />
                </div>
                <h3 className="font-medium text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Inquiry Modal */}
      {showInquiryModal && selectedListing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="text-center mb-6">
              <div className="text-center mx-auto mb-4">
                <span className="text-4xl">&#x1F512;</span>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                상세 정보 확인
              </h3>
              <p className="text-muted-foreground">
                정확한 주소, 약국명, 매출 자료 등 상세 정보는<br />
                상호 관심 표시 후 공개됩니다.
              </p>
            </div>

            <div className="bg-secondary rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-sm text-muted-foreground">{selectedListing.anonymousId}</span>
                <div className="flex items-center gap-2">
                  {selectedListing.matchScore && (
                    <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 text-xs rounded">
                      매칭률 {selectedListing.matchScore}%
                    </span>
                  )}
                  {selectedListing.isHot && (
                    <Flame className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
              <h4 className="font-medium text-foreground mb-1">{selectedListing.region}</h4>
              <p className="text-sm text-muted-foreground">{selectedListing.pharmacyType}</p>
              <div className="mt-2 flex items-center gap-4 text-sm">
                <span>권리금 {formatCurrency(selectedListing.premiumMin)}~</span>
                <span>월세 {formatCurrency(selectedListing.monthlyRent)}</span>
              </div>
              {selectedListing.currentViewers > 0 && (
                <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  현재 {selectedListing.currentViewers}명이 보고 있습니다
                </p>
              )}
            </div>

            <div className="space-y-3">
              <a
                href="https://open.kakao.com/o/sMLX4Zei"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full py-3 bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E] border-0"
              >
                <MessageCircle className="w-5 h-5" />
                카카오톡으로 상담하기
              </a>
              <button
                onClick={() => setShowInquiryModal(false)}
                className="btn-secondary w-full py-3"
              >
                닫기
              </button>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-4">
              카카오톡 상담 후 상호 매칭 시 상세 정보가 공개됩니다
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
