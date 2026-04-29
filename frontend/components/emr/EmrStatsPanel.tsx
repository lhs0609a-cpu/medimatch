'use client'

import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, PieChart, Pie, Legend,
} from 'recharts'
import { TrendingUp, Users, DollarSign, Activity, Loader2 } from 'lucide-react'
import { visitService } from '@/lib/api/emr'

const TYPE_COLOR = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
const TYPE_LABEL: Record<string, string> = {
  INITIAL: '초진',
  REVISIT: '재진',
  CHECKUP: '검진',
}

export default function EmrStatsPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['emr-dashboard'],
    queryFn: () => visitService.dashboard(6),
  })

  if (isLoading) {
    return (
      <div className="card p-6 flex justify-center">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    )
  }
  if (!data) return null

  const monthly = data.monthly || []
  const totalVisits = monthly.reduce((s, m) => s + m.visits, 0)
  const totalPatients = monthly.reduce((s, m) => s + m.patients, 0)
  const totalRevenue = monthly.reduce((s, m) => s + m.revenue, 0)
  const avgMonthly = monthly.length > 0 ? Math.round(totalRevenue / monthly.length) : 0

  const typeData = Object.entries(data.by_visit_type || {}).map(([key, value], i) => ({
    name: TYPE_LABEL[key] || key,
    value,
    fill: TYPE_COLOR[i % TYPE_COLOR.length],
  }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><Activity className="w-3 h-3" /> 6개월 진료</div>
          <div className="text-2xl font-bold mt-1">{totalVisits.toLocaleString()}건</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" /> 누적 환자</div>
          <div className="text-2xl font-bold mt-1">{totalPatients.toLocaleString()}명</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3" /> 6개월 수입</div>
          <div className="text-2xl font-bold mt-1 text-emerald-600">{(totalRevenue / 10000).toLocaleString(undefined, { maximumFractionDigits: 0 })}만원</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" /> 월평균</div>
          <div className="text-2xl font-bold mt-1">{(avgMonthly / 10000).toLocaleString(undefined, { maximumFractionDigits: 0 })}만원</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 md:col-span-2">
          <div className="text-sm font-semibold mb-2">월별 진료수 + 매출</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" fontSize={11} />
              <YAxis yAxisId="left" fontSize={11} />
              <YAxis yAxisId="right" orientation="right" fontSize={11} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
              <Tooltip formatter={(v: any, name: string) => name === 'revenue' ? `${v.toLocaleString()}원` : `${v.toLocaleString()}건`} />
              <Bar yAxisId="left" dataKey="visits" fill="#3b82f6" name="진료수" />
              <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" name="매출" strokeWidth={2} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4">
          <div className="text-sm font-semibold mb-2">진료 구분</div>
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={(e) => `${e.name} ${e.value}`}>
                  {typeData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-xs text-muted-foreground py-12">데이터 없음</div>
          )}
        </div>
      </div>

      {data.top_diagnoses && data.top_diagnoses.length > 0 && (
        <div className="card p-4">
          <div className="text-sm font-semibold mb-3">진단 TOP 10</div>
          <div className="space-y-1.5">
            {data.top_diagnoses.map((d, i) => {
              const max = data.top_diagnoses[0].count
              const ratio = (d.count / max) * 100
              return (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-blue-600 w-16">{d.code}</span>
                  <span className="flex-1 truncate">{d.name}</span>
                  <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${ratio}%` }} />
                  </div>
                  <span className="w-10 text-right font-medium">{d.count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
