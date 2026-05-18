'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Landmark, TrendingUp, DollarSign, Calendar, Brain, BarChart3,
  AlertTriangle, Info, Plus, Trash2, Edit2, X, Save,
} from 'lucide-react'

type Urgency = 'HIGH' | 'MEDIUM' | 'LOW'

interface CostItem {
  id: string
  category: string
  vendor: string
  amount: number           // 월 비용 (원)
  endDate?: string         // 계약 만료 (YYYY-MM-DD, 선택)
}

const DEMO_ITEMS: CostItem[] = [
  { id: 'd1', category: '임대료',    vendor: '강남빌딩 관리사무소', amount: 5_500_000, endDate: '2026-08-27' },
  { id: 'd2', category: '대출 상환', vendor: '국민은행',           amount: 2_300_000 },
  { id: 'd3', category: '장비 리스', vendor: 'GE Healthcare',      amount: 1_200_000, endDate: '2027-02-27' },
  { id: 'd4', category: '공과금',    vendor: '한국전력/서울도시가스', amount: 850_000 },
  { id: 'd5', category: '기타',      vendor: '세무법인 택스원',     amount: 500_000, endDate: '2027-02-27' },
  { id: 'd6', category: '보험료',    vendor: '삼성화재',            amount: 420_000, endDate: '2026-05-29' },
  { id: 'd7', category: '유지보수',  vendor: '의료기기정비(주)',    amount: 350_000, endDate: '2026-04-29' },
  { id: 'd8', category: '통신비',    vendor: 'KT',                  amount: 280_000, endDate: '2026-04-14' },
]

const LS_KEY = 'fixedCost.v1'
const LS_REVENUE = 'fixedCost.monthlyRevenue.v1'

const safeNum = (n: number | undefined | null): number =>
  typeof n === 'number' && Number.isFinite(n) ? n : 0
const fmt = (n: number | undefined | null) => safeNum(n).toLocaleString() + '원'
const fmtMan = (n: number | undefined | null) => (safeNum(n) / 10000).toFixed(0) + '만'

const daysUntil = (dateStr?: string): number | null => {
  if (!dateStr) return null
  const d = new Date(dateStr).getTime()
  if (Number.isNaN(d)) return null
  return Math.ceil((d - Date.now()) / 86400000)
}
const urgencyOf = (days: number | null): Urgency | null => {
  if (days === null) return null
  if (days <= 60) return 'HIGH'
  if (days <= 120) return 'MEDIUM'
  return 'LOW'
}
const urgencyColors: Record<Urgency, string> = {
  HIGH: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  MEDIUM: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  LOW: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
}

