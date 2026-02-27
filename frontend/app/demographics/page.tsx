'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft, Users, MapPin, Brain, ArrowLeftRight,
  Building, Wallet, Sun, Moon, AlertCircle, RefreshCw, Search,
} from 'lucide-react'
import Link from 'next/link'
import AddressSelector from '../simulate/components/AddressSelector'
import { demographicsService } from '@/lib/api/services'

// ── Types ────────────────────────────────────────────────────────
interface AgeGroup { label: string; percent: number }

interface AreaData {
  address: string
  dataSource: string
  population: number
  households: number
  ageDistribution: AgeGroup[]
  maleRatio: number
  femaleRatio: number
  dayPopulation: number
  nightPopulation: number
  incomeLevel: string
  incomeIndex: number
  residentialRatio: number
  commercialRatio: number
  medicalDensity: number
  nearbyHospitalCount: number
  insight: string
}

// ── Skeleton ─────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="card p-5 animate-pulse space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-muted" />
        <div className="h-5 w-40 rounded bg-muted" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/50 rounded-xl p-3 h-20" />
        <div className="bg-muted/50 rounded-xl p-3 h-20" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-10 h-4 rounded bg-muted" />
            <div className="flex-1 h-5 rounded-full bg-muted" />
          </div>
        ))}
      </div>
      <div className="h-4 rounded-full bg-muted" />
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/50 rounded-xl p-3 h-16" />
        <div className="bg-muted/50 rounded-xl p-3 h-16" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/50 rounded-xl p-3 h-20" />
        <div className="bg-muted/50 rounded-xl p-3 h-20" />
      </div>
      <div className="h-5 rounded-full bg-muted" />
      <div className="bg-muted/30 rounded-xl p-4 h-24" />
    </div>
  )
}

