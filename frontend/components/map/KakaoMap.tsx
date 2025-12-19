'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    kakao: any;
  }
}

interface Marker {
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

interface KakaoMapProps {
  center?: { lat: number; lng: number };
  level?: number;
  markers?: Marker[];
  onMarkerClick?: (marker: Marker) => void;
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
  showCurrentLocation?: boolean;
}

export default function KakaoMap({
  center = { lat: 37.5665, lng: 126.978 }, // 서울 시청
  level = 5,
  markers = [],
  onMarkerClick,
  onMapClick,
  className = '',
  showCurrentLocation = false,
}: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [kakaoMarkers, setKakaoMarkers] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);

  // 카카오맵 스크립트 로드
  useEffect(() => {
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false&libraries=services,clusterer`;
    script.async = true;

    script.onload = () => {
      window.kakao.maps.load(() => {
        setIsLoaded(true);
      });
    };

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // 지도 초기화
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    const options = {
      center: new window.kakao.maps.LatLng(center.lat, center.lng),
      level,
    };

    const newMap = new window.kakao.maps.Map(mapRef.current, options);
    setMap(newMap);

    // 지도 클릭 이벤트
    if (onMapClick) {
      window.kakao.maps.event.addListener(newMap, 'click', (mouseEvent: any) => {
        const latlng = mouseEvent.latLng;
        onMapClick(latlng.getLat(), latlng.getLng());
      });
    }

    // 줌 컨트롤
    const zoomControl = new window.kakao.maps.ZoomControl();
    newMap.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);

    // 지도 타입 컨트롤
    const mapTypeControl = new window.kakao.maps.MapTypeControl();
    newMap.addControl(mapTypeControl, window.kakao.maps.ControlPosition.TOPRIGHT);
  }, [isLoaded, center.lat, center.lng, level]);

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
    if (!map || !currentPosition) return;

    const markerPosition = new window.kakao.maps.LatLng(
      currentPosition.lat,
      currentPosition.lng
    );

    // 현재 위치 마커 이미지
    const imageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png';
    const imageSize = new window.kakao.maps.Size(40, 42);
    const markerImage = new window.kakao.maps.MarkerImage(imageSrc, imageSize);

    const marker = new window.kakao.maps.Marker({
      position: markerPosition,
      image: markerImage,
    });

    marker.setMap(map);

    // 현재 위치로 이동
    map.setCenter(markerPosition);
  }, [map, currentPosition]);

  // 마커 렌더링
  useEffect(() => {
    if (!map) return;

    // 기존 마커 제거
    kakaoMarkers.forEach((marker) => marker.setMap(null));

    const newMarkers = markers.map((markerData) => {
      const position = new window.kakao.maps.LatLng(markerData.lat, markerData.lng);

      // 마커 타입별 이미지
      const getMarkerImage = (type?: string) => {
        let imageSrc = '';
        let imageSize = new window.kakao.maps.Size(36, 36);

        switch (type) {
          case 'hospital':
            imageSrc = 'data:image/svg+xml,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="#3B82F6" stroke="white" stroke-width="2"/>
                <text x="18" y="24" text-anchor="middle" fill="white" font-size="18">H</text>
              </svg>
            `);
            break;
          case 'prospect':
            imageSrc = 'data:image/svg+xml,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="#10B981" stroke="white" stroke-width="2"/>
                <text x="18" y="24" text-anchor="middle" fill="white" font-size="18">P</text>
              </svg>
            `);
            break;
          case 'pharmacy':
            imageSrc = 'data:image/svg+xml,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="#F59E0B" stroke="white" stroke-width="2"/>
                <text x="18" y="24" text-anchor="middle" fill="white" font-size="18">R</text>
              </svg>
            `);
            break;
          default:
            return null;
        }

        if (!imageSrc) return null;
        return new window.kakao.maps.MarkerImage(imageSrc, imageSize);
      };

      const markerImage = getMarkerImage(markerData.type);

      const marker = new window.kakao.maps.Marker({
        position,
        image: markerImage || undefined,
      });

      // 인포윈도우 생성
      const infoContent = `
        <div style="padding: 10px; min-width: 200px;">
          <h4 style="margin: 0 0 8px 0; font-weight: bold;">${markerData.title}</h4>
          ${markerData.info?.address ? `<p style="margin: 4px 0; color: #666; font-size: 12px;">${markerData.info.address}</p>` : ''}
          ${markerData.info?.score ? `<p style="margin: 4px 0; color: #3B82F6; font-size: 14px;">적합도: ${markerData.info.score}점</p>` : ''}
          ${markerData.info?.specialty ? `<p style="margin: 4px 0; font-size: 12px;">진료과목: ${markerData.info.specialty}</p>` : ''}
        </div>
      `;

      const infowindow = new window.kakao.maps.InfoWindow({
        content: infoContent,
      });

      // 마커 클릭 이벤트
      window.kakao.maps.event.addListener(marker, 'click', () => {
        // 모든 인포윈도우 닫기
        newMarkers.forEach((m) => m.infowindow?.close());
        // 현재 인포윈도우 열기
        infowindow.open(map, marker);

        if (onMarkerClick) {
          onMarkerClick(markerData);
        }
      });

      marker.setMap(map);

      return { marker, infowindow };
    });

    setKakaoMarkers(newMarkers.map((m) => m.marker));
  }, [map, markers]);

  // 센터 변경 시 지도 이동
  useEffect(() => {
    if (!map) return;
    const moveLatLng = new window.kakao.maps.LatLng(center.lat, center.lng);
    map.setCenter(moveLatLng);
  }, [map, center.lat, center.lng]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="w-full h-full min-h-[400px]" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">지도를 불러오는 중...</p>
          </div>
        </div>
      )}
    </div>
  );
}
