'use client'

import Link from 'next/link'
import { Stethoscope, LogIn, Map } from 'lucide-react'

interface OpeningProjectHeaderProps {
  completedCount: number
  totalTasks: number
  progress: number
  targetDate: string
  isLoggedIn: boolean
}

export default function OpeningProjectHeader({
  completedCount, totalTasks, progress, targetDate, isLoggedIn,
}: OpeningProjectHeaderProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let dday: number | null = null
  if (targetDate) {
    const target = new Date(targetDate)
    target.setHours(0, 0, 0, 0)
    dday = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
          </Link>
          <div className="hidden sm:flex items-center gap-2">
            <Link href="/opening-project" className="flex items-center gap-1.5 text-sm font-bold">
              <Map className="w-4 h-4 text-primary" />
              개원 프로젝트
            </Link>
          </div>
        </div>

        {/* Center: Progress */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
              {completedCount}/{totalTasks} ({progress}%)
            </span>
          </div>

          {dday !== null && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
              dday <= 30 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                : dday <= 90 ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                : 'bg-primary/10 text-primary'
            }`}>
              {dday > 0 ? `D-${dday}` : dday === 0 ? 'D-Day!' : `D+${Math.abs(dday)}`}
            </span>
          )}
        </div>

        {/* Right: Login nudge */}
        {!isLoggedIn ? (
          <Link
            href="/login?redirect=/opening-project"
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">로그인하면 저장됩니다</span>
            <span className="sm:hidden">로그인</span>
          </Link>
        ) : (
          <Link href="/emr/dashboard" className="text-xs font-medium text-primary hover:underline">
            EMR 대시보드
          </Link>
        )}
      </div>
    </header>
  )
}
