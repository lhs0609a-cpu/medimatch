'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  ArrowRight, Menu, X, Send, Monitor, Target, Sparkles,
  Stethoscope, Building2, Rocket, ShoppingCart, MessageSquare,
} from 'lucide-react'
import { hasGuestToken } from '@/lib/auth/guestToken'

export function HomeHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [hasToken, setHasToken] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => { setHasToken(hasGuestToken()) }, [])

  // 스크롤 시 헤더 톤 변화 (토스풍 마이크로 인터랙션)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-background/85 backdrop-blur-xl border-b border-border/60'
          : 'bg-background/0 backdrop-blur-0 border-b border-transparent'
      }`}
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-[1.02]">
            <img
              src="/assets/logo/mediplaton-horizontal.png"
              alt="MEDI-PLATON"
              className="h-9 object-contain"
            />
          </Link>

          {/* Desktop Nav — 간결 4개 */}
          <nav className="hidden lg:flex items-center gap-1">
            {[
              { label: 'EMR',        href: '/services/emr' },
              { label: 'CRM',        href: '/emr/crm',  badge: 'NEW' },
              { label: '발견',       href: '/emr/discover' },
              { label: '가격',       href: '/#pricing' },
            ].map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="relative px-4 py-2 text-sm font-semibold text-foreground/80 hover:text-foreground rounded-xl hover:bg-foreground/5 transition-colors"
              >
                <span className="inline-flex items-center gap-1.5">
                  {n.label}
                  {n.badge && (
                    <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      {n.badge}
                    </span>
                  )}
                </span>
              </Link>
            ))}
          </nav>

          {/* Right — 단일 CTA 강조 */}
          <div className="hidden lg:flex items-center gap-3">
            {hasToken ? (
              <>
                <Link
                  href="/recover"
                  className="text-sm text-foreground/60 hover:text-foreground transition-colors"
                >
                  링크 분실?
                </Link>
                <Link
                  href="/my-roadmap"
                  className="group inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold rounded-full bg-foreground text-background hover:opacity-90 transition-all hover:shadow-lg"
                >
                  <Target className="w-4 h-4" />
                  내 미션맵
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/recover"
                  className="text-sm text-foreground/60 hover:text-foreground transition-colors"
                >
                  로그인 링크 받기
                </Link>
                <Link
                  href="/emr"
                  className="group inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold rounded-full bg-primary text-white hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-primary/30"
                >
                  무료로 시작
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden w-11 h-11 rounded-full flex items-center justify-center hover:bg-foreground/5 transition-colors"
            aria-label={mobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu — 풀스크린 오버레이 */}
      {mobileMenuOpen && (
        <nav
          className="lg:hidden fixed inset-0 top-20 bg-background animate-fade-in-down overflow-y-auto"
          aria-label="모바일 메뉴"
        >
          <div className="px-4 py-6 space-y-1">
            {/* 메인 메뉴 4개 */}
            {[
              { label: 'EMR · 클라우드',         icon: Monitor,        href: '/services/emr' },
              { label: 'CRM · 환자 리콜',        icon: Send,           href: '/emr/crm', badge: 'NEW' },
              { label: 'EMR 안의 발견',          icon: Sparkles,       href: '/emr/discover' },
              { label: '가격 안내',              icon: Stethoscope,    href: '/#pricing' },
            ].map((n) => {
              const I = n.icon
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-foreground/5 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <I className="w-5 h-5 text-primary" />
                  </div>
                  <span className="flex-1 text-lg font-bold">{n.label}</span>
                  {n.badge && (
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                      {n.badge}
                    </span>
                  )}
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              )
            })}

            {/* 추가 진입점 */}
            <div className="pt-4 border-t border-border mt-4 space-y-1">
              <Link
                href="/buildings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:bg-foreground/5 rounded-xl"
              >
                <Building2 className="w-4 h-4" />
                병원 매물
              </Link>
              <Link
                href="/group-buying"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:bg-foreground/5 rounded-xl"
              >
                <ShoppingCart className="w-4 h-4" />
                공동구매
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:bg-foreground/5 rounded-xl"
              >
                <MessageSquare className="w-4 h-4" />
                상담 문의
              </Link>
            </div>

            {/* 하단 CTA — 거대 */}
            <div className="pt-6 mt-6 border-t border-border space-y-3">
              {hasToken ? (
                <Link
                  href="/my-roadmap"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full px-6 py-4 text-base font-bold rounded-2xl bg-foreground text-background"
                >
                  <Target className="w-5 h-5" />
                  내 미션맵 보기
                </Link>
              ) : (
                <Link
                  href="/emr"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full px-6 py-4 text-base font-bold rounded-2xl bg-primary text-white"
                >
                  무료로 시작
                  <ArrowRight className="w-5 h-5" />
                </Link>
              )}
              <Link
                href="/recover"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-3 text-sm text-muted-foreground hover:bg-foreground/5 rounded-xl"
              >
                로그인 링크 받기
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}
