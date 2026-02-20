'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Building2, Users, Eye, MessageSquare,
  TrendingUp, Bell, Crown, ChevronRight, Plus,
  Download, Filter, Calendar, Star, Zap, Target,
  Phone, Mail, MapPin, Clock, CheckCircle, AlertCircle, BarChart3
} from 'lucide-react'
import { TossIcon } from '@/components/ui/TossIcon'

// 목업 데이터
const mockSubscription = {
  plan: 'pro',
  planName: '프로',
  price: 299000,
  nextBillingDate: '2024-02-25',
  matchingRemaining: 3,
  matchingTotal: 5,
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

// 매칭 요청 만료 기한: 7일
const MATCHING_EXPIRY_DAYS = 7

const mockMatches = [
  {
    id: '1',
    type: 'doctor',
    name: '김OO',
    specialty: '내과',
    region: '서울 강남구',
    phone: '010-****-5678',
    status: 'accepted',  // 매칭 수락됨 - 연락처 공개
    matchedAt: '2024-01-24',
    expiresAt: null,  // 수락된 매칭은 만료 없음
    creditRestored: false,
  },
  {
    id: '2',
    type: 'pharmacist',
    name: '이OO',
    specialty: '일반약국',
    region: '경기 성남시',
    phone: null,  // 대기 중 - 연락처 비공개
    status: 'pending',
    matchedAt: '2024-01-22',
    expiresAt: '2024-01-29',  // 7일 후 만료
    creditRestored: false,
  },
  {
    id: '3',
    type: 'doctor',
    name: '박OO',
    specialty: '정형외과',
    region: '서울 송파구',
    phone: '010-****-9012',
    status: 'accepted',
    matchedAt: '2024-01-20',
    expiresAt: null,
    creditRestored: false,
  },
  {
    id: '4',
    type: 'doctor',
    name: '최OO',
    specialty: '피부과',
    region: '서울 서초구',
    phone: null,
    status: 'expired',  // 만료됨
    matchedAt: '2024-01-10',
    expiresAt: '2024-01-17',
    creditRestored: true,  // 크레딧 복원됨
  },
]

// 남은 만료 시간 계산
function getRemainingDays(expiresAt: string | null): number | null {
  if (!expiresAt) return null
  const now = new Date()
  const expiry = new Date(expiresAt)
  const diff = expiry.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

const mockActivities = [
  { type: 'view', message: '강남역 메디컬빌딩 2층 매물을 내과 개원 준비 의사가 조회했습니다', time: '10분 전' },
  { type: 'inquiry', message: '분당 정자동 상가에 문의가 접수되었습니다', time: '1시간 전' },
  { type: 'interest', message: '강남역 매물에 약사가 관심을 표시했습니다', time: '3시간 전' },
  { type: 'lead', message: '새로운 리드가 추가되었습니다: 김OO 내과', time: '어제' },
]

const matchStatusLabels = {
  pending: { label: '수락 대기', style: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  accepted: { label: '매칭 완료', style: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  rejected: { label: '거절됨', style: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  expired: { label: '만료', style: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
}

export default function LandlordDashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'matches' | 'ads'>('overview')

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
                <span className="text-xl">🏢</span>
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
              <TossIcon icon={Crown} color="from-amber-500 to-orange-500" size="md" shadow="shadow-amber-500/25" />
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
                  {mockSubscription.matchingRemaining}/{mockSubscription.matchingTotal}
                </p>
                <p className="text-xs text-muted-foreground">매칭 요청권</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'overview', label: '개요', icon: TrendingUp },
            { id: 'listings', label: '내 매물', icon: Building2 },
            { id: 'matches', label: '매칭 관리', icon: Users },
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
                  <TossIcon icon={Eye} color="from-sky-500 to-blue-500" size="sm" shadow="shadow-sky-500/25" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">390</p>
                    <p className="text-xs text-muted-foreground">이번 주 조회수</p>
                  </div>
                </div>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-3">
                  <TossIcon icon={MessageSquare} color="from-green-500 to-emerald-500" size="sm" shadow="shadow-green-500/25" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">20</p>
                    <p className="text-xs text-muted-foreground">이번 주 문의</p>
                  </div>
                </div>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-3">
                  <TossIcon icon={Users} color="from-purple-500 to-pink-500" size="sm" shadow="shadow-purple-500/25" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">3</p>
                    <p className="text-xs text-muted-foreground">보유 리드</p>
                  </div>
                </div>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-3">
                  <TossIcon icon={Target} color="from-orange-500 to-red-500" size="sm" shadow="shadow-orange-500/25" />
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
              <Link href="/landlord/pricing" className="card p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <TossIcon icon={Users} color="from-purple-500 to-pink-500" size="sm" shadow="shadow-purple-500/25" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">매칭 요청권 구매</p>
                    <p className="text-xs text-muted-foreground">관심 회원에게 매칭 요청</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Link>
              <Link href="/landlord/boost" className="card p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <TossIcon icon={Zap} color="from-amber-500 to-orange-500" size="sm" shadow="shadow-amber-500/25" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">매물 부스팅</p>
                    <p className="text-xs text-muted-foreground">상위 노출 광고</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Link>
              <Link href="/landlord/analytics" className="card p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <TossIcon icon={BarChart3} color="from-cyan-500 to-blue-500" size="sm" shadow="shadow-cyan-500/25" />
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

        {/* Matches Tab */}
        {activeTab === 'matches' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                매칭 {mockMatches.length}건 · 이번 달 남은 요청권 {mockSubscription.matchingRemaining}회
              </p>
              <Link href="/landlord/pricing" className="btn-primary text-sm">
                요청권 구매
              </Link>
            </div>

            {/* 매칭 정책 안내 */}
            <div className="card p-4 mb-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">양방향 동의 매칭 정책</h4>
              <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                <li>• 내 매물에 관심 표시한 회원에게 매칭 요청을 보내면, <strong>상대방이 수락해야만</strong> 연락처가 공개됩니다.</li>
                <li>• 매칭 요청은 <strong>{MATCHING_EXPIRY_DAYS}일 후 자동 만료</strong>됩니다.</li>
                <li>• 만료 시 <strong>매칭 요청권이 자동 복원</strong>됩니다.</li>
              </ul>
            </div>

            {/* 크레딧 복원 알림 */}
            {mockMatches.some(m => m.creditRestored) && (
              <div className="card p-4 mb-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-300">요청권이 복원되었습니다</p>
                    <p className="text-sm text-green-700 dark:text-green-400">
                      응답 없이 만료된 매칭 요청 {mockMatches.filter(m => m.creditRestored).length}건의 요청권이 자동으로 복원되었습니다.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {mockMatches.map((match) => {
              const remainingDays = getRemainingDays(match.expiresAt)
              const isExpiringSoon = remainingDays !== null && remainingDays <= 2

              return (
                <div key={match.id} className={`card p-5 ${match.status === 'expired' ? 'opacity-60' : ''}`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        match.status === 'expired'
                          ? 'bg-gray-100 dark:bg-gray-900/30'
                          : match.type === 'doctor'
                            ? 'bg-blue-100 dark:bg-blue-900/30'
                            : 'bg-purple-100 dark:bg-purple-900/30'
                      }`}>
                        <Users className={`w-6 h-6 ${
                          match.status === 'expired'
                            ? 'text-gray-500'
                            : match.type === 'doctor' ? 'text-blue-600' : 'text-purple-600'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-foreground">{match.name}</h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${matchStatusLabels[match.status as keyof typeof matchStatusLabels].style}`}>
                            {matchStatusLabels[match.status as keyof typeof matchStatusLabels].label}
                          </span>
                          {match.creditRestored && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                              요청권 복원됨
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {match.type === 'doctor' ? '의사' : '약사'} · {match.specialty} · {match.region}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs text-muted-foreground">
                            매칭 요청일: {match.matchedAt}
                          </p>
                          {match.status === 'pending' && remainingDays !== null && (
                            <p className={`text-xs flex items-center gap-1 ${
                              isExpiringSoon ? 'text-red-600 font-medium' : 'text-muted-foreground'
                            }`}>
                              <Clock className="w-3 h-3" />
                              {remainingDays === 0 ? '오늘 만료' : `${remainingDays}일 후 만료`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {match.status === 'accepted' && match.phone ? (
                        <a
                          href={`tel:${match.phone}`}
                          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                        >
                          <Phone className="w-4 h-4" />
                          연락하기
                        </a>
                      ) : match.status === 'pending' ? (
                        <div className="flex items-center gap-2">
                          <span className="px-4 py-2 bg-secondary text-muted-foreground rounded-lg text-sm flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            수락 대기 중
                          </span>
                          {isExpiringSoon && (
                            <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-full">
                              만료 임박
                            </span>
                          )}
                        </div>
                      ) : match.status === 'expired' ? (
                        <span className="px-4 py-2 bg-secondary text-muted-foreground rounded-lg text-sm">
                          만료됨
                        </span>
                      ) : (
                        <span className="px-4 py-2 bg-secondary text-muted-foreground rounded-lg text-sm">
                          거절됨
                        </span>
                      )}
                      <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80">
                        메모
                      </button>
                    </div>
                  </div>

                  {/* 만료 경고 배너 */}
                  {match.status === 'pending' && isExpiringSoon && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-700 dark:text-red-400">
                        <AlertCircle className="w-4 h-4 inline mr-1" />
                        이 매칭 요청은 <strong>{remainingDays === 0 ? '오늘' : `${remainingDays}일 후`}</strong> 만료됩니다.
                        만료 시 요청권이 자동 복원됩니다.
                      </p>
                    </div>
                  )}
                </div>
              )
            })}

            {/* 만료 정책 안내 */}
            <div className="card p-4 bg-secondary/50">
              <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-primary" />
                매칭 요청권 복원 정책
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 매칭 요청 후 {MATCHING_EXPIRY_DAYS}일간 응답이 없으면 자동으로 만료됩니다.</li>
                <li>• 만료된 매칭 요청의 요청권은 <strong>자동으로 복원</strong>됩니다.</li>
                <li>• 상대방이 거절한 경우에는 요청권이 복원되지 않습니다.</li>
                <li>• 복원된 요청권은 마이페이지에서 확인 가능합니다.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Ads Tab */}
        {activeTab === 'ads' && (
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="font-semibold text-foreground mb-4">현재 진행 중인 광고</h3>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TossIcon icon={TrendingUp} color="from-cyan-500 to-blue-500" size="sm" shadow="shadow-cyan-500/25" />
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
                      <TossIcon icon={ad.icon} color={
                        ad.icon === TrendingUp ? 'from-cyan-500 to-blue-500' :
                        ad.icon === Star ? 'from-amber-500 to-orange-500' :
                        ad.icon === Bell ? 'from-amber-500 to-orange-500' :
                        'from-indigo-500 to-purple-500'
                      } size="sm" shadow={
                        ad.icon === TrendingUp ? 'shadow-cyan-500/25' :
                        ad.icon === Star ? 'shadow-amber-500/25' :
                        ad.icon === Bell ? 'shadow-amber-500/25' :
                        'shadow-indigo-500/25'
                      } />
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
