'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { viewportConfig } from '@/components/animation/MotionWrapper'

const stats = [
  { value: '150', unit: '+', label: '컨설팅 누적' },
  { value: '97',  unit: '%', label: '고객 만족도' },
  { value: '8',   unit: '년', label: '의료 컨설팅 경력' },
  { value: '30',  unit: '+', label: '전문 파트너 네트워크' },
]

const photos = [
  { src: '/assets/consulting/doctor-interview.jpg', alt: '원장 인터뷰' },
  { src: '/assets/consulting/consultation-2.jpg',   alt: '데이터 기반 상담' },
  { src: '/assets/consulting/doctor-meeting.jpg',   alt: '원장 미팅' },
  { src: '/assets/consulting/clinic-lobby.jpg',     alt: '병원 로비' },
]

export function ConsultingSection() {
  return (
    <section className="py-[120px] md:py-[180px] bg-foreground text-background overflow-hidden relative">
      {/* 배경 후광 */}
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl -translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-primary/15 rounded-full blur-3xl translate-x-1/2 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          {/* 좌: 텍스트 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportConfig}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-3 py-1 mb-8 text-xs font-bold text-white bg-white/15 rounded-full uppercase tracking-wider backdrop-blur-sm">
              사람이 직접 — 책상 위 컨설팅 아닙니다
            </span>
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.05] mb-8">
              데이터만으론<br />
              <span className="text-primary">부족합니다</span>
            </h2>
            <p className="text-xl md:text-2xl text-white/70 leading-relaxed mb-12 max-w-xl">
              현장 방문, 마주 앉은 상담, 카메라 앞 솔직한 이야기.<br className="hidden md:block" />
              EMR이 자동화하는 것 외의 모든 의사결정을 함께 합니다.
            </p>

            {/* 거대 stat 4개 */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-10 mb-12">
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewportConfig}
                  transition={{ delay: 0.2 + i * 0.08 }}
                >
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-5xl md:text-6xl font-black text-primary leading-none">
                      {s.value}
                    </span>
                    <span className="text-2xl md:text-3xl font-black text-primary/80">{s.unit}</span>
                  </div>
                  <div className="text-sm text-white/50">{s.label}</div>
                </motion.div>
              ))}
            </div>

            <Link
              href="/opening-package"
              className="inline-flex items-center gap-2 px-8 py-5 text-base font-bold rounded-2xl bg-primary text-white hover:bg-blue-700 transition-all hover:shadow-2xl hover:shadow-primary/40"
            >
              개원 컨설팅 알아보기
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>

          {/* 우: 사진 4개 — 비대칭 배치 */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewportConfig}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="space-y-4">
              <div className="rounded-3xl overflow-hidden aspect-[3/4]">
                <img src={photos[0].src} alt={photos[0].alt} className="w-full h-full object-cover" />
              </div>
              <div className="rounded-3xl overflow-hidden aspect-[4/3]">
                <img src={photos[1].src} alt={photos[1].alt} className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="space-y-4 pt-12">
              <div className="rounded-3xl overflow-hidden aspect-[4/3]">
                <img src={photos[2].src} alt={photos[2].alt} className="w-full h-full object-cover" />
              </div>
              <div className="rounded-3xl overflow-hidden aspect-[3/4]">
                <img src={photos[3].src} alt={photos[3].alt} className="w-full h-full object-cover" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
