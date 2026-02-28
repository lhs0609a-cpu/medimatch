'use client'

import { phases } from '@/app/checklist/data/phases'
import {
  ClipboardList, MapPin, FileCheck, Ruler, Stethoscope,
  Users, Megaphone, PartyPopper
} from 'lucide-react'

const PHASE_ICONS: Record<number, React.ElementType> = {
  1: ClipboardList, 2: MapPin, 3: FileCheck, 4: Ruler,
  5: Stethoscope, 6: Users, 7: Megaphone, 8: PartyPopper,
}

interface OpeningTimelineProps {
  activePhase: number
  onPhaseClick: (phaseId: number) => void
  getPhaseStatus: (phaseId: number) => 'completed' | 'active' | 'upcoming'
  getPhaseProgress: (phaseId: number) => { completed: number; total: number; percent: number }
}

export default function OpeningTimeline({
  activePhase, onPhaseClick, getPhaseStatus, getPhaseProgress,
}: OpeningTimelineProps) {
  return (
    <div className="w-full">
      {/* 데스크탑: 가로 스텝퍼 */}
      <div className="hidden md:flex items-start justify-between relative">
        {/* 연결선 */}
        <div className="absolute top-5 left-[40px] right-[40px] h-0.5 bg-border z-0" />
        <div
          className="absolute top-5 left-[40px] h-0.5 bg-primary z-0 transition-all duration-500"
          style={{
            width: `${((Math.max(1, phases.findIndex(p => getPhaseStatus(p.id) !== 'completed') === -1 ? 8 : phases.findIndex(p => getPhaseStatus(p.id) !== 'completed'))) / 7) * (100 - (80 / phases.length))}%`,
          }}
        />

        {phases.map((phase) => {
          const Icon = PHASE_ICONS[phase.id]
          const status = getPhaseStatus(phase.id)
          const { percent } = getPhaseProgress(phase.id)
          const isSelected = activePhase === phase.id

          return (
            <button
              key={phase.id}
              onClick={() => onPhaseClick(phase.id)}
              className="flex flex-col items-center gap-1.5 relative z-10 group w-[80px]"
            >
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                ${status === 'completed'
                  ? 'bg-primary text-white shadow-md shadow-primary/30'
                  : status === 'active'
                    ? 'bg-primary/20 text-primary ring-2 ring-primary ring-offset-2'
                    : 'bg-secondary text-muted-foreground'
                }
                ${isSelected ? 'scale-110' : 'group-hover:scale-105'}
              `}>
                <Icon className="w-4.5 h-4.5" />
              </div>
              <div className="text-center">
                <div className={`text-[10px] font-semibold leading-tight ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                  {phase.title}
                </div>
                {status !== 'upcoming' && (
                  <div className="text-[9px] text-muted-foreground mt-0.5">
                    {percent}%
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* 모바일: 수평 스크롤 */}
      <div className="md:hidden overflow-x-auto pb-2 -mx-1">
        <div className="flex gap-2 px-1 min-w-max">
          {phases.map((phase) => {
            const Icon = PHASE_ICONS[phase.id]
            const status = getPhaseStatus(phase.id)
            const { percent } = getPhaseProgress(phase.id)
            const isSelected = activePhase === phase.id

            return (
              <button
                key={phase.id}
                onClick={() => onPhaseClick(phase.id)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap
                  transition-all duration-200
                  ${isSelected
                    ? 'bg-primary text-white shadow-md'
                    : status === 'completed'
                      ? 'bg-primary/10 text-primary'
                      : status === 'active'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                        : 'bg-secondary text-muted-foreground'
                  }
                `}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{phase.title}</span>
                {status !== 'upcoming' && (
                  <span className={`text-[10px] ${isSelected ? 'text-white/80' : ''}`}>
                    {percent}%
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
