'use client'

import React from 'react'
import { Crosshair, Lock } from 'lucide-react'
import { SimulationResponse } from '@/lib/api/client'

interface CompetitorDistanceProps {
  result: SimulationResponse
}

export default function CompetitorDistance({ result }: CompetitorDistanceProps) {
  const competitors = result.competitors || []
  const radius = result.competition.radius_m
  const sameDeptCount = result.competition.same_dept_count

  if (competitors.length === 0 && sameDeptCount === 0) return null

  if (competitors.length === 0 && sameDeptCount > 0) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Crosshair className="w-5 h-5 text-rose-500" />
          <h3 className="font-semibold text-foreground">경쟁 병원 거리 분포</h3>
          <span className="ml-auto text-[11px] text-muted-foreground">{sameDeptCount}개 의원</span>
        </div>
        <div className="text-center py-6 text-sm text-muted-foreground">
          <p>반경 {radius}m 내 동일과 <span className="font-bold text-foreground">{sameDeptCount}개</span> 의원이 존재합니다.</p>
          <p className="mt-1 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" />
            상세 위치·거리 정보는 프리미엄에서 확인
          </p>
        </div>
      </div>
    )
  }

  const maxDistance = Math.max(...competitors.map((c) => c.distance_m), radius)
  const ringDistances = [250, 500, 750, 1000].filter((d) => d <= maxDistance + 100)

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Crosshair className="w-5 h-5 text-rose-500" />
        <h3 className="font-semibold text-foreground">경쟁 병원 거리 분포</h3>
        <span className="ml-auto text-[11px] text-muted-foreground">{competitors.length}개 의원</span>
      </div>

      {/* Concentric Circle Map */}
      <div className="flex justify-center mb-5">
        <div className="relative" style={{ width: 300, height: 300 }}>
          <svg viewBox="0 0 300 300" className="w-full h-full">
            {/* Rings */}
            {ringDistances.map((d) => {
              const r = (d / maxDistance) * 130
              return (
                <g key={d}>
                  <circle
                    cx="150"
                    cy="150"
                    r={r}
                    fill="none"
                    stroke="var(--border, #e5e7eb)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={150 + r + 4}
                    y={148}
                    fontSize="9"
                    fill="var(--muted-foreground, #6b7280)"
                  >
                    {d}m
                  </text>
                </g>
              )
            })}

            {/* Analysis radius */}
            <circle
              cx="150"
              cy="150"
              r={(radius / maxDistance) * 130}
              fill="rgba(59, 130, 246, 0.05)"
              stroke="#3b82f6"
              strokeWidth="1.5"
              strokeDasharray="6 3"
            />

            {/* Competitors */}
            {competitors.slice(0, 8).map((comp, i) => {
              const angle = (i / Math.min(competitors.length, 8)) * 2 * Math.PI - Math.PI / 2
              const r = (comp.distance_m / maxDistance) * 130
              const x = 150 + r * Math.cos(angle)
              const y = 150 + r * Math.sin(angle)
              const isClose = comp.distance_m <= 300

              return (
                <g key={i}>
                  <circle
                    cx={x}
                    cy={y}
                    r={8}
                    fill={isClose ? '#ef4444' : '#f59e0b'}
                    opacity={0.9}
                  />
                  <text
                    x={x}
                    y={y + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="8"
                    fontWeight="bold"
                    fill="white"
                  >
                    {String.fromCharCode(65 + i)}
                  </text>
                  {/* Label */}
                  <text
                    x={x + (x > 150 ? 12 : -12)}
                    y={y - 12}
                    textAnchor={x > 150 ? 'start' : 'end'}
                    fontSize="9"
                    fill="var(--foreground, #111)"
                    fontWeight="500"
                  >
                    {comp.name.slice(0, 6)}
                  </text>
                </g>
              )
            })}

            {/* Center - My clinic */}
            <circle cx="150" cy="150" r="10" fill="#3b82f6" />
            <text x="150" y="151" textAnchor="middle" dominantBaseline="middle" fontSize="7" fontWeight="bold" fill="white">
              나
            </text>
          </svg>
        </div>
      </div>

      {/* Distance List */}
      <div className="space-y-1.5">
        {competitors.slice(0, 6).map((comp, i) => (
          <div key={i} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors">
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
            <span className={`text-sm font-bold ${comp.distance_m <= 300 ? 'text-red-600' : 'text-foreground'}`}>
              {comp.distance_m}m
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />300m 이내 (위협)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />300m+ (경쟁)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />내 위치
        </span>
      </div>
    </div>
  )
}
