'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Brain,
  Sparkles,
  Play,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  DollarSign,
  TrendingUp,
  FileText,
  Search,
  ChevronDown,
  ChevronUp,
  Loader2,
  Info,
  Shield,
  BarChart3,
  Target,
  ArrowRight,
  RefreshCw,
  Zap,
  Eye,
  BookOpen,
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
type Severity = 'HIGH' | 'MEDIUM' | 'LOW'

interface ScanFinding {
  id: string
  severity: Severity
  category: string
  description: string
  estimated_refund: number
  confidence: number
  required_documents: string[]
  tax_code: string
}

interface PeerComparison {
  category: string
  user_rate: number
  peer_avg: number
}

interface ScanSummary {
  total_potential_refund: number
  total_tax_savings: number
  avg_confidence: number
  finding_count: number
}

type ScanStage = '데이터 수집' | '공제항목 분석' | '동종비교' | '최적화'

/* ─── 설정 ─── */
const severityConfig: Record<Severity, { label: string; color: string; bg: string; border: string }> = {
  HIGH: { label: '높음', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800' },
  MEDIUM: { label: '보통', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800' },
  LOW: { label: '낮음', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' },
}

const scanStages: ScanStage[] = ['데이터 수집', '공제항목 분석', '동종비교', '최적화']

/* ─── 데모 데이터 ─── */
const demoFindings: ScanFinding[] = [
  {
    id: 'F001',
    severity: 'HIGH',
    category: '퇴직연금 세액공제',
    description: '개인형 퇴직연금(IRP) 납입액에 대한 세액공제가 누락되었습니다. 연간 납입한도 700만원 중 500만원 미신고.',
    estimated_refund: 825000,
    confidence: 94,
    required_documents: ['IRP 납입확인서', '퇴직연금 가입증명서'],
    tax_code: '소득세법 제59조의3',
  },
  {
    id: 'F002',
    severity: 'HIGH',
    category: '의료비 세액공제',
    description: '본인 및 부양가족 의료비 중 미반영분 발견. 안경구입비, 보청기, 치과 임플란트 비용 누락.',
    estimated_refund: 612000,
    confidence: 91,
    required_documents: ['의료비 영수증', '안경구입 영수증', '의료비 납입확인서'],
    tax_code: '소득세법 제59조의4 제2항',
  },
  {
    id: 'F003',
    severity: 'MEDIUM',
    category: '교육비 세액공제',
    description: '자녀 학원비 및 본인 직업훈련비에 대한 교육비 세액공제 미적용. 대학원 등록금 포함.',
    estimated_refund: 480000,
    confidence: 87,
    required_documents: ['교육비 납입증명서', '학원비 영수증', '대학원 등록금 납부서'],
    tax_code: '소득세법 제59조의4 제3항',
  },
  {
    id: 'F004',
    severity: 'MEDIUM',
    category: '기부금 세액공제',
    description: '법정기부금 및 지정기부금 미신고분 발견. 종교단체 헌금 및 사회복지 기부금.',
    estimated_refund: 345000,
    confidence: 85,
    required_documents: ['기부금 영수증', '기부금 명세서'],
    tax_code: '소득세법 제34조',
  },
  {
    id: 'F005',
    severity: 'MEDIUM',
    category: '신용카드 소득공제',
    description: '전통시장 사용분 및 대중교통 이용분에 대한 추가 공제율 미적용.',
    estimated_refund: 280000,
    confidence: 82,
    required_documents: ['카드 사용내역서', '전통시장 영수증'],
    tax_code: '조세특례제한법 제126조의2',
  },
  {
    id: 'F006',
    severity: 'LOW',
    category: '주택자금 소득공제',
    description: '주택임차 차입금 원리금 상환액에 대한 소득공제 미신고.',
    estimated_refund: 220000,
    confidence: 78,
    required_documents: ['금융기관 상환내역', '임대차계약서', '주민등록등본'],
    tax_code: '소득세법 제52조 제4항',
  },
  {
    id: 'F007',
    severity: 'LOW',
    category: '보장성보험료 세액공제',
    description: '보장성보험 납입보험료 세액공제 미적용. 연 100만원 한도.',
    estimated_refund: 165000,
    confidence: 75,
    required_documents: ['보험료 납입증명서'],
    tax_code: '소득세법 제59조의4 제1항',
  },
]

const demoPeerComparison: PeerComparison[] = [
  { category: '의료비 공제율', user_rate: 4.2, peer_avg: 7.8 },
  { category: '교육비 공제율', user_rate: 2.1, peer_avg: 5.3 },
  { category: '퇴직연금 공제율', user_rate: 0, peer_avg: 4.5 },
  { category: '기부금 공제율', user_rate: 1.8, peer_avg: 3.2 },
  { category: '신용카드 공제율', user_rate: 12.5, peer_avg: 14.8 },
  { category: '보험료 공제율', user_rate: 1.5, peer_avg: 2.8 },
]

function formatAmount(amount: number) {
  if (amount >= 10000) return `${(amount / 10000).toFixed(0)}만원`
  return `${amount.toLocaleString()}원`
}

export default function TaxScanPage() {
  const [scanning, setScanning] = useState(false)
  const [scanComplete, setScanComplete] = useState(false)
  const [currentStage, setCurrentStage] = useState(0)
  const [progress, setProgress] = useState(0)
  const [findings, setFindings] = useState<ScanFinding[]>([])
  const [peerComparison, setPeerComparison] = useState<PeerComparison[]>([])
  const [summary, setSummary] = useState<ScanSummary | null>(null)
  const [selectedYears, setSelectedYears] = useState<number[]>([new Date().getFullYear() - 1])
  const [expandedFinding, setExpandedFinding] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState(false)

  const currentYear = new Date().getFullYear()
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - 1 - i)

  const toggleYear = (year: number) => {
    setSelectedYears(prev =>
      prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
    )
  }

  async function startScan() {
    if (selectedYears.length === 0) return
    setScanning(true)
    setScanComplete(false)
    setFindings([])
    setPeerComparison([])
    setSummary(null)
    setCurrentStage(0)
    setProgress(0)

    // Animate through stages
    for (let stage = 0; stage < scanStages.length; stage++) {
      setCurrentStage(stage)
      for (let p = 0; p <= 100; p += 5) {
        await new Promise(r => setTimeout(r, 60))
        setProgress(Math.round((stage * 100 + p) / scanStages.length))
      }
    }

    // Try API first
    try {
      const yearsParam = selectedYears.join(',')
      const res = await fetchApi(`/tax-correction/scan?tax_years=${yearsParam}`)
      if (res.findings && res.findings.length > 0) {
        setFindings(res.findings)
        setPeerComparison(res.peer_comparison || demoPeerComparison)
        setSummary(res.summary)
        setIsDemo(res.is_demo || false)
      } else {
        throw new Error('no data')
      }
    } catch {
      // Fallback to demo
      setFindings(demoFindings)
      setPeerComparison(demoPeerComparison)
      const totalRefund = demoFindings.reduce((s, f) => s + f.estimated_refund, 0)
      setSummary({
        total_potential_refund: totalRefund,
        total_tax_savings: Math.round(totalRefund * 0.85),
        avg_confidence: Math.round(demoFindings.reduce((s, f) => s + f.confidence, 0) / demoFindings.length),
        finding_count: demoFindings.length,
      })
      setIsDemo(true)
    }

    setProgress(100)
    setScanning(false)
    setScanComplete(true)
  }

  const maxPeerRate = Math.max(...demoPeerComparison.map(p => Math.max(p.user_rate, p.peer_avg)))

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* 데모 배너 */}
      {isDemo && scanComplete && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span className="text-sm text-amber-700 dark:text-amber-300">
            데모 데이터를 표시 중입니다. 홈택스 연동 후 실제 세금 데이터를 기반으로 스캔합니다.
          </span>
        </div>
      )}

      {/* ───── 헤더 ───── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI 세금 스캐너</h1>
            <p className="text-sm text-muted-foreground">놓친 공제항목을 AI가 자동으로 찾아드립니다</p>
          </div>
        </div>
        <Link href="/emr/tax-correction" className="btn-outline btn-sm text-xs">
          <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          경정청구 목록
        </Link>
      </div>

      {/* ───── 연도 선택 & 스캔 시작 ───── */}
      {!scanComplete && (
        <div className="card p-6 space-y-6">
          <div>
            <h2 className="text-sm font-semibold mb-3">스캔 대상 과세연도 선택</h2>
            <div className="flex items-center gap-2 flex-wrap">
              {availableYears.map(year => (
                <button
                  key={year}
                  onClick={() => toggleYear(year)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    selectedYears.includes(year)
                      ? 'bg-primary text-white'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {year}년
                </button>
              ))}
            </div>
            <p className="text-2xs text-muted-foreground mt-2">
              복수 연도 선택 시 각 연도별로 누락 공제를 탐색합니다 (최대 5년)
            </p>
          </div>

          {/* 스캔 진행 중 */}
          {scanning && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
                <span className="text-sm font-semibold">{scanStages[currentStage]}...</span>
              </div>
              <div className="w-full h-3 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                {scanStages.map((stage, i) => (
                  <div key={stage} className="flex items-center gap-1.5 text-2xs">
                    {i < currentStage ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    ) : i === currentStage ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-500" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                    <span className={i <= currentStage ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                      {stage}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 시작 버튼 */}
          {!scanning && (
            <button
              onClick={startScan}
              disabled={selectedYears.length === 0}
              className="w-full py-4 rounded-2xl font-bold text-lg text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 flex items-center justify-center gap-3 transition-all shadow-lg shadow-violet-500/20"
            >
              <Brain className="w-6 h-6" />
              AI 세금 스캐너 실행
              <Sparkles className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* ───── 스캔 결과: 요약 ───── */}
      {scanComplete && summary && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground font-medium">예상 환급 총액</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-emerald-600">
                {formatAmount(summary.total_potential_refund)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                선택 연도: {selectedYears.sort().join(', ')}년
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground font-medium">발견 항목</span>
                <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                  <Search className="w-4 h-4 text-violet-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-violet-600">
                {summary.finding_count}<span className="text-sm text-muted-foreground">건</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                HIGH {findings.filter(f => f.severity === 'HIGH').length} / MEDIUM {findings.filter(f => f.severity === 'MEDIUM').length} / LOW {findings.filter(f => f.severity === 'LOW').length}
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground font-medium">평균 신뢰도</span>
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Target className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {summary.avg_confidence}<span className="text-sm text-muted-foreground">%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-secondary mt-2">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${summary.avg_confidence}%` }}
                />
              </div>
            </div>
          </div>

          {/* ───── 발견 항목 목록 ───── */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-600" />
                AI 발견 항목
              </h2>
              <button
                onClick={startScan}
                className="btn-outline btn-sm text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                재스캔
              </button>
            </div>

            <div className="divide-y divide-border">
              {findings.map(finding => {
                const sev = severityConfig[finding.severity]
                const isExpanded = expandedFinding === finding.id

                return (
                  <div key={finding.id}>
                    <div
                      className={`flex items-center gap-4 px-4 py-3.5 cursor-pointer hover:bg-secondary/30 transition-colors ${
                        finding.severity === 'HIGH' ? 'bg-red-50/30 dark:bg-red-900/5' : ''
                      }`}
                      onClick={() => setExpandedFinding(isExpanded ? null : finding.id)}
                    >
                      {/* 심각도 뱃지 */}
                      <span className={`px-2 py-0.5 rounded-lg text-2xs font-bold ${sev.color} ${sev.bg} flex-shrink-0`}>
                        {sev.label}
                      </span>

                      {/* 카테고리 & 설명 */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold">{finding.category}</div>
                        <div className="text-xs text-muted-foreground truncate">{finding.description}</div>
                      </div>

                      {/* 환급 금액 */}
                      <div className="text-right flex-shrink-0 hidden sm:block">
                        <div className="text-sm font-bold text-emerald-600">
                          +{formatAmount(finding.estimated_refund)}
                        </div>
                        <div className="text-2xs text-muted-foreground">
                          신뢰도 {finding.confidence}%
                        </div>
                      </div>

                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>

                    {/* 확장 상세 */}
                    {isExpanded && (
                      <div className="px-4 pb-4 animate-fade-in-down">
                        <div className="bg-secondary/30 rounded-xl p-4 space-y-4">
                          {/* 설명 */}
                          <div className="text-sm text-muted-foreground leading-relaxed">
                            {finding.description}
                          </div>

                          {/* 환급액 & 신뢰도 */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">예상 환급액</div>
                              <div className="text-lg font-bold text-emerald-600">
                                {finding.estimated_refund.toLocaleString()}원
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">신뢰도</div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2.5 rounded-full bg-secondary">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      finding.confidence >= 90 ? 'bg-emerald-500' :
                                      finding.confidence >= 80 ? 'bg-blue-500' :
                                      'bg-amber-500'
                                    }`}
                                    style={{ width: `${finding.confidence}%` }}
                                  />
                                </div>
                                <span className="text-sm font-bold">{finding.confidence}%</span>
                              </div>
                            </div>
                          </div>

                          {/* 필요 서류 */}
                          <div>
                            <div className="text-xs font-semibold text-muted-foreground mb-2">필요 증빙서류</div>
                            <div className="flex flex-wrap gap-2">
                              {finding.required_documents.map((doc, i) => (
                                <span key={i} className="px-2.5 py-1 rounded-lg text-2xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                  <FileText className="w-3 h-3 inline mr-1" />
                                  {doc}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* 세법 근거 */}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 rounded-lg bg-card">
                            <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>근거 법령: {finding.tax_code}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ───── 동종 비교 패널 ───── */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold">동종업종 공제율 비교</h3>
              <span className="text-2xs text-muted-foreground">(동일 진료과 평균 대비)</span>
            </div>
            <div className="space-y-3">
              {peerComparison.map((item, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{item.category}</span>
                    <div className="flex items-center gap-3">
                      <span className={item.user_rate < item.peer_avg ? 'text-red-500 font-semibold' : 'text-emerald-500 font-semibold'}>
                        나: {item.user_rate}%
                      </span>
                      <span className="text-muted-foreground">평균: {item.peer_avg}%</span>
                    </div>
                  </div>
                  <div className="relative h-5 bg-secondary/50 rounded-full overflow-hidden">
                    {/* 본인 */}
                    <div
                      className={`absolute top-0 left-0 h-full rounded-full ${
                        item.user_rate < item.peer_avg ? 'bg-red-400/70' : 'bg-emerald-400/70'
                      }`}
                      style={{ width: `${(item.user_rate / (maxPeerRate * 1.2)) * 100}%` }}
                    />
                    {/* 평균 마커 */}
                    <div
                      className="absolute top-0 h-full w-0.5 bg-slate-800 dark:bg-slate-200"
                      style={{ left: `${(item.peer_avg / (maxPeerRate * 1.2)) * 100}%` }}
                    >
                      <div className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-slate-800 dark:bg-slate-200" />
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-4 mt-2 text-2xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400/70" /> 본인 (평균 미달)</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-400/70" /> 본인 (평균 이상)</span>
                <span className="flex items-center gap-1"><span className="w-3 h-1 bg-slate-800 dark:bg-slate-200" /> 동종 평균</span>
              </div>
            </div>
          </div>

          {/* ───── 경정청구 생성 CTA ───── */}
          <div className="card p-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 border border-emerald-200 dark:border-emerald-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-lg">스캔 결과 기반 경정청구 생성</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  AI가 발견한 {summary.finding_count}건의 누락 공제로 약 <strong className="text-emerald-600">{formatAmount(summary.total_potential_refund)}</strong>의 환급이 가능합니다.
                </p>
              </div>
              <Link
                href="/emr/tax-correction/new"
                className="btn-primary btn-sm flex-shrink-0 py-3 px-6 text-sm"
              >
                <FileText className="w-4 h-4" />
                경정청구 생성
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
