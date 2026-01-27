'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Search, HelpCircle, ChevronDown, MessageCircle
} from 'lucide-react'

const faqCategories = [
  { id: 'all', label: '전체' },
  { id: 'general', label: '일반' },
  { id: 'simulation', label: '시뮬레이션' },
  { id: 'matching', label: '매칭' },
  { id: 'payment', label: '결제' },
  { id: 'account', label: '계정' },
]

const faqs = [
  {
    category: 'general',
    question: '메디플라톤은 어떤 서비스인가요?',
    answer: '메디플라톤은 의료 개원 생태계의 모든 이해관계자(의사, 약사, 영업사원, 건물주, 파트너사)를 연결하는 AI 기반 플랫폼입니다. 개원 시뮬레이션, 개원지 탐지, 약국 매칭 등 다양한 서비스를 제공합니다.'
  },
  {
    category: 'general',
    question: '무료로 사용할 수 있나요?',
    answer: '네, 기본적인 기능은 무료로 사용하실 수 있습니다. 첫 번째 개원 시뮬레이션은 무료이며, 더 상세한 분석과 리포트는 유료 서비스로 제공됩니다. 프로 구독을 통해 모든 기능을 무제한으로 이용하실 수 있습니다.'
  },
  {
    category: 'general',
    question: '어떤 역할로 가입해야 하나요?',
    answer: '회원가입 시 본인의 역할(의사, 약사, 영업사원, 건물주, 파트너사)을 선택하시면 됩니다. 역할에 따라 맞춤형 서비스와 대시보드가 제공됩니다. 나중에 설정에서 역할을 변경할 수도 있습니다.'
  },
  {
    category: 'simulation',
    question: '개원 시뮬레이션은 어떻게 작동하나요?',
    answer: 'OpenSim은 주소와 진료과목을 입력하면 AI가 심평원, 국토교통부, 소상공인진흥공단 등의 빅데이터를 분석하여 예상 매출, 비용, 손익분기점, 경쟁 현황 등을 약 3분 내에 제공합니다.'
  },
  {
    category: 'simulation',
    question: '시뮬레이션 결과의 정확도는 어느 정도인가요?',
    answer: '실제 개원 사례와 비교했을 때 평균 85% 이상의 예측 정확도를 보이고 있습니다. 다만 이는 참고용 분석 자료이며, 실제 개원 결정에는 추가적인 현장 조사와 전문가 상담을 권장합니다.'
  },
  {
    category: 'simulation',
    question: '상세 리포트 구매는 어떻게 하나요?',
    answer: '시뮬레이션 결과 화면에서 "리포트 구매" 버튼을 클릭하시면 됩니다. 결제 완료 후 PDF 형태의 상세 분석 리포트를 다운로드 받으실 수 있습니다. 리포트에는 경쟁 분석, 입지 분석, 재무 예측 등이 포함됩니다.'
  },
  {
    category: 'matching',
    question: 'PharmMatch 약국 매칭은 어떻게 진행되나요?',
    answer: '약국 매물 등록 시 정확한 주소는 비공개되고 구 단위 위치만 공개됩니다. 관심 있는 매물에 관심 표시를 하면, 양측 모두 관심 표시 시 연락처가 자동으로 공개되어 직접 협의를 진행할 수 있습니다.'
  },
  {
    category: 'matching',
    question: '약국 매칭 성사 시 수수료는 얼마인가요?',
    answer: '매칭이 성사되어 실제 계약이 이루어질 경우, 거래 금액의 3~5%가 수수료로 부과됩니다. 매칭만 되고 계약이 이루어지지 않은 경우에는 수수료가 없습니다.'
  },
  {
    category: 'matching',
    question: 'SalesScanner는 어떤 정보를 제공하나요?',
    answer: 'SalesScanner는 신축 건물, 폐업 병원, 공실 정보를 실시간으로 탐지하여 제공합니다. 각 위치의 병원 개원 적합도를 0~100점으로 평가하고, 추천 진료과목과 예상 임대료 정보도 함께 제공합니다.'
  },
  {
    category: 'payment',
    question: '어떤 결제 수단을 지원하나요?',
    answer: '신용카드, 체크카드, 계좌이체, 가상계좌를 지원합니다. 토스페이먼츠를 통해 안전하게 결제가 처리됩니다.'
  },
  {
    category: 'payment',
    question: '구독을 해지하면 언제까지 사용할 수 있나요?',
    answer: '구독 해지 요청 후에도 현재 결제 주기가 끝날 때까지 모든 서비스를 이용하실 수 있습니다. 예를 들어 월간 구독을 15일에 해지하면, 해당 월 말일까지 서비스를 이용할 수 있습니다.'
  },
  {
    category: 'payment',
    question: '환불 정책은 어떻게 되나요?',
    answer: '결제일로부터 7일 이내에 서비스를 이용하지 않은 경우 전액 환불이 가능합니다. 시뮬레이션 리포트 등 이미 제공된 서비스는 환불 대상에서 제외됩니다. 자세한 내용은 이용약관을 참고해주세요.'
  },
  {
    category: 'account',
    question: '비밀번호를 잊어버렸어요.',
    answer: '로그인 페이지에서 "비밀번호 찾기"를 클릭하시고 가입 시 사용한 이메일을 입력하시면, 비밀번호 재설정 링크가 포함된 이메일을 받으실 수 있습니다.'
  },
  {
    category: 'account',
    question: '회원 탈퇴는 어떻게 하나요?',
    answer: '마이페이지 > 설정 > 계정 관리에서 회원 탈퇴를 진행할 수 있습니다. 탈퇴 시 모든 데이터가 삭제되며, 진행 중인 구독이나 크레딧은 환불되지 않으니 주의해주세요.'
  },
  {
    category: 'account',
    question: '소셜 로그인 계정을 연동할 수 있나요?',
    answer: '네, Google, 네이버, 카카오 계정을 연동할 수 있습니다. 마이페이지 > 설정 > 소셜 계정 연동에서 설정하실 수 있습니다.'
  },
]

