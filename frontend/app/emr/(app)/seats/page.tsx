'use client'

/**
 * 직원 ID 관리 + 월 청구 미리보기.
 *
 * - PC당이 아닌 ID당 과금: 첫 1ID 무료 → 2~4 39,000원 → 5+ 29,000원 → 10+ 19,000원
 * - 페이닥·이중원장·다인 진료실에 유리한 모델
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users, UserPlus, Crown, X, Loader2, Trash2, Power, PowerOff,
  CreditCard, TrendingDown, CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  staffSeatService, StaffSeat, StaffRole,
  ROLE_OPTIONS, roleIcon,
} from '@/lib/api/staffSeats'
import ModuleHeader from '@/components/emr/ModuleHeader'

export default function SeatsPage() {
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [previewAdd, setPreviewAdd] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['seats'],
    queryFn: staffSeatService.list,
  })

  const { data: preview } = useQuery({
    queryKey: ['seats-preview', previewAdd],
    queryFn: () => staffSeatService.preview(previewAdd),
    enabled: previewAdd > 0,
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => staffSeatService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['seats'] }),
    onError: (e: any) => toast.error(e.response?.data?.detail || '수정 실패'),
  })

  const deactivateMut = useMutation({
    mutationFn: (id: string) => staffSeatService.deactivate(id),
    onSuccess: () => {
      toast.success('직원 비활성화')
      qc.invalidateQueries({ queryKey: ['seats'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || '비활성화 실패'),
  })

  return (
    <div>
      <ModuleHeader
        moduleKey="seats"
        maxWidthClass="max-w-6xl"
        meta={
          data?.billing ? (
            <span>
              월 청구 <b className="text-emerald-700 tabular-nums">{data.billing.monthly_total.toLocaleString()}원</b>
              <span className="text-muted-foreground"> · ID {data.billing.billable_seats}</span>
            </span>
          ) : null
        }
        actions={
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            <UserPlus className="w-4 h-4" /> 직원 추가
          </button>
        }
      />
      <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* 청구 카드 */}
      {data?.billing && <BillingCard billing={data.billing} />}

      {/* 직원 리스트 */}
      <div className="card divide-y divide-border">
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
        ) : !data?.seats?.length ? (
          <div className="text-center py-10 text-sm text-slate-500">직원이 없습니다.</div>
        ) : (
          data.seats.map((s) => (
            <SeatRow
              key={s.id}
              s={s}
              onToggleBillable={(b) => updateMut.mutate({ id: s.id, data: { billable: b } })}
              onToggleStatus={(active) => updateMut.mutate({ id: s.id, data: { status: active ? 'ACTIVE' : 'INACTIVE' } })}
              onRemove={() => {
                if (confirm(`${s.name} 직원을 비활성화할까요?`)) deactivateMut.mutate(s.id)
              }}
            />
          ))
        )}
      </div>

      {/* 청구 시뮬레이터 */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-emerald-600" />
          <h2 className="font-semibold">시뮬레이터 — 직원을 N명 더 추가하면?</h2>
        </div>
        <input
          type="range"
          min={0}
          max={15}
          value={previewAdd}
          onChange={(e) => setPreviewAdd(Number(e.target.value))}
          className="w-full"
        />
        <div className="text-sm text-slate-600 text-center">
          현재 + <b className="text-blue-700">{previewAdd}명</b> 추가 시
        </div>
        {previewAdd > 0 && preview?.after_add && (
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-xs text-blue-700">월 예상 청구</div>
            <div className="text-2xl font-bold tabular-nums text-blue-900">
              {preview.after_add.monthly_total.toLocaleString()}<span className="text-sm">원</span>
            </div>
            <div className="text-[11px] text-blue-700 mt-0.5">
              현재 {preview.current.monthly_total.toLocaleString()}원 →
              {' '}<b>+{(preview.after_add.monthly_total - preview.current.monthly_total).toLocaleString()}원</b>
            </div>
          </div>
        )}
      </div>

      {showAdd && (
        <AddModal
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            qc.invalidateQueries({ queryKey: ['seats'] })
            setShowAdd(false)
          }}
        />
      )}
      </div>
    </div>
  )
}

