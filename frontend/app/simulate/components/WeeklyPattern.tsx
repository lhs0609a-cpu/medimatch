'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Clock3, Lock } from 'lucide-react'
import { SimulationResponse } from '@/lib/api/client'

interface WeeklyPatternProps {
  result: SimulationResponse
}

// Typical Korean clinic weekly patterns
const WEEKDAY_FACTORS = [
  { day: '월', factor: 1.15, peak: true },
  { day: '화', factor: 1.05, peak: false },
  { day: '수', factor: 0.95, peak: false },
  { day: '목', factor: 1.00, peak: false },
  { day: '금', factor: 1.10, peak: true },
  { day: '토', factor: 0.65, peak: false },
]

const TIME_SLOTS = [
  { time: '09-10', factor: 0.7 },
  { time: '10-11', factor: 1.0 },
  { time: '11-12', factor: 1.2 },
  { time: '12-13', factor: 0.5 },
  { time: '13-14', factor: 0.6 },
  { time: '14-15', factor: 0.9 },
  { time: '15-16', factor: 1.0 },
  { time: '16-17', factor: 1.1 },
  { time: '17-18', factor: 1.3 },
  { time: '18-19', factor: 0.8 },
]

export default function WeeklyPattern({ result }: WeeklyPatternProps) {
  const avgRevenue = result.estimated_monthly_revenue.avg
  const dailyRevenue = avgRevenue / 26
  const dailyPatients = Math.round(dailyRevenue / 55000)

  const weekData = WEEKDAY_FACTORS.map(({ day, factor, peak }) => ({
    day,
    patients: Math.round(dailyPatients * factor),
    revenue: Math.round(dailyRevenue * factor),
    peak,
  }))

  const weeklyTotal = weekData.reduce((sum, d) => sum + d.patients, 0)

  const maxTimePatients = Math.max(...TIME_SLOTS.map((s) => s.factor))

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Clock3 className="w-5 h-5 text-purple-500" />
        <h3 className="font-semibold text-foreground">요일별 · 시간대별 환자 예측</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Weekly Bar Chart */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">요일별 예상 환자수</h4>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #e5e7eb)" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(v: number, name: string) => [
                    name === 'patients' ? `${v}명` : `${Math.round(v / 10000).toLocaleString()}만원`,
                    name === 'patients' ? '환자수' : '매출',
                  ]}
                />
                <Bar dataKey="patients" radius={[6, 6, 0, 0]}>
                  {weekData.map((d, idx) => (
                    <Cell key={idx} fill={d.peak ? '#8b5cf6' : '#c4b5fd'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center text-xs text-muted-foreground mt-2">
            주간 합계: <span className="font-bold text-foreground">{weeklyTotal}명</span> · 월간: <span className="font-bold text-foreground">~{weeklyTotal * 4}명</span>
          </div>
        </div>

        {/* Hourly Heatmap */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">시간대별 환자 밀도</h4>
          <div className="space-y-1.5">
            {TIME_SLOTS.map((slot) => {
              const barWidth = (slot.factor / maxTimePatients) * 100
              const patients = Math.round(dailyPatients * slot.factor / TIME_SLOTS.length * 2.5)
              const isHigh = slot.factor >= 1.0
              const isLow = slot.factor <= 0.6
              return (
                <div key={slot.time} className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground w-10 text-right flex-shrink-0 font-mono">
                    {slot.time}
                  </span>
                  <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
                    <div
                      className={`h-full rounded transition-all duration-700 ${
                        isHigh ? 'bg-purple-500' : isLow ? 'bg-purple-200 dark:bg-purple-900' : 'bg-purple-300 dark:bg-purple-700'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-foreground w-6 text-right">
                    {patients}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-purple-500" />피크</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-purple-300 dark:bg-purple-700" />보통</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-purple-200 dark:bg-purple-900" />비수시간</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4 pt-3 border-t border-border">
        <Lock className="w-3 h-3" />
        <span>실제 유동인구 시간대 데이터 · 연령별 피크시간 분석은 프리미엄에서</span>
      </div>
    </div>
  )
}
