'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Stethoscope } from 'lucide-react'
import { fadeInUp, staggerContainer, staggerItem, viewportConfig } from '@/components/animation/MotionWrapper'

const stats = [
  { value: '150+', label: '컨설팅 누적 건수' },
  { value: '97%', label: '고객 만족도' },
  { value: '8년', label: '의료 컨설팅 경력' },
  { value: '30+', label: '전문 파트너 네트워크' },
]

const photos = [
  { src: '/assets/consulting/doctor-interview.jpg', alt: '원장 인터뷰 촬영', aspect: 'aspect-[3/4]' },
  { src: '/assets/consulting/consultation-2.jpg', alt: '데이터 기반 상담', aspect: 'aspect-[4/3]' },
  { src: '/assets/consulting/doctor-meeting.jpg', alt: '원장 미팅', aspect: 'aspect-[4/3]' },
  { src: '/assets/consulting/clinic-lobby.jpg', alt: '병원 로비 촬영', aspect: 'aspect-[3/4]' },
]

export function ConsultingSection() {
  return (
    <section className="py-[80px] md:py-[120px] bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
            variants={staggerContainer}
          >
            <motion.div variants={staggerItem} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80 text-sm font-medium mb-6">
              <Stethoscope className="w-4 h-4" />
              현장에서 직접 뜁니다
            </motion.div>
            <motion.h2 variants={staggerItem} className="text-3xl md:text-5xl font-bold text-white mb-6">
              오직 한 분의 원장님을 위해<br />
              <span className="text-[#3182f6]">최고들이 모였습니다</span>
            </motion.h2>
            <motion.p variants={staggerItem} className="text-white/60 text-lg mb-8 leading-relaxed">
              메디플라톤은 책상 위의 컨설팅이 아닙니다. 직접 현장을 방문하고, 원장님과 마주 앉아 데이터를 분석하고, 카메라 앞에서 솔직한 이야기를 나눕니다.
            </motion.p>
            <motion.div variants={staggerItem} className="grid grid-cols-2 gap-6 mb-8">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-3xl font-bold text-[#3182f6] mb-1">{s.value}</div>
                  <div className="text-sm text-white/50">{s.label}</div>
                </div>
              ))}
            </motion.div>
            <motion.div variants={staggerItem}>
              <Link href="/opening-package" className="btn-primary btn-lg text-lg">
                개원 컨설팅 알아보기
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Photo grid */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
            variants={fadeInUp}
            className="grid grid-cols-2 gap-3"
          >
            <div className="space-y-3">
              <div className="rounded-2xl overflow-hidden">
                <img src={photos[0].src} alt={photos[0].alt} className={`w-full ${photos[0].aspect} object-cover`} />
              </div>
              <div className="rounded-2xl overflow-hidden">
                <img src={photos[1].src} alt={photos[1].alt} className={`w-full ${photos[1].aspect} object-cover`} />
              </div>
            </div>
            <div className="space-y-3 pt-6">
              <div className="rounded-2xl overflow-hidden">
                <img src={photos[2].src} alt={photos[2].alt} className={`w-full ${photos[2].aspect} object-cover`} />
              </div>
              <div className="rounded-2xl overflow-hidden">
                <img src={photos[3].src} alt={photos[3].alt} className={`w-full ${photos[3].aspect} object-cover`} />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
