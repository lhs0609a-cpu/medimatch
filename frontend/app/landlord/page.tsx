'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  Building2, Plus, Eye, MessageSquare, Clock, CheckCircle2,
  XCircle, AlertCircle, ChevronRight, BarChart3, Home
} from 'lucide-react'
import { landlordService } from '@/lib/api/services'

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  DRAFT: { label: '임시저장', color: 'bg-gray-100 text-gray-700', icon: Clock },
  PENDING_REVIEW: { label: '심사중', color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
  ACTIVE: { label: '공개중', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  RESERVED: { label: '예약중', color: 'bg-blue-100 text-blue-700', icon: Clock },
  CONTRACTED: { label: '계약완료', color: 'bg-purple-100 text-purple-700', icon: CheckCircle2 },
  CLOSED: { label: '마감', color: 'bg-gray-100 text-gray-700', icon: XCircle },
  REJECTED: { label: '반려', color: 'bg-red-100 text-red-700', icon: XCircle },
}

const verificationConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: '대기', color: 'bg-gray-100 text-gray-600' },
  UNDER_REVIEW: { label: '검토중', color: 'bg-amber-100 text-amber-700' },
  VERIFIED: { label: '인증완료', color: 'bg-green-100 text-green-700' },
  REJECTED: { label: '반려', color: 'bg-red-100 text-red-700' },
}

export default function LandlordDashboardPage() {
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data: listings, isLoading } = useQuery({
    queryKey: ['landlord-listings', statusFilter],
    queryFn: () => landlordService.getMyListings({ status: statusFilter || undefined }),
  })

  const { data: stats } = useQuery({
    queryKey: ['landlord-stats'],
    queryFn: () => landlordService.getStats(),
  })

  const formatCurrency = (value: number) => {
    if (value >= 10000) {
      return `${(value / 10000).toFixed(1)}억원`
    }
    return `${value.toLocaleString()}만원`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">건물주 센터</h1>
              <p className="text-sm text-gray-500">매물 등록 및 관리</p>
            </div>
          </div>
          <Link
            href="/landlord/register"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            새 매물 등록
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Home className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats?.total_listings || 0}</span>
            </div>
            <p className="text-gray-500">총 등록 매물</p>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats?.active_listings || 0}</span>
            </div>
            <p className="text-gray-500">공개중 매물</p>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats?.total_views || 0}</span>
            </div>
            <p className="text-gray-500">총 조회수</p>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats?.total_inquiries || 0}</span>
            </div>
            <p className="text-gray-500">총 문의수</p>
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === '' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            전체
          </button>
          {Object.entries(statusConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === key ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>

        {/* Listings */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500">매물을 불러오는 중...</p>
          </div>
        ) : listings?.items?.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">등록된 매물이 없습니다</h3>
            <p className="text-gray-500 mb-6">
              첫 번째 매물을 등록하고 의사/약사에게 노출해보세요.
            </p>
            <Link
              href="/landlord/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
            >
              <Plus className="w-5 h-5" />
              매물 등록하기
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {listings?.items?.map((listing: any) => {
              const status = statusConfig[listing.status] || statusConfig.DRAFT
              const StatusIcon = status.icon
              const verification = verificationConfig[listing.verification_status] || verificationConfig.PENDING

              return (
                <Link
                  key={listing.id}
                  href={`/landlord/listings/${listing.id}`}
                  className="block bg-white rounded-xl border hover:border-emerald-300 hover:shadow-md transition-all"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${status.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${verification.color}`}>
                            {verification.label}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{listing.title}</h3>
                        <p className="text-gray-500">{listing.address}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">면적</p>
                        <p className="font-medium">{listing.area_pyeong ? `${listing.area_pyeong}평` : '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">보증금</p>
                        <p className="font-medium">
                          {listing.rent_deposit ? formatCurrency(listing.rent_deposit) : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">월세</p>
                        <p className="font-medium">
                          {listing.rent_monthly ? formatCurrency(listing.rent_monthly) : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">조회/문의</p>
                        <p className="font-medium">
                          {listing.view_count || 0} / {listing.inquiry_count || 0}
                        </p>
                      </div>
                    </div>

                    {listing.rejection_reason && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        <strong>반려 사유:</strong> {listing.rejection_reason}
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
