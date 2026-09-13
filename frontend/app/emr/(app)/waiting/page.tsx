'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Monitor, RefreshCw, Clock, X } from 'lucide-react'
import { toast } from 'sonner'
import { appointmentService, Appointment } from '@/lib/api/emr'
import { chartHref, dayRange, errorMessage, localDate } from '@/lib/emr/workflow'
import ModuleHeader from '@/components/emr/ModuleHeader'
import QueryState from '@/components/emr/QueryState'

const columns = [
  { status: 'SCHEDULED', label: '예약', color: 'bg-slate-100 text-slate-700' },
  { status: 'ARRIVED', label: '진료 대기', color: 'bg-amber-50 text-amber-700' },
  { status: 'IN_PROGRESS', label: '진료 중', color: 'bg-blue-50 text-blue-700' },
  { status: 'COMPLETED', label: '진료 완료', color: 'bg-emerald-50 text-emerald-700' },
]
export default function WaitingPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [date, setDate] = useState(localDate)
  const [search, setSearch] = useState('')
  const [display, setDisplay] = useState(false)
  const query = useQuery({ queryKey: ['appointments', date], queryFn: () => appointmentService.list(dayRange(date)), refetchInterval: 15000 })
  const mutation = useMutation({
    mutationFn: ({ appointment, status }: { appointment: Appointment; status: string }) => status === 'ARRIVED' ? appointmentService.checkIn(appointment.id) : appointmentService.update(appointment.id, { status }),
    onSuccess: (appointment) => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      qc.invalidateQueries({ queryKey: ['appointment-stats'] })
      toast.success('진료 상태가 저장되었습니다.')
      if (appointment.status === 'IN_PROGRESS') router.push(chartHref(appointment))
    },
    onError: (error) => toast.error(errorMessage(error)),
  })
  const rows = (query.data || []).filter(a => display || (a.patient_name + ' ' + (a.patient_phone || '')).includes(search))
  return <div className={display ? 'fixed inset-0 z-[80] overflow-auto bg-background p-6 sm:p-10' : ''}>
    <ModuleHeader moduleKey="waiting" title={display ? '진료 안내' : '오늘의 진료 흐름'} subtitle="예약부터 진료 완료까지 · 15초마다 자동 업데이트" actions={<div className="flex gap-2"><button className="btn-secondary" onClick={() => query.refetch()} aria-label="대기열 새로고침"><RefreshCw className="h-4 w-4" /></button><button className="btn-secondary" onClick={() => setDisplay(!display)}>{display ? <X className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}{display ? '화면 닫기' : '대기실 화면'}</button></div>} />
    <div className="mx-auto max-w-7xl space-y-6 py-6">
      {!display && <div className="flex flex-wrap items-center gap-3"><input aria-label="진료 날짜" type="date" value={date} onChange={e => setDate(e.target.value)} className="input w-auto" /><input aria-label="대기 환자 검색" value={search} onChange={e => setSearch(e.target.value)} placeholder="환자 이름 또는 연락처 검색" className="input min-w-[180px] flex-1" /><Link href="/emr/appointments" className="btn-primary">예약·접수 관리</Link></div>}
      <QueryState loading={query.isLoading} error={query.isError} retry={() => query.refetch()} />
      {query.isSuccess && <div className={'grid gap-4 ' + (display ? 'md:grid-cols-2' : 'md:grid-cols-2 xl:grid-cols-4')}>
        {(display ? columns.slice(1, 3) : columns).map(column => {
          const patients = rows.filter(a => a.status === column.status || (column.status === 'SCHEDULED' && a.status === 'CONFIRMED'))
          return <section key={column.status} className="rounded-2xl border border-border bg-secondary/30 p-3">
            <h2 className="flex items-center justify-between px-2 py-3 text-sm font-bold">{column.label}<span className={'rounded-lg px-2 py-1 text-xs ' + column.color}>{patients.length}</span></h2>
            <div className="space-y-3">{patients.map(a => <article key={a.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground"><span className="flex items-center gap-1"><Clock className="h-3 w-3" />{a.start_time.slice(11, 16)}</span><span>{a.appointment_type === 'INITIAL' ? '초진' : '재진'}</span></div>
              <h3 className={display ? 'text-3xl font-bold' : 'font-bold'}>{display ? a.patient_name.slice(0, 1) + '*'.repeat(Math.max(a.patient_name.length - 1, 1)) : a.patient_name}</h3>
              {!display && <p className="mt-1 truncate text-xs text-muted-foreground">{a.chief_complaint || '예약 사유 미입력'}</p>}
              {a.doctor_name && <p className="mt-3 text-xs text-muted-foreground">담당 {a.doctor_name}</p>}
              {!display && <div className="mt-4 flex flex-wrap gap-2">
                {['SCHEDULED', 'CONFIRMED'].includes(a.status) && <button disabled={mutation.isPending} className="btn-secondary w-full text-xs" onClick={() => mutation.mutate({ appointment: a, status: 'ARRIVED' })}>도착 확인</button>}
                {a.status === 'ARRIVED' && <button disabled={mutation.isPending} className="btn-primary w-full text-xs" onClick={() => mutation.mutate({ appointment: a, status: 'IN_PROGRESS' })}>진료 시작</button>}
                {a.status === 'IN_PROGRESS' && <><Link href={chartHref(a)} className="btn-secondary text-xs">차트 작성</Link><button disabled={mutation.isPending} className="btn-primary text-xs" onClick={() => mutation.mutate({ appointment: a, status: 'COMPLETED' })}>진료 완료</button></>}
                {a.status === 'COMPLETED' && <Link href="/emr/billing" className="btn-secondary w-full text-xs">수납 확인</Link>}
              </div>}
            </article>)}{patients.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">해당 환자가 없습니다.</p>}</div>
          </section>
        })}
      </div>}
      {!display && <p className="text-xs text-muted-foreground">진료 완료와 수납 완료는 별도로 관리됩니다. 수납 화면에서 결제 상태를 확인하세요.</p>}
    </div>
  </div>
}
