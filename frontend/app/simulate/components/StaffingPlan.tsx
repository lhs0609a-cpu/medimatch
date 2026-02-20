'use client'

import React from 'react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from 'recharts'
import { UserCheck } from 'lucide-react'
import { TossIcon } from '@/components/ui/TossIcon'
import { SimulationResponse } from '@/lib/api/client'

interface StaffingPlanProps {
  result: SimulationResponse
}

const STAFF_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444']

function formatMoney(v: number): string {
  if (v >= 100000000) return `${(v / 100000000).toFixed(1)}억`
  return `${Math.round(v / 10000).toLocaleString()}만`
}

function getStaffPlan(result: StaffingPlanProps['result']) {
  const laborCost = result.estimated_monthly_cost.labor
  const avgRevenue = result.estimated_monthly_revenue.avg
  const dailyPatients = Math.max(10, Math.round(avgRevenue / 26 / 55000))

  // Staff count estimation based on daily patients
  const doctors = Math.max(1, Math.round(dailyPatients / 30))
  const nurses = Math.max(1, Math.round(dailyPatients / 15))
  const admins = Math.max(1, Math.round(dailyPatients / 25))
  const therapists = dailyPatients > 25 ? Math.max(0, Math.round(dailyPatients / 35)) : 0
  const partTime = dailyPatients > 40 ? 1 : 0
  const totalStaff = doctors + nurses + admins + therapists + partTime

  // Salary breakdown (derive from total labor cost)
  const doctorSalary = Math.round(laborCost * 0.45 / doctors)
  const nurseSalary = Math.round(laborCost * 0.25 / nurses)
  const adminSalary = Math.round(laborCost * 0.15 / admins)
  const therapistSalary = therapists > 0 ? Math.round(laborCost * 0.10 / therapists) : 0
  const partTimeSalary = partTime > 0 ? Math.round(laborCost * 0.05) : 0

  const staffItems = [
    { role: '의사', count: doctors, salary: doctorSalary, subtotal: doctorSalary * doctors, color: STAFF_COLORS[0] },
    { role: '간호사', count: nurses, salary: nurseSalary, subtotal: nurseSalary * nurses, color: STAFF_COLORS[1] },
    { role: '행정직원', count: admins, salary: adminSalary, subtotal: adminSalary * admins, color: STAFF_COLORS[2] },
  ]
  if (therapists > 0) {
    staffItems.push({ role: '물리치료사', count: therapists, salary: therapistSalary, subtotal: therapistSalary * therapists, color: STAFF_COLORS[3] })
  }
  if (partTime > 0) {
    staffItems.push({ role: '파트타임', count: partTime, salary: partTimeSalary, subtotal: partTimeSalary, color: STAFF_COLORS[4] })
  }

  const laborRatio = Math.round((laborCost / avgRevenue) * 100)

  return { staffItems, totalStaff, laborCost, laborRatio }
}

export default function StaffingPlan({ result }: StaffingPlanProps) {
  const { staffItems, totalStaff, laborCost, laborRatio } = React.useMemo(
    () => getStaffPlan(result),
    [result],
  )

  const pieData = staffItems.map((s) => ({ name: s.role, value: s.subtotal }))
  const isEfficient = laborRatio <= 35

  const savingTips = [
    '개원 초기 파트타임 활용으로 고정 인건비 절감',
    '전자차트(EMR) 도입으로 행정 인력 효율화',
    '간호사 멀티태스킹 교육으로 인력 최적화',
    '야간/주말 진료시 추가 수당 대비 매출 분석 필요',
  ]

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <TossIcon icon={UserCheck} color="from-violet-500 to-purple-500" size="sm" shadow="shadow-violet-500/25" />
        <h3 className="font-semibold text-foreground">인력 구성 및 인건비 분석</h3>
        <span className="ml-auto text-[11px] text-muted-foreground">총 {totalStaff}명</span>
      </div>

      {/* Content */}
      <div>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Pie chart */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">직종별 인건비 구성</h4>
            <div className="flex items-center gap-4">
              <div className="relative" style={{ width: 180, height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {staffItems.map((item, idx) => (
                        <Cell key={idx} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => `${formatMoney(v)}원`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs text-muted-foreground">총 인건비</span>
                  <span className="text-base font-bold text-foreground">{formatMoney(laborCost)}</span>
                </div>
              </div>
              <div className="space-y-2">
                {staffItems.map((s) => (
                  <div key={s.role} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-muted-foreground">{s.role}</span>
                    <span className="font-medium text-foreground ml-auto">{Math.round((s.subtotal / laborCost) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Staff table */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">직종별 상세</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2 pr-2 font-medium text-muted-foreground text-xs">직종</th>
                    <th className="py-2 pr-2 font-medium text-muted-foreground text-xs text-center">인원</th>
                    <th className="py-2 pr-2 font-medium text-muted-foreground text-xs text-right">평균급여</th>
                    <th className="py-2 font-medium text-muted-foreground text-xs text-right">소계</th>
                  </tr>
                </thead>
                <tbody>
                  {staffItems.map((s) => (
                    <tr key={s.role} className="border-b border-border/50">
                      <td className="py-2 pr-2 text-xs">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                          <span className="text-foreground">{s.role}</span>
                        </span>
                      </td>
                      <td className="py-2 pr-2 text-xs text-center text-foreground">{s.count}명</td>
                      <td className="py-2 pr-2 text-xs text-right text-muted-foreground">{formatMoney(s.salary)}</td>
                      <td className="py-2 text-xs text-right font-medium text-foreground">{formatMoney(s.subtotal)}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-border">
                    <td className="py-2 pr-2 text-xs font-semibold text-foreground" colSpan={2}>합계</td>
                    <td className="py-2 pr-2 text-xs text-right text-muted-foreground">{totalStaff}명</td>
                    <td className="py-2 text-xs text-right font-bold text-foreground">{formatMoney(laborCost)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Labor cost ratio gauge */}
        <div className={`mt-5 p-3 rounded-xl ${isEfficient ? 'bg-green-50 dark:bg-green-950/30' : 'bg-amber-50 dark:bg-amber-950/30'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">인건비 / 매출 비율</span>
            <span className={`text-lg font-bold ${isEfficient ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {laborRatio}%
            </span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${isEfficient ? 'bg-green-500' : 'bg-amber-500'}`}
              style={{ width: `${Math.min(laborRatio, 100)}%` }}
            />
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            업계 적정 범위: 25~35% · 현재 {isEfficient ? '양호' : '관리 필요'}
          </div>
        </div>

        {/* Cost saving tips */}
        <div className="mt-4 pt-4 border-t border-border">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">인건비 절감 포인트</h4>
          <div className="space-y-1.5">
            {savingTips.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                <span className="text-sm flex-shrink-0 mt-0.5">{['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'][idx] || `${idx+1}.`}</span>
                <span className="text-muted-foreground">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
