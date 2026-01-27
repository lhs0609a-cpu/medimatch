'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import {
  ArrowLeft, Bell, Plus, Trash2, Edit2, Mail, Smartphone,
  MapPin, Building2, Target, BellRing, BellOff
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-6">알림 설정은 로그인이 필요합니다</p>
          <Link href="/login" className="btn-primary">
            로그인하기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/mypage" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">알림 설정</span>
              </div>
            </div>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary"
              >
                <Plus className="w-4 h-4" />
                새 알림
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {showForm ? (
          /* Alert Form */
          <div className="card p-6">
            <h2 className="text-lg font-bold text-foreground mb-6">
              {editingId ? '알림 수정' : '새 알림 만들기'}
            </h2>

            <div className="space-y-6">
              {/* Alert Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  알림 이름
                </label>
                <input
                  type="text"
                  value={alertName}
                  onChange={(e) => setAlertName(e.target.value)}
                  placeholder="예: 강남권 피부과"
                  className="input"
                />
              </div>

              {/* Regions */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  관심 지역
                </label>
                <div className="flex flex-wrap gap-2">
                  {seoulDistricts.map((region) => (
                    <button
                      key={region}
                      type="button"
                      onClick={() => toggleSelection(region, selectedRegions, setSelectedRegions)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        selectedRegions.includes(region)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clinic Types */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Building2 className="w-4 h-4 inline mr-1" />
                  관심 진료과목
                </label>
                <div className="flex flex-wrap gap-2">
                  {clinicTypes.map((clinic) => (
                    <button
                      key={clinic}
                      type="button"
                      onClick={() => toggleSelection(clinic, selectedClinics, setSelectedClinics)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        selectedClinics.includes(clinic)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {clinic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prospect Types */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  개원지 유형
                </label>
                <div className="flex gap-2 flex-wrap">
                  {prospectTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => toggleSelection(type.value, selectedTypes, setSelectedTypes)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        selectedTypes.includes(type.value)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Min Score */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Target className="w-4 h-4 inline mr-1" />
                  최소 적합도 점수: <span className="text-primary font-bold">{minScore}점</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>

              {/* Notification Methods */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  알림 방법
                </label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                    <input
                      type="checkbox"
                      checked={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.checked)}
                      className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                    />
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <span className="text-foreground">이메일 알림</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                    <input
                      type="checkbox"
                      checked={notifyPush}
                      onChange={(e) => setNotifyPush(e.target.checked)}
                      className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                    />
                    <Smartphone className="w-5 h-5 text-muted-foreground" />
                    <span className="text-foreground">푸시 알림</span>
                  </label>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={resetForm}
                  className="btn-secondary flex-1 py-3"
                >
                  취소
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="btn-primary flex-1 py-3"
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
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              </div>
            ) : alerts.length === 0 ? (
              <div className="card p-12 text-center">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <BellOff className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">알림이 없습니다</h3>
                <p className="text-muted-foreground mb-6">
                  새 개원지가 탐지되면 알림을 받아보세요
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="btn-primary"
                >
                  첫 알림 만들기
                </button>
              </div>
            ) : (
              alerts.map((alert: any) => (
                <div key={alert.id} className="card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        alert.is_active ? 'bg-green-100 dark:bg-green-900/30' : 'bg-secondary'
                      }`}>
                        {alert.is_active ? (
                          <BellRing className="w-5 h-5 text-green-600" />
                        ) : (
                          <BellOff className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{alert.name || '알림'}</h3>
                        <p className={`text-sm ${alert.is_active ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {alert.is_active ? '활성화됨' : '비활성화됨'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(alert)}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(alert.id)}
                        className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {alert.region_names?.length > 0 && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{alert.region_names.join(', ')}</span>
                      </div>
                    )}
                    {alert.clinic_types?.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{alert.clinic_types.join(', ')}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">최소 {alert.min_score}점 이상</span>
                    </div>
                    <div className="flex items-center gap-4 pt-2 border-t border-border mt-3">
                      {alert.notify_email && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="w-4 h-4" /> 이메일
                        </span>
                      )}
                      {alert.notify_push && (
                        <span className="flex items-center gap-1 text-muted-foreground">
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
