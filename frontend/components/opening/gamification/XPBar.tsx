'use client'

import { Zap } from 'lucide-react'
import { getXPProgress, type LevelInfo } from '@/app/checklist/data/gamification/xp-levels'

interface XPBarProps {
  xp: number
  level: LevelInfo
  compact?: boolean
}

export default function XPBar({ xp, level, compact }: XPBarProps) {
  const { current, next, percent } = getXPProgress(xp)
  const isMax = percent === 100 && level.level === 10

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-xs font-bold text-primary">
          <Zap className="w-3.5 h-3.5" />
          Lv.{level.level}
        </div>
        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground">{xp} XP</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-sm font-bold">Lv.{level.level} {level.title}</div>
            <div className="text-xs text-muted-foreground">{xp.toLocaleString()} XP</div>
          </div>
        </div>
        {!isMax && (
          <span className="text-xs text-muted-foreground">{current}/{next}</span>
        )}
      </div>
      <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-700"
          style={{ width: `${percent}%` }}
        />
      </div>
      {isMax && (
        <p className="text-xs text-center text-amber-500 font-medium">MAX LEVEL!</p>
      )}
    </div>
  )
}
