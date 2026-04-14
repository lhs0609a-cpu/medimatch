'use client'

import Link from 'next/link'

const footerLinks = {
  서비스: [
    { label: 'OpenSim', href: '/simulate' },
    { label: '매물 검색', href: '/buildings' },
    { label: 'PharmMatch', href: '/pharmacy-match' },
    { label: '지도', href: '/map' },
    { label: '개원의 패키지', href: '/opening-package' },
    { label: '홈페이지 무료제작', href: '/services/homepage', badge: 'NEW' },
    { label: '프로그램 무료제작', href: '/services/program', badge: 'NEW' },
    { label: '클라우드 EMR', href: '/services/emr', badge: 'NEW' },
    { label: 'PlatonEMR 프로그램', href: '/emr', badge: 'LIVE' },
    { label: 'EMR 비즈니스 분석', href: '/emr-dashboard', badge: 'NEW' },
    { label: 'AI 보험청구', href: '/emr/claims', badge: 'NEW' },
    { label: 'AI 경정청구', href: '/emr/tax-correction', badge: 'NEW' },
  ],
  '개원 도구': [
    { label: '비용 계산기', href: '/cost-calculator' },
    { label: 'BEP 분석기', href: '/bep-analyzer' },
    { label: '체크리스트', href: '/checklist' },
    { label: 'EMR 비교', href: '/emr-compare' },
    { label: '전체 도구 보기 →', href: '/#services' },
  ],
  고객지원: [
    { label: '도움말', href: '/help' },
    { label: '문의하기', href: '/contact' },
    { label: '이용약관', href: '/terms' },
    { label: '개인정보처리방침', href: '/privacy' },
  ],
}

export function HomeFooter() {
  return (
    <footer className="py-16 border-t border-border" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <img
                src="/assets/logo/mediplaton-horizontal.png"
                alt="MEDI-PLATON"
                className="h-8 object-contain"
              />
            </Link>
            <p className="text-muted-foreground mb-4 text-sm">
              의료 개원의 모든 것을 연결하는 데이터 기반 통합 플랫폼
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold mb-4">{title}</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link href={link.href} className="hover:text-foreground transition-colors flex items-center gap-1">
                      {link.label}
                      {'badge' in link && link.badge && (
                        <span className="text-[10px] font-bold text-[#3182f6] bg-blue-100 px-1 rounded">{link.badge}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} 메디플라톤. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <p>의료 개원의 모든 것을 연결합니다</p>
            <Link href="/admin" className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">관리자</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
