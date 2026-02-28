'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Brain,
  Sparkles,
  Loader2,
  Info,
  Send,
  Edit3,
  Save,
  X,
  Eye,
  RefreshCw,
  Clock,
  FileText,
  Shield,
  User,
  Calendar,
  DollarSign,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

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
type ClaimStatus = 'DRAFT' | 'READY' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'PARTIAL'
type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'

interface ClaimItem {
  code: string
  name: string
  item_type: string
  quantity: number
  unit_price: number
  total_price: number
  risk_level: RiskLevel
  pass_rate: number
  issues: string[]
  ai_comment?: string
}

interface TimelineEvent {
  date: string
  status: ClaimStatus
  description: string
  actor?: string
}

interface ClaimDetail {
  id: string
  claim_number: string
  claim_date: string
  service_date: string
  patient_name_masked: string
  patient_chart_no: string
  patient_age?: number
  patient_gender?: string
  diagnosis_codes: string[]
  diagnosis_names: string[]
  total_amount: number
  insurance_amount: number
  copay_amount: number
  approved_amount?: number | null
  rejected_amount: number
  status: ClaimStatus
  risk_level: RiskLevel
  risk_score: number
  risk_reason?: string | null
  ai_analyzed: boolean
  ai_analysis_result: { issues: string[]; suggestions: string[] }
  submitted_at?: string | null
  items: ClaimItem[]
  timeline: TimelineEvent[]
  is_demo?: boolean
}

