'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Check, Star, Shield, Users, Phone,
  FileText, Link2, Clock, Award, ChevronRight,
  CreditCard, Sparkles, Building2, TrendingUp
} from 'lucide-react'

interface ConsultingPlan {
  id: string
  name: string
  price: number
  description: string
  features: string[]
  recommended?: boolean
  popular?: boolean
}

const consultingPlans: ConsultingPlan[] = [
  {
    id: 'pharmacy_consulting_basic',
    name: '매칭 컨설팅 베이직',
    price: 500000,
    description: '3개 매물 연결 + 기본 상담',
    features: [
      '맞춤 매물 3건 추천',
      '매물 상세 정보 열람',
      '양도인 연락처 제공',
      '기본 상담 1회',
    ],
  },
  {
    id: 'pharmacy_consulting_premium',
    name: '매칭 컨설팅 프리미엄',
    price: 1500000,
    description: '무제한 매물 + 협상 지원 + 계약 동행',
    features: [
      '무제한 매물 추천',
      '전담 컨설턴트 배정',
      '권리금 협상 지원',
      '계약 동행 서비스',
      '법률 검토 지원',
      '3개월 사후 관리',
    ],
    recommended: true,
    popular: true,
  },
  {
    id: 'pharmacy_consulting_vip',
    name: 'VIP 토탈 케어',
    price: 3000000,
    description: 'All-in-One 양도양수 대행',
    features: [
      '프리미엄 서비스 전체 포함',
      '실사 대행',
      '자금 조달 컨설팅',
      '인허가 변경 대행',
      '인테리어 연계',
      '개국 후 6개월 운영 컨설팅',
    ],
  },
]

const successStories = [
  { region: '서울 강남구', type: '약국', premium: '2.5억', fee: '625만원', days: 12 },
  { region: '경기 분당', type: '약국', premium: '1.8억', fee: '450만원', days: 18 },
  { region: '부산 해운대', type: '약국', premium: '1.2억', fee: '300만원', days: 9 },
]

