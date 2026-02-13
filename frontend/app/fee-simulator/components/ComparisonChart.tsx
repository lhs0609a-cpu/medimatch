'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { specialties, calculateMonthlyRevenue } from '../data/fees'

interface ComparisonChartProps {
  selectedSpecialtyId: string
}

export default function ComparisonChart({ selectedSpecialtyId }: ComparisonChartProps) {
  const chartData = useMemo(() => {
    return specialties.map((sp) => {
      const rev = calculateMonthlyRevenue(sp, sp.avgDailyPatients, sp.avgNonInsuranceRatio)
      return {
        name: sp.name,
        id: sp.id,
        월매출: Math.round(rev.totalRevenue / 10000),
        color: sp.color,
      }
    }).sort((a, b) => b.월매출 - a.월매출)
  }, [])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-card border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold text-foreground">{label}</p>
        <p className="text-primary">{payload[0].value.toLocaleString()}만원 / 월</p>
      </div>
    )
  }

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-foreground mb-4">진료과별 평균 월매출 비교</h3>
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              tickFormatter={(v) => `${v.toLocaleString()}만`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="월매출" radius={[4, 4, 0, 0]}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.id}
                  fill={entry.id === selectedSpecialtyId ? entry.color : `${entry.color}60`}
                  stroke={entry.id === selectedSpecialtyId ? entry.color : 'transparent'}
                  strokeWidth={2}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        * 각 진료과 평균 환자수·비보험 비율 기준 추정치
      </p>
    </div>
  )
}
