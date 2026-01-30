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
    image: '/images/platon-marketing.jpg',
    number: '01',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: 'hospital',
    title: '병원개원',
    subtitle: 'OPENING',
    description: '입지 분석부터 인테리어까지 원스톱 개원 솔루션',
    features: ['입지 분석', '인테리어', '인허가'],
    url: 'https://medimatch-sooty-two-82.vercel.app/',
    image: 'https://medimatch-sooty-two-82.vercel.app/images/listings/building-01.jpg',
    number: '02',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: 'loan',
    title: '병원대출',
    subtitle: 'LOAN',
    description: '개원 자금 조달부터 금융 컨설팅까지 맞춤 서비스',
    features: ['자금 대출', '금융 컨설팅', '맞춤 금리'],
    url: 'https://pgandplt.vercel.app/',
    image: 'https://pgandplt.vercel.app/images/strategy-i5.jpg',
    number: '03',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
]

export default function PortalPage() {
  const [hoveredService, setHoveredService] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Logo */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50">
        <div className="relative">
          <h1 className="text-2xl md:text-3xl font-light tracking-[0.1em]">
            <span className="text-gray-800">MEDI</span>
            <span className="text-[#27baa2] font-medium">PLATON</span>
          </h1>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-px bg-gradient-to-r from-transparent via-[#27baa2]/50 to-transparent" />
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
                relative flex-1 min-h-[33.33vh] md:min-h-screen
                flex flex-col items-center justify-center
                cursor-pointer overflow-hidden
                transition-all duration-700 ease-out
                ${isHovered ? 'md:flex-[1.5]' : isOtherHovered ? 'md:flex-[0.75]' : 'md:flex-1'}
              `}
              onMouseEnter={() => setHoveredService(service.id)}
              onMouseLeave={() => setHoveredService(null)}
            >
              {/* Subtle gradient background per section */}
              <div className={`
                absolute inset-0 transition-all duration-700
                ${index === 0 ? 'bg-gradient-to-b from-gray-50/50 to-transparent' : ''}
                ${index === 1 ? 'bg-gradient-to-b from-white to-gray-50/30' : ''}
                ${index === 2 ? 'bg-gradient-to-b from-gray-50/30 to-gray-100/50' : ''}
              `} />

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
                      ? 'bg-gray-200/40'
                      : 'bg-transparent'}
                `}
              />

              {/* Elegant Divider */}
              {index < services.length - 1 && (
                <div className="absolute top-[15%] right-0 bottom-[15%] w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent z-10" />
              )}

              {/* Content */}
              <div className="relative z-10 text-center px-6 md:px-8 w-full">
                {/* Number - visible when not hovered */}
                <div className={`
                  transition-all duration-500 mb-6
                  ${isHovered ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'}
                  ${isOtherHovered ? 'opacity-20' : ''}
                `}>
                  <span className="text-5xl md:text-6xl font-extralight text-gray-200 tracking-wider">
                    {service.number}
                  </span>
                </div>

                {/* Icon - visible when not hovered */}
                <div className={`
                  transition-all duration-500 mb-6
                  ${isHovered ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}
                  ${isOtherHovered ? 'opacity-30' : ''}
                `}>
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-gray-200 text-gray-400">
                    {service.icon}
                  </div>
                </div>

                {/* Subtitle */}
                <p className={`
                  text-[10px] tracking-[0.4em] mb-3 font-medium
                  transition-all duration-500
                  ${isHovered ? 'text-white/60' : 'text-[#27baa2]'}
                  ${isOtherHovered ? 'opacity-30' : 'opacity-100'}
                `}>
                  {service.subtitle}
                </p>

                {/* Title */}
                <h2 className={`
                  text-2xl md:text-3xl lg:text-4xl font-light tracking-wide mb-4
                  transition-all duration-500
                  ${isHovered ? 'text-white font-normal' : 'text-gray-800'}
                  ${isOtherHovered ? 'opacity-30' : 'opacity-100'}
                `}>
                  {service.title}
                </h2>

                {/* Decorative line - visible when not hovered */}
                <div className={`
                  w-12 h-px mx-auto transition-all duration-500
                  ${isHovered ? 'opacity-0 w-0' : 'opacity-100'}
                  ${isOtherHovered ? 'opacity-20' : ''}
                  bg-gradient-to-r from-transparent via-gray-300 to-transparent
                `} />

                {/* Slide-up content on hover */}
                <div className={`
                  transition-all duration-500 ease-out overflow-hidden
                  ${isHovered ? 'max-h-64 opacity-100 mt-6' : 'max-h-0 opacity-0 mt-0'}
                `}>
                  {/* Divider line */}
                  <div className="w-16 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto mb-5" />

                  {/* Description */}
                  <p className="text-white/80 text-sm md:text-base mb-6 leading-relaxed max-w-xs mx-auto font-light">
                    {service.description}
                  </p>

                  {/* Features */}
                  <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {service.features.map((feature, i) => (
                      <span
                        key={i}
                        className="px-4 py-1.5 bg-white/10 backdrop-blur-sm text-white/90 text-xs rounded-full border border-white/20"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="inline-flex items-center gap-3 text-white text-sm font-light tracking-wide group">
                    <span>바로가기</span>
                    <div className="w-8 h-px bg-white/50 group-hover:w-12 transition-all duration-300" />
                    <svg
                      className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Bottom accent line per section */}
              <div className={`
                absolute bottom-0 left-0 right-0 h-px
                transition-all duration-500
                ${isHovered ? 'opacity-0' : 'opacity-100'}
                bg-gradient-to-r from-transparent via-gray-200 to-transparent
              `} />
            </a>
          )
        })}
      </div>

      {/* Bottom Tagline */}
      <div className={`
        fixed bottom-10 left-1/2 -translate-x-1/2 z-50
        transition-all duration-500
        ${hoveredService ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}
      `}>
        <p className="text-gray-400 text-[11px] tracking-[0.25em] font-light">
          의료인의 성공적인 개원 파트너
        </p>
      </div>

      {/* Pagination Dots */}
      <div className={`
        fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3
        transition-all duration-500
        ${hoveredService ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}>
        {services.map((service) => (
          <div
            key={service.id}
            className={`
              rounded-full transition-all duration-300
              ${hoveredService === service.id ? 'bg-white w-8 h-1' : 'bg-white/40 w-2 h-1'}
            `}
          />
        ))}
      </div>

      {/* Decorative corners */}
      <div className="fixed top-6 left-6 w-12 h-12 border-l border-t border-gray-200/50 pointer-events-none" />
      <div className="fixed top-6 right-6 w-12 h-12 border-r border-t border-gray-200/50 pointer-events-none" />
      <div className="fixed bottom-6 left-6 w-12 h-12 border-l border-b border-gray-200/50 pointer-events-none" />
      <div className="fixed bottom-6 right-6 w-12 h-12 border-r border-b border-gray-200/50 pointer-events-none" />
    </div>
  )
}
