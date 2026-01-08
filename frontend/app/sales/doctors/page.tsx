'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Users, MapPin, Stethoscope, Calendar, Search, Filter,
  Lock, Send, Loader2, CheckCircle2, AlertCircle
} from 'lucide-react'
import { salesMatchService, paymentService } from '@/lib/api/services'
import { toast } from 'sonner'

const specialties = [
  '내과', '정형외과', '피부과', '성형외과', '안과', '이비인후과',
  '소아청소년과', '치과', '한의원', '신경외과', '비뇨의학과'
]

const productCategories = [
  { value: 'MEDICAL_DEVICE', label: '의료기기' },
  { value: 'PHARMACEUTICAL', label: '제약' },
  { value: 'INTERIOR', label: '인테리어' },
  { value: 'FURNITURE', label: '가구/집기' },
  { value: 'IT_SOLUTION', label: 'IT/EMR 솔루션' },
  { value: 'INSURANCE', label: '보험' },
  { value: 'LOAN', label: '대출/금융' },
  { value: 'CONSULTING', label: '컨설팅' },
  { value: 'OTHER', label: '기타' },
]

export default function SalesDoctorsPage() {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({
    region: '',
    specialty: '',
    opening_status: '',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null)
  const [matchForm, setMatchForm] = useState({
    product_category: '',
    message: '',
  })

  const { data: doctors, isLoading } = useQuery({
    queryKey: ['sales-doctors', filters],
    queryFn: () => salesMatchService.getDoctors({
      region: filters.region || undefined,
      specialty: filters.specialty || undefined,
      opening_status: filters.opening_status || undefined,
    }),
  })

  const requestMutation = useMutation({
    mutationFn: salesMatchService.requestMatch,
    onSuccess: (data) => {
      toast.success('매칭 요청이 전송되었습니다. 결제를 완료해주세요.')
      setSelectedDoctor(null)
      queryClient.invalidateQueries({ queryKey: ['sales-requests'] })
      // In production, redirect to payment
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || '매칭 요청에 실패했습니다.')
    },
  })

  const handleRequestMatch = () => {
    if (!selectedDoctor || !matchForm.product_category) {
      toast.error('제품 카테고리를 선택해주세요.')
      return
    }

    requestMutation.mutate({
      doctor_id: selectedDoctor.id,
      product_category: matchForm.product_category,
      message: matchForm.message || undefined,
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/sales" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">개원의 탐색</span>
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showFilters ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Filter className="w-4 h-4" />
              필터
            </button>
          </div>

          {/* Search & Filters */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={filters.region}
                onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                placeholder="지역 검색 (예: 강남구)"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {showFilters && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">진료과목</label>
                  <select
                    value={filters.specialty}
                    onChange={(e) => setFilters({ ...filters, specialty: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">전체</option>
                    {specialties.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">개원 상태</label>
                  <select
                    value={filters.opening_status}
                    onChange={(e) => setFilters({ ...filters, opening_status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">전체</option>
                    <option value="PLANNING">계획중</option>
                    <option value="SEARCHING_LOCATION">입지 탐색중</option>
                    <option value="PREPARING">준비중</option>
                    <option value="FINALIZING">마무리 단계</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Info Banner */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">매칭 서비스 안내</p>
            <p>개원 준비중인 의사의 기본 정보(지역, 진료과목)만 공개됩니다. 매칭 요청 후 의사가 수락하면 연락처가 공개됩니다.</p>
            <p className="mt-1 font-medium">매칭 비용: 건당 30만원 (거절/무응답 시 자동 환불)</p>
          </div>
        </div>

        {/* Doctors List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500">개원의 목록을 불러오는 중...</p>
          </div>
        ) : doctors?.items?.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">검색 결과가 없습니다</h3>
            <p className="text-gray-500">필터 조건을 변경하거나 다른 지역을 검색해보세요.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors?.items?.map((doctor: any) => (
              <div
                key={doctor.id}
                className="bg-white rounded-xl border hover:border-blue-300 hover:shadow-md transition-all p-6"
              >
                {/* Anonymous Info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <Lock className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">익명 개원의</p>
                    <p className="text-sm text-gray-500">{doctor.region_name}</p>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Stethoscope className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{doctor.specialty}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">
                      {doctor.expected_opening_date || '미정'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{doctor.opening_status_label || '개원 준비중'}</span>
                  </div>
                </div>

                {/* Action */}
                <button
                  onClick={() => setSelectedDoctor(doctor)}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  매칭 요청
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Match Request Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">매칭 요청</h3>

            <div className="p-4 bg-gray-50 rounded-lg mb-4">
              <p className="font-medium text-gray-900">{selectedDoctor.region_name} · {selectedDoctor.specialty}</p>
              <p className="text-sm text-gray-500">예상 개원: {selectedDoctor.expected_opening_date || '미정'}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제품/서비스 카테고리 *
              </label>
              <select
                value={matchForm.product_category}
                onChange={(e) => setMatchForm({ ...matchForm, product_category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">선택해주세요</option>
                {productCategories.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                메시지 (선택)
              </label>
              <textarea
                value={matchForm.message}
                onChange={(e) => setMatchForm({ ...matchForm, message: e.target.value })}
                rows={3}
                placeholder="간단한 소개나 제안 내용을 작성해주세요"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4 text-sm text-amber-800">
              <p className="font-medium">매칭 비용: 30만원</p>
              <p>의사가 거절하거나 48시간 내 무응답 시 자동 환불됩니다.</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedDoctor(null)}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleRequestMatch}
                disabled={requestMutation.isPending || !matchForm.product_category}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                {requestMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                요청하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
