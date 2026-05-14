'use client'

import { useEffect, useRef } from 'react'

export type ShortcutHandler = (e: KeyboardEvent) => void

export interface ShortcutMap {
  /** 'F1', 'F2', ..., 'F12' or 'Escape', 'Enter' (with optional modifiers like 'Ctrl+S') */
  [key: string]: ShortcutHandler
}

function normalizeKey(e: KeyboardEvent): string {
  const parts: string[] = []
  if (e.ctrlKey || e.metaKey) parts.push('Ctrl')
  if (e.shiftKey) parts.push('Shift')
  if (e.altKey) parts.push('Alt')
  parts.push(e.key.length === 1 ? e.key.toUpperCase() : e.key)
  return parts.join('+')
}

/**
 * 키보드 단축키 — 입력창 포커스 시에는 (F-키 제외) 무시.
 * 사용:
 *   useKeyboardShortcuts({
 *     'F2': () => focusCodeInput(),
 *     'F3': () => onDispense(),
 *     'Escape': () => closeModal(),
 *   })
 */
export function useKeyboardShortcuts(map: ShortcutMap, options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true
  const mapRef = useRef(map)
  mapRef.current = map

  useEffect(() => {
    if (!enabled) return
    const handler = (e: KeyboardEvent) => {
      const key = normalizeKey(e)
      const fn = mapRef.current[key]
      if (!fn) return

      // 입력창에 포커스되어 있을 때는 F-키만 허용 (textarea/input/contentEditable)
      const target = e.target as HTMLElement | null
      const isEditable =
        target &&
        (target.tagName === 'INPUT' ||
         target.tagName === 'TEXTAREA' ||
         target.isContentEditable)
      const isFunctionKey = /^F\d+$/.test(e.key)
      if (isEditable && !isFunctionKey) return

      e.preventDefault()
      fn(e)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [enabled])
}
