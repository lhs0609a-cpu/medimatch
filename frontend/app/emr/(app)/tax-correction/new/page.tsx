'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  ArrowLeft,
  Brain,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  FileText,
  Upload,
  Eye,
  Plus,
  X,
  Loader2,
  Info,
  Shield,
  Calculator,
  ChevronDown,
  ChevronUp,
  Check,
  User,
  Percent,
  Building2,
} from 'lucide-react'
import { TossIcon } from '@/components/ui/TossIcon'

/* ─── API ─── */
const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

async function fetchApi(path: string, options?: RequestInit) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

/* ─── 타입 ─── */
interface DeductionCategory {
  id: string
  name: string
  description: string
  estimated_amount: number
  ai_suggested: boolean
  ai_confidence: number
  selected: boolean
  custom_amount: number | null
}

interface DocumentItem {
  id: string
  deduction_id: string
  name: string
  required: boolean
  uploaded: boolean
  ocr_status: 'pending' | 'processing' | 'completed' | 'failed'
  file_name?: string
}

type ReviewStatus = 'not_submitted' | 'submitted' | 'in_review' | 'approved' | 'revision_needed'

/* ─── 기본 공제 카테고리 (19개) ─── */
const defaultCategories: DeductionCategory[] = [
  { id: 'D01', name: '근로소득공제', description: '총급여에 따른 기본 공제', estimated_amount: 0, ai_suggested: false, ai_confidence: 0, selected: false, custom_amount: null },
  { id: 'D02', name: '인적공제 (기본)', description: '본인, 배우자, 부양가족 공제', estimated_amount: 1500000, ai_suggested: true, ai_confidence: 95, selected: true, custom_amount: null },
  { id: 'D03', name: '인적공제 (추가)', description: '경로우대, 장애인, 부녀자, 한부모', estimated_amount: 0, ai_suggested: false, ai_confidence: 0, selected: false, custom_amount: null },
  { id: 'D04', name: '국민연금 보험료', description: '국민연금 납입액 전액 공제', estimated_amount: 2340000, ai_suggested: true, ai_confidence: 98, selected: true, custom_amount: null },
  { id: 'D05', name: '건강보험료', description: '건강보험 및 장기요양보험료', estimated_amount: 1820000, ai_suggested: true, ai_confidence: 97, selected: true, custom_amount: null },
  { id: 'D06', name: '고용보험료', description: '고용보험 납입액', estimated_amount: 420000, ai_suggested: true, ai_confidence: 97, selected: true, custom_amount: null },
  { id: 'D07', name: '퇴직연금(IRP)', description: '개인형 퇴직연금 납입액', estimated_amount: 5000000, ai_suggested: true, ai_confidence: 94, selected: true, custom_amount: null },
  { id: 'D08', name: '의료비', description: '본인 및 부양가족 의료비', estimated_amount: 3200000, ai_suggested: true, ai_confidence: 91, selected: true, custom_amount: null },
  { id: 'D09', name: '교육비', description: '본인/자녀 교육비, 학원비, 대학원 등록금', estimated_amount: 2400000, ai_suggested: true, ai_confidence: 87, selected: true, custom_amount: null },
  { id: 'D10', name: '보장성 보험료', description: '보장성 보험 납입보험료 (연 100만원 한도)', estimated_amount: 1000000, ai_suggested: true, ai_confidence: 85, selected: true, custom_amount: null },
  { id: 'D11', name: '기부금 (법정)', description: '국가, 지자체, 국방헌금, 천재지변 구호금', estimated_amount: 0, ai_suggested: false, ai_confidence: 0, selected: false, custom_amount: null },
  { id: 'D12', name: '기부금 (지정)', description: '종교단체, 사회복지법인 등 기부금', estimated_amount: 1200000, ai_suggested: true, ai_confidence: 85, selected: true, custom_amount: null },
  { id: 'D13', name: '신용카드 사용', description: '총급여 25% 초과 사용분', estimated_amount: 2800000, ai_suggested: true, ai_confidence: 92, selected: true, custom_amount: null },
  { id: 'D14', name: '전통시장/대중교통', description: '전통시장, 대중교통 추가 공제', estimated_amount: 800000, ai_suggested: true, ai_confidence: 82, selected: true, custom_amount: null },
  { id: 'D15', name: '주택자금 공제', description: '주택마련저축, 주택차입금 이자', estimated_amount: 0, ai_suggested: false, ai_confidence: 0, selected: false, custom_amount: null },
  { id: 'D16', name: '월세 세액공제', description: '무주택 세대주 월세 세액공제', estimated_amount: 0, ai_suggested: false, ai_confidence: 0, selected: false, custom_amount: null },
  { id: 'D17', name: '연금저축', description: '연금저축 납입액 세액공제', estimated_amount: 4000000, ai_suggested: true, ai_confidence: 90, selected: true, custom_amount: null },
  { id: 'D18', name: '중소기업 취업자 감면', description: '중소기업 취업 청년 소득세 감면', estimated_amount: 0, ai_suggested: false, ai_confidence: 0, selected: false, custom_amount: null },
  { id: 'D19', name: '기타 특별공제', description: '주택임차차입금 원리금, 장기주택저당차입금', estimated_amount: 0, ai_suggested: false, ai_confidence: 0, selected: false, custom_amount: null },
]

