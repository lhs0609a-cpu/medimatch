'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Send, Monitor } from 'lucide-react'
import { viewportConfig } from '@/components/animation/MotionWrapper'

export function FinalCTA() {
  return (
    <section className="py-[120px] md:py-[180px] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportConfig}
          className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary via-blue-600 to-blue-800 p-12 md:p-20 lg:p-28"
        >
          {/* 배경 후광 */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-white/15 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-cyan-400/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
          </div>

          <div className="relative text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportConfig}
              transition={{ delay: 0.1 }}
              className="inline-block px-3 py-1 mb-8 text-xs font-bold text-primary bg-white rounded-full uppercase tracking-wider"
            >
              가입·카드 등록 0초
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportConfig}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-[1.02] mb-8"
            >
              지금 1초 만에<br />
              EMR을 시작하세요
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportConfig}
              transition={{ delay: 0.25 }}
              className="text-xl md:text-2xl text-white/85 max-w-2xl mx-auto mb-12 leading-relaxed"
            >
              차트·청구·리콜·예약 — 한 화면에서 다 됩니다.<br />
              필요해지면 매물·공구·약국까지.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportConfig}
              transition={{ delay: 0.35 }}
              className="flex flex-col sm:flex-row items-stretch gap-3 justify-center max-w-2xl mx-auto"
            >
              <Link
                href="/emr/crm"
                className="group inline-flex items-center justify-center gap-2 px-10 py-6 text-lg font-black rounded-2xl bg-white text-primary hover:bg-white/95 transition-all hover:scale-[1.02] shadow-2xl"
              >
                <Send className="w-5 h-5" />
                CRM 바로 시작
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/emr"
                className="inline-flex items-center justify-center gap-2 px-10 py-6 text-lg font-black rounded-2xl bg-white/15 hover:bg-white/25 text-white border-2 border-white/40 backdrop-blur-sm transition-all"
              >
                <Monitor className="w-5 h-5" />
                EMR 바로 시작
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={viewportConfig}
              transition={{ delay: 0.5 }}
              className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/80"
            >
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                가입 불필요
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                카드 등록 0
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                평생 무료
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                해지 위약금 0
              </span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
