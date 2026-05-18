'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Building2, TrendingUp, DollarSign, Users, Activity,
  Star, MapPin, Phone, AlertTriangle, Plus, Trash2, Edit2, X, Save,
} from 'lucide-react'

type BranchStatus = 'active' | 'preparing' | 'closed'

interface Branch {
  id: string
  name: string
  region: string
  address: string
  phone: string
  doctor: string
  specialty: string
  status: BranchStatus
  monthlyRevenue: number
  patients: number       // 월 환자수
  staffCount: number
  satisfactionScore: number // 0~5
}

const DEMO: Branch[] = [
  { id: 'd1', name: '메디매치 내과 강남점', region: '서울 강남구', address: '서울 강남구 테헤란로 123', phone: '02-1234-5678', doctor: '김원장', specialty: '내과', status: 'active', monthlyRevenue: 98_000_000, patients: 1284, staffCount: 6, satisfactionScore: 4.8 },
  { id: 'd2', name: '메디매치 내과 분당점', region: '경기 성남시', address: '경기 성남시 분당구 판교로 45',   phone: '031-987-6543', doctor: '이원장', specialty: '내과', status: 'active', monthlyRevenue: 72_000_000, patients: 950,  staffCount: 5, satisfactionScore: 4.6 },
  { id: 'd3', name: '메디매치 내과 송파점', region: '서울 송파구', address: '서울 송파구 올림픽로 88',        phone: '02-2222-3333', doctor: '박원장', specialty: '내과', status: 'preparing', monthlyRevenue: 0, patients: 0, staffCount: 4, satisfactionScore: 0 },
]

const LS_KEY = 'branches.v1'
const safeNum = (n: any): number => typeof n === 'number' && Number.isFinite(n) ? n : 0
const fmt = (n: number | undefined | null) => safeNum(n).toLocaleString() + '원'
const fmtMan = (n: number | undefined | null) => (safeNum(n) / 10000).toFixed(0) + '만'

const statusLabel: Record<BranchStatus, string> = { active: '운영중', preparing: '개원준비', closed: '폐업' }
const statusColor: Record<BranchStatus, string> = {
  active: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  preparing: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  closed: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
}

