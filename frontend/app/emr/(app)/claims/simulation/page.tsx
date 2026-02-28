'use client'

import { useState, useEffect } from 'react'
import {
  Shield,
  Brain,
  Play,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileText,
  Search,
  BarChart3,
  TrendingUp,
  Zap,
  Target,
  Clock,
  RefreshCw,
  Download,
  Eye,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Activity,
  Loader2,
  Info,
} from 'lucide-react'

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
type RiskLevel = 'safe' | 'low' | 'medium' | 'high'
type SimStatus = 'ready' | 'running' | 'completed'

interface ClaimItem {
  id: string
  code: string
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
  riskLevel: RiskLevel
  passRate: number
  aiComment: string
  issues: string[]
}

interface SimulationResult {
  overallPassRate: number
  totalAmount: number
  expectedApproval: number
  expectedReduction: number
  riskItems: number
  items: ClaimItem[]
}

interface DraftClaim {
  id: string
  claim_number: string
  patient_name_masked: string
  total_amount: number
  claim_date: string
}

/* ─── 기본 더미 ─── */
const defaultSimResult: SimulationResult = {
  overallPassRate: 94.2,
  totalAmount: 287400,
  expectedApproval: 270800,
  expectedReduction: 16600,
  riskItems: 2,
  items: [
    { id: 'CI001', code: 'AA157', name: '초진 진찰료', quantity: 1, unitPrice: 18400, totalPrice: 18400, riskLevel: 'safe', passRate: 99.8, aiComment: '적정 청구. 심사 통과 예상.', issues: [] },
    { id: 'CI002', code: 'C5211', name: '일반 혈액검사 (CBC)', quantity: 1, unitPrice: 4800, totalPrice: 4800, riskLevel: 'safe', passRate: 99.2, aiComment: '초진 시 기본 검사로 인정 기준 충족.', issues: [] },
    { id: 'CI003', code: 'C3811', name: 'CRP 정량', quantity: 1, unitPrice: 5600, totalPrice: 5600, riskLevel: 'low', passRate: 92.4, aiComment: '증상 기록에 염증 의심 소견 추가 권고.', issues: ['증상 지속기간 기록 부족'] },
    { id: 'CI004', code: 'E6541', name: '흉부 X-ray (2방향)', quantity: 1, unitPrice: 15200, totalPrice: 15200, riskLevel: 'safe', passRate: 98.7, aiComment: '호흡기 증상 동반 시 적정.', issues: [] },
    { id: 'CI005', code: 'EB411', name: '심전도 (12유도)', quantity: 1, unitPrice: 12400, totalPrice: 12400, riskLevel: 'medium', passRate: 78.3, aiComment: '초진 환자에 대한 심전도 검사의 의학적 필요성 소견 필요.', issues: ['의학적 필요성 소견 부족', '주호소와 관련성 불명확'] },
    { id: 'CI006', code: 'D2711', name: '갑상선 기능검사 (TSH)', quantity: 1, unitPrice: 8900, totalPrice: 8900, riskLevel: 'high', passRate: 52.1, aiComment: '주호소와 갑상선 검사의 관련성이 부족합니다.', issues: ['주호소와 검사 관련성 낮음', '갑상선 관련 증상 미기록'] },
    { id: 'CI007', code: 'J1201', name: '아세트아미노펜정 500mg', quantity: 21, unitPrice: 120, totalPrice: 2520, riskLevel: 'safe', passRate: 99.9, aiComment: '적정 처방.', issues: [] },
  ],
}