const defaultDocuments: DocumentItem[] = [
  { id: 'DOC01', deduction_id: 'D07', name: 'IRP 납입확인서', required: true, uploaded: false, ocr_status: 'pending' },
  { id: 'DOC02', deduction_id: 'D07', name: '퇴직연금 가입증명서', required: true, uploaded: false, ocr_status: 'pending' },
  { id: 'DOC03', deduction_id: 'D08', name: '의료비 납입확인서', required: true, uploaded: false, ocr_status: 'pending' },
  { id: 'DOC04', deduction_id: 'D08', name: '의료비 영수증 (안경/치과 등)', required: false, uploaded: false, ocr_status: 'pending' },
  { id: 'DOC05', deduction_id: 'D09', name: '교육비 납입증명서', required: true, uploaded: false, ocr_status: 'pending' },
  { id: 'DOC06', deduction_id: 'D09', name: '학원비 영수증', required: false, uploaded: false, ocr_status: 'pending' },
  { id: 'DOC07', deduction_id: 'D10', name: '보험료 납입증명서', required: true, uploaded: false, ocr_status: 'pending' },
  { id: 'DOC08', deduction_id: 'D12', name: '기부금 영수증', required: true, uploaded: false, ocr_status: 'pending' },
  { id: 'DOC09', deduction_id: 'D13', name: '카드 사용내역서', required: true, uploaded: false, ocr_status: 'pending' },
  { id: 'DOC10', deduction_id: 'D14', name: '전통시장 영수증', required: false, uploaded: false, ocr_status: 'pending' },
  { id: 'DOC11', deduction_id: 'D17', name: '연금저축 납입확인서', required: true, uploaded: false, ocr_status: 'pending' },
]

/* ─── 수수료 계산 ─── */
function calculateFee(refund: number) {
  const tiers = [
    { limit: 1000000, rate: 0.15 },
    { limit: 5000000, rate: 0.12 },
    { limit: 10000000, rate: 0.10 },
    { limit: Infinity, rate: 0.08 },
  ]
  let remaining = refund
  let totalFee = 0
  let prevLimit = 0
  const breakdown: { range: string; rate: string; amount: number; fee: number }[] = []

  for (const tier of tiers) {
    const rangeAmount = Math.min(remaining, tier.limit - prevLimit)
    if (rangeAmount <= 0) break
    const fee = Math.round(rangeAmount * tier.rate)
    totalFee += fee
    breakdown.push({
      range: prevLimit === 0 ? `~${(tier.limit / 10000).toFixed(0)}만원` : `${(prevLimit / 10000).toFixed(0)}~${tier.limit === Infinity ? '∞' : (tier.limit / 10000).toFixed(0)}만원`,
      rate: `${(tier.rate * 100).toFixed(0)}%`,
      amount: rangeAmount,
      fee,
    })
    remaining -= rangeAmount
    prevLimit = tier.limit
  }

  const vat = Math.round(totalFee * 0.1)
  return { baseFee: totalFee, vat, totalFee: totalFee + vat, breakdown }
}

function formatAmount(amount: number) {
  if (amount >= 10000) return `${(amount / 10000).toFixed(0)}만원`
  return `${amount.toLocaleString()}원`
}

const steps = ['기본 정보', '공제항목 선택', '증빙서류', '세무사 검토', '최종 확인']

