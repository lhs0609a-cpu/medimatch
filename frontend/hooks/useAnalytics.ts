import { useCallback } from 'react'
import { event as gaEvent } from '@/components/analytics/GoogleAnalytics'

// ============================================================
// 이벤트 카테고리 정의
// ============================================================

export const EventCategory = {
  SIMULATION: 'simulation',
  BUILDING: 'building',
  PARTNER: 'partner',
  PHARMACY: 'pharmacy',
  PAYMENT: 'payment',
  USER: 'user',
  ENGAGEMENT: 'engagement',
} as const

// ============================================================
// 사전 정의된 이벤트 타입
// ============================================================

export type AnalyticsEvent =
  // 시뮬레이션 이벤트
  | { action: 'simulation_started'; category: 'simulation'; label?: string }
  | { action: 'simulation_completed'; category: 'simulation'; label?: string; value?: number }
  | { action: 'report_viewed'; category: 'simulation'; label: string }
  | { action: 'report_purchased'; category: 'simulation'; label: string; value: number }

  // 매물 이벤트
  | { action: 'building_viewed'; category: 'building'; label: string }
  | { action: 'building_inquiry_sent'; category: 'building'; label: string }
  | { action: 'building_saved'; category: 'building'; label: string }
  | { action: 'building_search'; category: 'building'; label?: string }

  // 파트너 이벤트
  | { action: 'partner_viewed'; category: 'partner'; label: string }
  | { action: 'partner_contact_clicked'; category: 'partner'; label: string }
  | { action: 'partner_inquiry_sent'; category: 'partner'; label: string }

  // 약국 매칭 이벤트
  | { action: 'pharmacy_listing_viewed'; category: 'pharmacy'; label: string }
  | { action: 'pharmacy_interest_sent'; category: 'pharmacy'; label: string }
  | { action: 'pharmacy_match_created'; category: 'pharmacy'; label: string }

  // 결제 이벤트
  | { action: 'checkout_started'; category: 'payment'; label: string; value: number }
  | { action: 'payment_completed'; category: 'payment'; label: string; value: number }
  | { action: 'payment_failed'; category: 'payment'; label: string; value?: number }
  | { action: 'subscription_started'; category: 'payment'; label: string; value: number }

  // 사용자 이벤트
  | { action: 'signup_started'; category: 'user'; label?: string }
  | { action: 'signup_completed'; category: 'user'; label: string }
  | { action: 'login'; category: 'user'; label?: string }
  | { action: 'logout'; category: 'user' }
  | { action: 'profile_updated'; category: 'user' }

  // 참여 이벤트
  | { action: 'cta_clicked'; category: 'engagement'; label: string }
  | { action: 'feature_used'; category: 'engagement'; label: string }
  | { action: 'share_clicked'; category: 'engagement'; label: string }
  | { action: 'onboarding_completed'; category: 'engagement'; label?: string }

// ============================================================
// useAnalytics 훅
// ============================================================

export function useAnalytics() {
  // 범용 이벤트 트래킹
  const trackEvent = useCallback((
    action: string,
    params?: {
      category?: string
      label?: string
      value?: number
      [key: string]: unknown
    }
  ) => {
    gaEvent(action, params)

    // 개발 환경에서 콘솔 로그
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', action, params)
    }
  }, [])

  // 타입 안전한 이벤트 트래킹
  const track = useCallback((event: AnalyticsEvent) => {
    trackEvent(event.action, {
      category: event.category,
      label: 'label' in event ? event.label : undefined,
      value: 'value' in event ? event.value : undefined,
    })
  }, [trackEvent])

  // ============================================================
  // 편의 메서드
  // ============================================================

  // 시뮬레이션 이벤트
  const trackSimulation = {
    started: (clinicType?: string) =>
      track({ action: 'simulation_started', category: 'simulation', label: clinicType }),
    completed: (clinicType: string, score?: number) =>
      track({ action: 'simulation_completed', category: 'simulation', label: clinicType, value: score }),
    reportViewed: (simulationId: string) =>
      track({ action: 'report_viewed', category: 'simulation', label: simulationId }),
    reportPurchased: (simulationId: string, amount: number) =>
      track({ action: 'report_purchased', category: 'simulation', label: simulationId, value: amount }),
  }

  // 매물 이벤트
  const trackBuilding = {
    viewed: (buildingId: string) =>
      track({ action: 'building_viewed', category: 'building', label: buildingId }),
    inquirySent: (buildingId: string) =>
      track({ action: 'building_inquiry_sent', category: 'building', label: buildingId }),
    saved: (buildingId: string) =>
      track({ action: 'building_saved', category: 'building', label: buildingId }),
    search: (query?: string) =>
      track({ action: 'building_search', category: 'building', label: query }),
  }

  // 파트너 이벤트
  const trackPartner = {
    viewed: (partnerId: string) =>
      track({ action: 'partner_viewed', category: 'partner', label: partnerId }),
    contactClicked: (partnerId: string) =>
      track({ action: 'partner_contact_clicked', category: 'partner', label: partnerId }),
    inquirySent: (partnerId: string) =>
      track({ action: 'partner_inquiry_sent', category: 'partner', label: partnerId }),
  }

  // 결제 이벤트
  const trackPayment = {
    checkoutStarted: (productId: string, amount: number) =>
      track({ action: 'checkout_started', category: 'payment', label: productId, value: amount }),
    completed: (productId: string, amount: number) =>
      track({ action: 'payment_completed', category: 'payment', label: productId, value: amount }),
    failed: (productId: string, amount?: number) =>
      track({ action: 'payment_failed', category: 'payment', label: productId, value: amount }),
    subscriptionStarted: (planId: string, amount: number) =>
      track({ action: 'subscription_started', category: 'payment', label: planId, value: amount }),
  }

  // 사용자 이벤트
  const trackUser = {
    signupStarted: (method?: string) =>
      track({ action: 'signup_started', category: 'user', label: method }),
    signupCompleted: (role: string) =>
      track({ action: 'signup_completed', category: 'user', label: role }),
    login: (method?: string) =>
      track({ action: 'login', category: 'user', label: method }),
    logout: () =>
      track({ action: 'logout', category: 'user' }),
  }

  // 참여 이벤트
  const trackEngagement = {
    ctaClicked: (ctaName: string) =>
      track({ action: 'cta_clicked', category: 'engagement', label: ctaName }),
    featureUsed: (featureName: string) =>
      track({ action: 'feature_used', category: 'engagement', label: featureName }),
    shareClicked: (contentType: string) =>
      track({ action: 'share_clicked', category: 'engagement', label: contentType }),
    onboardingCompleted: (role?: string) =>
      track({ action: 'onboarding_completed', category: 'engagement', label: role }),
  }

  return {
    trackEvent,
    track,
    trackSimulation,
    trackBuilding,
    trackPartner,
    trackPayment,
    trackUser,
    trackEngagement,
  }
}

export default useAnalytics
