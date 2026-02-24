'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  CalendarCheck,
  Receipt,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  Moon,
  Sun,
  Menu,
  X,
  Mic,
  Pill,
  BarChart3,
  FileText,
  LogOut,
  User,
  HelpCircle,
  Building2,
  CreditCard,
  Shield,
  UserCog,
  MessageSquare,
  Video,
  ArrowLeftRight,
  Brain,
  Clock,
  Star,
  QrCode,
} from 'lucide-react'

const sidebarLinks = [
  { href: '/emr/dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/emr/appointments', label: '예약/접수', icon: CalendarCheck },
  { href: '/emr/patients', label: '환자 관리', icon: Users },
  { href: '/emr/chart/new', label: 'AI 진료차트', icon: Mic, accent: true },
  { href: '/emr/claims', label: '보험청구', icon: Receipt },
  { href: '/emr/telemedicine', label: '비대면 진료', icon: Video },
  { href: '/emr/waiting', label: '대기/동선', icon: Clock },
  { href: '/emr/smart-booking', label: '스마트 예약 QR', icon: QrCode },
  { href: '/emr/bridge', label: '약국 브릿지', icon: ArrowLeftRight },
  { href: '/emr/reports', label: '통합 리포트', icon: BarChart3 },
  { href: '/emr/ai-consulting', label: 'AI 경영컨설팅', icon: Brain },
  { href: '/emr/reviews', label: '만족도/리뷰', icon: Star },
  { href: '/emr/billing', label: '수납/결제', icon: CreditCard },
  { href: '/emr/crm', label: '환자 리콜/CRM', icon: MessageSquare },
  { href: '/emr/multi-branch', label: '멀티 지점', icon: Building2 },
  { href: '/emr/staff', label: '직원/권한', icon: UserCog },
  { href: '/emr/integrations', label: '연동/API', icon: Building2 },
  { href: '/emr/settings', label: '설정', icon: Settings },
]

export default function EMRAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

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

        {/* 네비게이션 */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200
                  ${isActive
                    ? link.accent
                      ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                      : 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }
                  ${collapsed ? 'justify-center px-0' : ''}
                `}
                title={collapsed ? link.label : undefined}
              >
                <link.icon className={`w-5 h-5 flex-shrink-0 ${
                  link.accent && isActive ? 'text-red-500' : ''
                }`} />
                {!collapsed && <span>{link.label}</span>}
                {link.accent && !collapsed && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </Link>
            )
          })}
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

            {/* 검색 */}
            <div className="hidden sm:flex items-center gap-2 bg-secondary/50 rounded-xl px-4 py-2 w-72">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="환자 검색 (이름, 차트번호, 연락처)"
                className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
              />
              <kbd className="hidden md:inline text-2xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">⌘K</kbd>
            </div>
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

        {/* 콘텐츠 */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
