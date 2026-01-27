'use client'

import { useEffect } from 'react'
import { X, Keyboard } from 'lucide-react'
import { formatShortcut } from '@/hooks/useKeyboardShortcut'
import { cn } from '@/lib/utils'

interface ShortcutItem {
  keys: { key: string; modifiers?: ('ctrl' | 'alt' | 'shift' | 'meta')[] }
  description: string
}

interface ShortcutGroup {
  title: string
  items: ShortcutItem[]
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: '일반',
    items: [
      { keys: { key: 'k', modifiers: ['ctrl'] }, description: '검색 열기' },
      { keys: { key: '?', modifiers: ['shift'] }, description: '단축키 도움말' },
      { keys: { key: 'Escape' }, description: '모달/팝업 닫기' },
    ],
  },
  {
    title: '네비게이션',
    items: [
      { keys: { key: 'h', modifiers: ['alt'] }, description: '홈으로 이동' },
      { keys: { key: 's', modifiers: ['alt'] }, description: '시뮬레이션' },
      { keys: { key: 'b', modifiers: ['alt'] }, description: '매물 탐색' },
      { keys: { key: 'p', modifiers: ['alt'] }, description: '파트너 찾기' },
    ],
  },
  {
    title: '폼 & 입력',
    items: [
      { keys: { key: 'Enter' }, description: '폼 제출' },
      { keys: { key: 'Tab' }, description: '다음 필드로 이동' },
      { keys: { key: 'Tab', modifiers: ['shift'] }, description: '이전 필드로 이동' },
    ],
  },
]

interface ShortcutsHelpProps {
  isOpen: boolean
  onClose: () => void
}

export function ShortcutsHelp({ isOpen, onClose }: ShortcutsHelpProps) {
  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-card rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden pointer-events-auto animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Keyboard className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">키보드 단축키</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
            <div className="grid gap-6 md:grid-cols-2">
              {shortcutGroups.map((group) => (
                <div key={group.title}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    {group.title}
                  </h3>
                  <div className="space-y-2">
                    {group.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-secondary/50"
                      >
                        <span className="text-sm">{item.description}</span>
                        <kbd
                          className={cn(
                            'px-2 py-1 text-xs font-mono',
                            'bg-secondary border border-border rounded',
                            'shadow-[0_1px_0_1px_hsl(var(--border))]'
                          )}
                        >
                          {formatShortcut(item.keys.key, item.keys.modifiers)}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Tips */}
            <div className="mt-6 p-4 bg-secondary/50 rounded-xl">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">팁:</strong> Mac에서는 Ctrl 대신 ⌘ (Command) 키를 사용할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ShortcutsHelp
