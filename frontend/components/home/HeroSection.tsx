'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Stethoscope, Target, MessageCircle, Monitor, Send } from 'lucide-react'
import { hasGuestToken } from '@/lib/auth/guestToken'
import { ChartMockup } from './mockups/EMRScreens'

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
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden" aria-label="히어로 섹션">
      {/* 배경 그라데이션 */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-background to-secondary/20" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#3182f6]/8 rounded-full blur-3xl pointer-events-none -z-10 translate-x-1/4 -translate-y-1/4" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#3182f6]/5 rounded-full blur-3xl pointer-events-none -z-10 -translate-x-1/4" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* 좌: 텍스트 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="text-center lg:text-left"
          >
            <span className="inline-block px-3 py-1 mb-6 text-xs font-bold text-primary bg-primary/10 rounded-full uppercase tracking-wider">
              의사 평생 무료
            </span>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight leading-[0.95] mb-8">
              <span className="text-foreground">진료에만</span>
              <br />
              <span className="text-foreground">집중하세요.</span>
              <br />
              <span className="text-[#3182f6]">나머지는 AI가.</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              차트 작성·청구 검증·환자 리콜.<br className="hidden md:block" />
              가입 없이 지금 바로 시작.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch gap-3 mb-8">
              <Link
                href="/emr/crm"
                className="group inline-flex items-center justify-center gap-2 px-8 py-5 text-base font-bold rounded-2xl bg-[#3182f6] hover:bg-[#1e5fc7] text-white transition-all hover:shadow-2xl hover:shadow-[#3182f6]/30"
              >
                <Send className="w-5 h-5" />
                CRM 바로 시작
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/emr"
                className="inline-flex items-center justify-center gap-2 px-8 py-5 text-base font-bold rounded-2xl bg-[#3182f6]/10 hover:bg-[#3182f6]/20 text-[#3182f6] border-2 border-[#3182f6]/30 transition-all"
              >
                <Monitor className="w-5 h-5" />
                EMR 바로 시작
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-emerald-500" />
                가입·로그인 없음
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-emerald-500" />
                카드 등록 없음
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-emerald-500" />
                평생 무료
              </span>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-2 text-sm">
              <Link href="/emr/patients/import" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-[#3182f6] transition-colors">
                <ArrowRight className="w-3.5 h-3.5" />
                기존 EMR에서 환자 옮기기
              </Link>
              <span className="text-muted-foreground/30">·</span>
              {hasToken ? (
                <Link href="/my-roadmap" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-[#3182f6] transition-colors">
                  <Target className="w-3.5 h-3.5" />
                  내 개원 미션맵
                </Link>
              ) : (
                <Link href="/diagnose" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-[#3182f6] transition-colors">
                  <Stethoscope className="w-3.5 h-3.5" />
                  개원 준비 중 — 1분 진단
                </Link>
              )}
              <span className="text-muted-foreground/30">·</span>
              <Link href="/recover" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-[#3182f6] transition-colors">
                <MessageCircle className="w-3.5 h-3.5" />
                카톡으로 링크 받기
              </Link>
            </div>
          </motion.div>

          {/* 우: 큰 mockup — 살짝 기울어진 입체감 */}
          <motion.div
            initial={{ opacity: 0, x: 50, rotate: 4 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="relative lg:scale-110 xl:scale-125 lg:translate-x-4"
          >
            {/* 뒤에 후광 */}
            <div className="absolute -inset-8 bg-gradient-to-br from-[#3182f6]/20 to-[#3182f6]/0 rounded-3xl blur-2xl -z-10" />
            <ChartMockup />
            {/* 부유하는 메트릭 카드 — 토스 스타일 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="absolute -bottom-6 -left-6 md:-bottom-8 md:-left-12 bg-card border border-border rounded-2xl shadow-2xl px-5 py-4 z-10 hidden sm:block"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <span className="text-2xl">⚡</span>
                </div>
                <div>
                  <div className="text-2xl font-black">70%</div>
                  <div className="text-xs text-muted-foreground">차트 시간 단축</div>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="absolute -top-6 -right-6 md:-top-8 md:-right-12 bg-card border border-border rounded-2xl shadow-2xl px-5 py-4 z-10 hidden sm:block"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="text-2xl">💰</span>
                </div>
                <div>
                  <div className="text-2xl font-black">30%↓</div>
                  <div className="text-xs text-muted-foreground">삭감률 감소</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
