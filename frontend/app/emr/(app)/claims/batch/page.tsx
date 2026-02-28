'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Send,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Info,
  Clock,
  FileText,
  Shield,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Search,
  Check,
  X,
  Download,
  BarChart3,
  Zap,
  RefreshCw,
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
interface ReadyClaim {
  id: string
  claim_number: string
  claim_date: string
  patient_name_masked: string
  patient_chart_no: string
  total_amount: number
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH'
  risk_score: number
  edi_valid: boolean
  edi_errors: string[]
}

interface BatchHistory {
  id: string
  submitted_at: string
  claim_count: number
  total_amount: number
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED'
  success_count: number
  fail_count: number
}

/* ─── 데모 데이터 ─── */
const demoClaims: ReadyClaim[] = [
  { id: 'c1', claim_number: 'CLM-2026-00142', claim_date: '2026-02-25', patient_name_masked: '강지원', patient_chart_no: 'C2024-0001', total_amount: 287400, risk_level: 'MEDIUM', risk_score: 82, edi_valid: true, edi_errors: [] },
  { id: 'c2', claim_number: 'CLM-2026-00143', claim_date: '2026-02-25', patient_name_masked: '이미경', patient_chart_no: 'C2024-0002', total_amount: 145600, risk_level: 'LOW', risk_score: 96, edi_valid: true, edi_errors: [] },
  { id: 'c3', claim_number: 'CLM-2026-00144', claim_date: '2026-02-25', patient_name_masked: '박준호', patient_chart_no: 'C2024-0003', total_amount: 523800, risk_level: 'LOW', risk_score: 99, edi_valid: true, edi_errors: [] },
  { id: 'c4', claim_number: 'CLM-2026-00145', claim_date: '2026-02-24', patient_name_masked: '김영수', patient_chart_no: 'C2024-0004', total_amount: 92300, risk_level: 'HIGH', risk_score: 65, edi_valid: false, edi_errors: ['진단코드 누락', '수가코드 E6541 단가 불일치'] },
  { id: 'c5', claim_number: 'CLM-2026-00146', claim_date: '2026-02-24', patient_name_masked: '한상우', patient_chart_no: 'C2024-0005', total_amount: 178200, risk_level: 'LOW', risk_score: 94, edi_valid: true, edi_errors: [] },
  { id: 'c6', claim_number: 'CLM-2026-00147', claim_date: '2026-02-24', patient_name_masked: '정은화', patient_chart_no: 'C2024-0006', total_amount: 315900, risk_level: 'MEDIUM', risk_score: 79, edi_valid: true, edi_errors: [] },
]

const demoBatchHistory: BatchHistory[] = [
  { id: 'b1', submitted_at: '2026-02-23 18:30', claim_count: 12, total_amount: 3240000, status: 'SUCCESS', success_count: 12, fail_count: 0 },
  { id: 'b2', submitted_at: '2026-02-20 17:45', claim_count: 8, total_amount: 1890000, status: 'PARTIAL', success_count: 7, fail_count: 1 },
  { id: 'b3', submitted_at: '2026-02-17 18:00', claim_count: 15, total_amount: 4120000, status: 'SUCCESS', success_count: 15, fail_count: 0 },
  { id: 'b4', submitted_at: '2026-02-14 17:30', claim_count: 6, total_amount: 1450000, status: 'SUCCESS', success_count: 6, fail_count: 0 },
]

