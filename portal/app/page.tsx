'use client'

import { useState } from 'react'

const services = [
  {
    id: 'hospital',
    title: '병원개원',
    subtitle: 'OPENING',
    tagline: 'Establishment',
    description: '입지 분석부터 인테리어까지\n원스톱 개원 솔루션',
    features: ['입지 분석', '인테리어', '인허가'],
    url: 'https://medi.brandplaton.com',
    image: 'https://medi.brandplaton.com/images/listings/building-01.jpg',
    number: '01',
  },
  {
    id: 'loan',
    title: '병원대출',
    subtitle: 'LOAN',
    tagline: 'Finance',
    description: '개원 자금 조달부터 금융 컨설팅까지\n맞춤형 금융 서비스',
    features: ['자금 대출', '금융 컨설팅', '맞춤 금리'],
    url: 'https://loan.brandplaton.com',
    image: 'https://loan.brandplaton.com/images/strategy-i5.jpg',
    number: '02',
  },
  {
    id: 'marketing',
    title: '플라톤마케팅',
    subtitle: 'MARKETING',
    tagline: 'Brand',
    description: '데이터 기반 마케팅 전략으로\n병원의 가치를 극대화합니다',
    features: ['브랜드 전략', '온라인 마케팅', '콘텐츠 제작'],
    url: 'https://www.brandplaton.com/',
    image: '/images/platon-marketing.jpg',
    number: '03',
  },
]

const GOLD = '#b8956a'

