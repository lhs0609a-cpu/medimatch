'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  MapPin,
  Pill,
  Zap,
  Check,
  Menu,
  X,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react'

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">M</span>
              </div>
              <span className="font-semibold text-foreground">MediMatch</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {[
                { href: '/simulate', label: 'OpenSim' },
                { href: '/prospects', label: 'SalesScanner' },
                { href: '/pharmacy-match', label: 'PharmMatch' },
                { href: '/map', label: '지도' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="nav-link"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-2">
              <Link href="/login" className="btn-ghost">
                로그인
              </Link>
              <Link href="/register" className="btn-primary">
                시작하기
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden btn-icon"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <div className="px-4 py-3 space-y-1">
              {[
                { href: '/simulate', label: 'OpenSim' },
                { href: '/prospects', label: 'SalesScanner' },
                { href: '/pharmacy-match', label: 'PharmMatch' },
                { href: '/map', label: '지도' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-3 py-2.5 text-foreground hover:bg-accent rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-border mt-3 space-y-2">
                <Link href="/login" className="block px-3 py-2.5 text-muted-foreground hover:text-foreground">
                  로그인
                </Link>
                <Link href="/register" className="btn-primary w-full justify-center">
                  시작하기
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-sm text-primary mb-6 animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              AI 기반 의료 개원 분석
            </div>

            {/* Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground mb-6 animate-fade-in-up">
              데이터로 시작하는
              <br />
              <span className="text-primary">성공적인 개원</span>
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl animate-fade-in-up delay-100">
              주소만 입력하면 3분 안에 예상 매출, 경쟁 현황, 손익분기점까지.
              AI가 분석해드립니다.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up delay-200">
              <Link href="/simulate" className="btn-primary btn-lg group">
                무료로 시작하기
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link href="#features" className="btn-outline btn-lg">
                자세히 알아보기
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-6 mt-12 text-sm text-muted-foreground animate-fade-in delay-300">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>무료 체험</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>3분 내 분석</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>85%+ 정확도</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="section bg-secondary/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Section Header */}
          <div className="max-w-2xl mb-16">
            <p className="text-sm font-medium text-primary mb-3">서비스</p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
              하나의 플랫폼,
              <br />
              <span className="text-primary">세 가지 솔루션</span>
            </h2>
            <p className="text-muted-foreground">
              의사, 약사, 영업사원을 위한 맞춤형 서비스를 제공합니다.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* OpenSim */}
            <Link href="/simulate" className="group">
              <div className="feature-card h-full">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">OpenSim</h3>
                <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                  개원 시뮬레이터. 주소와 진료과목만 입력하면 예상 매출, 비용, 손익분기점을 분석합니다.
                </p>
                <div className="flex items-center gap-2 mb-6">
                  <span className="badge-info">AI 분석</span>
                  <span className="badge-default">3분 완료</span>
                </div>
                <div className="flex items-center text-sm font-medium text-primary group-hover:gap-1 transition-all">
                  시뮬레이션 시작
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>

            {/* SalesScanner */}
            <Link href="/prospects" className="group">
              <div className="feature-card h-full">
                <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">SalesScanner</h3>
                <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                  개원지 탐지 시스템. 신축 건물, 폐업 공실을 실시간으로 감지하고 알림을 받으세요.
                </p>
                <div className="flex items-center gap-2 mb-6">
                  <span className="badge-success">실시간 알림</span>
                  <span className="badge-default">B2B</span>
                </div>
                <div className="flex items-center text-sm font-medium text-primary group-hover:gap-1 transition-all">
                  개원지 탐색
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>

            {/* PharmMatch */}
            <Link href="/pharmacy-match" className="group">
              <div className="feature-card h-full">
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                  <Pill className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">PharmMatch</h3>
                <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                  약국 매칭 플랫폼. 독점 약국 자리에 입찰하고 최적의 개국 위치를 찾으세요.
                </p>
                <div className="flex items-center gap-2 mb-6">
                  <span className="badge-info">입찰 시스템</span>
                  <span className="badge-default">매칭</span>
                </div>
                <div className="flex items-center text-sm font-medium text-primary group-hover:gap-1 transition-all">
                  약국 자리 찾기
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section-sm border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '50,000+', label: '등록 의료기관' },
              { value: '1,200+', label: '매칭 성사' },
              { value: '85%', label: '예측 정확도' },
              { value: '3분', label: '평균 분석 시간' },
            ].map((stat, index) => (
              <div key={index} className="stat">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-16">
            <p className="text-sm font-medium text-muted-foreground mb-3">프로세스</p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
              간단한 4단계로 시작하세요
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: '주소 입력', desc: '개원 예정 주소와 진료과목을 입력합니다' },
              { step: '02', title: 'AI 분석', desc: '공공데이터와 AI가 상권, 경쟁, 인구를 분석합니다' },
              { step: '03', title: '결과 확인', desc: '예상 매출, 비용, ROI를 한눈에 확인합니다' },
              { step: '04', title: '매물 연결', desc: '조건에 맞는 실제 매물과 바로 연결됩니다' },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="text-5xl font-bold text-border mb-4">{item.step}</div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-sm bg-primary text-primary-foreground">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">
                지금 바로 시작하세요
              </h2>
              <p className="text-primary-foreground/80">
                첫 시뮬레이션은 무료입니다. 데이터 기반의 정확한 분석을 경험해보세요.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/simulate"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium bg-white text-primary rounded-lg hover:bg-white/90 transition-colors"
              >
                무료 시뮬레이션
                <ArrowUpRight className="w-4 h-4" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium border border-white/30 rounded-lg hover:bg-white/10 transition-colors"
              >
                회원가입
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">M</span>
                </div>
                <span className="font-semibold">MediMatch</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                의료 개원 통합 솔루션
                <br />
                데이터로 시작하는 성공적인 개원
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-4">서비스</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/simulate" className="hover:text-foreground transition-colors">OpenSim</Link></li>
                <li><Link href="/prospects" className="hover:text-foreground transition-colors">SalesScanner</Link></li>
                <li><Link href="/pharmacy-match" className="hover:text-foreground transition-colors">PharmMatch</Link></li>
                <li><Link href="/map" className="hover:text-foreground transition-colors">지도</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-4">고객지원</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/help" className="hover:text-foreground transition-colors">도움말</Link></li>
                <li><Link href="/faq" className="hover:text-foreground transition-colors">자주 묻는 질문</Link></li>
                <li><Link href="/contact" className="hover:text-foreground transition-colors">문의하기</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-4">법적고지</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/terms" className="hover:text-foreground transition-colors">이용약관</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">개인정보처리방침</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border text-sm text-muted-foreground text-center">
            © 2025 MediMatch. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
