'use client'

/**
 * 시술 회차권(패키지) 관리 — 미용/피부/성형 의원의 매출 핵심.
 * 패키지 정의(10회권 슈링크 등) CRUD + 발급된 티켓 현황 요약.
 */

import { useEffect, useState } from 'react'
import {
  Package, Plus, Edit3, Trash2, X, Loader2, CheckCircle2,
  Calendar, DollarSign, Layers, ChevronDown, Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api/client'
import ModuleHeader from '@/components/emr/ModuleHeader'

interface PackageData {
  id: string
  name: string
  short_code: string | null
  category: string
  total_sessions: number
  price: number
  taxable: boolean
  default_validity_days: number
  description: string | null
  procedure_codes: string[]
  is_active: boolean
  created_at: string
}

const CATEGORIES: { value: string; label: string; color: string }[] = [
  { value: 'LIFTING', label: '리프팅', color: 'bg-purple-100 text-purple-700' },
  { value: 'SKIN', label: '피부관리', color: 'bg-blue-100 text-blue-700' },
  { value: 'LASER', label: '레이저', color: 'bg-rose-100 text-rose-700' },
  { value: 'BOTOX', label: '보톡스', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'FILLER', label: '필러', color: 'bg-pink-100 text-pink-700' },
  { value: 'HAIR_REMOVAL', label: '제모', color: 'bg-amber-100 text-amber-700' },
  { value: 'SCAR', label: '흉터/모공', color: 'bg-orange-100 text-orange-700' },
  { value: 'SURGERY', label: '성형', color: 'bg-red-100 text-red-700' },
  { value: 'PHYSIO', label: '도수치료', color: 'bg-teal-100 text-teal-700' },
  { value: 'OTHER', label: '기타', color: 'bg-slate-100 text-slate-700' },
]

const catLabel = (v: string) => CATEGORIES.find((c) => c.value === v)?.label || v
const catColor = (v: string) => CATEGORIES.find((c) => c.value === v)?.color || 'bg-slate-100 text-slate-700'
const formatKRW = (n: number) => `₩${n.toLocaleString('ko-KR')}`


export default function PackagesPage() {
  const [packages, setPackages] = useState<PackageData[]>([])
  const [loading, setLoading] = useState(true)
  const [includeInactive, setIncludeInactive] = useState(false)
  const [editing, setEditing] = useState<PackageData | null>(null)
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')

  const refresh = async () => {
    setLoading(true)
    try {
      const r = await apiClient.get<PackageData[]>('/emr/packages', {
        params: { include_inactive: includeInactive },
      })
      setPackages(r.data)
    } catch (e: any) {
      // 권한/네트워크 — 빈 배열 유지
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { refresh() }, [includeInactive])

  const filtered = packages.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.short_code || '').toLowerCase().includes(search.toLowerCase()),
  )

  const totalActive = packages.filter((p) => p.is_active).length

  return (
    <div>
      <ModuleHeader
        moduleKey="prescriptions"
        title="시술 회차권 (패키지) 관리"
        subtitle="10회권 슈링크, 20회권 포텐자 같은 패키지를 정의하고 환자에게 발급"
        actions={
          <button onClick={() => setCreating(true)} className="btn-primary text-sm">
            <Plus className="w-4 h-4" /> 새 패키지
          </button>
        }
      />

      <div className="max-w-6xl mx-auto p-6 space-y-4">
        {/* 통계 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card p-4">
            <p className="text-xs text-muted-foreground">활성 패키지</p>
            <p className="text-xl font-semibold">{totalActive}개</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-muted-foreground">전체 패키지</p>
            <p className="text-xl font-semibold">{packages.length}개</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-muted-foreground">카테고리</p>
            <p className="text-xl font-semibold">
              {new Set(packages.map((p) => p.category)).size}개
            </p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-muted-foreground">평균가</p>
            <p className="text-xl font-semibold">
              {packages.length
                ? formatKRW(Math.round(packages.reduce((s, p) => s + p.price, 0) / packages.length))
                : '—'}
            </p>
          </div>
        </div>

        {/* 검색·필터 */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              className="input pl-9 w-full"
              placeholder="패키지명·코드로 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} />
            비활성 포함
          </label>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <Package className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
            <p className="font-medium mb-1">아직 정의된 패키지가 없습니다</p>
            <p className="text-sm text-muted-foreground mb-4">
              미용·시술 의원의 매출은 회차권에서 나옵니다. 첫 패키지를 만들어보세요.
            </p>
            <button onClick={() => setCreating(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> 첫 패키지 만들기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((p) => (
              <PackageCard key={p.id} p={p} onEdit={() => setEditing(p)} onRefresh={refresh} />
            ))}
          </div>
        )}
      </div>

      {(creating || editing) && (
        <PackageDialog
          pkg={editing}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSaved={() => { setCreating(false); setEditing(null); refresh() }}
        />
      )}
    </div>
  )
}


