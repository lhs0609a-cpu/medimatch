'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, Search, Crosshair } from 'lucide-react'

declare global {
  interface Window {
    kakao: any
  }
}

interface Props {
  onChange: (data: {
    latitude: number
    longitude: number
    radius_m: number
    address: string
  }) => void
  defaultRadius?: number
  error?: string
}

const RADIUS_PRESETS = [500, 1000, 1500, 2000, 3000, 5000]
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }

export default function MapLocationPicker({ onChange, defaultRadius = 1000, error }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [marker, setMarker] = useState<any>(null)
  const [circle, setCircle] = useState<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [picked, setPicked] = useState<{ lat: number; lng: number; address: string } | null>(null)
  const [radius, setRadius] = useState(defaultRadius)
  const [searchQuery, setSearchQuery] = useState('')
  const [isResolving, setIsResolving] = useState(false)

  useEffect(() => {
    if (window.kakao && window.kakao.maps) {
      setIsLoaded(true)
      return
    }
    const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY
    if (!apiKey) {
      setLoadError('카카오맵 API 키가 설정되지 않았습니다.')
      return
    }
    const existing = document.querySelector(`script[src*="dapi.kakao.com"]`)
    if (existing) {
      const onReady = () => window.kakao?.maps?.load(() => setIsLoaded(true))
      if (window.kakao?.maps) onReady()
      else existing.addEventListener('load', onReady, { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false&libraries=services`
    script.async = true
    script.onload = () => {
      window.kakao.maps.load(() => setIsLoaded(true))
    }
    script.onerror = () => setLoadError('카카오맵 스크립트를 불러올 수 없습니다.')
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return
    const m = new window.kakao.maps.Map(mapRef.current, {
      center: new window.kakao.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
      level: 5,
    })
    m.addControl(new window.kakao.maps.ZoomControl(), window.kakao.maps.ControlPosition.RIGHT)
    window.kakao.maps.event.addListener(m, 'click', (e: any) => {
      const ll = e.latLng
      handlePick(ll.getLat(), ll.getLng())
    })
    setMap(m)
  }, [isLoaded])

  const reverseGeocode = (lat: number, lng: number): Promise<string> => {
    return new Promise((resolve) => {
      if (!window.kakao?.maps?.services) {
        resolve(`${lat.toFixed(5)}, ${lng.toFixed(5)}`)
        return
      }
      const geocoder = new window.kakao.maps.services.Geocoder()
      geocoder.coord2Address(lng, lat, (result: any, status: any) => {
        if (status === window.kakao.maps.services.Status.OK && result[0]) {
          const r = result[0]
          const addr = r.road_address?.address_name || r.address?.address_name
          resolve(addr || `${lat.toFixed(5)}, ${lng.toFixed(5)}`)
        } else {
          resolve(`${lat.toFixed(5)}, ${lng.toFixed(5)}`)
        }
      })
    })
  }

  const handlePick = async (lat: number, lng: number) => {
    setIsResolving(true)
    const address = await reverseGeocode(lat, lng)
    setIsResolving(false)
    setPicked({ lat, lng, address })
  }

  // 마커/원 렌더링 + 부모 통지
  useEffect(() => {
    if (!map || !picked) return

    const pos = new window.kakao.maps.LatLng(picked.lat, picked.lng)

    if (marker) marker.setMap(null)
    const newMarker = new window.kakao.maps.Marker({ position: pos })
    newMarker.setMap(map)
    setMarker(newMarker)

    if (circle) circle.setMap(null)
    const newCircle = new window.kakao.maps.Circle({
      center: pos,
      radius,
      strokeWeight: 2,
      strokeColor: '#2563eb',
      strokeOpacity: 0.8,
      strokeStyle: 'solid',
      fillColor: '#3b82f6',
      fillOpacity: 0.15,
    })
    newCircle.setMap(map)
    setCircle(newCircle)

    map.setCenter(pos)
    onChange({ latitude: picked.lat, longitude: picked.lng, radius_m: radius, address: picked.address })
  }, [map, picked, radius])

  const handleSearch = () => {
    if (!searchQuery.trim() || !window.kakao?.maps?.services) return
    const geocoder = new window.kakao.maps.services.Geocoder()
    geocoder.addressSearch(searchQuery, (result: any, status: any) => {
      if (status === window.kakao.maps.services.Status.OK && result[0]) {
        const lat = parseFloat(result[0].y)
        const lng = parseFloat(result[0].x)
        handlePick(lat, lng)
      }
    })
  }

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => handlePick(pos.coords.latitude, pos.coords.longitude),
      () => {},
    )
  }

  return (
    <div>
      <label className="label mb-2 block">개원 예정 위치 *</label>

      {/* 검색 + 현재 위치 */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSearch()
              }
            }}
            placeholder="주소나 건물명으로 검색"
            className="input pl-10"
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          className="btn-secondary px-4 whitespace-nowrap"
        >
          검색
        </button>
        <button
          type="button"
          onClick={handleCurrentLocation}
          className="btn-secondary px-3"
          title="현재 위치"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>

      {/* 지도 */}
      <div className="relative rounded-xl overflow-hidden border border-border bg-muted/30">
        <div ref={mapRef} className="w-full h-[380px]" />
        {!isLoaded && !loadError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/60">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">지도를 불러오는 중...</p>
            </div>
          </div>
        )}
        {loadError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/60 p-6">
            <p className="text-sm text-red-500 text-center">{loadError}</p>
          </div>
        )}
        {!picked && isLoaded && !loadError && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-foreground/90 text-background px-4 py-2 rounded-full text-sm shadow-lg pointer-events-none">
            지도를 클릭해 개원 예정 위치를 지정하세요
          </div>
        )}
      </div>

      {/* 선택된 위치 정보 */}
      {picked && (
        <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 truncate">
                {isResolving ? '주소 확인 중...' : picked.address}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                {picked.lat.toFixed(5)}, {picked.lng.toFixed(5)} · 반경 {(radius / 1000).toFixed(1)}km
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 반경 설정 */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <label className="label">상권 분석 반경</label>
          <span className="text-sm font-medium text-foreground">
            {radius >= 1000 ? `${(radius / 1000).toFixed(1)}km` : `${radius}m`}
          </span>
        </div>
        <input
          type="range"
          min={300}
          max={5000}
          step={100}
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="w-full accent-blue-600"
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {RADIUS_PRESETS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRadius(r)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                radius === r
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-background text-muted-foreground border-border hover:border-blue-400'
              }`}
            >
              {r >= 1000 ? `${r / 1000}km` : `${r}m`}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  )
}
