'use client'

import React from 'react'
import { Wallet, CircleDollarSign, TrendingDown, Percent, Receipt, CreditCard, HandCoins, PiggyBank, ArrowDownUp, Landmark } from 'lucide-react'
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

export default function FinancialPack2({ result }: Props) {
  const rev = result.estimated_monthly_revenue
  const cost = result.estimated_monthly_cost
  const profit = result.profitability

  return (
    <>
      {/* 1. 절세 전략 */}
      <Card icon={Receipt} title="절세 전략 시뮬레이션" color="text-green-600">
        <div className="space-y-3">
          {[
            { strategy: '성실신고확인제 활용', saving: Math.round(profit.monthly_profit_avg * 0.02 * 12), difficulty: '쉬움', desc: '세무사 성실신고 확인 시 의료비 세액공제 추가' },
            { strategy: '퇴직연금(IRP) 가입', saving: 9000000, difficulty: '쉬움', desc: '연 900만원 한도 세액공제 16.5%' },
            { strategy: '노란우산공제', saving: 5000000, difficulty: '쉬움', desc: '연 500만원 소득공제, 폐업 시 안전망' },
            { strategy: '감가상각 최적화', saving: Math.round(61500000 * 0.24), difficulty: '보통', desc: '장비/인테리어 감가상각 비용처리' },
            { strategy: '가족 급여 분산', saving: Math.round(36000000 * 0.15), difficulty: '주의', desc: '배우자/가족 적정 급여 분산 (실근무 필수)' },
            { strategy: '업무용 차량 비용처리', saving: 8000000, difficulty: '보통', desc: '업무용 차량 유지비, 감가상각 비용처리' },
          ].map((s) => (
            <div key={s.strategy} className="p-3 bg-secondary/30 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{s.strategy}</span>
                <span className="text-sm font-bold text-green-600">{fmt(s.saving)} 절세</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground flex-1">{s.desc}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ml-2 ${
                  s.difficulty === '쉬움' ? 'bg-green-100 text-green-600' :
                  s.difficulty === '보통' ? 'bg-blue-100 text-blue-600' :
                  'bg-amber-100 text-amber-600'
                }`}>{s.difficulty}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg text-center">
          <span className="text-xs text-muted-foreground">연간 절세 가능 총액: </span>
          <span className="text-lg font-bold text-green-600">약 {fmt(Math.round(profit.monthly_profit_avg * 0.02 * 12) + 9000000 + 5000000 + Math.round(61500000 * 0.24) + Math.round(36000000 * 0.15) + 8000000)}</span>
        </div>
      </Card>

      {/* 2. 자금 조달 옵션 */}
      <Card icon={CreditCard} title="자금 조달 옵션 비교" color="text-blue-600">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left py-2 text-muted-foreground text-xs">조달 방법</th>
                <th className="text-right py-2 text-muted-foreground text-xs">한도</th>
                <th className="text-right py-2 text-muted-foreground text-xs">금리</th>
                <th className="text-right py-2 text-muted-foreground text-xs">기간</th>
                <th className="text-right py-2 text-muted-foreground text-xs">장단점</th>
              </tr>
            </thead>
            <tbody>
              {[
                { method: '시중은행 (의사전용)', limit: '5억', rate: '3.8-4.5%', term: '5-10년', pros: '낮은 금리' },
                { method: '소상공인진흥공단', limit: '1억', rate: '2.0-3.5%', term: '5-7년', pros: '정부 지원' },
                { method: '신용보증기금', limit: '3억', rate: '3.5-4.2%', term: '5년', pros: '담보 불필요' },
                { method: '의협 의료인 대출', limit: '3억', rate: '3.2-4.0%', term: '5-7년', pros: '우대 금리' },
                { method: '리스/할부 (장비)', limit: '장비가', rate: '4.5-6.0%', term: '3-5년', pros: '초기 부담 감소' },
                { method: '자기자본', limit: '-', rate: '0%', term: '-', pros: '이자 없음' },
              ].map((f) => (
                <tr key={f.method} className="border-b border-border/50">
                  <td className="py-1.5 text-foreground text-xs">{f.method}</td>
                  <td className="py-1.5 text-right text-foreground text-xs">{f.limit}</td>
                  <td className="py-1.5 text-right text-muted-foreground text-xs">{f.rate}</td>
                  <td className="py-1.5 text-right text-muted-foreground text-xs">{f.term}</td>
                  <td className="py-1.5 text-right text-blue-600 text-xs">{f.pros}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-3">추천: 자기자본 30% + 은행 대출 50% + 장비 리스 20% 조합</p>
      </Card>

      {/* 3. 비보험 수익 극대화 */}
      <Card icon={CircleDollarSign} title="비보험 수익 극대화 전략" color="text-violet-600">
        <div className="space-y-2 mb-4">
          {[
            { item: '도수치료', unitPrice: 80000, freq: 120, monthly: 9600000, margin: 75, color: '#8b5cf6' },
            { item: '체외충격파', unitPrice: 50000, freq: 85, monthly: 4250000, margin: 70, color: '#a78bfa' },
            { item: '프롤로치료', unitPrice: 120000, freq: 40, monthly: 4800000, margin: 68, color: '#c4b5fd' },
            { item: 'PRP 주사', unitPrice: 200000, freq: 25, monthly: 5000000, margin: 65, color: '#ddd6fe' },
            { item: '건강검진 패키지', unitPrice: 150000, freq: 30, monthly: 4500000, margin: 60, color: '#ede9fe' },
            { item: '비만/체형 관리', unitPrice: 100000, freq: 35, monthly: 3500000, margin: 72, color: '#f5f3ff' },
          ].map((i) => (
            <div key={i.item} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: i.color }} />
              <span className="text-xs text-foreground flex-1">{i.item}</span>
              <span className="text-[10px] text-muted-foreground w-12 text-right">{i.freq}건</span>
              <span className="text-[10px] font-medium text-foreground w-14 text-right">{fmt(i.monthly)}</span>
              <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${i.margin}%`, backgroundColor: i.color }} />
              </div>
              <span className="text-[10px] font-bold text-violet-600 w-10 text-right">{i.margin}%</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-2 bg-violet-50 dark:bg-violet-950/20 rounded-lg text-center">
            <div className="text-lg font-bold text-violet-600">{fmt(31650000)}</div>
            <div className="text-[10px] text-muted-foreground">월 비보험 매출 예상</div>
          </div>
          <div className="p-2 bg-secondary/50 rounded-lg text-center">
            <div className="text-lg font-bold text-foreground">70%</div>
            <div className="text-[10px] text-muted-foreground">평균 마진율</div>
          </div>
        </div>
      </Card>

      {/* 4. 보험/비보험 최적 비율 */}
      <Card icon={Percent} title="보험/비보험 비율 최적화" color="text-orange-500">
        <div className="space-y-3 mb-4">
          {[
            { ratio: '보험 90% : 비보험 10%', margin: 22, risk: '낮음', revenue: rev.avg * 0.85, desc: '안정적이지만 마진 낮음' },
            { ratio: '보험 75% : 비보험 25%', margin: 35, risk: '보통', revenue: rev.avg, desc: '업계 평균, 균형 잡힌 구조' },
            { ratio: '보험 60% : 비보험 40%', margin: 48, risk: '보통', revenue: rev.avg * 1.15, desc: '높은 수익성, 마케팅 필요' },
            { ratio: '보험 40% : 비보험 60%', margin: 55, risk: '높음', revenue: rev.avg * 1.3, desc: '고수익 고위험, 브랜딩 필수' },
          ].map((r, i) => (
            <div key={r.ratio} className={`p-3 rounded-lg border ${i === 2 ? 'border-orange-300 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800' : 'border-border bg-secondary/30'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{r.ratio}</span>
                {i === 2 && <span className="text-[10px] px-2 py-0.5 bg-orange-500 text-white rounded-full">추천</span>}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                <div>마진율: <span className="font-bold text-foreground">{r.margin}%</span></div>
                <div>리스크: <span className="font-bold">{r.risk}</span></div>
                <div>월 매출: <span className="font-bold text-foreground">{fmt(r.revenue)}</span></div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">{r.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* 5. 매출 안정화 전략 */}
      <Card icon={ArrowDownUp} title="매출 변동성 · 안정화 전략" color="text-teal-500">
        <div className="space-y-2 mb-4">
          {Array.from({ length: 12 }, (_, i) => {
            const month = i + 1
            const factor = [0.82, 0.88, 1.08, 1.12, 1.05, 0.85, 0.78, 0.82, 1.10, 1.15, 1.08, 0.88][i]
            const revenue = Math.round(rev.avg * factor)
            return (
              <div key={month} className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground w-8 font-mono">{month}월</span>
                <div className="flex-1 h-4 bg-muted rounded overflow-hidden">
                  <div className={`h-full rounded ${factor >= 1.05 ? 'bg-green-500' : factor >= 0.95 ? 'bg-blue-400' : factor >= 0.85 ? 'bg-amber-400' : 'bg-red-400'}`}
                    style={{ width: `${(revenue / (rev.avg * 1.2)) * 100}%` }} />
                </div>
                <span className="text-[11px] font-medium text-foreground w-14 text-right">{fmt(revenue)}</span>
                <span className={`text-[10px] w-10 text-right ${factor >= 1 ? 'text-green-600' : 'text-red-500'}`}>
                  {factor >= 1 ? '+' : ''}{Math.round((factor - 1) * 100)}%
                </span>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-muted-foreground p-2 bg-teal-50 dark:bg-teal-950/20 rounded-lg">
          변동폭 {Math.round((1.15 - 0.78) * 100)}%. 비수기(7-8월) 대비: 건강검진 이벤트, 비보험 시술 프로모션 권장
        </p>
      </Card>

      {/* 6. 현금 보유고 전략 */}
      <Card icon={Wallet} title="비상 운전자금 · 현금 관리" color="text-cyan-600">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 bg-cyan-50 dark:bg-cyan-950/20 rounded-lg">
            <div className="text-xl font-bold text-cyan-600">3개월</div>
            <div className="text-[10px] text-muted-foreground">최소 운전자금</div>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="text-xl font-bold text-foreground">{fmt(cost.total * 3)}</div>
            <div className="text-[10px] text-muted-foreground">필요 금액</div>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="text-xl font-bold text-foreground">6개월</div>
            <div className="text-[10px] text-muted-foreground">권장 보유고</div>
          </div>
        </div>
        <div className="space-y-2">
          {[
            { scenario: '정상 운영', months: 99, cash: cost.total * 1, color: 'bg-green-500' },
            { scenario: '매출 30% 감소', months: 18, cash: cost.total * 3, color: 'bg-amber-500' },
            { scenario: '매출 50% 감소', months: 8, cash: cost.total * 6, color: 'bg-orange-500' },
            { scenario: '매출 중단', months: 3, cash: cost.total * 3, color: 'bg-red-500' },
          ].map((s) => (
            <div key={s.scenario} className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.color}`} />
              <span className="text-xs text-foreground flex-1">{s.scenario}</span>
              <span className="text-xs text-muted-foreground">버틸 수 있는 기간:</span>
              <span className="text-xs font-bold text-foreground">{s.months}개월</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 7. 급여 분배 최적화 */}
      <Card icon={HandCoins} title="원장 급여 · 배당 최적화" color="text-pink-600">
        <div className="space-y-3">
          {[
            { plan: '급여 중심형', salary: '월 1,200만', dividend: '분기 500만', tax: '적음', flexibility: '낮음' },
            { plan: '배당 중심형', salary: '월 500만', dividend: '분기 2,000만', tax: '보통', flexibility: '높음' },
            { plan: '균형형 (추천)', salary: '월 800만', dividend: '분기 1,000만', tax: '최적', flexibility: '보통' },
          ].map((p, i) => (
            <div key={p.plan} className={`p-4 rounded-xl ${i === 2 ? 'bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800' : 'bg-secondary/30'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-foreground">{p.plan}</span>
                {i === 2 && <span className="text-[10px] px-2 py-0.5 bg-pink-500 text-white rounded-full">추천</span>}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>월 급여: <span className="font-medium text-foreground">{p.salary}</span></div>
                <div>배당: <span className="font-medium text-foreground">{p.dividend}</span></div>
                <div>세금 부담: <span className="font-medium text-foreground">{p.tax}</span></div>
                <div>유연성: <span className="font-medium text-foreground">{p.flexibility}</span></div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 8. 보증금 활용 */}
      <Card icon={PiggyBank} title="보증금 · 유휴 자금 활용" color="text-amber-500">
        <div className="space-y-2">
          {[
            { method: 'MMF (수시 입출금)', rate: '3.2%', risk: '매우 낮음', liquidity: '즉시', amount: '운전자금' },
            { method: '정기예금 (은행)', rate: '3.8%', risk: '낮음', liquidity: '1-12개월', amount: '여유자금' },
            { method: 'RP (환매조건부채권)', rate: '3.5%', risk: '낮음', liquidity: '1일-3개월', amount: '단기 유동' },
            { method: '채권형 펀드', rate: '4.2%', risk: '보통', liquidity: '2-3일', amount: '중기 여유자금' },
            { method: '적금 (목적자금)', rate: '4.0%', risk: '낮음', liquidity: '6-24개월', amount: '장비 교체 대비' },
          ].map((m) => (
            <div key={m.method} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
              <span className="text-sm text-foreground flex-1">{m.method}</span>
              <span className="text-xs font-bold text-amber-600 w-10 text-right">{m.rate}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                m.risk === '매우 낮음' || m.risk === '낮음' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
              }`}>{m.risk}</span>
              <span className="text-[10px] text-muted-foreground w-16 text-right">{m.liquidity}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">유휴 자금 1억원 운용 시 연 약 {fmt(4000000)} 이자 수익 가능</p>
      </Card>

      {/* 9. 5년 재무 로드맵 */}
      <Card icon={TrendingDown} title="5년 재무 로드맵" color="text-indigo-600">
        <div className="space-y-3">
          {[
            { year: '1년차', goal: '안정화', revenue: rev.avg, profit: profit.monthly_profit_avg * 0.7, debt: '대출 원금 상환 시작', milestone: '월 매출 {r}원 달성' },
            { year: '2년차', goal: '성장', revenue: rev.avg * 1.15, profit: profit.monthly_profit_avg * 1.1, debt: '대출 40% 상환', milestone: '비보험 매출 비중 30% 달성' },
            { year: '3년차', goal: '최적화', revenue: rev.avg * 1.3, profit: profit.monthly_profit_avg * 1.3, debt: '대출 70% 상환', milestone: '2호점 검토 시작' },
            { year: '4년차', goal: '확장', revenue: rev.avg * 1.45, profit: profit.monthly_profit_avg * 1.5, debt: '대출 완납', milestone: '자산 투자 시작' },
            { year: '5년차', goal: '자산 형성', revenue: rev.avg * 1.6, profit: profit.monthly_profit_avg * 1.7, debt: '무차입', milestone: '순자산 10억 달성' },
          ].map((y, i) => (
            <div key={y.year} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center ${
                  ['bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500'][i]
                }`}>{i + 1}</div>
                {i < 4 && <div className="w-0.5 flex-1 bg-border mt-1" />}
              </div>
              <div className="flex-1 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-foreground">{y.year}</span>
                  <span className="text-[10px] px-2 py-0.5 bg-secondary rounded-full text-muted-foreground">{y.goal}</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                  <div>월 매출: <span className="font-medium text-foreground">{fmt(y.revenue)}</span></div>
                  <div>월 이익: <span className="font-medium text-green-600">{fmt(y.profit)}</span></div>
                  <div>{y.debt}</div>
                  <div className="text-indigo-600">{y.milestone.replace('{r}', fmt(y.revenue))}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 10. 은퇴 자금 시뮬레이션 */}
      <Card icon={Landmark} title="은퇴 자금 시뮬레이션" color="text-slate-600">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="text-xl font-bold text-foreground">65세</div>
            <div className="text-[10px] text-muted-foreground">목표 은퇴 연령</div>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="text-xl font-bold text-foreground">30억</div>
            <div className="text-[10px] text-muted-foreground">목표 은퇴 자금</div>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="text-xl font-bold text-foreground">월 500만</div>
            <div className="text-[10px] text-muted-foreground">은퇴 후 월 소득</div>
          </div>
        </div>
        <div className="space-y-2">
          {[
            { asset: '부동산 (건물 매입)', target: '15억', monthly: '월 300만 저축', years: 20, pct: 50 },
            { asset: '금융 투자', target: '8억', monthly: '월 200만 투자', years: 20, pct: 27 },
            { asset: '퇴직연금(IRP)', target: '3억', monthly: '월 75만 납입', years: 25, pct: 10 },
            { asset: '연금보험', target: '2억', monthly: '월 50만 납입', years: 20, pct: 7 },
            { asset: '비상금', target: '2억', monthly: '월 80만 저축', years: 15, pct: 6 },
          ].map((a) => (
            <div key={a.asset} className="flex items-center gap-2">
              <span className="text-xs text-foreground w-24 flex-shrink-0">{a.asset}</span>
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-slate-500 dark:bg-slate-400 rounded-full" style={{ width: `${a.pct * 2}%` }} />
              </div>
              <span className="text-xs font-bold text-foreground w-10 text-right">{a.target}</span>
              <span className="text-[10px] text-muted-foreground w-20 text-right">{a.monthly}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-950/20 rounded-lg text-center">
          <p className="text-xs text-muted-foreground">월 저축/투자 필요액: <span className="font-bold text-foreground">약 705만원</span> (순이익의 약 {Math.round(7050000 / profit.monthly_profit_avg * 100)}%)</p>
        </div>
      </Card>
    </>
  )
}
