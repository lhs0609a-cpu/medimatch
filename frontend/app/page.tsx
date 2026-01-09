'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  ArrowRight,
  BarChart3,
  MapPin,
  Pill,
  Building2,
  Users,
  Briefcase,
  Link2,
  MessageSquare,
  Shield,
  TrendingUp,
  Zap,
  Check,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
  Sparkles,
  Play,
  Star,
  Bell,
  Search,
  Globe,
  Stethoscope,
  Home,
  DollarSign,
  Clock,
  Target,
  Award,
  LayoutDashboard
} from 'lucide-react'

// 사용자 역할 타입
type UserRole = 'doctor' | 'pharmacist' | 'sales' | 'landlord' | 'partner'

// 역할별 색상
const roleColors = {
  doctor: 'from-blue-500 to-cyan-500',
  pharmacist: 'from-purple-500 to-pink-500',
  sales: 'from-orange-500 to-red-500',
  landlord: 'from-green-500 to-emerald-500',
  partner: 'from-indigo-500 to-violet-500',
}

// 역할별 서비스 정의
const roleServices = {
  doctor: {
    title: '의사',
    subtitle: '개원을 준비하는',
    icon: Stethoscope,
    color: 'blue',
    gradient: roleColors.doctor,
    services: [
      { name: '개원 시뮬레이션', desc: 'AI 기반 매출/비용 분석', href: '/simulate', icon: BarChart3 },
      { name: '매물 검색', desc: '개원 적합 건물 찾기', href: '/buildings', icon: Building2 },
      { name: '파트너 찾기', desc: '인테리어/의료기기 업체', href: '/partners', icon: Link2 },
      { name: '영업 요청 관리', desc: '영업사원 매칭 수락/거절', href: '/doctor/sales-requests', icon: Users },
    ]
  },
  pharmacist: {
    title: '약사',
    subtitle: '개국을 준비하는',
    icon: Pill,
    color: 'purple',
    gradient: roleColors.pharmacist,
    services: [
      { name: '약국 자리 찾기', desc: '독점 약국 입지 매칭', href: '/pharmacy-match', icon: MapPin },
      { name: '약국 매물 등록', desc: '양수/양도 매물 등록', href: '/pharmacy-match/listings/new', icon: Building2 },
      { name: '매칭 관리', desc: '관심 표현 및 채팅', href: '/pharmacy-match/matches', icon: MessageSquare },
      { name: '개원 시뮬레이션', desc: 'AI 기반 상권 분석', href: '/simulate', icon: BarChart3 },
    ]
  },
  sales: {
    title: '영업사원',
    subtitle: '개원 시장을 공략하는',
    icon: Briefcase,
    color: 'orange',
    gradient: roleColors.sales,
    services: [
      { name: '개원지 탐지', desc: '신축/폐업 실시간 알림', href: '/prospects', icon: Target },
      { name: '의사 매칭', desc: '개원 준비 의사 찾기', href: '/sales/doctors', icon: Users },
      { name: '매칭 관리', desc: '요청 현황 및 연락처', href: '/sales', icon: LayoutDashboard },
      { name: '지도 탐색', desc: '상권 분석 지도', href: '/map', icon: Globe },
    ]
  },
  landlord: {
    title: '건물주',
    subtitle: '임대 수익을 원하는',
    icon: Building2,
    color: 'green',
    gradient: roleColors.landlord,
    services: [
      { name: '매물 등록', desc: '의료 적합 공간 등록', href: '/landlord/register', icon: Home },
      { name: '내 매물 관리', desc: '등록 매물 및 문의', href: '/landlord', icon: LayoutDashboard },
      { name: '문의 확인', desc: '입점 문의 관리', href: '/landlord', icon: MessageSquare },
    ]
  },
  partner: {
    title: '파트너사',
    subtitle: '의료 서비스를 제공하는',
    icon: Link2,
    color: 'indigo',
    gradient: roleColors.partner,
    services: [
      { name: '서비스 등록', desc: '인테리어/의료기기 등', href: '/partners', icon: Award },
      { name: '고객 문의', desc: '견적 요청 관리', href: '/chat', icon: MessageSquare },
      { name: '에스크로 관리', desc: '안전 거래 시스템', href: '/escrow', icon: Shield },
    ]
  },
}

// 주요 통계
const stats = [
  { value: '50,000+', label: '등록 의료기관', icon: Building2 },
  { value: '1,200+', label: '매칭 성사', icon: Link2 },
  { value: '85%', label: '예측 정확도', icon: Target },
  { value: '3분', label: '평균 분석 시간', icon: Clock },
]

