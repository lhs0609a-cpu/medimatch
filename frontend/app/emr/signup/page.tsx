'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import BrandLogo from '@/components/BrandLogo'
import { useAuth } from '@/lib/hooks/useAuth'
import { clinicSetupService } from '@/lib/api/clinicSetup'
import { serviceSubscriptionService } from '@/lib/api/services'
import { errorMessage } from '@/lib/emr/workflow'
export default function SignupPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const register = useAuth(state => state.register)
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', phone: '', company: '', role: 'DOCTOR' })
  const [agreed, setAgreed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const field = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }))
  return <main className="min-h-screen bg-secondary/40 px-4 py-12"><div className="mx-auto max-w-lg"><div className="mb-8 flex justify-center"><BrandLogo /></div><div className="rounded-2xl border border-border bg-card p-6 sm:p-9"><p className="text-xs font-semibold tracking-widest text-blue-600">WELCOME TO YOUR WORKSPACE</p><h1 className="mt-3 text-3xl font-bold">함께 시작해볼까요?</h1><p className="mt-3 text-sm text-muted-foreground">계정을 만들고 의원 환경을 설정하세요.</p>
    <form className="mt-7 space-y-4" onSubmit={async event => { event.preventDefault(); if (!agreed) { setError('필수 약관에 동의해주세요.'); return } if (form.password !== form.confirm) { setError('비밀번호가 일치하지 않습니다.'); return } setBusy(true); setError(''); try { await register({ email: form.email.trim(), password: form.password, full_name: form.name.trim(), phone: form.phone || undefined, role: form.role, company: form.company || undefined }); qc.clear(); if (form.role === 'DOCTOR') { try { await serviceSubscriptionService.activate({ service_type: 'EMR', tier: 'STARTER', company_name: form.company || undefined, contact_person: form.name.trim(), contact_phone: form.phone || undefined }) } catch { router.push('/subscription/emr'); return } } if (form.role === 'DOCTOR' && form.company.trim()) { try { await clinicSetupService.update({ clinic_name: form.company.trim(), doctor_names: [form.name.trim()] }) } catch { toast.info('계정이 생성되었습니다. 의원 정보는 설정에서 다시 저장해주세요.') } } router.push(form.role === 'PHARMACIST' ? '/emr/pharmacy' : '/emr/setup-wizard') } catch (e) { setError(errorMessage(e, '가입에 실패했습니다. 입력 정보를 확인해주세요.')) } finally { setBusy(false) } }}>
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <label className="block space-y-1.5 text-sm font-medium"><span>계정 유형</span><select className="input" value={form.role} onChange={e => field('role', e.target.value)}><option value="DOCTOR">의원</option><option value="PHARMACIST">약국</option></select></label>
      {([{ key: 'name', label: '이름', type: 'text', auto: 'name', min: 2 }, { key: 'email', label: '이메일', type: 'email', auto: 'email' }, { key: 'password', label: '비밀번호 (8자 이상)', type: 'password', auto: 'new-password', min: 8 }, { key: 'confirm', label: '비밀번호 확인', type: 'password', auto: 'new-password', min: 8 }] as const).map(f => <label key={f.key} className="block space-y-1.5 text-sm font-medium"><span>{f.label}</span><input required type={f.type} autoComplete={f.auto} minLength={'min' in f ? f.min : undefined} maxLength={100} className="input" value={form[f.key]} onChange={e => field(f.key, e.target.value)} /></label>)}
      <div className="grid gap-4 sm:grid-cols-2"><label className="block space-y-1.5 text-sm font-medium"><span>연락처 (선택)</span><input type="tel" autoComplete="tel" className="input" value={form.phone} onChange={e => field('phone', e.target.value)} /></label><label className="block space-y-1.5 text-sm font-medium"><span>{form.role === 'DOCTOR' ? '의원' : '약국'} 이름 (선택)</span><input maxLength={100} className="input" value={form.company} onChange={e => field('company', e.target.value)} /></label></div>
      <label className="flex items-start gap-2 py-3 text-xs leading-6 text-muted-foreground"><input required type="checkbox" className="mt-1.5" checked={agreed} onChange={e => setAgreed(e.target.checked)} /><span><Link href="/terms" target="_blank" className="underline">이용약관</Link> 및 <Link href="/privacy" target="_blank" className="underline">개인정보처리방침</Link>을 확인하고 동의합니다.</span></label>
      <button disabled={busy} type="submit" className="btn-primary w-full py-3">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}{busy ? '계정 생성 중...' : '계정 만들기'}</button>
    </form><p className="mt-6 text-center text-sm text-muted-foreground">이미 계정이 있으신가요? <Link href="/emr/login" className="font-semibold text-blue-600">로그인</Link></p></div></div></main>
}
