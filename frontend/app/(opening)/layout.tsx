'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  Rocket,
  Wallet,
  FileCheck,
  Briefcase,
  Home,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react'

const sidebarLinks = [
  { href: '/opening', label: '개원 대시보드', icon: Rocket },
  { href: '/opening/budget', label: '예산 관리', icon: Wallet },
  { href: '/opening/permits', label: '인허가', icon: FileCheck },
  { href: '/opening/vendors', label: '파트너', icon: Briefcase },
  { href: '/', label: '홈', icon: Home },
]

export default function OpeningLayout({
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
            <Rocket className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-sm whitespace-nowrap">
              MediMatch <span className="text-primary">개원</span>
            </span>
          )}
        </div>

        {/* 네비게이션 */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {sidebarLinks.map((link) => {
            const isActive = link.href === '/'
              ? pathname === '/'
              : pathname === link.href || pathname.startsWith(link.href + '/')
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
              </Link>
            )
          })}
        </nav>

        {/* 하단 */}
        <div className="p-3 border-t border-border">
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
            <h2 className="text-sm font-semibold text-muted-foreground">개원 준비</h2>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/emr/dashboard" className="btn-secondary btn-sm text-xs">
              EMR 바로가기
            </Link>
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
