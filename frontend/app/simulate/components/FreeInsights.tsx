'use client'

import React from 'react'
import { Target, Users, MapPin } from 'lucide-react'
import { SimulationResponse } from '@/lib/api/client'

interface FreeInsightsProps {
  result: SimulationResponse
}

function getCompetitionLevel(count: number): { text: string; ratio: number; color: string } {
  if (count <= 2) return { text: '경쟁 매우 적음', ratio: 20, color: 'bg-green-500' }
  if (count <= 4) return { text: '경쟁 적음', ratio: 40, color: 'bg-green-400' }
  if (count <= 7) return { text: '보통 수준', ratio: 60, color: 'bg-amber-400' }
  if (count <= 10) return { text: '경쟁 다소 많음', ratio: 75, color: 'bg-orange-400' }
  return { text: '경쟁 치열', ratio: 90, color: 'bg-red-500' }
}

function getPopulationLevel(pop: number): { text: string; ratio: number; color: string } {
  if (pop >= 60000) return { text: '인구 매우 풍부', ratio: 90, color: 'bg-green-500' }
  if (pop >= 40000) return { text: '인구 풍부', ratio: 70, color: 'bg-green-400' }
  if (pop >= 20000) return { text: '보통 수준', ratio: 50, color: 'bg-amber-400' }
  if (pop >= 10000) return { text: '다소 적음', ratio: 30, color: 'bg-orange-400' }
  return { text: '인구 적음', ratio: 15, color: 'bg-red-500' }
}

function getFloatingLevel(pop: number): { text: string; ratio: number; color: string } {
  if (pop >= 100000) return { text: '유동인구 매우 풍부', ratio: 90, color: 'bg-green-500' }
  if (pop >= 70000) return { text: '유동인구 풍부', ratio: 70, color: 'bg-green-400' }
  if (pop >= 40000) return { text: '보통 수준', ratio: 50, color: 'bg-amber-400' }
  if (pop >= 20000) return { text: '다소 적음', ratio: 30, color: 'bg-orange-400' }
  return { text: '유동인구 적음', ratio: 15, color: 'bg-red-500' }
}

export default function FreeInsights({ result }: FreeInsightsProps) {
  const comp = getCompetitionLevel(result.competition.same_dept_count)
  const pop = getPopulationLevel(result.demographics.population_1km)
  const floating = getFloatingLevel(result.demographics.floating_population_daily)
  const age40PlusPercent = Math.round(result.demographics.age_40_plus_ratio * 100)

  const insights = [
    {
      icon: <Target className="w-5 h-5 text-rose-500" />,
      title: '경쟁 현황',
      stat: `${result.competition.same_dept_count}개`,
      statLabel: `반경 ${result.competition.radius_m}m 동일과`,
      description: comp.text,
      ratio: comp.ratio,
      barColor: comp.color,
    },
    {
      icon: <Users className="w-5 h-5 text-blue-500" />,
      title: '주변 인구',
      stat: `${(result.demographics.population_1km / 10000).toFixed(1)}만`,
      statLabel: `1km 인구, 40대+ ${age40PlusPercent}%`,
      description: pop.text,
      ratio: pop.ratio,
      barColor: pop.color,
    },
    {
      icon: <MapPin className="w-5 h-5 text-emerald-500" />,
      title: '유동인구',
      stat: `${(result.demographics.floating_population_daily / 10000).toFixed(1)}만`,
      statLabel: '일 유동인구',
      description: floating.text,
      ratio: floating.ratio,
      barColor: floating.color,
    },
  ]

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {insights.map((item) => (
        <div key={item.title} className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            {item.icon}
            <h3 className="font-medium text-foreground text-sm">{item.title}</h3>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-bold text-foreground">{item.stat}</span>
            <span className="text-xs text-muted-foreground">{item.statLabel}</span>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">{item.description}</span>
              <span className="text-xs font-medium text-muted-foreground">{item.ratio}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${item.barColor}`}
                style={{ width: `${item.ratio}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
