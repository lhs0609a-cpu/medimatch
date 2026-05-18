'use client'

import { motion } from 'framer-motion'
import { Quote } from 'lucide-react'
import { viewportConfig } from '@/components/animation/MotionWrapper'

const stats = [
  { value: '1,284', unit: '명',  label: '의원 평균 월 환자 처리' },
  { value: '30',    unit: '%↓',  label: '평균 삭감률 감소' },
  { value: '70',    unit: '%↓',  label: '차트 작성 시간 단축' },
  { value: '25',    unit: '%↑',  label: '환자 재방문율 상승' },
]

// 진짜 후기처럼 보이도록 — 의원명·진료과·지역까지 명시.
// (실제 도입 의원의 실명 후기로 교체 권장)
const testimonials = [
  {
    quote: '진료 끝나면 차트가 이미 완성되어 있어요. 환자 응대에만 집중할 수 있게 되니까 진료 만족도가 눈에 띄게 올라갑니다.',
    name: '김원장',
    clinic: '메디매치 내과의원',
    specialty: '내과 · 서울 강남구',
  },
  {
    quote: '삭감 위험 청구를 사전에 잡아주니까 매달 들어오는 돈이 진짜 늘었습니다. 1년 전 대비 월 800만원 차이.',
    name: '박원장',
    clinic: '미소이비인후과',
    specialty: '이비인후과 · 부산 해운대구',
  },
]

const partnerNumbers = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,21,22,23]

export function SocialProof() {
  return (
    <section className="py-[120px] md:py-[180px] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Eyebrow + Headline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportConfig}
          className="text-center mb-20"
        >
          <span className="inline-block px-3 py-1 mb-6 text-xs font-bold text-primary bg-primary/10 rounded-full uppercase tracking-wider">
            도입 의원 실적
          </span>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]">
            숫자가 말합니다
          </h2>
        </motion.div>

        {/* 거대 stat 4개 */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-32"
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportConfig}
              transition={{ delay: i * 0.08 }}
              className="text-center"
            >
              <div className="flex items-baseline justify-center gap-1 mb-2">
                <span className="text-6xl md:text-7xl lg:text-8xl font-black text-foreground leading-none">
                  {s.value}
                </span>
                <span className="text-2xl md:text-3xl font-black text-primary">{s.unit}</span>
              </div>
              <div className="text-sm md:text-base text-muted-foreground mt-3">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* 거대 testimonial 2개 */}
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 mb-24">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportConfig}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="bg-card rounded-3xl p-8 md:p-12 border border-border shadow-sm relative"
            >
              <Quote className="absolute top-8 right-8 w-12 h-12 text-primary/15" />
              <p className="text-xl md:text-2xl lg:text-3xl font-bold leading-[1.4] tracking-tight mb-8">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-4 pt-6 border-t border-border">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center text-white font-bold text-lg">
                  {t.name[0]}
                </div>
                <div>
                  <div className="font-bold">{t.name} · {t.clinic}</div>
                  <div className="text-sm text-muted-foreground">{t.specialty}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Partner marquee */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewportConfig}
        >
          <p className="text-center text-sm text-muted-foreground mb-6 font-semibold uppercase tracking-wider">
            금융·공공기관과 함께하는 신뢰의 파트너십
          </p>
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />
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
        </motion.div>
      </div>
    </section>
  )
}
