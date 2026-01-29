'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
  Building2, MapPin, Search, Filter, Eye, MessageSquare,
  Car, Layers, CheckCircle, Lock, TrendingUp, Phone, ArrowLeft,
  Flame, Clock, Users, Zap, Bell, X, ArrowUpDown, ChevronDown
} from 'lucide-react'
import Image from 'next/image'
import { generateBuildingListings, generateActivityFeed, platformStats, type BuildingListing } from '@/lib/data/seedListings'
import { buildingListingImages } from '@/components/BlurredListingImage'

// 시드 데이터 생성 (클라이언트에서 한 번만)
const allListings = generateBuildingListings(120)
const activityFeed = generateActivityFeed(20)

type SortOption = 'latest' | 'popular' | 'priceAsc' | 'priceDesc' | 'inquiry'

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
  { value: 'priceAsc', label: '월세 낮은순' },
  { value: 'priceDesc', label: '월세 높은순' },
  { value: 'inquiry', label: '문의 많은순' },
]

export default function BuildingsPage() {
  const [filters, setFilters] = useState({
    region: '',
    maxRent: '',
    preferredTenant: '',
    hasParking: false,
    hasElevator: false,
  })
  const [sortBy, setSortBy] = useState<SortOption>('latest')
  const [showFilters, setShowFilters] = useState(false)
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [showInquiryModal, setShowInquiryModal] = useState(false)
  const [selectedListing, setSelectedListing] = useState<BuildingListing | null>(null)
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0)

  // 적용된 필터 개수 계산
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.region) count++
    if (filters.maxRent) count++
    if (filters.preferredTenant) count++
    if (filters.hasParking) count++
    if (filters.hasElevator) count++
    return count
  }, [filters])

  // 필터 초기화
  const resetFilters = () => {
    setFilters({
      region: '',
      maxRent: '',
      preferredTenant: '',
      hasParking: false,
      hasElevator: false,
    })
  }

  // 개별 필터 제거
  const removeFilter = (key: keyof typeof filters) => {
    setFilters(prev => ({
      ...prev,
      [key]: typeof prev[key] === 'boolean' ? false : '',
    }))
  }

  // 실시간 활동 피드 롤링
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentActivityIndex((prev) => (prev + 1) % activityFeed.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // 필터링 및 정렬된 매물
  const filteredListings = useMemo(() => {
    let result = allListings.filter(listing => {
      if (filters.region && !listing.region.includes(filters.region) && !listing.address.includes(filters.region)) {
        return false
      }
      if (filters.maxRent && listing.monthlyRent > Number(filters.maxRent)) {
        return false
      }
      if (filters.preferredTenant && !listing.preferredTenants.includes(filters.preferredTenant)) {
        return false
      }
      if (filters.hasParking && !listing.hasParking) {
        return false
      }
      if (filters.hasElevator && !listing.hasElevator) {
        return false
      }
      return true
    })

    // 정렬 적용
    switch (sortBy) {
      case 'popular':
        result = [...result].sort((a, b) => b.viewCount - a.viewCount)
        break
      case 'priceAsc':
        result = [...result].sort((a, b) => a.monthlyRent - b.monthlyRent)
        break
      case 'priceDesc':
        result = [...result].sort((a, b) => b.monthlyRent - a.monthlyRent)
        break
      case 'inquiry':
        result = [...result].sort((a, b) => b.inquiryCount - a.inquiryCount)
        break
      case 'latest':
      default:
        // 기본값: ID 기준 (최신순 가정)
        result = [...result].sort((a, b) => b.id.localeCompare(a.id))
        break
    }

    return result
  }, [filters, sortBy])

  const formatCurrency = (value: number) => {
    if (value >= 10000) {
      return `${(value / 10000).toFixed(1)}억`
    }
    return `${value.toLocaleString()}만`
  }

  const handleInquiry = (listing: BuildingListing) => {
    setSelectedListing(listing)
    setShowInquiryModal(true)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">병원/약국 매물</h1>
                <p className="text-sm text-muted-foreground">검증된 입점 가능 상가 {platformStats.totalListings}+개</p>
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showFilters ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'
              }`}
            >
              <Filter className="w-4 h-4" />
              필터
            </button>
          </div>

          {/* Live Activity Banner */}
          <div className="mt-4 bg-gradient-to-r from-blue-600/10 to-cyan-600/10 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-muted-foreground">실시간</span>
              <span className="text-foreground font-medium animate-fade-in">
                {activityFeed[currentActivityIndex]?.region && `${activityFeed[currentActivityIndex].region}에서 `}
                {activityFeed[currentActivityIndex]?.message}
              </span>
              <span className="text-muted-foreground text-xs ml-auto">{activityFeed[currentActivityIndex]?.timeAgo}</span>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-4 flex items-center gap-4 text-sm flex-wrap">
            <span className="flex items-center gap-1 text-primary">
              <TrendingUp className="w-4 h-4" />
              오늘 신규 {platformStats.todayNewListings}건
            </span>
            <span className="text-muted-foreground">|</span>
            <span className="text-muted-foreground">
              이번 주 문의 {platformStats.weeklyInquiries}건
            </span>
            <span className="text-muted-foreground">|</span>
            <span className="flex items-center gap-1 text-green-600">
              <Users className="w-4 h-4" />
              현재 접속 {platformStats.onlineNow}명
            </span>
          </div>

          {/* Search */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={filters.region}
                onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                placeholder="지역명 검색 (예: 강남구, 서초동, 분당)"
                className="input pl-12"
              />
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-secondary/50 rounded-lg space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="label mb-2 block">최대 월세</label>
                  <select
                    value={filters.maxRent}
                    onChange={(e) => setFilters({ ...filters, maxRent: e.target.value })}
                    className="select"
                  >
                    <option value="">전체</option>
                    <option value="200">200만원 이하</option>
                    <option value="300">300만원 이하</option>
                    <option value="500">500만원 이하</option>
                    <option value="800">800만원 이하</option>
                  </select>
                </div>
                <div>
                  <label className="label mb-2 block">희망 업종</label>
                  <select
                    value={filters.preferredTenant}
                    onChange={(e) => setFilters({ ...filters, preferredTenant: e.target.value })}
                    className="select"
                  >
                    <option value="">전체</option>
                    <option value="내과">내과</option>
                    <option value="정형외과">정형외과</option>
                    <option value="피부과">피부과</option>
                    <option value="치과">치과</option>
                    <option value="한의원">한의원</option>
                    <option value="안과">안과</option>
                    <option value="이비인후과">이비인후과</option>
                  </select>
                </div>
                <div className="flex items-end gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.hasParking}
                      onChange={(e) => setFilters({ ...filters, hasParking: e.target.checked })}
                      className="w-4 h-4 text-primary rounded accent-primary"
                    />
                    <span className="text-sm">주차 가능</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.hasElevator}
                      onChange={(e) => setFilters({ ...filters, hasElevator: e.target.checked })}
                      className="w-4 h-4 text-primary rounded accent-primary"
                    />
                    <span className="text-sm">엘리베이터</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Active Filter Chips */}
        {activeFilterCount > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">적용된 필터:</span>
            {filters.region && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                지역: {filters.region}
                <button onClick={() => removeFilter('region')} className="hover:bg-primary/20 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.maxRent && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                월세 {filters.maxRent}만원 이하
                <button onClick={() => removeFilter('maxRent')} className="hover:bg-primary/20 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.preferredTenant && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                {filters.preferredTenant}
                <button onClick={() => removeFilter('preferredTenant')} className="hover:bg-primary/20 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.hasParking && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                주차 가능
                <button onClick={() => removeFilter('hasParking')} className="hover:bg-primary/20 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.hasElevator && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                엘리베이터
                <button onClick={() => removeFilter('hasElevator')} className="hover:bg-primary/20 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={resetFilters}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              전체 초기화
            </button>
          </div>
        )}

        {/* Results Count & Sort */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            총 <span className="font-semibold text-primary">{filteredListings.length}</span>개의 매물
          </p>
          <div className="flex items-center gap-3">
            <p className="text-xs text-muted-foreground hidden sm:block">
              상세 정보 확인은 문의 후 가능합니다
            </p>
            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-2 px-3 py-1.5 bg-secondary text-sm rounded-lg hover:bg-secondary/80 transition-colors"
              >
                <ArrowUpDown className="w-4 h-4" />
                {sortOptions.find(o => o.value === sortBy)?.label}
                <ChevronDown className={`w-4 h-4 transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
              </button>
              {showSortMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowSortMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-40 bg-card border border-border rounded-lg shadow-lg z-20 py-1">
                    {sortOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value)
                          setShowSortMenu(false)
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors ${
                          sortBy === option.value ? 'text-primary font-medium' : 'text-foreground'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredListings.map((listing, index) => (
            <div
              key={listing.id}
              className="card card-interactive overflow-hidden"
            >
              {/* Image - 블러 처리된 실제 건물 사진 */}
              <div className="h-40 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 relative overflow-hidden">
                {/* 실제 건물 이미지 (블러 처리) - thumbnailIndex 기반 배정 */}
                <Image
                  src={buildingListingImages[listing.thumbnailIndex % buildingListingImages.length]}
                  alt={listing.title}
                  fill
                  className="object-cover blur-md scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                {/* 블러 오버레이 */}
                <div className="absolute inset-0 bg-black/10" />

                {/* Badge Stack - Top Left */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {listing.isNew && (
                    <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-medium rounded flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      NEW
                    </span>
                  )}
                  {listing.isHot && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded flex items-center gap-1">
                      <Flame className="w-3 h-3" />
                      인기
                    </span>
                  )}
                  {listing.status === 'RESERVED' && (
                    <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-medium rounded">
                      예약중
                    </span>
                  )}
                  {listing.urgencyTag && (
                    <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-medium rounded">
                      {listing.urgencyTag}
                    </span>
                  )}
                </div>

                {/* Top Right Badges */}
                <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                  {listing.isVerified && (
                    <span className="badge-success flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      인증
                    </span>
                  )}
                </div>

                {/* Bottom Stats */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  {listing.currentViewers > 0 && (
                    <span className="px-2 py-1 bg-black/60 text-white text-xs rounded flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {listing.currentViewers}명 보는 중
                    </span>
                  )}
                  <span className="px-2 py-1 bg-black/50 text-white text-xs rounded flex items-center gap-1 ml-auto">
                    <Eye className="w-3 h-3" />
                    {listing.viewCount}
                  </span>
                </div>
              </div>

              <div className="p-4">
                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {listing.preferredTenants.slice(0, 3).map((tenant) => (
                    <span
                      key={tenant}
                      className="badge-info"
                    >
                      {tenant}
                    </span>
                  ))}
                  {listing.preferredTenants.length > 3 && (
                    <span className="badge-default">
                      +{listing.preferredTenants.length - 3}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="font-semibold text-foreground mb-1 line-clamp-1">
                  {listing.title}
                </h3>

                {/* Location - Blurred */}
                <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                  <MapPin className="w-4 h-4" />
                  {listing.region}
                  <span className="text-muted-foreground/30 blur-[3px] select-none ml-1">상세주소</span>
                </p>

                {/* Last Inquiry - 있을 때만 표시 */}
                {listing.lastInquiryTime && (
                  <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {listing.lastInquiryTime} 문의
                  </p>
                )}

                {/* Price - Partially Visible */}
                <div className="flex items-center justify-between text-sm mb-3">
                  <div>
                    <span className="text-muted-foreground">보증금</span>
                    <span className="font-semibold text-foreground ml-2">
                      {formatCurrency(listing.deposit)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">월세</span>
                    <span className="font-semibold text-foreground ml-2">
                      {formatCurrency(listing.monthlyRent)}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    {listing.floor}
                  </span>
                  <span>{listing.areaPyeong}평</span>
                  {listing.hasParking && (
                    <span className="flex items-center gap-1">
                      <Car className="w-3 h-3" />
                      주차
                    </span>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleInquiry(listing)}
                  className="btn-primary w-full"
                >
                  <MessageSquare className="w-4 h-4" />
                  상세 정보 문의
                </button>

                {/* Inquiry Count */}
                <p className="text-center text-xs text-muted-foreground mt-2">
                  {listing.inquiryCount}명이 문의함
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Indicator */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            더 많은 매물을 보시려면 회원가입 후 이용해주세요
          </p>
          <button className="btn-outline">
            회원가입하고 전체 매물 보기
          </button>
        </div>
      </main>

      {/* Inquiry Modal */}
      {showInquiryModal && selectedListing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                상세 정보 확인
              </h3>
              <p className="text-muted-foreground">
                정확한 주소, 건물주 연락처 등 상세 정보는<br />
                문의 접수 후 확인하실 수 있습니다.
              </p>
            </div>

            <div className="bg-secondary rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                {selectedListing.isHot && (
                  <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 text-xs rounded flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    인기 매물
                  </span>
                )}
                {selectedListing.currentViewers > 0 && (
                  <span className="text-xs text-green-600">
                    현재 {selectedListing.currentViewers}명 보는 중
                  </span>
                )}
              </div>
              <h4 className="font-medium text-foreground mb-2">{selectedListing.title}</h4>
              <p className="text-sm text-muted-foreground">{selectedListing.region}</p>
              <div className="mt-2 flex items-center gap-4 text-sm">
                <span>보증금 {formatCurrency(selectedListing.deposit)}</span>
                <span>월세 {formatCurrency(selectedListing.monthlyRent)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <a
                href="tel:1588-0000"
                className="btn-primary w-full py-3"
              >
                <Phone className="w-5 h-5" />
                전화 문의 (1588-0000)
              </a>
              <button
                onClick={() => setShowInquiryModal(false)}
                className="btn-secondary w-full py-3"
              >
                닫기
              </button>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-4">
              평일 09:00 - 18:00 상담 가능
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
