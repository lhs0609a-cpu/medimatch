'use client'

import React, { useState } from 'react'
import {
  Wallet, Users, ShieldCheck, Stethoscope, CalendarDays,
  CheckCircle2, Clock, Building2, ChevronDown,
} from 'lucide-react'
import { SimulationResponse } from '@/lib/api/client'

interface Props {
  result: SimulationResponse
}

function won(v: number): string {
  if (v >= 100_000_000) return `${(v / 100_000_000).toFixed(1)}억`
  if (v >= 10_000) return `${(v / 10_000).toLocaleString()}만`
  return v.toLocaleString()
}

type SectionKey = 'capital' | 'staffing' | 'permit' | 'equipment' | 'timeline'

const SECTIONS: { key: SectionKey; title: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { key: 'capital',   title: '1. 자금 계획',         icon: Wallet,       color: 'text-blue-600' },
  { key: 'staffing',  title: '2. 인력 구성',         icon: Users,        color: 'text-emerald-600' },
  { key: 'permit',    title: '3. 인허가 체크리스트',  icon: ShieldCheck,  color: 'text-amber-600' },
  { key: 'equipment', title: '4. 의료장비',           icon: Stethoscope,  color: 'text-rose-600' },
  { key: 'timeline',  title: '5. 개원 일정',          icon: CalendarDays, color: 'text-violet-600' },
]

