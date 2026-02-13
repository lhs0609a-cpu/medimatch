'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface CostChartProps {
  categories: { name: string; cost: number }[]
  extraCosts: { name: string; cost: number }[]
}

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899',
  '#06B6D4', '#F97316', '#14B8A6', '#EF4444', '#A855F7',
  '#65A30D', '#0EA5E9',
]

export default function CostChart({ categories, extraCosts }: CostChartProps) {
  const data = [
    ...categories.filter((c) => c.cost > 0),
    ...extraCosts.filter((c) => c.cost > 0),
  ]

  const formatCost = (cost: number) => {
    if (cost >= 10000) return `${(cost / 10000).toFixed(1)}억원`
    return `${cost.toLocaleString()}만원`
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const { name, value } = payload[0]
    const total = data.reduce((s, d) => s + d.cost, 0)
    const ratio = total > 0 ? ((value / total) * 100).toFixed(1) : '0'
    return (
      <div className="bg-card border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold text-foreground">{name}</p>
        <p className="text-primary">{formatCost(value)}</p>
        <p className="text-muted-foreground text-xs">{ratio}%</p>
      </div>
    )
  }

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-foreground mb-4">비용 구성</h3>
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="cost"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-2 mt-2 justify-center">
        {data.slice(0, 6).map((item, i) => (
          <div key={item.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            <span>{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
