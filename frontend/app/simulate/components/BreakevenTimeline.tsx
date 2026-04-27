'use client'

import React from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import { Target, Calendar, TrendingUp } from 'lucide-react'
import { SimulationResponse } from '@/lib/api/client'

interface Props {
  result: SimulationResponse
}

function won(v: number): string {
  const abs = Math.abs(v)
  if (abs >= 100_000_000) return `${(v / 100_000_000).toFixed(1)}억`
  if (abs >= 10_000) return `${Math.round(v / 10_000).toLocaleString()}만`
  return v.toLocaleString()
}

export default function BreakevenTimeline({ result }: Props) {
  const pnl = result.five_year_pnl
  const cap = result.capital_plan
  if (!pnl || !cap) return null

  const ownCapital = Math.round(cap.grand_total / 2)
  const data: { month: number; cumulative: number; monthly: number }[] = []
  let cumulative = -ownCapital
  for (const p of pnl.projections) {
    for (let m = 1; m <= 12; m++) {
      cumulative += p.monthly_profit_before_tax
      data.push({
        month: (p.year - 1) * 12 + m,
        cumulative,
        monthly: p.monthly_profit_before_tax,
      })
    }
  }

  const beIndex = data.findIndex((d) => d.cumulative >= 0)
  const beMonth = beIndex >= 0 ? data[beIndex].month : null
  const finalCumulative = data[data.length - 1]?.cumulative ?? 0

  const yr1End = data[11]?.cumulative ?? 0
  const yr3End = data[35]?.cumulative ?? 0
  const yr1Roi = ownCapital > 0 ? Math.round(((yr1End + ownCapital) / ownCapital) * 100 - 100) : 0
  const yr3Roi = ownCapital > 0 ? Math.round(((yr3End + ownCapital) / ownCapital) * 100 - 100) : 0

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-emerald-600" />
        <h3 className="font-semibold text-foreground">손익분기 타임라인 (5년)</h3>
        <span className="ml-auto text-[11px] text-muted-foreground">
          5년 손익 모델 + 자기자본 50% 기준
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" />자기자본 회수
          </div>
          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {beMonth ? `${beMonth}개월` : '5년 내 미회수'}
          </div>
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
          <div className="text-[11px] text-muted-foreground">자기자본 투입</div>
          <div className="text-lg font-bold">-{won(ownCapital)}</div>
        </div>
        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
          <div className="text-[11px] text-muted-foreground">1년차 ROI</div>
          <div className={`text-lg font-bold ${yr1Roi >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {yr1Roi >= 0 ? '+' : ''}{yr1Roi}%
          </div>
        </div>
        <div className="p-3 bg-violet-50 dark:bg-violet-950/30 rounded-xl">
          <div className="text-[11px] text-muted-foreground">3년차 ROI</div>
          <div className={`text-lg font-bold ${yr3Roi >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {yr3Roi >= 0 ? '+' : ''}{yr3Roi}%
          </div>
        </div>
      </div>

      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="cumGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #e5e7eb)" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10 }}
              tickFormatter={(v) => `${Math.ceil(v / 12)}년`}
              ticks={[6, 12, 18, 24, 30, 36, 42, 48, 54, 60]}
            />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => won(v)} />
            <Tooltip
              formatter={(v: number) => [`${won(v)}원`, '누적 손익']}
              labelFormatter={(m) => `${m}개월차`}
            />
            <ReferenceLine y={0} stroke="#dc2626" strokeDasharray="3 3" label={{ value: '손익분기선', position: 'right', fontSize: 10, fill: '#dc2626' }} />
            {beMonth && (
              <ReferenceLine
                x={beMonth}
                stroke="#059669"
                strokeDasharray="3 3"
                label={{ value: `회수 ${beMonth}개월`, position: 'top', fontSize: 10, fill: '#059669' }}
              />
            )}
            <Area type="monotone" dataKey="cumulative" stroke="#10b981" strokeWidth={2} fill="url(#cumGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 p-3 bg-muted/40 rounded-lg">
        <div className="flex items-center gap-2 text-sm mb-1">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold">5년 누적 손익</span>
          <span className={`ml-auto font-bold ${finalCumulative >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {finalCumulative >= 0 ? '+' : ''}{won(finalCumulative)}원
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          ※ 신규개원 환자증가 곡선 (1년 60% → 5년 100%) + 대출 월 상환액 차감 후 누적.
          가짜 random 아닌 검증 가능한 모델 기반.
        </p>
      </div>
    </div>
  )
}
