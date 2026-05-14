'use client'

/**
 * ModuleHeader — EMR 페이지 표준 상단 바.
 *
 * 좌측 5px 컬러 인디케이터 + 모듈 아이콘 박스 + 제목·부제 + breadcrumb + actions.
 * 모든 EMR 메인 페이지가 이 컴포넌트를 통해 정체성을 갖는다.
 *
 * <ModuleHeader
 *   moduleKey="chart"
 *   title="전자차트"           // 기본은 모듈 라벨
 *   subtitle="...optional"
 *   actions={<button>...</button>}
 *   breadcrumbs={[{label: '환자', href: '/emr/patients'}, {label: '김민수'}]}
 * />
 */
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { getModule, moduleClasses, type ModuleColor } from '@/lib/emr/modules'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface Props {
  moduleKey: string
  /** override label */
  title?: string
  /** override desc */
  subtitle?: string
  /** override icon (rare) — 일반적으로 module 아이콘 사용 */
  icon?: React.ReactNode
  /** override color (rare) */
  color?: ModuleColor
  actions?: React.ReactNode
  breadcrumbs?: BreadcrumbItem[]
  /** 보조 메타 텍스트 — 환자번호·날짜·상태 등 우측에 작게 */
  meta?: React.ReactNode
  /** 페이지 컨테이너 max-width 강제 */
  maxWidthClass?: string
  className?: string
}

export default function ModuleHeader({
  moduleKey,
  title,
  subtitle,
  icon,
  color,
  actions,
  breadcrumbs,
  meta,
  maxWidthClass = 'max-w-7xl',
  className = '',
}: Props) {
  const m = getModule(moduleKey)
  const cls = moduleClasses(color || m.color)
  const Icon = m.icon

  return (
    <div className={`relative ${className}`}>
      {/* 좌측 5px 컬러 인디케이터 — 페이지 정체성 신호 */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-[5px] rounded-r-full ${cls.indicator}`}
        aria-hidden="true"
      />
      {/* 헤더 본체 — 모듈 색의 미세 그라디언트 배경 */}
      <div
        className={`pl-5 pr-4 py-4 bg-gradient-to-r ${cls.headerGradient} to-transparent rounded-r-2xl`}
      >
        <div className={`${maxWidthClass} mx-auto`}>
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1 text-[11px] text-muted-foreground mb-2">
              {breadcrumbs.map((b, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="w-3 h-3 opacity-40" />}
                  {b.href ? (
                    <Link href={b.href} className="hover:text-foreground transition-colors">
                      {b.label}
                    </Link>
                  ) : (
                    <span className="text-foreground font-medium">{b.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}

          <div className="flex items-start gap-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={`shrink-0 w-11 h-11 rounded-xl ${cls.iconBox} flex items-center justify-center`}>
                {icon || <Icon className={`w-5 h-5 ${cls.iconColor}`} />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
                    {title || m.label}
                  </h1>
                  <span className={`hidden sm:inline-flex text-[10px] px-1.5 py-0.5 rounded-md ${cls.bgSoft} ${cls.fg} font-semibold uppercase tracking-wider`}>
                    {m.label}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5">
                  {subtitle || m.desc}
                </p>
              </div>
            </div>

            {meta && (
              <div className="text-right text-xs text-muted-foreground self-center">
                {meta}
              </div>
            )}

            {actions && (
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                {actions}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
