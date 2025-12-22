'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  ArrowRight,
  Sparkles,
  TrendingUp,
  MapPin,
  Pill,
  BarChart3,
  Zap,
  Shield,
  Clock,
  ChevronRight,
  Play,
  Star,
  Menu,
  X
} from 'lucide-react'

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/50 transition-shadow">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                MediMatch
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {[
                { href: '/simulate', label: 'OpenSim' },
                { href: '/prospects', label: 'SalesScanner' },
                { href: '/pharmacy', label: 'PharmMatch' },
                { href: '/map', label: '지도' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-violet-600 rounded-lg hover:bg-violet-50 transition-all"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Auth Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              <Link href="/login" className="btn-ghost">
                로그인
              </Link>
              <Link href="/register" className="btn-primary">
                무료 시작
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden glass border-t border-gray-100">
            <div className="px-4 py-4 space-y-2">
              {[
                { href: '/simulate', label: 'OpenSim' },
                { href: '/prospects', label: 'SalesScanner' },
                { href: '/pharmacy', label: 'PharmMatch' },
                { href: '/map', label: '지도' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-4 py-3 text-gray-700 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-gray-100 space-y-2">
                <Link href="/login" className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl">
                  로그인
                </Link>
                <Link href="/register" className="block btn-primary w-full text-center">
                  무료 시작하기
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 lg:pt-40 pb-20 lg:pb-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 gradient-bg-soft" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-violet-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-fuchsia-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '4s' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 text-violet-700 text-sm font-medium mb-8 animate-fade-in">
              <Sparkles className="w-4 h-4" />
              <span>AI 기반 개원 분석 플랫폼</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 animate-slide-up">
              의료 개원,
              <br />
              <span className="text-gradient">데이터로 시작하세요</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
              3분이면 충분합니다. 주소만 입력하면 예상 매출, 경쟁 현황,
              <br className="hidden sm:block" />
              손익분기점까지 AI가 분석해드립니다.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link href="/simulate" className="btn-primary text-base px-8 py-4 group">
                <Zap className="w-5 h-5 mr-2" />
                무료 시뮬레이션 시작
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="btn-secondary text-base px-8 py-4 group">
                <Play className="w-5 h-5 mr-2" />
                데모 영상 보기
              </button>
            </div>

            {/* Trust Badges */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-500" />
                <span>의료 데이터 보안 인증</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-violet-500" />
                <span>3분 내 분석 완료</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                <span>정확도 85%+</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="text-violet-600 font-semibold text-sm tracking-wide uppercase">
              Services
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-3 mb-4">
              하나의 플랫폼, 세 가지 솔루션
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              의사, 약사, 영업사원을 위한 맞춤형 서비스를 제공합니다
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {/* OpenSim */}
            <Link href="/simulate" className="group">
              <div className="relative h-full p-8 rounded-3xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100/50 hover:border-violet-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/10 to-transparent rounded-full blur-2xl" />

                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mb-6 shadow-lg shadow-violet-500/30">
                    <BarChart3 className="w-7 h-7 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-3">OpenSim</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    개원 시뮬레이터. 주소와 진료과목만 입력하면 예상 매출, 비용, 손익분기점을 분석합니다.
                  </p>

                  <div className="flex items-center gap-4 mb-6">
                    <span className="badge badge-primary">AI 분석</span>
                    <span className="badge bg-gray-100 text-gray-600">3분 완료</span>
                  </div>

                  <div className="flex items-center text-violet-600 font-semibold group-hover:gap-2 transition-all">
                    시뮬레이션 시작
                    <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>

            {/* SalesScanner */}
            <Link href="/prospects" className="group">
              <div className="relative h-full p-8 rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100/50 hover:border-emerald-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-2xl" />

                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/30">
                    <MapPin className="w-7 h-7 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-3">SalesScanner</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    개원지 탐지 시스템. 신축 건물, 폐업 공실을 실시간으로 감지하고 알림을 받으세요.
                  </p>

                  <div className="flex items-center gap-4 mb-6">
                    <span className="badge badge-success">실시간 알림</span>
                    <span className="badge bg-gray-100 text-gray-600">B2B</span>
                  </div>

                  <div className="flex items-center text-emerald-600 font-semibold group-hover:gap-2 transition-all">
                    개원지 탐색
                    <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>

            {/* PharmMatch */}
            <Link href="/pharmacy" className="group">
              <div className="relative h-full p-8 rounded-3xl bg-gradient-to-br from-fuchsia-50 to-pink-50 border border-fuchsia-100/50 hover:border-fuchsia-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-fuchsia-500/10 to-transparent rounded-full blur-2xl" />

                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-600 flex items-center justify-center mb-6 shadow-lg shadow-fuchsia-500/30">
                    <Pill className="w-7 h-7 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-3">PharmMatch</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    약국 매칭 플랫폼. 독점 약국 자리에 입찰하고 최적의 개국 위치를 찾으세요.
                  </p>

                  <div className="flex items-center gap-4 mb-6">
                    <span className="badge bg-fuchsia-100 text-fuchsia-700">입찰 시스템</span>
                    <span className="badge bg-gray-100 text-gray-600">매칭</span>
                  </div>

                  <div className="flex items-center text-fuchsia-600 font-semibold group-hover:gap-2 transition-all">
                    약국 자리 찾기
                    <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 lg:py-24 bg-gray-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-mesh opacity-5" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {[
              { value: '50,000+', label: '등록 의료기관', color: 'text-violet-400' },
              { value: '1,200+', label: '매칭 성사', color: 'text-emerald-400' },
              { value: '85%', label: '예측 정확도', color: 'text-cyan-400' },
              { value: '3분', label: '분석 완료', color: 'text-fuchsia-400' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`text-4xl lg:text-5xl font-bold ${stat.color} mb-2`}>
                  {stat.value}
                </div>
                <div className="text-gray-400 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-violet-600 font-semibold text-sm tracking-wide uppercase">
              How it works
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-3 mb-4">
              간단한 4단계로 시작하세요
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: '주소 입력', desc: '개원 예정 주소와 진료과목을 입력합니다', icon: MapPin },
              { step: '02', title: 'AI 분석', desc: '공공데이터와 AI가 상권, 경쟁, 인구를 분석합니다', icon: Sparkles },
              { step: '03', title: '결과 확인', desc: '예상 매출, 비용, ROI를 한눈에 확인합니다', icon: TrendingUp },
              { step: '04', title: '매물 연결', desc: '조건에 맞는 실제 매물과 바로 연결됩니다', icon: Zap },
            ].map((item, index) => (
              <div key={index} className="relative">
                {index < 3 && (
                  <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-violet-200 to-transparent" />
                )}
                <div className="relative bg-white rounded-2xl p-6 shadow-soft hover:shadow-soft-xl transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-violet-600" />
                  </div>
                  <span className="text-violet-600 font-bold text-sm">{item.step}</span>
                  <h3 className="text-lg font-bold text-gray-900 mt-2 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700" />
        <div className="absolute inset-0 bg-gradient-mesh opacity-10" />

        {/* Animated Blobs */}
        <div className="absolute top-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 right-10 w-60 h-60 bg-white/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
            3분이면 충분합니다. 데이터 기반의 정확한 개원 분석을 경험해보세요.
            첫 시뮬레이션은 무료입니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/simulate"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-violet-600 bg-white rounded-xl hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
            >
              <Zap className="w-5 h-5 mr-2" />
              무료 시뮬레이션 시작
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white border-2 border-white/30 rounded-xl hover:bg-white/10 transition-all"
            >
              회원가입
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <Link href="/" className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">MediMatch</span>
              </Link>
              <p className="text-sm leading-relaxed">
                의료 개원 통합 솔루션<br />
                데이터로 시작하는 성공적인 개원
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">서비스</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/simulate" className="hover:text-white transition">OpenSim</Link></li>
                <li><Link href="/prospects" className="hover:text-white transition">SalesScanner</Link></li>
                <li><Link href="/pharmacy" className="hover:text-white transition">PharmMatch</Link></li>
                <li><Link href="/map" className="hover:text-white transition">지도</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">고객지원</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/help" className="hover:text-white transition">도움말</Link></li>
                <li><Link href="/faq" className="hover:text-white transition">자주 묻는 질문</Link></li>
                <li><Link href="/contact" className="hover:text-white transition">문의하기</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">법적고지</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/terms" className="hover:text-white transition">이용약관</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition">개인정보처리방침</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-sm text-center">
            © 2025 MediMatch. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