export default function OpeningExecutionPack({ result }: Props) {
  const [openKey, setOpenKey] = useState<SectionKey>('capital')
  const cap = result.capital_plan
  const st = result.staffing_plan
  const pm = result.permit_checklist
  const eq = result.equipment_checklist
  const tl = result.opening_timeline

  if (!cap && !st && !pm && !eq && !tl) return null

  const toggle = (k: SectionKey) => setOpenKey(openKey === k ? openKey : k)

  return (
    <div className="card overflow-hidden">
      <div className="p-6 border-b border-border bg-gradient-to-r from-blue-50/50 to-emerald-50/50 dark:from-blue-950/20 dark:to-emerald-950/20">
        <h3 className="text-lg font-bold text-foreground">개원 실행 계획</h3>
        <p className="text-sm text-muted-foreground mt-1">
          진료과 표준 데이터 기반 — 자금·인력·인허가·장비·일정을 한눈에
        </p>
      </div>

      <div className="divide-y divide-border">
        {SECTIONS.map((s) => {
          const Icon = s.icon
          const isOpen = openKey === s.key
          return (
            <div key={s.key}>
              <button
                onClick={() => toggle(s.key)}
                className="w-full px-6 py-4 flex items-center gap-3 hover:bg-muted/40 transition-colors"
              >
                <Icon className={`w-5 h-5 ${s.color}`} />
                <span className="flex-1 text-left font-semibold text-foreground">{s.title}</span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="px-6 pb-6">
                  {/* 1. 자금 계획 */}
                  {s.key === 'capital' && cap && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
                          <div className="text-[11px] text-muted-foreground">목표 면적</div>
                          <div className="text-lg font-bold">{cap.target_size_pyeong}평</div>
                          <div className="text-[10px] text-muted-foreground">표준 {cap.standard_size_pyeong}평 / 최소 {cap.min_size_pyeong}평</div>
                        </div>
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
                          <div className="text-[11px] text-muted-foreground">초기 투자비</div>
                          <div className="text-lg font-bold">{won(cap.initial_investment_total)}원</div>
                        </div>
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl col-span-2 md:col-span-1">
                          <div className="text-[11px] text-muted-foreground">권장 운영자금</div>
                          <div className="text-lg font-bold">{won(cap.working_capital_recommended)}원</div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold mb-2">투자비 항목별 상세</h4>
                        <div className="space-y-1.5">
                          {cap.breakdown.map((item, i) => (
                            <div key={i} className="flex items-start justify-between gap-2 py-2 border-b border-border/50 last:border-0">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-foreground">{item.label}</div>
                                {item.note && <div className="text-[11px] text-muted-foreground">{item.note}</div>}
                              </div>
                              <div className="text-sm font-semibold whitespace-nowrap">{won(item.amount)}원</div>
                            </div>
                          ))}
                          <div className="flex justify-between items-center py-2 mt-1 bg-muted/40 px-2 rounded-lg">
                            <span className="text-sm font-bold">총 필요자금 (초기 + 운영자금)</span>
                            <span className="text-base font-bold text-foreground">{won(cap.grand_total)}원</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold mb-2">자금 조달 시나리오 (연 5.5%, 5년 원리금균등)</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-border text-muted-foreground">
                                <th className="text-left py-2 pr-2">구성</th>
                                <th className="text-right py-2 px-2">자기자본</th>
                                <th className="text-right py-2 px-2">대출금</th>
                                <th className="text-right py-2 px-2">월 상환액</th>
                                <th className="text-right py-2 pl-2">매출 대비</th>
                              </tr>
                            </thead>
                            <tbody>
                              {cap.financing_scenarios.map((sc, i) => (
                                <tr key={i} className="border-b border-border/50 last:border-0">
                                  <td className="py-2 pr-2 font-medium">{sc.scenario}</td>
                                  <td className="py-2 px-2 text-right">{won(sc.own_capital)}원</td>
                                  <td className="py-2 px-2 text-right">{won(sc.loan_amount)}원</td>
                                  <td className="py-2 px-2 text-right">{won(sc.monthly_payment)}원</td>
                                  <td className={`py-2 pl-2 text-right font-semibold ${sc.monthly_burden_ratio > 0.15 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    {(sc.monthly_burden_ratio * 100).toFixed(1)}%
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2">{cap.data_source}</p>
                      </div>
                    </div>
                  )}

                  {/* 2. 인력 */}
                  {s.key === 'staffing' && st && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: '의사', value: st.doctors },
                          { label: '간호사', value: st.nurses },
                          { label: '행정·접수', value: st.admins },
                          { label: '기사·검사', value: st.technicians },
                        ].map((it) => (
                          <div key={it.label} className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-center">
                            <div className="text-[11px] text-muted-foreground">{it.label}</div>
                            <div className="text-2xl font-bold">{it.value}<span className="text-sm font-normal">명</span></div>
                          </div>
                        ))}
                      </div>
                      <div className="p-4 bg-muted/40 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="text-[11px] text-muted-foreground">총 인원 (원장 포함)</div>
                          <div className="text-base font-bold">{st.total_headcount}명</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[11px] text-muted-foreground">월 인건비 (원장 제외)</div>
                          <div className="text-base font-bold">{won(st.monthly_payroll)}원</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. 인허가 */}
                  {s.key === 'permit' && pm && (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        {pm.common_permits.map((p, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-amber-50/40 dark:bg-amber-950/20 rounded-lg">
                            <CheckCircle2 className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold">{p.name}</div>
                              <div className="text-[11px] text-muted-foreground">{p.authority}</div>
                              <div className="text-xs text-foreground mt-1">{p.description}</div>
                            </div>
                            <div className="text-right text-[11px] flex-shrink-0">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="w-3 h-3" />{p.duration_days}일
                              </div>
                              {p.cost > 0 && <div className="text-foreground font-medium mt-1">{won(p.cost)}원</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                      {pm.specific_permits.length > 0 && (
                        <div className="p-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-lg">
                          <div className="text-xs font-semibold text-rose-700 dark:text-rose-300 mb-1">진료과별 추가 인허가</div>
                          <ul className="text-xs text-foreground list-disc list-inside space-y-0.5">
                            {pm.specific_permits.map((sp, i) => <li key={i}>{sp}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 4. 장비 */}
                  {s.key === 'equipment' && eq && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl">
                          <div className="text-[11px] text-muted-foreground">필수 장비 (최저 ~ 표준)</div>
                          <div className="text-base font-bold">{won(eq.essential_total_min)} ~ {won(eq.essential_total_typical)}원</div>
                        </div>
                        <div className="p-3 bg-muted/40 rounded-xl">
                          <div className="text-[11px] text-muted-foreground">선택 장비 (표준)</div>
                          <div className="text-base font-bold">+{won(eq.optional_total_typical)}원</div>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border text-muted-foreground">
                              <th className="text-left py-2 pr-2">장비</th>
                              <th className="text-center py-2 px-2">필수</th>
                              <th className="text-right py-2 px-2">최저가</th>
                              <th className="text-right py-2 pl-2">표준가</th>
                            </tr>
                          </thead>
                          <tbody>
                            {eq.items.map((it, i) => (
                              <tr key={i} className="border-b border-border/50 last:border-0">
                                <td className="py-2 pr-2 font-medium">{it.name}</td>
                                <td className="py-2 px-2 text-center">
                                  {it.is_essential ? <span className="inline-block px-2 py-0.5 bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 rounded text-[10px]">필수</span> : <span className="text-muted-foreground text-[10px]">선택</span>}
                                </td>
                                <td className="py-2 px-2 text-right text-muted-foreground">{won(it.price_min)}원</td>
                                <td className="py-2 pl-2 text-right font-semibold">{won(it.price_typical)}원</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 5. 일정 */}
                  {s.key === 'timeline' && tl && (
                    <div className="space-y-3">
                      <div className="p-3 bg-violet-50 dark:bg-violet-950/30 rounded-xl text-center">
                        <div className="text-[11px] text-muted-foreground">표준 개원 준비 기간</div>
                        <div className="text-2xl font-bold">{tl.total_months}<span className="text-sm font-normal">개월</span></div>
                      </div>
                      <div className="space-y-2">
                        {tl.steps.map((step) => (
                          <div key={step.step_no} className="flex gap-3 p-3 border border-border rounded-lg">
                            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 flex items-center justify-center font-bold text-sm">
                              {step.step_no}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline justify-between gap-2 mb-1">
                                <div className="text-sm font-semibold">{step.title}</div>
                                <div className="text-[11px] text-muted-foreground whitespace-nowrap">
                                  D-{(tl.total_months - step.months_from_start) * 4}주 · {step.duration_weeks}주
                                </div>
                              </div>
                              <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
                                {step.deliverables.map((d, i) => <li key={i}>{d}</li>)}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
