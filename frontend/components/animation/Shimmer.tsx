'use client'

import { cn } from '@/lib/utils'

interface ShimmerProps {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

const roundedClasses = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
}

export function Shimmer({
  className,
  width,
  height,
  rounded = 'md',
}: ShimmerProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-muted',
        roundedClasses[rounded],
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    >
      <div
        className="absolute inset-0 animate-shimmer"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
          backgroundSize: '200% 100%',
        }}
      />
    </div>
  )
}

export default Shimmer
