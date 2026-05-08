'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Building, Scale, Calculator, Receipt, UserCog, Briefcase,
  Landmark, Paintbrush, Stethoscope, Monitor, PenTool,
  Megaphone, Pill, ArrowRight,
} from 'lucide-react'
import { staggerContainer, staggerItem, viewportConfig } from '@/components/animation/MotionWrapper'

interface CategoryCard {
  code: string
  label: string
  desc: string
  icon: React.ComponentType<{ className?: string }>
  count: string
  accent: string
}

const categories: CategoryCard[] = [
  { code: 'realestate',  label: '부동산중개법인', desc: '의료시설 전문 중개·임대차 협상',     icon: Building,    count: '120+', accent: 'from-blue-500/10 to-blue-500/5 text-blue-600' },
  { code: 'legal',       label: '법무법인',       desc: '의료법·임대차·동업·인수 자문',         icon: Scale,       count: '40+',  accent: 'from-violet-500/10 to-violet-500/5 text-violet-600' },
  { code: 'accounting',  label: '회계법인',       desc: '재무자문·기장·자금조달',                icon: Calculator,  count: '30+',  accent: 'from-indigo-500/10 to-indigo-500/5 text-indigo-600' },
  { code: 'tax',         label: '세무법인',       desc: '개원신고·종합소득세·경정청구',          icon: Receipt,     count: '50+',  accent: 'from-emerald-500/10 to-emerald-500/5 text-emerald-600' },
  { code: 'labor',       label: '노무법인',       desc: '근로계약·4대보험·인사 자문',            icon: UserCog,     count: '20+',  accent: 'from-teal-500/10 to-teal-500/5 text-teal-600' },
  { code: 'consulting',  label: '개원컨설팅',     desc: '입지·자금·운영 종합 컨설팅',           icon: Briefcase,   count: '25+',  accent: 'from-amber-500/10 to-amber-500/5 text-amber-600' },
  { code: 'finance',     label: '금융/대출',      desc: '의료인 전용 대출·리스·보험',            icon: Landmark,    count: '15+',  accent: 'from-orange-500/10 to-orange-500/5 text-orange-600' },
  { code: 'interior',    label: '인테리어',       desc: '병원 전문 시공·설계',                   icon: Paintbrush,  count: '80+',  accent: 'from-rose-500/10 to-rose-500/5 text-rose-600' },
  { code: 'equipment',   label: '의료기기',       desc: '신품·리스·중고 견적 비교',              icon: Stethoscope, count: '60+',  accent: 'from-cyan-500/10 to-cyan-500/5 text-cyan-600' },
  { code: 'emr',         label: 'EMR/의료IT',     desc: 'EMR·예약·청구·DUR 통합',                icon: Monitor,     count: '12+',  accent: 'from-sky-500/10 to-sky-500/5 text-sky-600' },
  { code: 'signage',     label: '간판/사이니지',  desc: '외부간판·내부사인·UI',                  icon: PenTool,     count: '25+',  accent: 'from-fuchsia-500/10 to-fuchsia-500/5 text-fuchsia-600' },
  { code: 'marketing',   label: '마케팅',         desc: '환자 유입 부스팅 패키지',               icon: Megaphone,   count: '35+',  accent: 'from-pink-500/10 to-pink-500/5 text-pink-600' },
  { code: 'pharma',      label: '약품도매',       desc: '도매 직거래·약가 절감',                 icon: Pill,        count: '18+',  accent: 'from-green-500/10 to-green-500/5 text-green-600' },
]

export function PartnerCategoryGrid() {
  return (
    <section className="py-[80px] md:py-[120px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          variants={staggerContainer}
          className="text-center mb-12"
        >
          <motion.div
            variants={staggerItem}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3182f6]/10 text-[#3182f6] text-sm font-medium mb-4"
          >
            13개 vertical · 500+ 검증 협력사
          </motion.div>
          <motion.h2
            variants={staggerItem}
            className="text-3xl md:text-5xl font-bold tracking-tight mb-4"
          >
            개원에 필요한 모든 분야,
            <br className="hidden md:block" />
            <span className="text-[#3182f6]">한 곳에서 비교</span>
          </motion.h2>
          <motion.p
            variants={staggerItem}
            className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto"
          >
            카테고리별로 검증된 협력사 중 지역·예산·평점에 맞는 곳을 무료로 매칭해드립니다.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          variants={staggerContainer}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
        >
          {categories.map((c) => {
            const Icon = c.icon
            return (
              <motion.div key={c.code} variants={staggerItem}>
                <Link
                  href={`/partners?category=${c.code}`}
                  className="group relative block p-5 rounded-2xl bg-background border border-foreground/8 hover:border-[#3182f6]/40 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${c.accent} mb-3`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <h3 className="text-base font-bold text-foreground truncate">{c.label}</h3>
                    <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">{c.count}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{c.desc}</p>
                  <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#3182f6] opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>업체 보기</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>

        <div className="text-center mt-10">
          <Link
            href="/partners"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-foreground border border-foreground/15 rounded-xl hover:bg-muted/50 transition-colors"
          >
            전체 협력사 둘러보기
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
