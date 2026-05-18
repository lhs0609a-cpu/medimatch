'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Sparkles, TrendingUp, DollarSign, Users, Target, Brain,
  Shield, AlertTriangle, CheckCircle2, ArrowRight,
  Lightbulb, Calculator, Receipt, Activity,
} from 'lucide-react'

const safeNum = (n: any): number => typeof n === 'number' && Number.isFinite(n) ? n : 0
const fmt = (n: number | undefined | null) => safeNum(n).toLocaleString() + '원'
const fmtMan = (n: number | undefined | null) => (safeNum(n) / 10000).toFixed(0) + '만'

// 다른 페이지에서 저장한 localStorage를 읽어 종합 분석
function loadAllSources() {
  try {
    const staff = JSON.parse(localStorage.getItem('staffCost.v1') || '[]')
    const staffRevenue = Number(localStorage.getItem('staffCost.monthlyRevenue.v1') || 0)
    const fixed = JSON.parse(localStorage.getItem('fixedCost.v1') || '[]')
    const fixedRevenue = Number(localStorage.getItem('fixedCost.monthlyRevenue.v1') || 0)
    const supplies = JSON.parse(localStorage.getItem('supplies.v1') || '[]')
    const marketing = JSON.parse(localStorage.getItem('marketing.v1') || '[]')
    const branches = JSON.parse(localStorage.getItem('branches.v1') || '[]')
    return {
      staff: Array.isArray(staff) ? staff : [],
      fixed: Array.isArray(fixed) ? fixed : [],
      supplies: Array.isArray(supplies) ? supplies : [],
      marketing: Array.isArray(marketing) ? marketing : [],
      branches: Array.isArray(branches) ? branches : [],
      monthlyRevenue: staffRevenue || fixedRevenue || 0,
    }
  } catch {
    return { staff: [], fixed: [], supplies: [], marketing: [], branches: [], monthlyRevenue: 0 }
  }
}

interface SourceLink {
  label: string
  count: number
  href: string
  ok: boolean
}

