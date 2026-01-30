'use client'

import { useState } from 'react'

const services = [
  {
    id: 'marketing',
    title: '플라톤마케팅',
    subtitle: 'MARKETING',
    headline: '병원 브랜딩의 새로운 기준',
    description: '데이터 기반 마케팅 전략으로\n병원의 가치를 극대화합니다',
    features: ['브랜드 전략 수립', '온라인 마케팅', '콘텐츠 제작'],
    url: 'https://www.brandplaton.com/',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'hospital',
    title: '병원개원',
    subtitle: 'OPENING',
    headline: '성공적인 개원의 시작',
    description: '입지 분석부터 인테리어, 인허가까지\n원스톱 개원 솔루션을 제공합니다',
    features: ['입지 분석', '인테리어 설계', '인허가 대행'],
    url: 'https://medimatch-sooty-two-82.vercel.app/',
    image: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'loan',
    title: '병원대출',
    subtitle: 'LOAN',
    headline: '최적의 금융 솔루션',
    description: '개원 자금 조달부터 금융 컨설팅까지\n맞춤형 금융 서비스를 제공합니다',
    features: ['개원 자금 대출', '금융 컨설팅', '맞춤 금리 제안'],
    url: 'https://pgandplt.vercel.app/',
    image: 'https://images.unsplash.com/photo-1560472355-536de3962603?auto=format&fit=crop&w=1920&q=80',
  },
]

export default function PortalPage() {
  const [hoveredService, setHoveredService] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Images - Preloaded */}
      {services.map((service) => (
        <div
          key={`bg-${service.id}`}
          className={`
            fixed inset-0 z-0
            transition-opacity duration-700 ease-out
            ${hoveredService === service.id ? 'opacity-100' : 'opacity-0'}
          `}
        >
          <div
            className="absolute inset-0 bg-cover bg-center scale-105"
            style={{ backgroundImage: `url(${service.image})` }}
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
      ))}

      {/* Default White Background */}
      <div
        className={`
          fixed inset-0 z-0 bg-white
          transition-opacity duration-500
          ${hoveredService ? 'opacity-0' : 'opacity-100'}
        `}
      />

      {/* Logo */}
      <div className={`
        fixed top-8 left-1/2 -translate-x-1/2 z-50
        transition-all duration-500
      `}>
        <h1 className={`
          text-2xl md:text-3xl font-bold tracking-tight
          transition-colors duration-500
          ${hoveredService ? 'text-white' : 'text-gray-900'}
        `}>
          MEDI<span className={hoveredService ? 'text-white' : 'text-[#27baa2]'}>PLATON</span>
        </h1>
      </div>

      {/* Service Sections */}
      <div className="relative z-10 min-h-screen flex flex-col md:flex-row">
        {services.map((service, index) => {
          const isHovered = hoveredService === service.id
          const isOtherHovered = hoveredService !== null && !isHovered

          return (
            <a
              key={service.id}
              href={service.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`
                relative flex-1 min-h-[33.33vh] md:min-h-screen
                flex flex-col items-center justify-center
                cursor-pointer
                transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]
                ${isHovered ? 'md:flex-[3]' : isOtherHovered ? 'md:flex-[0.3] opacity-0' : 'md:flex-1'}
              `}
              onMouseEnter={() => setHoveredService(service.id)}
              onMouseLeave={() => setHoveredService(null)}
            >
              {/* Divider Lines */}
              {index < services.length - 1 && (
                <div className={`
                  absolute top-0 right-0 bottom-0 w-px
                  transition-opacity duration-500
                  ${hoveredService ? 'opacity-0' : 'opacity-100'}
                  bg-gray-200
                `} />
              )}

              {/* Default State */}
              <div className={`
                text-center px-8
                transition-all duration-500
                ${isHovered ? 'opacity-0 scale-90' : isOtherHovered ? 'opacity-0' : 'opacity-100 scale-100'}
              `}>
                <p className="text-gray-400 text-xs tracking-[0.3em] mb-3">
                  {service.subtitle}
                </p>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800">
                  {service.title}
                </h2>
              </div>

              {/* Hover State - Full Content */}
              <div className={`
                absolute inset-0 flex flex-col items-center justify-center
                px-8 text-center
                transition-all duration-700
                ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}
              `}>
                <div className="max-w-2xl">
                  {/* Subtitle */}
                  <p className="text-white/70 text-xs tracking-[0.4em] mb-4">
                    {service.subtitle}
                  </p>

                  {/* Title */}
                  <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
                    {service.title}
                  </h2>

                  {/* Headline */}
                  <p className="text-2xl md:text-3xl text-white/90 font-light mb-6">
                    {service.headline}
                  </p>

                  {/* Divider */}
                  <div className="w-16 h-px bg-white/40 mx-auto my-8" />

                  {/* Description */}
                  <p className="text-white/80 text-lg md:text-xl whitespace-pre-line leading-relaxed mb-8">
                    {service.description}
                  </p>

                  {/* Features */}
                  <div className="flex flex-wrap justify-center gap-4 mb-10">
                    {service.features.map((feature, i) => (
                      <span
                        key={i}
                        className="px-4 py-2 border border-white/30 text-white/90 text-sm rounded-full"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <div className="inline-flex items-center gap-3 px-8 py-4 bg-white text-gray-900 text-sm font-semibold hover:bg-[#27baa2] hover:text-white transition-all duration-300 group">
                    <span>사이트 방문하기</span>
                    <svg
                      className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </div>
            </a>
          )
        })}
      </div>

      {/* Bottom Tagline */}
      <div className={`
        fixed bottom-8 left-1/2 -translate-x-1/2 z-50
        transition-all duration-500
        ${hoveredService ? 'opacity-0' : 'opacity-100'}
      `}>
        <p className="text-gray-400 text-xs tracking-[0.15em]">
          의료인의 성공적인 개원 파트너
        </p>
      </div>
    </div>
  )
}