export default function TaxCorrectionNewPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  // Step 1: 기본 정보
  const currentYear = new Date().getFullYear()
  const [taxYear, setTaxYear] = useState(currentYear - 1)
  const [dataSource, setDataSource] = useState<'hometax' | 'manual'>('hometax')
  const [grossIncome, setGrossIncome] = useState(85000000)
  const [totalExpenses, setTotalExpenses] = useState(12000000)
  const [originalTax, setOriginalTax] = useState(9800000)

  // Step 2: 공제항목
  const [categories, setCategories] = useState<DeductionCategory[]>(defaultCategories)
  const [showAddCustom, setShowAddCustom] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customAmount, setCustomAmount] = useState('')

  // Step 3: 증빙서류
  const [documents, setDocuments] = useState<DocumentItem[]>(defaultDocuments)

  // Step 4: 세무사 검토
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>('not_submitted')
  const [skipReview, setSkipReview] = useState(false)

  const selectedCategories = categories.filter(c => c.selected)
  const totalDeductions = selectedCategories.reduce((s, c) => s + (c.custom_amount ?? c.estimated_amount), 0)
  const estimatedRefund = Math.round(totalDeductions * 0.165) // 약 16.5% 세율 가정
  const feeResult = calculateFee(estimatedRefund)
  const netRefund = estimatedRefund - feeResult.totalFee

  // 선택된 공제에 필요한 서류만
  const requiredDocs = documents.filter(d => selectedCategories.some(c => c.id === d.deduction_id))
  const uploadedCount = requiredDocs.filter(d => d.uploaded).length

  const toggleCategory = (id: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, selected: !c.selected } : c))
  }

  const updateCustomAmount = (id: string, amount: number | null) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, custom_amount: amount } : c))
  }

  const addCustomDeduction = () => {
    if (!customName || !customAmount) return
    const newCat: DeductionCategory = {
      id: `CUSTOM_${Date.now()}`,
      name: customName,
      description: '직접 추가한 공제항목',
      estimated_amount: parseInt(customAmount),
      ai_suggested: false,
      ai_confidence: 0,
      selected: true,
      custom_amount: null,
    }
    setCategories(prev => [...prev, newCat])
    setCustomName('')
    setCustomAmount('')
    setShowAddCustom(false)
  }

  const simulateUpload = (docId: string) => {
    setDocuments(prev => prev.map(d => {
      if (d.id !== docId) return d
      return { ...d, uploaded: true, ocr_status: 'processing' as const, file_name: `${d.name}.pdf` }
    }))
    // Simulate OCR
    setTimeout(() => {
      setDocuments(prev => prev.map(d => {
        if (d.id !== docId) return d
        return { ...d, ocr_status: 'completed' as const }
      }))
    }, 2000)
  }

  const handleSubmitReview = () => {
    setReviewStatus('submitted')
    setTimeout(() => setReviewStatus('in_review'), 1500)
  }

  async function handleFinalSubmit() {
    setSubmitting(true)
    try {
      await fetchApi('/tax-correction/', {
        method: 'POST',
        body: JSON.stringify({
          tax_year: taxYear,
          data_source: dataSource,
          gross_income: grossIncome,
          total_expenses: totalExpenses,
          original_tax: originalTax,
          deductions: selectedCategories.map(c => ({
            category: c.id,
            name: c.name,
            amount: c.custom_amount ?? c.estimated_amount,
          })),
        }),
      })
      // redirect
      if (typeof window !== 'undefined') {
        window.location.href = '/emr/tax-correction'
      }
    } catch {
      alert('경정청구가 생성되었습니다. (데모)')
      if (typeof window !== 'undefined') {
        window.location.href = '/emr/tax-correction'
      }
    } finally {
      setSubmitting(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0: return grossIncome > 0
      case 1: return selectedCategories.length > 0
      case 2: return true
      case 3: return skipReview || reviewStatus === 'approved' || reviewStatus === 'in_review'
      case 4: return true
      default: return false
    }
  }

  return (
    <div className="max-w-[900px] mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Link href="/emr/tax-correction" className="btn-outline btn-sm text-xs">
          <ArrowLeft className="w-3.5 h-3.5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">새 경정청구</h1>
          <p className="text-sm text-muted-foreground">5단계로 간편하게 경정청구를 생성합니다</p>
        </div>
      </div>

      {/* ───── 스텝 인디케이터 ───── */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                i < currentStep ? 'bg-emerald-500 text-white' :
                i === currentStep ? 'bg-primary text-white' :
                'bg-secondary text-muted-foreground'
              }`}>
                {i < currentStep ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-2xs font-medium hidden sm:block ${
                i === currentStep ? 'text-primary' : 'text-muted-foreground'
              }`}>{step}</span>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 rounded ${i < currentStep ? 'bg-emerald-500' : 'bg-secondary'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ───── 실행 총액 ───── */}
      <div className="card p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xs text-muted-foreground">선택 공제</div>
            <div className="text-sm font-bold">{selectedCategories.length}건</div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <div className="text-2xs text-muted-foreground">예상 환급</div>
            <div className="text-sm font-bold text-emerald-600">{formatAmount(estimatedRefund)}</div>
          </div>
          <div className="w-px h-8 bg-border hidden sm:block" />
          <div className="text-center hidden sm:block">
            <div className="text-2xs text-muted-foreground">수수료</div>
            <div className="text-sm font-bold text-amber-600">-{formatAmount(feeResult.totalFee)}</div>
          </div>
          <div className="w-px h-8 bg-border hidden sm:block" />
          <div className="text-center hidden sm:block">
            <div className="text-2xs text-muted-foreground">순 환급</div>
            <div className="text-sm font-bold">{formatAmount(netRefund)}</div>
          </div>
        </div>
      </div>

      {/* ───── 스텝 내용 ───── */}

      {/* Step 1: 기본 정보 */}
      {currentStep === 0 && (
        <div className="card p-6 space-y-5">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" /> 기본 정보
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">과세연도</label>
              <select
                value={taxYear}
                onChange={e => setTaxYear(parseInt(e.target.value))}
                className="input py-2.5 w-full"
              >
                {Array.from({ length: 5 }, (_, i) => currentYear - 1 - i).map(y => (
                  <option key={y} value={y}>{y}년</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">데이터 출처</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setDataSource('hometax')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    dataSource === 'hometax' ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  홈택스 연동
                </button>
                <button
                  onClick={() => setDataSource('manual')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    dataSource === 'manual' ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  직접 입력
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">총 급여(수입)</label>
              <div className="relative">
                <input
                  type="number"
                  value={grossIncome}
                  onChange={e => setGrossIncome(parseInt(e.target.value) || 0)}
                  className="input py-2.5 w-full pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">원</span>
              </div>
              <span className="text-2xs text-muted-foreground">{formatAmount(grossIncome)}</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">필요경비</label>
              <div className="relative">
                <input
                  type="number"
                  value={totalExpenses}
                  onChange={e => setTotalExpenses(parseInt(e.target.value) || 0)}
                  className="input py-2.5 w-full pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">원</span>
              </div>
              <span className="text-2xs text-muted-foreground">{formatAmount(totalExpenses)}</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">기납부 세액</label>
              <div className="relative">
                <input
                  type="number"
                  value={originalTax}
                  onChange={e => setOriginalTax(parseInt(e.target.value) || 0)}
                  className="input py-2.5 w-full pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">원</span>
              </div>
              <span className="text-2xs text-muted-foreground">{formatAmount(originalTax)}</span>
            </div>
          </div>

          {dataSource === 'hometax' && (
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <Info className="w-4 h-4 flex-shrink-0" />
              홈택스에서 자동으로 데이터를 가져옵니다. 홈택스 연동이 필요합니다.
              <Link href="/emr/tax-correction/hometax" className="text-blue-600 font-semibold underline ml-1">연동 설정</Link>
            </div>
          )}
        </div>
      )}

      {/* Step 2: 공제항목 선택 */}
      {currentStep === 1 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-600" /> 공제항목 선택
            </h2>
            <button
              onClick={() => setShowAddCustom(true)}
              className="btn-outline btn-sm text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              직접 추가
            </button>
          </div>

          <div className="divide-y divide-border">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center gap-4 px-4 py-3 hover:bg-secondary/30 transition-colors">
                <input
                  type="checkbox"
                  checked={cat.selected}
                  onChange={() => toggleCategory(cat.id)}
                  className="w-4 h-4 rounded flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{cat.name}</span>
                    {cat.ai_suggested && (
                      <span className="px-1.5 py-0.5 rounded text-2xs font-bold bg-violet-100 dark:bg-violet-900/30 text-violet-600">
                        <Sparkles className="w-2.5 h-2.5 inline mr-0.5" />AI
                      </span>
                    )}
                    {cat.ai_confidence > 0 && (
                      <span className="text-2xs text-muted-foreground">{cat.ai_confidence}%</span>
                    )}
                  </div>
                  <div className="text-2xs text-muted-foreground">{cat.description}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {cat.selected && (
                    <input
                      type="number"
                      placeholder={cat.estimated_amount.toLocaleString()}
                      value={cat.custom_amount ?? ''}
                      onChange={e => updateCustomAmount(cat.id, e.target.value ? parseInt(e.target.value) : null)}
                      className="input py-1.5 w-28 text-sm text-right"
                    />
                  )}
                  <span className="text-xs text-muted-foreground w-16 text-right">
                    {formatAmount(cat.custom_amount ?? cat.estimated_amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* 직접 추가 모달 */}
          {showAddCustom && (
            <div className="p-4 border-t border-border bg-secondary/20">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">항목명</label>
                  <input
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    className="input py-2 w-full"
                    placeholder="공제 항목 이름"
                  />
                </div>
                <div className="w-36">
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">금액</label>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={e => setCustomAmount(e.target.value)}
                    className="input py-2 w-full"
                    placeholder="0"
                  />
                </div>
                <button onClick={addCustomDeduction} className="btn-primary btn-sm">추가</button>
                <button onClick={() => setShowAddCustom(false)} className="btn-outline btn-sm">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: 증빙서류 */}
      {currentStep === 2 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" /> 증빙서류
            </h2>
            <span className="text-xs text-muted-foreground">
              {uploadedCount}/{requiredDocs.length} 업로드
            </span>
          </div>

          {/* 공제항목별 그룹 */}
          {selectedCategories.filter(cat => requiredDocs.some(d => d.deduction_id === cat.id)).map(cat => {
            const catDocs = requiredDocs.filter(d => d.deduction_id === cat.id)
            return (
              <div key={cat.id} className="border-b border-border last:border-0">
                <div className="px-4 py-3 bg-secondary/20">
                  <span className="text-sm font-semibold">{cat.name}</span>
                  <span className="text-2xs text-muted-foreground ml-2">{catDocs.filter(d => d.uploaded).length}/{catDocs.length} 완료</span>
                </div>
                <div className="divide-y divide-border/50">
                  {catDocs.map(doc => (
                    <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
                      {doc.uploaded ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      ) : doc.required ? (
                        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-border flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium flex items-center gap-1">
                          {doc.name}
                          {doc.required && <span className="text-red-500 text-xs">*</span>}
                        </div>
                        {doc.uploaded && (
                          <div className="text-2xs text-muted-foreground flex items-center gap-2 mt-0.5">
                            <span>{doc.file_name}</span>
                            <span className={`px-1.5 py-0.5 rounded ${
                              doc.ocr_status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                              doc.ocr_status === 'processing' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                              'bg-secondary text-muted-foreground'
                            }`}>
                              {doc.ocr_status === 'completed' ? 'OCR 완료' :
                               doc.ocr_status === 'processing' ? 'OCR 처리중...' :
                               doc.ocr_status === 'failed' ? 'OCR 실패' : '대기'}
                            </span>
                          </div>
                        )}
                      </div>
                      {!doc.uploaded && (
                        <button
                          onClick={() => simulateUpload(doc.id)}
                          className="btn-outline btn-sm text-xs"
                        >
                          <Upload className="w-3 h-3" />
                          업로드
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {requiredDocs.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <div className="text-sm">공제항목을 먼저 선택해주세요</div>
            </div>
          )}
        </div>
      )}

      {/* Step 4: 세무사 검토 */}
      {currentStep === 3 && (
        <div className="card p-6 space-y-5">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-purple-600" /> 세무사 검토
          </h2>

          <div className="space-y-4">
            <div className={`p-4 rounded-xl border ${
              reviewStatus === 'approved' ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10' :
              reviewStatus === 'in_review' ? 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10' :
              reviewStatus === 'submitted' ? 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10' :
              'border-border'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                {reviewStatus === 'approved' && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                {reviewStatus === 'in_review' && <Loader2 className="w-6 h-6 animate-spin text-blue-500" />}
                {reviewStatus === 'submitted' && <Clock className="w-6 h-6 text-amber-500" />}
                {reviewStatus === 'not_submitted' && <Shield className="w-6 h-6 text-muted-foreground" />}
                {reviewStatus === 'revision_needed' && <AlertCircle className="w-6 h-6 text-red-500" />}
                <div>
                  <div className="font-semibold">
                    {reviewStatus === 'not_submitted' && '세무사 검토 요청'}
                    {reviewStatus === 'submitted' && '검토 요청 접수됨'}
                    {reviewStatus === 'in_review' && '세무사 검토 중'}
                    {reviewStatus === 'approved' && '검토 완료 - 승인'}
                    {reviewStatus === 'revision_needed' && '수정 필요'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {reviewStatus === 'not_submitted' && '전문 세무사가 공제항목과 증빙서류를 검토합니다'}
                    {reviewStatus === 'submitted' && '24시간 이내 검토가 시작됩니다'}
                    {reviewStatus === 'in_review' && '세무사가 귀하의 경정청구를 검토하고 있습니다'}
                    {reviewStatus === 'approved' && '모든 공제항목이 적정한 것으로 확인되었습니다'}
                    {reviewStatus === 'revision_needed' && '일부 항목에 대한 수정이 필요합니다'}
                  </div>
                </div>
              </div>

              {reviewStatus === 'not_submitted' && (
                <button onClick={handleSubmitReview} className="btn-primary btn-sm text-xs w-full py-2.5">
                  <User className="w-3.5 h-3.5" />
                  세무사 검토 요청
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={skipReview}
                onChange={e => setSkipReview(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-muted-foreground">세무사 검토 없이 직접 제출 (권장하지 않음)</span>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: 최종 확인 */}
      {currentStep === 4 && (
        <div className="space-y-4">
          <div className="card p-6 space-y-5">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" /> 최종 확인
            </h2>

            {/* 기본 정보 요약 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-secondary/30 rounded-xl">
              <div>
                <div className="text-2xs text-muted-foreground">과세연도</div>
                <div className="text-sm font-bold">{taxYear}년</div>
              </div>
              <div>
                <div className="text-2xs text-muted-foreground">총 급여</div>
                <div className="text-sm font-bold">{formatAmount(grossIncome)}</div>
              </div>
              <div>
                <div className="text-2xs text-muted-foreground">기납부 세액</div>
                <div className="text-sm font-bold">{formatAmount(originalTax)}</div>
              </div>
              <div>
                <div className="text-2xs text-muted-foreground">증빙서류</div>
                <div className="text-sm font-bold">{uploadedCount}/{requiredDocs.length}</div>
              </div>
            </div>

            {/* 공제항목 요약 */}
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2">선택 공제항목 ({selectedCategories.length}건)</div>
              <div className="space-y-1">
                {selectedCategories.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between py-1.5 px-3 bg-secondary/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{cat.name}</span>
                      {cat.ai_suggested && <Sparkles className="w-3 h-3 text-violet-500" />}
                    </div>
                    <span className="text-sm font-semibold">{formatAmount(cat.custom_amount ?? cat.estimated_amount)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between py-2 px-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg mt-2">
                  <span className="text-sm font-bold">공제 합계</span>
                  <span className="text-sm font-bold text-emerald-600">{formatAmount(totalDeductions)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 수수료 내역 */}
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Percent className="w-4 h-4 text-blue-600" /> 수수료 내역
            </h3>
            <div className="space-y-2">
              {feeResult.breakdown.map((tier, i) => (
                <div key={i} className="flex items-center justify-between text-sm p-2 bg-secondary/20 rounded-lg">
                  <span className="text-muted-foreground">{tier.range} ({tier.rate})</span>
                  <span>{formatAmount(tier.fee)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between text-sm p-2 bg-secondary/20 rounded-lg">
                <span className="text-muted-foreground">VAT (10%)</span>
                <span>{formatAmount(feeResult.vat)}</span>
              </div>
              <div className="flex items-center justify-between text-sm p-2 rounded-lg border border-border font-bold">
                <span>총 수수료</span>
                <span className="text-amber-600">{formatAmount(feeResult.totalFee)}</span>
              </div>
            </div>

            {/* 최종 금액 */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">예상 환급액</span>
                <span className="text-lg font-bold text-emerald-600">{formatAmount(estimatedRefund)}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">수수료</span>
                <span className="text-lg font-bold text-amber-600">-{formatAmount(feeResult.totalFee)}</span>
              </div>
              <div className="border-t border-emerald-200 dark:border-emerald-800 pt-2 mt-2 flex items-center justify-between">
                <span className="text-sm font-bold">순 환급 예상액</span>
                <span className="text-2xl font-bold">{formatAmount(netRefund)}</span>
              </div>
            </div>
          </div>

          {/* 제출 버튼 */}
          <button
            onClick={handleFinalSubmit}
            disabled={submitting}
            className="w-full py-4 rounded-2xl font-bold text-lg text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-500/20"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            경정청구 제출
          </button>
        </div>
      )}

      {/* ───── 네비게이션 ───── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="btn-outline btn-sm disabled:opacity-30"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          이전
        </button>

        {currentStep < steps.length - 1 && (
          <button
            onClick={() => setCurrentStep(currentStep + 1)}
            disabled={!canProceed()}
            className="btn-primary btn-sm disabled:opacity-30"
          >
            다음
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
