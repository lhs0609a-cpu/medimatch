'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
  ArrowLeft, Pill, MapPin, Building2, TrendingUp, Heart,
  ChevronRight, Filter, Search, Eye, Users, Plus, Sparkles
} from 'lucide-react'
import { pharmacyMatchService } from '@/lib/api/services'
import { AnonymousListing, PharmacyType } from '@/lib/api/client'

const statusLabels: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: '매칭중', color: 'bg-green-100 text-green-700' },
  PAUSED: { label: '일시중지', color: 'bg-yellow-100 text-yellow-700' },
  MATCHED: { label: '매칭완료', color: 'bg-purple-100 text-purple-700' },
  EXPIRED: { label: '만료', color: 'bg-gray-100 text-gray-700' },
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Pill className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">PharmMatch</span>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">익명 매칭</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/pharmacy-match/profile"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm"
            >
              내 프로필
            </Link>
            <Link
              href="/pharmacy-match/matches"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm"
            >
              매칭 현황
            </Link>
            <Link
              href="/pharmacy-match/listings/new"
              className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              매물 등록
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">익명 약국 매칭</h1>
            <p className="text-purple-100 mb-6">
              신원 노출 없이 약국 매물을 등록하고<br />
              조건에 맞는 약사를 AI가 자동으로 매칭해드립니다.
            </p>
            <div className="flex gap-4 flex-wrap">
              <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-2">
                <div className="text-2xl font-bold">{data?.total || 0}</div>
                <div className="text-sm text-purple-100">활성 매물</div>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-2">
                <div className="text-2xl font-bold">100%</div>
                <div className="text-sm text-purple-100">익명 보장</div>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-2">
                <div className="text-2xl font-bold">3~5%</div>
                <div className="text-sm text-purple-100">성사 시 수수료</div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        {recommendations?.recommendations && recommendations.recommendations.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <h2 className="font-bold text-gray-900">AI 추천 매물</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {recommendations.recommendations.slice(0, 3).map((rec, idx) => (
                <Link
                  key={idx}
                  href={rec.listing ? `/pharmacy-match/listings/${rec.listing.id}` : '#'}
                  className="flex-shrink-0 w-64 bg-white rounded-lg border p-4 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-amber-700">
                      매칭률 {rec.match_score.toFixed(0)}%
                    </span>
                    <Heart className="w-4 h-4 text-gray-300 hover:text-pink-500" />
                  </div>
                  <p className="font-medium text-gray-900 mb-1">
                    {rec.listing?.region_name || '알 수 없음'}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    {rec.recommendation_reason}
                  </p>
                  {rec.listing?.premium_min && (
                    <p className="text-sm text-purple-600 font-medium">
                      권리금 {formatCurrency(rec.listing.premium_min)} ~
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="지역 또는 조건으로 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Region Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {regions.map((region) => (
                <button
                  key={region}
                  onClick={() => setSelectedRegion(region)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                    selectedRegion === region
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
            <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">매물을 불러오는 중...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border">
            <Pill className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 매물이 없습니다</h3>
            <p className="text-gray-600 mb-4">첫 번째 매물을 등록해보세요</p>
            <Link
              href="/pharmacy-match/listings/new"
              className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
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
                className="bg-white rounded-2xl border hover:shadow-lg transition-all group"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusLabels[listing.status]?.color || 'bg-gray-100 text-gray-700'}`}>
                      {statusLabels[listing.status]?.label || listing.status}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">
                      {listing.anonymous_id}
                    </span>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-purple-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{listing.region_name}</p>
                      <p className="text-sm text-gray-500">
                        {pharmacyTypeLabels[listing.pharmacy_type]}
                        {listing.floor_info && ` · ${listing.floor_info}`}
                      </p>
                    </div>
                  </div>

                  {/* Nearby Hospitals */}
                  {listing.nearby_hospital_types.length > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        인근: {listing.nearby_hospital_types.slice(0, 3).join(', ')}
                      </span>
                    </div>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-xs text-gray-500">예상 월매출</p>
                      <p className="text-lg font-bold text-gray-900">
                        {listing.monthly_revenue_min && listing.monthly_revenue_max
                          ? `${(listing.monthly_revenue_min / 10000).toFixed(0)}~${(listing.monthly_revenue_max / 10000).toFixed(0)}만`
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">권리금</p>
                      <p className="text-lg font-bold text-purple-600">
                        {listing.premium_min && listing.premium_max
                          ? `${formatCurrency(listing.premium_min)}~`
                          : '-'}
                      </p>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4 text-gray-500">
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
                      <span className="text-gray-500">
                        {transferReasonLabels[listing.transfer_reason]}
                      </span>
                    )}
                  </div>
                </div>

                {/* CTA */}
                <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex items-center justify-between group-hover:bg-purple-50 transition">
                  <span className="text-sm text-gray-600 group-hover:text-purple-700">상세 정보 보기</span>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* How it Works */}
        <div className="mt-12 bg-white rounded-2xl border p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">익명 매칭 프로세스</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                1
              </div>
              <h3 className="font-medium text-gray-900 mb-2">익명 등록</h3>
              <p className="text-sm text-gray-600">
                구 단위 위치와 조건만 공개<br />
                정확한 주소는 비공개
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                2
              </div>
              <h3 className="font-medium text-gray-900 mb-2">AI 매칭</h3>
              <p className="text-sm text-gray-600">
                조건에 맞는 약사를<br />
                자동으로 추천
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                3
              </div>
              <h3 className="font-medium text-gray-900 mb-2">상호 관심</h3>
              <p className="text-sm text-gray-600">
                양방향 관심 표시 시<br />
                연락처 자동 공개
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                4
              </div>
              <h3 className="font-medium text-gray-900 mb-2">계약 진행</h3>
              <p className="text-sm text-gray-600">
                직접 만나서 협의<br />
                성사 시 수수료 3~5%
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