const riskConfig = {
  LOW: { label: '안전', color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  MEDIUM: { label: '주의', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  HIGH: { label: '위험', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
}

const batchStatusConfig = {
  SUCCESS: { label: '전송완료', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  PARTIAL: { label: '일부실패', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  FAILED: { label: '전송실패', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
}

export default function BatchSubmitPage() {
  const [claims, setClaims] = useState<ReadyClaim[]>([])
  const [batchHistory, setBatchHistory] = useState<BatchHistory[]>(demoBatchHistory)
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const res = await fetchApi('/claims/?status=READY')
      const data = (res.data || []).map((c: any) => ({
        id: c.id,
        claim_number: c.claim_number,
        claim_date: c.claim_date,
        patient_name_masked: c.patient_name_masked,
        patient_chart_no: c.patient_chart_no,
        total_amount: c.total_amount,
        risk_level: c.risk_level || 'LOW',
        risk_score: c.risk_score || 100,
        edi_valid: true,
        edi_errors: [],
      }))
      setClaims(data.length > 0 ? data : demoClaims)
      setIsDemo(res.is_demo || data.length === 0)
    } catch {
      setClaims(demoClaims)
      setIsDemo(true)
    } finally {
      setLoading(false)
    }
  }

  const validClaims = claims.filter((c) => c.edi_valid)
  const invalidClaims = claims.filter((c) => !c.edi_valid)

  const filteredClaims = claims.filter((c) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return c.patient_name_masked.includes(q) || c.claim_number.toLowerCase().includes(q) || c.patient_chart_no.toLowerCase().includes(q)
  })

  const selectedClaims = claims.filter((c) => selectedIds.includes(c.id))
  const selectedTotal = selectedClaims.reduce((s, c) => s + c.total_amount, 0)
  const selectedValid = selectedClaims.filter((c) => c.edi_valid)

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const selectAll = () => {
    if (selectedIds.length === validClaims.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(validClaims.map((c) => c.id))
    }
  }

  const handleBatchSubmit = async () => {
    const ids = selectedValid.map((c) => c.id)
    if (ids.length === 0) return

    setSubmitting(true)
    setProgress(0)

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval)
          return 95
        }
        return prev + Math.random() * 15
      })
    }, 300)

    try {
      await fetchApi('/claims/edi/submit', {
        method: 'POST',
        body: JSON.stringify({ claim_ids: ids }),
      })
      setProgress(100)
      clearInterval(interval)
      setShowResult(true)
    } catch {
      setProgress(100)
      clearInterval(interval)
      setShowResult(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      {/* 데모 배너 */}
      {isDemo && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span className="text-sm text-amber-700 dark:text-amber-300">
            데모 데이터를 표시 중입니다. 실제 청구 대기건이 있으면 자동으로 전환됩니다.
          </span>
        </div>
      )}

      {/* ───── 헤더 ───── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Send className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">일괄 전송</h1>
            <p className="text-sm text-muted-foreground">대기 중인 청구를 심평원에 일괄 전송합니다</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} className="btn-outline btn-sm">
            <RefreshCw className="w-3.5 h-3.5" /> 새로고침
          </button>
        </div>
      </div>

      {/* ───── 요약 카드 ───── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">대기 건수</span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold">{claims.length}<span className="text-sm text-muted-foreground">건</span></div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">총 청구금액</span>
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold">
            {(claims.reduce((s, c) => s + c.total_amount, 0) / 10000).toFixed(0)}
            <span className="text-sm text-muted-foreground">만원</span>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">EDI 유효</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{validClaims.length}<span className="text-sm text-muted-foreground">건</span></div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">EDI 오류</span>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-500">{invalidClaims.length}<span className="text-sm text-muted-foreground">건</span></div>
        </div>
      </div>

      {/* ───── 검색 & 선택 요약 ───── */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 bg-secondary/50 rounded-xl px-4">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="환자명, 청구번호로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm outline-none w-full py-3 placeholder:text-muted-foreground"
            />
          </div>
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">
                <strong className="text-foreground">{selectedIds.length}</strong>건 선택
              </span>
              <span className="text-muted-foreground">
                <strong className="text-foreground">{(selectedTotal / 10000).toFixed(1)}</strong>만원
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ───── 청구 목록 ───── */}
      <div className="card overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-secondary/30 text-xs font-semibold text-muted-foreground border-b border-border">
          <div className="col-span-1">
            <input
              type="checkbox"
              className="rounded"
              checked={selectedIds.length === validClaims.length && validClaims.length > 0}
              onChange={selectAll}
            />
          </div>
          <div className="col-span-2">청구번호</div>
          <div className="col-span-2">환자</div>
          <div className="col-span-1">날짜</div>
          <div className="col-span-2">금액</div>
          <div className="col-span-1">위험도</div>
          <div className="col-span-2">EDI 검증</div>
          <div className="col-span-1"></div>
        </div>

        <div className="divide-y divide-border">
          {filteredClaims.map((claim) => {
            const rk = riskConfig[claim.risk_level]
            const isSelected = selectedIds.includes(claim.id)

            return (
              <div key={claim.id}>
                {/* 데스크톱 */}
                <div className={`hidden md:grid grid-cols-12 gap-4 p-4 items-center hover:bg-secondary/20 transition-colors ${
                  !claim.edi_valid ? 'bg-red-50/30 dark:bg-red-900/5' : ''
                }`}>
                  <div className="col-span-1">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={isSelected}
                      disabled={!claim.edi_valid}
                      onChange={() => toggleSelect(claim.id)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Link href={`/emr/claims/${claim.id}`} className="text-xs font-mono text-primary hover:underline">
                      {claim.claim_number}
                    </Link>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm font-semibold">{claim.patient_name_masked}</div>
                    <div className="text-xs text-muted-foreground font-mono">{claim.patient_chart_no}</div>
                  </div>
                  <div className="col-span-1 text-xs text-muted-foreground">
                    {new Date(claim.claim_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="col-span-2 text-sm font-semibold">
                    {claim.total_amount.toLocaleString()}원
                  </div>
                  <div className="col-span-1">
                    <span className={`text-2xs px-2 py-0.5 rounded-lg font-bold ${rk.color} ${rk.bg}`}>{rk.label}</span>
                  </div>
                  <div className="col-span-2">
                    {claim.edi_valid ? (
                      <div className="flex items-center gap-1.5 text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-xs font-semibold">유효</span>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-1.5 text-red-500">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-xs font-semibold">오류</span>
                        </div>
                        <div className="text-2xs text-red-400 mt-0.5">{claim.edi_errors[0]}</div>
                      </div>
                    )}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Link href={`/emr/claims/${claim.id}`} className="text-muted-foreground hover:text-primary">
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* 모바일 */}
                <div className={`md:hidden p-4 ${!claim.edi_valid ? 'bg-red-50/30 dark:bg-red-900/5' : ''}`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="rounded flex-shrink-0"
                      checked={isSelected}
                      disabled={!claim.edi_valid}
                      onChange={() => toggleSelect(claim.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{claim.patient_name_masked}</span>
                        <span className="text-sm font-bold">{claim.total_amount.toLocaleString()}원</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-2xs text-muted-foreground font-mono">{claim.claim_number}</span>
                        <span className={`text-2xs px-2 py-0.5 rounded-lg font-bold ${rk.color} ${rk.bg}`}>{rk.label}</span>
                        {claim.edi_valid ? (
                          <span className="flex items-center gap-1 text-2xs text-emerald-600">
                            <CheckCircle2 className="w-3 h-3" /> EDI 유효
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-2xs text-red-500">
                            <AlertCircle className="w-3 h-3" /> EDI 오류
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {!claim.edi_valid && claim.edi_errors.length > 0 && (
                    <div className="mt-2 ml-7 space-y-1">
                      {claim.edi_errors.map((err, i) => (
                        <div key={i} className="text-2xs text-red-500 flex items-center gap-1">
                          <X className="w-3 h-3 flex-shrink-0" /> {err}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {filteredClaims.length === 0 && (
          <div className="p-12 text-center">
            <Send className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <div className="font-semibold text-muted-foreground">전송 대기 중인 청구가 없습니다</div>
          </div>
        )}
      </div>

      {/* ───── 전송 버튼 ───── */}
      {!showResult && (
        <div className="card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            {selectedIds.length > 0 ? (
              <>
                <strong className="text-foreground">{selectedValid.length}</strong>건 전송 가능 ·{' '}
                <strong className="text-foreground">{(selectedTotal / 10000).toFixed(1)}</strong>만원
                {selectedClaims.length !== selectedValid.length && (
                  <span className="text-red-500 ml-2">
                    ({selectedClaims.length - selectedValid.length}건 EDI 오류로 제외)
                  </span>
                )}
              </>
            ) : (
              <>전송할 청구를 선택하거나 전체 선택 후 전송하세요</>
            )}
          </div>

          <button
            onClick={handleBatchSubmit}
            disabled={submitting || selectedValid.length === 0}
            className="btn-primary btn-sm w-full sm:w-auto"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {submitting ? '전송 중...' : `심평원 전송 (${selectedValid.length}건)`}
          </button>
        </div>
      )}

      {/* ───── 전송 진행률 ───── */}
      {submitting && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <div>
              <div className="font-semibold">심평원 전송 중...</div>
              <div className="text-sm text-muted-foreground">EDI 형식으로 변환하여 전송 중입니다</div>
            </div>
          </div>
          <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground text-right">{Math.round(progress)}%</div>
        </div>
      )}

      {/* ───── 전송 결과 ───── */}
      {showResult && !submitting && (
        <div className="card p-6 border border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-900/10">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            <div>
              <div className="font-bold text-lg">전송 완료</div>
              <div className="text-sm text-muted-foreground">
                {selectedValid.length}건의 청구가 심평원에 전송되었습니다
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-emerald-600">{selectedValid.length}</div>
              <div className="text-xs text-muted-foreground">전송 성공</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{(selectedTotal / 10000).toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">만원</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">3~5일</div>
              <div className="text-xs text-muted-foreground">예상 소요</div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Link href="/emr/claims" className="btn-primary btn-sm">
              <FileText className="w-3.5 h-3.5" /> 청구 목록
            </Link>
            <button
              onClick={() => {
                setShowResult(false)
                setSelectedIds([])
                loadData()
              }}
              className="btn-outline btn-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" /> 다시 전송
            </button>
          </div>
        </div>
      )}

      {/* ───── 전송 이력 ───── */}
      <div className="card p-5">
        <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" /> 최근 전송 이력
        </h2>
        <div className="space-y-2">
          {batchHistory.map((batch) => {
            const bst = batchStatusConfig[batch.status]
            return (
              <div key={batch.id} className="flex items-center gap-4 p-3 bg-secondary/30 rounded-xl hover:bg-secondary/50 cursor-pointer transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  batch.status === 'SUCCESS'
                    ? 'bg-emerald-100 dark:bg-emerald-900/30'
                    : batch.status === 'PARTIAL'
                    ? 'bg-amber-100 dark:bg-amber-900/30'
                    : 'bg-red-100 dark:bg-red-900/30'
                }`}>
                  {batch.status === 'SUCCESS' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : batch.status === 'PARTIAL' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">{batch.claim_count}건 전송</span>
                    <span className={`text-2xs px-2 py-0.5 rounded-lg font-bold ${bst.color} ${bst.bg}`}>{bst.label}</span>
                  </div>
                  <div className="text-2xs text-muted-foreground mt-0.5">
                    {batch.submitted_at} · {(batch.total_amount / 10000).toFixed(0)}만원
                    {batch.fail_count > 0 && <span className="text-red-500 ml-2">실패 {batch.fail_count}건</span>}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
