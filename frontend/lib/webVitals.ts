'use client'

import type { Metric } from 'web-vitals'

// Web Vitals 메트릭 타입
export type WebVitalsMetric = {
  id: string
  name: 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  navigationType: 'navigate' | 'reload' | 'back-forward' | 'back-forward-cache' | 'prerender'
}

// 메트릭별 임계값 (밀리초 또는 점수)
const thresholds = {
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  FID: { good: 100, poor: 300 },
  INP: { good: 200, poor: 500 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
}

// 메트릭 등급 계산
function getRating(name: keyof typeof thresholds, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = thresholds[name]
  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

// GA4로 Web Vitals 전송
function sendToGoogleAnalytics(metric: Metric) {
  if (typeof window === 'undefined' || !window.gtag) return

  const rating = getRating(metric.name as keyof typeof thresholds, metric.value)

  window.gtag('event', metric.name, {
    event_category: 'Web Vitals',
    event_label: metric.id,
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    metric_id: metric.id,
    metric_value: metric.value,
    metric_delta: metric.delta,
    metric_rating: rating,
    non_interaction: true,
  })
}

// 콘솔에 메트릭 로깅 (개발 환경)
function logToConsole(metric: Metric) {
  const rating = getRating(metric.name as keyof typeof thresholds, metric.value)
  const color = rating === 'good' ? '#0cce6b' : rating === 'needs-improvement' ? '#ffa400' : '#ff4e42'

  console.log(
    `%c${metric.name}%c ${metric.value.toFixed(metric.name === 'CLS' ? 3 : 0)}${metric.name === 'CLS' ? '' : 'ms'} (${rating})`,
    `background: ${color}; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;`,
    'color: inherit;'
  )
}

// Web Vitals 측정 및 보고
export async function reportWebVitals(onReport?: (metric: WebVitalsMetric) => void) {
  if (typeof window === 'undefined') return

  try {
    const { onCLS, onFCP, onFID, onINP, onLCP, onTTFB } = await import('web-vitals')

    const handleMetric = (metric: Metric) => {
      // 개발 환경에서 콘솔 로깅
      if (process.env.NODE_ENV === 'development') {
        logToConsole(metric)
      }

      // GA4로 전송
      sendToGoogleAnalytics(metric)

      // 커스텀 콜백 실행
      if (onReport) {
        const rating = getRating(metric.name as keyof typeof thresholds, metric.value)
        onReport({
          id: metric.id,
          name: metric.name as WebVitalsMetric['name'],
          value: metric.value,
          rating,
          delta: metric.delta,
          navigationType: metric.navigationType as WebVitalsMetric['navigationType'],
        })
      }
    }

    onCLS(handleMetric)
    onFCP(handleMetric)
    onFID(handleMetric)
    onINP(handleMetric)
    onLCP(handleMetric)
    onTTFB(handleMetric)
  } catch (error) {
    console.error('[WebVitals] Failed to load web-vitals:', error)
  }
}

// 커스텀 성능 측정
export function measurePerformance(name: string, startMark: string, endMark?: string) {
  if (typeof window === 'undefined' || !window.performance) return

  try {
    if (endMark) {
      performance.measure(name, startMark, endMark)
    } else {
      performance.measure(name, startMark)
    }

    const entries = performance.getEntriesByName(name, 'measure')
    const lastEntry = entries[entries.length - 1]

    if (lastEntry && window.gtag) {
      window.gtag('event', 'performance_measure', {
        event_category: 'Performance',
        event_label: name,
        value: Math.round(lastEntry.duration),
        non_interaction: true,
      })
    }

    return lastEntry?.duration
  } catch (error) {
    console.error(`[Performance] Failed to measure ${name}:`, error)
    return undefined
  }
}

// 페이지 로드 시간 측정
export function measurePageLoad() {
  if (typeof window === 'undefined') return

  window.addEventListener('load', () => {
    setTimeout(() => {
      const timing = performance.timing
      const pageLoadTime = timing.loadEventEnd - timing.navigationStart
      const domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart
      const firstPaint = performance.getEntriesByType('paint').find(e => e.name === 'first-paint')

      if (process.env.NODE_ENV === 'development') {
        console.log('[Performance] Page Load:', {
          pageLoadTime: `${pageLoadTime}ms`,
          domContentLoaded: `${domContentLoaded}ms`,
          firstPaint: firstPaint ? `${Math.round(firstPaint.startTime)}ms` : 'N/A',
        })
      }

      if (window.gtag) {
        window.gtag('event', 'page_timing', {
          event_category: 'Performance',
          page_load_time: pageLoadTime,
          dom_content_loaded: domContentLoaded,
          first_paint: firstPaint ? Math.round(firstPaint.startTime) : undefined,
          non_interaction: true,
        })
      }
    }, 0)
  })
}
