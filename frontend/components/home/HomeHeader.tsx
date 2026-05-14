'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  ArrowRight,
  BarChart3,
  Building2,
  ChevronDown,
  Calculator,
  LayoutDashboard,
  Map,
  Menu,
  Pill,
  Rocket,
  Settings,
  Sparkles,
  Stethoscope,
  TrendingUp,
  Wrench,
  X,
  Globe,
  Target,
  MessageSquare,
  Headphones,
} from 'lucide-react'
import { TossIcon } from '@/components/ui/TossIcon'
import { hasGuestToken } from '@/lib/auth/guestToken'

export function HomeHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)
  const [hasToken, setHasToken] = useState(false)

  // 토큰 인식 — SSR mismatch 피하려고 mount 후 1회 체크
  useEffect(() => { setHasToken(hasGuestToken()) }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass" role="banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/assets/logo/mediplaton-horizontal.png"
              alt="MEDI-PLATON"
              className="h-8 object-contain"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            <div className="relative">
              <button
                onClick={() => setServicesOpen(!servicesOpen)}
                onMouseEnter={() => setServicesOpen(true)}
                className="nav-link flex items-center gap-1"
              >
                서비스
                <ChevronDown className={`w-4 h-4 transition-transform ${servicesOpen ? 'rotate-180' : ''}`} />
              </button>

              {servicesOpen && (
                <div
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[600px] p-6 bg-card border border-border rounded-2xl shadow-2xl animate-fade-in-down"
                  onMouseLeave={() => setServicesOpen(false)}
                >
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">핵심 서비스</p>
                      <div className="space-y-1">
                        <Link href="/opening-package" className="flex items-center gap-3 p-3 rounded-xl bg-[#3182f6]/5 dark:bg-[#3182f6]/10 border border-[#3182f6]/20 dark:border-[#3182f6]/30 group">
                          <TossIcon icon={Sparkles} color="from-blue-500 to-blue-600" size="sm" shadow="shadow-blue-500/25" />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground group-hover:text-[#3182f6]">개원의 패키지</p>
                              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#3182f6] text-white rounded">HOT</span>
                            </div>
                            <p className="text-xs text-muted-foreground">대출 + 마케팅 + PG + 중개 원스톱</p>
                          </div>
                        </Link>
                        <Link href="/simulate" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors group">
                          <TossIcon icon={BarChart3} color="from-blue-500 to-blue-600" size="xs" shadow="shadow-blue-500/25" className="flex-shrink-0" />
                          <div>
                            <p className="font-medium text-foreground group-hover:text-[#3182f6]">OpenSim</p>
                            <p className="text-xs text-muted-foreground">AI 개원 시뮬레이터</p>
                          </div>
                        </Link>
                        <Link href="/buildings" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors group">
                          <TossIcon icon={Building2} color="from-blue-500 to-blue-600" size="xs" shadow="shadow-blue-500/25" className="flex-shrink-0" />
                          <div>
                            <p className="font-medium text-foreground group-hover:text-[#3182f6]">매물 검색</p>
                            <p className="text-xs text-muted-foreground">개원 적합 공간 찾기</p>
                          </div>
                        </Link>
                        <Link href="/pharmacy-match" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors group">
                          <TossIcon icon={Pill} color="from-blue-500 to-blue-600" size="xs" shadow="shadow-blue-500/25" className="flex-shrink-0" />
                          <div>
                            <p className="font-medium text-foreground group-hover:text-[#3182f6]">PharmMatch</p>
                            <p className="text-xs text-muted-foreground">약국 양도양수</p>
                          </div>
                        </Link>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">제작 서비스</p>
                      <div className="space-y-1">
                        <Link href="/services/emr" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors group">
                          <TossIcon icon={Stethoscope} color="from-blue-500 to-blue-600" size="xs" shadow="shadow-blue-500/25" className="flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium group-hover:text-[#3182f6]">클라우드 EMR</span>
                              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#3182f6]/10 text-[#3182f6] rounded">NEW</span>
                            </div>
                            <p className="text-xs text-muted-foreground">AI 차트, 클라우드 네이티브</p>
                          </div>
                        </Link>
                        <Link href="/emr-dashboard" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors group">
                          <TossIcon icon={BarChart3} color="from-blue-600 to-blue-700" size="xs" shadow="shadow-blue-500/25" className="flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium group-hover:text-[#3182f6]">EMR 비즈니스 분석</span>
                              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#3182f6]/10 text-[#3182f6] rounded">NEW</span>
                            </div>
                            <p className="text-xs text-muted-foreground">매출·환자·지역 벤치마크</p>
                          </div>
                        </Link>
                        <Link href="/emr/crm" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors group">
                          <TossIcon icon={MessageSquare} color="from-blue-500 to-blue-600" size="xs" shadow="shadow-blue-500/25" className="flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium group-hover:text-[#3182f6]">CRM · 환자 리콜</span>
                              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#3182f6]/10 text-[#3182f6] rounded">NEW</span>
                            </div>
                            <p className="text-xs text-muted-foreground">정기검진 리콜·캠페인·알림톡</p>
                          </div>
                        </Link>
                      </div>
                      <div className="border-t border-border mt-3 pt-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">운영자 전용</p>
                        <Link href="/admin/crm" className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors">
                          <Headphones className="w-4 h-4 text-[#3182f6] flex-shrink-0" />
                          <span className="text-xs">개원의 Lead 콘솔 (라이브 콜)</span>
                        </Link>
                      </div>
                      <div className="border-t border-border mt-3 pt-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">개원 도구</p>
                        <div className="space-y-1">
                          <Link href="/opening-project" className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors">
                            <Rocket className="w-4 h-4 text-[#3182f6] flex-shrink-0" />
                            <span className="text-xs">개원 D-Day 체크리스트</span>
                          </Link>
                          <Link href="/cost-calculator" className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors">
                            <Calculator className="w-4 h-4 text-[#3182f6] flex-shrink-0" />
                            <span className="text-xs">개원 비용 계산기</span>
                          </Link>
                          <Link href="/bep-analyzer" className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors">
                            <TrendingUp className="w-4 h-4 text-[#3182f6] flex-shrink-0" />
                            <span className="text-xs">BEP 분석기</span>
                          </Link>
                          <Link href="/#services" className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors">
                            <Wrench className="w-4 h-4 text-[#3182f6] flex-shrink-0" />
                            <span className="text-xs">전체 도구 보기</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link href="/opening-package" className="nav-link flex items-center gap-1">
              개원의 패키지
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#3182f6] text-white rounded">HOT</span>
            </Link>
            <Link href="/buildings" className="nav-link">매물</Link>
            <Link href="/opening-project" className="nav-link flex items-center gap-1">
              개원 D-Day
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#3182f6]/80 text-white rounded">NEW</span>
            </Link>
            <Link href="/group-buying" className="nav-link hidden xl:block">공동구매</Link>
            <Link href="/map" className="nav-link">지도</Link>
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            {hasToken ? (
              <>
                <Link href="/recover" className="nav-link text-sm">링크 분실?</Link>
                <Link href="/my-roadmap" className="btn-primary">
                  <Target className="w-4 h-4" />
                  내 미션맵
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            ) : (
              <>
                <Link href="/recover" className="nav-link text-sm">링크 분실?</Link>
                <Link href="/diagnose" className="btn-primary">
                  <Sparkles className="w-4 h-4" />
                  1분 진단으로 시작
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden btn-icon"
            aria-label={mobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <nav id="mobile-menu" className="lg:hidden border-t border-border bg-background animate-fade-in-down" aria-label="모바일 메뉴">
          <div className="px-4 py-4 space-y-2">
            <Link href="/simulate" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
              <TossIcon icon={BarChart3} color="from-blue-500 to-blue-600" size="xs" shadow="shadow-blue-500/25" className="flex-shrink-0" />
              <span>OpenSim - 개원 시뮬레이터</span>
            </Link>
            <Link href="/buildings" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
              <TossIcon icon={Building2} color="from-blue-500 to-blue-600" size="xs" shadow="shadow-blue-500/25" className="flex-shrink-0" />
              <span>매물 검색</span>
            </Link>
            <Link href="/pharmacy-match" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
              <TossIcon icon={Pill} color="from-blue-500 to-blue-600" size="xs" shadow="shadow-blue-500/25" className="flex-shrink-0" />
              <span>PharmMatch - 약국 매칭</span>
            </Link>
            <Link href="/map" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
              <TossIcon icon={Map} color="from-blue-500 to-blue-600" size="xs" shadow="shadow-blue-500/25" className="flex-shrink-0" />
              <span>지도</span>
            </Link>
            <Link href="/services/emr" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
              <TossIcon icon={Stethoscope} color="from-blue-500 to-blue-600" size="xs" shadow="shadow-blue-500/25" className="flex-shrink-0" />
              <span className="flex items-center gap-2">클라우드 EMR <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#3182f6]/10 text-[#3182f6] rounded">NEW</span></span>
            </Link>
            <Link href="/emr/crm" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
              <TossIcon icon={MessageSquare} color="from-blue-500 to-blue-600" size="xs" shadow="shadow-blue-500/25" className="flex-shrink-0" />
              <span className="flex items-center gap-2">CRM · 환자 리콜 <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#3182f6]/10 text-[#3182f6] rounded">NEW</span></span>
            </Link>
            <Link href="/opening-project" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
              <TossIcon icon={Rocket} color="from-blue-500 to-blue-600" size="xs" shadow="shadow-blue-500/25" className="flex-shrink-0" />
              <span className="flex items-center gap-2">개원 D-Day 체크리스트 <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#3182f6]/80 text-white rounded">NEW</span></span>
            </Link>
            <Link href="/cost-calculator" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
              <TossIcon icon={Calculator} color="from-blue-500 to-blue-600" size="xs" shadow="shadow-blue-500/25" className="flex-shrink-0" />
              <span>개원 비용 계산기</span>
            </Link>
            <Link href="/opening-package" className="flex items-center gap-3 p-3 rounded-xl bg-[#3182f6]/5 dark:bg-[#3182f6]/10 border border-[#3182f6]/20 dark:border-[#3182f6]/30" onClick={() => setMobileMenuOpen(false)}>
              <TossIcon icon={Sparkles} color="from-blue-500 to-blue-600" size="xs" shadow="shadow-blue-500/25" className="flex-shrink-0" />
              <span>개원의 패키지</span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#3182f6] text-white rounded">HOT</span>
            </Link>
            <Link href="/#services" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
              <TossIcon icon={Wrench} color="from-blue-600 to-blue-700" size="xs" shadow="shadow-blue-500/25" className="flex-shrink-0" />
              <span>전체 도구 27종</span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#3182f6]/10 text-[#3182f6] rounded">NEW</span>
            </Link>
            <div className="pt-4 border-t border-border space-y-2">
              <Link href="/recover" className="block w-full text-center py-3 text-muted-foreground hover:bg-accent rounded-xl text-sm" onClick={() => setMobileMenuOpen(false)}>
                링크 분실 시 복구
              </Link>
              {hasToken ? (
                <Link href="/my-roadmap" className="btn-primary w-full justify-center" onClick={() => setMobileMenuOpen(false)}>
                  <Target className="w-4 h-4" />
                  내 미션맵 보기
                </Link>
              ) : (
                <Link href="/diagnose" className="btn-primary w-full justify-center" onClick={() => setMobileMenuOpen(false)}>
                  <Sparkles className="w-4 h-4" />
                  1분 진단으로 시작
                </Link>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}
