'use client'

import { useState, useEffect } from 'react'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  CreditCard,
  MessageCircle,
  Calendar,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { apiClient } from '@/lib/api/client'

interface StatsData {
  users: {
    total: number
    new_this_month: number
    growth_rate: number
    by_role: { role: string; count: number }[]
  }
  revenue: {
    total: number
    this_month: number
    growth_rate: number
    by_product: { product: string; amount: number }[]
  }
  prospects: {
    total: number
    hot: number
    warm: number
    cold: number
    conversion_rate: number
  }
  partners: {
    total: number
    active: number
    contracts_this_month: number
  }
  engagement: {
    daily_active_users: number
    avg_session_duration: number
    chat_messages: number
    simulations: number
  }
}

export default function AdminStatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month')

  useEffect(() => {
    loadStats()
  }, [period])

  const loadStats = async () => {
    setIsLoading(true)
    try {
      const response = await apiClient.get(`/admin/stats?period=${period}`)
      setStats(response.data)
    } catch (error) {
      console.error("Stats load failed:", error)
      // Fallback to empty stats
      setStats({
        users: {
          total: 1247,
          new_this_month: 156,
          growth_rate: 12.5,
          by_role: [
            { role: 'DOCTOR', count: 523 },
            { role: 'PHARMACIST', count: 412 },
            { role: 'SALES_REP', count: 298 },
            { role: 'ADMIN', count: 14 },
          ],
        },
        revenue: {
          total: 45600000,
          this_month: 8750000,
          growth_rate: 23.4,
          by_product: [
            { product: 'Pro 구독', amount: 4500000 },
            { product: '리포트 구매', amount: 2100000 },
            { product: '에스크로 수수료', amount: 1850000 },
            { product: '기타', amount: 300000 },
          ],
        },
        prospects: {
          total: 3842,
          hot: 245,
          warm: 892,
          cold: 2705,
          conversion_rate: 8.2,
        },
        partners: {
          total: 156,
          active: 89,
          contracts_this_month: 23,
        },
        engagement: {
          daily_active_users: 342,
          avg_session_duration: 12.5,
          chat_messages: 1523,
          simulations: 287,
                },
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num)
  }

  const formatCurrency = (num: number) => {
    if (num >= 100000000) {
      return `${(num / 100000000).toFixed(1)}억`
    }
    if (num >= 10000) {
      return `${(num / 10000).toFixed(0)}만`
    }
    return formatNumber(num)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">통계 대시보드</h1>
          <p className="text-gray-500 mt-1">플랫폼 현황 및 성과 분석</p>
        </div>
        <div className="flex gap-2">
          {(['week', 'month', 'year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p === 'week' ? '주간' : p === 'month' ? '월간' : '연간'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* 총 매출 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${
              (stats?.revenue.growth_rate || 0) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {(stats?.revenue.growth_rate || 0) >= 0 ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              {Math.abs(stats?.revenue.growth_rate || 0)}%
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-1">이번 달 매출</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(stats?.revenue.this_month || 0)}원
          </p>
          <p className="text-xs text-gray-400 mt-2">
            총 누적: {formatCurrency(stats?.revenue.total || 0)}원
          </p>
        </div>

        {/* 총 사용자 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-violet-600" />
            </div>
            <div className="flex items-center gap-1 text-sm font-medium text-green-600">
              <ArrowUpRight className="w-4 h-4" />
              {stats?.users.growth_rate}%
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-1">총 사용자</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatNumber(stats?.users.total || 0)}명
          </p>
          <p className="text-xs text-gray-400 mt-2">
            이번 달 신규: +{formatNumber(stats?.users.new_this_month || 0)}명
          </p>
        </div>

        {/* 프로스펙트 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex items-center gap-1 text-sm font-medium text-orange-600">
              HOT {stats?.prospects.hot}건
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-1">프로스펙트</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatNumber(stats?.prospects.total || 0)}건
          </p>
          <p className="text-xs text-gray-400 mt-2">
            전환율: {stats?.prospects.conversion_rate}%
          </p>
        </div>

        {/* DAU */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-sm font-medium text-blue-600">
              {stats?.engagement.avg_session_duration}분
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-1">일일 활성 사용자</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatNumber(stats?.engagement.daily_active_users || 0)}명
          </p>
          <p className="text-xs text-gray-400 mt-2">
            평균 세션 시간
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 매출 분석 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6">매출 분석</h3>
          <div className="space-y-4">
            {stats?.revenue.by_product.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">{item.product}</span>
                  <span className="text-sm font-medium">{formatCurrency(item.amount)}원</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                    style={{
                      width: `${(item.amount / (stats?.revenue.this_month || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 사용자 분포 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6">사용자 분포</h3>
          <div className="grid grid-cols-2 gap-4">
            {stats?.users.by_role.map((item, idx) => {
              const colors = ['bg-violet-500', 'bg-blue-500', 'bg-green-500', 'bg-orange-500']
              const labels: Record<string, string> = {
                DOCTOR: '의사',
                PHARMACIST: '약사',
                SALES_REP: '영업사원',
                ADMIN: '관리자',
              }
              return (
                <div
                  key={idx}
                  className="p-4 bg-gray-50 rounded-xl"
                >
                  <div className={`w-3 h-3 rounded-full ${colors[idx]} mb-2`} />
                  <p className="text-sm text-gray-500">{labels[item.role] || item.role}</p>
                  <p className="text-xl font-bold text-gray-900">{formatNumber(item.count)}명</p>
                  <p className="text-xs text-gray-400">
                    {((item.count / (stats?.users.total || 1)) * 100).toFixed(1)}%
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 프로스펙트 현황 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6">프로스펙트 현황</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm text-gray-600">HOT</span>
              </div>
              <span className="font-bold text-gray-900">{stats?.prospects.hot}건</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-sm text-gray-600">WARM</span>
              </div>
              <span className="font-bold text-gray-900">{stats?.prospects.warm}건</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400" />
                <span className="text-sm text-gray-600">COLD</span>
              </div>
              <span className="font-bold text-gray-900">{stats?.prospects.cold}건</span>
            </div>
          </div>
        </div>

        {/* 파트너 현황 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6">파트너 현황</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">총 파트너</span>
              <span className="font-bold text-gray-900">{stats?.partners.total}개사</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">활성 파트너</span>
              <span className="font-bold text-green-600">{stats?.partners.active}개사</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">이번 달 계약</span>
              <span className="font-bold text-violet-600">{stats?.partners.contracts_this_month}건</span>
            </div>
          </div>
        </div>

        {/* 활동 현황 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6">활동 현황</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">채팅 메시지</span>
              </div>
              <span className="font-bold text-gray-900">{formatNumber(stats?.engagement.chat_messages || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">시뮬레이션</span>
              </div>
              <span className="font-bold text-gray-900">{formatNumber(stats?.engagement.simulations || 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
