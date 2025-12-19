'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import {
  ArrowLeft, MapPin, Building2, Clock, TrendingUp, Users,
  Calendar, FileText, Send, AlertCircle, CheckCircle
} from 'lucide-react'
import { slotsService } from '@/lib/api/services'
import { useAuth } from '@/lib/hooks/useAuth'
import { toast } from 'sonner'

const statusLabels: Record<string, { label: string; color: string }> = {
  OPEN: { label: '모집중', color: 'bg-green-100 text-green-700' },
  BIDDING: { label: '입찰진행', color: 'bg-blue-100 text-blue-700' },
  MATCHED: { label: '매칭완료', color: 'bg-purple-100 text-purple-700' },
  CLOSED: { label: '마감', color: 'bg-gray-100 text-gray-700' },
}

export default function PharmacyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuth()
  const [showBidForm, setShowBidForm] = useState(false)
  const [bidAmount, setBidAmount] = useState('')
  const [bidMessage, setBidMessage] = useState('')
  const [experienceYears, setExperienceYears] = useState('')
  const [pharmacyName, setPharmacyName] = useState('')

  const slotId = params.id as string

  const { data: slot, isLoading } = useQuery({
    queryKey: ['pharmacy-slot', slotId],
    queryFn: () => slotsService.get(slotId),
    enabled: !!slotId,
  })

  const bidMutation = useMutation({
    mutationFn: (data: any) => slotsService.createBid(slotId, data),
    onSuccess: () => {
      toast.success('입찰이 완료되었습니다!')
      setShowBidForm(false)
      queryClient.invalidateQueries({ queryKey: ['pharmacy-slot', slotId] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || '입찰에 실패했습니다.')
    },
  })

  const handleBid = () => {
    if (!bidAmount) {
      toast.error('입찰 금액을 입력해주세요')
      return
    }

    const amount = parseInt(bidAmount.replace(/,/g, ''))
    if (slot && amount < slot.min_bid_amount) {
      toast.error(`최소 입찰가는 ${formatCurrency(slot.min_bid_amount)}입니다`)
      return
    }

    bidMutation.mutate({
      bid_amount: amount,
      message: bidMessage,
      experience_years: experienceYears ? parseInt(experienceYears) : undefined,
      pharmacy_name: pharmacyName || undefined,
    })
  }

  const formatCurrency = (value: number) => {
    if (value >= 100000000) {
      return `${(value / 100000000).toFixed(1)}억원`
    }
    return `${(value / 10000).toLocaleString()}만원`
  }

  const formatNumber = (value: string) => {
    const num = value.replace(/[^\d]/g, '')
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  const getDaysLeft = (deadline: string) => {
    const diff = new Date(deadline).getTime() - Date.now()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!slot) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">약국 자리를 찾을 수 없습니다</p>
          <Link href="/pharmacy" className="text-primary-600 mt-2 inline-block">
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
            <span className="font-medium text-gray-900">약국 자리 상세</span>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusLabels[slot.status].color}`}>
            {statusLabels[slot.status].label}
          </span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Main Info Card */}
        <div className="bg-white rounded-2xl border p-6 mb-6">
          <div className="flex items-start gap-2 mb-4">
            <MapPin className="w-5 h-5 text-primary-600 mt-0.5" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">{slot.address}</h1>
              {slot.floor_info && <p className="text-gray-500">{slot.floor_info}</p>}
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">{slot.clinic_type}</span>
            </div>
            {slot.clinic_name && (
              <span className="text-gray-600">· {slot.clinic_name}</span>
            )}
            {slot.area_pyeong && (
              <span className="text-gray-600">· {slot.area_pyeong}평</span>
            )}
          </div>

          {slot.bid_deadline && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 text-orange-700">
                <Clock className="w-5 h-5" />
                <span className="font-medium">
                  입찰 마감까지 {getDaysLeft(slot.bid_deadline)}일 남음
                </span>
              </div>
              <p className="text-sm text-orange-600 mt-1">
                마감일: {new Date(slot.bid_deadline).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">예상 일일 처방전</p>
              <p className="text-2xl font-bold text-gray-900">{slot.est_daily_rx || '-'}건</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">예상 월 조제료</p>
              <p className="text-2xl font-bold text-purple-600">
                {slot.est_monthly_revenue ? formatCurrency(slot.est_monthly_revenue) : '-'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">최소 입찰가</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(slot.min_bid_amount)}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">현재 입찰</p>
              <p className="text-2xl font-bold text-blue-600">{slot.bid_count || 0}건</p>
            </div>
          </div>
        </div>

        {/* Description */}
        {slot.description && (
          <div className="bg-white rounded-2xl border p-6 mb-6">
            <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-400" />
              상세 설명
            </h2>
            <p className="text-gray-600 whitespace-pre-wrap">{slot.description}</p>
          </div>
        )}

        {/* Prediction Info */}
        <div className="bg-white rounded-2xl border p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            처방전 예측 분석
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">입점 진료과목</span>
              <span className="font-medium">{slot.clinic_type}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">예상 일일 처방전</span>
              <span className="font-medium">{slot.est_daily_rx || '-'}건</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">평균 조제료 (처방전당)</span>
              <span className="font-medium">8,000원</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">월 영업일</span>
              <span className="font-medium">25일</span>
            </div>
            <div className="flex justify-between items-center py-2 bg-purple-50 rounded-lg px-3">
              <span className="text-purple-700 font-medium">예상 월 조제료 매출</span>
              <span className="font-bold text-purple-700">
                {slot.est_monthly_revenue ? formatCurrency(slot.est_monthly_revenue) : '-'}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            * 예측값은 심평원 데이터 기반이며 실제와 다를 수 있습니다
          </p>
        </div>

        {/* Bid Section */}
        {slot.status === 'OPEN' || slot.status === 'BIDDING' ? (
          <div className="bg-white rounded-2xl border p-6">
            <h2 className="font-bold text-gray-900 mb-4">입찰하기</h2>

            {!isAuthenticated ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">입찰하려면 로그인이 필요합니다</p>
                <Link
                  href="/login"
                  className="inline-block bg-primary-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-700"
                >
                  로그인하기
                </Link>
              </div>
            ) : user?.role !== 'PHARMACIST' && user?.role !== 'ADMIN' ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <p className="text-gray-600">약사 회원만 입찰에 참여할 수 있습니다</p>
              </div>
            ) : !showBidForm ? (
              <button
                onClick={() => setShowBidForm(true)}
                className="w-full bg-purple-600 text-white py-4 rounded-xl font-medium hover:bg-purple-700 transition flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                입찰 참여하기
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    입찰 금액 (권리금) *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(formatNumber(e.target.value))}
                      placeholder={`최소 ${formatCurrency(slot.min_bid_amount)}`}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">원</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      경력 (년)
                    </label>
                    <input
                      type="number"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                      placeholder="예: 5"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      개국 예정 약국명
                    </label>
                    <input
                      type="text"
                      value={pharmacyName}
                      onChange={(e) => setPharmacyName(e.target.value)}
                      placeholder="예: 행복약국"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    입찰 메시지
                  </label>
                  <textarea
                    value={bidMessage}
                    onChange={(e) => setBidMessage(e.target.value)}
                    rows={3}
                    placeholder="자기소개, 강점 등을 작성해주세요"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowBidForm(false)}
                    className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleBid}
                    disabled={bidMutation.isPending}
                    className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {bidMutation.isPending ? '제출 중...' : '입찰 제출'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-100 rounded-2xl p-6 text-center">
            <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">이 자리는 입찰이 마감되었습니다</p>
          </div>
        )}
      </main>
    </div>
  )
}
