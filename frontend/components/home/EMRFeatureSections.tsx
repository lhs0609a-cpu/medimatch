'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import {
  ChartMockup, ClaimsMockup, CRMMockup,
  BookingMockup, DashboardMockup, PharmacyBridgeMockup,
} from './mockups/EMRScreens'
import { viewportConfig } from '@/components/animation/MotionWrapper'

interface FeatureSection {
  Mockup: () => JSX.Element
  eyebrow: string
  title: React.ReactNode
  desc: string
  metric: { value: string; label: string }
  href: string
  side: 'left' | 'right' // mockup 위치
  bg?: string
}

const sections: FeatureSection[] = [
  {
    Mockup: ChartMockup,
    eyebrow: 'AI 음성 차트',
    title: <>진료 대화만 하시면<br /><span className="text-primary">차트는 자동으로 완성됩니다</span></>,
    desc: 'CC·PI·PMH·ICD-10 진단코드까지 AI가 채웁니다. 의사는 환자만 보시면 됩니다.',
    metric: { value: '70%', label: '차트 시간 단축' },
    href: '/services/emr#ai-chart',
    side: 'right',
  },
  {
    Mockup: ClaimsMockup,
    eyebrow: '삭감 방어',
    title: <>위험 청구를<br /><span className="text-primary">실시간으로 막아드립니다</span></>,
    desc: '과거 삭감 패턴 학습 → 위험 코드 즉시 경고 + 대안 코드 추천. 손에 들어와야 할 돈을 다 받게 해드립니다.',
    metric: { value: '30%↓', label: '평균 삭감률 감소' },
    href: '/services/emr#claims',
    side: 'left',
    bg: 'bg-secondary/30',
  },
  {
    Mockup: CRMMockup,
    eyebrow: '환자 리콜 CRM',
    title: <>잊혀진 환자를<br /><span className="text-primary">자동으로 다시 모십니다</span></>,
    desc: '3개월 미방문 환자 자동 감지 → 알림톡 발송 → 예약·재내원 전환. 안전 가드 18종 내장.',
    metric: { value: '25%↑', label: '재방문율 상승' },
    href: '/emr/crm',
    side: 'right',
  },
  {
    Mockup: BookingMockup,
    eyebrow: '예약·접수',
    title: <>도착·진료중·완료를<br /><span className="text-primary">한 화면에 담았습니다</span></>,
    desc: 'QR 체크인·태블릿 문진·실시간 상태. 시간 충돌 자동 검증, 대기 알림톡 자동 발송.',
    metric: { value: '70%↓', label: '환자 대기시간' },
    href: '/services/emr',
    side: 'left',
    bg: 'bg-secondary/30',
  },
  {
    Mockup: DashboardMockup,
    eyebrow: '경영 대시보드',
    title: <>매출·환자·재방문을<br /><span className="text-primary">AI가 분석해 알려드립니다</span></>,
    desc: '공실 시간·미방문 환자·재고 이슈를 자동 발견합니다. "수요일 14시 공실 38%" 같은 인사이트를 매일 받아보세요.',
    metric: { value: '12%↑', label: '월 매출 평균 증가' },
    href: '/emr-dashboard',
    side: 'right',
  },
  {
    Mockup: PharmacyBridgeMockup,
    eyebrow: '약국 브릿지',
    title: <>처방전을<br /><span className="text-primary">3초 만에 약국으로 전송합니다</span></>,
    desc: 'DUR 자동 검증·암호화 전송·조제 완료 알림. 환자 대기시간이 폭발적으로 줄어듭니다.',
    metric: { value: '3초', label: '평균 전송 시간' },
    href: '/services/emr#pharmacy',
    side: 'left',
    bg: 'bg-secondary/30',
  },
]

export function EMRFeatureSections() {
  return (
    <>
      {sections.map((s, i) => {
        const M = s.Mockup
        const isLeft = s.side === 'left'
        return (
          <section
            key={i}
            className={`py-[120px] md:py-[180px] ${s.bg ?? ''}`}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${isLeft ? 'lg:[&>*:first-child]:order-2' : ''}`}>
                {/* Text */}
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewportConfig}
                  transition={{ duration: 0.6 }}
                >
                  <div className="inline-block px-3 py-1 mb-6 text-xs font-bold text-primary bg-primary/10 rounded-full uppercase tracking-wider">
                    {s.eyebrow}
                  </div>
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-6">
                    {s.title}
                  </h2>
                  <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8 max-w-xl">
                    {s.desc}
                  </p>

                  <div className="flex items-end gap-6 mb-8">
                    <div>
                      <div className="text-5xl md:text-6xl font-black text-foreground leading-none">
                        {s.metric.value}
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">{s.metric.label}</div>
                    </div>
                  </div>

                  <Link
                    href={s.href}
                    className="inline-flex items-center gap-2 text-base font-semibold text-primary hover:gap-3 transition-all"
                  >
                    자세히 보기
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </motion.div>

                {/* Mockup — 풀 사이즈 */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 40 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={viewportConfig}
                  transition={{ duration: 0.7, delay: 0.1 }}
                  className="lg:[transform:scale(1.05)]"
                >
                  <M />
                </motion.div>
              </div>
            </div>
          </section>
        )
      })}
    </>
  )
}