export default function PortalPage() {
  const [hoveredService, setHoveredService] = useState<string | null>(null)

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#fafaf7' }}>
      {/* Logo */}
      <div className="fixed top-10 left-1/2 -translate-x-1/2 z-50">
        <div className="relative flex flex-col items-center">
          <p className="text-[9px] tracking-[0.5em] mb-2 font-serif-en italic" style={{ color: GOLD }}>
            since 2024
          </p>
          <h1 className="text-[22px] md:text-[26px] font-light tracking-[0.18em]">
            <span className="text-stone-800">MEDI</span>
            <span className="font-medium" style={{ color: GOLD }}>PLATON</span>
          </h1>
          <div className="mt-3 w-12 h-px" style={{ background: `linear-gradient(to right, transparent, ${GOLD}80, transparent)` }} />
        </div>
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
                group relative flex-1 min-h-[33.33vh] md:min-h-screen
                flex flex-col items-center justify-center
                cursor-pointer overflow-hidden
                transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]
                ${isOtherHovered ? 'md:flex-[0.85]' : 'md:flex-1'}
              `}
              onMouseEnter={() => setHoveredService(service.id)}
              onMouseLeave={() => setHoveredService(null)}
            >
              {/* Giant background number — editorial */}
              <div
                className={`
                  absolute inset-0 flex items-center justify-center pointer-events-none
                  transition-all duration-700
                  ${isHovered ? 'opacity-0' : isOtherHovered ? 'opacity-[0.025]' : 'opacity-[0.05]'}
                `}
              >
                <span
                  className="font-serif-en font-light leading-none select-none"
                  style={{
                    fontSize: 'clamp(280px, 38vw, 560px)',
                    color: '#1a1a1a',
                  }}
                >
                  {service.number}
                </span>
              </div>

              {/* Background Image — full bleed fade on hover */}
              <div
                className={`
                  absolute inset-0 bg-cover bg-center
                  transition-all duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)]
                  ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}
                `}
                style={{ backgroundImage: `url(${service.image})` }}
              />

              {/* Image overlay — gradient for text legibility */}
              <div
                className={`
                  absolute inset-0 transition-opacity duration-700
                  ${isHovered ? 'opacity-100' : 'opacity-0'}
                `}
                style={{
                  background: 'linear-gradient(180deg, rgba(20,18,15,0.35) 0%, rgba(20,18,15,0.15) 35%, rgba(20,18,15,0.55) 100%)',
                }}
              />

              {/* Hairline divider */}
              {index < services.length - 1 && (
                <div
                  className="hidden md:block absolute top-[18%] right-0 bottom-[18%] w-px z-20"
                  style={{ background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.08), transparent)' }}
                />
              )}

              {/* Vertical subtitle label — left side editorial */}
              <div
                className={`
                  hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 z-20
                  flex-col items-center gap-3 transition-all duration-700
                  ${isHovered ? 'opacity-90' : 'opacity-50'}
                  ${isOtherHovered ? 'opacity-20' : ''}
                `}
                style={{ writingMode: 'vertical-rl' }}
              >
                <span
                  className="text-[10px] tracking-[0.5em] font-serif-en italic"
                  style={{ color: isHovered ? 'rgba(255,255,255,0.85)' : GOLD }}
                >
                  {service.tagline}
                </span>
                <div
                  className="w-px h-12"
                  style={{ background: isHovered ? 'rgba(255,255,255,0.4)' : `${GOLD}50` }}
                />
              </div>

              {/* Content */}
              <div className="relative z-10 text-center px-6 md:px-10 w-full max-w-md">
                {/* Subtitle EN */}
                <p
                  className={`
                    text-[10px] tracking-[0.55em] mb-8 font-light
                    transition-all duration-700
                    ${isHovered ? 'text-white/70' : ''}
                    ${isOtherHovered ? 'opacity-25' : 'opacity-100'}
                  `}
                  style={!isHovered ? { color: GOLD } : undefined}
                >
                  — {service.subtitle} —
                </p>

                {/* Title — Serif KR */}
                <h2
                  className={`
                    font-serif-kr font-light tracking-tight mb-6
                    transition-all duration-700
                    ${isHovered ? 'text-white' : 'text-stone-900'}
                    ${isOtherHovered ? 'opacity-30' : 'opacity-100'}
                  `}
                  style={{
                    fontSize: 'clamp(2.25rem, 3.2vw, 3rem)',
                    fontWeight: isHovered ? 400 : 300,
                  }}
                >
                  {service.title}
                </h2>

                {/* Hairline accent */}
                <div
                  className={`
                    h-px mx-auto transition-all duration-700
                    ${isHovered ? 'w-20 bg-white/40' : 'w-12'}
                    ${isOtherHovered ? 'opacity-20' : 'opacity-100'}
                  `}
                  style={!isHovered ? { background: `${GOLD}80` } : undefined}
                />

                {/* Slide-up content on hover */}
                <div
                  className={`
                    transition-all duration-700 ease-out overflow-hidden
                    ${isHovered ? 'max-h-72 opacity-100 mt-8' : 'max-h-0 opacity-0 mt-0'}
                  `}
                >
                  {/* Description */}
                  <p className="text-white/85 text-[13px] md:text-sm mb-8 leading-[2] font-light whitespace-pre-line max-w-xs mx-auto tracking-wide">
                    {service.description}
                  </p>

                  {/* Features — minimal */}
                  <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mb-9">
                    {service.features.map((feature, i) => (
                      <span
                        key={i}
                        className="text-white/60 text-[11px] tracking-[0.15em] font-light"
                      >
                        {feature}
                        {i < service.features.length - 1 && <span className="ml-5 text-white/25">·</span>}
                      </span>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="inline-flex items-center gap-4 text-white text-[12px] tracking-[0.3em] font-light">
                    <span className="font-serif-en italic text-[14px] normal-case" style={{ letterSpacing: '0.05em' }}>
                      Discover
                    </span>
                    <div className="w-10 h-px bg-white/60 transition-all duration-500 group-hover:w-16" />
                  </div>
                </div>
              </div>

              {/* Bottom hairline accent */}
              <div
                className={`
                  absolute bottom-0 left-1/2 -translate-x-1/2 h-px
                  transition-all duration-700
                  ${isHovered ? 'w-0 opacity-0' : 'w-24 opacity-100'}
                `}
                style={{ background: `${GOLD}40` }}
              />
            </a>
          )
        })}
      </div>

      {/* Bottom Tagline */}
      <div
        className={`
          fixed bottom-12 left-1/2 -translate-x-1/2 z-50
          transition-all duration-500
          ${hoveredService ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}
        `}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-6 h-px" style={{ background: `${GOLD}60` }} />
            <p className="font-serif-en italic text-[11px] tracking-[0.2em]" style={{ color: GOLD }}>
              The Partner for Medical Professionals
            </p>
            <div className="w-6 h-px" style={{ background: `${GOLD}60` }} />
          </div>
          <p className="text-stone-400 text-[10px] tracking-[0.35em] font-light">
            의료인의 성공적인 개원 파트너
          </p>
        </div>
      </div>

      {/* Pagination Dots */}
      <div
        className={`
          fixed bottom-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2
          transition-all duration-500
          ${hoveredService ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
      >
        {services.map((service) => (
          <div
            key={service.id}
            className={`
              transition-all duration-500
              ${hoveredService === service.id ? 'w-10 h-px bg-white' : 'w-4 h-px bg-white/40'}
            `}
          />
        ))}
      </div>

      {/* Decorative corners — hairline */}
      <div className="fixed top-8 left-8 w-10 h-10 pointer-events-none z-30">
        <div className="absolute top-0 left-0 w-full h-px" style={{ background: `${GOLD}40` }} />
        <div className="absolute top-0 left-0 w-px h-full" style={{ background: `${GOLD}40` }} />
      </div>
      <div className="fixed top-8 right-8 w-10 h-10 pointer-events-none z-30">
        <div className="absolute top-0 right-0 w-full h-px" style={{ background: `${GOLD}40` }} />
        <div className="absolute top-0 right-0 w-px h-full" style={{ background: `${GOLD}40` }} />
      </div>
      <div className="fixed bottom-8 left-8 w-10 h-10 pointer-events-none z-30">
        <div className="absolute bottom-0 left-0 w-full h-px" style={{ background: `${GOLD}40` }} />
        <div className="absolute bottom-0 left-0 w-px h-full" style={{ background: `${GOLD}40` }} />
      </div>
      <div className="fixed bottom-8 right-8 w-10 h-10 pointer-events-none z-30">
        <div className="absolute bottom-0 right-0 w-full h-px" style={{ background: `${GOLD}40` }} />
        <div className="absolute bottom-0 right-0 w-px h-full" style={{ background: `${GOLD}40` }} />
      </div>
    </div>
  )
}
