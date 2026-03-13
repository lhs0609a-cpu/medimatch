'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calculator, ArrowLeft, TrendingDown, Building2,
  CheckCircle, Sparkles, ArrowRight, RefreshCw
} from 'lucide-react'
import { groupBuyingService } from '@/lib/api/services'
import { toast } from 'sonner'
import { SavingsCalculation } from '@/lib/api/client'

export default function SavingsCalculatorPage() {
  const [formData, setFormData] = useState({
    specialty: '',
    size_pyeong: 30,
    category_ids: [] as string[],
  })

  const [result, setResult] = useState<SavingsCalculation | null>(null)

  // 카테고리 목록 조회
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['group-buying-categories'],
    queryFn: () => groupBuyingService.getCategories(),
  })

  // 계산 mutation
  const calculateMutation = useMutation({
    mutationFn: () => groupBuyingService.calculateSavings({
      specialty: formData.specialty,
      size_pyeong: formData.size_pyeong,
      category_ids: formData.category_ids,
    }),
    onSuccess: (data) => {
      setResult(data)
    },
    onError: () => {
      toast.error('계산에 실패했습니다. 다시 시도해주세요.')
    },
  })

  const handleCategoryToggle = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      category_ids: prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter((id) => id !== categoryId)
        : [...prev.category_ids, categoryId],
    }))
    setResult(null)
  }

  const handleCalculate = () => {
    if (!formData.specialty) {
      toast.info('진료과목을 선택해주세요')
      return
    }
    if (formData.category_ids.length === 0) {
      toast.info('최소 1개 카테고리를 선택해주세요')
      return
    }
    calculateMutation.mutate()
  }

  const specialties = [
    '내과', '외과', '정형외과', '신경외과', '성형외과', '피부과',
    '산부인과', '소아청소년과', '이비인후과', '안과', '치과', '한의원',
    '정신건강의학과', '비뇨의학과', '재활의학과', '영상의학과', '기타'
  ]

  const formatPrice = (price: number) => {
    if (price >= 100000000) {
      return `${(price / 100000000).toFixed(1)}억원`
    }
    return `${(price / 10000).toLocaleString()}만원`
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link
            href="/group-buying"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" /> 공동구매
          </Link>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 타이틀 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl text-blue-600 mb-4">
            <Calculator className="w-8 h-8" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            절감액 계산기
          </h1>
          <p className="text-gray-600">
            공동구매 참여 시 예상 절감액을 계산해보세요
          </p>
        </div>

        {/* 입력 폼 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          {/* 진료과목 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              진료과목
            </label>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {specialties.map((specialty) => (
                <button
                  key={specialty}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, specialty })
                    setResult(null)
                  }}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    formData.specialty === specialty
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {specialty}
                </button>
              ))}
            </div>
          </div>

          {/* 평수 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              예상 평수: <span className="text-blue-600 font-bold">{formData.size_pyeong}평</span>
            </label>
            <input
              type="range"
              min="10"
              max="200"
              step="5"
              value={formData.size_pyeong}
              onChange={(e) => {
                setFormData({ ...formData, size_pyeong: parseInt(e.target.value) })
                setResult(null)
              }}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>10평</span>
              <span>100평</span>
              <span>200평</span>
            </div>
          </div>

          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              관심 품목 카테고리 (복수 선택)
            </label>
            {categoriesLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {categories?.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryToggle(cat.id)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      formData.category_ids.includes(cat.id)
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{cat.icon || '📦'}</span>
                      <span className="font-semibold text-gray-900">{cat.name}</span>
                    </div>
                    {cat.market_avg_price_per_pyeong && (
                      <p className="text-xs text-gray-500">
                        시장 평균: {(cat.market_avg_price_per_pyeong / 10000).toLocaleString()}만원/평
                      </p>
                    )}
                    {cat.base_discount_rate > 0 && (
                      <p className="text-xs text-green-600 font-medium mt-1">
                        최대 {cat.base_discount_rate}% 할인
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 계산 버튼 */}
        <button
          onClick={handleCalculate}
          disabled={calculateMutation.isPending}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {calculateMutation.isPending ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              계산 중...
            </>
          ) : (
            <>
              <Calculator className="w-5 h-5" />
              예상 절감액 계산하기
            </>
          )}
        </button>

        {/* 결과 */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8"
            >
              {/* 총 절감액 요약 */}
              <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-6 h-6" />
                  <span className="font-semibold">예상 절감액</span>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-bold mb-2">
                    {formatPrice(result.total_savings)}
                  </div>
                  <p className="text-orange-100">
                    개별 구매 대비 절감 금액
                  </p>
                </div>
              </div>

              {/* 상세 내역 */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="font-semibold text-gray-900">상세 내역</h3>
                </div>
                <div className="p-4">
                  {/* 금액 요약 */}
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600">개별 구매 시</span>
                    <span className="text-gray-900 font-medium line-through">
                      {formatPrice(result.original_estimate)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600">공동구매 가격</span>
                    <span className="text-blue-600 font-bold text-lg">
                      {formatPrice(result.discounted_estimate)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 bg-green-50 -mx-4 px-4">
                    <span className="text-green-700 font-medium flex items-center gap-2">
                      <TrendingDown className="w-5 h-5" />
                      총 절감액
                    </span>
                    <span className="text-green-600 font-bold text-xl">
                      -{formatPrice(result.total_savings)}
                    </span>
                  </div>
                </div>

                {/* 카테고리별 상세 */}
                <div className="border-t border-gray-200">
                  <div className="p-4 bg-gray-50">
                    <h4 className="font-medium text-gray-700 text-sm">카테고리별 절감</h4>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {result.breakdown.map((item) => (
                      <div key={item.category_id} className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-900">{item.category_name}</span>
                          <span className="text-green-600 font-semibold">
                            -{(item.discount_rate * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>
                            {formatPrice(item.original)} → {formatPrice(item.discounted)}
                          </span>
                          <span className="text-green-600">
                            -{formatPrice(item.savings)} 절감
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-6 text-center">
                <Link
                  href="/group-buying"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  공동구매 참여하기
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <p className="text-sm text-gray-500 mt-3">
                  * 실제 절감액은 참여 인원과 업체 협상 결과에 따라 달라질 수 있습니다
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 안내 문구 */}
        {!result && (
          <div className="mt-8 text-center text-gray-500 text-sm">
            <p>* 계산 결과는 예상치이며, 실제 금액은 달라질 수 있습니다</p>
            <p>* 공동구매 참여 인원에 따라 할인율이 조정됩니다</p>
          </div>
        )}
      </div>
    </div>
  )
}
