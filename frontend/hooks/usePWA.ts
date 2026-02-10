'use client'

import { useState, useEffect, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface PWAState {
  isInstallable: boolean
  isInstalled: boolean
  isOnline: boolean
  isUpdateAvailable: boolean
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOnline: true, // Always start as true to avoid hydration mismatch
    isUpdateAvailable: false,
  })

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  // Service Worker 등록
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    // 프로덕션 환경에서만 SW 등록
    if (process.env.NODE_ENV !== 'production') {
      console.log('[PWA] Service Worker disabled in development')
      return
    }

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[PWA] Service Worker registered')
        setRegistration(reg)

        // 업데이트 확인
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setState((prev) => ({ ...prev, isUpdateAvailable: true }))
              }
            })
          }
        })
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error)
      })

    // 컨트롤러 변경 시 새로고침
    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true
        window.location.reload()
      }
    })
  }, [])

  // 설치 프롬프트 이벤트 감지
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setState((prev) => ({ ...prev, isInstallable: true }))
    }

    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setState((prev) => ({ ...prev, isInstallable: false, isInstalled: true }))
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // 이미 설치되었는지 확인 (standalone 모드)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setState((prev) => ({ ...prev, isInstalled: true }))
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // 온라인/오프라인 상태 감지
  useEffect(() => {
    // Set actual online status after mount (avoids hydration mismatch)
    setState((prev) => ({ ...prev, isOnline: navigator.onLine }))

    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true }))
    }

    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOnline: false }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // 앱 설치 프롬프트 표시
  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      return { outcome: 'dismissed' as const }
    }

    await deferredPrompt.prompt()
    const result = await deferredPrompt.userChoice

    if (result.outcome === 'accepted') {
      setState((prev) => ({ ...prev, isInstallable: false, isInstalled: true }))
    }

    setDeferredPrompt(null)
    return result
  }, [deferredPrompt])

  // 앱 업데이트 적용
  const applyUpdate = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
  }, [registration])

  // 캐시 클리어
  const clearCache = useCallback(async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map((name) => caches.delete(name)))
      console.log('[PWA] Cache cleared')
    }
  }, [])

  return {
    ...state,
    promptInstall,
    applyUpdate,
    clearCache,
  }
}

export default usePWA
