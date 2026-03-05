'use client'

import { AlertTriangle, ShieldAlert, ShieldCheck } from 'lucide-react'
import type { FailureCase } from '@/app/checklist/data/task-guides'

interface FailureCaseListProps {
  cases: FailureCase[]
}

export default function FailureCaseList({ cases }: FailureCaseListProps) {
  if (!cases || cases.length === 0) return null

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
        <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
        <span>실패 사례 / 주의사항</span>
      </div>
      <div className="space-y-2">
        {cases.map((fc, i) => (
          <div
            key={i}
            className="rounded-lg border border-red-200 dark:border-red-800/40 bg-red-50/50 dark:bg-red-900/10 px-3 py-2.5 space-y-1.5"
          >
            <div className="flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs font-semibold text-red-700 dark:text-red-400">{fc.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{fc.description}</div>
              </div>
            </div>
            <div className="ml-5 space-y-1">
              <div className="text-xs text-red-600 dark:text-red-400">
                <span className="font-medium">결과:</span> {fc.consequence}
              </div>
              <div className="flex items-start gap-1 text-xs text-green-700 dark:text-green-400">
                <ShieldCheck className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span><span className="font-medium">예방:</span> {fc.prevention}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
