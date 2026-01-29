'use client'

import { useState } from 'react'

const services = [
  {
    id: 'marketing',
    title: '플라톤마케팅',
    subtitle: 'PLATON MARKETING',
    description: '병원 브랜딩의 새로운 기준',
    slogan: '체계적인 마케팅 전략으로\n병원의 가치를 높입니다',
    url: 'https://www.brandplaton.com/',
    // 마케팅/브랜딩 이미지
    bgImage: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1920&q=80',
    overlayColor: 'from-violet-900/90 via-purple-900/80 to-indigo-900/90',
    accentColor: 'text-violet-300',
    borderColor: 'from-violet-500 to-purple-500',
  },
  {
    id: 'hospital',
    title: '병원개원',
    subtitle: 'HOSPITAL OPENING',
    description: '성공적인 개원의 파트너',
    slogan: '입지분석부터 인테리어까지\n원스톱 개원 솔루션',
    url: 'https://medimatch-sooty-two-82.vercel.app/',
    // 병원/클리닉 인테리어 이미지
    bgImage: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1920&q=80',
    overlayColor: 'from-sky-900/90 via-blue-900/80 to-cyan-900/90',
    accentColor: 'text-sky-300',
    borderColor: 'from-sky-500 to-blue-500',
  },
  {
    id: 'loan',
    title: '병원대출',
    subtitle: 'MEDICAL LOAN',
    description: '최적의 금융 솔루션',
    slogan: '개원자금 조달부터\n금융 컨설팅까지',
    url: 'https://pgandplt.vercel.app/',
    // 금융/비즈니스 이미지
    bgImage: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1920&q=80',
    overlayColor: 'from-emerald-900/90 via-teal-900/80 to-green-900/90',
    accentColor: 'text-emerald-300',
    borderColor: 'from-emerald-500 to-teal-500',
  },
]

export default function PortalPage() {
  const [hoveredService, setHoveredService] = useState<string | null>(null)

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {services.map((service) => {
        const isHovered = hoveredService === service.id
        const isOtherHovered = hoveredService !== null && hoveredService !== service.id

        return (
          <a
            key={service.id}
            href={service.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`
              relative flex-1 min-h-[33.33vh] md:min-h-screen
              flex flex-col items-center justify-center
              transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]
              cursor-pointer overflow-hidden
              ${isHovered ? 'md:flex-[2]' : isOtherHovered ? 'md:flex-[0.5]' : 'md:flex-1'}
            `}
            onMouseEnter={() => setHoveredService(service.id)}
            onMouseLeave={() => setHoveredService(null)}
          >
            {/* Background Image */}
            <div
              className={`
                absolute inset-0 bg-cover bg-center
                transition-all duration-700
                ${isHovered ? 'scale-110' : 'scale-100'}
              `}
              style={{ backgroundImage: `url(${service.bgImage})` }}
            />

            {/* Gradient Overlay */}
            <div className={`
              absolute inset-0 bg-gradient-to-br ${service.overlayColor}
              transition-opacity duration-500
            `} />

            {/* Dark overlay on hover for better text readability */}
            <div className={`
              absolute inset-0 bg-black/20
              transition-opacity duration-500
              ${isHovered ? 'opacity-100' : 'opacity-0'}
            `} />

            {/* Vignette effect */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

            {/* Content */}
            <div className={`
              relative z-10 text-center px-8
              transition-all duration-500
              ${isOtherHovered ? 'opacity-30 scale-95' : 'opacity-100 scale-100'}
            `}>
              {/* Subtitle */}
              <p className={`
                text-xs md:text-sm tracking-[0.3em] mb-4 font-medium
                transition-all duration-500
                ${service.accentColor}
              `}>
                {service.subtitle}
              </p>

              {/* Title */}
              <h2 className={`
                text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4
                transition-all duration-500 drop-shadow-lg
                ${isHovered ? 'scale-110' : 'scale-100'}
              `}>
                {service.title}
              </h2>

              {/* Description */}
              <p className="text-white/80 text-base md:text-lg mb-6 drop-shadow">
                {service.description}
              </p>

              {/* Slogan - Only visible on hover */}
              <div className={`
                transition-all duration-500 overflow-hidden
                ${isHovered ? 'max-h-40 opacity-100 mt-6' : 'max-h-0 opacity-0 mt-0'}
              `}>
                <div className="w-16 h-0.5 bg-white/30 mx-auto mb-6" />
                <p className="text-white/90 text-base md:text-lg whitespace-pre-line leading-relaxed drop-shadow">
                  {service.slogan}
                </p>
              </div>

              {/* Arrow indicator */}
              <div className={`
                mt-8 transition-all duration-500
                ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
              `}>
                <div className={`
                  inline-flex items-center gap-3 px-8 py-4
                  bg-white/10 backdrop-blur-sm
                  border border-white/30 rounded-full
                  text-white text-sm font-medium
                  hover:bg-white/20 transition-colors
                `}>
                  <span>자세히 보기</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Decorative Line */}
            <div className={`
              absolute bottom-0 left-0 right-0 h-1
              transition-all duration-500
              ${isHovered ? 'opacity-100' : 'opacity-30'}
            `}>
              <div className={`h-full bg-gradient-to-r ${service.borderColor}`} />
            </div>

            {/* Side gradient for separation */}
            <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
          </a>
        )
      })}

      {/* Center Logo - Fixed position */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <div className="bg-black/30 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">
          <span className="text-white text-xl md:text-2xl font-bold tracking-wider">
            MEDI<span className="text-sky-400">PLATON</span>
          </span>
        </div>
      </div>

      {/* Bottom Info */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 text-center pointer-events-none">
        <div className="bg-black/30 backdrop-blur-md px-6 py-2 rounded-full border border-white/10">
          <p className="text-white/70 text-sm">
            의료인의 성공적인 개원 파트너
          </p>
        </div>
      </div>
    </div>
  )
}
