'use client'

import { Building2, TrendingUp, Wallet, ArrowRight, Phone, Mail } from 'lucide-react'

const services = [
  {
    id: 'marketing',
    title: '플라톤마케팅',
    subtitle: 'Brand Platon',
    description: '병원 브랜딩부터 온라인 마케팅까지\n체계적인 홍보 전략을 제공합니다',
    features: ['브랜드 아이덴티티 구축', '온라인 마케팅 전략', 'SNS 채널 운영', '광고 캠페인 관리'],
    url: 'https://www.brandplaton.com/',
    gradient: 'from-violet-500 to-purple-600',
    bgGradient: 'from-violet-50 to-purple-50',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    icon: TrendingUp,
  },
  {
    id: 'hospital',
    title: '메디플라톤 병원개원',
    subtitle: 'Hospital Opening',
    description: '입지 분석부터 인테리어, 인허가까지\n원스톱 개원 솔루션을 제공합니다',
    features: ['상권/입지 분석', '인테리어 설계', '의료장비 컨설팅', '인허가 대행'],
    url: 'https://medimatch-sooty-two-82.vercel.app/',
    gradient: 'from-sky-500 to-blue-600',
    bgGradient: 'from-sky-50 to-blue-50',
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
    icon: Building2,
  },
  {
    id: 'loan',
    title: '메디플라톤 병원대출',
    subtitle: 'Medical Loan',
    description: '개원 자금 조달부터 금융 컨설팅까지\n최적의 금융 솔루션을 제안합니다',
    features: ['개원자금 대출', '의료장비 리스', '운영자금 지원', '금융 컨설팅'],
    url: 'https://pgandplt.vercel.app/',
    gradient: 'from-emerald-500 to-teal-600',
    bgGradient: 'from-emerald-50 to-teal-50',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    icon: Wallet,
  },
]

export default function PortalPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* Gradient Orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 sm:py-32">
          {/* Logo / Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-sm text-white/80">의료인의 성공 파트너</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
              MEDI<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">PLATON</span>
            </h1>

            <p className="text-xl sm:text-2xl text-slate-300 mb-4">
              메디플라톤
            </p>

            <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              병원 개원의 A to Z<br />
              마케팅, 개원 컨설팅, 금융까지 한 번에
            </p>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 float-animation">
            <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
              <div className="w-1 h-2 bg-white/50 rounded-full animate-bounce" />
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              원하시는 서비스를 선택하세요
            </h2>
            <p className="text-lg text-slate-600">
              메디플라톤의 전문 서비스로 성공적인 개원을 시작하세요
            </p>
          </div>

          {/* Service Cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service) => {
              const IconComponent = service.icon
              return (
                <a
                  key={service.id}
                  href={service.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="service-card group block"
                >
                  <div className={`h-full rounded-2xl bg-gradient-to-br ${service.bgGradient} p-1`}>
                    <div className="h-full bg-white rounded-xl p-8 flex flex-col">
                      {/* Icon */}
                      <div className={`w-16 h-16 ${service.iconBg} rounded-2xl flex items-center justify-center mb-6 service-icon`}>
                        <IconComponent className={`w-8 h-8 ${service.iconColor}`} />
                      </div>

                      {/* Title */}
                      <h3 className="text-2xl font-bold text-slate-900 mb-1">
                        {service.title}
                      </h3>
                      <p className="text-sm text-slate-400 mb-4 font-medium">
                        {service.subtitle}
                      </p>

                      {/* Description */}
                      <p className="text-slate-600 mb-6 whitespace-pre-line leading-relaxed">
                        {service.description}
                      </p>

                      {/* Features */}
                      <ul className="space-y-2 mb-8 flex-1">
                        {service.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                            <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${service.gradient}`} />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      {/* CTA Button */}
                      <div className={`flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r ${service.gradient} text-white font-semibold`}>
                        <span>바로가기</span>
                        <ArrowRight className="w-4 h-4 service-arrow" />
                      </div>
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '500+', label: '개원 성공 사례' },
              { value: '98%', label: '고객 만족도' },
              { value: '10년+', label: '업계 경력' },
              { value: '50+', label: '전문 파트너사' },
            ].map((stat, idx) => (
              <div key={idx}>
                <div className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-500">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-4 sm:px-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            개원 상담이 필요하신가요?
          </h2>
          <p className="text-slate-400 mb-8">
            메디플라톤 전문 상담사가 친절하게 안내해드립니다
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="tel:1588-0000"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 rounded-xl font-semibold hover:bg-slate-100 transition-colors"
            >
              <Phone className="w-5 h-5" />
              전화 상담
            </a>
            <a
              href="mailto:contact@mediplaton.com"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors border border-white/20"
            >
              <Mail className="w-5 h-5" />
              이메일 문의
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 bg-slate-900 text-slate-400 text-sm">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-semibold text-white">
            MEDIPLATON
          </div>
          <div className="text-center sm:text-left">
            <p>&copy; 2024 메디플라톤. All rights reserved.</p>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">이용약관</a>
            <a href="#" className="hover:text-white transition-colors">개인정보처리방침</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
