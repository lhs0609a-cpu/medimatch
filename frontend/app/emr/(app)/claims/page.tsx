'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Receipt,
  Search,
  Filter,
  Download,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  X,
  ChevronRight,
  ChevronDown,
  Shield,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Brain,
  Sparkles,
  FileText,
  Calendar,
  ArrowRight,
  Eye,
  Edit3,
  RefreshCw,
  AlertCircle,
  Info,
  Check,
} from 'lucide-react'
import { TossIcon } from '@/components/ui/TossIcon'

/* ─── 타입 ─── */
type ClaimStatus = 'draft' | 'ready' | 'submitted' | 'accepted' | 'rejected' | 'partial'
type RiskLevel = 'low' | 'medium' | 'high'

interface Claim {
  id: number
  date: string
  patientName: string
  chartNo: string
  dxCodes: string[]
  txCodes: string[]
  amount: number
  status: ClaimStatus
  riskLevel: RiskLevel
  riskReason?: string
  submittedAt?: string
  resultAmount?: number
}

/* ─── 더미 데이터 ─── */
const claims: Claim[] = [
  { id: 1, date: '2025-02-21', patientName: '오수현', chartNo: 'C-20240118', dxCodes: ['M81.0'], txCodes: ['AA157', 'B0010'], amount: 45200, status: 'ready', riskLevel: 'low' },
  { id: 2, date: '2025-02-21', patientName: '윤재민', chartNo: 'C-20230415', dxCodes: ['I10'], txCodes: ['AA157', 'F1010'], amount: 32800, status: 'ready', riskLevel: 'low' },
  { id: 3, date: '2025-02-21', patientName: '서미래', chartNo: 'C-20241105', dxCodes: ['M54.5'], txCodes: ['AA157', 'MM042', 'B0020'], amount: 58900, status: 'draft', riskLevel: 'medium', riskReason: 'M54.5 + MM042 조합 삭감률 12% (최근 6개월 기준)' },
  { id: 4, date: '2025-02-21', patientName: '강도윤', chartNo: 'C-20230712', dxCodes: ['E11.9'], txCodes: ['AA157', 'D2200', 'D2240'], amount: 67400, status: 'submitted', riskLevel: 'low', submittedAt: '2025-02-21 12:30' },
  { id: 5, date: '2025-02-20', patientName: '김영수', chartNo: 'C-20230101', dxCodes: ['I10'], txCodes: ['AA157', 'F1010'], amount: 32800, status: 'accepted', riskLevel: 'low', resultAmount: 32800 },
  { id: 6, date: '2025-02-20', patientName: '최은지', chartNo: 'C-20230518', dxCodes: ['E11.9', 'I10'], txCodes: ['AA157', 'D2200', 'F1010'], amount: 78600, status: 'accepted', riskLevel: 'low', resultAmount: 78600 },
  { id: 7, date: '2025-02-19', patientName: '임하준', chartNo: 'C-20250210', dxCodes: ['J06.9'], txCodes: ['AA157', 'HA010'], amount: 28500, status: 'partial', riskLevel: 'high', riskReason: 'HA010 처치료 삭감 (진단 부적합)', resultAmount: 22100 },
  { id: 8, date: '2025-02-19', patientName: '노은채', chartNo: 'C-20240920', dxCodes: ['K21.0'], txCodes: ['AA157', 'E7070'], amount: 42300, status: 'accepted', riskLevel: 'low', resultAmount: 42300 },
  { id: 9, date: '2025-02-18', patientName: '백시연', chartNo: 'C-20250110', dxCodes: ['G43.9'], txCodes: ['AA157', 'HA010', 'B0030'], amount: 55700, status: 'rejected', riskLevel: 'high', riskReason: 'HA010 투약기준 미충족, B0030 횟수 초과', resultAmount: 38200 },
]

