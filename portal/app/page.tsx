'use client'

import { useState } from 'react'
import Image from 'next/image'

const services = [
  {
    id: 'marketing',
    title: '플라톤마케팅',
    subtitle: 'PLATON MARKETING',
    description: '병원 브랜딩의 새로운 기준',
    slogan: '체계적인 마케팅 전략으로\n병원의 가치를 높입니다',
    url: 'https://www.brandplaton.com/',
    bgColor: 'bg-[#1a1a2e]',
    accentColor: 'text-violet-400',
    hoverBg: 'hover:bg-[#16162a]',
  },
  {
    id: 'hospital',
    title: '병원개원',
    subtitle: 'HOSPITAL OPENING',
    description: '성공적인 개원의 파트너',
    slogan: '입지분석부터 인테리어까지\n원스톱 개원 솔루션',
    url: 'https://medimatch-sooty-two-82.vercel.app/',
    bgColor: 'bg-[#0f2027]',
    accentColor: 'text-sky-400',
    hoverBg: 'hover:bg-[#0a1a20]',
  },
  {
    id: 'loan',
    title: '병원대출',
    subtitle: 'MEDICAL LOAN',
    description: '최적의 금융 솔루션',
    slogan: '개원자금 조달부터\n금융 컨설팅까지',
    url: 'https://pgandplt.vercel.app/',
    bgColor: 'bg-[#1a2f1a]',
    accentColor: 'text-emerald-400',
    hoverBg: 'hover:bg-[#152a15]',
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
              ${service.bgColor}
              ${isHovered ? 'md:flex-[2]' : isOtherHovered ? 'md:flex-[0.5]' : 'md:flex-1'}
            `}
            onMouseEnter={() => setHoveredService(service.id)}
            onMouseLeave={() => setHoveredService(null)}
          >
            {/* Background Gradient Overlay */}
            <div
              className={`
                absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50
                transition-opacity duration-500
                ${isHovered ? 'opacity-100' : 'opacity-0'}
              `}
            />

            {/* Content */}
            <div className={`
              relative z-10 text-center px-6
              transition-all duration-500
              ${isOtherHovered ? 'opacity-30 scale-95' : 'opacity-100 scale-100'}
            `}>
              {/* Subtitle */}
              <p className={`
                text-xs md:text-sm tracking-[0.3em] mb-4
                transition-all duration-500
                ${service.accentColor}
                ${isHovered ? 'opacity-100' : 'opacity-70'}
              `}>
                {service.subtitle}
              </p>

              {/* Title */}
              <h2 className={`
                text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4
                transition-all duration-500
                ${isHovered ? 'scale-110' : 'scale-100'}
              `}>
                {service.title}
              </h2>

              {/* Description */}
              <p className={`
                text-white/70 text-sm md:text-base mb-6
                transition-all duration-300
              `}>
                {service.description}
              </p>

              {/* Slogan - Only visible on hover */}
              <div className={`
                transition-all duration-500 overflow-hidden
                ${isHovered ? 'max-h-32 opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'}
              `}>
                <p className="text-white/90 text-sm md:text-base whitespace-pre-line leading-relaxed">
                  {service.slogan}
                </p>
              </div>

              {/* Arrow indicator */}
              <div className={`
                mt-8 transition-all duration-500
                ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
              `}>
                <div className={`
                  inline-flex items-center gap-2 px-6 py-3
                  border border-white/30 rounded-full
                  text-white text-sm
                  hover:bg-white/10 transition-colors
                `}>
                  <span>바로가기</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Decorative Line */}
            <div className={`
              absolute bottom-0 left-0 right-0 h-1
              transition-all duration-500
              ${isHovered ? 'opacity-100' : 'opacity-0'}
            `}>
              <div className={`h-full bg-gradient-to-r ${
                service.id === 'marketing' ? 'from-violet-500 to-purple-500' :
                service.id === 'hospital' ? 'from-sky-500 to-blue-500' :
                'from-emerald-500 to-teal-500'
              }`} />
            </div>
          </a>
        )
      })}

      {/* Center Logo - Fixed position */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <div className="text-white text-xl md:text-2xl font-bold tracking-wider">
          MEDI<span className="text-sky-400">PLATON</span>
        </div>
      </div>

      {/* Bottom Info */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 text-center pointer-events-none">
        <p className="text-white/50 text-xs">
          의료인의 성공적인 개원 파트너
        </p>
      </div>
    </div>
  )
}
