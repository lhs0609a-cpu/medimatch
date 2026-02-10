'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import {
  ArrowLeft, Building2, MapPin, DollarSign, Users, Upload,
  CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, Loader2,
  Car, Layers, FileText, Phone, Mail, CreditCard, Coins
} from 'lucide-react'
import { landlordService, listingSubscriptionService } from '@/lib/api/services'
import { toast } from 'sonner'

const listingSchema = z.object({
  title: z.string().min(5, '제목은 5자 이상 입력해주세요'),
  building_name: z.string().optional(),
  address: z.string().min(10, '주소를 정확히 입력해주세요'),
  floor: z.string().optional(),
  area_pyeong: z.number().optional(),
  rent_deposit: z.number().optional(),
  rent_monthly: z.number().optional(),
  maintenance_fee: z.number().optional(),
  premium: z.number().optional(),
  preferred_tenants: z.array(z.string()).optional(),
  has_parking: z.boolean().optional(),
  parking_count: z.number().optional(),
  has_elevator: z.boolean().optional(),
  building_age: z.number().optional(),
  previous_use: z.string().optional(),
  description: z.string().optional(),
  contact_name: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email('올바른 이메일을 입력해주세요').optional().or(z.literal('')),
  show_exact_address: z.boolean().optional(),
  show_contact: z.boolean().optional(),
})

type ListingForm = z.infer<typeof listingSchema>

const preferredTenantOptions = [
  '내과', '외과', '정형외과', '피부과', '성형외과', '안과', '이비인후과',
  '치과', '한의원', '약국', '동물병원', '기타 의료시설',
]

