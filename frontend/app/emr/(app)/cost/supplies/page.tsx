'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  ShoppingCart, DollarSign, AlertTriangle, Package,
  Pill, Box, Plus, Trash2, Edit2, X, Save,
} from 'lucide-react'

type ItemType = 'SUPPLY' | 'DRUG'

interface SupplyItem {
  id: string
  name: string
  type: ItemType
  vendor: string
  unit: string         // 박스(100개) 등
  pricePerUnit: number // 단가
  monthlyUsage: number // 월 사용량 (단위 수)
  stock: number        // 현재 재고
  reorderPoint: number // 재주문 임계치
}

const DEMO: SupplyItem[] = [
  { id: 'd1', name: '일회용 주사기 3ml',  type: 'SUPPLY', vendor: '한국메디칼',     unit: '박스(100개)',  pricePerUnit: 35_000, monthlyUsage: 20, stock: 15, reorderPoint: 10 },
  { id: 'd2', name: '알코올 솜',          type: 'SUPPLY', vendor: '메디팜',         unit: '팩(200매)',    pricePerUnit:  8_500, monthlyUsage: 30, stock: 25, reorderPoint: 15 },
  { id: 'd3', name: '암로디핀 5mg',       type: 'DRUG',   vendor: '한미약품',       unit: '박스(100정)',  pricePerUnit: 12_000, monthlyUsage: 15, stock:  8, reorderPoint:  5 },
  { id: 'd4', name: '메트포르민 500mg',   type: 'DRUG',   vendor: '대웅제약',       unit: '박스(100정)',  pricePerUnit: 15_000, monthlyUsage: 10, stock: 12, reorderPoint:  5 },
  { id: 'd5', name: '오메프라졸 20mg',    type: 'DRUG',   vendor: '아스트라제네카', unit: '박스(60정)',   pricePerUnit: 28_000, monthlyUsage:  8, stock:  4, reorderPoint:  3 },
  { id: 'd6', name: '거즈 (멸균)',        type: 'SUPPLY', vendor: '메디라인',       unit: '팩(50매)',     pricePerUnit: 12_000, monthlyUsage: 25, stock: 18, reorderPoint: 10 },
  { id: 'd7', name: '라텍스 장갑',        type: 'SUPPLY', vendor: '메디라인',       unit: '박스(100매)',  pricePerUnit: 18_000, monthlyUsage: 15, stock:  5, reorderPoint:  8 },
]

const LS_KEY = 'supplies.v1'
const safeNum = (n: any): number => typeof n === 'number' && Number.isFinite(n) ? n : 0
const fmt = (n: number | undefined | null) => safeNum(n).toLocaleString() + '원'
const fmtMan = (n: number | undefined | null) => (safeNum(n) / 10000).toFixed(0) + '만'

