'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, DollarSign,
  Phone, Mail, Building2, MapPin, Stethoscope, Calendar,
  User, Briefcase, AlertCircle, RefreshCw
} from 'lucide-react'
import { salesMatchService } from '@/lib/api/services'

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  PENDING_PAYMENT: { label: '결제 대기', color: 'text-gray-700', bgColor: 'bg-gray-100', icon: Clock },
  PENDING: { label: '응답 대기', color: 'text-amber-700', bgColor: 'bg-amber-100', icon: Clock },
  ACCEPTED: { label: '수락됨', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle2 },
  REJECTED: { label: '거절됨', color: 'text-red-700', bgColor: 'bg-red-100', icon: XCircle },
  EXPIRED: { label: '만료됨', color: 'text-gray-700', bgColor: 'bg-gray-100', icon: Clock },
  REFUNDED: { label: '환불됨', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: RefreshCw },
  CONTACT_MADE: { label: '컨택 완료', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: CheckCircle2 },
  COMPLETED: { label: '완료', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle2 },
}

export default function SalesMatchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const matchId = params.id as string

  const { data: match, isLoading, error } = useQuery({
    queryKey: ['sales-match', matchId],
    queryFn: () => salesMatchService.getMatch(matchId),
    enabled: !!matchId,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border max-w-md w-full p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">매칭을 찾을 수 없습니다</h2>
          <p className="text-gray-500 mb-6">요청하신 매칭 정보를 불러올 수 없습니다.</p>
          <Link
            href="/sales"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            대시보드로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  const status = statusConfig[match.status] || statusConfig.PENDING
  const StatusIcon = status.icon

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">매칭 상세</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Status Card */}
        <div className={`rounded-xl p-6 mb-6 ${status.bgColor}`}>
          <div className="flex items-center gap-3">
            <StatusIcon className={`w-8 h-8 ${status.color}`} />
            <div>
              <h2 className={`text-xl font-bold ${status.color}`}>{status.label}</h2>
              <p className="text-sm opacity-80">
                요청일: {new Date(match.created_at).toLocaleDateString('ko-KR')}
              </p>
            </div>
          </div>
        </div>

        {/* Doctor Info */}
        <div className="bg-white rounded-xl border p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-gray-400" />
            의사 정보
          </h3>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700">{match.doctor_region || '지역 미공개'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Stethoscope className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700">{match.doctor_specialty || '진료과 미공개'}</span>
            </div>
            {match.doctor_opening_date && (
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">예상 개원: {match.doctor_opening_date}</span>
              </div>
            )}
          </div>

          {/* Contact Info - Only shown when accepted */}
          {match.status === 'ACCEPTED' && match.doctor_contact && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                연락처 정보
              </h4>
              <div className="space-y-2">
                {match.doctor_contact.name && (
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-green-600" />
                    <span className="text-green-800 font-medium">{match.doctor_contact.name}</span>
                  </div>
                )}
                {match.doctor_contact.phone && (
                  <a
                    href={`tel:${match.doctor_contact.phone}`}
                    className="flex items-center gap-3 text-green-700 hover:text-green-900"
                  >
                    <Phone className="w-4 h-4 text-green-600" />
                    <span>{match.doctor_contact.phone}</span>
                  </a>
                )}
                {match.doctor_contact.email && (
                  <a
                    href={`mailto:${match.doctor_contact.email}`}
                    className="flex items-center gap-3 text-green-700 hover:text-green-900"
                  >
                    <Mail className="w-4 h-4 text-green-600" />
                    <span>{match.doctor_contact.email}</span>
                  </a>
                )}
                {match.doctor_contact.clinic_address && (
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-green-600" />
                    <span className="text-green-800">{match.doctor_contact.clinic_address}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* My Request Info */}
        <div className="bg-white rounded-xl border p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-gray-400" />
            요청 정보
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">제품/서비스</span>
              <span className="font-medium text-gray-900">{match.product_category_label || match.product_category}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">매칭 비용</span>
              <span className="font-medium text-gray-900">{(match.match_fee / 10000).toLocaleString()}만원</span>
            </div>
            {match.message && (
              <div className="pt-3 border-t">
                <span className="text-gray-500 block mb-1">요청 메시지</span>
                <p className="text-gray-900">{match.message}</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-white rounded-xl border p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-gray-400" />
            결제 정보
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">결제 상태</span>
              <span className={`font-medium ${match.payment_status === 'COMPLETED' ? 'text-green-600' : match.payment_status === 'REFUNDED' ? 'text-blue-600' : 'text-gray-900'}`}>
                {match.payment_status === 'COMPLETED' ? '결제 완료' :
                 match.payment_status === 'REFUNDED' ? '환불 완료' :
                 match.payment_status === 'PENDING' ? '결제 대기' : match.payment_status}
              </span>
            </div>
            {match.paid_at && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">결제 일시</span>
                <span className="text-gray-900">{new Date(match.paid_at).toLocaleString('ko-KR')}</span>
              </div>
            )}
            {match.refunded_at && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">환불 일시</span>
                <span className="text-blue-600">{new Date(match.refunded_at).toLocaleString('ko-KR')}</span>
              </div>
            )}
            {match.refund_reason && (
              <div className="pt-3 border-t">
                <span className="text-gray-500 block mb-1">환불 사유</span>
                <p className="text-gray-900">{match.refund_reason}</p>
              </div>
            )}
          </div>
        </div>

        {/* Response Info */}
        {(match.status === 'REJECTED' || match.status === 'ACCEPTED') && (
          <div className={`rounded-xl border p-6 mb-6 ${match.status === 'ACCEPTED' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${match.status === 'ACCEPTED' ? 'text-green-800' : 'text-red-800'}`}>
              {match.status === 'ACCEPTED' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              의사 응답
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={match.status === 'ACCEPTED' ? 'text-green-700' : 'text-red-700'}>응답 일시</span>
                <span className={match.status === 'ACCEPTED' ? 'text-green-900' : 'text-red-900'}>
                  {match.responded_at ? new Date(match.responded_at).toLocaleString('ko-KR') : '-'}
                </span>
              </div>
              {match.reject_reason && (
                <div className="pt-3 border-t border-red-200">
                  <span className="text-red-700 block mb-1">거절 사유</span>
                  <p className="text-red-900">{match.reject_reason}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Expiration Warning */}
        {match.status === 'PENDING' && match.expires_at && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">응답 대기 중</p>
                <p className="text-sm text-amber-700">
                  응답 기한: {new Date(match.expires_at).toLocaleString('ko-KR')}
                </p>
                <p className="text-sm text-amber-600 mt-1">
                  기한 내 응답이 없으면 자동으로 환불됩니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Back Button */}
        <Link
          href="/sales"
          className="block w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 text-center"
        >
          목록으로 돌아가기
        </Link>
      </main>
    </div>
  )
}
