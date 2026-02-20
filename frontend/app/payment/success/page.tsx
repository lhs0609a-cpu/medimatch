'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, ArrowRight, Home, FileText, TrendingUp, Crown, CheckCircle2 } from 'lucide-react'
import { TossIcon } from '@/components/ui/TossIcon'
import { paymentService } from '@/lib/api/services'

type PaymentType = 'simulation_unlock' | 'report_purchase' | 'subscription' | 'matching_request' | 'default'

interface PaymentResult {
  success: boolean
  productType: PaymentType
  referenceId: string | null
  amount: number
  orderId: string
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<PaymentResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const paymentKey = searchParams.get('paymentKey')
  const orderId = searchParams.get('orderId')
  const amount = searchParams.get('amount')
  const productType = (searchParams.get('type') || 'default') as PaymentType
  const referenceId = searchParams.get('ref')

  useEffect(() => {
    if (paymentKey && orderId && amount) {
      confirmPayment()
    } else {
      setError('결제 정보가 올바르지 않습니다.')
      setLoading(false)
    }
  }, [paymentKey, orderId, amount])

  const confirmPayment = async () => {
    try {
      const response = await paymentService.confirmPayment({
        payment_key: paymentKey!,
        order_id: orderId!,
        amount: parseInt(amount || '0'),
      })

      if (response) {
        setResult({
          success: true,
          productType,
          referenceId,
          amount: parseInt(amount || '0'),
          orderId: orderId!,
        })
      } else {
        setError('결제 승인에 실패했습니다.')
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || '결제 처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const getProductInfo = (type: PaymentType) => {
    switch (type) {
      case 'simulation_unlock':
        return {
          icon: TrendingUp,
          title: 'AI 상권분석 시뮬레이션',
          description: '시뮬레이션 결과가 잠금해제되었습니다. 전체 분석 내용을 확인하세요.',
          primaryAction: {
            label: '시뮬레이션 결과 보기',
            href: referenceId ? `/simulate/report/${referenceId}` : '/simulate',
          },
        }
      case 'report_purchase':
        return {
          icon: FileText,
          title: 'AI 상권분석 리포트',
          description: 'PDF 리포트를 다운로드할 수 있습니다.',
          primaryAction: {
            label: '리포트 다운로드',
            href: referenceId ? `/simulate/report/${referenceId}` : '/mypage',
          },
        }
      case 'subscription':
        return {
          icon: Crown,
          title: '구독 결제 완료',
          description: '프리미엄 기능을 무제한으로 이용할 수 있습니다.',
          primaryAction: {
            label: '마이페이지로 이동',
            href: '/mypage',
          },
        }
      case 'matching_request':
        return {
          icon: CheckCircle,
          title: '매칭 요청 완료',
          description: '상대방에게 매칭 요청이 전송되었습니다.',
          primaryAction: {
            label: '매칭 현황 보기',
            href: '/landlord/dashboard',
          },
        }
      default:
        return {
          icon: CheckCircle,
          title: '결제 완료',
          description: '결제가 성공적으로 처리되었습니다.',
          primaryAction: {
            label: '마이페이지로 이동',
            href: '/mypage',
          },
        }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-primary mx-auto mb-4"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-lg text-muted-foreground">결제를 처리하고 있습니다...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <span className="text-6xl block mx-auto mb-6">❌</span>
          <h1 className="text-2xl font-bold text-foreground mb-4">결제 실패</h1>
          <p className="text-muted-foreground mb-8">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => router.back()}
              className="block w-full py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium"
            >
              다시 시도하기
            </button>
            <Link
              href="/"
              className="block w-full py-3 bg-secondary text-foreground rounded-xl hover:bg-secondary/80 transition-colors font-medium"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const productInfo = getProductInfo(result?.productType || 'default')
  const Icon = productInfo.icon

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-green-600/10 rounded-full animate-ping opacity-25" />
            <div className="relative flex items-center justify-center w-24 h-24">
              <TossIcon icon={CheckCircle2} color="from-green-500 to-emerald-500" size="xl" shadow="shadow-green-500/25" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">결제 완료!</h1>
          <p className="text-muted-foreground">{productInfo.description}</p>
        </div>

        {/* Payment Details Card */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border">
            <TossIcon icon={Icon} color="from-blue-500 to-indigo-500" size="md" shadow="shadow-blue-500/25" />
            <div>
              <h3 className="font-semibold text-foreground">{productInfo.title}</h3>
              <p className="text-sm text-muted-foreground">주문번호: {result?.orderId}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">결제 금액</span>
              <span className="font-bold text-primary">
                {(result?.amount || 0).toLocaleString()}원
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">결제 수단</span>
              <span className="text-foreground">카드</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">결제 일시</span>
              <span className="text-foreground">{new Date().toLocaleString('ko-KR')}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href={productInfo.primaryAction.href}
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium"
          >
            {productInfo.primaryAction.label}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-3 bg-secondary text-foreground rounded-xl hover:bg-secondary/80 transition-colors font-medium"
          >
            <Home className="w-4 h-4" />
            홈으로 돌아가기
          </Link>
        </div>

        {/* Receipt Link */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          영수증은{' '}
          <Link href="/payment/history" className="text-primary hover:underline">
            결제 내역
          </Link>
          에서 확인하실 수 있습니다.
        </p>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  )
}
