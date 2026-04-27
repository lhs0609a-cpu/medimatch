'use client'

import React from 'react'
import { MapPin, Pill, Cross, Banknote, Coffee, Utensils } from 'lucide-react'
import { SimulationResponse } from '@/lib/api/client'

interface Props {
  result: SimulationResponse
}

const FACILITY_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  pharmacy:   { label: '약국',   icon: Pill,     color: 'text-emerald-600' },
  hospital:   { label: '병원·의원', icon: Cross,    color: 'text-rose-600' },
  bank:       { label: '은행',   icon: Banknote, color: 'text-amber-600' },
  cafe:       { label: '카페',   icon: Coffee,   color: 'text-orange-600' },
  restaurant: { label: '음식점', icon: Utensils, color: 'text-blue-600' },
}

export default function NearbyFacilitiesReal({ result }: Props) {
  const counts = result.nearby_facility_counts
  if (!counts) return null

  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  if (total === 0) return null

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-foreground">반경 500m 주변 시설</h3>
        <span className="ml-auto text-[11px] text-muted-foreground">출처: 카카오 Local API</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(counts).map(([key, count]) => {
          const meta = FACILITY_META[key]
          if (!meta) return null
          const Icon = meta.icon
          return (
            <div key={key} className="text-center p-3 bg-muted/40 rounded-xl">
              <Icon className={`w-5 h-5 ${meta.color} mx-auto mb-1`} />
              <div className="text-2xl font-bold text-foreground">{count.toLocaleString()}</div>
              <div className="text-[11px] text-muted-foreground">{meta.label}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
