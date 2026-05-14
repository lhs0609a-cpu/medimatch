'use client'

/**
 * 외부 예약 채널 통합 인박스
 *
 * 똑닥·굿닥·네이버에서 들어온 예약을 한 화면에서 확인 → 1클릭 확정/거절.
 * 시간 충돌은 백엔드가 자동 감지해 status=CONFLICT로 표시.
 */
import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Inbox, RefreshCw, AlertTriangle, Check, X, Clock, Phone,
  Filter, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  extApptService, ExternalAppointment, ExtChannel, ExtStatus,
  channelLabel, channelBadgeClass,
} from '@/lib/api/externalAppointments'
import ModuleHeader from '@/components/emr/ModuleHeader'

export default function InboxPage() {
  const qc = useQueryClient()
  const [channelFilter, setChannelFilter] = useState<ExtChannel | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<ExtStatus | 'ACTIVE'>('ACTIVE')

  const { data: stats } = useQuery({
    queryKey: ['ext-stats'],
    queryFn: extApptService.stats,
    refetchInterval: 15000,
  })

  const { data: items, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['ext-appts', channelFilter, statusFilter],
    queryFn: () => extApptService.list({
      channel: channelFilter === 'ALL' ? undefined : channelFilter,
      status: statusFilter === 'ACTIVE' ? undefined : statusFilter,
      page_size: 100,
    }),
    refetchInterval: 30000,
  })

  // 'ACTIVE'는 PENDING + CONFLICT만
  const filtered = useMemo(() => {
    if (!items) return []
    if (statusFilter === 'ACTIVE') {
      return items.filter((i) => i.status === 'PENDING' || i.status === 'CONFLICT')
    }
    return items
  }, [items, statusFilter])

  const confirmMut = useMutation({
    mutationFn: (id: string) => extApptService.confirm(id),
    onSuccess: () => {
      toast.success('예약 확정 — 캘린더에 반영됐어요')
      qc.invalidateQueries({ queryKey: ['ext-appts'] })
      qc.invalidateQueries({ queryKey: ['ext-stats'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || '확정 실패'),
  })
  const rejectMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => extApptService.reject(id, reason),
    onSuccess: () => {
      toast.success('거절 처리했어요')
      qc.invalidateQueries({ queryKey: ['ext-appts'] })
      qc.invalidateQueries({ queryKey: ['ext-stats'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || '거절 실패'),
  })

  return (
    <div>
      <ModuleHeader
        moduleKey="inbox"
        maxWidthClass="max-w-6xl"
        meta={
          stats && stats.total_pending > 0 ? (
            <span className="font-medium text-violet-700">대기 {stats.total_pending}건</span>
          ) : null
        }
        actions={
          <button onClick={() => refetch()} className="btn-ghost text-sm" disabled={isFetching}>
            {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            새로고침
          </button>
        }
      />
      <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* 채널별 카드 */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="대기 중"
            value={stats.total_pending}
            highlight={stats.total_pending > 0}
          />
          {(['DDOCDOC', 'GOODOC', 'NAVER'] as ExtChannel[]).map((ch) => {
            const counts = stats.by_channel[ch] || {}
            const sum = (counts.PENDING || 0) + (counts.CONFLICT || 0)
            return (
              <StatCard
                key={ch}
                label={channelLabel[ch]}
                value={sum}
                detail={counts.CONFLICT ? `충돌 ${counts.CONFLICT}` : undefined}
              />
            )
          })}
        </div>
      )}

      {/* 필터 */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500">채널</span>
          <FilterChip active={channelFilter === 'ALL'} onClick={() => setChannelFilter('ALL')}>전체</FilterChip>
          {(['DDOCDOC', 'GOODOC', 'NAVER', 'KAKAO'] as ExtChannel[]).map((ch) => (
            <FilterChip
              key={ch}
              active={channelFilter === ch}
              onClick={() => setChannelFilter(ch)}
            >
              {channelLabel[ch]}
            </FilterChip>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 ml-5">상태</span>
          <FilterChip active={statusFilter === 'ACTIVE'} onClick={() => setStatusFilter('ACTIVE')}>처리 대기</FilterChip>
          <FilterChip active={statusFilter === 'CONFLICT'} onClick={() => setStatusFilter('CONFLICT')}>충돌</FilterChip>
          <FilterChip active={statusFilter === 'CONFIRMED'} onClick={() => setStatusFilter('CONFIRMED')}>확정됨</FilterChip>
          <FilterChip active={statusFilter === 'REJECTED'} onClick={() => setStatusFilter('REJECTED')}>거절됨</FilterChip>
        </div>
      </div>

      {/* 리스트 */}
      <div className="card">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-sm text-slate-500">
            처리할 예약이 없어요. 외부 채널에서 새 예약이 들어오면 여기에 자동으로 보여드릴게요.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((it) => (
              <Row
                key={it.id}
                item={it}
                onConfirm={() => confirmMut.mutate(it.id)}
                onReject={() => {
                  const r = prompt('거절 사유를 입력하세요 (선택)') || undefined
                  rejectMut.mutate({ id: it.id, reason: r })
                }}
                disabled={confirmMut.isPending || rejectMut.isPending}
              />
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  )
}

function StatCard({
  label, value, detail, highlight,
}: { label: string; value: number; detail?: string; highlight?: boolean }) {
  return (
    <div className={`card p-4 ${highlight ? 'ring-2 ring-purple-300' : ''}`}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-3xl font-bold tabular-nums mt-1">{value}</div>
      {detail && <div className="text-xs text-rose-600 font-medium mt-0.5">{detail}</div>}
    </div>
  )
}

function FilterChip({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
        active
          ? 'bg-slate-900 text-white'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      }`}
    >
      {children}
    </button>
  )
}

function Row({
  item, onConfirm, onReject, disabled,
}: {
  item: ExternalAppointment
  onConfirm: () => void
  onReject: () => void
  disabled?: boolean
}) {
  const start = new Date(item.requested_start)
  const dateStr = start.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })
  const timeStr = start.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  const isActive = item.status === 'PENDING' || item.status === 'CONFLICT'
  const decided = item.status === 'CONFIRMED' || item.status === 'REJECTED'

  return (
    <div className={`p-4 flex items-start gap-4 ${item.status === 'CONFLICT' ? 'bg-rose-50/40' : ''}`}>
      <div className="text-center min-w-[64px]">
        <div className="text-[10px] text-slate-500 uppercase">{dateStr}</div>
        <div className="text-base font-bold tabular-nums">{timeStr}</div>
        <div className="text-[10px] text-slate-500 mt-0.5">{item.duration_min}분</div>
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold">{item.patient_name}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${channelBadgeClass[item.channel]}`}>
            {channelLabel[item.channel]}
          </span>
          {item.status === 'CONFLICT' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-600 text-white font-medium inline-flex items-center gap-0.5">
              <AlertTriangle className="w-2.5 h-2.5" /> 충돌
            </span>
          )}
          {item.status === 'CONFIRMED' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium">확정</span>
          )}
          {item.status === 'REJECTED' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-medium">거절</span>
          )}
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
          {item.patient_phone && <span><Phone className="w-3 h-3 inline" /> {item.patient_phone}</span>}
          {item.doctor_name && <span>· {item.doctor_name} 원장</span>}
          {item.received_at && (
            <span className="text-slate-400">
              · {new Date(item.received_at).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} 수신
            </span>
          )}
        </div>
        {item.chief_complaint && (
          <div className="text-xs text-slate-700 bg-slate-50 rounded p-1.5 px-2 mt-1">
            증상: {item.chief_complaint}
          </div>
        )}
        {item.status === 'CONFLICT' && (
          <div className="text-[11px] text-rose-700 mt-1">
            ⚠ 같은 시간대에 이미 예약이 있습니다. 확정 시 둘 다 유지되며, 별도로 시간 조정이 필요합니다.
          </div>
        )}
        {item.rejection_reason && (
          <div className="text-[11px] text-slate-500 mt-1">거절 사유: {item.rejection_reason}</div>
        )}
      </div>

      {isActive && (
        <div className="flex flex-col gap-1.5 shrink-0">
          <button
            onClick={onConfirm}
            disabled={disabled}
            className="btn-primary text-xs px-3 py-1.5 disabled:opacity-50"
          >
            <Check className="w-3 h-3" /> 확정
          </button>
          <button
            onClick={onReject}
            disabled={disabled}
            className="btn-ghost text-xs text-rose-600 disabled:opacity-50"
          >
            <X className="w-3 h-3" /> 거절
          </button>
        </div>
      )}
      {decided && (
        <div className="text-[10px] text-slate-400 self-center shrink-0">
          {item.decided_at && new Date(item.decided_at).toLocaleDateString('ko-KR')}
        </div>
      )}
    </div>
  )
}
