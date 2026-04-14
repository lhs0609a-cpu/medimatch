'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { staggerContainer, staggerItem, viewportConfig } from '@/components/animation/MotionWrapper'

const services = [
  {
    title: '개원의 패키지',
    desc: '대출 + 마케팅 + PG + 중개 원스톱 솔루션',
    badge: 'HOT',
    badgeColor: 'bg-red-500',
    href: '/opening-package',
    image: '/assets/consulting/consultation-1.jpg',
  },
  {
    title: '병원·약국 매물',
    desc: '메디컬빌딩, 상가, 의원급 개원 공간 470+',
    badge: '470+',
    badgeColor: 'bg-[#3182f6]',
    href: '/buildings',
    image: '/assets/hospital/luxury-lobby-1.jpg',
  },
  {
    title: '약국 양수도',
    desc: '약국 양도양수, 권리금 매물 정보',
    badge: '120+',
    badgeColor: 'bg-[#3182f6]',
    href: '/pharmacy-match',
    image: '/assets/hospital/medical-equipment.jpg',
  },
  {
    title: '클라우드 EMR',
    desc: 'AI 차트 + 보험청구 + 경영 분석 올인원',
    badge: 'NEW',
    badgeColor: 'bg-emerald-500',
    href: '/services/emr',
    image: '/assets/hospital/treatment-room.jpg',
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
          <motion.h2
            variants={staggerItem}
            className="text-3xl md:text-5xl font-bold tracking-tight mb-4"
          >
            핵심 서비스
          </motion.h2>
          <motion.p
            variants={staggerItem}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            개원 준비부터 운영까지, 필요한 모든 것을 한 곳에서
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          variants={staggerContainer}
          className="grid md:grid-cols-2 gap-5 max-w-5xl mx-auto"
        >
          {services.map((s) => (
            <motion.div key={s.href} variants={staggerItem}>
              <Link
                href={s.href}
                className="group relative block h-64 md:h-72 rounded-2xl overflow-hidden"
              >
                <img
                  src={s.image}
                  alt={s.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />

                {/* Badge */}
                <span className={`absolute top-4 right-4 px-2.5 py-1 text-xs font-bold text-white ${s.badgeColor} rounded-full shadow-lg`}>
                  {s.badge}
                </span>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-1">{s.title}</h3>
                  <p className="text-white/70 text-sm mb-3">{s.desc}</p>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-white/90 group-hover:text-white transition-colors">
                    <span>자세히 보기</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
