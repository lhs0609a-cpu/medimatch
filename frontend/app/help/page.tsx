'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Search, HelpCircle, BookOpen, MessageCircle,
  BarChart3, MapPin, Pill, Building2, Users, CreditCard,
  ChevronRight, ChevronDown, Mail, Phone
} from 'lucide-react'

const helpCategories = [
  {
    id: 'getting-started',
    title: '시작하기',
    icon: BookOpen,
    description: '메디플라톤을 처음 사용하시나요?',
    articles: [
      { title: '회원가입 방법', href: '#signup' },
      { title: '역할 선택하기', href: '#roles' },
      { title: '대시보드 사용법', href: '#dashboard' },
    ]
  },
  {
    id: 'opensim',
    title: 'OpenSim - 개원 시뮬레이션',
    icon: BarChart3,
    description: 'AI 기반 개원 분석 서비스',
    articles: [
      { title: '시뮬레이션 실행 방법', href: '#simulation-run' },
      { title: '결과 해석하기', href: '#simulation-result' },
      { title: '리포트 다운로드', href: '#simulation-report' },
    ]
  },
  {
    id: 'salesscanner',
    title: 'SalesScanner - 개원지 탐지',
    icon: MapPin,
    description: '실시간 개원 예정지 탐색',
    articles: [
      { title: '프로스펙트 검색', href: '#prospect-search' },
      { title: '알림 설정', href: '#prospect-alert' },
      { title: '데이터 내보내기', href: '#prospect-export' },
    ]
  },
  {
    id: 'pharmmatch',
    title: 'PharmMatch - 약국 매칭',
    icon: Pill,
    description: '익명 약국 매물 매칭',
    articles: [
      { title: '매물 등록하기', href: '#pharm-listing' },
      { title: '관심 표시하기', href: '#pharm-interest' },
      { title: '매칭 진행 절차', href: '#pharm-process' },
    ]
  },
  {
    id: 'landlord',
    title: '건물주 서비스',
    icon: Building2,
    description: '매물 등록 및 관리',
    articles: [
      { title: '매물 등록 방법', href: '#landlord-register' },
      { title: '문의 관리', href: '#landlord-inquiry' },
      { title: '계약 진행', href: '#landlord-contract' },
    ]
  },
  {
    id: 'partners',
    title: '파트너 서비스',
    icon: Users,
    description: '파트너 등록 및 연결',
    articles: [
      { title: '파트너 등록', href: '#partner-register' },
      { title: '서비스 노출', href: '#partner-exposure' },
      { title: '고객 문의 관리', href: '#partner-inquiry' },
    ]
  },
  {
    id: 'payment',
    title: '결제 및 구독',
    icon: CreditCard,
    description: '결제, 크레딧, 구독 관리',
    articles: [
      { title: '구독 플랜 안내', href: '#payment-plans' },
      { title: '크레딧 충전', href: '#payment-credit' },
      { title: '환불 정책', href: '#payment-refund' },
    ]
  },
]

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategory, setExpandedCategory] = useState<string | null>('getting-started')

  const filteredCategories = helpCategories.filter(category => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      category.title.toLowerCase().includes(query) ||
      category.description.toLowerCase().includes(query) ||
      category.articles.some(article => article.title.toLowerCase().includes(query))
    )
  })

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
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
                  <HelpCircle className="w-4 h-4 text-background" />
                </div>
                <span className="text-lg font-semibold text-foreground">도움말</span>
              </div>
            </div>
            <Link href="/contact" className="btn-primary">
              <MessageCircle className="w-4 h-4" />
              문의하기
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            무엇을 도와드릴까요?
          </h1>
          <p className="text-muted-foreground mb-8">
            메디플라톤 사용법과 자주 묻는 질문을 확인하세요
          </p>

          {/* Search */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="검색어를 입력하세요..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-12 h-14 text-lg"
            />
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <Link href="/faq" className="card card-interactive p-6">
            <HelpCircle className="w-8 h-8 text-blue-500 mb-3" />
            <h3 className="font-semibold text-foreground mb-1">자주 묻는 질문</h3>
            <p className="text-sm text-muted-foreground">FAQ에서 빠르게 답변을 찾아보세요</p>
          </Link>
          <Link href="/contact" className="card card-interactive p-6">
            <Mail className="w-8 h-8 text-green-500 mb-3" />
            <h3 className="font-semibold text-foreground mb-1">1:1 문의</h3>
            <p className="text-sm text-muted-foreground">전문 상담사에게 문의하세요</p>
          </Link>
          <a href="tel:1588-0000" className="card card-interactive p-6">
            <Phone className="w-8 h-8 text-purple-500 mb-3" />
            <h3 className="font-semibold text-foreground mb-1">전화 상담</h3>
            <p className="text-sm text-muted-foreground">1588-0000 (평일 9-18시)</p>
          </a>
        </div>

        {/* Help Categories */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground mb-6">카테고리별 도움말</h2>

          {filteredCategories.length === 0 ? (
            <div className="text-center py-12 card">
              <HelpCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">검색 결과가 없습니다</p>
            </div>
          ) : (
            filteredCategories.map((category) => {
              const Icon = category.icon
              const isExpanded = expandedCategory === category.id

              return (
                <div key={category.id} className="card overflow-hidden">
                  <button
                    onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                    className="w-full p-6 flex items-center gap-4 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-foreground" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-foreground">{category.title}</h3>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border bg-secondary/30">
                      {category.articles.map((article, idx) => (
                        <a
                          key={idx}
                          href={article.href}
                          className="flex items-center gap-3 px-6 py-4 hover:bg-secondary/50 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          <span className="text-foreground">{article.title}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 card p-8 bg-foreground text-background text-center">
          <h3 className="text-xl font-semibold mb-2">원하는 답변을 찾지 못하셨나요?</h3>
          <p className="text-background/70 mb-6">전문 상담사가 친절하게 도와드립니다</p>
          <div className="flex gap-4 justify-center">
            <Link href="/contact" className="btn-secondary bg-background text-foreground hover:bg-background/90">
              <MessageCircle className="w-4 h-4" />
              문의하기
            </Link>
            <a href="tel:1588-0000" className="btn-outline border-background text-background hover:bg-background/10">
              <Phone className="w-4 h-4" />
              전화상담
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
