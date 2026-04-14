'use client'

import { motion } from 'framer-motion'
import { Trophy, Users, Clock, Heart } from 'lucide-react'
import { staggerContainer, staggerItem, viewportConfig } from '@/components/animation/MotionWrapper'

const metrics = [
  { icon: Trophy, value: '150+', label: '성공 사례', color: 'text-[#3182f6]' },
  { icon: Users, value: '97%', label: '만족도', color: 'text-[#3182f6]' },
  { icon: Clock, value: '8년', label: '경력', color: 'text-[#3182f6]' },
  { icon: Heart, value: '30+', label: '파트너', color: 'text-[#3182f6]' },
]

const partnerNumbers = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,21,22,23]

export function SocialProof() {
  return (
    <section className="py-[80px] md:py-[120px] bg-secondary/50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        {/* Metric bar */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          variants={staggerContainer}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {metrics.map((m) => {
            const Icon = m.icon
            return (
              <motion.div
                key={m.label}
                variants={staggerItem}
                className="text-center p-6 bg-card rounded-2xl border border-border"
              >
                <Icon className={`w-8 h-8 ${m.color} mx-auto mb-3`} />
                <div className={`text-3xl md:text-4xl font-black ${m.color} mb-1`}>{m.value}</div>
                <div className="text-sm text-muted-foreground">{m.label}</div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>

      {/* Partner logo marquee */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-secondary/50 to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-secondary/50 to-transparent z-10" />
        <div className="flex animate-marquee gap-12 items-center">
          {[...Array(2)].map((_, setIdx) => (
            <div key={setIdx} className="flex gap-12 items-center flex-shrink-0">
              {partnerNumbers.map((n) => (
                <img
                  key={`${setIdx}-${n}`}
                  src={`/assets/partners/partner-${String(n).padStart(2, '0')}.png`}
                  alt={`협력사 ${n}`}
                  className="h-10 md:h-12 object-contain opacity-60 hover:opacity-100 transition-opacity flex-shrink-0 grayscale hover:grayscale-0"
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Trust line */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <p className="text-center text-sm text-muted-foreground">
          금융·공공기관과 함께하는 신뢰의 파트너십
        </p>
      </div>
    </section>
  )
}
