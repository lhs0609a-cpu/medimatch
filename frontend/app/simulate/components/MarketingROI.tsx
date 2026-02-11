'use client'

import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts'
import { Megaphone } from 'lucide-react'
import { SimulationResponse } from '@/lib/api/client'

function formatMoney(v: number): string {
  if (v >= 100000000) return `${(v / 100000000).toFixed(1)}억`
  return `${Math.round(v / 10000).toLocaleString()}만`
}

const CHANNELS = [
  { name: '네이버플레이스', roi: 320, budgetRatio: 0.30, cpa: 15000, color: '#22c55e' },
  { name: '인스타그램', roi: 210, budgetRatio: 0.20, cpa: 25000, color: '#8b5cf6' },
  { name: '당근마켓', roi: 180, budgetRatio: 0.10, cpa: 18000, color: '#f97316' },
  { name: '블로그', roi: 260, budgetRatio: 0.15, cpa: 20000, color: '#3b82f6' },
  { name: '카카오광고', roi: 150, budgetRatio: 0.15, cpa: 30000, color: '#facc15' },
  { name: '오프라인', roi: 90, budgetRatio: 0.10, cpa: 45000, color: '#64748b' },
]

export default function MarketingROI({ result }: { result: SimulationResponse }) {
  const monthlyRevenue = result.estimated_monthly_revenue.avg
  const estimatedBudget = result.ai_insights?.estimated_marketing_budget
    ?? Math.round(monthlyRevenue * 0.05)

  const channelData = CHANNELS.map((ch) => {
    const budget = Math.round(estimatedBudget * ch.budgetRatio)
    const patients = Math.round(budget / ch.cpa)
    return { ...ch, budget, patients }
  })

  const pieData = channelData.map((ch) => ({
    name: ch.name,
    value: ch.budget,
    color: ch.color,
  }))

  const totalPatients = channelData.reduce((s, c) => s + c.patients, 0)

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Megaphone className="w-5 h-5 text-violet-500" />
        <h3 className="font-semibold text-foreground">마케팅 채널별 ROI 분석</h3>
        <span className="ml-auto text-[11px] text-muted-foreground">월 예산 {formatMoney(estimatedBudget)}원</span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="text-center p-3 bg-violet-50 dark:bg-violet-950/30 rounded-xl">
          <div className="text-xl font-bold text-violet-600 dark:text-violet-400">{formatMoney(estimatedBudget)}원</div>
          <div className="text-[11px] text-muted-foreground">추천 마케팅 예산</div>
        </div>
        <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-xl">
          <div className="text-xl font-bold text-green-600 dark:text-green-400">{totalPatients}명</div>
          <div className="text-[11px] text-muted-foreground">예상 월 유입 환자</div>
        </div>
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">네이버</div>
          <div className="text-[11px] text-muted-foreground">최고 ROI 채널</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-5">
        {/* ROI BarChart */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">채널별 ROI (%)</h4>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #e5e7eb)" />
                <XAxis type="number" tick={{ fontSize: 10 }} unit="%" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
                <Tooltip formatter={(v: number) => [`${v}%`, 'ROI']} />
                <Bar dataKey="roi" radius={[0, 4, 4, 0]}>
                  {channelData.map((ch, idx) => (
                    <Cell key={idx} fill={ch.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budget PieChart */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">예산 배분</h4>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name.slice(0, 4)} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((d, idx) => (
                    <Cell key={idx} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`${formatMoney(v)}원`, '월예산']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detail Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground text-[11px]">
              <th className="text-left py-2 font-medium">채널</th>
              <th className="text-right py-2 font-medium">월예산</th>
              <th className="text-right py-2 font-medium">예상유입</th>
              <th className="text-right py-2 font-medium">CPA</th>
              <th className="text-right py-2 font-medium">ROI</th>
            </tr>
          </thead>
          <tbody>
            {channelData.map((ch) => (
              <tr key={ch.name} className="border-b border-border/50 hover:bg-muted/30">
                <td className="py-2 font-medium text-foreground flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: ch.color }} />
                  {ch.name}
                </td>
                <td className="text-right py-2 text-foreground">{formatMoney(ch.budget)}원</td>
                <td className="text-right py-2 text-foreground">{ch.patients}명</td>
                <td className="text-right py-2 text-muted-foreground">{(ch.cpa / 10000).toFixed(1)}만원</td>
                <td className="text-right py-2 font-bold text-green-600 dark:text-green-400">{ch.roi}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-3 bg-violet-50 dark:bg-violet-950/20 rounded-lg text-xs text-muted-foreground">
        <span className="font-semibold text-violet-700 dark:text-violet-300">최적 채널 조합:</span>{' '}
        네이버플레이스(30%) + 블로그(15%) 중심으로 온라인 가시성 확보 후, 인스타그램으로 브랜딩 강화를 추천합니다.
      </div>
    </div>
  )
}
