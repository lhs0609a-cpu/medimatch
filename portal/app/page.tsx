'use client'

import { useState } from 'react'

const services = [
  {
    id: 'marketing',
    title: '플라톤마케팅',
    subtitle: 'MARKETING',
    description: '데이터 기반 마케팅 전략으로 병원의 가치를 극대화합니다',
    features: ['브랜드 전략', '온라인 마케팅', '콘텐츠 제작'],
    url: 'https://www.brandplaton.com/',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'hospital',
    title: '병원개원',
    subtitle: 'OPENING',
    description: '입지 분석부터 인테리어까지 원스톱 개원 솔루션',
    features: ['입지 분석', '인테리어', '인허가'],
    url: 'https://medimatch-sooty-two-82.vercel.app/',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'loan',
    title: '병원대출',
    subtitle: 'LOAN',
    description: '개원 자금 조달부터 금융 컨설팅까지 맞춤 서비스',
    features: ['자금 대출', '금융 컨설팅', '맞춤 금리'],
    url: 'https://pgandplt.vercel.app/',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1920&q=80',
  },
]

export default function PortalPage() {
  const [hoveredService, setHoveredService] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Logo */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          <span className="text-gray-900">MEDI</span>
          <span className="text-[#27baa2]">PLATON</span>
        </h1>
      </div>

      {/* Service Sections */}
      <div className="min-h-screen flex flex-col md:flex-row">
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
                cursor-pointer overflow-hidden
                transition-all duration-500 ease-out
                ${isHovered ? 'md:flex-[1.5]' : isOtherHovered ? 'md:flex-[0.75]' : 'md:flex-1'}
              `}
              onMouseEnter={() => setHoveredService(service.id)}
              onMouseLeave={() => setHoveredService(null)}
            >
              {/* Background Image - Fades in on hover */}
              <div
                className={`
                  absolute inset-0 bg-cover bg-center
                  transition-all duration-700 ease-out
                  ${isHovered ? 'opacity-100 scale-105' : 'opacity-0 scale-100'}
                `}
                style={{ backgroundImage: `url(${service.image})` }}
              />

              {/* Overlay */}
              <div
                className={`
                  absolute inset-0 transition-all duration-500
                  ${isHovered
                    ? 'bg-gradient-to-t from-black/70 via-black/30 to-black/20'
                    : isOtherHovered
                      ? 'bg-gray-100/80'
                      : 'bg-transparent'}
                `}
              />

              {/* Divider */}
              {index < services.length - 1 && (
                <div className="absolute top-0 right-0 bottom-0 w-px bg-gray-200 z-10" />
              )}

              {/* Content */}
              <div className="relative z-10 text-center px-6 md:px-8 w-full">
                {/* Subtitle */}
                <p className={`
                  text-xs tracking-[0.3em] mb-3
                  transition-all duration-500
                  ${isHovered ? 'text-white/70' : 'text-gray-400'}
                  ${isOtherHovered ? 'opacity-40' : 'opacity-100'}
                `}>
                  {service.subtitle}
                </p>

                {/* Title */}
                <h2 className={`
                  text-2xl md:text-3xl lg:text-4xl font-bold mb-4
                  transition-all duration-500
                  ${isHovered ? 'text-white' : 'text-gray-800'}
                  ${isOtherHovered ? 'opacity-40' : 'opacity-100'}
                `}>
                  {service.title}
                </h2>

                {/* Slide-up content on hover */}
                <div className={`
                  transition-all duration-500 ease-out overflow-hidden
                  ${isHovered ? 'max-h-64 opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'}
                `}>
                  {/* Divider line */}
                  <div className="w-12 h-px bg-white/40 mx-auto mb-4" />

                  {/* Description */}
                  <p className="text-white/80 text-sm md:text-base mb-5 leading-relaxed max-w-xs mx-auto">
                    {service.description}
                  </p>

                  {/* Features */}
                  <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {service.features.map((feature, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 bg-white/15 backdrop-blur-sm text-white/90 text-xs rounded-full"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="inline-flex items-center gap-2 text-white text-sm font-medium group">
                    <span>바로가기</span>
                    <svg
                      className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Navigation hint - arrows on sides */}
              {isHovered && (
                <>
                  {index > 0 && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                      </svg>
                    </div>
                  )}
                  {index < services.length - 1 && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </>
              )}
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

      {/* Pagination Dots */}
      <div className={`
        fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2
        transition-all duration-500
        ${hoveredService ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}>
        {services.map((service) => (
          <div
            key={service.id}
            className={`
              h-1.5 rounded-full transition-all duration-300
              ${hoveredService === service.id ? 'bg-white w-6' : 'bg-white/40 w-1.5'}
            `}
          />
        ))}
      </div>
    </div>
  )
}
