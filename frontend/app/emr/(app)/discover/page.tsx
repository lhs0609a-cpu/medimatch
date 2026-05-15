'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  MapPin, TrendingUp, Sparkles, ArrowRight,
} from 'lucide-react'
import ModuleHeader from '@/components/emr/ModuleHeader'

interface DiscoverCard {
  href: string
  image: string
  category: string
  title: string
  desc: string
  metric?: string
  badge?: string
}

const cards: DiscoverCard[] = [
  {
    href: '/buildings',
    image: '/assets/hospital/luxury-lobby-1.jpg',
    category: '부동산',
    title: '병원 매물 470+',
    desc: '메디컬빌딩·상가·의원급 공간. 의원 운영하며 이전·확장 후보를 둘러보세요.',
    metric: '470+ 등록',
    badge: '실시간',
  },
  {
    href: '/opening-project',
    image: '/assets/consulting/clinic-lobby.jpg',
    category: '개원 도구',
    title: '개원 D-Day 체크리스트',
    desc: '인허가·인테리어·기기·인력까지 단계별. 분원·이전 시에도 그대로 사용.',
    metric: '단계별 자동',
    badge: 'NEW',
  },
  {
    href: '/group-buying',
    image: '/assets/hospital/medical-equipment.jpg',
    category: '공동구매',
    title: '공동구매로 비용 절감',
    desc: '의료기기·소모품·인테리어를 다른 의원과 묶음 발주. 평균 15~30% 할인.',
    metric: '평균 22%↓',
  },
  {
    href: '/pharmacy-match',
    image: '/assets/hospital/treatment-room.jpg',
    category: '약국 매칭',
    title: '주변 약국 양도양수',
    desc: '의원과 시너지 나는 약국 매물 익명 매칭. 양도 의향 약국과 무료 연결.',
    metric: '120+ 매물',
  },
  {
    href: '/landlord',
    image: '/assets/hospital/luxury-lobby-2.jpg',
    category: '건물주 모드',
    title: '내 건물에 의원 유치',
    desc: '소유 건물이 있다면 무료 등록. 개원의 매칭·수익화 + 인테리어 알선.',
    metric: '무료',
  },
  {
    href: '/pharmacist',
    image: '/assets/consulting/consultation-2.jpg',
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
    desc: "'리포트'에서 매출/환자 추이 본 다음 분원 결정 → 매물 즉시 검색.",
  },
  {
    icon: Sparkles,
    title: '모두 무료',
    desc: 'EMR 체험 사용자도 이 섹션 전부 무료. 매칭 성사 시 별도 협의.',
  },
]

export default function DiscoverPage() {
  return (
    <div>
      <ModuleHeader
        moduleKey="discover"
        title="발견"
        subtitle="EMR을 쓰다가 필요해지는 모든 것 — 매물·개원·공동구매·약국 매칭"
        maxWidthClass="max-w-6xl"
      />

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* 메인 카드 6개 — 실제 사진 + 텍스트 오버레이 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="group block rounded-2xl overflow-hidden bg-card border border-border hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              {/* 사진 */}
              <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100">
                <Image
                  src={c.image}
                  alt={c.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                {c.badge && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 bg-white/95 text-zinc-700 text-2xs font-semibold rounded-full">
                    {c.badge}
                  </span>
                )}
                <span className="absolute top-3 left-3 px-2 py-0.5 bg-black/60 backdrop-blur-sm text-white text-2xs font-semibold rounded-full">
                  {c.category}
                </span>
              </div>
              {/* 텍스트 */}
              <div className="p-5">
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

        <p className="text-center text-xs text-muted-foreground">
          모든 항목은 별도 페이지로 이동하지만, 같은 로그인(매직링크) 상태로 자동 연결됩니다.
        </p>
      </div>
    </div>
  )
}