export default function ConsultingPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId)
    setShowPaymentModal(true)
  }

  const handlePayment = async () => {
    if (!selectedPlan) return

    // 결제 페이지로 이동
    window.location.href = `/payment?product=${selectedPlan}`
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Link2 className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold text-foreground">양도양수 컨설팅</span>
              </div>
            </div>
            <Link href="/pharmacy-match" className="btn-outline text-sm">
              매물 보기
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4">
            <Award className="w-4 h-4" />
            전문 컨설턴트가 함께합니다
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            약국 양도양수, 혼자 하지 마세요
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            권리금 협상부터 계약, 인허가까지<br />
            전문 컨설턴트가 성공적인 양도양수를 도와드립니다
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: '누적 성사 건수', value: '2,847건', icon: FileText },
            { label: '평균 매칭 기간', value: '12일', icon: Clock },
            { label: '고객 만족도', value: '98.5%', icon: Star },
            { label: '전문 컨설턴트', value: '47명', icon: Users },
          ].map((stat) => (
            <div key={stat.label} className="card p-4 text-center">
              <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Pricing Cards */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">
            컨설팅 서비스 선택
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {consultingPlans.map((plan) => (
              <div
                key={plan.id}
                className={`card relative overflow-hidden transition-all ${
                  plan.recommended
                    ? 'ring-2 ring-primary shadow-lg scale-105'
                    : 'hover:shadow-md'
                }`}
              >
                {plan.recommended && (
                  <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-center py-1 text-sm font-medium">
                    가장 인기 있는 선택
                  </div>
                )}
                <div className={`p-6 ${plan.recommended ? 'pt-10' : ''}`}>
                  <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>

                  <div className="mb-6">
                    <span className="text-3xl font-bold text-foreground">
                      {formatPrice(plan.price)}
                    </span>
                    <span className="text-muted-foreground">원</span>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full py-3 rounded-xl font-medium transition-colors ${
                      plan.recommended
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    선택하기
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Success Fee Section */}
        <div className="card p-8 mb-12 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">성사 보수 안내</h2>
              <p className="text-muted-foreground">
                양도양수 계약 성사 시에만 발생하는 성공 보수입니다.<br />
                컨설팅 비용과 별도이며, 성사되지 않으면 청구되지 않습니다.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/80 dark:bg-card/80 rounded-xl p-4">
              <p className="text-sm text-muted-foreground mb-1">일반 회원</p>
              <p className="text-2xl font-bold text-foreground">권리금의 2.5%</p>
              <p className="text-xs text-muted-foreground mt-1">최소 100만원 ~ 최대 3,000만원</p>
            </div>
            <div className="bg-white/80 dark:bg-card/80 rounded-xl p-4">
              <p className="text-sm text-muted-foreground mb-1">프리미엄 회원</p>
              <p className="text-2xl font-bold text-foreground">권리금의 2.0%</p>
              <p className="text-xs text-muted-foreground mt-1">컨설팅 프리미엄 이용 시</p>
            </div>
            <div className="bg-white/80 dark:bg-card/80 rounded-xl p-4">
              <p className="text-sm text-muted-foreground mb-1">VIP 회원</p>
              <p className="text-2xl font-bold text-foreground">권리금의 1.5%</p>
              <p className="text-xs text-muted-foreground mt-1">VIP 토탈 케어 이용 시</p>
            </div>
          </div>

          <div className="bg-white/60 dark:bg-card/60 rounded-xl p-4">
            <h3 className="font-semibold text-foreground mb-3">최근 성사 사례</h3>
            <div className="space-y-2">
              {successStories.map((story, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{story.region} {story.type}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">권리금 {story.premium}</span>
                    <span className="text-primary font-medium">성사보수 {story.fee}</span>
                    <span className="text-green-600">{story.days}일 만에 성사</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Process */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">
            컨설팅 진행 절차
          </h2>
          <div className="grid md:grid-cols-5 gap-4">
            {[
              { step: '01', title: '상담 신청', desc: '컨설팅 결제 후\n전담 컨설턴트 배정' },
              { step: '02', title: '니즈 파악', desc: '희망 조건 및\n예산 상담' },
              { step: '03', title: '매물 추천', desc: '조건에 맞는\n검증된 매물 소개' },
              { step: '04', title: '협상 지원', desc: '권리금 및 조건\n협상 대행' },
              { step: '05', title: '계약 체결', desc: '계약서 검토 및\n안전 거래 지원' },
            ].map((item, idx) => (
              <div key={item.step} className="relative">
                <div className="card p-4 text-center h-full">
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{item.desc}</p>
                </div>
                {idx < 4 && (
                  <ChevronRight className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 w-6 h-6 text-muted-foreground/30" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="card p-8 text-center bg-gradient-to-r from-primary/5 to-primary/10">
          <Sparkles className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            무료 상담 먼저 받아보세요
          </h2>
          <p className="text-muted-foreground mb-6">
            컨설팅 결제 전, 전문가와 무료로 상담해보실 수 있습니다
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:1588-0000"
              className="btn-primary flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" />
              전화 상담 1588-0000
            </a>
            <Link href="/contact" className="btn-outline">
              온라인 문의하기
            </Link>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">
            자주 묻는 질문
          </h2>
          <div className="space-y-4 max-w-3xl mx-auto">
            {[
              {
                q: '컨설팅 비용과 성사 보수는 별도인가요?',
                a: '네, 컨설팅 비용은 서비스 이용료이고, 성사 보수는 실제 계약이 체결되었을 때만 발생합니다. 성사되지 않으면 성사 보수는 청구되지 않습니다.',
              },
              {
                q: '중개수수료랑 다른 건가요?',
                a: '네, 저희는 공인중개사가 아니며 중개수수료가 아닌 "매칭 컨설팅 서비스 비용"과 "성사 보수"를 받습니다. 이는 매물 정보 제공, 협상 지원, 계약 검토 등의 컨설팅 서비스에 대한 대가입니다.',
              },
              {
                q: '환불이 가능한가요?',
                a: '컨설팅 서비스 시작 전에는 전액 환불이 가능합니다. 서비스 시작 후에는 진행 단계에 따라 부분 환불이 적용됩니다. 자세한 내용은 이용약관을 참고해주세요.',
              },
              {
                q: '권리금 협상도 대행해주나요?',
                a: '프리미엄 이상 서비스에서는 권리금 협상을 대행해드립니다. 시장 데이터와 경험을 바탕으로 합리적인 권리금 협상을 지원합니다.',
              },
            ].map((faq, idx) => (
              <div key={idx} className="card p-6">
                <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
                <p className="text-muted-foreground text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Payment Modal */}
      {showPaymentModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-foreground mb-4">결제 확인</h3>
            <div className="bg-secondary/50 rounded-xl p-4 mb-6">
              <p className="text-sm text-muted-foreground mb-1">선택한 서비스</p>
              <p className="font-semibold text-foreground">
                {consultingPlans.find((p) => p.id === selectedPlan)?.name}
              </p>
              <p className="text-2xl font-bold text-primary mt-2">
                {formatPrice(consultingPlans.find((p) => p.id === selectedPlan)?.price || 0)}원
              </p>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              결제 후 24시간 이내에 전담 컨설턴트가 연락드립니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-3 border border-border rounded-xl text-foreground hover:bg-secondary/50"
              >
                취소
              </button>
              <button
                onClick={handlePayment}
                className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                결제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
