'use client'

import { RefreshCw } from 'lucide-react'
import { usePWA } from '@/hooks/usePWA'

export function UpdatePrompt() {
  const { isUpdateAvailable, applyUpdate } = usePWA()

  if (!isUpdateAvailable) return null

  return (
    <div className="fixed top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-auto z-50 animate-fade-in-down">
      <div className="bg-primary text-primary-foreground rounded-xl shadow-lg px-4 py-3 flex items-center gap-3">
        <RefreshCw className="w-5 h-5 animate-spin" />
        <span className="text-sm font-medium">새 버전이 있습니다</span>
        <button
          onClick={applyUpdate}
          className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
        >
          업데이트
        </button>
      </div>
    </div>
  )
}

export default UpdatePrompt
