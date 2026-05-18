'use client'

import Link from 'next/link'
import { ArrowRight, Mail, MapPin } from 'lucide-react'

const footerLinks = {
  '서비스': [
    { label: 'EMR (의사 무료)', href: '/emr', badge: 'LIVE' },
    { label: 'CRM · 환자 리콜', href: '/emr/crm', badge: 'NEW' },
    { label: 'AI 보험청구', href: '/emr/claims' },
    { label: 'AI 경정청구', href: '/emr/tax-correction' },
    { label: '비즈니스 분석', href: '/emr-dashboard' },
    { label: '클라우드 EMR 소개', href: '/services/emr' },
  ],
  'EMR 안의 발견': [
    { label: '병원 매물', href: '/buildings' },
    { label: '개원 D-Day', href: '/opening-project' },
    { label: '공동구매', href: '/group-buying' },
    { label: '약국 양도양수', href: '/pharmacy-match' },
    { label: '건물주 등록', href: '/landlord' },
  ],
  '개원 도구': [
    { label: 'OpenSim 시뮬레이션', href: '/simulate' },
    { label: '비용 계산기', href: '/cost-calculator' },
    { label: 'BEP 분석기', href: '/bep-analyzer' },
    { label: '체크리스트', href: '/checklist' },
    { label: 'EMR 비교', href: '/emr-compare' },
  ],
  '고객 지원': [
    { label: '도움말', href: '/help' },
    { label: '문의하기', href: '/contact' },
    { label: '이용약관', href: '/terms' },
    { label: '개인정보처리방침', href: '/privacy' },
  ],
} as const

export function HomeFooter() {
  return (
    <footer className="bg-secondary/40 border-t border-border" role="contentinfo">
      {/* 상단: 거대 CTA 띠 */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="grid md:grid-cols-[1.5fr_1fr] gap-10 items-center">
            <div>
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1] mb-3">
                준비되셨나요?<br />
                <span className="text-primary">1초 만에 시작해보세요</span>
              </h3>
              <p className="text-base md:text-lg text-muted-foreground">
                가입·카드 등록 없이, 의사 평생 무료입니다.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/emr"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold rounded-2xl bg-primary text-white hover:bg-blue-700 transition-all hover:shadow-xl hover:shadow-primary/30"
              >
                EMR 바로 시작
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-2xl border-2 border-foreground/15 hover:border-foreground/30 transition-all"
              >
                상담 문의
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 본문: 거대 링크 그리드 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="grid lg:grid-cols-[1fr_2.5fr] gap-12 lg:gap-16">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <img
                src="/assets/logo/mediplaton-horizontal.png"
                alt="MEDI-PLATON"
                className="h-9 object-contain"
              />
            </Link>
            <p className="text-base text-muted-foreground leading-relaxed mb-6 max-w-sm">
              의사가 진료에만 집중할 수 있는<br />
              모든 도구를 한 곳에.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <a href="mailto:hello@brandplaton.com" className="hover:text-foreground transition-colors">
                  hello@brandplaton.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>서울특별시 · 메디플라톤</span>
              </div>
            </div>
          </div>

          {/* Link columns — 4-col */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h4 className="font-bold mb-4 text-foreground uppercase text-xs tracking-wider">
                  {title}
                </h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                        {'badge' in link && link.badge && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            link.badge === 'NEW'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                          }`}>
                            {link.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 하단: 저작권 */}
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-3 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} 메디플라톤. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>의사 평생 무료 · 가입 불필요 · 평균 차트 시간 70%↓</span>
            <Link
              href="/admin"
              className="text-muted-foreground/30 hover:text-muted-foreground transition-colors"
            >
              관리자
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
