'use client'

import { useState, useEffect } from 'react'
import { Lightbulb, X } from 'lucide-react'
import { taskGuides } from '@/app/checklist/data/task-guides'

interface DidYouKnowProps {
  taskId: string
  show: boolean
  onDismiss: () => void
}

export default function DidYouKnow({ taskId, show, onDismiss }: DidYouKnowProps) {
  const guide = taskGuides[taskId]
  if (!guide || !show) return null

  // Pick a random tip
  const tips = guide.tips
  const [tipIndex] = useState(() => Math.floor(Math.random() * tips.length))
  const tip = tips[tipIndex]
  if (!tip) return null

  return (
    <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30 animate-fade-in">
      <div className="w-5 h-5 rounded-md bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Lightbulb className="w-3 h-3 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-0.5">
          알고 계셨나요?
        </div>
        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
          {tip}
        </p>
      </div>
      <button
        onClick={onDismiss}
        className="w-5 h-5 flex items-center justify-center text-amber-400 hover:text-amber-600 flex-shrink-0"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}
