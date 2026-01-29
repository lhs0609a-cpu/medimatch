'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { MapSearchBox } from '@/components/map';
import {
  generateBuildingListings,
  generatePharmacyListings,
  BuildingListing,
  PharmacyListing,
} from '@/lib/data/seedListings';
import { buildingListingImages, pharmacyListingImages } from '@/components/BlurredListingImage';
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Building2,
  Pill,
  Navigation,
  Search,
  X,
  Phone,
  MessageCircle,
  Eye,
  Clock,
  Lock,
  Flame,
  Zap,
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
  id: string;
  lat: number;
  lng: number;
  title: string;
  type: 'hospital' | 'pharmacy' | 'building';
  info?: {
    address?: string;
    subArea?: string;
    price?: string;
    area?: string;
  };
  originalData?: BuildingListing | PharmacyListing;
}

type ListingType = 'building' | 'pharmacy';

export default function MapPage() {
  const [center, setCenter] = useState({ lat: 37.5172, lng: 127.0473 }); // 강남 기본
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [isListOpen, setIsListOpen] = useState(true);
  const [activeFilters, setActiveFilters] = useState<ListingType[]>(['building', 'pharmacy']);
  const [searchQuery, setSearchQuery] = useState('');

  // 시드 데이터 생성 (메모이제이션)
  const buildingListings = useMemo(() => generateBuildingListings(), []);
  const pharmacyListings = useMemo(() => generatePharmacyListings(), []);

  // 매물 데이터를 마커 형태로 변환
  const allMarkers = useMemo(() => {
    const buildingMarkers: MarkerData[] = buildingListings.map((listing) => ({
      id: listing.id,
      lat: listing.lat,
      lng: listing.lng,
      title: listing.title,
      type: 'building' as const,
      info: {
        address: listing.address,
        subArea: listing.subArea,
        price: `보증금 ${(listing.deposit / 10000).toFixed(1)}억 / 월세 ${listing.monthlyRent}만`,
        area: `${listing.areaPyeong}평`,
      },
      originalData: listing,
    }));

    const pharmacyMarkers: MarkerData[] = pharmacyListings.map((listing) => ({
      id: listing.id,
      lat: listing.lat,
      lng: listing.lng,
      title: `${listing.subArea} 약국 양도`,
      type: 'pharmacy' as const,
      info: {
        address: listing.region,
        subArea: listing.subArea,
        price: `권리금 ${(listing.premiumMin / 10000).toFixed(1)}~${(listing.premiumMax / 10000).toFixed(1)}억`,
        area: listing.floorInfo,
      },
      originalData: listing,
    }));

    return [...buildingMarkers, ...pharmacyMarkers];
  }, [buildingListings, pharmacyListings]);

  // 필터링된 마커
  const filteredMarkers = useMemo(() => {
    return allMarkers.filter((marker) => {
      // 타입 필터
      if (marker.type === 'building' && !activeFilters.includes('building')) return false;
      if (marker.type === 'pharmacy' && !activeFilters.includes('pharmacy')) return false;

      // 검색어 필터
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchTitle = marker.title.toLowerCase().includes(query);
        const matchAddress = marker.info?.address?.toLowerCase().includes(query);
        const matchSubArea = marker.info?.subArea?.toLowerCase().includes(query);
        if (!matchTitle && !matchAddress && !matchSubArea) return false;
      }

      return true;
    });
  }, [allMarkers, activeFilters, searchQuery]);

  // 현재 지도 영역 내의 마커만 필터링 (옵션)
  const visibleMarkers = useMemo(() => {
    // 현재 중심에서 약 20km 반경 내 마커만 표시
    const maxDistance = 50; // km
    return filteredMarkers.filter((marker) => {
      const distance = getDistanceKm(center.lat, center.lng, marker.lat, marker.lng);
      return distance <= maxDistance;
    });
  }, [filteredMarkers, center]);

  const getDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
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

  const toggleFilter = (type: ListingType) => {
    setActiveFilters((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const getTypeStyle = (type: string, active: boolean = true) => {
    if (!active) return 'bg-secondary text-muted-foreground border-border';
    switch (type) {
      case 'building':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
      case 'pharmacy':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800';
      default:
        return 'bg-secondary text-secondary-foreground border-border';
    }
  };

  // 전화 상담 연결
  const handleCallConsultation = () => {
    window.location.href = 'tel:1588-0000';
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
                onClick={() => toggleFilter('building')}
                className={`btn-sm border ${getTypeStyle('building', activeFilters.includes('building'))}`}
              >
                <Building2 className="w-4 h-4" />
                병원
              </button>
              <button
                onClick={() => toggleFilter('pharmacy')}
                className={`btn-sm border ${getTypeStyle('pharmacy', activeFilters.includes('pharmacy'))}`}
              >
                <Pill className="w-4 h-4" />
                약국
              </button>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    검색 결과
                    <span className="badge-default">{visibleMarkers.length}</span>
                  </h3>
                </div>

                {visibleMarkers.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-4">
                      <Search className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-foreground font-medium mb-1">검색 결과가 없습니다</p>
                    <p className="text-sm text-muted-foreground">
                      필터를 조정하거나 다른 지역을 검색해보세요.
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  {visibleMarkers.slice(0, 50).map((marker, index) => {
                    const isBuilding = marker.type === 'building';
                    const listing = marker.originalData as BuildingListing | PharmacyListing;
                    const imageIndex = index;

                    return (
                      <div
                        key={marker.id}
                        onClick={() => handleListItemClick(marker)}
                        className={`rounded-xl border cursor-pointer transition-all duration-200 overflow-hidden ${
                          selectedMarker?.id === marker.id
                            ? 'border-foreground bg-accent shadow-lg'
                            : 'border-border bg-card hover:border-foreground/20 hover:shadow-md'
                        }`}
                      >
                        {/* 이미지 */}
                        <div className="h-28 relative overflow-hidden">
                          <Image
                            src={
                              isBuilding
                                ? buildingListingImages[imageIndex % buildingListingImages.length]
                                : pharmacyListingImages[imageIndex % pharmacyListingImages.length]
                            }
                            alt={marker.title}
                            fill
                            className="object-cover blur-md scale-110"
                            sizes="400px"
                          />
                          <div className="absolute inset-0 bg-black/20" />
                          {/* 잠금 오버레이 */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-white text-xs">
                              <Lock className="w-3 h-3" />
                              <span>문의 후 공개</span>
                            </div>
                          </div>
                          {/* 배지 */}
                          <div className="absolute top-2 left-2 flex gap-1">
                            {isBuilding && (listing as BuildingListing).isNew && (
                              <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-medium rounded flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                NEW
                              </span>
                            )}
                            {isBuilding && (listing as BuildingListing).isHot && (
                              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded flex items-center gap-1">
                                <Flame className="w-3 h-3" />
                                인기
                              </span>
                            )}
                          </div>
                          {/* 타입 배지 */}
                          <div className="absolute top-2 right-2">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                isBuilding
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-purple-500 text-white'
                              }`}
                            >
                              {isBuilding ? '병원' : '약국'}
                            </span>
                          </div>
                          {/* 조회수 */}
                          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {listing.viewCount}
                          </div>
                        </div>

                        {/* 정보 */}
                        <div className="p-3">
                          <h4 className="font-medium text-foreground line-clamp-1 mb-1">
                            {marker.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {marker.info?.address}
                          </p>
                          <p className="text-sm font-semibold text-primary">{marker.info?.price}</p>

                          {/* 전화 상담 버튼 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCallConsultation();
                            }}
                            className="mt-3 w-full btn-primary btn-sm flex items-center justify-center gap-2"
                          >
                            <Phone className="w-4 h-4" />
                            전화 상담
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {visibleMarkers.length > 50 && (
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    외 {visibleMarkers.length - 50}개 매물이 더 있습니다
                  </p>
                )}
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
            level={7}
            markers={visibleMarkers.map((m) => ({
              ...m,
              type: m.type === 'building' ? 'hospital' : 'pharmacy',
            }))}
            onMarkerClick={handleMarkerClick}
            onMapClick={(lat, lng) => setCenter({ lat, lng })}
            showCurrentLocation
            className="w-full h-full"
          />

          {/* Map Controls */}
          <div className="absolute bottom-6 right-6 flex flex-col gap-2">
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
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getTypeStyle(selectedMarker.type)}`}
                >
                  {selectedMarker.type === 'building' ? (
                    <Building2 className="w-5 h-5" />
                  ) : (
                    <Pill className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-foreground">{selectedMarker.title}</h4>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        selectedMarker.type === 'building'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                      }`}
                    >
                      {selectedMarker.type === 'building' ? '병원' : '약국'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{selectedMarker.info?.address}</p>
                  <p className="text-sm font-semibold text-primary mb-3">{selectedMarker.info?.price}</p>
                  <div className="flex gap-2">
                    <button onClick={handleCallConsultation} className="btn-primary btn-sm flex-1">
                      <Phone className="w-4 h-4 mr-1" />
                      전화 상담
                    </button>
                    <button className="btn-secondary btn-sm flex-1">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      문의하기
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 매물 수 표시 */}
          <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-border">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-500" />
                <span className="font-medium">
                  병원 {visibleMarkers.filter((m) => m.type === 'building').length}
                </span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-purple-500" />
                <span className="font-medium">
                  약국 {visibleMarkers.filter((m) => m.type === 'pharmacy').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
