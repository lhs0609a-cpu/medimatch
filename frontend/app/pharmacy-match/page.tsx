'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
  ArrowLeft, Pill, MapPin, Building2, Heart,
  ChevronRight, Search, Eye, Plus, Sparkles
} from 'lucide-react'
import { pharmacyMatchService } from '@/lib/api/services'
import { AnonymousListing, PharmacyType } from '@/lib/api/client'

const statusLabels: Record<string, { label: string; style: string }> = {
  ACTIVE: { label: '매칭중', style: 'badge-success' },
  PAUSED: { label: '일시중지', style: 'badge-warning' },
  MATCHED: { label: '매칭완료', style: 'badge-default' },
  EXPIRED: { label: '만료', style: 'badge-default' },
}

const pharmacyTypeLabels: Record<PharmacyType, string> = {
  GENERAL: '일반약국',
  DISPENSING: '조제전문',
  ORIENTAL: '한약국',
  HOSPITAL: '병원약국',
}

const transferReasonLabels: Record<string, string> = {
  RETIREMENT: '은퇴',
  RELOCATION: '이전',
  HEALTH: '건강상의 이유',
  CAREER_CHANGE: '직업 변경',
  FAMILY: '가정사',
  OTHER: '기타',
}

const regions = [
  '전체', '서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종'
]

