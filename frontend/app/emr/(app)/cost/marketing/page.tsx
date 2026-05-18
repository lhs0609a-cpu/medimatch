'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  TrendingUp, DollarSign, Users, Brain, BarChart3, Target,
  AlertTriangle, Plus, Trash2, Edit2, X, Save,
} from 'lucide-react'

interface Channel {
  id: string
  name: string         // 네이버 광고, 인스타그램, 카카오, 소개 등
  spend: number        // 월 광고비 (원, 0이면 무료)
  inquiries: number    // 월 문의 수
  newPatients: number  // 신규 환자 (실제 내원)
  revenuePerPatient: number  // 신환 1명당 예상 매출
}

const DEMO: Channel[] = [
  { id: 'd1', name: '소개/추천',      spend: 0,         inquiries: 15, newPatients: 15, revenuePerPatient: 400_000 },
  { id: 'd2', name: '네이버 블로그',   spend: 800_000,   inquiries: 45, newPatients: 12, revenuePerPatient: 400_000 },
  { id: 'd3', name: '네이버 광고',     spend: 1_500_000, inquiries: 80, newPatients: 20, revenuePerPatient: 360_000 },
  { id: 'd4', name: '인스타그램/SNS', spend: 400_000,   inquiries: 35, newPatients:  8, revenuePerPatient: 400_000 },
  { id: 'd5', name: '구글 광고',       spend: 600_000,   inquiries: 25, newPatients:  5, revenuePerPatient: 400_000 },
  { id: 'd6', name: '카카오톡',        spend: 300_000,   inquiries: 15, newPatients:  4, revenuePerPatient: 300_000 },
  { id: 'd7', name: '오프라인 전단',   spend: 200_000,   inquiries: 10, newPatients:  3, revenuePerPatient: 300_000 },
]

const LS_KEY = 'marketing.v1'
const safeNum = (n: any): number => typeof n === 'number' && Number.isFinite(n) ? n : 0
const fmt = (n: number | undefined | null) => safeNum(n).toLocaleString() + '원'
const fmtMan = (n: number | undefined | null) => (safeNum(n) / 10000).toFixed(0) + '만'

