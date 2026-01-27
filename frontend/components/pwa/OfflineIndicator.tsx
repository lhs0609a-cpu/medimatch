'use client'

import { WifiOff } from 'lucide-react'
import { usePWA } from '@/hooks/usePWA'

export function OfflineIndicator() {
  const { isOnline } = usePWA()

  if (isOnline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-center py-2 text-sm font-medium flex items-center justify-center gap-2">
      <WifiOff className="w-4 h-4" />
      오프라인 모드 - 일부 기능이 제한됩니다
    </div>
  )
}

export default OfflineIndicator
