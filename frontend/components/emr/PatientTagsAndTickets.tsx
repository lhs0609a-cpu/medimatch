'use client'

/**
 * 환자 운영 태그(VIP/연예인/외국인/주의 등) + 시술 회차권(티켓) 관리 컴포넌트.
 * 환자 상세 페이지에 드롭인.
 */
import { useEffect, useState } from 'react'
import {
  Tag as TagIcon, Plus, X, Loader2, Ticket as TicketIcon, MinusCircle, CalendarPlus,
  AlertCircle, CheckCircle2, ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api/client'

interface TagDef {
  id: number
  name: string
  color: string
  icon?: string
  description?: string
  is_system: boolean
}

interface Ticket {
  id: string
  ticket_no: string
  package_id: string
  purchased_at: string
  purchased_price: number
  expires_at: string | null
  total_sessions: number
  used_sessions: number
  remaining_sessions: number
  status: string
  note: string | null
  extension_history: any[]
  is_expired: boolean
  package?: {
    id: string
    name: string
    category: string
    short_code: string | null
  }
}

interface PackageData {
  id: string
  name: string
  short_code: string | null
  category: string
  total_sessions: number
  price: number
}

const TAG_COLORS: Record<string, string> = {
  slate: 'bg-slate-100 text-slate-700',
  rose: 'bg-rose-100 text-rose-700',
  purple: 'bg-purple-100 text-purple-700',
  blue: 'bg-blue-100 text-blue-700',
  amber: 'bg-amber-100 text-amber-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  pink: 'bg-pink-100 text-pink-700',
  red: 'bg-red-100 text-red-700',
  teal: 'bg-teal-100 text-teal-700',
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  USED_UP: 'bg-slate-100 text-slate-700',
  EXPIRED: 'bg-amber-100 text-amber-700',
  CANCELED: 'bg-rose-100 text-rose-700',
  REFUNDED: 'bg-rose-100 text-rose-700',
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: '사용중', USED_UP: '소진', EXPIRED: '만료', CANCELED: '취소', REFUNDED: '환불',
}

const formatKRW = (n: number) => `₩${n.toLocaleString('ko-KR')}`


export function PatientTags({ patientId, initialTags = [] }: { patientId: string; initialTags?: string[] }) {
  const [tags, setTags] = useState<string[]>(initialTags)
  const [defs, setDefs] = useState<TagDef[]>([])
  const [picking, setPicking] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiClient.get<TagDef[]>('/emr/patient-tags').then((r) => setDefs(r.data)).catch(() => {})
  }, [])

  const colorOf = (name: string) => {
    const d = defs.find((x) => x.name === name)
    return TAG_COLORS[d?.color || 'slate'] || TAG_COLORS.slate
  }

  const toggle = async (name: string) => {
    const next = tags.includes(name) ? tags.filter((t) => t !== name) : [...tags, name]
    setSaving(true)
    try {
      await apiClient.put(`/emr/patients/${patientId}/tags`, { tags: next })
      setTags(next)
    } catch (e: any) {
      toast.error('태그 저장 실패: ' + (e.response?.data?.detail || e.message))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((t) => (
        <span key={t} className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${colorOf(t)}`}>
          {t}
          <button onClick={() => toggle(t)} disabled={saving}>
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <div className="relative">
        <button
          onClick={() => setPicking(!picking)}
          className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground hover:bg-muted/70 inline-flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> 태그
        </button>
        {picking && (
          <div className="absolute z-10 mt-1 left-0 bg-card border border-border rounded-lg shadow-lg p-2 w-48 max-h-64 overflow-y-auto">
            {defs.length === 0 ? (
              <p className="text-xs text-muted-foreground p-2">태그가 없습니다</p>
            ) : (
              defs.filter((d) => !tags.includes(d.name)).map((d) => (
                <button
                  key={d.id}
                  onClick={() => { toggle(d.name); setPicking(false) }}
                  className="w-full text-left px-2 py-1 hover:bg-muted rounded text-sm"
                >
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full mr-2 ${TAG_COLORS[d.color] || TAG_COLORS.slate}`}>
                    {d.name}
                  </span>
                  {d.description && (
                    <span className="text-xs text-muted-foreground">{d.description}</span>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}


export function PatientTickets({ patientId }: { patientId: string }) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [packages, setPackages] = useState<PackageData[]>([])
  const [loading, setLoading] = useState(true)
  const [issuing, setIssuing] = useState(false)
  const [selectedPkg, setSelectedPkg] = useState('')

  const refresh = async () => {
    setLoading(true)
    try {
      const [r1, r2] = await Promise.all([
        apiClient.get<Ticket[]>('/emr/tickets', { params: { patient_id: patientId } }),
        apiClient.get<PackageData[]>('/emr/packages'),
      ])
      setTickets(r1.data)
      setPackages(r2.data)
    } catch (e) {
      // 무시
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { refresh() }, [patientId])

  const issue = async () => {
    if (!selectedPkg) {
      toast.error('패키지를 선택하세요')
      return
    }
    try {
      await apiClient.post('/emr/tickets', { patient_id: patientId, package_id: selectedPkg })
      toast.success('회차권 발급 완료')
      setIssuing(false)
      setSelectedPkg('')
      refresh()
    } catch (e: any) {
      toast.error('발급 실패: ' + (e.response?.data?.detail || e.message))
    }
  }

  const useOne = async (t: Ticket) => {
    if (!confirm(`${t.package?.name}\n1회 차감 (남은 ${t.remaining_sessions}회 → ${t.remaining_sessions - 1}회)?`)) return
    try {
      await apiClient.post(`/emr/tickets/${t.id}/use`, { sessions_used: 1 })
      toast.success('차감 완료')
      refresh()
    } catch (e: any) {
      toast.error('차감 실패: ' + (e.response?.data?.detail || e.message))
    }
  }

  const extend = async (t: Ticket) => {
    const dStr = prompt('연장 일수 (기본 30)', '30')
    const days = Number(dStr)
    if (!days || days <= 0) return
    const reason = prompt('연장 사유 (선택)', '환자 요청')
    try {
      await apiClient.post(`/emr/tickets/${t.id}/extend`, { days_added: days, reason })
      toast.success(`${days}일 연장 완료`)
      refresh()
    } catch (e: any) {
      toast.error('연장 실패: ' + (e.response?.data?.detail || e.message))
    }
  }

  const active = tickets.filter((t) => t.status === 'ACTIVE')
  const others = tickets.filter((t) => t.status !== 'ACTIVE')

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <TicketIcon className="w-4 h-4" /> 시술 회차권
          <span className="text-xs text-muted-foreground font-normal">
            ({active.length}개 사용중)
          </span>
        </h3>
        <button onClick={() => setIssuing(true)} className="btn-secondary text-xs">
          <Plus className="w-3 h-3" /> 회차권 발급
        </button>
      </div>

      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin mx-auto my-4" />
      ) : tickets.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">발급된 회차권이 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {[...active, ...others].map((t) => (
            <div key={t.id} className="border border-border rounded-lg p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[t.status]}`}>
                      {STATUS_LABEL[t.status] || t.status}
                    </span>
                    {t.is_expired && t.status === 'ACTIVE' && (
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700">
                        만료됨
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground font-mono">{t.ticket_no}</span>
                  </div>
                  <p className="font-medium">{t.package?.name || '(패키지 없음)'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">잔여</p>
                  <p className="text-lg font-bold">
                    <span className="text-rose-600">{t.remaining_sessions}</span>
                    <span className="text-muted-foreground text-sm"> / {t.total_sessions}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  구매 {t.purchased_at.slice(0, 10)} · {formatKRW(t.purchased_price)}
                </span>
                <span>만료 {t.expires_at || '—'}</span>
              </div>
              {t.status === 'ACTIVE' && (
                <div className="flex gap-2 mt-2 pt-2 border-t border-border">
                  <button onClick={() => useOne(t)} disabled={t.remaining_sessions <= 0}
                    className="text-xs flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50">
                    <MinusCircle className="w-3 h-3" /> 1회 사용
                  </button>
                  <button onClick={() => extend(t)}
                    className="text-xs flex items-center gap-1 px-2 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100">
                    <CalendarPlus className="w-3 h-3" /> 기간 연장
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {issuing && (
        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
          <p className="text-xs font-medium mb-2">패키지 선택</p>
          {packages.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              정의된 패키지가 없습니다.{' '}
              <a href="/emr/packages" className="text-blue-600 underline">패키지 만들기</a>
            </p>
          ) : (
            <>
              <select className="input w-full text-sm mb-2" value={selectedPkg}
                onChange={(e) => setSelectedPkg(e.target.value)}>
                <option value="">— 패키지 선택 —</option>
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.short_code ? `[${p.short_code}] ` : ''}{p.name} · {p.total_sessions}회 · {formatKRW(p.price)}
                  </option>
                ))}
              </select>
              <div className="flex justify-end gap-2">
                <button onClick={() => setIssuing(false)} className="btn-secondary text-xs">취소</button>
                <button onClick={issue} className="btn-primary text-xs">
                  <CheckCircle2 className="w-3 h-3" /> 발급
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
