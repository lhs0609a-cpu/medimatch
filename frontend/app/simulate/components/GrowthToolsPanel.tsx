'use client'

import React, { useState, useEffect } from 'react'
import {
  Megaphone, MapPin, Sparkles, TrendingUp, Users, Clock,
  Palette, Loader2, AlertTriangle, CheckCircle2,
} from 'lucide-react'
import { SimulationResponse, apiClient } from '@/lib/api/client'

interface Props {
  result: SimulationResponse
}

function won(v: number): string {
  if (!v) return '0'
  if (v >= 100_000_000) return `${(v / 100_000_000).toFixed(1)}억`
  if (v >= 10_000) return `${(v / 10_000).toLocaleString()}만`
  return v.toLocaleString()
}

type ToolKey = 'marketing' | 'closure' | 'procedure' | 'price' | 'hiring' | 'hours' | 'branding'

const TOOLS = [
  { key: 'closure' as ToolKey, label: '폐업 사례 분석', icon: MapPin, color: 'text-rose-600', desc: '실데이터 — 반경 1km 폐업 의원 분석' },
  { key: 'marketing' as ToolKey, label: '마케팅 ROAS 계산기', icon: Megaphone, color: 'text-indigo-600', desc: '월 마케팅비 → 신환 + 매출 예측' },
  { key: 'procedure' as ToolKey, label: '비급여 시술 매출 시뮬', icon: Sparkles, color: 'text-amber-600', desc: '시술 조합 → 월 매출 + 마진' },
  { key: 'price' as ToolKey, label: '가격 최적화 (탄력성)', icon: TrendingUp, color: 'text-blue-600', desc: '가격 ±% → 환자/매출 변화' },
  { key: 'hiring' as ToolKey, label: '직원 채용 ROI', icon: Users, color: 'text-emerald-600', desc: '인력 추가 시 BEP + 연 ROI' },
  { key: 'hours' as ToolKey, label: '진료시간 최적화', icon: Clock, color: 'text-violet-600', desc: '토/야간 진료 추가 매출 시뮬' },
  { key: 'branding' as ToolKey, label: '브랜딩 전략 빌더', icon: Palette, color: 'text-pink-600', desc: '페르소나 + 차별화 + 광고 카피' },
]