export default function FixedCostPage() {
  const [items, setItems] = useState<CostItem[]>([])
  const [monthlyRevenue, setMonthlyRevenue] = useState(0)
  const [isReal, setIsReal] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw) {
        const p = JSON.parse(raw) as CostItem[]
        if (Array.isArray(p) && p.length > 0) {
          setItems(p)
          setIsReal(true)
        } else setItems(DEMO_ITEMS)
      } else setItems(DEMO_ITEMS)
      const rev = localStorage.getItem(LS_REVENUE)
      if (rev) setMonthlyRevenue(Number(rev) || 0)
    } catch { setItems(DEMO_ITEMS) }
    setHydrated(true)
  }, [])

  const kpi = useMemo(() => {
    const total = items.reduce((s, i) => s + safeNum(i.amount), 0)
    const expiringSoon = items.filter(i => {
      const d = daysUntil(i.endDate)
      return d !== null && d > 0 && d <= 60
    }).length
    const revenueRatio = monthlyRevenue > 0 ? (total / monthlyRevenue) * 100 : 0
    return { total, expiringSoon, revenueRatio, count: items.length }
  }, [items, monthlyRevenue])

  const sortedItems = useMemo(() => {
    return [...items]
      .map(i => ({
        ...i,
        share: kpi.total > 0 ? (safeNum(i.amount) / kpi.total) * 100 : 0,
        daysLeft: daysUntil(i.endDate),
      }))
      .sort((a, b) => safeNum(b.amount) - safeNum(a.amount))
  }, [items, kpi.total])

  const upcomingContracts = useMemo(() => {
    return sortedItems
      .filter(i => i.daysLeft !== null && i.daysLeft >= 0)
      .sort((a, b) => (a.daysLeft ?? 999) - (b.daysLeft ?? 999))
  }, [sortedItems])

  const saveAll = (next: CostItem[], rev?: number) => {
    setItems(next)
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(next))
      if (rev !== undefined) localStorage.setItem(LS_REVENUE, String(rev))
    } catch {}
    setIsReal(next.length > 0)
  }

  const resetToDemo = () => {
    if (!confirm('내 고정비 데이터를 모두 삭제하고 데모로 돌아갈까요?')) return
    try {
      localStorage.removeItem(LS_KEY)
      localStorage.removeItem(LS_REVENUE)
    } catch {}
    setItems(DEMO_ITEMS)
    setMonthlyRevenue(0)
    setIsReal(false)
  }

  if (!hydrated) return null

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">고정비 절감</h1>
            <span className={`text-2xs font-bold px-2 py-0.5 rounded-full ${
              isReal
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
            }`}>
              {isReal ? '내 데이터' : '데모 데이터'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            임대·공과금·리스·보험을 한 곳에서 추적하고 만료 임박 계약을 알려드립니다
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isReal && (
            <button onClick={resetToDemo} className="btn-secondary btn-sm">데모로 초기화</button>
          )}
          <button onClick={() => setEditorOpen(true)} className="btn-primary btn-sm">
            <Edit2 className="w-4 h-4" /> 내 데이터 입력
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-primary" />
            <span className="text-xs text-muted-foreground">총 고정비 (월)</span>
          </div>
          <div className="text-2xl font-bold">{fmtMan(kpi.total)}</div>
          <div className="text-xs mt-1 text-muted-foreground">{kpi.count}개 항목</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <span className="text-xs text-muted-foreground">매출 대비</span>
          </div>
          {monthlyRevenue > 0 ? (
            <>
              <div className="text-2xl font-bold">{kpi.revenueRatio.toFixed(1)}%</div>
              <div className="text-xs mt-1 text-muted-foreground">권장: 15% 이하</div>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-muted-foreground/50">—</div>
              <div className="text-xs mt-1 text-muted-foreground">월 매출 입력 시 표시</div>
            </>
          )}
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-amber-500" />
            <span className="text-xs text-muted-foreground">60일 내 만료</span>
          </div>
          <div className="text-2xl font-bold">{kpi.expiringSoon}건</div>
          <div className="text-xs mt-1 text-muted-foreground">재협상 권장</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <span className="text-xs text-muted-foreground">연 환산</span>
          </div>
          <div className="text-2xl font-bold">{fmtMan(kpi.total * 12)}</div>
          <div className="text-xs mt-1 text-muted-foreground">월 × 12</div>
        </div>
      </div>

      {/* 비용 항목 */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-bold">비용 항목</h3>
          <span className="text-xs text-muted-foreground">큰 금액 순</span>
        </div>
        {sortedItems.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Landmark className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="mb-4">등록된 고정비가 없습니다</p>
            <button onClick={() => setEditorOpen(true)} className="btn-primary btn-sm">
              <Plus className="w-4 h-4" /> 첫 항목 추가
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {sortedItems.map((it) => {
              const urgency = urgencyOf(it.daysLeft)
              return (
                <div key={it.id} className="p-4 flex items-center gap-3 hover:bg-secondary/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{it.category}</span>
                      {urgency && (
                        <span className={`text-2xs px-1.5 py-0.5 rounded ${urgencyColors[urgency]}`}>
                          {it.daysLeft! <= 0 ? '만료됨' : `D-${it.daysLeft}`}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {it.vendor || '거래처 미입력'}
                      {it.endDate && ` · 만료 ${it.endDate}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{fmt(it.amount)}</div>
                    <div className="text-2xs text-muted-foreground">{it.share.toFixed(1)}%</div>
                  </div>
                  <div className="w-32 hidden md:block">
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${it.share}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 만료 임박 계약 */}
      {upcomingContracts.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold">만료 임박 계약 — 재협상 기회</h3>
          </div>
          <div className="space-y-2">
            {upcomingContracts.slice(0, 5).map((c) => {
              const u = urgencyOf(c.daysLeft)
              return (
                <div key={c.id} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                  <span className={`text-2xs font-semibold px-2 py-0.5 rounded ${urgencyColors[u || 'LOW']}`}>
                    {c.daysLeft! <= 0 ? '만료' : `D-${c.daysLeft}`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{c.category} · {c.vendor}</div>
                    <div className="text-2xs text-muted-foreground">{c.endDate}</div>
                  </div>
                  <span className="text-sm font-semibold">{fmt(c.amount)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!isReal && (
        <div className="card p-3 bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              데모 데이터로 표시 중입니다. <b>"내 데이터 입력"</b>을 누르시면 실 비용 분석으로 전환됩니다.
            </span>
          </div>
        </div>
      )}

      {editorOpen && (
        <FixedCostEditor
          initial={isReal ? items : []}
          initialRevenue={monthlyRevenue}
          onClose={() => setEditorOpen(false)}
          onSave={(next, rev) => { saveAll(next, rev); setEditorOpen(false) }}
        />
      )}
    </div>
  )
}

/* ════════ 편집 모달 ════════ */
interface EditorProps {
  initial: CostItem[]
  initialRevenue: number
  onClose: () => void
  onSave: (next: CostItem[], revenue: number) => void
}
function FixedCostEditor({ initial, initialRevenue, onClose, onSave }: EditorProps) {
  const [rows, setRows] = useState<CostItem[]>(initial)
  const [revenue, setRevenue] = useState(initialRevenue)

  const addRow = () => setRows([...rows, {
    id: `n${Date.now()}`, category: '', vendor: '', amount: 0, endDate: '',
  }])
  const updateRow = (idx: number, patch: Partial<CostItem>) =>
    setRows(rows.map((r, i) => i === idx ? { ...r, ...patch } : r))
  const removeRow = (idx: number) =>
    setRows(rows.filter((_, i) => i !== idx))
  const handleSave = () => {
    const cleaned = rows.filter(r => r.category.trim().length > 0)
    onSave(cleaned, revenue)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="font-bold text-lg">내 고정비 데이터 입력</h2>
            <p className="text-xs text-muted-foreground mt-0.5">브라우저에 저장됩니다</p>
          </div>
          <button onClick={onClose} className="btn-icon"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="text-sm font-semibold mb-1.5 block">월 평균 매출 (선택)</label>
            <div className="flex items-center gap-2">
              <input
                type="number" inputMode="numeric"
                value={revenue || ''}
                onChange={(e) => setRevenue(Number(e.target.value) || 0)}
                placeholder="예: 96000000"
                className="input flex-1"
              />
              <span className="text-sm text-muted-foreground">원/월</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold">고정비 항목 ({rows.length}개)</label>
              <button onClick={addRow} className="btn-secondary btn-sm">
                <Plus className="w-3.5 h-3.5" /> 항목 추가
              </button>
            </div>
            {rows.length === 0 ? (
              <div className="border border-dashed border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
                항목이 없습니다. "항목 추가"를 눌러 등록하세요.
              </div>
            ) : (
              <div className="space-y-2">
                {rows.map((r, idx) => (
                  <div key={r.id} className="grid grid-cols-12 gap-2 items-center p-3 border border-border rounded-xl">
                    <input
                      className="input col-span-3 text-sm"
                      placeholder="항목명 (예: 임대료)"
                      value={r.category}
                      onChange={(e) => updateRow(idx, { category: e.target.value })}
                    />
                    <input
                      className="input col-span-3 text-sm"
                      placeholder="거래처"
                      value={r.vendor}
                      onChange={(e) => updateRow(idx, { vendor: e.target.value })}
                    />
                    <input
                      className="input col-span-3 text-sm text-right"
                      type="number" inputMode="numeric"
                      placeholder="월 비용 (원)"
                      value={r.amount || ''}
                      onChange={(e) => updateRow(idx, { amount: Number(e.target.value) || 0 })}
                    />
                    <input
                      className="input col-span-2 text-sm"
                      type="date"
                      value={r.endDate || ''}
                      onChange={(e) => updateRow(idx, { endDate: e.target.value })}
                    />
                    <button
                      onClick={() => removeRow(idx)}
                      className="col-span-1 btn-icon text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 mx-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="grid grid-cols-12 gap-2 px-3 text-2xs text-muted-foreground">
                  <span className="col-span-3">항목명</span>
                  <span className="col-span-3">거래처</span>
                  <span className="col-span-3 text-right">월 비용</span>
                  <span className="col-span-2">계약 만료일</span>
                  <span className="col-span-1" />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border flex-shrink-0">
          <button onClick={onClose} className="btn-secondary btn-sm">취소</button>
          <button onClick={handleSave} className="btn-primary btn-sm">
            <Save className="w-3.5 h-3.5" /> 저장
          </button>
        </div>
      </div>
    </div>
  )
}
