'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  ArrowLeft,
  Check,
  X,
  HelpCircle,
  Zap,
  Crown,
  Building2,
  Users,
  Bell,
  FileText,
  MessageSquare,
  Star,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

type PlanType = 'FREE' | 'BASIC' | 'STANDARD' | 'PREMIUM'

interface Plan {
  name: string
  price: number
  priceLabel: string
  description: string
  leads: string
  leadDetail: string
  features: { name: string; included: boolean; detail?: string }[]
  cta: string
  popular?: boolean
}

const plans: Record<PlanType, Plan> = {
  FREE: {
    name: '무료',
    price: 0,
    priceLabel: '0원',
    description: '서비스 체험용',
    leads: '건당 과금',
    leadDetail: '리드 1건당 50,000원',
    features: [
      { name: '개원지 탐색', included: true, detail: '신축/폐업/공실 정보 열람' },
      { name: '지도 기반 검색', included: true },
      { name: '기본 프로필', included: true },
      { name: '의사 연락처 열람', included: false, detail: '건당 결제 필요' },
      { name: '알림 설정', included: false },
      { name: '검색 우선 노출', included: false },
      { name: '포트폴리오 등록', included: false },
      { name: '프리미엄 배지', included: false },
    ],
    cta: '무료로 시작',
  },
  BASIC: {
    name: '베이직',
    price: 300000,
    priceLabel: '월 30만원',
    description: '소규모 영업팀용',
    leads: '월 10건',
    leadDetail: '개원 준비중 의사 연락처 10건 열람',
    features: [
      { name: '개원지 탐색', included: true },
      { name: '지도 기반 검색', included: true },
      { name: '기본 프로필', included: true },
      { name: '의사 연락처 열람', included: true, detail: '월 10건 포함' },
      { name: '알림 설정', included: true, detail: '최대 3개 지역' },
      { name: '검색 우선 노출', included: false },
      { name: '포트폴리오 등록', included: false },
      { name: '프리미엄 배지', included: false },
    ],
    cta: '베이직 시작',
  },
  STANDARD: {
    name: '스탠다드',
    price: 500000,
    priceLabel: '월 50만원',
    description: '성장하는 영업팀용',
    leads: '월 30건',
    leadDetail: '개원 준비중 의사 연락처 30건 열람',
    features: [
      { name: '개원지 탐색', included: true },
      { name: '지도 기반 검색', included: true },
      { name: '기본 프로필', included: true },
      { name: '의사 연락처 열람', included: true, detail: '월 30건 포함' },
      { name: '알림 설정', included: true, detail: '최대 10개 지역' },
      { name: '검색 우선 노출', included: true, detail: '의사 검색 시 상위 노출' },
      { name: '포트폴리오 등록', included: true, detail: '최대 5개' },
      { name: '프리미엄 배지', included: false },
    ],
    cta: '스탠다드 시작',
    popular: true,
  },
  PREMIUM: {
    name: '프리미엄',
    price: 1000000,
    priceLabel: '월 100만원',
    description: '대규모 영업팀용',
    leads: '무제한',
    leadDetail: '개원 준비중 의사 연락처 무제한 열람',
    features: [
      { name: '개원지 탐색', included: true },
      { name: '지도 기반 검색', included: true },
      { name: '기본 프로필', included: true },
      { name: '의사 연락처 열람', included: true, detail: '무제한' },
      { name: '알림 설정', included: true, detail: '무제한' },
      { name: '검색 우선 노출', included: true, detail: '최상단 고정' },
      { name: '포트폴리오 등록', included: true, detail: '무제한' },
      { name: '프리미엄 배지', included: true, detail: '신뢰도 UP' },
    ],
    cta: '프리미엄 시작',
  },
}