/* ─── 스타일 설정 ─── */
const statusConfig: Record<ClaimStatus, { label: string; color: string; bg: string }> = {
  DRAFT: { label: '작성중', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-900/20' },
  READY: { label: '청구대기', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  SUBMITTED: { label: '전송완료', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  ACCEPTED: { label: '인정', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  REJECTED: { label: '삭감', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
  PARTIAL: { label: '일부삭감', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
}

const riskConfig: Record<RiskLevel, { label: string; color: string; bg: string }> = {
  LOW: { label: '안전', color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  MEDIUM: { label: '주의', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  HIGH: { label: '위험', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
}

/* ─── 데모 데이터 ─── */
const demoClaim: ClaimDetail = {
  id: 'demo-001',
  claim_number: 'CLM-2026-00142',
  claim_date: '2026-02-25',
  service_date: '2026-02-24',
  patient_name_masked: '강지원',
  patient_chart_no: 'C2024-0001',
  patient_age: 45,
  patient_gender: 'M',
  diagnosis_codes: ['J06.9', 'R51'],
  diagnosis_names: ['급성 상기도감염, 상세불명', '두통'],
  total_amount: 287400,
  insurance_amount: 258600,
  copay_amount: 28800,
  approved_amount: null,
  rejected_amount: 0,
  status: 'READY',
  risk_level: 'MEDIUM',
  risk_score: 82,
  risk_reason: '심전도 검사(EB411)의 의학적 필요성 소견 부족',
  ai_analyzed: true,
  ai_analysis_result: {
    issues: ['심전도 검사 의학적 필요성 소견 부족', '갑상선 검사와 주호소 관련성 불명확'],
    suggestions: [
      '호흡기 증상과 순환기 증상을 각각 차트에 기재하세요.',
      '갑상선 기능검사는 관련 증상 기록을 추가하거나 제외하세요.',
    ],
  },
  submitted_at: null,
  items: [
    { code: 'AA157', name: '초진 진찰료', item_type: 'fee', quantity: 1, unit_price: 18400, total_price: 18400, risk_level: 'LOW', pass_rate: 99.8, issues: [], ai_comment: '적정 청구' },
    { code: 'C5211', name: '일반 혈액검사 (CBC)', item_type: 'fee', quantity: 1, unit_price: 4800, total_price: 4800, risk_level: 'LOW', pass_rate: 99.2, issues: [], ai_comment: '기본 검사 인정' },
    { code: 'C3811', name: 'CRP 정량', item_type: 'fee', quantity: 1, unit_price: 5600, total_price: 5600, risk_level: 'LOW', pass_rate: 92.4, issues: ['증상 지속기간 기록 부족'], ai_comment: '염증 의심 소견 추가 권고' },
    { code: 'E6541', name: '흉부 X-ray (2방향)', item_type: 'fee', quantity: 1, unit_price: 15200, total_price: 15200, risk_level: 'LOW', pass_rate: 98.7, issues: [], ai_comment: '호흡기 증상 동반 시 적정' },
    { code: 'EB411', name: '심전도 (12유도)', item_type: 'fee', quantity: 1, unit_price: 12400, total_price: 12400, risk_level: 'MEDIUM', pass_rate: 78.3, issues: ['의학적 필요성 소견 부족', '주호소와 관련성 불명확'], ai_comment: '초진 환자에 대한 심전도 검사의 의학적 필요성 소견 필요' },
    { code: 'D2711', name: '갑상선 기능검사 (TSH)', item_type: 'fee', quantity: 1, unit_price: 8900, total_price: 8900, risk_level: 'HIGH', pass_rate: 52.1, issues: ['주호소와 검사 관련성 낮음', '갑상선 관련 증상 미기록'], ai_comment: '주호소와 관련성 부족' },
    { code: 'J1201', name: '아세트아미노펜정 500mg', item_type: 'drug', quantity: 21, unit_price: 120, total_price: 2520, risk_level: 'LOW', pass_rate: 99.9, issues: [], ai_comment: '적정 처방' },
  ],
  timeline: [
    { date: '2026-02-24 14:30', status: 'DRAFT', description: '청구서 초안 생성', actor: '김원장' },
    { date: '2026-02-24 15:10', status: 'DRAFT', description: 'AI 분석 완료 - 2건 주의 항목 발견', actor: 'AI' },
    { date: '2026-02-25 09:00', status: 'READY', description: '청구 대기 상태로 변경', actor: '김원장' },
  ],
  is_demo: true,
}

export default function ClaimDetailPage() {
  const params = useParams()
  const router = useRouter()
  const claimId = params.id as string

  const [claim, setClaim] = useState<ClaimDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadClaim()
  }, [claimId])

  async function loadClaim() {
    setLoading(true)
    try {
      const res = await fetchApi(`/claims/${claimId}`)
      setClaim(res)
      setIsDemo(res.is_demo || false)
    } catch {
      setClaim(demoClaim)
      setIsDemo(true)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitClaim = async () => {
    if (!claim) return
    setSubmitting(true)
    try {
      await fetchApi(`/claims/${claimId}/submit`, { method: 'POST' })
      await loadClaim()
    } catch {
      // fallback: update local state
      setClaim({ ...claim, status: 'SUBMITTED', submitted_at: new Date().toISOString() })
    } finally {
      setSubmitting(false)
    }
  }

  const handleAnalyze = async () => {
    if (!claim) return
    try {
      const res = await fetchApi(`/claims/${claimId}/analyze`, { method: 'POST' })
      await loadClaim()
    } catch {
      // keep current
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!claim) {
    return (
      <div className="text-center py-16">
        <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <div className="font-semibold text-muted-foreground">청구서를 찾을 수 없습니다</div>
        <Link href="/emr/claims" className="btn-primary btn-sm mt-4 inline-flex">
          <ChevronLeft className="w-4 h-4" /> 목록으로
        </Link>
      </div>
    )
  }

  const st = statusConfig[claim.status]
  const rk = riskConfig[claim.risk_level]
  const scoreColor = claim.risk_score >= 90 ? 'text-emerald-600' : claim.risk_score >= 75 ? 'text-amber-600' : 'text-red-600'
  const scoreTrack = claim.risk_score >= 90 ? 'stroke-emerald-500' : claim.risk_score >= 75 ? 'stroke-amber-500' : 'stroke-red-500'

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      {/* 데모 배너 */}
      {isDemo && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span className="text-sm text-amber-700 dark:text-amber-300">
            데모 데이터를 표시 중입니다.
          </span>
        </div>
      )}

      {/* ───── 헤더 ───── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/emr/claims" className="btn-outline btn-sm">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{claim.claim_number}</h1>
              <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${st.color} ${st.bg}`}>{st.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-lg font-bold ${rk.color} ${rk.bg}`}>{rk.label}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {claim.claim_date} 생성 · {claim.service_date} 진료
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {claim.status === 'DRAFT' && (
            <>
              <button onClick={() => setEditMode(!editMode)} className="btn-outline btn-sm">
                <Edit3 className="w-3.5 h-3.5" /> {editMode ? '편집 완료' : '편집'}
              </button>
              <button onClick={handleAnalyze} className="btn-outline btn-sm">
                <Brain className="w-3.5 h-3.5" /> AI 분석
              </button>
            </>
          )}
          {(claim.status === 'DRAFT' || claim.status === 'READY') && (
            <button onClick={handleSubmitClaim} disabled={submitting} className="btn-primary btn-sm">
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {claim.status === 'DRAFT' ? '대기로 변경' : '심평원 전송'}
            </button>
          )}
          {['REJECTED', 'PARTIAL'].includes(claim.status) && (
            <Link href="/emr/claims/appeals" className="btn-primary btn-sm bg-amber-500 hover:bg-amber-600">
              <RefreshCw className="w-3.5 h-3.5" /> 이의신청
            </Link>
          )}
        </div>
      </div>

      {/* ───── 환자 정보 + 금액 요약 ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5">
          <h3 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> 환자 정보
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">환자명</span>
              <span className="font-semibold">{claim.patient_name_masked}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">차트번호</span>
              <span className="font-mono text-xs">{claim.patient_chart_no}</span>
            </div>
            {claim.patient_age && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">나이/성별</span>
                <span>{claim.patient_age}세 / {claim.patient_gender === 'M' ? '남' : '여'}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">진단</span>
              <span className="text-right text-xs">{claim.diagnosis_codes.join(', ')}</span>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5" /> 금액 정보
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">총 청구액</span>
              <span className="font-bold">{claim.total_amount.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">보험 부담</span>
              <span>{claim.insurance_amount.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">본인 부담</span>
              <span>{claim.copay_amount.toLocaleString()}원</span>
            </div>
            {claim.approved_amount != null && (
              <div className="flex justify-between text-sm pt-2 border-t border-border">
                <span className="text-emerald-600 font-semibold">인정 금액</span>
                <span className="font-bold text-emerald-600">{claim.approved_amount.toLocaleString()}원</span>
              </div>
            )}
          </div>
        </div>

        {/* AI 분석 점수 */}
        <div className="card p-5 flex flex-col items-center justify-center">
          <div className="relative w-28 h-28 mb-2">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-200 dark:text-gray-700" />
              <circle
                cx="60" cy="60" r="50" fill="none" strokeWidth="8" strokeLinecap="round"
                className={scoreTrack}
                strokeDasharray={`${claim.risk_score * 3.14} ${314 - claim.risk_score * 3.14}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-black ${scoreColor}`}>{claim.risk_score}</span>
              <span className="text-2xs text-muted-foreground">적정성</span>
            </div>
          </div>
          <div className="text-2xs text-muted-foreground text-center">
            {claim.ai_analyzed ? 'AI 분석 완료' : 'AI 미분석'}
          </div>
        </div>
      </div>

      {/* ───── AI 분석 패널 ───── */}
      {claim.ai_analyzed && claim.ai_analysis_result && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold">AI 분석 결과</h3>
            <Sparkles className="w-4 h-4 text-blue-400" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 이슈 */}
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2">삭감 리스크</div>
              {claim.ai_analysis_result.issues.length > 0 ? (
                <div className="space-y-2">
                  {claim.ai_analysis_result.issues.map((issue, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/10">
                      <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-red-700 dark:text-red-400">{issue}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm text-emerald-700 dark:text-emerald-400">삭감 리스크 없음</span>
                </div>
              )}
            </div>

            {/* 제안 */}
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2">AI 제안</div>
              <div className="space-y-2">
                {claim.ai_analysis_result.suggestions.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10">
                    <Sparkles className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-blue-700 dark:text-blue-300">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───── 항목 테이블 ───── */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-bold">청구 항목 ({claim.items.length}건)</h3>
          <div className="text-sm font-bold text-primary">{claim.total_amount.toLocaleString()}원</div>
        </div>

        {/* 테이블 헤더 */}
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-secondary/30 text-xs font-semibold text-muted-foreground border-b border-border">
          <div className="col-span-1">구분</div>
          <div className="col-span-2">코드</div>
          <div className="col-span-3">항목명</div>
          <div className="col-span-1">수량</div>
          <div className="col-span-2">금액</div>
          <div className="col-span-1">위험도</div>
          <div className="col-span-1">통과율</div>
          <div className="col-span-1"></div>
        </div>

        <div className="divide-y divide-border">
          {claim.items.map((item) => {
            const irk = riskConfig[item.risk_level]
            const isExpanded = expandedItem === item.code
            const passColor = item.pass_rate >= 95 ? 'text-emerald-600' : item.pass_rate >= 80 ? 'text-amber-600' : 'text-red-500'

            return (
              <div key={item.code}>
                {/* 데스크톱 */}
                <div
                  className={`hidden md:grid grid-cols-12 gap-4 p-4 items-center cursor-pointer hover:bg-secondary/30 transition-colors ${
                    item.risk_level === 'HIGH' ? 'bg-red-50/30 dark:bg-red-900/5' : item.risk_level === 'MEDIUM' ? 'bg-amber-50/30 dark:bg-amber-900/5' : ''
                  }`}
                  onClick={() => setExpandedItem(isExpanded ? null : item.code)}
                >
                  <div className="col-span-1">
                    <span className={`text-2xs px-2 py-0.5 rounded-lg font-bold ${
                      item.item_type === 'drug'
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                    }`}>
                      {item.item_type === 'drug' ? '약제' : '수가'}
                    </span>
                  </div>
                  <div className="col-span-2 text-xs font-mono text-muted-foreground">{item.code}</div>
                  <div className="col-span-3 text-sm font-medium">{item.name}</div>
                  <div className="col-span-1 text-sm">{item.quantity}</div>
                  <div className="col-span-2 text-sm font-semibold">{item.total_price.toLocaleString()}원</div>
                  <div className="col-span-1">
                    <span className={`text-2xs px-2 py-0.5 rounded-lg font-bold ${irk.color} ${irk.bg}`}>{irk.label}</span>
                  </div>
                  <div className={`col-span-1 text-sm font-bold ${passColor}`}>{item.pass_rate}%</div>
                  <div className="col-span-1 flex justify-end">
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>

                {/* 모바일 */}
                <div
                  className="md:hidden p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
                  onClick={() => setExpandedItem(isExpanded ? null : item.code)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-2xs px-2 py-0.5 rounded-lg font-bold ${irk.color} ${irk.bg}`}>{irk.label}</span>
                      <span className="text-sm font-semibold">{item.name}</span>
                    </div>
                    <span className={`text-sm font-bold ${passColor}`}>{item.pass_rate}%</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {item.code} · {item.quantity}개 · {item.total_price.toLocaleString()}원
                  </div>
                </div>

                {/* 확장 */}
                {isExpanded && (
                  <div className="px-4 pb-4 bg-secondary/10">
                    <div className="p-3 rounded-xl bg-secondary/30 space-y-2">
                      {item.ai_comment && (
                        <div className="flex items-start gap-2">
                          <Brain className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-xs font-semibold text-blue-600">AI 분석</div>
                            <div className="text-xs text-muted-foreground">{item.ai_comment}</div>
                          </div>
                        </div>
                      )}
                      {item.issues.length > 0 && (
                        <div className="space-y-1">
                          {item.issues.map((issue, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-red-600">
                              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                              {issue}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="text-2xs text-muted-foreground">
                        단가: {item.unit_price.toLocaleString()}원 x {item.quantity} = {item.total_price.toLocaleString()}원
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ───── 타임라인 ───── */}
      <div className="card p-5">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" /> 상태 변경 이력
        </h3>
        <div className="relative space-y-4 pl-6">
          <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-border" />
          {claim.timeline.map((event, i) => {
            const est = statusConfig[event.status]
            return (
              <div key={i} className="relative flex items-start gap-3">
                <div className={`absolute left-[-18px] w-3 h-3 rounded-full border-2 border-card ${
                  i === claim.timeline.length - 1 ? 'bg-primary' : 'bg-border'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-2xs px-2 py-0.5 rounded-lg font-bold ${est.color} ${est.bg}`}>{est.label}</span>
                    <span className="text-xs text-muted-foreground">{event.date}</span>
                    {event.actor && (
                      <span className="text-2xs text-muted-foreground">by {event.actor}</span>
                    )}
                  </div>
                  <div className="text-sm mt-0.5">{event.description}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