export default function FaqPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory
    const matchesSearch = !searchQuery ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
                  <HelpCircle className="w-4 h-4 text-background" />
                </div>
                <span className="text-lg font-semibold text-foreground">FAQ</span>
              </div>
            </div>
            <Link href="/contact" className="btn-ghost">
              <MessageCircle className="w-4 h-4" />
              문의하기
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            자주 묻는 질문
          </h1>
          <p className="text-muted-foreground">
            궁금한 점을 빠르게 찾아보세요
          </p>
        </div>

        {/* Search */}
        <div className="max-w-xl mx-auto relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="질문 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-12"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 hide-scrollbar">
          {faqCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`btn-sm whitespace-nowrap ${
                selectedCategory === category.id ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12 card">
              <HelpCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">검색 결과가 없습니다</p>
            </div>
          ) : (
            filteredFaqs.map((faq, idx) => (
              <div key={idx} className="card overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full p-5 flex items-start gap-4 text-left hover:bg-secondary/50 transition-colors"
                >
                  <span className="text-lg text-muted-foreground font-medium">Q</span>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{faq.question}</h3>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${
                    expandedFaq === idx ? 'rotate-180' : ''
                  }`} />
                </button>

                {expandedFaq === idx && (
                  <div className="px-5 pb-5 pt-0">
                    <div className="flex gap-4 pt-4 border-t border-border">
                      <span className="text-lg text-blue-500 font-medium">A</span>
                      <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 card p-8 text-center">
          <h3 className="text-xl font-semibold text-foreground mb-2">
            원하는 답변을 찾지 못하셨나요?
          </h3>
          <p className="text-muted-foreground mb-6">
            1:1 문의를 통해 전문 상담사에게 질문해주세요
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/contact" className="btn-primary">
              <MessageCircle className="w-4 h-4" />
              1:1 문의하기
            </Link>
            <Link href="/help" className="btn-secondary">
              도움말 센터
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
