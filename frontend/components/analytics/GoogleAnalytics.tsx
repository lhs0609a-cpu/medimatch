'use client'

import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'

// GA4 Measurement ID는 환경변수에서 가져옴
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

// GA4 초기화 확인
export const isGAEnabled = () => {
  return typeof window !== 'undefined' && GA_MEASUREMENT_ID && process.env.NODE_ENV === 'production'
}

// gtag 함수 타입
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: Record<string, unknown>
    ) => void
    dataLayer: unknown[]
  }
}

// 페이지뷰 추적
export const pageview = (url: string) => {
  if (!isGAEnabled()) return
  window.gtag('config', GA_MEASUREMENT_ID!, {
    page_path: url,
  })
}

// 이벤트 추적
export const event = (
  action: string,
  params?: {
    category?: string
    label?: string
    value?: number
    [key: string]: unknown
  }
) => {
  if (!isGAEnabled()) return
  window.gtag('event', action, {
    event_category: params?.category,
    event_label: params?.label,
    value: params?.value,
    ...params,
  })
}

// 페이지뷰 추적 컴포넌트 (내부용)
function PageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (pathname) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
      pageview(url)
    }
  }, [pathname, searchParams])

  return null
}

// Google Analytics 스크립트 컴포넌트
export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) {
    return null
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
              anonymize_ip: true,
              cookie_flags: 'SameSite=None;Secure',
            });
          `,
        }}
      />
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  )
}

export default GoogleAnalytics
