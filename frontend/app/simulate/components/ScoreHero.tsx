'use client'

import React from 'react'
import { CheckCircle2, MinusCircle, AlertCircle, Database } from 'lucide-react'
import { SimulationResponse } from '@/lib/api/client'
import ScoreGauge from './ScoreGauge'

interface ScoreHeroProps {
  result: SimulationResponse
}

function getGaugeColor(rec: string): string {
  switch (rec) {
    case 'VERY_POSITIVE': return '#16a34a'
    case 'POSITIVE': return '#22c55e'
    case 'NEUTRAL': return '#f59e0b'
    case 'NEGATIVE': return '#ef4444'
    case 'VERY_NEGATIVE': return '#dc2626'
    default: return '#3b82f6'
  }
}

function getBadgeStyle(rec: string): string {
  switch (rec) {
    case 'VERY_POSITIVE':
    case 'POSITIVE':
      return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
    case 'NEUTRAL':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
    case 'NEGATIVE':
    case 'VERY_NEGATIVE':
      return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
    default:
      return 'bg-secondary text-secondary-foreground'
  }
}

function getRecommendationText(rec: string): string {
  switch (rec) {
    case 'VERY_POSITIVE': return '매우 긍정적'
    case 'POSITIVE': return '긍정적'
    case 'NEUTRAL': return '보통'
    case 'NEGATIVE': return '부정적'
    case 'VERY_NEGATIVE': return '매우 부정적'
    default: return rec
  }
}

function getRecommendationIcon(rec: string): React.ReactNode {
  switch (rec) {
    case 'VERY_POSITIVE':
    case 'POSITIVE':
      return <CheckCircle2 className="w-5 h-5" />
    case 'NEUTRAL':
      return <MinusCircle className="w-5 h-5" />
    default:
      return <AlertCircle className="w-5 h-5" />
  }
}

const dataSources = [
  { name: '심평원', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { name: '국토부', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
  { name: '소상공인진흥공단', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' },
]

export default function ScoreHero({ result }: ScoreHeroProps) {
  const gaugeColor = getGaugeColor(result.recommendation)

  return (
    <div className="card p-6 md:p-8">
      <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
        {/* Gauge */}
        <div className="flex-shrink-0">
          <ScoreGauge
            score={result.confidence_score}
            max={100}
            size={160}
            color={gaugeColor}
            label="신뢰도"
          />
        </div>

        {/* Content */}
        <div className="flex-1 text-center md:text-left">
          {/* Badge */}
          <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${getBadgeStyle(result.recommendation)}`}>
              {getRecommendationIcon(result.recommendation)}
              개원 추천: {getRecommendationText(result.recommendation)}
            </span>
          </div>

          {/* Reason */}
          <p className="text-foreground leading-relaxed mb-4">
            {result.recommendation_reason}
          </p>

          {/* Data Sources */}
          <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mr-1">
              <Database className="w-3 h-3" />
              <span>데이터 출처:</span>
            </div>
            {dataSources.map((src) => (
              <span key={src.name} className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${src.color}`}>
                {src.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
