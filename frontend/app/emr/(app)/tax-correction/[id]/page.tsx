'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  TrendingUp,
  FileText,
  Upload,
  Eye,
  Download,
  Edit3,
  ChevronDown,
  ChevronUp,
  Loader2,
  Info,
  Shield,
  BarChart3,
  Percent,
  BookOpen,
  Calendar,
  User,
  Send,
  RefreshCw,
  Check,
  X,
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
type CorrectionStatus = 'DRAFT' | 'PENDING_REVIEW' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
type ReviewStatus = 'pending' | 'approved' | 'rejected'
type DocStatus = 'uploaded' | 'ocr_done' | 'classified' | 'verified'

interface Deduction {
  id: string
  category: string
  description: string
  original_amount: number
  additional_amount: number
  tax_savings: number
  confidence: number
  review_status: ReviewStatus
  tax_code: string
}

interface CorrectionDocument {
  id: string
  file_name: string
  doc_type: string
  uploaded_at: string
  status: DocStatus
  ocr_result?: string
  classification?: string
}

interface TimelineEvent {
  id: string
  date: string
  title: string
  description: string
  status: 'completed' | 'current' | 'pending'
}

interface FeeBreakdown {
  range: string
  rate: string
  amount: number
  fee: number
}

interface PeerStat {
  label: string
  user_value: number
  peer_avg: number
  unit: string
}

interface CorrectionDetail {
  id: string
  correction_number: string
  tax_year: number
  status: CorrectionStatus
  original_filed_amount: number
  correct_amount: number
  refund_amount: number
  base_fee: number
  vat: number
  total_fee: number
  net_refund: number
  created_at: string
  submitted_at: string | null
  approved_at: string | null
  deductions: Deduction[]
  documents: CorrectionDocument[]
  timeline: TimelineEvent[]
  fee_breakdown: FeeBreakdown[]
  peer_comparison: PeerStat[]
  is_demo: boolean
}

