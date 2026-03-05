'use client'

import { AlertTriangle } from 'lucide-react'
import { taskGuides } from '@/app/checklist/data/task-guides'

interface CommonMistakesProps {
  taskId: string
}

export default function CommonMistakes({ taskId }: CommonMistakesProps) {
  const guide = taskGuides[taskId]
  if (!guide?.warnings || guide.warnings.length === 0) return null

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>흔한 실수</span>
      </div>
      <div className="space-y-1.5">
        {guide.warnings.map((warning, i) => (
          <div
            key={i}
            className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20"
          >
            <span className="text-red-500 text-xs mt-0.5 flex-shrink-0">✕</span>
            <span className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
              {warning}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
