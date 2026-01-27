'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Check, Crown, Zap, Building2, Users,
  TrendingUp, Bell, BarChart3, Star, ChevronRight,
  CreditCard, Gift, Sparkles, Target, Mail, Megaphone
} from 'lucide-react'

// 구독 플랜
const subscriptionPlans = [
  {
    id: 'landlord_starter',
    name: '스타터',
    price: 99000,
    period: '월',
    description: '처음 시작하는 건물주를 위한',
    features: [
      { text: '매물 1개 등록', included: true },
      { text: '기본 검색 노출', included: true },
      { text: '문의 알림', included: true },
      { text: '기본 통계', included: true },
      { text: '매칭 요청권 제공', included: false },
      { text: '상위 노출', included: false },
      { text: '전담 매니저', included: false },
    ],
    badge: null,
    color: 'gray',
  },
  {
    id: 'landlord_pro',
    name: '프로',
    price: 299000,
    period: '월',
    description: '적극적인 임대 활동을 위한',
    features: [
      { text: '매물 3개 등록', included: true },
      { text: '검색 상위 노출', included: true },
      { text: '문의 알림', included: true },
      { text: '상세 통계 리포트', included: true },
      { text: '월 5회 매칭 요청권', included: true },
      { text: '프로 배지 표시', included: true },
      { text: '전담 매니저', included: false },
    ],
    badge: '인기',
    recommended: true,
    color: 'blue',
  },
  {
    id: 'landlord_premium',
    name: '프리미엄',
    price: 599000,
    period: '월',
    description: '최상의 노출과 매칭을 원하는',
    features: [
      { text: '무제한 매물 등록', included: true },
      { text: '검색 최상위 노출', included: true },
      { text: '모든 알림 기능', included: true },
      { text: '프리미엄 통계 + AI 분석', included: true },
      { text: '무제한 매칭 요청권', included: true },
      { text: '프리미엄 배지', included: true },
      { text: '전담 매니저 배정', included: true },
    ],
    badge: 'VIP',
    color: 'purple',
  },
]

// 매칭 서비스 (양방향 동의 기반)
const matchingProducts = [
  { id: 'landlord_matching_request', name: '매칭 요청 1회', price: 50000, desc: '관심 회원에게 매칭 요청 (수락 시 연락처 공개)' },
  { id: 'landlord_matching_pack_5', name: '매칭 요청 5회권', price: 200000, desc: '5회 매칭 요청 (20% 할인)', discount: 20 },
  { id: 'landlord_matching_pack_10', name: '매칭 요청 10회권', price: 350000, desc: '10회 매칭 요청 (30% 할인)', discount: 30 },
]

// 광고 상품
const adProducts = [
  { id: 'landlord_boost_top', name: '검색 상위 노출', price: 300000, duration: '1주', icon: TrendingUp },
  { id: 'landlord_boost_featured', name: '추천 매물 배지', price: 200000, duration: '1주', icon: Star },
  { id: 'landlord_banner_home', name: '홈 배너 광고', price: 500000, duration: '1주', icon: Megaphone },
  { id: 'landlord_push_notification', name: '타겟 푸시 알림', price: 100000, duration: '1회', icon: Bell },
  { id: 'landlord_email_campaign', name: '이메일 마케팅', price: 200000, duration: '1회', icon: Mail },
  { id: 'landlord_premium_package', name: '프리미엄 패키지', price: 1500000, duration: '1개월', icon: Gift, discount: 30 },
]