// ── AreaDetail component ─────────────────────────────────────────
const barColors = ['bg-blue-400', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-rose-500', 'bg-pink-500']

function AreaDetail({ data }: { data: AreaData }) {
  const dayNightRatio = data.nightPopulation > 0
    ? data.dayPopulation / data.nightPopulation
    : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-lg">{data.address}</h3>
        </div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
            data.dataSource === 'mois_api'
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
          }`}
        >
          {data.dataSource === 'mois_api' ? '행안부 실데이터' : '추정 모델'}
        </span>
      </div>

      {/* Population & Households */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/50 rounded-xl p-3">
          <p className="text-xs text-muted-foreground">총인구</p>
          <p className="text-xl font-bold">{data.population.toLocaleString()}명</p>
        </div>
        <div className="bg-muted/50 rounded-xl p-3">
          <p className="text-xs text-muted-foreground">세대수</p>
          <p className="text-xl font-bold">{data.households.toLocaleString()}</p>
        </div>
      </div>

      {/* Age Distribution */}
      <div>
        <p className="text-sm font-medium mb-2">연령 분포</p>
        <div className="space-y-2">
          {data.ageDistribution.map((ag, i) => (
            <div key={ag.label} className="flex items-center gap-2">
              <span className="text-xs w-14 text-muted-foreground">{ag.label}</span>
              <div className="flex-1 bg-muted rounded-full h-5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${barColors[i % barColors.length]} flex items-center justify-end pr-2 transition-all duration-500`}
                  style={{ width: `${Math.max(ag.percent * 2.5, 8)}%` }}
                >
                  <span className="text-[10px] font-medium text-white">{ag.percent}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gender */}
      <div>
        <p className="text-sm font-medium mb-2">성별 비율</p>
        <div className="flex h-4 rounded-full overflow-hidden">
          <div className="bg-blue-500 flex items-center justify-center" style={{ width: `${data.maleRatio}%` }}>
            <span className="text-[10px] text-white font-medium">남 {data.maleRatio}%</span>
          </div>
          <div className="bg-pink-500 flex items-center justify-center" style={{ width: `${data.femaleRatio}%` }}>
            <span className="text-[10px] text-white font-medium">여 {data.femaleRatio}%</span>
          </div>
        </div>
      </div>

      {/* Day / Night Population */}
      <div>
        <p className="text-sm font-medium mb-2">주간/야간 유동인구</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-2.5">
            <Sun className="w-4 h-4 text-amber-500" />
            <div>
              <p className="text-xs text-muted-foreground">주간</p>
              <p className="font-semibold text-sm">
                {data.dayPopulation >= 1000
                  ? `${(data.dayPopulation / 1000).toFixed(0)}K`
                  : data.dayPopulation.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/30 rounded-lg p-2.5">
            <Moon className="w-4 h-4 text-slate-500" />
            <div>
              <p className="text-xs text-muted-foreground">야간</p>
              <p className="font-semibold text-sm">
                {data.nightPopulation >= 1000
                  ? `${(data.nightPopulation / 1000).toFixed(1)}K`
                  : data.nightPopulation.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        {dayNightRatio > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            주간/야간 비율: <span className="font-medium text-foreground">{dayNightRatio.toFixed(1)}배</span>
          </p>
        )}
      </div>

      {/* Income + Medical Density */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/50 rounded-xl p-3">
          <p className="text-xs text-muted-foreground">소득수준</p>
          <div className="flex items-center gap-2 mt-1">
            <Wallet className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold text-sm">{data.incomeLevel}</span>
            <span className="text-xs text-muted-foreground">({data.incomeIndex}점)</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 mt-2">
            <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${data.incomeIndex}%` }} />
          </div>
        </div>
        <div className="bg-muted/50 rounded-xl p-3">
          <p className="text-xs text-muted-foreground">의료기관 밀도</p>
          <div className="flex items-center gap-1 mt-1">
            <Building className="w-4 h-4 text-blue-500" />
            <span className="font-semibold text-sm">{data.medicalDensity}</span>
            <span className="text-xs text-muted-foreground">/ 만명</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 mt-2">
            <div
              className={`h-1.5 rounded-full ${
                data.medicalDensity > 15 ? 'bg-red-500' : data.medicalDensity > 10 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(data.medicalDensity * 5, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">반경 1km 내 {data.nearbyHospitalCount}개 의료기관</p>
        </div>
      </div>

      {/* Residential vs Commercial */}
      <div>
        <p className="text-sm font-medium mb-2">주거 vs 상업 비율</p>
        <div className="flex h-5 rounded-full overflow-hidden">
          <div className="bg-teal-500 flex items-center justify-center" style={{ width: `${data.residentialRatio}%` }}>
            <span className="text-[10px] text-white font-medium">주거 {data.residentialRatio}%</span>
          </div>
          <div className="bg-orange-500 flex items-center justify-center" style={{ width: `${data.commercialRatio}%` }}>
            <span className="text-[10px] text-white font-medium">상업 {data.commercialRatio}%</span>
          </div>
        </div>
      </div>

      {/* AI Insight */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <Brain className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-primary mb-1">AI 분석 인사이트</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{data.insight}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Error Card ───────────────────────────────────────────────────
function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="card p-8 text-center">
      <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
      <p className="font-medium mb-1">분석에 실패했습니다</p>
      <p className="text-sm text-muted-foreground mb-4">{message}</p>
      <button onClick={onRetry} className="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm">
        <RefreshCw className="w-4 h-4" />
        다시 시도
      </button>
    </div>
  )
}

// ── Empty State ──────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="card p-12 text-center">
      <Search className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
      <p className="font-medium text-muted-foreground mb-1">분석할 지역을 선택하세요</p>
      <p className="text-sm text-muted-foreground">시/도, 시/군/구, 동/읍/면을 모두 선택하면<br/>해당 지역의 인구통계를 분석합니다.</p>
    </div>
  )
}

// ── Hook: useDemographics ────────────────────────────────────────
function useDemographics() {
  const [address, setAddress] = useState('')
  const [data, setData] = useState<AreaData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchData = useCallback(async (addr: string) => {
    if (!addr) {
      setData(null)
      setError('')
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = await demographicsService.analyze(addr)
      setData(result)
    } catch (e: any) {
      setError(e.message || '분석에 실패했습니다')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (address) {
      fetchData(address)
    } else {
      setData(null)
      setError('')
    }
  }, [address, fetchData])

  const retry = useCallback(() => {
    if (address) fetchData(address)
  }, [address, fetchData])

  return { address, setAddress, data, loading, error, retry }
}

// ── Main Page ────────────────────────────────────────────────────
export default function DemographicsPage() {
  const primary = useDemographics()
  const secondary = useDemographics()
  const [compareMode, setCompareMode] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <header className="glass sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/dashboard" className="btn-ghost p-2 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Users className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold">상권 인구통계 분석</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Hero description */}
        <div className="text-center mb-6">
          <p className="text-muted-foreground text-sm">
            전국 모든 읍/면/동의 인구통계를 실시간으로 분석합니다.
            행안부 실데이터 기반으로 인구, 연령, 소득, 유동인구를 파악하세요.
          </p>
        </div>

        {/* Address Selectors */}
        <div className="card p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">분석 지역</p>
            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                compareMode ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              비교 모드
            </button>
          </div>

          <AddressSelector
            onChange={primary.setAddress}
            label="분석 지역 선택 *"
          />

          {compareMode && (
            <div className="mt-4 pt-4 border-t border-muted">
              <AddressSelector
                onChange={secondary.setAddress}
                label="비교 지역 선택"
              />
            </div>
          )}
        </div>

        {/* Content */}
        {compareMode ? (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Primary */}
            <div>
              {primary.loading ? (
                <SkeletonCard />
              ) : primary.error ? (
                <ErrorCard message={primary.error} onRetry={primary.retry} />
              ) : primary.data ? (
                <div className="card p-5 border-t-2 border-t-primary">
                  <AreaDetail data={primary.data} />
                </div>
              ) : (
                <EmptyState />
              )}
            </div>
            {/* Secondary */}
            <div>
              {secondary.loading ? (
                <SkeletonCard />
              ) : secondary.error ? (
                <ErrorCard message={secondary.error} onRetry={secondary.retry} />
              ) : secondary.data ? (
                <div className="card p-5 border-t-2 border-t-violet-600">
                  <AreaDetail data={secondary.data} />
                </div>
              ) : (
                <EmptyState />
              )}
            </div>
          </div>
        ) : (
          <div>
            {primary.loading ? (
              <SkeletonCard />
            ) : primary.error ? (
              <ErrorCard message={primary.error} onRetry={primary.retry} />
            ) : primary.data ? (
              <div className="card p-5">
                <AreaDetail data={primary.data} />
              </div>
            ) : (
              <EmptyState />
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-8 text-center">
          * 행정안전부(MOIS) 주민등록 인구통계, 심평원(HIRA) 의료기관 데이터 기반 분석. 추정 모델 사용 시 실제 수치와 차이가 있을 수 있습니다.
        </p>
      </main>
    </div>
  )
}
