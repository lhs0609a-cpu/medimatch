'use client'

import { useState, useEffect, useMemo } from 'react'
import ComingSoonBanner from '@/components/emr/ComingSoonBanner'
import {
  Star, MessageSquare, ThumbsUp, ThumbsDown, Send,
  CheckCircle2, AlertTriangle, Plus, Trash2, Edit2, X, Save,
} from 'lucide-react'

type Sentiment = 'positive' | 'neutral' | 'negative'
type Source = 'internal' | 'naver' | 'kakao' | 'google'

interface Review {
  id: string
  patientName: string
  date: string         // YYYY-MM-DD
  source: Source
  rating: number       // 1~5
  comment: string
  replied: boolean
  replyText?: string
}

const DEMO: Review[] = [
  { id: 'd1', patientName: '김OO', date: '2026-05-10', source: 'naver', rating: 5, comment: '진료가 정확하고 친절했습니다. 차트 시간이 짧아 대기도 적어요.', replied: true, replyText: '소중한 후기 감사합니다.' },
  { id: 'd2', patientName: '이OO', date: '2026-05-08', source: 'kakao', rating: 4, comment: '예약 알림톡이 편리했어요. 다음에도 이용하겠습니다.', replied: true },
  { id: 'd3', patientName: '박OO', date: '2026-05-05', source: 'internal', rating: 5, comment: '의사 선생님 설명이 너무 자세하셔서 안심이 됐어요.', replied: false },
  { id: 'd4', patientName: '최OO', date: '2026-04-28', source: 'google', rating: 3, comment: '진료는 좋은데 주차가 어려워요.', replied: false },
  { id: 'd5', patientName: '정OO', date: '2026-04-22', source: 'naver', rating: 5, comment: '내과인데 친절하고 깔끔합니다.', replied: true },
]

const LS_KEY = 'reviews.v1'

const safeNum = (n: any): number => typeof n === 'number' && Number.isFinite(n) ? n : 0
const sentimentOf = (rating: number): Sentiment =>
  rating >= 4 ? 'positive' : rating === 3 ? 'neutral' : 'negative'

