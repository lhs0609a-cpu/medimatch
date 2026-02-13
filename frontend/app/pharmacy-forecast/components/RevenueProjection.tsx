'use client'

import { DollarSign, TrendingUp, ShoppingBag, Pill } from 'lucide-react'
import { NearbyHospital, calculatePrescriptions, avgPrescriptionValue, avgOTCSalesPerDay } from '../data/seed'

interface RevenueProjectionProps {
  hospitals: NearbyHospital[]
  pharmacyCount: number
}

export default function RevenueProjection({ hospitals, pharmacyCount }: RevenueProjectionProps) {
  const totalDailyRx = hospitals.reduce((sum, h) => {
    const calc = calculatePrescriptions(h, pharmacyCount)
    return sum + calc.myPrescriptions
  }, 0)

  const workingDays = 26 // 약국은 토요일도 영업
  const dailyRxRevenue = totalDailyRx * avgPrescriptionValue
  const monthlyRxRevenue = dailyRxRevenue * workingDays
  const monthlyOTCRevenue = avgOTCSalesPerDay * workingDays
  const monthlyTotal = monthlyRxRevenue + monthlyOTCRevenue
  const annualTotal = monthlyTotal * 12

  const formatWon = (v: number) => {
    if (v >= 100000000) return `${(v / 100000000).toFixed(1)}억`
    if (v >= 10000) return `${Math.round(v / 10000).toLocaleString()}만`
    return `${v.toLocaleString()}`
  }

  const items = [
    {
      label: '처방 조제 수익',
      daily: dailyRxRevenue,
      monthly: monthlyRxRevenue,
      icon: Pill,
      color: '#3B82F6',
      ratio: monthlyTotal > 0 ? (monthlyRxRevenue / monthlyTotal) * 100 : 0,
    },
    {
      label: 'OTC / 건강기능식품',
      daily: avgOTCSalesPerDay,
      monthly: monthlyOTCRevenue,
      icon: ShoppingBag,
      color: '#10B981',
      ratio: monthlyTotal > 0 ? (monthlyOTCRevenue / monthlyTotal) * 100 : 0,
    },
  ]

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-primary" />
        매출 추정
      </h3>

      {/* Monthly total */}
      <div className="text-center p-5 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl mb-4">
        <p className="text-sm text-muted-foreground mb-1">예상 월 매출</p>
        <p className="text-3xl font-bold text-primary">{formatWon(monthlyTotal)}원</p>
        <p className="text-xs text-muted-foreground mt-1">연간 {formatWon(annualTotal)}원</p>
      </div>

      {/* Breakdown */}
      <div className="space-y-3 mb-4">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Icon className="w-4 h-4" style={{ color: item.color }} />
                  {item.label}
                </span>
                <span className="text-sm font-semibold text-foreground">{formatWon(item.monthly)}원/월</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${item.ratio}%`, backgroundColor: item.color }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>일 {formatWon(item.daily)}원</span>
                <span>{item.ratio.toFixed(0)}%</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="pt-3 border-t text-xs text-muted-foreground">
        <p>* 월 {workingDays}일 영업 기준 (토요일 포함)</p>
        <p>* OTC 매출은 지역/입지에 따라 편차가 큼</p>
        <p>* 실제 조제료는 약품 구성에 따라 달라질 수 있음</p>
      </div>
    </div>
  )
}
