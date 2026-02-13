'use client'

import { TrendingUp, TrendingDown, Users, DollarSign, UserPlus, Wallet } from 'lucide-react'
import { MonthlyRecord } from '../data/seed'

interface KPICardsProps {
  records: MonthlyRecord[]
}

export default function KPICards({ records }: KPICardsProps) {
  const latest = records[records.length - 1]
  const prev = records.length > 1 ? records[records.length - 2] : null

  const calcChange = (current: number, previous: number | undefined) => {
    if (!previous || previous === 0) return null
    return ((current - previous) / previous) * 100
  }

  const formatWon = (v: number) => {
    if (v >= 10000) return `${(v / 10000).toFixed(1)}억`
    return `${v.toLocaleString()}만`
  }

  if (!latest) {
    return (
      <div className="card p-8 text-center text-muted-foreground">
        아직 입력된 실적 데이터가 없습니다.
      </div>
    )
  }

  const kpis = [
    {
      label: '월 매출',
      value: `${formatWon(latest.revenue)}원`,
      change: calcChange(latest.revenue, prev?.revenue),
      icon: DollarSign,
      color: '#3B82F6',
    },
    {
      label: '총 환자수',
      value: `${latest.patients.toLocaleString()}명`,
      change: calcChange(latest.patients, prev?.patients),
      icon: Users,
      color: '#10B981',
    },
    {
      label: '신규 환자',
      value: `${latest.newPatients.toLocaleString()}명`,
      change: calcChange(latest.newPatients, prev?.newPatients),
      icon: UserPlus,
      color: '#8B5CF6',
    },
    {
      label: '영업이익',
      value: `${formatWon(latest.revenue - latest.expenses)}원`,
      change: calcChange(latest.revenue - latest.expenses, prev ? prev.revenue - prev.expenses : undefined),
      icon: Wallet,
      color: latest.revenue - latest.expenses > 0 ? '#10B981' : '#EF4444',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon
        return (
          <div key={kpi.label} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
              <Icon className="w-4 h-4" style={{ color: kpi.color }} />
            </div>
            <p className="text-xl font-bold text-foreground">{kpi.value}</p>
            {kpi.change !== null && (
              <div className={`flex items-center gap-1 mt-1 text-xs ${kpi.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {kpi.change >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                <span>{Math.abs(kpi.change).toFixed(1)}%</span>
                <span className="text-muted-foreground">전월 대비</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
