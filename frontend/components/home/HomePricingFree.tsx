'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Check, ArrowRight, Sparkles } from 'lucide-react'
import { viewportConfig } from '@/components/animation/MotionWrapper'

const plans = [
  {
    badge: '평생 무료',
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    name: '1ID',
    price: '0',
    unit: '원',
    period: '평생',
    desc: '의사 1명 의원',
    features: [
      'AI 음성 자동 차트',
      '삭감 방어 AI 청구',
      'CRM 환자 리콜 (월 1,000건)',
      '환자 카톡 알림톡',
      '예약·접수·수납',
      '데이터 무료 Export',
    ],
    cta: '지금 시작',
    href: '/emr',
    highlight: false,
  },
  {
    badge: '가장 인기',
    badgeColor: 'bg-primary text-white',
    name: '2~4ID',
    price: '39,000',
    unit: '원',
    period: '/ID/월',
    desc: '페이닥·이중원장',
    features: [
      '1ID 모든 기능 +',
      'CRM 무제한 발송',
      '실시간 충돌 검증',
      '의원 운영 인사이트',
      '직원 권한 관리',
      '우선 기술지원',
    ],
    cta: '시작하기',
    href: '/emr',
    highlight: true,
  },
  {
    badge: '대형 의원',
    badgeColor: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
    name: '5+ID',
    price: '29,000~',
    unit: '원',
    period: '/ID/월',
    desc: '다인 진료실·분원',
    features: [
      '2~4ID 모든 기능 +',
      '멀티 지점 통합 관리',
      '백오피스 권한 그룹',
      'SSO·SAML 연동',
      '전담 매니저',
      'SLA 99.9%',
    ],
    cta: '문의하기',
    href: '/contact',
    highlight: false,
  },
]

export function HomePricingFree() {
  return (
    <section className="py-[120px] md:py-[180px] bg-gradient-to-b from-background to-secondary/30 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportConfig}
          className="text-center mb-20"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/30 rounded-full uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            의사 평생 무료
          </span>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6">
            의원 크기에 맞춰<br />
            <span className="text-primary">사용자 ID당</span>
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            PC 대수가 아닌 사람 수 기준.<br className="hidden md:block" />
            페이닥·이중원장·다인 진료실에 유리합니다.
          </p>
        </motion.div>

        {/* 거대 가격 카드 3개 */}
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportConfig}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className={`relative rounded-3xl p-8 md:p-10 ${
                p.highlight
                  ? 'bg-gradient-to-br from-primary to-blue-700 text-white shadow-2xl shadow-primary/30 lg:scale-105 lg:-translate-y-2'
                  : 'bg-card border border-border'
              }`}
            >
              {/* Badge */}
              <div className={`inline-block px-3 py-1 mb-6 text-xs font-bold rounded-full uppercase tracking-wider ${
                p.highlight ? 'bg-white text-primary' : p.badgeColor
              }`}>
                {p.badge}
              </div>

              {/* Plan name */}
              <div className={`text-2xl font-black mb-1 ${p.highlight ? 'text-white' : 'text-foreground'}`}>
                {p.name}
              </div>
              <div className={`text-sm mb-8 ${p.highlight ? 'text-white/80' : 'text-muted-foreground'}`}>
                {p.desc}
              </div>

              {/* Price — 거대 */}
              <div className="mb-8 flex items-baseline gap-1">
                <span className={`text-6xl md:text-7xl font-black leading-none ${
                  p.highlight ? 'text-white' : 'text-foreground'
                }`}>
                  {p.price}
                </span>
                <span className={`text-2xl font-bold ${
                  p.highlight ? 'text-white' : 'text-foreground'
                }`}>{p.unit}</span>
                <span className={`text-base ml-1 ${
                  p.highlight ? 'text-white/70' : 'text-muted-foreground'
                }`}>{p.period}</span>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-10">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      p.highlight ? 'text-white' : 'text-primary'
                    }`} />
                    <span className={p.highlight ? 'text-white/95' : 'text-foreground'}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={p.href}
                className={`inline-flex w-full items-center justify-center gap-2 px-6 py-4 text-base font-bold rounded-2xl transition-all ${
                  p.highlight
                    ? 'bg-white text-primary hover:bg-white/90'
                    : 'bg-foreground text-background hover:opacity-90'
                }`}
              >
                {p.cta}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* "왜 무료?" 신뢰 빌딩 한 줄 */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewportConfig}
          className="mt-16 text-center max-w-3xl mx-auto"
        >
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            <b className="text-foreground">왜 의사는 무료인가요?</b> EMR 사용료 대신,
            의원 운영 중 자연스럽게 만나는 협력사 매칭(인테리어·기기·매물·공동구매)에서 수수료를 받습니다. 의사는 EMR만 쓰면 됩니다.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
