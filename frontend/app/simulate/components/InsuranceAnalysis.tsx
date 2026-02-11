'use client'

import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { FileText } from 'lucide-react'
import { SimulationResponse } from '@/lib/api/client'

interface InsuranceAnalysisProps {
  result: SimulationResponse
}

function formatMoney(v: number): string {
  if (v >= 100000000) return `${(v / 100000000).toFixed(1)}억`
  return `${Math.round(v / 10000).toLocaleString()}만`
}

// Clinic-type based insurance ratios
function getInsuranceRatio(clinicType: string): number {
  const ratios: Record<string, number> = {
    '내과': 0.78, '정형외과': 0.72, '소아청소년과': 0.82, '이비인후과': 0.75,
    '안과': 0.55, '피부과': 0.35, '성형외과': 0.15, '치과': 0.40,
    '산부인과': 0.65, '비뇨의학과': 0.60, '신경과': 0.70, '정신건강의학과': 0.68,
    '재활의학과': 0.74, '가정의학과': 0.76, '한의원': 0.58,
  }
  return ratios[clinicType] || 0.65
}

// Fee schedule items per clinic type
function getFeeItems(clinicType: string, avgRevenue: number) {
  const dailyPatients = Math.max(10, Math.round(avgRevenue / 26 / 55000))
  const baseItems: Record<string, Array<{ item: string; insured: number; uninsured: number; count: number }>> = {
    default: [
      { item: '초진 진찰료', insured: 18620, uninsured: 45000, count: Math.round(dailyPatients * 0.3) },
      { item: '재진 진찰료', insured: 12140, uninsured: 30000, count: Math.round(dailyPatients * 0.5) },
      { item: '혈액 검사', insured: 15800, uninsured: 50000, count: Math.round(dailyPatients * 0.25) },
      { item: '영상 촬영', insured: 22400, uninsured: 80000, count: Math.round(dailyPatients * 0.15) },
      { item: '주사 처치', insured: 8900, uninsured: 35000, count: Math.round(dailyPatients * 0.2) },
      { item: '물리치료', insured: 9200, uninsured: 25000, count: Math.round(dailyPatients * 0.12) },
      { item: '특수 상담', insured: 0, uninsured: 60000, count: Math.round(dailyPatients * 0.08) },
    ],
  }
  return baseItems.default
}

export default function InsuranceAnalysis({ result }: InsuranceAnalysisProps) {
  const avgRevenue = result.estimated_monthly_revenue.avg
  const insuranceRatio = getInsuranceRatio(result.clinic_type)
  const nonInsuranceRatio = 1 - insuranceRatio
  const insuredRevenue = avgRevenue * insuranceRatio
  const uninsuredRevenue = avgRevenue * nonInsuranceRatio
  const dailyPatients = Math.max(10, Math.round(avgRevenue / 26 / 55000))
  const avgInsuredFee = Math.round(insuredRevenue / 26 / (dailyPatients * insuranceRatio))
  const avgUninsuredFee = Math.round(uninsuredRevenue / 26 / Math.max(1, dailyPatients * nonInsuranceRatio))

  // Monthly stacked data (12 months with seasonal variation)
  const seasonalFactors = [0.90, 0.88, 1.08, 1.05, 1.02, 0.88, 0.82, 0.80, 1.05, 1.12, 1.15, 0.95]
  const monthlyData = seasonalFactors.map((factor, i) => {
    const monthRevenue = avgRevenue * factor
    return {
      month: `${i + 1}월`,
      insured: Math.round(monthRevenue * insuranceRatio),
      uninsured: Math.round(monthRevenue * nonInsuranceRatio),
    }
  })

  const feeItems = getFeeItems(result.clinic_type, avgRevenue)

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <FileText className="w-5 h-5 text-cyan-500" />
        <h3 className="font-semibold text-foreground">보험 / 비보험 수가 분석</h3>
        <span className="ml-auto text-[11px] text-muted-foreground">{result.clinic_type}</span>
      </div>

      {/* Content */}
      <div>
        {/* Key metrics */}
        <div className="grid grid-cols-4 gap-2 md:gap-3 mb-5">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{(insuranceRatio * 100).toFixed(0)}%</div>
            <div className="text-[11px] text-muted-foreground">보험 비율</div>
          </div>
          <div className="text-center p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{(nonInsuranceRatio * 100).toFixed(0)}%</div>
            <div className="text-[11px] text-muted-foreground">비보험 비율</div>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-xl">
            <div className="text-lg font-bold text-foreground">{(avgInsuredFee / 10000).toFixed(1)}만</div>
            <div className="text-[11px] text-muted-foreground">보험 진료단가</div>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-xl">
            <div className="text-lg font-bold text-foreground">{(avgUninsuredFee / 10000).toFixed(1)}만</div>
            <div className="text-[11px] text-muted-foreground">비보험 진료단가</div>
          </div>
        </div>

        {/* Stacked bar chart */}
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #e5e7eb)" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatMoney(v)} />
              <Tooltip
                formatter={(v: number, name: string) => [
                  `${formatMoney(v)}원`,
                  name === 'insured' ? '보험 매출' : '비보험 매출',
                ]}
              />
              <Legend formatter={(v) => (v === 'insured' ? '보험' : '비보험')} />
              <Bar dataKey="insured" stackId="revenue" fill="#3b82f6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="uninsured" stackId="revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Fee schedule table */}
        <div className="mt-5 pt-5 border-t border-border">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">진료 항목별 수가 비교</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-3 font-medium text-muted-foreground text-xs">항목</th>
                  <th className="py-2 pr-3 font-medium text-blue-500 text-xs text-right">보험수가</th>
                  <th className="py-2 pr-3 font-medium text-amber-500 text-xs text-right">비보험수가</th>
                  <th className="py-2 font-medium text-muted-foreground text-xs text-right">일 예상건수</th>
                </tr>
              </thead>
              <tbody>
                {feeItems.map((item) => (
                  <tr key={item.item} className="border-b border-border/50">
                    <td className="py-2 pr-3 text-foreground text-xs">{item.item}</td>
                    <td className="py-2 pr-3 text-right text-xs font-medium text-blue-600 dark:text-blue-400">
                      {item.insured > 0 ? `${(item.insured).toLocaleString()}원` : '-'}
                    </td>
                    <td className="py-2 pr-3 text-right text-xs font-medium text-amber-600 dark:text-amber-400">
                      {(item.uninsured).toLocaleString()}원
                    </td>
                    <td className="py-2 text-right text-xs text-muted-foreground">{item.count}건</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
