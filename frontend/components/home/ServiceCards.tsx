'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { ChartMockup, ClaimsMockup, CRMMockup } from './mockups/EMRScreens'
import { staggerContainer, staggerItem, viewportConfig } from '@/components/animation/MotionWrapper'

// EMR 핵심 3가치 — 각 카드가 실제 EMR 프로그램 화면 mockup을 보여줌
const features = [
  {
    Mockup: ChartMockup,
    title: 'AI 음성 자동 차트',
    desc: '진료 대화만 하세요. CC·PI·PMH를 AI가 자동 분류하고 ICD-10 진단코드까지 추천합니다.',
    metric: '평균 차트 시간 70%↓',
    href: '/services/emr#ai-chart',
  },
  {
    Mockup: ClaimsMockup,
    title: '삭감 방어 AI',
    desc: '과거 삭감 패턴을 학습해 위험 청구를 실시간 경고. 최적 코드 조합으로 삭감률 30% 감소.',
    metric: '삭감률 평균 30%↓',
    href: '/services/emr#claims',
  },
  {
    Mockup: CRMMockup,
    title: 'CRM · 환자 리콜',
    desc: '3개월 미방문 환자 자동 감지·알림톡 발송. 야간 차단·동의 검증 등 안전 가드 18종.',
    metric: '재방문율 25%↑',
    href: '/emr/crm',
  },
]

export function ServiceCards() {
  return (
    <section id="services" className="py-[80px] md:py-[120px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          variants={staggerContainer}
          className="text-center mb-12"
        >
          <motion.span
            variants={staggerItem}
            className="inline-block px-3 py-1 mb-4 text-xs font-semibold text-primary bg-primary/10 rounded-full"
          >
            실제 화면 — EMR 핵심 3가치
          </motion.span>
          <motion.h2
            variants={staggerItem}
            className="text-3xl md:text-5xl font-bold tracking-tight mb-4"
          >
            진료의 70%는 AI가 대신
          </motion.h2>
          <motion.p
            variants={staggerItem}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            차트 작성·청구 검증·환자 리콜 — 의사가 할 일은 진료뿐
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          variants={staggerContainer}
          className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto"
        >
          {features.map((f) => {
            const M = f.Mockup
            return (
              <motion.div key={f.title} variants={staggerItem}>
                <Link
                  href={f.href}
                  className="group block h-full rounded-2xl overflow-hidden bg-card border border-border hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  {/* 실제 EMR 프로그램 화면 mockup */}
                  <div className="p-4 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950">
                    <div className="transition-transform duration-500 group-hover:scale-[1.02]">
                      <M />
                    </div>
                  </div>
                  {/* 텍스트 */}
                  <div className="p-5">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                      {f.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                      {f.desc}
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className="text-xs font-semibold text-primary">{f.metric}</span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>

        {/* 하단 가격 안내 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportConfig}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-6 py-3 rounded-2xl bg-secondary/40 text-sm">
            <span className="font-semibold">사용자 ID당 과금</span>
            <span className="text-muted-foreground">1ID <b className="text-foreground">무료</b></span>
            <span className="text-muted-foreground">2~4 <b className="text-foreground">39,000원</b></span>
            <span className="text-muted-foreground">5~9 <b className="text-foreground">29,000원</b></span>
            <span className="text-muted-foreground">10+ <b className="text-foreground">19,000원</b></span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
