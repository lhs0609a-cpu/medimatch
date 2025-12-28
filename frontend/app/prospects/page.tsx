'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  ArrowLeft, MapPin, Building2, Bell, Download,
  ChevronRight, Search, Map, List, Clock, LogIn, Lock
} from 'lucide-react'
import { prospectsService } from '@/lib/api/services'
import { ProspectLocation } from '@/lib/api/client'

interface MarkerData {
  id: string | number;
  lat: number;
  lng: number;
  title: string;
  type: 'hospital' | 'prospect' | 'pharmacy' | 'default' | 'closed_hospital' | 'listing';
  info?: {
    address?: string;
    score?: number;
    specialty?: string;
  };
}

// SSR 비활성화
const KakaoMap = dynamic(() => import('@/components/map/KakaoMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[600px] bg-secondary flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-foreground border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-muted-foreground">지도를 불러오는 중...</p>
      </div>
    </div>
  ),
})

const typeLabels: Record<string, { label: string; style: string }> = {
  NEW_BUILD: { label: '신축', style: 'badge-info' },
  VACANCY: { label: '공실', style: 'badge-warning' },
  RELOCATION: { label: '이전예정', style: 'badge-default' },
}

const statusLabels: Record<string, { label: string; style: string }> = {
  NEW: { label: '신규', style: 'badge-success' },
  CONTACTED: { label: '컨택중', style: 'badge-warning' },
  CONVERTED: { label: '계약완료', style: 'badge-default' },
  CLOSED: { label: '종료', style: 'badge-default' },
}

