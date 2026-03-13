'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ClipboardList, MapPin, FileCheck, Ruler, Stethoscope,
  Users, Megaphone, PartyPopper, Check, ChevronDown, ChevronUp,
  ArrowRight, Lightbulb, Brain, ChevronRight, MessageSquareQuote,
  Globe, Building2, FileText, Wrench, ExternalLink, TrendingUp,
} from 'lucide-react'
import type { TaskResource } from '@/app/checklist/data/task-guides'
import TaskTimelineBar from './TaskTimelineBar'
import TaskBenchmarks from './TaskBenchmarks'
import { type Phase, getPhaseCost } from '@/app/checklist/data/phases'
import { getPhaseFunnelConfig } from '@/app/checklist/data/emr-funnel-config'
import { taskGuides } from '@/app/checklist/data/task-guides'
import { getDisplayCost } from '@/app/checklist/data/specialty-filter'
import TaskQuizIndicator from './gamification/TaskQuizIndicator'

const PHASE_ICONS: Record<number, React.ElementType> = {
  1: ClipboardList, 2: MapPin, 3: FileCheck, 4: Ruler,
  5: Stethoscope, 6: Users, 7: Megaphone, 8: PartyPopper,
  9: TrendingUp,
}

interface JourneyPhaseCardProps {
  phase: Phase
  status: 'completed' | 'active' | 'upcoming'
  progress: { completed: number; total: number; percent: number }
  completedTasks: string[]
  onToggle: (subtaskId: string) => void
  focused?: boolean
  getTaskQuizScore?: (taskId: string) => number | null
  onQuizClick?: (taskId: string) => void
  phaseQuizAverage?: number
}