function BillingCard({ billing }: { billing: ReturnType<typeof Object.create> }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold">월 예상 청구</h2>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold tabular-nums text-blue-700">
            {billing.monthly_total.toLocaleString()}<span className="text-sm">원</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            과금 ID {billing.chargeable_seats} · 무료 {billing.free_seats}
          </div>
        </div>
      </div>

      {billing.breakdown.length > 0 ? (
        <div className="space-y-1.5 text-sm">
          {billing.breakdown.map((b: any, i: number) => (
            <div key={i} className="flex items-center justify-between text-slate-700">
              <span>
                <span className="text-slate-500">{b.label}</span>{' '}
                <span className="text-xs text-slate-400">({b.count}명 × {b.unit_price.toLocaleString()}원)</span>
              </span>
              <span className="tabular-nums font-medium">{b.amount.toLocaleString()}원</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-emerald-700 bg-emerald-50 rounded p-3 inline-flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" /> 첫 1ID(원장)는 무료 — 추가 직원이 없어 청구 0원
        </div>
      )}

      {billing.next_tier_at && (
        <div className="text-xs text-slate-500 mt-3">
          💡 직원 <b>{billing.next_tier_at}명</b>부터는 추가 ID당 <b>{(billing.next_tier_price || 0).toLocaleString()}원</b>으로 할인
        </div>
      )}
    </div>
  )
}

function SeatRow({
  s, onToggleBillable, onToggleStatus, onRemove,
}: {
  s: StaffSeat
  onToggleBillable: (b: boolean) => void
  onToggleStatus: (active: boolean) => void
  onRemove: () => void
}) {
  const isOwner = s.role === 'OWNER'
  const isInactive = s.status === 'INACTIVE'
  return (
    <div className={`p-4 flex items-center gap-3 ${isInactive ? 'opacity-50' : ''}`}>
      <div className="text-2xl">{roleIcon(s.role)}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">{s.name}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">{s.role_label}</span>
          {isOwner && <Crown className="w-3.5 h-3.5 text-amber-500" />}
          {isInactive && <span className="text-[10px] text-slate-400">비활성</span>}
          {!s.billable && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">무료(과금제외)</span>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3 flex-wrap">
          {s.email && <span>{s.email}</span>}
          {s.phone && <span>· {s.phone}</span>}
          {s.license_no && <span>· 면허 {s.license_no}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {!isOwner && (
          <>
            <button
              onClick={() => onToggleBillable(!s.billable)}
              className={`text-[11px] px-2 py-1 rounded border ${
                s.billable
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
              title="과금 토글"
            >
              {s.billable ? '과금' : '무료'}
            </button>
            <button
              onClick={() => onToggleStatus(isInactive)}
              className="btn-ghost text-xs"
              title={isInactive ? '활성화' : '비활성화'}
            >
              {isInactive ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
            </button>
            <button onClick={onRemove} className="btn-ghost text-xs text-rose-600" title="삭제">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function AddModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [role, setRole] = useState<StaffRole>('NURSE')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [license, setLicense] = useState('')
  const [billable, setBillable] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!name.trim()) {
      toast.error('이름을 입력하세요.')
      return
    }
    setSubmitting(true)
    try {
      await staffSeatService.create({
        name: name.trim(),
        role, email: email || undefined, phone: phone || undefined,
        license_no: license || undefined, billable,
      })
      toast.success('직원 추가 완료')
      onCreated()
    } catch (e: any) {
      toast.error(e.response?.data?.detail || '추가 실패')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">직원 추가</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div>
          <label className="text-xs text-slate-600">이름</label>
          <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <div>
          <label className="text-xs text-slate-600">역할</label>
          <div className="grid grid-cols-4 gap-2 mt-1">
            {ROLE_OPTIONS.filter((r) => r.value !== 'OWNER').map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`p-2 rounded-lg border text-xs ${
                  role === r.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                <div>{r.icon}</div>
                <div className="mt-0.5">{r.label}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-600">이메일 (선택)</label>
            <input className="input mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-slate-600">전화 (선택)</label>
            <input className="input mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-600">면허번호 (선택)</label>
          <input className="input mt-1" value={license} onChange={(e) => setLicense(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={billable} onChange={(e) => setBillable(e.target.checked)} />
          <span>과금 ID로 등록 (체크 해제 시 무료)</span>
        </label>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="btn-ghost flex-1">취소</button>
          <button onClick={submit} disabled={submitting} className="btn-primary flex-1 disabled:opacity-50">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            추가
          </button>
        </div>
      </div>
    </div>
  )
}