// FAQ 데이터
const faqs = [
  {
    question: '"리드"가 정확히 무엇인가요?',
    answer: '리드는 개원을 준비 중인 의사의 연락처(이름, 전화번호, 이메일)를 열람하는 것을 의미합니다. 리드를 통해 직접 영업 연락을 할 수 있습니다. 리드 1건 = 의사 1명의 연락처 열람입니다.',
  },
  {
    question: '의사가 연락을 거부하면 어떻게 되나요?',
    answer: '매칭 요청(건당 30만원) 방식의 경우, 의사가 48시간 내 거절하거나 무응답 시 자동으로 전액 환불됩니다. 단, 월 구독에 포함된 리드는 열람 시점에 차감되며 환불되지 않습니다.',
  },
  {
    question: '구독을 중간에 해지할 수 있나요?',
    answer: '네, 언제든 해지 가능합니다. 해지 후에도 현재 결제 주기가 끝날 때까지 서비스를 이용할 수 있습니다. 남은 리드는 다음 달로 이월되지 않습니다.',
  },
  {
    question: '연간 구독 할인이 있나요?',
    answer: '네, 연간 구독 시 2개월 무료 혜택이 있습니다. 예: 베이직 연간 구독 = 300만원 (월 25만원 상당).',
  },
  {
    question: '결제 수단은 무엇이 있나요?',
    answer: '신용카드, 계좌이체, 가상계좌를 지원합니다. 토스페이먼츠를 통해 안전하게 결제됩니다.',
  },
]

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const getPrice = (plan: Plan) => {
    if (plan.price === 0) return plan.priceLabel
    if (billingCycle === 'yearly') {
      const yearlyPrice = plan.price * 10 // 2개월 무료
      return `연 ${(yearlyPrice / 10000).toLocaleString()}만원`
    }
    return plan.priceLabel
  }

  const getMonthlyEquivalent = (plan: Plan) => {
    if (plan.price === 0 || billingCycle === 'monthly') return null
    const monthlyEquivalent = (plan.price * 10) / 12
    return `월 ${Math.round(monthlyEquivalent / 10000).toLocaleString()}만원 상당`
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-lg font-semibold">SalesScanner 요금제</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            영업 효율을 높이는 스마트한 선택
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            개원 준비중인 의사를 실시간으로 찾고, 직접 연락하세요.
            <br />
            무응답 시 자동 환불되니 부담 없이 시작하세요.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-3 p-1 bg-secondary rounded-full">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              월간 결제
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                billingCycle === 'yearly'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              연간 결제
              <span className="ml-1 text-xs text-green-600">2개월 무료</span>
            </button>
          </div>
        </div>

        {/* 리드 설명 배너 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                "리드"란 무엇인가요?
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                리드 = 개원 준비중인 의사의 <strong>연락처(이름, 전화번호, 이메일)</strong>를 열람하는 것입니다.
                <br />
                예: 월 10건 리드 = 한 달에 10명의 의사 연락처를 확인하고 직접 영업 연락을 할 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {(Object.keys(plans) as PlanType[]).map((planKey) => {
            const plan = plans[planKey]
            return (
              <div
                key={planKey}
                className={`relative bg-card rounded-2xl border ${
                  plan.popular ? 'border-primary shadow-lg shadow-primary/10' : 'border-border'
                } p-6 flex flex-col`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                      인기
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="text-3xl font-bold">{getPrice(plan)}</div>
                  {getMonthlyEquivalent(plan) && (
                    <p className="text-sm text-green-600 mt-1">{getMonthlyEquivalent(plan)}</p>
                  )}
                </div>

                {/* Leads */}
                <div className="bg-secondary/50 rounded-lg p-3 mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="font-medium">{plan.leads}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{plan.leadDetail}</p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      {feature.included ? (
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={feature.included ? '' : 'text-muted-foreground/50'}>
                        <span className="text-sm">{feature.name}</span>
                        {feature.detail && (
                          <span className="text-xs text-muted-foreground block">{feature.detail}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href={`/sales/subscribe?plan=${planKey}`}
                  className={`block w-full py-3 rounded-xl text-center font-medium transition-colors ${
                    plan.popular
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-secondary text-foreground hover:bg-secondary/80'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            )
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-center mb-8">기능 비교</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 font-medium">기능</th>
                  <th className="text-center py-4 px-4 font-medium">무료</th>
                  <th className="text-center py-4 px-4 font-medium">베이직</th>
                  <th className="text-center py-4 px-4 font-medium bg-primary/5">스탠다드</th>
                  <th className="text-center py-4 px-4 font-medium">프리미엄</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      월 리드 수
                    </div>
                  </td>
                  <td className="text-center py-4 px-4 text-muted-foreground">건당 과금</td>
                  <td className="text-center py-4 px-4">10건</td>
                  <td className="text-center py-4 px-4 bg-primary/5 font-medium">30건</td>
                  <td className="text-center py-4 px-4 font-medium text-primary">무제한</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-muted-foreground" />
                      알림 지역 수
                    </div>
                  </td>
                  <td className="text-center py-4 px-4"><X className="w-4 h-4 mx-auto text-muted-foreground/50" /></td>
                  <td className="text-center py-4 px-4">3개</td>
                  <td className="text-center py-4 px-4 bg-primary/5">10개</td>
                  <td className="text-center py-4 px-4">무제한</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-muted-foreground" />
                      검색 우선 노출
                    </div>
                  </td>
                  <td className="text-center py-4 px-4"><X className="w-4 h-4 mx-auto text-muted-foreground/50" /></td>
                  <td className="text-center py-4 px-4"><X className="w-4 h-4 mx-auto text-muted-foreground/50" /></td>
                  <td className="text-center py-4 px-4 bg-primary/5"><Check className="w-4 h-4 mx-auto text-green-500" /></td>
                  <td className="text-center py-4 px-4"><Crown className="w-4 h-4 mx-auto text-amber-500" /></td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      포트폴리오
                    </div>
                  </td>
                  <td className="text-center py-4 px-4"><X className="w-4 h-4 mx-auto text-muted-foreground/50" /></td>
                  <td className="text-center py-4 px-4"><X className="w-4 h-4 mx-auto text-muted-foreground/50" /></td>
                  <td className="text-center py-4 px-4 bg-primary/5">5개</td>
                  <td className="text-center py-4 px-4">무제한</td>
                </tr>
                <tr>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-muted-foreground" />
                      프리미엄 배지
                    </div>
                  </td>
                  <td className="text-center py-4 px-4"><X className="w-4 h-4 mx-auto text-muted-foreground/50" /></td>
                  <td className="text-center py-4 px-4"><X className="w-4 h-4 mx-auto text-muted-foreground/50" /></td>
                  <td className="text-center py-4 px-4 bg-primary/5"><X className="w-4 h-4 mx-auto text-muted-foreground/50" /></td>
                  <td className="text-center py-4 px-4"><Check className="w-4 h-4 mx-auto text-green-500" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8">자주 묻는 질문</h3>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/50 transition-colors"
                >
                  <span className="font-medium">{faq.question}</span>
                  {openFaq === i ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-muted-foreground">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Banner */}
        <div className="mt-16 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold mb-2">아직 고민되시나요?</h3>
          <p className="text-muted-foreground mb-6">
            무료로 시작하고, 효과를 확인한 후 업그레이드하세요.
          </p>
          <Link
            href="/sales/register"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            무료로 시작하기
          </Link>
        </div>
      </main>
    </div>
  )
}
