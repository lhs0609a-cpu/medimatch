'use client'

import { useState, useCallback } from 'react'
import { paymentService } from '@/lib/api/services'
import { toast } from 'sonner'

export type PaymentMethod = 'toss' | 'kakaopay' | 'card'
export type ProductType = 'simulation_unlock' | 'report_purchase' | 'subscription' | 'matching_request'

interface PaymentOptions {
  productType: ProductType
  productName: string
  amount: number
  referenceId?: string
  metadata?: Record<string, any>
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
  onCancel?: () => void
}

interface UsePaymentReturn {
  isLoading: boolean
  isProcessing: boolean
  error: Error | null
  initiatePayment: (options: PaymentOptions, method?: PaymentMethod) => Promise<void>
  confirmPayment: (paymentKey: string, orderId: string, amount: number) => Promise<any>
}

// 토스페이먼츠 SDK 타입
declare global {
  interface Window {
    TossPayments?: (clientKey: string) => {
      requestPayment: (method: string, options: any) => Promise<void>
    }
  }
}

export function usePayment(): UsePaymentReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const loadTossPaymentsSDK = useCallback(async () => {
    if (window.TossPayments) return

    return new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://js.tosspayments.com/v1/payment'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('토스페이먼츠 SDK 로드 실패'))
      document.head.appendChild(script)
    })
  }, [])

  const initiatePayment = useCallback(async (
    options: PaymentOptions,
    method: PaymentMethod = 'card'
  ) => {
    const { productType, productName, amount, referenceId, metadata, onSuccess, onError, onCancel } = options

    setIsLoading(true)
    setError(null)

    try {
      // 1. 결제 준비 (서버에서 orderId 생성)
      const prepareResponse = await paymentService.preparePayment({
        product_id: `${productType}_${referenceId || Date.now()}`,
        product_name: productName,
        amount,
        metadata,
      })

      const { orderId, orderName } = prepareResponse

      // 2. 결제 수단별 처리
      if (method === 'toss') {
        // 토스페이먼츠 SDK 로드
        await loadTossPaymentsSDK()

        const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY
        if (!clientKey) {
          throw new Error('토스페이먼츠 클라이언트 키가 설정되지 않았습니다.')
        }

        const tossPayments = window.TossPayments!(clientKey)

        const successUrl = `${window.location.origin}/payment/success?type=${productType}&ref=${referenceId || ''}`
        const failUrl = `${window.location.origin}/payment/fail?type=${productType}&ref=${referenceId || ''}`

        await tossPayments.requestPayment('카드', {
          amount,
          orderId,
          orderName: orderName || productName,
          successUrl,
          failUrl,
        })
      } else if (method === 'kakaopay') {
        // 카카오페이 결제 (서버 리다이렉트 방식)
        const kakaopayResponse = await paymentService.createOneTimePayment({
          product_type: productType as any,
          reference_id: referenceId || '',
          amount,
          success_url: `${window.location.origin}/payment/success?type=${productType}&ref=${referenceId || ''}`,
          fail_url: `${window.location.origin}/payment/fail?type=${productType}&ref=${referenceId || ''}`,
        })

        if (kakaopayResponse.redirect_url) {
          window.location.href = kakaopayResponse.redirect_url
        }
      } else {
        // 기본 카드 결제 (토스페이먼츠)
        await loadTossPaymentsSDK()

        const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY
        if (!clientKey) {
          throw new Error('토스페이먼츠 클라이언트 키가 설정되지 않았습니다.')
        }

        const tossPayments = window.TossPayments!(clientKey)

        const successUrl = `${window.location.origin}/payment/success?type=${productType}&ref=${referenceId || ''}`
        const failUrl = `${window.location.origin}/payment/fail?type=${productType}&ref=${referenceId || ''}`

        await tossPayments.requestPayment('카드', {
          amount,
          orderId,
          orderName: orderName || productName,
          successUrl,
          failUrl,
        })
      }

      // 결제창이 열리면 여기서 리턴 (성공/실패는 콜백 URL에서 처리)
    } catch (err: any) {
      const errorMessage = err.message || '결제 처리 중 오류가 발생했습니다.'
      setError(new Error(errorMessage))
      onError?.(err)

      // 사용자 취소
      if (err.code === 'USER_CANCEL' || err.message?.includes('취소')) {
        onCancel?.()
        toast.info('결제가 취소되었습니다.')
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }, [loadTossPaymentsSDK])

  const confirmPayment = useCallback(async (
    paymentKey: string,
    orderId: string,
    amount: number
  ) => {
    setIsProcessing(true)
    setError(null)

    try {
      const result = await paymentService.confirmPayment({
        payment_key: paymentKey,
        order_id: orderId,
        amount,
      })

      toast.success('결제가 완료되었습니다!')
      return result
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || '결제 확인 중 오류가 발생했습니다.'
      setError(new Error(errorMessage))
      toast.error(errorMessage)
      throw err
    } finally {
      setIsProcessing(false)
    }
  }, [])

  return {
    isLoading,
    isProcessing,
    error,
    initiatePayment,
    confirmPayment,
  }
}

// 시뮬레이션 잠금해제 전용 훅
export function useSimulationUnlock() {
  const { initiatePayment, isLoading, isProcessing, error } = usePayment()

  const unlockSimulation = useCallback(async (
    simulationId: string,
    onSuccess?: () => void
  ) => {
    await initiatePayment({
      productType: 'simulation_unlock',
      productName: 'AI 상권분석 시뮬레이션 잠금해제',
      amount: 30000,
      referenceId: simulationId,
      onSuccess: () => {
        onSuccess?.()
      },
    })
  }, [initiatePayment])

  return {
    unlockSimulation,
    isLoading,
    isProcessing,
    error,
  }
}

// 구독 결제 전용 훅
export function useSubscriptionPayment() {
  const { initiatePayment, isLoading, isProcessing, error } = usePayment()

  const subscribe = useCallback(async (
    planId: 'premium' | 'vip',
    billingCycle: 'monthly' | 'yearly',
    onSuccess?: () => void
  ) => {
    const prices = {
      premium: { monthly: 99000, yearly: 990000 },
      vip: { monthly: 199000, yearly: 1990000 },
    }

    const planNames = {
      premium: '프리미엄',
      vip: 'VIP',
    }

    await initiatePayment({
      productType: 'subscription',
      productName: `메디플라톤 ${planNames[planId]} 구독 (${billingCycle === 'monthly' ? '월간' : '연간'})`,
      amount: prices[planId][billingCycle],
      referenceId: `${planId}_${billingCycle}`,
      metadata: {
        plan_id: planId,
        billing_cycle: billingCycle,
      },
      onSuccess: () => {
        onSuccess?.()
      },
    })
  }, [initiatePayment])

  return {
    subscribe,
    isLoading,
    isProcessing,
    error,
  }
}
