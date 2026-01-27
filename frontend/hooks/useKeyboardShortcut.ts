'use client'

import { useEffect, useCallback, useRef } from 'react'

type KeyModifier = 'ctrl' | 'alt' | 'shift' | 'meta'
type KeyboardHandler = (event: KeyboardEvent) => void

interface ShortcutConfig {
  key: string
  modifiers?: KeyModifier[]
  handler: KeyboardHandler
  description?: string
  preventDefault?: boolean
  enabled?: boolean
}

interface UseKeyboardShortcutOptions {
  shortcuts: ShortcutConfig[]
  enableInInput?: boolean
}

// 입력 필드인지 확인
function isInputElement(element: EventTarget | null): boolean {
  if (!element || !(element instanceof HTMLElement)) return false

  const tagName = element.tagName.toLowerCase()
  const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select'
  const isContentEditable = element.isContentEditable

  return isInput || isContentEditable
}

// 단축키 문자열 생성 (표시용)
export function formatShortcut(key: string, modifiers?: KeyModifier[]): string {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0

  const modifierSymbols: Record<KeyModifier, string> = {
    ctrl: isMac ? '⌃' : 'Ctrl',
    alt: isMac ? '⌥' : 'Alt',
    shift: isMac ? '⇧' : 'Shift',
    meta: isMac ? '⌘' : 'Win',
  }

  const parts: string[] = []

  if (modifiers) {
    // 순서: Ctrl/Meta, Alt, Shift
    const order: KeyModifier[] = ['ctrl', 'meta', 'alt', 'shift']
    order.forEach((mod) => {
      if (modifiers.includes(mod)) {
        parts.push(modifierSymbols[mod])
      }
    })
  }

  // 특수 키 표시
  const specialKeys: Record<string, string> = {
    ' ': 'Space',
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
    Enter: '↵',
    Escape: 'Esc',
    Backspace: '⌫',
    Delete: 'Del',
    Tab: '⇥',
  }

  parts.push(specialKeys[key] || key.toUpperCase())

  return isMac ? parts.join('') : parts.join(' + ')
}

export function useKeyboardShortcut({
  shortcuts,
  enableInInput = false,
}: UseKeyboardShortcutOptions) {
  const shortcutsRef = useRef(shortcuts)
  shortcutsRef.current = shortcuts

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // 입력 필드에서는 기본적으로 비활성화
      if (!enableInInput && isInputElement(event.target)) {
        return
      }

      for (const shortcut of shortcutsRef.current) {
        if (shortcut.enabled === false) continue

        const { key, modifiers = [], handler, preventDefault = true } = shortcut

        // 키 매칭
        const keyMatch = event.key.toLowerCase() === key.toLowerCase()
        if (!keyMatch) continue

        // 모디파이어 매칭
        const ctrlMatch = modifiers.includes('ctrl') === (event.ctrlKey || event.metaKey)
        const altMatch = modifiers.includes('alt') === event.altKey
        const shiftMatch = modifiers.includes('shift') === event.shiftKey
        const metaMatch = modifiers.includes('meta') === event.metaKey

        // ctrl과 meta를 동일하게 처리 (Mac 호환)
        const modifierMatch = (ctrlMatch || (modifiers.includes('ctrl') && event.metaKey)) &&
          altMatch && shiftMatch

        if (modifierMatch || (modifiers.length === 0 && !event.ctrlKey && !event.altKey && !event.metaKey)) {
          if (preventDefault) {
            event.preventDefault()
          }
          handler(event)
          return
        }
      }
    },
    [enableInInput]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

// 단일 단축키 훅
export function useHotkey(
  key: string,
  handler: KeyboardHandler,
  modifiers?: KeyModifier[],
  options?: { enabled?: boolean; enableInInput?: boolean; preventDefault?: boolean }
) {
  useKeyboardShortcut({
    shortcuts: [
      {
        key,
        modifiers,
        handler,
        enabled: options?.enabled,
        preventDefault: options?.preventDefault,
      },
    ],
    enableInInput: options?.enableInInput,
  })
}

export default useKeyboardShortcut
