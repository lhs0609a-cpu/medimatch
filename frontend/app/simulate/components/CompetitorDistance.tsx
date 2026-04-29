'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Crosshair, Lock } from 'lucide-react'
import { SimulationResponse } from '@/lib/api/client'

declare global {
  interface Window {
    kakao: any
  }
}

interface CompetitorDistanceProps {
  result: SimulationResponse
}

export default function CompetitorDistance({ result }: CompetitorDistanceProps) {
  const competitors = result.competitors || []
  const radius = result.competition.radius_m
  const sameDeptCount = result.competition.same_dept_count
  const centerLat = result.latitude
  const centerLng = result.longitude

  const mapRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const competitorsWithCoords = competitors.filter(
    (c) => typeof c.latitude === 'number' && typeof c.longitude === 'number'
  )
  const canRenderMap =
    typeof centerLat === 'number' &&
    typeof centerLng === 'number' &&
    competitorsWithCoords.length > 0

  useEffect(() => {
    if (!canRenderMap) return
    if (window.kakao && window.kakao.maps) {
      setIsLoaded(true)
      return
    }
    const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY
    if (!apiKey) {
      setLoadError('카카오맵 API 키가 설정되지 않았습니다.')
      return
    }
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-kakao-sdk="true"]'
    )
    if (existing) {
      existing.addEventListener('load', () => {
        window.kakao?.maps?.load(() => setIsLoaded(true))
      })
      return
    }
    const script = document.createElement('script')
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false&libraries=services`
    script.async = true
    script.dataset.kakaoSdk = 'true'
    script.onload = () => {
      window.kakao?.maps?.load(() => setIsLoaded(true))
    }
    script.onerror = () => setLoadError('카카오맵 스크립트 로드 실패.')
    document.head.appendChild(script)
  }, [canRenderMap])

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !canRenderMap) return
    const kakao = window.kakao
    const center = new kakao.maps.LatLng(centerLat!, centerLng!)
    const map = new kakao.maps.Map(mapRef.current, { center, level: 4 })

    new kakao.maps.Circle({
      map,
      center,
      radius,
      strokeWeight: 2,
      strokeColor: '#3b82f6',
      strokeOpacity: 0.7,
      strokeStyle: 'dashed',
      fillColor: '#3b82f6',
      fillOpacity: 0.06,
    })

    const myImage = new kakao.maps.MarkerImage(
      'data:image/svg+xml;charset=utf-8,' +
        encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><circle cx="18" cy="18" r="14" fill="#2563eb" stroke="white" stroke-width="3"/><text x="18" y="22" text-anchor="middle" fill="white" font-size="11" font-weight="bold">나</text></svg>`
        ),
      new kakao.maps.Size(36, 36)
    )
    new kakao.maps.Marker({ map, position: center, image: myImage, zIndex: 10 })

    competitorsWithCoords.slice(0, 10).forEach((c, i) => {
      const isClose = c.distance_m <= 300
      const color = isClose ? '#ef4444' : '#f59e0b'
      const label = String.fromCharCode(65 + i)
      const img = new kakao.maps.MarkerImage(
        'data:image/svg+xml;charset=utf-8,' +
          encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="${color}" stroke="white" stroke-width="2"/><text x="16" y="20" text-anchor="middle" fill="white" font-size="11" font-weight="bold">${label}</text></svg>`
          ),
        new kakao.maps.Size(32, 32)
      )
      const pos = new kakao.maps.LatLng(c.latitude!, c.longitude!)
      const marker = new kakao.maps.Marker({ map, position: pos, image: img })
      const info = new kakao.maps.InfoWindow({
        content: `<div style="padding:8px 10px;font-size:12px;min-width:140px"><b>${c.name}</b><br/>${c.distance_m}m · ${c.clinic_type}${c.rating ? ` · ⭐ ${c.rating}` : ''}</div>`,
      })
      kakao.maps.event.addListener(marker, 'click', () => info.open(map, marker))
    })
  }, [isLoaded, canRenderMap, centerLat, centerLng, radius, competitorsWithCoords])

  if (competitors.length === 0 && sameDeptCount === 0) return null

  if (competitors.length === 0 && sameDeptCount > 0) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Crosshair className="w-5 h-5 text-rose-500" />
          <h3 className="font-semibold text-foreground">경쟁 병원 거리 분포</h3>
          <span className="ml-auto text-[11px] text-muted-foreground">
            {sameDeptCount}개 의원
          </span>
        </div>
        <div className="text-center py-6 text-sm text-muted-foreground">
          <p>
            반경 {radius}m 내 동일과{' '}
            <span className="font-bold text-foreground">{sameDeptCount}개</span> 의원이 존재합니다.
          </p>
          <p className="mt-1 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" />
            상세 위치·거리 정보는 프리미엄에서 확인
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Crosshair className="w-5 h-5 text-rose-500" />
        <h3 className="font-semibold text-foreground">경쟁 병원 거리 분포</h3>
        <span className="ml-auto text-[11px] text-muted-foreground">
          {competitors.length}개 의원
        </span>
      </div>

      {/* PDF 캡처용 placeholder (인쇄 시에만 보임, 캔버스에서는 보임) */}
      <div className="hidden print:block mb-3 p-4 bg-muted/40 rounded-lg border border-border text-center text-xs text-muted-foreground">
        경쟁 의원 위치는 웹에서 카카오맵으로 확인 — 본 PDF에는 거리 리스트로 대체 표시됩니다.
      </div>
      {canRenderMap ? (
        <div
          className="relative w-full h-[360px] rounded-lg overflow-hidden border border-border mb-5 bg-muted/30 print:hidden"
          data-html2canvas-ignore="true"
        >
          <div ref={mapRef} className="w-full h-full" />
          {!isLoaded && !loadError && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          )}
          {loadError && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
              {loadError}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6 text-xs text-muted-foreground mb-3">
          지도에 표시할 좌표 정보가 없습니다.
        </div>
      )}

      <div className="space-y-1.5">
        {competitors.slice(0, 6).map((comp, i) => (
          <div
            key={i}
            className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ${
                comp.distance_m <= 300 ? 'bg-red-500' : 'bg-amber-500'
              }`}
            >
              {String.fromCharCode(65 + i)}
            </div>
            <span className="text-sm text-foreground flex-1">{comp.name}</span>
            {comp.rating && (
              <span className="text-xs text-amber-500 font-medium">{comp.rating}</span>
            )}
            <span
              className={`text-sm font-bold ${
                comp.distance_m <= 300 ? 'text-red-600' : 'text-foreground'
              }`}
            >
              {comp.distance_m}m
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          300m 이내 (위협)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          300m+ (경쟁)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          내 위치
        </span>
      </div>
    </div>
  )
}
