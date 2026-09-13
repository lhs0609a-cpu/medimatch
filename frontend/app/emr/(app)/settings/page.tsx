'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, ArrowUpRight } from 'lucide-react'
import { toast } from 'sonner'
import { clinicSetupService, ClinicSetupData } from '@/lib/api/clinicSetup'
import { errorMessage } from '@/lib/emr/workflow'
import QueryState from '@/components/emr/QueryState'
export default function SettingsPage() {
  const qc = useQueryClient()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)
  const query = useQuery({ queryKey: ['clinic-setup'], queryFn: clinicSetupService.get })
  const [form, setForm] = useState<ClinicSetupData>({})
  const [dirty, setDirty] = useState(false)
  useEffect(() => { if (query.data && !dirty) setForm(query.data) }, [query.data, dirty])
  const mutation = useMutation({
    mutationFn: clinicSetupService.update,
    onSuccess: data => { qc.setQueryData(['clinic-setup'], data); setDirty(false); toast.success('의원 설정이 저장되었습니다.') },
    onError: error => toast.error(errorMessage(error)),
  })
  const field = (key: keyof ClinicSetupData, value: string) => { setDirty(true); setForm(v => ({ ...v, [key]: value })) }
  return <div className="mx-auto max-w-5xl space-y-6">
    <div><p className="mb-2 text-xs font-semibold tracking-widest text-blue-600">WORKSPACE SETTINGS</p><h1 className="text-3xl font-bold">의원 설정</h1><p className="mt-2 text-sm text-muted-foreground">우리 의원의 기본 정보와 운영 시간을 관리하세요.</p></div>
    <QueryState loading={query.isLoading} error={query.isError} retry={() => query.refetch()} />
    {query.isSuccess && <form className="card p-6 sm:p-8" onSubmit={event => { event.preventDefault(); if (form.hours_open && form.hours_close && form.hours_open >= form.hours_close) { toast.error('진료 종료 시간은 시작 시간 이후여야 합니다.'); return } mutation.mutate({ clinic_name: form.clinic_name?.trim(), doctor_names: form.doctor_names, hours_open: form.hours_open, hours_close: form.hours_close, lunch_open: form.lunch_open, lunch_close: form.lunch_close, weekday_pattern: form.weekday_pattern }) }}>
      <h2 className="mb-6 text-lg font-bold">기본 정보</h2><div className="grid gap-5 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium"><span>의원 이름</span><input required maxLength={100} className="input" value={form.clinic_name || ''} onChange={e => field('clinic_name', e.target.value)} /></label><label className="space-y-2 text-sm font-medium"><span>의료진 이름 (쉼표로 구분)</span><input className="input" value={form.doctor_names?.join(',') || ''} onChange={e => { setDirty(true); setForm(v => ({ ...v, doctor_names: e.target.value.split(',') })) }} /></label>
      {([{ key: 'hours_open', label: '진료 시작' }, { key: 'hours_close', label: '진료 종료' }, { key: 'lunch_open', label: '점심 시작' }, { key: 'lunch_close', label: '점심 종료' }] as const).map(f => <label key={f.key} className="space-y-2 text-sm font-medium"><span>{f.label}</span><input type="time" className="input" value={form[f.key] || ''} onChange={e => field(f.key, e.target.value)} /></label>)}</div>
      <div className="mt-8 flex items-center justify-between border-t border-border pt-5"><span className="text-xs text-muted-foreground">{dirty ? '저장하지 않은 변경사항이 있습니다.' : '서버에 저장된 설정입니다.'}</span><button type="submit" disabled={!dirty || mutation.isPending} className="btn-primary"><Save className="h-4 w-4" />{mutation.isPending ? '저장 중...' : '변경사항 저장'}</button></div>
    </form>}
    <div className="grid gap-4 sm:grid-cols-2">{[{ href: '/emr/setup-wizard', label: '진료과·템플릿 설정', desc: '진료과에 맞는 기본 템플릿 설정' }, { href: '/emr/seats', label: '직원 계정 관리', desc: '직원 초대 및 계정 관리' }, { href: '/emr/patients/import', label: '환자 데이터 이관', desc: '기존 환자 파일 가져오기' }, { href: '/emr/support', label: '도움말 및 지원', desc: '사용 안내와 문의' }].map(a => <Link key={a.href} href={a.href} className="card flex items-center justify-between p-5 hover:border-blue-300"><div><h2 className="text-sm font-bold">{a.label}</h2><p className="mt-1 text-xs text-muted-foreground">{a.desc}</p></div><ArrowUpRight className="h-4 w-4 text-blue-600" /></Link>)}</div>
    <div className="flex justify-end border-t border-border pt-5"><button disabled={signingOut} className="btn-secondary" onClick={async () => { setSigningOut(true); await useAuth.getState().logout(); qc.clear(); router.replace('/emr/login') }}>{signingOut ? '로그아웃 중...' : '로그아웃'}</button></div>
  </div>
}