export default function LandlordPricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  const handleSubscribe = (planId: string) => {
    const finalPlanId = billingPeriod === 'yearly' && planId === 'landlord_pro'
      ? 'landlord_pro_yearly'
      : planId
    window.location.href = `/payment?product=${finalPlanId}`
  }

  const handlePurchase = (productId: string) => {
    window.location.href = `/payment?product=${productId}`
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/landlord" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-lg font-bold text-foreground">건물주 서비스</span>
              </div>
            </div>
            <Link href="/landlord/dashboard" className="btn-outline text-sm">
              대시보드
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-700 dark:text-amber-400 text-sm font-medium mb-4">
            <Crown className="w-4 h-4" />
            건물주 전용 서비스
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            의사·약사 임차인을 직접 찾아드립니다
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            18,000명 이상의 개원 준비 의사·약사 DB를 활용하여<br />
            최적의 임차인을 빠르게 매칭해드립니다
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: '등록 의사·약사', value: '18,742명', icon: Users },
            { label: '평균 매칭 기간', value: '14일', icon: Zap },
            { label: '입주 성사율', value: '87%', icon: Target },
            { label: '누적 거래', value: '2,847건', icon: BarChart3 },
          ].map((stat) => (
            <div key={stat.label} className="card p-4 text-center">
              <stat.icon className="w-6 h-6 text-amber-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-secondary rounded-xl p-1 flex">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                billingPeriod === 'monthly'
                  ? 'bg-card text-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              월간 결제
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                billingPeriod === 'yearly'
                  ? 'bg-card text-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              연간 결제
              <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                2개월 무료
              </span>
            </button>
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {subscriptionPlans.map((plan) => (
            <div
              key={plan.id}
              className={`card relative overflow-hidden ${
                plan.recommended ? 'ring-2 ring-primary shadow-lg' : ''
              }`}
            >
              {plan.badge && (
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium ${
                  plan.badge === 'VIP'
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                }`}>
                  {plan.badge}
                </div>
              )}
              <div className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">
                    {formatPrice(billingPeriod === 'yearly' && plan.id === 'landlord_pro'
                      ? Math.round(plan.price * 10 / 12)
                      : plan.price
                    )}
                  </span>
                  <span className="text-muted-foreground">원/{plan.period}</span>
                  {billingPeriod === 'yearly' && plan.id === 'landlord_pro' && (
                    <p className="text-sm text-green-600 mt-1">연 {formatPrice(2990000)}원 (2개월 무료)</p>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                          <div className="w-1.5 h-1.5 bg-muted-foreground/30 rounded-full" />
                        </div>
                      )}
                      <span className={feature.included ? 'text-foreground' : 'text-muted-foreground/50'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  className={`w-full py-3 rounded-xl font-medium transition-colors ${
                    plan.recommended
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  시작하기
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Matching Service */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">매칭 서비스</h2>
            <p className="text-muted-foreground">
              내 매물에 관심 표시한 의사·약사에게 매칭 요청을 보내세요<br />
              <span className="text-sm">상대방이 수락해야만 연락처가 공개됩니다 (양방향 동의)</span>
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {matchingProducts.map((product) => (
              <div key={product.id} className="card p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-foreground">{product.name}</h3>
                  {product.discount && (
                    <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 text-xs rounded-full">
                      -{product.discount}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-3">{product.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-foreground">{formatPrice(product.price)}원</span>
                  <button
                    onClick={() => handlePurchase(product.id)}
                    className="px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90"
                  >
                    구매
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ad Products */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">광고 · 부스팅</h2>
            <p className="text-muted-foreground">
              매물 노출을 극대화하고 빠른 임대 계약을 성사시키세요
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adProducts.map((product) => (
              <div key={product.id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <product.icon className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{product.name}</h3>
                      {product.discount && (
                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 text-xs rounded-full">
                          -{product.discount}%
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{product.duration}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-foreground">{formatPrice(product.price)}원</span>
                      <button
                        onClick={() => handlePurchase(product.id)}
                        className="px-4 py-2 bg-secondary text-secondary-foreground text-sm rounded-lg hover:bg-secondary/80"
                      >
                        구매하기
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Success Fee Notice */}
        <div className="card p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 mb-12">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">입주 성사 수수료 안내</h3>
              <p className="text-muted-foreground mb-4">
                실제 임대 계약이 성사되었을 때만 발생하는 성공 보수입니다.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white/80 dark:bg-card/80 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">기본 요율</p>
                  <p className="text-lg font-bold text-foreground">월세 1개월분</p>
                </div>
                <div className="bg-white/80 dark:bg-card/80 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">또는</p>
                  <p className="text-lg font-bold text-foreground">보증금의 1%</p>
                </div>
                <div className="bg-white/80 dark:bg-card/80 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">범위</p>
                  <p className="text-lg font-bold text-foreground">50만~1,000만원</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                * 월세 1개월분과 보증금 1% 중 큰 금액이 적용됩니다
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            지금 시작하세요
          </h2>
          <p className="text-muted-foreground mb-6">
            무료 상담으로 최적의 플랜을 추천받으세요
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="tel:1588-0000" className="btn-primary">
              전화 상담 1588-0000
            </a>
            <Link href="/landlord/register" className="btn-outline">
              무료로 매물 등록하기
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
