'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, Mic, Shield, Send, Circle } from 'lucide-react'
import { staggerContainer, staggerItem, viewportConfig } from '@/components/animation/MotionWrapper'

// EMR 핵심 3가치를 실제 진료 사진 + UI 오버레이로 표현 (이모지/플랫 아이콘 X).
const features = [
  {
    image: '/assets/consulting/consultation-1.jpg',
    title: 'AI 음성 자동 차트',
    desc: '진료 대화만 하세요. CC·PI·PMH를 AI가 자동 분류하고 ICD-10 진단코드까지 추천합니다.',
    metric: '평균 차트 시간 70%↓',
    href: '/services/emr#ai-chart',
    overlay: (
      <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 bg-black/70 backdrop-blur-md text-white px-3 py-2 rounded-xl text-xs">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
        </span>
        <Mic className="w-3.5 h-3.5" />
        <span className="font-medium">녹음 중 — 00:42</span>
        <span className="ml-auto opacity-70">AI가 분석 중</span>
      </div>
    ),
  },
  {
    image: '/assets/hospital/medical-equipment.jpg',
    title: '삭감 방어 AI',
    desc: '과거 삭감 패턴을 학습해 위험 청구를 실시간 경고. 최적 코드 조합으로 삭감률 30% 감소.',
    metric: '삭감률 평균 30%↓',
    href: '/services/emr#claims',
    overlay: (
      <div className="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md px-3 py-2 rounded-xl text-xs shadow-lg">
        <div className="flex items-center gap-2 mb-1.5">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-semibold">실시간 청구 검증</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="flex items-center gap-1"><Circle className="w-1.5 h-1.5 fill-emerald-500 text-emerald-500" /> 안전 12</span>
          <span className="flex items-center gap-1"><Circle className="w-1.5 h-1.5 fill-amber-500 text-amber-500" /> 주의 3</span>
          <span className="flex items-center gap-1"><Circle className="w-1.5 h-1.5 fill-red-500 text-red-500" /> 위험 1</span>
        </div>
      </div>
    ),
  },
  {
    image: '/assets/consulting/doctor-meeting.jpg',
    title: 'CRM · 환자 리콜',
    desc: '3개월 미방문 환자 자동 감지·알림톡 발송. 야간 차단·동의 검증 등 안전 가드 18종.',
    metric: '재방문율 25%↑',
    href: '/emr/crm',
    overlay: (
      <div className="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md px-3 py-2 rounded-xl text-xs shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#FEE500] flex items-center justify-center flex-shrink-0">
            <Send className="w-3.5 h-3.5 text-zinc-800" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">알림톡 발송 완료</div>
            <div className="text-[10px] text-muted-foreground">3개월 미방문 환자 142명 · 전송 성공 138</div>
          </div>
        </div>
      </div>
    ),
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
            EMR 핵심 3가치
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
          className="grid md:grid-cols-3 gap-5 max-w-6xl mx-auto"
        >
          {features.map((f) => (
            <motion.div key={f.title} variants={staggerItem}>
              <Link
                href={f.href}
                className="group block h-full rounded-2xl overflow-hidden bg-card border border-border hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                {/* 실제 사진 + UI 오버레이 */}
                <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100">
                  <Image
                    src={f.image}
                    alt={f.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                  {f.overlay}
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
          ))}
        </motion.div>

        {/* 하단 가격 안내 — ID당 과금 */}
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