export default function ProspectsPage() {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [minScore, setMinScore] = useState<number>(0)
  const [selectedProspect, setSelectedProspect] = useState<ProspectLocation | null>(null)
  const [mapCenter, setMapCenter] = useState({ lat: 37.5665, lng: 126.978 })

  const { data, isLoading, error } = useQuery({
    queryKey: ['prospects', typeFilter, minScore],
    queryFn: () => prospectsService.getAll({
      type: typeFilter || undefined,
      min_score: minScore || undefined,
      page: 1,
      page_size: 20,
    }),
    retry: false,
  })

  // 인증 필요 여부 확인
  const isAuthRequired = error && (error as any)?.response?.status === 403

  const prospects: ProspectLocation[] = data?.items || []

  // prospects를 마커 데이터로 변환
  const mapMarkers: MarkerData[] = useMemo(() => {
    return prospects
      .filter(p => p.latitude && p.longitude)
      .map(p => ({
        id: p.id,
        lat: p.latitude,
        lng: p.longitude,
        title: p.address,
        type: 'prospect' as const,
        info: {
          address: p.address,
          score: p.clinic_fit_score || 0,
          specialty: p.recommended_dept?.join(', '),
        },
      }))
  }, [prospects])

  const handleMarkerClick = (marker: MarkerData) => {
    const prospect = prospects.find(p => p.id === marker.id)
    if (prospect) {
      setSelectedProspect(prospect)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-amber-600'
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
                  <MapPin className="w-4 h-4 text-background" />
                </div>
                <span className="text-lg font-semibold text-foreground">SalesScanner</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/alerts"
                className="btn-ghost"
              >
                <Bell className="w-4 h-4" />
                <span className="hidden md:inline">알림 설정</span>
              </Link>
              <Link
                href="/login"
                className="btn-primary"
              >
                시작하기
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero Section */}
        <div className="bg-foreground text-background rounded-2xl p-8 mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold mb-2">개원 예정지 스캐너</h1>
          <p className="text-background/70 mb-6">
            신축 건물, 폐업 공실 등 병원 개원 가능 위치를 실시간으로 탐지합니다.<br />
            원하는 조건을 설정하면 새로운 기회가 생길 때 바로 알림을 받을 수 있습니다.
          </p>
          <div className="flex gap-4">
            <div className="bg-background/10 rounded-xl px-4 py-3">
              <div className="text-2xl font-bold">{prospects.length}</div>
              <div className="text-sm text-background/70">신규 탐지</div>
            </div>
            <div className="bg-background/10 rounded-xl px-4 py-3">
              <div className="text-2xl font-bold">일 1회</div>
              <div className="text-sm text-background/70">데이터 갱신</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex-1 relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="주소 또는 지역으로 검색"
                className="input pl-12"
              />
            </div>

            {/* Type Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setTypeFilter(null)}
                className={`btn-sm ${!typeFilter ? 'btn-primary' : 'btn-secondary'}`}
              >
                전체
              </button>
              {Object.entries(typeLabels).map(([key, { label }]) => (
                <button
                  key={key}
                  onClick={() => setTypeFilter(key)}
                  className={`btn-sm ${typeFilter === key ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* View Toggle */}
            <div className="flex gap-1 bg-secondary rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition ${
                  viewMode === 'list' ? 'bg-background shadow-sm' : ''
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-2 rounded-md transition ${
                  viewMode === 'map' ? 'bg-background shadow-sm' : ''
                }`}
              >
                <Map className="w-4 h-4" />
              </button>
            </div>

            {/* Export */}
            <button className="btn-outline btn-sm">
              <Download className="w-4 h-4" />
              내보내기
            </button>
          </div>

          {/* Score Filter */}
          <div className="mt-4 pt-4 border-t border-border flex items-center gap-4">
            <span className="text-sm text-muted-foreground">최소 적합도:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-32 accent-foreground"
            />
            <span className="text-sm font-medium">{minScore}점</span>
          </div>
        </div>

        {/* Results */}
        {isAuthRequired ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">로그인이 필요합니다</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              개원 예정지 스캐너는 로그인한 사용자만 이용할 수 있습니다.<br />
              로그인 후 실시간 개원 예정지 정보를 확인하세요.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/login" className="btn-primary">
                <LogIn className="w-4 h-4" />
                로그인
              </Link>
              <Link href="/register" className="btn-secondary">
                회원가입
              </Link>
            </div>
          </div>
        ) : isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-foreground border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">개원 예정지를 탐색 중...</p>
          </div>
        ) : viewMode === 'list' ? (
          /* List View */
          <div className="space-y-4">
            {prospects.length === 0 ? (
              <div className="text-center py-12 card">
                <MapPin className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">탐지된 개원 예정지가 없습니다</h3>
                <p className="text-muted-foreground">필터 조건을 조정해보세요</p>
              </div>
            ) : (
              prospects.map((prospect) => (
                <Link
                  key={prospect.id}
                  href={`/prospects/${prospect.id}`}
                  className="block card card-interactive"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex gap-2">
                        <span className={typeLabels[prospect.type].style}>
                          {typeLabels[prospect.type].label}
                        </span>
                        <span className={statusLabels[prospect.status].style}>
                          {statusLabels[prospect.status].label}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
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
                        <div className="text-xs text-muted-foreground">적합도</div>
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium text-foreground">{prospect.address}</p>
                            {prospect.floor_info && (
                              <p className="text-sm text-muted-foreground">{prospect.floor_info}</p>
                            )}
                          </div>
                        </div>

                        {prospect.previous_clinic && (
                          <p className="text-sm text-muted-foreground mb-2">
                            이전: {prospect.previous_clinic}
                          </p>
                        )}

                        {/* Recommended Departments */}
                        {prospect.recommended_dept && prospect.recommended_dept.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            <span className="text-xs text-muted-foreground">추천 진료과:</span>
                            {prospect.recommended_dept.map((dept) => (
                              <span
                                key={dept}
                                className="badge-default"
                              >
                                {dept}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Arrow */}
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>

                    {/* Additional Info */}
                    <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">용도</span>
                        <p className="font-medium">{prospect.zoning || '-'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">면적</span>
                        <p className="font-medium">
                          {prospect.floor_area ? `${prospect.floor_area}㎡` : '-'}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">예상 임대료</span>
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
          /* Map View */
          <div className="card h-[600px] overflow-hidden relative">
            <KakaoMap
              center={mapCenter}
              level={6}
              markers={mapMarkers}
              onMarkerClick={handleMarkerClick}
              showCurrentLocation
              className="w-full h-full"
            />

            {/* Selected Prospect Info */}
            {selectedProspect && (
              <div className="absolute bottom-4 left-4 right-4 card p-4 max-w-md shadow-xl">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex gap-2">
                    <span className={typeLabels[selectedProspect.type].style}>
                      {typeLabels[selectedProspect.type].label}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedProspect(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                </div>
                <p className="font-medium text-foreground mb-1">{selectedProspect.address}</p>
                <p className="text-sm text-muted-foreground mb-3">
                  적합도: <span className={getScoreColor(selectedProspect.clinic_fit_score || 0)}>
                    {selectedProspect.clinic_fit_score || '-'}점
                  </span>
                </p>
                <Link
                  href={`/prospects/${selectedProspect.id}`}
                  className="btn-primary w-full justify-center"
                >
                  상세보기
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 card p-8">
          <h2 className="text-xl font-semibold text-foreground mb-6">SalesScanner 활용 안내</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', title: '실시간 탐지', desc: '신축 건물, 폐업 공실을 자동으로 탐지합니다' },
              { step: '2', title: '적합도 분석', desc: 'AI가 병원 개원 적합도를 0-100점으로 평가합니다' },
              { step: '3', title: '맞춤 알림', desc: '원하는 조건에 맞는 새 기회를 알림으로 받으세요' },
              { step: '4', title: '내보내기', desc: 'Excel, CSV로 내보내 CRM과 연동하세요' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-secondary text-foreground rounded-xl flex items-center justify-center mx-auto mb-3 font-bold">
                  {item.step}
                </div>
                <h3 className="font-medium text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">
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
