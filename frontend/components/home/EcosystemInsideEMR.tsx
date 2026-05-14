'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Building2, Rocket, ShoppingCart, ArrowLeftRight, Compass, ArrowRight,
} from 'lucide-react'
import { TossIcon } from '@/components/ui/TossIcon'
import { staggerContainer, staggerItem, viewportConfig } from '@/components/animation/MotionWrapper'

// 매물/개원/공동구매/약국 4개를 "별도 서비스"가 아닌 "EMR 안에서 만나는 도구"로 위치 재정의.
// 각 항목은 EMR 사이드바 아이콘 + 라벨처럼 보이게 디자인 (EMR이 hub임을 시각화).
const items = [
  {
    icon: Building2,
    color: 'from-blue-500 to-indigo-600',
    title: '병원 매물',
    line1: '분원·이전 후보',
    line2: '470+',
    href: '/buildings',
  },
  {
    icon: Rocket,
    color: 'from-rose-500 to-red-600',
    title: '개원 프로젝트',
    line1: '인허가·인테리어 체크리스트',
    line2: 'D-Day 단계별',
    href: '/opening-project',
  },
  {
    icon: ShoppingCart,
    color: 'from-amber-500 to-orange-600',
    title: '공동구매',
    line1: '의료기기·소모품 묶음 발주',
    line2: '평균 22%↓',
    href: '/group-buying',
  },
  {
    icon: ArrowLeftRight,
    color: 'from-emerald-500 to-teal-600',
    title: '약국 양도양수',
    line1: '주변 약국 익명 매칭',
    line2: '120+',
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
            EMR 안의 발견
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

        {/* EMR 사이드바 미리보기 — 진료/환자/처방·청구/CRM/리포트/발견 */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          variants={staggerContainer}
          className="max-w-5xl mx-auto"
        >
          {/* 4개 발견 카드 */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {items.map((it) => (
              <motion.div key={it.href} variants={staggerItem}>
                <Link
                  href={it.href}
                  className="card p-5 group block h-full hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <div className="transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 mb-4 inline-block">
                    <TossIcon icon={it.icon} color={it.color} size="lg" />
                  </div>
                  <h3 className="font-bold mb-1 group-hover:text-primary transition-colors">
                    {it.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2">{it.line1}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-xs font-semibold text-primary">{it.line2}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* 전체 허브 진입 */}
          <motion.div
            variants={staggerItem}
            className="mt-8 text-center"
          >
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
