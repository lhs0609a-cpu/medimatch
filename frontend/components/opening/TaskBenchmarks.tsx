'use client'

import { BarChart3 } from 'lucide-react'
import type { TaskBenchmark } from '@/app/checklist/data/task-guides'

interface TaskBenchmarksProps {
  benchmarks: TaskBenchmark[]
  title?: string
  icon?: React.ElementType
}

export default function TaskBenchmarks({ benchmarks, title = '벤치마크/수치', icon: CustomIcon }: TaskBenchmarksProps) {
  if (!benchmarks || benchmarks.length === 0) return null

  const Icon = CustomIcon || BarChart3

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
        <Icon className="w-3.5 h-3.5 text-blue-600" />
        <span>{title}</span>
      </div>
      <div className="bg-secondary/30 rounded-lg overflow-hidden">
        <table className="w-full">
          <tbody>
            {benchmarks.map((item, i) => (
              <tr key={i} className={i > 0 ? 'border-t border-border/30' : ''}>
                <td className="text-xs text-muted-foreground px-3 py-1.5 w-2/5">{item.label}</td>
                <td className="text-xs font-medium text-foreground px-3 py-1.5">
                  {item.value}
                  {item.note && (
                    <span className="text-muted-foreground font-normal ml-1">({item.note})</span>
                  )}
                  {item.source && (
                    <span className="text-muted-foreground/60 font-normal text-[10px] ml-1">
                      — {item.source}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