const sourceLabel: Record<Source, string> = {
  internal: '자체 설문', naver: '네이버', kakao: '카카오톡', google: '구글',
}
const sourceColor: Record<Source, string> = {
  internal: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  naver: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  kakao: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  google: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [isReal, setIsReal] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [filter, setFilter] = useState<'ALL' | Sentiment>('ALL')

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw) {
        const p = JSON.parse(raw)
        if (Array.isArray(p) && p.length > 0) { setReviews(p); setIsReal(true) }
        else setReviews(DEMO)
      } else setReviews(DEMO)
    } catch { setReviews(DEMO) }
    setHydrated(true)
  }, [])

  const enriched = useMemo(() =>
    reviews.map(r => ({ ...r, sentiment: sentimentOf(safeNum(r.rating)) })),
  [reviews])

  const kpi = useMemo(() => {
    const total = enriched.length
    if (total === 0) return { avg: 0, total: 0, replied: 0, positive: 0, neutral: 0, negative: 0, responseRate: 0 }
    const sum = enriched.reduce((s, r) => s + safeNum(r.rating), 0)
    return {
      avg: sum / total,
      total,
      replied: enriched.filter(r => r.replied).length,
      positive: enriched.filter(r => r.sentiment === 'positive').length,
      neutral:  enriched.filter(r => r.sentiment === 'neutral').length,
      negative: enriched.filter(r => r.sentiment === 'negative').length,
      responseRate: (enriched.filter(r => r.replied).length / total) * 100,
    }
  }, [enriched])

  const filtered = filter === 'ALL' ? enriched : enriched.filter(r => r.sentiment === filter)
  const sorted = [...filtered].sort((a, b) => (b.date || '').localeCompare(a.date || ''))

  const saveAll = (next: Review[]) => {
    setReviews(next)
    try { localStorage.setItem(LS_KEY, JSON.stringify(next)) } catch {}
    setIsReal(next.length > 0)
  }
  const resetToDemo = () => {
    if (!confirm('내 후기 데이터를 모두 삭제하고 데모로 돌아갈까요?')) return
    try { localStorage.removeItem(LS_KEY) } catch {}
    setReviews(DEMO); setIsReal(false)
  }

  if (!hydrated) return null

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <ComingSoonBanner />
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">만족도·리뷰</h1>
            <span className={`text-2xs font-bold px-2 py-0.5 rounded-full ${
              isReal ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40'
            }`}>{isReal ? '내 데이터' : '데모 데이터'}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">환자 후기를 한 곳에서 모니터링하고 답글로 응대합니다</p>
        </div>
        <div className="flex items-center gap-2">
          {isReal && <button onClick={resetToDemo} className="btn-secondary btn-sm">데모로 초기화</button>}
          <button onClick={() => setEditorOpen(true)} className="btn-primary btn-sm">
            <Edit2 className="w-4 h-4" /> 내 후기 입력
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2"><Star className="w-5 h-5 text-amber-500" /><span className="text-xs text-muted-foreground">평균 별점</span></div>
          <div className="text-2xl font-bold">{kpi.total > 0 ? `${kpi.avg.toFixed(1)} / 5` : '—'}</div>
          <div className="text-xs mt-1 text-muted-foreground">{kpi.total}건 기준</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2"><ThumbsUp className="w-5 h-5 text-emerald-500" /><span className="text-xs text-muted-foreground">긍정</span></div>
          <div className="text-2xl font-bold">{kpi.positive}건</div>
          <div className="text-xs mt-1 text-muted-foreground">
            {kpi.total > 0 ? `${((kpi.positive / kpi.total) * 100).toFixed(0)}%` : '—'}
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2"><ThumbsDown className="w-5 h-5 text-red-500" /><span className="text-xs text-muted-foreground">부정</span></div>
          <div className="text-2xl font-bold">{kpi.negative}건</div>
          <div className="text-xs mt-1 text-muted-foreground">
            {kpi.total > 0 ? `${((kpi.negative / kpi.total) * 100).toFixed(0)}%` : '—'}
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2"><Send className="w-5 h-5 text-blue-500" /><span className="text-xs text-muted-foreground">답글률</span></div>
          <div className="text-2xl font-bold">{kpi.responseRate.toFixed(0)}%</div>
          <div className="text-xs mt-1 text-muted-foreground">{kpi.replied}/{kpi.total} 답글</div>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex items-center gap-2 flex-wrap">
        {([
          { k: 'ALL',      label: `전체 (${kpi.total})` },
          { k: 'positive', label: `긍정 (${kpi.positive})` },
          { k: 'neutral',  label: `중립 (${kpi.neutral})` },
          { k: 'negative', label: `부정 (${kpi.negative})` },
        ] as const).map(f => (
          <button
            key={f.k}
            onClick={() => setFilter(f.k)}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
              filter === f.k ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:bg-secondary/70'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 리뷰 카드 */}
      {sorted.length === 0 ? (
        <div className="card p-12 text-center text-muted-foreground">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="mb-4">
            {reviews.length === 0
              ? '등록된 후기가 없습니다'
              : `해당 필터에 일치하는 후기가 없습니다`}
          </p>
          {reviews.length === 0 && (
            <button onClick={() => setEditorOpen(true)} className="btn-primary btn-sm">
              <Plus className="w-4 h-4" /> 첫 후기 추가
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(r => (
            <div key={r.id} className="card p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {r.patientName[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold">{r.patientName || '익명'}</span>
                    <span className="text-xs text-muted-foreground">{r.date}</span>
                    <span className={`text-2xs px-1.5 py-0.5 rounded ${sourceColor[r.source]}`}>
                      {sourceLabel[r.source]}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star
                        key={n}
                        className={`w-4 h-4 ${n <= safeNum(r.rating) ? 'text-amber-400 fill-amber-400' : 'text-zinc-300'}`}
                      />
                    ))}
                    <span className="ml-2 text-sm font-semibold">{safeNum(r.rating).toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <p className="text-sm leading-relaxed mb-3">{r.comment}</p>

              {r.replied && r.replyText ? (
                <div className="ml-4 pl-4 border-l-2 border-primary/30 py-2 bg-secondary/30 rounded-r-lg">
                  <div className="flex items-center gap-1 mb-1 text-2xs font-semibold text-primary">
                    <CheckCircle2 className="w-3 h-3" /> 의원 답글
                  </div>
                  <p className="text-sm text-muted-foreground">{r.replyText}</p>
                </div>
              ) : !r.replied ? (
                <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5" /> 답글 미작성
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {!isReal && (
        <div className="card p-3 bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>데모 데이터입니다. <b>"내 후기 입력"</b>으로 실 후기 모니터링으로 전환됩니다.</span>
          </div>
        </div>
      )}

      {editorOpen && (
        <ReviewsEditor
          initial={isReal ? reviews : []}
          onClose={() => setEditorOpen(false)}
          onSave={(n) => { saveAll(n); setEditorOpen(false) }}
        />
      )}
    </div>
  )
}

function ReviewsEditor({ initial, onClose, onSave }: { initial: Review[]; onClose: () => void; onSave: (n: Review[]) => void }) {
  const [rows, setRows] = useState<Review[]>(initial)
  const addRow = () => setRows([...rows, {
    id: `n${Date.now()}`, patientName: '', date: new Date().toISOString().slice(0, 10),
    source: 'naver', rating: 5, comment: '', replied: false, replyText: '',
  }])
  const updateRow = (idx: number, patch: Partial<Review>) => setRows(rows.map((r, i) => i === idx ? { ...r, ...patch } : r))
  const removeRow = (idx: number) => setRows(rows.filter((_, i) => i !== idx))
  const handleSave = () => onSave(rows.filter(r => r.comment.trim().length > 0))

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="font-bold text-lg">내 후기 입력</h2>
            <p className="text-xs text-muted-foreground mt-0.5">네이버·카카오·구글 등에 올라온 환자 후기를 모아주세요</p>
          </div>
          <button onClick={onClose} className="btn-icon"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold">후기 ({rows.length}건)</label>
            <button onClick={addRow} className="btn-secondary btn-sm">
              <Plus className="w-3.5 h-3.5" /> 후기 추가
            </button>
          </div>
          {rows.length === 0 ? (
            <div className="border border-dashed border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
              후기가 없습니다. "후기 추가"를 눌러 등록하세요.
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((r, idx) => (
                <div key={r.id} className="p-4 border border-border rounded-xl space-y-2">
                  <div className="grid grid-cols-12 gap-2">
                    <input className="input col-span-3 text-sm" placeholder="환자명(또는 익명)" value={r.patientName}
                      onChange={(e) => updateRow(idx, { patientName: e.target.value })} />
                    <input className="input col-span-3 text-sm" type="date" value={r.date}
                      onChange={(e) => updateRow(idx, { date: e.target.value })} />
                    <select className="input col-span-2 text-sm" value={r.source}
                      onChange={(e) => updateRow(idx, { source: e.target.value as Source })}>
                      <option value="naver">네이버</option>
                      <option value="kakao">카카오톡</option>
                      <option value="google">구글</option>
                      <option value="internal">자체 설문</option>
                    </select>
                    <select className="input col-span-2 text-sm" value={r.rating}
                      onChange={(e) => updateRow(idx, { rating: Number(e.target.value) })}>
                      <option value="5">★★★★★ (5)</option>
                      <option value="4">★★★★☆ (4)</option>
                      <option value="3">★★★☆☆ (3)</option>
                      <option value="2">★★☆☆☆ (2)</option>
                      <option value="1">★☆☆☆☆ (1)</option>
                    </select>
                    <label className="col-span-1 flex items-center justify-center gap-1 text-xs">
                      <input type="checkbox" checked={r.replied}
                        onChange={(e) => updateRow(idx, { replied: e.target.checked })} />
                      답글
                    </label>
                    <button onClick={() => removeRow(idx)} className="col-span-1 btn-icon text-red-500 mx-auto">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea className="input text-sm w-full" rows={2} placeholder="후기 내용" value={r.comment}
                    onChange={(e) => updateRow(idx, { comment: e.target.value })} />
                  {r.replied && (
                    <textarea className="input text-sm w-full" rows={2} placeholder="답글 (선택)" value={r.replyText || ''}
                      onChange={(e) => updateRow(idx, { replyText: e.target.value })} />
                  )}
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