export default function AIConsultingPage() {
  const [hydrated, setHydrated] = useState(false)
  const [data, setData] = useState<ReturnType<typeof loadAllSources>>({
    staff: [], fixed: [], supplies: [], marketing: [], branches: [], monthlyRevenue: 0,
  })

  useEffect(() => {
    setData(loadAllSources())
    setHydrated(true)
  }, [])

  const sources: SourceLink[] = [
    { label: '인건비',     count: data.staff.length,     href: '/emr/cost/staff',     ok: data.staff.length > 0 },
    { label: '고정비',     count: data.fixed.length,     href: '/emr/cost/fixed',     ok: data.fixed.length > 0 },
    { label: '소모품·약가', count: data.supplies.length,  href: '/emr/cost/supplies',  ok: data.supplies.length > 0 },
    { label: '마케팅',     count: data.marketing.length, href: '/emr/cost/marketing', ok: data.marketing.length > 0 },
    { label: '지점',       count: data.branches.length,  href: '/emr/multi-branch',   ok: data.branches.length > 0 },
    { label: '월 매출',    count: data.monthlyRevenue > 0 ? 1 : 0, href: '/emr/cost/staff', ok: data.monthlyRevenue > 0 },
  ]
  const filledCount = sources.filter(s => s.ok).length
  const completeness = (filledCount / sources.length) * 100

  // 종합 KPI 계산
  const kpi = useMemo(() => {
    const staffCost = data.staff.reduce((s: number, p: any) =>
      s + safeNum(p.base) + safeNum(p.overtime) + safeNum(p.insurance), 0)
    const fixedCost = data.fixed.reduce((s: number, i: any) => s + safeNum(i.amount), 0)
    const suppliesCost = data.supplies.reduce((s: number, i: any) =>
      s + safeNum(i.pricePerUnit) * safeNum(i.monthlyUsage), 0)
    const marketingCost = data.marketing.reduce((s: number, c: any) => s + safeNum(c.spend), 0)
    const totalCost = staffCost + fixedCost + suppliesCost + marketingCost
    const revenue = data.monthlyRevenue
    const operatingProfit = revenue - totalCost
    const profitRatio = revenue > 0 ? (operatingProfit / revenue) * 100 : 0
    return { staffCost, fixedCost, suppliesCost, marketingCost, totalCost, revenue, operatingProfit, profitRatio }
  }, [data])

  // 동적 인사이트 (실 데이터 기반)
  const insights = useMemo(() => {
    const out: { id: string; type: 'warning'|'saving'|'growth'|'optimization'; title: string; desc: string; impact?: string; href?: string }[] = []
    if (kpi.revenue > 0 && kpi.staffCost > 0) {
      const ratio = (kpi.staffCost / kpi.revenue) * 100
      if (ratio > 35) {
        out.push({ id: 'staff-high', type: 'warning', title: `인건비 비율이 매출의 ${ratio.toFixed(1)}% — 권장(25~30%) 초과`,
          desc: '야근수당 절감·파트타임 전환·4대보험 두루누리 등 점검 필요', href: '/emr/cost/staff' })
      } else if (ratio > 0 && ratio < 20) {
        out.push({ id: 'staff-low', type: 'growth', title: `인건비 비율 ${ratio.toFixed(1)}% — 추가 채용 여력 있음`,
          desc: '인력 확충으로 환자 처리 capacity 증대 검토', href: '/emr/cost/staff' })
      }
    }
    if (kpi.revenue > 0 && kpi.fixedCost > 0) {
      const ratio = (kpi.fixedCost / kpi.revenue) * 100
      if (ratio > 20) {
        out.push({ id: 'fixed-high', type: 'warning', title: `고정비 비율 ${ratio.toFixed(1)}% — 권장(15% 이하) 초과`,
          desc: '임대료 재협상·계약 만료 임박 항목 재검토 권장', href: '/emr/cost/fixed' })
      }
    }
    if (kpi.marketingCost > 0) {
      const lowRoiChannels = data.marketing.filter((c: any) => {
        const rev = safeNum(c.newPatients) * safeNum(c.revenuePerPatient)
        const roi = safeNum(c.spend) > 0 ? ((rev - safeNum(c.spend)) / safeNum(c.spend)) * 100 : 0
        return safeNum(c.spend) > 0 && roi < 100
      })
      if (lowRoiChannels.length > 0) {
        out.push({ id: 'mkt-low', type: 'saving', title: `${lowRoiChannels.length}개 마케팅 채널이 ROI 100% 미만`,
          desc: '광고비 회수가 안 되는 채널입니다. 예산 재배분 권장', href: '/emr/cost/marketing' })
      }
    }
    if (kpi.profitRatio > 0 && kpi.profitRatio < 15) {
      out.push({ id: 'profit-thin', type: 'warning', title: `영업 이익률 ${kpi.profitRatio.toFixed(1)}% — 손익 마진 얇음`,
        desc: '비용 절감과 매출 확대 양쪽 동시 점검 필요' })
    }
    if (kpi.profitRatio >= 30) {
      out.push({ id: 'profit-strong', type: 'growth', title: `영업 이익률 ${kpi.profitRatio.toFixed(1)}% — 분원 확장 여력`,
        desc: 'EMR 안 \'발견\' 탭에서 매물 검색 가능', href: '/emr/discover' })
    }
    return out
  }, [kpi, data])

  if (!hydrated) return null

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">AI 경영컨설팅</h1>
            <span className={`text-2xs font-bold px-2 py-0.5 rounded-full ${
              filledCount >= 4 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40' :
              filledCount >= 2 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40' :
              'bg-zinc-100 text-zinc-600 dark:bg-zinc-800'
            }`}>
              데이터 충실도 {Math.round(completeness)}%
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            의원 운영 데이터를 종합해 절감·성장 기회를 AI가 찾아드립니다
          </p>
        </div>
      </div>

      {/* 입력 진행률 */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            연결된 데이터 소스
          </h3>
          <span className="text-sm text-muted-foreground">{filledCount} / {sources.length}</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden mb-4">
          <div className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all"
               style={{ width: `${completeness}%` }} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {sources.map(s => (
            <Link key={s.label} href={s.href}
              className={`flex items-center gap-2 p-3 rounded-xl border transition-colors ${
                s.ok
                  ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-900/10'
                  : 'border-border hover:bg-secondary/50'
              }`}>
              {s.ok
                ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                : <div className="w-4 h-4 rounded-full border-2 border-zinc-300 dark:border-zinc-600 flex-shrink-0" />}
              <span className="flex-1 text-sm font-medium">{s.label}</span>
              {s.ok ? (
                <span className="text-2xs text-emerald-600 dark:text-emerald-400">{s.count}건</span>
              ) : (
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* 종합 손익 */}
      {(kpi.revenue > 0 || kpi.totalCost > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2"><DollarSign className="w-5 h-5 text-primary" /><span className="text-xs text-muted-foreground">월 매출</span></div>
            <div className="text-2xl font-bold">{fmtMan(kpi.revenue)}</div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2"><Receipt className="w-5 h-5 text-amber-500" /><span className="text-xs text-muted-foreground">월 비용 합</span></div>
            <div className="text-2xl font-bold">{fmtMan(kpi.totalCost)}</div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-5 h-5 text-emerald-500" /><span className="text-xs text-muted-foreground">영업 이익</span></div>
            <div className={`text-2xl font-bold ${kpi.operatingProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {fmtMan(kpi.operatingProfit)}
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2"><Target className="w-5 h-5 text-blue-500" /><span className="text-xs text-muted-foreground">이익률</span></div>
            <div className={`text-2xl font-bold ${kpi.profitRatio >= 0 ? '' : 'text-red-600'}`}>
              {kpi.revenue > 0 ? `${kpi.profitRatio.toFixed(1)}%` : '—'}
            </div>
          </div>
        </div>
      )}

      {/* AI 인사이트 */}
      <div>
        <h2 className="font-bold mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          AI 인사이트
          {insights.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground">{insights.length}건 발견</span>
          )}
        </h2>
        {insights.length === 0 ? (
          <div className="card p-12 text-center">
            <Brain className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground mb-2">
              {filledCount === 0
                ? '데이터를 1개라도 입력하시면 즉시 AI 분석이 시작됩니다.'
                : '현재 입력된 데이터로는 특별한 경고·기회가 발견되지 않았습니다.'}
            </p>
            <p className="text-xs text-muted-foreground">
              {filledCount < 4 && '더 많은 영역의 데이터를 입력하시면 분석이 정교해집니다.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {insights.map(i => {
              const accent = i.type === 'warning' ? 'amber' : i.type === 'saving' ? 'emerald' : i.type === 'growth' ? 'blue' : 'violet'
              const Icon = i.type === 'warning' ? AlertTriangle :
                           i.type === 'saving' ? Lightbulb :
                           i.type === 'growth' ? TrendingUp : Activity
              return (
                <div key={i.id} className={`card p-5 border-${accent}-200 dark:border-${accent}-800 bg-${accent}-50/30 dark:bg-${accent}-900/10`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-${accent}-100 dark:bg-${accent}-900/30 flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 text-${accent}-600 dark:text-${accent}-400`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold mb-1">{i.title}</h3>
                      <p className="text-sm text-muted-foreground">{i.desc}</p>
                      {i.href && (
                        <Link href={i.href} className="inline-flex items-center gap-1 mt-2 text-sm font-semibold text-primary hover:gap-2 transition-all">
                          관련 데이터 보기 <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
