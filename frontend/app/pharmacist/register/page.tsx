'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Pill, MapPin, DollarSign,
  CheckCircle2, ChevronRight, ChevronLeft, Loader2,
  Phone, FileText
} from 'lucide-react'
import { pharmacyTransferService } from '@/lib/api/services'
import { TossIcon } from '@/components/ui/TossIcon'
import { toast } from 'sonner'

const transferReasonOptions = [
  '은퇴/건강 사유',
  '이전/이사',
  '다른 사업 전환',
  '수익성 문제',
  '개인 사정',
  '기타',
]

export default function PharmacistRegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    // Step 1: 약국 기본
    pharmacy_name: '',
    address: '',
    region_name: '',
    area_pyeong: '',
    // Step 2: 매출/비용
    monthly_revenue: '',
    monthly_rx_count: '',
    premium: '',
    rent_monthly: '',
    rent_deposit: '',
    // Step 3: 상세/연락처
    transfer_reason: '',
    description: '',
    contact_name: '',
    contact_phone: '',
  })

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const validateStep = (s: number): boolean => {
    const newErrors: Record<string, string> = {}
    if (s === 1) {
      if (!formData.pharmacy_name.trim()) newErrors.pharmacy_name = '약국명을 입력해주세요'
      if (!formData.address.trim()) newErrors.address = '주소를 입력해주세요'
    }
    if (s === 3) {
      if (!formData.contact_name.trim()) newErrors.contact_name = '담당자명을 입력해주세요'
      if (!formData.contact_phone.trim()) newErrors.contact_phone = '연락처를 입력해주세요'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(step)) setStep(step + 1)
  }

  const prevStep = () => setStep(step - 1)

  const handleSubmit = async () => {
    if (!validateStep(3)) return
    setSubmitting(true)
    try {
      const payload: any = {
        pharmacy_name: formData.pharmacy_name,
        address: formData.address,
        region_name: formData.region_name || undefined,
        area_pyeong: formData.area_pyeong ? parseFloat(formData.area_pyeong) : undefined,
        monthly_revenue: formData.monthly_revenue ? parseInt(formData.monthly_revenue) : undefined,
        monthly_rx_count: formData.monthly_rx_count ? parseInt(formData.monthly_rx_count) : undefined,
        premium: formData.premium ? parseInt(formData.premium) : undefined,
        rent_monthly: formData.rent_monthly ? parseInt(formData.rent_monthly) : undefined,
        rent_deposit: formData.rent_deposit ? parseInt(formData.rent_deposit) : undefined,
        transfer_reason: formData.transfer_reason || undefined,
        description: formData.description || undefined,
        contact_name: formData.contact_name,
        contact_phone: formData.contact_phone,
      }
      await pharmacyTransferService.createListing(payload)
      toast.success('매물이 접수되었습니다. 관리자 검토 후 공개됩니다.')
      router.push('/pharmacist')
    } catch (error: any) {
      const detail = error?.response?.data?.detail || '등록에 실패했습니다.'
      toast.error(detail)
    } finally {
      setSubmitting(false)
    }
  }

  const steps = [
    { num: 1, label: '약국 기본', icon: Pill },
    { num: 2, label: '매출/비용', icon: DollarSign },
    { num: 3, label: '상세/연락처', icon: Phone },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/pharmacist" className="text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <TossIcon icon={Pill} color="from-teal-500 to-cyan-600" size="sm" shadow="shadow-teal-500/25" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">약국 양도 매물 등록</h1>
              <p className="text-sm text-gray-500">무료로 등록하고 매수자를 찾아보세요</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step >= s.num
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
              </div>
              <span className={`ml-2 text-sm font-medium hidden sm:inline ${step >= s.num ? 'text-teal-700' : 'text-gray-400'}`}>
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <div className={`w-12 sm:w-24 h-0.5 mx-3 ${step > s.num ? 'bg-teal-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border p-6 sm:p-8">
          {/* Step 1: 약국 기본 */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">약국 기본 정보</h2>
                <p className="text-sm text-gray-500">양도할 약국의 기본 정보를 입력해주세요.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  약국명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.pharmacy_name}
                  onChange={(e) => updateField('pharmacy_name', e.target.value)}
                  placeholder="예: OO약국"
                  className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-300 ${errors.pharmacy_name ? 'border-red-300' : 'border-gray-200'}`}
                />
                {errors.pharmacy_name && <p className="mt-1 text-xs text-red-500">{errors.pharmacy_name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  주소 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="예: 서울시 강남구 역삼동 123-45"
                  className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-300 ${errors.address ? 'border-red-300' : 'border-gray-200'}`}
                />
                {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">지역명</label>
                  <input
                    type="text"
                    value={formData.region_name}
                    onChange={(e) => updateField('region_name', e.target.value)}
                    placeholder="예: 서울 강남구"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">면적 (평)</label>
                  <input
                    type="number"
                    value={formData.area_pyeong}
                    onChange={(e) => updateField('area_pyeong', e.target.value)}
                    placeholder="예: 30"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-300"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: 매출/비용 */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">매출 및 비용 정보</h2>
                <p className="text-sm text-gray-500">정확한 정보가 매수자에게 신뢰를 줍니다.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">월매출 (원)</label>
                  <input
                    type="number"
                    value={formData.monthly_revenue}
                    onChange={(e) => updateField('monthly_revenue', e.target.value)}
                    placeholder="예: 50000000"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">월 처방건수</label>
                  <input
                    type="number"
                    value={formData.monthly_rx_count}
                    onChange={(e) => updateField('monthly_rx_count', e.target.value)}
                    placeholder="예: 2000"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">권리금 (원)</label>
                <input
                  type="number"
                  value={formData.premium}
                  onChange={(e) => updateField('premium', e.target.value)}
                  placeholder="예: 200000000"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">월세 (원)</label>
                  <input
                    type="number"
                    value={formData.rent_monthly}
                    onChange={(e) => updateField('rent_monthly', e.target.value)}
                    placeholder="예: 3000000"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">보증금 (원)</label>
                  <input
                    type="number"
                    value={formData.rent_deposit}
                    onChange={(e) => updateField('rent_deposit', e.target.value)}
                    placeholder="예: 50000000"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-300"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: 상세/연락처 */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">상세 정보 및 연락처</h2>
                <p className="text-sm text-gray-500">양도 사유와 연락처를 입력해주세요.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">양도 사유</label>
                <select
                  value={formData.transfer_reason}
                  onChange={(e) => updateField('transfer_reason', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-300"
                >
                  <option value="">선택해주세요</option>
                  {transferReasonOptions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">상세 설명</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="약국의 특징, 입지 조건, 인근 병원 정보 등을 자유롭게 작성해주세요."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-300 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    담당자명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.contact_name}
                    onChange={(e) => updateField('contact_name', e.target.value)}
                    placeholder="홍길동"
                    className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-300 ${errors.contact_name ? 'border-red-300' : 'border-gray-200'}`}
                  />
                  {errors.contact_name && <p className="mt-1 text-xs text-red-500">{errors.contact_name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    연락처 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => updateField('contact_phone', e.target.value)}
                    placeholder="010-0000-0000"
                    className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-300 ${errors.contact_phone ? 'border-red-300' : 'border-gray-200'}`}
                  />
                  {errors.contact_phone && <p className="mt-1 text-xs text-red-500">{errors.contact_phone}</p>}
                </div>
              </div>

              <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl">
                <p className="text-sm text-teal-700">
                  <strong>안내:</strong> 연락처는 관리자만 확인할 수 있으며, 공개 페이지에는 노출되지 않습니다.
                  매수 희망자는 카카오톡 문의를 통해 연락할 수 있습니다.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            {step > 1 ? (
              <button
                onClick={prevStep}
                className="flex items-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                이전
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors"
              >
                다음
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-8 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    등록 중...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    매물 등록
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
