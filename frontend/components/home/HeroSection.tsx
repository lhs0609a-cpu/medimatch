'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

const KakaoMap = dynamic(() => import('@/components/map/KakaoMap'), {
  ssr: false,
  loading: () => null,
})

const stats = [
  { value: '470+', label: '매물' },
  { value: '150+', label: '성공 사례' },
  { value: '8년', label: '경험' },
]

interface HeroSectionProps {
  markers?: Array<{
    id: string | number
    lat: number
    lng: number
    title: string
    type: 'hospital' | 'pharmacy' | 'prospect' | 'default' | 'closed_hospital' | 'listing'
  }>
}

export function HeroSection({ markers = [] }: HeroSectionProps) {
  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden" aria-label="히어로 섹션">
      {/* 배경 지도 + gradient 오버레이 */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0">
          <KakaoMap
            center={{ lat: 37.5172, lng: 127.0473 }}
            level={8}
            markers={markers}
            className="w-full h-full opacity-50"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/55 to-background pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#3182f6]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#3182f6]/8 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6"
        >
          <span className="text-foreground">의료 개원의 모든 것,</span>
          <br />
          <span className="text-[#3182f6]">메디플라톤</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
          className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          개원 준비부터 운영까지, 데이터 기반으로 성공을 설계합니다
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
          className="mb-14"
        >
          <Link href="/opening-package" className="btn-primary btn-lg group text-lg px-10 inline-flex">
            무료 개원 진단 시작하기
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Stat pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45, ease: 'easeOut' }}
          className="flex items-center justify-center gap-3 sm:gap-4"
        >
          {stats.map((s) => (
            <div
              key={s.label}
              className="px-5 py-2.5 rounded-full bg-[#3182f6]/10 border border-[#3182f6]/20 backdrop-blur-sm"
            >
              <span className="text-lg sm:text-xl font-bold text-[#3182f6]">{s.value}</span>
              <span className="text-sm text-muted-foreground ml-1.5">{s.label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  )
}
