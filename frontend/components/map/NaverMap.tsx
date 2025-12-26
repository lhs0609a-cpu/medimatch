'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

declare global {
  interface Window {
    naver: any;
  }
}

export interface MarkerData {
  id: string | number;
  lat: number;
  lng: number;
  title: string;
  type: 'hospital' | 'prospect' | 'pharmacy' | 'default' | 'closed_hospital' | 'listing';
  info?: {
    address?: string;
    score?: number;
    specialty?: string;
    phone?: string;
    [key: string]: any;
  };
}

interface NaverMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: MarkerData[];
  onMarkerClick?: (marker: MarkerData) => void;
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
  showCurrentLocation?: boolean;
  onCenterChanged?: (lat: number, lng: number) => void;
  onZoomChanged?: (zoom: number) => void;
}

export default function NaverMap({
  center = { lat: 37.5665, lng: 126.978 },
  zoom = 14,
  markers = [],
  onMarkerClick,
  onMapClick,
  className = '',
  showCurrentLocation = false,
  onCenterChanged,
  onZoomChanged,
}: NaverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [naverMarkers, setNaverMarkers] = useState<any[]>([]);
  const [infoWindows, setInfoWindows] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const currentMarkerRef = useRef<any>(null);

  // 네이버맵 스크립트 로드
  useEffect(() => {
    if (window.naver && window.naver.maps) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}&submodules=geocoder`;
    script.async = true;

    script.onload = () => {
      setIsLoaded(true);
    };

    script.onerror = () => {
      console.error('네이버 지도 스크립트 로드 실패');
    };

    document.head.appendChild(script);

    return () => {
      // 스크립트는 제거하지 않음 (다른 컴포넌트에서 사용 가능)
    };
  }, []);

  // 지도 초기화
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.naver) return;

    const mapOptions = {
      center: new window.naver.maps.LatLng(center.lat, center.lng),
      zoom,
      zoomControl: true,
      zoomControlOptions: {
        position: window.naver.maps.Position.TOP_RIGHT,
      },
      mapTypeControl: true,
      mapTypeControlOptions: {
        position: window.naver.maps.Position.TOP_LEFT,
      },
    };

    const newMap = new window.naver.maps.Map(mapRef.current, mapOptions);
    setMap(newMap);

    // 지도 클릭 이벤트
    if (onMapClick) {
      window.naver.maps.Event.addListener(newMap, 'click', (e: any) => {
        onMapClick(e.coord.lat(), e.coord.lng());
      });
    }

    // 센터 변경 이벤트
    if (onCenterChanged) {
      window.naver.maps.Event.addListener(newMap, 'center_changed', () => {
        const center = newMap.getCenter();
        onCenterChanged(center.lat(), center.lng());
      });
    }

    // 줌 변경 이벤트
    if (onZoomChanged) {
      window.naver.maps.Event.addListener(newMap, 'zoom_changed', () => {
        onZoomChanged(newMap.getZoom());
      });
    }
  }, [isLoaded]);

  // 현재 위치 가져오기
  useEffect(() => {
    if (!showCurrentLocation) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentPosition({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  }, [showCurrentLocation]);

  // 현재 위치 마커 표시
  useEffect(() => {
    if (!map || !currentPosition || !window.naver) return;

    // 기존 현재 위치 마커 제거
    if (currentMarkerRef.current) {
      currentMarkerRef.current.setMap(null);
    }

    const markerPosition = new window.naver.maps.LatLng(
      currentPosition.lat,
      currentPosition.lng
    );

    const marker = new window.naver.maps.Marker({
      position: markerPosition,
      map,
      icon: {
        content: `
          <div style="
            width: 20px;
            height: 20px;
            background: #4285F4;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          "></div>
        `,
        anchor: new window.naver.maps.Point(10, 10),
      },
    });

    currentMarkerRef.current = marker;

    // 현재 위치로 이동
    map.setCenter(markerPosition);
  }, [map, currentPosition]);

  // 마커 아이콘 생성
  const getMarkerIcon = useCallback((type: string) => {
    const colors: Record<string, string> = {
      hospital: '#3B82F6',      // 파란색
      prospect: '#10B981',      // 초록색
      pharmacy: '#F59E0B',      // 주황색
      closed_hospital: '#6B7280', // 회색
      listing: '#8B5CF6',       // 보라색
      default: '#EF4444',       // 빨간색
    };

    const labels: Record<string, string> = {
      hospital: 'H',
      prospect: 'P',
      pharmacy: 'Rx',
      closed_hospital: 'X',
      listing: 'L',
      default: '●',
    };

    const color = colors[type] || colors.default;
    const label = labels[type] || labels.default;

    return {
      content: `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: ${color};
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          color: white;
          font-weight: bold;
          font-size: 14px;
        ">${label}</div>
      `,
      anchor: new window.naver.maps.Point(18, 18),
    };
  }, []);

  // 인포윈도우 컨텐츠 생성
  const getInfoWindowContent = useCallback((markerData: MarkerData) => {
    return `
      <div style="
        padding: 12px 16px;
        min-width: 200px;
        max-width: 300px;
        font-family: 'Pretendard', -apple-system, sans-serif;
      ">
        <h4 style="
          margin: 0 0 8px 0;
          font-weight: 600;
          font-size: 15px;
          color: #1f2937;
        ">${markerData.title}</h4>
        ${markerData.info?.address ? `
          <p style="
            margin: 4px 0;
            color: #6b7280;
            font-size: 13px;
          ">${markerData.info.address}</p>
        ` : ''}
        ${markerData.info?.phone ? `
          <p style="
            margin: 4px 0;
            color: #6b7280;
            font-size: 13px;
          ">Tel: ${markerData.info.phone}</p>
        ` : ''}
        ${markerData.info?.score !== undefined ? `
          <p style="
            margin: 8px 0 4px 0;
            color: #3B82F6;
            font-size: 14px;
            font-weight: 600;
          ">적합도: ${markerData.info.score}점</p>
        ` : ''}
        ${markerData.info?.specialty ? `
          <p style="
            margin: 4px 0;
            font-size: 13px;
            color: #4b5563;
          ">진료과목: ${markerData.info.specialty}</p>
        ` : ''}
      </div>
    `;
  }, []);

  // 마커 렌더링
  useEffect(() => {
    if (!map || !window.naver) return;

    // 기존 마커 및 인포윈도우 제거
    naverMarkers.forEach((marker) => marker.setMap(null));
    infoWindows.forEach((infoWindow) => infoWindow.close());

    const newMarkers: any[] = [];
    const newInfoWindows: any[] = [];

    markers.forEach((markerData) => {
      const position = new window.naver.maps.LatLng(markerData.lat, markerData.lng);

      const marker = new window.naver.maps.Marker({
        position,
        map,
        icon: getMarkerIcon(markerData.type),
      });

      const infoWindow = new window.naver.maps.InfoWindow({
        content: getInfoWindowContent(markerData),
        borderWidth: 0,
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        pixelOffset: new window.naver.maps.Point(0, -10),
      });

      // 마커 클릭 이벤트
      window.naver.maps.Event.addListener(marker, 'click', () => {
        // 모든 인포윈도우 닫기
        newInfoWindows.forEach((iw) => iw.close());
        // 현재 인포윈도우 열기
        infoWindow.open(map, marker);

        if (onMarkerClick) {
          onMarkerClick(markerData);
        }
      });

      newMarkers.push(marker);
      newInfoWindows.push(infoWindow);
    });

    setNaverMarkers(newMarkers);
    setInfoWindows(newInfoWindows);

    // 지도 클릭 시 인포윈도우 닫기
    window.naver.maps.Event.addListener(map, 'click', () => {
      newInfoWindows.forEach((iw) => iw.close());
    });
  }, [map, markers, getMarkerIcon, getInfoWindowContent, onMarkerClick]);

  // 센터 변경 시 지도 이동
  useEffect(() => {
    if (!map || !window.naver) return;
    const moveLatLng = new window.naver.maps.LatLng(center.lat, center.lng);
    map.setCenter(moveLatLng);
  }, [map, center.lat, center.lng]);

  // 줌 변경
  useEffect(() => {
    if (!map) return;
    map.setZoom(zoom);
  }, [map, zoom]);

  // 지도 리사이즈
  const handleResize = useCallback(() => {
    if (map && window.naver) {
      window.naver.maps.Event.trigger(map, 'resize');
    }
  }, [map]);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="w-full h-full min-h-[400px]" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">지도를 불러오는 중...</p>
          </div>
        </div>
      )}
    </div>
  );
}
