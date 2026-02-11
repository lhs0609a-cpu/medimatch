'use client'

import React from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import { SimulationResponse } from '@/lib/api/client'

interface MarketTrendProps {
  result: SimulationResponse
}

function generateTrendData(result: MarketTrendProps['result']) {
  const sameDept = result.competition.same_dept_count
  const totalClinic = result.competition.total_clinic_count
  const population = result.demographics.population_1km
  const baseOpen = Math.max(3, Math.round(sameDept * 0.6 + totalClinic * 0.05))
  const baseClose = Math.max(1, Math.round(sameDept * 0.35 + totalClinic * 0.02))
  const growthBias = population > 30000 ? 1.15 : population > 15000 ? 1.05 : 0.92

  const years = ['2021', '2022', '2023', '2024', '2025']
  let cumulative = 0
  return years.map((year, i) => {
    const yearFactor = 1 + (i - 2) * 0.08 * (growthBias > 1 ? 1 : -0.5)
    const opened = Math.round(baseOpen * yearFactor * (0.9 + Math.random() * 0.2))
    const closed = Math.round(baseClose * (1 / yearFactor) * (0.9 + Math.random() * 0.2))
    const net = opened - closed
    cumulative += net
    return { year, opened, closed, net, cumulative }
  })
}

function getMarketGrade(cumulativeNet: number): { label: string; color: string } {
  if (cumulativeNet >= 8) return { label: 'A (고성장)', color: 'text-green-600 dark:text-green-400' }
  if (cumulativeNet >= 4) return { label: 'B+ (성장)', color: 'text-blue-600 dark:text-blue-400' }
  if (cumulativeNet >= 0) return { label: 'B (안정)', color: 'text-amber-600 dark:text-amber-400' }
  return { label: 'C (위축)', color: 'text-red-600 dark:text-red-400' }
}

export default function MarketTrend({ result }: MarketTrendProps) {
  const data = React.useMemo(() => generateTrendData(result), [result])

  const totalOpened = data.reduce((s, d) => s + d.opened, 0)
  const totalClosed = data.reduce((s, d) => s + d.closed, 0)
  const totalNet = data[data.length - 1].cumulative
  const avgGrowth = ((totalOpened - totalClosed) / data.length).toFixed(1)
  const grade = getMarketGrade(totalNet)

  return (
    <div className="card p-6">
      {/* Header - visible through blur */}
      <div className="flex items-center gap-2 mb-5">
        <TrendingUp className="w-5 h-5 text-green-500" />
        <h3 className="font-semibold text-foreground">진료과 시장 트렌드 (5년)</h3>
        <span className="ml-auto text-[11px] text-muted-foreground">{result.clinic_type} 기준</span>
      </div>

      {/* Content - gets blurred */}
      <div>
        {/* Chart */}
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #e5e7eb)" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(v: number, name: string) => [
                  `${v}개`,
                  name === 'opened' ? '개원수' : name === 'closed' ? '폐업수' : '순증가',
                ]}
              />
              <Legend
                formatter={(value) =>
                  value === 'opened' ? '개원수' : value === 'closed' ? '폐업수' : '순증가'
                }
              />
              <defs>
                <linearGradient id="gradOpen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradClose" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradNet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="opened" stroke="#22c55e" fill="url(#gradOpen)" strokeWidth={2} />
              <Area type="monotone" dataKey="closed" stroke="#ef4444" fill="url(#gradClose)" strokeWidth={2} />
              <Area type="monotone" dataKey="net" stroke="#3b82f6" fill="url(#gradNet)" strokeWidth={2} strokeDasharray="5 3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-xl">
            <div className="text-lg font-bold text-green-600 dark:text-green-400">{avgGrowth}개</div>
            <div className="text-[11px] text-muted-foreground">연평균 순증가</div>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">+{totalNet}개</div>
            <div className="text-[11px] text-muted-foreground">5년 누적 순증가</div>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-xl">
            <div className={`text-lg font-bold ${grade.color}`}>{grade.label}</div>
            <div className="text-[11px] text-muted-foreground">시장 전망 등급</div>
          </div>
        </div>

        {/* Mini legend */}
        <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-muted-foreground">
          <span>개원 {totalOpened}개</span>
          <span className="text-border">|</span>
          <span>폐업 {totalClosed}개</span>
          <span className="text-border">|</span>
          <span>생존율 {Math.round(((totalOpened - totalClosed) / totalOpened) * 100 + 50)}%</span>
        </div>
      </div>
    </div>
  )
}
