'use client'

import { useState } from 'react'

const services = [
  {
    id: 'marketing',
    title: '플라톤마케팅',
    subtitle: 'MARKETING',
    description: '체계적인 마케팅 전략으로 병원의 가치를 높입니다',
    url: 'https://www.brandplaton.com/',
    accentColor: '#8B5CF6', // violet
  },
  {
    id: 'hospital',
    title: '병원개원',
    subtitle: 'OPENING',
    description: '입지분석부터 인테리어까지 원스톱 개원 솔루션',
    url: 'https://medimatch-sooty-two-82.vercel.app/',
    accentColor: '#0EA5E9', // sky
  },
  {
    id: 'loan',
    title: '병원대출',
    subtitle: 'LOAN',
    description: '개원자금 조달부터 금융 컨설팅까지',
    url: 'https://pgandplt.vercel.app/',
    accentColor: '#10B981', // emerald
  },
]

export default function PortalPage() {
  const [hoveredService, setHoveredService] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-center">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            <span className="text-gray-900">MEDI</span>
            <span className="text-sky-500">PLATON</span>
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center pt-20 pb-16 px-6">
        {/* Hero Text */}
        <div className="text-center mb-16 md:mb-24">
          <p className="text-gray-400 text-sm tracking-[0.2em] mb-4">
            MEDICAL BUSINESS PARTNER
          </p>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight">
            의료인의 성공을 함께합니다
          </h2>
        </div>

        {/* Services Navigation */}
        <nav className="w-full max-w-4xl">
          <div className="flex flex-col md:flex-row items-center justify-center gap-0 md:gap-0">
            {services.map((service, index) => {
              const isHovered = hoveredService === service.id

              return (
                <div key={service.id} className="flex items-center">
                  {/* Divider */}
                  {index > 0 && (
                    <div className="hidden md:block w-px h-12 bg-gray-200 mx-8" />
                  )}

                  <a
                    href={service.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative py-6 md:py-8 px-4 md:px-8 text-center"
                    onMouseEnter={() => setHoveredService(service.id)}
                    onMouseLeave={() => setHoveredService(null)}
                  >
                    {/* Subtitle */}
                    <p
                      className="text-xs tracking-[0.3em] mb-2 transition-colors duration-300"
                      style={{ color: isHovered ? service.accentColor : '#9CA3AF' }}
                    >
                      {service.subtitle}
                    </p>

                    {/* Title */}
                    <h3
                      className="text-2xl md:text-3xl lg:text-4xl font-bold transition-all duration-300"
                      style={{ color: isHovered ? service.accentColor : '#111827' }}
                    >
                      {service.title}
                    </h3>

                    {/* Description - appears on hover */}
                    <div className={`
                      overflow-hidden transition-all duration-500 ease-out
                      ${isHovered ? 'max-h-32 opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'}
                    `}>
                      <p className="text-gray-500 text-sm md:text-base max-w-[200px] mx-auto leading-relaxed">
                        {service.description}
                      </p>

                      {/* Arrow Button */}
                      <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium"
                        style={{ color: service.accentColor }}
                      >
                        <span>바로가기</span>
                        <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                    </div>

                    {/* Underline */}
                    <div
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 h-0.5 transition-all duration-300 rounded-full"
                      style={{
                        backgroundColor: service.accentColor,
                        width: isHovered ? '60px' : '0px'
                      }}
                    />
                  </a>
                </div>
              )
            })}
          </div>
        </nav>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 text-center">
          <p className="text-gray-400 text-xs tracking-wide">
            © 2024 MEDIPLATON. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