export default function LandlordRegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [uploadedDocs, setUploadedDocs] = useState<File[]>([])
  const [subCheck, setSubCheck] = useState<{
    loading: boolean
    hasSubscription: boolean
    remainingCredits: number
    status: string | null
  }>({ loading: true, hasSubscription: false, remainingCredits: 0, status: null })

  useEffect(() => {
    listingSubscriptionService.getStatus()
      .then((data) => {
        const active = data.has_subscription &&
          (data.status === 'ACTIVE' || data.status === 'CANCELED') &&
          (data.remaining_credits > 0)
        setSubCheck({
          loading: false,
          hasSubscription: active,
          remainingCredits: data.remaining_credits || 0,
          status: data.status || null,
        })
      })
      .catch(() => {
        setSubCheck({ loading: false, hasSubscription: false, remainingCredits: 0, status: null })
      })
  }, [])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ListingForm>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      has_parking: false,
      has_elevator: false,
      show_exact_address: false,
      show_contact: false,
      preferred_tenants: [],
    },
  })

  const preferredTenants = watch('preferred_tenants') || []

  const togglePreferredTenant = (tenant: string) => {
    const current = preferredTenants
    if (current.includes(tenant)) {
      setValue('preferred_tenants', current.filter(t => t !== tenant))
    } else {
      setValue('preferred_tenants', [...current, tenant])
    }
  }

  const createMutation = useMutation({
    mutationFn: landlordService.createListing,
    onSuccess: (data) => {
      toast.success('매물이 등록되었습니다! 즉시 공개됩니다.')
      router.push('/landlord')
    },
    onError: (error: any) => {
      if (error.response?.status === 402) {
        toast.error(error.response.data.detail || '구독이 필요합니다.')
        router.push('/subscription/listing')
        return
      }
      toast.error(error.response?.data?.detail || '매물 등록에 실패했습니다.')
    },
  })

  const onSubmit = (data: ListingForm) => {
    createMutation.mutate({
      ...data,
      contact_email: data.contact_email || undefined,
    })
  }

  const totalSteps = 4

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">기본 정보</h2>
              <p className="text-gray-500">매물의 기본 정보를 입력해주세요.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                매물 제목 *
              </label>
              <input
                {...register('title')}
                placeholder="예: 강남역 도보 3분, 1층 코너 상가"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                건물명 (선택)
              </label>
              <input
                {...register('building_name')}
                placeholder="예: ○○빌딩"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                주소 *
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('address')}
                  placeholder="예: 서울시 강남구 역삼동 123-45"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              {errors.address && (
                <p className="mt-1 text-sm text-red-500">{errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">층</label>
                <input
                  {...register('floor')}
                  placeholder="예: 지상 1층"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">면적 (평)</label>
                <input
                  {...register('area_pyeong', { valueAsNumber: true })}
                  type="number"
                  placeholder="예: 30"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">비용 정보</h2>
              <p className="text-gray-500">임대 조건을 입력해주세요.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">보증금 (만원)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register('rent_deposit', { valueAsNumber: true })}
                    type="number"
                    placeholder="예: 5000"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">월세 (만원)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register('rent_monthly', { valueAsNumber: true })}
                    type="number"
                    placeholder="예: 300"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">관리비 (만원)</label>
                <input
                  {...register('maintenance_fee', { valueAsNumber: true })}
                  type="number"
                  placeholder="예: 30"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">권리금 (만원)</label>
                <input
                  {...register('premium', { valueAsNumber: true })}
                  type="number"
                  placeholder="예: 10000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">희망 입점 업종</label>
              <div className="flex flex-wrap gap-2">
                {preferredTenantOptions.map((tenant) => (
                  <button
                    key={tenant}
                    type="button"
                    onClick={() => togglePreferredTenant(tenant)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      preferredTenants.includes(tenant)
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tenant}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">건물 특성</h2>
              <p className="text-gray-500">건물의 상세 정보를 입력해주세요.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  {...register('has_parking')}
                  className="w-5 h-5 text-emerald-600 rounded"
                />
                <Car className="w-5 h-5 text-gray-500" />
                <span className="font-medium">주차 가능</span>
              </label>
              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  {...register('has_elevator')}
                  className="w-5 h-5 text-emerald-600 rounded"
                />
                <Layers className="w-5 h-5 text-gray-500" />
                <span className="font-medium">엘리베이터</span>
              </label>
            </div>

            {watch('has_parking') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">주차 대수</label>
                <input
                  {...register('parking_count', { valueAsNumber: true })}
                  type="number"
                  placeholder="예: 5"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">건물 연식 (년)</label>
                <input
                  {...register('building_age', { valueAsNumber: true })}
                  type="number"
                  placeholder="예: 5"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">이전 용도</label>
                <input
                  {...register('previous_use')}
                  placeholder="예: 약국"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">상세 설명</label>
              <textarea
                {...register('description')}
                rows={4}
                placeholder="건물의 장점, 주변 상권, 유동인구 등을 자유롭게 작성해주세요."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">증빙서류 안내</p>
                  <p className="text-sm text-amber-700 mt-1">
                    등기부등본 또는 임대차계약서 사본을 준비해주세요.<br />
                    등록 후 마이페이지에서 업로드할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">연락처 및 공개 설정</h2>
              <p className="text-gray-500">문의 시 사용할 연락처를 입력해주세요.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">담당자명</label>
              <input
                {...register('contact_name')}
                placeholder="예: 홍길동"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">연락처</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register('contact_phone')}
                    placeholder="010-1234-5678"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register('contact_email')}
                    type="email"
                    placeholder="email@example.com"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                {errors.contact_email && (
                  <p className="mt-1 text-sm text-red-500">{errors.contact_email.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  {...register('show_exact_address')}
                  className="w-5 h-5 text-emerald-600 rounded"
                />
                <div>
                  <span className="font-medium">정확한 주소 공개</span>
                  <p className="text-sm text-gray-500">체크 해제 시 시/구 단위로만 표시됩니다.</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  {...register('show_contact')}
                  className="w-5 h-5 text-emerald-600 rounded"
                />
                <div>
                  <span className="font-medium">연락처 공개</span>
                  <p className="text-sm text-gray-500">체크 해제 시 플랫폼 내 문의로만 연락받습니다.</p>
                </div>
              </label>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-emerald-800">등록 절차 안내</p>
                  <p className="text-sm text-emerald-700 mt-1">
                    매물 등록 후 관리자가 증빙서류를 확인합니다.<br />
                    승인 완료 시 의사/약사에게 매물이 노출됩니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // 구독 체크 로딩
  if (subCheck.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  // 구독 없거나 크레딧 없으면 구독 안내
  if (!subCheck.hasSubscription) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-10 h-10 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">구독이 필요합니다</h1>
            <p className="text-gray-600 mb-2">
              매물을 등록하려면 매물 등록 구독(월 150,000원)이 필요합니다.
            </p>
            {subCheck.status && ['EXPIRED', 'SUSPENDED'].includes(subCheck.status) && (
              <p className="text-sm text-red-500 mb-4">
                {subCheck.status === 'EXPIRED' ? '구독이 만료되었습니다.' : '결제 실패로 구독이 정지되었습니다.'}
              </p>
            )}
            {subCheck.status && ['ACTIVE', 'CANCELED'].includes(subCheck.status) && subCheck.remainingCredits <= 0 && (
              <p className="text-sm text-amber-600 mb-4">
                사용 가능한 크레딧이 없습니다. 다음 결제일까지 기다려주세요.
              </p>
            )}
            <div className="space-y-3 mt-6">
              <Link
                href="/subscription/listing"
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Coins className="w-5 h-5" />
                구독 시작하기
              </Link>
              <Link
                href="/landlord"
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                돌아가기
              </Link>
            </div>
          </div>
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
            <Link href="/landlord" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">매물 등록</span>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {step} / {totalSteps}
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* 크레딧 정보 */}
      <div className="container mx-auto px-4 mt-4 max-w-2xl">
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <Coins className="w-4 h-4" />
          <span>잔여 크레딧: <strong>{subCheck.remainingCredits}개</strong></span>
          <span className="text-blue-400 mx-1">|</span>
          <span>이 매물을 등록하면 크레딧 1개가 차감됩니다.</span>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white rounded-xl border p-6 mb-6">
            {renderStep()}
          </div>

          {/* Navigation */}
          <div className="flex gap-4">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex-1 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                이전
              </button>
            )}
            {step < totalSteps ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 flex items-center justify-center gap-2"
              >
                다음
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    등록 중...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    매물 등록하기
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </main>
    </div>
  )
}
