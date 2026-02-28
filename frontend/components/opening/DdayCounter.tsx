'use client'

import { CalendarDays } from 'lucide-react'

interface DdayCounterProps {
  targetDate: string
  onDateChange?: (date: string) => void
  editable?: boolean
}

export default function DdayCounter({ targetDate, onDateChange, editable = true }: DdayCounterProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let dday: number | null = null
  if (targetDate) {
    const target = new Date(targetDate)
    target.setHours(0, 0, 0, 0)
    dday = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
        <CalendarDays className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground">개원 목표일</div>
        {targetDate && dday !== null ? (
          <div className="flex items-baseline gap-2">
            <span className={`text-lg font-bold ${dday <= 30 ? 'text-red-500' : dday <= 90 ? 'text-amber-500' : 'text-primary'}`}>
              {dday > 0 ? `D-${dday}` : dday === 0 ? 'D-Day!' : `D+${Math.abs(dday)}`}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(targetDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">목표일을 설정하세요</div>
        )}
      </div>
      {editable && (
        <input
          type="date"
          value={targetDate ? targetDate.split('T')[0] : ''}
          onChange={(e) => onDateChange?.(e.target.value)}
          className="text-xs bg-secondary/50 border border-border rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-primary/30 w-[130px]"
        />
      )}
    </div>
  )
}
