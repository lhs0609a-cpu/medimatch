'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ChevronRight, Compass, MapPin, FileSignature, Stamp,
  Paintbrush, Stethoscope, Users, Sparkles, TrendingUp,
} from 'lucide-react'
import { fadeInUp, staggerContainer, staggerItem, viewportConfig } from '@/components/animation/MotionWrapper'

interface Stage {
  key: string
  step: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  partners: { code: string; label: string }[]
  duration: string
}

const stages: Stage[] = [
  {
    key: 'PLANNING',
    step: '01',
    label: '사업계획',
    description: '진료과·예산·시기 결정. 단독 vs 동업, 자금조달 계획까지.',
    icon: Compass,
    duration: '1~3개월',
    partners: [
      { code: 'consulting', label: '개원컨설팅' },
      { code: 'accounting', label: '회계법인' },
      { code: 'finance', label: '금융' },
    ],
  },
  {
    key: 'LOCATION_REVIEW',
    step: '02',
    label: '입지검토',
    description: '후보지·상권·인구통계·경쟁의원 분석. 임대료 협상까지.',
    icon: MapPin,
    duration: '1~2개월',
    partners: [
      { code: 'realestate', label: '부동산중개법인' },
      { code: 'consulting', label: '개원컨설팅' },
    ],
  },
  {
    key: 'CONTRACT',
    step: '03',
    label: '임대계약',
    description: '계약서 검토·법률 자문·보증금·권리금 처리.',
    icon: FileSignature,
    duration: '2~4주',
    partners: [
      { code: 'legal', label: '법무법인' },
      { code: 'realestate', label: '부동산중개법인' },
      { code: 'finance', label: '금융' },
    ],
  },
  {
    key: 'LICENSING',
    step: '04',
    label: '인허가',
    description: '사업자등록·의료기관 개설신고·심평원 등록.',
    icon: Stamp,
    duration: '2~6주',
    partners: [
      { code: 'tax', label: '세무법인' },
      { code: 'legal', label: '법무법인' },
      { code: 'consulting', label: '개원컨설팅' },
    ],
  },
  {
    key: 'CONSTRUCTION',
    step: '05',
    label: '인테리어',
    description: '시공사 선정·설계·공사·간판 발주.',
    icon: Paintbrush,
    duration: '6~12주',
    partners: [
      { code: 'interior', label: '인테리어' },
      { code: 'signage', label: '간판/사이니지' },
    ],
  },
  {
    key: 'EQUIPMENT',
    step: '06',
    label: '의료기기',
    description: '신품·리스·중고 비교, 발주, 설치, 약품 거래선.',
    icon: Stethoscope,
    duration: '4~8주',
    partners: [
      { code: 'equipment', label: '의료기기' },
      { code: 'pharma', label: '약품도매' },
      { code: 'finance', label: '금융' },
    ],
  },
  {
    key: 'HIRING',
    step: '07',
    label: '인력채용',
    description: '근로계약·4대보험·교육·급여 세팅.',
    icon: Users,
    duration: '3~6주',
    partners: [
      { code: 'labor', label: '노무법인' },
      { code: 'tax', label: '세무법인' },
    ],
  },
  {
    key: 'OPENING',
    step: '08',
    label: '개원준비',
    description: 'EMR 세팅·청구 등록·마케팅·프리오픈.',
    icon: Sparkles,
    duration: '2~4주',
    partners: [
      { code: 'emr', label: 'EMR/의료IT' },
      { code: 'marketing', label: '마케팅' },
    ],
  },
  {
    key: 'OPERATING',
    step: '09',
    label: '운영안정',
    description: '매출 모니터링·세무 결산·비용 최적화·경정청구.',
    icon: TrendingUp,
    duration: '지속',
    partners: [
      { code: 'tax', label: '세무법인' },
      { code: 'accounting', label: '회계법인' },
      { code: 'emr', label: 'EMR/의료IT' },
      { code: 'marketing', label: '마케팅' },
    ],
  },
]

export function StageInfographic() {
  const [active, setActive] = useState<string>('PLANNING')
  const current = stages.find(s => s.key === active) ?? stages[0]
  const CurrentIcon = current.icon

  return (
    <section className="py-[80px] md:py-[120px] bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          variants={staggerContainer}
          className="text-center mb-14"
        >
          <motion.div
            variants={staggerItem}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3182f6]/10 text-[#3182f6] text-sm font-medium mb-4"
          >
            개원 9단계 로드맵
          </motion.div>
          <motion.h2
            variants={staggerItem}
            className="text-3xl md:text-5xl font-bold tracking-tight mb-4"
          >
            어느 단계든, 필요한 협력사가
            <br className="hidden md:block" />
            <span className="text-[#3182f6]"> 매칭됩니다</span>
          </motion.h2>
          <motion.p
            variants={staggerItem}
            className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto"
          >
            단계를 클릭해 보세요. 그 시점에 필요한 솔루션을 한눈에 확인할 수 있습니다.
          </motion.p>
        </motion.div>

        {/* Timeline strip */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          variants={fadeInUp}
          className="relative overflow-x-auto pb-4 mb-8"
        >
          <div className="flex gap-2 min-w-max md:min-w-0 md:grid md:grid-cols-9">
            {stages.map((s) => {
              const Icon = s.icon
              const isActive = s.key === active
              return (
                <button
                  key={s.key}
                  onClick={() => setActive(s.key)}
                  className={`group relative flex flex-col items-center gap-2 px-3 py-4 rounded-2xl transition-all ${
                    isActive
                      ? 'bg-[#3182f6] text-white shadow-lg shadow-[#3182f6]/25'
                      : 'bg-background border border-foreground/8 hover:border-[#3182f6]/40 hover:bg-[#3182f6]/5'
                  }`}
                  style={{ minWidth: '110px' }}
                >
                  <span className={`text-[10px] font-semibold tracking-wider ${
                    isActive ? 'text-white/70' : 'text-muted-foreground'
                  }`}>
                    {s.step}
                  </span>
                  <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-[#3182f6]'}`} />
                  <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-foreground'}`}>
                    {s.label}
                  </span>
                  <span className={`text-[10px] ${isActive ? 'text-white/60' : 'text-muted-foreground'}`}>
                    {s.duration}
                  </span>
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Active stage detail */}
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-background border border-foreground/8 rounded-3xl p-6 md:p-10"
        >
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#3182f6]/10 flex items-center justify-center">
                  <CurrentIcon className="w-6 h-6 text-[#3182f6]" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground tracking-wider">STEP {current.step} · {current.duration}</div>
                  <h3 className="text-2xl md:text-3xl font-bold">{current.label}</h3>
                </div>
              </div>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-6">
                {current.description}
              </p>
              <Link
                href="/opening-package"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#3182f6] hover:text-[#3182f6]/80"
              >
                이 단계 솔루션 자세히 보기
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div>
              <div className="text-xs font-semibold text-muted-foreground tracking-wider mb-3">
                연결되는 협력사
              </div>
              <div className="space-y-2">
                {current.partners.map((p) => (
                  <Link
                    key={p.code}
                    href={`/partners?category=${p.code}`}
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-muted/40 hover:bg-[#3182f6]/10 transition-colors group"
                  >
                    <span className="text-sm font-medium text-foreground">{p.label}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-[#3182f6] group-hover:translate-x-0.5 transition-all" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
