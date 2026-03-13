'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Calendar, TrendingDown, Clock, ArrowLeft,
  CheckCircle, Building2, Stethoscope, Package, Star,
  Calculator, X, ChevronDown, ChevronUp, Phone, Mail,
  AlertCircle, Sparkles, MapPin
} from 'lucide-react'
import { groupBuyingService, authService } from '@/lib/api/services'
import { toast } from 'sonner'
import { CohortStatus, GroupBuyingCategory } from '@/lib/api/client'

// 상태 뱃지
function StatusBadge({ status }: { status: CohortStatus }) {
  const styles: Record<CohortStatus, { bg: string; text: string; label: string }> = {
    recruiting: { bg: 'bg-green-100', text: 'text-green-700', label: '모집중' },
    closed: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '모집마감' },
    in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', label: '진행중' },
    completed: { bg: 'bg-gray-100', text: 'text-gray-700', label: '완료' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: '취소됨' },
  }
  const style = styles[status] || styles.recruiting

  return (
    <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  )
}

// 진행률 바
function ProgressBar({ current, max }: { current: number; max: number }) {
  const percentage = Math.min((current / max) * 100, 100)

  return (
    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
      <motion.div
        className="h-full bg-gradient-to-r from-blue-500 to-blue-700 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  )
}

// 참여 신청 모달
function JoinModal({
  isOpen,
  onClose,
  cohortId,
  categories,
}: {
  isOpen: boolean
  onClose: () => void
  cohortId: string
  categories: GroupBuyingCategory[]
}) {
  const queryClient = useQueryClient()
  const router = useRouter()

  const [formData, setFormData] = useState({
    opening_date: '',
    region: '',
    district: '',
    specialty: '',
    size_pyeong: 30,
    category_ids: [] as string[],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // 참여 신청 mutation
  const joinMutation = useMutation({
    mutationFn: () => groupBuyingService.joinCohort(cohortId, formData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cohort', cohortId] })
      queryClient.invalidateQueries({ queryKey: ['my-participations'] })
      toast.success('참여 신청이 완료되었습니다!', { description: `예상 절감액: ${(data.estimated_savings / 10000).toLocaleString()}만원` })
      onClose()
    },
    onError: (error: any) => {
      if (error.response?.status === 401) {
        toast.info('로그인이 필요합니다.')
        router.push('/auth/login?redirect=/group-buying/' + cohortId)
      } else {
        toast.error(error.response?.data?.detail || '참여 신청에 실패했습니다.')
      }
    },
  })

  const handleCategoryToggle = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      category_ids: prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter((id) => id !== categoryId)
        : [...prev.category_ids, categoryId],
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.opening_date) newErrors.opening_date = '개원 예정일을 선택해주세요'
    if (!formData.region) newErrors.region = '지역을 선택해주세요'
    if (!formData.district) newErrors.district = '상세 지역을 입력해주세요'
    if (!formData.specialty) newErrors.specialty = '진료과목을 선택해주세요'
    if (formData.size_pyeong < 10) newErrors.size_pyeong = '평수는 10평 이상이어야 합니다'
    if (formData.category_ids.length === 0) newErrors.category_ids = '최소 1개 카테고리를 선택해주세요'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      joinMutation.mutate()
    }
  }

  const specialties = [
    '내과', '외과', '정형외과', '신경외과', '성형외과', '피부과',
    '산부인과', '소아청소년과', '이비인후과', '안과', '치과', '한의원',
    '정신건강의학과', '비뇨의학과', '재활의학과', '영상의학과', '기타'
  ]

  const regions = [
    '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
    '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'
  ]

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="sticky top-0 bg-white p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">참여 신청</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* 폼 */}
          <div className="p-6 space-y-5">
            {/* 개원 예정일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                개원 예정일 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.opening_date}
                onChange={(e) => setFormData({ ...formData, opening_date: e.target.value })}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.opening_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.opening_date && (
                <p className="mt-1 text-sm text-red-500">{errors.opening_date}</p>
              )}
            </div>

            {/* 지역 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  시/도 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.region ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">선택</option>
                  {regions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  구/군 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="예: 강남구"
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.district ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
            </div>

            {/* 진료과목 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                진료과목 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.specialty ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">선택</option>
                {specialties.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* 평수 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                예상 평수 <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="5"
                  value={formData.size_pyeong}
                  onChange={(e) => setFormData({ ...formData, size_pyeong: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-lg font-semibold text-gray-900 w-20 text-right">
                  {formData.size_pyeong}평
                </span>
              </div>
            </div>

            {/* 카테고리 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                관심 카테고리 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryToggle(cat.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      formData.category_ids.includes(cat.id)
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{cat.icon || '📦'}</span>
                      <span className="font-medium text-gray-900">{cat.name}</span>
                    </div>
                    {cat.base_discount_rate > 0 && (
                      <span className="text-xs text-green-600 mt-1 block">
                        최대 {cat.base_discount_rate}% 할인
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {errors.category_ids && (
                <p className="mt-1 text-sm text-red-500">{errors.category_ids}</p>
              )}
            </div>
          </div>

          {/* 푸터 */}
          <div className="sticky bottom-0 bg-white p-6 border-t border-gray-200">
            <button
              onClick={handleSubmit}
              disabled={joinMutation.isPending}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {joinMutation.isPending ? '처리 중...' : '참여 신청하기'}
            </button>
            <p className="text-xs text-gray-500 text-center mt-3">
              참여 신청 후 언제든지 취소할 수 있습니다
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// 업체 카드
function VendorCard({ vendor }: { vendor: any }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start gap-4">
        {vendor.vendor.logo_url ? (
          <img
            src={vendor.vendor.logo_url}
            alt={vendor.vendor.name}
            className="w-16 h-16 rounded-lg object-cover"
          />
        ) : (
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
            <Building2 className="w-8 h-8 text-gray-400" />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900">{vendor.vendor.name}</h4>
            {vendor.vendor.is_verified && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                인증업체
              </span>
            )}
            {vendor.is_selected && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> 선정
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span>{vendor.vendor.rating.toFixed(1)}</span>
            <span className="text-gray-300">|</span>
            <span>리뷰 {vendor.vendor.review_count}개</span>
          </div>
          {vendor.discount_rate && (
            <div className="text-green-600 font-medium">
              {vendor.discount_rate}% 할인 제공
            </div>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mt-4 pt-4 border-t border-gray-100"
        >
          {vendor.vendor.description && (
            <p className="text-sm text-gray-600 mb-3">{vendor.vendor.description}</p>
          )}
          {vendor.vendor.features && vendor.vendor.features.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {vendor.vendor.features.map((feature: string, idx: number) => (
                <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                  {feature}
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            {vendor.vendor.website_url && (
              <a
                href={vendor.vendor.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                웹사이트 방문
              </a>
            )}
            {vendor.vendor.contact_phone && (
              <a
                href={`tel:${vendor.vendor.contact_phone}`}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-1"
              >
                <Phone className="w-4 h-4" /> 전화
              </a>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}

// 메인 상세 페이지
export default function CohortDetailPage() {
  const params = useParams()
  const router = useRouter()
  const cohortId = params.id as string
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  // 코호트 상세 조회
  const { data: cohort, isLoading, error } = useQuery({
    queryKey: ['cohort', cohortId],
    queryFn: () => groupBuyingService.getCohort(cohortId),
    enabled: !!cohortId,
  })

  // 코호트 통계 조회
  const { data: stats } = useQuery({
    queryKey: ['cohort-stats', cohortId],
    queryFn: () => groupBuyingService.getCohortStats(cohortId),
    enabled: !!cohortId,
  })

  // 내 참여 여부 확인
  const { data: myParticipations } = useQuery({
    queryKey: ['my-participations'],
    queryFn: () => groupBuyingService.getMyParticipations(),
  })

  const myParticipation = myParticipations?.participations.find(
    (p) => p.cohort_id === cohortId
  )

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })
  }

  const formatDeadline = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-8 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-24 mb-4" />
            <div className="h-8 bg-gray-200 rounded w-64 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-40 mb-6" />
            <div className="h-40 bg-gray-200 rounded mb-6" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !cohort) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 px-4">
        <div className="max-w-4xl mx-auto text-center py-16">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            코호트를 찾을 수 없습니다
          </h2>
          <p className="text-gray-500 mb-6">
            요청하신 코호트가 존재하지 않거나 삭제되었습니다
          </p>
          <Link
            href="/group-buying"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium"
          >
            <ArrowLeft className="w-5 h-5" /> 목록으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            href="/group-buying"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" /> 공동구매 목록
          </Link>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 코호트 정보 카드 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <StatusBadge status={cohort.status} />
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-3">
                {cohort.name}
              </h1>
              <p className="text-gray-500 mt-1">
                {formatDate(cohort.target_month)} 개원 예정자
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-orange-600">
                평균 {(cohort.estimated_avg_savings / 10000).toFixed(0)}만원
              </div>
              <p className="text-sm text-gray-500">예상 절감액</p>
            </div>
          </div>

          {/* 참여 현황 */}
          <div className="bg-gray-50 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-600 flex items-center gap-2">
                <Users className="w-5 h-5" />
                참여 현황
              </span>
              <span className="text-lg font-bold text-gray-900">
                {cohort.participant_count} / {cohort.max_participants}명
              </span>
            </div>
            <ProgressBar current={cohort.participant_count} max={cohort.max_participants} />
            <p className="text-sm text-gray-500 mt-2">
              {cohort.min_participants}명 이상 모집 시 진행됩니다
            </p>
          </div>

          {/* 마감일 */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-5 h-5" />
              <span>모집 마감:</span>
              <strong className="text-gray-900">{formatDeadline(cohort.deadline)}</strong>
            </div>
            {cohort.days_remaining > 0 && (
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                D-{cohort.days_remaining}
              </span>
            )}
          </div>

          {/* 설명 */}
          {cohort.description && (
            <p className="text-gray-600 mb-6">{cohort.description}</p>
          )}

          {/* CTA 버튼 */}
          {myParticipation ? (
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-blue-700 mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">참여 중</span>
              </div>
              <p className="text-sm text-blue-600 mb-3">
                예상 절감액: {((myParticipation.estimated_savings || 0) / 10000).toLocaleString()}만원
              </p>
              <Link
                href="/mypage/group-buying"
                className="text-sm text-blue-700 font-medium hover:underline"
              >
                내 참여 정보 보기 →
              </Link>
            </div>
          ) : cohort.status === 'recruiting' ? (
            <button
              onClick={() => setIsJoinModalOpen(true)}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              참여 신청하기
            </button>
          ) : (
            <div className="text-center py-4 bg-gray-100 rounded-xl text-gray-500">
              현재 모집이 진행되지 않습니다
            </div>
          )}
        </div>

        {/* 통계 카드 */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {stats.participant_count}명
              </div>
              <div className="text-sm text-gray-500">현재 참여자</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {stats.progress_percent.toFixed(0)}%
              </div>
              <div className="text-sm text-gray-500">목표 달성률</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {(stats.total_estimated_savings / 100000000).toFixed(1)}억
              </div>
              <div className="text-sm text-gray-500">총 예상 절감액</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {(stats.avg_savings_per_participant / 10000).toFixed(0)}만
              </div>
              <div className="text-sm text-gray-500">인당 평균 절감</div>
            </div>
          </div>
        )}

        {/* 카테고리별 업체 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            참여 카테고리 & 업체
          </h2>
          <div className="space-y-4">
            {cohort.categories.map((category) => (
              <div key={category.id} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedCategory(
                    expandedCategory === category.id ? null : category.id
                  )}
                  className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{category.icon || '📦'}</span>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">{category.name}</div>
                      {category.current_discount_rate && (
                        <div className="text-sm text-green-600">
                          현재 {category.current_discount_rate}% 할인
                        </div>
                      )}
                    </div>
                  </div>
                  {expandedCategory === category.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                <AnimatePresence>
                  {expandedCategory === category.id && cohort.vendors_by_category[category.id] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="p-4 space-y-3"
                    >
                      {cohort.vendors_by_category[category.id].length > 0 ? (
                        cohort.vendors_by_category[category.id].map((vendor: any) => (
                          <VendorCard key={vendor.id} vendor={vendor} />
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-4">
                          아직 등록된 업체가 없습니다
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 참여 신청 모달 */}
      <JoinModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        cohortId={cohortId}
        categories={cohort.categories}
      />
    </div>
  )
}
