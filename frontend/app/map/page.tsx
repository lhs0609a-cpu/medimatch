'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { MapSearchBox, MapFilter } from '@/components/map';

// SSR 비활성화
const KakaoMap = dynamic(() => import('@/components/map/KakaoMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[600px] bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500">지도를 불러오는 중...</p>
      </div>
    </div>
  ),
});

interface MarkerData {
  id: number;
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
  const [filters, setFilters] = useState<FilterOptions>({
    types: ['hospital', 'prospect', 'pharmacy'],
    minScore: 0,
    maxScore: 100,
    radius: 2000,
  });

  // 마커 데이터 로드
  useEffect(() => {
    fetchMarkers();
  }, [center]);

  // 필터 적용
  useEffect(() => {
    const filtered = markers.filter((marker) => {
      // 타입 필터
      if (!filters.types.includes(marker.type)) return false;

      // 점수 필터
      const score = marker.info?.score || 0;
      if (score < filters.minScore || score > filters.maxScore) return false;

      // 반경 필터 (간단한 거리 계산)
      const distance = getDistance(center.lat, center.lng, marker.lat, marker.lng);
      if (distance > filters.radius) return false;

      return true;
    });

    setFilteredMarkers(filtered);
  }, [markers, filters, center]);

  const fetchMarkers = async () => {
    // 실제 구현에서는 API 호출
    // 현재는 Mock 데이터
    const mockMarkers: MarkerData[] = [
      {
        id: 1,
        lat: 37.5665,
        lng: 126.978,
        title: '서울내과의원',
        type: 'hospital',
        info: {
          address: '서울특별시 중구 세종대로 110',
          specialty: '내과',
        },
      },
      {
        id: 2,
        lat: 37.5675,
        lng: 126.982,
        title: '신규 건물 A',
        type: 'prospect',
        info: {
          address: '서울특별시 중구 명동',
          score: 85,
        },
      },
      {
        id: 3,
        lat: 37.5655,
        lng: 126.975,
        title: '온누리약국',
        type: 'pharmacy',
        info: {
          address: '서울특별시 중구 남대문로',
        },
      },
      {
        id: 4,
        lat: 37.5043,
        lng: 127.0245,
        title: '강남정형외과',
        type: 'hospital',
        info: {
          address: '서울특별시 강남구 테헤란로 123',
          specialty: '정형외과',
        },
      },
      {
        id: 5,
        lat: 37.5057,
        lng: 127.0232,
        title: '공실 - 이전 피부과',
        type: 'prospect',
        info: {
          address: '서울특별시 강남구 역삼동 456',
          score: 92,
        },
      },
    ];

    setMarkers(mockMarkers);
  };

  const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371e3; // 지구 반지름 (미터)
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
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

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      hospital: '병원',
      prospect: '프로스펙트',
      pharmacy: '약국',
      default: '기타',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      hospital: 'bg-blue-100 text-blue-800',
      prospect: 'bg-green-100 text-green-800',
      pharmacy: 'bg-yellow-100 text-yellow-800',
      default: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || colors.default;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-blue-600">
              MediMatch
            </Link>
            <nav className="flex items-center gap-4">
              <Link href="/simulate" className="text-gray-600 hover:text-gray-900">
                OpenSim
              </Link>
              <Link href="/pharmacy" className="text-gray-600 hover:text-gray-900">
                PharmMatch
              </Link>
              <Link href="/prospects" className="text-gray-600 hover:text-gray-900">
                SalesScanner
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* 사이드바 */}
        <div
          className={`bg-white shadow-lg transition-all duration-300 ${
            isListOpen ? 'w-96' : 'w-0'
          } overflow-hidden`}
        >
          <div className="w-96 h-full flex flex-col">
            {/* 검색창 */}
            <div className="p-4 border-b">
              <MapSearchBox onSearch={handleSearch} />
            </div>

            {/* 필터 */}
            <div className="p-4 border-b">
              <MapFilter filters={filters} onFilterChange={setFilters} />
            </div>

            {/* 검색 결과 목록 */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-4">
                  검색 결과 ({filteredMarkers.length}건)
                </h3>
                <div className="space-y-3">
                  {filteredMarkers.map((marker) => (
                    <div
                      key={marker.id}
                      onClick={() => handleListItemClick(marker)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedMarker?.id === marker.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{marker.title}</h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                            marker.type
                          )}`}
                        >
                          {getTypeLabel(marker.type)}
                        </span>
                      </div>
                      {marker.info?.address && (
                        <p className="text-sm text-gray-500 mb-2">{marker.info.address}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        {marker.info?.score && (
                          <span className="text-blue-600 font-medium">
                            적합도 {marker.info.score}점
                          </span>
                        )}
                        {marker.info?.specialty && (
                          <span className="text-gray-600">{marker.info.specialty}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 토글 버튼 */}
        <button
          onClick={() => setIsListOpen(!isListOpen)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-r-lg p-2"
          style={{ left: isListOpen ? '384px' : '0' }}
        >
          <svg
            className={`w-5 h-5 text-gray-600 transition-transform ${
              isListOpen ? '' : 'rotate-180'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* 지도 */}
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

          {/* 현재 위치 버튼 */}
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
            className="absolute bottom-6 right-6 bg-white shadow-lg rounded-full p-3 hover:bg-gray-50"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
