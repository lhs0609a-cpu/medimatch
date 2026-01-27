'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Heart, MapPin, Building2, TrendingUp,
  Trash2, ExternalLink, Filter, Grid3X3, List, HeartOff, Lock
} from 'lucide-react'
import Image from 'next/image'
import { useAuth } from '@/lib/hooks/useAuth'
import { buildingListingImages, pharmacyListingImages } from '@/components/BlurredListingImage'

// Mock favorites data - 실제로는 API에서 가져옴
const mockFavorites = [
  {
    id: '1',
    type: 'building',
    title: '강남역 의료복합빌딩',
    address: '서울시 강남구 강남대로 123',
    price: '보증금 5억 / 월세 800만',
    area: '165㎡ (50평)',
    floor: '3층',
    createdAt: '2024-01-15',
    imageUrl: null,
  },
  {
    id: '2',
    type: 'pharmacy',
    title: '송파구 약국 매물',
    address: '서울시 송파구 올림픽로 456',
    price: '권리금 2억 5천',
    monthlyRevenue: '월매출 8,000만',
    createdAt: '2024-01-14',
    imageUrl: null,
  },
  {
    id: '3',
    type: 'building',
    title: '마포구 신축 메디컬 빌딩',
    address: '서울시 마포구 양화로 789',
    price: '보증금 3억 / 월세 500만',
    area: '132㎡ (40평)',
    floor: '2층',
    createdAt: '2024-01-13',
    imageUrl: null,
  },
]

type ViewMode = 'grid' | 'list'
type FilterType = 'all' | 'building' | 'pharmacy'

export default function FavoritesPage() {
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [filterType, setFilterType] = useState<FilterType>('all')

  // TODO: Replace with actual API call
  const { data: favorites = mockFavorites, isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => mockFavorites,
    enabled: isAuthenticated,
  })

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      // TODO: API call to remove favorite
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })

  const filteredFavorites = useMemo(() => {
    if (filterType === 'all') return favorites
    return favorites.filter(f => f.type === filterType)
  }, [favorites, filterType])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-6">찜 목록을 보려면 로그인이 필요합니다</p>
          <Link href="/login" className="btn-primary">
            로그인하기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/mypage" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                <span className="font-semibold text-foreground">찜한 매물</span>
                <span className="text-sm text-muted-foreground">({filteredFavorites.length})</span>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'
                }`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { value: 'all', label: '전체' },
            { value: 'building', label: '건물/임대' },
            { value: 'pharmacy', label: '약국 매물' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilterType(tab.value as FilterType)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filterType === tab.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          </div>
        ) : filteredFavorites.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <HeartOff className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">찜한 매물이 없습니다</h3>
            <p className="text-muted-foreground mb-6">
              관심있는 매물을 찜하면 이곳에서 확인할 수 있습니다
            </p>
            <Link href="/buildings" className="btn-primary">
              매물 둘러보기
            </Link>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFavorites.map((item) => (
              <div key={item.id} className="card overflow-hidden group">
                {/* 블러 처리된 실제 이미지 */}
                <div className="aspect-video bg-secondary relative overflow-hidden">
                  <Image
                    src={item.type === 'building'
                      ? buildingListingImages[parseInt(item.id) % buildingListingImages.length]
                      : pharmacyListingImages[parseInt(item.id) % pharmacyListingImages.length]
                    }
                    alt={item.title}
                    fill
                    className="object-cover blur-md scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-black/10" />
                  {/* 잠금 아이콘 오버레이 */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-white text-xs">
                      <Lock className="w-3 h-3" />
                      <span>문의 후 공개</span>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  {/* Type Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      item.type === 'building'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      {item.type === 'building' ? '건물/임대' : '약국 매물'}
                    </span>
                    <button
                      onClick={() => removeMutation.mutate(item.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-foreground mb-1 line-clamp-1">{item.title}</h3>

                  {/* Address */}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                    <MapPin className="w-4 h-4" />
                    <span className="line-clamp-1">{item.address}</span>
                  </div>

                  {/* Price */}
                  <p className="text-primary font-bold">{item.price}</p>

                  {/* Details */}
                  <div className="mt-2 text-sm text-muted-foreground">
                    {item.type === 'building' ? (
                      <span>{item.area} · {item.floor}</span>
                    ) : (
                      <span>{item.monthlyRevenue}</span>
                    )}
                  </div>

                  {/* Action */}
                  <Link
                    href={item.type === 'building' ? `/buildings/${item.id}` : `/pharmacy-match/listings/${item.id}`}
                    className="mt-4 btn-secondary w-full text-center text-sm"
                  >
                    상세 보기
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-4">
            {filteredFavorites.map((item) => (
              <div key={item.id} className="card p-4 flex gap-4">
                {/* 블러 처리된 썸네일 */}
                <div className="w-24 h-24 bg-secondary rounded-lg flex-shrink-0 relative overflow-hidden">
                  <Image
                    src={item.type === 'building'
                      ? buildingListingImages[parseInt(item.id) % buildingListingImages.length]
                      : pharmacyListingImages[parseInt(item.id) % pharmacyListingImages.length]
                    }
                    alt={item.title}
                    fill
                    className="object-cover blur-md scale-110"
                    sizes="96px"
                  />
                  <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-white/80" />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-1 ${
                        item.type === 'building'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {item.type === 'building' ? '건물/임대' : '약국 매물'}
                      </span>
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                    </div>
                    <button
                      onClick={() => removeMutation.mutate(item.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="w-4 h-4" />
                    <span className="line-clamp-1">{item.address}</span>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <p className="text-primary font-bold">{item.price}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.type === 'building' ? `${item.area} · ${item.floor}` : item.monthlyRevenue}
                      </p>
                    </div>
                    <Link
                      href={item.type === 'building' ? `/buildings/${item.id}` : `/pharmacy-match/listings/${item.id}`}
                      className="btn-secondary text-sm"
                    >
                      상세 보기
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Note */}
        {filteredFavorites.length > 0 && (
          <p className="text-center text-sm text-muted-foreground mt-8">
            찜한 날짜 기준으로 정렬됩니다
          </p>
        )}
      </main>
    </div>
  )
}
