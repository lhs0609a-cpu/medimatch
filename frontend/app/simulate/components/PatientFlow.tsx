'use client'

import React from 'react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { Users } from 'lucide-react'
import { SimulationResponse } from '@/lib/api/client'

interface PatientFlowProps {
  result: SimulationResponse
}

const SOURCE_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#22c55e', '#ef4444']

function formatMoney(v: number): string {
  if (v >= 100000000) return `${(v / 100000000).toFixed(1)}억`
  return `${Math.round(v / 10000).toLocaleString()}만`
}

export default function PatientFlow({ result }: PatientFlowProps) {
  const avgRevenue = result.estimated_monthly_revenue.avg
  const dailyPatients = Math.max(10, Math.round(avgRevenue / 26 / 55000))
  const monthlyPatients = dailyPatients * 26
  const floating = result.demographics.floating_population_daily
  const isUrban = floating > 50000

  // Patient source distribution (adjusted by location characteristics)
  const sourceData = [
    { name: '도보', value: isUrban ? 32 : 38, color: SOURCE_COLORS[0] },
    { name: '대중교통', value: isUrban ? 28 : 18, color: SOURCE_COLORS[1] },
    { name: '자가용', value: isUrban ? 16 : 24, color: SOURCE_COLORS[2] },
    { name: '소개', value: 14, color: SOURCE_COLORS[3] },
    { name: '온라인', value: isUrban ? 10 : 6, color: SOURCE_COLORS[4] },
  ]

  // New vs returning ratio
  const newPatientRatio = Math.min(45, Math.max(20, 40 - result.competition.same_dept_count * 1.5))
  const returnRatio = 100 - newPatientRatio

  // Monthly new patient forecast (6 months, growth curve)
  const acquisitionData = Array.from({ length: 6 }, (_, i) => {
    const month = i + 1
    const growthFactor = Math.min(1, 0.5 + month * 0.1)
    const newPatients = Math.round(monthlyPatients * (newPatientRatio / 100) * growthFactor)
    return { month: `${month}개월`, newPatients, total: Math.round(newPatients * (100 / newPatientRatio)) }
  })

  // Retention rate
  const retentionRate = Math.min(85, Math.max(55, 70 + result.confidence_score * 0.15 - result.competition.same_dept_count * 1.2))

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <Users className="w-5 h-5 text-indigo-500" />
        <h3 className="font-semibold text-foreground">환자 유입 경로 분석</h3>
        <span className="ml-auto text-[11px] text-muted-foreground">월 {monthlyPatients}명 기준</span>
      </div>

      {/* Content */}
      <div>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Pie chart - patient sources */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">유입 경로별 비중</h4>
            <div className="flex items-center gap-4">
              <div className="relative" style={{ width: 180, height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {sourceData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => `${v}%`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs text-muted-foreground">일 환자</span>
                  <span className="text-lg font-bold text-foreground">{dailyPatients}명</span>
                </div>
              </div>
              <div className="space-y-2">
                {sourceData.map((s) => (
                  <div key={s.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-muted-foreground w-14">{s.name}</span>
                    <span className="font-medium text-foreground">{s.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* New vs Returning + Retention */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">신규 vs 재방문</h4>
            {/* Horizontal bar */}
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">신규 환자</span>
                  <span className="font-medium text-foreground">{newPatientRatio.toFixed(0)}%</span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${newPatientRatio}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">재방문 환자</span>
                  <span className="font-medium text-foreground">{returnRatio.toFixed(0)}%</span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${returnRatio}%` }} />
                </div>
              </div>
            </div>

            {/* Retention gauge */}
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-muted-foreground">환자 재방문율</span>
                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{retentionRate.toFixed(0)}%</span>
              </div>
              <div className="h-2.5 bg-indigo-200/50 dark:bg-indigo-800/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full"
                  style={{ width: `${retentionRate}%` }}
                />
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">
                업계 평균 65% 대비 {retentionRate > 65 ? '우수' : '보통'}
              </div>
            </div>
          </div>
        </div>

        {/* 6-month new patient forecast */}
        <div className="mt-5 pt-5 border-t border-border">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">월별 신규 환자 유입 예측 (개원 후 6개월)</h4>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={acquisitionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #e5e7eb)" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => [`${v}명`]} />
                <Bar dataKey="newPatients" name="신규 환자" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
