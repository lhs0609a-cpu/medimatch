'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
  ArrowLeft, Pill, MapPin, Building2, Clock, TrendingUp,
  ChevronRight, Filter, Search, Calendar
} from 'lucide-react'
import { slotsService } from '@/lib/api/services'
import { TossIcon } from '@/components/ui/TossIcon'
import { PharmacySlot } from '@/lib/api/client'

const statusLabels: Record<string, { label: string; color: string }> = {
  OPEN: { label: '모집중', color: 'bg-green-100 text-green-700' },
  BIDDING: { label: '입찰진행', color: 'bg-blue-100 text-blue-700' },
  MATCHED: { label: '매칭완료', color: 'bg-purple-100 text-purple-700' },
  CLOSED: { label: '마감', color: 'bg-gray-100 text-gray-700' },
}

const clinicTypes = [
  '전체', '내과', '정형외과', '피부과', '이비인후과',
  '소아청소년과', '안과', '치과', '산부인과'
]

export default function PharmacyPage() {
  const [selectedClinic, setSelectedClinic] = useState('전체')
  const [searchQuery, setSearchQuery] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['pharmacy-slots', selectedClinic],
    queryFn: () => slotsService.getAll({
      status: 'OPEN',
      clinic_type: selectedClinic === '전체' ? undefined : selectedClinic,
      page: 1,
      page_size: 20,
    }),
  })

  const formatCurrency = (value: number) => {
    if (value >= 100000000) {
      return `${(value / 100000000).toFixed(1)}억원`
    }
    return `${(value / 10000).toLocaleString()}만원`
  }

  const slots: PharmacySlot[] = data?.items || []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <TossIcon icon={Pill} color="from-rose-500 to-pink-500" size="xs" shadow="shadow-rose-500/25" />
              <span className="text-xl font-bold text-gray-900">PharmMatch</span>
            </div>
          </div>
          <Link
            href="/login"
            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700"
          >
            로그인하고 입찰하기
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-8 mb-8 text-white">
          <h1 className="text-3xl font-bold mb-2">독점 약국 자리</h1>
          <p className="text-purple-100 mb-6">
            의사 유치가 확정된 독점 약국 자리에 입찰하세요.<br />
            처방전 예측 데이터로 최적의 개국 위치를 찾을 수 있습니다.
          </p>
          <div className="flex gap-4">
            <div className="bg-white/20 rounded-xl px-4 py-2">
              <div className="text-2xl font-bold">{slots.length}</div>
              <div className="text-sm text-purple-100">현재 모집중</div>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2">
              <div className="text-2xl font-bold">85%</div>
              <div className="text-sm text-purple-100">처방전 예측 정확도</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="주소 또는 지역으로 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Clinic Type Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {clinicTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedClinic(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                    selectedClinic === type
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Slots Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">약국 자리를 불러오는 중...</p>
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border">
            <Pill className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">현재 모집중인 자리가 없습니다</h3>
            <p className="text-gray-600">새로운 자리가 등록되면 알림을 받아보세요</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {slots.map((slot) => (
              <Link
                key={slot.id}
                href={`/pharmacy/${slot.id}`}
                className="bg-white rounded-2xl border hover:shadow-lg transition-all"
              >
                <div className="p-6">
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusLabels[slot.status].color}`}>
                      {statusLabels[slot.status].label}
                    </span>
                    {slot.bid_deadline && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        D-{Math.ceil((new Date(slot.bid_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}
                      </span>
                    )}
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{slot.address}</p>
                      {slot.floor_info && (
                        <p className="text-sm text-gray-500">{slot.floor_info}</p>
                      )}
                    </div>
                  </div>

                  {/* Clinic Info */}
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {slot.clinic_type} {slot.clinic_name && `· ${slot.clinic_name}`}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-xs text-gray-500">예상 일일 처방전</p>
                      <p className="text-lg font-bold text-gray-900">
                        {slot.est_daily_rx || '-'}건
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">예상 월 조제료</p>
                      <p className="text-lg font-bold text-purple-600">
                        {slot.est_monthly_revenue ? formatCurrency(slot.est_monthly_revenue) : '-'}
                      </p>
                    </div>
                  </div>

                  {/* Bid Info */}
                  <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">최소 입찰가</p>
                      <p className="font-bold text-gray-900">{formatCurrency(slot.min_bid_amount)}</p>
                    </div>
                    {slot.bid_count !== undefined && slot.bid_count > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500">현재 입찰</p>
                        <p className="font-bold text-purple-600">{slot.bid_count}건</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* CTA */}
                <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex items-center justify-between">
                  <span className="text-sm text-gray-600">상세 정보 보기</span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 bg-white rounded-2xl border p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">PharmMatch 입찰 안내</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <TossIcon icon={MapPin} color="from-orange-500 to-red-500" size="md" shadow="shadow-orange-500/25" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">자리 탐색</h3>
              <p className="text-sm text-gray-600">
                원하는 지역과 진료과목의 독점 약국 자리를 찾으세요
              </p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <TossIcon icon={TrendingUp} color="from-cyan-500 to-blue-500" size="md" shadow="shadow-cyan-500/25" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">입찰 참여</h3>
              <p className="text-sm text-gray-600">
                권리금과 조건을 제시하고 입찰에 참여하세요
              </p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <TossIcon icon={Building2} color="from-blue-500 to-indigo-500" size="md" shadow="shadow-blue-500/25" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">계약 진행</h3>
              <p className="text-sm text-gray-600">
                입찰 선정 시 부공연을 통해 계약을 진행합니다
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