export default function PharmacyMatchPage() {
  const [selectedRegion, setSelectedRegion] = useState('전체')
  const [searchQuery, setSearchQuery] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['pharmacy-match-listings', selectedRegion],
    queryFn: () => pharmacyMatchService.getListings({
      region_codes: selectedRegion === '전체' ? undefined : [selectedRegion],
      page: 1,
      page_size: 20,
    }),
  })

  const { data: recommendations } = useQuery({
    queryKey: ['pharmacy-match-recommendations'],
    queryFn: () => pharmacyMatchService.getRecommendations(5),
  })

  const formatCurrency = (value: number) => {
    if (value >= 10000) {
      return `${(value / 10000).toFixed(1)}억원`
    }
    return `${value.toLocaleString()}만원`
  }

  const listings: AnonymousListing[] = data?.items || []

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
                  <Pill className="w-4 h-4 text-background" />
                </div>
                <span className="text-lg font-semibold text-foreground">PharmMatch</span>
                <span className="badge-default">익명 매칭</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/pharmacy-match/profile"
                className="btn-ghost hidden md:flex"
              >
                내 프로필
              </Link>
              <Link
                href="/pharmacy-match/matches"
                className="btn-ghost hidden md:flex"
              >
                매칭 현황
              </Link>
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
        <div className="bg-foreground text-background rounded-2xl p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-background/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <h1 className="text-2xl md:text-3xl font-semibold mb-2">익명 약국 매칭</h1>
            <p className="text-background/70 mb-6">
              신원 노출 없이 약국 매물을 등록하고<br />
              조건에 맞는 약사를 AI가 자동으로 매칭해드립니다.
            </p>
            <div className="flex gap-4 flex-wrap">
              <div className="bg-background/10 rounded-xl px-4 py-3">
                <div className="text-2xl font-bold">{data?.total || 0}</div>
                <div className="text-sm text-background/70">활성 매물</div>
              </div>
              <div className="bg-background/10 rounded-xl px-4 py-3">
                <div className="text-2xl font-bold">100%</div>
                <div className="text-sm text-background/70">익명 보장</div>
              </div>
              <div className="bg-background/10 rounded-xl px-4 py-3">
                <div className="text-2xl font-bold">3~5%</div>
                <div className="text-sm text-background/70">성사 시 수수료</div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        {recommendations?.recommendations && recommendations.recommendations.length > 0 && (
          <div className="card p-6 mb-8 bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <h2 className="font-semibold text-foreground">AI 추천 매물</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
              {recommendations.recommendations.slice(0, 3).map((rec, idx) => (
                <Link
                  key={idx}
                  href={rec.listing ? `/pharmacy-match/listings/${rec.listing.id}` : '#'}
                  className="flex-shrink-0 w-64 card p-4 hover:shadow-md transition bg-background"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      매칭률 {rec.match_score.toFixed(0)}%
                    </span>
                    <Heart className="w-4 h-4 text-muted-foreground hover:text-red-500 transition" />
                  </div>
                  <p className="font-medium text-foreground mb-1">
                    {rec.listing?.region_name || '알 수 없음'}
                  </p>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {rec.recommendation_reason}
                  </p>
                  {rec.listing?.premium_min && (
                    <p className="text-sm text-foreground font-medium">
                      권리금 {formatCurrency(rec.listing.premium_min)} ~
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card p-4 mb-6">
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

            {/* Region Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
              {regions.map((region) => (
                <button
                  key={region}
                  onClick={() => setSelectedRegion(region)}
                  className={`btn-sm whitespace-nowrap ${
                    selectedRegion === region ? 'btn-primary' : 'btn-secondary'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-foreground border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">매물을 불러오는 중...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12 card">
            <Pill className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">등록된 매물이 없습니다</h3>
            <p className="text-muted-foreground mb-4">첫 번째 매물을 등록해보세요</p>
            <Link
              href="/pharmacy-match/listings/new"
              className="btn-primary inline-flex"
            >
              <Plus className="w-4 h-4" />
              매물 등록하기
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <Link
                key={listing.id}
                href={`/pharmacy-match/listings/${listing.id}`}
                className="card card-interactive group"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={statusLabels[listing.status]?.style || 'badge-default'}>
                      {statusLabels[listing.status]?.label || listing.status}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {listing.anonymous_id}
                    </span>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">{listing.region_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {pharmacyTypeLabels[listing.pharmacy_type]}
                        {listing.floor_info && ` · ${listing.floor_info}`}
                      </p>
                    </div>
                  </div>

                  {/* Nearby Hospitals */}
                  {listing.nearby_hospital_types.length > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        인근: {listing.nearby_hospital_types.slice(0, 3).join(', ')}
                      </span>
                    </div>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">예상 월매출</p>
                      <p className="text-lg font-bold text-foreground">
                        {listing.monthly_revenue_min && listing.monthly_revenue_max
                          ? `${(listing.monthly_revenue_min / 10000).toFixed(0)}~${(listing.monthly_revenue_max / 10000).toFixed(0)}만`
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">권리금</p>
                      <p className="text-lg font-bold text-foreground">
                        {listing.premium_min && listing.premium_max
                          ? `${formatCurrency(listing.premium_min)}~`
                          : '-'}
                      </p>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {listing.view_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {listing.interest_count}
                      </span>
                    </div>
                    {listing.transfer_reason && (
                      <span className="text-muted-foreground">
                        {transferReasonLabels[listing.transfer_reason]}
                      </span>
                    )}
                  </div>
                </div>

                {/* CTA */}
                <div className="px-6 py-4 bg-secondary/50 rounded-b-xl flex items-center justify-between group-hover:bg-secondary transition">
                  <span className="text-sm text-muted-foreground group-hover:text-foreground">상세 정보 보기</span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* How it Works */}
        <div className="mt-12 card p-8">
          <h2 className="text-xl font-semibold text-foreground mb-6 text-center">익명 매칭 프로세스</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', title: '익명 등록', desc: '구 단위 위치와 조건만 공개\n정확한 주소는 비공개' },
              { step: '2', title: 'AI 매칭', desc: '조건에 맞는 약사를\n자동으로 추천' },
              { step: '3', title: '상호 관심', desc: '양방향 관심 표시 시\n연락처 자동 공개' },
              { step: '4', title: '계약 진행', desc: '직접 만나서 협의\n성사 시 수수료 3~5%' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-secondary text-foreground rounded-xl flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                  {item.step}
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
    </div>
  )
}
