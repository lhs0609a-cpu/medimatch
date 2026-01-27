'use client'

import { useRouter } from 'next/navigation'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'

interface GlobalShortcutsProps {
  onSearchOpen?: () => void
  onHelpOpen?: () => void
}

export function GlobalShortcuts({ onSearchOpen, onHelpOpen }: GlobalShortcutsProps) {
  const router = useRouter()

  useKeyboardShortcut({
    shortcuts: [
      // 검색 열기: Ctrl/Cmd + K
      {
        key: 'k',
        modifiers: ['ctrl'],
        handler: () => onSearchOpen?.(),
        description: '검색 열기',
      },
      // 홈으로: G then H
      {
        key: 'h',
        modifiers: ['alt'],
        handler: () => router.push('/'),
        description: '홈으로 이동',
      },
      // 시뮬레이션: Alt + S
      {
        key: 's',
        modifiers: ['alt'],
        handler: () => router.push('/simulate'),
        description: '시뮬레이션으로 이동',
      },
      // 매물 탐색: Alt + B
      {
        key: 'b',
        modifiers: ['alt'],
        handler: () => router.push('/buildings'),
        description: '매물 탐색으로 이동',
      },
      // 파트너: Alt + P
      {
        key: 'p',
        modifiers: ['alt'],
        handler: () => router.push('/partners'),
        description: '파트너로 이동',
      },
      // 도움말: ?
      {
        key: '?',
        modifiers: ['shift'],
        handler: () => onHelpOpen?.(),
        description: '단축키 도움말',
      },
      // ESC: 모달 닫기 등은 각 컴포넌트에서 처리
    ],
  })

  return null
}

export default GlobalShortcuts
