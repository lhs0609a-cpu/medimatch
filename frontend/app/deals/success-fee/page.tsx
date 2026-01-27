'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Calculator, CreditCard, CheckCircle,
  AlertCircle, FileText, Building2, User, Calendar,
  TrendingUp, Shield, HelpCircle
} from 'lucide-react'

interface DealInfo {
  dealId: string
  pharmacyName: string
  region: string
  sellerName: string
  buyerName: string
  premiumAmount: number
  contractDate: string
  memberTier: 'default' | 'premium_member' | 'vip_member'
}

// 예시 거래 정보 (실제로는 API에서 가져옴)
const mockDeal: DealInfo = {
  dealId: 'DEAL-2024-0892',
  pharmacyName: '강남 OO약국',
  region: '서울 강남구',
  sellerName: '김OO 약사',
  buyerName: '이OO 약사',
  premiumAmount: 250000000, // 2.5억
  contractDate: '2024-01-25',
  memberTier: 'premium_member',
}

const tierRates = {
  default: { rate: 0.025, label: '일반 회원', discount: '0%' },
  premium_member: { rate: 0.02, label: '프리미엄 회원', discount: '20%' },
  vip_member: { rate: 0.015, label: 'VIP 회원', discount: '40%' },
}

const MIN_FEE = 1000000 // 100만원
const MAX_FEE = 30000000 // 3000만원

export default function SuccessFeePage() {
  const [deal] = useState<DealInfo>(mockDeal)
  const [agreed, setAgreed] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPaid, setIsPaid] = useState(false)

  const tierInfo = tierRates[deal.memberTier]

  // 성사 보수 계산
  const calculateFee = () => {
    let fee = Math.round(deal.premiumAmount * tierInfo.rate)
    fee = Math.max(fee, MIN_FEE)
    fee = Math.min(fee, MAX_FEE)
    return fee
  }

  const successFee = calculateFee()

  const formatPrice = (price: number) => {
    if (price >= 100000000) {
      return `${(price / 100000000).toFixed(1)}억원`
    }
    return `${(price / 10000).toLocaleString()}만원`
  }

  const formatPriceWon = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price) + '원'
  }

  const handlePayment = async () => {
    if (!agreed) return

    setIsProcessing(true)
    // 실제로는 결제 API 호출
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsProcessing(false)
    setIsPaid(true)
  }

  if (isPaid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="card max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">결제 완료</h1>
          <p className="text-muted-foreground mb-6">
            성사 보수 결제가 완료되었습니다.<br />
            거래 완료를 축하드립니다!
          </p>
          <div className="bg-secondary/50 rounded-xl p-4 mb-6 text-left">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">거래 번호</span>
              <span className="font-medium text-foreground">{deal.dealId}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">결제 금액</span>
              <span className="font-bold text-primary">{formatPriceWon(successFee)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">결제 일시</span>
              <span className="text-foreground">{new Date().toLocaleString('ko-KR')}</span>
            </div>
          </div>
          <Link href="/mypage" className="btn-primary w-full">
            마이페이지로 이동
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/deals" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-lg font-bold text-foreground">성사 보수 결제</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Deal Summary */}
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            거래 정보
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">매물</p>
                  <p className="font-medium text-foreground">{deal.pharmacyName}</p>
                  <p className="text-sm text-muted-foreground">{deal.region}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">계약 체결일</p>
                  <p className="font-medium text-foreground">{deal.contractDate}</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">양도인</p>
                  <p className="font-medium text-foreground">{deal.sellerName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">양수인</p>
                  <p className="font-medium text-foreground">{deal.buyerName}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fee Calculation */}
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            성사 보수 계산
          </h2>

          <div className="space-y-4">
            {/* Premium Amount */}
            <div className="flex justify-between items-center py-3 border-b border-border">
              <span className="text-muted-foreground">권리금</span>
              <span className="text-xl font-bold text-foreground">{formatPrice(deal.premiumAmount)}</span>
            </div>

            {/* Rate */}
            <div className="flex justify-between items-center py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">적용 요율</span>
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                  {tierInfo.label}
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-semibold text-foreground">{(tierInfo.rate * 100).toFixed(1)}%</span>
                {tierInfo.discount !== '0%' && (
                  <span className="ml-2 text-sm text-green-600">({tierInfo.discount} 할인)</span>
                )}
              </div>
            </div>

            {/* Calculation */}
            <div className="bg-secondary/50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">계산식</span>
                <span className="text-sm text-foreground">
                  {formatPrice(deal.premiumAmount)} × {(tierInfo.rate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">산출 금액</span>
                <span className="text-sm text-foreground">
                  {formatPriceWon(Math.round(deal.premiumAmount * tierInfo.rate))}
                </span>
              </div>
              {successFee === MIN_FEE && (
                <p className="text-xs text-amber-600 mt-2">* 최소 금액 {formatPriceWon(MIN_FEE)} 적용</p>
              )}
              {successFee === MAX_FEE && (
                <p className="text-xs text-amber-600 mt-2">* 최대 금액 {formatPriceWon(MAX_FEE)} 적용</p>
              )}
            </div>

            {/* Final Amount */}
            <div className="flex justify-between items-center py-4 border-t-2 border-primary">
              <span className="text-lg font-semibold text-foreground">최종 결제 금액</span>
              <span className="text-3xl font-bold text-primary">{formatPriceWon(successFee)}</span>
            </div>
          </div>
        </div>

        {/* Notice */}
        <div className="card p-6 mb-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-foreground mb-2">결제 전 확인사항</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• 성사 보수는 양도양수 계약 체결 확인 후 청구됩니다</li>
                <li>• 계약 취소 시 결제일로부터 7일 이내 환불 가능합니다</li>
                <li>• 세금계산서 발행이 필요하시면 고객센터로 문의해주세요</li>
                <li>• 결제 완료 후 거래 완료 처리됩니다</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Agreement */}
        <div className="card p-6 mb-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-border text-primary focus:ring-primary"
            />
            <div>
              <span className="font-medium text-foreground">약관 동의</span>
              <p className="text-sm text-muted-foreground mt-1">
                <Link href="/terms" className="text-primary hover:underline">이용약관</Link> 및{' '}
                <Link href="/privacy" className="text-primary hover:underline">개인정보처리방침</Link>에 동의하며,
                성사 보수 청구 내용을 확인하였습니다.
              </p>
            </div>
          </label>
        </div>

        {/* Payment Button */}
        <button
          onClick={handlePayment}
          disabled={!agreed || isProcessing}
          className={`w-full py-4 rounded-xl text-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
            agreed && !isProcessing
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-secondary text-muted-foreground cursor-not-allowed'
          }`}
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              처리 중...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              {formatPriceWon(successFee)} 결제하기
            </>
          )}
        </button>

        {/* Help */}
        <div className="mt-6 text-center">
          <Link href="/help" className="text-sm text-muted-foreground hover:text-primary flex items-center justify-center gap-1">
            <HelpCircle className="w-4 h-4" />
            결제 관련 문의
          </Link>
        </div>
      </main>
    </div>
  )
}
