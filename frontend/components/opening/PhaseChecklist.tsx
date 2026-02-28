'use client'

import { useState } from 'react'
import { phases, type Phase, type SubTask } from '@/app/checklist/data/phases'
import { Check, ChevronDown, ChevronUp, Lightbulb, Banknote, StickyNote } from 'lucide-react'

interface PhaseChecklistProps {
  phaseId: number
  completedTasks: string[]
  actualCosts: Record<string, number>
  memos: Record<string, string>
  onToggle: (subtaskId: string) => void
  onCostChange?: (subtaskId: string, cost: number) => void
  onMemoChange?: (subtaskId: string, memo: string) => void
}

export default function PhaseChecklist({
  phaseId, completedTasks, actualCosts, memos,
  onToggle, onCostChange, onMemoChange,
}: PhaseChecklistProps) {
  const phase = phases.find(p => p.id === phaseId)
  if (!phase) return null

  const completedCount = phase.subtasks.filter(s => completedTasks.includes(s.id)).length

  return (
    <div>
      {/* Phase 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold">{phase.title}</h3>
          <p className="text-sm text-muted-foreground">{phase.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {completedCount}/{phase.subtasks.length}
          </span>
          <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / phase.subtasks.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* 서브태스크 리스트 */}
      <div className="space-y-2">
        {phase.subtasks.map((task) => (
          <ChecklistItem
            key={task.id}
            task={task}
            isCompleted={completedTasks.includes(task.id)}
            actualCost={actualCosts[task.id]}
            memo={memos[task.id] || ''}
            phaseColor={phase.color}
            onToggle={() => onToggle(task.id)}
            onCostChange={onCostChange ? (cost) => onCostChange(task.id, cost) : undefined}
            onMemoChange={onMemoChange ? (memo) => onMemoChange(task.id, memo) : undefined}
          />
        ))}
      </div>
    </div>
  )
}

function ChecklistItem({
  task, isCompleted, actualCost, memo, phaseColor,
  onToggle, onCostChange, onMemoChange,
}: {
  task: SubTask
  isCompleted: boolean
  actualCost?: number
  memo: string
  phaseColor: string
  onToggle: () => void
  onCostChange?: (cost: number) => void
  onMemoChange?: (memo: string) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`
      rounded-xl border transition-all duration-200
      ${isCompleted
        ? 'bg-primary/5 border-primary/20'
        : 'bg-card border-border hover:border-primary/30'
      }
    `}>
      {/* 메인 행 */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={onToggle}
          className={`
            w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0
            transition-all duration-200
            ${isCompleted
              ? 'bg-primary text-white'
              : 'border-2 border-muted-foreground/30 hover:border-primary'
            }
          `}
        >
          {isCompleted && <Check className="w-3.5 h-3.5" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
            {task.title}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {task.description}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {task.estimatedCost !== undefined && task.estimatedCost > 0 && (
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
              ~{task.estimatedCost.toLocaleString()}만
            </span>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 확장 영역 */}
      {expanded && (
        <div className="px-4 pb-3 pt-1 space-y-2 border-t border-border/50">
          {task.tips && (
            <div className="flex items-start gap-2 text-xs bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 px-3 py-2 rounded-lg">
              <Lightbulb className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{task.tips}</span>
            </div>
          )}

          {/* 실제 비용 입력 */}
          {onCostChange && (
            <div className="flex items-center gap-2">
              <Banknote className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">실제 비용:</span>
              <input
                type="number"
                value={actualCost || ''}
                onChange={(e) => onCostChange(parseInt(e.target.value) || 0)}
                placeholder="만원"
                className="w-24 text-xs bg-secondary/50 border border-border rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-primary/30"
              />
              <span className="text-xs text-muted-foreground">만원</span>
            </div>
          )}

          {/* 메모 */}
          {onMemoChange && (
            <div className="flex items-start gap-2">
              <StickyNote className="w-3.5 h-3.5 text-muted-foreground mt-1.5" />
              <textarea
                value={memo}
                onChange={(e) => onMemoChange(e.target.value)}
                placeholder="메모를 입력하세요..."
                rows={2}
                className="flex-1 text-xs bg-secondary/50 border border-border rounded-md px-2 py-1.5 outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            예상 소요: {task.estimatedDays}일
          </div>
        </div>
      )}
    </div>
  )
}
