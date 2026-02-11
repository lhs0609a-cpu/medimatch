'use client'

import React from 'react'
import {
  Calendar, MapPin, FileCheck, Paintbrush, MonitorSmartphone, Users, Megaphone, PlayCircle, CheckCircle2,
} from 'lucide-react'
import { SimulationResponse } from '@/lib/api/client'

function formatMoney(v: number): string {
  if (v >= 100000000) return `${(v / 100000000).toFixed(1)}억`
  return `${Math.round(v / 10000).toLocaleString()}만`
}

const TIMELINE_STEPS = [
  {
    icon: MapPin,
    title: '입지 선정',
    months: 1,
    color: 'bg-blue-500',
    costRatio: 0.02,
    tasks: ['상권 분석 및 입지 확정', '임대차 계약 체결', '권리금/보증금 확보'],
  },
  {
    icon: FileCheck,
    title: '인허가',
    months: 2,
    color: 'bg-indigo-500',
    costRatio: 0.03,
    tasks: ['의료기관 개설 신고', '사업자등록 및 세무 설정', '의료폐기물 위탁 계약'],
  },
  {
    icon: Paintbrush,
    title: '인테리어',
    months: 3,
    color: 'bg-violet-500',
    costRatio: 0.35,
    tasks: ['설계 및 시공업체 선정', '진료실/대기실 공사', '간판 및 외부 사인 제작'],
  },
  {
    icon: MonitorSmartphone,
    title: '장비 구매',
    months: 2,
    color: 'bg-purple-500',
    costRatio: 0.40,
    tasks: ['의료장비 선정 및 발주', 'EMR/차트 시스템 구축', '전화/예약 시스템 설치'],
  },
  {
    icon: Users,
    title: '인력 채용',
    months: 2,
    color: 'bg-rose-500',
    costRatio: 0.05,
    tasks: ['간호사/간호조무사 채용', '접수/원무 직원 채용', '직원 교육 및 매뉴얼 작성'],
  },
  {
    icon: Megaphone,
    title: '마케팅 준비',
    months: 1,
    color: 'bg-orange-500',
    costRatio: 0.08,
    tasks: ['네이버플레이스 등록', '블로그/SNS 사전 마케팅', '개원 이벤트 기획'],
  },
  {
    icon: PlayCircle,
    title: '시범 운영',
    months: 1,
    color: 'bg-amber-500',
    costRatio: 0.05,
    tasks: ['지인/가족 대상 시범 진료', '운영 프로세스 점검', '초기 피드백 반영 개선'],
  },
  {
    icon: CheckCircle2,
    title: '정식 개원',
    months: 0,
    color: 'bg-green-500',
    costRatio: 0.02,
    tasks: ['정식 개원 행사', '온라인 광고 본격 개시', '환자 확보 및 안정화'],
  },
]

export default function OpeningTimeline({ result }: { result: SimulationResponse }) {
  const monthlyCost = result.estimated_monthly_cost.total
  const breakevenMonths = result.profitability.breakeven_months
  // Rough estimate of total opening investment
  const totalInvestment = Math.round(monthlyCost * breakevenMonths * 0.8)
  const totalMonths = TIMELINE_STEPS.reduce((s, step) => s + step.months, 0)

  let cumulativeMonth = 0

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Calendar className="w-5 h-5 text-orange-500" />
        <h3 className="font-semibold text-foreground">개원 준비 타임라인</h3>
        <span className="ml-auto text-[11px] text-muted-foreground">총 {totalMonths}개월 소요</span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/30 rounded-xl">
          <div className="text-xl font-bold text-orange-600 dark:text-orange-400">{totalMonths}<span className="text-sm font-normal">개월</span></div>
          <div className="text-[11px] text-muted-foreground">총 준비 기간</div>
        </div>
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatMoney(totalInvestment)}원</div>
          <div className="text-[11px] text-muted-foreground">예상 총 투자비</div>
        </div>
        <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-xl">
          <div className="text-xl font-bold text-green-600 dark:text-green-400">8<span className="text-sm font-normal">단계</span></div>
          <div className="text-[11px] text-muted-foreground">주요 단계</div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {TIMELINE_STEPS.map((step, i) => {
          const Icon = step.icon
          const startMonth = cumulativeMonth
          cumulativeMonth += step.months
          const estimatedCost = Math.round(totalInvestment * step.costRatio)
          const costPercent = Math.round(step.costRatio * 100)
          const isLast = i === TIMELINE_STEPS.length - 1

          return (
            <div key={i} className="flex gap-3 relative">
              {/* Vertical line */}
              {!isLast && (
                <div
                  className="absolute left-[19px] top-10 w-0.5 bg-border"
                  style={{ height: 'calc(100% - 16px)' }}
                />
              )}

              {/* Icon */}
              <div className={`w-10 h-10 rounded-full ${step.color} flex items-center justify-center flex-shrink-0 z-10`}>
                <Icon className="w-5 h-5 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1 pb-5">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-foreground">{step.title}</h4>
                  {step.months > 0 && (
                    <span className="text-[10px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                      {startMonth + 1}~{cumulativeMonth}개월차 · {step.months}개월
                    </span>
                  )}
                  {isLast && (
                    <span className="text-[10px] px-2 py-0.5 bg-green-100 dark:bg-green-900/30 rounded-full text-green-700 dark:text-green-300 font-semibold">
                      D-Day
                    </span>
                  )}
                </div>

                {/* Tasks */}
                <ul className="text-xs text-muted-foreground space-y-0.5 mb-2">
                  {step.tasks.map((task, j) => (
                    <li key={j} className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/40 flex-shrink-0" />
                      {task}
                    </li>
                  ))}
                </ul>

                {/* Cost Progress Bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${step.color} transition-all duration-500`}
                      style={{ width: `${costPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatMoney(estimatedCost)}원 ({costPercent}%)
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg text-xs text-muted-foreground">
        <span className="font-semibold text-orange-700 dark:text-orange-300">준비 팁:</span>{' '}
        인허가와 인테리어를 병행하면 약 1~2개월 단축이 가능합니다.
        장비 발주는 인테리어 설계 확정 직후 진행하여 공기를 최소화하세요.
      </div>
    </div>
  )
}
