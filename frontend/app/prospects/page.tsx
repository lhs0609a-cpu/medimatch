'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
  ArrowLeft, MapPin, Building2, TrendingUp, Bell, Download,
  ChevronRight, Filter, Search, Map, List, Star, Clock
} from 'lucide-react'
import { prospectsService } from '@/lib/api/services'
import { ProspectLocation } from '@/lib/api/client'

const typeLabels: Record<string, { label: string; color: string }> = {
  NEW_BUILD: { label: '신축', color: 'bg-blue-100 text-blue-700' },
  VACANCY: { label: '공실', color: 'bg-orange-100 text-orange-700' },
  RELOCATION: { label: '이전예정', color: 'bg-purple-100 text-purple-700' },
}

const statusLabels: Record<string, { label: string; color: string }> = {
  NEW: { label: '신규', color: 'bg-green-100 text-green-700' },
  CONTACTED: { label: '컨택중', color: 'bg-yellow-100 text-yellow-700' },
  CONVERTED: { label: '계약완료', color: 'bg-purple-100 text-purple-700' },
  CLOSED: { label: '종료', color: 'bg-gray-100 text-gray-700' },
}

export default function ProspectsPage() {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [minScore, setMinScore] = useState<number>(0)

  const { data, isLoading } = useQuery({
    queryKey: ['prospects', typeFilter, minScore],
    queryFn: () => prospectsService.getAll({
      type: typeFilter || undefined,
      min_score: minScore || undefined,
      page: 1,
      page_size: 20,
    }),
  })

  const prospects: ProspectLocation[] = data?.items || []

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return '오늘'
    if (days === 1) return '어제'
    if (days < 7) return `${days}일 전`
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  }

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
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">SalesScanner</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/alerts"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50"
            >
              <Bell className="w-4 h-4" />
              <span className="hidden md:inline">알림 설정</span>
            </Link>
            <Link
              href="/login"
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
            >
              시작하기
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 mb-8 text-white">
          <h1 className="text-3xl font-bold mb-2">개원 예정지 스캐너</h1>
          <p className="text-green-100 mb-6">
            신축 건물, 폐업 공실 등 병원 개원 가능 위치를 실시간으로 탐지합니다.<br />
            원하는 조건을 설정하면 새로운 기회가 생길 때 바로 알림을 받을 수 있습니다.
          </p>
          <div className="flex gap-4">
            <div className="bg-white/20 rounded-xl px-4 py-2">
              <div className="text-2xl font-bold">{prospects.length}</div>
              <div className="text-sm text-green-100">신규 탐지</div>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2">
              <div className="text-2xl font-bold">일 1회</div>
              <div className="text-sm text-green-100">데이터 갱신</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex-1 relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="주소 또는 지역으로 검색"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Type Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setTypeFilter(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  !typeFilter
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                전체
              </button>
              {Object.entries(typeLabels).map(([key, { label }]) => (
                <button
                  key={key}
                  onClick={() => setTypeFilter(key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    typeFilter === key
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* View Toggle */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition ${
                  viewMode === 'list' ? 'bg-white shadow-sm' : ''
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-2 rounded-md transition ${
                  viewMode === 'map' ? 'bg-white shadow-sm' : ''
                }`}
              >
                <Map className="w-4 h-4" />
              </button>
            </div>

            {/* Export */}
            <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
              <Download className="w-4 h-4" />
              내보내기
            </button>
          </div>

          {/* Score Filter */}
          <div className="mt-4 pt-4 border-t flex items-center gap-4">
            <span className="text-sm text-gray-600">최소 적합도:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-32"
            />
            <span className="text-sm font-medium">{minScore}점</span>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">개원 예정지를 탐색 중...</p>
          </div>
        ) : viewMode === 'list' ? (
          /* List View */
          <div className="space-y-4">
            {prospects.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">탐지된 개원 예정지가 없습니다</h3>
                <p className="text-gray-600">필터 조건을 조정해보세요</p>
              </div>
            ) : (
              prospects.map((prospect) => (
                <Link
                  key={prospect.id}
                  href={`/prospects/${prospect.id}`}
                  className="block bg-white rounded-xl border hover:shadow-lg transition-all"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeLabels[prospect.type].color}`}>
                          {typeLabels[prospect.type].label}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusLabels[prospect.status].color}`}>
                          {statusLabels[prospect.status].label}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(prospect.detected_at)}
                      </span>
                    </div>

                    <div className="flex items-start gap-4">
                      {/* Score */}
                      <div className="flex-shrink-0 text-center">
                        <div className={`text-3xl font-bold ${getScoreColor(prospect.clinic_fit_score || 0)}`}>
                          {prospect.clinic_fit_score || '-'}
                        </div>
                        <div className="text-xs text-gray-500">적합도</div>
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900">{prospect.address}</p>
                            {prospect.floor_info && (
                              <p className="text-sm text-gray-500">{prospect.floor_info}</p>
                            )}
                          </div>
                        </div>

                        {prospect.previous_clinic && (
                          <p className="text-sm text-gray-500 mb-2">
                            이전: {prospect.previous_clinic}
                          </p>
                        )}

                        {/* Recommended Departments */}
                        {prospect.recommended_dept && prospect.recommended_dept.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            <span className="text-xs text-gray-500">추천 진료과:</span>
                            {prospect.recommended_dept.map((dept) => (
                              <span
                                key={dept}
                                className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs"
                              >
                                {dept}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Arrow */}
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>

                    {/* Additional Info */}
                    <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">용도</span>
                        <p className="font-medium">{prospect.zoning || '-'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">면적</span>
                        <p className="font-medium">
                          {prospect.floor_area ? `${prospect.floor_area}㎡` : '-'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">예상 임대료</span>
                        <p className="font-medium">
                          {prospect.rent_estimate
                            ? `${(prospect.rent_estimate / 10000).toLocaleString()}만원`
                            : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        ) : (
          /* Map View Placeholder */
          <div className="bg-white rounded-xl border h-[600px] flex items-center justify-center">
            <div className="text-center">
              <Map className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">지도 보기는 카카오맵 API 연동 후 사용 가능합니다</p>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 bg-white rounded-2xl border p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">SalesScanner 활용 안내</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                1
              </div>
              <h3 className="font-medium text-gray-900 mb-2">실시간 탐지</h3>
              <p className="text-sm text-gray-600">
                신축 건물, 폐업 공실을 자동으로 탐지합니다
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                2
              </div>
              <h3 className="font-medium text-gray-900 mb-2">적합도 분석</h3>
              <p className="text-sm text-gray-600">
                AI가 병원 개원 적합도를 0-100점으로 평가합니다
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                3
              </div>
              <h3 className="font-medium text-gray-900 mb-2">맞춤 알림</h3>
              <p className="text-sm text-gray-600">
                원하는 조건에 맞는 새 기회를 알림으로 받으세요
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                4
              </div>
              <h3 className="font-medium text-gray-900 mb-2">내보내기</h3>
              <p className="text-sm text-gray-600">
                Excel, CSV로 내보내 CRM과 연동하세요
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
