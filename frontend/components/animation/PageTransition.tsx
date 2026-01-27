'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // 마운트 후 애니메이션 시작
    const timer = requestAnimationFrame(() => {
      setIsVisible(true)
    })

    return () => cancelAnimationFrame(timer)
  }, [])

  return (
    <div
      className={cn(
        'transition-all duration-300 ease-out',
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4',
        className
      )}
    >
      {children}
    </div>
  )
}

export default PageTransition
