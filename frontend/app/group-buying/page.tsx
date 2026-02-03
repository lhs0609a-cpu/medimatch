'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Users, Calendar, TrendingDown, Clock, ArrowRight,
  CheckCircle, Building2, Stethoscope, Package,
  Calculator, ChevronRight, Sparkles, ShieldCheck
} from 'lucide-react'
import { groupBuyingService } from '@/lib/api/services'
import { CohortStatus, CohortSummary, GroupBuyingCategory } from '@/lib/api/client'

// 상태 뱃지 컴포넌트
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
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  )
}

// 진행률 바
function ProgressBar({ current, max }: { current: number; max: number }) {
  const percentage = Math.min((current / max) * 100, 100)

  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
      <motion.div
        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  )
}

// 카테고리 아이콘 매핑
const categoryIcons: Record<string, React.ReactNode> = {
  interior: <Building2 className="w-4 h-4" />,
  medical_equipment: <Stethoscope className="w-4 h-4" />,
  furniture: <Package className="w-4 h-4" />,
}

// 코호트 카드
function CohortCard({ cohort }: { cohort: CohortSummary }) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })
  }

  const formatDeadline = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  }

  return (
    <Link href={`/group-buying/${cohort.id}`}>
      <motion.div
        className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group"
        whileHover={{ y: -4 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <StatusBadge status={cohort.status} />
            <h3 className="mt-2 text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
              {cohort.name}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {formatDate(cohort.target_month)} 개원 예정자
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-orange-600 font-bold text-lg">
              <TrendingDown className="w-5 h-5" />
              평균 {(cohort.estimated_avg_savings / 10000).toFixed(0)}만원 절감
            </div>
          </div>
        </div>

        {/* 참여 현황 */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600 flex items-center gap-1">
              <Users className="w-4 h-4" />
              참여 현황
            </span>
            <span className="font-semibold text-gray-900">
              {cohort.participant_count} / {cohort.max_participants}명
            </span>
          </div>
          <ProgressBar current={cohort.participant_count} max={cohort.max_participants} />
        </div>

        {/* 카테고리 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {cohort.categories.slice(0, 4).map((cat) => (
            <span
              key={cat.id}
              className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs flex items-center gap-1"
            >
              {cat.icon || categoryIcons[cat.name] || <Package className="w-3 h-3" />}
              {cat.name}
              {cat.current_discount_rate && (
                <span className="text-green-600 font-medium">
                  -{cat.current_discount_rate}%
                </span>
              )}
            </span>
          ))}
          {cohort.categories.length > 4 && (
            <span className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs">
              +{cohort.categories.length - 4}개
            </span>
          )}
        </div>

        {/* 마감일 */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            {cohort.days_remaining > 0 ? (
              <span>
                마감까지 <strong className="text-red-600">{cohort.days_remaining}일</strong> ({formatDeadline(cohort.deadline)})
              </span>
            ) : (
              <span className="text-gray-500">모집 마감</span>
            )}
          </div>
          <span className="text-blue-600 flex items-center gap-1 text-sm font-medium group-hover:gap-2 transition-all">
            자세히 보기 <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </motion.div>
    </Link>
  )
}

// 통계 카드
function StatCard({
  icon,
  label,
  value,
  suffix = ''
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  suffix?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
          {icon}
        </div>
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">
        {typeof value === 'number' ? value.toLocaleString() : value}
        <span className="text-sm font-normal text-gray-500 ml-1">{suffix}</span>
      </div>
    </div>
  )
}

// 메인 페이지 컴포넌트
export default function GroupBuyingPage() {
  const [statusFilter, setStatusFilter] = useState<CohortStatus | 'all'>('all')

  // 코호트 목록 조회
  const { data: cohortsData, isLoading: cohortsLoading } = useQuery({
    queryKey: ['cohorts', statusFilter],
    queryFn: () => groupBuyingService.getCohorts({
      status: statusFilter === 'all' ? undefined : statusFilter,
      page: 1,
      limit: 10,
    }),
  })

  // 전체 통계 조회
  const { data: stats } = useQuery({
    queryKey: ['group-buying-stats'],
    queryFn: () => groupBuyingService.getTotalStats(),
  })

  // 카테고리 목록 조회
  const { data: categories } = useQuery({
    queryKey: ['group-buying-categories'],
    queryFn: () => groupBuyingService.getCategories(),
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* 히어로 섹션 */}
      <section className="pt-20 pb-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              개원 비용 절감의 새로운 방법
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              개원 공동구매
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              같은 시기에 개원 준비하는 의사분들과 함께 구매하여<br />
              <strong className="text-blue-600">최대 30% 할인</strong>받으세요
            </p>
          </motion.div>

          {/* 주요 특징 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
            {[
              { icon: <Users className="w-5 h-5" />, text: '30명+ 공동 구매력' },
              { icon: <ShieldCheck className="w-5 h-5" />, text: '검증된 우수 업체' },
              { icon: <TrendingDown className="w-5 h-5" />, text: '평균 15~30% 절감' },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white rounded-xl border border-gray-200 text-gray-700"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
              >
                <div className="text-blue-600">{item.icon}</div>
                <span className="font-medium">{item.text}</span>
              </motion.div>
            ))}
          </div>

          {/* 절감액 계산기 CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Link
              href="/group-buying/calculator"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all"
            >
              <Calculator className="w-5 h-5" />
              내 예상 절감액 계산하기
              <ChevronRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 통계 섹션 */}
      {stats && (
        <section className="py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={<Users className="w-5 h-5" />}
                label="총 참여자"
                value={stats.total_participants}
                suffix="명"
              />
              <StatCard
                icon={<TrendingDown className="w-5 h-5" />}
                label="총 절감액"
                value={(stats.total_savings / 100000000).toFixed(1)}
                suffix="억원"
              />
              <StatCard
                icon={<CheckCircle className="w-5 h-5" />}
                label="완료 코호트"
                value={stats.total_cohorts_completed}
                suffix="회"
              />
              <StatCard
                icon={<Calculator className="w-5 h-5" />}
                label="평균 절감액"
                value={(stats.avg_savings_per_participant / 10000).toFixed(0)}
                suffix="만원/인"
              />
            </div>
          </div>
        </section>
      )}

      {/* 코호트 목록 */}
      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* 필터 */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              참여 가능한 코호트
            </h2>
            <div className="flex gap-2">
              {[
                { value: 'all', label: '전체' },
                { value: 'recruiting', label: '모집중' },
                { value: 'in_progress', label: '진행중' },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value as CohortStatus | 'all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === filter.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* 코호트 그리드 */}
          {cohortsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-20 mb-3" />
                  <div className="h-5 bg-gray-200 rounded w-48 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-32 mb-4" />
                  <div className="h-2.5 bg-gray-200 rounded-full mb-4" />
                  <div className="flex gap-2 mb-4">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="h-6 bg-gray-200 rounded w-16" />
                    ))}
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-40" />
                </div>
              ))}
            </div>
          ) : cohortsData?.cohorts.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cohortsData.cohorts.map((cohort) => (
                <CohortCard key={cohort.id} cohort={cohort} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                현재 모집 중인 코호트가 없습니다
              </h3>
              <p className="text-gray-500 mb-4">
                새로운 코호트가 열리면 알림을 받아보세요
              </p>
              <button className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                알림 신청하기
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 참여 방법 */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            참여 방법
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: 1, icon: <Calendar className="w-6 h-6" />, title: '코호트 선택', desc: '개원 예정월에 맞는 코호트를 선택하세요' },
              { step: 2, icon: <CheckCircle className="w-6 h-6" />, title: '카테고리 선택', desc: '필요한 품목 카테고리를 선택하세요' },
              { step: 3, icon: <Users className="w-6 h-6" />, title: '참여 신청', desc: '간단한 정보 입력 후 참여 신청을 완료하세요' },
              { step: 4, icon: <TrendingDown className="w-6 h-6" />, title: '할인 혜택', desc: '인원이 모이면 자동으로 할인이 적용됩니다' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="relative inline-block mb-4">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mx-auto">
                    {item.icon}
                  </div>
                  <span className="absolute -top-1 -right-1 w-6 h-6 bg-blue-600 text-white rounded-full text-sm font-bold flex items-center justify-center">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 카테고리 미리보기 */}
      {categories && categories.length > 0 && (
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
              공동구매 품목
            </h2>
            <p className="text-gray-600 text-center mb-8">
              개원에 필요한 다양한 품목을 공동구매로 절약하세요
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white rounded-xl border border-gray-200 p-5 text-center hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                    {cat.icon || '📦'}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{cat.name}</h3>
                  <p className="text-sm text-gray-500 mb-2">{cat.description}</p>
                  {cat.base_discount_rate > 0 && (
                    <span className="text-green-600 font-medium text-sm">
                      최대 {cat.base_discount_rate}% 할인
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA 섹션 */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-lg text-blue-100 mb-8">
            개원 준비의 부담을 줄이고, 같은 꿈을 가진 동료들과 함께하세요
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/group-buying/calculator"
              className="px-8 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
            >
              내 절감액 계산하기
            </Link>
            <Link
              href="/auth/register?role=DOCTOR"
              className="px-8 py-3 bg-blue-700 text-white rounded-xl font-semibold hover:bg-blue-800 transition-colors"
            >
              회원가입 하기
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
