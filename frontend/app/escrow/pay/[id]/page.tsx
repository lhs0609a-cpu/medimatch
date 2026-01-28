'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Shield,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader2,
  Building,
} from 'lucide-react'
import { escrowService } from '@/lib/api/services'

// TossPayments 타입은 payment/page.tsx에서 전역 선언됨

export default function EscrowPayPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const escrowId = params.id as string

  const [transaction, setTransaction] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPaying, setIsPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handle payment result from redirect
  const paymentKey = searchParams.get('paymentKey')
  const orderId = searchParams.get('orderId')
  const amount = searchParams.get('amount')

  useEffect(() => {
    if (paymentKey && orderId && amount) {
      // Payment success redirect - confirm payment
      confirmPayment()
    } else {
      loadTransaction()
    }
  }, [escrowId, paymentKey])

  const loadTransaction = async () => {
    setIsLoading(true)
    try {
      const data = await escrowService.getTransaction(escrowId)
      setTransaction(data)
    } catch (error) {
      setError('거래 정보를 불러올 수 없습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const confirmPayment = async () => {
    setIsLoading(true)
    try {
      await escrowService.confirmTransaction(escrowId, {
        payment_key: paymentKey!,
        order_id: orderId!,
        amount: Number(amount),
      })
      // Redirect to success page
      router.push(`/escrow/${escrowId}?payment=success`)
    } catch (error: any) {
      setError(error.response?.data?.detail || '결제 승인에 실패했습니다.')
      setIsLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!transaction) return

    setIsPaying(true)
    try {
      // Get payment info from backend
      const paymentInfo = await escrowService.fundTransaction(escrowId, {
        success_url: `${window.location.origin}/escrow/pay/${escrowId}`,
        fail_url: `${window.location.origin}/escrow/pay/${escrowId}?error=true`,
      })

      // Initialize Toss Payments
      const tossPayments = new window.TossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY)

      // Request payment
      await tossPayments.requestPayment('카드', {
        amount: paymentInfo.amount,
        orderId: paymentInfo.order_id,
        orderName: paymentInfo.order_name,
        successUrl: paymentInfo.success_url,
        failUrl: paymentInfo.fail_url,
      })
    } catch (error: any) {
      if (error.code === 'USER_CANCEL') {
        // User cancelled payment
        setError('결제가 취소되었습니다.')
      } else {
        setError(error.message || '결제 요청에 실패했습니다.')
      }
    } finally {
      setIsPaying(false)
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-violet-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">처리 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">결제 오류</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setError(null)
                loadTransaction()
              }}
              className="w-full py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700"
            >
              다시 시도
            </button>
            <Link
              href={`/escrow/${escrowId}`}
              className="block w-full py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50"
            >
              거래 상세로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">거래를 찾을 수 없습니다</h2>
          <Link href="/escrow" className="text-violet-600 hover:underline">
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toss Payments SDK */}
      <script src="https://js.tosspayments.com/v1/payment"></script>

      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/escrow/${escrowId}`} className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-bold text-gray-900">에스크로 결제</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-lg">
        {/* Transaction Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
              <Building className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">{transaction.partner_name || '파트너'}</h2>
              <p className="text-sm text-gray-500">{transaction.contract?.title || '에스크로 거래'}</p>
            </div>
          </div>

          <div className="border-t pt-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">계약 금액</span>
              <span className="font-semibold">{formatAmount(transaction.total_amount)}원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">플랫폼 수수료 (3%)</span>
              <span className="font-semibold">{formatAmount(transaction.platform_fee)}원</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-3 border-t">
              <span>총 결제 금액</span>
              <span className="text-violet-600">{formatAmount(transaction.total_amount)}원</span>
            </div>
          </div>
        </div>

        {/* Escrow Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium">에스크로 결제 안내</p>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>결제 금액은 에스크로 계좌에 안전하게 보관됩니다</li>
                <li>마일스톤 완료 시 단계별로 파트너에게 지급됩니다</li>
                <li>서비스에 문제가 있을 경우 환불 요청이 가능합니다</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Milestone Preview */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h3 className="font-bold text-gray-900 mb-4">지급 일정</h3>
          <div className="space-y-3">
            {transaction.milestones?.map((milestone: any, idx: number) => (
              <div key={milestone.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">
                    {idx + 1}
                  </div>
                  <span className="text-gray-700">{milestone.name}</span>
                </div>
                <span className="font-semibold">
                  {formatAmount(milestone.amount)}원 ({milestone.percentage}%)
                </span>
              </div>
            )) || (
              <>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-700">착수금</span>
                  <span className="font-semibold">30%</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-700">중도금</span>
                  <span className="font-semibold">40%</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-700">잔금</span>
                  <span className="font-semibold">30%</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Pay Button */}
        <button
          onClick={handlePayment}
          disabled={isPaying || transaction.status !== 'INITIATED'}
          className="w-full py-4 bg-violet-600 text-white rounded-xl font-bold text-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPaying ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              결제 진행 중...
            </>
          ) : transaction.status === 'FUNDED' ? (
            <>
              <CheckCircle className="w-5 h-5" />
              결제 완료
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              {formatAmount(transaction.total_amount)}원 결제하기
            </>
          )}
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          결제 시 <Link href="/terms" className="text-violet-600 hover:underline">이용약관</Link> 및{' '}
          <Link href="/privacy" className="text-violet-600 hover:underline">개인정보처리방침</Link>에 동의합니다.
        </p>
      </main>
    </div>
  )
}
