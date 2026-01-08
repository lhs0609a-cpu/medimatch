'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  Briefcase, Users, CheckCircle2, XCircle, Clock, DollarSign,
  Star, TrendingUp, ChevronRight, Plus, AlertCircle
} from 'lucide-react'
import { salesMatchService } from '@/lib/api/services'

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDING_PAYMENT: { label: '결제 대기', color: 'bg-gray-100 text-gray-700', icon: Clock },
  PENDING: { label: '응답 대기', color: 'bg-amber-100 text-amber-700', icon: Clock },
  ACCEPTED: { label: '수락됨', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  REJECTED: { label: '거절됨', color: 'bg-red-100 text-red-700', icon: XCircle },
  EXPIRED: { label: '만료됨', color: 'bg-gray-100 text-gray-700', icon: Clock },
  REFUNDED: { label: '환불됨', color: 'bg-blue-100 text-blue-700', icon: DollarSign },
  CONTACT_MADE: { label: '컨택 완료', color: 'bg-purple-100 text-purple-700', icon: CheckCircle2 },
  COMPLETED: { label: '완료', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
}

export default function SalesDashboardPage() {
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['sales-profile'],
    queryFn: () => salesMatchService.getMyProfile(),
  })

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ['sales-requests', statusFilter],
    queryFn: () => salesMatchService.getMyRequests({ status: statusFilter || undefined }),
  })

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  // If no profile, show setup prompt
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Briefcase className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">영업사원 프로필 설정</h2>
          <p className="text-gray-500 mb-6">
            개원의 매칭 서비스를 이용하려면<br />영업사원 프로필을 먼저 설정해주세요.
          </p>
          <Link
            href="/sales/profile"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            프로필 설정하기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">영업사원 센터</h1>
              <p className="text-sm text-gray-500">{profile.company}</p>
            </div>
          </div>
          <Link
            href="/sales/doctors"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            <Users className="w-4 h-4" />
            개원의 탐색
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{profile.total_requests || 0}</span>
            </div>
            <p className="text-gray-500">총 매칭 요청</p>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{profile.accepted_requests || 0}</span>
            </div>
            <p className="text-gray-500">수락된 요청</p>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {profile.total_requests > 0
                  ? Math.round((profile.accepted_requests / profile.total_requests) * 100)
                  : 0}%
              </span>
            </div>
            <p className="text-gray-500">수락률</p>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-amber-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {profile.rating ? profile.rating.toFixed(1) : '-'}
              </span>
            </div>
            <p className="text-gray-500">평점 ({profile.rating_count || 0})</p>
          </div>
        </div>

        {/* Verification Alert */}
        {!profile.is_verified && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <div className="flex-1">
              <p className="font-medium text-amber-800">프로필 인증이 필요합니다</p>
              <p className="text-sm text-amber-700">
                명함 또는 사업자등록증을 업로드하면 인증 배지가 부여됩니다.
              </p>
            </div>
            <Link
              href="/sales/profile"
              className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700"
            >
              인증하기
            </Link>
          </div>
        )}

        {/* Status Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === '' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            전체
          </button>
          {Object.entries(statusConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === key ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>

        {/* Requests */}
        {requestsLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500">요청 목록을 불러오는 중...</p>
          </div>
        ) : requests?.items?.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">매칭 요청이 없습니다</h3>
            <p className="text-gray-500 mb-6">
              개원 준비중인 의사를 찾아 매칭을 요청해보세요.
            </p>
            <Link
              href="/sales/doctors"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              <Users className="w-5 h-5" />
              개원의 탐색하기
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {requests?.items?.map((request: any) => {
              const status = statusConfig[request.status] || statusConfig.PENDING
              const StatusIcon = status.icon

              return (
                <Link
                  key={request.id}
                  href={`/sales/matches/${request.id}`}
                  className="block bg-white rounded-xl border hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${status.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(request.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.doctor_region} · {request.doctor_specialty}
                        </h3>
                        <p className="text-gray-500">
                          {request.product_category} | 매칭비 {(request.match_fee / 10000).toLocaleString()}만원
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>

                    {request.status === 'ACCEPTED' && !request.contact_shared && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                        매칭이 수락되었습니다! 연락처를 확인하세요.
                      </div>
                    )}

                    {request.status === 'PENDING' && request.expires_at && (
                      <div className="text-sm text-amber-600">
                        응답 기한: {new Date(request.expires_at).toLocaleString()}
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
