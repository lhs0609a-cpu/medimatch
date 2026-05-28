'use client'

import Script from 'next/script'
import { useEffect } from 'react'
import { captureAttribution } from '@/lib/utm'

/**
 * 네이버 프리미엄 로그분석(공통수집 스크립트) + 검색광고 전환 추적.
 *
 * - NEXT_PUBLIC_NAVER_SITE_ID 가 있고 프로덕션일 때만 스크립트 주입.
 * - 모든 환경에서 first-touch 광고 귀속(captureAttribution)은 수행.
 * - 문의 제출 등 전환 시점에 naverConversion()을 호출해 전환을 기록한다.
 */
const NAVER_SITE_ID = process.env.NEXT_PUBLIC_NAVER_SITE_ID
const enabled = process.env.NODE_ENV === 'production' && !!NAVER_SITE_ID

declare global {
  interface Window {
    wcs_add?: Record<string, string>
    wcs?: { cnv: (type: string, value: string) => string }
    wcs_do?: (obj?: Record<string, string>) => void
  }
}

/**
 * 네이버 전환 발火. type/value는 네이버 검색광고 전환 설정값.
 * 예) 신청·상담 전환: naverConversion('1', '0')
 */
export function naverConversion(type = '1', value = '0'): void {
  if (typeof window === 'undefined' || !window.wcs || !window.wcs_do) return
  try {
    const nasa: Record<string, string> = {}
    nasa['cnv'] = window.wcs.cnv(type, value)
    window.wcs_do(nasa)
  } catch {
    /* 스크립트 미로드 — 무시 */
  }
}

export function NaverAnalytics() {
  useEffect(() => {
    captureAttribution()
  }, [])

  if (!enabled) return null

  return (
    <>
      <Script src="//wcs.naver.net/wcslog.js" strategy="afterInteractive" />
      <Script id="naver-wcs" strategy="afterInteractive">
        {`
          if (!window.wcs_add) window.wcs_add = {};
          window.wcs_add["wa"] = "${NAVER_SITE_ID}";
          if (window.wcs) { window.wcs_do(); }
        `}
      </Script>
    </>
  )
}
