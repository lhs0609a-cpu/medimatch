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

      {/* PDF/인쇄 전용 OSM 타일 지도 (실제 지도 + 마커) */}
      {canRenderMap && (
        <div className="hidden print:block mb-3">
          <TileMap
            centerLat={centerLat!}
            centerLng={centerLng!}
            radius={radius}
            competitors={competitors.slice(0, 10)}
          />
        </div>
      )}
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

interface TileMapProps {
  centerLat: number
  centerLng: number
  radius: number
  competitors: Array<{
    name: string
    latitude?: number | null
    longitude?: number | null
    distance_m: number
  }>
}

// Web Mercator 변환
const lngToTileX = (lng: number, z: number) => ((lng + 180) / 360) * Math.pow(2, z)
const latToTileY = (lat: number, z: number) => {
  const rad = (lat * Math.PI) / 180
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * Math.pow(2, z)
}
const metersPerPixel = (lat: number, z: number) =>
  (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, z)

function TileMap({ centerLat, centerLng, radius, competitors }: TileMapProps) {
  const W = 600
  const H = 360

  // 좌표를 가진 경쟁자 + 거리 계산용 중심까지 거리
  const withCoords = competitors
    .map((c, i) => ({ c, originalIndex: i }))
    .filter(({ c }) => typeof c.latitude === 'number' && typeof c.longitude === 'number')

  // 가장 먼 경쟁자까지 거리 (마커가 모두 보이도록)
  const maxCompDist = withCoords.reduce((m, { c }) => Math.max(m, c.distance_m), 0)

  // 줌 레벨 자동 선택: 마커 클러스터가 뷰포트 60% 차도록
  const targetDiameter = Math.max(maxCompDist * 2.5, 300) // 최소 300m
  const pickZoom = () => {
    for (let z = 19; z >= 10; z--) {
      const mpp = metersPerPixel(centerLat, z)
      const viewportM = Math.min(W, H) * mpp
      if (viewportM >= targetDiameter) return z
    }
    return 10
  }
  const z = pickZoom()
  const mpp = metersPerPixel(centerLat, z)

  // 중심 픽셀 좌표 (월드 그리드)
  const cxWorld = lngToTileX(centerLng, z) * 256
  const cyWorld = latToTileY(centerLat, z) * 256
  const minX = cxWorld - W / 2
  const minY = cyWorld - H / 2

  // 필요한 타일 범위
  const tileMinX = Math.floor(minX / 256)
  const tileMaxX = Math.floor((minX + W) / 256)
  const tileMinY = Math.floor(minY / 256)
  const tileMaxY = Math.floor((minY + H) / 256)

  const tiles: Array<{ x: number; y: number; drawX: number; drawY: number; url: string }> = []
  for (let tx = tileMinX; tx <= tileMaxX; tx++) {
    for (let ty = tileMinY; ty <= tileMaxY; ty++) {
      tiles.push({
        x: tx,
        y: ty,
        drawX: tx * 256 - minX,
        drawY: ty * 256 - minY,
        url: `https://tile.openstreetmap.org/${z}/${tx}/${ty}.png`,
      })
    }
  }

  // 좌표 → 픽셀
  const project = (lat: number, lng: number) => {
    const px = lngToTileX(lng, z) * 256
    const py = latToTileY(lat, z) * 256
    return { x: px - minX, y: py - minY }
  }

  const radiusPx = radius / mpp
  const center = { x: W / 2, y: H / 2 }

  // 마커 (충돌 분산: 24px 이내면 약간 옆으로 밀어서 안 겹치게)
  const placed: Array<{ x: number; y: number }> = []
  const markers = withCoords.map(({ c, originalIndex }) => {
    let { x, y } = project(c.latitude!, c.longitude!)
    const MIN_GAP = 22
    for (const p of placed) {
      const dx = x - p.x, dy = y - p.y
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d < MIN_GAP) {
        const angle = d > 0.1 ? Math.atan2(dy, dx) : (originalIndex * Math.PI) / 3
        const push = MIN_GAP - d + 1
        x += Math.cos(angle) * push
        y += Math.sin(angle) * push
      }
    }
    placed.push({ x, y })
    return {
      x,
      y,
      label: String.fromCharCode(65 + originalIndex),
      isClose: c.distance_m <= 300,
    }
  })

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: `${W} / ${H}`,
        maxWidth: W,
        margin: '0 auto',
        borderRadius: 8,
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        background: '#e8eef3',
      }}
    >
      <div style={{ position: 'relative', width: W, height: H, transformOrigin: 'top left' }}>
        {/* OSM 타일 — CORS 지원, html2canvas 캡처 가능 */}
        {tiles.map((t) => (
          <img
            key={`${t.x}-${t.y}`}
            src={t.url}
            crossOrigin="anonymous"
            alt=""
            style={{
              position: 'absolute',
              left: t.drawX,
              top: t.drawY,
              width: 256,
              height: 256,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
        ))}

        {/* SVG 오버레이: 반경, 내 위치, 경쟁 마커 */}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width={W}
          height={H}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        >
          {/* 반경 원 */}
          <circle
            cx={center.x}
            cy={center.y}
            r={radiusPx}
            fill="#3b82f6"
            fillOpacity="0.08"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeDasharray="6 4"
          />

          {/* 내 위치 */}
          <circle cx={center.x} cy={center.y} r="11" fill="#2563eb" stroke="white" strokeWidth="2.5" />
          <text x={center.x} y={center.y + 3.5} textAnchor="middle" fontSize="10" fill="white" fontWeight="700">
            나
          </text>

          {/* 경쟁 의원 마커 */}
          {markers.map((m, i) => (
            <g key={i}>
              <circle cx={m.x} cy={m.y} r="10" fill={m.isClose ? '#ef4444' : '#f59e0b'} stroke="white" strokeWidth="2" />
              <text x={m.x} y={m.y + 3.5} textAnchor="middle" fontSize="10" fill="white" fontWeight="700">
                {m.label}
              </text>
            </g>
          ))}
        </svg>

        {/* 반경 라벨 */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            fontSize: 11,
            fontWeight: 600,
            color: '#1e40af',
            background: 'rgba(255,255,255,0.85)',
            padding: '2px 8px',
            borderRadius: 4,
          }}
        >
          반경 {radius >= 1000 ? `${(radius / 1000).toFixed(1)}km` : `${radius}m`}
        </div>

        {/* OSM 저작자 표시 (필수) */}
        <div
          style={{
            position: 'absolute',
            bottom: 2,
            right: 4,
            fontSize: 9,
            color: '#475569',
            background: 'rgba(255,255,255,0.8)',
            padding: '1px 4px',
            borderRadius: 2,
          }}
        >
          © OpenStreetMap contributors
        </div>
      </div>
    </div>
  )
}
