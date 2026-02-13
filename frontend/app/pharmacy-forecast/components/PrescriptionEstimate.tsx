'use client'

import { ClipboardList, Pill, TrendingUp } from 'lucide-react'
import { NearbyHospital, calculatePrescriptions, avgPrescriptionValue } from '../data/seed'

interface PrescriptionEstimateProps {
  hospitals: NearbyHospital[]
  pharmacyCount: number
}

export default function PrescriptionEstimate({ hospitals, pharmacyCount }: PrescriptionEstimateProps) {
  const estimates = hospitals.map((h) => {
    const calc = calculatePrescriptions(h, pharmacyCount)
    return { ...h, ...calc }
  })

  const totalDailyPrescriptions = estimates.reduce((sum, e) => sum + e.myPrescriptions, 0)
  const bySpecialty = estimates.reduce<Record<string, number>>((acc, e) => {
    acc[e.specialty] = (acc[e.specialty] || 0) + e.myPrescriptions
    return acc
  }, {})

  const sortedSpecialties = Object.entries(bySpecialty).sort((a, b) => b[1] - a[1])
  const maxPrescriptions = Math.max(...sortedSpecialties.map(([, v]) => v), 1)

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
        <ClipboardList className="w-5 h-5 text-primary" />
        일일 처방전 예측
      </h3>

      <div className="text-center p-4 bg-primary/5 rounded-xl mb-4">
        <p className="text-sm text-muted-foreground mb-1">예상 일일 처방전</p>
        <p className="text-4xl font-bold text-primary">{totalDailyPrescriptions}</p>
        <p className="text-sm text-muted-foreground">건 / 일</p>
      </div>

      <div className="space-y-3 mb-4">
        {sortedSpecialties.map(([specialty, count]) => (
          <div key={specialty}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">{specialty}</span>
              <span className="font-medium text-foreground">{count}건</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${(count / maxPrescriptions) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Pill className="w-4 h-4" /> 건당 평균 조제수익
          </span>
          <span className="font-medium text-foreground">{avgPrescriptionValue.toLocaleString()}원</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" /> 월 처방전 (22일)
          </span>
          <span className="font-medium text-foreground">{(totalDailyPrescriptions * 22).toLocaleString()}건</span>
        </div>
      </div>
    </div>
  )
}
