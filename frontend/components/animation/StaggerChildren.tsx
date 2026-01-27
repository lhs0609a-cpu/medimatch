'use client'

import { Children, cloneElement, isValidElement } from 'react'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { cn } from '@/lib/utils'

interface StaggerChildrenProps {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
  initialDelay?: number
  triggerOnce?: boolean
  threshold?: number
}

export function StaggerChildren({
  children,
  className,
  staggerDelay = 100,
  initialDelay = 0,
  triggerOnce = true,
  threshold = 0.1,
}: StaggerChildrenProps) {
  const { ref, isIntersecting } = useIntersectionObserver<HTMLDivElement>({
    threshold,
    triggerOnce,
  })

  const childrenArray = Children.toArray(children)

  return (
    <div ref={ref} className={className}>
      {childrenArray.map((child, index) => {
        if (!isValidElement(child)) return child

        const delay = initialDelay + index * staggerDelay

        return (
          <div
            key={index}
            className={cn(
              'opacity-0',
              isIntersecting && 'animate-fade-in-up'
            )}
            style={{
              animationDelay: `${delay}ms`,
              animationFillMode: 'forwards',
            }}
          >
            {cloneElement(child)}
          </div>
        )
      })}
    </div>
  )
}

export default StaggerChildren
