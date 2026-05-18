'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Compass, ArrowRight } from 'lucide-react'
import {
  BuildingsMockup, OpeningProjectMockup, GroupBuyingMockup, PharmacyMatchMockup,
} from './mockups/DomainScreens'
import { viewportConfig } from '@/components/animation/MotionWrapper'

const items = [
  {
    Mockup: BuildingsMockup,
    eyebrow: '부동산',
    title: '병원 매물',
    desc: '분원·이전 후보를 진료실에서 둘러보기',
    metric: '470+',
    metricLabel: '검증된 매물',
    href: '/buildings',
    accent: 'from-blue-500 to-indigo-600',
  },
  {
    Mockup: OpeningProjectMockup,
    eyebrow: '개원 도구',
    title: '개원 D-Day',
    desc: '인허가·인테리어·기기·인력 단계별',
    metric: 'D-Day',
    metricLabel: '단계별 자동 추적',
    href: '/opening-project',
    accent: 'from-rose-500 to-red-600',
  },
  {
    Mockup: GroupBuyingMockup,
    eyebrow: '공동구매',
    title: '공동구매',
    desc: '의료기기·소모품·인테리어 묶음 발주',
    metric: '22%↓',
    metricLabel: '평균 비용 절감',
    href: '/group-buying',
    accent: 'from-amber-500 to-orange-600',
  },
  {
    Mockup: PharmacyMatchMockup,
    eyebrow: '약국 매칭',
    title: '약국 양도양수',
    desc: '주변 약국과 익명 매칭 — 시너지 평가',
    metric: '120+',
    metricLabel: '활성 매물',
    href: '/pharmacy-match',
    accent: 'from-emerald-500 to-teal-600',
  },
]

export function EcosystemInsideEMR() {
  return (
    <section className="py-[120px] md:py-[180px] bg-secondary/30 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportConfig}
          className="text-center mb-20"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-bold text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-900/30 rounded-full uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5" />
            EMR 안의 발견
          </span>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6">
            진료실에서<br />
            <span className="text-primary">분원·매물·공구까지 해결합니다</span>
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            매출 추이를 보다가 분원이 필요해지면 그 자리에서 매물을 검색하세요.<br className="hidden md:block" />
            모두 같은 매직링크로 연결됩니다.
          </p>
        </motion.div>

        {/* 2x2 거대 카드 grid — 각 카드 = mockup + 큰 텍스트 */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 max-w-6xl mx-auto">
          {items.map((it, i) => {
            const M = it.Mockup
            return (
              <motion.div
                key={it.href}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewportConfig}
                transition={{ duration: 0.6, delay: i * 0.08 }}
              >
                <Link
                  href={it.href}
                  className="group block rounded-3xl overflow-hidden bg-card border border-border hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                >
                  {/* mockup — 크게 */}
                  <div className="p-6 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 transition-transform duration-500 group-hover:scale-[1.02]">
                    <M />
                  </div>

                  {/* 텍스트 — 거대 */}
                  <div className="p-8 md:p-10">
                    <div className="flex items-center justify-between mb-4">
                      <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider bg-gradient-to-r ${it.accent} text-white`}>
                        {it.eyebrow}
                      </span>
                      <div className="text-right">
                        <div className="text-2xl md:text-3xl font-black text-foreground leading-none">{it.metric}</div>
                        <div className="text-xs text-muted-foreground mt-1">{it.metricLabel}</div>
                      </div>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-black mb-2 group-hover:text-primary transition-colors">
                      {it.title}
                    </h3>
                    <p className="text-base md:text-lg text-muted-foreground mb-6">{it.desc}</p>
                    <div className="inline-flex items-center gap-1.5 text-sm font-bold text-primary group-hover:gap-3 transition-all">
                      자세히 보기
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewportConfig}
          className="mt-16 text-center"
        >
          <Link
            href="/emr/discover"
            className="inline-flex items-center gap-2 px-8 py-4 text-base font-bold rounded-2xl bg-foreground text-background hover:opacity-90 transition-all"
          >
            EMR 안에서 발견 전체 보기
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
