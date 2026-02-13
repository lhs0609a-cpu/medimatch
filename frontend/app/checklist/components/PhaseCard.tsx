'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Check, Clock, Lightbulb, Coins } from 'lucide-react'
import { Phase, getPhaseCost } from '../data/phases'

interface PhaseCardProps {
  phase: Phase
  completedTasks: string[]
  onToggleTask: (taskId: string) => void
}

export default function PhaseCard({ phase, completedTasks, onToggleTask }: PhaseCardProps) {
  const [expanded, setExpanded] = useState(false)
  const phaseCost = getPhaseCost(phase)
  const completedCount = phase.subtasks.filter((t) => completedTasks.includes(t.id)).length
  const totalCount = phase.subtasks.length
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 flex items-center gap-4 text-left hover:bg-muted/50 transition-colors"
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${phase.color}15`, color: phase.color }}
        >
          <span className="text-lg font-bold">{phase.id}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">{phase.title}</h3>
            {progress === 100 && (
              <span className="badge-success text-xs px-2 py-0.5 rounded-full">완료</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">{phase.description}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {phase.month}~{phase.month + phase.duration - 1}월
            </span>
            {phaseCost > 0 && (
              <span className="flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" />
                {phaseCost >= 10000
                  ? `${(phaseCost / 10000).toFixed(1)}억원`
                  : `${phaseCost.toLocaleString()}만원`}
              </span>
            )}
            <span>
              {completedCount}/{totalCount} 완료
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:block w-24">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, backgroundColor: phase.color }}
              />
            </div>
          </div>
          {expanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t px-5 py-4 space-y-3">
          {phase.subtasks.map((task) => {
            const isDone = completedTasks.includes(task.id)
            return (
              <div
                key={task.id}
                className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                  isDone ? 'bg-green-50 dark:bg-green-950/20' : 'bg-muted/30 hover:bg-muted/50'
                }`}
              >
                <button
                  onClick={() => onToggleTask(task.id)}
                  className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isDone
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-muted-foreground/30 hover:border-primary'
                  }`}
                >
                  {isDone && <Check className="w-3.5 h-3.5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {task.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      약 {task.estimatedDays}일
                    </span>
                    {task.estimatedCost !== undefined && task.estimatedCost > 0 && (
                      <span className="flex items-center gap-1">
                        <Coins className="w-3 h-3" />
                        ~{task.estimatedCost.toLocaleString()}만원
                      </span>
                    )}
                  </div>
                  {task.tips && (
                    <div className="flex items-start gap-1.5 mt-2 text-xs text-amber-600 dark:text-amber-400">
                      <Lightbulb className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>{task.tips}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
