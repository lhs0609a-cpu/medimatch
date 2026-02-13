'use client'

import { Phase } from '../data/phases'

interface TimelineViewProps {
  phases: Phase[]
  completedTasks: string[]
}

const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

export default function TimelineView({ phases, completedTasks }: TimelineViewProps) {
  const getPhaseProgress = (phase: Phase) => {
    const done = phase.subtasks.filter((t) => completedTasks.includes(t.id)).length
    return phase.subtasks.length > 0 ? done / phase.subtasks.length : 0
  }

  return (
    <div className="card p-5 overflow-x-auto">
      <h3 className="font-semibold text-foreground mb-4">12개월 타임라인</h3>
      <div className="min-w-[700px]">
        {/* Month headers */}
        <div className="grid grid-cols-12 gap-1 mb-3">
          {months.map((m, i) => (
            <div key={i} className="text-center text-xs text-muted-foreground font-medium">
              {m}
            </div>
          ))}
        </div>

        {/* Phase bars */}
        <div className="space-y-2">
          {phases.map((phase) => {
            const progress = getPhaseProgress(phase)
            const startCol = phase.month
            const span = phase.duration

            return (
              <div key={phase.id} className="grid grid-cols-12 gap-1 items-center">
                {Array.from({ length: 12 }, (_, i) => {
                  const monthNum = i + 1
                  const isInRange = monthNum >= startCol && monthNum < startCol + span

                  if (!isInRange) {
                    return <div key={i} className="h-8" />
                  }

                  const isStart = monthNum === startCol
                  const isEnd = monthNum === startCol + span - 1

                  return (
                    <div
                      key={i}
                      className={`h-8 relative overflow-hidden ${
                        isStart ? 'rounded-l-md' : ''
                      } ${isEnd ? 'rounded-r-md' : ''}`}
                      style={{ backgroundColor: `${phase.color}20` }}
                    >
                      <div
                        className="absolute inset-y-0 left-0 transition-all duration-500"
                        style={{
                          width: `${progress * 100}%`,
                          backgroundColor: `${phase.color}60`,
                        }}
                      />
                      {isStart && (
                        <span
                          className="absolute inset-0 flex items-center px-2 text-xs font-medium truncate z-10"
                          style={{ color: phase.color }}
                        >
                          {phase.title}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t">
          {phases.map((phase) => (
            <div key={phase.id} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: phase.color }} />
              <span className="text-xs text-muted-foreground">{phase.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
