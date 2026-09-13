'use client'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight, CalendarDays, Users, FileText, CreditCard, ArrowRight } from 'lucide-react'
import { appointmentService, visitService } from '@/lib/api/emr'
import { dayRange, localDate } from '@/lib/emr/workflow'
import QueryState from '@/components/emr/QueryState'

const actions = [
  { href: '/emr/appointments', title: '예약·접수', desc: '환자의 하루를 시작하세요', icon: CalendarDays },
  { href: '/emr/patients', title: '환자 관리', desc: '환자 정보와 진료 이력', icon: Users },
  { href: '/emr/chart/new', title: '차트 작성', desc: '진료 기록부터 처방까지', icon: FileText },
  { href: '/emr/billing', title: '수납 관리', desc: '결제와 미수금 확인', icon: CreditCard },
]
export default function DashboardPage() {
  const today = localDate()
  const appointments = useQuery({ queryKey: ['appointments', today], queryFn: () => appointmentService.list(dayRange(today)), refetchInterval: 30000 })
  const visits = useQuery({ queryKey: ['visit-stats'], queryFn: () => visitService.stats() })
  const rows = appointments.data || []
  const activeRows = rows.filter(a => !['CANCELLED', 'NO_SHOW'].includes(a.status))
  const stats = [
    { label: '오늘 예약', value: activeRows.length, href: '/emr/appointments' },
    { label: '진료 대기', value: rows.filter(a => a.status === 'ARRIVED').length, href: '/emr/waiting' },
    { label: '진료 중', value: rows.filter(a => a.status === 'IN_PROGRESS').length, href: '/emr/waiting' },
    { label: '오늘 진료 기록', value: visits.data?.today_visits, href: '/emr/chart' },
  ]
  return <div className="mx-auto max-w-7xl space-y-8 py-3">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-xs font-semibold tracking-widest text-blue-600">YOUR CLINIC, CONNECTED</p><h1 className="text-3xl font-bold tracking-tight">진료에 집중하는 하루.</h1><p className="mt-2 text-sm text-muted-foreground">{new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })} · 오늘의 운영 현황을 확인하세요.</p></div><Link href="/emr/waiting" className="btn-primary">진료 워크스페이스 <ArrowRight className="h-4 w-4" /></Link></div>
    <QueryState error={appointments.isError || visits.isError} loading={appointments.isLoading || visits.isLoading} retry={() => { appointments.refetch(); visits.refetch() }} />
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{stats.map((stat, i) => <Link key={stat.label} href={stat.href} className="rounded-2xl border border-border bg-card p-5 transition hover:border-blue-300 hover:shadow-sm"><div className="flex justify-between text-sm text-muted-foreground">{stat.label}<ArrowUpRight className="h-4 w-4" /></div><p className="mt-4 text-4xl font-semibold tracking-tight">{(i === 3 ? visits.isSuccess : appointments.isSuccess) ? stat.value : '—'}<span className="ml-1 text-sm font-normal text-muted-foreground">{i === 3 ? '건' : '명'}</span></p></Link>)}</div>
    <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">{actions.map(action => <Link key={action.href} href={action.href} className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 hover:bg-blue-50/50"><span className="rounded-xl bg-blue-50 p-3 text-blue-600"><action.icon className="h-5 w-5" /></span><div><h2 className="text-sm font-bold">{action.title}</h2><p className="mt-1 text-xs text-muted-foreground">{action.desc}</p></div></Link>)}</section>
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <section className="overflow-hidden rounded-2xl border border-border bg-card"><div className="flex justify-between border-b border-border p-5"><h2 className="font-bold">오늘의 예약</h2><Link href="/emr/appointments" className="text-sm text-blue-600">전체 보기 →</Link></div><div className="divide-y divide-border">{activeRows.slice(0, 8).map(a => <Link key={a.id} href="/emr/waiting" className="flex items-center gap-4 p-5 hover:bg-secondary/50"><span className="text-sm font-semibold tabular-nums text-blue-600">{a.start_time.slice(11, 16)}</span><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{a.patient_name}</p><p className="mt-1 truncate text-xs text-muted-foreground">{a.chief_complaint || '예약 사유 미입력'}</p></div><span className="rounded-md bg-secondary px-2 py-1 text-xs">{({ SCHEDULED: '예약', CONFIRMED: '확정', ARRIVED: '도착', IN_PROGRESS: '진료 중', COMPLETED: '완료' } as Record<string, string>)[a.status]}</span></Link>)}{appointments.isSuccess && activeRows.length === 0 && <div className="p-12 text-center"><CalendarDays className="mx-auto mb-3 h-8 w-8 text-blue-300" /><p className="text-sm text-muted-foreground">오늘 등록된 예약이 없습니다.</p><Link href="/emr/appointments" className="mt-4 inline-block text-sm text-blue-600">첫 예약 등록하기 →</Link></div>}</div></section>
      <section className="rounded-2xl bg-slate-900 p-7 text-white"><span className="text-xs tracking-widest text-blue-300">WORK BETTER, TOGETHER</span><h2 className="mt-5 text-2xl font-semibold leading-snug">우리 의원에 맞게<br />워크스페이스를 완성하세요.</h2><p className="mt-4 text-sm leading-7 text-slate-300">진료과와 운영 시간을 설정하고, 기존 환자 정보를 가져오면 진료를 시작할 수 있습니다.</p><div className="mt-6 space-y-3">{[{ href: '/emr/setup-wizard', text: '의원 정보 설정' }, { href: '/emr/patients/import', text: '기존 환자 가져오기' }, { href: '/emr/reports', text: '진료 리포트 확인' }].map(a => <Link key={a.href} href={a.href} className="flex justify-between rounded-xl border border-white/15 px-4 py-3 text-sm hover:bg-white/10">{a.text}<ArrowUpRight className="h-4 w-4" /></Link>)}</div></section>
    </div>
  </div>
}