export default function SuppliesPage() {
  const [items, setItems] = useState<SupplyItem[]>([])
  const [isReal, setIsReal] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [filter, setFilter] = useState<'ALL' | ItemType>('ALL')

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw) {
        const p = JSON.parse(raw)
        if (Array.isArray(p) && p.length > 0) { setItems(p); setIsReal(true) }
        else setItems(DEMO)
      } else setItems(DEMO)
    } catch { setItems(DEMO) }
    setHydrated(true)
  }, [])

  const enriched = useMemo(() =>
    items.map(i => ({
      ...i,
      monthlyCost: safeNum(i.pricePerUnit) * safeNum(i.monthlyUsage),
      stockShort: safeNum(i.stock) < safeNum(i.reorderPoint),
    })), [items])

  const kpi = useMemo(() => {
    const monthly = enriched.reduce((s, i) => s + i.monthlyCost, 0)
    return {
      monthly,
      reorderAlerts: enriched.filter(i => i.stockShort).length,
      count: items.length,
      drugs: items.filter(i => i.type === 'DRUG').length,
    }
  }, [enriched, items])

  const filtered = filter === 'ALL' ? enriched : enriched.filter(i => i.type === filter)
  const sorted = [...filtered].sort((a, b) => b.monthlyCost - a.monthlyCost)

  const saveAll = (next: SupplyItem[]) => {
    setItems(next)
    try { localStorage.setItem(LS_KEY, JSON.stringify(next)) } catch {}
    setIsReal(next.length > 0)
  }
  const resetToDemo = () => {
    if (!confirm('내 소모품·약가 데이터를 모두 삭제하고 데모로 돌아갈까요?')) return
    try { localStorage.removeItem(LS_KEY) } catch {}
    setItems(DEMO); setIsReal(false)
  }

  if (!hydrated) return null

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">소모품·약가 비교</h1>
            <span className={`text-2xs font-bold px-2 py-0.5 rounded-full ${
              isReal ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40'
            }`}>{isReal ? '내 데이터' : '데모 데이터'}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">의료 소모품·의약품 단가와 재고를 관리합니다</p>
        </div>
        <div className="flex items-center gap-2">
          {isReal && <button onClick={resetToDemo} className="btn-secondary btn-sm">데모로 초기화</button>}
          <button onClick={() => setEditorOpen(true)} className="btn-primary btn-sm">
            <Edit2 className="w-4 h-4" /> 내 데이터 입력
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2"><DollarSign className="w-5 h-5 text-primary" /><span className="text-xs text-muted-foreground">월 구매액</span></div>
          <div className="text-2xl font-bold">{fmtMan(kpi.monthly)}</div>
          <div className="text-xs mt-1 text-muted-foreground">단가 × 월 사용량</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2"><Package className="w-5 h-5 text-blue-500" /><span className="text-xs text-muted-foreground">전체 품목</span></div>
          <div className="text-2xl font-bold">{kpi.count}</div>
          <div className="text-xs mt-1 text-muted-foreground">약품 {kpi.drugs} / 소모품 {kpi.count - kpi.drugs}</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-5 h-5 text-amber-500" /><span className="text-xs text-muted-foreground">재주문 알림</span></div>
          <div className="text-2xl font-bold">{kpi.reorderAlerts}건</div>
          <div className="text-xs mt-1 text-muted-foreground">재고 ≤ 임계치</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2"><ShoppingCart className="w-5 h-5 text-emerald-500" /><span className="text-xs text-muted-foreground">연 환산</span></div>
          <div className="text-2xl font-bold">{fmtMan(kpi.monthly * 12)}</div>
          <div className="text-xs mt-1 text-muted-foreground">월 × 12</div>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex items-center gap-2">
        {(['ALL', 'SUPPLY', 'DRUG'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
              filter === f ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:bg-secondary/70'
            }`}
          >
            {f === 'ALL' ? '전체' : f === 'SUPPLY' ? '소모품' : '약품'}
          </button>
        ))}
      </div>

      {/* 리스트 */}
      <div className="card overflow-hidden">
        {sorted.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Box className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="mb-4">등록된 품목이 없습니다</p>
            <button onClick={() => setEditorOpen(true)} className="btn-primary btn-sm">
              <Plus className="w-4 h-4" /> 첫 품목 추가
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {sorted.map(it => (
              <div key={it.id} className="p-4 flex items-center gap-3 hover:bg-secondary/30 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  it.type === 'DRUG' ? 'bg-rose-50 dark:bg-rose-900/30' : 'bg-blue-50 dark:bg-blue-900/30'
                }`}>
                  {it.type === 'DRUG' ? <Pill className="w-5 h-5 text-rose-600 dark:text-rose-400" /> : <Box className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold truncate">{it.name}</span>
                    {it.stockShort && (
                      <span className="text-2xs px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                        재주문
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {it.vendor} · {it.unit} · 단가 {fmt(it.pricePerUnit)}
                  </div>
                </div>
                <div className="text-right hidden md:block">
                  <div className="text-xs text-muted-foreground">월 사용</div>
                  <div className="text-sm font-medium">{it.monthlyUsage}</div>
                </div>
                <div className="text-right hidden md:block">
                  <div className="text-xs text-muted-foreground">재고/임계</div>
                  <div className={`text-sm font-medium ${it.stockShort ? 'text-amber-600' : ''}`}>
                    {it.stock}/{it.reorderPoint}
                  </div>
                </div>
                <div className="text-right min-w-[70px]">
                  <div className="font-bold">{fmtMan(it.monthlyCost)}</div>
                  <div className="text-2xs text-muted-foreground">월</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!isReal && (
        <div className="card p-3 bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>데모 데이터입니다. <b>"내 데이터 입력"</b>으로 실 품목·재고 분석으로 전환됩니다.</span>
          </div>
        </div>
      )}

      {editorOpen && (
        <SuppliesEditor
          initial={isReal ? items : []}
          onClose={() => setEditorOpen(false)}
          onSave={(next) => { saveAll(next); setEditorOpen(false) }}
        />
      )}
    </div>
  )
}

function SuppliesEditor({ initial, onClose, onSave }: { initial: SupplyItem[]; onClose: () => void; onSave: (n: SupplyItem[]) => void }) {
  const [rows, setRows] = useState<SupplyItem[]>(initial)
  const addRow = () => setRows([...rows, {
    id: `n${Date.now()}`, name: '', type: 'SUPPLY', vendor: '', unit: '',
    pricePerUnit: 0, monthlyUsage: 0, stock: 0, reorderPoint: 0,
  }])
  const updateRow = (idx: number, patch: Partial<SupplyItem>) => setRows(rows.map((r, i) => i === idx ? { ...r, ...patch } : r))
  const removeRow = (idx: number) => setRows(rows.filter((_, i) => i !== idx))
  const handleSave = () => onSave(rows.filter(r => r.name.trim().length > 0))

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="font-bold text-lg">내 소모품·약가 데이터 입력</h2>
            <p className="text-xs text-muted-foreground mt-0.5">브라우저에 저장됩니다</p>
          </div>
          <button onClick={onClose} className="btn-icon"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold">품목 ({rows.length}개)</label>
            <button onClick={addRow} className="btn-secondary btn-sm">
              <Plus className="w-3.5 h-3.5" /> 품목 추가
            </button>
          </div>
          {rows.length === 0 ? (
            <div className="border border-dashed border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
              품목이 없습니다. "품목 추가"를 눌러 등록하세요.
            </div>
          ) : (
            <div className="space-y-2">
              {rows.map((r, idx) => (
                <div key={r.id} className="grid grid-cols-12 gap-2 items-center p-3 border border-border rounded-xl">
                  <input className="input col-span-3 text-sm" placeholder="품목명" value={r.name}
                    onChange={(e) => updateRow(idx, { name: e.target.value })} />
                  <select className="input col-span-1 text-sm" value={r.type}
                    onChange={(e) => updateRow(idx, { type: e.target.value as ItemType })}>
                    <option value="SUPPLY">소모품</option>
                    <option value="DRUG">약품</option>
                  </select>
                  <input className="input col-span-2 text-sm" placeholder="거래처" value={r.vendor}
                    onChange={(e) => updateRow(idx, { vendor: e.target.value })} />
                  <input className="input col-span-2 text-sm" placeholder="단위(박스 등)" value={r.unit}
                    onChange={(e) => updateRow(idx, { unit: e.target.value })} />
                  <input className="input col-span-1 text-sm text-right" type="number" placeholder="단가" value={r.pricePerUnit || ''}
                    onChange={(e) => updateRow(idx, { pricePerUnit: Number(e.target.value) || 0 })} />
                  <input className="input col-span-1 text-sm text-right" type="number" placeholder="월 사용" value={r.monthlyUsage || ''}
                    onChange={(e) => updateRow(idx, { monthlyUsage: Number(e.target.value) || 0 })} />
                  <input className="input col-span-1 text-sm text-right" type="number" placeholder="재고" value={r.stock || ''}
                    onChange={(e) => updateRow(idx, { stock: Number(e.target.value) || 0 })} />
                  <button onClick={() => removeRow(idx)} className="col-span-1 btn-icon text-red-500 mx-auto">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
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
