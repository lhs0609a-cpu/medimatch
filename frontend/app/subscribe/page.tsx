'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Check, X, Sparkles, Crown, Zap,
  TrendingUp, Building2, FileText, MessageSquare,
  Shield, Clock, Infinity, Award, ChevronDown, ChevronUp,
  CreditCard, Users
} from 'lucide-react'

type BillingCycle = 'monthly' | 'yearly'
type PlanType = 'free' | 'premium' | 'vip'

interface PlanFeature {
  name: string
  free: string | boolean
  premium: string | boolean
  vip: string | boolean
}

const features: PlanFeature[] = [
  { name: '개원 시뮬레이션', free: '1회', premium: '무제한', vip: '무제한' },
  { name: '시뮬레이션 결과 열람', free: '블러 처리', premium: '전체 공개', vip: '전체 공개' },
  { name: 'AI 상권분석 리포트', free: false, premium: '월 3회', vip: '무제한' },
  { name: '매물 검색 및 조회', free: true, premium: true, vip: true },
  { name: '매물 관심 표시', free: '5개', premium: '50개', vip: '무제한' },
  { name: '매칭 요청 수신', free: true, premium: true, vip: true },
  { name: '맞춤 매물 알림', free: false, premium: '3개 조건', vip: '무제한' },
  { name: '컨설턴트 1:1 상담', free: false, premium: false, vip: '월 1회' },
  { name: '프리미엄 배지', free: false, premium: true, vip: true },
  { name: '우선 고객 지원', free: false, premium: false, vip: true },
]

const plans = {
  free: {
    name: '무료',
    icon: Zap,
    price: { monthly: 0, yearly: 0 },
    description: '서비스 체험하기',
    highlight: '기본 기능 무료 제공',
    color: 'gray',
  },
  premium: {
    name: '프리미엄',
    icon: Sparkles,
    price: { monthly: 99000, yearly: 990000 },
    description: '개원 준비에 최적화',
    highlight: '가장 인기 있는 플랜',
    color: 'blue',
    popular: true,
  },
  vip: {
    name: 'VIP',
    icon: Crown,
    price: { monthly: 199000, yearly: 1990000 },
    description: '프리미엄 + 전문가 상담',
    highlight: '모든 기능 무제한',
    color: 'amber',
  },
}

const faqs = [
  {
    question: '무료 체험 후 자동 결제되나요?',
    answer: '아니요, 무료 플랜은 결제 정보 없이 사용 가능합니다. 유료 플랜으로 업그레이드하실 때만 결제가 진행됩니다.',
  },
  {
    question: '시뮬레이션 결과가 블러 처리된다는 게 무슨 뜻인가요?',
    answer: '무료 플랜에서는 시뮬레이션 결과 중 핵심 데이터(예상 매출, 비용, ROI 등)가 흐리게 표시됩니다. 프리미엄 이상 플랜에서 모든 데이터를 선명하게 확인할 수 있습니다.',
  },
  {
    question: '구독 중간에 플랜을 변경할 수 있나요?',
    answer: '네, 언제든 업그레이드하거나 다운그레이드할 수 있습니다. 업그레이드 시 차액만 결제되며, 다운그레이드는 다음 결제 주기부터 적용됩니다.',
  },
  {
    question: '연간 구독의 할인율은 얼마인가요?',
    answer: '연간 구독 시 2개월 무료 혜택이 적용됩니다. 즉, 12개월 가격으로 10개월 분만 결제하시면 됩니다 (약 17% 할인).',
  },
  {
    question: 'VIP 플랜의 1:1 상담은 어떻게 진행되나요?',
    answer: '전문 개원 컨설턴트와 화상 또는 전화로 30분간 상담이 진행됩니다. 개원 전략, 입지 분석, 재무 계획 등 맞춤 조언을 받으실 수 있습니다.',
  },
  {
    question: '환불 정책은 어떻게 되나요?',
    answer: '결제일로부터 7일 이내 서비스를 이용하지 않은 경우 전액 환불됩니다. 이후에는 남은 기간에 대한 일할 계산 환불이 가능합니다.',
  },
]

