'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ClipboardList, MapPin, FileCheck, Ruler, Stethoscope,
  Users, Megaphone, PartyPopper, Check, ChevronDown, ChevronUp,
  ArrowRight,
} from 'lucide-react'
import { type Phase, getPhaseCost } from '@/app/checklist/data/phases'
import { getPhaseFunnelConfig } from '@/app/checklist/data/emr-funnel-config'

const PHASE_ICONS: Record<number, React.ElementType> = {
  1: ClipboardList, 2: MapPin, 3: FileCheck, 4: Ruler,
  5: Stethoscope, 6: Users, 7: Megaphone, 8: PartyPopper,
}

interface JourneyPhaseCardProps {
  phase: Phase
  status: 'completed' | 'active' | 'upcoming'
  progress: { completed: number; total: number; percent: number }
  completedTasks: string[]
  onToggle: (subtaskId: string) => void
}

export default function JourneyPhaseCard({
  phase, status, progress, completedTasks, onToggle,
}: JourneyPhaseCardProps) {
  const [expanded, setExpanded] = useState(status === 'active')
  const Icon = PHASE_ICONS[phase.id] || ClipboardList
  const funnelConfig = getPhaseFunnelConfig(phase.id)
  const phaseCost = getPhaseCost(phase)
  const highlightTool = funnelConfig?.tools.find(t => t.highlight)

  return (
    <div
      id={`phase-${phase.id}`}
      className={`
        bg-card rounded-2xl border-2 transition-all duration-300 overflow-hidden
        ${status === 'completed'
          ? 'border-green-200 dark:border-green-800/50'
          : status === 'active'
            ? 'border-primary ring-2 ring-primary/20'
            : 'border-border'
        }
      `}
    >
      {/* Card Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-5 py-4 flex items-center gap-4"
      >
        {/* Phase Icon */}
        <div className={`
          w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors
          ${status === 'completed'
            ? 'bg-green-500 text-white'
            : status === 'active'
              ? 'text-white'
              : 'bg-secondary text-muted-foreground'
          }
        `}
          style={status === 'active' ? { backgroundColor: phase.color } : undefined}
        >
          {status === 'completed' ? (
            <Check className="w-6 h-6" />
          ) : (
            <Icon className="w-6 h-6" />
          )}
        </div>

        {/* Phase Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Phase {phase.id}</span>
            {status === 'completed' && (
              <span className="text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded">
                완료
              </span>
            )}
            {status === 'active' && (
              <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                진행중
              </span>
            )}
          </div>
          <h3 className="text-base font-bold mt-0.5">{phase.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{phase.description}</p>
        </div>

        {/* Progress + Expand */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="hidden sm:flex flex-col items-end gap-1">
            <span className="text-xs font-medium">{progress.completed}/{progress.total}</span>
            <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress.percent}%`,
                  backgroundColor: status === 'completed' ? '#22c55e' : phase.color,
                }}
              />
            </div>
          </div>
          {expanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-5 pb-5 space-y-3 border-t border-border/50 pt-3">
          {/* Subtask Checklist (compact) */}
          <div className="space-y-1.5">
            {phase.subtasks.map((task) => {
              const isCompleted = completedTasks.includes(task.id)
              return (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                    isCompleted ? 'bg-green-50 dark:bg-green-900/10' : 'hover:bg-secondary/50'
                  }`}
                >
                  <button
                    onClick={() => onToggle(task.id)}
                    className={`
                      w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all
                      ${isCompleted
                        ? 'bg-green-500 text-white'
                        : 'border-2 border-muted-foreground/30 hover:border-primary'
                      }
                    `}
                  >
                    {isCompleted && <Check className="w-3 h-3" />}
                  </button>
                  <span className={`text-sm flex-1 ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                    {task.title}
                  </span>
                  {task.estimatedCost !== undefined && task.estimatedCost > 0 && (
                    <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded flex-shrink-0">
                      ~{task.estimatedCost.toLocaleString()}만
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Recommended Tool (single highlight) */}
          {highlightTool && (
            <Link
              href={highlightTool.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center flex-shrink-0">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-primary">{highlightTool.name}</div>
                <div className="text-xs text-muted-foreground">{highlightTool.description}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
            </Link>
          )}

          {/* Phase Detail Link */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">
              예상 비용: {phaseCost > 0 ? `${phaseCost.toLocaleString()}만원` : '없음'} · {phase.duration}개월
            </span>
            <Link
              href={`/opening-project/phase/${phase.id}`}
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              상세 가이드 보기 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