// 추천 후기
const testimonials = [
  {
    content: "OpenSim 덕분에 예상 매출을 정확히 파악하고 개원 결정을 내릴 수 있었습니다. 실제 매출이 예측치의 90% 이상이에요.",
    author: "김OO 원장",
    role: "성형외과 개원",
    avatar: "K"
  },
  {
    content: "SalesScanner로 폐업 병원 정보를 실시간으로 받아 경쟁사보다 빠르게 영업할 수 있었습니다.",
    author: "이OO 과장",
    role: "의료기기 영업",
    avatar: "L"
  },
  {
    content: "PharmMatch에서 좋은 조건의 약국 자리를 찾았어요. 익명으로 협상할 수 있어서 좋았습니다.",
    author: "박OO 약사",
    role: "약국 개국",
    avatar: "P"
  },
]

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeRole, setActiveRole] = useState<UserRole>('doctor')
  const [servicesOpen, setServicesOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* ===== HEADER ===== */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="font-bold text-xl text-foreground">MediMatch</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {/* Services Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setServicesOpen(!servicesOpen)}
                  onMouseEnter={() => setServicesOpen(true)}
                  className="nav-link flex items-center gap-1"
                >
                  서비스
                  <ChevronDown className={`w-4 h-4 transition-transform ${servicesOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Mega Menu */}
                {servicesOpen && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[800px] p-6 bg-card border border-border rounded-2xl shadow-2xl animate-fade-in-down"
                    onMouseLeave={() => setServicesOpen(false)}
                  >
                    <div className="grid grid-cols-3 gap-6">
                      {/* 핵심 서비스 */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">핵심 서비스</p>
                        <div className="space-y-1">
                          <Link href="/simulate" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors group">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground group-hover:text-blue-600">OpenSim</p>
                              <p className="text-xs text-muted-foreground">개원 시뮬레이터</p>
                            </div>
                          </Link>
                          <Link href="/prospects" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors group">
                            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                              <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground group-hover:text-green-600">SalesScanner</p>
                              <p className="text-xs text-muted-foreground">개원지 탐지</p>
                            </div>
                          </Link>
                          <Link href="/pharmacy-match" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors group">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                              <Pill className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground group-hover:text-purple-600">PharmMatch</p>
                              <p className="text-xs text-muted-foreground">약국 매칭</p>
                            </div>
                          </Link>
                        </div>
                      </div>

                      {/* 사용자별 */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">사용자별</p>
                        <div className="space-y-1">
                          <Link href="/buildings" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors">
                            <Stethoscope className="w-5 h-5 text-blue-500" />
                            <span className="text-sm">의사 - 매물 검색</span>
                          </Link>
                          <Link href="/sales" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors">
                            <Briefcase className="w-5 h-5 text-orange-500" />
                            <span className="text-sm">영업사원 센터</span>
                          </Link>
                          <Link href="/landlord" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors">
                            <Building2 className="w-5 h-5 text-green-500" />
                            <span className="text-sm">건물주 - 매물 등록</span>
                          </Link>
                          <Link href="/partners" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors">
                            <Link2 className="w-5 h-5 text-indigo-500" />
                            <span className="text-sm">파트너사</span>
                          </Link>
                        </div>
                      </div>

                      {/* 기타 */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">기타</p>
                        <div className="space-y-1">
                          <Link href="/map" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors">
                            <Globe className="w-5 h-5 text-cyan-500" />
                            <span className="text-sm">지도 탐색</span>
                          </Link>
                          <Link href="/chat" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors">
                            <MessageSquare className="w-5 h-5 text-pink-500" />
                            <span className="text-sm">채팅</span>
                          </Link>
                          <Link href="/escrow" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors">
                            <Shield className="w-5 h-5 text-amber-500" />
                            <span className="text-sm">에스크로 결제</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Link href="/map" className="nav-link">지도</Link>
              <Link href="/partners" className="nav-link">파트너</Link>
            </nav>

            {/* Right Side */}
            <div className="hidden lg:flex items-center gap-3">
              <Link href="/dashboard" className="nav-link flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" />
                대시보드
              </Link>
              <Link href="/login" className="btn-ghost">로그인</Link>
              <Link href="/register" className="btn-primary">
                무료 시작
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden btn-icon"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-background animate-fade-in-down">
            <div className="px-4 py-4 space-y-4">
              {/* 핵심 서비스 */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">핵심 서비스</p>
                <div className="space-y-1">
                  <Link href="/simulate" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                    <span>OpenSim - 개원 시뮬레이터</span>
                  </Link>
                  <Link href="/prospects" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                    <Target className="w-5 h-5 text-green-500" />
                    <span>SalesScanner - 개원지 탐지</span>
                  </Link>
                  <Link href="/pharmacy-match" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                    <Pill className="w-5 h-5 text-purple-500" />
                    <span>PharmMatch - 약국 매칭</span>
                  </Link>
                </div>
              </div>

              {/* 사용자별 */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">사용자별</p>
                <div className="space-y-1">
                  <Link href="/buildings" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                    <Stethoscope className="w-5 h-5 text-blue-500" />
                    <span>의사 - 매물 검색</span>
                  </Link>
                  <Link href="/sales" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                    <Briefcase className="w-5 h-5 text-orange-500" />
                    <span>영업사원 센터</span>
                  </Link>
                  <Link href="/landlord" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                    <Building2 className="w-5 h-5 text-green-500" />
                    <span>건물주 - 매물 등록</span>
                  </Link>
                  <Link href="/partners" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                    <Link2 className="w-5 h-5 text-indigo-500" />
                    <span>파트너사</span>
                  </Link>
                </div>
              </div>

              {/* 기타 */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">기타</p>
                <div className="space-y-1">
                  <Link href="/map" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                    <Globe className="w-5 h-5 text-cyan-500" />
                    <span>지도 탐색</span>
                  </Link>
                  <Link href="/chat" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                    <MessageSquare className="w-5 h-5 text-pink-500" />
                    <span>채팅</span>
                  </Link>
                  <Link href="/dashboard" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                    <LayoutDashboard className="w-5 h-5 text-gray-500" />
                    <span>대시보드</span>
                  </Link>
                </div>
              </div>

              {/* Auth */}
              <div className="pt-4 border-t border-border space-y-2">
                <Link href="/login" className="block w-full text-center py-3 text-foreground hover:bg-accent rounded-xl" onClick={() => setMobileMenuOpen(false)}>
                  로그인
                </Link>
                <Link href="/register" className="btn-primary w-full justify-center" onClick={() => setMobileMenuOpen(false)}>
                  무료로 시작하기
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ===== HERO SECTION ===== */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 mb-8 animate-fade-in">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI 기반 의료 개원 플랫폼
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-in-up">
              <span className="text-foreground">의료 개원의</span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                모든 것을 연결합니다
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in-up delay-100">
              의사, 약사, 영업사원, 건물주, 파트너사까지
              <br className="hidden sm:block" />
              의료 개원 생태계의 모든 참여자를 위한 통합 플랫폼
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in-up delay-200">
              <Link href="/simulate" className="btn-primary btn-lg group shadow-lg shadow-blue-500/25">
                무료 시뮬레이션 시작
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="#roles" className="btn-outline btn-lg">
                내 역할 선택하기
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground animate-fade-in delay-300">
              {stats.map((stat, i) => (
                <div key={i} className="flex items-center gap-2">
                  <stat.icon className="w-4 h-4 text-blue-500" />
                  <span className="font-semibold text-foreground">{stat.value}</span>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== ROLE SELECTION SECTION ===== */}
      <section id="roles" className="section bg-secondary/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-sm font-semibold text-blue-600 mb-3">맞춤 서비스</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              당신은 누구인가요?
            </h2>
            <p className="text-muted-foreground">
              역할에 맞는 최적화된 서비스를 경험하세요
            </p>
          </div>

          {/* Role Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {(Object.keys(roleServices) as UserRole[]).map((role) => {
              const service = roleServices[role]
              const Icon = service.icon
              const isActive = activeRole === role
              return (
                <button
                  key={role}
                  onClick={() => setActiveRole(role)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
                    isActive
                      ? `bg-gradient-to-r ${service.gradient} text-white shadow-lg`
                      : 'bg-card border border-border hover:border-foreground/20 text-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {service.title}
                </button>
              )
            })}
          </div>

          {/* Role Content */}
          <div className="bg-card rounded-3xl border border-border p-8 md:p-12 animate-fade-in">
            <div className="flex flex-col lg:flex-row gap-10">
              {/* Left - Info */}
              <div className="lg:w-1/3">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${roleServices[activeRole].gradient} text-white text-sm font-medium mb-6`}>
                  {(() => {
                    const Icon = roleServices[activeRole].icon
                    return <Icon className="w-4 h-4" />
                  })()}
                  {roleServices[activeRole].subtitle} {roleServices[activeRole].title}
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  {roleServices[activeRole].title}를 위한
                  <br />
                  맞춤 솔루션
                </h3>
                <p className="text-muted-foreground mb-6">
                  {activeRole === 'doctor' && '데이터 기반의 정확한 개원 분석으로 성공적인 개원을 시작하세요.'}
                  {activeRole === 'pharmacist' && '최적의 약국 입지를 찾고, 안전하게 양수/양도 매칭을 진행하세요.'}
                  {activeRole === 'sales' && '실시간 개원지 탐지와 의사 매칭으로 영업 효율을 극대화하세요.'}
                  {activeRole === 'landlord' && '의료 시설 적합 공간을 등록하고 우량 임차인을 찾으세요.'}
                  {activeRole === 'partner' && '개원 준비 의사에게 서비스를 제공하고 에스크로로 안전하게 거래하세요.'}
                </p>
                <Link
                  href={roleServices[activeRole].services[0].href}
                  className={`inline-flex items-center gap-2 text-sm font-medium bg-gradient-to-r ${roleServices[activeRole].gradient} bg-clip-text text-transparent`}
                >
                  지금 시작하기
                  <ArrowRight className="w-4 h-4 text-current" />
                </Link>
              </div>

              {/* Right - Services Grid */}
              <div className="lg:w-2/3">
                <div className="grid sm:grid-cols-2 gap-4">
                  {roleServices[activeRole].services.map((service, i) => {
                    const Icon = service.icon
                    return (
                      <Link
                        key={i}
                        href={service.href}
                        className="group p-6 bg-background rounded-2xl border border-border hover:border-foreground/20 hover:shadow-xl transition-all"
                      >
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${roleServices[activeRole].gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="font-semibold text-foreground mb-1 group-hover:text-blue-600 transition-colors">
                          {service.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {service.desc}
                        </p>
                        <div className="flex items-center gap-1 mt-4 text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                          바로가기
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CORE SERVICES SECTION ===== */}
      <section className="section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-blue-600 mb-3">핵심 서비스</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              세 가지 핵심 솔루션
            </h2>
            <p className="text-muted-foreground">
              의료 개원의 모든 단계를 지원하는 통합 플랫폼
            </p>
          </div>

          {/* Services Cards */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* OpenSim */}
            <Link href="/simulate" className="group relative">
              <div className="feature-card h-full overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-2xl -z-10" />
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/25">
                  <BarChart3 className="w-7 h-7 text-white" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="badge-info">AI 분석</span>
                  <span className="badge-default">3분 완료</span>
                </div>
                <h3 className="text-2xl font-bold mb-3 group-hover:text-blue-600 transition-colors">OpenSim</h3>
                <p className="text-muted-foreground mb-6">
                  주소와 진료과목만 입력하면 AI가 예상 매출, 비용, 손익분기점, 경쟁 현황을 3분 만에 분석해드립니다.
                </p>
                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Check className="w-4 h-4 text-green-500" />
                    예상 월 매출 분석
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Check className="w-4 h-4 text-green-500" />
                    손익분기점 예측
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Check className="w-4 h-4 text-green-500" />
                    경쟁 의원 분석
                  </li>
                </ul>
                <div className="flex items-center text-blue-600 font-medium group-hover:gap-2 transition-all">
                  시뮬레이션 시작
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            {/* SalesScanner */}
            <Link href="/prospects" className="group relative">
              <div className="feature-card h-full overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-green-500/20 to-transparent rounded-full blur-2xl -z-10" />
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-6 shadow-lg shadow-green-500/25">
                  <Target className="w-7 h-7 text-white" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="badge-success">실시간 알림</span>
                  <span className="badge-default">B2B</span>
                </div>
                <h3 className="text-2xl font-bold mb-3 group-hover:text-green-600 transition-colors">SalesScanner</h3>
                <p className="text-muted-foreground mb-6">
                  신축 건물, 폐업 병원, 공실 정보를 실시간으로 탐지하고 알림을 받으세요. 영업사원을 위한 필수 도구.
                </p>
                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Check className="w-4 h-4 text-green-500" />
                    실시간 폐업 탐지
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Check className="w-4 h-4 text-green-500" />
                    신축 건물 알림
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Check className="w-4 h-4 text-green-500" />
                    맞춤 알림 설정
                  </li>
                </ul>
                <div className="flex items-center text-green-600 font-medium group-hover:gap-2 transition-all">
                  개원지 탐색
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            {/* PharmMatch */}
            <Link href="/pharmacy-match" className="group relative">
              <div className="feature-card h-full overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-2xl -z-10" />
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/25">
                  <Pill className="w-7 h-7 text-white" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="badge-info">익명 매칭</span>
                  <span className="badge-default">안전 거래</span>
                </div>
                <h3 className="text-2xl font-bold mb-3 group-hover:text-purple-600 transition-colors">PharmMatch</h3>
                <p className="text-muted-foreground mb-6">
                  익명으로 약국 매물을 등록하고 관심 있는 약사와 매칭하세요. 독점 약국 자리를 안전하게 거래합니다.
                </p>
                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Check className="w-4 h-4 text-green-500" />
                    익명 매물 등록
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Check className="w-4 h-4 text-green-500" />
                    AI 매칭 추천
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Check className="w-4 h-4 text-green-500" />
                    단계별 정보 공개
                  </li>
                </ul>
                <div className="flex items-center text-purple-600 font-medium group-hover:gap-2 transition-all">
                  약국 자리 찾기
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="section-sm bg-foreground text-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-semibold text-blue-400 mb-3">프로세스</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
                4단계로 시작하는
                <br />
                스마트 개원
              </h2>
              <div className="space-y-6">
                {[
                  { step: '01', title: '역할 선택', desc: '의사, 약사, 영업사원, 건물주 중 선택' },
                  { step: '02', title: '정보 입력', desc: '주소, 진료과목 등 기본 정보 입력' },
                  { step: '03', title: 'AI 분석', desc: '빅데이터 기반 맞춤 분석 결과 확인' },
                  { step: '04', title: '매칭 연결', desc: '파트너, 매물, 영업사원과 연결' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center font-bold text-lg">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{item.title}</h4>
                      <p className="text-white/60 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-4 shadow-2xl">
                    <Play className="w-10 h-10 text-white ml-1" />
                  </div>
                  <p className="text-white/80 font-medium">서비스 소개 영상</p>
                  <p className="text-white/40 text-sm">2분 30초</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-sm font-semibold text-blue-600 mb-3">고객 후기</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              성공적인 개원의 파트너
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((item, i) => (
              <div key={i} className="p-6 md:p-8 bg-card rounded-2xl border border-border">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-foreground mb-6 leading-relaxed">"{item.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="avatar avatar-md bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                    {item.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{item.author}</p>
                    <p className="text-sm text-muted-foreground">{item.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="section-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 md:p-16">
            {/* Background Effects */}
            <div className="absolute inset-0 -z-10">
              <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            </div>

            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                지금 바로 시작하세요
              </h2>
              <p className="text-white/80 mb-8 max-w-xl mx-auto">
                첫 시뮬레이션은 무료입니다. 데이터 기반의 정확한 분석으로 성공적인 개원을 시작하세요.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/simulate" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-white/90 transition-colors shadow-lg">
                  무료 시뮬레이션
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/register" className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 text-white rounded-xl font-semibold hover:bg-white/10 transition-colors">
                  회원가입
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-16 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            {/* Brand */}
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
                <span className="font-bold text-xl">MediMatch</span>
              </Link>
              <p className="text-muted-foreground mb-6 max-w-sm">
                의료 개원 생태계의 모든 이해관계자를 연결하는 데이터 기반 통합 플랫폼
              </p>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                  <Globe className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 className="font-semibold mb-4">서비스</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/simulate" className="hover:text-foreground transition-colors">OpenSim</Link></li>
                <li><Link href="/prospects" className="hover:text-foreground transition-colors">SalesScanner</Link></li>
                <li><Link href="/pharmacy-match" className="hover:text-foreground transition-colors">PharmMatch</Link></li>
                <li><Link href="/map" className="hover:text-foreground transition-colors">지도 탐색</Link></li>
                <li><Link href="/partners" className="hover:text-foreground transition-colors">파트너 찾기</Link></li>
              </ul>
            </div>

            {/* For Users */}
            <div>
              <h4 className="font-semibold mb-4">사용자별</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/buildings" className="hover:text-foreground transition-colors">의사 - 매물 검색</Link></li>
                <li><Link href="/pharmacy-match" className="hover:text-foreground transition-colors">약사 - 약국 매칭</Link></li>
                <li><Link href="/sales" className="hover:text-foreground transition-colors">영업사원 센터</Link></li>
                <li><Link href="/landlord" className="hover:text-foreground transition-colors">건물주 매물 등록</Link></li>
                <li><Link href="/partners" className="hover:text-foreground transition-colors">파트너사</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold mb-4">고객지원</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/help" className="hover:text-foreground transition-colors">도움말</Link></li>
                <li><Link href="/faq" className="hover:text-foreground transition-colors">자주 묻는 질문</Link></li>
                <li><Link href="/contact" className="hover:text-foreground transition-colors">문의하기</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">이용약관</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">개인정보처리방침</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© 2025 MediMatch. All rights reserved.</p>
            <p>의료 개원의 모든 것을 연결합니다</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
