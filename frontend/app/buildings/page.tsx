'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  Building2, MapPin, Search, Filter, ChevronRight,
  Car, Layers, DollarSign, SquareAsterisk, MessageSquare
} from 'lucide-react'
import { buildingsService } from '@/lib/api/services'

export default function BuildingsPage() {
  const [filters, setFilters] = useState({
    region_name: '',
    max_rent: '',
    preferred_tenant: '',
    has_parking: false,
    has_elevator: false,
  })
  const [showFilters, setShowFilters] = useState(false)

  const { data: buildings, isLoading } = useQuery({
    queryKey: ['buildings', filters],
    queryFn: () => buildingsService.search({
      region_name: filters.region_name || undefined,
      max_rent: filters.max_rent ? Number(filters.max_rent) : undefined,
      preferred_tenant: filters.preferred_tenant || undefined,
      has_parking: filters.has_parking || undefined,
      has_elevator: filters.has_elevator || undefined,
    }),
  })

  const formatCurrency = (value: number) => {
    if (value >= 10000) {
      return `${(value / 10000).toFixed(1)}억`
    }
    return `${value.toLocaleString()}만`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">입점 건물 찾기</h1>
                <p className="text-sm text-gray-500">건물주가 직접 등록한 입점 가능 상가</p>
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showFilters ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Filter className="w-4 h-4" />
              필터
            </button>
          </div>

          {/* Search */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={filters.region_name}
                onChange={(e) => setFilters({ ...filters, region_name: e.target.value })}
                placeholder="지역명 검색 (예: 강남구, 서초동)"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">최대 월세</label>
                  <select
                    value={filters.max_rent}
                    onChange={(e) => setFilters({ ...filters, max_rent: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">전체</option>
                    <option value="100">100만원 이하</option>
                    <option value="200">200만원 이하</option>
                    <option value="300">300만원 이하</option>
                    <option value="500">500만원 이하</option>
                    <option value="1000">1,000만원 이하</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">희망 업종</label>
                  <select
                    value={filters.preferred_tenant}
                    onChange={(e) => setFilters({ ...filters, preferred_tenant: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">전체</option>
                    <option value="내과">내과</option>
                    <option value="정형외과">정형외과</option>
                    <option value="피부과">피부과</option>
                    <option value="치과">치과</option>
                    <option value="한의원">한의원</option>
                    <option value="약국">약국</option>
                  </select>
                </div>
                <div className="flex items-end gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.has_parking}
                      onChange={(e) => setFilters({ ...filters, has_parking: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span className="text-sm">주차 가능</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.has_elevator}
                      onChange={(e) => setFilters({ ...filters, has_elevator: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded"
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
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500">건물을 검색하는 중...</p>
          </div>
        ) : buildings?.items?.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">검색 결과가 없습니다</h3>
            <p className="text-gray-500">
              필터 조건을 변경하거나 다른 지역을 검색해보세요.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buildings?.items?.map((building: any) => (
              <Link
                key={building.id}
                href={`/buildings/${building.id}`}
                className="bg-white rounded-xl border hover:border-emerald-300 hover:shadow-md transition-all overflow-hidden"
              >
                {/* Image Placeholder */}
                <div className="h-40 bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                  {building.images?.[0] ? (
                    <img
                      src={building.images[0]}
                      alt={building.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="w-12 h-12 text-emerald-300" />
                  )}
                </div>

                <div className="p-4">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {building.preferred_tenants?.slice(0, 3).map((tenant: string) => (
                      <span
                        key={tenant}
                        className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs"
                      >
                        {tenant}
                      </span>
                    ))}
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                    {building.title}
                  </h3>

                  {/* Location */}
                  <p className="text-sm text-gray-500 flex items-center gap-1 mb-3">
                    <MapPin className="w-4 h-4" />
                    {building.show_exact_address ? building.address : building.region_name}
                  </p>

                  {/* Price */}
                  <div className="flex items-center justify-between text-sm mb-3">
                    <div>
                      <span className="text-gray-500">보증금</span>
                      <span className="font-semibold text-gray-900 ml-2">
                        {building.rent_deposit ? formatCurrency(building.rent_deposit) : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">월세</span>
                      <span className="font-semibold text-gray-900 ml-2">
                        {building.rent_monthly ? formatCurrency(building.rent_monthly) : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {building.area_pyeong && (
                      <span className="flex items-center gap-1">
                        <SquareAsterisk className="w-3 h-3" />
                        {building.area_pyeong}평
                      </span>
                    )}
                    {building.has_parking && (
                      <span className="flex items-center gap-1">
                        <Car className="w-3 h-3" />
                        주차
                      </span>
                    )}
                    {building.has_elevator && (
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        엘리베이터
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {buildings?.total > 0 && (
          <div className="mt-8 flex justify-center">
            <p className="text-sm text-gray-500">
              총 {buildings.total}개의 건물
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