export default function SubscribePage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null)

  const formatPrice = (price: number) => {
    if (price === 0) return '0원'
    return `${(price / 10000).toLocaleString()}만원`
  }

  const getMonthlyPrice = (plan: typeof plans.premium) => {
    if (billingCycle === 'yearly') {
      return Math.round(plan.price.yearly / 12)
    }
    return plan.price.monthly
  }

  const getSavings = (plan: typeof plans.premium) => {
    if (plan.price.monthly === 0) return null
    const monthlyCost = plan.price.monthly * 12
    const yearlyCost = plan.price.yearly
    return monthlyCost - yearlyCost
  }

  const handleSelectPlan = (planType: PlanType) => {
    if (planType === 'free') {
      // 무료 플랜은 바로 회원가입으로
      window.location.href = '/register'
      return
    }
    setSelectedPlan(planType)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-lg font-semibold">메디플라톤 구독</h1>
            </div>
            <Link href="/login" className="btn-ghost text-sm">
              로그인
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            개원 준비, 더 스마트하게
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            AI 기반 상권분석과 매물 매칭으로 성공적인 개원을 준비하세요.
            <br />
            첫 시뮬레이션은 무료입니다.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-1 p-1 bg-secondary rounded-full">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              월간 결제
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                billingCycle === 'yearly'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              연간 결제
              <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 text-xs rounded-full">
                2개월 무료
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {(Object.entries(plans) as [PlanType, typeof plans.premium][]).map(([planType, plan]) => {
            const Icon = plan.icon
            const isPremium = planType === 'premium'
            const isVip = planType === 'vip'
            const monthlyPrice = getMonthlyPrice(plan)
            const savings = getSavings(plan)

            return (
              <div
                key={planType}
                className={`relative bg-card rounded-2xl border-2 transition-all ${
                  isPremium
                    ? 'border-primary shadow-lg shadow-primary/10 scale-[1.02]'
                    : 'border-border hover:border-primary/50'
                } p-6 flex flex-col`}
              >
                {isPremium && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 bg-primary text-primary-foreground text-sm font-medium rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      인기
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isPremium
                      ? 'bg-primary/10'
                      : isVip
                        ? 'bg-amber-100 dark:bg-amber-900/30'
                        : 'bg-secondary'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      isPremium
                        ? 'text-primary'
                        : isVip
                          ? 'text-amber-600'
                          : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold">{formatPrice(monthlyPrice)}</span>
                    {monthlyPrice > 0 && <span className="text-muted-foreground mb-1">/월</span>}
                  </div>
                  {billingCycle === 'yearly' && savings && savings > 0 && (
                    <p className="text-sm text-green-600 mt-1">
                      연간 결제 시 {formatPrice(savings)} 절약
                    </p>
                  )}
                </div>

                {/* Highlight */}
                <div className={`rounded-lg p-3 mb-6 text-sm font-medium ${
                  isPremium
                    ? 'bg-primary/10 text-primary'
                    : isVip
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                      : 'bg-secondary text-muted-foreground'
                }`}>
                  {plan.highlight}
                </div>

                {/* Key Features Preview */}
                <ul className="space-y-3 mb-6 flex-1">
                  {features.slice(0, 5).map((feature, i) => {
                    const value = feature[planType]
                    const hasFeature = value !== false

                    return (
                      <li key={i} className="flex items-center gap-2">
                        {hasFeature ? (
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                        )}
                        <span className={`text-sm ${!hasFeature && 'text-muted-foreground/40'}`}>
                          {feature.name}
                          {typeof value === 'string' && (
                            <span className="text-muted-foreground ml-1">({value})</span>
                          )}
                        </span>
                      </li>
                    )
                  })}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleSelectPlan(planType)}
                  className={`w-full py-3 rounded-xl font-medium transition-colors ${
                    isPremium
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : isVip
                        ? 'bg-amber-500 text-white hover:bg-amber-600'
                        : 'bg-secondary text-foreground hover:bg-secondary/80'
                  }`}
                >
                  {planType === 'free' ? '무료로 시작' : '구독 시작'}
                </button>
              </div>
            )
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-center mb-8">상세 기능 비교</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left py-4 px-4 font-semibold">기능</th>
                  <th className="text-center py-4 px-4 font-semibold w-28">무료</th>
                  <th className="text-center py-4 px-4 font-semibold w-28 bg-primary/5">프리미엄</th>
                  <th className="text-center py-4 px-4 font-semibold w-28">VIP</th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="py-4 px-4 text-sm">{feature.name}</td>
                    {(['free', 'premium', 'vip'] as const).map((planType) => {
                      const value = feature[planType]
                      const isPremiumCol = planType === 'premium'

                      return (
                        <td
                          key={planType}
                          className={`text-center py-4 px-4 ${isPremiumCol && 'bg-primary/5'}`}
                        >
                          {value === true ? (
                            <Check className="w-5 h-5 text-green-500 mx-auto" />
                          ) : value === false ? (
                            <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />
                          ) : (
                            <span className={`text-sm ${isPremiumCol ? 'font-medium text-primary' : ''}`}>
                              {value}
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-center mb-8">왜 메디플라톤인가요?</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card p-6 text-center">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-7 h-7 text-blue-600" />
              </div>
              <h4 className="font-semibold mb-2">AI 기반 정확한 분석</h4>
              <p className="text-sm text-muted-foreground">
                심평원, 국토부, 통계청 데이터를 기반으로 예상 매출과 손익분기점을 분석합니다.
              </p>
            </div>
            <div className="card p-6 text-center">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-7 h-7 text-green-600" />
              </div>
              <h4 className="font-semibold mb-2">검증된 매물만</h4>
              <p className="text-sm text-muted-foreground">
                건물주 인증과 매물 검증을 통해 신뢰할 수 있는 정보만 제공합니다.
              </p>
            </div>
            <div className="card p-6 text-center">
              <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-purple-600" />
              </div>
              <h4 className="font-semibold mb-2">안전한 매칭 시스템</h4>
              <p className="text-sm text-muted-foreground">
                양방향 동의 기반으로 원치 않는 연락 없이 안전하게 매칭됩니다.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mb-16">
          <h3 className="text-2xl font-bold text-center mb-8">자주 묻는 질문</h3>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/50 transition-colors"
                >
                  <span className="font-medium pr-4">{faq.question}</span>
                  {openFaq === i ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-muted-foreground text-sm">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Trust Signals */}
        <div className="text-center mb-12">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>SSL 보안 결제</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span>토스페이먼츠</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>7일 환불 보장</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>1,000+ 이용자</span>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-amber-500/10 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold mb-2">지금 바로 시작하세요</h3>
          <p className="text-muted-foreground mb-6">
            첫 시뮬레이션은 무료입니다. 결제 정보 없이 체험해보세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/simulate"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              <Sparkles className="w-5 h-5" />
              무료 시뮬레이션 시작
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-foreground rounded-xl font-medium hover:bg-secondary/80 transition-colors"
            >
              회원가입
            </Link>
          </div>
        </div>
      </main>

      {/* Payment Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">
              {plans[selectedPlan].name} 플랜 구독
            </h3>

            <div className="bg-secondary/50 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted-foreground">플랜</span>
                <span className="font-medium">{plans[selectedPlan].name}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted-foreground">결제 주기</span>
                <span className="font-medium">{billingCycle === 'monthly' ? '월간' : '연간'}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="font-medium">결제 금액</span>
                <span className="text-xl font-bold text-primary">
                  {formatPrice(billingCycle === 'monthly'
                    ? plans[selectedPlan].price.monthly
                    : plans[selectedPlan].price.yearly
                  )}
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <button className="w-full py-3 bg-[#0064FF] text-white rounded-xl font-medium hover:bg-[#0064FF]/90 transition-colors flex items-center justify-center gap-2">
                토스페이로 결제
              </button>
              <button className="w-full py-3 bg-[#FEE500] text-[#191919] rounded-xl font-medium hover:bg-[#FEE500]/90 transition-colors flex items-center justify-center gap-2">
                카카오페이로 결제
              </button>
              <button className="w-full py-3 bg-secondary text-foreground rounded-xl font-medium hover:bg-secondary/80 transition-colors">
                신용카드 결제
              </button>
            </div>

            <button
              onClick={() => setSelectedPlan(null)}
              className="w-full py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
