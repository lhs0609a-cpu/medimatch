'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { MonthlyRecord, ForecastData } from '../data/seed'

interface TrendChartProps {
  records: MonthlyRecord[]
  forecasts: ForecastData[]
}

export default function TrendChart({ records, forecasts }: TrendChartProps) {
  const merged = forecasts.map((f) => {
    const actual = records.find((r) => r.month === f.month)
    return {
      month: f.month.replace(/^\d{4}-/, '').replace(/^0/, '') + '월',
      실적: actual?.revenue || null,
      예측: f.predictedRevenue,
      환자수_실적: actual?.patients || null,
      환자수_예측: f.predictedPatients,
    }
  })

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-card border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {p.value?.toLocaleString()}
            {p.name.includes('환자') ? '명' : '만원'}
          </p>
        ))}
      </div>
    )
  }

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-foreground mb-4">실적 vs 예측 추이</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={merged} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              tickFormatter={(v) => `${v.toLocaleString()}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="실적" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 4 }} connectNulls={false} />
            <Line type="monotone" dataKey="예측" stroke="#94A3B8" strokeWidth={2} strokeDasharray="6 3" dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
