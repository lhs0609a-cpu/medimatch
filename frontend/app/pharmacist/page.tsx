'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  Pill, Plus, Eye, Clock, CheckCircle2,
  XCircle, AlertCircle, ChevronRight, BarChart3, Home
} from 'lucide-react'
import { pharmacyTransferService } from '@/lib/api/services'
import { TossIcon } from '@/components/ui/TossIcon'

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDING_REVIEW: { label: '심사중', color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
  ACTIVE: { label: '공개중', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  CLOSED: { label: '마감', color: 'bg-gray-100 text-gray-700', icon: XCircle },
  REJECTED: { label: '반려', color: 'bg-red-100 text-red-700', icon: XCircle },
}

export default function PharmacistDashboardPage() {
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data: listings, isLoading } = useQuery({
    queryKey: ['pharmacist-listings'],
    queryFn: () => pharmacyTransferService.getMyListings(),
  })

  const filteredItems = (listings?.items || []).filter((item: any) =>
    !statusFilter || item.status === statusFilter
  )

  const stats = {
    total: listings?.items?.length || 0,
    active: listings?.items?.filter((i: any) => i.status === 'ACTIVE').length || 0,
    totalViews: listings?.items?.reduce((sum: number, i: any) => sum + (i.view_count || 0), 0) || 0,
  }

  const formatCurrency = (value: number) => {
    if (!value) return '-'
    if (value >= 100000000) return `${(value / 100000000).toFixed(1)}억원`
    if (value >= 10000) return `${Math.round(value / 10000).toLocaleString()}만원`
    return `${value.toLocaleString()}원`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TossIcon icon={Pill} color="from-teal-500 to-cyan-600" size="sm" shadow="shadow-teal-500/25" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">약사 센터</h1>
              <p className="text-sm text-gray-500">약국 양도 매물 관리</p>
            </div>
          </div>
          <Link
            href="/pharmacist/register"
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            약국 등록
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border">
            <div className="flex items-center justify-between mb-4">
              <TossIcon icon={Home} color="from-blue-500 to-cyan-500" size="md" shadow="shadow-blue-500/25" />
              <span className="text-2xl font-bold text-gray-900">{stats.total}</span>
            </div>
            <p className="text-gray-500">총 등록 매물</p>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <div className="flex items-center justify-between mb-4">
              <TossIcon icon={CheckCircle2} color="from-green-500 to-emerald-500" size="md" shadow="shadow-green-500/25" />
              <span className="text-2xl font-bold text-gray-900">{stats.active}</span>
            </div>
            <p className="text-gray-500">공개중 매물</p>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <div className="flex items-center justify-between mb-4">
              <TossIcon icon={Eye} color="from-sky-500 to-blue-500" size="md" shadow="shadow-sky-500/25" />
              <span className="text-2xl font-bold text-gray-900">{stats.totalViews}</span>
            </div>
            <p className="text-gray-500">총 조회수</p>
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === '' ? 'bg-teal-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            전체
          </button>
          {Object.entries(statusConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === key ? 'bg-teal-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>

        {/* Listings */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500">매물을 불러오는 중...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">등록된 약국 매물이 없습니다</h3>
            <p className="text-gray-500 mb-6">
              양도할 약국을 등록하고 매수자를 찾아보세요.
            </p>
            <Link
              href="/pharmacist/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700"
            >
              <Plus className="w-5 h-5" />
              약국 등록하기
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((listing: any) => {
              const status = statusConfig[listing.status] || statusConfig.PENDING_REVIEW
              const StatusIcon = status.icon

              return (
                <div
                  key={listing.id}
                  className="block bg-white rounded-xl border hover:border-teal-300 hover:shadow-md transition-all"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${status.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{listing.pharmacy_name}</h3>
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
                        <p className="text-gray-500">월매출</p>
                        <p className="font-medium">{formatCurrency(listing.monthly_revenue)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">권리금</p>
                        <p className="font-medium">{formatCurrency(listing.premium)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">조회수</p>
                        <p className="font-medium">{listing.view_count || 0}</p>
                      </div>
                    </div>

                    {listing.status === 'ACTIVE' && (
                      <div className="mt-4 flex items-center gap-2">
                        <Link
                          href="/buildings"
                          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          공개 페이지에서 보기
                        </Link>
                      </div>
                    )}

                    {listing.rejection_reason && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        <strong>반려 사유:</strong> {listing.rejection_reason}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
