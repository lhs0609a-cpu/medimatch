'use client'

import { cn } from '@/lib/utils'

interface SkipLinkProps {
  href?: string
  children?: React.ReactNode
  className?: string
}

/**
 * 키보드 사용자를 위한 메인 콘텐츠로 건너뛰기 링크
 * 탭 키로 포커스 시에만 표시됨
 */
export function SkipLink({
  href = '#main-content',
  children = '메인 콘텐츠로 건너뛰기',
  className,
}: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only',
        'focus:absolute focus:top-4 focus:left-4 focus:z-[9999]',
        'focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground',
        'focus:rounded-lg focus:font-medium focus:outline-none focus:ring-2 focus:ring-ring',
        className
      )}
    >
      {children}
    </a>
  )
}

export default SkipLink
