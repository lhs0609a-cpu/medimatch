'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMutation } from '@tanstack/react-query'
import {
  ArrowLeft, Pill, MapPin, Building2, TrendingUp,
  DollarSign, Info, Check, AlertCircle, Loader2
} from 'lucide-react'
import { pharmacyMatchService } from '@/lib/api/services'
import { PharmacyType, TransferReason } from '@/lib/api/client'

const pharmacyTypes: { value: PharmacyType; label: string }[] = [
  { value: 'GENERAL', label: '일반약국' },
  { value: 'DISPENSING', label: '조제전문' },
  { value: 'ORIENTAL', label: '한약국' },
  { value: 'HOSPITAL', label: '병원약국' },
]

const transferReasons: { value: TransferReason; label: string }[] = [
  { value: 'RETIREMENT', label: '은퇴' },
  { value: 'RELOCATION', label: '이전' },
  { value: 'HEALTH', label: '건강상의 이유' },
  { value: 'CAREER_CHANGE', label: '직업 변경' },
  { value: 'FAMILY', label: '가정사' },
  { value: 'OTHER', label: '기타' },
]

const hospitalTypes = [
  '내과', '정형외과', '피부과', '이비인후과', '소아청소년과',
  '안과', '치과', '산부인과', '비뇨기과', '신경외과', '외과'
]

