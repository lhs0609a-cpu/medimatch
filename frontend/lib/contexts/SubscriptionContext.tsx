'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { paymentService } from '@/lib/api/services'

export type SubscriptionTier = 'free' | 'premium' | 'vip'
export type BillingCycle = 'monthly' | 'yearly'

interface SubscriptionFeatures {
  maxSimulations: number | 'unlimited'
  simulationResultsVisible: boolean
  maxReportsPerMonth: number | 'unlimited'
  maxFavorites: number | 'unlimited'
  customAlerts: number | 'unlimited'
  consultantSession: boolean
  premiumBadge: boolean
  prioritySupport: boolean
}

interface SubscriptionInfo {
  tier: SubscriptionTier
  billingCycle: BillingCycle | null
  expiresAt: string | null
  isActive: boolean
  features: SubscriptionFeatures
  usedSimulations: number
  usedReports: number
}

interface SubscriptionContextType {
  subscription: SubscriptionInfo
  isLoading: boolean
  error: Error | null
  refresh: () => Promise<void>
  canUseFeature: (feature: keyof SubscriptionFeatures) => boolean
  hasUnlimitedFeature: (feature: keyof SubscriptionFeatures) => boolean
  getRemainingUsage: (feature: 'simulations' | 'reports') => number | 'unlimited'
}

const defaultFeatures: Record<SubscriptionTier, SubscriptionFeatures> = {
  free: {
    maxSimulations: 1,
    simulationResultsVisible: false,
    maxReportsPerMonth: 0,
    maxFavorites: 5,
    customAlerts: 0,
    consultantSession: false,
    premiumBadge: false,
    prioritySupport: false,
  },
  premium: {
    maxSimulations: 'unlimited',
    simulationResultsVisible: true,
    maxReportsPerMonth: 3,
    maxFavorites: 50,
    customAlerts: 3,
    consultantSession: false,
    premiumBadge: true,
    prioritySupport: false,
  },
  vip: {
    maxSimulations: 'unlimited',
    simulationResultsVisible: true,
    maxReportsPerMonth: 'unlimited',
    maxFavorites: 'unlimited',
    customAlerts: 'unlimited',
    consultantSession: true,
    premiumBadge: true,
    prioritySupport: true,
  },
}

const defaultSubscription: SubscriptionInfo = {
  tier: 'free',
  billingCycle: null,
  expiresAt: null,
  isActive: true,
  features: defaultFeatures.free,
  usedSimulations: 0,
  usedReports: 0,
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<SubscriptionInfo>(defaultSubscription)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchSubscription = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // API에서 구독 정보 가져오기
      const response = await paymentService.getSubscription()

      if (response) {
        const tier = (response.plan_id || 'free') as SubscriptionTier
        setSubscription({
          tier,
          billingCycle: response.billing_cycle || null,
          expiresAt: response.expires_at || null,
          isActive: response.is_active !== false,
          features: defaultFeatures[tier],
          usedSimulations: response.used_simulations || 0,
          usedReports: response.used_reports || 0,
        })
      }
    } catch (err: any) {
      // 로그인하지 않은 경우 기본값 사용
      if (err.response?.status !== 401) {
        setError(new Error('구독 정보를 불러오는데 실패했습니다.'))
      }
      setSubscription(defaultSubscription)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  const canUseFeature = useCallback((feature: keyof SubscriptionFeatures): boolean => {
    const value = subscription.features[feature]
    if (typeof value === 'boolean') return value
    if (value === 'unlimited') return true
    if (typeof value === 'number') return value > 0
    return false
  }, [subscription])

  const hasUnlimitedFeature = useCallback((feature: keyof SubscriptionFeatures): boolean => {
    return subscription.features[feature] === 'unlimited'
  }, [subscription])

  const getRemainingUsage = useCallback((feature: 'simulations' | 'reports'): number | 'unlimited' => {
    if (feature === 'simulations') {
      const max = subscription.features.maxSimulations
      if (max === 'unlimited') return 'unlimited'
      return Math.max(0, max - subscription.usedSimulations)
    }
    if (feature === 'reports') {
      const max = subscription.features.maxReportsPerMonth
      if (max === 'unlimited') return 'unlimited'
      return Math.max(0, max - subscription.usedReports)
    }
    return 0
  }, [subscription])

  return (
    <SubscriptionContext.Provider value={{
      subscription,
      isLoading,
      error,
      refresh: fetchSubscription,
      canUseFeature,
      hasUnlimitedFeature,
      getRemainingUsage,
    }}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}

// 티어별 배지 컴포넌트
export function SubscriptionBadge({ tier }: { tier: SubscriptionTier }) {
  if (tier === 'free') return null

  const config = {
    premium: {
      label: '프리미엄',
      className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
    vip: {
      label: 'VIP',
      className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    },
  }

  const { label, className } = config[tier]

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${className}`}>
      {label}
    </span>
  )
}

// 기능 제한 안내 컴포넌트
export function FeatureGate({
  feature,
  children,
  fallback,
}: {
  feature: keyof SubscriptionFeatures
  children: ReactNode
  fallback?: ReactNode
}) {
  const { canUseFeature, subscription } = useSubscription()

  if (canUseFeature(feature)) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  return (
    <div className="p-4 bg-secondary/50 rounded-xl text-center">
      <p className="text-sm text-muted-foreground mb-2">
        이 기능은 {subscription.tier === 'free' ? '프리미엄' : 'VIP'} 회원만 사용할 수 있습니다.
      </p>
      <a href="/subscribe" className="text-sm text-primary hover:underline">
        업그레이드하기
      </a>
    </div>
  )
}
