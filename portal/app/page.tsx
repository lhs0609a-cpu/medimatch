'use client'

import { useState } from 'react'

const services = [
  {
    id: 'marketing',
    title: '플라톤마케팅',
    subtitle: 'MARKETING',
    description: '병원 브랜딩의 새로운 기준',
    slogan: '체계적인 마케팅 전략으로\n병원의 가치를 높입니다',
    url: 'https://www.brandplaton.com/',
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80',
    bgColor: '#f8f7f4',
  },
  {
    id: 'hospital',
    title: '병원개원',
    subtitle: 'OPENING',
    description: '성공적인 개원의 파트너',
    slogan: '입지분석부터 인테리어까지\n원스톱 개원 솔루션',
    url: 'https://medimatch-sooty-two-82.vercel.app/',
    image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80',
    bgColor: '#f4f7f8',
  },
  {
    id: 'loan',
    title: '병원대출',
    subtitle: 'LOAN',
    description: '최적의 금융 솔루션',
    slogan: '개원자금 조달부터\n금융 컨설팅까지',
    url: 'https://pgandplt.vercel.app/',
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80',
    bgColor: '#f4f8f6',
  },
]

export default function PortalPage() {
  const [activeService, setActiveService] = useState<string | null>(null)
  const [hoveredService, setHoveredService] = useState<string | null>(null)

  const handleClick = (serviceId: string, url: string) => {
    if (activeService === serviceId) {
      // 이미 활성화된 상태면 링크로 이동
      window.open(url, '_blank')
    } else {
      // 처음 클릭하면 활성화
      setActiveService(serviceId)
    }
  }

  const handleOutsideClick = () => {
    setActiveService(null)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row relative">
      {/* Logo - Fixed */}
      <div className={`
        fixed top-8 left-1/2 -translate-x-1/2 z-50
        transition-all duration-700
        ${activeService ? 'opacity-0 pointer-events-none' : 'opacity-100'}
      `}>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          <span className="text-gray-900">MEDI</span>
          <span className="text-[#27baa2]">PLATON</span>
        </h1>
      </div>

      {services.map((service) => {
        const isActive = activeService === service.id
        const isOtherActive = activeService !== null && activeService !== service.id
        const isHovered = hoveredService === service.id

        return (
          <div
            key={service.id}
            onClick={() => handleClick(service.id, service.url)}
            onMouseEnter={() => setHoveredService(service.id)}
            onMouseLeave={() => setHoveredService(null)}
            className={`
              relative flex-1 min-h-[33.33vh] md:min-h-screen
              flex flex-col items-center justify-center
              cursor-pointer overflow-hidden
              transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]
              ${isActive ? 'md:flex-[3]' : isOtherActive ? 'md:flex-[0.5]' : 'md:flex-1'}
            `}
            style={{
              backgroundColor: isActive || isHovered ? service.bgColor : '#ffffff',
            }}
          >
            {/* Border Line */}
            <div className="absolute top-0 right-0 bottom-0 w-px bg-gray-100" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-100 md:hidden" />

            {/* Default State - Title Only */}
            <div className={`
              relative z-10 text-center px-8
              transition-all duration-700
              ${isActive ? 'opacity-0 scale-95 absolute' : 'opacity-100 scale-100'}
              ${isOtherActive ? 'opacity-30' : ''}
            `}>
              <p className={`
                text-xs tracking-[0.3em] mb-3
                transition-colors duration-500
                ${isHovered ? 'text-[#27baa2]' : 'text-gray-400'}
              `}>
                {service.subtitle}
              </p>
              <h2 className={`
                text-3xl md:text-4xl lg:text-5xl font-bold
                transition-colors duration-500
                ${isHovered ? 'text-gray-900' : 'text-gray-700'}
              `}>
                {service.title}
              </h2>

              {/* Hover indicator */}
              <div className={`
                mt-6 transition-all duration-500
                ${isHovered && !isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
              `}>
                <p className="text-gray-400 text-sm">Click to explore</p>
              </div>
            </div>

            {/* Active State - Full Content */}
            <div className={`
              absolute inset-0 flex flex-col md:flex-row
              transition-all duration-700
              ${isActive ? 'opacity-100 visible' : 'opacity-0 invisible'}
            `}>
              {/* Image Section */}
              <div className="w-full md:w-1/2 h-[40vh] md:h-full relative overflow-hidden">
                <div
                  className={`
                    absolute inset-0 bg-cover bg-center
                    transition-transform duration-1000
                    ${isActive ? 'scale-100' : 'scale-110'}
                  `}
                  style={{ backgroundImage: `url(${service.image})` }}
                />
                <div className="absolute inset-0 bg-black/10" />
              </div>

              {/* Content Section */}
              <div className="w-full md:w-1/2 h-[60vh] md:h-full flex flex-col items-center justify-center p-8 md:p-12">
                {/* Close Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOutsideClick()
                  }}
                  className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className={`
                  text-center max-w-md
                  transition-all duration-700 delay-200
                  ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                `}>
                  <p className="text-[#27baa2] text-xs tracking-[0.3em] mb-4">
                    {service.subtitle}
                  </p>
                  <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                    {service.title}
                  </h2>
                  <p className="text-gray-600 text-lg mb-4">
                    {service.description}
                  </p>
                  <div className="w-12 h-px bg-gray-300 mx-auto my-6" />
                  <p className="text-gray-500 text-base whitespace-pre-line leading-relaxed mb-8">
                    {service.slogan}
                  </p>

                  {/* CTA Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(service.url, '_blank')
                    }}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gray-900 text-white text-sm font-medium rounded-none hover:bg-[#27baa2] transition-colors duration-300"
                  >
                    <span>사이트 방문하기</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {/* Bottom Tagline */}
      <div className={`
        fixed bottom-8 left-1/2 -translate-x-1/2 z-50
        transition-all duration-700
        ${activeService ? 'opacity-0 pointer-events-none' : 'opacity-100'}
      `}>
        <p className="text-gray-400 text-xs tracking-[0.15em]">
          의료인의 성공적인 개원 파트너
        </p>
      </div>
    </div>
  )
}
