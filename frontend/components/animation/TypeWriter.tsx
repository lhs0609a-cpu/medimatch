'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface TypeWriterProps {
  text: string | string[]
  className?: string
  speed?: number
  delay?: number
  loop?: boolean
  cursor?: boolean
  cursorChar?: string
  onComplete?: () => void
}

export function TypeWriter({
  text,
  className,
  speed = 50,
  delay = 0,
  loop = false,
  cursor = true,
  cursorChar = '|',
  onComplete,
}: TypeWriterProps) {
  const [displayText, setDisplayText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [textArrayIndex, setTextArrayIndex] = useState(0)

  const texts = Array.isArray(text) ? text : [text]
  const currentText = texts[textArrayIndex]

  useEffect(() => {
    const startTimer = setTimeout(() => {
      setIsTyping(true)
    }, delay)

    return () => clearTimeout(startTimer)
  }, [delay])

  useEffect(() => {
    if (!isTyping) return

    if (currentIndex < currentText.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + currentText[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, speed)

      return () => clearTimeout(timer)
    } else {
      // 타이핑 완료
      if (texts.length > 1 || loop) {
        // 다음 텍스트로 전환 (2초 대기 후)
        const pauseTimer = setTimeout(() => {
          setDisplayText('')
          setCurrentIndex(0)
          setTextArrayIndex(prev => (prev + 1) % texts.length)
        }, 2000)

        return () => clearTimeout(pauseTimer)
      } else {
        onComplete?.()
      }
    }
  }, [currentIndex, currentText, isTyping, speed, texts, loop, onComplete])

  return (
    <span className={cn('inline-block', className)}>
      {displayText}
      {cursor && (
        <span
          className={cn(
            'inline-block ml-0.5 animate-pulse',
            isTyping && currentIndex < currentText.length ? '' : 'opacity-0'
          )}
        >
          {cursorChar}
        </span>
      )}
    </span>
  )
}

export default TypeWriter
