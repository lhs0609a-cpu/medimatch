'use client'
import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, Check, CalendarDays, FileText, CreditCard, Stethoscope, Users, Search } from 'lucide-react'
const flows = [
  { title: '예약·접수', icon: CalendarDays, headline: '환자의 하루를 한눈에.', desc: '예약 확인부터 도착, 진료 시작까지 하나의 흐름으로 관리하세요.', href: '/emr/appointments' },
  { title: '진료·차트', icon: FileText, headline: '기록은 명확하게. 진료는 편안하게.', desc: '환자 이력과 SOAP, 진단·시술 기록을 연결합니다.', href: '/emr/chart' },
  { title: '수납·리포트', icon: CreditCard, headline: '진료 이후까지 빈틈없이.', desc: '청구서와 수납 내역을 관리하고 의원의 운영 현황을 확인하세요.', href: '/emr/billing' },
]
export function HeroSection(_props: { markers?: unknown[] }) {
  const [active, setActive] = useState(0)
  const flow = flows[active]
  return <section className="relative overflow-hidden border-b border-border bg-background pt-32 pb-20 sm:pt-40 lg:pb-28" aria-label="메디플라톤 소개">
    <div aria-hidden="true" className="absolute right-0 top-0 h-full w-2/3 bg-gradient-to-bl from-blue-50/80 via-blue-50/20 to-transparent dark:from-blue-950/20" />
    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.1fr]">
        <div><span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" />의원을 위한 하나의 워크스페이스</span>
          <h1 className="mt-7 text-4xl font-bold leading-[1.2] tracking-[-0.05em] sm:text-5xl lg:text-[60px]">더 나은 진료를 위한<br /><span className="text-blue-600">새로운 연결.</span></h1>
          <p className="mt-6 max-w-lg text-base leading-8 text-muted-foreground sm:text-lg">예약부터 차트, 처방과 수납까지.<br />흩어진 업무를 연결하고, 환자에게 집중하세요.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/emr/dashboard" className="btn-primary px-6 py-3.5">EMR 시작하기 <ArrowRight className="h-4 w-4" /></Link><Link href="/contact" className="btn-secondary px-6 py-3.5">도입 상담</Link></div>
          <div className="mt-6 flex flex-wrap gap-4 text-xs text-muted-foreground">{['환자 데이터 이관', '의원별 워크스페이스', '통합 진료 흐름'].map(s => <span key={s} className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-blue-600" />{s}</span>)}</div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_-24px_rgba(37,99,235,0.22)] text-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><span className="flex items-center gap-2 text-xs font-bold"><Stethoscope className="h-4 w-4 text-blue-600" />MEDIPLATON <span className="font-normal text-slate-400">/ 워크스페이스</span></span><span className="rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-500">화면 미리보기 · 예시 데이터</span></div>
          <div className="flex"><div className="hidden w-14 shrink-0 space-y-6 border-r border-slate-100 bg-slate-50/60 py-6 sm:block">{[CalendarDays, Users, FileText, CreditCard].map((Icon, i) => <Icon key={i} className={'mx-auto h-4 w-4 ' + (i === active ? 'text-blue-600' : 'text-slate-400')} />)}</div>
          <div className="min-w-0 flex-1 p-5 sm:p-6"><div className="flex items-center justify-between"><p className="text-[10px] font-semibold tracking-widest text-blue-600">A BETTER DAY AT YOUR CLINIC</p><Search className="h-4 w-4 text-slate-400" /></div><h2 className="mt-3 text-xl font-bold tracking-tight">{flow.headline}</h2><p className="mt-2 min-h-10 text-xs leading-5 text-slate-500">{flow.desc}</p>
          <div className="my-5 grid grid-cols-3 gap-2">{(active === 0 ? ['예약', '대기', '진료 중'] : active === 1 ? ['진료 기록', '진단', '시술'] : ['청구서', '수납 완료', '미수금']).map((s, i) => <div key={s} className="rounded-xl border border-slate-100 bg-slate-50 p-3"><p className="text-[10px] text-slate-500">{s}</p><p className="mt-2 text-xl font-semibold">{[12, 3, 2][i]}<span className="ml-1 text-[10px] font-normal text-slate-400">건</span></p></div>)}</div>
          <div className="space-y-2">{['김○○', '이○○', '박○○'].map((name, i) => <div key={name} className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-3"><span className="text-[10px] font-semibold text-blue-600">{['09:00', '09:15', '09:30'][i]}</span><span className="flex-1 text-xs font-medium">{name}</span><span className="text-[10px] text-slate-400">{active === 0 ? '예약 확인' : active === 1 ? '진료 기록' : '수납 확인'}</span><span className="h-1.5 w-1.5 rounded-full bg-blue-400" /></div>)}</div>
          <Link href={flow.href} className="mt-5 flex items-center justify-between rounded-lg bg-blue-600 px-4 py-3 text-xs font-semibold text-white">{flow.title} 열기 <ArrowRight className="h-3.5 w-3.5" /></Link></div></div>
        </div>
      </div>
      <div className="mt-14 grid gap-3 sm:grid-cols-3" role="group" aria-label="업무 미리보기">{flows.map((f, i) => <button key={f.title} onClick={() => setActive(i)} aria-pressed={active === i} className={'flex items-center gap-4 rounded-xl border px-5 py-4 text-left transition ' + (active === i ? 'border-blue-200 bg-blue-50/70 dark:bg-blue-950/30' : 'border-border bg-card hover:border-blue-200')}><f.icon className={'h-5 w-5 shrink-0 ' + (active === i ? 'text-blue-600' : 'text-muted-foreground')} /><span><span className="block text-sm font-bold">{f.title}</span><span className="mt-1 block text-xs text-muted-foreground">{['첫 만남부터 진료 시작까지', '환자 중심의 진료 기록', '의원 운영을 더 명확하게'][i]}</span></span><ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" /></button>)}</div>
    </div>
  </section>
}