export default function JourneyPhaseCard({
  phase, status, progress, completedTasks, onToggle, focused = false,
  getTaskQuizScore, onQuizClick, phaseQuizAverage,
}: JourneyPhaseCardProps) {
  const [expanded, setExpanded] = useState(focused || status === 'active')
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const Icon = PHASE_ICONS[phase.id] || ClipboardList
  const funnelConfig = getPhaseFunnelConfig(phase.id)
  const phaseCost = getPhaseCost(phase)
  const highlightTool = funnelConfig?.tools.find(t => t.highlight)

  // 비활성 Phase는 압축된 형태로 보여줌
  if (!focused && status !== 'active') {
    return (
      <div
        id={`phase-${phase.id}`}
        className={`
          bg-card rounded-2xl border-2 transition-all duration-300
          ${status === 'completed'
            ? 'border-green-200 dark:border-green-800/50'
            : 'border-border opacity-60'
          }
        `}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left px-6 py-5 flex items-center gap-4"
        >
          <div className={`
            w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0
            ${status === 'completed'
              ? 'bg-green-500 text-white'
              : 'bg-secondary text-muted-foreground'
            }
          `}>
            {status === 'completed' ? (
              <Check className="w-7 h-7" />
            ) : (
              <Icon className="w-7 h-7" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Phase {phase.id}</span>
              {status === 'completed' && (
                <span className="text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded">
                  완료
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold mt-0.5">{phase.title}</h3>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            <span className="text-base font-semibold">{progress.completed}/{progress.total}</span>
            <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress.percent}%`,
                  backgroundColor: status === 'completed' ? '#22c55e' : phase.color,
                }}
              />
            </div>
            {expanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </div>
        </button>

        {expanded && (
          <div className="px-6 pb-5 border-t border-border/50 pt-4">
            <div className="space-y-2">
              {phase.subtasks.map((task) => {
                const isCompleted = completedTasks.includes(task.id)
                return (
                  <div key={task.id} className="flex items-center gap-3 py-1">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${isCompleted ? 'bg-green-500 text-white' : 'border-2 border-muted-foreground/30'}`}>
                      {isCompleted && <Check className="w-4 h-4" />}
                    </div>
                    <span className={`text-base ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>{task.title}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  // 활성 Phase — 집중 모드 (큰 글자, 넓은 패딩)
  return (
    <div
      id={`phase-${phase.id}`}
      className="bg-card rounded-3xl border-2 border-primary ring-4 ring-primary/10 transition-all duration-300 overflow-hidden"
    >
      {/* Card Header */}
      <div className="px-8 py-6 flex items-center gap-5">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 text-white"
          style={{ backgroundColor: phase.color }}
        >
          <Icon className="w-8 h-8" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-muted-foreground">Phase {phase.id}</span>
            <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-lg">
              진행중
            </span>
            {phaseQuizAverage !== undefined && phaseQuizAverage > 0 && (
              <span className="text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-600 px-2.5 py-1 rounded-lg flex items-center gap-1">
                <Brain className="w-3.5 h-3.5" />
                이해도 {phaseQuizAverage}%
              </span>
            )}
          </div>
          <h3 className="text-2xl font-bold mt-1">{phase.title}</h3>
          <p className="text-base text-muted-foreground mt-1">{phase.description}</p>
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className="text-xl font-bold">{progress.completed}/{progress.total}</span>
          <div className="w-28 h-2.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress.percent}%`, backgroundColor: phase.color }}
            />
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="px-8 pb-8 space-y-3 border-t border-border/50 pt-5">
        {phase.subtasks.map((task) => {
          const isCompleted = completedTasks.includes(task.id)
          const guide = taskGuides[task.id]
          const quizScore = getTaskQuizScore?.(task.id) ?? null
          const isTaskExpanded = expandedTaskId === task.id

          return (
            <div
              key={task.id}
              className={`px-5 py-4 rounded-2xl transition-colors ${
                isCompleted ? 'bg-green-50 dark:bg-green-900/10' : 'bg-secondary/30 hover:bg-secondary/60'
              }`}
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => onToggle(task.id)}
                  className={`
                    w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all
                    ${isCompleted
                      ? 'bg-green-500 text-white'
                      : 'border-2 border-muted-foreground/30 hover:border-primary'
                    }
                  `}
                >
                  {isCompleted && <Check className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => !isCompleted && guide && setExpandedTaskId(isTaskExpanded ? null : task.id)}
                  className={`text-lg flex-1 text-left font-medium ${isCompleted ? 'line-through text-muted-foreground' : 'cursor-pointer'}`}
                  disabled={isCompleted || !guide}
                >
                  {task.title}
                </button>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {isCompleted && (
                    <TaskQuizIndicator
                      taskId={task.id}
                      quizScore={quizScore}
                      onClick={() => onQuizClick?.(task.id)}
                    />
                  )}
                  {(() => {
                    const cost = getDisplayCost(task)
                    return cost ? (
                      <span className="text-sm text-muted-foreground bg-secondary px-3 py-1 rounded-lg">
                        {cost}
                      </span>
                    ) : null
                  })()}
                  {!isCompleted && guide && (
                    <ChevronRight
                      className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${isTaskExpanded ? 'rotate-90' : ''}`}
                    />
                  )}
                </div>
              </div>

              {/* Tip preview */}
              {guide && !isCompleted && !isTaskExpanded && (
                <div className="flex items-center gap-2 ml-11 mt-2">
                  <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground line-clamp-1">{guide.tips[0]}</span>
                </div>
              )}

              {/* Inline guide expansion */}
              {isTaskExpanded && guide && (
                <div className="ml-11 mt-4 mb-1 space-y-3">
                  {guide.timeline && <TaskTimelineBar timeline={guide.timeline} />}

                  {guide.expertAdvice && (
                    <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl px-4 py-3">
                      <MessageSquareQuote className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">{guide.expertAdvice}</span>
                    </div>
                  )}

                  {guide.resources && guide.resources.length > 0 && (
                    <InlineResources resources={guide.resources.slice(0, 3)} />
                  )}

                  {guide.benchmarks && guide.benchmarks.length > 0 && (
                    <TaskBenchmarks benchmarks={guide.benchmarks.slice(0, 3)} />
                  )}

                  <Link
                    href={`/opening-project/phase/${phase.id}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline pt-1"
                  >
                    전체 가이드 보기 <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          )
        })}

        {/* Recommended Tool */}
        {highlightTool && (
          <Link
            href={highlightTool.href}
            className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center flex-shrink-0">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-base font-semibold text-primary">{highlightTool.name}</div>
              <div className="text-sm text-muted-foreground">{highlightTool.description}</div>
            </div>
            <ArrowRight className="w-5 h-5 text-primary flex-shrink-0" />
          </Link>
        )}

        {/* Phase Detail Link */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-muted-foreground">
            예상 비용: {phaseCost > 0 ? `${phaseCost.toLocaleString()}만원` : '없음'} · {phase.duration}개월
          </span>
          <Link
            href={`/opening-project/phase/${phase.id}`}
            className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
          >
            상세 가이드 보기 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

const RESOURCE_TYPE_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  website: { icon: Globe, color: 'text-blue-500' },
  government: { icon: Building2, color: 'text-green-600' },
  template: { icon: FileText, color: 'text-orange-500' },
  tool: { icon: Wrench, color: 'text-blue-500' },
  community: { icon: Users, color: 'text-blue-500' },
}

function InlineResources({ resources }: { resources: TaskResource[] }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Globe className="w-4 h-4 text-blue-500" />
        <span>핵심 리소스</span>
      </div>
      <div className="space-y-1.5">
        {resources.map((r, i) => {
          const config = RESOURCE_TYPE_ICONS[r.type] || RESOURCE_TYPE_ICONS.website
          const RIcon = config.icon
          return (
            <div key={i} className="flex items-center gap-2 text-sm">
              <RIcon className={`w-4 h-4 flex-shrink-0 ${config.color}`} />
              {r.url ? (
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                  {r.name}
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="font-medium">{r.name}</span>
              )}
              <span className="text-muted-foreground truncate">— {r.description}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
