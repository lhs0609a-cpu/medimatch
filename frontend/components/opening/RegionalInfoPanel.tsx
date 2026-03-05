'use client'

import { MapPin, Banknote, Clock, Lightbulb, Phone } from 'lucide-react'
import type { RegionalInfo } from '@/app/checklist/data/task-guides'
import { getRegionDisplayName } from '@/app/checklist/data/task-guides/merge-guide'

interface RegionalInfoPanelProps {
  regionalData: Record<string, RegionalInfo>
  userRegionCode?: string
}

export default function RegionalInfoPanel({ regionalData, userRegionCode }: RegionalInfoPanelProps) {
  if (!regionalData || Object.keys(regionalData).length === 0) return null

  // 사용자 지역 우선 표시, 없으면 전체 표시
  const matchedRegion = userRegionCode && regionalData[userRegionCode]
    ? userRegionCode
    : null

  const regionsToShow = matchedRegion
    ? [matchedRegion]
    : Object.keys(regionalData).slice(0, 3)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
        <MapPin className="w-3.5 h-3.5 text-indigo-500" />
        <span>지역별 정보</span>
        {matchedRegion && (
          <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded">
            내 지역
          </span>
        )}
      </div>
      <div className="space-y-2">
        {regionsToShow.map(code => {
          const info = regionalData[code]
          if (!info) return null
          return (
            <div
              key={code}
              className={`rounded-lg px-3 py-2.5 space-y-1.5 ${
                matchedRegion === code
                  ? 'bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800/40'
                  : 'bg-secondary/30'
              }`}
            >
              <div className="text-xs font-medium text-foreground">
                {getRegionDisplayName(code)}
              </div>
              {info.cost && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Banknote className="w-3 h-3 flex-shrink-0" />
                  <span>비용: {info.cost}</span>
                </div>
              )}
              {info.processingTime && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span>처리기간: {info.processingTime}</span>
                </div>
              )}
              {info.tips && info.tips.length > 0 && (
                <div className="space-y-0.5">
                  {info.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0 text-amber-500" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              )}
              {info.contacts && info.contacts.length > 0 && (
                <div className="space-y-0.5 pt-1 border-t border-border/50">
                  {info.contacts.map((c, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Phone className="w-3 h-3 flex-shrink-0" />
                      <span>{c.organization}{c.phone ? ` ${c.phone}` : ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