export default function MultiBranchPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [isReal, setIsReal] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw) {
        const p = JSON.parse(raw)
        if (Array.isArray(p) && p.length > 0) { setBranches(p); setIsReal(true) }
        else setBranches(DEMO)
      } else setBranches(DEMO)
    } catch { setBranches(DEMO) }
    setHydrated(true)
  }, [])

  const kpi = useMemo(() => {
    const active = branches.filter(b => b.status === 'active')
    return {
      total: branches.length,
      active: active.length,
      preparing: branches.filter(b => b.status === 'preparing').length,
      monthlyRevenue: active.reduce((s, b) => s + safeNum(b.monthlyRevenue), 0),
      patients: active.reduce((s, b) => s + safeNum(b.patients), 0),
      staff: active.reduce((s, b) => s + safeNum(b.staffCount), 0),
      avgSatisfaction: active.length > 0
        ? active.reduce((s, b) => s + safeNum(b.satisfactionScore), 0) / active.length
        : 0,
    }
  }, [branches])

  const saveAll = (next: Branch[]) => {
    setBranches(next)
    try { localStorage.setItem(LS_KEY, JSON.stringify(next)) } catch {}
    setIsReal(next.length > 0)
  }
  const resetToDemo = () => {
    if (!confirm('내 지점 데이터를 모두 삭제하고 데모로 돌아갈까요?')) return
    try { localStorage.removeItem(LS_KEY) } catch {}
    setBranches(DEMO); setIsReal(false)
  }

  if (!hydrated) return null

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">멀티 지점</h1>
            <span className={`text-2xs font-bold px-2 py-0.5 rounded-full ${
              isReal ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40'
            }`}>{isReal ? '내 데이터' : '데모 데이터'}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">여러 지점을 한 계정으로 통합 관리합니다</p>
        </div>
        <div className="flex items-center gap-2">
          {isReal && <button onClick={resetToDemo} className="btn-secondary btn-sm">데모로 초기화</button>}
          <button onClick={() => setEditorOpen(true)} className="btn-primary btn-sm">
            <Edit2 className="w-4 h-4" /> 내 지점 입력
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2"><Building2 className="w-5 h-5 text-primary" /><span className="text-xs text-muted-foreground">전체 지점</span></div>
          <div className="text-2xl font-bold">{kpi.total}곳</div>
          <div className="text-xs mt-1 text-muted-foreground">운영중 {kpi.active} / 준비중 {kpi.preparing}</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2"><DollarSign className="w-5 h-5 text-blue-500" /><span className="text-xs text-muted-foreground">월 매출 합</span></div>
          <div className="text-2xl font-bold">{fmtMan(kpi.monthlyRevenue)}</div>
          <div className="text-xs mt-1 text-muted-foreground">운영중 지점 합산</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2"><Users className="w-5 h-5 text-amber-500" /><span className="text-xs text-muted-foreground">월 환자 합</span></div>
          <div className="text-2xl font-bold">{kpi.patients.toLocaleString()}명</div>
          <div className="text-xs mt-1 text-muted-foreground">직원 {kpi.staff}명</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2"><Star className="w-5 h-5 text-emerald-500" /><span className="text-xs text-muted-foreground">평균 만족도</span></div>
          <div className="text-2xl font-bold">{kpi.avgSatisfaction > 0 ? kpi.avgSatisfaction.toFixed(1) : '—'}</div>
          <div className="text-xs mt-1 text-muted-foreground">5점 만점</div>
        </div>
      </div>

      {/* 지점 카드 */}
      {branches.length === 0 ? (
        <div className="card p-12 text-center text-muted-foreground">
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="mb-4">등록된 지점이 없습니다</p>
          <button onClick={() => setEditorOpen(true)} className="btn-primary btn-sm">
            <Plus className="w-4 h-4" /> 첫 지점 추가
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map(b => (
            <div key={b.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold truncate">{b.name}</h3>
                  </div>
                  <span className={`text-2xs font-semibold px-2 py-0.5 rounded-full ${statusColor[b.status]}`}>
                    {statusLabel[b.status]}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3 flex-shrink-0" /><span className="truncate">{b.address || b.region}</span></div>
                {b.phone && <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 flex-shrink-0" /><span>{b.phone}</span></div>}
                {b.doctor && <div className="flex items-center gap-1.5"><Users className="w-3 h-3 flex-shrink-0" /><span>{b.doctor} · {b.specialty}</span></div>}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border">
                <div>
                  <div className="text-2xs text-muted-foreground">월 매출</div>
                  <div className="font-bold text-sm">{fmtMan(b.monthlyRevenue)}</div>
                </div>
                <div>
                  <div className="text-2xs text-muted-foreground">월 환자</div>
                  <div className="font-bold text-sm">{safeNum(b.patients).toLocaleString()}명</div>
                </div>
                <div>
                  <div className="text-2xs text-muted-foreground">직원 수</div>
                  <div className="font-bold text-sm">{b.staffCount}명</div>
                </div>
                <div>
                  <div className="text-2xs text-muted-foreground">만족도</div>
                  <div className="font-bold text-sm">{safeNum(b.satisfactionScore) > 0 ? `${b.satisfactionScore.toFixed(1)}/5` : '—'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isReal && (
        <div className="card p-3 bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>데모 데이터입니다. <b>"내 지점 입력"</b>으로 실 지점 관리로 전환됩니다.</span>
          </div>
        </div>
      )}

      {editorOpen && (
        <BranchEditor
          initial={isReal ? branches : []}
          onClose={() => setEditorOpen(false)}
          onSave={(n) => { saveAll(n); setEditorOpen(false) }}
        />
      )}
    </div>
  )
}

function BranchEditor({ initial, onClose, onSave }: { initial: Branch[]; onClose: () => void; onSave: (n: Branch[]) => void }) {
  const [rows, setRows] = useState<Branch[]>(initial)
  const addRow = () => setRows([...rows, {
    id: `n${Date.now()}`, name: '', region: '', address: '', phone: '', doctor: '', specialty: '내과',
    status: 'active', monthlyRevenue: 0, patients: 0, staffCount: 0, satisfactionScore: 0,
  }])
  const updateRow = (idx: number, patch: Partial<Branch>) => setRows(rows.map((r, i) => i === idx ? { ...r, ...patch } : r))
  const removeRow = (idx: number) => setRows(rows.filter((_, i) => i !== idx))
  const handleSave = () => onSave(rows.filter(r => r.name.trim().length > 0))

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <h2 className="font-bold text-lg">내 지점 입력</h2>
          <button onClick={onClose} className="btn-icon"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold">지점 ({rows.length}개)</label>
            <button onClick={addRow} className="btn-secondary btn-sm">
              <Plus className="w-3.5 h-3.5" /> 지점 추가
            </button>
          </div>
          {rows.length === 0 ? (
            <div className="border border-dashed border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
              지점이 없습니다. "지점 추가"를 눌러 등록하세요.
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((r, idx) => (
                <div key={r.id} className="grid grid-cols-12 gap-2 p-3 border border-border rounded-xl">
                  <input className="input col-span-3 text-sm" placeholder="지점명" value={r.name}
                    onChange={(e) => updateRow(idx, { name: e.target.value })} />
                  <input className="input col-span-3 text-sm" placeholder="주소" value={r.address}
                    onChange={(e) => updateRow(idx, { address: e.target.value })} />
                  <input className="input col-span-2 text-sm" placeholder="전화" value={r.phone}
                    onChange={(e) => updateRow(idx, { phone: e.target.value })} />
                  <input className="input col-span-2 text-sm" placeholder="원장" value={r.doctor}
                    onChange={(e) => updateRow(idx, { doctor: e.target.value })} />
                  <select className="input col-span-1 text-sm" value={r.status}
                    onChange={(e) => updateRow(idx, { status: e.target.value as BranchStatus })}>
                    <option value="active">운영중</option>
                    <option value="preparing">준비중</option>
                    <option value="closed">폐업</option>
                  </select>
                  <button onClick={() => removeRow(idx)} className="col-span-1 btn-icon text-red-500 mx-auto">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <input className="input col-span-2 text-sm text-right" type="number" placeholder="월 매출" value={r.monthlyRevenue || ''}
                    onChange={(e) => updateRow(idx, { monthlyRevenue: Number(e.target.value) || 0 })} />
                  <input className="input col-span-2 text-sm text-right" type="number" placeholder="월 환자" value={r.patients || ''}
                    onChange={(e) => updateRow(idx, { patients: Number(e.target.value) || 0 })} />
                  <input className="input col-span-2 text-sm" placeholder="진료과" value={r.specialty}
                    onChange={(e) => updateRow(idx, { specialty: e.target.value })} />
                  <input className="input col-span-2 text-sm text-right" type="number" placeholder="직원" value={r.staffCount || ''}
                    onChange={(e) => updateRow(idx, { staffCount: Number(e.target.value) || 0 })} />
                  <input className="input col-span-2 text-sm text-right" type="number" step="0.1" placeholder="만족도(0~5)" value={r.satisfactionScore || ''}
                    onChange={(e) => updateRow(idx, { satisfactionScore: Math.min(5, Number(e.target.value) || 0) })} />
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
