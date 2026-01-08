'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Briefcase, Building2, Clock, CheckCircle2, XCircle,
  Phone, Mail, Star, MessageSquare, Loader2, AlertCircle
} from 'lucide-react'
import { salesMatchService } from '@/lib/api/services'
import { toast } from 'sonner'

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: '응답 대기', color: 'bg-amber-100 text-amber-700' },
  ACCEPTED: { label: '수락됨', color: 'bg-green-100 text-green-700' },
  REJECTED: { label: '거절됨', color: 'bg-red-100 text-red-700' },
  EXPIRED: { label: '만료됨', color: 'bg-gray-100 text-gray-700' },
}

const productCategoryLabels: Record<string, string> = {
  MEDICAL_DEVICE: '의료기기',
  PHARMACEUTICAL: '제약',
  INTERIOR: '인테리어',
  FURNITURE: '가구/집기',
  IT_SOLUTION: 'IT/EMR 솔루션',
  INSURANCE: '보험',
  LOAN: '대출/금융',
  CONSULTING: '컨설팅',
  OTHER: '기타',
}

export default function DoctorSalesRequestsPage() {
  const queryClient = useQueryClient()
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)

  const { data: requests, isLoading } = useQuery({
    queryKey: ['doctor-match-requests'],
    queryFn: () => salesMatchService.getReceivedRequests(),
  })

  const respondMutation = useMutation({
    mutationFn: ({ matchId, response, reject_reason }: {
      matchId: string
      response: 'ACCEPTED' | 'REJECTED'
      reject_reason?: string
    }) => salesMatchService.respondToMatch(matchId, { response, reject_reason }),
    onSuccess: (_, variables) => {
      toast.success(
        variables.response === 'ACCEPTED'
          ? '매칭을 수락했습니다. 영업사원 연락처가 공개됩니다.'
          : '매칭을 거절했습니다.'
      )
      queryClient.invalidateQueries({ queryKey: ['doctor-match-requests'] })
      setSelectedRequest(null)
      setShowRejectModal(false)
      setRejectReason('')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || '처리에 실패했습니다.')
    },
  })

  const handleAccept = (request: any) => {
    if (confirm('매칭을 수락하시겠습니까? 영업사원에게 연락처가 공개됩니다.')) {
      respondMutation.mutate({
        matchId: request.id,
        response: 'ACCEPTED',
      })
    }
  }

  const handleReject = () => {
    if (!selectedRequest) return
    respondMutation.mutate({
      matchId: selectedRequest.id,
      response: 'REJECTED',
      reject_reason: rejectReason || undefined,
    })
  }

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = expires.getTime() - now.getTime()

    if (diff <= 0) return '만료됨'

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    return `${hours}시간 ${minutes}분 남음`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">영업사원 매칭 요청</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Info */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">매칭 요청 안내</p>
            <p>영업사원이 개원 관련 제품/서비스를 제안하고자 합니다.</p>
            <p>수락 시 상호 연락처가 공개되며, 거절하거나 48시간 내 무응답 시 영업사원에게 비용이 환불됩니다.</p>
          </div>
        </div>

        {/* Requests */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500">요청을 불러오는 중...</p>
          </div>
        ) : requests?.items?.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">받은 요청이 없습니다</h3>
            <p className="text-gray-500">영업사원의 매칭 요청이 도착하면 여기에 표시됩니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests?.items?.map((request: any) => {
              const status = statusConfig[request.status] || statusConfig.PENDING
              const isPending = request.status === 'PENDING'

              return (
                <div
                  key={request.id}
                  className="bg-white rounded-xl border p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                      {isPending && request.expires_at && (
                        <span className="ml-2 text-xs text-amber-600">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {formatTimeRemaining(request.expires_at)}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(request.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Sales Rep Info */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {request.sales_rep_company || '영업사원'}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{productCategoryLabels[request.product_category] || request.product_category}</span>
                        {request.sales_rep_rating > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-500" />
                            {request.sales_rep_rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  {request.message && (
                    <div className="p-3 bg-gray-50 rounded-lg mb-4 text-sm text-gray-700">
                      <MessageSquare className="w-4 h-4 inline mr-2 text-gray-400" />
                      {request.message}
                    </div>
                  )}

                  {/* Contact Info (if accepted) */}
                  {request.status === 'ACCEPTED' && request.contact_shared && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                      <h4 className="font-medium text-green-800 mb-2">영업사원 연락처</h4>
                      <div className="space-y-1 text-sm text-green-700">
                        {request.sales_rep_name && (
                          <p>{request.sales_rep_name}</p>
                        )}
                        {request.sales_rep_phone && (
                          <p className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <a href={`tel:${request.sales_rep_phone}`} className="hover:underline">
                              {request.sales_rep_phone}
                            </a>
                          </p>
                        )}
                        {request.sales_rep_email && (
                          <p className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <a href={`mailto:${request.sales_rep_email}`} className="hover:underline">
                              {request.sales_rep_email}
                            </a>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {isPending && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setSelectedRequest(request)
                          setShowRejectModal(true)
                        }}
                        className="flex-1 py-2 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        거절
                      </button>
                      <button
                        onClick={() => handleAccept(request)}
                        disabled={respondMutation.isPending}
                        className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2"
                      >
                        {respondMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        수락
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">매칭 거절</h3>
            <p className="text-gray-600 mb-4">
              매칭을 거절하시겠습니까? 영업사원에게 매칭 비용이 환불됩니다.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                거절 사유 (선택)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="거절 사유를 간단히 작성해주세요"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setSelectedRequest(null)
                  setRejectReason('')
                }}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleReject}
                disabled={respondMutation.isPending}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
              >
                {respondMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                거절하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
