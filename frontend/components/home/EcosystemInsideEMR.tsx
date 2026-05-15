'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Compass, ArrowRight } from 'lucide-react'
import {
  BuildingsMockup, OpeningProjectMockup, GroupBuyingMockup, PharmacyMatchMockup,
} from './mockups/DomainScreens'
import { staggerContainer, staggerItem, viewportConfig } from '@/components/animation/MotionWrapper'

const items = [
  {
    Mockup: BuildingsMockup,
    badge: '부동산',
    title: '병원 매물',
    desc: '분원·이전 후보',
    metric: '470+',
    href: '/buildings',
  },
  {
    Mockup: OpeningProjectMockup,
    badge: '개원 도구',
    title: '개원 프로젝트',
    desc: '인허가·인테리어 체크리스트',
    metric: 'D-Day 단계별',
    href: '/opening-project',
  },
  {
    Mockup: GroupBuyingMockup,
    badge: '공동구매',
    title: '공동구매',
    desc: '의료기기·소모품 묶음 발주',
    metric: '평균 22%↓',
    href: '/group-buying',
  },
  {
    Mockup: PharmacyMatchMockup,
    badge: '약국 매칭',
    title: '약국 양도양수',
    desc: '주변 약국 익명 매칭',
    metric: '120+',
    href: '/pharmacy-match',
  },
]

export function EcosystemInsideEMR() {
  return (
    <section className="py-[80px] md:py-[120px] bg-secondary/30">
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
            className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-semibold text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-900/30 rounded-full"
          >
            <Compass className="w-3.5 h-3.5" />
            EMR 안의 발견 · 실제 화면
          </motion.span>
          <motion.h2
            variants={staggerItem}
            className="text-3xl md:text-5xl font-bold tracking-tight mb-4"
          >
            진료실에서 분원·매물·공구까지
          </motion.h2>
          <motion.p
            variants={staggerItem}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            매출 추이를 보다가 분원이 필요해지면 그 자리에서 매물 검색.<br className="hidden md:block" />
            인테리어 견적이 필요하면 공동구매. 모두 같은 매직링크 로그인.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          variants={staggerContainer}
          className="max-w-6xl mx-auto"
        >
          {/* 4개 카드 — 실제 프로그램 화면 mockup */}
          <div className="grid sm:grid-cols-2 gap-5">
            {items.map((it) => {
              const M = it.Mockup
              return (
                <motion.div key={it.href} variants={staggerItem}>
                  <Link
                    href={it.href}
                    className="group block rounded-2xl overflow-hidden bg-card border border-border hover:shadow-xl hover:-translate-y-0.5 transition-all"
                  >
                    {/* 실 화면 mockup */}
                    <div className="p-3 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 transition-transform duration-500 group-hover:scale-[1.01]">
                      <M />
                    </div>
                    {/* 텍스트 */}
                    <div className="p-5 flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-secondary text-2xs font-semibold rounded-full">
                            {it.badge}
                          </span>
                          <span className="text-xs font-semibold text-primary">{it.metric}</span>
                        </div>
                        <h3 className="font-bold group-hover:text-primary transition-colors">{it.title}</h3>
                        <p className="text-xs text-muted-foreground">{it.desc}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>

          <motion.div variants={staggerItem} className="mt-8 text-center">
            <Link
              href="/emr/discover"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-full bg-background border border-border hover:border-primary hover:text-primary transition-colors"
            >
              EMR 안에서 발견 전체 보기
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
