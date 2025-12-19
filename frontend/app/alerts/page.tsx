'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import {
  ArrowLeft, Bell, Plus, Trash2, Edit2, Mail, Smartphone,
  MapPin, Building2, Target, Check, X
} from 'lucide-react'
import { alertsService } from '@/lib/api/services'
import { useAuth } from '@/lib/hooks/useAuth'
import { toast } from 'sonner'

const regions = [
  { code: '11', name: '서울' },
  { code: '26', name: '부산' },
  { code: '27', name: '대구' },
  { code: '28', name: '인천' },
  { code: '29', name: '광주' },
  { code: '30', name: '대전' },
  { code: '31', name: '울산' },
  { code: '41', name: '경기' },
]

const seoulDistricts = [
  '강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구',
  '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구',
  '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'
]

const clinicTypes = [
  '내과', '정형외과', '피부과', '성형외과', '이비인후과',
  '소아청소년과', '안과', '치과', '산부인과', '비뇨의학과'
]

const prospectTypes = [
  { value: 'NEW_BUILD', label: '신축' },
  { value: 'VACANCY', label: '공실' },
  { value: 'RELOCATION', label: '이전예정' },
]

export default function AlertsPage() {
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form state
  const [alertName, setAlertName] = useState('')
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])
  const [selectedClinics, setSelectedClinics] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [minScore, setMinScore] = useState(60)
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [notifyPush, setNotifyPush] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: alertsService.getAll,
    enabled: isAuthenticated,
  })

  const createMutation = useMutation({
    mutationFn: alertsService.create,
    onSuccess: () => {
      toast.success('알림이 생성되었습니다')
      resetForm()
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
    onError: () => toast.error('알림 생성에 실패했습니다'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => alertsService.update(id, data),
    onSuccess: () => {
      toast.success('알림이 수정되었습니다')
      resetForm()
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
    onError: () => toast.error('알림 수정에 실패했습니다'),
  })

  const deleteMutation = useMutation({
    mutationFn: alertsService.delete,
    onSuccess: () => {
      toast.success('알림이 삭제되었습니다')
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
    onError: () => toast.error('알림 삭제에 실패했습니다'),
  })

  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setAlertName('')
    setSelectedRegions([])
    setSelectedClinics([])
    setSelectedTypes([])
    setMinScore(60)
    setNotifyEmail(true)
    setNotifyPush(false)
  }

  const handleSubmit = () => {
    const alertData = {
      name: alertName || '새 알림',
      region_names: selectedRegions,
      clinic_types: selectedClinics,
      prospect_types: selectedTypes,
      min_score: minScore,
      notify_email: notifyEmail,
      notify_push: notifyPush,
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: alertData })
    } else {
      createMutation.mutate(alertData)
    }
  }

  const handleEdit = (alert: any) => {
    setEditingId(alert.id)
    setAlertName(alert.name || '')
    setSelectedRegions(alert.region_names || [])
    setSelectedClinics(alert.clinic_types || [])
    setSelectedTypes(alert.prospect_types || [])
    setMinScore(alert.min_score || 60)
    setNotifyEmail(alert.notify_email)
    setNotifyPush(alert.notify_push)
    setShowForm(true)
  }

  const toggleSelection = (item: string, list: string[], setList: (l: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item))
    } else {
      setList([...list, item])
    }
  }

  const alerts = data?.items || []

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">알림 설정은 로그인이 필요합니다</p>
          <Link href="/login" className="bg-green-600 text-white px-6 py-3 rounded-xl font-medium">
            로그인하기
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
            <Link href="/prospects" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-green-600" />
              <span className="font-medium text-gray-900">알림 설정</span>
            </div>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              새 알림
            </button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {showForm ? (
          /* Alert Form */
          <div className="bg-white rounded-2xl border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">
              {editingId ? '알림 수정' : '새 알림 만들기'}
            </h2>

            <div className="space-y-6">
              {/* Alert Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  알림 이름
                </label>
                <input
                  type="text"
                  value={alertName}
                  onChange={(e) => setAlertName(e.target.value)}
                  placeholder="예: 강남권 피부과"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Regions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  관심 지역
                </label>
                <div className="flex flex-wrap gap-2">
                  {seoulDistricts.map((region) => (
                    <button
                      key={region}
                      type="button"
                      onClick={() => toggleSelection(region, selectedRegions, setSelectedRegions)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                        selectedRegions.includes(region)
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clinic Types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building2 className="w-4 h-4 inline mr-1" />
                  관심 진료과목
                </label>
                <div className="flex flex-wrap gap-2">
                  {clinicTypes.map((clinic) => (
                    <button
                      key={clinic}
                      type="button"
                      onClick={() => toggleSelection(clinic, selectedClinics, setSelectedClinics)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                        selectedClinics.includes(clinic)
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {clinic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prospect Types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  개원지 유형
                </label>
                <div className="flex gap-2">
                  {prospectTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => toggleSelection(type.value, selectedTypes, setSelectedTypes)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                        selectedTypes.includes(type.value)
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Min Score */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Target className="w-4 h-4 inline mr-1" />
                  최소 적합도 점수: {minScore}점
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>

              {/* Notification Methods */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  알림 방법
                </label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span>이메일 알림</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyPush}
                      onChange={(e) => setNotifyPush(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <Smartphone className="w-5 h-5 text-gray-400" />
                    <span>푸시 알림</span>
                  </label>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={resetForm}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Alerts List */
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto" />
              </div>
            ) : alerts.length === 0 ? (
              <div className="bg-white rounded-2xl border p-12 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">알림이 없습니다</h3>
                <p className="text-gray-600 mb-6">
                  새 개원지가 탐지되면 알림을 받아보세요
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700"
                >
                  첫 알림 만들기
                </button>
              </div>
            ) : (
              alerts.map((alert: any) => (
                <div key={alert.id} className="bg-white rounded-2xl border p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        alert.is_active ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <Bell className={`w-5 h-5 ${alert.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{alert.name || '알림'}</h3>
                        <p className="text-sm text-gray-500">
                          {alert.is_active ? '활성화됨' : '비활성화됨'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(alert)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(alert.id)}
                        className="p-2 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {alert.region_names?.length > 0 && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{alert.region_names.join(', ')}</span>
                      </div>
                    )}
                    {alert.clinic_types?.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{alert.clinic_types.join(', ')}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">최소 {alert.min_score}점 이상</span>
                    </div>
                    <div className="flex items-center gap-4 pt-2">
                      {alert.notify_email && (
                        <span className="flex items-center gap-1 text-gray-500">
                          <Mail className="w-4 h-4" /> 이메일
                        </span>
                      )}
                      {alert.notify_push && (
                        <span className="flex items-center gap-1 text-gray-500">
                          <Smartphone className="w-4 h-4" /> 푸시
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}
