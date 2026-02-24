'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  Pill,
  FileText,
  Package,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  Menu,
  X,
  HelpCircle,
  Stethoscope,
  Zap,
} from 'lucide-react'

const sidebarLinks = [
  { href: '/emr/pharmacy', label: '대시보드', icon: LayoutDashboard },
  { href: '/emr/pharmacy/prescriptions', label: '처방전/조제', icon: FileText, accent: true },
  { href: '/emr/pharmacy/inventory', label: '재고 관리', icon: Package },
  { href: '/emr/pharmacy/patients', label: '복약지도', icon: Users },
  { href: '/emr/pharmacy/analytics', label: '경영분석', icon: BarChart3 },
  { href: '/emr/pharmacy/settings', label: '설정', icon: Settings },
]

export default function PharmacyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background flex">
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* 사이드바 */}
      <aside className={`fixed top-0 left-0 h-full z-50 bg-card border-r border-border flex flex-col transition-all duration-300 ease-in-out ${collapsed ? 'w-[72px]' : 'w-[240px]'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className={`h-16 flex items-center border-b border-border px-4 ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-8 h-8 rounded-xl bg-purple-500 flex items-center justify-center flex-shrink-0">
            <Pill className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-sm whitespace-nowrap">
              MediMatch <span className="text-purple-500">Pharmacy</span>
            </span>
          )}
        </div>

        {!collapsed && (
          <div className="px-4 py-3 border-b border-border">
            <div className="text-xs text-muted-foreground">현재 약국</div>
            <div className="text-sm font-semibold truncate">메디매치 온누리약국</div>
            <div className="flex items-center gap-1 mt-1">
              <Zap className="w-3 h-3 text-emerald-500" />
              <span className="text-2xs text-emerald-500 font-semibold">의원 3곳 연동</span>
            </div>
          </div>
        )}

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/emr/pharmacy' && pathname.startsWith(link.href))
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? link.accent ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                } ${collapsed ? 'justify-center px-0' : ''}`}
                title={collapsed ? link.label : undefined}
              >
                <link.icon className={`w-5 h-5 flex-shrink-0 ${link.accent && isActive ? 'text-purple-500' : ''}`} />
                {!collapsed && <span>{link.label}</span>}
                {link.accent && !collapsed && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-border space-y-1">
          <Link href="/emr" className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors ${collapsed ? 'justify-center px-0' : ''}`}>
            <Stethoscope className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>의원 EMR</span>}
          </Link>
          <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors w-full">
            {collapsed ? <ChevronRight className="w-5 h-5 mx-auto" /> : <><ChevronLeft className="w-5 h-5" /><span>접기</span></>}
          </button>
        </div>
      </aside>

      {/* 메인 */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-[240px]'}`}>
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button className="lg:hidden btn-icon" onClick={() => setMobileOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-secondary/50 rounded-xl px-4 py-2 w-72">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="의약품, 환자 검색..." className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/emr/pharmacy/prescriptions" className="btn-sm hidden sm:flex" style={{ backgroundColor: 'rgb(168 85 247)', color: 'white' }}>
              <FileText className="w-3.5 h-3.5" />
              처방전 수신함
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-2xs font-bold">3</span>
            </Link>
            <button className="btn-icon relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-500 rounded-full" />
            </button>
            <button className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-secondary transition-colors">
              <div className="avatar avatar-sm bg-purple-500/10 text-purple-500">
                <span className="text-xs font-bold">박</span>
              </div>
              <span className="hidden sm:inline text-sm font-medium">박약사</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
