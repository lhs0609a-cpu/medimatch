'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { MapSearchBox, MapFilter } from '@/components/map';
import { mapService } from '@/lib/api/services';
import { MapMarker } from '@/lib/api/client';
import {
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
  Star
} from 'lucide-react';

// SSR 비활성화
const KakaoMap = dynamic(() => import('@/components/map/KakaoMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[600px] bg-secondary flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 rounded-xl bg-foreground flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-6 h-6 text-background" />
        </div>
        <p className="text-muted-foreground font-medium">지도를 불러오는 중...</p>
      </div>
    </div>
  ),
});

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

  const getTypeStyle = (type: string, active: boolean = true) => {
    if (!active) return 'bg-secondary text-muted-foreground border-border';
    switch (type) {
      case 'hospital': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
      case 'prospect': return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
      case 'pharmacy': return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800';
      default: return 'bg-secondary text-secondary-foreground border-border';
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-full mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
                <span className="text-background font-bold text-sm">M</span>
              </div>
              <span className="font-semibold text-foreground">메디플라톤</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {[
                { href: '/simulate', label: 'OpenSim' },
                { href: '/prospects', label: 'SalesScanner' },
                { href: '/pharmacy-match', label: 'PharmMatch' },
                { href: '/map', label: '지도', active: true },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link ${item.active ? 'nav-link-active' : ''}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <Link href="/dashboard" className="btn-primary btn-sm">
              대시보드
            </Link>
          </div>
        </div>
      </header>

      <div className="flex h-screen pt-14">
        {/* Sidebar */}
        <div
          className={`bg-card border-r border-border transition-all duration-300 ease-out ${
            isListOpen ? 'w-[400px]' : 'w-0'
          } overflow-hidden flex-shrink-0`}
        >
          <div className="w-[400px] h-full flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <MapSearchBox onSearch={handleSearch} />
              </div>
            </div>

            {/* Quick Filters */}
            <div className="px-4 py-3 border-b border-border flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn-sm ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                필터
              </button>
              {['hospital', 'prospect', 'pharmacy'].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    const newTypes = filters.types.includes(type)
                      ? filters.types.filter(t => t !== type)
                      : [...filters.types, type];
                    setFilters({ ...filters, types: newTypes });
                  }}
                  className={`btn-sm border ${getTypeStyle(type, filters.types.includes(type))}`}
                >
                  {getTypeIcon(type)}
                  {getTypeLabel(type)}
                </button>
              ))}
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
              <div className="p-4 border-b border-border bg-secondary/30">
                <MapFilter filters={filters} onFilterChange={setFilters} />
              </div>
            )}

            {/* Results List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    검색 결과
                    <span className="badge-default">
                      {filteredMarkers.length}
                    </span>
                    {isLoading && (
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-foreground border-t-transparent"></span>
                    )}
                  </h3>
                </div>

                {filteredMarkers.length === 0 && !isLoading && (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-4">
                      <Search className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-foreground font-medium mb-1">검색 결과가 없습니다</p>
                    <p className="text-sm text-muted-foreground">필터를 조정하거나 다른 지역을 검색해보세요.</p>
                  </div>
                )}

                <div className="space-y-3">
                  {filteredMarkers.map((marker) => (
                    <div
                      key={marker.id}
                      onClick={() => handleListItemClick(marker)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                        selectedMarker?.id === marker.id
                          ? 'border-foreground bg-accent shadow-lg'
                          : 'border-border bg-card hover:border-foreground/20 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getTypeStyle(marker.type)}`}>
                            {getTypeIcon(marker.type)}
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground line-clamp-1">{marker.title}</h4>
                            <span className="text-xs text-muted-foreground">
                              {getTypeLabel(marker.type)}
                            </span>
                          </div>
                        </div>
                        {marker.info?.score && (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                            <Star className="w-3.5 h-3.5" />
                            <span className="text-sm font-bold">{marker.info.score}</span>
                          </div>
                        )}
                      </div>

                      {marker.info?.address && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{marker.info.address}</p>
                      )}

                      {marker.info?.specialty && (
                        <span className="badge-default">
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
          className="absolute top-1/2 -translate-y-1/2 z-20 bg-card shadow-lg rounded-r-lg p-2 border border-l-0 border-border hover:bg-accent transition-colors"
          style={{ left: isListOpen ? '400px' : '0' }}
        >
          {isListOpen ? (
            <ChevronLeft className="w-5 h-5 text-foreground" />
          ) : (
            <ChevronRight className="w-5 h-5 text-foreground" />
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
            <button className="w-11 h-11 bg-card rounded-lg shadow-lg flex items-center justify-center hover:bg-accent transition-colors border border-border">
              <Layers className="w-5 h-5 text-foreground" />
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
              className="w-11 h-11 bg-card rounded-lg shadow-lg flex items-center justify-center hover:bg-accent transition-colors border border-border"
            >
              <Navigation className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {/* Selected Marker Info Card */}
          {selectedMarker && (
            <div className="absolute bottom-6 left-6 right-20 max-w-md card p-5 shadow-xl animate-fade-in-up">
              <button
                onClick={() => setSelectedMarker(null)}
                className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-accent transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>

              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getTypeStyle(selectedMarker.type)}`}>
                  {getTypeIcon(selectedMarker.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-foreground">{selectedMarker.title}</h4>
                    {selectedMarker.info?.score && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 text-xs font-bold">
                        <Star className="w-3 h-3" />
                        {selectedMarker.info.score}
                      </span>
                    )}
                  </div>
                  {selectedMarker.info?.address && (
                    <p className="text-sm text-muted-foreground mb-3">{selectedMarker.info.address}</p>
                  )}
                  <div className="flex gap-2">
                    <Link
                      href={`/simulate?lat=${selectedMarker.lat}&lng=${selectedMarker.lng}`}
                      className="btn-primary btn-sm"
                    >
                      시뮬레이션
                    </Link>
                    <button className="btn-secondary btn-sm">
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
