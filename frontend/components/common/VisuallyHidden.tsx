'use client'

import { cn } from '@/lib/utils'

interface VisuallyHiddenProps {
  children: React.ReactNode
  className?: string
  as?: keyof JSX.IntrinsicElements
}

/**
 * 시각적으로는 숨기지만 스크린 리더에는 읽히는 컴포넌트
 * 접근성을 위해 아이콘 버튼 등에 레이블을 제공할 때 사용
 */
export function VisuallyHidden({
  children,
  className,
  as: Component = 'span',
}: VisuallyHiddenProps) {
  return (
    <Component
      className={cn(
        'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0',
        '[clip:rect(0,0,0,0)]',
        className
      )}
    >
      {children}
    </Component>
  )
}

export default VisuallyHidden
