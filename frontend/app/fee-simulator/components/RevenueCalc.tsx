'use client'

import { useMemo } from 'react'
import { Users, TrendingUp, Shield, Sparkles, Calendar } from 'lucide-react'
import { SpecialtyFees, calculateMonthlyRevenue } from '../data/fees'

interface RevenueCalcProps {
  specialty: SpecialtyFees
  dailyPatients: number
  nonInsuranceRatio: number
  workingDays: number
  onDailyPatientsChange: (v: number) => void
  onNonInsuranceRatioChange: (v: number) => void
  onWorkingDaysChange: (v: number) => void
}

export default function RevenueCalc({
  specialty,
  dailyPatients,
  nonInsuranceRatio,
  workingDays,
  onDailyPatientsChange,
  onNonInsuranceRatioChange,
  onWorkingDaysChange,
}: RevenueCalcProps) {
  const revenue = useMemo(
    () => calculateMonthlyRevenue(specialty, dailyPatients, nonInsuranceRatio, workingDays),
    [specialty, dailyPatients, nonInsuranceRatio, workingDays]
  )

  const formatWon = (v: number) => {
    if (v >= 100000000) return `${(v / 100000000).toFixed(1)}억`
    if (v >= 10000) return `${Math.round(v / 10000).toLocaleString()}만`
    return `${v.toLocaleString()}`
  }

  return (
    <div className="space-y-4">
      {/* Sliders */}
      <div className="card p-5 space-y-5">
        <h3 className="font-semibold text-foreground">매출 시뮬레이션</h3>

        {/* Daily patients */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Users className="w-4 h-4" /> 일 평균 환자수
            </span>
            <span className="font-bold text-foreground">{dailyPatients}명</span>
          </div>
          <input
            type="range"
            min={5}
            max={100}
            value={dailyPatients}
            onChange={(e) => onDailyPatientsChange(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>5명</span>
            <span className="text-primary">평균 {specialty.avgDailyPatients}명</span>
            <span>100명</span>
          </div>
        </div>

        {/* Non-insurance ratio */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> 비보험 비율
            </span>
            <span className="font-bold text-foreground">{nonInsuranceRatio}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={nonInsuranceRatio}
            onChange={(e) => onNonInsuranceRatioChange(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0%</span>
            <span className="text-primary">평균 {specialty.avgNonInsuranceRatio}%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Working days */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> 월 진료일수
            </span>
            <span className="font-bold text-foreground">{workingDays}일</span>
          </div>
          <input
            type="range"
            min={15}
            max={26}
            value={workingDays}
            onChange={(e) => onWorkingDaysChange(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>15일</span>
            <span>26일</span>
          </div>
        </div>
      </div>

      {/* Revenue result */}
      <div className="card p-5">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" /> 예상 월 매출
        </h3>
        <div className="text-3xl font-bold text-primary mb-4">{formatWon(revenue.totalRevenue)}원</div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-blue-500" /> 보험 수익
            </span>
            <span className="font-semibold text-foreground">{formatWon(revenue.insuranceRevenue)}원</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-500" /> 비보험 수익
            </span>
            <span className="font-semibold text-foreground">{formatWon(revenue.nonInsuranceRevenue)}원</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t grid grid-cols-2 gap-3 text-center">
          <div>
            <p className="text-xs text-muted-foreground">연간 추정 매출</p>
            <p className="text-lg font-bold text-foreground">{formatWon(revenue.totalRevenue * 12)}원</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">일 평균 매출</p>
            <p className="text-lg font-bold text-foreground">
              {formatWon(Math.round(revenue.totalRevenue / workingDays))}원
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
