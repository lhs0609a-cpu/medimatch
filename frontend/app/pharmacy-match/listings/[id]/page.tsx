'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Pill, MapPin, Building2, TrendingUp, Heart,
  Eye, Clock, DollarSign, Users, Car, Package, Check, Send, Loader2
} from 'lucide-react'
import { pharmacyMatchService } from '@/lib/api/services'
import { PharmacyType, TransferReason } from '@/lib/api/client'

const pharmacyTypeLabels: Record<PharmacyType, string> = {
  GENERAL: '일반약국',
  DISPENSING: '조제전문',
  ORIENTAL: '한약국',
  HOSPITAL: '병원약국',
}

const transferReasonLabels: Record<string, string> = {
  RETIREMENT: '은퇴',
  RELOCATION: '이전',
  HEALTH: '건강상의 이유',
  CAREER_CHANGE: '직업 변경',
  FAMILY: '가정사',
  OTHER: '기타',
}

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [showInterestModal, setShowInterestModal] = useState(false)
  const [interestMessage, setInterestMessage] = useState('')

  const { data: listing, isLoading } = useQuery({
    queryKey: ['pharmacy-match-listing', params.id],
    queryFn: () => pharmacyMatchService.getListing(params.id as string),
    enabled: !!params.id,
  })

  const interestMutation = useMutation({
    mutationFn: () => pharmacyMatchService.expressInterest({
      listing_id: params.id as string,
      message: interestMessage || undefined,
    }),
    onSuccess: () => {
      setShowInterestModal(false)
      queryClient.invalidateQueries({ queryKey: ['pharmacy-match-listing', params.id] })
      alert('관심 표시가 완료되었습니다. 상대방도 관심을 표시하면 매칭이 성사됩니다.')
    },
  })

  const formatCurrency = (value: number) => {
    if (value >= 10000) {
      return `${(value / 10000).toFixed(1)}억원`
    }
    return `${value.toLocaleString()}만원`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">매물 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Pill className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">매물을 찾을 수 없습니다</h2>
          <Link href="/pharmacy-match" className="text-purple-600 hover:underline">
            목록으로 돌아가기
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
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Pill className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">매물 상세</span>
            </div>
          </div>
          <span className="text-sm text-gray-500 font-mono">{listing.anonymous_id}</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Main Card */}
        <div className="bg-white rounded-2xl border overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-sm">
                {listing.status === 'ACTIVE' ? '매칭중' : listing.status}
              </span>
              <div className="flex items-center gap-4 text-sm text-purple-100">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {listing.view_count}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  {listing.interest_count}
                </span>
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2">{listing.region_name}</h1>
            <p className="text-purple-100">
              {pharmacyTypeLabels[listing.pharmacy_type]}
              {listing.floor_info && ` · ${listing.floor_info}`}
              {listing.operation_years && ` · 운영 ${listing.operation_years}년`}
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Price Section */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="bg-purple-50 rounded-xl p-4">
                <p className="text-sm text-purple-600 mb-1">권리금</p>
                <p className="text-2xl font-bold text-gray-900">
                  {listing.premium_min && listing.premium_max
                    ? `${formatCurrency(listing.premium_min)} ~ ${formatCurrency(listing.premium_max)}`
                    : '-'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-1">보증금</p>
                <p className="text-2xl font-bold text-gray-900">
                  {listing.deposit ? formatCurrency(listing.deposit) : '-'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-1">월 임대료</p>
                <p className="text-2xl font-bold text-gray-900">
                  {listing.monthly_rent ? formatCurrency(listing.monthly_rent) : '-'}
                </p>
              </div>
            </div>

            {/* Revenue Section */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                매출 정보
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">예상 월매출</p>
                  <p className="text-xl font-bold text-gray-900">
                    {listing.monthly_revenue_min && listing.monthly_revenue_max
                      ? `${(listing.monthly_revenue_min / 10000).toLocaleString()} ~ ${(listing.monthly_revenue_max / 10000).toLocaleString()}만원`
                      : '-'}
                  </p>
                </div>
                <div className="border rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">월 처방전 수</p>
                  <p className="text-xl font-bold text-gray-900">
                    {listing.monthly_rx_count ? `${listing.monthly_rx_count.toLocaleString()}건` : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                약국 정보
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {listing.area_pyeong_min && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-500">면적</span>
                    <span className="font-medium">
                      {listing.area_pyeong_min}
                      {listing.area_pyeong_max && listing.area_pyeong_max !== listing.area_pyeong_min
                        ? ` ~ ${listing.area_pyeong_max}`
                        : ''}평
                    </span>
                  </div>
                )}
                {listing.employee_count > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Users className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-500">직원</span>
                    <span className="font-medium">{listing.employee_count}명</span>
                  </div>
                )}
                {listing.has_auto_dispenser && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <Package className="w-5 h-5 text-green-600" />
                    <span className="text-green-700 font-medium">자동조제기 보유</span>
                  </div>
                )}
                {listing.has_parking && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Car className="w-5 h-5 text-blue-600" />
                    <span className="text-blue-700 font-medium">주차 가능</span>
                  </div>
                )}
              </div>
            </div>

            {/* Nearby Hospitals */}
            {listing.nearby_hospital_types.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4">인근 병원</h2>
                <div className="flex flex-wrap gap-2">
                  {listing.nearby_hospital_types.map((type) => (
                    <span
                      key={type}
                      className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Transfer Reason */}
            {listing.transfer_reason && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4">양도 사유</h2>
                <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg inline-block">
                  {transferReasonLabels[listing.transfer_reason]}
                </span>
              </div>
            )}

            {/* Description */}
            {listing.description && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4">상세 설명</h2>
                <p className="text-gray-700 whitespace-pre-line">{listing.description}</p>
              </div>
            )}

            {/* Privacy Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-amber-800">
                <strong>익명 매물입니다.</strong> 정확한 주소와 연락처는 상호 관심 표시(매칭) 후에 공개됩니다.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={() => setShowInterestModal(true)}
            disabled={listing.status !== 'ACTIVE'}
            className="flex-1 bg-purple-600 text-white py-4 rounded-xl font-medium hover:bg-purple-700 disabled:bg-gray-300 flex items-center justify-center gap-2"
          >
            <Heart className="w-5 h-5" />
            관심 표시하기
          </button>
        </div>
      </main>

      {/* Interest Modal */}
      {showInterestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">관심 표시</h3>
            <p className="text-gray-600 mb-4">
              이 매물에 관심을 표시합니다. 매물주도 관심을 표시하면 서로의 연락처가 공개됩니다.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                메시지 (선택)
              </label>
              <textarea
                value={interestMessage}
                onChange={(e) => setInterestMessage(e.target.value)}
                rows={3}
                placeholder="간단한 인사나 문의사항을 남겨주세요"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowInterestModal(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={() => interestMutation.mutate()}
                disabled={interestMutation.isPending}
                className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                {interestMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                관심 표시
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
