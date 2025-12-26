'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Pill, User, MapPin, DollarSign, Briefcase,
  Save, Loader2, AlertCircle, Check, Edit2
} from 'lucide-react'
import { pharmacyMatchService } from '@/lib/api/services'

const regions = [
  { code: '서울', name: '서울' },
  { code: '경기', name: '경기' },
  { code: '인천', name: '인천' },
  { code: '부산', name: '부산' },
  { code: '대구', name: '대구' },
  { code: '대전', name: '대전' },
  { code: '광주', name: '광주' },
  { code: '울산', name: '울산' },
  { code: '세종', name: '세종' },
]

const pharmacyTypes = ['일반약국', '조제전문', '한약국', '병원약국']
const hospitalTypes = [
  '내과', '정형외과', '피부과', '이비인후과', '소아청소년과',
  '안과', '치과', '산부인과', '비뇨기과', '신경외과', '외과'
]
const specialtyAreas = ['조제', '한약', '복약상담', '건강기능식품', '피부/미용']

export default function ProfilePage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const [formData, setFormData] = useState({
    preferred_regions: [] as string[],
    preferred_region_names: [] as string[],
    budget_min: 0,
    budget_max: 0,
    preferred_area_min: 0,
    preferred_area_max: 0,
    preferred_revenue_min: 0,
    preferred_revenue_max: 0,
    experience_years: 0,
    license_year: undefined as number | undefined,
    has_management_experience: false,
    specialty_areas: [] as string[],
    preferred_pharmacy_types: [] as string[],
    preferred_hospital_types: [] as string[],
    introduction: '',
    full_name: '',
    phone: '',
    email: '',
    license_number: '',
  })

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['pharmacy-match-my-profile'],
    queryFn: pharmacyMatchService.getMyProfile,
    retry: false,
  })

  const createMutation = useMutation({
    mutationFn: pharmacyMatchService.createProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-match-my-profile'] })
      setIsCreating(false)
      setIsEditing(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: pharmacyMatchService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-match-my-profile'] })
      setIsEditing(false)
    },
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        preferred_regions: profile.preferred_regions || [],
        preferred_region_names: profile.preferred_region_names || [],
        budget_min: profile.budget_min || 0,
        budget_max: profile.budget_max || 0,
        preferred_area_min: profile.preferred_area_min || 0,
        preferred_area_max: profile.preferred_area_max || 0,
        preferred_revenue_min: profile.preferred_revenue_min || 0,
        preferred_revenue_max: profile.preferred_revenue_max || 0,
        experience_years: profile.experience_years || 0,
        license_year: profile.license_year,
        has_management_experience: profile.has_management_experience || false,
        specialty_areas: profile.specialty_areas || [],
        preferred_pharmacy_types: profile.preferred_pharmacy_types || [],
        preferred_hospital_types: profile.preferred_hospital_types || [],
        introduction: profile.introduction || '',
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        email: profile.email || '',
        license_number: profile.license_number || '',
      })
    } else if (error) {
      setIsCreating(true)
    }
  }, [profile, error])

  const updateForm = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const toggleArrayItem = (field: keyof typeof formData, item: string) => {
    const arr = formData[field] as string[]
    if (arr.includes(item)) {
      updateForm({ [field]: arr.filter(i => i !== item) })
    } else {
      updateForm({ [field]: [...arr, item] })
    }
  }

  const toggleRegion = (region: { code: string; name: string }) => {
    const codes = formData.preferred_regions
    const names = formData.preferred_region_names
    if (codes.includes(region.code)) {
      updateForm({
        preferred_regions: codes.filter(c => c !== region.code),
        preferred_region_names: names.filter(n => n !== region.name),
      })
    } else {
      updateForm({
        preferred_regions: [...codes, region.code],
        preferred_region_names: [...names, region.name],
      })
    }
  }

  const handleSave = () => {
    const data = {
      ...formData,
      preferred_revenue_min: formData.preferred_revenue_min * 10000,
      preferred_revenue_max: formData.preferred_revenue_max * 10000,
    }

    if (isCreating) {
      createMutation.mutate(data)
    } else {
      updateMutation.mutate(data)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">프로필을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  const showForm = isEditing || isCreating

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/pharmacy-match" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">내 프로필</span>
            </div>
          </div>
          {profile && !showForm && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 text-purple-600 hover:text-purple-700"
            >
              <Edit2 className="w-4 h-4" />
              수정
            </button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Profile Card or Form */}
        {showForm ? (
          <div className="space-y-6">
            {/* Info Banner */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <p className="text-sm text-purple-800">
                <strong>프로필 정보는 익명으로 표시됩니다.</strong><br />
                실명, 연락처, 면허번호는 매칭 성사 후에만 상대방에게 공개됩니다.
              </p>
            </div>

            {/* 희망 지역 */}
            <div className="bg-white rounded-2xl border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-600" />
                희망 지역
              </h2>
              <div className="flex flex-wrap gap-2">
                {regions.map((region) => (
                  <button
                    key={region.code}
                    onClick={() => toggleRegion(region)}
                    className={`px-4 py-2 rounded-lg border text-sm transition ${
                      formData.preferred_regions.includes(region.code)
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-purple-300'
                    }`}
                  >
                    {region.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 예산 */}
            <div className="bg-white rounded-2xl border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-purple-600" />
                예산 (만원)
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">최소</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.budget_min || ''}
                    onChange={(e) => updateForm({ budget_min: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">최대</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.budget_max || ''}
                    onChange={(e) => updateForm({ budget_max: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* 경력 */}
            <div className="bg-white rounded-2xl border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-600" />
                경력 정보
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">약사 경력 (년)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.experience_years || ''}
                      onChange={(e) => updateForm({ experience_years: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">면허 취득 연도</label>
                    <input
                      type="number"
                      min="1950"
                      max={new Date().getFullYear()}
                      value={formData.license_year || ''}
                      onChange={(e) => updateForm({ license_year: parseInt(e.target.value) || undefined })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.has_management_experience}
                    onChange={(e) => updateForm({ has_management_experience: e.target.checked })}
                    className="w-5 h-5 text-purple-600 rounded"
                  />
                  <span className="text-gray-700">약국 운영 경험 있음</span>
                </label>
              </div>
            </div>

            {/* 선호 사항 */}
            <div className="bg-white rounded-2xl border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">선호 사항</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">선호 약국 유형</label>
                  <div className="flex flex-wrap gap-2">
                    {pharmacyTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => toggleArrayItem('preferred_pharmacy_types', type)}
                        className={`px-3 py-1.5 rounded-full text-sm transition ${
                          formData.preferred_pharmacy_types.includes(type)
                            ? 'bg-purple-100 text-purple-700 border border-purple-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">전문 분야</label>
                  <div className="flex flex-wrap gap-2">
                    {specialtyAreas.map((area) => (
                      <button
                        key={area}
                        onClick={() => toggleArrayItem('specialty_areas', area)}
                        className={`px-3 py-1.5 rounded-full text-sm transition ${
                          formData.specialty_areas.includes(area)
                            ? 'bg-purple-100 text-purple-700 border border-purple-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 비공개 정보 */}
            <div className="bg-white rounded-2xl border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                비공개 정보
                <span className="text-sm font-normal text-gray-500 ml-2">(매칭 후 공개)</span>
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">이름</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => updateForm({ full_name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">연락처</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateForm({ phone: e.target.value })}
                    placeholder="010-1234-5678"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">이메일</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateForm({ email: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* 자기소개 */}
            <div className="bg-white rounded-2xl border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">자기소개</h2>
              <textarea
                value={formData.introduction}
                onChange={(e) => updateForm({ introduction: e.target.value })}
                rows={4}
                placeholder="간단한 자기소개를 작성해주세요 (개인정보 자동 마스킹)"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setIsEditing(false)
                  setIsCreating(false)
                }}
                className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                저장
              </button>
            </div>
          </div>
        ) : profile ? (
          /* Display Profile */
          <div className="bg-white rounded-2xl border overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-lg font-bold">{profile.anonymous_id}</p>
                  <p className="text-purple-100">
                    경력 {profile.experience_years}년
                    {profile.has_management_experience && ' · 운영 경험 있음'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">희망 지역</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.preferred_region_names.map((region) => (
                    <span key={region} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                      {region}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">예산</h3>
                <p className="text-lg font-bold text-gray-900">
                  {profile.budget_min?.toLocaleString()} ~ {profile.budget_max?.toLocaleString()}만원
                </p>
              </div>

              {profile.specialty_areas.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">전문 분야</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.specialty_areas.map((area) => (
                      <span key={area} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.introduction && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">자기소개</h3>
                  <p className="text-gray-700">{profile.introduction}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">프로필이 없습니다</h3>
            <p className="text-gray-600 mb-4">프로필을 등록하고 약국 매물을 찾아보세요</p>
            <button
              onClick={() => setIsCreating(true)}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
            >
              프로필 등록하기
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
