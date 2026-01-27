'use client'

import { useEffect } from 'react'
import { reportWebVitals, measurePageLoad, type WebVitalsMetric } from '@/lib/webVitals'

interface WebVitalsReporterProps {
  onReport?: (metric: WebVitalsMetric) => void
  debug?: boolean
}

export function WebVitalsReporter({ onReport, debug = false }: WebVitalsReporterProps) {
  useEffect(() => {
    // Web Vitals 측정 시작
    reportWebVitals((metric) => {
      if (debug) {
        console.log('[WebVitals]', metric)
      }
      onReport?.(metric)
    })

    // 페이지 로드 시간 측정
    measurePageLoad()
  }, [onReport, debug])

  return null
}

export default WebVitalsReporter