function PackageCard({ p, onEdit, onRefresh }: { p: PackageData; onEdit: () => void; onRefresh: () => void }) {
  const del = async () => {
    if (!confirm(`"${p.name}" 패키지를 삭제하시겠습니까?\n발급된 티켓은 유지됩니다.`)) return
    try {
      await apiClient.delete(`/emr/packages/${p.id}`)
      toast.success('삭제 완료')
      onRefresh()
    } catch (e: any) {
      toast.error('삭제 실패: ' + (e.response?.data?.detail || e.message))
    }
  }
  return (
    <div className={`card p-4 ${!p.is_active ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`text-xs px-2 py-0.5 rounded ${catColor(p.category)}`}>{catLabel(p.category)}</span>
        <div className="flex gap-1">
          <button onClick={onEdit} className="text-muted-foreground hover:text-foreground" title="편집">
            <Edit3 className="w-4 h-4" />
          </button>
          <button onClick={del} className="text-muted-foreground hover:text-rose-600" title="삭제">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <p className="font-semibold mb-1">{p.name}</p>
      {p.short_code && <p className="text-xs text-muted-foreground font-mono">{p.short_code}</p>}
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">총 회차</p>
          <p className="font-semibold">{p.total_sessions}회</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">판매가</p>
          <p className="font-semibold text-rose-600">{formatKRW(p.price)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">유효기간</p>
          <p className="text-sm">{p.default_validity_days}일</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{p.taxable ? '과세' : '면세'}</p>
          <p className="text-sm">{p.is_active ? '활성' : '비활성'}</p>
        </div>
      </div>
      {p.description && (
        <p className="text-xs text-muted-foreground mt-3 border-t pt-2 line-clamp-2">{p.description}</p>
      )}
    </div>
  )
}


function PackageDialog({ pkg, onClose, onSaved }: { pkg: PackageData | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: pkg?.name || '',
    short_code: pkg?.short_code || '',
    category: pkg?.category || 'OTHER',
    total_sessions: pkg?.total_sessions || 10,
    price: pkg?.price || 0,
    taxable: pkg?.taxable ?? false,
    default_validity_days: pkg?.default_validity_days || 365,
    description: pkg?.description || '',
    procedure_codes: (pkg?.procedure_codes || []).join(', '),
  })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!form.name.trim()) {
      toast.error('패키지명을 입력하세요')
      return
    }
    setSaving(true)
    try {
      const body = {
        name: form.name.trim(),
        short_code: form.short_code.trim() || null,
        category: form.category,
        total_sessions: Number(form.total_sessions) || 1,
        price: Number(form.price) || 0,
        taxable: form.taxable,
        default_validity_days: Number(form.default_validity_days) || 365,
        description: form.description.trim() || null,
        procedure_codes: form.procedure_codes.split(',').map((s) => s.trim()).filter(Boolean),
      }
      if (pkg) {
        await apiClient.patch(`/emr/packages/${pkg.id}`, body)
        toast.success('저장 완료')
      } else {
        await apiClient.post('/emr/packages', body)
        toast.success('패키지 생성 완료')
      }
      onSaved()
    } catch (e: any) {
      toast.error('저장 실패: ' + (e.response?.data?.detail || e.message))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{pkg ? '패키지 편집' : '새 패키지'}</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">패키지명 *</label>
            <input className="input w-full" placeholder="예: 10회권 슈링크 600샷"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">단축 코드</label>
              <input className="input w-full" placeholder="예: SHR-10" value={form.short_code}
                onChange={(e) => setForm({ ...form, short_code: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">카테고리</label>
              <select className="input w-full" value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">총 회차 *</label>
              <input type="number" className="input w-full" value={form.total_sessions}
                onChange={(e) => setForm({ ...form, total_sessions: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">판매가 (원)</label>
              <input type="number" className="input w-full" value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">기본 유효기간 (일)</label>
              <input type="number" className="input w-full" value={form.default_validity_days}
                onChange={(e) => setForm({ ...form, default_validity_days: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">과세 여부</label>
              <label className="flex items-center gap-2 mt-2">
                <input type="checkbox" checked={form.taxable}
                  onChange={(e) => setForm({ ...form, taxable: e.target.checked })} />
                <span className="text-sm">과세 (부가세 포함)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">설명 (선택)</label>
            <textarea className="input w-full" rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              연동 시술 코드 (선택, 쉼표 구분)
            </label>
            <input className="input w-full" placeholder="예: SHR-600, SHR-DEEP"
              value={form.procedure_codes}
              onChange={(e) => setForm({ ...form, procedure_codes: e.target.value })} />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="btn-secondary">취소</button>
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            저장
          </button>
        </div>
      </div>
    </div>
  )
}
