'use client'

import { Brain, Check, RotateCcw } from 'lucide-react'
import { getQuizzesForTask } from '@/app/checklist/data/quiz'

interface TaskQuizIndicatorProps {
  taskId: string
  quizScore: number | null  // null = not attempted
  onClick?: () => void
}

export default function TaskQuizIndicator({ taskId, quizScore, onClick }: TaskQuizIndicatorProps) {
  const questions = getQuizzesForTask(taskId)
  if (questions.length === 0) return null

  const isPerfect = quizScore === questions.length
  const hasAttempted = quizScore !== null

  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors
        ${isPerfect
          ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
          : hasAttempted
            ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/30'
            : 'bg-primary/10 text-primary hover:bg-primary/20'
        }
      `}
      title={hasAttempted ? `퀴즈 ${quizScore}/${questions.length}` : '퀴즈 풀기'}
    >
      {isPerfect ? (
        <>
          <Check className="w-3 h-3" />
          만점
        </>
      ) : hasAttempted ? (
        <>
          <RotateCcw className="w-3 h-3" />
          {quizScore}/{questions.length}
        </>
      ) : (
        <>
          <Brain className="w-3 h-3" />
          퀴즈
        </>
      )}
    </button>
  )
}