const statusConfig: Record<ClaimStatus, { label: string; color: string; bg: string }> = {
  draft: { label: '작성중', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-900/20' },
  ready: { label: '청구대기', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  submitted: { label: '전송완료', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  accepted: { label: '인정', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  rejected: { label: '삭감', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
  partial: { label: '일부삭감', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
}

const riskConfig: Record<RiskLevel, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  low: { label: '안전', color: 'text-emerald-500', icon: CheckCircle2 },
  medium: { label: '주의', color: 'text-amber-500', icon: AlertTriangle },
  high: { label: '위험', color: 'text-red-500', icon: AlertCircle },
}

export default function ClaimsPage() {
  const [filterStatus, setFilterStatus] = useState<ClaimStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClaims, setSelectedClaims] = useState<number[]>([])
  const [expandedClaim, setExpandedClaim] = useState<number | null>(null)

  const filteredClaims = claims
    .filter((c) => filterStatus === 'all' || c.status === filterStatus)
    .filter((c) => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return c.patientName.includes(q) || c.chartNo.toLowerCase().includes(q)
    })

  // 통계
  const totalClaimed = claims.filter(c => ['accepted', 'partial', 'rejected'].includes(c.status)).reduce((s, c) => s + c.amount, 0)
  const totalAccepted = claims.filter(c => ['accepted', 'partial'].includes(c.status)).reduce((s, c) => s + (c.resultAmount || 0), 0)
  const rejectedAmount = totalClaimed - totalAccepted
  const rejectionRate = totalClaimed > 0 ? ((rejectedAmount / totalClaimed) * 100).toFixed(1) : '0'
  const readyClaims = claims.filter(c => c.status === 'ready')
  const riskClaims = claims.filter(c => c.riskLevel !== 'low' && !['accepted'].includes(c.status))

  const toggleSelect = (id: number) => {
    setSelectedClaims((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const selectAllReady = () => {
    const readyIds = readyClaims.map(c => c.id)
    setSelectedClaims(readyIds)
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* ───── 헤더 ───── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">보험청구 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI가 삭감 위험을 미리 잡아드립니다
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn-outline btn-sm">
            <Download className="w-3.5 h-3.5" />
            내보내기
          </button>
          {selectedClaims.length > 0 && (
            <button className="btn-primary btn-sm">
              <Send className="w-3.5 h-3.5" />
              {selectedClaims.length}건 심평원 전송
            </button>
          )}
          {selectedClaims.length === 0 && readyClaims.length > 0 && (
            <button onClick={selectAllReady} className="btn-primary btn-sm">
              <Send className="w-3.5 h-3.5" />
              대기 {readyClaims.length}건 일괄 전송
            </button>
          )}
        </div>
      </div>

      {/* ───── 통계 카드 ───── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">청구 대기</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold">{readyClaims.length}<span className="text-sm text-muted-foreground">건</span></div>
          <div className="text-xs text-muted-foreground mt-1">
            {(readyClaims.reduce((s, c) => s + c.amount, 0) / 10000).toFixed(1)}만원
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">청구 금액</span>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold">{(totalClaimed / 10000).toFixed(0)}<span className="text-sm text-muted-foreground">만원</span></div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">인정 금액</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-500">{(totalAccepted / 10000).toFixed(0)}<span className="text-sm text-muted-foreground">만원</span></div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">삭감률</span>
            <TrendingDown className="w-4 h-4 text-red-500" />
          </div>
          <div className={`text-2xl font-bold ${parseFloat(rejectionRate) > 5 ? 'text-red-500' : 'text-emerald-500'}`}>
            {rejectionRate}<span className="text-sm">%</span>
          </div>
          <div className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
            <TrendingDown className="w-3 h-3" />
            전월 대비 -2.1%p
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">AI 위험 감지</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-500">{riskClaims.length}<span className="text-sm text-muted-foreground">건</span></div>
          <Link href="#" className="text-xs text-primary font-semibold mt-1 hover:underline block">확인하기 →</Link>
        </div>
      </div>

      {/* ───── AI 삭감 방어 인사이트 ───── */}
      {riskClaims.length > 0 && (
        <div className="card p-5 border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5 text-amber-500" />
            <span className="font-bold">AI 삭감 방어 분석</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="space-y-2">
            {riskClaims.map((claim) => (
              <div key={claim.id} className="flex items-start gap-3 p-3 bg-card rounded-xl">
                <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                  claim.riskLevel === 'high' ? 'text-red-500' : 'text-amber-500'
                }`} />
                <div className="flex-1">
                  <div className="text-sm">
                    <strong>{claim.patientName}</strong> ({claim.date}) - {claim.dxCodes.join(', ')}
                  </div>
                  {claim.riskReason && (
                    <div className="text-xs text-muted-foreground mt-0.5">{claim.riskReason}</div>
                  )}
                </div>
                <button className="btn-outline btn-sm text-xs flex-shrink-0">
                  <Edit3 className="w-3 h-3" />
                  수정
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ───── 필터 & 검색 ───── */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 bg-secondary/50 rounded-xl px-4">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="환자 이름, 차트번호로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm outline-none w-full py-3 placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
            {[
              { key: 'all' as const, label: '전체' },
              { key: 'ready' as const, label: '대기' },
              { key: 'submitted' as const, label: '전송' },
              { key: 'accepted' as const, label: '인정' },
              { key: 'rejected' as const, label: '삭감' },
              { key: 'partial' as const, label: '일부삭감' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilterStatus(f.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                  filterStatus === f.key ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ───── 청구 목록 ───── */}
      <div className="card overflow-hidden">
        {/* 테이블 헤더 */}
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-secondary/30 text-xs font-semibold text-muted-foreground border-b border-border">
          <div className="col-span-1">
            <input
              type="checkbox"
              className="rounded"
              checked={selectedClaims.length === readyClaims.length && readyClaims.length > 0}
              onChange={() => selectedClaims.length === readyClaims.length ? setSelectedClaims([]) : selectAllReady()}
            />
          </div>
          <div className="col-span-1">날짜</div>
          <div className="col-span-2">환자</div>
          <div className="col-span-2">진단코드</div>
          <div className="col-span-2">수가코드</div>
          <div className="col-span-1">청구액</div>
          <div className="col-span-1">위험도</div>
          <div className="col-span-1">상태</div>
          <div className="col-span-1"></div>
        </div>

        <div className="divide-y divide-border">
          {filteredClaims.map((claim) => {
            const st = statusConfig[claim.status]
            const risk = riskConfig[claim.riskLevel]
            const RiskIcon = risk.icon

            return (
              <div key={claim.id}>
                <div
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 p-4 hover:bg-secondary/30 transition-colors items-center cursor-pointer"
                  onClick={() => setExpandedClaim(expandedClaim === claim.id ? null : claim.id)}
                >
                  {/* 모바일 */}
                  <div className="md:hidden space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <RiskIcon className={`w-4 h-4 ${risk.color}`} />
                        <span className="font-semibold text-sm">{claim.patientName}</span>
                        <span className={`text-2xs px-2 py-0.5 rounded-lg ${st.color} ${st.bg}`}>{st.label}</span>
                      </div>
                      <span className="font-bold text-sm">{claim.amount.toLocaleString()}원</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{claim.date} · {claim.dxCodes.join(', ')}</div>
                  </div>

                  {/* 데스크톱 */}
                  <div className="hidden md:flex col-span-1 items-center">
                    {claim.status === 'ready' && (
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selectedClaims.includes(claim.id)}
                        onChange={(e) => {
                          e.stopPropagation()
                          toggleSelect(claim.id)
                        }}
                      />
                    )}
                  </div>
                  <div className="hidden md:block col-span-1 text-xs text-muted-foreground">
                    {new Date(claim.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="hidden md:block col-span-2">
                    <div className="text-sm font-semibold">{claim.patientName}</div>
                    <div className="text-xs text-muted-foreground font-mono">{claim.chartNo}</div>
                  </div>
                  <div className="hidden md:flex col-span-2 gap-1 flex-wrap">
                    {claim.dxCodes.map((code) => (
                      <span key={code} className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-2xs font-mono">{code}</span>
                    ))}
                  </div>
                  <div className="hidden md:flex col-span-2 gap-1 flex-wrap">
                    {claim.txCodes.map((code) => (
                      <span key={code} className="px-1.5 py-0.5 bg-secondary text-muted-foreground rounded text-2xs font-mono">{code}</span>
                    ))}
                  </div>
                  <div className="hidden md:block col-span-1 text-sm font-semibold">
                    {(claim.amount / 10000).toFixed(1)}만
                    {claim.resultAmount !== undefined && claim.resultAmount !== claim.amount && (
                      <div className="text-2xs text-red-500">→ {(claim.resultAmount / 10000).toFixed(1)}만</div>
                    )}
                  </div>
                  <div className="hidden md:flex col-span-1 items-center gap-1">
                    <RiskIcon className={`w-4 h-4 ${risk.color}`} />
                    <span className={`text-xs font-semibold ${risk.color}`}>{risk.label}</span>
                  </div>
                  <div className="hidden md:block col-span-1">
                    <span className={`text-2xs px-2.5 py-1 rounded-lg font-semibold ${st.color} ${st.bg}`}>{st.label}</span>
                  </div>
                  <div className="hidden md:flex col-span-1 justify-end">
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedClaim === claim.id ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* 확장 상세 */}
                {expandedClaim === claim.id && (
                  <div className="px-4 pb-4 animate-fade-in-down">
                    <div className="bg-secondary/30 rounded-xl p-4 space-y-3">
                      {claim.riskReason && (
                        <div className={`flex items-start gap-2 p-3 rounded-lg ${
                          claim.riskLevel === 'high' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-amber-50 dark:bg-amber-900/20'
                        }`}>
                          <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                            claim.riskLevel === 'high' ? 'text-red-500' : 'text-amber-500'
                          }`} />
                          <div>
                            <div className="text-sm font-semibold">AI 삭감 위험 분석</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{claim.riskReason}</div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-xs text-muted-foreground">청구 금액</span>
                          <div className="font-semibold">{claim.amount.toLocaleString()}원</div>
                        </div>
                        {claim.resultAmount !== undefined && (
                          <div>
                            <span className="text-xs text-muted-foreground">인정 금액</span>
                            <div className={`font-semibold ${claim.resultAmount < claim.amount ? 'text-red-500' : 'text-emerald-500'}`}>
                              {claim.resultAmount.toLocaleString()}원
                              {claim.resultAmount < claim.amount && (
                                <span className="text-xs ml-1">(-{(claim.amount - claim.resultAmount).toLocaleString()}원)</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <Link href={`/emr/patients/${claim.id}`} className="btn-outline btn-sm text-xs">
                          <Eye className="w-3 h-3" />
                          차트 보기
                        </Link>
                        {claim.status === 'draft' && (
                          <button className="btn-outline btn-sm text-xs">
                            <Edit3 className="w-3 h-3" />
                            수정
                          </button>
                        )}
                        {claim.status === 'ready' && (
                          <button className="btn-primary btn-sm text-xs">
                            <Send className="w-3 h-3" />
                            전송
                          </button>
                        )}
                        {['rejected', 'partial'].includes(claim.status) && (
                          <button className="btn-primary btn-sm text-xs bg-amber-500 hover:bg-amber-600">
                            <RefreshCw className="w-3 h-3" />
                            이의신청
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {filteredClaims.length === 0 && (
          <div className="p-12 text-center">
            <Receipt className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <div className="font-semibold text-muted-foreground">해당하는 청구 내역이 없습니다</div>
          </div>
        )}
      </div>
    </div>
  )
}