/* ─── 설정 ─── */
const statusConfig: Record<CorrectionStatus, { label: string; color: string; bg: string }> = {
  DRAFT: { label: '초안', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-900/20' },
  PENDING_REVIEW: { label: '검토중', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  SUBMITTED: { label: '제출완료', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  APPROVED: { label: '승인', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  REJECTED: { label: '반려', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
  COMPLETED: { label: '환급완료', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
}

const docStatusConfig: Record<DocStatus, { label: string; color: string; bg: string }> = {
  uploaded: { label: '업로드됨', color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-900/20' },
  ocr_done: { label: 'OCR 완료', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20' },
  classified: { label: '분류완료', color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/20' },
  verified: { label: '검증완료', color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/20' },
}

const reviewStatusConfig: Record<ReviewStatus, { label: string; color: string; icon: typeof Check }> = {
  pending: { label: '검토대기', color: 'text-amber-600', icon: Clock },
  approved: { label: '승인', color: 'text-emerald-600', icon: CheckCircle2 },
  rejected: { label: '반려', color: 'text-red-600', icon: X },
}

function formatAmount(amount: number) {
  if (amount >= 10000) return `${(amount / 10000).toFixed(0)}만원`
  return `${amount.toLocaleString()}원`
}

/* ─── 데모 데이터 ─── */
const demoData: CorrectionDetail = {
  id: '1',
  correction_number: 'TAX-2024-0001',
  tax_year: 2024,
  status: 'SUBMITTED',
  original_filed_amount: 9800000,
  correct_amount: 6920000,
  refund_amount: 2880000,
  base_fee: 346000,
  vat: 34600,
  total_fee: 380600,
  net_refund: 2499400,
  created_at: '2025-03-10',
  submitted_at: '2025-03-15',
  approved_at: null,
  deductions: [
    { id: 'D1', category: '퇴직연금(IRP)', description: 'IRP 납입액 세액공제 누락분', original_amount: 0, additional_amount: 5000000, tax_savings: 825000, confidence: 94, review_status: 'approved', tax_code: '소득세법 제59조의3' },
    { id: 'D2', category: '의료비', description: '안경구입비 및 치과 임플란트 비용', original_amount: 1200000, additional_amount: 2000000, tax_savings: 612000, confidence: 91, review_status: 'approved', tax_code: '소득세법 제59조의4 제2항' },
    { id: 'D3', category: '교육비', description: '자녀 학원비 및 본인 대학원 등록금', original_amount: 800000, additional_amount: 1600000, tax_savings: 480000, confidence: 87, review_status: 'pending', tax_code: '소득세법 제59조의4 제3항' },
    { id: 'D4', category: '기부금', description: '종교단체 헌금 및 사회복지 기부금', original_amount: 300000, additional_amount: 900000, tax_savings: 345000, confidence: 85, review_status: 'approved', tax_code: '소득세법 제34조' },
    { id: 'D5', category: '신용카드', description: '전통시장 사용분 추가 공제율 미적용', original_amount: 1500000, additional_amount: 1300000, tax_savings: 280000, confidence: 82, review_status: 'pending', tax_code: '조세특례제한법 제126조의2' },
    { id: 'D6', category: '주택자금', description: '주택임차 차입금 원리금 상환액', original_amount: 0, additional_amount: 1800000, tax_savings: 220000, confidence: 78, review_status: 'pending', tax_code: '소득세법 제52조 제4항' },
    { id: 'D7', category: '보장성보험', description: '보장성보험 납입보험료 세액공제', original_amount: 400000, additional_amount: 600000, tax_savings: 118000, confidence: 75, review_status: 'approved', tax_code: '소득세법 제59조의4 제1항' },
  ],
  documents: [
    { id: 'DOC1', file_name: 'IRP_납입확인서.pdf', doc_type: '퇴직연금', uploaded_at: '2025-03-10', status: 'verified', ocr_result: 'IRP 납입금액: 5,000,000원', classification: '세액공제 증빙' },
    { id: 'DOC2', file_name: '의료비_영수증.pdf', doc_type: '의료비', uploaded_at: '2025-03-10', status: 'verified', ocr_result: '총 의료비: 3,200,000원', classification: '의료비 증빙' },
    { id: 'DOC3', file_name: '교육비_납입증명서.pdf', doc_type: '교육비', uploaded_at: '2025-03-11', status: 'classified', ocr_result: '교육비 합계: 2,400,000원' },
    { id: 'DOC4', file_name: '기부금_영수증.pdf', doc_type: '기부금', uploaded_at: '2025-03-11', status: 'ocr_done', ocr_result: '기부금: 1,200,000원' },
    { id: 'DOC5', file_name: '카드사용내역.pdf', doc_type: '신용카드', uploaded_at: '2025-03-12', status: 'verified' },
    { id: 'DOC6', file_name: '보험료_납입증명서.pdf', doc_type: '보험료', uploaded_at: '2025-03-12', status: 'verified' },
  ],
  timeline: [
    { id: 'T1', date: '2025-03-10', title: '경정청구 생성', description: 'AI 스캔 결과 기반으로 경정청구 초안 생성', status: 'completed' },
    { id: 'T2', date: '2025-03-11', title: '증빙서류 업로드', description: '6건의 증빙서류 업로드 및 OCR 처리 완료', status: 'completed' },
    { id: 'T3', date: '2025-03-13', title: '세무사 검토 완료', description: '담당 세무사 김철수 - 적정 의견', status: 'completed' },
    { id: 'T4', date: '2025-03-15', title: '국세청 제출', description: '홈택스를 통해 경정청구서 전자 제출', status: 'completed' },
    { id: 'T5', date: '', title: '국세청 심사', description: '국세청 심사 진행 중 (보통 2~3개월 소요)', status: 'current' },
    { id: 'T6', date: '', title: '환급 결정', description: '국세청 환급 결정 통보', status: 'pending' },
    { id: 'T7', date: '', title: '환급금 입금', description: '지정 계좌로 환급금 입금 (결정 후 30일 이내)', status: 'pending' },
  ],
  fee_breakdown: [
    { range: '~100만원', rate: '15%', amount: 1000000, fee: 150000 },
    { range: '100~500만원', rate: '12%', amount: 1880000, fee: 225600 },
  ],
  peer_comparison: [
    { label: '평균 환급액', user_value: 2880000, peer_avg: 1850000, unit: '원' },
    { label: '공제항목 수', user_value: 7, peer_avg: 4.2, unit: '건' },
    { label: '처리 기간', user_value: 5, peer_avg: 12, unit: '일' },
    { label: '세무사 검토 비율', user_value: 100, peer_avg: 65, unit: '%' },
  ],
  is_demo: true,
}

type TabKey = 'deductions' | 'documents' | 'timeline'

export default function TaxCorrectionDetailPage() {
  const params = useParams()
  const correctionId = params?.id as string

  const [data, setData] = useState<CorrectionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('deductions')
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    loadDetail()
  }, [correctionId])

  async function loadDetail() {
    setLoading(true)
    try {
      const res = await fetchApi(`/tax-correction/${correctionId}`)
      setData(res)
      setIsDemo(res.is_demo || false)
    } catch {
      setData(demoData)
      setIsDemo(true)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center p-12">
        <AlertCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <div className="font-semibold">경정청구를 찾을 수 없습니다</div>
      </div>
    )
  }

  const st = statusConfig[data.status] || statusConfig.DRAFT

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'deductions', label: '공제항목', count: data.deductions.length },
    { key: 'documents', label: '증빙서류', count: data.documents.length },
    { key: 'timeline', label: '타임라인', count: data.timeline.length },
  ]

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      {/* 데모 배너 */}
      {isDemo && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span className="text-sm text-amber-700 dark:text-amber-300">
            데모 데이터입니다.
          </span>
        </div>
      )}

      {/* ───── 헤더 ───── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/emr/tax-correction" className="btn-outline btn-sm text-xs">
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{data.correction_number}</h1>
              <span className={`px-2.5 py-1 rounded-lg text-2xs font-semibold ${st.color} ${st.bg}`}>{st.label}</span>
            </div>
            <p className="text-sm text-muted-foreground">{data.tax_year}년 귀속 경정청구</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn-outline btn-sm text-xs">
            <Download className="w-3.5 h-3.5" />
            PDF 다운로드
          </button>
          {data.status === 'DRAFT' && (
            <button className="btn-primary btn-sm text-xs">
              <Send className="w-3.5 h-3.5" />
              제출
            </button>
          )}
        </div>
      </div>

      {/* ───── 환급 요약 패널 ───── */}
      <div className="card p-5">
        <h3 className="text-xs font-semibold text-muted-foreground mb-4">환급 요약</h3>
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
          <div className="text-center px-4">
            <div className="text-2xs text-muted-foreground">기존 세액</div>
            <div className="text-lg font-bold">{formatAmount(data.original_filed_amount)}</div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
          <div className="text-center px-4">
            <div className="text-2xs text-muted-foreground">정정 세액</div>
            <div className="text-lg font-bold text-blue-600">{formatAmount(data.correct_amount)}</div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
          <div className="text-center px-4">
            <div className="text-2xs text-muted-foreground">환급액</div>
            <div className="text-lg font-bold text-emerald-600">{formatAmount(data.refund_amount)}</div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
          <div className="text-center px-4">
            <div className="text-2xs text-muted-foreground">수수료</div>
            <div className="text-lg font-bold text-amber-600">-{formatAmount(data.total_fee)}</div>
            <div className="text-2xs text-muted-foreground">
              ({data.fee_breakdown.map(b => `${b.range}: ${b.rate}`).join(', ')} + VAT)
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
          <div className="text-center px-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl py-3">
            <div className="text-2xs text-muted-foreground">순 환급</div>
            <div className="text-xl font-bold">{formatAmount(data.net_refund)}</div>
          </div>
        </div>
      </div>

      {/* ───── 탭 ───── */}
      <div className="card overflow-hidden">
        <div className="flex border-b border-border">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 sm:flex-none px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {tab.count != null && (
                <span className="ml-1.5 text-2xs bg-secondary rounded-full px-1.5 py-0.5">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* 공제항목 탭 */}
        {activeTab === 'deductions' && (
          <div>
            {/* 테이블 헤더 */}
            <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-secondary/30 text-xs font-semibold text-muted-foreground border-b border-border">
              <div className="col-span-2">카테고리</div>
              <div className="col-span-3">내용</div>
              <div className="col-span-1 text-right">기존</div>
              <div className="col-span-1 text-right">추가</div>
              <div className="col-span-1 text-right">세금 절감</div>
              <div className="col-span-2">신뢰도</div>
              <div className="col-span-1">검토</div>
              <div className="col-span-1">세법</div>
            </div>

            <div className="divide-y divide-border">
              {data.deductions.map(ded => {
                const rs = reviewStatusConfig[ded.review_status]
                const RsIcon = rs.icon
                return (
                  <div key={ded.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 p-4 hover:bg-secondary/30 transition-colors items-center">
                    {/* 모바일 */}
                    <div className="md:hidden space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">{ded.category}</span>
                        <span className="font-bold text-sm text-emerald-600">+{formatAmount(ded.tax_savings)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{ded.description}</div>
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1 text-2xs ${rs.color}`}>
                          <RsIcon className="w-3 h-3" />{rs.label}
                        </span>
                        <span className="text-2xs text-muted-foreground">신뢰도 {ded.confidence}%</span>
                      </div>
                    </div>

                    {/* 데스크톱 */}
                    <div className="hidden md:block col-span-2">
                      <span className="text-sm font-semibold">{ded.category}</span>
                    </div>
                    <div className="hidden md:block col-span-3">
                      <span className="text-xs text-muted-foreground">{ded.description}</span>
                    </div>
                    <div className="hidden md:block col-span-1 text-right text-xs text-muted-foreground">
                      {formatAmount(ded.original_amount)}
                    </div>
                    <div className="hidden md:block col-span-1 text-right text-xs font-semibold text-blue-600">
                      +{formatAmount(ded.additional_amount)}
                    </div>
                    <div className="hidden md:block col-span-1 text-right text-xs font-bold text-emerald-600">
                      +{formatAmount(ded.tax_savings)}
                    </div>
                    <div className="hidden md:block col-span-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-secondary">
                          <div
                            className={`h-full rounded-full ${
                              ded.confidence >= 90 ? 'bg-emerald-500' :
                              ded.confidence >= 80 ? 'bg-blue-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${ded.confidence}%` }}
                          />
                        </div>
                        <span className="text-2xs font-semibold w-8">{ded.confidence}%</span>
                      </div>
                    </div>
                    <div className="hidden md:flex col-span-1 items-center gap-1">
                      <RsIcon className={`w-3.5 h-3.5 ${rs.color}`} />
                      <span className={`text-2xs font-semibold ${rs.color}`}>{rs.label}</span>
                    </div>
                    <div className="hidden md:block col-span-1">
                      <span className="text-2xs text-muted-foreground cursor-help" title={ded.tax_code}>
                        <BookOpen className="w-3 h-3 inline mr-0.5" />
                        참조
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 증빙서류 탭 */}
        {activeTab === 'documents' && (
          <div className="divide-y divide-border">
            {data.documents.map(doc => {
              const ds = docStatusConfig[doc.status]
              return (
                <div key={doc.id} className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{doc.file_name}</div>
                    <div className="text-2xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span>{doc.doc_type}</span>
                      <span>업로드: {doc.uploaded_at}</span>
                    </div>
                    {doc.ocr_result && (
                      <div className="text-2xs text-blue-600 mt-1 flex items-center gap-1">
                        <Brain className="w-3 h-3" />
                        OCR: {doc.ocr_result}
                      </div>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded-lg text-2xs font-bold ${ds.color} ${ds.bg}`}>
                    {ds.label}
                  </span>
                  <button className="btn-outline btn-sm text-xs">
                    <Eye className="w-3 h-3" />
                    보기
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* 타임라인 탭 */}
        {activeTab === 'timeline' && (
          <div className="p-6">
            <div className="relative">
              <div className="absolute left-[15px] top-3 bottom-3 w-0.5 bg-border" />
              <div className="space-y-6">
                {data.timeline.map((event, i) => (
                  <div key={event.id} className="flex items-start gap-4 relative">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                      event.status === 'completed' ? 'bg-emerald-500 text-white' :
                      event.status === 'current' ? 'bg-blue-500 text-white animate-pulse' :
                      'bg-secondary text-muted-foreground'
                    }`}>
                      {event.status === 'completed' ? (
                        <Check className="w-4 h-4" />
                      ) : event.status === 'current' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{event.title}</span>
                        {event.date && (
                          <span className="text-2xs text-muted-foreground">{event.date}</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{event.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ───── 동종 비교 ───── */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold">동일 진료과 비교</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {data.peer_comparison.map((stat, i) => (
            <div key={i} className="p-4 rounded-xl bg-secondary/30 text-center">
              <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
              <div className={`text-xl font-bold ${
                stat.label === '처리 기간'
                  ? (stat.user_value < stat.peer_avg ? 'text-emerald-600' : 'text-amber-600')
                  : (stat.user_value > stat.peer_avg ? 'text-emerald-600' : 'text-amber-600')
              }`}>
                {stat.unit === '원' ? formatAmount(stat.user_value) : `${stat.user_value}${stat.unit}`}
              </div>
              <div className="text-2xs text-muted-foreground mt-1">
                평균: {stat.unit === '원' ? formatAmount(stat.peer_avg) : `${stat.peer_avg}${stat.unit}`}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
