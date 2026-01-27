'use client'

import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { cn } from '@/lib/utils'

type AnimationDirection = 'up' | 'down' | 'left' | 'right' | 'none'

interface FadeInProps {
  children: React.ReactNode
  className?: string
  direction?: AnimationDirection
  delay?: number
  duration?: number
  triggerOnce?: boolean
  threshold?: number
  as?: keyof JSX.IntrinsicElements
}

const directionClasses: Record<AnimationDirection, string> = {
  up: 'animate-fade-in-up',
  down: 'animate-fade-in-down',
  left: 'animate-slide-in-left',
  right: 'animate-slide-in-right',
  none: 'animate-fade-in',
}

export function FadeIn({
  children,
  className,
  direction = 'up',
  delay = 0,
  duration = 500,
  triggerOnce = true,
  threshold = 0.1,
  as: Component = 'div',
}: FadeInProps) {
  const { ref, isIntersecting } = useIntersectionObserver<HTMLElement>({
    threshold,
    triggerOnce,
  })

  return (
    <Component
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn(
        'opacity-0',
        isIntersecting && directionClasses[direction],
        className
      )}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`,
      }}
    >
      {children}
    </Component>
  )
}

export default FadeIn
