'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Stethoscope, Target, MessageCircle, Monitor, Send } from 'lucide-react'
import { hasGuestToken } from '@/lib/auth/guestToken'

const KakaoMap = dynamic(() => import('@/components/map/KakaoMap'), {
  ssr: false,
  loading: () => null,
})

const stats = [
  { value: '13', label: '전문 분야' },
  { value: '470+', label: '매물·솔루션' },
  { value: '150+', label: '개원 성공' },
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
  const [hasToken, setHasToken] = useState(false)
  useEffect(() => { setHasToken(hasGuestToken()) }, [])

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
          <span className="text-foreground">EMR·CRM 평생 무료,</span>
          <br />
          <span className="text-[#3182f6]">개원까지 한 번에</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
          className="text-lg md:text-xl text-muted-foreground mb-4 max-w-2xl mx-auto leading-relaxed"
        >
          환자 리콜·예약·문진·청구까지 — 가입 없이 지금 바로 사용하세요.<br className="hidden md:block" />
          기존 EMR 환자도 CSV/엑셀 한 번에 이관됩니다.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          className="text-sm text-muted-foreground/80 mb-10"
        >
          ✓ 회원가입 불필요 &nbsp;·&nbsp; ✓ 비밀번호 없음 &nbsp;·&nbsp; ✓ 의사 평생 무료
        </motion.p>

        {/* 메인 CTA — CRM·EMR 바로 시작 (2-col, 동등 강조) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
          className="mb-4 flex flex-col sm:flex-row items-stretch justify-center gap-3 max-w-2xl mx-auto"
        >
          <Link
            href="/emr/crm"
            className="btn-primary btn-lg group text-base px-8 py-4 inline-flex flex-1 justify-center"
          >
            <Send className="w-5 h-5" />
            CRM 바로 시작
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/emr"
            className="inline-flex flex-1 items-center justify-center gap-2 px-8 py-4 text-base font-semibold rounded-2xl bg-[#3182f6]/10 hover:bg-[#3182f6]/20 text-[#3182f6] border-2 border-[#3182f6]/30 transition-all"
          >
            <Monitor className="w-5 h-5" />
            EMR 바로 시작
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* 보조 동선 — 환자 이관 / 진단 / 카톡 복원 / 미션맵 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
          className="mb-12 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm"
        >
          <Link
            href="/emr/patients/import"
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-[#3182f6] transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            기존 EMR에서 환자 옮기기
          </Link>
          <span className="text-muted-foreground/30">·</span>
          {hasToken ? (
            <Link
              href="/my-roadmap"
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-[#3182f6] transition-colors"
            >
              <Target className="w-3.5 h-3.5" />
              내 개원 미션맵
            </Link>
          ) : (
            <Link
              href="/diagnose"
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-[#3182f6] transition-colors"
            >
              <Stethoscope className="w-3.5 h-3.5" />
              개원 준비 중 — 1분 진단
            </Link>
          )}
          <span className="text-muted-foreground/30">·</span>
          <Link
            href="/recover"
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-[#3182f6] transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            카톡으로 링크 받기
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
