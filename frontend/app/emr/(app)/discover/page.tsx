'use client'

import Link from 'next/link'
import {
  Building2, Rocket, ShoppingCart, ArrowLeftRight, TrendingUp,
  Users2, MapPin, Sparkles, ArrowRight, Star,
} from 'lucide-react'
import { TossIcon } from '@/components/ui/TossIcon'
import ModuleHeader from '@/components/emr/ModuleHeader'

interface DiscoverCard {
  href: string
  icon: any
  color: string
  category: string
  title: string
  desc: string
  metric?: string
  badge?: string
}

const cards: DiscoverCard[] = [
  {
    href: '/buildings',
    icon: Building2,
    color: 'from-blue-500 to-indigo-600',
    category: '부동산',
    title: '병원 매물 470+',
    desc: '메디컬빌딩·상가·의원급 공간. 의원 운영하며 이전·확장 후보를 둘러보세요.',
    metric: '470+ 등록',
    badge: '실시간',
  },
  {
    href: '/opening-project',
    icon: Rocket,
    color: 'from-rose-500 to-red-600',
    category: '개원 도구',
    title: '개원 D-Day 체크리스트',
    desc: '인허가·인테리어·기기·인력까지 단계별. 분원·이전 시에도 그대로 사용.',
    metric: '단계별 자동',
    badge: 'NEW',
  },
  {
    href: '/group-buying',
    icon: ShoppingCart,
    color: 'from-amber-500 to-orange-600',
    category: '공동구매',
    title: '공동구매로 비용 절감',
    desc: '의료기기·소모품·인테리어를 다른 의원과 묶음 발주. 평균 15~30% 할인.',
    metric: '평균 22%↓',
  },
  {
    href: '/pharmacy-match',
    icon: ArrowLeftRight,
    color: 'from-emerald-500 to-teal-600',
    category: '약국 매칭',
    title: '주변 약국 양도양수',
    desc: '의원과 시너지 나는 약국 매물 익명 매칭. 양도 의향 약국과 무료 연결.',
    metric: '120+ 매물',
  },
  {
    href: '/landlord',
    icon: Users2,
    color: 'from-violet-500 to-purple-600',
    category: '건물주 모드',
    title: '내 건물에 의원 유치',
    desc: '소유 건물이 있다면 무료 등록. 개원의 매칭·수익화 + 인테리어 알선.',
    metric: '무료',
  },
  {
    href: '/pharmacist',
    icon: Star,
    color: 'from-cyan-500 to-sky-600',
    category: '약사 모드',
    title: '약사 양수도 등록',
    desc: '내 약국 양도·새 약국 인수 의향 등록. 협력 의원과 자동 매칭.',
    metric: '무료',
  },
]

const tips = [
  {
    icon: MapPin,
    title: '진료실에서 둘러보기',
    desc: '환자 응대 사이 5분 자투리 시간에 분원 후보·공동구매 체크.',
  },
  {
    icon: TrendingUp,
    title: '비즈니스 분석과 연결',
    desc: '\'리포트\'에서 매출/환자 추이 본 다음 분원 결정 → 매물 즉시 검색.',
  },
  {
    icon: Sparkles,
    title: '모두 무료',
    desc: 'EMR 체험 사용자도 이 섹션 전부 무료 사용. 매칭 성사 시 별도 협의.',
  },
]

export default function DiscoverPage() {
  return (
    <div>
      <ModuleHeader
        moduleKey="discover"
        title="발견"
        subtitle="EMR을 쓰다가 필요해지는 모든 것 — 매물·개원·공동구매·약국 매칭"
        icon={<Sparkles className="w-5 h-5 text-primary" />}
        maxWidthClass="max-w-6xl"
      />

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* 메인 카드 6개 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="card p-6 group hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="transition-transform group-hover:scale-110 group-hover:-rotate-3 duration-300">
                  <TossIcon icon={c.icon} color={c.color} size="lg" />
                </div>
                {c.badge && (
                  <span className="badge-primary text-2xs">{c.badge}</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground mb-1">{c.category}</div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">
                {c.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {c.desc}
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                {c.metric && (
                  <span className="text-xs font-semibold text-primary">{c.metric}</span>
                )}
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>

        {/* 사용 팁 3개 */}
        <div className="bg-secondary/40 rounded-2xl p-6">
          <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wider">
            왜 EMR 안에서 발견하나요?
          </h3>
          <div className="grid md:grid-cols-3 gap-5">
            {tips.map((t, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <t.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-sm mb-1">{t.title}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 한 줄 안내 */}
        <p className="text-center text-xs text-muted-foreground">
          모든 항목은 별도 페이지로 이동하지만, 같은 로그인(매직링크) 상태로 자동 연결됩니다.
        </p>
      </div>
    </div>
  )
}
