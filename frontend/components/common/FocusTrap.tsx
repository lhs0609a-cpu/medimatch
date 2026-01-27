'use client'

import { useEffect, useRef } from 'react'

interface FocusTrapProps {
  children: React.ReactNode
  active?: boolean
  restoreFocus?: boolean
}

/**
 * 포커스를 컴포넌트 내부에 가두는 컴포넌트
 * 모달, 드롭다운 등에서 키보드 네비게이션을 개선하기 위해 사용
 */
export function FocusTrap({
  children,
  active = true,
  restoreFocus = true,
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!active) return

    // 이전 포커스 저장
    previousFocusRef.current = document.activeElement as HTMLElement

    const container = containerRef.current
    if (!container) return

    // 포커스 가능한 요소들 찾기
    const getFocusableElements = () => {
      return container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    }

    // 첫 번째 요소에 포커스
    const focusableElements = getFocusableElements()
    if (focusableElements.length > 0) {
      focusableElements[0].focus()
    }

    // 키보드 이벤트 핸들러
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const focusable = getFocusableElements()
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        // Shift + Tab: 첫 번째에서 마지막으로
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        // Tab: 마지막에서 첫 번째로
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)

    return () => {
      container.removeEventListener('keydown', handleKeyDown)

      // 이전 포커스 복원
      if (restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus()
      }
    }
  }, [active, restoreFocus])

  return (
    <div ref={containerRef} tabIndex={-1}>
      {children}
    </div>
  )
}

export default FocusTrap