export default function NewListingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    // Step 1: 위치 정보
    region_code: '',
    region_name: '',
    exact_address: '',
    pharmacy_name: '',
    floor_info: '',

    // Step 2: 약국 정보
    pharmacy_type: 'GENERAL' as PharmacyType,
    nearby_hospital_types: [] as string[],
    operation_years: 0,
    employee_count: 0,
    has_auto_dispenser: false,
    has_parking: false,

    // Step 3: 매출/가격 정보
    monthly_revenue_min: 0,
    monthly_revenue_max: 0,
    monthly_rx_count: 0,
    premium_min: 0,
    premium_max: 0,
    monthly_rent: 0,
    deposit: 0,
    area_pyeong_min: 0,
    area_pyeong_max: 0,

    // Step 4: 양도 정보
    transfer_reason: '' as TransferReason | '',
    description: '',
    owner_phone: '',
  })

  const mutation = useMutation({
    mutationFn: pharmacyMatchService.createListing,
    onSuccess: (data) => {
      router.push(`/pharmacy-match/listings/${data.id}`)
    },
  })

  const updateForm = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const toggleHospitalType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      nearby_hospital_types: prev.nearby_hospital_types.includes(type)
        ? prev.nearby_hospital_types.filter(t => t !== type)
        : [...prev.nearby_hospital_types, type]
    }))
  }

  const handleSubmit = () => {
    mutation.mutate({
      ...formData,
      transfer_reason: formData.transfer_reason || undefined,
      monthly_revenue_min: formData.monthly_revenue_min * 10000,
      monthly_revenue_max: formData.monthly_revenue_max * 10000,
    })
  }

  const isStepValid = (stepNum: number) => {
    switch (stepNum) {
      case 1:
        return formData.region_name && formData.exact_address
      case 2:
        return formData.pharmacy_type
      case 3:
        return formData.premium_min >= 0
      case 4:
        return true
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/pharmacy-match" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Pill className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">매물 등록</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded-full mx-1 ${
                  s <= step ? 'bg-purple-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span className={step >= 1 ? 'text-purple-600 font-medium' : ''}>위치</span>
            <span className={step >= 2 ? 'text-purple-600 font-medium' : ''}>약국정보</span>
            <span className={step >= 3 ? 'text-purple-600 font-medium' : ''}>가격</span>
            <span className={step >= 4 ? 'text-purple-600 font-medium' : ''}>상세</span>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <p className="font-medium text-purple-900">익명성 보장</p>
              <p className="text-sm text-purple-700">
                정확한 주소와 연락처는 상호 매칭 전까지 절대 공개되지 않습니다.
                구 단위 위치와 조건만 다른 사용자에게 표시됩니다.
              </p>
            </div>
          </div>
        </div>

        {/* Step 1: 위치 정보 */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-600" />
              위치 정보
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  지역 선택 <span className="text-red-500">*</span>
                  <span className="text-gray-400 font-normal ml-2">(공개됨)</span>
                </label>
                <select
                  value={formData.region_name}
                  onChange={(e) => updateForm({
                    region_name: e.target.value,
                    region_code: e.target.value.split(' ')[0]
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">선택하세요</option>
                  <optgroup label="서울">
                    <option value="서울시 강남구">서울시 강남구</option>
                    <option value="서울시 서초구">서울시 서초구</option>
                    <option value="서울시 송파구">서울시 송파구</option>
                    <option value="서울시 마포구">서울시 마포구</option>
                    <option value="서울시 영등포구">서울시 영등포구</option>
                    <option value="서울시 종로구">서울시 종로구</option>
                    <option value="서울시 중구">서울시 중구</option>
                  </optgroup>
                  <optgroup label="경기">
                    <option value="경기도 성남시">경기도 성남시</option>
                    <option value="경기도 수원시">경기도 수원시</option>
                    <option value="경기도 용인시">경기도 용인시</option>
                    <option value="경기도 고양시">경기도 고양시</option>
                  </optgroup>
                  <optgroup label="부산">
                    <option value="부산시 해운대구">부산시 해운대구</option>
                    <option value="부산시 부산진구">부산시 부산진구</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  정확한 주소 <span className="text-red-500">*</span>
                  <span className="text-gray-400 font-normal ml-2">(비공개)</span>
                </label>
                <input
                  type="text"
                  value={formData.exact_address}
                  onChange={(e) => updateForm({ exact_address: e.target.value })}
                  placeholder="예: 서울시 강남구 테헤란로 123, 1층"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">매칭 후에만 상대방에게 공개됩니다</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  약국명
                  <span className="text-gray-400 font-normal ml-2">(비공개)</span>
                </label>
                <input
                  type="text"
                  value={formData.pharmacy_name}
                  onChange={(e) => updateForm({ pharmacy_name: e.target.value })}
                  placeholder="예: 강남조제약국"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  층 정보
                  <span className="text-gray-400 font-normal ml-2">(공개됨)</span>
                </label>
                <input
                  type="text"
                  value={formData.floor_info}
                  onChange={(e) => updateForm({ floor_info: e.target.value })}
                  placeholder="예: 1층, 지하1층"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: 약국 정보 */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-600" />
              약국 정보
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  약국 유형 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {pharmacyTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => updateForm({ pharmacy_type: type.value })}
                      className={`px-4 py-3 rounded-lg border text-sm font-medium transition ${
                        formData.pharmacy_type === type.value
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-purple-300'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  인근 병원 진료과 (복수 선택)
                </label>
                <div className="flex flex-wrap gap-2">
                  {hospitalTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => toggleHospitalType(type)}
                      className={`px-3 py-1.5 rounded-full text-sm transition ${
                        formData.nearby_hospital_types.includes(type)
                          ? 'bg-purple-100 text-purple-700 border border-purple-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    운영 기간 (년)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.operation_years || ''}
                    onChange={(e) => updateForm({ operation_years: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    직원 수
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.employee_count || ''}
                    onChange={(e) => updateForm({ employee_count: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.has_auto_dispenser}
                    onChange={(e) => updateForm({ has_auto_dispenser: e.target.checked })}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">자동조제기 보유</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.has_parking}
                    onChange={(e) => updateForm({ has_parking: e.target.checked })}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">주차 가능</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: 가격 정보 */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              가격 정보
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  예상 월매출 (만원)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    min="0"
                    value={formData.monthly_revenue_min || ''}
                    onChange={(e) => updateForm({ monthly_revenue_min: parseInt(e.target.value) || 0 })}
                    placeholder="최소"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="number"
                    min="0"
                    value={formData.monthly_revenue_max || ''}
                    onChange={(e) => updateForm({ monthly_revenue_max: parseInt(e.target.value) || 0 })}
                    placeholder="최대"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  월 평균 처방전 수
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.monthly_rx_count || ''}
                  onChange={(e) => updateForm({ monthly_rx_count: parseInt(e.target.value) || 0 })}
                  placeholder="예: 3000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  희망 권리금 (만원) <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    min="0"
                    value={formData.premium_min || ''}
                    onChange={(e) => updateForm({ premium_min: parseInt(e.target.value) || 0 })}
                    placeholder="최소"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="number"
                    min="0"
                    value={formData.premium_max || ''}
                    onChange={(e) => updateForm({ premium_max: parseInt(e.target.value) || 0 })}
                    placeholder="최대"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    보증금 (만원)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.deposit || ''}
                    onChange={(e) => updateForm({ deposit: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    월 임대료 (만원)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.monthly_rent || ''}
                    onChange={(e) => updateForm({ monthly_rent: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  면적 (평)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.area_pyeong_min || ''}
                    onChange={(e) => updateForm({ area_pyeong_min: parseFloat(e.target.value) || 0 })}
                    placeholder="최소"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.area_pyeong_max || ''}
                    onChange={(e) => updateForm({ area_pyeong_max: parseFloat(e.target.value) || 0 })}
                    placeholder="최대"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: 상세 정보 */}
        {step === 4 && (
          <div className="bg-white rounded-2xl border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Info className="w-5 h-5 text-purple-600" />
              상세 정보
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  양도 사유
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {transferReasons.map((reason) => (
                    <button
                      key={reason.value}
                      onClick={() => updateForm({ transfer_reason: reason.value })}
                      className={`px-3 py-2 rounded-lg border text-sm transition ${
                        formData.transfer_reason === reason.value
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-purple-300'
                      }`}
                    >
                      {reason.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상세 설명
                  <span className="text-gray-400 font-normal ml-2">(개인정보 자동 마스킹)</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateForm({ description: e.target.value })}
                  rows={5}
                  placeholder="약국에 대한 추가 설명을 입력하세요.&#10;전화번호, 주소 등 개인정보는 자동으로 마스킹됩니다."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  연락처
                  <span className="text-gray-400 font-normal ml-2">(비공개)</span>
                </label>
                <input
                  type="tel"
                  value={formData.owner_phone}
                  onChange={(e) => updateForm({ owner_phone: e.target.value })}
                  placeholder="010-1234-5678"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">매칭 성사 후에만 상대방에게 공개됩니다</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {mutation.isError && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">등록 실패</p>
              <p className="text-sm text-red-700">
                {(mutation.error as any)?.response?.data?.detail || '매물 등록 중 오류가 발생했습니다.'}
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              이전
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!isStepValid(step)}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              다음
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={mutation.isPending}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 flex items-center gap-2"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  등록 중...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  매물 등록
                </>
              )}
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
