'use client'

import { useEffect, useState, useRef } from 'react'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { cn } from '@/lib/utils'

interface CountUpProps {
  end: number
  start?: number
  duration?: number
  delay?: number
  decimals?: number
  prefix?: string
  suffix?: string
  separator?: string
  className?: string
  triggerOnce?: boolean
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function formatNumber(value: number, decimals: number, separator: string): string {
  const fixed = value.toFixed(decimals)
  const parts = fixed.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator)
  return parts.join('.')
}

export function CountUp({
  end,
  start = 0,
  duration = 2000,
  delay = 0,
  decimals = 0,
  prefix = '',
  suffix = '',
  separator = ',',
  className,
  triggerOnce = true,
}: CountUpProps) {
  const [value, setValue] = useState(start)
  const [hasStarted, setHasStarted] = useState(false)
  const { ref, isIntersecting } = useIntersectionObserver<HTMLSpanElement>({
    threshold: 0.5,
    triggerOnce,
  })
  const animationRef = useRef<number>()
  const startTimeRef = useRef<number>()

  useEffect(() => {
    if (!isIntersecting || hasStarted) return

    const timer = setTimeout(() => {
      setHasStarted(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [isIntersecting, delay, hasStarted])

  useEffect(() => {
    if (!hasStarted) return

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp
      }

      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutExpo(progress)
      const currentValue = start + (end - start) * easedProgress

      setValue(currentValue)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setValue(end)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [hasStarted, start, end, duration])

  return (
    <span
      ref={ref}
      className={cn('tabular-nums', className)}
    >
      {prefix}
      {formatNumber(value, decimals, separator)}
      {suffix}
    </span>
  )
}

export default CountUp
