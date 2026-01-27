'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Building2, Users, Eye, MessageSquare,
  TrendingUp, Bell, Crown, ChevronRight, Plus,
  Download, Filter, Calendar, Star, Zap, Target,
  Phone, Mail, MapPin, Clock, CheckCircle, AlertCircle
} from 'lucide-react'

// 목업 데이터
const mockSubscription = {
  plan: 'pro',
  planName: '프로',
  price: 299000,
  nextBillingDate: '2024-02-25',
  leadsRemaining: 3,
  leadsTotal: 5,
  listingsUsed: 2,
  listingsTotal: 3,
}

const mockListings = [
  {
    id: '1',
    title: '강남역 메디컬빌딩 2층',
    address: '서울 강남구 역삼동',
    monthlyRent: 450,
    deposit: 15000,
    status: 'active',
    views: 234,
    inquiries: 12,
    isBoosted: true,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    title: '분당 정자동 상가 1층',
    address: '경기 성남시 분당구',
    monthlyRent: 380,
    deposit: 12000,
    status: 'active',
    views: 156,
    inquiries: 8,
    isBoosted: false,
    createdAt: '2024-01-20',
  },
]

const mockLeads = [
  {
    id: '1',
    type: 'doctor',
    name: '김OO',
    specialty: '내과',
    region: '서울 강남구',
    phone: '010-****-5678',
    status: 'new',
    purchasedAt: '2024-01-24',
  },
  {
    id: '2',
    type: 'pharmacist',
    name: '이OO',
    specialty: '일반약국',
    region: '경기 성남시',
    phone: '010-****-1234',
    status: 'contacted',
    purchasedAt: '2024-01-22',
  },
  {
    id: '3',
    type: 'doctor',
    name: '박OO',
    specialty: '정형외과',
    region: '서울 송파구',
    phone: '010-****-9012',
    status: 'interested',
    purchasedAt: '2024-01-20',
  },
]

const mockActivities = [
  { type: 'view', message: '강남역 메디컬빌딩 2층 매물을 내과 개원 준비 의사가 조회했습니다', time: '10분 전' },
  { type: 'inquiry', message: '분당 정자동 상가에 문의가 접수되었습니다', time: '1시간 전' },
  { type: 'interest', message: '강남역 매물에 약사가 관심을 표시했습니다', time: '3시간 전' },
  { type: 'lead', message: '새로운 리드가 추가되었습니다: 김OO 내과', time: '어제' },
]

