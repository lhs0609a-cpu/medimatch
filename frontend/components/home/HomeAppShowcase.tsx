'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { ChartMockup, PatientPhoneMockup } from './mockups/EMRScreens'
import { viewportConfig } from '@/components/animation/MotionWrapper'

// 의사용 EMR + 환자용 카톡 알림톡을 풀-블리드로 거대하게.
export function HomeAppShowcase() {
  return (
    <section className="py-[120px] md:py-[180px] bg-gradient-to-br from-secondary/30 via-background to-secondary/40 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportConfig}
          className="text-center mb-20 lg:mb-28"
        >
          <span className="inline-block px-3 py-1 mb-6 text-xs font-bold text-primary bg-primary/10 rounded-full uppercase tracking-wider">
            의원과 환자, 한 흐름
          </span>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6">
            의사가 차트를 쓰면<br />
            <span className="text-primary">환자에게 자동으로 전달됩니다</span>
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            EMR과 환자 앱이 분리된 시스템이 아닙니다.<br className="hidden md:block" />
            한 매직링크로 모두 묶여 있습니다.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-16 lg:gap-24 items-center">
          {/* 의사용 EMR — 거대 브라우저 mockup */}
          <motion.div
            initial={{ opacity: 0, x: -40, rotate: -2 }}
            whileInView={{ opacity: 1, x: 0, rotate: 0 }}
            viewport={viewportConfig}
            transition={{ duration: 0.7 }}
          >
            <div className="relative">
              <div className="absolute -inset-12 bg-gradient-to-br from-primary/15 to-primary/0 rounded-3xl blur-2xl -z-10" />
              <ChartMockup />
              {/* 부유 메트릭 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewportConfig}
                transition={{ delay: 0.4 }}
                className="absolute -bottom-8 -left-8 bg-card border border-border rounded-2xl shadow-2xl px-6 py-4 hidden md:block"
              >
                <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">의사·실장용</div>
                <div className="text-2xl font-black mt-1">브라우저만 있으면 어디서든</div>
              </motion.div>
            </div>

            <div className="mt-10 lg:hidden">
              <div className="text-xs font-bold text-primary uppercase tracking-wider mb-3">의사·실장용</div>
              <h3 className="text-3xl font-black mb-3">브라우저만 있으면 어디서든</h3>
              <p className="text-base text-muted-foreground">설치·서버 관리·백업 신경쓸 필요 없음</p>
            </div>
          </motion.div>

          {/* 환자용 카톡 — 거대 폰 mockup */}
          <motion.div
            initial={{ opacity: 0, x: 40, rotate: 2 }}
            whileInView={{ opacity: 1, x: 0, rotate: 0 }}
            viewport={viewportConfig}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="lg:scale-110"
          >
            <div className="relative">
              <div className="absolute -inset-12 bg-gradient-to-br from-emerald-500/15 to-emerald-500/0 rounded-3xl blur-2xl -z-10" />
              <PatientPhoneMockup />
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewportConfig}
                transition={{ delay: 0.5 }}
                className="absolute -top-8 -right-4 lg:-right-12 bg-card border border-border rounded-2xl shadow-2xl px-5 py-3 hidden md:block"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💬</span>
                  <div>
                    <div className="text-xs text-muted-foreground">앱 설치</div>
                    <div className="text-lg font-black text-emerald-600">불필요</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* 양방향 흐름 한 줄 */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewportConfig}
          transition={{ delay: 0.3 }}
          className="mt-20 lg:mt-28 text-center"
        >
          <div className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-base md:text-lg text-muted-foreground">
            <span className="font-semibold">의사 진료</span>
            <ArrowRight className="w-4 h-4 text-primary" />
            <span className="font-semibold">환자 카톡 알림</span>
            <ArrowRight className="w-4 h-4 text-primary" />
            <span className="font-semibold">만족도 회신</span>
            <ArrowRight className="w-4 h-4 text-primary" />
            <span className="font-semibold">리뷰</span>
            <ArrowRight className="w-4 h-4 text-primary" />
            <span className="font-semibold">다음 환자 유입</span>
          </div>
          <div className="mt-3 text-sm text-primary font-bold">한 흐름으로 완결</div>
        </motion.div>
      </div>
    </section>
  )
}
