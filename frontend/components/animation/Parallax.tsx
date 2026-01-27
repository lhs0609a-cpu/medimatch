'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface ParallaxProps {
  children: React.ReactNode
  className?: string
  speed?: number
  direction?: 'up' | 'down'
}

export function Parallax({
  children,
  className,
  speed = 0.5,
  direction = 'up',
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return

      const rect = ref.current.getBoundingClientRect()
      const windowHeight = window.innerHeight

      // 요소가 뷰포트에 있을 때만 계산
      if (rect.top < windowHeight && rect.bottom > 0) {
        const scrollProgress = (windowHeight - rect.top) / (windowHeight + rect.height)
        const parallaxOffset = (scrollProgress - 0.5) * 100 * speed
        setOffset(direction === 'up' ? -parallaxOffset : parallaxOffset)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [speed, direction])

  return (
    <div ref={ref} className={cn('overflow-hidden', className)}>
      <div
        className="transition-transform duration-100 ease-out will-change-transform"
        style={{ transform: `translateY(${offset}px)` }}
      >
        {children}
      </div>
    </div>
  )
}

export default Parallax
