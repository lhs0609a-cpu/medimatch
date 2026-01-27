'use client'

import { useState, useEffect } from 'react'
import { X, Download, Smartphone } from 'lucide-react'
import { usePWA } from '@/hooks/usePWA'

interface InstallPromptProps {
  delay?: number // 표시 지연 시간 (ms)
}

export function InstallPrompt({ delay = 30000 }: InstallPromptProps) {
  const { isInstallable, isInstalled, promptInstall } = usePWA()
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // 이미 설치되었거나 사용자가 닫았으면 표시하지 않음
    if (isInstalled || isDismissed) return

    // 이전에 닫은 기록 확인
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10)
      // 7일 내에 닫았으면 다시 표시하지 않음
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        return
      }
    }

    // 지연 후 표시
    const timer = setTimeout(() => {
      if (isInstallable) {
        setIsVisible(true)
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [isInstallable, isInstalled, isDismissed, delay])

  const handleInstall = async () => {
    const result = await promptInstall()
    if (result.outcome === 'accepted') {
      setIsVisible(false)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    setIsDismissed(true)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-fade-in-up">
      <div className="bg-card border border-border rounded-2xl shadow-xl p-4">
        <div className="flex items-start gap-4">
          {/* 아이콘 */}
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-6 h-6 text-primary" />
          </div>

          {/* 콘텐츠 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-foreground">앱으로 설치</h3>
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-secondary rounded-lg transition-colors"
                aria-label="닫기"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              홈 화면에 추가하여 더 빠르게 접속하세요
            </p>

            {/* 버튼 */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleInstall}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Download className="w-4 h-4" />
                설치
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                나중에
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InstallPrompt