export default function MarketingPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [isReal, setIsReal] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw) {
        const p = JSON.parse(raw)
        if (Array.isArray(p) && p.length > 0) { setChannels(p); setIsReal(true) }
        else setChannels(DEMO)
      } else setChannels(DEMO)
    } catch { setChannels(DEMO) }
    setHydrated(true)
  }, [])

  const enriched = useMemo(() =>
    channels.map(c => {
      const spend = safeNum(c.spend)
      const newPatients = safeNum(c.newPatients)
      const revenue = newPatients * safeNum(c.revenuePerPatient)
      const cpa = newPatients > 0 ? spend / newPatients : 0
      const roi = spend > 0 ? ((revenue - spend) / spend) * 100 : (revenue > 0 ? Infinity : 0)
      const conversionRate = safeNum(c.inquiries) > 0 ? (newPatients / safeNum(c.inquiries)) * 100 : 0
      return { ...c, revenue, cpa, roi, conversionRate }
    }), [channels])

  const kpi = useMemo(() => {
    const totalSpend = enriched.reduce((s, c) => s + safeNum(c.spend), 0)
    const totalRevenue = enriched.reduce((s, c) => s + c.revenue, 0)
    const totalPatients = enriched.reduce((s, c) => s + safeNum(c.newPatients), 0)
    const avgCpa = totalPatients > 0 ? totalSpend / totalPatients : 0
    const overallRoi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0
    const paidChannels = enriched.filter(c => safeNum(c.spend) > 0)
    const best = paidChannels.length > 0
      ? paidChannels.reduce((a, b) => (a.roi > b.roi ? a : b))
      : null
    return { totalSpend, totalRevenue, totalPatients, avgCpa, overallRoi, bestChannel: best?.name || '—', bestRoi: best?.roi || 0, count: channels.length }
  }, [enriched, channels])

  const sorted = useMemo(() =>
    [...enriched].sort((a, b) => b.roi - a.roi),
  [enriched])

  const saveAll = (next: Channel[]) => {
    setChannels(next)
    try { localStorage.setItem(LS_KEY, JSON.stringify(next)) } catch {}
    setIsReal(next.length > 0)
  }
  const resetToDemo = () => {
    if (!confirm('내 마케팅 데이터를 모두 삭제하고 데모로 돌아갈까요?')) return
    try { localStorage.removeItem(LS_KEY) } catch {}
    setChannels(DEMO); setIsReal(false)
  }

  if (!hydrated) return null

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">마케팅 ROI</h1>
            <span className={`text-2xs font-bold px-2 py-0.5 rounded-full ${
              isReal ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40'
            }`}>{isReal ? '내 데이터' : '데모 데이터'}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">채널별 광고비 대비 신규 환자·매출을 추적합니다</p>
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
          <div className="flex items-center gap-2 mb-2"><DollarSign className="w-5 h-5 text-primary" /><span className="text-xs text-muted-foreground">월 광고비</span></div>
          <div className="text-2xl font-bold">{fmtMan(kpi.totalSpend)}</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2"><Users className="w-5 h-5 text-blue-500" /><span className="text-xs text-muted-foreground">신규 환자</span></div>
          <div className="text-2xl font-bold">{kpi.totalPatients}명</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2"><Target className="w-5 h-5 text-amber-500" /><span className="text-xs text-muted-foreground">평균 CPA</span></div>
          <div className="text-2xl font-bold">{fmt(Math.round(kpi.avgCpa))}</div>
          <div className="text-xs mt-1 text-muted-foreground">광고비 ÷ 신환</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-5 h-5 text-emerald-500" /><span className="text-xs text-muted-foreground">전체 ROI</span></div>
          <div className={`text-2xl font-bold ${kpi.overallRoi > 0 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
            {kpi.totalSpend > 0 ? `${Math.round(kpi.overallRoi)}%` : '—'}
          </div>
        </div>
      </div>

      {/* 베스트 채널 강조 */}
      {kpi.bestChannel !== '—' && (
        <div className="card p-5 bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-emerald-500" />
            <div className="flex-1">
              <div className="text-xs text-muted-foreground">가장 효율적인 채널</div>
              <div className="font-bold">{kpi.bestChannel}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">ROI</div>
              <div className="text-xl font-bold text-emerald-600">{Math.round(kpi.bestRoi)}%</div>
            </div>
          </div>
        </div>
      )}

      {/* 채널 리스트 */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-bold">채널별 성과</h3>
          <span className="text-xs text-muted-foreground">ROI 높은 순</span>
        </div>
        {sorted.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="mb-4">등록된 채널이 없습니다</p>
            <button onClick={() => setEditorOpen(true)} className="btn-primary btn-sm">
              <Plus className="w-4 h-4" /> 첫 채널 추가
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {sorted.map(c => (
              <div key={c.id} className="p-4 hover:bg-secondary/30 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-semibold flex-1">{c.name}</span>
                  {c.spend === 0 ? (
                    <span className="text-2xs px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30">무료</span>
                  ) : (
                    <span className={`text-2xs px-1.5 py-0.5 rounded font-bold ${
                      c.roi > 300 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' :
                      c.roi > 100 ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30' :
                      'bg-red-50 text-red-600 dark:bg-red-900/30'
                    }`}>ROI {Math.round(c.roi)}%</span>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                  <div><div className="text-muted-foreground">월 광고비</div><div className="font-medium">{fmtMan(c.spend)}</div></div>
                  <div><div className="text-muted-foreground">문의</div><div className="font-medium">{c.inquiries}건</div></div>
                  <div><div className="text-muted-foreground">신환</div><div className="font-medium">{c.newPatients}명</div></div>
                  <div><div className="text-muted-foreground">전환율</div><div className="font-medium">{c.conversionRate.toFixed(1)}%</div></div>
                  <div><div className="text-muted-foreground">CPA</div><div className="font-medium">{c.cpa > 0 ? fmt(Math.round(c.cpa)) : '-'}</div></div>
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
            <span>데모 데이터입니다. <b>"내 데이터 입력"</b>으로 실 채널 ROI 분석으로 전환됩니다.</span>
          </div>
        </div>
      )}

      {editorOpen && (
        <MarketingEditor
          initial={isReal ? channels : []}
          onClose={() => setEditorOpen(false)}
          onSave={(n) => { saveAll(n); setEditorOpen(false) }}
        />
      )}
    </div>
  )
}

function MarketingEditor({ initial, onClose, onSave }: { initial: Channel[]; onClose: () => void; onSave: (n: Channel[]) => void }) {
  const [rows, setRows] = useState<Channel[]>(initial)
  const addRow = () => setRows([...rows, {
    id: `n${Date.now()}`, name: '', spend: 0, inquiries: 0, newPatients: 0, revenuePerPatient: 400000,
  }])
  const updateRow = (idx: number, patch: Partial<Channel>) => setRows(rows.map((r, i) => i === idx ? { ...r, ...patch } : r))
  const removeRow = (idx: number) => setRows(rows.filter((_, i) => i !== idx))
  const handleSave = () => onSave(rows.filter(r => r.name.trim().length > 0))

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="font-bold text-lg">내 마케팅 채널 입력</h2>
            <p className="text-xs text-muted-foreground mt-0.5">월 단위 광고비·문의·신환을 입력해주세요</p>
          </div>
          <button onClick={onClose} className="btn-icon"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold">마케팅 채널 ({rows.length}개)</label>
            <button onClick={addRow} className="btn-secondary btn-sm">
              <Plus className="w-3.5 h-3.5" /> 채널 추가
            </button>
          </div>
          {rows.length === 0 ? (
            <div className="border border-dashed border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
              채널이 없습니다. "채널 추가"를 눌러 등록하세요.
            </div>
          ) : (
            <div className="space-y-2">
              {rows.map((r, idx) => (
                <div key={r.id} className="grid grid-cols-12 gap-2 items-center p-3 border border-border rounded-xl">
                  <input className="input col-span-3 text-sm" placeholder="채널명 (예: 네이버 광고)" value={r.name}
                    onChange={(e) => updateRow(idx, { name: e.target.value })} />
                  <input className="input col-span-2 text-sm text-right" type="number" placeholder="월 광고비" value={r.spend || ''}
                    onChange={(e) => updateRow(idx, { spend: Number(e.target.value) || 0 })} />
                  <input className="input col-span-2 text-sm text-right" type="number" placeholder="월 문의" value={r.inquiries || ''}
                    onChange={(e) => updateRow(idx, { inquiries: Number(e.target.value) || 0 })} />
                  <input className="input col-span-2 text-sm text-right" type="number" placeholder="월 신환" value={r.newPatients || ''}
                    onChange={(e) => updateRow(idx, { newPatients: Number(e.target.value) || 0 })} />
                  <input className="input col-span-2 text-sm text-right" type="number" placeholder="신환1명 매출" value={r.revenuePerPatient || ''}
                    onChange={(e) => updateRow(idx, { revenuePerPatient: Number(e.target.value) || 0 })} />
                  <button onClick={() => removeRow(idx)} className="col-span-1 btn-icon text-red-500 mx-auto">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="grid grid-cols-12 gap-2 px-3 text-2xs text-muted-foreground pt-1">
                <span className="col-span-3">채널명</span>
                <span className="col-span-2 text-right">월 광고비</span>
                <span className="col-span-2 text-right">월 문의</span>
                <span className="col-span-2 text-right">월 신환</span>
                <span className="col-span-2 text-right">신환1명당 매출</span>
                <span className="col-span-1" />
              </div>
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