const leadStatusLabels = {
  new: { label: '신규', style: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  contacted: { label: '연락완료', style: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  interested: { label: '관심', style: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  rejected: { label: '불발', style: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

export default function LandlordDashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'leads' | 'ads'>('overview')

  const formatPrice = (price: number) => {
    if (price >= 10000) {
      return `${(price / 10000).toFixed(1)}억`
    }
    return `${price.toLocaleString()}만`
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
                <span className="text-lg font-bold text-foreground">건물주 대시보드</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/landlord/pricing" className="btn-outline text-sm">
                플랜 업그레이드
              </Link>
              <Link href="/landlord/register" className="btn-primary text-sm flex items-center gap-1">
                <Plus className="w-4 h-4" />
                매물 등록
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Subscription Status */}
        <div className="card p-6 mb-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/50 rounded-xl flex items-center justify-center">
                <Crown className="w-7 h-7 text-amber-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">{mockSubscription.planName} 플랜</h2>
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">
                    활성
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  다음 결제일: {mockSubscription.nextBillingDate} · 월 {mockSubscription.price.toLocaleString()}원
                </p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {mockSubscription.listingsUsed}/{mockSubscription.listingsTotal}
                </p>
                <p className="text-xs text-muted-foreground">등록 매물</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {mockSubscription.leadsRemaining}/{mockSubscription.leadsTotal}
                </p>
                <p className="text-xs text-muted-foreground">이번 달 리드</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'overview', label: '개요', icon: TrendingUp },
            { id: 'listings', label: '내 매물', icon: Building2 },
            { id: 'leads', label: '리드 관리', icon: Users },
            { id: 'ads', label: '광고/부스팅', icon: Zap },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Eye className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">390</p>
                    <p className="text-xs text-muted-foreground">이번 주 조회수</p>
                  </div>
                </div>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">20</p>
                    <p className="text-xs text-muted-foreground">이번 주 문의</p>
                  </div>
                </div>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">3</p>
                    <p className="text-xs text-muted-foreground">보유 리드</p>
                  </div>
                </div>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">2</p>
                    <p className="text-xs text-muted-foreground">관심 표시</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">최근 활동</h3>
                <button className="text-sm text-primary hover:underline">전체 보기</button>
              </div>
              <div className="space-y-3">
                {mockActivities.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      activity.type === 'view' ? 'bg-blue-100 dark:bg-blue-900/30' :
                      activity.type === 'inquiry' ? 'bg-green-100 dark:bg-green-900/30' :
                      activity.type === 'interest' ? 'bg-purple-100 dark:bg-purple-900/30' :
                      'bg-amber-100 dark:bg-amber-900/30'
                    }`}>
                      {activity.type === 'view' && <Eye className="w-4 h-4 text-blue-600" />}
                      {activity.type === 'inquiry' && <MessageSquare className="w-4 h-4 text-green-600" />}
                      {activity.type === 'interest' && <Star className="w-4 h-4 text-purple-600" />}
                      {activity.type === 'lead' && <Users className="w-4 h-4 text-amber-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-4">
              <Link href="/landlord/leads/purchase" className="card p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">리드 구매하기</p>
                    <p className="text-xs text-muted-foreground">의사/약사 연락처 획득</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Link>
              <Link href="/landlord/boost" className="card p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">매물 부스팅</p>
                    <p className="text-xs text-muted-foreground">상위 노출 광고</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Link>
              <Link href="/landlord/analytics" className="card p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">상세 분석</p>
                    <p className="text-xs text-muted-foreground">통계 및 리포트</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Listings Tab */}
        {activeTab === 'listings' && (
          <div className="space-y-4">
            {mockListings.map((listing) => (
              <div key={listing.id} className="card p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-foreground">{listing.title}</h3>
                      {listing.isBoosted && (
                        <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded-full flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          부스팅 중
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {listing.address}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="text-foreground">
                        보증금 {formatPrice(listing.deposit)} / 월세 {formatPrice(listing.monthlyRent)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-xl font-bold text-foreground">{listing.views}</p>
                      <p className="text-xs text-muted-foreground">조회</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-foreground">{listing.inquiries}</p>
                      <p className="text-xs text-muted-foreground">문의</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 bg-secondary text-secondary-foreground text-sm rounded-lg hover:bg-secondary/80">
                        수정
                      </button>
                      <button className="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50">
                        부스팅
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {mockSubscription.listingsUsed < mockSubscription.listingsTotal && (
              <Link
                href="/landlord/register"
                className="card p-5 border-2 border-dashed hover:border-primary transition-colors flex items-center justify-center gap-2 text-muted-foreground hover:text-primary"
              >
                <Plus className="w-5 h-5" />
                <span>새 매물 등록하기</span>
              </Link>
            )}
          </div>
        )}

        {/* Leads Tab */}
        {activeTab === 'leads' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                보유 리드 {mockLeads.length}건 · 이번 달 남은 무료 리드 {mockSubscription.leadsRemaining}건
              </p>
              <Link href="/landlord/leads/purchase" className="btn-primary text-sm">
                리드 구매
              </Link>
            </div>

            {mockLeads.map((lead) => (
              <div key={lead.id} className="card p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      lead.type === 'doctor'
                        ? 'bg-blue-100 dark:bg-blue-900/30'
                        : 'bg-purple-100 dark:bg-purple-900/30'
                    }`}>
                      <Users className={`w-6 h-6 ${
                        lead.type === 'doctor' ? 'text-blue-600' : 'text-purple-600'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{lead.name}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${leadStatusLabels[lead.status as keyof typeof leadStatusLabels].style}`}>
                          {leadStatusLabels[lead.status as keyof typeof leadStatusLabels].label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {lead.type === 'doctor' ? '의사' : '약사'} · {lead.specialty} · {lead.region}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        구매일: {lead.purchasedAt}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href={`tel:${lead.phone}`}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                    >
                      <Phone className="w-4 h-4" />
                      연락하기
                    </a>
                    <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80">
                      메모
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Ads Tab */}
        {activeTab === 'ads' && (
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="font-semibold text-foreground mb-4">현재 진행 중인 광고</h3>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">강남역 메디컬빌딩 2층 - 검색 상위 노출</p>
                    <p className="text-sm text-muted-foreground">2024.01.20 ~ 2024.01.27 (3일 남음)</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm rounded-full">
                  진행 중
                </span>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-foreground mb-4">광고 상품 구매</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { name: '검색 상위 노출', price: 300000, duration: '1주', icon: TrendingUp },
                  { name: '추천 매물 배지', price: 200000, duration: '1주', icon: Star },
                  { name: '타겟 푸시 알림', price: 100000, duration: '1회', icon: Bell },
                  { name: '이메일 마케팅', price: 200000, duration: '1회', icon: Mail },
                ].map((ad) => (
                  <div key={ad.name} className="border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <ad.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{ad.name}</p>
                        <p className="text-xs text-muted-foreground">{ad.duration}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-foreground">{ad.price.toLocaleString()}원</span>
                      <button className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90">
                        구매
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
