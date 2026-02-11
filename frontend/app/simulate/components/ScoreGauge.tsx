'use client'

import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts'

interface ScoreGaugeProps {
  score: number
  max?: number
  size?: number
  color?: string
  label?: string
  className?: string
}

export default function ScoreGauge({
  score,
  max = 100,
  size = 140,
  color = '#3b82f6',
  label,
  className,
}: ScoreGaugeProps) {
  const data = [{ value: score, fill: color }]

  return (
    <div className={`relative inline-flex items-center justify-center ${className || ''}`} style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="70%"
          outerRadius="90%"
          data={data}
          startAngle={90}
          endAngle={-270}
          barSize={size * 0.08}
        >
          <PolarAngleAxis type="number" domain={[0, max]} angleAxisId={0} tick={false} />
          <RadialBar
            background={{ fill: 'var(--muted, #e5e7eb)' }}
            dataKey="value"
            cornerRadius={size * 0.04}
            angleAxisId={0}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>{score}</span>
        {label && <span className="text-[10px] text-muted-foreground mt-0.5">{label}</span>}
      </div>
    </div>
  )
}
