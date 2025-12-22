'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { MapSearchBox, MapFilter } from '@/components/map';
import { mapService } from '@/lib/api/services';
import { MapMarker } from '@/lib/api/client';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Building2,
  Pill,
  Target,
  Layers,
  Navigation,
  Search,
  SlidersHorizontal,
  X,
  Star,
  Zap
} from 'lucide-react';

// SSR 비활성화
const KakaoMap = dynamic(() => import('@/components/map/KakaoMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[600px] gradient-bg-soft flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <MapPin className="w-8 h-8 text-white" />
        </div>
        <p className="text-gray-500 font-medium">지도를 불러오는 중...</p>
      </div>
    </div>
  ),
});

interface MarkerData {
  id: string;
  lat: number;
  lng: number;
  title: string;
  type: 'hospital' | 'prospect' | 'pharmacy' | 'default';
  info?: {
    address?: string;
    score?: number;
    specialty?: string;
  };
}

interface FilterOptions {
  types: string[];
  minScore: number;
  maxScore: number;
  radius: number;
}

export default function MapPage() {
  const [center, setCenter] = useState({ lat: 37.5665, lng: 126.978 });
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [filteredMarkers, setFilteredMarkers] = useState<MarkerData[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [isListOpen, setIsListOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    types: ['hospital', 'prospect', 'pharmacy'],
    minScore: 0,
    maxScore: 100,
    radius: 2000,
  });

  const fetchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMarkers = useCallback(async () => {
    setIsLoading(true);
    const radiusKm = filters.radius / 1000;
    const latRange = radiusKm / 111.0;
    const lngRange = radiusKm / (111.0 * Math.cos(center.lat * Math.PI / 180));

    try {
      const response = await mapService.getMarkers({
        min_lat: center.lat - latRange,
        max_lat: center.lat + latRange,
        min_lng: center.lng - lngRange,
        max_lng: center.lng + lngRange,
        types: filters.types.join(','),
        min_score: filters.minScore,
        max_score: filters.maxScore,
      });

      const convertedMarkers: MarkerData[] = response.markers.map((marker: MapMarker) => ({
        id: marker.id,
        lat: marker.lat,
        lng: marker.lng,
        title: marker.title,
        type: marker.type as 'hospital' | 'prospect' | 'pharmacy' | 'default',
        info: {
          address: marker.info?.address,
          score: marker.info?.score,
          specialty: marker.info?.specialty,
        },
      }));

      setMarkers(convertedMarkers);
      setFilteredMarkers(convertedMarkers);
    } catch (error) {
      console.error('Failed to fetch markers:', error);
      setMarkers([]);
      setFilteredMarkers([]);
    } finally {
      setIsLoading(false);
    }
  }, [center, filters]);

  useEffect(() => {
    if (fetchTimerRef.current) {
      clearTimeout(fetchTimerRef.current);
    }
    fetchTimerRef.current = setTimeout(() => {
      fetchMarkers();
    }, 300);
    return () => {
      if (fetchTimerRef.current) {
        clearTimeout(fetchTimerRef.current);
      }
    };
  }, [fetchMarkers]);

  useEffect(() => {
    const filtered = markers.filter((marker) => {
      if (!filters.types.includes(marker.type)) return false;
      if (marker.type === 'prospect') {
        const score = marker.info?.score || 0;
        if (score < filters.minScore || score > filters.maxScore) return false;
      }
      const distance = getDistance(center.lat, center.lng, marker.lat, marker.lng);
      if (distance > filters.radius) return false;
      return true;
    });
    setFilteredMarkers(filtered);
  }, [markers, filters, center]);

  const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleSearch = (address: string, lat: number, lng: number) => {
    setCenter({ lat, lng });
  };

  const handleMarkerClick = (marker: MarkerData) => {
    setSelectedMarker(marker);
  };

  const handleListItemClick = (marker: MarkerData) => {
    setCenter({ lat: marker.lat, lng: marker.lng });
    setSelectedMarker(marker);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'hospital': return <Building2 className="w-4 h-4" />;
      case 'prospect': return <Target className="w-4 h-4" />;
      case 'pharmacy': return <Pill className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'hospital': return 'bg-sky-100 text-sky-700 border-sky-200';
      case 'prospect': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'pharmacy': return 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      hospital: '병원',
      prospect: '프로스펙트',
      pharmacy: '약국',
      default: '기타',
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-gray-100">
        <div className="max-w-full mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">MediMatch</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {[
                { href: '/simulate', label: 'OpenSim' },
                { href: '/prospects', label: 'SalesScanner' },
                { href: '/pharmacy', label: 'PharmMatch' },
                { href: '/map', label: '지도', active: true },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    item.active ? 'text-violet-600 bg-violet-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <Link href="/dashboard" className="btn-primary py-2 px-4 text-sm">
              <Zap className="w-4 h-4 mr-1" />
              대시보드
            </Link>
          </div>
        </div>
      </header>

      <div className="flex h-screen pt-14">
        {/* Sidebar */}
        <div
          className={`bg-white border-r border-gray-100 transition-all duration-300 ease-out ${
            isListOpen ? 'w-[420px]' : 'w-0'
          } overflow-hidden flex-shrink-0`}
        >
          <div className="w-[420px] h-full flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <MapSearchBox onSearch={handleSearch} />
              </div>
            </div>

            {/* Quick Filters */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  showFilters ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                필터
              </button>
              <div className="flex gap-1.5">
                {['hospital', 'prospect', 'pharmacy'].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      const newTypes = filters.types.includes(type)
                        ? filters.types.filter(t => t !== type)
                        : [...filters.types, type];
                      setFilters({ ...filters, types: newTypes });
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                      filters.types.includes(type) ? getTypeStyle(type) : 'bg-white text-gray-400 border-gray-200'
                    }`}
                  >
                    {getTypeIcon(type)}
                    {getTypeLabel(type)}
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
              <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <MapFilter filters={filters} onFilterChange={setFilters} />
              </div>
            )}

            {/* Results List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    검색 결과
                    <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold">
                      {filteredMarkers.length}
                    </span>
                    {isLoading && (
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-violet-600 border-t-transparent"></span>
                    )}
                  </h3>
                </div>

                {filteredMarkers.length === 0 && !isLoading && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium mb-2">검색 결과가 없습니다</p>
                    <p className="text-sm text-gray-400">필터를 조정하거나 다른 지역을 검색해보세요.</p>
                  </div>
                )}

                <div className="space-y-3">
                  {filteredMarkers.map((marker) => (
                    <div
                      key={marker.id}
                      onClick={() => handleListItemClick(marker)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                        selectedMarker?.id === marker.id
                          ? 'border-violet-400 bg-violet-50/50 shadow-lg shadow-violet-100'
                          : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            marker.type === 'hospital' ? 'bg-sky-100 text-sky-600' :
                            marker.type === 'prospect' ? 'bg-emerald-100 text-emerald-600' :
                            marker.type === 'pharmacy' ? 'bg-fuchsia-100 text-fuchsia-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {getTypeIcon(marker.type)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 line-clamp-1">{marker.title}</h4>
                            <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                              marker.type === 'hospital' ? 'text-sky-600' :
                              marker.type === 'prospect' ? 'text-emerald-600' :
                              marker.type === 'pharmacy' ? 'text-fuchsia-600' :
                              'text-gray-600'
                            }`}>
                              {getTypeLabel(marker.type)}
                            </span>
                          </div>
                        </div>
                        {marker.info?.score && (
                          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-sm font-bold">{marker.info.score}</span>
                          </div>
                        )}
                      </div>

                      {marker.info?.address && (
                        <p className="text-sm text-gray-500 mb-2 line-clamp-1">{marker.info.address}</p>
                      )}

                      {marker.info?.specialty && (
                        <span className="inline-block px-2 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs">
                          {marker.info.specialty}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsListOpen(!isListOpen)}
          className="absolute top-1/2 -translate-y-1/2 z-20 bg-white shadow-lg rounded-r-xl p-2 border border-l-0 border-gray-200 hover:bg-gray-50 transition-colors"
          style={{ left: isListOpen ? '420px' : '0' }}
        >
          {isListOpen ? (
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-600" />
          )}
        </button>

        {/* Map Container */}
        <div className="flex-1 relative">
          <KakaoMap
            center={center}
            level={5}
            markers={filteredMarkers}
            onMarkerClick={handleMarkerClick}
            onMapClick={(lat, lng) => console.log('Map clicked:', lat, lng)}
            showCurrentLocation
            className="w-full h-full"
          />

          {/* Map Controls */}
          <div className="absolute bottom-6 right-6 flex flex-col gap-2">
            {/* Layers Button */}
            <button className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-100">
              <Layers className="w-5 h-5 text-gray-600" />
            </button>

            {/* Current Location Button */}
            <button
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition((position) => {
                    setCenter({
                      lat: position.coords.latitude,
                      lng: position.coords.longitude,
                    });
                  });
                }
              }}
              className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-100"
            >
              <Navigation className="w-5 h-5 text-violet-600" />
            </button>
          </div>

          {/* Selected Marker Info Card */}
          {selectedMarker && (
            <div className="absolute bottom-6 left-6 right-20 max-w-md glass-card p-5 animate-slide-up">
              <button
                onClick={() => setSelectedMarker(null)}
                className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>

              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  selectedMarker.type === 'hospital' ? 'bg-sky-100 text-sky-600' :
                  selectedMarker.type === 'prospect' ? 'bg-emerald-100 text-emerald-600' :
                  selectedMarker.type === 'pharmacy' ? 'bg-fuchsia-100 text-fuchsia-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {getTypeIcon(selectedMarker.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-gray-900">{selectedMarker.title}</h4>
                    {selectedMarker.info?.score && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-100 text-amber-700 text-xs font-bold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {selectedMarker.info.score}
                      </span>
                    )}
                  </div>
                  {selectedMarker.info?.address && (
                    <p className="text-sm text-gray-500 mb-3">{selectedMarker.info.address}</p>
                  )}
                  <div className="flex gap-2">
                    <Link
                      href={`/simulate?lat=${selectedMarker.lat}&lng=${selectedMarker.lng}`}
                      className="btn-primary text-sm py-2"
                    >
                      시뮬레이션
                    </Link>
                    <button className="btn-secondary text-sm py-2">
                      상세보기
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
