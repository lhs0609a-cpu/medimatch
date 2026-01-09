'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Briefcase, Building2, User, Upload, CheckCircle2,
  Loader2, MapPin, Package, Star, Save, Camera, AlertCircle
} from 'lucide-react'
import { salesMatchService } from '@/lib/api/services'
import { toast } from 'sonner'

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

const specialties = [
  '내과', '정형외과', '피부과', '성형외과', '안과', '이비인후과',
  '소아청소년과', '치과', '한의원', '신경외과', '비뇨의학과',
  '산부인과', '신경과', '정신건강의학과', '외과', '재활의학과'
]

const regions = [
  '서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산',
  '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'
]

export default function SalesProfilePage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    company: '',
    department: '',
    position: '',
    product_categories: [] as string[],
    product_details: '',
    target_specialties: [] as string[],
    service_regions: [] as string[],
    experience_years: 0,
    introduction: '',
    business_card_url: '',
  })

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['sales-profile'],
    queryFn: () => salesMatchService.getMyProfile(),
    retry: false,
  })

  const isNewProfile = !profile

  useEffect(() => {
    if (profile) {
      setFormData({
        company: profile.company || '',
        department: profile.department || '',
        position: profile.position || '',
        product_categories: profile.product_categories || [],
        product_details: profile.product_details || '',
        target_specialties: profile.target_specialties || [],
        service_regions: profile.service_regions || [],
        experience_years: profile.experience_years || 0,
        introduction: profile.introduction || '',
        business_card_url: profile.business_card_url || '',
      })
    }
  }, [profile])

  const createMutation = useMutation({
    mutationFn: salesMatchService.createProfile,
    onSuccess: () => {
      toast.success('프로필이 생성되었습니다.')
      queryClient.invalidateQueries({ queryKey: ['sales-profile'] })
      router.push('/sales')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || '프로필 생성에 실패했습니다.')
    },
  })

  const updateMutation = useMutation({
    mutationFn: salesMatchService.updateProfile,
    onSuccess: () => {
      toast.success('프로필이 수정되었습니다.')
      queryClient.invalidateQueries({ queryKey: ['sales-profile'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || '프로필 수정에 실패했습니다.')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.company) {
      toast.error('회사명은 필수입니다.')
      return
    }

    if (formData.product_categories.length === 0) {
      toast.error('제품 카테고리를 하나 이상 선택해주세요.')
      return
    }

    if (isNewProfile) {
      createMutation.mutate(formData)
    } else {
      updateMutation.mutate(formData)
    }
  }

  const toggleCategory = (value: string) => {
    setFormData(prev => ({
      ...prev,
      product_categories: prev.product_categories.includes(value)
        ? prev.product_categories.filter(c => c !== value)
        : [...prev.product_categories, value]
    }))
  }

  const toggleSpecialty = (value: string) => {
    setFormData(prev => ({
      ...prev,
      target_specialties: prev.target_specialties.includes(value)
        ? prev.target_specialties.filter(s => s !== value)
        : [...prev.target_specialties, value]
    }))
  }

  const toggleRegion = (value: string) => {
    setFormData(prev => ({
      ...prev,
      service_regions: prev.service_regions.includes(value)
        ? prev.service_regions.filter(r => r !== value)
        : [...prev.service_regions, value]
    }))
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/sales" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                {isNewProfile ? '프로필 설정' : '프로필 수정'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gray-400" />
              기본 정보
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  회사명 *
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="예: ABC 제약"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    부서
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="예: 영업부"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    직책
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="예: 과장"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  경력 (년)
                </label>
                <input
                  type="number"
                  value={formData.experience_years}
                  onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                  min={0}
                  max={50}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Product Categories */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-400" />
              취급 제품/서비스 *
            </h3>

            <div className="flex flex-wrap gap-2 mb-4">
              {productCategories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => toggleCategory(cat.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    formData.product_categories.includes(cat.value)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상세 설명 (선택)
              </label>
              <textarea
                value={formData.product_details}
                onChange={(e) => setFormData({ ...formData, product_details: e.target.value })}
                rows={3}
                placeholder="취급 제품이나 서비스에 대한 상세 설명"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Target Specialties */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-gray-400" />
              타겟 진료과목
            </h3>

            <div className="flex flex-wrap gap-2">
              {specialties.map((specialty) => (
                <button
                  key={specialty}
                  type="button"
                  onClick={() => toggleSpecialty(specialty)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    formData.target_specialties.includes(specialty)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {specialty}
                </button>
              ))}
            </div>
          </div>

          {/* Service Regions */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-400" />
              영업 지역
            </h3>

            <div className="flex flex-wrap gap-2">
              {regions.map((region) => (
                <button
                  key={region}
                  type="button"
                  onClick={() => toggleRegion(region)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    formData.service_regions.includes(region)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>

          {/* Introduction */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-400" />
              자기 소개
            </h3>

            <textarea
              value={formData.introduction}
              onChange={(e) => setFormData({ ...formData, introduction: e.target.value })}
              rows={4}
              placeholder="의사들에게 보여질 자기 소개를 작성해주세요."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Business Card */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-gray-400" />
              명함 이미지 (인증용)
            </h3>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {formData.business_card_url ? (
                <div className="space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                  <p className="text-green-600 font-medium">명함이 업로드되었습니다</p>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, business_card_url: '' })}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    다시 업로드
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <p className="text-gray-500">명함 이미지를 업로드하면 인증 배지가 부여됩니다</p>
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200">
                    <Upload className="w-4 h-4" />
                    업로드
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        // In a real app, this would upload to a server
                        const file = e.target.files?.[0]
                        if (file) {
                          // For now, just create a fake URL
                          setFormData({ ...formData, business_card_url: URL.createObjectURL(file) })
                        }
                      }}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Verification Info */}
          {!profile?.is_verified && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">인증 안내</p>
                <p>명함 또는 사업자등록증을 업로드하면 관리자 검토 후 인증 배지가 부여됩니다.</p>
                <p>인증된 영업사원은 의사에게 더 높은 신뢰를 줄 수 있습니다.</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {isNewProfile ? '프로필 생성' : '변경사항 저장'}
          </button>
        </form>
      </main>
    </div>
  )
}
