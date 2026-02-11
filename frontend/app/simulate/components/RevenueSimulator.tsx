'use client'

import React, { useState, useMemo } from 'react'
import { Calculator, Users, DollarSign, Calendar } from 'lucide-react'
import { SimulationResponse } from '@/lib/api/client'

interface RevenueSimulatorProps {
  result: SimulationResponse
}

function formatMoney(v: number): string {
  const abs = Math.abs(v)
  if (abs >= 100000000) return `${(v / 100000000).toFixed(1)}억`
  return `${Math.round(v / 10000).toLocaleString()}만`
}

export default function RevenueSimulator({ result }: RevenueSimulatorProps) {
  const avgRevenue = result.estimated_monthly_revenue.avg
  const defaultPatients = Math.max(10, Math.min(80, Math.round(avgRevenue / 26 / 55000)))
  const defaultFee = Math.max(20000, Math.min(150000, Math.round(avgRevenue / 26 / defaultPatients / 1000) * 1000))

  const [patients, setPatients] = useState(defaultPatients)
  const [fee, setFee] = useState(defaultFee)
  const [workingDays, setWorkingDays] = useState(26)

  const monthlyRevenue = useMemo(() => patients * fee * workingDays, [patients, fee, workingDays])
  const monthlyCost = result.estimated_monthly_cost.total
  const monthlyProfit = monthlyRevenue - monthlyCost
  const isProfitable = monthlyProfit > 0
  const annualProfit = monthlyProfit * 12

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Calculator className="w-5 h-5 text-emerald-500" />
        <h3 className="font-semibold text-foreground">매출 시뮬레이터</h3>
        <span className="ml-auto text-[11px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-medium">
          직접 조절해보세요
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Sliders */}
        <div className="space-y-5">
          {/* Patients */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> 일 평균 환자수
              </span>
              <span className="font-bold text-foreground text-base">{patients}명</span>
            </div>
            <input
              type="range"
              min={5}
              max={100}
              value={patients}
              onChange={(e) => setPatients(Number(e.target.value))}
              className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>5명</span><span>50명</span><span>100명</span>
            </div>
          </div>

          {/* Fee */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" /> 평균 진료비
              </span>
              <span className="font-bold text-foreground text-base">{(fee / 10000).toFixed(1)}만원</span>
            </div>
            <input
              type="range"
              min={20000}
              max={200000}
              step={5000}
              value={fee}
              onChange={(e) => setFee(Number(e.target.value))}
              className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>2만원</span><span>10만원</span><span>20만원</span>
            </div>
          </div>

          {/* Working Days */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> 월 진료일수
              </span>
              <span className="font-bold text-foreground text-base">{workingDays}일</span>
            </div>
            <input
              type="range"
              min={20}
              max={30}
              value={workingDays}
              onChange={(e) => setWorkingDays(Number(e.target.value))}
              className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>20일</span><span>25일</span><span>30일</span>
            </div>
          </div>
        </div>

        {/* Live Results */}
        <div className="flex flex-col justify-center gap-3">
          {/* Revenue */}
          <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 rounded-xl border border-emerald-200/50 dark:border-emerald-800/50">
            <div className="text-[11px] text-muted-foreground mb-1">예상 월 매출</div>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatMoney(monthlyRevenue)}원
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {patients}명 × {(fee / 10000).toFixed(1)}만원 × {workingDays}일
            </div>
          </div>

          {/* Profit */}
          <div className={`text-center p-3 rounded-xl border ${
            isProfitable
              ? 'bg-green-50 dark:bg-green-950/30 border-green-200/50 dark:border-green-800/50'
              : 'bg-red-50 dark:bg-red-950/30 border-red-200/50 dark:border-red-800/50'
          }`}>
            <div className="text-[11px] text-muted-foreground mb-1">예상 월 순이익</div>
            <div className={`text-2xl font-bold ${isProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {isProfitable ? '+' : ''}{formatMoney(monthlyProfit)}원
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              매출 - 예상 비용({formatMoney(monthlyCost)}원)
            </div>
          </div>

          {/* Annual */}
          <div className="text-center p-2 bg-secondary/50 rounded-lg">
            <span className="text-xs text-muted-foreground">연간 추정: </span>
            <span className={`text-xs font-bold ${isProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {isProfitable ? '+' : ''}{formatMoney(annualProfit)}원
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