export default function GrowthToolsPanel({ result }: Props) {
  return (
    <div className="card overflow-hidden">
      <div className="p-6 border-b border-border bg-gradient-to-r from-violet-50/60 to-pink-50/60 dark:from-violet-950/20 dark:to-pink-950/20">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-600" />
          성장 도구 (7종)
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          실시간 데이터 기반 — 폐업률, 마케팅 ROAS, 가격 최적화, 채용 ROI, 진료시간, 브랜딩, 시술 매출 모두 시뮬
        </p>
      </div>

      <div className="divide-y divide-border">
        {TOOLS.map((t) => {
          const Icon = t.icon
          return (
            <div key={t.key}>
              <div className="px-6 py-4 flex items-center gap-3 bg-muted/20">
                <Icon className={`w-5 h-5 ${t.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground">{t.label}</div>
                  <div className="text-xs text-muted-foreground truncate">{t.desc}</div>
                </div>
              </div>
              <div className="px-6 pb-6 pt-2 border-t border-border/50">
                {t.key === 'closure' && <ClosureCases result={result} />}
                {t.key === 'marketing' && <MarketingROAS result={result} />}
                {t.key === 'procedure' && <ProcedureSim result={result} />}
                {t.key === 'price' && <PriceOptimizer result={result} />}
                {t.key === 'hiring' && <HiringROI result={result} />}
                {t.key === 'hours' && <WorkingHours result={result} />}
                {t.key === 'branding' && <BrandingBuilder result={result} />}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// 1. 폐업 사례 분석기
// ============================================
function ClosureCases({ result }: Props) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [radius, setRadius] = useState(1000)

  const fetch = async (r: number) => {
    setLoading(true)
    try {
      const res = await apiClient.post('/tools/closure-cases', {
        simulation_id: result.simulation_id,
        radius_m: r,
        years: 5,
        clinic_type_filter: result.clinic_type,
      })
      setData(res.data)
    } catch (e) {
      setData({ error: '데이터 조회 실패' })
    }
    setLoading(false)
  }

  useEffect(() => { fetch(radius) }, [radius])

  if (loading) return <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>
  if (!data) return null
  if (data.error) return <div className="py-4 text-rose-600">{data.error}</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm">
        <span>반경:</span>
        {[500, 1000, 2000].map(r => (
          <button
            key={r}
            onClick={() => setRadius(r)}
            className={`px-2 py-1 rounded text-xs ${radius === r ? 'bg-foreground text-background' : 'bg-secondary'}`}
          >{r}m</button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
          <div className="text-[11px] text-muted-foreground">영업 중</div>
          <div className="text-xl font-bold text-emerald-600">{data.active_count}</div>
        </div>
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg">
          <div className="text-[11px] text-muted-foreground">폐업</div>
          <div className="text-xl font-bold text-rose-600">{data.closed_count}</div>
        </div>
        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
          <div className="text-[11px] text-muted-foreground">폐업률</div>
          <div className="text-xl font-bold">{data.closure_rate_percent}%</div>
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <div className="text-[11px] text-muted-foreground">평균 영업기간</div>
          <div className="text-xl font-bold">{data.avg_lifespan_years}년</div>
        </div>
      </div>

      {data.closure_reason_distribution && Object.keys(data.closure_reason_distribution).length > 0 && (
        <div>
          <div className="text-xs font-semibold mb-2">폐업 사유 분포 (영업기간 기반)</div>
          <div className="space-y-1">
            {Object.entries(data.closure_reason_distribution).map(([reason, cnt]: any) => (
              <div key={reason} className="flex items-center gap-2 text-xs">
                <div className="flex-1 bg-secondary rounded h-2 overflow-hidden">
                  <div className="h-full bg-rose-500" style={{ width: `${(cnt as number) / data.closed_count * 100}%` }} />
                </div>
                <span className="w-32">{reason}</span>
                <span className="font-semibold w-10 text-right">{cnt as number}건</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.oldest_active && (
        <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg">
          <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">가장 오래 영업 중</div>
          <div className="text-sm font-medium">{data.oldest_active.name} — {data.oldest_active.years}년차</div>
        </div>
      )}

      {data.closed_clinics && data.closed_clinics.length > 0 && (
        <div>
          <div className="text-xs font-semibold mb-2">폐업 의원 목록 (최근 {data.years_analyzed}년)</div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {data.closed_clinics.slice(0, 10).map((c: any, i: number) => (
              <div key={i} className="p-2 bg-rose-50/30 dark:bg-rose-950/10 rounded text-xs flex items-center justify-between">
                <div className="truncate flex-1">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground ml-2">{c.address}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span>{c.lifespan_years || '?'}년</span>
                  <span className="text-rose-600">{c.closure_reason_estimated || c.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-[10px] text-muted-foreground">출처: {data.data_source}</div>
    </div>
  )
}

// ============================================
// 2. 마케팅 ROAS 계산기
// ============================================
function MarketingROAS({ result }: Props) {
  const [budget, setBudget] = useState(2000000)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const calculate = async () => {
    setLoading(true)
    try {
      const res = await apiClient.post('/tools/marketing-roas', {
        clinic_type: result.clinic_type,
        monthly_budget: budget,
        avg_revenue_per_patient: result.revenue_factors?.regional_price_won || 50000,
      })
      setData(res.data)
    } catch (e) {
      setData({ error: '조회 실패' })
    }
    setLoading(false)
  }

  useEffect(() => { calculate() }, [budget])

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">월 마케팅 예산: <span className="font-bold text-indigo-600">{won(budget)}원</span></label>
        <input
          type="range"
          min={500000}
          max={10000000}
          step={500000}
          value={budget}
          onChange={(e) => setBudget(parseInt(e.target.value))}
          className="w-full mt-1"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>50만</span><span>1,000만</span>
        </div>
      </div>

      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : data && !data.error && (
        <>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg text-center">
              <div className="text-[11px] text-muted-foreground">월 신환</div>
              <div className="text-xl font-bold text-indigo-600">+{data.total_new_patients_monthly}</div>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg text-center">
              <div className="text-[11px] text-muted-foreground">평생 매출</div>
              <div className="text-xl font-bold text-emerald-600">{won(data.total_lifetime_revenue)}</div>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-center">
              <div className="text-[11px] text-muted-foreground">전체 ROAS</div>
              <div className="text-xl font-bold">×{data.overall_roas}</div>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold mb-2">채널별 분배</div>
            <div className="space-y-1">
              {data.channels.map((ch: any) => (
                <div key={ch.channel_id} className="p-2 border border-border rounded text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{ch.channel_name}</span>
                    <span className="text-emerald-600 font-semibold">×{ch.expected_roas}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span>예산: {won(ch.allocated_budget)}원</span>
                    <span>신환: +{ch.expected_new_patients_monthly}명/월</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground italic mt-1">{ch.note}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground">출처: {data.data_source}</div>
        </>
      )}
    </div>
  )
}

// ============================================
// 3. 비급여 시술 시뮬
// ============================================
function ProcedureSim({ result }: Props) {
  const [procs, setProcs] = useState<any[]>([])
  const [vols, setVols] = useState<Record<string, number>>({})
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    apiClient.get(`/tools/procedure-list/${encodeURIComponent(result.clinic_type)}`)
      .then(r => {
        setProcs(r.data.procedures || [])
        const init: Record<string, number> = {}
        r.data.procedures?.forEach((p: any) => init[p.name] = 0)
        setVols(init)
      })
  }, [result.clinic_type])

  useEffect(() => {
    if (Object.keys(vols).length === 0) return
    apiClient.post('/tools/procedure-revenue', {
      clinic_type: result.clinic_type,
      procedure_volumes: vols,
    }).then(r => setData(r.data))
  }, [vols, result.clinic_type])

  if (procs.length === 0) {
    return <div className="text-sm text-muted-foreground py-4">{result.clinic_type}는 비급여 시술 비중이 낮습니다 (보험 위주 진료과).</div>
  }

  return (
    <div className="space-y-4">
      <div className="text-xs font-semibold">월 시술 건수 입력 → 매출/마진 자동 계산</div>
      <div className="space-y-2 max-h-72 overflow-y-auto">
        {procs.map((p) => (
          <div key={p.name} className="flex items-center gap-3 p-2 border border-border rounded">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{p.name}</div>
              <div className="text-[10px] text-muted-foreground">단가 {won(p.typical)}원 · 마진 {(p.margin * 100).toFixed(0)}%</div>
            </div>
            <input
              type="number"
              min="0"
              value={vols[p.name] || 0}
              onChange={(e) => setVols({ ...vols, [p.name]: parseInt(e.target.value) || 0 })}
              className="w-16 px-2 py-1 border border-border rounded text-sm text-right"
            />
            <span className="text-[10px] text-muted-foreground">명/월</span>
          </div>
        ))}
      </div>

      {data && (
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-center">
            <div className="text-[11px] text-muted-foreground">월 매출</div>
            <div className="text-xl font-bold">{won(data.total_revenue)}원</div>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg text-center">
            <div className="text-[11px] text-muted-foreground">월 마진</div>
            <div className="text-xl font-bold text-emerald-600">{won(data.total_margin)}원</div>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-center">
            <div className="text-[11px] text-muted-foreground">시간 활용</div>
            <div className="text-xl font-bold">{data.capacity_utilization_percent}%</div>
          </div>
        </div>
      )}

      {data?.top_3_by_roi && (
        <div className="p-3 bg-violet-50/50 dark:bg-violet-950/20 rounded-lg">
          <div className="text-xs font-semibold text-violet-700 dark:text-violet-300 mb-1">⭐ 시간 대비 마진 TOP 3</div>
          <div className="text-sm">{data.top_3_by_roi.join(' · ')}</div>
        </div>
      )}
    </div>
  )
}

// ============================================
// 4. 가격 최적화
// ============================================
function PriceOptimizer({ result }: Props) {
  const basePrice = result.revenue_factors?.regional_price_won || 60000
  const [pct, setPct] = useState(0)
  const [data, setData] = useState<any>(null)

  const calc = async () => {
    try {
      const r = await apiClient.post('/tools/price-optimize', {
        clinic_type: result.clinic_type,
        current_price: basePrice,
        current_patients_monthly: result.revenue_factors?.target_population
          ? Math.round((result.revenue_factors.target_population * (result.revenue_factors.utilization_per_1000 || 1200)) / 1000 / 12 / Math.max(result.revenue_factors.competitor_count + 1, 1))
          : 720,
        price_change_pct: pct,
      })
      setData(r.data)
    } catch (e) { setData(null) }
  }

  useEffect(() => { calc() }, [pct])

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">단가 변경: <span className="font-bold text-blue-600">{pct >= 0 ? '+' : ''}{pct}%</span></label>
        <input
          type="range"
          min={-15}
          max={15}
          step={1}
          value={pct}
          onChange={(e) => setPct(parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      {data && (
        <>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-center">
              <div className="text-[11px] text-muted-foreground">새 단가</div>
              <div className="text-lg font-bold">{won(data.scenario.new_price)}원</div>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-center">
              <div className="text-[11px] text-muted-foreground">환자 변화</div>
              <div className="text-lg font-bold">{data.scenario.new_patients}명</div>
            </div>
            <div className={`p-3 rounded-lg text-center ${data.scenario.revenue_change >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-rose-50 dark:bg-rose-950/30'}`}>
              <div className="text-[11px] text-muted-foreground">매출 변화</div>
              <div className={`text-lg font-bold ${data.scenario.revenue_change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {data.scenario.revenue_change >= 0 ? '+' : ''}{data.scenario.revenue_change_pct}%
              </div>
            </div>
          </div>
          <div className="p-3 bg-muted/40 rounded-lg text-xs">
            <div className="font-semibold mb-1">📈 매출 최대화 — {data.optimal_price.price_change_pct >= 0 ? '+' : ''}{data.optimal_price.price_change_pct}% 추천</div>
            <div className="text-muted-foreground">
              새 단가 {won(data.optimal_price.new_price)}원 · 환자 {data.optimal_price.new_patients}명 · 매출 {won(data.optimal_price.new_revenue)}원
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground">탄력성 ε = {data.elasticity} · {data.data_source}</div>
        </>
      )}
    </div>
  )
}

// ============================================
// 5. 채용 ROI
// ============================================
function HiringROI({ result }: Props) {
  const [role, setRole] = useState('간호사')
  const [exp, setExp] = useState('3년차')
  const [data, setData] = useState<any>(null)

  const calc = async () => {
    try {
      const r = await apiClient.post('/tools/hiring-roi', {
        clinic_type: result.clinic_type,
        current_daily_patients: 30,
        current_staff_count: 2,
        new_role: role,
        new_role_experience: exp,
        avg_revenue_per_patient: result.revenue_factors?.regional_price_won || 50000,
      })
      setData(r.data)
    } catch (e) { setData(null) }
  }

  useEffect(() => { calc() }, [role, exp])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold">역할</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full mt-1 px-2 py-1.5 border border-border rounded text-sm">
            <option>간호사</option>
            <option>간호조무사</option>
            <option>물리치료사</option>
            <option>방사선사</option>
            <option>코디네이터</option>
            <option>행정/원무</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold">경력</label>
          <select value={exp} onChange={(e) => setExp(e.target.value)} className="w-full mt-1 px-2 py-1.5 border border-border rounded text-sm">
            <option>신입</option>
            <option>3년차</option>
            <option>5년차</option>
            <option>10년차</option>
          </select>
        </div>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="p-3 bg-secondary/50 rounded-lg text-center">
              <div className="text-[11px] text-muted-foreground">월 인건비</div>
              <div className="text-base font-bold">{won(data.financial.total_labor_cost)}원</div>
              <div className="text-[10px] text-muted-foreground">+4대보험19%</div>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-center">
              <div className="text-[11px] text-muted-foreground">매출 증가</div>
              <div className="text-base font-bold text-blue-600">+{won(data.financial.monthly_revenue_gain)}원</div>
              <div className="text-[10px]">+{data.after_hire.additional_daily_patients}명/일</div>
            </div>
            <div className={`p-3 rounded-lg text-center ${data.financial.is_profitable ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-rose-50 dark:bg-rose-950/30'}`}>
              <div className="text-[11px] text-muted-foreground">BEP</div>
              <div className={`text-base font-bold ${data.financial.is_profitable ? 'text-emerald-600' : 'text-rose-600'}`}>
                {data.financial.bep_months ? `${data.financial.bep_months}개월` : '미달'}
              </div>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-center">
              <div className="text-[11px] text-muted-foreground">연 ROI</div>
              <div className="text-base font-bold">{data.financial.annual_roi_percent}%</div>
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground">출처: {data.data_source}</div>
        </>
      )}
    </div>
  )
}

// ============================================
// 6. 진료시간 최적화
// ============================================
function WorkingHours({ result }: Props) {
  const [workerRatio, setWorkerRatio] = useState(0.65)
  const [data, setData] = useState<any>(null)

  const calc = async () => {
    try {
      const r = await apiClient.post('/tools/working-hours', {
        clinic_type: result.clinic_type,
        current_monthly_patients: 720,
        avg_revenue_per_patient: result.revenue_factors?.regional_price_won || 50000,
        worker_ratio: workerRatio,
      })
      setData(r.data)
    } catch (e) { setData(null) }
  }

  useEffect(() => { calc() }, [workerRatio])

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">지역 직장인구 비율: <span className="font-bold text-violet-600">{(workerRatio * 100).toFixed(0)}%</span></label>
        <input
          type="range"
          min={0.2}
          max={0.9}
          step={0.05}
          value={workerRatio}
          onChange={(e) => setWorkerRatio(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      {data?.scenarios && (
        <div className="space-y-2">
          {data.scenarios.map((s: any) => (
            <div key={s.option} className={`p-3 rounded-lg border ${s.is_recommended ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/20' : 'border-border'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold">{s.option_label}</span>
                <span className={`text-xs font-bold ${s.net_revenue_gain >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {s.net_revenue_gain >= 0 ? '+' : ''}{won(s.net_revenue_gain)}원/월
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span>+{s.additional_patients_monthly}명 ({s.patient_gain_pct}%)</span>
                <span>매출+ {won(s.additional_revenue)}</span>
                <span>비용+ {won(s.extra_cost)}</span>
                {s.time_bonus_rate > 0 && <span className="text-emerald-600">가산수가 +{(s.time_bonus_rate * 100).toFixed(0)}%</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {data?.top_recommendation && (
        <div className="p-3 bg-violet-100 dark:bg-violet-900/40 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-violet-600" />
            <span className="text-sm font-bold">최적 추천: {data.top_recommendation.option_label}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// 7. 브랜딩 빌더
// ============================================
function BrandingBuilder({ result }: Props) {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    apiClient.post('/tools/branding', {
      clinic_type: result.clinic_type,
      demographics: {
        age_40_plus_ratio: result.demographics?.age_40_plus_ratio || 0.4,
        female_ratio: 0.5,
      },
      competitors: result.competitors,
    }).then(r => setData(r.data))
  }, [result.simulation_id])

  if (!data) return <Loader2 className="w-5 h-5 animate-spin mx-auto" />

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-semibold mb-2">🎯 자동 페르소나</div>
        <div className="space-y-2">
          {data.personas.map((p: any, i: number) => (
            <div key={i} className="p-3 bg-pink-50/50 dark:bg-pink-950/20 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm">{p.name}</span>
                <span className="text-[11px] bg-pink-100 dark:bg-pink-900/40 px-2 py-0.5 rounded">{p.share}</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                <span className="font-medium">니즈:</span> {p.needs.join(' · ')}
              </div>
              <div className="text-[11px] text-muted-foreground">
                <span className="font-medium">채널:</span> {p.channels.join(' · ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold mb-2">🎨 차별화 추천</div>
        <div className="space-y-1">
          {data.differentiation_points.map((d: any, i: number) => (
            <div key={i} className="p-2 border border-border rounded text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-pink-600">[{d.axis}]</span>
                <span className="font-medium">{d.strategy}</span>
              </div>
              <div className="text-muted-foreground mt-0.5">→ {d.rationale}</div>
            </div>
          ))}
        </div>
      </div>

      {data.ad_copy_samples && (
        <div>
          <div className="text-xs font-semibold mb-2">✍️ 광고 카피 샘플</div>
          <div className="space-y-1">
            {data.ad_copy_samples.map((c: any, i: number) => (
              <div key={i} className="p-2 bg-secondary/50 rounded text-xs">
                <span className="text-[10px] font-semibold text-pink-600 mr-2">[{c.tone}]</span>
                {c.copy}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
