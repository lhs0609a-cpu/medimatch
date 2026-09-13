'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'
import BrandLogo from '@/components/BrandLogo'
import { useAuth } from '@/lib/hooks/useAuth'
import { errorMessage } from '@/lib/emr/workflow'

export default function LoginPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const login = useAuth(state => state.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  return <div className="grid min-h-screen bg-background lg:grid-cols-2">
    <aside className="hidden flex-col justify-between bg-slate-900 p-16 text-white lg:flex"><Link href="/" className="text-sm font-bold tracking-widest text-blue-300">MEDIPLATON</Link><div><p className="mb-5 text-xs tracking-widest text-blue-300">CONNECTED CARE, EVERY DAY</p><h1 className="text-5xl font-semibold leading-tight tracking-tight">진료의 모든 순간을<br />하나로 연결하세요.</h1><p className="mt-7 max-w-md text-base leading-8 text-slate-300">환자의 첫 예약부터 진료 기록과 수납까지.<br />의원의 일상을 위한 워크스페이스.</p></div><p className="flex items-center gap-2 text-xs text-slate-400"><ShieldCheck className="h-4 w-4" />나의 계정으로 안전하게 연결합니다.</p></aside>
    <main className="flex items-center justify-center p-6 sm:p-12"><div className="w-full max-w-sm"><BrandLogo /><h2 className="mt-10 text-3xl font-bold tracking-tight">다시 만나 반갑습니다.</h2><p className="mt-3 text-sm text-muted-foreground">계정에 로그인하고 업무를 이어가세요.</p>
      <form className="mt-8 space-y-5" onSubmit={async event => { event.preventDefault(); setBusy(true); setError(''); try { await login(email.trim(), password); qc.clear(); const user = useAuth.getState().user; router.push(user?.role === 'PHARMACIST' ? '/emr/pharmacy' : '/emr/dashboard') } catch (e) { setError(errorMessage(e, '이메일과 비밀번호를 확인해주세요.')) } finally { setBusy(false) } }}>
        {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <label className="block space-y-2 text-sm font-medium"><span>이메일</span><input required type="email" autoComplete="username" className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="doctor@clinic.com" /></label>
        <label className="block space-y-2 text-sm font-medium"><span>비밀번호</span><div className="relative"><input required type={visible ? 'text' : 'password'} autoComplete="current-password" className="input pr-12" value={password} onChange={e => setPassword(e.target.value)} /><button type="button" onClick={() => setVisible(v => !v)} aria-label={visible ? '비밀번호 숨기기' : '비밀번호 보기'} className="absolute right-3 top-3 text-muted-foreground">{visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>
        <div className="text-right"><Link href="/forgot-password" className="text-xs font-medium text-blue-600">비밀번호를 잊으셨나요?</Link></div><button type="submit" disabled={busy} className="btn-primary w-full py-3">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}{busy ? '로그인 중...' : '로그인'}</button>
      </form><p className="mt-7 text-center text-sm text-muted-foreground">아직 계정이 없으신가요? <Link href="/emr/signup" className="font-semibold text-blue-600">회원가입</Link></p><div className="mt-12 flex justify-center gap-4 text-xs text-muted-foreground"><Link href="/terms">이용약관</Link><Link href="/privacy">개인정보처리방침</Link><Link href="/contact">문의하기</Link></div>
    </div></main>
  </div>
}
