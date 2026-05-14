'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  Stethoscope,
  Users,
  Pill,
  Send,
  BarChart3,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  Menu,
  X,
  Mic,
  HelpCircle,
  Compass,
  type LucideIcon,
} from 'lucide-react'
import { CommandPalette } from '@/components/emr/CommandPalette'

type PrimaryLink = {
  href: string
  label: string
  icon: LucideIcon
  // 활성 처리될 추가 경로 prefix들 (이 prefix로 시작하면 같은 그룹으로 간주)
  matchPrefixes?: string[]
  badge?: string
}

// 일상에서 자주 쓰는 6개만 사이드바에 노출. 나머지 23개는 ⌘K(더보기)로.
const primaryLinks: PrimaryLink[] = [
  {
    href: '/emr/appointments',
    label: '진료',
    icon: Stethoscope,
    matchPrefixes: ['/emr/appointments', '/emr/chart', '/emr/inbox', '/emr/waiting', '/emr/telemedicine', '/emr/chronic-care', '/emr/smart-booking'],
  },
  {
    href: '/emr/patients',
    label: '환자',
    icon: Users,
    matchPrefixes: ['/emr/patients'],
  },
  {
    href: '/emr/prescriptions',
    label: '처방·청구',
    icon: Pill,
    matchPrefixes: ['/emr/prescriptions', '/emr/claims', '/emr/tax-correction', '/emr/bridge', '/emr/billing'],
  },
  {
    href: '/emr/crm',
    label: 'CRM',
    icon: Send,
    matchPrefixes: ['/emr/crm', '/emr/reviews'],
    badge: 'NEW',
  },
  {
    href: '/emr/dashboard',
    label: '리포트',
    icon: BarChart3,
    matchPrefixes: ['/emr/dashboard', '/emr-dashboard', '/emr/reports', '/emr/cost', '/emr/ai-consulting', '/emr/multi-branch'],
  },
  {
    href: '/emr/discover',
    label: '발견',
    icon: Compass,
    matchPrefixes: ['/emr/discover', '/buildings', '/opening-project', '/group-buying', '/pharmacy-match', '/pharmacist', '/landlord'],
    badge: 'NEW',
  },
]

