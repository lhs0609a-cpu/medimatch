'use client'

import React from 'react'
import { Calculator, CreditCard, PiggyBank, Receipt, Wallet, TrendingUp, TrendingDown, Landmark, Scale, BadgePercent } from 'lucide-react'
import { SimulationResponse } from '@/lib/api/client'

interface Props { result: SimulationResponse }

function Card({ icon: Icon, title, color, children }: { icon: any; title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon className={`w-5 h-5 ${color}`} />
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function fmt(v: number) {
  if (v >= 100000000) return `${(v / 100000000).toFixed(1)}억`
  return `${Math.round(v / 10000).toLocaleString()}만`
}

export default function FinancialPack({ result }: Props) {
  const rev = result.estimated_monthly_revenue
  const cost = result.estimated_monthly_cost
  const profit = result.profitability

  return (
    <>
      {/* 1. 3개년 손익계산서 */}
      <Card icon={Calculator} title="3개년 추정 손익계산서" color="text-blue-600">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left py-2 text-muted-foreground">항목</th>
                <th className="text-right py-2 text-muted-foreground">1차년도</th>
                <th className="text-right py-2 text-muted-foreground">2차년도</th>
                <th className="text-right py-2 text-muted-foreground">3차년도</th>
              </tr>
            </thead>
            <tbody>
              {[
                { item: '매출(보험)', y1: rev.avg * 0.75, y2: rev.avg * 0.75 * 1.15, y3: rev.avg * 0.75 * 1.27, bold: false },
                { item: '매출(비보험)', y1: rev.avg * 0.25, y2: rev.avg * 0.25 * 1.2, y3: rev.avg * 0.25 * 1.35, bold: false },
                { item: '매출 합계', y1: rev.avg, y2: rev.avg * 1.16, y3: rev.avg * 1.29, bold: true },
                { item: '임대료', y1: cost.rent, y2: cost.rent * 1.03, y3: cost.rent * 1.06, bold: false },
                { item: '인건비', y1: cost.labor, y2: cost.labor * 1.05, y3: cost.labor * 1.10, bold: false },
                { item: '재료/소모품', y1: cost.supplies, y2: cost.supplies * 1.08, y3: cost.supplies * 1.12, bold: false },
                { item: '공과금/기타', y1: cost.utilities + cost.other, y2: (cost.utilities + cost.other) * 1.04, y3: (cost.utilities + cost.other) * 1.08, bold: false },
                { item: '마케팅비', y1: 3000000, y2: 2500000, y3: 2000000, bold: false },
                { item: '비용 합계', y1: cost.total + 3000000, y2: (cost.total * 1.05) + 2500000, y3: (cost.total * 1.09) + 2000000, bold: true },
              ].map((r) => (
                <tr key={r.item} className={`border-b border-border/50 ${r.bold ? 'font-bold bg-secondary/30' : ''}`}>
                  <td className="py-2 text-foreground">{r.item}</td>
                  <td className="py-2 text-right text-foreground">{fmt(r.y1 * 12)}</td>
                  <td className="py-2 text-right text-foreground">{fmt(r.y2 * 12)}</td>
                  <td className="py-2 text-right text-foreground">{fmt(r.y3 * 12)}</td>
                </tr>
              ))}
              <tr className="font-bold text-green-600 bg-green-50 dark:bg-green-950/20">
                <td className="py-2">영업이익</td>
                <td className="py-2 text-right">{fmt((rev.avg - cost.total - 3000000) * 12)}</td>
                <td className="py-2 text-right">{fmt((rev.avg * 1.16 - cost.total * 1.05 - 2500000) * 12)}</td>
                <td className="py-2 text-right">{fmt((rev.avg * 1.29 - cost.total * 1.09 - 2000000) * 12)}</td>
              </tr>
              <tr className="text-green-600">
                <td className="py-2 text-sm">영업이익률</td>
                <td className="py-2 text-right text-sm">{Math.round((1 - (cost.total + 3000000) / rev.avg) * 100)}%</td>
                <td className="py-2 text-right text-sm">{Math.round((1 - (cost.total * 1.05 + 2500000) / (rev.avg * 1.16)) * 100)}%</td>
                <td className="py-2 text-right text-sm">{Math.round((1 - (cost.total * 1.09 + 2000000) / (rev.avg * 1.29)) * 100)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* 2. 현금흐름 분석 */}
      <Card icon={Wallet} title="월별 현금흐름 분석" color="text-emerald-600">
        <div className="space-y-1">
          {Array.from({ length: 12 }, (_, i) => {
            const month = i + 1
            const growthFactor = 1 + (i * 0.012)
            const seasonFactor = [0.85, 0.9, 1.1, 1.05, 1.0, 0.85, 0.8, 0.85, 1.1, 1.15, 1.05, 0.9][i]
            const monthRev = rev.avg * growthFactor * seasonFactor
            const monthCost = cost.total + (i < 3 ? 5000000 : 2000000)
            const cashflow = monthRev - monthCost
            const maxCf = rev.avg * 0.6
            return (
              <div key={month} className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground w-8 font-mono">{month}월</span>
                <div className="flex-1 h-4 bg-muted rounded overflow-hidden relative">
                  {cashflow >= 0 ? (
                    <div className="h-full bg-emerald-500 rounded" style={{ width: `${(cashflow / maxCf) * 100}%` }} />
                  ) : (
                    <div className="h-full bg-red-400 rounded" style={{ width: `${(Math.abs(cashflow) / maxCf) * 100}%` }} />
                  )}
                </div>
                <span className={`text-[11px] font-medium w-16 text-right ${cashflow >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {cashflow >= 0 ? '+' : ''}{fmt(cashflow)}
                </span>
              </div>
            )
          })}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg text-center">
            <div className="text-lg font-bold text-emerald-600">{fmt(profit.monthly_profit_avg * 12)}</div>
            <div className="text-[10px] text-muted-foreground">연간 순현금흐름</div>
          </div>
          <div className="p-2 bg-secondary/50 rounded-lg text-center">
            <div className="text-lg font-bold text-foreground">{profit.breakeven_months}개월</div>
            <div className="text-[10px] text-muted-foreground">현금흐름 BEP</div>
          </div>
        </div>
      </Card>

      {/* 3. 투자 회수 시뮬레이션 */}
      <Card icon={PiggyBank} title="투자 회수 시뮬레이션" color="text-orange-500">
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: '총 투자액', value: fmt(450000000) },
            { label: '월 순이익', value: fmt(profit.monthly_profit_avg) },
            { label: '회수 기간', value: `${profit.breakeven_months}개월` },
            { label: '연 ROI', value: `${profit.annual_roi_percent}%` },
          ].map((m) => (
            <div key={m.label} className="text-center p-2 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
              <div className="text-sm font-bold text-orange-600">{m.value}</div>
              <div className="text-[10px] text-muted-foreground">{m.label}</div>
            </div>
          ))}
        </div>
        <div className="space-y-1">
          {[6, 12, 18, 24, 30, 36].map((month) => {
            const cumProfit = profit.monthly_profit_avg * month
            const investment = 450000000
            const recovery = (cumProfit / investment) * 100
            return (
              <div key={month} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-10">{month}개월</span>
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${recovery >= 100 ? 'bg-green-500' : 'bg-orange-500'}`}
                    style={{ width: `${Math.min(recovery, 100)}%` }} />
                </div>
                <span className={`text-xs font-medium w-14 text-right ${recovery >= 100 ? 'text-green-600' : 'text-foreground'}`}>
                  {Math.round(recovery)}%
                </span>
              </div>
            )
          })}
        </div>
      </Card>

      {/* 4. 대출 상환 스케줄 */}
      <Card icon={CreditCard} title="대출 상환 시뮬레이션" color="text-red-500">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
            <div className="text-xl font-bold text-red-600">3억원</div>
            <div className="text-[10px] text-muted-foreground">대출 원금</div>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="text-xl font-bold text-foreground">4.5%</div>
            <div className="text-[10px] text-muted-foreground">연 이자율</div>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="text-xl font-bold text-foreground">60개월</div>
            <div className="text-[10px] text-muted-foreground">상환 기간</div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-1.5 text-muted-foreground text-xs">구간</th>
                <th className="text-right py-1.5 text-muted-foreground text-xs">월 상환</th>
                <th className="text-right py-1.5 text-muted-foreground text-xs">원금</th>
                <th className="text-right py-1.5 text-muted-foreground text-xs">이자</th>
                <th className="text-right py-1.5 text-muted-foreground text-xs">잔액</th>
              </tr>
            </thead>
            <tbody>
              {[
                { period: '1-12월', payment: '559만', principal: '447만', interest: '112만', balance: '2.46억' },
                { period: '13-24월', payment: '559만', principal: '468만', interest: '91만', balance: '1.90억' },
                { period: '25-36월', payment: '559만', principal: '489만', interest: '70만', balance: '1.31억' },
                { period: '37-48월', payment: '559만', principal: '512만', interest: '47만', balance: '0.70억' },
                { period: '49-60월', payment: '559만', principal: '536만', interest: '23만', balance: '0원' },
              ].map((r) => (
                <tr key={r.period} className="border-b border-border/50">
                  <td className="py-1.5 text-foreground">{r.period}</td>
                  <td className="py-1.5 text-right text-foreground">{r.payment}</td>
                  <td className="py-1.5 text-right text-muted-foreground">{r.principal}</td>
                  <td className="py-1.5 text-right text-red-500">{r.interest}</td>
                  <td className="py-1.5 text-right font-medium text-foreground">{r.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">총 이자 비용: <span className="font-bold text-foreground">약 3,430만원</span></p>
      </Card>

      {/* 5. 세금 시뮬레이션 */}
      <Card icon={Receipt} title="세금 · 4대보험 시뮬레이션" color="text-purple-500">
        <div className="space-y-3">
          {[
            { name: '종합소득세', amount: Math.round(profit.monthly_profit_avg * 12 * 0.24), rate: '24%', note: '6천만~8,800만 과세표준' },
            { name: '지방소득세', amount: Math.round(profit.monthly_profit_avg * 12 * 0.024), rate: '2.4%', note: '소득세의 10%' },
            { name: '부가가치세', amount: Math.round(rev.avg * 0.25 * 12 * 0.1), rate: '10%', note: '비보험 매출분' },
            { name: '4대보험(사업주)', amount: Math.round(cost.labor * 0.09 * 12), rate: '~9%', note: '인건비 대비' },
            { name: '재산세/면허세', amount: 2400000, rate: '-', note: '연간 고정비용' },
          ].map((t) => (
            <div key={t.name} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">{t.name}</div>
                <div className="text-[10px] text-muted-foreground">{t.note}</div>
              </div>
              <span className="text-xs text-muted-foreground">{t.rate}</span>
              <span className="text-sm font-bold text-purple-600">{fmt(t.amount)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">연간 세금 총액 (추정)</span>
            <span className="text-lg font-bold text-purple-600">
              {fmt(Math.round(profit.monthly_profit_avg * 12 * 0.264) + Math.round(rev.avg * 0.25 * 12 * 0.1) + Math.round(cost.labor * 0.09 * 12) + 2400000)}
            </span>
          </div>
        </div>
      </Card>

      {/* 6. 감가상각 계획 */}
      <Card icon={TrendingDown} title="감가상각 · 자산 관리" color="text-gray-500">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground">자산</th>
                <th className="text-right py-2 text-muted-foreground">취득가</th>
                <th className="text-right py-2 text-muted-foreground">내용연수</th>
                <th className="text-right py-2 text-muted-foreground">연 상각</th>
              </tr>
            </thead>
            <tbody>
              {[
                { asset: '인테리어', cost: 120000000, years: 5, annual: 24000000 },
                { asset: '의료장비', cost: 180000000, years: 8, annual: 22500000 },
                { asset: '가구/집기', cost: 15000000, years: 5, annual: 3000000 },
                { asset: 'IT/전산', cost: 12000000, years: 4, annual: 3000000 },
                { asset: '차량', cost: 45000000, years: 5, annual: 9000000 },
              ].map((a) => (
                <tr key={a.asset} className="border-b border-border/50">
                  <td className="py-2 text-foreground">{a.asset}</td>
                  <td className="py-2 text-right text-muted-foreground">{fmt(a.cost)}</td>
                  <td className="py-2 text-right text-muted-foreground">{a.years}년</td>
                  <td className="py-2 text-right font-medium text-foreground">{fmt(a.annual)}</td>
                </tr>
              ))}
              <tr className="font-bold bg-secondary/30">
                <td className="py-2 text-foreground">합계</td>
                <td className="py-2 text-right text-foreground">{fmt(372000000)}</td>
                <td className="py-2 text-right text-muted-foreground">-</td>
                <td className="py-2 text-right text-foreground">{fmt(61500000)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">감가상각비는 비용 처리되어 세금 절감 효과 (연 약 {fmt(Math.round(61500000 * 0.24))} 절세)</p>
      </Card>

      {/* 7. 보험료 분석 */}
      <Card icon={Scale} title="사업 보험 분석" color="text-cyan-600">
        <div className="space-y-2">
          {[
            { name: '의료배상책임보험', premium: 2400000, coverage: '1억/건', required: true },
            { name: '화재보험', premium: 960000, coverage: '5억', required: true },
            { name: '근로자재해보상', premium: 1800000, coverage: '법정', required: true },
            { name: '영업배상책임보험', premium: 600000, coverage: '3억', required: false },
            { name: '기기파손보험', premium: 1200000, coverage: '장비가액', required: false },
          ].map((ins) => (
            <div key={ins.name} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{ins.name}</span>
                  {ins.required && <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded">필수</span>}
                </div>
                <div className="text-[10px] text-muted-foreground">보장: {ins.coverage}</div>
              </div>
              <span className="text-sm font-bold text-foreground">{fmt(ins.premium)}/년</span>
            </div>
          ))}
        </div>
        <div className="mt-3 p-2 bg-cyan-50 dark:bg-cyan-950/20 rounded-lg text-center">
          <span className="text-sm text-muted-foreground">연간 보험료 합계: </span>
          <span className="text-lg font-bold text-cyan-600">{fmt(6960000)}</span>
        </div>
      </Card>

      {/* 8. 마케팅 예산 */}
      <Card icon={BadgePercent} title="마케팅 예산 최적 배분" color="text-pink-500">
        <div className="space-y-2 mb-4">
          {[
            { channel: '네이버 플레이스', budget: 800000, roi: 420, color: '#22c55e' },
            { channel: '인스타그램 광고', budget: 500000, roi: 280, color: '#8b5cf6' },
            { channel: '블로그/콘텐츠', budget: 400000, roi: 350, color: '#3b82f6' },
            { channel: '당근마켓', budget: 300000, roi: 310, color: '#f59e0b' },
            { channel: '카카오 광고', budget: 500000, roi: 250, color: '#ef4444' },
            { channel: '오프라인 배너', budget: 200000, roi: 150, color: '#6b7280' },
          ].map((ch) => (
            <div key={ch.channel} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ch.color }} />
              <span className="text-xs text-foreground flex-1">{ch.channel}</span>
              <span className="text-xs text-muted-foreground w-14 text-right">{fmt(ch.budget)}</span>
              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(ch.roi / 420) * 100}%`, backgroundColor: ch.color }} />
              </div>
              <span className="text-xs font-bold text-foreground w-12 text-right">ROI {ch.roi}%</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-2 bg-pink-50 dark:bg-pink-950/20 rounded-lg text-center">
            <div className="text-lg font-bold text-pink-600">{fmt(2700000)}/월</div>
            <div className="text-[10px] text-muted-foreground">추천 마케팅 예산</div>
          </div>
          <div className="p-2 bg-secondary/50 rounded-lg text-center">
            <div className="text-lg font-bold text-foreground">315%</div>
            <div className="text-[10px] text-muted-foreground">평균 ROI</div>
          </div>
        </div>
      </Card>

      {/* 9. 수익 시나리오 */}
      <Card icon={TrendingUp} title="수익 시나리오 분석 (3가지)" color="text-green-600">
        <div className="space-y-3">
          {[
            { scenario: '보수적', patients: 25, rev: rev.min, profit: rev.min - cost.total, color: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20' },
            { scenario: '기본', patients: 38, rev: rev.avg, profit: profit.monthly_profit_avg, color: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/20' },
            { scenario: '낙관적', patients: 52, rev: rev.max, profit: rev.max - cost.total, color: 'bg-green-500', bg: 'bg-green-50 dark:bg-green-950/20' },
          ].map((s) => (
            <div key={s.scenario} className={`p-4 rounded-xl ${s.bg}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-3 h-3 rounded-full ${s.color}`} />
                <span className="text-sm font-bold text-foreground">{s.scenario} 시나리오</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-lg font-bold text-foreground">{s.patients}명</div>
                  <div className="text-[10px] text-muted-foreground">일 환자수</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-foreground">{fmt(s.rev)}</div>
                  <div className="text-[10px] text-muted-foreground">월 매출</div>
                </div>
                <div>
                  <div className={`text-lg font-bold ${s.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmt(s.profit)}</div>
                  <div className="text-[10px] text-muted-foreground">월 순이익</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 10. 재무 건전성 */}
      <Card icon={Landmark} title="재무 건전성 종합 평가" color="text-slate-600">
        <div className="space-y-3">
          {[
            { metric: '부채비율', value: '67%', grade: 'B+', target: '100% 이하', good: true },
            { metric: '유동비율', value: '185%', grade: 'A', target: '150% 이상', good: true },
            { metric: '이자보상배율', value: '4.8배', grade: 'A-', target: '3배 이상', good: true },
            { metric: '순이익률', value: `${Math.round((profit.monthly_profit_avg / rev.avg) * 100)}%`, grade: 'A', target: '20% 이상', good: true },
            { metric: '자기자본비율', value: '33%', grade: 'B', target: '40% 이상', good: false },
            { metric: '매출채권회전율', value: '12.5회', grade: 'A', target: '12회 이상', good: true },
          ].map((m) => (
            <div key={m.metric} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
              <span className="text-sm text-foreground flex-1">{m.metric}</span>
              <span className="text-sm font-bold text-foreground">{m.value}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                m.good ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              }`}>{m.grade}</span>
              <span className="text-[10px] text-muted-foreground w-20 text-right">{m.target}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-950/20 rounded-lg text-center">
          <div className="text-xs text-muted-foreground mb-1">재무 건전성 종합</div>
          <div className="text-2xl font-bold text-foreground">B+ <span className="text-sm font-normal text-green-600">(양호)</span></div>
        </div>
      </Card>
    </>
  )
}
