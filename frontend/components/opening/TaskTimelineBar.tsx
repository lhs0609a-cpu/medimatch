'use client'

import { Clock, CalendarCheck, Timer, Leaf, MapPin, AlertCircle } from 'lucide-react'
import type { TaskTimeline } from '@/app/checklist/data/task-guides'

interface TaskTimelineBarProps {
  timeline: TaskTimeline
}

export default function TaskTimelineBar({ timeline }: TaskTimelineBarProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
        <Clock className="w-3.5 h-3.5 text-teal-500" />
        <span>타임라인</span>
      </div>
      <div className="bg-teal-50 dark:bg-teal-900/10 rounded-lg px-3 py-2 space-y-1.5">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <div className="flex items-center gap-1.5">
            <CalendarCheck className="w-3 h-3 text-teal-600 dark:text-teal-400" />
            <span className="text-xs text-teal-700 dark:text-teal-300">
              <span className="font-medium">시작:</span> {timeline.recommendedStart}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Timer className="w-3 h-3 text-teal-600 dark:text-teal-400" />
            <span className="text-xs text-teal-700 dark:text-teal-300">
              <span className="font-medium">소요:</span> {timeline.duration}
              {timeline.durationRange && (
                <span className="text-muted-foreground ml-1">
                  ({timeline.durationRange[0]}~{timeline.durationRange[1]}일)
                </span>
              )}
            </span>
          </div>
          {timeline.deadline && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-teal-600 dark:text-teal-400" />
              <span className="text-xs text-teal-700 dark:text-teal-300">
                <span className="font-medium">마감:</span> {timeline.deadline}
              </span>
            </div>
          )}
        </div>
        {timeline.seasonalTip && (
          <div className="flex items-start gap-1.5 pt-1 border-t border-teal-200/50 dark:border-teal-700/30">
            <Leaf className="w-3 h-3 text-teal-500 mt-0.5 flex-shrink-0" />
            <span className="text-xs text-teal-600 dark:text-teal-400">{timeline.seasonalTip}</span>
          </div>
        )}
        {timeline.seasonalImpact && timeline.seasonalImpact.length > 0 && (
          <div className="flex items-start gap-1.5 pt-1 border-t border-teal-200/50 dark:border-teal-700/30">
            <AlertCircle className="w-3 h-3 text-teal-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-teal-600 dark:text-teal-400">
              <span className="font-medium">계절 영향:</span>{' '}
              {timeline.seasonalImpact.join(' / ')}
            </div>
          </div>
        )}
        {timeline.regionalVariation && (
          <div className="flex items-start gap-1.5 pt-1 border-t border-teal-200/50 dark:border-teal-700/30">
            <MapPin className="w-3 h-3 text-teal-500 mt-0.5 flex-shrink-0" />
            <span className="text-xs text-teal-600 dark:text-teal-400">{timeline.regionalVariation}</span>
          </div>
        )}
      </div>
    </div>
  )
}
