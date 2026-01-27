'use client'

import { useEffect, useRef, useState } from 'react'

interface UseIntersectionObserverOptions {
  threshold?: number | number[]
  root?: Element | null
  rootMargin?: string
  triggerOnce?: boolean
}

export function useIntersectionObserver<T extends Element>({
  threshold = 0.1,
  root = null,
  rootMargin = '0px',
  triggerOnce = true,
}: UseIntersectionObserverOptions = {}) {
  const ref = useRef<T>(null)
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasTriggered, setHasTriggered] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    // triggerOnce가 true이고 이미 트리거되었으면 observer 설정하지 않음
    if (triggerOnce && hasTriggered) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting
        setIsIntersecting(isVisible)

        if (isVisible && triggerOnce) {
          setHasTriggered(true)
          observer.unobserve(element)
        }
      },
      { threshold, root, rootMargin }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [threshold, root, rootMargin, triggerOnce, hasTriggered])

  return { ref, isIntersecting: triggerOnce ? hasTriggered || isIntersecting : isIntersecting }
}

export default useIntersectionObserver