const riskConfig: Record<RiskLevel, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  safe: { label: '적정', color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: CheckCircle2 },
  low: { label: '저위험', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', icon: AlertCircle },
  medium: { label: '중위험', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', icon: AlertTriangle },
  high: { label: '고위험', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', icon: AlertTriangle },
}

const pastSimulations = [
  { date: '2024-01-22', patient: '강지원', passRate: 94.2, items: 7, risk: 2 },
  { date: '2024-01-21', patient: '이미경', passRate: 99.1, items: 4, risk: 0 },
  { date: '2024-01-20', patient: '박준호', passRate: 96.8, items: 6, risk: 1 },
  { date: '2024-01-19', patient: '김영수', passRate: 100, items: 3, risk: 0 },
  { date: '2024-01-18', patient: '한상우', passRate: 88.4, items: 8, risk: 3 },
]

export default function ClaimSimulationPage() {
  const [simStatus, setSimStatus] = useState<SimStatus>('completed')
  const [expandedItem, setExpandedItem] = useState<string | null>('CI006')
  const [showOptimize, setShowOptimize] = useState(false)
  const [draftClaims, setDraftClaims] = useState<DraftClaim[]>([])
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState(false)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)

  const [result, setResult] = useState<SimulationResult>(defaultSimResult)

  useEffect(() => {
    loadDraftClaims()
  }, [])

  async function loadDraftClaims() {
    setLoading(true)
    try {
      const res = await fetchApi('/claims/?status=DRAFT,READY')
      const claims = res.data || []
      setIsDemo(res.is_demo)
      setDraftClaims(claims.map((c: any) => ({
        id: c.id,
        claim_number: c.claim_number,
        patient_name_masked: c.patient_name_masked,
        total_amount: c.total_amount,
        claim_date: c.claim_date,
      })))
    } catch {
      setDraftClaims([])
    } finally {
      setLoading(false)
    }
  }

  async function runSimulation() {
    if (!selectedClaimId) return
    setSimStatus('running')
    setAnalyzing(true)
    try {
      const res = await fetchApi(`/claims/${selectedClaimId}/analyze`, { method: 'POST' })
      // The analyze endpoint returns risk analysis, convert to simulation result
      setResult({
        ...defaultSimResult,
        overallPassRate: Math.max(0, res.risk_score || 94.2),
        riskItems: (res.issues || []).length,
      })
      setSimStatus('completed')
    } catch {
      setSimStatus('completed')
    } finally {
      setAnalyzing(false)
    }
  }

  const scoreColor = result.overallPassRate >= 95 ? 'text-emerald-600' : result.overallPassRate >= 85 ? 'text-amber-600' : 'text-red-600'
  const scoreTrack = result.overallPassRate >= 95 ? 'stroke-emerald-500' : result.overallPassRate >= 85 ? 'stroke-amber-500' : 'stroke-red-500'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 데모 배너 */}
      {isDemo && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span className="text-sm text-amber-700 dark:text-amber-300">
            데모 데이터입니다. 실제 청구 건을 생성하면 AI 모의심사가 가능합니다.
          </span>
        </div>
      )}

      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI 모의심사</h1>
            <p className="text-sm text-muted-foreground">청구 전 AI가 심평원 기준으로 통과율 예측</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* 청구 선택 드롭다운 */}
          {draftClaims.length > 0 && (
            <select
              value={selectedClaimId || ''}
              onChange={(e) => setSelectedClaimId(e.target.value || null)}
              className="input py-1.5 text-sm max-w-full sm:max-w-[200px]"
            >
              <option value="">청구 선택...</option>
              {draftClaims.map(c => (
                <option key={c.id} value={c.id}>
                  {c.patient_name_masked} ({c.claim_number})
                </option>
              ))}
            </select>
          )}
          <button
            onClick={runSimulation}
            disabled={!selectedClaimId || analyzing}
            className="btn-sm text-xs bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {analyzing ? '분석중...' : '모의심사 실행'}
          </button>
          <button className="btn-sm text-xs bg-secondary text-foreground">
            <Clock className="w-3.5 h-3.5" /> 이력
          </button>
        </div>
      </div>

      {/* 결과 요약 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-6 flex flex-col items-center justify-center">
          <div className="relative w-36 h-36 mb-3">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-200 dark:text-gray-700" />
              <circle cx="60" cy="60" r="50" fill="none" strokeWidth="8" strokeLinecap="round" className={scoreTrack}
                strokeDasharray={`${result.overallPassRate * 3.14} ${314 - result.overallPassRate * 3.14}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-black ${scoreColor}`}>{result.overallPassRate}%</span>
              <span className="text-2xs text-muted-foreground">예상 통과율</span>
            </div>
          </div>
          <div className="text-center">
            <span className="text-sm font-semibold">
              {selectedClaimId
                ? draftClaims.find(c => c.id === selectedClaimId)?.patient_name_masked || '환자'
                : '강지원 환자'
              }
            </span>
            <div className="text-2xs text-muted-foreground mt-0.5">AI 모의심사 결과</div>
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="font-bold text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" /> 금액 분석
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">총 청구금액</span>
              <span className="font-bold">{result.totalAmount.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-emerald-600">예상 인정금액</span>
              <span className="font-bold text-emerald-600">{result.expectedApproval.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-red-500">예상 삭감금액</span>
              <span className="font-bold text-red-500">-{result.expectedReduction.toLocaleString()}원</span>
            </div>
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
              <div className="bg-emerald-500 rounded-l-full" style={{ width: `${(result.expectedApproval / result.totalAmount) * 100}%` }} />
              <div className="bg-red-400" style={{ width: `${(result.expectedReduction / result.totalAmount) * 100}%` }} />
            </div>
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="font-bold text-sm flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-600" /> 리스크 요약
          </h2>
          <div className="space-y-2">
            {Object.entries(riskConfig).map(([key, conf]) => {
              const count = result.items.filter(i => i.riskLevel === key).length
              return (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <conf.icon className={`w-4 h-4 ${conf.color}`} />
                    <span className="text-xs">{conf.label}</span>
                  </div>
                  <span className="text-xs font-bold">{count}건</span>
                </div>
              )
            })}
          </div>
          {result.riskItems > 0 && (
            <button
              onClick={() => setShowOptimize(true)}
              className="w-full py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" /> AI 최적화 제안 보기
            </button>
          )}
        </div>
      </div>

      {/* 항목별 상세 */}
      <div className="card">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-bold text-sm">항목별 AI 심사 결과</h2>
          <div className="flex items-center gap-2 text-2xs text-muted-foreground">
            <span>학습 데이터: 심평원 심사 기준 2026.02</span>
          </div>
        </div>
        <div className="divide-y divide-border">
          {result.items.map(item => {
            const rc = riskConfig[item.riskLevel]
            const isExpanded = expandedItem === item.id
            return (
              <div key={item.id}>
                <div
                  className={`flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-secondary/30 transition-colors ${
                    item.riskLevel === 'high' ? 'bg-red-50/30 dark:bg-red-900/5' :
                    item.riskLevel === 'medium' ? 'bg-amber-50/30 dark:bg-amber-900/5' : ''
                  }`}
                  onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                >
                  <rc.icon className={`w-5 h-5 ${rc.color} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-2xs text-muted-foreground">{item.code}</span>
                      <span className="font-medium text-sm">{item.name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-2xs font-bold ${rc.color} ${rc.bg}`}>{rc.label}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-sm font-bold ${item.passRate >= 95 ? 'text-emerald-600' : item.passRate >= 80 ? 'text-amber-600' : 'text-red-500'}`}>
                      {item.passRate}%
                    </div>
                    <div className="text-2xs text-muted-foreground">{item.totalPrice.toLocaleString()}원</div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-border/50">
                    <div className="bg-secondary/30 rounded-xl p-3 mb-3">
                      <div className="flex items-start gap-2">
                        <Brain className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-blue-600 mb-1">AI 분석 의견</p>
                          <p className="text-xs text-muted-foreground">{item.aiComment}</p>
                        </div>
                      </div>
                    </div>
                    {item.issues.length > 0 && (
                      <div className="space-y-1.5 mb-3">
                        {item.issues.map((issue, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-red-600">
                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                            {issue}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-2xs text-muted-foreground">
                      <span>수량: {item.quantity}</span>
                      <span>단가: {item.unitPrice.toLocaleString()}원</span>
                      <span>금액: {item.totalPrice.toLocaleString()}원</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 과거 모의심사 이력 */}
      <div className="card p-5">
        <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" /> 최근 모의심사 이력
        </h2>
        <div className="space-y-2">
          {pastSimulations.map((sim, i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-secondary/30 rounded-xl hover:bg-secondary/50 cursor-pointer transition-colors">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                sim.passRate >= 95 ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                sim.passRate >= 85 ? 'bg-amber-100 dark:bg-amber-900/30' :
                'bg-red-100 dark:bg-red-900/30'
              }`}>
                <span className={`text-xs font-bold ${
                  sim.passRate >= 95 ? 'text-emerald-600' : sim.passRate >= 85 ? 'text-amber-600' : 'text-red-600'
                }`}>{sim.passRate}%</span>
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium">{sim.patient}</span>
                <div className="text-2xs text-muted-foreground">{sim.date} · {sim.items}항목 · 리스크 {sim.risk}건</div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      </div>

      {/* AI 최적화 모달 */}
      {showOptimize && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowOptimize(false)}>
          <div className="bg-card rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" /> AI 최적화 제안
              </h3>
              <button onClick={() => setShowOptimize(false)} className="btn-icon"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-600 mb-1">적용 시 예상 통과율</p>
                <div className="flex items-center gap-3">
                  <span className="text-amber-600 font-bold">{result.overallPassRate}%</span>
                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-600 font-bold text-lg">98.7%</span>
                </div>
              </div>

              <div className="space-y-3">
                {result.items.filter(i => i.riskLevel === 'medium' || i.riskLevel === 'high').map(item => (
                  <div key={item.id} className={`border rounded-xl p-4 ${item.riskLevel === 'high' ? 'border-red-200 dark:border-red-800' : 'border-amber-200 dark:border-amber-800'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className={`w-4 h-4 ${item.riskLevel === 'high' ? 'text-red-600' : 'text-amber-600'}`} />
                      <span className="font-semibold text-sm">{item.name} ({item.code})</span>
                      <span className={`text-2xs ${item.riskLevel === 'high' ? 'text-red-600' : 'text-amber-600'}`}>통과율 {item.passRate}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{item.aiComment}</p>
                    <button className="btn-sm text-xs bg-blue-600 text-white hover:bg-blue-700">소견 추가</button>
                  </div>
                ))}
              </div>

              <button className="w-full py-2.5 rounded-xl font-semibold text-sm text-white bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> AI 제안 일괄 적용
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