export default function EMRAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [authReady, setAuthReady] = useState(false)

  // ⌘K / Ctrl+K — 어디서든 명령 팔레트 열기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // EMR 진입 가드 — 토큰 없으면 데모 의사 자동 발급
  useEffect(() => {
    const ensureAuth = async () => {
      const jwt = localStorage.getItem('access_token')
      const magic = localStorage.getItem('medi_token')
      if (jwt || magic) {
        setAuthReady(true)
        return
      }
      try {
        // 상대 경로 — next.config.js rewrites가 백엔드로 프록시 (같은 origin, CORS 우회)
        const r = await fetch('/api/v1/auth/demo-doctor', { method: 'POST' })
        if (r.ok) {
          const data = await r.json()
          if (data.token) {
            localStorage.setItem('medi_token', data.token)
          }
        }
      } catch (e) {
        console.warn('demo-doctor 발급 실패 — EMR API 호출이 401될 수 있음', e)
      } finally {
        setAuthReady(true)
      }
    }
    ensureAuth()
  }, [])

  return (
    <div className="min-h-screen bg-background flex">
      {/* 모바일 오버레이 */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ───── 사이드바 ───── */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50
          bg-card border-r border-border
          flex flex-col
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-[72px]' : 'w-[240px]'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* 로고 */}
        <div className={`h-16 flex items-center border-b border-border px-4 ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
            <Stethoscope className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-sm whitespace-nowrap">
              MediMatch <span className="text-primary">EMR</span>
            </span>
          )}
        </div>

        {/* 의원 정보 */}
        {!collapsed && (
          <div className="px-4 py-3 border-b border-border">
            <div className="text-xs text-muted-foreground">현재 의원</div>
            <div className="text-sm font-semibold truncate">메디매치 내과의원</div>
          </div>
        )}

        {/* 네비게이션 — 일상 6개만 노출 */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {primaryLinks.map((link) => {
            const matches = link.matchPrefixes ?? [link.href]
            const isActive = matches.some(p => pathname === p || pathname.startsWith(p + '/'))
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200
                  ${isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }
                  ${collapsed ? 'justify-center px-0' : ''}
                `}
                title={collapsed ? link.label : undefined}
              >
                <link.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{link.label}</span>}
                {link.badge && !collapsed && (
                  <span className="ml-auto text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-md">
                    {link.badge}
                  </span>
                )}
              </Link>
            )
          })}

          {/* 더보기 — 전체 메뉴 + 검색 (⌘K) */}
          <button
            onClick={() => { setPaletteOpen(true); setMobileOpen(false) }}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
              text-muted-foreground hover:text-foreground hover:bg-secondary
              transition-all duration-200
              ${collapsed ? 'justify-center px-0' : ''}
            `}
            title={collapsed ? '더보기 (⌘K)' : undefined}
          >
            <LayoutGrid className="w-5 h-5 flex-shrink-0" />
            {!collapsed && (
              <>
                <span>더보기</span>
                <kbd className="ml-auto text-2xs px-1.5 py-0.5 bg-secondary border border-border rounded">⌘K</kbd>
              </>
            )}
          </button>
        </nav>

        {/* 하단 */}
        <div className="p-3 border-t border-border space-y-1">
          <Link
            href="/emr/notifications"
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors ${collapsed ? 'justify-center px-0' : ''}`}
          >
            <Bell className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>알림</span>}
          </Link>
          <Link
            href="/emr/support"
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors ${collapsed ? 'justify-center px-0' : ''}`}
          >
            <HelpCircle className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>도움말</span>}
          </Link>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors w-full"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5 mx-auto" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span>접기</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ───── 메인 영역 ───── */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-[240px]'}`}>
        {/* 상단 헤더 */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden btn-icon"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* 모바일 검색 버튼 */}
            <button
              className="sm:hidden btn-icon"
              onClick={() => setMobileSearchOpen(true)}
              aria-label="환자 검색"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* 명령 팔레트 트리거 — 환자/메뉴 통합 검색 */}
            <button
              onClick={() => setPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 bg-secondary/50 hover:bg-secondary rounded-xl px-4 py-2 w-72 transition-colors"
            >
              <Search className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground flex-1 text-left">메뉴·환자·기능 검색</span>
              <kbd className="hidden md:inline text-2xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">⌘K</kbd>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* AI 차트 바로가기 */}
            <Link
              href="/emr/chart/new"
              className="btn-primary btn-sm hidden sm:flex"
            >
              <Mic className="w-3.5 h-3.5" />
              AI 차트
            </Link>

            {/* 알림 */}
            <button className="btn-icon relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* 프로필 */}
            <button className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-secondary transition-colors">
              <div className="avatar avatar-sm bg-primary text-primary-foreground">
                <span className="text-xs font-bold">김</span>
              </div>
              <span className="hidden sm:inline text-sm font-medium">김원장</span>
            </button>
          </div>
        </header>

        {/* 콘텐츠 — 인증 준비 후 렌더 (신규 사용자만 200~500ms 대기) */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {authReady ? children : (
            <div className="flex items-center justify-center h-[60vh]">
              <div className="text-center text-muted-foreground">
                <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm">EMR 준비 중...</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 모바일 풀스크린 검색 오버레이 */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-[60] bg-background sm:hidden animate-fade-in">
          <div className="flex items-center gap-3 px-4 h-16 border-b border-border">
            <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="환자 검색 (이름, 차트번호, 연락처)"
              className="bg-transparent text-base outline-none w-full placeholder:text-muted-foreground"
              autoFocus
            />
            <button
              onClick={() => setMobileSearchOpen(false)}
              className="btn-icon flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 text-center text-sm text-muted-foreground">
            환자 이름, 차트번호, 연락처로 검색하세요
          </div>
        </div>
      )}

      {/* AI 차트 플로팅 액션 버튼 (모바일) */}
      <Link
        href="/emr/chart/new"
        className="sm:hidden fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        aria-label="AI 차트"
      >
        <Mic className="w-6 h-6" />
      </Link>

      {/* ⌘K 명령 팔레트 — 23개 숨김 메뉴 즉시 접근 */}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}
