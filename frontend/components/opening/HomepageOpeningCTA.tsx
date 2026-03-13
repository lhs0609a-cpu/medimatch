'use client'

import Link from 'next/link'
import {
  Rocket, ArrowRight,
  ClipboardList, MapPin, FileCheck, Ruler,
  Stethoscope, Users, Megaphone, PartyPopper,
  CheckCircle2,
} from 'lucide-react'

const MINI_PHASES = [
  { id: 1, title: '사업계획', icon: ClipboardList, color: '#3B82F6' },
  { id: 2, title: '입지선정', icon: MapPin, color: '#10B981' },
  { id: 3, title: '인허가', icon: FileCheck, color: '#F59E0B' },
  { id: 4, title: '인테리어', icon: Ruler, color: '#8B5CF6' },
  { id: 5, title: '장비도입', icon: Stethoscope, color: '#EC4899' },
  { id: 6, title: '인력채용', icon: Users, color: '#06B6D4' },
  { id: 7, title: '마케팅', icon: Megaphone, color: '#F97316' },
  { id: 8, title: '개원', icon: PartyPopper, color: '#EF4444' },
]

export default function HomepageOpeningCTA() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-blue-500/5 to-blue-400/5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-5">
            <Rocket className="w-4 h-4" />
            개원 여정 가이드
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            8단계만 따라오세요.<br />
            <span className="text-primary">개원이 완성됩니다.</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            사업계획부터 개원 당일까지, 44개 체크리스트로 빠짐없이 준비하세요
          </p>
        </div>

        {/* Mini 8-Phase Timeline Preview */}
        <div className="mb-10">
          {/* Desktop: horizontal */}
          <div className="hidden md:flex items-center justify-between max-w-3xl mx-auto relative">
            {/* Connecting line */}
            <div className="absolute top-5 left-[40px] right-[40px] h-0.5 bg-border z-0" />

            {MINI_PHASES.map((phase) => {
              const Icon = phase.icon
              return (
                <div key={phase.id} className="flex flex-col items-center gap-2 relative z-10">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg"
                    style={{ backgroundColor: phase.color }}
                  >
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                    {phase.title}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Mobile: horizontal scroll */}
          <div className="md:hidden overflow-x-auto pb-2 -mx-4 px-4">
            <div className="flex items-center gap-1 min-w-max">
              {MINI_PHASES.map((phase, i) => {
                const Icon = phase.icon
                return (
                  <div key={phase.id} className="flex items-center">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: phase.color }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] font-medium text-muted-foreground">{phase.title}</span>
                    </div>
                    {i < MINI_PHASES.length - 1 && (
                      <div className="w-4 h-0.5 bg-border mx-1 mt-[-12px]" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          <Link
            href="/opening-project/wizard"
            className="btn-primary px-6 py-3 text-base"
          >
            <Rocket className="w-5 h-5" />
            지금 바로 시작하기
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/opening-project"
            className="btn-ghost px-6 py-3 text-base"
          >
            미리 둘러보기
          </Link>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-6 sm:gap-10 text-center">
          {[
            { value: '8단계', label: '체계적 여정' },
            { value: '44개', label: '체크리스트' },
            { value: '~10개월', label: '평균 준비기간' },
            { value: '무료', label: '로그인 없이 시작' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-lg sm:text-xl font-bold text-primary">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
