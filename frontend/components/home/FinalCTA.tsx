'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { fadeInUp, viewportConfig } from '@/components/animation/MotionWrapper'

export function FinalCTA() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          variants={fadeInUp}
          className="relative overflow-hidden rounded-3xl bg-[#3182f6] p-8 md:p-16"
        >
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          </div>

          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              성공적인 개원, 지금 시작하세요
            </h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              첫 시뮬레이션은 완전 무료입니다. AI가 분석한 데이터로 현명한 결정을 내리세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/simulate" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#3182f6] rounded-xl font-semibold hover:bg-white/90 transition-colors shadow-lg text-lg">
                무료 시뮬레이션
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/register" className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 text-white rounded-xl font-semibold hover:bg-white/10 transition-colors text-lg">
                회원가입
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
