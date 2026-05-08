'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, TrendingUp, Target, Shield, Zap } from 'lucide-react'
import { fadeInUp, staggerContainer, staggerItem, viewportConfig } from '@/components/animation/MotionWrapper'

const benefits = [
  {
    icon: Target,
    title: '검증된 lead만',
    desc: '예산·전공·지역·시기까지 1차 상담을 거친 의사 lead만 매칭. 콜드콜 없이 바로 견적 단계로.',
  },
  {
    icon: TrendingUp,
    title: '단계별 정확한 타이밍',
    desc: '개원 9단계 트래커가 그 순간 필요한 협력사를 자동 추천. 우리 차례에 정확히 도달.',
  },
  {
    icon: Shield,
    title: '계약·정산 보호',
    desc: '에스크로·계약서 검토·수수료 정산까지 플랫폼이 보증. 떼이지 않습니다.',
  },
  {
    icon: Zap,
    title: '제로 마케팅 비용',
    desc: '광고비 대신 성공 수수료. 계약 성사 시에만 정산해 손익이 명확합니다.',
  },
]

export function PartnerOnboardingCTA() {
  return (
    <section className="py-[80px] md:py-[120px] bg-gradient-to-b from-muted/30 to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-foreground text-background rounded-3xl p-8 md:p-14 overflow-hidden relative">
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#3182f6]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#3182f6]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative grid lg:grid-cols-2 gap-10 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={viewportConfig}
              variants={staggerContainer}
            >
              <motion.div
                variants={staggerItem}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80 text-sm font-medium mb-5"
              >
                협력사 입점 안내
              </motion.div>
              <motion.h2
                variants={staggerItem}
                className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight"
              >
                개원의를 찾는<br />
                가장 짧은 길
              </motion.h2>
              <motion.p
                variants={staggerItem}
                className="text-white/60 text-base md:text-lg leading-relaxed mb-8"
              >
                부동산중개법인·회계법인·세무법인·노무법인·인테리어·의료기기·EMR·마케팅 등<br />
                개원 협력사를 위한 lead 매칭 플랫폼.
              </motion.p>
              <motion.div variants={staggerItem} className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/partners?onboard=1"
                  className="btn-primary btn-lg text-base inline-flex"
                >
                  무료로 입점 신청
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/contact?type=partner"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold rounded-2xl border border-white/20 text-white hover:bg-white/5 transition-colors"
                >
                  파트너십 문의
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={viewportConfig}
              variants={fadeInUp}
              className="grid sm:grid-cols-2 gap-3"
            >
              {benefits.map((b) => {
                const Icon = b.icon
                return (
                  <div
                    key={b.title}
                    className="p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#3182f6]/20 flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5 text-[#3182f6]" />
                    </div>
                    <h3 className="text-base font-bold text-white mb-1">{b.title}</h3>
                    <p className="text-sm text-white/60 leading-relaxed">{b.desc}</p>
                  </div>
                )
              })}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
