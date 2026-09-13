'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LayoutDashboard, Users, Stethoscope, CalendarDays, Pill, Receipt, CreditCard, BarChart3, MessageSquare, Settings, Bell, Search, Menu, X, ChevronLeft, ChevronRight, LayoutGrid, HelpCircle, ArrowUpRight } from 'lucide-react'
import BrandLogo from '@/components/BrandLogo'
import { CommandPalette } from '@/components/emr/CommandPalette'
import { clinicSetupService } from '@/lib/api/clinicSetup'
import { apiClient } from '@/lib/api/client'

const groups = [
  { label: '워크스페이스', links: [
    { href: '/emr/dashboard', label: '대시보드', icon: LayoutDashboard },
    { href: '/emr/appointments', label: '예약·접수', icon: CalendarDays },
    { href: '/emr/waiting', label: '대기실', icon: Stethoscope },
    { href: '/emr/patients', label: '환자 관리', icon: Users },
    { href: '/emr/chart', label: '전자차트', icon: Stethoscope },
  ] },
  { label: '진료 이후', links: [
    { href: '/emr/prescriptions', label: '처방전', icon: Pill },
    { href: '/emr/billing', label: '수납·결제', icon: CreditCard },
    { href: '/emr/claims', label: '보험청구', icon: Receipt },
    { href: '/emr/crm', label: '환자 CRM', icon: MessageSquare },
    { href: '/emr/reports', label: '리포트', icon: BarChart3 },
  ] },
]
export default function EMRAppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [auth, setAuth] = useState<'loading' | 'ready' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)
  const clinic = useQuery({ queryKey: ['clinic-setup'], queryFn: clinicSetupService.get, enabled: auth === 'ready', retry: 1 })
  useEffect(() => {
    setMobileOpen(false)
    setPaletteOpen(false)
  }, [pathname])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setPaletteOpen(v => !v) }
      if (event.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 15000)
    let active = true
    async function ensureAuth() {
      setAuth('loading')
      try {
        const token = localStorage.getItem('access_token') || localStorage.getItem('medi_token')
        if (token) {
          await apiClient.get('/auth/me', { signal: controller.signal })
          if (active) setAuth('ready')
          return
        }
        const response = await fetch('/api/v1/auth/demo-doctor', { method: 'POST', signal: controller.signal })
        if (!response.ok) throw new Error('인증 실패')
        const data = await response.json()
        if (!data.token) throw new Error('토큰 누락')
        localStorage.setItem('medi_token', data.token)
        if (active) setAuth('ready')
      } catch { if (active) setAuth('error') }
      finally { window.clearTimeout(timeout) }
    }
    ensureAuth()
    return () => { active = false; controller.abort(); window.clearTimeout(timeout) }
  }, [attempt])
  return <div className="emr-workspace min-h-screen bg-background">
    <a href="#emr-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-card focus:p-3">본문으로 이동</a>
    {mobileOpen && <button aria-label="메뉴 닫기" className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={() => setMobileOpen(false)} />}
    <aside className={'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-card transition-all ' + (collapsed ? 'w-[76px] ' : 'w-[248px] ') + (mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0')}>
      <div className="flex h-[76px] shrink-0 items-center justify-center border-b border-border px-4"><BrandLogo compact={collapsed} workspace /></div>
      {!collapsed && <Link href="/emr/settings" className="mx-4 mt-5 rounded-xl border border-border bg-secondary/40 px-3 py-3"><span className="block text-[10px] font-semibold tracking-widest text-muted-foreground">MY WORKSPACE</span><span className="mt-1 flex items-center justify-between text-sm font-semibold">{clinic.data?.clinic_name || '의원 정보 설정'}<ChevronRight className="h-4 w-4" /></span></Link>}
      <nav aria-label="EMR 주요 메뉴" className="flex-1 overflow-y-auto px-3 py-5">
        {groups.map(group => <div key={group.label} className="mb-5">{!collapsed && <p className="mb-2 px-3 text-[10px] font-semibold tracking-wider text-muted-foreground">{group.label}</p>}<div className="space-y-1">{group.links.map(link => {
          const active = pathname === link.href || pathname.startsWith(link.href + '/')
          return <Link key={link.href} href={link.href} title={link.label} aria-current={active ? 'page' : undefined} className={'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors ' + (collapsed ? 'justify-center ' : '') + (active ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200' : 'text-muted-foreground hover:bg-secondary hover:text-foreground')}><link.icon className="h-[18px] w-[18px] shrink-0" />{!collapsed && link.label}</Link>
        })}</div></div>)}
        <button onClick={() => setPaletteOpen(true)} aria-label="전체 메뉴 검색" className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-muted-foreground hover:bg-secondary"><LayoutGrid className="h-[18px] w-[18px] shrink-0" />{!collapsed && '전체 메뉴'}</button>
      </nav>
      <div className="space-y-1 border-t border-border p-3">{[{ href: '/emr/settings', label: '설정', icon: Settings }, { href: '/emr/support', label: '도움말', icon: HelpCircle }].map(link => <Link key={link.href} href={link.href} title={link.label} className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-secondary"><link.icon className="h-4 w-4 shrink-0" />{!collapsed && link.label}</Link>)}<button aria-label={collapsed ? '메뉴 펼치기' : '메뉴 접기'} onClick={() => setCollapsed(!collapsed)} className="hidden w-full items-center gap-3 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-secondary lg:flex">{collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" />메뉴 접기</>}</button></div>
    </aside>
    <div className={'min-w-0 transition-all ' + (collapsed ? 'lg:ml-[76px]' : 'lg:ml-[248px]')}>
      <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between gap-3 border-b border-border bg-card/95 px-4 backdrop-blur-xl sm:px-7">
        <div className="flex min-w-0 items-center gap-3"><button aria-label="메뉴 열기" className="btn-icon lg:hidden" onClick={() => setMobileOpen(true)}><Menu className="h-5 w-5" /></button><button onClick={() => setPaletteOpen(true)} aria-label="메뉴 및 환자 검색" className="flex items-center gap-3 rounded-xl bg-secondary/60 px-3 py-2.5 text-sm text-muted-foreground sm:min-w-[280px]"><Search className="h-4 w-4" /><span className="hidden sm:inline">메뉴·환자 검색</span><kbd className="ml-auto hidden rounded border border-border px-1.5 text-[10px] sm:inline">Ctrl K</kbd></button></div>
        <div className="flex items-center gap-2"><Link href="/emr/chart/new" className="btn-primary hidden text-xs sm:inline-flex">새 진료 기록 <ArrowUpRight className="h-4 w-4" /></Link><Link href="/emr/notifications" aria-label="알림" className="btn-icon"><Bell className="h-5 w-5" /></Link><Link href="/emr/settings" aria-label="의원 설정" className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600"><Settings className="h-4 w-4" /></Link></div>
      </header>
      <main id="emr-content" className="min-w-0 p-4 sm:p-7">
        {auth === 'ready' ? children : <div className="flex min-h-[60vh] items-center justify-center"><div className="max-w-sm text-center">{auth === 'loading' ? <><div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /><p role="status" className="text-sm text-muted-foreground">워크스페이스에 연결하고 있습니다.</p></> : <><h1 className="text-xl font-bold">워크스페이스에 연결하지 못했습니다.</h1><p className="mt-3 text-sm text-muted-foreground">서버 연결을 확인하고 다시 시도하거나 로그인해주세요.</p><div className="mt-5 flex justify-center gap-2"><button className="btn-primary" onClick={() => setAttempt(v => v + 1)}>다시 시도</button><Link href="/emr/login" className="btn-secondary">로그인</Link></div></>}</div></div>}
      </main>
    </div>
    <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
  </div>
}
