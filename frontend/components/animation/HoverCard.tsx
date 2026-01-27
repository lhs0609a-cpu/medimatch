'use client'

import { cn } from '@/lib/utils'

type HoverEffect = 'lift' | 'glow' | 'border' | 'scale' | 'tilt'

interface HoverCardProps {
  children: React.ReactNode
  className?: string
  effect?: HoverEffect | HoverEffect[]
  as?: keyof JSX.IntrinsicElements
}

const effectClasses: Record<HoverEffect, string> = {
  lift: 'hover:-translate-y-1 hover:shadow-lg',
  glow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]',
  border: 'hover:border-primary',
  scale: 'hover:scale-[1.02]',
  tilt: 'hover:[transform:perspective(1000px)_rotateX(2deg)]',
}

export function HoverCard({
  children,
  className,
  effect = 'lift',
  as: Component = 'div',
}: HoverCardProps) {
  const effects = Array.isArray(effect) ? effect : [effect]
  const combinedEffects = effects.map(e => effectClasses[e]).join(' ')

  return (
    <Component
      className={cn(
        'transition-all duration-300 ease-out',
        combinedEffects,
        className
      )}
    >
      {children}
    </Component>
  )
}

export default HoverCard
